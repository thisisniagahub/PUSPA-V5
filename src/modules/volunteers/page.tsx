'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Users,
  UserCheck,
  Clock,
  Award,
  Eye,
  Plus,
  Search,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Filter,
  Loader2,
  HeartHandshake,
  MapPin,
  FileBadge,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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

import { api } from '@/lib/api'
import { toast } from 'sonner'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Volunteer {
  id: string
  volunteerNumber: string
  name: string
  ic: string
  phone: string
  email: string | null
  address: string | null
  city: string | null
  state: string | null
  occupation: string | null
  skills: string | null
  availability: string | null
  emergencyContact: string | null
  emergencyPhone: string | null
  status: string
  joinedAt: string
  totalHours: number
  createdAt: string
  _count: { deployments: number; hourLogs: number; certificates: number }
}

interface HourLog {
  id: string
  volunteerId: string
  date: string
  hours: number
  activity: string | null
  status: string
  approvedBy: string | null
  approvedAt: string | null
  createdAt: string
  volunteer: { id: string; name: string; volunteerNumber: string }
}

interface Deployment {
  id: string
  volunteerId: string
  programmeId: string | null
  role: string
  status: string
  startDate: string
  endDate: string | null
  location: string | null
  notes: string | null
  createdAt: string
  volunteer: { id: string; name: string; volunteerNumber: string }
  programme: { id: string; name: string } | null
}

interface Certificate {
  id: string
  volunteerId: string
  certificateNumber: string
  title: string
  description: string | null
  issuedAt: string
  totalHours: number
  issuedBy: string | null
  createdAt: string
  volunteer: { id: string; name: string; volunteerNumber: string }
}

interface Stats {
  totalVolunteers: number
  activeThisMonth: number
  totalHours: number
  totalCertificates: number
}

interface VolunteerOption {
  id: string
  name: string
  volunteerNumber: string
  status: string
  totalHours: number
}

interface VolunteersEnvelope {
  data?: Volunteer[]
  total?: number
  stats?: Stats
}

interface PaginatedEnvelope<T> {
  data?: T[]
  total?: number
}

interface VolunteerDetailDeployment {
  id: string
  role: string
  status: string
  startDate: string
  endDate: string | null
  location: string | null
  notes: string | null
  programme: { id: string; name: string } | null
}

interface VolunteerDetailHourLog {
  id: string
  date: string
  hours: number
  activity: string | null
  status: string
  approvedBy: string | null
  approvedAt: string | null
}

interface VolunteerDetailCertificate {
  id: string
  certificateNumber: string
  title: string
  description: string | null
  issuedAt: string
  totalHours: number
  issuedBy: string | null
}

interface VolunteerDetailSummary {
  counts: {
    deployments: number
    activeDeployments: number
    hourLogs: number
    approvedHourLogs: number
    pendingHourLogs: number
    certificates: number
  }
  currentDeployment: VolunteerDetailDeployment | null
  latestDeployment: VolunteerDetailDeployment | null
  latestHourLog: VolunteerDetailHourLog | null
  latestApprovedHourLog: VolunteerDetailHourLog | null
  latestCertificate: VolunteerDetailCertificate | null
}

interface VolunteerDetailRecord {
  volunteer: Volunteer
  summary: VolunteerDetailSummary
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ms-MY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function parseSkills(skills: string | null): string[] {
  if (!skills) return []
  try {
    return JSON.parse(skills)
  } catch {
    return []
  }
}

function statusColor(status: string): string {
  switch (status) {
    case 'active':
    case 'confirmed':
    case 'completed':
    case 'approved':
      return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
    case 'inactive':
    case 'cancelled':
    case 'rejected':
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    case 'blacklisted':
      return 'bg-destructive/20 text-destructive border-destructive/30'
    case 'assigned':
    case 'pending':
      return 'bg-primary/20 text-primary border-primary/30'
    default:
      return 'bg-slate-500/10 text-slate-400'
  }
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    active: 'Aktif',
    inactive: 'Tidak Aktif',
    blacklisted: 'Senarai Hitam',
    pending: 'Menunggu',
    approved: 'Diluluskan',
    rejected: 'Ditolak',
    assigned: 'Ditempatkan',
    confirmed: 'Disahkan',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
  }
  return map[status] || status
}

function roleLabel(role: string): string {
  const map: Record<string, string> = {
    coordinator: 'Penyelaras',
    participant: 'Peserta',
    lead: 'Ketua',
  }
  return map[role] || role
}

