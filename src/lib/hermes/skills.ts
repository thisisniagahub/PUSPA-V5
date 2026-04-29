// ============================================================
// Hermes Agent — Self-Improving Skills System
// Inspired by NousResearch Hermes Agent SKILL.md format
// Skills are learned from interactions and improve over time
// ============================================================

import { db } from '@/lib/db'

export interface SkillEntry {
  id: string
  name: string
  description: string
  category: string
  instructions: string
  triggerPatterns: string[]
  version: number
  usageCount: number
  successRate: number
  source: string
  isActive: boolean
  userId: string | null
  createdAt: string
  updatedAt: string
}

function toSkillEntry(s: {
  id: string
  name: string
  description: string
  category: string
  instructions: string
  triggerPatterns: string | null
  version: number
  usageCount: number
  successRate: number
  source: string
  isActive: boolean
  userId: string | null
  createdAt: Date
  updatedAt: Date
}): SkillEntry {
  return {
    ...s,
    triggerPatterns: s.triggerPatterns ? JSON.parse(s.triggerPatterns) : [],
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }
}

// Create a new skill
export async function createSkill(params: {
  name: string
  description: string
  category?: string
  instructions: string
  triggerPatterns?: string[]
  source?: string
  userId?: string
  conversationId?: string
}): Promise<SkillEntry> {
  const skill = await db.hermesSkill.create({
    data: {
      name: params.name,
      description: params.description,
      category: params.category || 'general',
      instructions: params.instructions,
      triggerPatterns: params.triggerPatterns ? JSON.stringify(params.triggerPatterns) : null,
      source: (params.source || 'auto') as import('@prisma/client').HermesSkillSource,
      userId: params.userId,
      conversationId: params.conversationId,
    },
  })

  return toSkillEntry(skill)
}

// List all active skills
export async function listSkills(params?: {
  category?: string
  userId?: string
  activeOnly?: boolean
}): Promise<SkillEntry[]> {
  const where: Record<string, unknown> = {}

  if (params?.activeOnly !== false) where.isActive = true
  if (params?.category) where.category = params.category
  if (params?.userId) where.userId = params.userId

  const skills = await db.hermesSkill.findMany({
    where,
    orderBy: [
      { usageCount: 'desc' },
      { successRate: 'desc' },
      { updatedAt: 'desc' },
    ],
  })

  return skills.map(s => toSkillEntry(s))
}

// Get a specific skill
export async function getSkill(skillId: string): Promise<SkillEntry | null> {
  const skill = await db.hermesSkill.findUnique({ where: { id: skillId } })
  if (!skill) return null
  return toSkillEntry(skill)
}

// Record skill usage (increment count, update success rate)
export async function recordSkillUsage(skillId: string, success: boolean): Promise<void> {
  const skill = await db.hermesSkill.findUnique({ where: { id: skillId } })
  if (!skill) return

  const newCount = skill.usageCount + 1
  const newRate = (skill.successRate * skill.usageCount + (success ? 1 : 0)) / newCount

  await db.hermesSkill.update({
    where: { id: skillId },
    data: {
      usageCount: newCount,
      successRate: Math.round(newRate * 100) / 100,
      updatedAt: new Date(),
    },
  })
}

// Find matching skills for a user query
export async function findMatchingSkills(query: string, userId?: string): Promise<SkillEntry[]> {
  const skills = await listSkills({ activeOnly: true, userId })

  const queryLower = query.toLowerCase()
  return skills.filter(skill => {
    // Check trigger patterns
    if (skill.triggerPatterns.length > 0) {
      return skill.triggerPatterns.some(p => queryLower.includes(p.toLowerCase()))
    }
    // Fallback: check name and description
    return queryLower.includes(skill.name.toLowerCase()) ||
           queryLower.includes(skill.description.toLowerCase())
  })
}

// Build skills context block for system prompt
export async function buildSkillsContext(userId?: string): Promise<string> {
  const skills = await listSkills({ activeOnly: true, userId })

  if (skills.length === 0) return ''

  const lines = skills.map(s => {
    const emoji = s.category === 'data-query' ? '📊' :
                  s.category === 'navigation' ? '🧭' :
                  s.category === 'workflow' ? '⚡' :
                  s.category === 'analysis' ? '🔍' :
                  s.category === 'crud' ? '✏️' :
                  s.category === 'reporting' ? '📈' : '🛠️'
    return `${emoji} **${s.name}** (v${s.version}, used ${s.usageCount}x, ${Math.round(s.successRate * 100)}% success): ${s.description}`
  })

  return `## Available Skills (Self-Learned)
The following skills have been learned from previous interactions. Use them when relevant:
${lines.join('\n')}

After completing a complex task (5+ tool calls), fixing a tricky error, or discovering a non-trivial workflow, consider saving the approach as a skill using the \`manage_skill\` tool.`
}

