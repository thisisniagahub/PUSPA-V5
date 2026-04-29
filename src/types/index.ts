// PUSPA App Types

export type ViewId =
  | 'dashboard'
  | 'members'
  | 'cases'
  | 'programmes'
  | 'donations'
  | 'disbursements'
  | 'compliance'
  | 'admin'
  | 'reports'
  | 'activities'
  | 'ai'
  | 'volunteers'
  | 'donors'
  | 'documents'
  | 'openclaw-mcp'
  | 'openclaw-plugins'
  | 'openclaw-integrations'
  | 'openclaw-terminal'
  | 'openclaw-agents'
  | 'openclaw-models'
  | 'openclaw-automation'
  | 'openclaw-graph'
  | 'ekyc'
  | 'tapsecure'
  | 'agihan-bulan'
  | 'sedekah-jumaat'
  | 'docs'
  | 'ops-conductor'
  | 'asnafpreneur'
  | 'kelas-ai'
  | 'gudang-barangan'
  | 'settings'

export const viewLabels: Record<ViewId, string> = {
  'dashboard': 'Dashboard',
  'members': 'Ahli Asnaf',
  'cases': 'Kes Bantuan',
  'programmes': 'Program Inkubasi',
  'donations': 'Donasi',
  'disbursements': 'Pembayaran',
  'compliance': 'Pematuhan',
  'admin': 'Pentadbiran',
  'reports': 'Laporan Kewangan',
  'activities': 'Aktiviti',
  'ai': 'Alat AI',
  'volunteers': 'Sukarelawan',
  'donors': 'Penderma',
  'documents': 'Dokumen',
  'openclaw-mcp': 'Pelayan MCP',
  'openclaw-plugins': 'Plugin',
  'openclaw-integrations': 'Sambungan',
  'openclaw-terminal': 'Konsol Operator',
  'openclaw-agents': 'Ejen AI',
  'openclaw-models': 'Enjin Model',
  'openclaw-automation': 'Automasi',
  'openclaw-graph': 'Graf Visual',
  'ekyc': 'eKYC',
  'tapsecure': 'TapSecure',
  'agihan-bulan': 'Agihan Bulan',
  'sedekah-jumaat': 'Sedekah Jumaat',
  'docs': 'Dokumentasi',
  'ops-conductor': 'Ops Conductor',
  'asnafpreneur': 'Asnafpreneur',
  'kelas-ai': 'Kelas AI',
  'gudang-barangan': 'Gudang Barangan',
  'settings': 'Tetapan',
}

export interface NavItem {
  id: ViewId
  label: string
  icon: string
  group?: string
}

export interface DashboardStats {
  totalMembers: number
  activeProgrammes: number
  totalDonations: number
  activeVolunteers: number
  complianceScore: number
  totalCases: number
  pendingCases: number
  thisMonthDonations: number
}

export interface MonthlyDonation {
  month: string
  zakat: number
  sadaqah: number
  waqf: number
  infaq: number
  general: number
}

export interface MemberCategory {
  name: string
  value: number
  color: string
}

export interface RecentActivity {
  id: string
  type: string
  title: string
  description: string
  timestamp: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

