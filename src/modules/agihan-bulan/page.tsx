'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, isThisMonth, parseISO } from 'date-fns'
import { ms } from 'date-fns/locale'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Package,
  Users,
  MapPin,
  DollarSign,
  CalendarDays,
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  UserCheck,
  Home,
  Phone,
  FileText,
  RotateCcw,
  Warehouse,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  History,
  PackageCheck,
} from 'lucide-react'

// ─── Brand Color ──────────────────────────────────────────────────────
const BRAND_COLOR = '#4B0082'

// ─── Types ───────────────────────────────────────────────────────────

type Kawasan = 'cheras' | 'ampang' | 'gombak' | 'hulu_langat' | 'petaling' | 'klang' | 'sepang' | 'kuala_selangor'
type KategoriAsnaf = 'fakir' | 'miskin' | 'amil' | 'muallaf' | 'gharim' | 'fisabillillah' | 'ibnus_sabil' | 'riqab'
type DistributionStatus = 'dibahagi' | 'dalam_proses' | 'menunggu_kelulusan' | 'gagal'
type DeliveryMethod = 'hantar_sendiri' | 'urus_kurier' | 'ambil_sendiri'

type StockMovementType = 'masuk' | 'keluar' | 'pelarasan'
type StockSource = 'derma' | 'pembelian' | 'pindahan' | 'pelarasan'

interface StapleItem {
  id: string
  label: string
}

interface Distribution {
  id: string
  refNo: string
  namaAsnaf: string
  noKP: string
  noTelefon: string
  alamat: string
  kawasan: Kawasan
  kategori: KategoriAsnaf
  bilTanggungan: number
  makananRuji: string[]
  catatan: string
  kaedahPenghantaran: DeliveryMethod
  status: DistributionStatus
  date: string
  expenditure: number
}

interface DistributionFormData {
  namaAsnaf: string
  noKP: string
  noTelefon: string
  alamat: string
  kawasan: Kawasan
  kategori: KategoriAsnaf
  bilTanggungan: number
  makananRuji: string[]
  catatan: string
  kaedahPenghantaran: DeliveryMethod
  status: DistributionStatus
  date: string
}

interface StockItem {
  id: string
  name: string
  unit: string
  currentStock: number
  minLevel: number
  unitPrice: number
}

interface StockMovement {
  id: string
  refNo: string
  itemId: string
  itemName: string
  type: StockMovementType
  quantity: number
  source: StockSource
  date: string
  reference: string
  notes: string
  previousStock: number
  newStock: number
}

interface StockInFormData {
  itemId: string
  quantity: number
  source: StockSource
  date: string
  reference: string
  notes: string
}

// ─── Constants ───────────────────────────────────────────────────────

const KAWASAN_CONFIG: Record<Kawasan, { label: string }> = {
  cheras: { label: 'Cheras' },
  ampang: { label: 'Ampang' },
  gombak: { label: 'Gombak' },
  hulu_langat: { label: 'Hulu Langat' },
  petaling: { label: 'Petaling' },
  klang: { label: 'Klang' },
  sepang: { label: 'Sepang' },
  kuala_selangor: { label: 'Kuala Selangor' },
}

