'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Legend,
  PieChart,
  Pie,
  LineChart,
  Line,
} from 'recharts'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShieldCheck,
  FileDown,
  FileSpreadsheet,
  Printer,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  RefreshCw,
  Building2,
  Users,
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Phone,
  Mail,
  UserCircle,
  Calendar,
  Activity,
  Lock,
  Database,
  Shield,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface FinancialReport {
  period: string
  year: number
  totalDonations: number
  totalDisbursements: number
  netIncome: number
  incomeStatement: {
    grossIncome: number
    totalExpenses: number
    netIncome: number
    donationCount: number
    disbursementCount: number
  }
  isfBreakdown: Record<string, { amount: number; count: number }>
  disbursementsByStatus: Record<string, { amount: number; count: number }>
  budgetVsActual: {
    programmeId: string
    programmeName: string
    category: string
    status: string
    budget: number
    actual: number
    variance: number
    utilization: number
    targetBeneficiaries: number | null
    actualBeneficiaries: number
  }[]
  periodBreakdown: { label: string; income: number; expenditure: number; net: number }[]
  zakatBreakdown: { category: string; amount: number; count: number }[]
}

interface AuditData {
  logs: {
    id: string
    action: string
    entity: string
    entityId: string | null
    details: string | null
    ipAddress: string | null
    createdAt: string
    user: { id: string; name: string; email: string; role: string } | null
  }[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  summary: {
    actionSummary: { action: string; count: number }[]
    entitySummary: { entity: string; count: number }[]
    activeUsers: { userId: string | null; count: number; user: { id: string; name: string; email: string; role: string } | null }[]
  }
}

interface ROSData {
  organization: {
    legalName: string
    registrationNumber: string | null
    registrationType: string
    foundedDate: string | null
    lhdnApprovalRef: string | null
    lhdnApprovalExpiry: string | null
    isTaxExempt: boolean
  } | null
  agm: {
    lastHeldYear: string | null
    dueDate: string
    overdue: boolean
    scheduled: boolean
  }
  committee: {
    current: {
      id: string
      name: string
      role: string
      title: string | null
      appointmentDate: string | null
      endDate: string | null
      phone: string | null
      email: string | null
      isCurrent: boolean
    }[]
    expired: { id: string; name: string; role: string }[]
    totalCurrent: number
    nearExpiry: { id: string; name: string; role: string; endDate: string | null }[]
    expiredTerms: { id: string; name: string; role: string; endDate: string | null }[]
  }
  checklist: {
    items: {
      id: string
      category: string
      item: string
      description: string | null
      isCompleted: boolean
      completedAt: string | null
    }[]
    total: number
    completed: number
    pending: number
    score: number
  }
  annualReturn: {
    filed: boolean
    hasPending: boolean
    filingItems: { id: string; item: string; isCompleted: boolean; completedAt: string | null }[]
  }
  keyDates: {
    agmDueDate: string
    lastAGMYear: string | null
    lhdnExpiry: string | null
    lhdnExpired: boolean
  }
  overallScore: number
}

interface PDPAData {
  dataRetention: {
    personalData: { members: number; donors: number; volunteers: number; total: number }
    transactionData: { donations: number; disbursements: number; cases: number; total: number }
    systemData: { auditLogs: number; securityLogs: number; deviceBindings: number; documents: number; total: number }
    totalRecords: number
  }
  consent: {
    membersWithBankData: number
    donorsWithTaxConsent: number
    donorsTotal: number
    anonymousDonations: number
    ekycVerified: number
    ekycPending: number
    ekycTotal: number
  }
  privacy: {
    organization: { legalName: string; email: string | null; phone: string | null; website: string | null } | null
    taxExempt: boolean
    lhdnRef: string | null
    lhdnExpiry: string | null
    lhdnExpired: boolean
  }
  security: {
    activeUsers: number
    recentSecurityEvents: {
      id: string
      action: string
      method: string | null
      status: string
      user: { name: string; role: string } | null
      ipAddress: string | null
      createdAt: string
    }[]
  }
  checklist: {
    items: { item: string; description: string; status: string }[]
    completed: number
    total: number
    score: number
  }
  overallScore: number
}

interface Branch {
  id: string
  name: string
  code: string
  address: string | null
  city: string | null
  state: string | null
  phone: string | null
  email: string | null
  headName: string | null
  headPhone: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface BranchData {
  branches: Branch[]
  total: number
  activeCount: number
  inactiveCount: number
  stateGroups: Record<string, number>
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const monthlyOptions = [
  'Januari 2026', 'Februari 2026', 'Mac 2026', 'April 2026', 'Mei 2026', 'Jun 2026',
  'Julai 2026', 'Ogos 2026', 'September 2026', 'Oktober 2026', 'November 2026', 'Disember 2026',
]

const quarterlyOptions = ['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026']
const yearlyOptions = ['2024', '2025', '2026']

const incomeByFundData = [
  { name: 'Zakat', amount: 52300, color: '#16a34a' },
  { name: 'Sadaqah', amount: 28700, color: '#ca8a04' },
  { name: 'Waqf', amount: 18400, color: '#0d9488' },
  { name: 'Infaq', amount: 31200, color: '#9333ea' },
  { name: 'Sumbangan Am', amount: 19800, color: '#dc2626' },
]

const expenditureByProgrammeData = [
  { programme: 'Program Makanan Rakyat', spent: 28500, budget: 35000 },
  { programme: 'Bantuan Pendidikan', spent: 22100, budget: 25000 },
  { programme: 'Penjagaan Warga Emas', spent: 19800, budget: 22000 },
  { programme: 'Pembangunan Komuniti', spent: 15600, budget: 20000 },
  { programme: 'Bantuan Kecemasan', spent: 12400, budget: 15000 },
  { programme: 'Program Kesihatan', spent: 11200, budget: 15000 },
  { programme: 'Kemuskilan & Kebajikan', spent: 6800, budget: 10000 },
  { programme: 'Pentadbiran & Operasi', spent: 3600, budget: 8000 },
]

const incomeVsExpenditureData = [
  { month: 'Jan', pendapatan: 9800, perbelanjaan: 7200 },
  { month: 'Feb', pendapatan: 11200, perbelanjaan: 8500 },
  { month: 'Mac', pendapatan: 14500, perbelanjaan: 9800 },
  { month: 'Apr', pendapatan: 10800, perbelanjaan: 10200 },
  { month: 'Mei', pendapatan: 13600, perbelanjaan: 11400 },
  { month: 'Jun', pendapatan: 12900, perbelanjaan: 10800 },
  { month: 'Jul', pendapatan: 15200, perbelanjaan: 12300 },
  { month: 'Ogo', pendapatan: 14100, perbelanjaan: 11600 },
  { month: 'Sep', pendapatan: 16800, perbelanjaan: 13200 },
  { month: 'Okt', pendapatan: 13400, perbelanjaan: 11900 },
  { month: 'Nov', pendapatan: 11200, perbelanjaan: 10500 },
  { month: 'Dis', pendapatan: 15700, perbelanjaan: 12700 },
]

type VerificationStatus = 'Disahkan' | 'Lapor Sendiri' | 'Belum Disahkan'

interface ImpactMetric {
  id: number
  metrik: string
  nilaiLaporSendiri: string
  nilaiDisahkan: string
  sumberPengesahan: string
  status: VerificationStatus
}

const impactMetrics: ImpactMetric[] = [
  { id: 1, metrik: 'Peserta Dibantu', nilaiLaporSendiri: '3,450 orang', nilaiDisahkan: '3,280 orang', sumberPengesahan: 'Audit Dalaman Q2 2026', status: 'Disahkan' },
  { id: 2, metrik: 'Keluarga Terbantu', nilaiLaporSendiri: '820 keluarga', nilaiDisahkan: '790 keluarga', sumberPengesahan: 'Pemeriksa Lapangan', status: 'Disahkan' },
  { id: 3, metrik: 'Makanan Diedarkan', nilaiLaporSendiri: '52,000 hidangan', nilaiDisahkan: '—', sumberPengesahan: '—', status: 'Lapor Sendiri' },
  { id: 4, metrik: 'Pelajar Menerima Bantuan', nilaiLaporSendiri: '1,200 orang', nilaiDisahkan: '1,180 orang', sumberPengesahan: 'Senarai Semak Sekolah', status: 'Disahkan' },
  { id: 5, metrik: 'Warga Emas Dijaga', nilaiLaporSendiri: '340 orang', nilaiDisahkan: '—', sumberPengesahan: '—', status: 'Belum Disahkan' },
  { id: 6, metrik: 'Program Kesihatan Dijalankan', nilaiLaporSendiri: '48 sesi', nilaiDisahkan: '45 sesi', sumberPengesahan: 'Laporan Rakan Kongsi KKM', status: 'Disahkan' },
  { id: 7, metrik: 'Bantuan Kecemasan Diberikan', nilaiLaporSendiri: '156 kes', nilaiDisahkan: '—', sumberPengesahan: '—', status: 'Lapor Sendiri' },
  { id: 8, metrik: 'Sukarelawan Aktif', nilaiLaporSendiri: '285 orang', nilaiDisahkan: '—', sumberPengesahan: '—', status: 'Belum Disahkan' },
]

// ─── Formatting Helpers ──────────────────────────────────────────────────────

function formatRinggit(amount: number): string {
  return new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ─── Status Badge Component ──────────────────────────────────────────────────

function StatusBadge({ status }: { status: VerificationStatus }) {
  const config: Record<VerificationStatus, { variant: 'default' | 'secondary' | 'outline'; className: string; icon: React.ReactNode }> = {
    Disahkan: { variant: 'default', className: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
    'Lapor Sendiri': { variant: 'secondary', className: 'bg-primary/20 text-primary border-primary/30', icon: <Clock className="h-3 w-3 mr-1" /> },
    'Belum Disahkan': { variant: 'outline', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: <AlertCircle className="h-3 w-3 mr-1" /> },
  }
  const c = config[status]
  return <Badge variant={c.variant} className={`${c.className} text-xs font-medium border`}>{c.icon}{status}</Badge>
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function RinggitTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg">
      <p className="mb-1 text-sm font-semibold text-foreground">{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>{entry.name}: {formatRinggit(entry.value)}</p>
      ))}
    </div>
  )
}

function CountTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg">
      <p className="mb-1 text-sm font-semibold text-foreground">{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>{entry.name}: {entry.value}</p>
      ))}
    </div>
  )
}

