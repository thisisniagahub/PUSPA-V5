'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  Building2,
  Users,
  Handshake,
  Landmark,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Phone,
  Mail,
  Globe,
  MapPin,
  Calendar,
  Star,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  User,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
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

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface OrgProfile {
  legalName: string
  tradeName: string
  registrationType: string
  rosRegistrationNo: string
  establishmentDate: string
  registeredAddress: string
  operatingAddress: string
  phone: string
  email: string
  website: string
  mission: string
  vision: string
}

interface BoardMember {
  id: string
  name: string
  title: string
  role: string
  appointmentDate: string
  endDate: string
  phone: string
  email: string
  photoUrl: string
  bio: string
  isCurrent: boolean
}

interface Partner {
  id: string
  name: string
  type: string
  relationship: string
  verificationLevel: 'claimed' | 'partner_confirmed' | 'publicly_verified'
  verified: boolean
}

interface PartnerApiRecord {
  id: string
  name: string
  type: string
  relationship: string | null
  verifiedStatus: 'claimed' | 'partner_confirmed' | 'publicly_verified'
}

interface BankingInfo {
  bankName: string
  accountNumber: string
  accountHolder: string
  verified: boolean
  lhdnReference: string
  lhdnExpiryDate: string
  taxExempt: boolean
}

// ─────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────
const initialOrgProfile: OrgProfile = {
  legalName: 'Pertubuhan Urus Peduli Asnaf',
  tradeName: 'PUSPA',
  registrationType: 'Persatuan',
  rosRegistrationNo: 'PPM-006-14-14032020',
  establishmentDate: '2020-03-14',
  registeredAddress: 'No. 23, Jalan Hulu Klang 3, 54200 Kuala Lumpur',
  operatingAddress: 'No. 23, Jalan Hulu Klang 3, 54200 Kuala Lumpur',
  phone: '03-4107 8899',
  email: 'info@puspa.org.my',
  website: 'www.puspa.org.my',
  mission:
    'Membangunkan masyarakat asnaf yang berdaya tahan melalui program pendidikan, kebajikan dan pembangunan komuniti yang berteraskan nilai-nilai Islam.',
  vision:
    'Menjadi organisasi terulung dalam memperkasakan kehidupan asnaf di Malaysia menjelang 2030.',
}

const initialBoardMembers: BoardMember[] = [
  {
    id: 'bm-1',
    name: 'Haji Ahmad bin Ismail',
    title: 'Haji.',
    role: 'Pengerusi',
    appointmentDate: '2020-03-14',
    endDate: '2023-03-14',
    phone: '012-345 6789',
    email: 'ahmad.ismail@puspa.org.my',
    photoUrl: '',
    bio: 'Berpengalaman lebih 20 tahun dalam sektor pembangunan komuniti dan kebajikan. Bekas pegawai kanan Kementerian Pembangunan Wanita, Keluarga dan Masyarakat.',
    isCurrent: true,
  },
  {
    id: 'bm-2',
    name: 'Dr. Siti Aminah binti Abdul Rahman',
    title: 'Dr.',
    role: 'Penasihat',
    appointmentDate: '2020-05-01',
    endDate: '',
    phone: '013-456 7890',
    email: 'sitiaminah@puspa.org.my',
    photoUrl: '',
    bio: 'Pakar dalam bidang kewangan Islam dan pembangunan sosial. Pensyarah kanan di Universiti Malaya dalam bidang Pengajian Islam.',
    isCurrent: true,
  },
  {
    id: 'bm-3',
    name: 'Ustaz Mohd Farid bin Hassan',
    title: 'Ustaz.',
    role: 'Timbalan Pengerusi',
    appointmentDate: '2020-03-14',
    endDate: '2023-03-14',
    phone: '014-567 8901',
    email: 'farid.hassan@puspa.org.my',
    photoUrl: '',
    bio: 'Graduan Universiti Al-Azhar, Kairo. Aktif dalam dakwah dan program kebajikan masyarakat.',
    isCurrent: true,
  },
  {
    id: 'bm-4',
    name: 'Puan Noraini binti Mohamed',
    title: 'Puan',
    role: 'Bendahari',
    appointmentDate: '2021-01-15',
    endDate: '2024-01-15',
    phone: '016-678 9012',
    email: 'noraini@puspa.org.my',
    photoUrl: '',
    bio: 'Akauntan berdaftar dengan pengalaman 15 tahun dalam pengurusan kewangan NGO dan organisasi bukan untung.',
    isCurrent: true,
  },
  {
    id: 'bm-5',
    name: 'Encik Muhammad Azril bin Iskandar',
    title: 'Encik',
    role: 'Setiausaha',
    appointmentDate: '2021-01-15',
    endDate: '2024-01-15',
    phone: '017-789 0123',
    email: 'azril@puspa.org.my',
    photoUrl: '',
    bio: 'Peguam bertauliah dengan minat mendalam dalam undang-undang persatuan dan kebajikan masyarakat.',
    isCurrent: true,
  },
  {
    id: 'bm-6',
    name: 'Hajah Fatimah binti Yusof',
    title: 'Hajah.',
    role: 'Timbalan Setiausaha',
    appointmentDate: '2022-06-01',
    endDate: '2025-06-01',
    phone: '018-890 1234',
    email: 'fatimah.y@puspa.org.my',
    photoUrl: '',
    bio: 'Bekas guru sekolah menengah dengan pengalaman luas dalam pengurusan pendidikan dan aktiviti kebajikan komuniti.',
    isCurrent: true,
  },
  {
    id: 'bm-7',
    name: 'Encik Zulkifli bin Abdul Aziz',
    title: 'Encik',
    role: 'Ahli Jawatankuasa',
    appointmentDate: '2022-06-01',
    endDate: '2025-06-01',
    phone: '019-901 2345',
    email: 'zulkifli@puspa.org.my',
    photoUrl: '',
    bio: 'Usahawan sosial dan penganjur komuniti. Aktif dalam program pembangunan usahawan asnaf.',
    isCurrent: true,
  },
]

