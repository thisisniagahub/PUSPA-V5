'use client'

import { useState, useMemo, useCallback } from 'react'
import Image from 'next/image'
import { useAuth } from '@/components/auth-provider'
import { useAppStore } from '@/stores/app-store'
import { canAccessView } from '@/lib/access-control'
import { normalizeUserRole } from '@/lib/auth-shared'
import { SIDEBAR_GROUPS } from '@/components/sidebar/sidebar-config'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import type { ViewId } from '@/types'

const KEYWORDS: Partial<Record<ViewId, string[]>> = {
  dashboard: ['home', 'utama', 'papan pemuka'],
  members: ['ahli', 'asnaf', 'member', 'penerima'],
  cases: ['kes', 'case', 'permohonan', 'application', 'bantuan'],
  programmes: ['program', 'aktiviti', 'projek', 'inkubasi'],
  asnafpreneur: ['asnafpreneur', 'ai saas', 'enterprise', 'startup', 'program digital', 'keusahawanan ai'],
  'kelas-ai': ['kelas ai', 'vibe coding', 'kurikulum', 'sponsor', 'asnaf digital'],
  donations: ['donasi', 'sumbangan', 'derma', 'zakat'],
  disbursements: ['pembayaran', 'disbursement', 'bayar'],
  'gudang-barangan': ['gudang', 'barangan', 'pre-loved', 'inventori', 'stok', 'jualan', 'agihan barang'],
  compliance: ['compliance', 'pematuhan', 'audit'],
  admin: ['admin', 'tetapan', 'settings', 'profil'],
  reports: ['laporan', 'report', 'kewangan', 'financial'],
  activities: ['aktiviti', 'activity', 'kanban', 'operasi'],
  ai: ['ai', 'kecerdasan buatan', 'chatbot'],
  volunteers: ['sukarelawan', 'volunteer', 'mentor'],
  donors: ['penderma', 'donor', 'crm'],
  documents: ['dokumen', 'document', 'fail', 'file'],
  'agihan-bulan': ['agihan', 'bulan', 'makan ruji', 'staple food', 'distribusi'],
  'sedekah-jumaat': ['sedekah', 'jumaat', 'rumah kebajikan', 'mahad tahfiz', 'makanan tengahari'],
  ekyc: ['ekyc', 'identiti', 'verification'],
  tapsecure: ['tapsecure', 'fingerprint', 'biometrik'],
  docs: ['panduan', 'docs', 'help', 'bantuan sistem'],
  'openclaw-mcp': ['mcp', 'server', 'ai ops', 'dalaman'],
  'openclaw-plugins': ['plugin', 'sambungan', 'ai ops', 'dalaman'],
  'openclaw-integrations': ['integrasi', 'integration', 'gateway', 'channel', 'ai ops'],
  'openclaw-terminal': ['terminal', 'console', 'operator', 'ai ops'],
  'openclaw-agents': ['agent', 'ejen', 'ai', 'automasi'],
  'openclaw-models': ['model', 'llm', 'engine', 'ai ops'],
  'openclaw-automation': ['automasi', 'automation', 'cron', 'ai ops'],
  'ops-conductor': ['conductor', 'ops', 'operasi', 'chat', 'task', 'work', 'reminder', 'trace'],
}

const VIEW_ITEMS = SIDEBAR_GROUPS.flatMap((group) =>
  group.items.map((item) => ({
    id: item.id,
    label: item.label,
    keywords: KEYWORDS[item.id] ?? [],
  })),
)

const SECTIONS = SIDEBAR_GROUPS.map((group) => ({
  heading: group.subGroup ? `${group.title} · ${group.subGroup}` : group.title,
  ids: group.items.map((item) => item.id),
}))

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen, setView } = useAppStore()
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const effectiveRole = normalizeUserRole(user?.role)

  const handleSelect = useCallback(
    (viewId: ViewId) => {
      if (!canAccessView(viewId, effectiveRole)) return
      setView(viewId)
      setCommandPaletteOpen(false)
    },
    [effectiveRole, setView, setCommandPaletteOpen],
  )

  // Filter items based on search query
  const filteredSections = useMemo(() => {
    const visibleSections = SECTIONS
      .map((section) => ({
        ...section,
        ids: section.ids.filter((id) => canAccessView(id, effectiveRole)),
      }))
      .filter((section) => section.ids.length > 0)

    if (!query.trim()) return visibleSections

    const q = query.toLowerCase().trim()
    const matchingIds = new Set<ViewId>()

    VIEW_ITEMS.forEach((item) => {
      const haystack = `${item.label} ${item.keywords.join(' ')} ${item.id}`.toLowerCase()
      if (haystack.includes(q)) matchingIds.add(item.id)
    })

    return visibleSections
      .map((section) => ({
        ...section,
        ids: section.ids.filter((id) => matchingIds.has(id)),
      }))
      .filter((section) => section.ids.length > 0)
  }, [effectiveRole, query])

  return (
    <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <div className="flex items-center gap-2 px-4 pt-2 pb-1">
        <Image
          src="/puspa-logo-official.png"
          alt="PUSPA"
          width={22}
          height={22}
          className="object-contain"
        />
        <span className="text-xs font-semibold" style={{ color: '#4B0082' }}>PUSPA Command</span>
      </div>
      <CommandInput
        placeholder="Cari modul, ciri, atau tetapan..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>Tiada hasil dijumpai.</CommandEmpty>
        {filteredSections.map((section) => (
          <CommandGroup key={section.heading} heading={section.heading}>
            {section.ids.map((id) => {
              const item = VIEW_ITEMS.find((v) => v.id === id)
              if (!item) return null
              return (
                <CommandItem
                  key={id}
                  value={`${item.label} ${item.keywords.join(' ')}`}
                  onSelect={() => handleSelect(id)}
                >
                  <span className="font-medium">{item.label}</span>
                </CommandItem>
              )
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  )
}