// ─── Stat Card Component ─────────────────────────────────────────────────────

function StatCard({ title, value, subtitle, icon, color }: { title: string; value: string; subtitle?: string; icon: React.ReactNode; color: string }) {
  const isPrimary = color.includes('primary') || color.includes('purple')
  const isCyan = color.includes('cyan') || color.includes('teal') || color.includes('emerald')
  const isRed = color.includes('red') || color.includes('destructive')
  
  const barColor = isPrimary ? 'bg-primary' : isCyan ? 'bg-cyan-400' : isRed ? 'bg-destructive' : 'bg-slate-500'

  return (
    <Card className="relative overflow-hidden bg-card backdrop-blur-xl border-white/10 shadow-xl shadow-black/20">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
          <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
          {subtitle && <div className="mt-2 flex items-center text-xs text-muted-foreground">{subtitle}</div>}
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10">
          {icon}
        </div>
      </CardContent>
      <div className={`absolute bottom-0 left-0 h-1 w-full ${barColor}`} />
    </Card>
  )
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function LoadingCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="border-0 shadow-sm"><CardContent className="p-5"><Skeleton className="h-28 w-full rounded-lg" /></CardContent></Card>
      ))}
    </div>
  )
}

// ─── Tab 1: Existing Financial Reports (kept intact) ────────────────────────