const initialBankingInfo: BankingInfo = {
  bankName: 'Bank Islam Malaysia Berhad',
  accountNumber: '076012345678',
  accountHolder: 'Pertubuhan Urus Peduli Asnaf (PUSPA)',
  verified: true,
  lhdnReference: 'LHDN.01/36/PUSPA/2024',
  lhdnExpiryDate: '2025-12-31',
  taxExempt: true,
}

// ─────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  Pengerusi: 'Pengerusi',
  'Timbalan Pengerusi': 'Timbalan Pengerusi',
  Bendahari: 'Bendahari',
  Setiausaha: 'Setiausaha',
  'Timbalan Setiausaha': 'Timbalan Setiausaha',
  Penasihat: 'Penasihat',
  'Ahli Jawatankuasa': 'Ahli Jawatankuasa',
}

const PARTNER_TYPE_LABELS: Record<string, string> = {
  corporate: 'Korporat',
  foundation: 'Yayasan',
  government: 'Kerajaan',
  ngo: 'NGO',
  masjid: 'Masjid',
  individual: 'Individu',
}

const VERIFICATION_CONFIG: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }
> = {
  claimed: {
    label: 'Dakwaan',
    variant: 'secondary',
    className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  },
  partner_confirmed: {
    label: 'Disahkan Rakan',
    variant: 'secondary',
    className: 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  },
  publicly_verified: {
    label: 'Disahkan Awam',
    variant: 'secondary',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  },
}

