'use client'

import * as React from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, isThisMonth, parseISO } from 'date-fns'
import { ms } from 'date-fns/locale'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Coins,
  CalendarDays,
  Users,
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Download,
  FileText,
  CircleDollarSign,
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  User,
  Mail,
  Phone,
  CreditCard,
  Receipt,
  Building2,
  Smartphone,
  Landmark,
  Loader2,
  PieChart as PieChartIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'

// ─── Types ───────────────────────────────────────────────────────────

type FundType = 'zakat' | 'sadaqah' | 'waqf' | 'infaq' | 'am'
type DonationStatus = 'diterima' | 'menunggu' | 'gagal' | 'dikembalikan'
type PaymentMethod = 'tunai' | 'transfer_bank' | 'dalam_talian' | 'cek' | 'e_wallet'
type ZakatCategory = 'fitrah' | 'harta' | 'pendapatan' | 'perniagaan'
type ZakatAuthority = 'lznk' | 'maips' | 'maik' | 'lain_lain'

interface Donation {
  id: string
  donationNo: string
  donorName: string
  donorIC?: string
  donorEmail?: string
  donorPhone?: string
  amount: number
  fundType: FundType
  status: DonationStatus
  method: PaymentMethod
  date: string
  programme?: string
  programmeName?: string
  receiptNo?: string
  anonymous: boolean
  taxDeductible: boolean
  shariahCompliant: boolean
  notes?: string
  zakatCategory?: ZakatCategory
  zakatAuthority?: ZakatAuthority
}

interface ApiDonation {
  id: string
  donationNumber: string
  donorName: string
  donorIC: string | null
  donorEmail: string | null
  donorPhone: string | null
  amount: number
  fundType: 'zakat' | 'sadaqah' | 'waqf' | 'infaq' | 'donation_general'
  status: 'pending' | 'confirmed' | 'failed' | 'refunded'
  method: 'cash' | 'bank_transfer' | 'online' | 'cheque' | 'ewallet'
  donatedAt: string
  programmeId: string | null
  programme: { id: string; name: string } | null
  receiptNumber: string | null
  isAnonymous: boolean
  isTaxDeductible: boolean
  shariahCompliant: boolean
  notes: string | null
  zakatCategory: ZakatCategory | null
  zakatAuthority: string | null
}

interface ProgrammeRecord {
  id: string
  name: string
}

interface DonationFormData {
  donorName: string
  donorIC: string
  donorEmail: string
  donorPhone: string
  amount: number
  fundType: FundType
  status: DonationStatus
  method: PaymentMethod
  date: string
  programme: string
  receiptNo: string
  anonymous: boolean
  taxDeductible: boolean
  shariahCompliant: boolean
  notes: string
  zakatCategory: ZakatCategory
  zakatAuthority: ZakatAuthority
}

// ─── Constants ───────────────────────────────────────────────────────

