import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { buildHermesSystemPrompt } from '@/lib/hermes/prompt'
import { parseToolCalls, parseActionCalls, cleanToolTags, executeToolCall, executeToolChain } from '@/lib/hermes/tools'
import { detectLocale } from '@/lib/hermes/lang-detect'
import { callLLM, streamLLM, getProviderConfig } from '@/lib/hermes/providers'
import type { ProviderId } from '@/lib/hermes/providers'
import { buildEnhancedMemoryContext, extractAndStoreMemories } from '@/lib/hermes/memory'
import { findMatchingSkills, buildEnhancedSkillsContext, recordSkillUsage } from '@/lib/hermes/skills'
import { db } from '@/lib/db'
import type { HermesChatRequest } from '@/lib/hermes/types'
import type { ToolExecutionContext, HermesClientAction } from '@/lib/hermes/types'

export const runtime = 'nodejs'

// ============================================================
// Main Chat Endpoint — Enhanced with multi-step tool execution
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const userId = session.user.id
    const userRole = session.user.role

    const body: HermesChatRequest = await request.json()
    const { messages, currentView, locale: requestLocale, stream } = body

    if (!messages || messages.length === 0) {
      return NextResponse.json({ success: false, error: 'Mesej diperlukan' }, { status: 400 })
    }

    // Detect language
    const lastUserMsg = messages.filter(m => m.role === 'user').pop()
    const locale = requestLocale || (lastUserMsg ? detectLocale(lastUserMsg.content) : 'ms')

    // Get provider config
    const providerConfig = await getProviderConfig(userId)

    // If streaming requested, use SSE
    if (stream && (providerConfig.provider === 'openrouter' || providerConfig.provider === 'ollama')) {
      return handleStreamingChat({
        messages, currentView, userRole, locale, userId, providerConfig,
      })
    }

    // Build execution context
    const toolContext: ToolExecutionContext = { userId, userRole, currentView }

    // Gather context data for prompt
    const pendingCasesCount = await db.case.count({ where: { status: { in: ['submitted', 'verifying', 'verified', 'scoring'] } } }).catch(() => 0)
    const unreadNotifications = await db.notification.count({ where: { userId, isRead: false } }).catch(() => 0)

    // Build enhanced system prompt
    const systemPrompt = buildHermesSystemPrompt({
      currentView,
      userRole,
      locale,
      pendingCasesCount,
      unreadNotifications,
    })

    // Build memory and skills context
    const memoryContext = await buildEnhancedMemoryContext(userId, lastUserMsg?.content)
    const skillsContext = await buildEnhancedSkillsContext(userId, lastUserMsg?.content)

    // Find matching skills
    const matchingSkills = lastUserMsg ? await findMatchingSkills(lastUserMsg.content, userId) : []

    // Build the full system message
    const fullSystemMessage = `${systemPrompt}

${memoryContext ? `\n${memoryContext}\n` : ''}
${skillsContext ? `\n${skillsContext}\n` : ''}

## Tool Call Instructions
When you need to access data or perform actions, use tools by embedding them in your response:
<<TOOL:tool_name>>{"param":"value"}<</TOOL>>

You can make MULTIPLE tool calls in one response. For client actions:
<<ACTION:navigate>>{"viewId":"members"}<</ACTION>>

IMPORTANT: 
- Use tools whenever users ask about numbers, statistics, or data
- You can call multiple tools in a single response for comprehensive answers
- After getting tool results, provide a clear, formatted answer
- If you don't need a tool, just respond normally without any <<TOOL>> tags`

    const allMessages = [
      { role: 'system' as const, content: fullSystemMessage },
      ...messages.map(m => ({
        role: m.role === 'user' ? 'user' as const : 'assistant' as const,
        content: m.content,
      })),
    ]

    // Call LLM
    const startTime = Date.now()
    const result = await callLLM({
      provider: providerConfig.provider,
      messages: allMessages,
      model: providerConfig.model,
      apiKey: providerConfig.apiKey,
      baseUrl: providerConfig.baseUrl,
      useFunctionCalling: providerConfig.provider === 'openrouter', // Use native function calling for OpenRouter
    })

    let assistantContent = result.content || 'Maaf, saya tidak dapat memproses permintaan anda.'
    let clientActions: HermesClientAction[] = []

    // Handle native function calling tool results (from OpenRouter)
    if (result.toolCalls && result.toolCalls.length > 0) {
      const toolResults: { name: string; result: unknown }[] = []
      for (const tc of result.toolCalls) {
        const toolResult = await executeToolCall(tc.name, tc.arguments, toolContext)
        toolResults.push({ name: tc.name, result: toolResult })
        if (toolResult.success && toolResult.clientAction) {
          clientActions.push(toolResult.clientAction)
        }
      }

      // Ask LLM to format the response with tool results
      const formatMessages = [
        { role: 'system' as const, content: fullSystemMessage },
        { role: 'user' as const, content: lastUserMsg?.content || '' },
        { role: 'assistant' as const, content: `I called tools and got results:\n\n${toolResults.map(r => `**${r.name}**: ${JSON.stringify(r.result, null, 2)}`).join('\n\n')}\n\nPlease format a helpful response based on this data. Respond in ${locale === 'ms' ? 'Bahasa Melayu' : 'English'}.` },
      ]

      const formatResult = await callLLM({
        provider: providerConfig.provider,
        messages: formatMessages,
        model: providerConfig.model,
        apiKey: providerConfig.apiKey,
        baseUrl: providerConfig.baseUrl,
      })
      assistantContent = formatResult.content || assistantContent
    } else {
      // Parse embedded <<TOOL:>> calls from text
      const toolCalls = parseToolCalls(assistantContent)
      const actionCalls = parseActionCalls(assistantContent)

      if (toolCalls.length > 0) {
        // Execute tool chain (supports multiple tools)
        const chainResult = await executeToolChain(toolCalls, toolContext)

        // Collect client actions from tool results
        clientActions = chainResult.clientActions

        // Parse action calls too
        for (const ac of actionCalls) {
          if (ac.actionType === 'navigate') {
            clientActions.push({ type: 'navigate', viewId: ac.args.viewId as string })
          } else if (ac.actionType === 'create') {
            clientActions.push({ type: 'create', module: ac.args.module as string, prefill: ac.args.prefill as Record<string, unknown> })
          }
        }

        // Format response with tool results
        const toolResultSummary = chainResult.allResults.map((r, i) => {
          const name = toolCalls[i]?.toolName || 'unknown'
          return `**${name}**: ${JSON.stringify(r.data || r.error, null, 2)}`
        }).join('\n\n')

        const formatMessages = [
          { role: 'system' as const, content: fullSystemMessage },
          { role: 'user' as const, content: lastUserMsg?.content || '' },
          { role: 'assistant' as const, content: `I called ${chainResult.steps.length} tool(s) and got results:\n\n${toolResultSummary}\n\nPlease format a helpful, concise response based on this data. Respond in ${locale === 'ms' ? 'Bahasa Melayu' : 'English'}.` },
        ]

        const formatResult = await callLLM({
          provider: providerConfig.provider,
          messages: formatMessages,
          model: providerConfig.model,
          apiKey: providerConfig.apiKey,
          baseUrl: providerConfig.baseUrl,
        })
        assistantContent = formatResult.content || cleanToolTags(assistantContent)

        // Record skill usage for matched skills
        if (matchingSkills.length > 0) {
          for (const skill of matchingSkills) {
            await recordSkillUsage(skill.id, chainResult.success).catch(() => {})
          }
        }
      } else {
        // Clean any stray tags
        assistantContent = cleanToolTags(assistantContent)

        // Process action calls even without tool calls
        for (const ac of actionCalls) {
          if (ac.actionType === 'navigate') {
            clientActions.push({ type: 'navigate', viewId: ac.args.viewId as string })
          }
        }
      }
    }

    // Extract and store memories (non-blocking)
    if (lastUserMsg) {
      extractAndStoreMemories({
        userId,
        userMessage: lastUserMsg.content,
        assistantMessage: assistantContent,
        provider: providerConfig.provider,
        model: providerConfig.model,
      }).catch(() => {})

      // Save conversation to DB (non-blocking)
      saveConversationTurn(userId, {
        currentView: currentView || 'dashboard',
        provider: providerConfig.provider,
        model: providerConfig.model,
        userMessage: lastUserMsg.content,
        assistantMessage: assistantContent,
        toolCallsMade: parseToolCalls(result.content).map(tc => tc.toolName),
        latencyMs: Date.now() - startTime,
      }).catch(() => {})
    }

    return NextResponse.json({
      success: true,
      data: {
        message: {
          role: 'assistant',
          content: assistantContent,
        },
        clientAction: clientActions[0] || undefined,
        clientActions: clientActions.length > 1 ? clientActions : undefined,
        provider: providerConfig.provider,
        model: result.model,
        latencyMs: Date.now() - startTime,
      },
    })
  } catch (error: any) {
    console.error('PUSPA AI chat error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'PUSPA AI mengalami masalah teknikal' },
      { status: 500 },
    )
  }
}

