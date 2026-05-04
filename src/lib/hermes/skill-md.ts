// ============================================================
// Hermes Agent V2 — SKILL.md Parser/Writer
// Compatible with agentskills.io SKILL.md format
// Parse and generate SKILL.md frontmatter + body documents
// ============================================================

/** Configuration entry inside metadata */
export interface SkillConfigEntry {
  key: string
  description: string
  default?: string
}

/** Hermes-specific metadata in SKILL.md frontmatter */
export interface SkillHermesMetadata {
  tags?: string[]
  category?: string
  fallback_for_toolsets?: string[]
  requires_toolsets?: string[]
  config?: SkillConfigEntry[]
}

/** SKILL.md frontmatter fields */
export interface SkillMdFrontmatter {
  [key: string]: unknown
  name: string
  description: string
  version?: string
  platforms?: string[]
  metadata?: {
    hermes?: SkillHermesMetadata
    [key: string]: unknown
  }
}

/** SKILL.md body section */
export interface SkillMdBody {
  title?: string
  whenToUse?: string
  procedure?: string
  pitfalls?: string
  verification?: string
  customSections?: Record<string, string>
}

/** Complete SKILL.md data structure */
export interface SkillMdData {
  frontmatter: SkillMdFrontmatter
  body: SkillMdBody
  raw?: string
}

// ── Parser ──────────────────────────────────────────────────

/**
 * Parse a SKILL.md document into structured data.
 *
 * Expected format:
 * ---
 * name: my-skill
 * description: What it does
 * version: 1.0.0
 * platforms: [macos, linux]
 * metadata:
 *   hermes:
 *     tags: [python, automation]
 *     category: devops
 *     fallback_for_toolsets: [web]
 *     requires_toolsets: [terminal]
 *     config:
 *       - key: my.setting
 *         description: "What this controls"
 *         default: "value"
 * ---
 * # Skill Title
 * ## When to Use
 * ...
 * ## Procedure
 * ...
 * ## Pitfalls
 * ...
 * ## Verification
 * ...
 */
export function parseSkillMd(content: string): SkillMdData {
  const trimmed = content.trim()

  // Extract frontmatter
  const fmMatch = trimmed.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!fmMatch) {
    // No frontmatter — treat entire content as body
    return {
      frontmatter: { name: '', description: '' },
      body: parseBody(trimmed),
      raw: content,
    }
  }

  const fmRaw = fmMatch[1]
  const bodyRaw = trimmed.slice(fmMatch[0].length).trim()

  const frontmatter = parseFrontmatter(fmRaw)
  const body = parseBody(bodyRaw)

  return { frontmatter, body, raw: content }
}

