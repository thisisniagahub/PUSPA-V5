'use client'

import * as React from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, parseISO, isThisMonth } from 'date-fns'
import { ms } from 'date-fns/locale'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import {
  UtensilsCrossed,
  Building2,
  Users,
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
  MapPin,
  Heart,
  BookOpen,
  ChefHat,
  Package,
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

type InstitutionType = 'rumah_kebajikan' | 'mahad_tahfiz'
type DistributionStatus = 'dihantar' | 'dalam_proses' | 'menunggu' | 'dibatalkan'
type FoodType = 'nasi_berlauk' | 'nasi_campur' | 'nasi_minyak' | 'nasi_ayam' | 'mi_pasta' | 'roti_lauk' | 'packed_lunch'
type DeliveryMethod = 'hantar_sendiri' | 'urus_kurier' | 'wakil_ambil'
type DeliveryTime = 'pagi' | 'tengah_hari' | 'petang'

interface Institution {
  id: string
  name: string
  type: InstitutionType
  address: string
  contactPerson: string
  phone: string
}

interface Distribution {
  id: string
  refNo: string
  institutionId: string
  institutionName: string
  institutionType: InstitutionType
  address: string
  numberOfPeople: number
  menu: string
  foodType: FoodType
  foodBoxes: number
  expenditure: number
  deliveryMethod: DeliveryMethod
  driverName: string
  driverPhone: string
  deliveryTime: DeliveryTime
  status: DistributionStatus
  date: string
  notes: string
}

interface DistributionFormData {
  institutionId: string
  numberOfPeople: number
  menu: string
  foodType: FoodType
  foodBoxes: number
  expenditure: number
  deliveryMethod: DeliveryMethod
  driverName: string
  driverPhone: string
  deliveryTime: DeliveryTime
  status: DistributionStatus
  notes: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════════

const INSTITUTIONS: Institution[] = [
  { id: 'INS-01', name: 'Rumah Kebajikan Al-Mukhlisin', type: 'rumah_kebajikan', address: 'No. 12, Jalan Mawar 3, Taman Permata, 43200 Cheras, Selangor', contactPerson: 'Ustaz Hamzah bin Omar', phone: '03-9134 5678' },
  { id: 'INS-02', name: 'Rumah Kebajikan An-Nur', type: 'rumah_kebajikan', address: 'No. 45, Jalan Ampang Hilir, 68000 Ampang, Selangor', contactPerson: 'Puan Siti Aminah binti Ali', phone: '03-4256 7890' },
  { id: 'INS-03', name: 'Rumah Kebajikan At-Taqwa', type: 'rumah_kebajikan', address: 'No. 8, Jalan Gombak Utama, 53100 Gombak, Selangor', contactPerson: 'Encik Ismail bin Ahmad', phone: '03-6185 1234' },
  { id: 'INS-04', name: 'Rumah Kebajikan Al-Ihsan', type: 'rumah_kebajikan', address: 'No. 23, Jalan SS 2/75, 47300 Petaling Jaya, Selangor', contactPerson: 'Ustazah Fatimah binti Yusof', phone: '03-7956 3456' },
  { id: 'INS-05', name: 'Rumah Kebajikan Nur Hikmah', type: 'rumah_kebajikan', address: 'No. 17, Jalan Seksyen 7/1, 40000 Shah Alam, Selangor', contactPerson: 'Encik Rosli bin Hassan', phone: '03-5519 8901' },
  { id: 'INS-06', name: 'Rumah Kebajikan Rahmah', type: 'rumah_kebajikan', address: 'No. 31, Jalan Pasar, 41000 Klang, Selangor', contactPerson: 'Puan Aishah binti Said', phone: '03-3345 6789' },
  { id: 'INS-07', name: 'Rumah Kebajikan Baitul Makmur', type: 'rumah_kebajikan', address: 'No. 5, Jalan Sepang Utama, 43900 Sepang, Selangor', contactPerson: 'Encik Kamal bin Zainal', phone: '03-8765 4321' },
  { id: 'INS-08', name: 'Rumah Kebajikan Al-Falah', type: 'rumah_kebajikan', address: 'No. 19, Jalan Hulu Langat, 43100 Hulu Langat, Selangor', contactPerson: 'Ustazah Halimah binti Dollah', phone: '03-9021 5678' },
  { id: 'INS-09', name: 'Mahad Tahfiz Al-Quran PUSPA', type: 'mahad_tahfiz', address: 'No. 1, Jalan Persiaran Ilmu, 43000 Bangi, Selangor', contactPerson: 'Ustaz Dr. Muhamad bin Ismail', phone: '03-8920 1111' },
]

const INSTITUTION_TYPE_CONFIG: Record<InstitutionType, { label: string; bgClass: string }> = {
  rumah_kebajikan: { label: 'Rumah Kebajikan', bgClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  mahad_tahfiz: { label: 'Mahad Tahfiz', bgClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' },
}

const STATUS_CONFIG: Record<DistributionStatus, { label: string; bgClass: string; icon: React.ElementType }> = {
  dihantar: { label: 'Dihantar', bgClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300', icon: CheckCircle2 },
  dalam_proses: { label: 'Dalam Proses', bgClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300', icon: Truck },
  menunggu: { label: 'Menunggu', bgClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300', icon: Clock },
  dibatalkan: { label: 'Dibatalkan', bgClass: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300', icon: XCircle },
}

const FOOD_TYPE_OPTIONS: { value: FoodType; label: string }[] = [
  { value: 'nasi_berlauk', label: 'Nasi Berlauk' },
  { value: 'nasi_campur', label: 'Nasi Campur' },
  { value: 'nasi_minyak', label: 'Nasi Minyak' },
  { value: 'nasi_ayam', label: 'Nasi Ayam' },
  { value: 'mi_pasta', label: 'Mi/Pasta' },
  { value: 'roti_lauk', label: 'Roti & Lauk' },
  { value: 'packed_lunch', label: 'Packed Lunch' },
]

const DELIVERY_METHOD_OPTIONS: { value: DeliveryMethod; label: string }[] = [
  { value: 'hantar_sendiri', label: 'Hantar Sendiri' },
  { value: 'urus_kurier', label: 'Urus Kurier' },
  { value: 'wakil_ambil', label: 'Wakil Ambil' },
]

const DELIVERY_TIME_OPTIONS: { value: DeliveryTime; label: string; desc: string }[] = [
  { value: 'pagi', label: 'Pagi', desc: '09:00 - 11:00' },
  { value: 'tengah_hari', label: 'Tengah Hari', desc: '11:00 - 13:00' },
  { value: 'petang', label: 'Petang', desc: '13:00 - 15:00' },
]

const ITEMS_PER_PAGE = 8
const BRAND_COLOR = '#4B0082'

// ─── Initial Data (empty — populated from API) ──────────────────────────

const INITIAL_DISTRIBUTIONS: Distribution[] = []

// ═══════════════════════════════════════════════════════════════════════════════
// Zod Schema
// ═══════════════════════════════════════════════════════════════════════════════

const distributionFormSchema = z.object({
  institutionId: z.string().min(1, 'Sila pilih institusi'),
  numberOfPeople: z.coerce.number().min(1, 'Bilangan orang mesti sekurang-kurangnya 1'),
  menu: z.string().min(1, 'Menu mesti diisi'),
  foodType: z.enum([
    'nasi_berlauk', 'nasi_campur', 'nasi_minyak', 'nasi_ayam',
    'mi_pasta', 'roti_lauk', 'packed_lunch',
  ] as const),
  foodBoxes: z.coerce.number().min(1, 'Bilangan peti mesti sekurang-kurangnya 1'),
  expenditure: z.coerce.number().min(0, 'Perbelanjaan tidak boleh negatif'),
  deliveryMethod: z.enum(['hantar_sendiri', 'urus_kurier', 'wakil_ambil'] as const),
  driverName: z.string().min(1, 'Nama pemandu/volunteer diperlukan'),
  driverPhone: z.string().min(1, 'No. telefon diperlukan'),
  deliveryTime: z.enum(['pagi', 'tengah_hari', 'petang'] as const),
  status: z.enum(['dihantar', 'dalam_proses', 'menunggu', 'dibatalkan'] as const),
  notes: z.string().optional().default(''),
})

type DistributionFormValues = z.infer<typeof distributionFormSchema>

// ═══════════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════════

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

function formatDateDay(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'EEEE, dd MMM yyyy', { locale: ms })
  } catch {
    return dateStr
  }
}

function getStatusBadge(status: DistributionStatus) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon
  return (
    <Badge variant="outline" className={cn('font-medium gap-1 border-0', config.bgClass)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}

function getTypeBadge(type: InstitutionType) {
  const config = INSTITUTION_TYPE_CONFIG[type]
  return (
    <Badge variant="outline" className={cn('font-medium border-0', config.bgClass)}>
      {config.label}
    </Badge>
  )
}

function getFoodTypeLabel(foodType: FoodType): string {
  return FOOD_TYPE_OPTIONS.find(o => o.value === foodType)?.label ?? foodType
}

function getDeliveryMethodLabel(method: DeliveryMethod): string {
  return DELIVERY_METHOD_OPTIONS.find(o => o.value === method)?.label ?? method
}

function getDeliveryTimeLabel(time: DeliveryTime): string {
  return DELIVERY_TIME_OPTIONS.find(o => o.value === time)?.label ?? time
}

function getInstitutionById(id: string): Institution | undefined {
  return INSTITUTIONS.find(i => i.id === id)
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════════

export default function SedekahJumaatPage() {
  // ─── State ──────────────────────────────────────────────────────────
  const [distributions, setDistributions] = React.useState<Distribution[]>(INITIAL_DISTRIBUTIONS)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [filterType, setFilterType] = React.useState<string>('semua')
  const [filterStatus, setFilterStatus] = React.useState<string>('semua')
  const [currentPage, setCurrentPage] = React.useState(1)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [editingDistribution, setEditingDistribution] = React.useState<Distribution | null>(null)
  const [viewingDistribution, setViewingDistribution] = React.useState<Distribution | null>(null)
  const [sortField, setSortField] = React.useState<'date' | 'institutionName' | 'expenditure'>('date')
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('desc')
  const [activeTab, setActiveTab] = React.useState('jadual')

  // ─── Form ───────────────────────────────────────────────────────────
  const form = useForm<DistributionFormValues>({
    resolver: zodResolver(distributionFormSchema) as any,
    defaultValues: {
      institutionId: '',
      numberOfPeople: 0,
      menu: '',
      foodType: 'nasi_berlauk',
      foodBoxes: 0,
      expenditure: 0,
      deliveryMethod: 'hantar_sendiri',
      driverName: '',
      driverPhone: '',
      deliveryTime: 'tengah_hari',
      status: 'menunggu',
      notes: '',
    },
  })

  // ─── Computed Data ──────────────────────────────────────────────────
  const totalInstitutions = INSTITUTIONS.length

  const thisMonthDistributions = React.useMemo(() => {
    return distributions.filter(d => {
      try { return isThisMonth(parseISO(d.date)) } catch { return false }
    })
  }, [distributions])

  const totalRecipients = distributions
    .filter(d => d.status === 'dihantar')
    .reduce((sum, d) => sum + d.numberOfPeople, 0)

  const thisMonthExpenditure = thisMonthDistributions
    .reduce((sum, d) => sum + d.expenditure, 0)

  // Institution stats for cards
  const institutionStats = React.useMemo(() => {
    const stats: Record<string, { thisMonthCount: number; lastDate: string | null }> = {}
    INSTITUTIONS.forEach(inst => {
      const instDistributions = thisMonthDistributions.filter(d => d.institutionId === inst.id)
      const allInstDistributions = distributions
        .filter(d => d.institutionId === inst.id && d.status === 'dihantar')
        .sort((a, b) => b.date.localeCompare(a.date))
      stats[inst.id] = {
        thisMonthCount: instDistributions.length,
        lastDate: allInstDistributions.length > 0 ? allInstDistributions[0].date : null,
      }
    })
    return stats
  }, [distributions, thisMonthDistributions])

  // Filtered distributions
  const filteredDistributions = React.useMemo(() => {
    let result = [...distributions]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(d =>
        d.institutionName.toLowerCase().includes(q) ||
        d.refNo.toLowerCase().includes(q) ||
        d.menu.toLowerCase().includes(q)
      )
    }
    if (filterType !== 'semua') {
      result = result.filter(d => d.institutionType === filterType)
    }
    if (filterStatus !== 'semua') {
      result = result.filter(d => d.status === filterStatus)
    }

    result.sort((a, b) => {
      let cmp = 0
      if (sortField === 'date') cmp = a.date.localeCompare(b.date)
      else if (sortField === 'expenditure') cmp = a.expenditure - b.expenditure
      else cmp = a.institutionName.localeCompare(b.institutionName)
      return sortDir === 'desc' ? -cmp : cmp
    })

    return result
  }, [distributions, searchQuery, filterType, filterStatus, sortField, sortDir])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredDistributions.length / ITEMS_PER_PAGE))
  const paginatedDistributions = filteredDistributions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Reset page on filter change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterType, filterStatus])

  // ─── Handlers ───────────────────────────────────────────────────────

  function handleSort(field: 'date' | 'institutionName' | 'expenditure') {
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
      institutionId: '',
      numberOfPeople: 0,
      menu: '',
      foodType: 'nasi_berlauk',
      foodBoxes: 0,
      expenditure: 0,
      deliveryMethod: 'hantar_sendiri',
      driverName: '',
      driverPhone: '',
      deliveryTime: 'tengah_hari',
      status: 'menunggu',
      notes: '',
    })
    setDialogOpen(true)
  }

  function handleEdit(distribution: Distribution) {
    setEditingDistribution(distribution)
    form.reset({
      institutionId: distribution.institutionId,
      numberOfPeople: distribution.numberOfPeople,
      menu: distribution.menu,
      foodType: distribution.foodType,
      foodBoxes: distribution.foodBoxes,
      expenditure: distribution.expenditure,
      deliveryMethod: distribution.deliveryMethod,
      driverName: distribution.driverName,
      driverPhone: distribution.driverPhone,
      deliveryTime: distribution.deliveryTime,
      status: distribution.status,
      notes: distribution.notes,
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
    const inst = getInstitutionById(data.institutionId)
    if (!inst) return

    if (editingDistribution) {
      setDistributions(prev =>
        prev.map(d =>
          d.id === editingDistribution.id
            ? {
                ...d,
                institutionId: data.institutionId,
                institutionName: inst.name,
                institutionType: inst.type,
                address: inst.address,
                numberOfPeople: data.numberOfPeople,
                menu: data.menu,
                foodType: data.foodType,
                foodBoxes: data.foodBoxes,
                expenditure: data.expenditure,
                deliveryMethod: data.deliveryMethod,
                driverName: data.driverName,
                driverPhone: data.driverPhone,
                deliveryTime: data.deliveryTime,
                status: data.status,
                notes: data.notes || '',
              }
            : d
        )
      )
    } else {
      const newId = `SJ-${String(distributions.length + 1).padStart(3, '0')}`
      const newRefNo = `SJ-2025-${String(distributions.length + 1).padStart(4, '0')}`
      const newDistribution: Distribution = {
        id: newId,
        refNo: newRefNo,
        institutionId: data.institutionId,
        institutionName: inst.name,
        institutionType: inst.type,
        address: inst.address,
        numberOfPeople: data.numberOfPeople,
        menu: data.menu,
        foodType: data.foodType,
        foodBoxes: data.foodBoxes,
        expenditure: data.expenditure,
        deliveryMethod: data.deliveryMethod,
        driverName: data.driverName,
        driverPhone: data.driverPhone,
        deliveryTime: data.deliveryTime,
        status: data.status,
        date: new Date().toISOString().split('T')[0],
        notes: data.notes || '',
      }
      setDistributions(prev => [newDistribution, ...prev])
    }
    setDialogOpen(false)
  }

  // ─── Watch institution for auto-fill ───────────────────────────────
  const watchedInstitutionId = useWatch({
    control: form.control,
    name: 'institutionId'
  })
  const watchedNumberOfPeople = useWatch({
    control: form.control,
    name: 'numberOfPeople'
  })

  React.useEffect(() => {
    const inst = getInstitutionById(watchedInstitutionId)
    if (inst && !editingDistribution) {
      const lastDist = distributions
        .filter(d => d.institutionId === inst.id)
        .sort((a, b) => b.date.localeCompare(a.date))[0]
      if (lastDist) {
        form.setValue('numberOfPeople', lastDist.numberOfPeople)
        form.setValue('foodBoxes', lastDist.foodBoxes)
      }
    }
  }, [watchedInstitutionId, editingDistribution, form, distributions])

  React.useEffect(() => {
    const currentBoxes = form.getValues('foodBoxes')
    if (watchedNumberOfPeople > currentBoxes) {
      form.setValue('foodBoxes', watchedNumberOfPeople + 3)
    }
  }, [watchedNumberOfPeople, form])

  // ─── Render ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        {/* ─── Page Header ──────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: BRAND_COLOR }}>
              Sedekah Jumaat
            </h1>
            <p className="text-muted-foreground mt-1">
              Pengurusan agihan makanan tengahari Jumaat kepada 8 rumah kebajikan & Mahad Tahfiz
            </p>
          </div>
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

        {/* ─── Summary Cards ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Total Institutions */}
          <Card className="relative overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Jumlah Institusi</p>
                  <p className="text-2xl font-bold">{totalInstitutions}</p>
                  <p className="text-xs text-muted-foreground">8 RK + 1 MT</p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/40">
                  <Building2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-purple-400 to-purple-600" />
          </Card>

          {/* This Month Distributions */}
          <Card className="relative overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Sedekah Bulan Ini</p>
                  <p className="text-2xl font-bold">{thisMonthDistributions.length}</p>
                  <p className="text-xs text-muted-foreground">agihan bulan ini</p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
                  <CalendarDays className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-amber-400 to-amber-600" />
          </Card>

          {/* Total Recipients */}
          <Card className="relative overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Bil. Penerima</p>
                  <p className="text-2xl font-bold">{totalRecipients.toLocaleString('ms-MY')}</p>
                  <p className="text-xs text-muted-foreground">orang telah dilayan</p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                  <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-400 to-emerald-600" />
          </Card>

          {/* Monthly Expenditure */}
          <Card className="relative overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Perbelanjaan Bulan Ini</p>
                  <p className="text-2xl font-bold">{formatCurrency(thisMonthExpenditure)}</p>
                  <p className="text-xs text-muted-foreground">
                    purata {formatCurrency(thisMonthDistributions.length > 0 ? thisMonthExpenditure / thisMonthDistributions.length : 0)}/agihan
                  </p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/40">
                  <DollarSign className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                </div>
              </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-rose-400 to-rose-600" />
          </Card>
        </div>

        {/* ─── Tabs ─────────────────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="jadual" className="gap-2">
              <UtensilsCrossed className="h-4 w-4" />
              Jadual Agihan
            </TabsTrigger>
            <TabsTrigger value="institusi" className="gap-2">
              <Building2 className="h-4 w-4" />
              Senarai Institusi
            </TabsTrigger>
          </TabsList>

          {/* ═══ TAB 1: Jadual Agihan ═════════════════════════════════ */}
          <TabsContent value="jadual" className="space-y-6 mt-6">
            {/* ─── Filter Bar ─────────────────────────────────────────── */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Carian & Penapis</span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Cari institusi / menu..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  {/* Type filter */}
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Jenis Institusi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="semua">Semua Jenis</SelectItem>
                      <SelectItem value="rumah_kebajikan">Rumah Kebajikan</SelectItem>
                      <SelectItem value="mahad_tahfiz">Mahad Tahfiz</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Status filter */}
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="semua">Semua Status</SelectItem>
                      <SelectItem value="dihantar">Dihantar</SelectItem>
                      <SelectItem value="dalam_proses">Dalam Proses</SelectItem>
                      <SelectItem value="menunggu">Menunggu</SelectItem>
                      <SelectItem value="dibatalkan">Dibatalkan</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Result count */}
                  <div className="flex items-center justify-center rounded-md border bg-muted/50 px-4">
                    <span className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">{filteredDistributions.length}</span> rekod dijumpai
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ─── Desktop Data Table ──────────────────────────────────── */}
            <Card className="hidden md:block">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[130px]">No. Rujukan</TableHead>
                        <TableHead>
                          <Button variant="ghost" size="sm" className="gap-1 -ml-3 h-8 font-medium" onClick={() => handleSort('institutionName')}>
                            Nama Institusi
                            <ArrowUpDown className="h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>Jenis</TableHead>
                        <TableHead className="hidden xl:table-cell">Alamat</TableHead>
                        <TableHead className="text-center">Bil. Orang</TableHead>
                        <TableHead className="hidden lg:table-cell">Menu</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>
                          <Button variant="ghost" size="sm" className="gap-1 -ml-3 h-8 font-medium" onClick={() => handleSort('date')}>
                            Tarikh
                            <ArrowUpDown className="h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead className="w-[70px]">Tindakan</TableHead>
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
                        paginatedDistributions.map((dist) => (
                          <TableRow key={dist.id} className="group">
                            <TableCell className="font-mono text-xs">{dist.refNo}</TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-0.5">
                                <span className="font-medium">{dist.institutionName}</span>
                                <span className="text-xs text-muted-foreground">{getFoodTypeLabel(dist.foodType)}</span>
                              </div>
                            </TableCell>
                            <TableCell>{getTypeBadge(dist.institutionType)}</TableCell>
                            <TableCell className="hidden xl:table-cell max-w-[200px] truncate text-xs text-muted-foreground">
                              {dist.address}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Users className="h-3 w-3 text-muted-foreground" />
                                <span className="font-medium">{dist.numberOfPeople}</span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell max-w-[200px] truncate text-sm">
                              {dist.menu}
                            </TableCell>
                            <TableCell>{getStatusBadge(dist.status)}</TableCell>
                            <TableCell className="text-sm whitespace-nowrap">{formatDate(dist.date)}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Tindakan</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleView(dist)} className="gap-2 cursor-pointer">
                                    <Eye className="h-4 w-4" />
                                    Lihat
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEdit(dist)} className="gap-2 cursor-pointer">
                                    <Pencil className="h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(dist)}
                                    className="gap-2 text-red-600 focus:text-red-600 cursor-pointer"
                                  >
                                    <Trash2 className="h-4 w-4" />
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
            <div className="space-y-3 md:hidden">
              {paginatedDistributions.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    Tiada rekod agihan dijumpai
                  </CardContent>
                </Card>
              ) : (
                paginatedDistributions.map((dist) => (
                  <Card key={dist.id} className="overflow-hidden">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs text-muted-foreground">{dist.refNo}</span>
                            {getStatusBadge(dist.status)}
                          </div>
                          <p className="font-semibold truncate">{dist.institutionName}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(dist)} className="gap-2 cursor-pointer">
                              <Eye className="h-4 w-4" /> Lihat
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(dist)} className="gap-2 cursor-pointer">
                              <Pencil className="h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDelete(dist)} className="gap-2 text-red-600 focus:text-red-600 cursor-pointer">
                              <Trash2 className="h-4 w-4" /> Padam
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{dist.numberOfPeople} orang</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{formatDate(dist.date)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Package className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{dist.foodBoxes} peti</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">{formatCurrency(dist.expenditure)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{dist.menu}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* ─── Pagination ──────────────────────────────────────────── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Menunjukkan {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredDistributions.length)} daripada {filteredDistributions.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="icon"
                        className="h-8 w-8"
                        style={currentPage === page ? { backgroundColor: BRAND_COLOR } : undefined}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
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
            )}
          </TabsContent>

          {/* ═══ TAB 2: Senarai Institusi ══════════════════════════════ */}
          <TabsContent value="institusi" className="mt-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {INSTITUTIONS.map((inst) => {
                const stats = institutionStats[inst.id]
                const isMahad = inst.type === 'mahad_tahfiz'
                const lastDistributions = distributions
                  .filter(d => d.institutionId === inst.id)
                  .sort((a, b) => b.date.localeCompare(a.date))

                return (
                  <Card key={inst.id} className="relative overflow-hidden transition-shadow hover:shadow-md">
                    {/* Color accent bar */}
                    <div
                      className="absolute top-0 left-0 h-1 w-full"
                      style={{
                        background: isMahad
                          ? `linear-gradient(to right, ${BRAND_COLOR}, #7C3AED)`
                          : `linear-gradient(to right, #059669, #34D399)`
                      }}
                    />

                    <CardHeader className="pb-3 pt-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className={cn(
                              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                              isMahad
                                ? 'bg-purple-100 dark:bg-purple-900/40'
                                : 'bg-emerald-100 dark:bg-emerald-900/40'
                            )}
                          >
                            {isMahad ? (
                              <BookOpen className={cn('h-5 w-5 text-purple-600 dark:text-purple-400')} />
                            ) : (
                              <Home className={cn('h-5 w-5 text-emerald-600 dark:text-emerald-400')} />
                            )}
                          </div>
                          <div className="min-w-0 space-y-1">
                            <CardTitle className="text-sm leading-tight line-clamp-2">
                              {inst.name}
                            </CardTitle>
                            {getTypeBadge(inst.type)}
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 pb-5">
                      {/* Address */}
                      <div className="flex items-start gap-2">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground line-clamp-2">{inst.address}</p>
                      </div>

                      {/* Contact */}
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <p className="text-xs text-muted-foreground truncate">{inst.contactPerson}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <p className="text-xs text-muted-foreground">{inst.phone}</p>
                      </div>

                      <Separator />

                      {/* Stats row */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-0.5">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                            Agihan Bulan Ini
                          </p>
                          <div className="flex items-center gap-1.5">
                            <UtensilsCrossed className="h-3.5 w-3.5" style={{ color: BRAND_COLOR }} />
                            <span className="text-sm font-bold">{stats?.thisMonthCount ?? 0}</span>
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                            Agihan Terakhir
                          </p>
                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5" style={{ color: BRAND_COLOR }} />
                            <span className="text-sm font-medium">
                              {stats?.lastDate ? formatDate(stats.lastDate) : '—'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status indicator */}
                      {lastDistributions.length > 0 && (
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-muted-foreground">Status Terakhir:</span>
                          {getStatusBadge(lastDistributions[0].status)}
                        </div>
                      )}

                      {/* Quick action */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2 gap-2"
                        onClick={() => {
                          handleCreate()
                          setTimeout(() => form.setValue('institutionId', inst.id), 0)
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Cipta Agihan
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* ─── Add/Edit Dialog ───────────────────────────────────────── */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2" style={{ color: BRAND_COLOR }}>
                <UtensilsCrossed className="h-5 w-5" />
                {editingDistribution ? 'Edit Agihan' : 'Agihan Baharu'}
              </DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Institution & People */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="institutionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Institusi</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih institusi..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {INSTITUTIONS.map(inst => (
                              <SelectItem key={inst.id} value={inst.id}>
                                <div className="flex items-center gap-2">
                                  {inst.type === 'mahad_tahfiz' ? (
                                    <BookOpen className="h-3 w-3 text-purple-500" />
                                  ) : (
                                    <Home className="h-3 w-3 text-emerald-500" />
                                  )}
                                  {inst.name}
                                </div>
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
                    name="numberOfPeople"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bil. Orang</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} placeholder="Contoh: 45" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Institution preview */}
                {watchedInstitutionId && (
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                    <p className="text-xs font-medium" style={{ color: BRAND_COLOR }}>
                      Maklumat Institusi
                    </p>
                    {(() => {
                      const inst = getInstitutionById(watchedInstitutionId)
                      if (!inst) return null
                      return (
                        <div className="grid grid-cols-1 gap-1 text-xs text-muted-foreground sm:grid-cols-3">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{inst.address}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <UserCheck className="h-3 w-3 shrink-0" />
                            <span className="truncate">{inst.contactPerson}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span>{inst.phone}</span>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}

                <Separator />

                {/* Menu section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ChefHat className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Menu & Makanan</span>
                  </div>

                  <FormField
                    control={form.control}
                    name="menu"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Menu Hari Ini</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Contoh: Nasi Ayam Masak Merah, Acar, Tauhu Sumbat, Buah Epal"
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="foodType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jenis Makanan</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {FOOD_TYPE_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
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
                      name="foodBoxes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bil. Peti/Box</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} placeholder="Contoh: 48" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="expenditure"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Perbelanjaan (RM)</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} step={0.01} placeholder="Contoh: 720.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Delivery section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Penghantaran</span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="deliveryMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kaedah Penghantaran</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {DELIVERY_METHOD_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
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
                      name="deliveryTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Masa Penghantaran</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {DELIVERY_TIME_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label} ({opt.desc})
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
                                <SelectValue />
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

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="driverName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Pemandu/Volunteer</FormLabel>
                          <FormControl>
                            <Input placeholder="Contoh: Encik Azmi bin Selamat" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="driverPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>No. Telefon Pemandu</FormLabel>
                          <FormControl>
                            <Input placeholder="Contoh: 012-345 6789" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catatan</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Catatan tambahan (pilihan)..."
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Actions */}
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="gap-2"
                    style={{ backgroundColor: BRAND_COLOR }}
                  >
                    <Heart className="h-4 w-4" />
                    {editingDistribution ? 'Kemaskini Agihan' : 'Simpan Agihan'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* ─── View Sheet ─────────────────────────────────────────────── */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            {viewingDistribution && (
              <>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2" style={{ color: BRAND_COLOR }}>
                    <UtensilsCrossed className="h-5 w-5" />
                    Butiran Agihan
                  </SheetTitle>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                  {/* Ref No & Status */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-muted-foreground">
                      {viewingDistribution.refNo}
                    </span>
                    {getStatusBadge(viewingDistribution.status)}
                  </div>

                  {/* Institution Info */}
                  <div className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-center gap-2">
                      {viewingDistribution.institutionType === 'mahad_tahfiz' ? (
                        <BookOpen className="h-4 w-4 text-purple-500" />
                      ) : (
                        <Home className="h-4 w-4 text-emerald-500" />
                      )}
                      <span className="font-semibold text-sm">{viewingDistribution.institutionName}</span>
                    </div>
                    {getTypeBadge(viewingDistribution.institutionType)}
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span>{viewingDistribution.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Food Details */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <ChefHat className="h-4 w-4" style={{ color: BRAND_COLOR }} />
                      Butiran Makanan
                    </h4>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Bil. Orang</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{viewingDistribution.numberOfPeople} orang</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Jenis Makanan</p>
                        <p className="font-semibold mt-0.5">{getFoodTypeLabel(viewingDistribution.foodType)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Bil. Peti/Box</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{viewingDistribution.foodBoxes} peti</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Perbelanjaan</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{formatCurrency(viewingDistribution.expenditure)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Menu */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Menu</p>
                      <div className="rounded-md bg-muted/50 p-3">
                        <p className="text-sm">{viewingDistribution.menu}</p>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Details */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Truck className="h-4 w-4" style={{ color: BRAND_COLOR }} />
                      Penghantaran
                    </h4>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Kaedah</p>
                        <p className="font-semibold mt-0.5">{getDeliveryMethodLabel(viewingDistribution.deliveryMethod)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Masa</p>
                        <p className="font-semibold mt-0.5">
                          {getDeliveryTimeLabel(viewingDistribution.deliveryTime)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Pemandu/Volunteer</p>
                          <p className="text-sm font-medium">{viewingDistribution.driverName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">No. Telefon</p>
                          <p className="text-sm font-medium">{viewingDistribution.driverPhone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Tarikh</p>
                          <p className="text-sm font-medium">{formatDateDay(viewingDistribution.date)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {viewingDistribution.notes && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Catatan</h4>
                      <div className="rounded-md bg-muted/50 p-3">
                        <p className="text-sm text-muted-foreground">{viewingDistribution.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <Separator />
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pb-6">
                    <Button
                      variant="outline"
                      className="gap-2"
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
                        handleDelete(viewingDistribution)
                        setSheetOpen(false)
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
      </div>
    </div>
  )
}
