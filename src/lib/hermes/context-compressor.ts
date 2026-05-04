// ============================================================
// Hermes Agent V2 — Context Compression
// Lossy summarization for long conversations
// Track token usage, compress older messages via LLM
// Save compression snapshots to HermesContextSnapshot
// ============================================================

import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

// ── Types ───────────────────────────────────────────────────

export interface CompressionSnapshot {
  id: string
  conversationId: string
  turnNumber: number
  originalTokens: number
  compressedTokens: number
  summary: string
  createdAt: Date
}

export interface CompressionResult {
  compressed: boolean
  snapshotId?: string
  originalTokens: number
  compressedTokens: number
  summary?: string
}

// ── Token Estimation ────────────────────────────────────────

/** Estimate token count (rough: ~4 chars per token for English, ~2 for Malay) */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.5)
}

// ── Core Compression ────────────────────────────────────────

/**
 * Check if a conversation exceeds the threshold and compress if needed.
 * Compresses older messages into a summary snapshot.
 */
export async function compressIfNeeded(
  conversationId: string,
  messages: { role: string; content: string; tokensUsed?: number }[],
  threshold: number = 4000
): Promise<CompressionResult> {
  // Calculate total tokens
  const totalTokens = messages.reduce((sum, m) => {
    return sum + (m.tokensUsed || estimateTokens(m.content))
  }, 0)

  if (totalTokens <= threshold) {
    return { compressed: false, originalTokens: totalTokens, compressedTokens: totalTokens }
  }

  // Find the latest snapshot to avoid re-compressing
  const latestSnapshot = await db.hermesContextSnapshot.findFirst({
    where: { conversationId, isActive: true },
    orderBy: { turnNumber: 'desc' },
  })

  const alreadyCompressedTurns = latestSnapshot?.turnNumber ?? 0

  // Only compress messages older than the last snapshot
  const olderMessages = messages.slice(0, alreadyCompressedTurns + Math.floor(messages.length * 0.5))
  const recentMessages = messages.slice(olderMessages.length)

  if (olderMessages.length < 2) {
    return { compressed: false, originalTokens: totalTokens, compressedTokens: totalTokens }
  }

  // Build text to compress
  const textToCompress = olderMessages
    .map(m => `[${m.role}]: ${m.content}`)
    .join('\n\n')

  const olderTokenCount = olderMessages.reduce((sum, m) => {
    return sum + (m.tokensUsed || estimateTokens(m.content))
  }, 0)

  try {
    // Use Z-AI SDK for summarization
    const zai = await ZAI.create()
    const response = await zai.chat.completions.create({
      model: 'default',
      messages: [
        {
          role: 'system',
          content: 'You are a context compression assistant. Summarize the following conversation messages into a concise but information-dense summary. Preserve all key facts, decisions, user preferences, and action items. Do not lose any important context. Output only the summary.',
        },
        {
          role: 'user',
          content: textToCompress.slice(0, 12000), // Limit input size
        },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    })

    const summary = response.choices?.[0]?.message?.content || 'Compression failed — no summary generated.'
    const compressedTokens = estimateTokens(summary)

    // Save snapshot
    const snapshot = await db.hermesContextSnapshot.create({
      data: {
        conversationId,
        turnNumber: messages.length,
        originalTokens: olderTokenCount,
        compressedTokens,
        summary,
      },
    })

    return {
      compressed: true,
      snapshotId: snapshot.id,
      originalTokens: totalTokens,
      compressedTokens: compressedTokens + recentMessages.reduce((s, m) => s + (m.tokensUsed || estimateTokens(m.content)), 0),
      summary,
    }
  } catch (error: any) {
    // Fallback: simple truncation-based compression
    const truncatedSummary = olderMessages
      .slice(-5)
      .map(m => `[${m.role}]: ${m.content.slice(0, 200)}`)
      .join('\n')

    const compressedTokens = estimateTokens(truncatedSummary)

    const snapshot = await db.hermesContextSnapshot.create({
      data: {
        conversationId,
        turnNumber: messages.length,
        originalTokens: olderTokenCount,
        compressedTokens,
        summary: truncatedSummary,
      },
    })

    return {
      compressed: true,
      snapshotId: snapshot.id,
      originalTokens: totalTokens,
      compressedTokens: compressedTokens + recentMessages.reduce((s, m) => s + (m.tokensUsed || estimateTokens(m.content)), 0),
      summary: truncatedSummary,
    }
  }
}

// ── Compression History ─────────────────────────────────────

/** Get the compression history for a conversation */
export async function getCompressionHistory(conversationId: string): Promise<CompressionSnapshot[]> {
  const snapshots = await db.hermesContextSnapshot.findMany({
    where: { conversationId, isActive: true },
    orderBy: { turnNumber: 'asc' },
  })

  return snapshots.map(s => ({
    id: s.id,
    conversationId: s.conversationId,
    turnNumber: s.turnNumber,
    originalTokens: s.originalTokens,
    compressedTokens: s.compressedTokens,
    summary: s.summary,
    createdAt: s.createdAt,
  }))
}

// ── Build Compressed Context ────────────────────────────────

/** Build the full context for a conversation, including compressed summaries */
export async function buildCompressedContext(conversationId: string): Promise<{
  compressedSummary: string
  recentMessages: { role: string; content: string; tokensUsed: number; createdAt: Date }[]
  totalSnapshots: number
}> {
  // Get latest snapshot
  const latestSnapshot = await db.hermesContextSnapshot.findFirst({
    where: { conversationId, isActive: true },
    orderBy: { turnNumber: 'desc' },
  })

  // Get all snapshots for full compressed history
  const allSnapshots = await db.hermesContextSnapshot.findMany({
    where: { conversationId, isActive: true },
    orderBy: { turnNumber: 'asc' },
  })

  const compressedSummary = allSnapshots
    .map(s => `[Compressed context (turns up to ${s.turnNumber}, ${s.compressedTokens} tokens)]:\n${s.summary}`)
    .join('\n\n---\n\n')

  // Get recent messages (after the last compressed turn)
  const skipCount = latestSnapshot?.turnNumber ?? 0
  const recentMessages = await db.hermesMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    skip: skipCount,
    take: 50,
    select: {
      role: true,
      content: true,
      tokensUsed: true,
      createdAt: true,
    },
  })

  return {
    compressedSummary,
    recentMessages,
    totalSnapshots: allSnapshots.length,
  }
}