/** Parse YAML-like frontmatter (lightweight — no YAML library needed) */
function parseFrontmatter(raw: string): SkillMdFrontmatter {
  const fm: SkillMdFrontmatter = { name: '', description: '' }

  const lines = raw.split(/\r?\n/)
  let currentPath: string[] = []
  let listBuffer: string[] | null = null
  let configBuffer: SkillConfigEntry[] | null = null
  let currentConfigEntry: Partial<SkillConfigEntry> | null = null

  const flushConfigEntry = () => {
    if (currentConfigEntry && currentConfigEntry.key) {
      configBuffer!.push({
        key: currentConfigEntry.key,
        description: currentConfigEntry.description || '',
        default: currentConfigEntry.default,
      })
    }
    currentConfigEntry = null
  }

  for (const line of lines) {
    const indent = line.search(/\S/)
    const content = line.trim()

    if (!content || content.startsWith('#')) continue

    // Track indentation for nested structure
    if (indent === 0) {
      // Flush any in-progress list/config at top level
      if (listBuffer !== null) {
        setNestedValue(fm, currentPath, listBuffer)
        listBuffer = null
      }
      if (configBuffer !== null) {
        flushConfigEntry()
        setNestedValue(fm, currentPath, configBuffer)
        configBuffer = null
      }
      currentPath = []
    }

    // Parse key: value
    const kvMatch = content.match(/^(\w[\w_-]*):\s*(.*)/)
    if (kvMatch) {
      const [, key, val] = kvMatch

      if (indent === 0) {
        currentPath = [key]
      } else if (indent >= 2) {
        // Nested key
        if (currentPath.length === 1) currentPath = [currentPath[0], key]
        else if (currentPath.length === 2) currentPath = [currentPath[0], currentPath[1], key]
      }

      // Handle inline value
      if (val) {
        const parsed = parseInlineValue(val)

        if (key === 'config' && indent >= 4) {
          // Config is an array of objects — skip, handled by - entries
          if (!configBuffer) configBuffer = []
          flushConfigEntry()
          continue
        }

        setNestedValue(fm, currentPath, parsed)
        currentPath = currentPath.slice(0, -1) // pop after setting
      }
      continue
    }

    // Parse list item: - value
    const listMatch = content.match(/^-\s+(.*)/)
    if (listMatch) {
      const val = listMatch[1]

      // Check if it's a config object entry: - key: my.setting
      const configKeyMatch = val.match(/^key:\s*(.*)/)
      if (configKeyMatch && currentPath.includes('config')) {
        if (!configBuffer) configBuffer = []
        flushConfigEntry()
        currentConfigEntry = { key: configKeyMatch[1].replace(/^["']|["']$/g, '') }
        continue
      }

      const descMatch = val.match(/^description:\s*(.*)/)
      if (descMatch && currentConfigEntry) {
        currentConfigEntry.description = descMatch[1].replace(/^["']|["']$/g, '')
        continue
      }

      const defaultMatch = val.match(/^default:\s*(.*)/)
      if (defaultMatch && currentConfigEntry) {
        currentConfigEntry.default = defaultMatch[1].replace(/^["']|["']$/g, '')
        continue
      }

      // Regular list item
      if (!listBuffer) listBuffer = []
      listBuffer.push(val.replace(/^["']|["']$/g, ''))
      continue
    }
  }

  // Flush remaining
  if (listBuffer !== null) {
    setNestedValue(fm, currentPath, listBuffer)
  }
  if (configBuffer !== null) {
    flushConfigEntry()
    setNestedValue(fm, currentPath.length ? currentPath : ['metadata', 'hermes', 'config'], configBuffer)
  }

  return fm
}

/** Parse an inline YAML value (strings, numbers, booleans, arrays) */
function parseInlineValue(val: string): unknown {
  const trimmed = val.trim()

  // Array: [item1, item2]
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const inner = trimmed.slice(1, -1)
    return inner.split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean)
  }

  // Boolean
  if (trimmed === 'true') return true
  if (trimmed === 'false') return false

  // Number
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed)

  // Quoted string
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1)
  }

  // Plain string
  return trimmed
}

/** Set a value at a nested path in an object */
function setNestedValue(obj: Record<string, unknown>, path: string[], value: unknown): void {
  if (path.length === 0) return

  let current: Record<string, unknown> = obj
  for (let i = 0; i < path.length - 1; i++) {
    if (!current[path[i]] || typeof current[path[i]] !== 'object') {
      current[path[i]] = {}
    }
    current = current[path[i]] as Record<string, unknown>
  }
  current[path[path.length - 1]] = value
}

/** Parse the markdown body into sections */
function parseBody(raw: string): SkillMdBody {
  const body: SkillMdBody = {}
  const customSections: Record<string, string> = {}

  const sectionRegex = /^##\s+(.+)$/gm
  const matches: { title: string; start: number }[] = []

  let match: RegExpExecArray | null
  while ((match = sectionRegex.exec(raw)) !== null) {
    matches.push({ title: match[1].trim(), start: match.index + match[0].length })
  }

  if (matches.length === 0) {
    // No ## headings — treat first # as title, rest as procedure
    const titleMatch = raw.match(/^#\s+(.+)$/m)
    if (titleMatch) {
      body.title = titleMatch[1].trim()
      body.procedure = raw.slice(titleMatch.index! + titleMatch[0].length).trim()
    } else {
      body.procedure = raw.trim()
    }
    return body
  }

  // Extract title from first # heading
  const titleMatch = raw.match(/^#\s+(.+)$/m)
  if (titleMatch && (titleMatch.index ?? Infinity) < matches[0].start) {
    body.title = titleMatch[1].trim()
  }

  // Known section mappings
  const sectionMap: Record<string, keyof SkillMdBody> = {
    'when to use': 'whenToUse',
    'procedure': 'procedure',
    'pitfalls': 'pitfalls',
    'verification': 'verification',
  }

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].start
    const end = i + 1 < matches.length ? matches[i + 1].start - (raw.slice(0, matches[i + 1].start).lastIndexOf('\n##') + 1) : raw.length
    const content = raw.slice(start, end).trim()
    const key = matches[i].title.toLowerCase()

    const mapped = sectionMap[key]
    if (mapped) {
      ;(body as Record<string, unknown>)[mapped] = content
    } else {
      customSections[matches[i].title] = content
    }
  }

  if (Object.keys(customSections).length > 0) {
    body.customSections = customSections
  }

  return body
}

// ── Generator ───────────────────────────────────────────────

/**
 * Generate a SKILL.md document from structured data.
 * Produces a well-formatted document compatible with agentskills.io.
 */
export function generateSkillMd(data: SkillMdData): string {
  const parts: string[] = []

  // Frontmatter
  parts.push('---')
  parts.push(`name: ${data.frontmatter.name}`)
  parts.push(`description: ${data.frontmatter.description}`)

  if (data.frontmatter.version) {
    parts.push(`version: ${data.frontmatter.version}`)
  }

  if (data.frontmatter.platforms && data.frontmatter.platforms.length > 0) {
    parts.push(`platforms: [${data.frontmatter.platforms.join(', ')}]`)
  }

  // Hermes metadata
  const hermes = data.frontmatter.metadata?.hermes
  if (hermes) {
    parts.push('metadata:')
    parts.push('  hermes:')

    if (hermes.tags && hermes.tags.length > 0) {
      parts.push(`    tags: [${hermes.tags.join(', ')}]`)
    }
    if (hermes.category) {
      parts.push(`    category: ${hermes.category}`)
    }
    if (hermes.fallback_for_toolsets && hermes.fallback_for_toolsets.length > 0) {
      parts.push(`    fallback_for_toolsets: [${hermes.fallback_for_toolsets.join(', ')}]`)
    }
    if (hermes.requires_toolsets && hermes.requires_toolsets.length > 0) {
      parts.push(`    requires_toolsets: [${hermes.requires_toolsets.join(', ')}]`)
    }
    if (hermes.config && hermes.config.length > 0) {
      parts.push('    config:')
      for (const entry of hermes.config) {
        parts.push(`      - key: ${entry.key}`)
        parts.push(`        description: "${entry.description}"`)
        if (entry.default !== undefined) {
          parts.push(`        default: "${entry.default}"`)
        }
      }
    }
  }

  parts.push('---')

  // Body
  const body = data.body

  if (body.title) {
    parts.push(`# ${body.title}`)
    parts.push('')
  }

  if (body.whenToUse) {
    parts.push('## When to Use')
    parts.push(body.whenToUse)
    parts.push('')
  }

  if (body.procedure) {
    parts.push('## Procedure')
    parts.push(body.procedure)
    parts.push('')
  }

  if (body.pitfalls) {
    parts.push('## Pitfalls')
    parts.push(body.pitfalls)
    parts.push('')
  }

  if (body.verification) {
    parts.push('## Verification')
    parts.push(body.verification)
    parts.push('')
  }

  if (body.customSections) {
    for (const [title, content] of Object.entries(body.customSections)) {
      parts.push(`## ${title}`)
      parts.push(content)
      parts.push('')
    }
  }

  return parts.join('\n').trimEnd() + '\n'
}

/** Convert a SkillMdData to a flat record suitable for HermesSkill DB model */
export function skillMdToDbFields(data: SkillMdData): {
  name: string
  description: string
  platforms: string[] | null
  metadata: string | null
  instructions: string
  triggerPatterns: string[] | null
} {
  const hermes = data.frontmatter.metadata?.hermes

  return {
    name: data.frontmatter.name,
    description: data.frontmatter.description,
    platforms: data.frontmatter.platforms?.length ? data.frontmatter.platforms : null,
    metadata: hermes ? JSON.stringify(hermes) : null,
    instructions: data.body.procedure || '',
    triggerPatterns: hermes?.tags?.length ? hermes.tags : null,
  }
}

/** Build SkillMdData from DB fields */
export function dbFieldsToSkillMd(fields: {
  name: string
  description: string
  platforms: string | null
  metadata: string | null
  instructions: string
  triggerPatterns: string | null
}): SkillMdData {
  let hermes: SkillHermesMetadata | undefined
  if (fields.metadata) {
    try {
      hermes = JSON.parse(fields.metadata)
    } catch { /* ignore */ }
  }

  const platforms = fields.platforms ? JSON.parse(fields.platforms) : undefined
  const tags = fields.triggerPatterns ? JSON.parse(fields.triggerPatterns) : undefined

  if (hermes && tags) hermes.tags = tags
  else if (tags && !hermes) hermes = { tags }

  return {
    frontmatter: {
      name: fields.name,
      description: fields.description,
      version: '1.0.0',
      platforms,
      metadata: hermes ? { hermes } : undefined,
    },
    body: {
      title: fields.name,
      procedure: fields.instructions,
    },
  }
}