function FinancialImpakTab() {
  const [periodTab, setPeriodTab] = useState('bulanan')
  const [selectedPeriod, setSelectedPeriod] = useState('Jun 2026')

  const periodOptions = useMemo(() => {
    switch (periodTab) {
      case 'bulanan': return monthlyOptions
      case 'suku-tahunan': return quarterlyOptions
      case 'tahunan': return yearlyOptions
      default: return monthlyOptions
    }
  }, [periodTab])

  const totalIncome = incomeByFundData.reduce((sum, d) => sum + d.amount, 0)
  const totalExpenditure = expenditureByProgrammeData.reduce((sum, d) => sum + d.spent, 0)
  const netBalance = totalIncome - totalExpenditure
  const isBalancePositive = netBalance >= 0
  const verifiedCount = impactMetrics.filter((m) => m.status === 'Disahkan').length
  const verificationLevel = Math.round((verifiedCount / impactMetrics.length) * 100)
  const totalBudget = expenditureByProgrammeData.reduce((sum, d) => sum + d.budget, 0)
  const totalSpent = expenditureByProgrammeData.reduce((sum, d) => sum + d.spent, 0)
  const budgetUtilization = Math.round((totalSpent / totalBudget) * 100)

  return (
    <div className="space-y-8">
      {/* Period Selector */}
      <Card className="border-white/10 bg-card backdrop-blur-xl shadow-xl">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Tabs value={periodTab} onValueChange={(v) => { setPeriodTab(v); const d: Record<string, string> = { bulanan: 'Jun 2026', 'suku-tahunan': 'Q2 2026', tahunan: '2026' }; setSelectedPeriod(d[v] || 'Jun 2026') }} className="w-full sm:w-auto">
              <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-grid bg-white/5 border border-white/10">
                <TabsTrigger value="bulanan" className="text-sm data-[state=active]:bg-primary data-[state=active]:text-white">Bulanan</TabsTrigger>
                <TabsTrigger value="suku-tahunan" className="text-sm data-[state=active]:bg-primary data-[state=active]:text-white">Suku Tahunan</TabsTrigger>
                <TabsTrigger value="tahunan" className="text-sm data-[state=active]:bg-primary data-[state=active]:text-white">Tahunan</TabsTrigger>
              </TabsList>
            </Tabs>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-full sm:w-[200px] bg-white/5 border-white/10 text-foreground"><SelectValue placeholder="Pilih tempoh" /></SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10 text-slate-200">
                {periodOptions.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Jumlah Pendapatan" value={formatRinggit(totalIncome)} subtitle="+12.5% vs tempoh lepas" icon={<TrendingUp className="h-6 w-6 text-cyan-400" />} color="text-cyan-400" />
        <StatCard title="Jumlah Perbelanjaan" value={formatRinggit(totalExpenditure)} subtitle="+8.2% vs tempoh lepas" icon={<TrendingDown className="h-6 w-6 text-destructive" />} color="text-destructive" />
        <StatCard title="Baki Bersih" value={formatRinggit(netBalance)} subtitle={isBalancePositive ? 'Surplus sihat' : 'Defisit'} icon={<DollarSign className={`h-6 w-6 ${isBalancePositive ? 'text-cyan-400' : 'text-destructive'}`} />} color={isBalancePositive ? 'text-cyan-400' : 'text-destructive'} />
        <StatCard title="Tahap Pengesahan" value={`${verificationLevel}%`} subtitle={`${verifiedCount}/${impactMetrics.length} metrik disahkan`} icon={<ShieldCheck className="h-6 w-6 text-primary" />} color="text-primary" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-white/10 bg-card backdrop-blur-xl shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground">Pendapatan Mengikut Jenis Dana</CardTitle>
            <CardDescription className="text-muted-foreground">Agihan pendapatan berdasarkan sumber dana ISF</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[240px] sm:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incomeByFundData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<RinggitTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="amount" name="Jumlah (RM)" radius={[6, 6, 0, 0]} maxBarSize={52}>
                    {incomeByFundData.map((entry, index) => (
                      <Cell key={index} fill={entry.name === 'Zakat' ? '#ecb2ff' : entry.name === 'Sadaqah' ? '#00fbfb' : entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-card backdrop-blur-xl shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground">Trend Pendapatan vs Perbelanjaan</CardTitle>
            <CardDescription className="text-muted-foreground">Perbandingan bulanan 12 bulan terkini</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[240px] sm:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={incomeVsExpenditureData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="pendapatanGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00fbfb" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#00fbfb" stopOpacity={0.01} />
                    </linearGradient>
                    <linearGradient id="perbelanjaanGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ecb2ff" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ecb2ff" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<RinggitTooltip />} />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                  <Area type="monotone" dataKey="pendapatan" name="Pendapatan" stroke="#00fbfb" strokeWidth={2.5} fill="url(#pendapatanGradient)" dot={{ r: 3, fill: '#00fbfb' }} activeDot={{ r: 5 }} />
                  <Area type="monotone" dataKey="perbelanjaan" name="Perbelanjaan" stroke="#ecb2ff" strokeWidth={2.5} fill="url(#perbelanjaanGradient)" dot={{ r: 3, fill: '#ecb2ff' }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expenditure by Programme */}
      <Card className="border-0 shadow-sm"><CardHeader className="pb-2"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle className="text-base font-semibold">Perbelanjaan Mengikut Program</CardTitle><CardDescription>Peruntukan bajet digunakan — keseluruhan {budgetUtilization}% ({formatRinggit(totalSpent)} / {formatRinggit(totalBudget)})</CardDescription></div></div></CardHeader><CardContent><div className="space-y-4">{expenditureByProgrammeData.map((item) => { const pct = Math.round((item.spent / item.budget) * 100); const barColor = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'; return (<div key={item.programme}><div className="mb-1.5 flex items-center justify-between"><span className="text-sm font-medium text-gray-700">{item.programme}</span><div className="flex items-center gap-2 text-xs text-gray-500"><span>{formatRinggit(item.spent)}</span><span className="text-gray-300">/</span><span>{formatRinggit(item.budget)}</span><Badge variant="outline" className={`ml-1 text-[10px] px-1.5 py-0 ${pct >= 90 ? 'border-red-200 text-red-600' : pct >= 70 ? 'border-amber-200 text-amber-600' : 'border-emerald-200 text-emerald-600'}`}>{pct}%</Badge></div></div><div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100"><div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} /></div></div>) })}</div></CardContent></Card>

      {/* Impact Metrics Table */}
      <Card className="border-0 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Metrik Impak — Lapor Sendiri vs Disahkan</CardTitle><CardDescription>Perbandingan data yang dilaporkan sendiri dengan data yang telah disahkan oleh pihak berkuasa</CardDescription></CardHeader><CardContent><div className="overflow-x-auto rounded-lg border"><Table><TableHeader><TableRow className="bg-gray-50/80"><TableHead className="min-w-[200px] font-semibold text-gray-700">Metrik</TableHead><TableHead className="font-semibold text-gray-700">Nilai Lapor Sendiri</TableHead><TableHead className="font-semibold text-gray-700">Nilai Disahkan</TableHead><TableHead className="min-w-[180px] font-semibold text-gray-700">Sumber Pengesahan</TableHead><TableHead className="font-semibold text-gray-700 text-center">Status</TableHead></TableRow></TableHeader><TableBody>{impactMetrics.map((metric) => (<TableRow key={metric.id} className="hover:bg-gray-50/50"><TableCell className="font-medium text-gray-800">{metric.metrik}</TableCell><TableCell className="text-gray-600">{metric.nilaiLaporSendiri}</TableCell><TableCell>{metric.nilaiDisahkan === '—' ? <span className="text-gray-400 italic">—</span> : <span className="font-medium text-gray-800">{metric.nilaiDisahkan}</span>}</TableCell><TableCell className="text-sm text-gray-500">{metric.sumberPengesahan === '—' ? <span className="text-gray-400 italic">Menunggu pengesahan</span> : metric.sumberPengesahan}</TableCell><TableCell className="text-center"><StatusBadge status={metric.status} /></TableCell></TableRow>))}</TableBody></Table></div><div className="mt-4 flex flex-wrap gap-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-500"><div className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /><span><strong className="text-gray-700">{verifiedCount}</strong> Disahkan</span></div><div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-amber-500" /><span><strong className="text-gray-700">{impactMetrics.filter((m) => m.status === 'Lapor Sendiri').length}</strong> Lapor Sendiri</span></div><div className="flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5 text-gray-400" /><span><strong className="text-gray-700">{impactMetrics.filter((m) => m.status === 'Belum Disahkan').length}</strong> Belum Disahkan</span></div></div></CardContent></Card>

      {/* Export Section */}
      <Card className="border-0 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Eksport Laporan</CardTitle><CardDescription>Muat turun atau cetak laporan kewangan dalam format yang dikehendaki</CardDescription></CardHeader><CardContent><div className="flex flex-wrap gap-3"><Button className="gap-2 bg-emerald-600 hover:bg-emerald-700"><FileDown className="h-4 w-4" />Muat Turun PDF</Button><Button variant="outline" className="gap-2"><FileSpreadsheet className="h-4 w-4" />Eksport CSV</Button><Button variant="outline" className="gap-2"><Printer className="h-4 w-4" />Cetak Laporan</Button></div></CardContent></Card>
    </div>
  )
}

// ─── Tab 2: Ringkasan Kewangan (Live API) ────────────────────────────────────

const ISF_COLORS: Record<string, string> = { zakat: '#16a34a', sadaqah: '#ca8a04', waqf: '#0d9488', infaq: '#9333ea', donation_general: '#dc2626' }
const ISF_LABELS: Record<string, string> = { zakat: 'Zakat', sadaqah: 'Sadaqah', waqf: 'Waqf', infaq: 'Infaq', donation_general: 'Sumbangan Am' }

function FinancialSummaryTab() {
  const [data, setData] = useState<FinancialReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('yearly')
  const [year, setYear] = useState(new Date().getFullYear())

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get<FinancialReport>('/reports/financial', { period, year })
      setData(res)
    } catch {
      toast.error('Gagal memuatkan laporan kewangan')
    } finally {
      setLoading(false)
    }
  }, [period, year])

  useEffect(() => { fetchData() }, [fetchData])

  const isfChartData = useMemo(() => {
    if (!data) return []
    return Object.entries(data.isfBreakdown).map(([key, val]) => ({
      name: ISF_LABELS[key] || key,
      amount: val.amount,
      color: ISF_COLORS[key] || '#6b7280',
    }))
  }, [data])

  const disbursementPieData = useMemo(() => {
    if (!data) return []
    return Object.entries(data.disbursementsByStatus).map(([key, val]) => ({
      name: key,
      value: val.amount,
      count: val.count,
    }))
  }, [data])

  if (loading && !data) return <div className="space-y-6"><LoadingCards /><Card className="border-0 shadow-sm"><CardContent className="p-8"><div className="flex items-center justify-center gap-3 text-gray-500"><RefreshCw className="h-5 w-5 animate-spin" />Memuatkan data...</div></CardContent></Card></div>

  if (!data) return <Card className="border-0 shadow-sm"><CardContent className="p-8"><div className="text-center text-gray-500">Tiada data tersedia</div></CardContent></Card>

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="border-0 bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-full sm:w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Bulanan</SelectItem>
                  <SelectItem value="quarterly">Suku Tahunan</SelectItem>
                  <SelectItem value="yearly">Tahunan</SelectItem>
                </SelectContent>
              </Select>
              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger className="w-full sm:w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-2">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />Muat Semula
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Jumlah Derma" value={formatRinggit(data.totalDonations)} subtitle={`${data.incomeStatement.donationCount} transaksi`} icon={<DollarSign className="h-6 w-6 text-emerald-600" />} color="text-emerald-600" />
        <StatCard title="Jumlah Pembayaran" value={formatRinggit(data.totalDisbursements)} subtitle={`${data.incomeStatement.disbursementCount} transaksi`} icon={<TrendingDown className="h-6 w-6 text-red-600" />} color="text-red-600" />
        <StatCard title="Pendapatan Bersih" value={formatRinggit(data.netIncome)} subtitle={data.netIncome >= 0 ? 'Surplus' : 'Defisit'} icon={<DollarSign className={`h-6 w-6 ${data.netIncome >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />} color={data.netIncome >= 0 ? 'text-emerald-600' : 'text-red-600'} />
        <StatCard title="Program Aktif" value={String(data.budgetVsActual.filter((p) => p.status === 'active').length)} subtitle={`${data.budgetVsActual.length} jumlah program`} icon={<FileText className="h-6 w-6 text-purple-600" />} color="text-purple-600" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ISF Segregation Bar Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Pemisahan Dana ISF</CardTitle>
            <CardDescription>Agihan derma mengikut jenis dana (Zakat, Sadaqah, Waqf, Infaq, Am)</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[220px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={isfChartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<RinggitTooltip />} />
                  <Bar dataKey="amount" name="Jumlah (RM)" radius={[6, 6, 0, 0]} maxBarSize={52}>
                    {isfChartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Period Trend */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Trend Pendapatan vs Perbelanjaan</CardTitle>
            <CardDescription>Perbandingan mengikut {period === 'monthly' ? 'bulan' : period === 'quarterly' ? 'suku tahun' : 'tahun'} {year}</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[220px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                {data.periodBreakdown.length > 2 ? (
                  <LineChart data={data.periodBreakdown} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<RinggitTooltip />} />
                    <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="income" name="Pendapatan" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 3, fill: '#16a34a' }} />
                    <Line type="monotone" dataKey="expenditure" name="Perbelanjaan" stroke="#dc2626" strokeWidth={2.5} dot={{ r: 3, fill: '#dc2626' }} />
                  </LineChart>
                ) : (
                  <BarChart data={data.periodBreakdown} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<RinggitTooltip />} />
                    <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="income" name="Pendapatan" fill="#16a34a" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenditure" name="Perbelanjaan" fill="#dc2626" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget vs Actual Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Bajet vs Sebenar Mengikut Program</CardTitle>
          <CardDescription>Perbandingan peruntukan bajet dengan perbelanjaan sebenar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="font-semibold text-gray-700">Program</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">Bajet (RM)</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">Sebenar (RM)</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">Varian (RM)</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-center">Penggunaan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.budgetVsActual.map((p) => (
                  <TableRow key={p.programmeId} className="hover:bg-gray-50/50">
                    <TableCell className="font-medium text-gray-800">{p.programmeName}</TableCell>
                    <TableCell className="text-right text-gray-600">{formatRinggit(p.budget)}</TableCell>
                    <TableCell className="text-right text-gray-800">{formatRinggit(p.actual)}</TableCell>
                    <TableCell className={`text-right font-medium ${p.variance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {p.variance >= 0 ? '+' : ''}{formatRinggit(p.variance)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`text-[10px] px-2 py-0 ${p.utilization >= 90 ? 'border-red-200 text-red-600' : p.utilization >= 70 ? 'border-amber-200 text-amber-600' : 'border-emerald-200 text-emerald-600'}`}>
                        {p.utilization}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Tab 3: Audit Trail ──────────────────────────────────────────────────────

function AuditTrailTab() {
  const [data, setData] = useState<AuditData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ action: '', entity: '', startDate: '', endDate: '' })
  const [page, setPage] = useState(1)

  const fetchData = useCallback(async (p: number = 1) => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page: p, pageSize: 15 }
      if (filters.action) params.action = filters.action
      if (filters.entity) params.entity = filters.entity
      if (filters.startDate) params.startDate = filters.startDate
      if (filters.endDate) params.endDate = filters.endDate
      const res = await api.get<AuditData>('/audit', params)
      setData(res)
      setPage(p)
    } catch {
      toast.error('Gagal memuatkan log audit')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchData() }, [fetchData])

  const handleExport = async () => {
    try {
      const params: Record<string, string | number> = { export: 'true' }
      if (filters.action) params.action = filters.action
      if (filters.entity) params.entity = filters.entity
      const res = await api.get<{ records: Record<string, string>[] }>('/audit', params)
      const csv = [
        Object.keys(res.records[0]).join(','),
        ...res.records.map((r) => Object.values(r).join(','))
      ].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`; a.click()
      URL.revokeObjectURL(url)
      toast.success('Log audit dieksport')
    } catch {
      toast.error('Gagal mengeksport log audit')
    }
  }

  const actionChartData = useMemo(() => {
    if (!data) return []
    return data.summary.actionSummary.slice(0, 8).map((a) => ({ name: a.action, count: a.count }))
  }, [data])

  const entityChartData = useMemo(() => {
    if (!data) return []
    return data.summary.entitySummary.map((e) => ({ name: e.entity, count: e.count }))
  }, [data])

  const ENTITY_COLORS = ['#16a34a', '#ca8a04', '#0d9488', '#9333ea', '#dc2626', '#2563eb', '#d97706', '#7c3aed']

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-0 bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
              <div><Label className="text-xs text-gray-500 mb-1 block">Tindakan</Label><Input placeholder="cth: create, login" value={filters.action} onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))} /></div>
              <div><Label className="text-xs text-gray-500 mb-1 block">Entiti</Label><Input placeholder="cth: Member, Case" value={filters.entity} onChange={(e) => setFilters((f) => ({ ...f, entity: e.target.value }))} /></div>
              <div><Label className="text-xs text-gray-500 mb-1 block">Dari Tarikh</Label><Input type="date" value={filters.startDate} onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))} /></div>
              <div><Label className="text-xs text-gray-500 mb-1 block">Hingga Tarikh</Label><Input type="date" value={filters.endDate} onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))} /></div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => fetchData(1)} className="gap-2"><Search className="h-3.5 w-3.5" />Cari</Button>
              <Button size="sm" variant="outline" onClick={handleExport} className="gap-2"><Download className="h-3.5 w-3.5" />Eksport</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && !data ? (
        <div className="space-y-4"><LoadingCards /><Skeleton className="h-96 w-full rounded-lg" /></div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Jumlah Log" value={String(data.total)} subtitle={`${data.totalPages} halaman`} icon={<FileText className="h-6 w-6 text-gray-600" />} color="text-gray-900" />
            <StatCard title="Jenis Tindakan" value={String(data.summary.actionSummary.length)} subtitle="Kategori unik" icon={<Activity className="h-6 w-6 text-purple-600" />} color="text-purple-600" />
            <StatCard title="Entiti Dijejak" value={String(data.summary.entitySummary.length)} subtitle="Jenis rekod" icon={<Database className="h-6 w-6 text-teal-600" />} color="text-teal-600" />
            <StatCard title="Pengguna Aktif" value={String(data.summary.activeUsers.length)} subtitle="5 teratas" icon={<Users className="h-6 w-6 text-amber-600" />} color="text-amber-600" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Log Mengikut Tindakan</CardTitle></CardHeader>
              <CardContent><div className="h-[280px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={actionChartData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} /><YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} width={80} /><Tooltip content={<CountTooltip />} /><Bar dataKey="count" name="Bilangan" fill="#8b5cf6" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div></CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Log Mengikut Entiti</CardTitle></CardHeader>
              <CardContent><div className="h-[280px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={entityChartData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} /><YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} width={80} /><Tooltip content={<CountTooltip />} /><Bar dataKey="count" name="Bilangan" fill="#0d9488" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div></CardContent>
            </Card>
          </div>

          {/* Audit Log Table */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Log Audit Terkini</CardTitle><CardDescription>Semua aktiviti pengguna dicatat dan boleh dieksport</CardDescription></CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-gray-50 z-10">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-700 min-w-[160px]">Tarikh/Masa</TableHead>
                      <TableHead className="font-semibold text-gray-700">Pengguna</TableHead>
                      <TableHead className="font-semibold text-gray-700">Tindakan</TableHead>
                      <TableHead className="font-semibold text-gray-700">Entiti</TableHead>
                      <TableHead className="font-semibold text-gray-700">ID Entiti</TableHead>
                      <TableHead className="font-semibold text-gray-700">IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.logs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-gray-50/50">
                        <TableCell className="text-xs text-gray-600 whitespace-nowrap">{formatDateTime(log.createdAt)}</TableCell>
                        <TableCell><div><p className="text-sm font-medium text-gray-800">{log.user?.name || 'Sistem'}</p><p className="text-xs text-gray-400">{log.user?.role || '-'}</p></div></TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{log.action}</Badge></TableCell>
                        <TableCell className="text-sm text-gray-600">{log.entity}</TableCell>
                        <TableCell className="text-xs text-gray-400 font-mono">{log.entityId ? log.entityId.slice(0, 8) + '...' : '-'}</TableCell>
                        <TableCell className="text-xs text-gray-400">{log.ipAddress || '-'}</TableCell>
                      </TableRow>
                    ))}
                    {data.logs.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-gray-400 py-8">Tiada log dijumpai</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-gray-500">Halaman {data.page} daripada {data.totalPages} ({data.total} rekod)</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={data.page <= 1} onClick={() => fetchData(data.page - 1)} className="gap-1"><ChevronLeft className="h-3.5 w-3.5" />Sebelum</Button>
                  <Button variant="outline" size="sm" disabled={data.page >= data.totalPages} onClick={() => fetchData(data.page + 1)} className="gap-1">Seterusnya<ChevronRight className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}

// ─── Tab 4: Pematuhan ROS ────────────────────────────────────────────────────

function ROSComplianceTab() {
  const [data, setData] = useState<ROSData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<ROSData>('/compliance/ros').then(setData).catch(() => toast.error('Gagal memuatkan data ROS')).finally(() => setLoading(false))
  }, [])

  if (loading && !data) return <div className="space-y-6"><LoadingCards /><Skeleton className="h-64 w-full rounded-lg" /></div>
  if (!data) return <Card className="border-0 shadow-sm"><CardContent className="p-8"><div className="text-center text-gray-500">Tiada data tersedia</div></CardContent></Card>

  const checklistChartData = [
    { name: 'Siap', value: data.checklist.completed, fill: '#16a34a' },
    { name: 'Belum Siap', value: data.checklist.pending, fill: '#e5e7eb' },
  ]

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Skor Keseluruhan" value={`${data.overallScore}%`} subtitle={`${data.checklist.completed}/${data.checklist.total} item`} icon={<ShieldCheck className={`h-6 w-6 ${data.overallScore >= 70 ? 'text-emerald-600' : 'text-amber-600'}`} />} color={data.overallScore >= 70 ? 'text-emerald-600' : 'text-amber-600'} />
        <StatCard title="Ahli Jawatankuasa" value={String(data.committee.totalCurrent)} subtitle={`${data.committee.nearExpiry.length} hampir tamat tempoh`} icon={<Users className="h-6 w-6 text-purple-600" />} color="text-purple-600" />
        <StatCard title="Status AGM" value={data.agm.overdue ? 'Lewat' : data.agm.scheduled ? 'Dijadualkan' : 'Menunggu'} subtitle={`Tarikh had: ${formatDate(data.agm.dueDate)}`} icon={<Calendar className="h-6 w-6 text-red-600" />} color={data.agm.overdue ? 'text-red-600' : 'text-gray-900'} />
        <StatCard title="Pemfailan Tahunan" value={data.annualReturn.filed ? 'Telah Difail' : 'Belum Difail'} subtitle={`${data.annualReturn.filingItems.length} item`} icon={<FileText className={`h-6 w-6 ${data.annualReturn.filed ? 'text-emerald-600' : 'text-amber-600'}`} />} color={data.annualReturn.filed ? 'text-emerald-600' : 'text-amber-600'} />
      </div>

      {/* Key Dates & AGM Status */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Tarikh Penting</CardTitle>
            <CardDescription>Tarikh luput dan tarikh akhir pemfailan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <div className="flex items-center gap-3"><Calendar className="h-5 w-5 text-gray-400" /><div><p className="text-sm font-medium text-gray-700">AGM Had Terakhir</p><p className="text-xs text-gray-400">Mesyuarat Agung Tahunan</p></div></div>
                <div className="text-right"><p className="text-sm font-semibold text-gray-800">{formatDate(data.agm.dueDate)}</p>{data.agm.overdue && <Badge variant="destructive" className="text-[10px] mt-1">Lewat</Badge>}</div>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <div className="flex items-center gap-3"><Calendar className="h-5 w-5 text-gray-400" /><div><p className="text-sm font-medium text-gray-700">AGM Terakhir Dijalankan</p><p className="text-xs text-gray-400">Tahun terakhir mesyuarat</p></div></div>
                <p className="text-sm font-semibold text-gray-800">{data.agm.lastHeldYear || 'Tidak dicatat'}</p>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <div className="flex items-center gap-3"><FileText className="h-5 w-5 text-gray-400" /><div><p className="text-sm font-medium text-gray-700">Kelulusan LHDN</p><p className="text-xs text-gray-400">Rujukan pelepasan cukai</p></div></div>
                <div className="text-right"><p className="text-sm font-semibold text-gray-800">{data.keyDates.lhdnExpiry ? formatDate(data.keyDates.lhdnExpiry) : '-'}</p>{data.keyDates.lhdnExpired && <Badge variant="destructive" className="text-[10px] mt-1">Luput</Badge>}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Checklist Progress */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Senarai Semak Pematuhan ROS</CardTitle>
            <CardDescription>{data.checklist.completed}/{data.checklist.total} item telah selesai</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={checklistChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" stroke="none"><Cell fill="#16a34a" /><Cell fill="#e5e7eb" /></Pie><Tooltip /><text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="text-2xl font-bold fill-gray-800">{data.overallScore}%</text></PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {data.checklist.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-md p-2 hover:bg-gray-50">
                  <div className="flex items-center gap-2 min-w-0">
                    {item.isCompleted ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> : <AlertCircle className="h-4 w-4 text-gray-300 shrink-0" />}
                    <div className="min-w-0"><p className={`text-sm ${item.isCompleted ? 'text-gray-600' : 'font-medium text-gray-800'}`}>{item.item}</p><p className="text-xs text-gray-400 truncate">{item.description || item.category}</p></div>
                  </div>
                  <Badge variant="outline" className={`ml-2 text-[10px] shrink-0 ${item.isCompleted ? 'border-emerald-200 text-emerald-600' : 'border-gray-200 text-gray-400'}`}>{item.isCompleted ? 'Siap' : 'Belum'}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Committee Members */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Ahli Jawatankuasa Semasa</CardTitle>
          <CardDescription>{data.committee.totalCurrent} ahli aktif · {data.committee.nearExpiry.length} hampir tamat tempoh · {data.committee.expiredTerms.length} tamat tempoh</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader><TableRow className="bg-gray-50/80"><TableHead className="font-semibold text-gray-700">Nama</TableHead><TableHead className="font-semibold text-gray-700">Peranan</TableHead><TableHead className="font-semibold text-gray-700">Dilantik</TableHead><TableHead className="font-semibold text-gray-700">Tamat Tempoh</TableHead><TableHead className="font-semibold text-gray-700 text-center">Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {data.committee.current.map((m) => {
                  const isExpired = m.endDate && new Date(m.endDate) < new Date()
                  const isNear = m.endDate && new Date(m.endDate) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) && !isExpired
                  return (
                    <TableRow key={m.id} className="hover:bg-gray-50/50">
                      <TableCell className="font-medium text-gray-800">{m.name}</TableCell>
                      <TableCell className="text-sm text-gray-600">{m.role}</TableCell>
                      <TableCell className="text-sm text-gray-500">{formatDate(m.appointmentDate)}</TableCell>
                      <TableCell className="text-sm text-gray-500">{formatDate(m.endDate)}</TableCell>
                      <TableCell className="text-center">
                        {isExpired ? <Badge variant="destructive" className="text-[10px]">Tamat</Badge> : isNear ? <Badge className="bg-amber-100 text-amber-800 text-[10px]">Hampir Tamat</Badge> : <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">Aktif</Badge>}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Tab 5: Pematuhan PDPA ───────────────────────────────────────────────────

function PDPAComplianceTab() {
  const [data, setData] = useState<PDPAData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<PDPAData>('/compliance/pdpa').then(setData).catch(() => toast.error('Gagal memuatkan data PDPA')).finally(() => setLoading(false))
  }, [])

  if (loading && !data) return <div className="space-y-6"><LoadingCards /><Skeleton className="h-64 w-full rounded-lg" /></div>
  if (!data) return <Card className="border-0 shadow-sm"><CardContent className="p-8"><div className="text-center text-gray-500">Tiada data tersedia</div></CardContent></Card>

  const retentionPieData = [
    { name: 'Data Peribadi', value: data.dataRetention.personalData.total, fill: '#8b5cf6' },
    { name: 'Data Transaksi', value: data.dataRetention.transactionData.total, fill: '#0d9488' },
    { name: 'Data Sistem', value: data.dataRetention.systemData.total, fill: '#ca8a04' },
  ]

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Skor PDPA" value={`${data.overallScore}%`} subtitle={`${data.checklist.completed}/${data.checklist.total} item`} icon={<Shield className={`h-6 w-6 ${data.overallScore >= 70 ? 'text-emerald-600' : 'text-amber-600'}`} />} color={data.overallScore >= 70 ? 'text-emerald-600' : 'text-amber-600'} />
        <StatCard title="Jumlah Rekod" value={String(data.dataRetention.totalRecords)} subtitle="Semua data disimpan" icon={<Database className="h-6 w-6 text-gray-600" />} color="text-gray-900" />
        <StatCard title="Persetujuan eKYC" value={`${data.consent.ekycVerified}/${data.consent.ekycTotal}`} subtitle={`${data.consent.ekycPending} menunggu`} icon={<Lock className="h-6 w-6 text-teal-600" />} color="text-teal-600" />
        <StatCard title="Pengguna Aktif" value={String(data.security.activeUsers)} subtitle="Dengan akses sistem" icon={<Users className="h-6 w-6 text-purple-600" />} color="text-purple-600" />
      </div>

      {/* Data Retention & Consent */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Ringkasan Penyimpanan Data</CardTitle><CardDescription>Agihan rekod mengikut kategori data</CardDescription></CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={retentionPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" stroke="none">{retentionPieData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}</Pie><Tooltip /><Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} /></PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-purple-50 p-2 text-center"><p className="text-xs text-gray-500">Peribadi</p><p className="text-lg font-bold text-purple-600">{data.dataRetention.personalData.total}</p></div>
              <div className="rounded-lg bg-teal-50 p-2 text-center"><p className="text-xs text-gray-500">Transaksi</p><p className="text-lg font-bold text-teal-600">{data.dataRetention.transactionData.total}</p></div>
              <div className="rounded-lg bg-amber-50 p-2 text-center"><p className="text-xs text-gray-500">Sistem</p><p className="text-lg font-bold text-amber-600">{data.dataRetention.systemData.total}</p></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Rekod Persetujuan</CardTitle><CardDescription>Status persetujuan pemprosesan data</CardDescription></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3"><div className="flex items-center gap-3"><Users className="h-5 w-5 text-gray-400" /><div><p className="text-sm font-medium text-gray-700">Ahli dengan Data Bank</p><p className="text-xs text-gray-400">Data bank disimpan</p></div></div><p className="text-lg font-bold text-gray-800">{data.consent.membersWithBankData}</p></div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3"><div className="flex items-center gap-3"><FileText className="h-5 w-5 text-gray-400" /><div><p className="text-sm font-medium text-gray-700">Derma Boleh Cukai</p><p className="text-xs text-gray-400">Persetujuan penderma</p></div></div><div className="text-right"><p className="text-lg font-bold text-gray-800">{data.consent.donorsWithTaxConsent}</p><p className="text-xs text-gray-400">daripada {data.consent.donorsTotal} derma</p></div></div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3"><div className="flex items-center gap-3"><Eye className="h-5 w-5 text-gray-400" /><div><p className="text-sm font-medium text-gray-700">Derma Anonymous</p><p className="text-xs text-gray-400">Tiada data peribadi</p></div></div><p className="text-lg font-bold text-gray-800">{data.consent.anonymousDonations}</p></div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3"><div className="flex items-center gap-3"><Lock className="h-5 w-5 text-gray-400" /><div><p className="text-sm font-medium text-gray-700">eKYC Disahkan</p><p className="text-xs text-gray-400">{data.consent.ekycPending} menunggu pengesahan</p></div></div><p className="text-lg font-bold text-teal-600">{data.consent.ekycVerified}</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PDPA Checklist */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Senarai Semak Pematuhan PDPA</CardTitle><CardDescription>Memastikan pematuhan Akta Perlindungan Data Peribadi 2010</CardDescription></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.checklist.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  {item.status === 'completed' ? <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> : <Clock className="h-5 w-5 text-gray-300 shrink-0" />}
                  <div><p className="text-sm font-medium text-gray-800">{item.item}</p><p className="text-xs text-gray-500">{item.description}</p></div>
                </div>
                <Badge variant="outline" className={`text-[10px] shrink-0 ${item.status === 'completed' ? 'border-emerald-200 text-emerald-600' : 'border-gray-200 text-gray-400'}`}>{item.status === 'completed' ? 'Siap' : 'Belum'}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Security Events */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Peristiwa Keselamatan Terkini</CardTitle><CardDescription>10 log keselamatan terakhir</CardDescription></CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border max-h-[300px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-gray-50 z-10"><TableRow><TableHead className="font-semibold text-gray-700">Masa</TableHead><TableHead className="font-semibold text-gray-700">Tindakan</TableHead><TableHead className="font-semibold text-gray-700">Kaedah</TableHead><TableHead className="font-semibold text-gray-700">Pengguna</TableHead><TableHead className="font-semibold text-gray-700">Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {data.security.recentSecurityEvents.map((ev) => (
                  <TableRow key={ev.id} className="hover:bg-gray-50/50">
                    <TableCell className="text-xs text-gray-600 whitespace-nowrap">{formatDateTime(ev.createdAt)}</TableCell>
                    <TableCell className="text-sm text-gray-700">{ev.action}</TableCell>
                    <TableCell className="text-xs text-gray-500">{ev.method || '-'}</TableCell>
                    <TableCell className="text-sm text-gray-600">{ev.user?.name || 'Sistem'}</TableCell>
                    <TableCell><Badge variant="outline" className={`text-[10px] ${ev.status === 'success' ? 'border-emerald-200 text-emerald-600' : 'border-red-200 text-red-600'}`}>{ev.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Tab 6: Pengurusan Cawangan ──────────────────────────────────────────────

function BranchManagementTab() {
  const [data, setData] = useState<BranchData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editBranch, setEditBranch] = useState<Branch | null>(null)
  const [form, setForm] = useState({ name: '', code: '', address: '', city: '', state: '', phone: '', email: '', headName: '', headPhone: '', isActive: true })
  const [saving, setSaving] = useState(false)

  const fetchBranches = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get<BranchData>('/branches')
      setData(res)
    } catch {
      toast.error('Gagal memuatkan cawangan')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchBranches() }, [fetchBranches])

  const resetForm = () => setForm({ name: '', code: '', address: '', city: '', state: '', phone: '', email: '', headName: '', headPhone: '', isActive: true })

  const handleCreate = () => {
    setEditBranch(null)
    resetForm()
    setDialogOpen(true)
  }

  const handleEdit = (branch: Branch) => {
    setEditBranch(branch)
    setForm({ name: branch.name, code: branch.code, address: branch.address || '', city: branch.city || '', state: branch.state || '', phone: branch.phone || '', email: branch.email || '', headName: branch.headName || '', headPhone: branch.headPhone || '', isActive: branch.isActive })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.code) { toast.error('Nama dan kod cawangan diperlukan'); return }
    setSaving(true)
    try {
      if (editBranch) {
        await api.put('/branches', { id: editBranch.id, ...form })
        toast.success('Cawangan dikemas kini')
      } else {
        await api.post('/branches', form)
        toast.success('Cawangan dicipta')
      }
      setDialogOpen(false)
      fetchBranches()
    } catch {
      toast.error(editBranch ? 'Gagal mengemas kini cawangan' : 'Gagal mencipta cawangan')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (branch: Branch) => {
    if (!confirm(`Nyahaktifkan cawangan "${branch.name}"?`)) return
    try {
      await api.delete('/branches', { id: branch.id })
      toast.success('Cawangan dinyahaktifkan')
      fetchBranches()
    } catch {
      toast.error('Gagal menyahaktifkan cawangan')
    }
  }

  const stateChartData = useMemo(() => {
    if (!data) return []
    return Object.entries(data.stateGroups).map(([state, count]) => ({ name: state, count }))
  }, [data])

  if (loading && !data) return <div className="space-y-6"><LoadingCards /><Skeleton className="h-64 w-full rounded-lg" /></div>

  return (
    <div className="space-y-6">
      {/* Summary + Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2"><Building2 className="h-5 w-5 text-emerald-600" /><div><p className="text-xs text-gray-500">Aktif</p><p className="text-lg font-bold text-emerald-600">{data?.activeCount || 0}</p></div></div>
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-2"><Building2 className="h-5 w-5 text-gray-400" /><div><p className="text-xs text-gray-500">Tidak Aktif</p><p className="text-lg font-bold text-gray-600">{data?.inactiveCount || 0}</p></div></div>
          <div className="flex items-center gap-2 rounded-lg bg-purple-50 px-4 py-2"><MapPin className="h-5 w-5 text-purple-600" /><div><p className="text-xs text-gray-500">Negeri</p><p className="text-lg font-bold text-purple-600">{data ? Object.keys(data.stateGroups).length : 0}</p></div></div>
        </div>
        <Button onClick={handleCreate} className="gap-2 bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" />Cawangan Baru</Button>
      </div>

      {/* Chart + Table */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="border-0 shadow-sm lg:col-span-1">
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Cawangan Mengikut Negeri</CardTitle></CardHeader>
          <CardContent><div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={stateChartData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} /><YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} width={60} /><Tooltip content={<CountTooltip />} /><Bar dataKey="count" name="Bilangan" fill="#8b5cf6" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div></CardContent>
        </Card>

        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Senarai Cawangan</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-gray-50 z-10">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-700">Cawangan</TableHead>
                    <TableHead className="font-semibold text-gray-700">Kod</TableHead>
                    <TableHead className="font-semibold text-gray-700">Bandar/Negeri</TableHead>
                    <TableHead className="font-semibold text-gray-700">Ketua</TableHead>
                    <TableHead className="font-semibold text-gray-700">Hubungan</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-center">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-center">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.branches.map((b) => (
                    <TableRow key={b.id} className="hover:bg-gray-50/50">
                      <TableCell className="font-medium text-gray-800">{b.name}</TableCell>
                      <TableCell><Badge variant="outline" className="font-mono text-xs">{b.code}</Badge></TableCell>
                      <TableCell className="text-sm text-gray-600">{b.city || '-'}, {b.state || '-'}</TableCell>
                      <TableCell className="text-sm text-gray-600">{b.headName || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {b.phone && <div className="flex items-center gap-1 text-xs text-gray-500"><Phone className="h-3 w-3" />{b.phone}</div>}
                          {b.email && <div className="flex items-center gap-1 text-xs text-gray-500"><Mail className="h-3 w-3" />{b.email}</div>}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`text-[10px] ${b.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{b.isActive ? 'Aktif' : 'Tidak Aktif'}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(b)}><Pencil className="h-3.5 w-3.5 text-gray-500" /></Button>
                          {b.isActive && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeactivate(b)}><Trash2 className="h-3.5 w-3.5 text-red-400" /></Button>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {data?.branches.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-gray-400 py-8">Tiada cawangan</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editBranch ? 'Kemas Kini Cawangan' : 'Cawangan Baru'}</DialogTitle>
            <DialogDescription>{editBranch ? 'Kemas kini maklumat cawangan' : 'Tambah cawangan baru ke sistem'}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Nama Cawangan *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Cawangan KL" /></div>
              <div><Label>Kod Cawangan *</Label><Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="KL" disabled={!!editBranch} /></div>
            </div>
            <div><Label>Alamat</Label><Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Alamat penuh" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Bandar</Label><Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} /></div>
              <div><Label>Negeri</Label><Input value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Telefon</Label><Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
              <div><Label>Emel</Label><Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} type="email" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Nama Ketua</Label><Input value={form.headName} onChange={(e) => setForm((f) => ({ ...f, headName: e.target.value }))} /></div>
              <div><Label>Telefon Ketua</Label><Input value={form.headPhone} onChange={(e) => setForm((f) => ({ ...f, headPhone: e.target.value }))} /></div>
            </div>
            {editBranch && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label>Status Aktif</Label>
                <Switch checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              {saving && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              {editBranch ? 'Kemas Kini' : 'Cipta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [mainTab, setMainTab] = useState('kewangan-impak')

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Pusat Laporan & Pematuhan
          </h1>
          <p className="mt-1 text-gray-500">
            Laporan kewangan, audit trail, pematuhan ROS/PDPA, dan pengurusan cawangan PUSPA
          </p>
        </header>

        {/* Main Tab Navigation */}
        <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="inline-flex h-auto w-max gap-1 rounded-xl bg-white p-1 shadow-sm border">
              <TabsTrigger value="kewangan-impak" className="gap-1.5 rounded-lg px-4 py-2 text-sm data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">Kewangan & Impak</span>
                <span className="sm:hidden">Kewangan</span>
              </TabsTrigger>
              <TabsTrigger value="ringkasan-kewangan" className="gap-1.5 rounded-lg px-4 py-2 text-sm data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Ringkasan Kewangan</span>
                <span className="sm:hidden">Ringkasan</span>
              </TabsTrigger>
              <TabsTrigger value="audit-trail" className="gap-1.5 rounded-lg px-4 py-2 text-sm data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Audit Trail</span>
                <span className="sm:hidden">Audit</span>
              </TabsTrigger>
              <TabsTrigger value="pematuhan-ros" className="gap-1.5 rounded-lg px-4 py-2 text-sm data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                <ShieldCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Pematuhan ROS</span>
                <span className="sm:hidden">ROS</span>
              </TabsTrigger>
              <TabsTrigger value="pematuhan-pdpa" className="gap-1.5 rounded-lg px-4 py-2 text-sm data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                <Lock className="h-4 w-4" />
                <span className="hidden sm:inline">Pematuhan PDPA</span>
                <span className="sm:hidden">PDPA</span>
              </TabsTrigger>
              <TabsTrigger value="cawangan" className="gap-1.5 rounded-lg px-4 py-2 text-sm data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Pengurusan Cawangan</span>
                <span className="sm:hidden">Cawangan</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="kewangan-impak"><FinancialImpakTab /></TabsContent>
          <TabsContent value="ringkasan-kewangan"><FinancialSummaryTab /></TabsContent>
          <TabsContent value="audit-trail"><AuditTrailTab /></TabsContent>
          <TabsContent value="pematuhan-ros"><ROSComplianceTab /></TabsContent>
          <TabsContent value="pematuhan-pdpa"><PDPAComplianceTab /></TabsContent>
          <TabsContent value="cawangan"><BranchManagementTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
