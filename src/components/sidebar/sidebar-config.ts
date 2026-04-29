import {
  LayoutDashboard,
  Users,
  FileText,
  Heart,
  HandCoins,
  Banknote,
  ShieldCheck,
  BarChart3,
  Kanban,
  UserCheck,
  Gift,
  FolderOpen,
  Sparkles,
  Server,
  Puzzle,
  Link as LinkIcon,
  Terminal,
  Bot,
  Cpu,
  Clock,
  ScanFace,
  Fingerprint,
  BookOpen,
  Package,
  UtensilsCrossed,
  Zap,
  Rocket,
  Warehouse,
  GraduationCap,
  Settings,
} from 'lucide-react'
import type { UserRole } from '@/stores/app-store'
import type { SidebarNavGroup } from './sidebar-types'

export const SIDEBAR_COLLAPSED_WIDTH = 72
export const SIDEBAR_EXPANDED_WIDTH = 260

export const ROLE_CONFIG: Record<UserRole, { label: string; description: string }> = {
  staff: { label: 'Staf', description: 'Modul operasi harian' },
  admin: { label: 'Pentadbir', description: 'Operasi + compliance + laporan' },
  developer: { label: 'Developer', description: 'Penuh termasuk AI & Automasi' },
}

export const SIDEBAR_GROUPS: SidebarNavGroup[] = [
  {
    title: 'Utama',
    roles: ['staff', 'admin', 'developer'],
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['staff', 'admin', 'developer'] },
      { id: 'members', label: 'Ahli Asnaf', icon: Users, roles: ['staff', 'admin', 'developer'] },
      { id: 'cases', label: 'Kes Bantuan', icon: FileText, roles: ['staff', 'admin', 'developer'] },
    ],
  },
  {
    title: 'Bantuan & Program',
    roles: ['staff', 'admin', 'developer'],
    items: [
      { id: 'programmes', label: 'Program Inkubasi', icon: Heart, roles: ['staff', 'admin', 'developer'] },
      { id: 'asnafpreneur', label: 'Asnafpreneur', icon: Rocket, roles: ['admin', 'developer'] },
      { id: 'kelas-ai', label: 'Kelas AI & Vibe Coding', icon: GraduationCap, roles: ['admin', 'developer'] },
      { id: 'agihan-bulan', label: 'Agihan Bulan', icon: Package, roles: ['staff', 'admin', 'developer'] },
      { id: 'sedekah-jumaat', label: 'Sedekah Jumaat', icon: UtensilsCrossed, roles: ['staff', 'admin', 'developer'] },
    ],
  },
  {
    title: 'Kewangan & Gudang',
    roles: ['staff', 'admin', 'developer'],
    items: [
      { id: 'donations', label: 'Donasi', icon: HandCoins, roles: ['staff', 'admin', 'developer'] },
      { id: 'donors', label: 'Penderma', icon: Gift, roles: ['staff', 'admin', 'developer'] },
      { id: 'disbursements', label: 'Pembayaran', icon: Banknote, roles: ['staff', 'admin', 'developer'] },
      { id: 'gudang-barangan', label: 'Gudang Barangan', icon: Warehouse, roles: ['staff', 'admin', 'developer'] },
    ],
  },
  {
    title: 'Operasi',
    roles: ['staff', 'admin', 'developer'],
    items: [
      { id: 'activities', label: 'Aktiviti', icon: Kanban, roles: ['staff', 'admin', 'developer'] },
      { id: 'volunteers', label: 'Sukarelawan', icon: UserCheck, roles: ['staff', 'admin', 'developer'] },
      { id: 'documents', label: 'Dokumen', icon: FolderOpen, roles: ['staff', 'admin', 'developer'] },
    ],
  },
  {
    title: 'Pematuhan & Identiti',
    roles: ['admin', 'developer'],
    items: [
      { id: 'compliance', label: 'Compliance', icon: ShieldCheck, roles: ['admin', 'developer'] },
      { id: 'ekyc', label: 'eKYC', icon: ScanFace, roles: ['admin', 'developer'] },
      { id: 'tapsecure', label: 'TapSecure', icon: Fingerprint, roles: ['admin', 'developer'] },
    ],
  },
  {
    title: 'Laporan',
    roles: ['admin', 'developer'],
    items: [
      { id: 'reports', label: 'Laporan Kewangan', icon: BarChart3, roles: ['admin', 'developer'] },
      { id: 'admin', label: 'Pentadbiran', icon: Settings, roles: ['admin', 'developer'] },
    ],
  },
  {
    title: 'Developer / AI Ops',
    subGroup: 'AI Ops (Internal)',
    roles: ['developer'],
    items: [
      { id: 'ops-conductor', label: 'Ops Conductor', icon: Zap, roles: ['developer'] },
      { id: 'ai', label: 'Alat AI', icon: Sparkles, roles: ['developer'] },
      { id: 'openclaw-mcp', label: 'Pelayan MCP', icon: Server, roles: ['developer'] },
      { id: 'openclaw-plugins', label: 'Sambungan', icon: Puzzle, roles: ['developer'] },
      { id: 'openclaw-integrations', label: 'Gateway & Channel', icon: LinkIcon, roles: ['developer'] },
      { id: 'openclaw-terminal', label: 'Console Operator', icon: Terminal, roles: ['developer'] },
      { id: 'openclaw-agents', label: 'Ejen AI', icon: Bot, roles: ['developer'] },
      { id: 'openclaw-models', label: 'Enjin Model', icon: Cpu, roles: ['developer'] },
      { id: 'openclaw-automation', label: 'Automasi', icon: Clock, roles: ['developer'] },
    ],
  },
  {
    title: 'Bantuan Sistem',
    roles: ['staff', 'admin', 'developer'],
    items: [
      { id: 'docs', label: 'Panduan', icon: BookOpen, roles: ['staff', 'admin', 'developer'] },
      { id: 'settings', label: 'Tetapan', icon: Settings, roles: ['staff', 'admin', 'developer'] },
    ],
  },
]

export function getVisibleGroups(role: UserRole): SidebarNavGroup[] {
  return SIDEBAR_GROUPS
    .filter((group) => group.roles.includes(role))
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((group) => group.items.length > 0)
}

export const VIEW_LABELS = SIDEBAR_GROUPS.flatMap((group) => group.items).reduce(
  (labels, item) => ({ ...labels, [item.id]: item.label }),
  {} as Record<string, string>,
)
