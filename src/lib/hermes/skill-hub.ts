// ============================================================
// Hermes Agent V2 — Skill Hub Integration
// Browse and install skills from agentskills.io
// Search, discover, and install community skills
// ============================================================

import { db } from '@/lib/db'
import { createSkill } from './skills'
import { parseSkillMd, skillMdToDbFields, type SkillMdData } from './skill-md'

// ── Types ───────────────────────────────────────────────────

export interface HubSkill {
  id: string
  name: string
  description: string
  author: string
  category: string
  tags: string[]
  version: string
  downloads: number
  rating: number
  skillMd: string
}

export interface HubCategory {
  id: string
  name: string
  description: string
  count: number
}

export interface HubSearchResult {
  query: string
  total: number
  skills: HubSkill[]
}

// ── Simulated Hub Data ──────────────────────────────────────

const HUB_CATEGORIES: HubCategory[] = [
  { id: 'devops', name: 'DevOps', description: 'Deployment, CI/CD, infrastructure', count: 12 },
  { id: 'data-query', name: 'Data Query', description: 'Database queries and analysis', count: 8 },
  { id: 'automation', name: 'Automation', description: 'Workflow automation scripts', count: 15 },
  { id: 'analysis', name: 'Analysis', description: 'Data analysis and reporting', count: 6 },
  { id: 'communication', name: 'Communication', description: 'Messaging and notification', count: 10 },
  { id: 'security', name: 'Security', description: 'Security scanning and compliance', count: 4 },
  { id: 'integration', name: 'Integration', description: 'Third-party API integrations', count: 9 },
]

const HUB_SKILLS: HubSkill[] = [
  {
    id: 'hub-deploy-check',
    name: 'deploy-check',
    description: 'Verify deployment health and status across environments',
    author: 'agentskills',
    category: 'devops',
    tags: ['deployment', 'health-check', 'devops'],
    version: '1.0.0',
    downloads: 342,
    rating: 4.5,
    skillMd: `---
name: deploy-check
description: Verify deployment health and status across environments
version: 1.0.0
platforms: [linux, macos]
metadata:
  hermes:
    tags: [deployment, health-check, devops]
    category: devops
    requires_toolsets: [terminal]
---
# Deploy Check
## When to Use
After deploying to any environment, or when investigating deployment issues.
## Procedure
1. Check the deployment status endpoint
2. Verify health check responses
3. Compare expected vs actual version
4. Check error rates in logs
## Pitfalls
- Health endpoints may return cached responses
- Blue-green deployments may show mixed results
## Verification
- All health checks return 200
- Version matches expected
- Error rate below threshold`,
  },
  {
    id: 'hub-data-pipeline',
    name: 'data-pipeline-monitor',
    description: 'Monitor data pipeline health and detect anomalies',
    author: 'data-team',
    category: 'data-query',
    tags: ['pipeline', 'monitoring', 'data'],
    version: '1.2.0',
    downloads: 189,
    rating: 4.2,
    skillMd: `---
name: data-pipeline-monitor
description: Monitor data pipeline health and detect anomalies
version: 1.2.0
metadata:
  hermes:
    tags: [pipeline, monitoring, data]
    category: data-query
    requires_toolsets: [terminal]
---
# Data Pipeline Monitor
## When to Use
When checking data pipeline status or investigating data quality issues.
## Procedure
1. Check pipeline execution status
2. Verify record counts match expectations
3. Look for anomalies in processing times
4. Check data freshness timestamps
## Pitfalls
- Pipeline delays may cascade across stages
- Schema changes can break downstream jobs
## Verification
- All pipeline stages completed
- Record counts within expected range
- No critical alerts`,
  },
  {
    id: 'hub-slack-notify',
    name: 'slack-notification',
    description: 'Send formatted notifications to Slack channels',
    author: 'comms-team',
    category: 'communication',
    tags: ['slack', 'notification', 'messaging'],
    version: '2.0.0',
    downloads: 567,
    rating: 4.8,
    skillMd: `---
name: slack-notification
description: Send formatted notifications to Slack channels
version: 2.0.0
metadata:
  hermes:
    tags: [slack, notification, messaging]
    category: communication
    fallback_for_toolsets: [web]
---
# Slack Notification
## When to Use
When you need to send alerts, summaries, or updates to Slack channels.
## Procedure
1. Format the message with appropriate blocks
2. Include relevant links and context
3. Use thread replies for follow-ups
4. Add reactions for status tracking
## Pitfalls
- Rate limits on message posting
- Over-notification can cause alert fatigue
## Verification
- Message appears in correct channel
- Formatting renders correctly
- Links are accessible`,
  },
  {
    id: 'hub-security-scan',
    name: 'security-scan',
    description: 'Run security scans and analyze vulnerabilities',
    author: 'security-team',
    category: 'security',
    tags: ['security', 'vulnerability', 'scanning'],
    version: '1.1.0',
    downloads: 234,
    rating: 4.3,
    skillMd: `---
name: security-scan
description: Run security scans and analyze vulnerabilities
version: 1.1.0
metadata:
  hermes:
    tags: [security, vulnerability, scanning]
    category: security
    requires_toolsets: [terminal]
---
# Security Scan
## When to Use
When performing security assessments or checking for vulnerabilities.
## Procedure
1. Run dependency vulnerability scan
2. Check for known CVEs in packages
3. Scan configuration files for secrets
4. Generate security report
## Pitfalls
- False positives in automated scans
- New CVEs may not be in database yet
## Verification
- Scan completed without errors
- Critical vulnerabilities addressed
- Report generated successfully`,
  },
  {
    id: 'hub-api-integration',
    name: 'api-integration-helper',
    description: 'Template for integrating third-party APIs',
    author: 'integration-team',
    category: 'integration',
    tags: ['api', 'integration', 'rest'],
    version: '1.3.0',
    downloads: 445,
    rating: 4.6,
    skillMd: `---
name: api-integration-helper
description: Template for integrating third-party APIs
version: 1.3.0
metadata:
  hermes:
    tags: [api, integration, rest]
    category: integration
---
# API Integration Helper
## When to Use
When building integrations with external APIs or debugging API connections.
## Procedure
1. Verify API credentials and access
2. Test connection with simple endpoint
3. Implement error handling and retries
4. Add rate limiting awareness
5. Document the integration
## Pitfalls
- API rate limits vary by plan
- Authentication tokens expire
- Response formats may change between versions
## Verification
- Successful API call returns expected data
- Error handling works for common failures
- Rate limiting is respected`,
  },
]