const mapPartnerFromApi = (partner: PartnerApiRecord): Partner => ({
  id: partner.id,
  name: partner.name,
  type: partner.type,
  relationship: partner.relationship || '',
  verificationLevel: partner.verifiedStatus,
  verified: partner.verifiedStatus !== 'claimed',
})

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function maskAccountNumber(accNo: string): string {
  if (accNo.length <= 6) return accNo
  return accNo.slice(0, 3) + '****' + accNo.slice(-3)
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
export default function AdminPage() {
  // ── State ──
  const [orgProfile, setOrgProfile] = useState<OrgProfile>(initialOrgProfile)
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>(initialBoardMembers)
  const [partners, setPartners] = useState<Partner[]>([])
  const [partnersLoading, setPartnersLoading] = useState(true)
  const [bankingInfo, setBankingInfo] = useState<BankingInfo>(initialBankingInfo)

  // Dialog states
  const [boardDialogOpen, setBoardDialogOpen] = useState(false)
  const [partnerDialogOpen, setPartnerDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingBoardMember, setEditingBoardMember] = useState<BoardMember | null>(null)
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null)
  const [deletingTarget, setDeletingTarget] = useState<{ type: 'board' | 'partner'; id: string } | null>(null)

  // Form states
  const [boardForm, setBoardForm] = useState<BoardMember>({
    id: '',
    name: '',
    title: '',
    role: '',
    appointmentDate: '',
    endDate: '',
    phone: '',
    email: '',
    photoUrl: '',
    bio: '',
    isCurrent: true,
  })

  const [partnerForm, setPartnerForm] = useState<Partner>({
    id: '',
    name: '',
    type: '',
    relationship: '',
    verificationLevel: 'claimed',
    verified: false,
  })

  const [showAccountNumber, setShowAccountNumber] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

  // ── Handlers ──
  const showSaveSuccess = useCallback((section: string) => {
    setSaveSuccess(section)
    setTimeout(() => setSaveSuccess(null), 2000)
  }, [])

  const fetchPartners = useCallback(async () => {
    try {
      setPartnersLoading(true)
      const data = await api.get<PartnerApiRecord[]>('/partners')
      setPartners(data.map(mapPartnerFromApi))
    } catch {
      toast.error('Gagal memuatkan rakan kongsi')
      setPartners([])
    } finally {
      setPartnersLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPartners()
  }, [fetchPartners])

  // Tab 1: Organization Profile
  const handleOrgChange = (field: keyof OrgProfile, value: string) => {
    setOrgProfile((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveOrg = () => {
    showSaveSuccess('org')
  }

  // Tab 2: Board Members
  const openBoardDialog = (member?: BoardMember) => {
    if (member) {
      setEditingBoardMember(member)
      setBoardForm({ ...member })
    } else {
      setEditingBoardMember(null)
      setBoardForm({
        id: `bm-${Date.now()}`,
        name: '',
        title: '',
        role: '',
        appointmentDate: '',
        endDate: '',
        phone: '',
        email: '',
        photoUrl: '',
        bio: '',
        isCurrent: true,
      })
    }
    setBoardDialogOpen(true)
  }

  const handleSaveBoardMember = () => {
    if (!boardForm.name || !boardForm.role) return
    if (editingBoardMember) {
      setBoardMembers((prev) =>
        prev.map((m) => (m.id === editingBoardMember.id ? { ...boardForm } : m))
      )
    } else {
      setBoardMembers((prev) => [...prev, { ...boardForm }])
    }
    setBoardDialogOpen(false)
    setEditingBoardMember(null)
    showSaveSuccess('board')
  }

  const handleDeleteBoardMember = (id: string) => {
    setDeletingTarget({ type: 'board', id })
    setDeleteDialogOpen(true)
  }

  // Tab 3: Partners
  const openPartnerDialog = (partner?: Partner) => {
    if (partner) {
      setEditingPartner(partner)
      setPartnerForm({ ...partner })
    } else {
      setEditingPartner(null)
      setPartnerForm({
        id: `p-${Date.now()}`,
        name: '',
        type: '',
        relationship: '',
        verificationLevel: 'claimed',
        verified: false,
      })
    }
    setPartnerDialogOpen(true)
  }

  const handleSavePartner = async () => {
    if (!partnerForm.name || !partnerForm.type) return

    try {
      const payload = {
        name: partnerForm.name,
        type: partnerForm.type,
        relationship: partnerForm.relationship,
        verifiedStatus: partnerForm.verificationLevel,
      }

      if (editingPartner) {
        const updated = await api.put<PartnerApiRecord>('/partners', {
          id: editingPartner.id,
          ...payload,
        })
        setPartners((prev) =>
          prev.map((p) => (p.id === editingPartner.id ? mapPartnerFromApi(updated) : p))
        )
      } else {
        const created = await api.post<PartnerApiRecord>('/partners', payload)
        setPartners((prev) => [mapPartnerFromApi(created), ...prev])
      }

      setPartnerDialogOpen(false)
      setEditingPartner(null)
      showSaveSuccess('partner')
    } catch {
      toast.error(editingPartner ? 'Gagal mengemas kini rakan kongsi' : 'Gagal menambah rakan kongsi')
    }
  }

  const handleDeletePartner = (id: string) => {
    setDeletingTarget({ type: 'partner', id })
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingTarget) return
    if (deletingTarget.type === 'board') {
      setBoardMembers((prev) => prev.filter((m) => m.id !== deletingTarget.id))
    } else {
      try {
        await api.delete('/partners', { id: deletingTarget.id })
        setPartners((prev) => prev.filter((p) => p.id !== deletingTarget.id))
      } catch {
        toast.error('Gagal memadam rakan kongsi')
        return
      }
    }
    setDeleteDialogOpen(false)
    setDeletingTarget(null)
    showSaveSuccess('delete')
  }

  // ── Featured board members (Pengerusi & Penasihat) ──
  const featuredRoles = ['Pengerusi', 'Penasihat']
  const featuredMembers = boardMembers.filter((m) => featuredRoles.includes(m.role) && m.isCurrent)
  const otherMembers = boardMembers.filter((m) => !featuredRoles.includes(m.role) || !m.isCurrent)

  // ── Success toast ──
  const SUCCESS_MESSAGES: Record<string, string> = {
    org: 'Profil organisasi berjaya disimpan.',
    board: 'Maklumat ahli lembaga berjaya dikemaskini.',
    partner: 'Maklumat rakan kongsi berjaya dikemaskini.',
    delete: 'Rekod berjaya dipadam.',
  }

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2.5 bg-emerald-100 rounded-xl dark:bg-emerald-900/40">
                  <Building2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Pentadbiran
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Profil & Konfigurasi Organisasi PUSPA
                  </p>
                </div>
              </div>
            </div>
            {saveSuccess && (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300 animate-in fade-in slide-in-from-top-2 duration-300">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">{SUCCESS_MESSAGES[saveSuccess]}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="profil" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto p-1.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl">
            <TabsTrigger
              value="profil"
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
            >
              <Building2 className="h-4 w-4 hidden sm:block" />
              Profil Organisasi
            </TabsTrigger>
            <TabsTrigger
              value="ahli"
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700"
            >
              <Users className="h-4 w-4 hidden sm:block" />
              Ahli Lembaga
            </TabsTrigger>
            <TabsTrigger
              value="rakan"
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700"
            >
              <Handshake className="h-4 w-4 hidden sm:block" />
              Rakan Kongsi
            </TabsTrigger>
            <TabsTrigger
              value="perbankan"
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700"
            >
              <Landmark className="h-4 w-4 hidden sm:block" />
              Perbankan
            </TabsTrigger>
          </TabsList>

          {/* ════════════════════════════════════════════════
              TAB 1: PROFIL ORGANISASI
          ════════════════════════════════════════════════ */}
          <TabsContent value="profil" className="space-y-6">
            <Card className="shadow-2xl border-white/10 bg-white/5 backdrop-blur-2xl rounded-3xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 rounded-lg dark:bg-emerald-900/30">
                    <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Maklumat Organisasi</CardTitle>
                    <CardDescription>
                      Butiran rasmi pendaftaran dan operasi PUSPA
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Row 1: Legal Name & Trade Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="legalName" className="text-sm font-medium">
                      Nama Sah <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="legalName"
                      value={orgProfile.legalName}
                      onChange={(e) => handleOrgChange('legalName', e.target.value)}
                      placeholder="Nama sah pertubuhan"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tradeName" className="text-sm font-medium">
                      Nama Dagangan
                    </Label>
                    <Input
                      id="tradeName"
                      value={orgProfile.tradeName}
                      onChange={(e) => handleOrgChange('tradeName', e.target.value)}
                      placeholder="Nama dagangan / singkatan"
                    />
                  </div>
                </div>

                {/* Row 2: Registration Type & No */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="regType" className="text-sm font-medium">
                      Jenis Pendaftaran
                    </Label>
                    <Select
                      value={orgProfile.registrationType}
                      onValueChange={(v) => handleOrgChange('registrationType', v)}
                    >
                      <SelectTrigger id="regType">
                        <SelectValue placeholder="Pilih jenis pendaftaran" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Persatuan">Persatuan</SelectItem>
                        <SelectItem value="Syarikat">Syarikat</SelectItem>
                        <SelectItem value="Yayasan">Yayasan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rosNo" className="text-sm font-medium">
                      No. Pendaftaran ROS
                    </Label>
                    <Input
                      id="rosNo"
                      value={orgProfile.rosRegistrationNo}
                      onChange={(e) => handleOrgChange('rosRegistrationNo', e.target.value)}
                      placeholder="cth. PPM-XXX-XX-XXXXXXXX"
                    />
                  </div>
                </div>

                {/* Row 3: Establishment Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="estDate" className="text-sm font-medium">
                      Tarikh Penubuhan
                    </Label>
                    <Input
                      id="estDate"
                      type="date"
                      value={orgProfile.establishmentDate}
                      onChange={(e) => handleOrgChange('establishmentDate', e.target.value)}
                    />
                  </div>
                </div>

                <Separator />

                {/* Row 4: Addresses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="regAddress" className="text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        Alamat Berdaftar
                      </div>
                    </Label>
                    <Textarea
                      id="regAddress"
                      value={orgProfile.registeredAddress}
                      onChange={(e) => handleOrgChange('registeredAddress', e.target.value)}
                      placeholder="Alamat penuh berdaftar"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="opAddress" className="text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        Alamat Operasi
                      </div>
                    </Label>
                    <Textarea
                      id="opAddress"
                      value={orgProfile.operatingAddress}
                      onChange={(e) => handleOrgChange('operatingAddress', e.target.value)}
                      placeholder="Alamat operasi (jika berbeza)"
                      rows={3}
                    />
                  </div>
                </div>

                <Separator />

                {/* Row 5: Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        Telefon
                      </div>
                    </Label>
                    <Input
                      id="phone"
                      value={orgProfile.phone}
                      onChange={(e) => handleOrgChange('phone', e.target.value)}
                      placeholder="cth. 03-XXXX XXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        Emel
                      </div>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={orgProfile.email}
                      onChange={(e) => handleOrgChange('email', e.target.value)}
                      placeholder="emel@contoh.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Globe className="h-3.5 w-3.5 text-slate-400" />
                        Laman Web
                      </div>
                    </Label>
                    <Input
                      id="website"
                      value={orgProfile.website}
                      onChange={(e) => handleOrgChange('website', e.target.value)}
                      placeholder="www.contoh.com"
                    />
                  </div>
                </div>

                <Separator />

                {/* Row 6: Mission & Vision */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="mission" className="text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Star className="h-3.5 w-3.5 text-slate-400" />
                        Penyata Misi
                      </div>
                    </Label>
                    <Textarea
                      id="mission"
                      value={orgProfile.mission}
                      onChange={(e) => handleOrgChange('mission', e.target.value)}
                      placeholder="Nyatakan misi organisasi"
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vision" className="text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Eye className="h-3.5 w-3.5 text-slate-400" />
                        Penyata Visi
                      </div>
                    </Label>
                    <Textarea
                      id="vision"
                      value={orgProfile.vision}
                      onChange={(e) => handleOrgChange('vision', e.target.value)}
                      placeholder="Nyatakan visi organisasi"
                      rows={4}
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-2">
                  <Button onClick={handleSaveOrg} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                    <Save className="h-4 w-4" />
                    Simpan Profil
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ════════════════════════════════════════════════
              TAB 2: AHLI LEMBAGA
          ════════════════════════════════════════════════ */}
          <TabsContent value="ahli" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Ahli Lembaga PUSPA
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {boardMembers.filter((m) => m.isCurrent).length} ahli aktif
                </p>
              </div>
              <Button
                onClick={() => openBoardDialog()}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Tambah Ahli</span>
              </Button>
            </div>

            {/* Featured Members (Pengerusi & Penasihat) */}
            {featuredMembers.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {featuredMembers.map((member) => (
                  <Card
                    key={member.id}
                    className="shadow-sm border-slate-200/80 dark:border-slate-700/80 overflow-hidden group"
                  >
                    <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500" />
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row gap-5">
                        <Avatar className="h-24 w-24 shadow-md border-2 border-emerald-100 dark:border-emerald-900/50 shrink-0 mx-auto sm:mx-0">
                          <AvatarImage src={member.photoUrl || undefined} alt={member.name} />
                          <AvatarFallback className="text-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-center sm:text-left">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
                            <div>
                              <Badge
                                variant="outline"
                                className="text-xs font-medium border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300 mb-1"
                              >
                                {member.role}
                              </Badge>
                              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                {member.title} {member.name}
                              </h3>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openBoardDialog(member)}
                              >
                                <Pencil className="h-4 w-4 text-slate-400" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:text-red-600"
                                onClick={() => handleDeleteBoardMember(member.id)}
                              >
                                <Trash2 className="h-4 w-4 text-slate-400" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                            {member.bio}
                          </p>
                          <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500 dark:text-slate-400 justify-center sm:justify-start">
                            {member.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {member.phone}
                              </span>
                            )}
                            {member.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {member.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Other Members Grid */}
            {otherMembers.length > 0 && (
              <>
                <h3 className="text-md font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Separator className="flex-1" />
                  <span className="px-3">Ahli Jawatankuasa Lain</span>
                  <Separator className="flex-1" />
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {otherMembers.map((member) => (
                    <Card
                      key={member.id}
                      className="shadow-sm border-slate-200/80 dark:border-slate-700/80 group hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 border border-slate-100 dark:border-slate-700">
                              <AvatarImage src={member.photoUrl || undefined} alt={member.name} />
                              <AvatarFallback className="text-sm bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {getInitials(member.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium text-sm text-slate-900 dark:text-white leading-tight">
                                {member.title} {member.name}
                              </h4>
                              <Badge
                                variant="outline"
                                className="text-[10px] font-medium mt-0.5 border-slate-200 text-slate-500 dark:border-slate-600 dark:text-slate-400"
                              >
                                {member.role}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => openBoardDialog(member)}
                            >
                              <Pencil className="h-3.5 w-3.5 text-slate-400" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 hover:text-red-600"
                              onClick={() => handleDeleteBoardMember(member.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-slate-400" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                          {member.bio}
                        </p>
                        <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
                          {member.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {member.phone}
                            </span>
                          )}
                          {member.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {member.email}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-3">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span className="text-[11px] text-slate-400">
                            Dilantik: {member.appointmentDate || '—'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {/* Board Member Dialog */}
            <Dialog open={boardDialogOpen} onOpenChange={setBoardDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingBoardMember ? 'Edit Ahli Lembaga' : 'Tambah Ahli Lembaga'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingBoardMember
                      ? 'Kemaskini maklumat ahli lembaga PUSPA.'
                      : 'Isikan maklumat ahli lembaga baharu.'}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                  {/* Name & Title */}
                  <div className="space-y-2">
                    <Label htmlFor="bm-name">
                      Nama Penuh <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="bm-name"
                      value={boardForm.name}
                      onChange={(e) => setBoardForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Nama penuh"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bm-title">Gelaran</Label>
                    <Select
                      value={boardForm.title}
                      onValueChange={(v) => setBoardForm((f) => ({ ...f, title: v }))}
                    >
                      <SelectTrigger id="bm-title">
                        <SelectValue placeholder="Pilih gelaran" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Dr.">Dr.</SelectItem>
                        <SelectItem value="Haji.">Haji.</SelectItem>
                        <SelectItem value="Hajah.">Hajah.</SelectItem>
                        <SelectItem value="Ustaz.">Ustaz.</SelectItem>
                        <SelectItem value="Ustazah.">Ustazah.</SelectItem>
                        <SelectItem value="Prof.">Prof.</SelectItem>
                        <SelectItem value="Encik">Encik</SelectItem>
                        <SelectItem value="Puan">Puan</SelectItem>
                        <SelectItem value="Cik">Cik</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Role */}
                  <div className="space-y-2">
                    <Label htmlFor="bm-role">
                      Peranan <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={boardForm.role}
                      onValueChange={(v) => setBoardForm((f) => ({ ...f, role: v }))}
                    >
                      <SelectTrigger id="bm-role">
                        <SelectValue placeholder="Pilih peranan" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROLE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Appointment Date */}
                  <div className="space-y-2">
                    <Label htmlFor="bm-appdate">Tarikh Pelantikan</Label>
                    <Input
                      id="bm-appdate"
                      type="date"
                      value={boardForm.appointmentDate}
                      onChange={(e) => setBoardForm((f) => ({ ...f, appointmentDate: e.target.value }))}
                    />
                  </div>

                  {/* End Date */}
                  <div className="space-y-2">
                    <Label htmlFor="bm-enddate">Tarikh Tamat</Label>
                    <Input
                      id="bm-enddate"
                      type="date"
                      value={boardForm.endDate}
                      onChange={(e) => setBoardForm((f) => ({ ...f, endDate: e.target.value }))}
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="bm-phone">Telefon</Label>
                    <Input
                      id="bm-phone"
                      value={boardForm.phone}
                      onChange={(e) => setBoardForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="cth. 012-XXX XXXX"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="bm-email">Emel</Label>
                    <Input
                      id="bm-email"
                      type="email"
                      value={boardForm.email}
                      onChange={(e) => setBoardForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="emel@contoh.com"
                    />
                  </div>

                  {/* Photo URL */}
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="bm-photo">URL Gambar</Label>
                    <Input
                      id="bm-photo"
                      value={boardForm.photoUrl}
                      onChange={(e) => setBoardForm((f) => ({ ...f, photoUrl: e.target.value }))}
                      placeholder="https://contoh.com/gambar.jpg"
                    />
                  </div>

                  {/* Bio */}
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="bm-bio">Biodata</Label>
                    <Textarea
                      id="bm-bio"
                      value={boardForm.bio}
                      onChange={(e) => setBoardForm((f) => ({ ...f, bio: e.target.value }))}
                      placeholder="Ringkasan biodata ahli"
                      rows={3}
                    />
                  </div>

                  {/* isCurrent toggle */}
                  <div className="sm:col-span-2 flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <Label htmlFor="bm-current" className="text-sm font-medium">
                        Ahli Semasa
                      </Label>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Tandakan jika masih ahli lembaga aktif
                      </p>
                    </div>
                    <Switch
                      id="bm-current"
                      checked={boardForm.isCurrent}
                      onCheckedChange={(checked) => setBoardForm((f) => ({ ...f, isCurrent: checked }))}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setBoardDialogOpen(false)} className="gap-2">
                    <X className="h-4 w-4" />
                    Batal
                  </Button>
                  <Button
                    onClick={handleSaveBoardMember}
                    disabled={!boardForm.name || !boardForm.role}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Save className="h-4 w-4" />
                    {editingBoardMember ? 'Kemaskini' : 'Simpan'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ════════════════════════════════════════════════
              TAB 3: RAKAN KONGSI
          ════════════════════════════════════════════════ */}
          <TabsContent value="rakan" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Rakan Kongsi PUSPA
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {partnersLoading ? 'Memuatkan...' : `${partners.length} rakan kongsi berdaftar`}
                </p>
              </div>
              <Button
                onClick={() => openPartnerDialog()}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Tambah Rakan</span>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(PARTNER_TYPE_LABELS).map(([key, label]) => {
                const count = partners.filter((p) => p.type === key).length
                return (
                  <Card
                    key={key}
                    className="shadow-sm border-slate-200/80 dark:border-slate-700/80 py-3"
                  >
                    <CardContent className="p-3 text-center">
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{count}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Partner Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {partners.map((partner) => {
                const vConfig = VERIFICATION_CONFIG[partner.verificationLevel]
                const typeIcon =
                  partner.type === 'masjid' ? '🕌' :
                  partner.type === 'kerajaan' ? '🏛️' :
                  partner.type === 'yayasan' ? '💙' :
                  partner.type === 'korporat' ? '🏢' :
                  partner.type === 'ngo' ? '🤝' : '👤'

                return (
                  <Card
                    key={partner.id}
                    className="shadow-sm border-slate-200/80 dark:border-slate-700/80 group hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg shrink-0">
                            {typeIcon}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-medium text-sm text-slate-900 dark:text-white leading-tight truncate">
                              {partner.name}
                            </h4>
                            <Badge
                              variant="outline"
                              className="text-[10px] font-medium mt-1 border-slate-200 text-slate-500 dark:border-slate-600 dark:text-slate-400"
                            >
                              {PARTNER_TYPE_LABELS[partner.type] || partner.type}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openPartnerDialog(partner)}
                          >
                            <Pencil className="h-3.5 w-3.5 text-slate-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:text-red-600"
                            onClick={() => handleDeletePartner(partner.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-slate-400" />
                          </Button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                        {partner.relationship}
                      </p>

                      <div className="flex items-center gap-2">
                        {partner.verificationLevel === 'claimed' && (
                          <ShieldAlert className="h-3.5 w-3.5 text-blue-500" />
                        )}
                        {partner.verificationLevel === 'partner_confirmed' && (
                          <Shield className="h-3.5 w-3.5 text-amber-500" />
                        )}
                        {partner.verificationLevel === 'publicly_verified' && (
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                        )}
                        <Badge variant={vConfig.variant} className={vConfig.className}>
                          {vConfig.label}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Partner Dialog */}
            <Dialog open={partnerDialogOpen} onOpenChange={setPartnerDialogOpen}>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPartner ? 'Edit Rakan Kongsi' : 'Tambah Rakan Kongsi'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingPartner
                      ? 'Kemaskini maklumat rakan kongsi PUSPA.'
                      : 'Isikan maklumat rakan kongsi baharu.'}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="pt-name">
                      Nama Rakan Kongsi <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="pt-name"
                      value={partnerForm.name}
                      onChange={(e) => setPartnerForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Nama organisasi / individu"
                    />
                  </div>

                  {/* Type */}
                  <div className="space-y-2">
                    <Label htmlFor="pt-type">
                      Jenis <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={partnerForm.type}
                      onValueChange={(v) => setPartnerForm((f) => ({ ...f, type: v }))}
                    >
                      <SelectTrigger id="pt-type">
                        <SelectValue placeholder="Pilih jenis rakan kongsi" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PARTNER_TYPE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Relationship */}
                  <div className="space-y-2">
                    <Label htmlFor="pt-rel">Hubungan</Label>
                    <Input
                      id="pt-rel"
                      value={partnerForm.relationship}
                      onChange={(e) => setPartnerForm((f) => ({ ...f, relationship: e.target.value }))}
                      placeholder="cth. Penganjur Program, Penderma"
                    />
                  </div>

                  {/* Verification Level */}
                  <div className="space-y-2">
                    <Label htmlFor="pt-verify">Tahap Pengesahan</Label>
                    <Select
                      value={partnerForm.verificationLevel}
                      onValueChange={(v) =>
                        setPartnerForm((f) => ({
                          ...f,
                          verificationLevel: v as Partner['verificationLevel'],
                        }))
                      }
                    >
                      <SelectTrigger id="pt-verify">
                        <SelectValue placeholder="Pilih tahap pengesahan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="claimed">
                          <div className="flex items-center gap-2">
                            <ShieldAlert className="h-3.5 w-3.5 text-blue-500" />
                            Dakwaan
                          </div>
                        </SelectItem>
                        <SelectItem value="partner_confirmed">
                          <div className="flex items-center gap-2">
                            <Shield className="h-3.5 w-3.5 text-amber-500" />
                            Disahkan Rakan
                          </div>
                        </SelectItem>
                        <SelectItem value="publicly_verified">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                            Disahkan Awam
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setPartnerDialogOpen(false)} className="gap-2">
                    <X className="h-4 w-4" />
                    Batal
                  </Button>
                  <Button
                    onClick={handleSavePartner}
                    disabled={!partnerForm.name || !partnerForm.type}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Save className="h-4 w-4" />
                    {editingPartner ? 'Kemaskini' : 'Simpan'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ════════════════════════════════════════════════
              TAB 4: MAKLUMAT PERBANKAN
          ════════════════════════════════════════════════ */}
          <TabsContent value="perbankan" className="space-y-6">
            <Card className="shadow-sm border-slate-200/80 dark:border-slate-700/80">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 rounded-lg dark:bg-emerald-900/30">
                    <Landmark className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Maklumat Perbankan</CardTitle>
                    <CardDescription>Akaun bank rasmi pertubuhan</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Bank Details */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                      <Landmark className="h-4 w-4 text-slate-400" />
                      Butiran Akaun
                    </h3>
                    {bankingInfo.verified && (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800 gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Disahkan
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bankName" className="text-sm font-medium">
                        Nama Bank
                      </Label>
                      <Input
                        id="bankName"
                        value={bankingInfo.bankName}
                        onChange={(e) =>
                          setBankingInfo((prev) => ({ ...prev, bankName: e.target.value }))
                        }
                        placeholder="Nama bank"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accHolder" className="text-sm font-medium">
                        Nama Pemegang Akaun
                      </Label>
                      <Input
                        id="accHolder"
                        value={bankingInfo.accountHolder}
                        onChange={(e) =>
                          setBankingInfo((prev) => ({ ...prev, accountHolder: e.target.value }))
                        }
                        placeholder="Nama pemegang akaun"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accNumber" className="text-sm font-medium">
                      No. Akaun
                    </Label>
                    <div className="relative">
                      <Input
                        id="accNumber"
                        type={showAccountNumber ? 'text' : 'password'}
                        value={bankingInfo.accountNumber}
                        onChange={(e) =>
                          setBankingInfo((prev) => ({ ...prev, accountNumber: e.target.value }))
                        }
                        placeholder="No. akaun bank"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => setShowAccountNumber(!showAccountNumber)}
                      >
                        {showAccountNumber ? (
                          <EyeOff className="h-4 w-4 text-slate-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-slate-400" />
                        )}
                      </Button>
                    </div>
                    {!showAccountNumber && (
                      <p className="text-xs text-slate-400">
                        {maskAccountNumber(bankingInfo.accountNumber)}
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* LHDN & Tax */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-5 space-y-4">
                  <h3 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-slate-400" />
                    Kelulusan LHDN & Cukai
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="lhdnRef" className="text-sm font-medium">
                        Rujukan Kelulusan LHDN
                      </Label>
                      <Input
                        id="lhdnRef"
                        value={bankingInfo.lhdnReference}
                        onChange={(e) =>
                          setBankingInfo((prev) => ({ ...prev, lhdnReference: e.target.value }))
                        }
                        placeholder="No. rujukan LHDN"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lhdnExpiry" className="text-sm font-medium">
                        Tarikh Tamat Tempoh
                      </Label>
                      <Input
                        id="lhdnExpiry"
                        type="date"
                        value={bankingInfo.lhdnExpiryDate}
                        onChange={(e) =>
                          setBankingInfo((prev) => ({ ...prev, lhdnExpiryDate: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4 bg-white dark:bg-slate-900">
                    <div className="flex items-center gap-3">
                      {bankingInfo.taxExempt ? (
                        <div className="p-2 bg-emerald-100 rounded-lg dark:bg-emerald-900/30">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                      ) : (
                        <div className="p-2 bg-slate-100 rounded-lg dark:bg-slate-800">
                          <AlertCircle className="h-5 w-5 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <Label className="text-sm font-medium">Status Pengecualian Cukai</Label>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {bankingInfo.taxExempt
                            ? 'Pertubuhan disahkan pengecualian cukai oleh LHDN'
                            : 'Pertubuhan belum mempunyai pengecualian cukai'}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={bankingInfo.taxExempt}
                      onCheckedChange={(checked) =>
                        setBankingInfo((prev) => ({ ...prev, taxExempt: checked }))
                      }
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => showSaveSuccess('banking')}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Save className="h-4 w-4" />
                    Simpan Maklumat Perbankan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Padam Rekod
            </AlertDialogTitle>
            <AlertDialogDescription>
              Adakah anda pasti ingin memadam rekod ini? Tindakan ini tidak boleh dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Padam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