// ============================================================
// Streaming handler (SSE) — Enhanced
// ============================================================
async function handleStreamingChat(params: {
  messages: HermesChatRequest['messages']
  currentView: string
  userRole: string
  locale: 'ms' | 'en'
  userId: string
  providerConfig: { provider: ProviderId; model: string; apiKey?: string; baseUrl?: string }
}): Promise<NextResponse> {
  const { messages, currentView, userRole, locale, userId, providerConfig } = params
  const toolContext: ToolExecutionContext = { userId, userRole, currentView }

  const systemPrompt = buildHermesSystemPrompt({ currentView, userRole, locale })
  const memoryContext = await buildEnhancedMemoryContext(userId)
  const skillsContext = await buildEnhancedSkillsContext(userId)

  const fullSystemMessage = `${systemPrompt}

${memoryContext ? `\n${memoryContext}\n` : ''}
${skillsContext ? `\n${skillsContext}\n` : ''}

## Tool Call Instructions
When you need data, respond with tool calls: <<TOOL:tool_name>>{"param":"value"}<</TOOL>>
For navigation: <<ACTION:navigate>>{"viewId":"members"}<</ACTION>>

IMPORTANT: Use tools for data queries. Multiple tools allowed per response.`

  const allMessages = [
    { role: 'system' as const, content: fullSystemMessage },
    ...messages.map(m => ({
      role: m.role === 'user' ? 'user' as const : 'assistant' as const,
      content: m.content,
    })),
  ]

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        await streamLLM({
          provider: providerConfig.provider,
          messages: allMessages,
          model: providerConfig.model,
          apiKey: providerConfig.apiKey,
          baseUrl: providerConfig.baseUrl,
          onChunk: (chunk) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
          },
        })

        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      } catch (error: any) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', content: error?.message || 'Stream error' })}\n\n`))
        controller.close()
      }
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}