// ── Search ──────────────────────────────────────────────────

/** Search the skill hub for matching skills */
export async function searchSkillHub(query: string, category?: string): Promise<HubSearchResult> {
  const queryLower = query.toLowerCase()
  const queryTerms = queryLower.split(/\s+/)

  let results = HUB_SKILLS

  // Filter by category if specified
  if (category) {
    results = results.filter(s => s.category === category)
  }

  // Score and sort by relevance
  const scored = results.map(skill => {
    let score = 0
    for (const term of queryTerms) {
      if (skill.name.toLowerCase().includes(term)) score += 10
      if (skill.description.toLowerCase().includes(term)) score += 5
      if (skill.tags.some(t => t.toLowerCase().includes(term))) score += 3
      if (skill.category.toLowerCase().includes(term)) score += 2
    }
    // Boost by popularity
    score += skill.rating * 2
    score += Math.log(skill.downloads + 1)
    return { skill, score }
  })

  scored.sort((a, b) => b.score - a.score)

  const filtered = scored
    .filter(s => s.score > 0)
    .map(s => s.skill)

  return {
    query,
    total: filtered.length,
    skills: filtered,
  }
}

// ── Skill Detail ────────────────────────────────────────────

/** Get detailed information about a hub skill */
export async function getSkillDetail(hubId: string): Promise<HubSkill | null> {
  return HUB_SKILLS.find(s => s.id === hubId) || null
}

// ── Install ─────────────────────────────────────────────────

/** Install a skill from the hub for a user */
export async function installSkill(userId: string, hubId: string): Promise<{
  success: boolean
  skillId?: string
  error?: string
}> {
  const hubSkill = HUB_SKILLS.find(s => s.id === hubId)
  if (!hubSkill) {
    return { success: false, error: 'Skill not found in hub' }
  }

  // Check if already installed
  const existing = await db.hermesSkill.findFirst({
    where: { name: hubSkill.name, userId, isActive: true },
  })

  if (existing) {
    return { success: false, error: `Skill "${hubSkill.name}" already installed` }
  }

  // Parse the SKILL.md content
  let parsed: SkillMdData
  try {
    parsed = parseSkillMd(hubSkill.skillMd)
  } catch {
    return { success: false, error: 'Failed to parse SKILL.md from hub' }
  }

  // Convert to DB fields and create
  const fields = skillMdToDbFields(parsed)

  try {
    const skill = await createSkill({
      name: fields.name,
      description: fields.description,
      category: parsed.frontmatter.metadata?.hermes?.category || 'general',
      instructions: fields.instructions,
      triggerPatterns: fields.triggerPatterns || [],
      source: 'hub',
      userId,
    })

    // Update with additional SKILL.md fields
    await db.hermesSkill.update({
      where: { id: skill.id },
      data: {
        platforms: fields.platforms ? JSON.stringify(fields.platforms) : null,
        metadata: fields.metadata,
      },
    })

    return { success: true, skillId: skill.id }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Installation failed' }
  }
}

// ── Categories ──────────────────────────────────────────────

/** List available hub categories */
export async function listCategories(): Promise<HubCategory[]> {
  return HUB_CATEGORIES
}

// ── Trending ────────────────────────────────────────────────

/** Get trending skills from the hub */
export async function getTrendingSkills(limit: number = 5): Promise<HubSkill[]> {
  return HUB_SKILLS
    .sort((a, b) => b.downloads - a.downloads)
    .slice(0, limit)
}