const FUND_TYPE_CONFIG: Record<FundType, { label: string; color: string; bgClass: string }> = {
  zakat: { label: 'Zakat', color: '#ecb2ff', bgClass: 'bg-primary/10 text-primary border-primary/20' },
  sadaqah: { label: 'Sadaqah', color: '#00fbfb', bgClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  waqf: { label: 'Waqf', color: '#3b82f6', bgClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  infaq: { label: 'Infaq', color: '#f472b6', bgClass: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
  am: { label: 'Sumbangan Am', color: '#94a3b8', bgClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
}

const STATUS_CONFIG: Record<DonationStatus, { label: string; color: string; bgClass: string; icon: React.ElementType }> = {
  diterima: { label: 'Diterima', color: '#34d399', bgClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
  menunggu: { label: 'Menunggu', color: '#fbbf24', bgClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock },
  gagal: { label: 'Gagal', color: '#f87171', bgClass: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle },
  dikembalikan: { label: 'Dikembalikan', color: '#94a3b8', bgClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: RotateCcw },
}

const METHOD_CONFIG: Record<PaymentMethod, { label: string; icon: React.ElementType }> = {
  tunai: { label: 'Tunai', icon: Coins },
  transfer_bank: { label: 'Transfer Bank', icon: Landmark },
  dalam_talian: { label: 'Dalam Talian', icon: CreditCard },
  cek: { label: 'Cek', icon: FileText },
  e_wallet: { label: 'E-Wallet', icon: Smartphone },
}

const ZAKAT_CATEGORY_OPTIONS = [
  { value: 'fitrah', label: 'Zakat Fitrah' },
  { value: 'harta', label: 'Zakat Harta' },
  { value: 'pendapatan', label: 'Zakat Pendapatan' },
  { value: 'perniagaan', label: 'Zakat Perniagaan' },
]

const ZAKAT_AUTHORITY_OPTIONS = [
  { value: 'lznk', label: 'LZNK' },
  { value: 'maips', label: 'MAIPS' },
  { value: 'maik', label: 'MAIK' },
  { value: 'lain_lain', label: 'Lain-lain' },
]

const EMPTY_PROGRAMME_OPTION = { value: '', label: 'Tiada Program' }

const ITEMS_PER_PAGE = 8

// ─── Zod Schema ──────────────────────────────────────────────────────

const donationFormSchema = z.object({
  donorName: z.string().min(1, 'Nama penderma diperlukan'),
  donorIC: z.string().optional().default(''),
  donorEmail: z.string().email('E-mel tidak sah').optional().default('').or(z.literal('')),
  donorPhone: z.string().optional().default(''),
  amount: z.coerce.number().min(1, 'Jumlah mesti lebih dari RM 1'),
  fundType: z.enum(['zakat', 'sadaqah', 'waqf', 'infaq', 'am'] as const),
  status: z.enum(['diterima', 'menunggu', 'gagal', 'dikembalikan'] as const),
  method: z.enum(['tunai', 'transfer_bank', 'dalam_talian', 'cek', 'e_wallet'] as const),
  date: z.string().min(1, 'Tarikh diperlukan'),
  programme: z.string().optional().default(''),
  receiptNo: z.string().optional().default(''),
  anonymous: z.boolean().optional().default(false),
  taxDeductible: z.boolean().optional().default(false),
  shariahCompliant: z.boolean().optional().default(true),
  notes: z.string().optional().default(''),
  zakatCategory: z.enum(['fitrah', 'harta', 'pendapatan', 'perniagaan'] as const).optional().default('fitrah'),
  zakatAuthority: z.enum(['lznk', 'maips', 'maik', 'lain_lain'] as const).optional().default('lznk'),
})

type DonationFormValues = z.infer<typeof donationFormSchema>

// ─── Helper Functions ────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return `RM ${amount.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy', { locale: ms })
  } catch {
    return dateStr
  }
}

function getFundTypeBadge(fundType: FundType) {
  const config = FUND_TYPE_CONFIG[fundType]
  return (
    <Badge variant="outline" className={cn('font-medium border-0', config.bgClass)}>
      {config.label}
    </Badge>
  )
}

function getStatusBadge(status: DonationStatus) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon
  return (
    <Badge variant="outline" className={cn('font-medium gap-1 border-0', config.bgClass)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}

function mapApiFundTypeToUi(fundType: ApiDonation['fundType']): FundType {
  return fundType === 'donation_general' ? 'am' : fundType
}

function mapUiFundTypeToApi(fundType: FundType): ApiDonation['fundType'] {
  return fundType === 'am' ? 'donation_general' : fundType
}

function mapApiStatusToUi(status: ApiDonation['status']): DonationStatus {
  switch (status) {
    case 'confirmed':
      return 'diterima'
    case 'failed':
      return 'gagal'
    case 'refunded':
      return 'dikembalikan'
    default:
      return 'menunggu'
  }
}

function mapUiStatusToApi(status: DonationStatus): ApiDonation['status'] {
  switch (status) {
    case 'diterima':
      return 'confirmed'
    case 'gagal':
      return 'failed'
    case 'dikembalikan':
      return 'refunded'
    default:
      return 'pending'
  }
}

function mapApiMethodToUi(method: ApiDonation['method']): PaymentMethod {
  switch (method) {
    case 'bank_transfer':
      return 'transfer_bank'
    case 'online':
      return 'dalam_talian'
    case 'cheque':
      return 'cek'
    case 'ewallet':
      return 'e_wallet'
    default:
      return 'tunai'
  }
}

function mapUiMethodToApi(method: PaymentMethod): ApiDonation['method'] {
  switch (method) {
    case 'transfer_bank':
      return 'bank_transfer'
    case 'dalam_talian':
      return 'online'
    case 'cek':
      return 'cheque'
    case 'e_wallet':
      return 'ewallet'
    default:
      return 'cash'
  }
}

function mapApiDonationToUi(donation: ApiDonation): Donation {
  return {
    id: donation.id,
    donationNo: donation.donationNumber,
    donorName: donation.donorName,
    donorIC: donation.donorIC || undefined,
    donorEmail: donation.donorEmail || undefined,
    donorPhone: donation.donorPhone || undefined,
    amount: donation.amount,
    fundType: mapApiFundTypeToUi(donation.fundType),
    status: mapApiStatusToUi(donation.status),
    method: mapApiMethodToUi(donation.method),
    date: donation.donatedAt,
    programme: donation.programmeId || undefined,
    programmeName: donation.programme?.name || undefined,
    receiptNo: donation.receiptNumber || undefined,
    anonymous: donation.isAnonymous,
    taxDeductible: donation.isTaxDeductible,
    shariahCompliant: donation.shariahCompliant,
    notes: donation.notes || undefined,
    zakatCategory: donation.zakatCategory || undefined,
    zakatAuthority: donation.zakatAuthority === 'lznk' || donation.zakatAuthority === 'maips' || donation.zakatAuthority === 'maik' || donation.zakatAuthority === 'lain_lain'
      ? donation.zakatAuthority
      : undefined,
  }
}

// ─── Custom Tooltip for Chart ────────────────────────────────────────

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: { fill: string } }>
}

function ChartCustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-lg">
      <div className="flex items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.payload.fill }} />
        <span className="font-medium">{FUND_TYPE_CONFIG[item.name as FundType]?.label ?? item.name}</span>
      </div>
      <div className="mt-1 font-mono font-semibold">{formatCurrency(item.value)}</div>
    </div>
  )
}