// ============================================================
// Helper: Save conversation turn to DB
// ============================================================
async function saveConversationTurn(userId: string, data: {
  currentView: string
  provider: string
  model: string
  userMessage: string
  assistantMessage: string
  toolCallsMade?: string[]
  latencyMs: number
}) {
  // Find or create conversation
  let conversation = await db.hermesConversation.findFirst({
    where: { userId, updatedAt: { gte: new Date(Date.now() - 3600000) } },
    orderBy: { updatedAt: 'desc' },
  })

  if (!conversation) {
    const title = data.userMessage.slice(0, 50) + (data.userMessage.length > 50 ? '...' : '')
    conversation = await db.hermesConversation.create({
      data: {
        userId,
        title,
        viewContext: data.currentView,
        provider: data.provider as string,
        model: data.model,
      },
    })
  }

  // Save user message
  await db.hermesMessage.create({
    data: {
      conversationId: conversation.id,
      role: 'user',
      content: data.userMessage,
    },
  })

  // Save assistant message
  await db.hermesMessage.create({
    data: {
      conversationId: conversation.id,
      role: 'assistant',
      content: data.assistantMessage,
      toolCalls: data.toolCallsMade && data.toolCallsMade.length > 0 ? JSON.stringify(data.toolCallsMade.map(name => ({ name }))) : null,
      provider: data.provider,
      model: data.model,
      latencyMs: data.latencyMs,
    },
  })

  // Update conversation
  await db.hermesConversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  })
}