function availabilityLabel(availability: string | null): string {
  const map: Record<string, string> = {
    anytime: 'Bila-bila masa',
    weekday: 'Hari Kerja',
    weekend: 'Hujung Minggu',
  }
  return availability ? (map[availability] || availability) : 'Tidak dinyatakan'
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function VolunteersPage() {
  const [activeTab, setActiveTab] = useState('volunteers')
  const [loading, setLoading] = useState(true)

  // Volunteers state
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [volunteerTotal, setVolunteerTotal] = useState(0)
  const [volPage, setVolPage] = useState(1)
  const [volSearch, setVolSearch] = useState('')
  const [volStatusFilter, setVolStatusFilter] = useState('')

  // Hours state
  const [hourLogs, setHourLogs] = useState<HourLog[]>([])
  const [hourTotal, setHourTotal] = useState(0)
  const [hourPage, setHourPage] = useState(1)

  // Deployments state
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [depTotal, setDepTotal] = useState(0)
  const [depPage, setDepPage] = useState(1)

  // Certificates state
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [certTotal, setCertTotal] = useState(0)
  const [certPage, setCertPage] = useState(1)

  // Stats
  const [stats, setStats] = useState<Stats>({
    totalVolunteers: 0,
    activeThisMonth: 0,
    totalHours: 0,
    totalCertificates: 0,
  })
  const [volunteerOptions, setVolunteerOptions] = useState<VolunteerOption[]>([])
  const [optionsLoading, setOptionsLoading] = useState(false)

  // Dialogs
  const [volunteerDialogOpen, setVolunteerDialogOpen] = useState(false)
  const [editingVolunteer, setEditingVolunteer] = useState<Volunteer | null>(null)
  const [volunteerDetailOpen, setVolunteerDetailOpen] = useState(false)
  const [viewingVolunteer, setViewingVolunteer] = useState<Volunteer | null>(null)
  const [volunteerDetail, setVolunteerDetail] = useState<VolunteerDetailRecord | null>(null)
  const [volunteerDetailLoading, setVolunteerDetailLoading] = useState(false)
  const [volunteerDetailError, setVolunteerDetailError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingTarget, setDeletingTarget] = useState<{ type: string; id: string } | null>(null)

  const [hourDialogOpen, setHourDialogOpen] = useState(false)
  const [deploymentDialogOpen, setDeploymentDialogOpen] = useState(false)
  const [certificateDialogOpen, setCertificateDialogOpen] = useState(false)

  // Form state
  const [volForm, setVolForm] = useState({
    name: '', ic: '', phone: '', email: '', address: '', city: '',
    state: '', occupation: '', skills: '', availability: 'anytime',
    emergencyContact: '', emergencyPhone: '', status: 'active',
  })
  const [hourForm, setHourForm] = useState({
    volunteerId: '', date: '', hours: '2', activity: '', status: 'approved',
  })
  const [depForm, setDepForm] = useState({
    volunteerId: '', role: 'participant', status: 'assigned',
    startDate: '', endDate: '', location: '', notes: '',
  })
  const [certForm, setCertForm] = useState({
    volunteerId: '', title: '', description: '', totalHours: '0',
  })

  const [submitting, setSubmitting] = useState(false)
  const pageSize = 10

  // ─── Data Fetching ──────────────────────────────────────────────────────

  const fetchAllData = useCallback(async () => {
    setLoading(true)
    try {
      const volParams: Record<string, string | number | undefined> = {
        page: volPage, pageSize, sortBy: 'createdAt', sortOrder: 'desc',
      }
      if (volSearch) volParams.search = volSearch
      if (volStatusFilter) volParams.status = volStatusFilter

      const [volRes, hourRes, depRes, certRes] = await Promise.all([
        api.getEnvelope<Volunteer[]>('/volunteers', volParams) as Promise<VolunteersEnvelope>,
        api.getEnvelope<HourLog[]>('/volunteers/hours', { page: hourPage, pageSize }) as Promise<PaginatedEnvelope<HourLog>>,
        api.getEnvelope<Deployment[]>('/volunteers/deployments', { page: depPage, pageSize }) as Promise<PaginatedEnvelope<Deployment>>,
        api.getEnvelope<Certificate[]>('/volunteers/certificates', { page: certPage, pageSize }) as Promise<PaginatedEnvelope<Certificate>>,
      ])

      setVolunteers(volRes.data || [])
      setVolunteerTotal(volRes.total || 0)
      if (volRes.stats) setStats(volRes.stats)
      setHourLogs(hourRes.data || [])
      setHourTotal(hourRes.total || 0)
      setDeployments(depRes.data || [])
      setDepTotal(depRes.total || 0)
      setCertificates(certRes.data || [])
      setCertTotal(certRes.total || 0)
    } catch (err) {
      console.error('Error fetching data:', err)
      toast.error('Gagal memuatkan data')
    } finally {
      setLoading(false)
    }
  }, [volPage, volSearch, volStatusFilter, hourPage, depPage, certPage])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  const fetchVolunteerOptions = useCallback(async () => {
    setOptionsLoading(true)
    try {
      const data = await api.get<VolunteerOption[]>('/volunteers/options', { limit: 200 })
      setVolunteerOptions(data)
    } catch {
      toast.error('Gagal memuatkan pilihan sukarelawan')
    } finally {
      setOptionsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVolunteerOptions()
  }, [fetchVolunteerOptions])

  // Reset page on filter change
  const handleVolSearch = (val: string) => { setVolSearch(val); setVolPage(1) }
  const handleVolStatusFilter = (val: string) => { setVolStatusFilter(val === 'all' ? '' : val); setVolPage(1) }

  const handleVolunteerDetailOpenChange = (open: boolean) => {
    setVolunteerDetailOpen(open)
    if (!open) {
      setVolunteerDetailLoading(false)
      setVolunteerDetailError(null)
      setVolunteerDetail(null)
      setViewingVolunteer(null)
    }
  }

  const openVolunteerDetail = async (volunteer: Volunteer) => {
    setViewingVolunteer(volunteer)
    setVolunteerDetailOpen(true)
    setVolunteerDetailLoading(true)
    setVolunteerDetailError(null)

    try {
      const detail = await api.get<VolunteerDetailRecord>(`/volunteers/${volunteer.id}`)
      setVolunteerDetail(detail)
      setViewingVolunteer(detail.volunteer)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal memuatkan butiran sukarelawan'
      setVolunteerDetail(null)
      setVolunteerDetailError(message)
      toast.error(message)
    } finally {
      setVolunteerDetailLoading(false)
    }
  }

  // ─── Volunteer CRUD ──────────────────────────────────────────────────────

  const openVolunteerDialog = (vol?: Volunteer) => {
    if (vol) {
      setEditingVolunteer(vol)
      setVolForm({
        name: vol.name,
        ic: vol.ic,
        phone: vol.phone,
        email: vol.email || '',
        address: vol.address || '',
        city: vol.city || '',
        state: vol.state || '',
        occupation: vol.occupation || '',
        skills: parseSkills(vol.skills).join(', '),
        availability: vol.availability || 'anytime',
        emergencyContact: vol.emergencyContact || '',
        emergencyPhone: vol.emergencyPhone || '',
        status: vol.status,
      })
    } else {
      setEditingVolunteer(null)
      setVolForm({
        name: '', ic: '', phone: '', email: '', address: '', city: '',
        state: '', occupation: '', skills: '', availability: 'anytime',
        emergencyContact: '', emergencyPhone: '', status: 'active',
      })
    }
    setVolunteerDialogOpen(true)
  }

  const handleVolunteerSubmit = async () => {
    if (!volForm.name.trim() || !volForm.ic.trim() || !volForm.phone.trim()) {
      toast.error('Sila isi nama, No. IC dan telefon')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        ...volForm,
        skills: volForm.skills ? volForm.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
      }
      if (editingVolunteer) {
        await api.put('/volunteers', { id: editingVolunteer.id, ...payload })
        toast.success('Sukarelawan berjaya dikemaskini')
      } else {
        await api.post('/volunteers', payload)
        toast.success('Sukarelawan berjaya didaftarkan')
      }
      setVolunteerDialogOpen(false)
      fetchAllData()
      fetchVolunteerOptions()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan sukarelawan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingTarget) return
    setSubmitting(true)
    try {
      if (deletingTarget.type === 'volunteer') {
        await api.delete(`/volunteers?id=${deletingTarget.id}`)
        toast.success('Sukarelawan berjaya dipadam')
      } else if (deletingTarget.type === 'hour') {
        await api.delete(`/volunteers/hours?id=${deletingTarget.id}`)
        toast.success('Log jam berjaya dipadam')
      } else if (deletingTarget.type === 'deployment') {
        await api.delete(`/volunteers/deployments?id=${deletingTarget.id}`)
        toast.success('Penempatan berjaya dipadam')
      } else if (deletingTarget.type === 'certificate') {
        await api.delete(`/volunteers/certificates?id=${deletingTarget.id}`)
        toast.success('Sijil berjaya dipadam')
      }
      if (deletingTarget.type === 'volunteer' && viewingVolunteer?.id === deletingTarget.id) {
        handleVolunteerDetailOpenChange(false)
      }
      setDeleteDialogOpen(false)
      setDeletingTarget(null)
      fetchAllData()
      fetchVolunteerOptions()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal memadam')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Hour Log CRUD ───────────────────────────────────────────────────────

  const openHourDialog = () => {
    setHourForm({ volunteerId: '', date: new Date().toISOString().split('T')[0], hours: '2', activity: '', status: 'approved' })
    setHourDialogOpen(true)
  }

  const handleHourSubmit = async () => {
    if (!hourForm.volunteerId || !hourForm.date || !hourForm.hours) {
      toast.error('Sila isi semua ruangan yang diperlukan')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/volunteers/hours', {
        ...hourForm,
        hours: parseFloat(hourForm.hours),
      })
      toast.success('Jam khidmat berjaya direkod')
      setHourDialogOpen(false)
      fetchAllData()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal merekod jam')
    } finally {
      setSubmitting(false)
    }
  }

  const handleApproveHour = async (id: string, status: string) => {
    try {
      await api.put('/volunteers/hours', { id, status })
      toast.success(status === 'approved' ? 'Jam khidmat diluluskan' : 'Jam khidmat ditolak')
      fetchAllData()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengemas kini')
    }
  }

  // ─── Deployment CRUD ─────────────────────────────────────────────────────

  const openDeploymentDialog = () => {
    setDepForm({ volunteerId: '', role: 'participant', status: 'assigned', startDate: '', endDate: '', location: '', notes: '' })
    setDeploymentDialogOpen(true)
  }

  const handleDeploymentSubmit = async () => {
    if (!depForm.volunteerId || !depForm.startDate) {
      toast.error('Sila pilih sukarelawan dan tarikh mula')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/volunteers/deployments', depForm)
      toast.success('Penempatan berjaya ditambah')
      setDeploymentDialogOpen(false)
      fetchAllData()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menambah penempatan')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Certificate CRUD ────────────────────────────────────────────────────

  const openCertificateDialog = () => {
    setCertForm({ volunteerId: '', title: '', description: '', totalHours: '0' })
    setCertificateDialogOpen(true)
  }

  const handleCertificateSubmit = async () => {
    if (!certForm.volunteerId || !certForm.title) {
      toast.error('Sila pilih sukarelawan dan masukkan tajuk sijil')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/volunteers/certificates', {
        ...certForm,
        totalHours: parseFloat(certForm.totalHours) || 0,
      })
      toast.success('Sijil berjaya dijana')
      setCertificateDialogOpen(false)
      fetchAllData()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menjana sijil')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Pagination helpers ─────────────────────────────────────────────────

  const totalPages = (total: number) => Math.max(1, Math.ceil(total / pageSize))

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <header className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-md shadow-purple-200 dark:shadow-purple-900/30">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                Pengurusan Sukarelawan
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Sistem Pengurusan Sukarelawan (VMS)
              </p>
            </div>
          </div>
        </header>

        {/* ── Stats Cards ─────────────────────────────────────────────── */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <Card className="relative overflow-hidden bg-card backdrop-blur-xl border-white/10 shadow-xl shadow-black/20">
            <CardContent className="flex items-center gap-3 p-4 sm:p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Jumlah Sukarelawan</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.totalVolunteers}</p>
              </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-primary to-purple-600" />
          </Card>

          <Card className="relative overflow-hidden bg-card backdrop-blur-xl border-white/10 shadow-xl shadow-black/20">
            <CardContent className="flex items-center gap-3 p-4 sm:p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20">
                <UserCheck className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Aktif Bulan Ini</p>
                <p className="text-xl sm:text-2xl font-bold text-cyan-400">{stats.activeThisMonth}</p>
              </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-cyan-400 to-cyan-600" />
          </Card>

          <Card className="relative overflow-hidden bg-card backdrop-blur-xl border-white/10 shadow-xl shadow-black/20">
            <CardContent className="flex items-center gap-3 p-4 sm:p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/20">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Jam Khidmat</p>
                <p className="text-xl sm:text-2xl font-bold text-amber-400">{stats.totalHours.toFixed(1)}</p>
              </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-amber-400 to-amber-600" />
          </Card>

          <Card className="relative overflow-hidden bg-card backdrop-blur-xl border-white/10 shadow-xl shadow-black/20">
            <CardContent className="flex items-center gap-3 p-4 sm:p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-pink-500/20">
                <Award className="h-5 w-5 text-pink-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sijil Dijana</p>
                <p className="text-xl sm:text-2xl font-bold text-pink-400">{stats.totalCertificates}</p>
              </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-pink-400 to-pink-600" />
          </Card>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 bg-white/5 border border-white/10 shadow-sm h-auto p-1">
            <TabsTrigger value="volunteers" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white text-muted-foreground px-4 py-2 text-sm font-medium transition-all">
              <HeartHandshake className="h-4 w-4" />
              <span className="hidden sm:inline">Senarai Sukarelawan</span>
              <span className="sm:hidden">Sukarelawan</span>
            </TabsTrigger>
            <TabsTrigger value="hours" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white text-muted-foreground px-4 py-2 text-sm font-medium transition-all">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Log Jam Khidmat</span>
              <span className="sm:hidden">Jam</span>
            </TabsTrigger>
            <TabsTrigger value="certificates" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white text-muted-foreground px-4 py-2 text-sm font-medium transition-all">
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">Sijil</span>
            </TabsTrigger>
            <TabsTrigger value="deployments" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white text-muted-foreground px-4 py-2 text-sm font-medium transition-all">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Penempatan</span>
              <span className="sm:hidden">Tempat</span>
            </TabsTrigger>
          </TabsList>

          {/* ═══════════════════════════════════════════════════════════════
              TAB 1: Senarai Sukarelawan
              ═══════════════════════════════════════════════════════════════ */}
          <TabsContent value="volunteers">
            <Card className="border-0 shadow-sm bg-white dark:bg-slate-800/50">
              <CardContent className="p-0">
                {/* Search & Filter */}
                <div className="border-b border-gray-100 dark:border-slate-700 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Cari nama, No. IC atau No. Sukarelawan..."
                        value={volSearch}
                        onChange={(e) => handleVolSearch(e.target.value)}
                        className="pl-9 border-gray-200 bg-gray-50 dark:border-slate-600 dark:bg-slate-900/50"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Select value={volStatusFilter || 'all'} onValueChange={handleVolStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[150px] border-gray-200 bg-gray-50 dark:border-slate-600 dark:bg-slate-900/50">
                          <Filter className="mr-2 h-3.5 w-3.5 text-gray-400" />
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Status</SelectItem>
                          <SelectItem value="active">Aktif</SelectItem>
                          <SelectItem value="inactive">Tidak Aktif</SelectItem>
                          <SelectItem value="blacklisted">Senarai Hitam</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => openVolunteerDialog()}
                        className="shrink-0 gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all active:scale-95"
                      >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Daftar Sukarelawan</span>
                        <span className="sm:inline">+</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Table */}
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-gray-100 bg-gray-50/80 hover:bg-gray-50/80 dark:border-slate-700 dark:bg-slate-900/40">
                            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">No. Sukarelawan</TableHead>
                            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Nama</TableHead>
                            <TableHead className="hidden md:table-cell font-semibold text-gray-700 dark:text-gray-300">No. IC</TableHead>
                            <TableHead className="hidden sm:table-cell font-semibold text-gray-700 dark:text-gray-300">Telefon</TableHead>
                            <TableHead className="hidden lg:table-cell font-semibold text-gray-700 dark:text-gray-300">Kemahiran</TableHead>
                            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Status</TableHead>
                            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Jam</TableHead>
                            <TableHead className="text-center font-semibold text-gray-700 dark:text-gray-300">Tindakan</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {volunteers.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} className="h-40 text-center">
                                <div className="flex flex-col items-center gap-2 text-gray-400">
                                  <Users className="h-10 w-10" />
                                  <p className="font-medium">Tiada sukarelawan ditemui</p>
                                  <p className="text-sm">Cuba ubah kriteria carian anda.</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            volunteers.map((vol) => (
                              <TableRow key={vol.id} className="border-gray-100 dark:border-slate-700/50 hover:bg-purple-50/30 dark:hover:bg-purple-900/10">
                                <TableCell className="font-mono text-xs text-purple-600 dark:text-purple-400 font-medium">{vol.volunteerNumber}</TableCell>
                                <TableCell className="font-medium text-gray-900 dark:text-white">{vol.name}</TableCell>
                                <TableCell className="hidden md:table-cell font-mono text-sm text-gray-600 dark:text-gray-400">{vol.ic}</TableCell>
                                <TableCell className="hidden sm:table-cell text-sm text-gray-600 dark:text-gray-400">{vol.phone}</TableCell>
                                <TableCell className="hidden lg:table-cell">
                                  <div className="flex flex-wrap gap-1">
                                    {parseSkills(vol.skills).slice(0, 2).map((skill, i) => (
                                      <Badge key={i} variant="outline" className="text-[10px] font-normal border-purple-200 text-purple-600 dark:border-purple-800 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/20">
                                        {skill}
                                      </Badge>
                                    ))}
                                    {parseSkills(vol.skills).length > 2 && (
                                      <Badge variant="outline" className="text-[10px] font-normal border-gray-200 text-gray-500">
                                        +{parseSkills(vol.skills).length - 2}
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={`text-xs font-medium ${statusColor(vol.status)}`}>
                                    {statusLabel(vol.status)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-medium text-gray-700 dark:text-gray-300">{vol.totalHours.toFixed(1)}</TableCell>
                                <TableCell>
                                  <div className="flex items-center justify-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-gray-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:text-sky-400 dark:hover:bg-sky-900/30"
                                      onClick={() => openVolunteerDetail(vol)}
                                      title="Lihat Butiran"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:text-purple-400 dark:hover:bg-purple-900/30"
                                      onClick={() => openVolunteerDialog(vol)}
                                      title="Sunting"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/30"
                                      onClick={() => { setDeletingTarget({ type: 'volunteer', id: vol.id }); setDeleteDialogOpen(true) }}
                                      title="Padam"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {volunteerTotal > pageSize && (
                      <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-700 px-4 py-3">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Menunjukkan {(volPage - 1) * pageSize + 1}–{Math.min(volPage * pageSize, volunteerTotal)} daripada {volunteerTotal}
                        </p>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-gray-200 dark:border-slate-600" onClick={() => setVolPage(p => Math.max(1, p - 1))} disabled={volPage === 1}>
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          {Array.from({ length: totalPages(volunteerTotal) }, (_, i) => i + 1).map(p => (
                            <Button key={p} variant={volPage === p ? 'default' : 'outline'} size="sm" className={`h-8 w-8 p-0 ${volPage === p ? 'bg-purple-600 hover:bg-purple-700' : 'border-gray-200 dark:border-slate-600'}`} onClick={() => setVolPage(p)}>{p}</Button>
                          ))}
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-gray-200 dark:border-slate-600" onClick={() => setVolPage(p => Math.min(totalPages(volunteerTotal), p + 1))} disabled={volPage === totalPages(volunteerTotal)}>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════
              TAB 2: Log Jam Khidmat
              ═══════════════════════════════════════════════════════════════ */}
          <TabsContent value="hours">
            <Card className="border-0 shadow-sm bg-white dark:bg-slate-800/50">
              <CardContent className="p-0">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 p-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Log Jam Khidmat Sukarelawan</h3>
                  <Button onClick={openHourDialog} className="gap-2 bg-purple-600 hover:bg-purple-700 text-white">
                    <Plus className="h-4 w-4" />
                    Log Jam
                  </Button>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-gray-100 bg-gray-50/80 hover:bg-gray-50/80 dark:border-slate-700 dark:bg-slate-900/40">
                            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Sukarelawan</TableHead>
                            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Tarikh</TableHead>
                            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Jam</TableHead>
                            <TableHead className="hidden sm:table-cell font-semibold text-gray-700 dark:text-gray-300">Aktiviti</TableHead>
                            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Status</TableHead>
                            <TableHead className="text-center font-semibold text-gray-700 dark:text-gray-300">Tindakan</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {hourLogs.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="h-40 text-center">
                                <div className="flex flex-col items-center gap-2 text-gray-400">
                                  <Clock className="h-10 w-10" />
                                  <p className="font-medium">Tiada log jam khidmat</p>
                                  <p className="text-sm">Klik &quot;Log Jam&quot; untuk menambah rekod baharu.</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            hourLogs.map((log) => (
                              <TableRow key={log.id} className="border-gray-100 dark:border-slate-700/50">
                                <TableCell>
                                  <div>
                                    <p className="font-medium text-gray-900 dark:text-white text-sm">{log.volunteer.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{log.volunteer.volunteerNumber}</p>
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm text-gray-600 dark:text-gray-400">{formatDate(log.date)}</TableCell>
                                <TableCell className="font-semibold text-gray-900 dark:text-white">{log.hours}h</TableCell>
                                <TableCell className="hidden sm:table-cell text-sm text-gray-600 dark:text-gray-400 max-w-[200px] truncate">{log.activity || '—'}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={`text-xs font-medium ${statusColor(log.status)}`}>
                                    {statusLabel(log.status)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center justify-center gap-1">
                                    {log.status === 'pending' && (
                                      <>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30" onClick={() => handleApproveHour(log.id, 'approved')} title="Luluskan">
                                          <CheckCircle2 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30" onClick={() => handleApproveHour(log.id, 'rejected')} title="Tolak">
                                          <XCircle className="h-4 w-4" />
                                        </Button>
                                      </>
                                    )}
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30" onClick={() => { setDeletingTarget({ type: 'hour', id: log.id }); setDeleteDialogOpen(true) }} title="Padam">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {hourTotal > pageSize && (
                      <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-700 px-4 py-3">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {(hourPage - 1) * pageSize + 1}–{Math.min(hourPage * pageSize, hourTotal)} daripada {hourTotal}
                        </p>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-gray-200 dark:border-slate-600" onClick={() => setHourPage(p => Math.max(1, p - 1))} disabled={hourPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                          {Array.from({ length: totalPages(hourTotal) }, (_, i) => i + 1).map(p => (
                            <Button key={p} variant={hourPage === p ? 'default' : 'outline'} size="sm" className={`h-8 w-8 p-0 ${hourPage === p ? 'bg-purple-600 hover:bg-purple-700' : 'border-gray-200 dark:border-slate-600'}`} onClick={() => setHourPage(p)}>{p}</Button>
                          ))}
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-gray-200 dark:border-slate-600" onClick={() => setHourPage(p => Math.min(totalPages(hourTotal), p + 1))} disabled={hourPage === totalPages(hourTotal)}><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════
              TAB 3: Sijil
              ═══════════════════════════════════════════════════════════════ */}
          <TabsContent value="certificates">
            <Card className="border-0 shadow-sm bg-white dark:bg-slate-800/50">
              <CardContent className="p-0">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 p-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sijil Penghargaan Sukarelawan</h3>
                  <Button onClick={openCertificateDialog} className="gap-2 bg-purple-600 hover:bg-purple-700 text-white">
                    <FileBadge className="h-4 w-4" />
                    Jana Sijil
                  </Button>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-gray-100 bg-gray-50/80 hover:bg-gray-50/80 dark:border-slate-700 dark:bg-slate-900/40">
                            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">No. Sijil</TableHead>
                            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Sukarelawan</TableHead>
                            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Tajuk</TableHead>
                            <TableHead className="hidden sm:table-cell font-semibold text-gray-700 dark:text-gray-300">Jumlah Jam</TableHead>
                            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Tarikh Dikeluarkan</TableHead>
                            <TableHead className="text-center font-semibold text-gray-700 dark:text-gray-300">Tindakan</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {certificates.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="h-40 text-center">
                                <div className="flex flex-col items-center gap-2 text-gray-400">
                                  <Award className="h-10 w-10" />
                                  <p className="font-medium">Tiada sijil dijana</p>
                                  <p className="text-sm">Klik &quot;Jana Sijil&quot; untuk mencipta sijil baharu.</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            certificates.map((cert) => (
                              <TableRow key={cert.id} className="border-gray-100 dark:border-slate-700/50">
                                <TableCell className="font-mono text-xs text-purple-600 dark:text-purple-400 font-medium">{cert.certificateNumber}</TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-medium text-gray-900 dark:text-white text-sm">{cert.volunteer.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{cert.volunteer.volunteerNumber}</p>
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium text-gray-900 dark:text-white text-sm">{cert.title}</TableCell>
                                <TableCell className="hidden sm:table-cell font-semibold text-amber-600 dark:text-amber-400">{cert.totalHours}h</TableCell>
                                <TableCell className="text-sm text-gray-600 dark:text-gray-400">{formatDate(cert.issuedAt)}</TableCell>
                                <TableCell>
                                  <div className="flex items-center justify-center">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30" onClick={() => { setDeletingTarget({ type: 'certificate', id: cert.id }); setDeleteDialogOpen(true) }} title="Padam">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {certTotal > pageSize && (
                      <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-700 px-4 py-3">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {(certPage - 1) * pageSize + 1}–{Math.min(certPage * pageSize, certTotal)} daripada {certTotal}
                        </p>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-gray-200 dark:border-slate-600" onClick={() => setCertPage(p => Math.max(1, p - 1))} disabled={certPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                          {Array.from({ length: totalPages(certTotal) }, (_, i) => i + 1).map(p => (
                            <Button key={p} variant={certPage === p ? 'default' : 'outline'} size="sm" className={`h-8 w-8 p-0 ${certPage === p ? 'bg-purple-600 hover:bg-purple-700' : 'border-gray-200 dark:border-slate-600'}`} onClick={() => setCertPage(p)}>{p}</Button>
                          ))}
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-gray-200 dark:border-slate-600" onClick={() => setCertPage(p => Math.min(totalPages(certTotal), p + 1))} disabled={certPage === totalPages(certTotal)}><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════
              TAB 4: Penempatan
              ═══════════════════════════════════════════════════════════════ */}
          <TabsContent value="deployments">
            <Card className="border-0 shadow-sm bg-white dark:bg-slate-800/50">
              <CardContent className="p-0">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 p-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Penempatan Sukarelawan</h3>
                  <Button onClick={openDeploymentDialog} className="gap-2 bg-purple-600 hover:bg-purple-700 text-white">
                    <Plus className="h-4 w-4" />
                    Tambah Penempatan
                  </Button>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-gray-100 bg-gray-50/80 hover:bg-gray-50/80 dark:border-slate-700 dark:bg-slate-900/40">
                            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Sukarelawan</TableHead>
                            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Peranan</TableHead>
                            <TableHead className="hidden sm:table-cell font-semibold text-gray-700 dark:text-gray-300">Program</TableHead>
                            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Status</TableHead>
                            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Tarikh Mula</TableHead>
                            <TableHead className="text-center font-semibold text-gray-700 dark:text-gray-300">Tindakan</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {deployments.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="h-40 text-center">
                                <div className="flex flex-col items-center gap-2 text-gray-400">
                                  <MapPin className="h-10 w-10" />
                                  <p className="font-medium">Tiada penempatan</p>
                                  <p className="text-sm">Klik &quot;Tambah Penempatan&quot; untuk membuat penempatan baharu.</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            deployments.map((dep) => (
                              <TableRow key={dep.id} className="border-gray-100 dark:border-slate-700/50">
                                <TableCell>
                                  <div>
                                    <p className="font-medium text-gray-900 dark:text-white text-sm">{dep.volunteer.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{dep.volunteer.volunteerNumber}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs border-purple-200 text-purple-600 dark:border-purple-800 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/20">
                                    {roleLabel(dep.role)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell text-sm text-gray-600 dark:text-gray-400">{dep.programme?.name || '—'}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={`text-xs font-medium ${statusColor(dep.status)}`}>
                                    {statusLabel(dep.status)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-gray-600 dark:text-gray-400">{formatDate(dep.startDate)}</TableCell>
                                <TableCell>
                                  <div className="flex items-center justify-center">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30" onClick={() => { setDeletingTarget({ type: 'deployment', id: dep.id }); setDeleteDialogOpen(true) }} title="Padam">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {depTotal > pageSize && (
                      <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-700 px-4 py-3">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {(depPage - 1) * pageSize + 1}–{Math.min(depPage * pageSize, depTotal)} daripada {depTotal}
                        </p>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-gray-200 dark:border-slate-600" onClick={() => setDepPage(p => Math.max(1, p - 1))} disabled={depPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                          {Array.from({ length: totalPages(depTotal) }, (_, i) => i + 1).map(p => (
                            <Button key={p} variant={depPage === p ? 'default' : 'outline'} size="sm" className={`h-8 w-8 p-0 ${depPage === p ? 'bg-purple-600 hover:bg-purple-700' : 'border-gray-200 dark:border-slate-600'}`} onClick={() => setDepPage(p)}>{p}</Button>
                          ))}
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-gray-200 dark:border-slate-600" onClick={() => setDepPage(p => Math.min(totalPages(depTotal), p + 1))} disabled={depPage === totalPages(depTotal)}><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          DIALOGS
          ═══════════════════════════════════════════════════════════════════ */}

      {/* ─── Volunteer Detail Dialog ───────────────────────────────────── */}
      <Dialog open={volunteerDetailOpen} onOpenChange={handleVolunteerDetailOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              {volunteerDetail?.volunteer.name || viewingVolunteer?.name || 'Butiran Sukarelawan'}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {volunteerDetail?.volunteer.volunteerNumber || viewingVolunteer?.volunteerNumber || 'Rekod sukarelawan dan ringkasan hubungan utama.'}
            </DialogDescription>
          </DialogHeader>

          {volunteerDetailLoading ? (
            <div className="flex min-h-[280px] items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-gray-500">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                <p className="text-sm">Memuatkan butiran sukarelawan...</p>
              </div>
            </div>
          ) : volunteerDetailError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50/70 p-4 dark:border-red-900/60 dark:bg-red-950/20">
              <p className="font-medium text-red-700 dark:text-red-300">Butiran sukarelawan tidak dapat dimuatkan.</p>
              <p className="mt-1 text-sm text-red-600/80 dark:text-red-300/80">{volunteerDetailError}</p>
            </div>
          ) : volunteerDetail ? (
            <div className="space-y-6 py-4">
              <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-violet-50 p-5 shadow-sm dark:border-slate-700/60 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div>
                      <p className="font-mono text-xs font-medium text-purple-600 dark:text-purple-400">{volunteerDetail.volunteer.volunteerNumber}</p>
                      <h3 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{volunteerDetail.volunteer.name}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={`text-xs font-medium ${statusColor(volunteerDetail.volunteer.status)}`}>
                        {statusLabel(volunteerDetail.volunteer.status)}
                      </Badge>
                      <Badge variant="outline" className="border-purple-200 bg-white/70 text-purple-600 dark:border-purple-800 dark:bg-slate-900/40 dark:text-purple-300">
                        {availabilityLabel(volunteerDetail.volunteer.availability)}
                      </Badge>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Sertai {formatDate(volunteerDetail.volunteer.joinedAt)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:min-w-[320px]">
                    <Card className="border-purple-100 bg-white/80 shadow-none dark:border-slate-700 dark:bg-slate-900/50">
                      <CardContent className="p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Jumlah Jam</p>
                        <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{volunteerDetail.volunteer.totalHours.toFixed(1)}</p>
                      </CardContent>
                    </Card>
                    <Card className="border-purple-100 bg-white/80 shadow-none dark:border-slate-700 dark:bg-slate-900/50">
                      <CardContent className="p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Penempatan Aktif</p>
                        <p className="mt-1 text-2xl font-bold text-purple-600 dark:text-purple-400">{volunteerDetail.summary.counts.activeDeployments}</p>
                      </CardContent>
                    </Card>
                    <Card className="border-purple-100 bg-white/80 shadow-none dark:border-slate-700 dark:bg-slate-900/50">
                      <CardContent className="p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Log Diluluskan</p>
                        <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{volunteerDetail.summary.counts.approvedHourLogs}</p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{volunteerDetail.summary.counts.pendingHourLogs} menunggu semakan</p>
                      </CardContent>
                    </Card>
                    <Card className="border-purple-100 bg-white/80 shadow-none dark:border-slate-700 dark:bg-slate-900/50">
                      <CardContent className="p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Sijil Dijana</p>
                        <p className="mt-1 text-2xl font-bold text-sky-600 dark:text-sky-400">{volunteerDetail.summary.counts.certificates}</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="border-gray-100 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/50">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-500" />
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Maklumat Peribadi</h4>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-2 dark:border-slate-700/60">
                        <span className="text-gray-500 dark:text-gray-400">No. Kad Pengenalan</span>
                        <span className="font-mono font-medium text-gray-900 dark:text-white">{volunteerDetail.volunteer.ic}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-2 dark:border-slate-700/60">
                        <span className="text-gray-500 dark:text-gray-400">Telefon</span>
                        <span className="font-medium text-gray-900 dark:text-white">{volunteerDetail.volunteer.phone}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-2 dark:border-slate-700/60">
                        <span className="text-gray-500 dark:text-gray-400">Emel</span>
                        <span className="max-w-[60%] text-right font-medium text-gray-900 dark:text-white">{volunteerDetail.volunteer.email || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-2 dark:border-slate-700/60">
                        <span className="text-gray-500 dark:text-gray-400">Pekerjaan</span>
                        <span className="max-w-[60%] text-right font-medium text-gray-900 dark:text-white">{volunteerDetail.volunteer.occupation || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-gray-500 dark:text-gray-400">Kemahiran</span>
                        <div className="flex max-w-[60%] flex-wrap justify-end gap-1">
                          {parseSkills(volunteerDetail.volunteer.skills).length > 0 ? (
                            parseSkills(volunteerDetail.volunteer.skills).map((skill, index) => (
                              <Badge key={`${skill}-${index}`} variant="outline" className="border-purple-200 bg-purple-50/60 text-[10px] font-medium text-purple-600 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                                {skill}
                              </Badge>
                            ))
                          ) : (
                            <span className="font-medium text-gray-900 dark:text-white">—</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-100 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/50">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-center gap-2">
                      <HeartHandshake className="h-4 w-4 text-rose-500" />
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Alamat & Kecemasan</h4>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/50">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Alamat</p>
                        <p className="mt-2 text-sm leading-6 text-gray-700 dark:text-gray-300">
                          {volunteerDetail.volunteer.address || 'Alamat tidak direkodkan'}
                          {(volunteerDetail.volunteer.city || volunteerDetail.volunteer.state) && (
                            <>
                              <br />
                              {[volunteerDetail.volunteer.city, volunteerDetail.volunteer.state].filter(Boolean).join(', ')}
                            </>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-2 dark:border-slate-700/60">
                        <span className="text-gray-500 dark:text-gray-400">Hubungan Kecemasan</span>
                        <span className="max-w-[60%] text-right font-medium text-gray-900 dark:text-white">{volunteerDetail.volunteer.emergencyContact || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-2 dark:border-slate-700/60">
                        <span className="text-gray-500 dark:text-gray-400">Telefon Kecemasan</span>
                        <span className="font-medium text-gray-900 dark:text-white">{volunteerDetail.volunteer.emergencyPhone || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-gray-500 dark:text-gray-400">Jumlah Rekod Hubungan</span>
                        <span className="font-medium text-right text-gray-900 dark:text-white">
                          {volunteerDetail.summary.counts.deployments} penempatan, {volunteerDetail.summary.counts.hourLogs} log jam
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                <Card className="border-gray-100 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/50">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-purple-500" />
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Penempatan Utama</h4>
                    </div>
                    {(() => {
                      const deployment = volunteerDetail.summary.currentDeployment || volunteerDetail.summary.latestDeployment
                      if (!deployment) {
                        return <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada penempatan direkodkan.</p>
                      }

                      const isCurrent = volunteerDetail.summary.currentDeployment?.id === deployment.id
                      return (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <Badge variant="outline" className={`text-xs font-medium ${statusColor(deployment.status)}`}>
                              {statusLabel(deployment.status)}
                            </Badge>
                            <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                              {isCurrent ? 'Semasa' : 'Terkini'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{deployment.programme?.name || 'Program tidak ditetapkan'}</p>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{roleLabel(deployment.role)}</p>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-gray-500 dark:text-gray-400">Tarikh mula</span>
                              <span className="font-medium text-gray-900 dark:text-white">{formatDate(deployment.startDate)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-gray-500 dark:text-gray-400">Lokasi</span>
                              <span className="max-w-[60%] text-right font-medium text-gray-900 dark:text-white">{deployment.location || '—'}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </CardContent>
                </Card>

                <Card className="border-gray-100 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/50">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Log Jam Terkini</h4>
                    </div>
                    {volunteerDetail.summary.latestHourLog ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <Badge variant="outline" className={`text-xs font-medium ${statusColor(volunteerDetail.summary.latestHourLog.status)}`}>
                            {statusLabel(volunteerDetail.summary.latestHourLog.status)}
                          </Badge>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{volunteerDetail.summary.latestHourLog.hours}h</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-gray-500 dark:text-gray-400">Tarikh log</span>
                            <span className="font-medium text-gray-900 dark:text-white">{formatDate(volunteerDetail.summary.latestHourLog.date)}</span>
                          </div>
                          <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 dark:border-slate-700 dark:bg-slate-900/50">
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Aktiviti</p>
                            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{volunteerDetail.summary.latestHourLog.activity || 'Tiada aktiviti dicatatkan.'}</p>
                          </div>
                          {volunteerDetail.summary.latestApprovedHourLog && volunteerDetail.summary.latestApprovedHourLog.id !== volunteerDetail.summary.latestHourLog.id && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Log diluluskan terkini: {formatDate(volunteerDetail.summary.latestApprovedHourLog.date)} ({volunteerDetail.summary.latestApprovedHourLog.hours}h)
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada log jam direkodkan.</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-gray-100 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/50">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-sky-500" />
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Sijil Terkini</h4>
                    </div>
                    {volunteerDetail.summary.latestCertificate ? (
                      <div className="space-y-3">
                        <div>
                          <p className="font-mono text-xs font-medium text-sky-600 dark:text-sky-400">{volunteerDetail.summary.latestCertificate.certificateNumber}</p>
                          <p className="mt-1 font-medium text-gray-900 dark:text-white">{volunteerDetail.summary.latestCertificate.title}</p>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-gray-500 dark:text-gray-400">Dikeluarkan</span>
                            <span className="font-medium text-gray-900 dark:text-white">{formatDate(volunteerDetail.summary.latestCertificate.issuedAt)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-gray-500 dark:text-gray-400">Jumlah jam</span>
                            <span className="font-medium text-gray-900 dark:text-white">{volunteerDetail.summary.latestCertificate.totalHours}h</span>
                          </div>
                          <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 dark:border-slate-700 dark:bg-slate-900/50">
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Penerangan</p>
                            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{volunteerDetail.summary.latestCertificate.description || 'Tiada penerangan tambahan.'}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada sijil dijana untuk sukarelawan ini.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => handleVolunteerDetailOpenChange(false)} className="border-gray-200 dark:border-slate-600">
              Tutup
            </Button>
            {(volunteerDetail?.volunteer || viewingVolunteer) && (
              <Button
                onClick={() => {
                  const volunteerToEdit = volunteerDetail?.volunteer || viewingVolunteer
                  handleVolunteerDetailOpenChange(false)
                  if (volunteerToEdit) openVolunteerDialog(volunteerToEdit)
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
              >
                <Pencil className="h-4 w-4" />
                Sunting
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Volunteer Dialog ──────────────────────────────────────────── */}
      <Dialog open={volunteerDialogOpen} onOpenChange={setVolunteerDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingVolunteer ? 'Sunting Sukarelawan' : 'Daftar Sukarelawan Baharu'}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {editingVolunteer ? 'Kemaskini maklumat sukarelawan.' : 'Isi maklumat untuk mendaftar sukarelawan baharu.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nama Penuh <span className="text-red-500">*</span></Label>
                <Input value={volForm.name} onChange={e => setVolForm({ ...volForm, name: e.target.value })} placeholder="Ahmad bin Abdullah" className="border-gray-200 dark:border-slate-600" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">No. Kad Pengenalan <span className="text-red-500">*</span></Label>
                <Input value={volForm.ic} onChange={e => setVolForm({ ...volForm, ic: e.target.value })} placeholder="850315-01-5123" className="border-gray-200 dark:border-slate-600" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">No. Telefon <span className="text-red-500">*</span></Label>
                <Input value={volForm.phone} onChange={e => setVolForm({ ...volForm, phone: e.target.value })} placeholder="013-7892341" className="border-gray-200 dark:border-slate-600" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Emel</Label>
                <Input type="email" value={volForm.email} onChange={e => setVolForm({ ...volForm, email: e.target.value })} placeholder="emel@contoh.com" className="border-gray-200 dark:border-slate-600" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Alamat</Label>
              <Input value={volForm.address} onChange={e => setVolForm({ ...volForm, address: e.target.value })} placeholder="No. 12, Jalan Hulu Klang" className="border-gray-200 dark:border-slate-600" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bandar</Label>
                <Input value={volForm.city} onChange={e => setVolForm({ ...volForm, city: e.target.value })} placeholder="Kuala Lumpur" className="border-gray-200 dark:border-slate-600" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Negeri</Label>
                <Input value={volForm.state} onChange={e => setVolForm({ ...volForm, state: e.target.value })} placeholder="Selangor" className="border-gray-200 dark:border-slate-600" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Pekerjaan</Label>
                <Input value={volForm.occupation} onChange={e => setVolForm({ ...volForm, occupation: e.target.value })} placeholder="Guru" className="border-gray-200 dark:border-slate-600" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Kemahiran <span className="text-xs text-gray-400">(asingkan dengan koma)</span></Label>
              <Input value={volForm.skills} onChange={e => setVolForm({ ...volForm, skills: e.target.value })} placeholder="mengajar, perubatan, memandu" className="border-gray-200 dark:border-slate-600" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Ketersediaan</Label>
                <Select value={volForm.availability} onValueChange={v => setVolForm({ ...volForm, availability: v })}>
                  <SelectTrigger className="border-gray-200 dark:border-slate-600"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anytime">Bila-bila masa</SelectItem>
                    <SelectItem value="weekday">Hari Kerja</SelectItem>
                    <SelectItem value="weekend">Hujung Minggu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</Label>
                <Select value={volForm.status} onValueChange={v => setVolForm({ ...volForm, status: v })}>
                  <SelectTrigger className="border-gray-200 dark:border-slate-600"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Tidak Aktif</SelectItem>
                    <SelectItem value="blacklisted">Senarai Hitam</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Hubungan Kecemasan</Label>
                <Input value={volForm.emergencyContact} onChange={e => setVolForm({ ...volForm, emergencyContact: e.target.value })} placeholder="Nama" className="border-gray-200 dark:border-slate-600" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Telefon Kecemasan</Label>
                <Input value={volForm.emergencyPhone} onChange={e => setVolForm({ ...volForm, emergencyPhone: e.target.value })} placeholder="013-XXXXXXX" className="border-gray-200 dark:border-slate-600" />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setVolunteerDialogOpen(false)} className="border-gray-200 dark:border-slate-600">Batal</Button>
            <Button onClick={handleVolunteerSubmit} disabled={submitting} className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingVolunteer ? 'Kemaskini' : 'Daftar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Hour Log Dialog ───────────────────────────────────────────── */}
      <Dialog open={hourDialogOpen} onOpenChange={setHourDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">Log Jam Khidmat</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">Rekod jam khidmat sukarelawan.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sukarelawan <span className="text-red-500">*</span></Label>
              <Select value={hourForm.volunteerId} onValueChange={v => setHourForm({ ...hourForm, volunteerId: v })}>
                <SelectTrigger className="border-gray-200 dark:border-slate-600"><SelectValue placeholder="Pilih sukarelawan" /></SelectTrigger>
                <SelectContent>
                  {optionsLoading && <SelectItem value="__loading-hour" disabled>Memuatkan sukarelawan...</SelectItem>}
                  {volunteerOptions.filter(v => v.status === 'active').map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.name} ({v.volunteerNumber})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tarikh <span className="text-red-500">*</span></Label>
                <Input type="date" value={hourForm.date} onChange={e => setHourForm({ ...hourForm, date: e.target.value })} className="border-gray-200 dark:border-slate-600" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Jam <span className="text-red-500">*</span></Label>
                <Input type="number" step="0.5" min="0.5" max="24" value={hourForm.hours} onChange={e => setHourForm({ ...hourForm, hours: e.target.value })} className="border-gray-200 dark:border-slate-600" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Aktiviti</Label>
              <Textarea value={hourForm.activity} onChange={e => setHourForm({ ...hourForm, activity: e.target.value })} placeholder="Terangkan aktiviti yang dilakukan..." className="border-gray-200 dark:border-slate-600 min-h-[80px]" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</Label>
              <Select value={hourForm.status} onValueChange={v => setHourForm({ ...hourForm, status: v })}>
                <SelectTrigger className="border-gray-200 dark:border-slate-600"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Diluluskan</SelectItem>
                  <SelectItem value="pending">Menunggu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setHourDialogOpen(false)} className="border-gray-200 dark:border-slate-600">Batal</Button>
            <Button onClick={handleHourSubmit} disabled={submitting} className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Deployment Dialog ─────────────────────────────────────────── */}
      <Dialog open={deploymentDialogOpen} onOpenChange={setDeploymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">Tambah Penempatan</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">Tempatkan sukarelawan ke program atau aktiviti.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sukarelawan <span className="text-red-500">*</span></Label>
              <Select value={depForm.volunteerId} onValueChange={v => setDepForm({ ...depForm, volunteerId: v })}>
                <SelectTrigger className="border-gray-200 dark:border-slate-600"><SelectValue placeholder="Pilih sukarelawan" /></SelectTrigger>
                <SelectContent>
                  {optionsLoading && <SelectItem value="__loading-deployment" disabled>Memuatkan sukarelawan...</SelectItem>}
                  {volunteerOptions.filter(v => v.status === 'active').map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.name} ({v.volunteerNumber})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Peranan</Label>
                <Select value={depForm.role} onValueChange={v => setDepForm({ ...depForm, role: v })}>
                  <SelectTrigger className="border-gray-200 dark:border-slate-600"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="participant">Peserta</SelectItem>
                    <SelectItem value="coordinator">Penyelaras</SelectItem>
                    <SelectItem value="lead">Ketua</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</Label>
                <Select value={depForm.status} onValueChange={v => setDepForm({ ...depForm, status: v })}>
                  <SelectTrigger className="border-gray-200 dark:border-slate-600"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assigned">Ditempatkan</SelectItem>
                    <SelectItem value="confirmed">Disahkan</SelectItem>
                    <SelectItem value="completed">Selesai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tarikh Mula <span className="text-red-500">*</span></Label>
                <Input type="date" value={depForm.startDate} onChange={e => setDepForm({ ...depForm, startDate: e.target.value })} className="border-gray-200 dark:border-slate-600" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tarikh Tamat</Label>
                <Input type="date" value={depForm.endDate} onChange={e => setDepForm({ ...depForm, endDate: e.target.value })} className="border-gray-200 dark:border-slate-600" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Lokasi</Label>
              <Input value={depForm.location} onChange={e => setDepForm({ ...depForm, location: e.target.value })} placeholder="Masukkan lokasi" className="border-gray-200 dark:border-slate-600" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Catatan</Label>
              <Textarea value={depForm.notes} onChange={e => setDepForm({ ...depForm, notes: e.target.value })} placeholder="Catatan tambahan..." className="border-gray-200 dark:border-slate-600 min-h-[60px]" />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeploymentDialogOpen(false)} className="border-gray-200 dark:border-slate-600">Batal</Button>
            <Button onClick={handleDeploymentSubmit} disabled={submitting} className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Certificate Dialog ────────────────────────────────────────── */}
      <Dialog open={certificateDialogOpen} onOpenChange={setCertificateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">Jana Sijil</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">Jana sijil penghargaan untuk sukarelawan.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sukarelawan <span className="text-red-500">*</span></Label>
              <Select value={certForm.volunteerId} onValueChange={v => {
                const vol = volunteerOptions.find(x => x.id === v)
                setCertForm({ ...certForm, volunteerId: v, totalHours: vol ? String(vol.totalHours) : '0' })
              }}>
                <SelectTrigger className="border-gray-200 dark:border-slate-600"><SelectValue placeholder="Pilih sukarelawan" /></SelectTrigger>
                <SelectContent>
                  {optionsLoading && <SelectItem value="__loading-certificate" disabled>Memuatkan sukarelawan...</SelectItem>}
                  {volunteerOptions.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.name} ({v.volunteerNumber})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tajuk Sijil <span className="text-red-500">*</span></Label>
              <Input value={certForm.title} onChange={e => setCertForm({ ...certForm, title: e.target.value })} placeholder="Sijil Penghargaan Khidmat Sukarelawan" className="border-gray-200 dark:border-slate-600" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Penerangan</Label>
              <Textarea value={certForm.description} onChange={e => setCertForm({ ...certForm, description: e.target.value })} placeholder="Penerangan sijil..." className="border-gray-200 dark:border-slate-600 min-h-[60px]" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Jumlah Jam Khidmat</Label>
              <Input type="number" min="0" step="0.5" value={certForm.totalHours} readOnly className="border-gray-200 bg-gray-50 dark:border-slate-600 dark:bg-slate-900/40" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Jumlah ini datang terus daripada rekod jam khidmat semasa sukarelawan.</p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCertificateDialogOpen(false)} className="border-gray-200 dark:border-slate-600">Batal</Button>
            <Button onClick={handleCertificateSubmit} disabled={submitting} className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Jana Sijil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ────────────────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-white">Padam Rekod?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">
              Tindakan ini tidak boleh dibatalkan. Rekod ini akan dipadam secara kekal dari sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="border-gray-200 dark:border-slate-600">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Padam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
