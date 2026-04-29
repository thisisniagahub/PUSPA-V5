'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Heart,
  Users,
  TrendingUp,
  Receipt,
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  FileText,
  Mail,
  Phone,
  MessageCircle,
  Send,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Donor {
  id: string
  donorNumber: string
  name: string
  ic: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  state: string | null
  segment: string
  preferredContact: string | null
  isAnonymous: boolean
  notes: string | null
  totalDonated: number
  donationCount: number
  firstDonationAt: string | null
  lastDonationAt: string | null
  status: string
  createdAt: string
  _count: { taxReceipts: number; communications: number }
}

interface TaxReceipt {
  id: string
  receiptNumber: string
  donorId: string
  amount: number
  donationDate: string
  purpose: string
  lhdnRef: string | null
  issuedAt: string
  donor: { id: string; name: string; donorNumber: string; ic: string | null }
}

interface Communication {
  id: string
  donorId: string
  type: string
  subject: string
  content: string | null
  status: string
  sentAt: string | null
  createdAt: string
  donor: { id: string; name: string; donorNumber: string }
}

interface DonorStats {
  totalDonors: number
  totalAmount: number
  regularDonors: number
  totalReceipts: number
}

interface DonorOption {
  id: string
  name: string
  donorNumber: string
  status: string
}

interface DonorStatsEnvelope {
  stats?: DonorStats
}

interface DonorListEnvelope {
  data?: Donor[]
  total?: number
  stats?: DonorStats
}

interface ReceiptListEnvelope {
  data?: TaxReceipt[]
  total?: number
  totalAmount?: number
}

interface CommunicationListEnvelope {
  data?: Communication[]
  total?: number
}

interface DonorDetailReceipt {
  id: string
  receiptNumber: string
  amount: number
  donationDate: string
  issuedAt: string
  purpose: string
  lhdnRef: string | null
}

interface DonorDetailCommunication {
  id: string
  type: string
  subject: string
  content: string | null
  status: string
  sentAt: string | null
  createdAt: string
}

interface DonorDetailPayload {
  donor: Donor
  receipts: {
    total: number
    totalAmount: number
    latestIssuedAt: string | null
    items: DonorDetailReceipt[]
  }
  communications: {
    total: number
    sentCount: number
    draftCount: number
    failedCount: number
    latestActivityAt: string | null
    items: DonorDetailCommunication[]
  }
}

// ─── Segment / Status Maps ──────────────────────────────────────────────────