// ─── Custom Donut Center Label ───────────────────────────────────────

interface CenterLabelProps {
  total: number
}

function DonutCenterLabel({ total }: CenterLabelProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
      <span className="text-xs text-muted-foreground">Jumlah Keseluruhan</span>
      <span className="text-lg font-bold">{formatCurrency(total)}</span>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────

export default function DonationsPage() {
  // State
  const [donations, setDonations] = React.useState<Donation[]>([])
  const [searchQuery, setSearchQuery] = React.useState('')
  const [filterStatus, setFilterStatus] = React.useState<string>('semua')
  const [filterFundType, setFilterFundType] = React.useState<string>('semua')
  const [filterMethod, setFilterMethod] = React.useState<string>('semua')
  const [currentPage, setCurrentPage] = React.useState(1)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [editingDonation, setEditingDonation] = React.useState<Donation | null>(null)
  const [viewingDonation, setViewingDonation] = React.useState<Donation | null>(null)
  const [sortField, setSortField] = React.useState<'date' | 'amount' | 'donorName'>('date')
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('desc')
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [programmeOptions, setProgrammeOptions] = React.useState([EMPTY_PROGRAMME_OPTION])

  // Form
  const form = useForm<DonationFormValues>({
    resolver: zodResolver(donationFormSchema) as any,
    defaultValues: {
      donorName: '',
      donorIC: '',
      donorEmail: '',
      donorPhone: '',
      amount: 0,
      fundType: 'am',
      status: 'menunggu',
      method: 'tunai',
      date: new Date().toISOString().split('T')[0],
      programme: '',
      receiptNo: '',
      anonymous: false,
      taxDeductible: false,
      shariahCompliant: true,
      notes: '',
      zakatCategory: 'fitrah',
      zakatAuthority: 'lznk',
    },
  })

  const watchedFundType = useWatch({
    control: form.control,
    name: 'fundType',
  })

  const fetchDonations = React.useCallback(async () => {

    setLoading(true)
    try {
      const response = await api.getEnvelope<ApiDonation[]>('/donations', { page: 1, pageSize: 1000 })
      setDonations((response.data || []).map(mapApiDonationToUi))
    } catch (error) {
      console.error('Error fetching donations:', error)
      toast.error('Gagal memuatkan rekod donasi')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchProgrammes = React.useCallback(async () => {
    try {
      const response = await api.getEnvelope<ProgrammeRecord[]>('/programmes', { page: 1, pageSize: 200 })
      const options = (response.data || []).map((programme) => ({
        value: programme.id,
        label: programme.name,
      }))
      setProgrammeOptions([EMPTY_PROGRAMME_OPTION, ...options])
    } catch (error) {
      console.error('Error fetching programmes:', error)
      setProgrammeOptions([EMPTY_PROGRAMME_OPTION])
    }
  }, [])

  React.useEffect(() => {
    void fetchDonations()
    void fetchProgrammes()
  }, [fetchDonations, fetchProgrammes])

  // ─── Computed Data ─────────────────────────────────────────────────

  const confirmedDonations = donations.filter(d => d.status === 'diterima')
  const grandTotal = donations.reduce((sum, d) => sum + d.amount, 0)
  const thisMonthTotal = donations
    .filter(d => {
      try { return isThisMonth(parseISO(d.date)) } catch { return false }
    })
    .reduce((sum, d) => sum + d.amount, 0)
  const uniqueDonors = new Set(donations.map(d => d.donorName)).size

  // ISF breakdown
  const isfBreakdown = React.useMemo(() => {
    const breakdown: Record<FundType, number> = { zakat: 0, sadaqah: 0, waqf: 0, infaq: 0, am: 0 }
    confirmedDonations.forEach(d => {
      breakdown[d.fundType] += d.amount
    })
    return (Object.keys(breakdown) as FundType[])
      .filter(key => breakdown[key] > 0)
      .map(key => ({
        name: key,
        value: breakdown[key],
        fill: FUND_TYPE_CONFIG[key].color,
      }))
  }, [confirmedDonations])

  // Filtered donations
  const filteredDonations = React.useMemo(() => {
    let result = [...donations]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(d => d.donorName.toLowerCase().includes(q))
    }
    if (filterStatus !== 'semua') {
      result = result.filter(d => d.status === filterStatus)
    }
    if (filterFundType !== 'semua') {
      result = result.filter(d => d.fundType === filterFundType)
    }
    if (filterMethod !== 'semua') {
      result = result.filter(d => d.method === filterMethod)
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0
      if (sortField === 'date') cmp = a.date.localeCompare(b.date)
      else if (sortField === 'amount') cmp = a.amount - b.amount
      else cmp = a.donorName.localeCompare(b.donorName)
      return sortDir === 'desc' ? -cmp : cmp
    })

    return result
  }, [donations, searchQuery, filterStatus, filterFundType, filterMethod, sortField, sortDir])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredDonations.length / ITEMS_PER_PAGE))
  const paginatedDonations = filteredDonations.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterStatus, filterFundType, filterMethod])

  // ─── Handlers ──────────────────────────────────────────────────────

  function handleSort(field: 'date' | 'amount' | 'donorName') {
    if (sortField === field) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  function handleCreate() {
    setEditingDonation(null)
    form.reset({
      donorName: '',
      donorIC: '',
      donorEmail: '',
      donorPhone: '',
      amount: 0,
      fundType: 'am',
      status: 'menunggu',
      method: 'tunai',
      date: new Date().toISOString().split('T')[0],
      programme: '',
      receiptNo: '',
      anonymous: false,
      taxDeductible: false,
      shariahCompliant: true,
      notes: '',
      zakatCategory: 'fitrah',
      zakatAuthority: 'lznk',
    })
    setDialogOpen(true)
  }

  function handleEdit(donation: Donation) {
    setEditingDonation(donation)
    form.reset({
      donorName: donation.donorName,
      donorIC: donation.donorIC ?? '',
      donorEmail: donation.donorEmail ?? '',
      donorPhone: donation.donorPhone ?? '',
      amount: donation.amount,
      fundType: donation.fundType,
      status: donation.status,
      method: donation.method,
      date: donation.date,
      programme: donation.programme ?? '',
      receiptNo: donation.receiptNo ?? '',
      anonymous: donation.anonymous,
      taxDeductible: donation.taxDeductible,
      shariahCompliant: donation.shariahCompliant,
      notes: donation.notes ?? '',
      zakatCategory: donation.zakatCategory ?? 'fitrah',
      zakatAuthority: donation.zakatAuthority ?? 'lznk',
    })
    setDialogOpen(true)
  }

  function handleView(donation: Donation) {
    setViewingDonation(donation)
    setSheetOpen(true)
  }

  async function handleDelete(donation: Donation) {
    try {
      await api.delete('/donations', { id: donation.id })
      if (viewingDonation?.id === donation.id) {
        setViewingDonation(null)
        setSheetOpen(false)
      }
      await fetchDonations()
      toast.success('Donasi berjaya dipadam')
    } catch (error) {
      console.error('Error deleting donation:', error)
      toast.error('Gagal memadam donasi')
    }
  }

  async function onSubmit(data: DonationFormValues) {
    const payload = {
      donorName: data.anonymous ? 'Penderma Tanpa Nama' : data.donorName,
      donorIC: data.donorIC || undefined,
      donorEmail: data.donorEmail || undefined,
      donorPhone: data.donorPhone || undefined,
      amount: data.amount,
      fundType: mapUiFundTypeToApi(data.fundType),
      status: mapUiStatusToApi(data.status),
      method: mapUiMethodToApi(data.method),
      donatedAt: data.date,
      programmeId: data.programme || undefined,
      receiptNumber: data.receiptNo || undefined,
      isAnonymous: data.anonymous,
      isTaxDeductible: data.taxDeductible,
      shariahCompliant: data.shariahCompliant,
      notes: data.notes || undefined,
      zakatCategory: data.fundType === 'zakat' ? data.zakatCategory : undefined,
      zakatAuthority: data.fundType === 'zakat' ? data.zakatAuthority : undefined,
    }

    setSubmitting(true)
    try {
      if (editingDonation) {
        await api.put('/donations', { id: editingDonation.id, ...payload })
        toast.success('Donasi berjaya dikemaskini')
      } else {
        await api.post('/donations', payload)
        toast.success('Donasi berjaya dicipta')
      }
      setDialogOpen(false)
      setEditingDonation(null)
      await fetchDonations()
    } catch (error) {
      console.error('Error saving donation:', error)
      toast.error('Gagal menyimpan donasi')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Modul Donasi PUSPA
            </h1>
            <p className="text-muted-foreground mt-1">
              Pengurusan donasi dengan pemisahan ISF (Islamic Social Finance)
            </p>
          </div>
          <Button onClick={handleCreate} size="lg" className="gap-2 shrink-0 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all active:scale-95" disabled={loading}>
            <Plus className="h-4 w-4" />
            Donasi Baharu
          </Button>
        </div>

        {/* ─── Summary Cards ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Total Donations */}
          <Card className="relative overflow-hidden bg-card backdrop-blur-xl border-white/10 shadow-xl shadow-black/20">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Jumlah Donasi</p>
                  <p className="text-2xl font-bold">{formatCurrency(grandTotal)}</p>
                  <p className="text-xs text-muted-foreground">{donations.length} rekod</p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/20">
                  <CircleDollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-primary to-purple-600" />
          </Card>

          {/* This Month */}
          <Card className="relative overflow-hidden bg-card backdrop-blur-xl border-white/10 shadow-xl shadow-black/20">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Bulan Ini</p>
                  <p className="text-2xl font-bold">{formatCurrency(thisMonthTotal)}</p>
                  <p className="text-xs text-muted-foreground">
                    {donations.filter(d => {
                      try { return isThisMonth(parseISO(d.date)) } catch { return false }
                    }).length} rekod bulan ini
                  </p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20">
                  <CalendarDays className="h-6 w-6 text-cyan-400" />
                </div>
              </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-cyan-400 to-cyan-600" />
          </Card>

          {/* Total Donors */}
          <Card className="relative overflow-hidden bg-card backdrop-blur-xl border-white/10 shadow-xl shadow-black/20">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Jumlah Penderma</p>
                  <p className="text-2xl font-bold">{uniqueDonors}</p>
                  <p className="text-xs text-muted-foreground">
                    {donations.filter(d => d.anonymous).length} penderma tanpa nama
                  </p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20">
                  <Users className="h-6 w-6 text-indigo-400" />
                </div>
              </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-indigo-400 to-indigo-600" />
          </Card>

          {/* ISF Breakdown */}
          <Card className="relative overflow-hidden bg-card backdrop-blur-xl border-white/10 shadow-xl shadow-black/20">
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pink-500/20">
                    <ShieldCheck className="h-4 w-4 text-pink-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pecahan ISF</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(FUND_TYPE_CONFIG) as FundType[]).map(ft => {
                    const total = confirmedDonations
                      .filter(d => d.fundType === ft)
                      .reduce((s, d) => s + d.amount, 0)
                    if (total === 0) return null
                    return (
                      <Badge
                        key={ft}
                        variant="outline"
                        className={cn('text-xs gap-1 border-white/10', FUND_TYPE_CONFIG[ft].bgClass)}
                      >
                        <div
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: FUND_TYPE_CONFIG[ft].color }}
                        />
                        {FUND_TYPE_CONFIG[ft].label} {formatCurrency(total)}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-pink-400 to-pink-600" />
          </Card>
        </div>

        {/* ─── ISF Fund Breakdown Chart ────────────────────────────── */}
        <Card className="border border-white/10 shadow-2xl bg-white/5 backdrop-blur-2xl rounded-3xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-purple-400" />
              Pecahan Dana ISF
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 sm:flex-row pb-6">
            <div className="relative h-[200px] w-[200px] shrink-0 sm:h-[240px] sm:w-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={isfBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="rgba(255,255,255,0.05)"
                  >
                    {isfBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartCustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <DonutCenterLabel total={confirmedDonations.reduce((s, d) => s + d.amount, 0)} />
            </div>
            <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:grid-cols-1">
              {isfBreakdown.map(item => {
                const total = confirmedDonations.reduce((s, d) => s + d.amount, 0)
                const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'
                return (
                  <div key={item.name} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 p-3 hover:bg-white/10 transition-colors">
                    <div
                      className="h-4 w-4 shrink-0 rounded-full"
                      style={{ backgroundColor: item.fill, boxShadow: `0 0 10px ${item.fill}80` }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {FUND_TYPE_CONFIG[item.name as FundType]?.label}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {formatCurrency(item.value)} ({pct}%)
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* ─── Filter Bar ──────────────────────────────────────────── */}
        <Card className="border border-white/10 shadow-2xl bg-white/5 backdrop-blur-2xl rounded-3xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-medium">Carian & Penapis</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari nama penderma..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Status filter */}
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Status</SelectItem>
                  <SelectItem value="diterima">Diterima</SelectItem>
                  <SelectItem value="menunggu">Menunggu</SelectItem>
                  <SelectItem value="gagal">Gagal</SelectItem>
                  <SelectItem value="dikembalikan">Dikembalikan</SelectItem>
                </SelectContent>
              </Select>

              {/* Fund type filter */}
              <Select value={filterFundType} onValueChange={setFilterFundType}>
                <SelectTrigger>
                  <SelectValue placeholder="Jenis Dana" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Jenis Dana</SelectItem>
                  <SelectItem value="zakat">Zakat</SelectItem>
                  <SelectItem value="sadaqah">Sadaqah</SelectItem>
                  <SelectItem value="waqf">Waqf</SelectItem>
                  <SelectItem value="infaq">Infaq</SelectItem>
                  <SelectItem value="am">Sumbangan Am</SelectItem>
                </SelectContent>
              </Select>

              {/* Method filter */}
              <Select value={filterMethod} onValueChange={setFilterMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Kaedah" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Kaedah</SelectItem>
                  <SelectItem value="tunai">Tunai</SelectItem>
                  <SelectItem value="transfer_bank">Transfer Bank</SelectItem>
                  <SelectItem value="dalam_talian">Dalam Talian</SelectItem>
                  <SelectItem value="cek">Cek</SelectItem>
                  <SelectItem value="e_wallet">E-Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* ─── Desktop Data Table ──────────────────────────────────── */}
        <Card className="hidden md:block border border-white/10 shadow-2xl bg-white/5 backdrop-blur-2xl rounded-3xl overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">No. Donasi</TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" className="gap-1 -ml-3 h-8 font-medium" onClick={() => handleSort('donorName')}>
                        Penderma
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button variant="ghost" size="sm" className="gap-1 -mr-3 h-8 font-medium" onClick={() => handleSort('amount')}>
                        Jumlah (RM)
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>Jenis Dana</TableHead>
                    <TableHead>Kaedah</TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" className="gap-1 -ml-3 h-8 font-medium" onClick={() => handleSort('date')}>
                        Tarikh
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDonations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                        {loading ? 'Memuatkan rekod donasi...' : 'Tiada rekod donasi dijumpai'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedDonations.map((donation) => {
                      const MethodIcon = METHOD_CONFIG[donation.method].icon
                      return (
                        <TableRow key={donation.id} className="group">
                          <TableCell className="font-mono text-xs">{donation.donationNo}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium">
                                {donation.anonymous ? (
                                  <span className="italic text-muted-foreground">Penderma Tanpa Nama</span>
                                ) : (
                                  donation.donorName
                                )}
                              </span>
                              {donation.taxDeductible && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                  Boleh ditolak cukai
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(donation.amount)}
                          </TableCell>
                          <TableCell>{getFundTypeBadge(donation.fundType)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <MethodIcon className="h-3.5 w-3.5" />
                              {METHOD_CONFIG[donation.method].label}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{formatDate(donation.date)}</TableCell>
                          <TableCell>{getStatusBadge(donation.status)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleView(donation)} className="gap-2">
                                  <Eye className="h-4 w-4" /> Lihat Butiran
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEdit(donation)} className="gap-2">
                                  <Pencil className="h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDelete(donation)} className="gap-2 text-destructive focus:text-destructive">
                                  <Trash2 className="h-4 w-4" /> Padam
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Menunjukkan {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredDonations.length)} daripada {filteredDonations.length} rekod
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={page === currentPage ? 'default' : 'outline'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Mobile Cards ────────────────────────────────────────── */}
        <div className="space-y-3 md:hidden">
          {paginatedDonations.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32 text-muted-foreground">
                {loading ? 'Memuatkan rekod donasi...' : 'Tiada rekod donasi dijumpai'}
              </CardContent>
            </Card>
          ) : (
            paginatedDonations.map((donation) => {
              const MethodIcon = METHOD_CONFIG[donation.method].icon
              return (
                <Card key={donation.id} className="overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-xs text-muted-foreground">{donation.donationNo}</p>
                        <p className="font-semibold truncate mt-0.5">
                          {donation.anonymous ? (
                            <span className="italic text-muted-foreground">Penderma Tanpa Nama</span>
                          ) : (
                            donation.donorName
                          )}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold">{formatCurrency(donation.amount)}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {getFundTypeBadge(donation.fundType)}
                      {getStatusBadge(donation.status)}
                      {donation.taxDeductible && (
                        <Badge variant="outline" className="gap-1 text-xs bg-emerald-50 text-emerald-700 border-0 dark:bg-emerald-900/30 dark:text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" />
                          Cukai
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MethodIcon className="h-3.5 w-3.5" />
                        {METHOD_CONFIG[donation.method].label}
                      </div>
                      <span>{formatDate(donation.date)}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="flex-1 gap-1 h-8 text-xs" onClick={() => handleView(donation)}>
                        <Eye className="h-3 w-3" /> Lihat
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 gap-1 h-8 text-xs" onClick={() => handleEdit(donation)}>
                        <Pencil className="h-3 w-3" /> Edit
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(donation)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}

          {/* Mobile Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Create/Edit Dialog ───────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingDonation ? 'Edit Donasi' : 'Donasi Baharu'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Donor Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Maklumat Penderma
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="donorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Penderma *</FormLabel>
                        <FormControl>
                          <Input placeholder="Masukkan nama penderma" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="donorIC"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>No. Kad Pengenalan</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 850101-01-5123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="donorEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mel</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="penderma@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="donorPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>No. Telefon</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 012-3456789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Donation Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Butiran Donasi
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jumlah (RM) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fundType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jenis Dana *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih jenis dana" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="zakat">Zakat</SelectItem>
                            <SelectItem value="sadaqah">Sadaqah</SelectItem>
                            <SelectItem value="waqf">Waqf</SelectItem>
                            <SelectItem value="infaq">Infaq</SelectItem>
                            <SelectItem value="am">Sumbangan Am</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Zakat-specific fields */}
                  {watchedFundType === 'zakat' && (
                    <>
                      <FormField
                        control={form.control}
                        name="zakatCategory"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kategori Zakat</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih kategori" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {ZAKAT_CATEGORY_OPTIONS.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="zakatAuthority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Autoriti Zakat</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih autoriti" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {ZAKAT_AUTHORITY_OPTIONS.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <FormField
                    control={form.control}
                    name="method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kaedah Pembayaran *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih kaedah" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="tunai">Tunai</SelectItem>
                            <SelectItem value="transfer_bank">Transfer Bank</SelectItem>
                            <SelectItem value="dalam_talian">Dalam Talian</SelectItem>
                            <SelectItem value="cek">Cek</SelectItem>
                            <SelectItem value="e_wallet">E-Wallet</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="diterima">Diterima</SelectItem>
                            <SelectItem value="menunggu">Menunggu</SelectItem>
                            <SelectItem value="gagal">Gagal</SelectItem>
                            <SelectItem value="dikembalikan">Dikembalikan</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tarikh Donasi</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="programme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Program</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih program" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {programmeOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="receiptNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>No. Resit</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. RCP-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catatan</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Catatan tambahan (pilihan)"
                          className="min-h-[80px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Toggles */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Tetapan Tambahan
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="shariahCompliant"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-medium">Patuh Syariah</FormLabel>
                          <p className="text-xs text-muted-foreground">Pengesahan pematuhan</p>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="anonymous"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-medium">Tanpa Nama</FormLabel>
                          <p className="text-xs text-muted-foreground">Sembunyikan identiti</p>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="taxDeductible"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-medium">Tolak Cukai</FormLabel>
                          <p className="text-xs text-muted-foreground">Boleh ditolak cukai</p>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingDonation ? 'Simpan Perubahan' : 'Cipta Donasi'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ─── View Donation Sheet ──────────────────────────────────── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Butiran Donasi</SheetTitle>
          </SheetHeader>
          {viewingDonation && (
            <div className="mt-6 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-sm text-muted-foreground">
                    {viewingDonation.donationNo}
                  </p>
                  <h2 className="text-xl font-bold mt-1">
                    {formatCurrency(viewingDonation.amount)}
                  </h2>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(viewingDonation.status)}
                  {getFundTypeBadge(viewingDonation.fundType)}
                </div>
              </div>

              <Separator />

              {/* Donor Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Maklumat Penderma
                </h3>
                <div className="space-y-2.5 rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <User className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium">
                        {viewingDonation.anonymous ? 'Penderma Tanpa Nama' : viewingDonation.donorName}
                      </p>
                      {viewingDonation.donorIC && (
                        <p className="text-xs text-muted-foreground">IC: {viewingDonation.donorIC}</p>
                      )}
                    </div>
                  </div>
                  {viewingDonation.donorEmail && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                      <p className="text-sm">{viewingDonation.donorEmail}</p>
                    </div>
                  )}
                  {viewingDonation.donorPhone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <p className="text-sm">{viewingDonation.donorPhone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Donation Details */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Butiran Donasi
                </h3>
                <div className="rounded-lg border divide-y">
                  <div className="flex items-center justify-between p-3">
                    <span className="text-sm text-muted-foreground">Kaedah Pembayaran</span>
                    <span className="text-sm font-medium flex items-center gap-1.5">
                      {React.createElement(METHOD_CONFIG[viewingDonation.method].icon, { className: 'h-3.5 w-3.5' })}
                      {METHOD_CONFIG[viewingDonation.method].label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3">
                    <span className="text-sm text-muted-foreground">Tarikh</span>
                    <span className="text-sm font-medium">{formatDate(viewingDonation.date)}</span>
                  </div>
                  {viewingDonation.programme && (
                    <div className="flex items-center justify-between p-3">
                      <span className="text-sm text-muted-foreground">Program</span>
                      <span className="text-sm font-medium">
                        {viewingDonation.programmeName || programmeOptions.find(p => p.value === viewingDonation.programme)?.label || viewingDonation.programme}
                      </span>
                    </div>
                  )}
                  {viewingDonation.receiptNo && (
                    <div className="flex items-center justify-between p-3">
                      <span className="text-sm text-muted-foreground">No. Resit</span>
                      <span className="text-sm font-mono font-medium">{viewingDonation.receiptNo}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Zakat Details */}
              {viewingDonation.fundType === 'zakat' && viewingDonation.zakatCategory && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Butiran Zakat
                  </h3>
                  <div className="rounded-lg border divide-y">
                    <div className="flex items-center justify-between p-3">
                      <span className="text-sm text-muted-foreground">Kategori Zakat</span>
                      <span className="text-sm font-medium">
                        {ZAKAT_CATEGORY_OPTIONS.find(c => c.value === viewingDonation.zakatCategory)?.label}
                      </span>
                    </div>
                    {viewingDonation.zakatAuthority && (
                      <div className="flex items-center justify-between p-3">
                        <span className="text-sm text-muted-foreground">Autoriti Zakat</span>
                        <span className="text-sm font-medium">
                          {ZAKAT_AUTHORITY_OPTIONS.find(a => a.value === viewingDonation.zakatAuthority)?.label}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Flags */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Status Tambahan
                </h3>
                <div className="flex flex-wrap gap-2">
                  {viewingDonation.shariahCompliant && (
                    <Badge className="gap-1 bg-emerald-100 text-emerald-800 border-0 dark:bg-emerald-900/40 dark:text-emerald-300">
                      <ShieldCheck className="h-3 w-3" /> Patuh Syariah
                    </Badge>
                  )}
                  {viewingDonation.taxDeductible && (
                    <Badge className="gap-1 bg-blue-100 text-blue-800 border-0 dark:bg-blue-900/40 dark:text-blue-300">
                      <CheckCircle2 className="h-3 w-3" /> Boleh Tolak Cukai
                    </Badge>
                  )}
                  {viewingDonation.anonymous && (
                    <Badge className="gap-1 bg-gray-100 text-gray-800 border-0 dark:bg-gray-900/40 dark:text-gray-300">
                      <User className="h-3 w-3" /> Tanpa Nama
                    </Badge>
                  )}
                </div>
              </div>

              {/* Notes */}
              {viewingDonation.notes && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Catatan
                  </h3>
                  <div className="rounded-lg border p-3">
                    <p className="text-sm">{viewingDonation.notes}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <Separator />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => {
                    setSheetOpen(false)
                    handleEdit(viewingDonation)
                  }}
                >
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
                <Button variant="outline" className="flex-1 gap-2">
                  <Download className="h-4 w-4" /> Muat Turun Resit
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
