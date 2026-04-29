'use client'

import { useState, useEffect, useCallback, useRef, type ChangeEvent } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  Archive,
  FileText,
  Shield,
  Building,
  FileCheck,
  Search,
  Plus,
  Pencil,
  Trash2,
  Download,
  Eye,
  Clock,
  AlertTriangle,
  FolderOpen,
  File,
  X,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Calendar,
  HardDrive,
  Tag,
  FileUp,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Document {
  id: string
  title: string
  description: string | null
  category: string
  subcategory: string | null
  fileName: string
  fileSize: number
  mimeType: string | null
  fileUrl: string | null
  version: number
  status: string
  uploadedBy: string | null
  expiryDate: string | null
  tags: string[]
  createdAt: string
  updatedAt: string
}

interface DocumentStats {
  totalCategories: number
  totalDocuments: number
  activeDocuments: number
  expiringDocuments: number
  expiredDocuments: number
  categoryStats: { category: string; count: number }[]
}

interface PaginatedResponse {
  data: Document[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface UploadResponse {
  path: string
  url: string
  fileName: string
  size: number
  mimeType: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'PENDAFTARAN', label: 'Pendaftaran', icon: Building, color: 'violet' },
  { value: 'TADBIR_URUS', label: 'Tadbir Urus', icon: FileCheck, color: 'purple' },
  { value: 'KEWANGAN', label: 'Kewangan', icon: FileText, color: 'fuchsia' },
  { value: 'PEMATUHAN', label: 'Pematuhan', icon: Shield, color: 'purple' },
  { value: 'OPERASI', label: 'Operasi', icon: Archive, color: 'violet' },
  { value: 'PROGRAM', label: 'Program', icon: FolderOpen, color: 'fuchsia' },
] as const

const CATEGORY_FILTERS = [
  { value: '', label: 'Semua' },
  ...CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
]

const STATUS_FILTERS = [
  { value: '', label: 'Semua Status' },
  { value: 'active', label: 'Aktif' },
  { value: 'archived', label: 'Diarkibkan' },
]

const SUBCATEGORIES: Record<string, string[]> = {
  PENDAFTARAN: ['Sijil ROS', 'Perlembagaan', 'SSM', 'Lesen', 'Pendaftaran Negeri'],
  TADBIR_URUS: ['Minit AGM', 'Minit Mesyuarat', 'Resolusi', 'Polisi', 'SOP'],
  KEWANGAN: ['Laporan Audit', 'Penyata Kewangan', 'Bajet', 'Resit', 'Invois'],
  PEMATUHAN: ['Kelulusan LHDN', 'Notis PDPA', 'Polisi AML/CFT', 'Pemeriksaan', 'Laporan Pematuhan'],
  OPERASI: ['MOU', 'Perjanjian', 'Kontrak', 'Laporan Operasi', 'Prosedur'],
  PROGRAM: ['Proposal', 'Laporan Aktiviti', 'Kehadiran', 'Foto', 'Penilaian'],
}

const colorMap: Record<string, { bg: string; icon: string; badge: string; text: string; dot: string; ring: string }> = {
  violet: {
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    icon: 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400',
    badge: 'border-violet-200 text-violet-600 bg-violet-50 dark:border-violet-800 dark:text-violet-400 dark:bg-violet-950/40',
    text: 'text-violet-600 dark:text-violet-400',
    dot: 'bg-violet-400',
    ring: 'ring-violet-200',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    icon: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400',
    badge: 'border-purple-200 text-purple-600 bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:bg-purple-950/40',
    text: 'text-purple-600 dark:text-purple-400',
    dot: 'bg-purple-400',
    ring: 'ring-purple-200',
  },
  fuchsia: {
    bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/30',
    icon: 'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/40 dark:text-fuchsia-400',
    badge: 'border-fuchsia-200 text-fuchsia-600 bg-fuchsia-50 dark:border-fuchsia-800 dark:text-fuchsia-400 dark:bg-fuchsia-950/40',
    text: 'text-fuchsia-600 dark:text-fuchsia-400',
    dot: 'bg-fuchsia-400',
    ring: 'ring-fuchsia-200',
  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + units[i]
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ms-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getDaysUntilExpiry(expiryDate: string | null): number | null {
  if (!expiryDate) return null
  const now = new Date()
  const expiry = new Date(expiryDate)
  const diffMs = expiry.getTime() - now.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

function getCategoryInfo(categoryValue: string) {
  return CATEGORIES.find((c) => c.value === categoryValue) || CATEGORIES[0]
}

function getCategoryColor(categoryValue: string) {
  const cat = CATEGORIES.find((c) => c.value === categoryValue)
  return colorMap[cat?.color || 'purple']
}

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return FileText
  if (mimeType.includes('pdf')) return FileText
  if (mimeType.includes('image')) return File
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return FileCheck
  return FileText
}

// ─── Empty State Component ───────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 dark:bg-purple-950/30 mb-4">
        <FolderOpen className="h-8 w-8 text-purple-400" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
        Tiada dokumen dijumpai
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
        Mulakan dengan memuat naik dokumen pertama anda menggunakan butang &ldquo;Muat Naik Dokumen&rdquo; di atas.
      </p>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function DocumentsPage() {
  // Data state
  const [documents, setDocuments] = useState<Document[]>([])
  const [stats, setStats] = useState<DocumentStats | null>(null)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // UI state
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(12)

  // Dialog states
  const [uploadOpen, setUploadOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    fileName: '',
    fileSize: 0,
    mimeType: '',
    fileUrl: '',
    expiryDate: '',
    tags: '',
  })

  const resetForm = useCallback(() => {
    setForm({
      title: '',
      description: '',
      category: '',
      subcategory: '',
      fileName: '',
      fileSize: 0,
      mimeType: '',
      fileUrl: '',
      expiryDate: '',
      tags: '',
    })
  }, [])

  // ─── Fetch Stats ──────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true)
      const data = await api.get<DocumentStats>('/documents/stats')
      setStats(data)
    } catch {
      // Silent fail for stats
    } finally {
      setStatsLoading(false)
    }
  }, [])

  // ─── Fetch Documents ──────────────────────────────────────────────────

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.get<PaginatedResponse>('/documents', {
        page,
        pageSize,
        search: search || undefined,
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })
      setDocuments(data.data)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch {
      toast.error('Gagal memuatkan dokumen')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, categoryFilter, statusFilter])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [search, categoryFilter, statusFilter])

  // ─── Handlers ─────────────────────────────────────────────────────────

  const handleUpload = async () => {
    if (uploadingFile) {
      toast.error('Sila tunggu muat naik fail selesai')
      return
    }
    if (!form.title.trim()) {
      toast.error('Sila masukkan tajuk dokumen')
      return
    }
    if (!form.category) {
      toast.error('Sila pilih kategori')
      return
    }
    if (!form.fileName.trim()) {
      toast.error('Sila masukkan nama fail')
      return
    }

    try {
      setSubmitting(true)
      const tagsArr = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      await api.post('/documents', {
        title: form.title,
        description: form.description || undefined,
        category: form.category,
        subcategory: form.subcategory || undefined,
        fileName: form.fileName,
        fileSize: form.fileSize,
        mimeType: form.mimeType || undefined,
        fileUrl: form.fileUrl || undefined,
        expiryDate: form.expiryDate || undefined,
        tags: tagsArr.length > 0 ? tagsArr : undefined,
      })

      toast.success('Dokumen berjaya dimuat naik')
      setUploadOpen(false)
      resetForm()
      fetchDocuments()
      fetchStats()
    } catch {
      toast.error('Gagal memuat naik dokumen')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedDoc) return
    if (uploadingFile) {
      toast.error('Sila tunggu muat naik fail selesai')
      return
    }
    if (!form.title.trim()) {
      toast.error('Sila masukkan tajuk dokumen')
      return
    }

    try {
      setSubmitting(true)
      const tagsArr = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      await api.put('/documents', {
        id: selectedDoc.id,
        title: form.title,
        description: form.description || undefined,
        category: form.category,
        subcategory: form.subcategory || undefined,
        fileName: form.fileName,
        fileSize: form.fileSize,
        mimeType: form.mimeType || undefined,
        fileUrl: form.fileUrl || undefined,
        expiryDate: form.expiryDate || undefined,
        tags: tagsArr.length > 0 ? tagsArr : undefined,
      })

      toast.success('Dokumen berjaya dikemas kini')
      setEditOpen(false)
      setSelectedDoc(null)
      resetForm()
      fetchDocuments()
      fetchStats()
    } catch {
      toast.error('Gagal mengemas kini dokumen')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedDoc) return

    try {
      await api.delete(`/documents?id=${selectedDoc.id}`)
      toast.success('Dokumen berjaya dipadam')
      setDeleteOpen(false)
      setSelectedDoc(null)
      fetchDocuments()
      fetchStats()
    } catch {
      toast.error('Gagal memadam dokumen')
    }
  }

  const openEditDialog = (doc: Document) => {
    setSelectedDoc(doc)
    setForm({
      title: doc.title,
      description: doc.description || '',
      category: doc.category,
      subcategory: doc.subcategory || '',
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType || '',
      fileUrl: doc.fileUrl || '',
      expiryDate: doc.expiryDate ? doc.expiryDate.split('T')[0] : '',
      tags: doc.tags?.join(', ') || '',
    })
    setEditOpen(true)
  }

  const openViewDialog = (doc: Document) => {
    setSelectedDoc(doc)
    setViewOpen(true)
  }

  const openDeleteDialog = (doc: Document) => {
    setSelectedDoc(doc)
    setDeleteOpen(true)
  }

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploadingFile(true)
      const formData = new FormData()
      formData.append('bucket', 'documents')
      formData.append('file', file)
      const uploaded = await api.postForm<UploadResponse>('/upload', formData)
      setForm((prev) => ({
        ...prev,
        fileName: uploaded.fileName,
        fileSize: uploaded.size,
        mimeType: uploaded.mimeType || file.type || 'application/octet-stream',
        fileUrl: uploaded.url,
      }))
      toast.success('Fail berjaya dimuat naik')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal memuat naik fail yang dipilih')
    } finally {
      setUploadingFile(false)
      event.target.value = ''
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950/50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ── Header ───────────────────────────────────────────────────── */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/40">
                <Archive className="h-6 w-6 text-purple-700 dark:text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                  Gudang Dokumen
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Pengurusan Dokumen Tadbir Urus
                </p>
              </div>
            </div>
            <Button
              onClick={() => {
                resetForm()
                setUploadOpen(true)
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white gap-2 shrink-0"
            >
              <FileUp className="h-4 w-4" />
              Muat Naik Dokumen
            </Button>
          </div>
        </header>

        {/* ── Stats Cards ──────────────────────────────────────────────── */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Jumlah Kategori
                  </p>
                  {statsLoading ? (
                    <Skeleton className="mt-1 h-8 w-12 rounded" />
                  ) : (
                    <p className="mt-1 text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {stats?.totalCategories || 0}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-purple-500 font-medium">Aktif</p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-900/30">
                  <FolderOpen className="h-5 w-5 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Jumlah Dokumen
                  </p>
                  {statsLoading ? (
                    <Skeleton className="mt-1 h-8 w-12 rounded" />
                  ) : (
                    <p className="mt-1 text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {stats?.totalDocuments || 0}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-purple-500 font-medium">Keseluruhan</p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-900/30">
                  <File className="h-5 w-5 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Sah Dituju
                  </p>
                  {statsLoading ? (
                    <Skeleton className="mt-1 h-8 w-12 rounded" />
                  ) : (
                    <p className="mt-1 text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {stats?.activeDocuments || 0}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-purple-500 font-medium">Aktif</p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-900/30">
                  <FileCheck className="h-5 w-5 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Akan Luput
                  </p>
                  {statsLoading ? (
                    <Skeleton className="mt-1 h-8 w-12 rounded" />
                  ) : (
                    <p className="mt-1 text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {stats?.expiringDocuments || 0}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-amber-500 font-medium">
                    Dalam 30 hari
                  </p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Category Filter Tabs ─────────────────────────────────────── */}
        <div className="mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto">
          <div className="flex gap-2 min-w-max pb-1">
            {CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategoryFilter(cat.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  categoryFilter === cat.value
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Search & Filters ────────────────────────────────────────── */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari dokumen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white dark:bg-gray-800"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val === '__all__' ? '' : val)}>
            <SelectTrigger className="w-full sm:w-44 bg-white dark:bg-gray-800">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Semua Status</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="archived">Diarkibkan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ── Document List ────────────────────────────────────────────── */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {loading ? (
              'Memuatkan...'
            ) : (
              <>
                Menunjukkan{' '}
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  {documents.length}
                </span>{' '}
                daripada{' '}
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  {total}
                </span>{' '}
                dokumen
              </>
            )}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <Skeleton className="h-5 w-3/4 mb-3 rounded" />
                  <Skeleton className="h-4 w-1/2 mb-2 rounded" />
                  <Skeleton className="h-4 w-2/3 mb-4 rounded" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : documents.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <EmptyState />
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => {
                const catInfo = getCategoryInfo(doc.category)
                const colors = getCategoryColor(doc.category)
                const daysUntil = getDaysUntilExpiry(doc.expiryDate)
                const FileIcon = getFileIcon(doc.mimeType)

                return (
                  <Card
                    key={doc.id}
                    className="border-0 shadow-sm hover:shadow-md transition-all duration-200 group"
                  >
                    <CardContent className="p-5">
                      {/* Top row: icon + category + actions */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors.icon}`}
                          >
                            <catInfo.icon className="h-5 w-5" />
                          </div>
                          <div>
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-semibold px-2 py-0.5 ${colors.badge}`}
                            >
                              {catInfo.label}
                            </Badge>
                            {doc.status === 'archived' && (
                              <Badge variant="secondary" className="ml-1 text-[10px] px-2 py-0">
                                Diarkib
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openViewDialog(doc)}
                            title="Lihat"
                          >
                            <Eye className="h-4 w-4 text-gray-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(doc)}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4 text-gray-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openDeleteDialog(doc)}
                            title="Padam"
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </div>
                      </div>

                      {/* Title & description */}
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
                        {doc.title}
                      </h3>
                      {doc.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                          {doc.description}
                        </p>
                      )}

                      {/* Meta info */}
                      <div className="space-y-2 mb-3">
                        {doc.subcategory && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <FileIcon className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{doc.subcategory}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <div className="flex items-center gap-2">
                            <HardDrive className="h-3.5 w-3.5" />
                            <span>{formatFileSize(doc.fileSize)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{formatDate(doc.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Tags */}
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {doc.tags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-[10px] px-2 py-0 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {doc.tags.length > 3 && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-2 py-0 border-gray-200 dark:border-gray-700 text-gray-400"
                            >
                              +{doc.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Expiry warning */}
                      {doc.expiryDate && (
                        <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                          {daysUntil !== null && daysUntil < 0 ? (
                            <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] px-2 py-0.5 font-medium gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Telah Luput
                            </Badge>
                          ) : daysUntil !== null && daysUntil <= 30 ? (
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] px-2 py-0.5 font-medium gap-1">
                              <Clock className="h-3 w-3" />
                              Luput dalam {daysUntil} hari
                            </Badge>
                          ) : (
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                              <Clock className="h-3 w-3" />
                              <span>Luput: {formatDate(doc.expiryDate)}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Footer actions */}
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <span className="text-[10px] text-gray-400">v{doc.version}</span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-gray-500 hover:text-purple-600 gap-1"
                            onClick={() => openViewDialog(doc)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Lihat
                          </Button>
                          {doc.fileUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-gray-500 hover:text-purple-600 gap-1"
                              asChild
                            >
                              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="h-3.5 w-3.5" />
                                Muat Turun
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* ── Pagination ───────────────────────────────────────────── */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Sebelum
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (page <= 3) {
                      pageNum = i + 1
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = page - 2 + i
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className={
                          page === pageNum
                            ? 'bg-purple-600 hover:bg-purple-700 text-white w-9 h-9'
                            : 'w-9 h-9'
                        }
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="gap-1"
                >
                  Seterusnya
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          UPLOAD DIALOG
         ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={uploadOpen} onOpenChange={(open) => { setUploadOpen(open); if (!open) resetForm() }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5 text-purple-600" />
              Muat Naik Dokumen
            </DialogTitle>
            <DialogDescription>
              Tambah maklumat dokumen baru ke dalam gudang dan simpan fail untuk rujukan dalaman.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* File upload area */}
            <div className="space-y-2">
              <Label>Fail</Label>
              <button
                type="button"
                onClick={() => {
                  if (!uploadingFile) {
                    fileInputRef.current?.click()
                  }
                }}
                disabled={uploadingFile}
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-purple-200 dark:border-purple-800 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors cursor-pointer ${uploadingFile ? 'pointer-events-none opacity-70' : ''}`}
              >
                <FileUp className="h-8 w-8 text-purple-400 mb-2" />
                <p className="text-sm font-medium text-purple-600">
                  {uploadingFile ? 'Memuat naik fail...' : form.fileName ? form.fileName : 'Klik untuk memilih fail'}
                </p>
                <p className="text-[11px] text-purple-400 mt-1">
                  PDF, DOC, XLS, JPG, PNG (maks. 50MB)
                </p>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
              />
              {uploadingFile && (
                <p className="text-[11px] text-purple-500">
                  Fail sedang dimuat naik ke storan dalaman...
                </p>
              )}
              {form.fileName && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <FileText className="h-3.5 w-3.5" />
                  <span>{form.fileName}</span>
                  <span className="text-gray-400">({formatFileSize(form.fileSize)})</span>
                  <button
                    onClick={() => setForm((p) => ({ ...p, fileName: '', fileSize: 0, mimeType: '', fileUrl: '' }))}
                    className="text-red-400 hover:text-red-600 ml-auto"
                    disabled={uploadingFile}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="upload-title">
                Tajuk Dokumen <span className="text-red-500">*</span>
              </Label>
              <Input
                id="upload-title"
                placeholder="cth. Sijil Pendaftaran ROS 2024"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="upload-desc">Penerangan</Label>
              <Textarea
                id="upload-desc"
                placeholder="Penerangan ringkas tentang dokumen ini..."
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={2}
              />
            </div>

            {/* Category & Subcategory */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Kategori <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.category}
                  onValueChange={(val) =>
                    setForm((p) => ({ ...p, category: val, subcategory: '' }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Subkategori</Label>
                <Select
                  value={form.subcategory}
                  onValueChange={(val) => setForm((p) => ({ ...p, subcategory: val }))}
                  disabled={!form.category}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih subkategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {form.category &&
                      (SUBCATEGORIES[form.category] || []).map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {sub}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Expiry Date & Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tarikh Luput</Label>
                <Input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm((p) => ({ ...p, expiryDate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Tag</Label>
                <Input
                  placeholder="cth. audit, 2024, penting"
                  value={form.tags}
                  onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                />
                <p className="text-[10px] text-gray-400">Pisahkan dengan koma</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setUploadOpen(false); resetForm() }}
              disabled={submitting || uploadingFile}
            >
              Batal
            </Button>
            <Button
              onClick={handleUpload}
              disabled={submitting || uploadingFile}
              className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
            >
              {uploadingFile ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Memuat naik fail...
                </>
              ) : submitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <FileUp className="h-4 w-4" />
                  Muat Naik
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════
          EDIT DIALOG
         ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) { setSelectedDoc(null); resetForm() } }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-purple-600" />
              Edit Dokumen
            </DialogTitle>
            <DialogDescription>
              Kemas kini maklumat dokumen: <strong>{selectedDoc?.title}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-title">
                Tajuk Dokumen <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-title"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-desc">Penerangan</Label>
              <Textarea
                id="edit-desc"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Kategori <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.category}
                  onValueChange={(val) =>
                    setForm((p) => ({ ...p, category: val, subcategory: '' }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Subkategori</Label>
                <Select
                  value={form.subcategory}
                  onValueChange={(val) => setForm((p) => ({ ...p, subcategory: val }))}
                  disabled={!form.category}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih subkategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {form.category &&
                      (SUBCATEGORIES[form.category] || []).map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {sub}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tarikh Luput</Label>
                <Input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm((p) => ({ ...p, expiryDate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Tag</Label>
                <Input
                  placeholder="Pisahkan dengan koma"
                  value={form.tags}
                  onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                />
                <p className="text-[10px] text-gray-400">Pisahkan dengan koma</p>
              </div>
            </div>

            {/* File info (read-only in edit) */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500">
              <FileText className="h-4 w-4 shrink-0" />
              <span className="truncate">{form.fileName}</span>
              <span className="shrink-0">({formatFileSize(form.fileSize)})</span>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setEditOpen(false); setSelectedDoc(null); resetForm() }}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              onClick={handleEdit}
              disabled={submitting}
              className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Pencil className="h-4 w-4" />
                  Simpan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW DIALOG
         ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={viewOpen} onOpenChange={(open) => { setViewOpen(open); if (!open) setSelectedDoc(null) }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedDoc && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${getCategoryColor(selectedDoc.category).icon}`}>
                    {(() => {
                      const CatIcon = getCategoryInfo(selectedDoc.category).icon
                      return <CatIcon className="h-5 w-5" />
                    })()}
                  </div>
                  <div>
                    <DialogTitle>{selectedDoc.title}</DialogTitle>
                    <DialogDescription className="mt-1">
                      v{selectedDoc.version} · {formatDate(selectedDoc.createdAt)}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                {selectedDoc.description && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                      Penerangan
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedDoc.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                      Kategori
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getCategoryColor(selectedDoc.category).badge}`}
                    >
                      {getCategoryInfo(selectedDoc.category).label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                      Subkategori
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedDoc.subcategory || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                      Saiz Fail
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {formatFileSize(selectedDoc.fileSize)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                      Jenis Fail
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedDoc.mimeType || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                      Status
                    </p>
                    <Badge
                      variant={selectedDoc.status === 'active' ? 'default' : 'secondary'}
                      className={
                        selectedDoc.status === 'active'
                          ? 'bg-green-100 text-green-700 border-green-200 text-xs'
                          : 'text-xs'
                      }
                    >
                      {selectedDoc.status === 'active' ? 'Aktif' : 'Diarkibkan'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                      Tarikh Luput
                    </p>
                    {selectedDoc.expiryDate ? (
                      (() => {
                        const days = getDaysUntilExpiry(selectedDoc.expiryDate)
                        return days !== null && days < 0 ? (
                          <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                            Telah Luput
                          </Badge>
                        ) : days !== null && days <= 30 ? (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                            Luput dalam {days} hari
                          </Badge>
                        ) : (
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {formatDate(selectedDoc.expiryDate)}
                          </p>
                        )
                      })()
                    ) : (
                      <p className="text-sm text-gray-400">Tiada</p>
                    )}
                  </div>
                </div>

                {selectedDoc.tags && selectedDoc.tags.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                      Tag
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedDoc.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-xs border-gray-200 dark:border-gray-700"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-xs text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <div>
                    <span className="font-medium">Dicipta:</span>{' '}
                    {formatDate(selectedDoc.createdAt)}
                  </div>
                  <div>
                    <span className="font-medium">Dikemas kini:</span>{' '}
                    {formatDate(selectedDoc.updatedAt)}
                  </div>
                </div>
              </div>

              <DialogFooter className="flex-row gap-2 sm:justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-1"
                  onClick={() => {
                    setViewOpen(false)
                    openDeleteDialog(selectedDoc)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Padam
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setViewOpen(false)
                      openEditDialog(selectedDoc)
                    }}
                    className="gap-1"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                  {selectedDoc.fileUrl && (
                    <Button
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-white gap-1"
                      asChild
                    >
                      <a href={selectedDoc.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
                        Muat Turun
                      </a>
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════
          DELETE CONFIRMATION
         ══════════════════════════════════════════════════════════════════════ */}
      <AlertDialog open={deleteOpen} onOpenChange={(open) => { setDeleteOpen(open); if (!open) setSelectedDoc(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Padam Dokumen</AlertDialogTitle>
            <AlertDialogDescription>
              Adakah anda pasti ingin memadam dokumen{' '}
              <strong className="text-gray-900 dark:text-gray-100">
                &ldquo;{selectedDoc?.title}&rdquo;
              </strong>
              ? Dokumen ini akan ditanda sebagai dipadam dan boleh dikembalikan kemudian.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Padam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