const segmentMap: Record<string, { label: string; color: string }> = {
  major: { label: 'Major', color: 'bg-primary/20 text-primary border-primary/30' },
  regular: { label: 'Tetap', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  occasional: { label: 'Sekali-sekala', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  lapsed: { label: 'Tidak Aktif', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
}

const statusMap: Record<string, { label: string; color: string }> = {
  active: { label: 'Aktif', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  inactive: { label: 'Tidak Aktif', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
}

const commTypeMap: Record<string, { label: string; icon: typeof Mail; color: string }> = {
  email: { label: 'E-mel', icon: Mail, color: 'text-blue-600' },
  phone: { label: 'Telefon', icon: Phone, color: 'text-green-600' },
  whatsapp: { label: 'WhatsApp', icon: MessageCircle, color: 'text-emerald-600' },
  letter: { label: 'Surat', icon: FileText, color: 'text-amber-600' },
}

const commStatusMap: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draf', color: 'bg-gray-100 text-gray-600' },
  sent: { label: 'Dihantar', color: 'bg-emerald-100 text-emerald-700' },
  failed: { label: 'Gagal', color: 'bg-red-100 text-red-700' },
}

const preferredContactMap: Record<string, string> = {
  email: 'E-mel',
  phone: 'Telefon',
  whatsapp: 'WhatsApp',
}

// ─── Default form state ─────────────────────────────────────────────────────

const emptyDonorForm = {
  name: '',
  ic: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  segment: 'occasional' as string,
  preferredContact: '' as string,
  notes: '',
  status: 'active' as string,
}

const emptyReceiptForm = {
  donorId: '',
  amount: '',
  donationDate: '',
  purpose: 'Sumbangan amal kepada PUSPA',
  lhdnRef: '',
}

const emptyCommForm = {
  donorId: '',
  type: 'email' as string,
  subject: '',
  content: '',
  status: 'sent' as string,
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function DonorsPage() {
  // Stats
  const [stats, setStats] = useState<DonorStats | null>(null)

  // Donors tab state
  const [donors, setDonors] = useState<Donor[]>([])
  const [donorPage, setDonorPage] = useState(1)
  const [donorTotal, setDonorTotal] = useState(0)
  const [donorSearch, setDonorSearch] = useState('')
  const [donorSegment, setDonorSegment] = useState('')
  const [donorStatus, setDonorStatus] = useState('')
  const [donorDialogOpen, setDonorDialogOpen] = useState(false)
  const [editingDonor, setEditingDonor] = useState<Donor | null>(null)
  const [donorForm, setDonorForm] = useState(emptyDonorForm)
  const [donorLoading, setDonorLoading] = useState(false)
  const [donorDetailOpen, setDonorDetailOpen] = useState(false)
  const [donorDetailLoading, setDonorDetailLoading] = useState(false)
  const [donorDetailError, setDonorDetailError] = useState(false)
  const [selectedDonorId, setSelectedDonorId] = useState<string | null>(null)
  const [selectedDonorPreview, setSelectedDonorPreview] = useState<Donor | null>(null)
  const [donorDetail, setDonorDetail] = useState<DonorDetailPayload | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; name: string; relatedDonorId?: string } | null>(null)

  // Receipts tab state
  const [receipts, setReceipts] = useState<TaxReceipt[]>([])
  const [receiptPage, setReceiptPage] = useState(1)
  const [receiptTotal, setReceiptTotal] = useState(0)
  const [receiptSearch, setReceiptSearch] = useState('')
  const [receiptYear, setReceiptYear] = useState('')
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false)
  const [receiptForm, setReceiptForm] = useState(emptyReceiptForm)
  const [receiptLoading, setReceiptLoading] = useState(false)

  // Communications tab state
  const [communications, setCommunications] = useState<Communication[]>([])
  const [commPage, setCommPage] = useState(1)
  const [commTotal, setCommTotal] = useState(0)
  const [commSearch, setCommSearch] = useState('')
  const [commType, setCommType] = useState('')
  const [commStatus, setCommStatus] = useState('')
  const [commDialogOpen, setCommDialogOpen] = useState(false)
  const [commForm, setCommForm] = useState(emptyCommForm)
  const [commLoading, setCommLoading] = useState(false)
  const [donorOptions, setDonorOptions] = useState<DonorOption[]>([])
  const [donorOptionsLoading, setDonorOptionsLoading] = useState(false)
  const donorDetailRequestIdRef = useRef(0)

  const pageSize = 10

  // ─── Fetch Stats ──────────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.getEnvelope<Donor[]>('/donors', { page: 1, pageSize: 1 }) as DonorStatsEnvelope
      if (response.stats) {
        setStats(response.stats)
      }
    } catch {
      // Stats are optional, don't show error
    }
  }, [])

  // ─── Fetch Donors ─────────────────────────────────────────────────────────

  const fetchDonors = useCallback(async () => {
    setDonorLoading(true)
    try {
      const response = await api.getEnvelope<Donor[]>('/donors', {
        page: donorPage,
        pageSize,
        search: donorSearch,
        segment: donorSegment,
        status: donorStatus,
      }) as DonorListEnvelope
      setDonors(response.data || [])
      setDonorTotal(response.total || 0)
      if (response.stats) setStats(response.stats)
    } catch {
      toast.error('Gagal memuatkan senarai penderma')
    } finally {
      setDonorLoading(false)
    }
  }, [donorPage, donorSearch, donorSegment, donorStatus])

  const fetchDonorDetail = useCallback(async (donorId: string) => {
    if (!donorId) return null

    const requestId = donorDetailRequestIdRef.current + 1
    donorDetailRequestIdRef.current = requestId
    setDonorDetailError(false)
    setDonorDetailLoading(true)
    try {
      const data = await api.get<DonorDetailPayload>(`/donors/${donorId}`)
      if (donorDetailRequestIdRef.current !== requestId) {
        return null
      }
      setDonorDetailError(false)
      setDonorDetail(data)
      setSelectedDonorPreview(data.donor)
      return data
    } catch {
      if (donorDetailRequestIdRef.current === requestId) {
        setDonorDetailError(true)
        toast.error('Gagal memuatkan butiran penderma')
      }
      return null
    } finally {
      if (donorDetailRequestIdRef.current === requestId) {
        setDonorDetailLoading(false)
      }
    }
  }, [])

  // ─── Fetch Receipts ───────────────────────────────────────────────────────

  const fetchReceipts = useCallback(async () => {
    setReceiptLoading(true)
    try {
      const response = await api.getEnvelope<TaxReceipt[]>('/donors/receipts', {
        page: receiptPage,
        pageSize,
        search: receiptSearch,
        year: receiptYear,
      }) as ReceiptListEnvelope
      setReceipts(response.data || [])
      setReceiptTotal(response.total || 0)
    } catch {
      toast.error('Gagal memuatkan senarai resit cukai')
    } finally {
      setReceiptLoading(false)
    }
  }, [receiptPage, receiptSearch, receiptYear])

  // ─── Fetch Communications ─────────────────────────────────────────────────

  const fetchCommunications = useCallback(async () => {
    setCommLoading(true)
    try {
      const response = await api.getEnvelope<Communication[]>('/donors/communications', {
        page: commPage,
        pageSize,
        search: commSearch,
        type: commType,
        status: commStatus,
      }) as CommunicationListEnvelope
      setCommunications(response.data || [])
      setCommTotal(response.total || 0)
    } catch {
      toast.error('Gagal memuatkan senarai komunikasi')
    } finally {
      setCommLoading(false)
    }
  }, [commPage, commSearch, commType, commStatus])

  // ─── Load data on mount and filter changes ────────────────────────────────

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchDonors()
  }, [fetchDonors])

  useEffect(() => {
    fetchReceipts()
  }, [fetchReceipts])

  useEffect(() => {
    fetchCommunications()
  }, [fetchCommunications])

  const fetchDonorOptions = useCallback(async () => {
    setDonorOptionsLoading(true)
    try {
      const data = await api.get<DonorOption[]>('/donors/options', { limit: 200 })
      setDonorOptions(data)
    } catch {
      toast.error('Gagal memuatkan pilihan penderma')
    } finally {
      setDonorOptionsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDonorOptions()
  }, [fetchDonorOptions])

  const closeDonorDetail = useCallback(() => {
    donorDetailRequestIdRef.current += 1
    setDonorDetailOpen(false)
    setSelectedDonorId(null)
    setSelectedDonorPreview(null)
    setDonorDetail(null)
    setDonorDetailError(false)
    setDonorDetailLoading(false)
  }, [])

  const openDonorDetail = useCallback((donor: Donor) => {
    setSelectedDonorId(donor.id)
    setSelectedDonorPreview(donor)
    setDonorDetail(null)
    setDonorDetailOpen(true)
    void fetchDonorDetail(donor.id)
  }, [fetchDonorDetail])

  // ─── Donor CRUD handlers ──────────────────────────────────────────────────

  const openCreateDonor = () => {
    setEditingDonor(null)
    setDonorForm(emptyDonorForm)
    setDonorDialogOpen(true)
  }

  const openEditDonor = (donor: Donor) => {
    setEditingDonor(donor)
    setDonorForm({
      name: donor.name,
      ic: donor.ic || '',
      phone: donor.phone || '',
      email: donor.email || '',
      address: donor.address || '',
      city: donor.city || '',
      state: donor.state || '',
      segment: donor.segment,
      preferredContact: donor.preferredContact || '',
      notes: donor.notes || '',
      status: donor.status,
    })
    setDonorDialogOpen(true)
  }

  const saveDonor = async () => {
    if (!donorForm.name.trim()) {
      toast.error('Nama penderma diperlukan')
      return
    }
    try {
      if (editingDonor) {
        await api.put('/donors', { id: editingDonor.id, ...donorForm })
        toast.success('Penderma berjaya dikemaskini')
      } else {
        await api.post('/donors', donorForm)
        toast.success('Penderma berjaya didaftarkan')
      }
      setDonorDialogOpen(false)
      fetchDonors()
      fetchStats()
      fetchDonorOptions()
      if (editingDonor && selectedDonorId === editingDonor.id) {
        void fetchDonorDetail(editingDonor.id)
      }
    } catch {
      toast.error('Gagal menyimpan penderma')
    }
  }

  const confirmDelete = (type: string, id: string, name: string, relatedDonorId?: string) => {
    setDeleteTarget({ type, id, name, relatedDonorId })
    setDeleteDialogOpen(true)
  }

  const executeDelete = async () => {
    if (!deleteTarget) return
    try {
      if (deleteTarget.type === 'donor') {
        await api.delete('/donors', { id: deleteTarget.id })
        toast.success('Penderma berjaya dipadam')
        fetchDonors()
        fetchStats()
        fetchDonorOptions()
        if (selectedDonorId === deleteTarget.id) {
          closeDonorDetail()
        }
      } else if (deleteTarget.type === 'receipt') {
        await api.delete('/donors/receipts', { id: deleteTarget.id })
        toast.success('Resit cukai berjaya dipadam')
        fetchReceipts()
        if (selectedDonorId && deleteTarget.relatedDonorId === selectedDonorId) {
          void fetchDonorDetail(selectedDonorId)
        }
      } else if (deleteTarget.type === 'communication') {
        await api.delete('/donors/communications', { id: deleteTarget.id })
        toast.success('Komunikasi berjaya dipadam')
        fetchCommunications()
        if (selectedDonorId && deleteTarget.relatedDonorId === selectedDonorId) {
          void fetchDonorDetail(selectedDonorId)
        }
      }
    } catch {
      toast.error('Gagal memadam rekod')
    } finally {
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
    }
  }

  // ─── Receipt handler ──────────────────────────────────────────────────────

  const saveReceipt = async () => {
    if (!receiptForm.donorId) {
      toast.error('Sila pilih penderma')
      return
    }
    if (!receiptForm.amount || parseFloat(receiptForm.amount) <= 0) {
      toast.error('Jumlah mesti lebih daripada 0')
      return
    }
    if (!receiptForm.donationDate) {
      toast.error('Tarikh derma diperlukan')
      return
    }
    try {
      await api.post('/donors/receipts', {
        ...receiptForm,
        amount: parseFloat(receiptForm.amount),
      })
      toast.success('Resit cukai berjaya dijana')
      setReceiptDialogOpen(false)
      setReceiptForm(emptyReceiptForm)
      fetchReceipts()
      fetchStats()
      if (selectedDonorId === receiptForm.donorId) {
        void fetchDonorDetail(receiptForm.donorId)
      }
    } catch {
      toast.error('Gagal menjana resit cukai')
    }
  }

  // ─── Communication handler ────────────────────────────────────────────────

  const saveComm = async () => {
    if (!commForm.donorId) {
      toast.error('Sila pilih penderma')
      return
    }
    if (!commForm.subject.trim()) {
      toast.error('Subjek diperlukan')
      return
    }
    try {
      await api.post('/donors/communications', commForm)
      toast.success('Komunikasi berjaya direkod')
      setCommDialogOpen(false)
      setCommForm(emptyCommForm)
      fetchCommunications()
      if (selectedDonorId === commForm.donorId) {
        void fetchDonorDetail(commForm.donorId)
      }
    } catch {
      toast.error('Gagal merekod komunikasi')
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n)

  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  const formatDateTime = (d: string | null) =>
    d ? new Date(d).toLocaleString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

  const totalPages = (total: number) => Math.max(1, Math.ceil(total / pageSize))

  const detailDonor = donorDetail?.donor || selectedDonorPreview
  const detailSegment = detailDonor ? (segmentMap[detailDonor.segment] || segmentMap.occasional) : null
  const detailStatus = detailDonor ? (statusMap[detailDonor.status] || statusMap.active) : null
  const detailAddress = detailDonor
    ? [detailDonor.address, detailDonor.city, detailDonor.state].filter(Boolean).join(', ') || '—'
    : '—'
  const detailPreferredContact = detailDonor?.preferredContact
    ? (preferredContactMap[detailDonor.preferredContact] || detailDonor.preferredContact)
    : '—'

  // ─── Pagination component ─────────────────────────────────────────────────

  const Pagination = ({ current, total }: { current: number; total: number }) => {
    const pages = totalPages(total)
    if (pages <= 1) return null
    return (
      <div className="flex items-center justify-between px-1 pt-4">
        <p className="text-sm text-muted-foreground">
          Halaman {current} daripada {pages} ({total} rekod)
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={current <= 1}
            onClick={() => {
              if (total === donorTotal) setDonorPage((p) => p - 1)
              else if (total === receiptTotal) setReceiptPage((p) => p - 1)
              else setCommPage((p) => p - 1)
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={current >= pages}
            onClick={() => {
              if (total === donorTotal) setDonorPage((p) => p + 1)
              else if (total === receiptTotal) setReceiptPage((p) => p + 1)
              else setCommPage((p) => p + 1)
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100">
              <Heart className="h-6 w-6 text-purple-700" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                CRM Penderma
              </h1>
              <p className="text-sm text-gray-500">
                Pengurusan Hubungan Penderma & Resit Cukai LHDN
              </p>
            </div>
          </div>
        </header>

        {/* ── Stats Cards ────────────────────────────────────────────────── */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Jumlah Penderma', value: stats?.totalDonors ?? '—', icon: Users, color: 'text-primary', bg: 'bg-primary/20', border: 'from-primary to-purple-600' },
            { label: 'Jumlah Derma', value: stats?.totalAmount ? formatCurrency(stats.totalAmount) : '—', icon: TrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'from-cyan-400 to-cyan-600' },
            { label: 'Penderma Tetap', value: stats?.regularDonors ?? '—', icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/20', border: 'from-pink-400 to-pink-600' },
            { label: 'Resit Cukai', value: stats?.totalReceipts ?? '—', icon: Receipt, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'from-blue-400 to-blue-600' },
          ].map((stat) => (
            <Card key={stat.label} className="relative overflow-hidden bg-card backdrop-blur-xl border-white/10 shadow-xl shadow-black/20">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
                      {stat.label}
                    </p>
                    <p className="mt-1 text-xl sm:text-2xl font-bold text-foreground truncate">
                      {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                    </p>
                  </div>
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
              <div className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r ${stat.border}`} />
            </Card>
          ))}
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────────── */}
        <Tabs defaultValue="donors" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10 p-1">
            <TabsTrigger value="donors" className="data-[state=active]:bg-primary data-[state=active]:text-white gap-1.5 transition-all">
              <Users className="h-4 w-4" />
              Senarai Penderma
            </TabsTrigger>
            <TabsTrigger value="receipts" className="data-[state=active]:bg-primary data-[state=active]:text-white gap-1.5 transition-all">
              <Receipt className="h-4 w-4" />
              Resit Cukai LHDN
            </TabsTrigger>
            <TabsTrigger value="communications" className="data-[state=active]:bg-primary data-[state=active]:text-white gap-1.5 transition-all">
              <Mail className="h-4 w-4" />
              Komunikasi
            </TabsTrigger>
          </TabsList>

          {/* ── Tab 1: Senarai Penderma ──────────────────────────────────── */}
          <TabsContent value="donors">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Senarai Penderma
                  </CardTitle>
                  <Button onClick={openCreateDonor} className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all active:scale-95 gap-2 w-full sm:w-auto">
                    <Plus className="h-4 w-4" />
                    Daftar Penderma
                  </Button>
                </div>
                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Cari nama, No. IC, No. Penderma..."
                      value={donorSearch}
                      onChange={(e) => { setDonorSearch(e.target.value); setDonorPage(1) }}
                      className="pl-9"
                    />
                  </div>
                  <Select value={donorSegment} onValueChange={(v) => { setDonorSegment(v === '__all__' ? '' : v); setDonorPage(1) }}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                      <SelectValue placeholder="Semua Segment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Semua Segment</SelectItem>
                      <SelectItem value="major">Major</SelectItem>
                      <SelectItem value="regular">Tetap</SelectItem>
                      <SelectItem value="occasional">Sekali-sekala</SelectItem>
                      <SelectItem value="lapsed">Tidak Aktif</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={donorStatus} onValueChange={(v) => { setDonorStatus(v === '__all__' ? '' : v); setDonorPage(1) }}>
                    <SelectTrigger className="w-full sm:w-[140px]">
                      <SelectValue placeholder="Semua Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Semua Status</SelectItem>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="inactive">Tidak Aktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {donorLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                  </div>
                ) : donors.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Heart className="h-12 w-12 text-gray-200 mb-3" />
                    <p className="text-sm font-medium text-gray-400">Tiada penderma dijumpai</p>
                    <p className="text-xs text-gray-300 mt-1">Daftar penderma baharu untuk bermula</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-purple-50/50 hover:bg-purple-50/50">
                            <TableHead className="font-semibold text-purple-900">No. Penderma</TableHead>
                            <TableHead className="font-semibold text-purple-900">Nama</TableHead>
                            <TableHead className="font-semibold text-purple-900 hidden md:table-cell">No. IC</TableHead>
                            <TableHead className="font-semibold text-purple-900 hidden lg:table-cell">Emel</TableHead>
                            <TableHead className="font-semibold text-purple-900">Segment</TableHead>
                            <TableHead className="font-semibold text-purple-900 text-right">Jumlah Derma</TableHead>
                            <TableHead className="font-semibold text-purple-900 text-center hidden sm:table-cell">Kali Derma</TableHead>
                            <TableHead className="font-semibold text-purple-900">Status</TableHead>
                            <TableHead className="font-semibold text-purple-900 text-right">Tindakan</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {donors.map((d) => {
                            const seg = segmentMap[d.segment] || segmentMap.occasional
                            const sts = statusMap[d.status] || statusMap.active
                            return (
                              <TableRow key={d.id} className="group">
                                <TableCell className="font-mono text-xs font-medium text-purple-700">{d.donorNumber}</TableCell>
                                <TableCell className="font-medium text-gray-900">{d.name}</TableCell>
                                <TableCell className="text-gray-500 hidden md:table-cell">{d.ic || '—'}</TableCell>
                                <TableCell className="text-gray-500 hidden lg:table-cell truncate max-w-[180px]">{d.email || '—'}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className={`${seg.color} text-[11px] font-semibold px-2 py-0.5`}>
                                    {seg.label}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right font-semibold text-gray-900">{formatCurrency(d.totalDonated)}</TableCell>
                                <TableCell className="text-center text-gray-600 hidden sm:table-cell">{d.donationCount}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className={`${sts.color} text-[11px] font-semibold px-2 py-0.5`}>
                                    {sts.label}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600" onClick={() => void openDonorDetail(d)} title="Lihat butiran">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-purple-600" onClick={() => openEditDonor(d)} title="Kemaskini">
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600" onClick={() => confirmDelete('donor', d.id, d.name, d.id)} title="Padam">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    <Pagination current={donorPage} total={donorTotal} />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab 2: Resit Cukai LHDN ─────────────────────────────────── */}
          <TabsContent value="receipts">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Resit Cukai LHDN s44(6)
                  </CardTitle>
                  <Button onClick={() => setReceiptDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700 gap-2 w-full sm:w-auto">
                    <Plus className="h-4 w-4" />
                    Jana Resit Cukai
                  </Button>
                </div>
                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Cari no. resit, penderma, rujukan..."
                      value={receiptSearch}
                      onChange={(e) => { setReceiptSearch(e.target.value); setReceiptPage(1) }}
                      className="pl-9"
                    />
                  </div>
                  <Select value={receiptYear || '__all__'} onValueChange={(v) => { setReceiptYear(v === '__all__' ? '' : v); setReceiptPage(1) }}>
                    <SelectTrigger className="w-full sm:w-[140px]">
                      <SelectValue placeholder="Semua Tahun" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Semua Tahun</SelectItem>
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {receiptLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                  </div>
                ) : receipts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Receipt className="h-12 w-12 text-gray-200 mb-3" />
                    <p className="text-sm font-medium text-gray-400">Tiada resit cukai dijumpai</p>
                    <p className="text-xs text-gray-300 mt-1">Jana resit cukai baharu untuk penderma</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-purple-50/50 hover:bg-purple-50/50">
                            <TableHead className="font-semibold text-purple-900">No. Resit</TableHead>
                            <TableHead className="font-semibold text-purple-900">Penderma</TableHead>
                            <TableHead className="font-semibold text-purple-900 text-right">Jumlah (RM)</TableHead>
                            <TableHead className="font-semibold text-purple-900 hidden sm:table-cell">Tarikh Derma</TableHead>
                            <TableHead className="font-semibold text-purple-900 hidden md:table-cell">Tujuan</TableHead>
                            <TableHead className="font-semibold text-purple-900 hidden lg:table-cell">Rujukan LHDN</TableHead>
                            <TableHead className="font-semibold text-purple-900 hidden sm:table-cell">Tarikh Dikeluarkan</TableHead>
                            <TableHead className="font-semibold text-purple-900 text-center">LHDN</TableHead>
                            <TableHead className="font-semibold text-purple-900 text-right">Tindakan</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {receipts.map((r) => (
                            <TableRow key={r.id} className="group">
                              <TableCell className="font-mono text-xs font-medium text-purple-700">{r.receiptNumber}</TableCell>
                              <TableCell>
                                <div className="font-medium text-gray-900">{r.donor.name}</div>
                                <div className="text-[11px] text-gray-400">{r.donor.donorNumber}</div>
                              </TableCell>
                              <TableCell className="text-right font-semibold text-gray-900">{formatCurrency(r.amount)}</TableCell>
                              <TableCell className="text-gray-500 hidden sm:table-cell">{formatDate(r.donationDate)}</TableCell>
                              <TableCell className="text-gray-500 hidden md:table-cell truncate max-w-[200px]">{r.purpose}</TableCell>
                              <TableCell className="text-gray-500 hidden lg:table-cell font-mono text-xs">{r.lhdnRef || '—'}</TableCell>
                              <TableCell className="text-gray-500 hidden sm:table-cell">{formatDate(r.issuedAt)}</TableCell>
                              <TableCell className="text-center">
                                <Badge className="bg-emerald-100 text-emerald-700 text-[10px] font-semibold px-1.5 py-0.5 gap-1">
                                  <ShieldCheck className="h-3 w-3" />
                                  s44(6)
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600" onClick={() => confirmDelete('receipt', r.id, r.receiptNumber, r.donorId)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <Pagination current={receiptPage} total={receiptTotal} />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab 3: Komunikasi ────────────────────────────────────────── */}
          <TabsContent value="communications">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Rekod Komunikasi
                  </CardTitle>
                  <Button onClick={() => setCommDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700 gap-2 w-full sm:w-auto">
                    <Send className="h-4 w-4" />
                    Hantar Komunikasi
                  </Button>
                </div>
                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Cari subjek, kandungan, atau penderma..."
                      value={commSearch}
                      onChange={(e) => { setCommSearch(e.target.value); setCommPage(1) }}
                      className="pl-9"
                    />
                  </div>
                  <Select value={commType || '__all__'} onValueChange={(v) => { setCommType(v === '__all__' ? '' : v); setCommPage(1) }}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="Semua Jenis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Semua Jenis</SelectItem>
                      <SelectItem value="email">E-mel</SelectItem>
                      <SelectItem value="phone">Telefon</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="letter">Surat</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={commStatus || '__all__'} onValueChange={(v) => { setCommStatus(v === '__all__' ? '' : v); setCommPage(1) }}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="Semua Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Semua Status</SelectItem>
                      <SelectItem value="draft">Draf</SelectItem>
                      <SelectItem value="sent">Dihantar</SelectItem>
                      <SelectItem value="failed">Gagal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {commLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                  </div>
                ) : communications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Mail className="h-12 w-12 text-gray-200 mb-3" />
                    <p className="text-sm font-medium text-gray-400">Tiada rekod komunikasi</p>
                    <p className="text-xs text-gray-300 mt-1">Hantar komunikasi pertama anda kepada penderma</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-purple-50/50 hover:bg-purple-50/50">
                            <TableHead className="font-semibold text-purple-900">Penderma</TableHead>
                            <TableHead className="font-semibold text-purple-900">Jenis</TableHead>
                            <TableHead className="font-semibold text-purple-900">Subjek</TableHead>
                            <TableHead className="font-semibold text-purple-900 hidden sm:table-cell">Status</TableHead>
                            <TableHead className="font-semibold text-purple-900 hidden md:table-cell">Tarikh</TableHead>
                            <TableHead className="font-semibold text-purple-900 text-right">Tindakan</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {communications.map((c) => {
                            const ct = commTypeMap[c.type] || commTypeMap.email
                            const cs = commStatusMap[c.status] || commStatusMap.sent
                            const CommIcon = ct.icon
                            return (
                              <TableRow key={c.id} className="group">
                                <TableCell>
                                  <div className="font-medium text-gray-900">{c.donor.name}</div>
                                  <div className="text-[11px] text-gray-400">{c.donor.donorNumber}</div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1.5">
                                    <CommIcon className={`h-4 w-4 ${ct.color}`} />
                                    <span className="text-sm text-gray-700">{ct.label}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-gray-900 font-medium">{c.subject}</TableCell>
                                <TableCell className="hidden sm:table-cell">
                                  <Badge variant="secondary" className={`${cs.color} text-[11px] font-semibold px-2 py-0.5`}>
                                    {cs.label}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-gray-500 hidden md:table-cell">{formatDate(c.sentAt || c.createdAt)}</TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600" onClick={() => confirmDelete('communication', c.id, c.subject, c.donorId)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    <Pagination current={commPage} total={commTotal} />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          DIALOGS
         ══════════════════════════════════════════════════════════════════ */}

      {/* ── Donor Form Dialog ────────────────────────────────────────────── */}
      <Dialog open={donorDialogOpen} onOpenChange={setDonorDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-purple-900">
              {editingDonor ? 'Kemaskini Penderma' : 'Daftar Penderma Baharu'}
            </DialogTitle>
            <DialogDescription>
              {editingDonor ? 'Kemaskini maklumat penderma di bawah.' : 'Isikan maklumat penderma baharu.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="d-name">Nama Penderma <span className="text-red-500">*</span></Label>
                <Input id="d-name" value={donorForm.name} onChange={(e) => setDonorForm({ ...donorForm, name: e.target.value })} placeholder="Nama penuh" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="d-ic">No. Kad Pengenalan</Label>
                <Input id="d-ic" value={donorForm.ic} onChange={(e) => setDonorForm({ ...donorForm, ic: e.target.value })} placeholder="XXXXXX-XX-XXXX" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="d-phone">No. Telefon</Label>
                <Input id="d-phone" value={donorForm.phone} onChange={(e) => setDonorForm({ ...donorForm, phone: e.target.value })} placeholder="01X-XXXXXXX" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="d-email">Emel</Label>
                <Input id="d-email" type="email" value={donorForm.email} onChange={(e) => setDonorForm({ ...donorForm, email: e.target.value })} placeholder="emel@contoh.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="d-address">Alamat</Label>
              <Input id="d-address" value={donorForm.address} onChange={(e) => setDonorForm({ ...donorForm, address: e.target.value })} placeholder="Alamat penuh" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="d-city">Bandar</Label>
                <Input id="d-city" value={donorForm.city} onChange={(e) => setDonorForm({ ...donorForm, city: e.target.value })} placeholder="Bandar" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="d-state">Negeri</Label>
                <Input id="d-state" value={donorForm.state} onChange={(e) => setDonorForm({ ...donorForm, state: e.target.value })} placeholder="Negeri" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Segment</Label>
                <Select value={donorForm.segment} onValueChange={(v) => setDonorForm({ ...donorForm, segment: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="major">Major</SelectItem>
                    <SelectItem value="regular">Tetap</SelectItem>
                    <SelectItem value="occasional">Sekali-sekala</SelectItem>
                    <SelectItem value="lapsed">Tidak Aktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kaedah Hubungan</Label>
                <Select value={donorForm.preferredContact || '__none__'} onValueChange={(v) => setDonorForm({ ...donorForm, preferredContact: v === '__none__' ? '' : v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Tiada keutamaan</SelectItem>
                    <SelectItem value="email">E-mel</SelectItem>
                    <SelectItem value="phone">Telefon</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={donorForm.status} onValueChange={(v) => setDonorForm({ ...donorForm, status: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Tidak Aktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="d-notes">Catatan</Label>
              <Textarea id="d-notes" value={donorForm.notes} onChange={(e) => setDonorForm({ ...donorForm, notes: e.target.value })} placeholder="Catatan tambahan..." rows={3} />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDonorDialogOpen(false)}>Batal</Button>
            <Button onClick={saveDonor} className="bg-purple-600 hover:bg-purple-700">
              {editingDonor ? 'Simpan Perubahan' : 'Daftar Penderma'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Donor Detail Dialog ──────────────────────────────────────────── */}
      <Dialog open={donorDetailOpen} onOpenChange={(open) => { if (!open) closeDonorDetail() }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[880px]">
          <DialogHeader>
            <DialogTitle className="text-purple-900">
              {detailDonor?.name || 'Butiran Penderma'}
            </DialogTitle>
            <DialogDescription>
              {detailDonor ? `${detailDonor.donorNumber} • Ringkasan resit cukai dan komunikasi terkini` : 'Memuatkan maklumat penderma...'}
            </DialogDescription>
          </DialogHeader>

          {donorDetailLoading && !donorDetail ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
          ) : donorDetailError && !donorDetail ? (
            <div className="rounded-lg border border-dashed border-red-200 bg-red-50 px-4 py-10 text-center text-sm text-red-600">
              Butiran penderma gagal dimuatkan. Cuba buka semula dialog ini.
            </div>
          ) : !detailDonor ? (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
              Butiran penderma tidak tersedia.
            </div>
          ) : (
            <div className="grid gap-5 py-2">
              <div className="rounded-xl border border-purple-100 bg-purple-50/70 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="bg-white text-purple-700 border border-purple-100">
                        {detailDonor.donorNumber}
                      </Badge>
                      {detailSegment && (
                        <Badge variant="secondary" className={`${detailSegment.color} text-[11px] font-semibold px-2 py-0.5`}>
                          {detailSegment.label}
                        </Badge>
                      )}
                      {detailStatus && (
                        <Badge variant="secondary" className={`${detailStatus.color} text-[11px] font-semibold px-2 py-0.5`}>
                          {detailStatus.label}
                        </Badge>
                      )}
                      {detailDonor.isAnonymous && (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-700 text-[11px] font-semibold px-2 py-0.5">
                          Tanpa Nama
                        </Badge>
                      )}
                    </div>
                    <div className="grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                      <div>
                        <span className="text-gray-400">Telefon:</span>{' '}
                        <span className="font-medium text-gray-800">{detailDonor.phone || '—'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Emel:</span>{' '}
                        <span className="font-medium text-gray-800">{detailDonor.email || '—'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Kaedah hubungan:</span>{' '}
                        <span className="font-medium text-gray-800">{detailPreferredContact}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Tarikh daftar:</span>{' '}
                        <span className="font-medium text-gray-800">{formatDate(detailDonor.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid min-w-full grid-cols-2 gap-3 sm:min-w-[320px]">
                    <div className="rounded-lg bg-white/90 p-3 shadow-sm">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Jumlah Derma</p>
                      <p className="mt-1 text-lg font-bold text-gray-900">{formatCurrency(detailDonor.totalDonated)}</p>
                    </div>
                    <div className="rounded-lg bg-white/90 p-3 shadow-sm">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Kali Derma</p>
                      <p className="mt-1 text-lg font-bold text-gray-900">{detailDonor.donationCount}</p>
                    </div>
                    <div className="rounded-lg bg-white/90 p-3 shadow-sm">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Resit Direkod</p>
                      <p className="mt-1 text-lg font-bold text-gray-900">{donorDetail?.receipts.total ?? detailDonor._count.taxReceipts}</p>
                    </div>
                    <div className="rounded-lg bg-white/90 p-3 shadow-sm">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Komunikasi</p>
                      <p className="mt-1 text-lg font-bold text-gray-900">{donorDetail?.communications.total ?? detailDonor._count.communications}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-[1.05fr_1.4fr]">
                <Card className="border border-gray-200 shadow-none">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-gray-900">Profil Ringkas</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 text-sm">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">No. Kad Pengenalan</p>
                      <p className="mt-1 font-medium text-gray-900">{detailDonor.ic || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Alamat</p>
                      <p className="mt-1 text-gray-700">{detailAddress}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Derma Pertama</p>
                        <p className="mt-1 font-medium text-gray-900">{formatDate(detailDonor.firstDonationAt || '')}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Derma Terakhir</p>
                        <p className="mt-1 font-medium text-gray-900">{formatDate(detailDonor.lastDonationAt || '')}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Catatan</p>
                      <p className="mt-1 whitespace-pre-wrap text-gray-700">{detailDonor.notes || 'Tiada catatan tambahan.'}</p>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-5">
                  <Card className="border border-gray-200 shadow-none">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <CardTitle className="text-base text-gray-900">Resit Terkini</CardTitle>
                          <p className="mt-1 text-sm text-gray-500">
                            {donorDetail?.receipts.total ?? 0} resit • {formatCurrency(donorDetail?.receipts.totalAmount ?? 0)}
                          </p>
                        </div>
                        <p className="text-xs text-gray-400">
                          Terakhir dikeluarkan: {formatDate(donorDetail?.receipts.latestIssuedAt || '')}
                        </p>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(donorDetail?.receipts.items || []).length === 0 ? (
                        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                          Tiada resit direkodkan untuk penderma ini.
                        </div>
                      ) : (
                        donorDetail?.receipts.items.map((receipt) => (
                          <div key={receipt.id} className="rounded-lg border border-gray-100 bg-gray-50/70 p-4">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{receipt.receiptNumber}</p>
                                <p className="mt-1 text-xs text-gray-500">
                                  Tarikh derma {formatDate(receipt.donationDate)} • Dikeluarkan {formatDate(receipt.issuedAt)}
                                </p>
                              </div>
                              <p className="text-sm font-semibold text-gray-900">{formatCurrency(receipt.amount)}</p>
                            </div>
                            <p className="mt-2 text-sm text-gray-700">{receipt.purpose}</p>
                            <p className="mt-2 text-xs text-gray-500">Rujukan LHDN: {receipt.lhdnRef || '—'}</p>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 shadow-none">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <CardTitle className="text-base text-gray-900">Komunikasi Terkini</CardTitle>
                          <p className="mt-1 text-sm text-gray-500">
                            {donorDetail?.communications.total ?? 0} rekod • {donorDetail?.communications.sentCount ?? 0} dihantar
                          </p>
                        </div>
                        <div className="text-xs text-gray-400">
                          Aktiviti terakhir: {formatDateTime(donorDetail?.communications.latestActivityAt || null)}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">Dihantar {donorDetail?.communications.sentCount ?? 0}</Badge>
                        <Badge variant="secondary" className="bg-gray-100 text-gray-700">Draf {donorDetail?.communications.draftCount ?? 0}</Badge>
                        <Badge variant="secondary" className="bg-red-50 text-red-700">Gagal {donorDetail?.communications.failedCount ?? 0}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(donorDetail?.communications.items || []).length === 0 ? (
                        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                          Tiada komunikasi direkodkan untuk penderma ini.
                        </div>
                      ) : (
                        donorDetail?.communications.items.map((communication) => {
                          const commType = commTypeMap[communication.type] || commTypeMap.email
                          const commStatus = commStatusMap[communication.status] || commStatusMap.sent
                          const CommIcon = commType.icon

                          return (
                            <div key={communication.id} className="rounded-lg border border-gray-100 bg-gray-50/70 p-4">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <CommIcon className={`h-4 w-4 ${commType.color}`} />
                                    <p className="truncate font-medium text-gray-900">{communication.subject}</p>
                                  </div>
                                  <p className="mt-1 text-xs text-gray-500">
                                    {commType.label} • {formatDateTime(communication.sentAt || communication.createdAt)}
                                  </p>
                                </div>
                                <Badge variant="secondary" className={`${commStatus.color} text-[11px] font-semibold px-2 py-0.5`}>
                                  {commStatus.label}
                                </Badge>
                              </div>
                              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                                {communication.content || 'Tiada kandungan tambahan.'}
                              </p>
                            </div>
                          )
                        })
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Receipt Form Dialog ──────────────────────────────────────────── */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-purple-900">Jana Resit Cukai LHDN</DialogTitle>
            <DialogDescription>
              Jana resit cukai selaras dengan Akta Cukai Pendapatan 1967, Seksyen 44(6).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Penderma <span className="text-red-500">*</span></Label>
              <Select value={receiptForm.donorId} onValueChange={(v) => setReceiptForm({ ...receiptForm, donorId: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih penderma" />
                </SelectTrigger>
                <SelectContent>
                  {donorOptionsLoading && <SelectItem value="__loading-receipt" disabled>Memuatkan penderma...</SelectItem>}
                  {donorOptions.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} ({d.donorNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-amount">Jumlah (RM) <span className="text-red-500">*</span></Label>
              <Input id="r-amount" type="number" step="0.01" min="0" value={receiptForm.amount} onChange={(e) => setReceiptForm({ ...receiptForm, amount: e.target.value })} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-date">Tarikh Derma <span className="text-red-500">*</span></Label>
              <Input id="r-date" type="date" value={receiptForm.donationDate} onChange={(e) => setReceiptForm({ ...receiptForm, donationDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-purpose">Tujuan</Label>
              <Input id="r-purpose" value={receiptForm.purpose} onChange={(e) => setReceiptForm({ ...receiptForm, purpose: e.target.value })} placeholder="Sumbangan amal kepada PUSPA" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-lhdn">Rujukan LHDN</Label>
              <Input id="r-lhdn" value={receiptForm.lhdnRef} onChange={(e) => setReceiptForm({ ...receiptForm, lhdnRef: e.target.value })} placeholder="No. rujukan kelulusan LHDN" />
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <p className="text-sm font-medium text-emerald-800">Akta Cukai Pendapatan 1967, Seksyen 44(6)</p>
              </div>
              <p className="mt-1 text-xs text-emerald-600">
                Resit ini layak untuk pelepasan cukai pendapatan. Sila pastikan maklumat penderma tepat.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setReceiptDialogOpen(false)}>Batal</Button>
            <Button onClick={saveReceipt} className="bg-purple-600 hover:bg-purple-700 gap-2">
              <FileText className="h-4 w-4" />
              Jana Resit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Communication Form Dialog ────────────────────────────────────── */}
      <Dialog open={commDialogOpen} onOpenChange={setCommDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-purple-900">Hantar Komunikasi</DialogTitle>
            <DialogDescription>
              Rekod komunikasi kepada penderma.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Penderma <span className="text-red-500">*</span></Label>
              <Select value={commForm.donorId} onValueChange={(v) => setCommForm({ ...commForm, donorId: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih penderma" />
                </SelectTrigger>
                <SelectContent>
                  {donorOptionsLoading && <SelectItem value="__loading-communication" disabled>Memuatkan penderma...</SelectItem>}
                  {donorOptions.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} ({d.donorNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jenis</Label>
                <Select value={commForm.type} onValueChange={(v) => setCommForm({ ...commForm, type: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">E-mel</SelectItem>
                    <SelectItem value="phone">Telefon</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="letter">Surat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={commForm.status} onValueChange={(v) => setCommForm({ ...commForm, status: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sent">Dihantar</SelectItem>
                    <SelectItem value="draft">Draf</SelectItem>
                    <SelectItem value="failed">Gagal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-subject">Subjek <span className="text-red-500">*</span></Label>
              <Input id="c-subject" value={commForm.subject} onChange={(e) => setCommForm({ ...commForm, subject: e.target.value })} placeholder="Subjek komunikasi" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-content">Kandungan</Label>
              <Textarea id="c-content" value={commForm.content} onChange={(e) => setCommForm({ ...commForm, content: e.target.value })} placeholder="Kandungan komunikasi..." rows={4} />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCommDialogOpen(false)}>Batal</Button>
            <Button onClick={saveComm} className="bg-purple-600 hover:bg-purple-700 gap-2">
              <Send className="h-4 w-4" />
              Hantar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ───────────────────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pastikan Pemadaman</AlertDialogTitle>
            <AlertDialogDescription>
              Adakah anda pasti ingin memadam <strong>{deleteTarget?.name}</strong>? Tindakan ini tidak boleh dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-red-600 hover:bg-red-700">
              Padam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