const KATEGORI_CONFIG: Record<KategoriAsnaf, { label: string; color: string; bgClass: string }> = {
  fakir: { label: 'Fakir', color: '#94a3b8', bgClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  miskin: { label: 'Miskin', color: '#f87171', bgClass: 'bg-red-500/10 text-red-400 border-red-500/20' },
  amil: { label: 'Amil', color: BRAND_COLOR, bgClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  muallaf: { label: 'Muallaf', color: '#34d399', bgClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  gharim: { label: 'Gharim', color: '#fbbf24', bgClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  fisabillillah: { label: 'Fisabillillah', color: '#60a5fa', bgClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  ibnus_sabil: { label: 'Ibnus Sabil', color: '#a78bfa', bgClass: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  riqab: { label: 'Riqab', color: '#22d3ee', bgClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
}

const STATUS_CONFIG: Record<DistributionStatus, { label: string; color: string; bgClass: string; icon: React.ElementType }> = {
  dibahagi: { label: 'Dibahagi', color: '#34d399', bgClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
  dalam_proses: { label: 'Dalam Proses', color: '#fbbf24', bgClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock },
  menunggu_kelulusan: { label: 'Menunggu Kelulusan', color: '#60a5fa', bgClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: RotateCcw },
  gagal: { label: 'Gagal', color: '#f87171', bgClass: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle },
}

const DELIVERY_CONFIG: Record<DeliveryMethod, { label: string; icon: React.ElementType }> = {
  hantar_sendiri: { label: 'Hantar Sendiri', icon: Truck },
  urus_kurier: { label: 'Urus Kurier', icon: Package },
  ambil_sendiri: { label: 'Ambil Sendiri', icon: UserCheck },
}

const MAKANAN_RUJI_ITEMS: StapleItem[] = [
  { id: 'beras', label: 'Beras (Rice)' },
  { id: 'minyak_masak', label: 'Minyak Masak (Cooking Oil)' },
  { id: 'gula', label: 'Gula (Sugar)' },
  { id: 'tepung', label: 'Tepung (Flour)' },
  { id: 'mie_spaghetti', label: 'Mie/Spaghetti' },
  { id: 'kacang_kekacang', label: 'Kacang/Kekacang (Beans/Legumes)' },
  { id: 'susu', label: 'Susu (Milk)' },
  { id: 'telur', label: 'Telur (Eggs)' },
]

const ITEMS_PER_PAGE = 8
const STOCK_MOVEMENTS_PER_PAGE = 8

// ─── Stock Inventory Constants ───────────────────────────────────────

const STOCK_ITEMS: StockItem[] = [
  { id: 'beras', name: 'Beras', unit: 'kg', currentStock: 350, minLevel: 100, unitPrice: 3.50 },
  { id: 'minyak_masak', name: 'Minyak Masak', unit: 'botol', currentStock: 85, minLevel: 30, unitPrice: 8.00 },
  { id: 'gula', name: 'Gula', unit: 'kg', currentStock: 120, minLevel: 50, unitPrice: 3.20 },
  { id: 'tepung', name: 'Tepung', unit: 'kg', currentStock: 95, minLevel: 40, unitPrice: 2.80 },
  { id: 'mie_spaghetti', name: 'Mie/Spaghetti', unit: 'kotak', currentStock: 60, minLevel: 25, unitPrice: 5.50 },
  { id: 'kacang_kekacang', name: 'Kacang/Kekacang', unit: 'kg', currentStock: 40, minLevel: 20, unitPrice: 10.00 },
  { id: 'susu', name: 'Susu', unit: 'kotak', currentStock: 70, minLevel: 30, unitPrice: 7.50 },
  { id: 'telur', name: 'Telur', unit: 'tray', currentStock: 45, minLevel: 20, unitPrice: 12.00 },
]

const STOCK_SOURCE_CONFIG: Record<StockSource, { label: string; bgClass: string }> = {
  derma: { label: 'Derma', bgClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  pembelian: { label: 'Pembelian', bgClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  pindahan: { label: 'Pindahan', bgClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  pelarasan: { label: 'Pelarasan', bgClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
}

// ─── Initial Data (empty — populated from API) ──────────────────────────

const INITIAL_DISTRIBUTIONS: Distribution[] = []
const INITIAL_STOCK_MOVEMENTS: StockMovement[] = []

// ─── Zod Schema ──────────────────────────────────────────────────────

const distributionFormSchema = z.object({
  namaAsnaf: z.string().min(1, 'Nama asnaf diperlukan'),
  noKP: z.string().min(1, 'No. KP diperlukan'),
  noTelefon: z.string().optional().default(''),
  alamat: z.string().optional().default(''),
  kawasan: z.enum([
    'cheras', 'ampang', 'gombak', 'hulu_langat', 'petaling', 'klang', 'sepang', 'kuala_selangor',
  ] as const),
  kategori: z.enum([
    'fakir', 'miskin', 'amil', 'muallaf', 'gharim', 'fisabillillah', 'ibnus_sabil', 'riqab',
  ] as const),
  bilTanggungan: z.coerce.number().min(0, 'Bilangan tidak boleh negatif').max(20, 'Maksimum 20 tanggungan'),
  makananRuji: z.array(z.string()).min(1, 'Sekurang-kurangnya satu item makanan ruji perlu dipilih'),
  catatan: z.string().optional().default(''),
  kaedahPenghantaran: z.enum(['hantar_sendiri', 'urus_kurier', 'ambil_sendiri'] as const),
  status: z.enum(['dibahagi', 'dalam_proses', 'menunggu_kelulusan', 'gagal'] as const),
  date: z.string().min(1, 'Tarikh diperlukan'),
})

type DistributionFormValues = z.infer<typeof distributionFormSchema>

const stockInFormSchema = z.object({
  itemId: z.string().min(1, 'Sila pilih item'),
  quantity: z.coerce.number().min(1, 'Kuantiti mesti sekurang-kurangnya 1'),
  source: z.enum(['derma', 'pembelian', 'pindahan', 'pelarasan'] as const),
  date: z.string().min(1, 'Tarikh diperlukan'),
  reference: z.string().min(1, 'No. rujukan diperlukan'),
  notes: z.string().optional().default(''),
})

type StockInFormValues = z.infer<typeof stockInFormSchema>

const productFormSchema = z.object({
  name: z.string().min(1, 'Nama produk diperlukan'),
  unit: z.string().min(1, 'Unit diperlukan'),
  initialStock: z.coerce.number().min(0, 'Stok tidak boleh negatif'),
  minLevel: z.coerce.number().min(1, 'Paras minimum mesti sekurang-kurangnya 1'),
  unitPrice: z.coerce.number().min(0.01, 'Harga mesti melebihi 0'),
})

type ProductFormValues = z.infer<typeof productFormSchema>

const stockOutFormSchema = z.object({
  itemId: z.string().min(1, 'Sila pilih item'),
  quantity: z.coerce.number().min(1, 'Kuantiti mesti sekurang-kurangnya 1'),
  date: z.string().min(1, 'Tarikh diperlukan'),
  reference: z.string().min(1, 'No. rujukan diperlukan'),
  notes: z.string().optional().default(''),
})

type StockOutFormValues = z.infer<typeof stockOutFormSchema>

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

function getKategoriBadge(kategori: KategoriAsnaf) {
  const config = KATEGORI_CONFIG[kategori]
  return (
    <Badge variant="outline" className={cn('font-medium border', config.bgClass)}>
      {config.label}
    </Badge>
  )
}

function getStatusBadge(status: DistributionStatus) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon
  return (
    <Badge variant="outline" className={cn('font-medium gap-1 border', config.bgClass)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}

function getDeliveryIcon(method: DeliveryMethod) {
  const config = DELIVERY_CONFIG[method]
  const Icon = config.icon
  return <Icon className="h-4 w-4 text-muted-foreground" />
}

function getStapleLabel(id: string): string {
  const item = MAKANAN_RUJI_ITEMS.find(i => i.id === id)
  if (item) return item.label
  // Fallback: check by name from stockItems pattern
  const nameMap: Record<string, string> = {
    beras: 'Beras (Rice)',
    minyak_masak: 'Minyak Masak (Cooking Oil)',
    gula: 'Gula (Sugar)',
    tepung: 'Tepung (Flour)',
    mie_spaghetti: 'Mie/Spaghetti',
    kacang_kekacang: 'Kacang/Kekacang (Beans/Legumes)',
    susu: 'Susu (Milk)',
    telur: 'Telur (Eggs)',
  }
  return nameMap[id] || id
}

function calculateExpenditure(makananRuji: string[], bilTanggungan: number): number {
  const unitPrices: Record<string, number> = {
    beras: 30,
    minyak_masak: 12,
    gula: 8,
    tepung: 6,
    mie_spaghetti: 5,
    kacang_kekacang: 10,
    susu: 15,
    telur: 8,
  }
  const baseCost = makananRuji.reduce((sum, item) => sum + (unitPrices[item] || 0), 0)
  const multiplier = bilTanggungan <= 2 ? 1 : bilTanggungan <= 4 ? 1.5 : bilTanggungan <= 6 ? 2 : 2.5
  return Math.round(baseCost * multiplier * 100) / 100
}

function getStockStatus(currentStock: number, minLevel: number): { label: string; bgClass: string; barColor: string } {
  if (currentStock < minLevel * 0.5) {
    return { label: 'Kritikal', bgClass: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300', barColor: 'bg-red-500' }
  }
  if (currentStock < minLevel) {
    return { label: 'Rendah', bgClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300', barColor: 'bg-amber-500' }
  }
  return { label: 'Cukup', bgClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300', barColor: 'bg-emerald-500' }
}

// ─── Main Component ──────────────────────────────────────────────────

export default function AgihanBulanPage() {

  // ─── Distribution State ─────────────────────────────────────────────
  const [distributions, setDistributions] = React.useState<Distribution[]>(INITIAL_DISTRIBUTIONS)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [filterKawasan, setFilterKawasan] = React.useState<string>('semua')
  const [filterStatus, setFilterStatus] = React.useState<string>('semua')
  const [currentPage, setCurrentPage] = React.useState(1)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [editingDistribution, setEditingDistribution] = React.useState<Distribution | null>(null)
  const [viewingDistribution, setViewingDistribution] = React.useState<Distribution | null>(null)
  const [sortField, setSortField] = React.useState<'date' | 'namaAsnaf' | 'kawasan'>('date')
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('desc')

  // ─── Stock Inventory State ─────────────────────────────────────────
  const [stockItems, setStockItems] = React.useState<StockItem[]>(STOCK_ITEMS)
  const [stockMovements, setStockMovements] = React.useState<StockMovement[]>(INITIAL_STOCK_MOVEMENTS)
  const [stockInDialogOpen, setStockInDialogOpen] = React.useState(false)
  const [stockInDefaultItemId, setStockInDefaultItemId] = React.useState<string>('')
  const [stockFilterItem, setStockFilterItem] = React.useState<string>('semua')
  const [stockFilterType, setStockFilterType] = React.useState<string>('semua')
  const [stockSearchQuery, setStockSearchQuery] = React.useState('')
  const [stockCurrentPage, setStockCurrentPage] = React.useState(1)
  const [showMovementLedger, setShowMovementLedger] = React.useState(false)

  // Product management state
  const [productDialogOpen, setProductDialogOpen] = React.useState(false)
  const [editingProduct, setEditingProduct] = React.useState<StockItem | null>(null)
  // Stock out state
  const [stockOutDialogOpen, setStockOutDialogOpen] = React.useState(false)
  const [stockOutDefaultItemId, setStockOutDefaultItemId] = React.useState<string>('')
  // Delete confirmation
  const [deleteProductDialogOpen, setDeleteProductDialogOpen] = React.useState(false)
  const [deletingProduct, setDeletingProduct] = React.useState<StockItem | null>(null)

  // ─── Distribution Form ─────────────────────────────────────────────
  const form = useForm<DistributionFormValues>({
    resolver: zodResolver(distributionFormSchema) as any,
    defaultValues: {
      namaAsnaf: '',
      noKP: '',
      noTelefon: '',
      alamat: '',
      kawasan: 'cheras',
      kategori: 'fakir',
      bilTanggungan: 1,
      makananRuji: [],
      catatan: '',
      kaedahPenghantaran: 'hantar_sendiri',
      status: 'menunggu_kelulusan',
      date: new Date().toISOString().split('T')[0],
    },
  })

  // ─── Stock In Form ─────────────────────────────────────────────────
  const stockInForm = useForm<StockInFormValues>({
    resolver: zodResolver(stockInFormSchema) as any,
    defaultValues: {
      itemId: '',
      quantity: 1,
      source: 'pembelian',
      date: new Date().toISOString().split('T')[0],
      reference: '',
      notes: '',
    },
  })

  // Product Form (Add/Edit)
  const productForm = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema) as any,
    defaultValues: {
      name: '',
      unit: 'kg',
      initialStock: 0,
      minLevel: 10,
      unitPrice: 0,
    },
  })

  // Stock Out Form
  const stockOutForm = useForm<StockOutFormValues>({
    resolver: zodResolver(stockOutFormSchema) as any,
    defaultValues: {
      itemId: '',
      quantity: 1,
      date: new Date().toISOString().split('T')[0],
      reference: '',
      notes: '',
    },
  })

  // ─── Computed Data (Distribution) ──────────────────────────────────

  const totalRecipients = distributions.length
  const thisMonthDistributions = distributions.filter(d => {
    try { return isThisMonth(parseISO(d.date)) } catch { return false }
  })
  const thisMonthCount = thisMonthDistributions.length
  const totalAreas = new Set(distributions.map(d => d.kawasan)).size
  const monthlyExpenditure = distributions
    .filter(d => d.status === 'dibahagi')
    .reduce((sum, d) => sum + d.expenditure, 0)

  const filteredDistributions = React.useMemo(() => {
    let result = [...distributions]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        d =>
          d.namaAsnaf.toLowerCase().includes(q) ||
          d.noKP.toLowerCase().includes(q)
      )
    }
    if (filterKawasan !== 'semua') {
      result = result.filter(d => d.kawasan === filterKawasan)
    }
    if (filterStatus !== 'semua') {
      result = result.filter(d => d.status === filterStatus)
    }

    result.sort((a, b) => {
      let cmp = 0
      if (sortField === 'date') cmp = a.date.localeCompare(b.date)
      else if (sortField === 'namaAsnaf') cmp = a.namaAsnaf.localeCompare(b.namaAsnaf)
      else cmp = a.kawasan.localeCompare(b.kawasan)
      return sortDir === 'desc' ? -cmp : cmp
    })

    return result
  }, [distributions, searchQuery, filterKawasan, filterStatus, sortField, sortDir])

  const totalPages = Math.max(1, Math.ceil(filteredDistributions.length / ITEMS_PER_PAGE))
  const paginatedDistributions = filteredDistributions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterKawasan, filterStatus])

  // ─── Computed Data (Stock Inventory) ──────────────────────────────

  const totalStockItems = stockItems.length
  const totalStockValue = stockItems.reduce((sum, item) => sum + item.currentStock * item.unitPrice, 0)
  const lowStockItems = stockItems.filter(item => item.currentStock < item.minLevel)
  const lowStockCount = lowStockItems.length
  const thisMonthMovements = stockMovements.filter(m => {
    try { return isThisMonth(parseISO(m.date)) } catch { return false }
  })
  const thisMonthMovementCount = thisMonthMovements.length

  const filteredStockMovements = React.useMemo(() => {
    let result = [...stockMovements]
    if (stockFilterItem !== 'semua') {
      result = result.filter(m => m.itemId === stockFilterItem)
    }
    if (stockFilterType !== 'semua') {
      result = result.filter(m => m.type === stockFilterType)
    }
    if (stockSearchQuery.trim()) {
      const q = stockSearchQuery.toLowerCase()
      result = result.filter(
        m =>
          m.itemName.toLowerCase().includes(q) ||
          m.reference.toLowerCase().includes(q) ||
          m.notes.toLowerCase().includes(q)
      )
    }
    result.sort((a, b) => b.date.localeCompare(a.date))
    return result
  }, [stockMovements, stockFilterItem, stockFilterType, stockSearchQuery])

  const stockTotalPages = Math.max(1, Math.ceil(filteredStockMovements.length / STOCK_MOVEMENTS_PER_PAGE))
  const paginatedStockMovements = filteredStockMovements.slice(
    (stockCurrentPage - 1) * STOCK_MOVEMENTS_PER_PAGE,
    stockCurrentPage * STOCK_MOVEMENTS_PER_PAGE
  )

  React.useEffect(() => {
    setStockCurrentPage(1)
  }, [stockFilterItem, stockFilterType, stockSearchQuery])

  // ─── Dynamic Staple Items ─────────────────────────────────────────
  const dynamicStapleItems = React.useMemo(() =>
    stockItems.map(si => ({ id: si.id, label: `${si.name} (${si.unit})` })),
    [stockItems]
  )

  // ─── Handlers (Distribution) ───────────────────────────────────────

  function handleSort(field: 'date' | 'namaAsnaf' | 'kawasan') {
    if (sortField === field) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  function handleCreate() {
    setEditingDistribution(null)
    form.reset({
      namaAsnaf: '',
      noKP: '',
      noTelefon: '',
      alamat: '',
      kawasan: 'cheras',
      kategori: 'fakir',
      bilTanggungan: 1,
      makananRuji: [],
      catatan: '',
      kaedahPenghantaran: 'hantar_sendiri',
      status: 'menunggu_kelulusan',
      date: new Date().toISOString().split('T')[0],
    })
    setDialogOpen(true)
  }

  function handleEdit(distribution: Distribution) {
    setEditingDistribution(distribution)
    form.reset({
      namaAsnaf: distribution.namaAsnaf,
      noKP: distribution.noKP,
      noTelefon: distribution.noTelefon,
      alamat: distribution.alamat,
      kawasan: distribution.kawasan,
      kategori: distribution.kategori,
      bilTanggungan: distribution.bilTanggungan,
      makananRuji: distribution.makananRuji,
      catatan: distribution.catatan,
      kaedahPenghantaran: distribution.kaedahPenghantaran,
      status: distribution.status,
      date: distribution.date,
    })
    setDialogOpen(true)
  }

  function handleView(distribution: Distribution) {
    setViewingDistribution(distribution)
    setSheetOpen(true)
  }

  function handleDelete(distribution: Distribution) {
    setDistributions(prev => prev.filter(d => d.id !== distribution.id))
  }

  function onSubmit(data: DistributionFormValues) {
    const expenditure = data.status === 'dibahagi'
      ? calculateExpenditure(data.makananRuji, data.bilTanggungan)
      : 0

    if (editingDistribution) {
      setDistributions(prev =>
        prev.map(d =>
          d.id === editingDistribution.id
            ? {
                ...d,
                namaAsnaf: data.namaAsnaf,
                noKP: data.noKP,
                noTelefon: data.noTelefon,
                alamat: data.alamat,
                kawasan: data.kawasan,
                kategori: data.kategori,
                bilTanggungan: data.bilTanggungan,
                makananRuji: data.makananRuji,
                catatan: data.catatan,
                kaedahPenghantaran: data.kaedahPenghantaran,
                status: data.status,
                date: data.date,
                expenditure,
              }
            : d
        )
      )
    } else {
      const nextNum = distributions.length + 1
      const newDistribution: Distribution = {
        id: `A${String(nextNum).padStart(3, '0')}`,
        refNo: `AGIHAN-2025-${String(nextNum).padStart(4, '0')}`,
        namaAsnaf: data.namaAsnaf,
        noKP: data.noKP,
        noTelefon: data.noTelefon,
        alamat: data.alamat,
        kawasan: data.kawasan,
        kategori: data.kategori,
        bilTanggungan: data.bilTanggungan,
        makananRuji: data.makananRuji,
        catatan: data.catatan,
        kaedahPenghantaran: data.kaedahPenghantaran,
        status: data.status,
        date: data.date,
        expenditure,
      }
      setDistributions(prev => [newDistribution, ...prev])
    }
    setDialogOpen(false)
  }

  // ─── Handlers (Stock Inventory) ───────────────────────────────────

  function handleOpenStockIn(itemId?: string) {
    setStockInDefaultItemId(itemId || '')
    stockInForm.reset({
      itemId: itemId || '',
      quantity: 1,
      source: 'pembelian',
      date: new Date().toISOString().split('T')[0],
      reference: '',
      notes: '',
    })
    setStockInDialogOpen(true)
  }

  function onStockInSubmit(data: StockInFormValues) {
    const targetItem = stockItems.find(si => si.id === data.itemId)
    if (!targetItem) return

    const previousStock = targetItem.currentStock
    const newStock = previousStock + data.quantity

    const nextNum = stockMovements.length + 1
    const newMovement: StockMovement = {
      id: `SM${String(nextNum).padStart(3, '0')}`,
      refNo: `SM-2025-${String(nextNum).padStart(4, '0')}`,
      itemId: data.itemId,
      itemName: targetItem.name,
      type: 'masuk',
      quantity: data.quantity,
      source: data.source,
      date: data.date,
      reference: data.reference,
      notes: data.notes,
      previousStock,
      newStock,
    }

    setStockMovements(prev => [newMovement, ...prev])
    setStockItems(prev =>
      prev.map(item =>
        item.id === data.itemId
          ? { ...item, currentStock: item.currentStock + data.quantity }
          : item
      )
    )
    setStockInDialogOpen(false)
  }

  // ─── Product Management Handlers ───────────────────────────────────

  function handleOpenAddProduct() {
    setEditingProduct(null)
    productForm.reset({
      name: '',
      unit: 'kg',
      initialStock: 0,
      minLevel: 10,
      unitPrice: 0,
    })
    setProductDialogOpen(true)
  }

  function handleOpenEditProduct(item: StockItem) {
    setEditingProduct(item)
    productForm.reset({
      name: item.name,
      unit: item.unit,
      initialStock: item.currentStock,
      minLevel: item.minLevel,
      unitPrice: item.unitPrice,
    })
    setProductDialogOpen(true)
  }

  function onProductSubmit(data: ProductFormValues) {
    if (editingProduct) {
      // Update existing product
      setStockItems(prev =>
        prev.map(item =>
          item.id === editingProduct.id
            ? { ...item, name: data.name, unit: data.unit, minLevel: data.minLevel, unitPrice: data.unitPrice, currentStock: data.initialStock }
            : item
        )
      )
      // Update stock movements references
      setStockMovements(prev =>
        prev.map(m =>
          m.itemId === editingProduct.id
            ? { ...m, itemName: data.name }
            : m
        )
      )
    } else {
      // Add new product
      const newId = data.name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now()
      const newItem: StockItem = {
        id: newId,
        name: data.name,
        unit: data.unit,
        currentStock: data.initialStock,
        minLevel: data.minLevel,
        unitPrice: data.unitPrice,
      }
      setStockItems(prev => [...prev, newItem])

      // If initial stock > 0, create stock in movement
      if (data.initialStock > 0) {
        const nextNum = stockMovements.length + 1
        const newMovement: StockMovement = {
          id: `SM${String(nextNum).padStart(3, '0')}`,
          refNo: `SM-2025-${String(nextNum).padStart(4, '0')}`,
          itemId: newId,
          itemName: data.name,
          type: 'masuk',
          quantity: data.initialStock,
          source: 'pembelian',
          date: new Date().toISOString().split('T')[0],
          reference: 'INITIAL',
          notes: 'Stok awal produk baharu',
          previousStock: 0,
          newStock: data.initialStock,
        }
        setStockMovements(prev => [newMovement, ...prev])
      }
    }
    setProductDialogOpen(false)
  }

  function handleOpenDeleteProduct(item: StockItem) {
    setDeletingProduct(item)
    setDeleteProductDialogOpen(true)
  }

  function onConfirmDeleteProduct() {
    if (!deletingProduct) return
    setStockItems(prev => prev.filter(item => item.id !== deletingProduct.id))
    setStockMovements(prev => prev.filter(m => m.itemId !== deletingProduct.id))
    setDeleteProductDialogOpen(false)
    setDeletingProduct(null)
  }

  // ─── Stock Out Handler ─────────────────────────────────────────────

  function handleOpenStockOut(itemId?: string) {
    setStockOutDefaultItemId(itemId || '')
    stockOutForm.reset({
      itemId: itemId || '',
      quantity: 1,
      date: new Date().toISOString().split('T')[0],
      reference: '',
      notes: '',
    })
    setStockOutDialogOpen(true)
  }

  function onStockOutSubmit(data: StockOutFormValues) {
    const targetItem = stockItems.find(si => si.id === data.itemId)
    if (!targetItem) return
    if (data.quantity > targetItem.currentStock) {
      return // Cannot deduct more than available
    }

    const previousStock = targetItem.currentStock
    const newStock = previousStock - data.quantity

    const nextNum = stockMovements.length + 1
    const newMovement: StockMovement = {
      id: `SM${String(nextNum).padStart(3, '0')}`,
      refNo: `SM-2025-${String(nextNum).padStart(4, '0')}`,
      itemId: data.itemId,
      itemName: targetItem.name,
      type: 'keluar',
      quantity: data.quantity,
      source: 'pelarasan',
      date: data.date,
      reference: data.reference,
      notes: data.notes || 'Stok keluar manual',
      previousStock,
      newStock,
    }

    setStockMovements(prev => [newMovement, ...prev])
    setStockItems(prev =>
      prev.map(item =>
        item.id === data.itemId
          ? { ...item, currentStock: item.currentStock - data.quantity }
          : item
      )
    )
    setStockOutDialogOpen(false)
  }

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white p-4 lg:p-8">
      {/* Aurora Background Ambient Layer */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] animate-pulse delay-700" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Agihan Makan Ruji Bulanan
            </h1>
            <p className="text-muted-foreground mt-1">
              Pengurusan agihan bulanan makanan ruji kepada asnaf di semua kawasan
            </p>
          </div>
        </div>

        <Tabs defaultValue="agihan">
          <TabsList>
            <TabsTrigger value="agihan" className="gap-2">
              <Package className="h-4 w-4" />
              Agihan Bulanan
            </TabsTrigger>
            <TabsTrigger value="inventori" className="gap-2">
              <Warehouse className="h-4 w-4" />
              Inventori Stok
            </TabsTrigger>
          </TabsList>

          {/* ═══════════════════════════════════════════════════════════
              TAB 1: AGIHAN BULANAN
          ═══════════════════════════════════════════════════════════ */}
          <TabsContent value="agihan" className="space-y-6 mt-6">

            {/* Action bar */}
            <div className="flex justify-end">
              <Button
                onClick={handleCreate}
                size="lg"
                className="gap-2 shrink-0"
                style={{ backgroundColor: BRAND_COLOR }}
              >
                <Plus className="h-4 w-4" />
                Agihan Baharu
              </Button>
            </div>

            {/* ─── Summary Cards ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {/* Jumlah Penerima */}
              <Card className="relative overflow-hidden border border-white/10 shadow-2xl bg-white/5 backdrop-blur-2xl rounded-3xl">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Jumlah Penerima</p>
                      <p className="text-2xl font-bold">{totalRecipients}</p>
                      <p className="text-xs text-muted-foreground">Asnaf berdaftar</p>
                    </div>
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${BRAND_COLOR}2A` }}
                    >
                      <Users className="h-6 w-6" style={{ color: BRAND_COLOR }} />
                    </div>
                  </div>
                </CardContent>
                <div
                  className="absolute bottom-0 left-0 h-1 w-full"
                  style={{ backgroundColor: BRAND_COLOR }}
                />
              </Card>

              {/* Bulan Ini Agihan */}
              <Card className="relative overflow-hidden border border-white/10 shadow-2xl bg-white/5 backdrop-blur-2xl rounded-3xl">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Bulan Ini Agihan</p>
                      <p className="text-2xl font-bold">{thisMonthCount}</p>
                      <p className="text-xs text-muted-foreground">Agihan bulan semasa</p>
                    </div>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                      <Package className="h-6 w-6 text-emerald-400" />
                    </div>
                  </div>
                </CardContent>
                <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-400 to-emerald-600" />
              </Card>

              {/* Jumlah Kawasan */}
              <Card className="relative overflow-hidden border border-white/10 shadow-2xl bg-white/5 backdrop-blur-2xl rounded-3xl">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Jumlah Kawasan</p>
                      <p className="text-2xl font-bold">{totalAreas}</p>
                      <p className="text-xs text-muted-foreground">Kawasan liputan</p>
                    </div>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                      <MapPin className="h-6 w-6 text-amber-400" />
                    </div>
                  </div>
                </CardContent>
                <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-amber-400 to-amber-600" />
              </Card>

              {/* Perbelanjaan Bulan Ini */}
              <Card className="relative overflow-hidden border border-white/10 shadow-2xl bg-white/5 backdrop-blur-2xl rounded-3xl">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Perbelanjaan Bulan Ini</p>
                      <p className="text-2xl font-bold">{formatCurrency(monthlyExpenditure)}</p>
                      <p className="text-xs text-muted-foreground">
                        {distributions.filter(d => d.status === 'dibahagi').length} agihan berjaya
                      </p>
                    </div>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
                      <DollarSign className="h-6 w-6 text-red-400" />
                    </div>
                  </div>
                </CardContent>
                <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-red-400 to-red-600" />
              </Card>
            </div>

            {/* ─── Filter Bar ──────────────────────────────────────────── */}
            <Card className="border border-white/10 shadow-2xl bg-white/5 backdrop-blur-2xl rounded-3xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="h-4 w-4 text-purple-400" />
                  <span className="text-sm font-medium">Carian & Penapis</span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Cari nama asnaf / No. KP..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={filterKawasan} onValueChange={setFilterKawasan}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kawasan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="semua">Semua Kawasan</SelectItem>
                      {(Object.keys(KAWASAN_CONFIG) as Kawasan[]).map(k => (
                        <SelectItem key={k} value={k}>
                          {KAWASAN_CONFIG[k].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="semua">Semua Status</SelectItem>
                      {(Object.keys(STATUS_CONFIG) as DistributionStatus[]).map(s => (
                        <SelectItem key={s} value={s}>
                          {STATUS_CONFIG[s].label}
                        </SelectItem>
                      ))}
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
                        <TableHead className="w-[140px]">No. Rujukan</TableHead>
                        <TableHead>
                          <Button variant="ghost" size="sm" className="gap-1 -ml-3 h-8 font-medium" onClick={() => handleSort('namaAsnaf')}>
                            Nama Asnaf
                            <ArrowUpDown className="h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>No. KP</TableHead>
                        <TableHead>
                          <Button variant="ghost" size="sm" className="gap-1 -ml-3 h-8 font-medium" onClick={() => handleSort('kawasan')}>
                            Kawasan
                            <ArrowUpDown className="h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead className="text-center">Bil. Tanggungan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>
                          <Button variant="ghost" size="sm" className="gap-1 -ml-3 h-8 font-medium" onClick={() => handleSort('date')}>
                            Tarikh
                            <ArrowUpDown className="h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead className="w-[80px]">Tindakan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedDistributions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                            Tiada rekod agihan dijumpai
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedDistributions.map((distribution) => (
                          <TableRow key={distribution.id} className="group">
                            <TableCell className="font-mono text-xs">{distribution.refNo}</TableCell>
                            <TableCell>
                              <span className="font-medium">{distribution.namaAsnaf}</span>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{distribution.noKP}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-normal">
                                {KAWASAN_CONFIG[distribution.kawasan].label}
                              </Badge>
                            </TableCell>
                            <TableCell>{getKategoriBadge(distribution.kategori)}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="font-mono">
                                {distribution.bilTanggungan}
                              </Badge>
                            </TableCell>
                            <TableCell>{getStatusBadge(distribution.status)}</TableCell>
                            <TableCell className="text-sm">{formatDate(distribution.date)}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Tindakan</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleView(distribution)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Lihat
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEdit(distribution)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(distribution)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Padam
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* ─── Mobile Card List ────────────────────────────────────── */}
            <div className="md:hidden space-y-3">
              {paginatedDistributions.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    Tiada rekod agihan dijumpai
                  </CardContent>
                </Card>
              ) : (
                paginatedDistributions.map((distribution) => (
                  <Card key={distribution.id} className="overflow-hidden">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 space-y-1">
                          <p className="font-mono text-xs text-muted-foreground">{distribution.refNo}</p>
                          <p className="font-semibold truncate">{distribution.namaAsnaf}</p>
                        </div>
                        {getStatusBadge(distribution.status)}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">No. KP: </span>
                          <span className="font-medium">{distribution.noKP}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Kawasan: </span>
                          <span className="font-medium">{KAWASAN_CONFIG[distribution.kawasan].label}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Kategori: </span>
                          {getKategoriBadge(distribution.kategori)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Tanggungan: </span>
                          <span className="font-medium">{distribution.bilTanggungan}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t">
                        <span className="text-xs text-muted-foreground">{formatDate(distribution.date)}</span>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleView(distribution)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(distribution)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600"
                            onClick={() => handleDelete(distribution)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* ─── Pagination ──────────────────────────────────────────── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Menunjukkan {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredDistributions.length)} daripada{' '}
                  {filteredDistributions.length} rekod
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setCurrentPage(page)}
                      style={currentPage === page ? { backgroundColor: BRAND_COLOR } : undefined}
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════
              TAB 2: INVENTORI STOK
          ═══════════════════════════════════════════════════════════ */}
          <TabsContent value="inventori" className="space-y-6 mt-6">

            {/* ─── Inventory Summary Cards ─────────────────────────────── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {/* Jumlah Item */}
              <Card className="relative overflow-hidden border border-white/10 shadow-2xl bg-white/5 backdrop-blur-2xl rounded-3xl">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Jumlah Item</p>
                      <p className="text-2xl font-bold">{totalStockItems}</p>
                      <p className="text-xs text-muted-foreground">Jenis item stok</p>
                    </div>
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${BRAND_COLOR}2A` }}
                    >
                      <Warehouse className="h-6 w-6" style={{ color: BRAND_COLOR }} />
                    </div>
                  </div>
                </CardContent>
                <div className="absolute bottom-0 left-0 h-1 w-full" style={{ backgroundColor: BRAND_COLOR }} />
              </Card>

              {/* Nilai Stok */}
              <Card className="relative overflow-hidden border border-white/10 shadow-2xl bg-white/5 backdrop-blur-2xl rounded-3xl">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Nilai Stok</p>
                      <p className="text-2xl font-bold">{formatCurrency(totalStockValue)}</p>
                      <p className="text-xs text-muted-foreground">Jumlah nilai inventori</p>
                    </div>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                      <DollarSign className="h-6 w-6 text-emerald-400" />
                    </div>
                  </div>
                </CardContent>
                <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-400 to-emerald-600" />
              </Card>

              {/* Stok Rendah */}
              <Card className="relative overflow-hidden border border-white/10 shadow-2xl bg-white/5 backdrop-blur-2xl rounded-3xl">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Stok Rendah</p>
                      <p className="text-2xl font-bold text-red-400">{lowStockCount}</p>
                      <p className="text-xs text-muted-foreground">Item bawah paras minimum</p>
                    </div>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
                      <AlertTriangle className="h-6 w-6 text-red-400" />
                    </div>
                  </div>
                </CardContent>
                <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-red-400 to-red-600" />
              </Card>

              {/* Pergerakan Bulan Ini */}
              <Card className="relative overflow-hidden border border-white/10 shadow-2xl bg-white/5 backdrop-blur-2xl rounded-3xl">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Pergerakan Bulan Ini</p>
                      <p className="text-2xl font-bold">{thisMonthMovementCount}</p>
                      <p className="text-xs text-muted-foreground">Transaksi stok bulan semasa</p>
                    </div>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                      <History className="h-6 w-6 text-amber-400" />
                    </div>
                  </div>
                </CardContent>
                <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-amber-400 to-amber-600" />
              </Card>
            </div>

            {/* ─── Current Stock Table ──────────────────────────────────── */}
            <Card className="border border-white/10 shadow-2xl bg-white/5 backdrop-blur-2xl rounded-3xl overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <PackageCheck className="h-5 w-5" style={{ color: BRAND_COLOR }} />
                    Stok Semasa
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button onClick={handleOpenAddProduct} size="sm" variant="outline" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Tambah Produk
                    </Button>
                    <Button
                      onClick={() => handleOpenStockIn()}
                      size="sm"
                      className="gap-2"
                      style={{ backgroundColor: BRAND_COLOR }}
                    >
                      <ArrowDownToLine className="h-4 w-4" />
                      Stok Masuk
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead className="text-center">Stok Semasa</TableHead>
                        <TableHead className="text-center">Paras Min.</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Nilai (RM)</TableHead>
                        <TableHead className="text-center">Tahap</TableHead>
                        <TableHead className="w-[120px]">Tindakan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stockItems.map((item) => {
                        const status = getStockStatus(item.currentStock, item.minLevel)
                        const stockValue = item.currentStock * item.unitPrice
                        const progressPercent = Math.min(100, (item.currentStock / (item.minLevel * 2)) * 100)
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{item.unit}</TableCell>
                            <TableCell className="text-center font-mono font-semibold">{item.currentStock}</TableCell>
                            <TableCell className="text-center text-sm text-muted-foreground">{item.minLevel}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn('font-medium border-0', status.bgClass)}>
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">{formatCurrency(stockValue)}</TableCell>
                            <TableCell className="px-2">
                              <Progress value={progressPercent} className="h-2 bg-white/10" indicatorClassName={status.barColor} />
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-7 gap-1">
                                    <MoreHorizontal className="h-3 w-3" />
                                    Tindakan
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleOpenStockIn(item.id)}>
                                    <ArrowDownToLine className="mr-2 h-4 w-4" />
                                    Stok Masuk
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleOpenStockOut(item.id)}>
                                    <ArrowUpFromLine className="mr-2 h-4 w-4" />
                                    Stok Keluar
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleOpenEditProduct(item)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Produk
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleOpenDeleteProduct(item)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Buang Produk
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* ─── Low Stock Alert Section ─────────────────────────────── */}
            {lowStockCount > 0 && (
              <Card className="border-red-200 dark:border-red-900/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    Amaran Stok Rendah
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {lowStockItems.map((item) => {
                      const deficit = item.minLevel - item.currentStock
                      const status = getStockStatus(item.currentStock, item.minLevel)
                      return (
                        <Card key={item.id} className="border-0 bg-red-50 dark:bg-red-950/30">
                          <CardContent className="p-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold text-sm">{item.name}</p>
                                <Badge variant="outline" className={cn('mt-1 text-xs border-0', status.bgClass)}>
                                  {status.label}
                                </Badge>
                              </div>
                              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <p className="text-muted-foreground">Stok</p>
                                <p className="font-bold text-red-600">{item.currentStock} {item.unit}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Minimum</p>
                                <p className="font-semibold">{item.minLevel} {item.unit}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Kekurangan</p>
                                <p className="font-bold text-red-600">-{deficit} {item.unit}</p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full gap-1 h-7 text-xs mt-1"
                              onClick={() => handleOpenStockIn(item.id)}
                            >
                              <Plus className="h-3 w-3" />
                              Tambah Stok
                            </Button>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ─── Stock Movement Ledger ───────────────────────────────── */}
            <Card className="border border-white/10 shadow-2xl bg-white/5 backdrop-blur-2xl rounded-3xl overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <History className="h-5 w-5" style={{ color: BRAND_COLOR }} />
                    Lejar Pergerakan Stok
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 gap-1 text-xs"
                      onClick={() => setShowMovementLedger(prev => !prev)}
                    >
                      {showMovementLedger ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
                      {showMovementLedger ? 'Tutup' : 'Buka'}
                    </Button>
                  </CardTitle>
                </div>
              </CardHeader>

              {showMovementLedger && (
                <CardContent className="space-y-4">
                  {/* Filters */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Cari item / rujukan / catatan..."
                        value={stockSearchQuery}
                        onChange={e => setStockSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select value={stockFilterItem} onValueChange={setStockFilterItem}>
                      <SelectTrigger>
                        <SelectValue placeholder="Item" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="semua">Semua Item</SelectItem>
                        {stockItems.map(item => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={stockFilterType} onValueChange={setStockFilterType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Jenis" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="semua">Semua Jenis</SelectItem>
                        <SelectItem value="masuk">Stok Masuk</SelectItem>
                        <SelectItem value="keluar">Stok Keluar</SelectItem>
                        <SelectItem value="pelarasan">Pelarasan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>No. Rujukan</TableHead>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-center">Jenis</TableHead>
                          <TableHead className="text-center">Kuantiti</TableHead>
                          <TableHead className="text-center">Stok Sebelum</TableHead>
                          <TableHead className="text-center">Stok Selepas</TableHead>
                          <TableHead>Sumber</TableHead>
                          <TableHead>Tarikh</TableHead>
                          <TableHead className="hidden lg:table-cell">Rujukan</TableHead>
                          <TableHead className="hidden xl:table-cell">Catatan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedStockMovements.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                              Tiada rekod pergerakan stok dijumpai
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedStockMovements.map((movement) => (
                            <TableRow key={movement.id}>
                              <TableCell className="font-mono text-xs">{movement.refNo}</TableCell>
                              <TableCell className="font-medium text-sm">{movement.itemName}</TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'font-medium border-0 gap-1',
                                    movement.type === 'masuk'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                      : movement.type === 'keluar'
                                        ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300'
                                  )}
                                >
                                  {movement.type === 'masuk' && <ArrowDownToLine className="h-3 w-3" />}
                                  {movement.type === 'keluar' && <ArrowUpFromLine className="h-3 w-3" />}
                                  {movement.type === 'masuk' ? 'Masuk' : movement.type === 'keluar' ? 'Keluar' : 'Pelarasan'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center font-mono font-semibold">
                                <span className={movement.type === 'masuk' ? 'text-emerald-600' : 'text-red-600'}>
                                  {movement.type === 'masuk' ? '+' : '-'}{movement.quantity}
                                </span>
                              </TableCell>
                              <TableCell className="text-center font-mono text-sm text-muted-foreground">
                                {movement.previousStock}
                              </TableCell>
                              <TableCell className="text-center font-mono text-sm font-medium">
                                {movement.newStock}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn('font-normal border-0', STOCK_SOURCE_CONFIG[movement.source].bgClass)}>
                                  {STOCK_SOURCE_CONFIG[movement.source].label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">{formatDate(movement.date)}</TableCell>
                              <TableCell className="hidden lg:table-cell font-mono text-xs text-muted-foreground">
                                {movement.reference}
                              </TableCell>
                              <TableCell className="hidden xl:table-cell text-xs text-muted-foreground max-w-[200px] truncate">
                                {movement.notes}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {stockTotalPages > 1 && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Menunjukkan {(stockCurrentPage - 1) * STOCK_MOVEMENTS_PER_PAGE + 1}–
                        {Math.min(stockCurrentPage * STOCK_MOVEMENTS_PER_PAGE, filteredStockMovements.length)} daripada{' '}
                        {filteredStockMovements.length} rekod
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setStockCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={stockCurrentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        {Array.from({ length: stockTotalPages }, (_, i) => i + 1).map(page => (
                          <Button
                            key={page}
                            variant={stockCurrentPage === page ? 'default' : 'outline'}
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setStockCurrentPage(page)}
                            style={stockCurrentPage === page ? { backgroundColor: BRAND_COLOR } : undefined}
                          >
                            {page}
                          </Button>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setStockCurrentPage(prev => Math.min(stockTotalPages, prev + 1))}
                          disabled={stockCurrentPage === stockTotalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        {/* ═══════════════════════════════════════════════════════════════
            DIALOGS & SHEETS (outside Tabs)
        ═══════════════════════════════════════════════════════════════ */}

        {/* ─── Add/Edit Distribution Dialog ────────────────────────── */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingDistribution ? 'Edit Agihan' : 'Tambah Agihan Baharu'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Maklumat Asnaf */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: BRAND_COLOR }}>
                      Maklumat Asnaf
                    </h3>
                    <Separator className="mt-2" />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="namaAsnaf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Asnaf</FormLabel>
                          <FormControl>
                            <Input placeholder="Nama penuh asnaf" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="noKP"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>No. KP</FormLabel>
                          <FormControl>
                            <Input placeholder="xxxxxxxx-xx-xxxx" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="noTelefon"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>No. Telefon</FormLabel>
                          <FormControl>
                            <Input placeholder="0xx-xxx xxxx" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bilTanggungan"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bil. Tanggungan</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} max={20} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="alamat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alamat</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Alamat penuh asnaf" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Maklumat Agihan */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: BRAND_COLOR }}>
                      Maklumat Agihan
                    </h3>
                    <Separator className="mt-2" />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="kawasan"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kawasan</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih kawasan" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(Object.keys(KAWASAN_CONFIG) as Kawasan[]).map(k => (
                                <SelectItem key={k} value={k}>
                                  {KAWASAN_CONFIG[k].label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="kategori"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kategori</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih kategori" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(Object.keys(KATEGORI_CONFIG) as KategoriAsnaf[]).map(k => (
                                <SelectItem key={k} value={k}>
                                  {KATEGORI_CONFIG[k].label}
                                </SelectItem>
                              ))}
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
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(Object.keys(STATUS_CONFIG) as DistributionStatus[]).map(s => (
                                <SelectItem key={s} value={s}>
                                  {STATUS_CONFIG[s].label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tarikh Agihan</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Makanan Ruji */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: BRAND_COLOR }}>
                      Senarai Makanan Ruji
                    </h3>
                    <Separator className="mt-2" />
                  </div>

                  <FormField
                    control={form.control}
                    name="makananRuji"
                    render={() => (
                      <FormItem>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          {dynamicStapleItems.map((item) => (
                            <FormField
                              key={item.id}
                              control={form.control}
                              name="makananRuji"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(item.id)}
                                      onCheckedChange={(checked) => {
                                        const current = field.value || []
                                        if (checked) {
                                          field.onChange([...current, item.id])
                                        } else {
                                          field.onChange(current.filter(v => v !== item.id))
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal cursor-pointer">
                                    {item.label}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Penghantaran & Catatan */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: BRAND_COLOR }}>
                      Penghantaran & Catatan
                    </h3>
                    <Separator className="mt-2" />
                  </div>

                  <FormField
                    control={form.control}
                    name="kaedahPenghantaran"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kaedah Penghantaran</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih kaedah" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(Object.keys(DELIVERY_CONFIG) as DeliveryMethod[]).map(m => (
                              <SelectItem key={m} value={m}>
                                {DELIVERY_CONFIG[m].label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="catatan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catatan</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Catatan tambahan..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    style={{ backgroundColor: BRAND_COLOR }}
                  >
                    {editingDistribution ? 'Simpan Perubahan' : 'Tambah Agihan'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* ─── View Distribution Sheet ─────────────────────────────── */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            {viewingDistribution && (
              <>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" style={{ color: BRAND_COLOR }} />
                    Butiran Agihan
                  </SheetTitle>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                  {/* Status & Reference */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">No. Rujukan</p>
                      <p className="font-mono text-sm font-semibold">{viewingDistribution.refNo}</p>
                    </div>
                    {getStatusBadge(viewingDistribution.status)}
                  </div>

                  <Separator />

                  {/* Maklumat Asnaf */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold" style={{ color: BRAND_COLOR }}>
                      Maklumat Asnaf
                    </h4>
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-3">
                        <UserCheck className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Nama Asnaf</p>
                          <p className="text-sm font-medium">{viewingDistribution.namaAsnaf}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">No. KP</p>
                          <p className="text-sm font-medium">{viewingDistribution.noKP}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Phone className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">No. Telefon</p>
                          <p className="text-sm font-medium">{viewingDistribution.noTelefon || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Home className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Alamat</p>
                          <p className="text-sm font-medium">{viewingDistribution.alamat || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Users className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Bil. Tanggungan</p>
                          <p className="text-sm font-medium">{viewingDistribution.bilTanggungan} orang</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Maklumat Agihan */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold" style={{ color: BRAND_COLOR }}>
                      Maklumat Agihan
                    </h4>
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Kawasan</p>
                          <p className="text-sm font-medium">{KAWASAN_CONFIG[viewingDistribution.kawasan].label}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Package className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Kategori</p>
                          <div className="mt-1">{getKategoriBadge(viewingDistribution.kategori)}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CalendarDays className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Tarikh Agihan</p>
                          <p className="text-sm font-medium">{formatDate(viewingDistribution.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        {getDeliveryIcon(viewingDistribution.kaedahPenghantaran)}
                        <div className="mt-0.5">
                          <p className="text-xs text-muted-foreground">Kaedah Penghantaran</p>
                          <p className="text-sm font-medium">{DELIVERY_CONFIG[viewingDistribution.kaedahPenghantaran].label}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Senarai Makanan Ruji */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold" style={{ color: BRAND_COLOR }}>
                      Senarai Makanan Ruji
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {viewingDistribution.makananRuji.map((item) => (
                        <Badge
                          key={item}
                          variant="outline"
                          className="gap-1.5 py-1 px-3"
                          style={{ borderColor: BRAND_COLOR, color: BRAND_COLOR }}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          {getStapleLabel(item)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Catatan */}
                  {viewingDistribution.catatan && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold" style={{ color: BRAND_COLOR }}>
                          Catatan
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {viewingDistribution.catatan}
                        </p>
                      </div>
                    </>
                  )}

                  {/* Expenditure */}
                  {viewingDistribution.status === 'dibahagi' && (
                    <>
                      <Separator />
                      <div
                        className="rounded-lg p-4 text-center"
                        style={{ backgroundColor: `${BRAND_COLOR}0A` }}
                      >
                        <p className="text-sm text-muted-foreground">Anggaran Perbelanjaan</p>
                        <p
                          className="text-2xl font-bold mt-1"
                          style={{ color: BRAND_COLOR }}
                        >
                          {formatCurrency(viewingDistribution.expenditure)}
                        </p>
                      </div>
                    </>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={() => {
                        setSheetOpen(false)
                        handleEdit(viewingDistribution)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      className="gap-2"
                      onClick={() => {
                        setSheetOpen(false)
                        handleDelete(viewingDistribution)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Padam
                    </Button>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* ─── Stock In Dialog ─────────────────────────────────────── */}
        <Dialog open={stockInDialogOpen} onOpenChange={setStockInDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowDownToLine className="h-5 w-5" style={{ color: BRAND_COLOR }} />
                Stok Masuk
              </DialogTitle>
            </DialogHeader>
            <Form {...stockInForm}>
              <form onSubmit={stockInForm.handleSubmit(onStockInSubmit)} className="space-y-4">
                <FormField
                  control={stockInForm.control}
                  name="itemId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Stok</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih item stok" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {stockItems.map(item => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name} ({item.unit}) — Stok: {item.currentStock}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={stockInForm.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kuantiti</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={stockInForm.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sumber</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih sumber" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(Object.keys(STOCK_SOURCE_CONFIG) as StockSource[]).map(s => (
                              <SelectItem key={s} value={s}>
                                {STOCK_SOURCE_CONFIG[s].label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={stockInForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tarikh</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={stockInForm.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>No. Rujukan</FormLabel>
                      <FormControl>
                        <Input placeholder="cth: DRM-2025-004" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={stockInForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catatan</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Catatan tambahan..." rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStockInDialogOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    style={{ backgroundColor: BRAND_COLOR }}
                  >
                    Simpan Stok Masuk
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* ─── Add/Edit Product Dialog ─────────────────────────────── */}
        <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" style={{ color: BRAND_COLOR }} />
                {editingProduct ? 'Edit Produk' : 'Tambah Produk Baharu'}
              </DialogTitle>
            </DialogHeader>
            <Form {...productForm}>
              <form onSubmit={productForm.handleSubmit(onProductSubmit)} className="space-y-4">
                <FormField
                  control={productForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Produk</FormLabel>
                      <FormControl>
                        <Input placeholder="cth: Beras" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={productForm.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="botol">botol</SelectItem>
                            <SelectItem value="kotak">kotak</SelectItem>
                            <SelectItem value="tray">tray</SelectItem>
                            <SelectItem value="beg">beg</SelectItem>
                            <SelectItem value="tin">tin</SelectItem>
                            <SelectItem value="bungkus">bungkus</SelectItem>
                            <SelectItem value="pcs">pcs</SelectItem>
                            <SelectItem value="liter">liter</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={productForm.control}
                    name="initialStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stok Semasa</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={productForm.control}
                    name="minLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Paras Minimum</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={productForm.control}
                    name="unitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Harga Seunit (RM)</FormLabel>
                        <FormControl>
                          <Input type="number" min={0.01} step={0.01} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setProductDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" style={{ backgroundColor: BRAND_COLOR }}>
                    {editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* ─── Stock Out Dialog ──────────────────────────────────────── */}
        <Dialog open={stockOutDialogOpen} onOpenChange={setStockOutDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowUpFromLine className="h-5 w-5 text-red-600" />
                Stok Keluar
              </DialogTitle>
            </DialogHeader>
            <Form {...stockOutForm}>
              <form onSubmit={stockOutForm.handleSubmit(onStockOutSubmit)} className="space-y-4">
                <FormField
                  control={stockOutForm.control}
                  name="itemId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Stok</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih item stok" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {stockItems.map(item => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name} ({item.unit}) — Stok: {item.currentStock}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={stockOutForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kuantiti</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={stockOutForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tarikh</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={stockOutForm.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>No. Rujukan</FormLabel>
                      <FormControl>
                        <Input placeholder="cth: AGIHAN-2025-0001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={stockOutForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catatan</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Sebab stok keluar..." rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setStockOutDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" className="bg-red-600 hover:bg-red-700">
                    Simpan Stok Keluar
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* ─── Delete Product Confirmation Dialog ────────────────────── */}
        <Dialog open={deleteProductDialogOpen} onOpenChange={setDeleteProductDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Buang Produk
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Adakah anda pasti ingin membuang produk ini? Tindakan ini juga akan memadam semua rekod pergerakan stok berkaitan.
              </p>
              {deletingProduct && (
                <div className="rounded-lg border p-3 space-y-1">
                  <p className="font-semibold text-sm">{deletingProduct.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Stok semasa: {deletingProduct.currentStock} {deletingProduct.unit} | 
                    Nilai: {formatCurrency(deletingProduct.currentStock * deletingProduct.unitPrice)}
                  </p>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setDeleteProductDialogOpen(false)}>
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  onClick={onConfirmDeleteProduct}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Buang Produk
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
