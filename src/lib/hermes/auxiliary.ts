// ============================================================
// Hermes Agent V2 — Auxiliary Model Router
// Route side tasks to cheaper/different models
// Tasks: vision, compression, curator, summarization
// ============================================================

import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

// ── Types ───────────────────────────────────────────────────

export type AuxiliaryTask = 'vision' | 'compression' | 'curator' | 'summarization'

export interface AuxiliaryTaskDefinition {
  id: AuxiliaryTask
  name: string
  description: string
  defaultModel: string
  defaultMaxTokens: number
  defaultTemperature: number
}

export interface AuxiliaryConfig {
  id: string
  userId: string
  vision: string | null
  compression: string | null
  curator: string | null
  summarization: string | null
  createdAt: Date
  updatedAt: Date
}

export interface AuxiliaryCallOptions {
  maxTokens?: number
  temperature?: number
  systemPrompt?: string
}

export interface AuxiliaryCallResult {
  success: boolean
  content: string
  tokensUsed: number
  model: string
  provider: string
  latencyMs: number
}

// ── Task Definitions ────────────────────────────────────────

export const AUXILIARY_TASKS: AuxiliaryTaskDefinition[] = [
  {
    id: 'vision',
    name: 'Vision Analysis',
    description: 'Image and visual content analysis',
    defaultModel: 'default',
    defaultMaxTokens: 1000,
    defaultTemperature: 0.3,
  },
  {
    id: 'compression',
    name: 'Context Compression',
    description: 'Summarize and compress long conversations',
    defaultModel: 'default',
    defaultMaxTokens: 1500,
    defaultTemperature: 0.2,
  },
  {
    id: 'curator',
    name: 'Skill Curator',
    description: 'Review, consolidate, and patch skills',
    defaultModel: 'default',
    defaultMaxTokens: 2000,
    defaultTemperature: 0.4,
  },
  {
    id: 'summarization',
    name: 'Summarization',
    description: 'General-purpose text summarization',
    defaultModel: 'default',
    defaultMaxTokens: 1000,
    defaultTemperature: 0.3,
  },
]

// ── Config Management ───────────────────────────────────────

/** Get auxiliary model configuration for a user */
export async function getAuxiliaryConfig(userId: string): Promise<AuxiliaryConfig> {
  let config = await db.hermesAuxiliaryConfig.findUnique({
    where: { userId },
  })

  if (!config) {
    // Create default config with all tasks pointing to default model
    const defaultTaskJson = (model: string) => JSON.stringify({ provider: 'zai', model })

    config = await db.hermesAuxiliaryConfig.create({
      data: {
        userId,
        vision: defaultTaskJson('default'),
        compression: defaultTaskJson('default'),
        curator: defaultTaskJson('default'),
        summarization: defaultTaskJson('default'),
      },
    })
  }

  return {
    id: config.id,
    userId: config.userId,
    vision: config.vision,
    compression: config.compression,
    curator: config.curator,
    summarization: config.summarization,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  }
}

/** Set routing for a specific auxiliary task */
export async function setAuxiliaryTask(
  userId: string,
  task: AuxiliaryTask,
  provider: string,
  model: string
): Promise<AuxiliaryConfig> {
  const config = await getAuxiliaryConfig(userId)
  const taskJson = JSON.stringify({ provider, model })

  const updated = await db.hermesAuxiliaryConfig.upsert({
    where: { userId },
    create: {
      userId,
      vision: task === 'vision' ? taskJson : config.vision,
      compression: task === 'compression' ? taskJson : config.compression,
      curator: task === 'curator' ? taskJson : config.curator,
      summarization: task === 'summarization' ? taskJson : config.summarization,
    },
    update: {
      [task]: taskJson,
      updatedAt: new Date(),
    },
  })

  return {
    id: updated.id,
    userId: updated.userId,
    vision: updated.vision,
    compression: updated.compression,
    curator: updated.curator,
    summarization: updated.summarization,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  }
}

// ── Call Auxiliary Model ────────────────────────────────────

/** Call an auxiliary model for a specific task */
export async function callAuxiliary(
  userId: string,
  task: AuxiliaryTask,
  prompt: string,
  options: AuxiliaryCallOptions = {}
): Promise<AuxiliaryCallResult> {
  const taskDef = AUXILIARY_TASKS.find(t => t.id === task)
  if (!taskDef) {
    return {
      success: false,
      content: `Unknown auxiliary task: ${task}`,
      tokensUsed: 0,
      model: 'unknown',
      provider: 'unknown',
      latencyMs: 0,
    }
  }

  const startTime = Date.now()

  // Get user's routing config
  let routing: { provider: string; model: string } = { provider: 'zai', model: taskDef.defaultModel }
  try {
    const config = await getAuxiliaryConfig(userId)
    const taskConfig = config[task]
    if (taskConfig) routing = JSON.parse(taskConfig) as { provider: string; model: string }
  } catch { /* use defaults */ }

  const systemPrompt = options.systemPrompt ||
    getDefaultSystemPrompt(task)

  const maxTokens = options.maxTokens || taskDef.defaultMaxTokens
  const temperature = options.temperature ?? taskDef.defaultTemperature

  try {
    const zai = await ZAI.create()
    const response = await zai.chat.completions.create({
      model: routing.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: maxTokens,
      temperature,
    })

    const content = response.choices?.[0]?.message?.content || ''
    const tokensUsed = response.usage?.total_tokens || 0
    const latencyMs = Date.now() - startTime

    return {
      success: true,
      content,
      tokensUsed,
      model: routing.model,
      provider: routing.provider,
      latencyMs,
    }
  } catch (error: any) {
    const latencyMs = Date.now() - startTime
    return {
      success: false,
      content: error?.message || 'Auxiliary call failed',
      tokensUsed: 0,
      model: routing.model,
      provider: routing.provider,
      latencyMs,
    }
  }
}

// ── Default System Prompts ──────────────────────────────────

function getDefaultSystemPrompt(task: AuxiliaryTask): string {
  switch (task) {
    case 'vision':
      return 'You are a vision analysis assistant. Describe and analyze images in detail. Extract text, identify objects, and describe scenes.'
    case 'compression':
      return 'You are a context compression assistant. Summarize the following content concisely while preserving all key information, decisions, and facts. Output only the compressed summary.'
    case 'curator':
      return 'You are a skill curator for an AI agent. Review the provided skills and suggest consolidations, improvements, or patches. Identify duplicate or overlapping skills.'
    case 'summarization':
      return 'You are a summarization assistant. Provide clear, concise summaries of the given content. Preserve key facts and actionable items.'
    default:
      return 'You are a helpful assistant.'
  }
}