// Build enhanced skills context with instructions for matched skills
export async function buildEnhancedSkillsContext(userId?: string, query?: string): Promise<string> {
  const allSkills = await listSkills({ activeOnly: true, userId })
  if (allSkills.length === 0) return ''

  const matchedSkills = query ? await findMatchingSkills(query, userId) : []
  const lines = allSkills.map(s => {
    const emoji = s.category === 'data-query' ? '📊' :
                  s.category === 'navigation' ? '🧭' :
                  s.category === 'workflow' ? '⚡' :
                  s.category === 'analysis' ? '🔍' :
                  s.category === 'crud' ? '✏️' :
                  s.category === 'reporting' ? '📈' : '🛠️'
    return `${emoji} **${s.name}** (v${s.version}, used ${s.usageCount}x, ${Math.round(s.successRate * 100)}% success): ${s.description}`
  })

  let context = `## Available Skills (Self-Learned)
${lines.join('\n')}`

  // Add detailed instructions for matched skills
  if (matchedSkills.length > 0) {
    context += `\n\n## Active Skill Instructions
The following skills are relevant to this query. Follow their instructions:`
    for (const skill of matchedSkills) {
      context += `\n\n### ${skill.name}\n${skill.instructions}`
    }
  }

  context += `\n\nAfter completing a complex task, consider saving the approach as a skill using the \`manage_skill\` tool.`

  return context
}

// Auto-create a skill from a successful interaction
export async function autoCreateSkill(params: {
  name: string
  description: string
  instructions: string
  triggerPatterns: string[]
  category?: string
  userId?: string
  conversationId?: string
}): Promise<SkillEntry | null> {
  // Check if a similar skill already exists
  const existing = await db.hermesSkill.findFirst({
    where: { name: params.name, isActive: true },
  })

  if (existing) {
    // Update existing skill instead of creating duplicate
    await db.hermesSkill.update({
      where: { id: existing.id },
      data: {
        instructions: params.instructions,
        triggerPatterns: JSON.stringify(params.triggerPatterns),
        version: { increment: 1 },
        updatedAt: new Date(),
      },
    })
    return getSkill(existing.id)
  }

  return createSkill(params)
}

