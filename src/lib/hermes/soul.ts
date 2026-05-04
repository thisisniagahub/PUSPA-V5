// ============================================================
// Hermes Agent V2 — SOUL.md Personality System
// Configurable personality via SOUL.md
// Per-user personality configuration for Hermes responses
// ============================================================

import { db } from '@/lib/db'

// ── Types ───────────────────────────────────────────────────

export interface SoulConfig {
  id: string
  userId: string
  content: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// ── Default SOUL.md ─────────────────────────────────────────

const DEFAULT_SOUL_CONTENT = `# PUSPA Hermes Personality

Anda adalah Hermes, penasihat AI untuk PUSPA.

## Core Identity
- Nama: Hermes
- Peranan: Penasihat AI untuk PUSPA (Pertubuhan Urus Suruh Penyayang Awam)
- Bahasa utama: Bahasa Melayu (boleh bercakap English bila perlu)
- Gaya: Profesional tetapi mesra, ringkas tetapi padat

## Communication Style
- Gunakan "anda" untuk pengguna, "saya" untuk diri sendiri
- Berikan jawapan yang berstruktur dan mudah dibaca
- Sertakan nombor dan statistik bila berkaitan
- Tanya soalan klarifikasi bila permintaan tidak jelas
- Gunakan format Malaysia untuk mata wang (RM) dan tarikh

## Domain Expertise
- Pengurusan organisasi kebajikan (NGO)
- Proses kes bantuan asnaf
- Pengurusan donasi dan kutipan dana
- Pematuhan peraturan (ROS, LHDN, BNM)
- Sukarelawan dan penempatan
- Analisis data dan pelaporan

## Behavioral Guidelines
- Sentiasa cadangkan tindakan seterusnya
- Prioritikan kes yang mendesak
- Jangan buat keputusan tanpa pengesahan pengguna untuk tindakan kritikal
- Beritahu pengguna tentang risiko atau isu pematuhan
- Simpan konteks perbualan untuk rujukan masa depan`

// ── Core Functions ──────────────────────────────────────────

/** Get user's SOUL.md configuration */
export async function getSoulConfig(userId: string): Promise<SoulConfig> {
  let config = await db.hermesSoulConfig.findUnique({
    where: { userId },
  })

  if (!config) {
    config = await db.hermesSoulConfig.create({
      data: {
        userId,
        content: DEFAULT_SOUL_CONTENT,
      },
    })
  }

  return {
    id: config.id,
    userId: config.userId,
    content: config.content,
    isActive: config.isActive,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  }
}

/** Update user's SOUL.md content */
export async function updateSoulConfig(userId: string, content: string): Promise<SoulConfig> {
  const config = await db.hermesSoulConfig.upsert({
    where: { userId },
    create: {
      userId,
      content,
      isActive: true,
    },
    update: {
      content,
      updatedAt: new Date(),
    },
  })

  return {
    id: config.id,
    userId: config.userId,
    content: config.content,
    isActive: config.isActive,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  }
}

/** Build personality prompt from SOUL.md for system prompt injection */
export async function buildSoulPrompt(userId: string): Promise<string> {
  const config = await getSoulConfig(userId)

  if (!config.isActive) {
    return ''
  }

  return `<soul-config>
[System note: Ini adalah konfigurasi personaliti Hermes. Ikuti garis panduan ini dalam semua respons.]

${config.content}
</soul-config>`
}

/** Reset SOUL.md to default */
export async function resetSoulConfig(userId: string): Promise<SoulConfig> {
  return updateSoulConfig(userId, DEFAULT_SOUL_CONTENT)
}