// Seed default skills (12 skills covering all major workflows)
export async function seedDefaultSkills(): Promise<void> {
  const defaults = [
    {
      name: 'organization-overview',
      description: 'Memberikan ringkasan keseluruhan organisasi PUSPA dengan statistik terkini',
      category: 'data-query',
      instructions: `1. Gunakan tool query_stats untuk mendapatkan statistik semua modul
2. Susun data dalam format ringkasan yang mudah dibaca
3. Sertakan jumlah ahli, kes, donasi, program, dan pematuhan
4. Gunakan format angka Malaysia (RM, koma untuk ribu)
5. Akhiri dengan cadangan tindakan`,
      triggerPatterns: ['ringkasan', 'overview', 'keseluruhan', 'summary'],
      source: 'manual',
    },
    {
      name: 'urgent-cases',
      description: 'Mencari dan memaparkan kes-kes yang memerlukan tindakan segera',
      category: 'data-query',
      instructions: `1. Gunakan search_cases dengan priority=urgent
2. Jika tiada kes urgent, cari kes dengan status submitted/verifying
3. Paparkan dalam format jadual dengan nombor kes, tajuk, keutamaan, status
4. Sertakan cadangan tindakan untuk setiap kes
5. Tanya jika pengguna ingin navigasi ke modul Kes Bantuan`,
      triggerPatterns: ['urgent', 'segera', 'keutamaan', 'critical', 'penting'],
      source: 'manual',
    },
    {
      name: 'donation-analysis',
      description: 'Menganalisis data donasi mengikut jenis dana, tempoh, dan trend',
      category: 'analysis',
      instructions: `1. Gunakan get_donations_summary dengan period yang diminta
2. Pecahkan mengikut jenis dana (zakat, sedekah, wakaf, infak)
3. Bandingkan dengan tempoh sebelumnya jika boleh
4. Paparkan trend dan cadangan peningkatan
5. Sertakan 5 donasi terkini sebagai contoh`,
      triggerPatterns: ['analisis donasi', 'donation analysis', 'trend donasi', 'pecahan donasi'],
      source: 'manual',
    },
    {
      name: 'member-search',
      description: 'Mencari ahli asnaf berdasarkan nama, IC, atau status',
      category: 'data-query',
      instructions: `1. Ekstrak istilah carian dari permintaan pengguna
2. Gunakan search_members dengan parameter yang sesuai
3. Paparkan keputusan dalam format kad ringkas
4. Jika tiada keputusan, cadangkan carian alternatif
5. Tanya jika pengguna ingin melihat profil lengkap menggunakan get_member_details`,
      triggerPatterns: ['cari ahli', 'search member', 'carian', 'find member', 'profil ahli'],
      source: 'manual',
    },
    {
      name: 'compliance-check',
      description: 'Menyemak status pematuhan dan item yang belum selesai',
      category: 'data-query',
      instructions: `1. Gunakan compliance_status untuk mendapatkan data terkini
2. Kira skor pematuhan sebagai peratusan
3. Senaraikan item yang belum selesai mengikut kategori
4. Sertakan keutamaan untuk setiap item tertunggak
5. Cadangkan tindakan pemulihan`,
      triggerPatterns: ['pematuhan', 'compliance', 'audit', 'semakan', 'status ros'],
      source: 'manual',
    },
    {
      name: 'create-member-workflow',
      description: 'Mendaftarkan ahli asnaf baru dengan semua maklumat yang diperlukan',
      category: 'crud',
      instructions: `1. Tanya maklumat yang diperlukan: nama, IC, telefon, alamat
2. Maklumat tambahan: saiz isi rumah, pendapatan, pekerjaan
3. Gunakan create_member dengan data yang dikumpulkan
4. Sahkan pendaftaran berjaya dan paparkan nombor ahli
5. Cadangkan langkah seterusnya (eKYC, buat kes bantuan)`,
      triggerPatterns: ['daftar ahli', 'register member', 'tambah ahli', 'new member', 'ahli baru'],
      source: 'manual',
    },
    {
      name: 'case-approval-workflow',
      description: 'Memproses kelulusan kes bantuan melalui aliran kerja',
      category: 'workflow',
      instructions: `1. Cari kes yang menunggu tindakan menggunakan search_cases
2. Paparkan butiran kes menggunakan get_case_details
3. Semak skor pengesahan dan kebajikan
4. Tanya pengguna untuk mengesahkan kelulusan
5. Gunakan update_case_status untuk kemaskini status
6. Tambah nota menggunakan add_case_note jika perlu`,
      triggerPatterns: ['lulus kes', 'approve case', 'sahkan kes', 'process case', 'proses kes'],
      source: 'manual',
    },
    {
      name: 'donation-recording',
      description: 'Merekodkan donasi baru dengan maklumat yang betul',
      category: 'crud',
      instructions: `1. Tanya maklumat: nama penderma, jumlah, jenis dana
2. Jenis dana: zakat, sedekah, wakaf, infak, donation_general
3. Kaedah pembayaran: tunai, pemindahan bank, dalam talian
4. Gunakan create_donation dengan data yang diberikan
5. Sahkan rekod berjaya dan paparkan nombor donasi`,
      triggerPatterns: ['rekod donasi', 'record donation', 'tambah donasi', 'new donation', 'derma baru'],
      source: 'manual',
    },
    {
      name: 'volunteer-deployment',
      description: 'Mengerahkan sukarelawan ke program atau aktiviti',
      category: 'workflow',
      instructions: `1. Cari sukarelawan yang aktif menggunakan search_volunteers
2. Senaraikan program yang aktif menggunakan list_programmes
3. Padankan kemahiran sukarelawan dengan keperluan program
4. Rekod jam sukarelawan menggunakan record_volunteer_hours
5. Sahkan penempatan berjaya`,
      triggerPatterns: ['deploy volunteer', 'gerak sukarelawan', 'penempatan', 'deployment'],
      source: 'manual',
    },
    {
      name: 'monthly-report',
      description: 'Menghasilkan laporan bulanan untuk modul tertentu',
      category: 'reporting',
      instructions: `1. Tentukan modul dan tempoh laporan
2. Gunakan generate_report dengan parameter yang sesuai
3. Gunakan analyze_trends untuk data trend
4. Susun dalam format laporan yang profesional
5. Sertakan cadangan penambahbaikan`,
      triggerPatterns: ['laporan', 'report', 'monthly report', 'laporan bulanan', 'quarterly report'],
      source: 'manual',
    },
    {
      name: 'data-export',
      description: 'Mengeksport data untuk analisis lanjutan',
      category: 'reporting',
      instructions: `1. Tentukan modul dan jenis data yang diperlukan
2. Gunakan tool carian yang sesuai untuk mengumpulkan data
3. Format data dalam jadual yang mudah dibaca
4. Sertakan ringkasan statistik
5. Cadangkan cara menggunakan data tersebut`,
      triggerPatterns: ['export', 'eksport', 'muat turun', 'download', 'csv', 'excel'],
      source: 'manual',
    },
    {
      name: 'risk-assessment',
      description: 'Menilai risiko dalam operasi PUSPA dan mencadangkan penyelesaian',
      category: 'analysis',
      instructions: `1. Gunakan risk_assessment untuk mengenal pasti risiko
2. Analisis kes urgent, pembayaran tertunggak, pematuhan
3. Kategorikan risiko mengikut tahap: kritikal, tinggi, sederhana
4. Cadangkan tindakan mitigasi untuk setiap risiko
5. Prioritikan tindakan berdasarkan tahap risiko`,
      triggerPatterns: ['risiko', 'risk', 'assessment', 'penilaian risiko', 'masalah', 'isu'],
      source: 'manual',
    },
  ]

  for (const skill of defaults) {
    const existing = await db.hermesSkill.findFirst({
      where: { name: skill.name, source: 'manual' },
    })

    if (!existing) {
      await createSkill(skill)
    }
  }
}
