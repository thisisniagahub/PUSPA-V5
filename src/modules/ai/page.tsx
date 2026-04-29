'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  BarChart3,
  Wallet,
  Heart,
  Users,
  Sparkles,
  Send,
  Copy,
  Download,
  Mic,
  Search,
  Calculator,
  ClipboardList,
  MessageSquare,
  Loader2,
  Check,
  Bot,
  User,
  FileText,
  AlertTriangle,
  TrendingDown,
  Target,
  Globe,
  RefreshCw,
  BrainCircuit,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react'
import { api } from '@/lib/api'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string
  role: 'user' | 'ai'
  content: string
  timestamp: Date
}

interface ReportType {
  id: string
  icon: React.ReactNode
  title: string
  description: string
  color: string
  report: string
}

interface CommLog {
  id: string
  name: string
  type: string
  notes: string
  date: string
}

interface AnalyticsCard {
  type: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  gradient: string
}

interface DonorChurnData {
  summary: {
    totalDonors: number
    atRisk: number
    lowRisk: number
    moderateRisk: number
    highRisk: number
    churnRate: number
  }
  donors: Array<{
    id: string
    name: string
    riskLevel: string
    riskScore: number
    lastDonation: string
    averageAmount: number
    frequency: string
    tenureMonths: number
    reason: string
    recommendation: string
  }>
  insights: string[]
}

interface FraudData {
  summary: {
    totalDisbursements: number
    flagged: number
    reviewRequired: number
    cleared: number
    riskLevel: string
  }
  flaggedItems: Array<{
    id: string
    type: string
    reference: string
    amount: number
    recipient: string
    programme?: string
    payee?: string
    category?: string
    donor?: string
    method?: string
    date: string
    riskScore: number
    anomalies: string[]
    status: string
    recommendedAction: string
  }>
  insights: string[]
}

interface ProgrammeEffectivenessData {
  summary: {
    averageScore: number
    totalProgrammes: number
    highlyEffective: number
    effective: number
    needsImprovement: number
    totalBeneficiaries: number
  }
  programmes: Array<{
    id: string
    name: string
    status: string
    effectivenessScore: number
    budgetUtilization: number
    beneficiarySatisfaction: number
    costPerBeneficiary: number
    impactMetrics: Record<string, string>
    strengths: string[]
    improvements: string[]
    trend: string
    trendPercentage: number
  }>
  insights: string[]
}

interface SDGData {
  summary: {
    totalSDGsCovered: number
    primarySDGs: number
    secondarySDGs: number
    alignmentScore: number
  }
  sdgs: Array<{
    goalNumber: number
    title: string
    titleEn: string
    color: string
    alignmentLevel: string
    alignmentScore: number
    contribution: string
    programmes: string[]
    metrics: Array<{ name: string; value: string; target: string }>
    initiatives: string[]
  }>
  insights: string[]
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const reportTypes: ReportType[] = [
  {
    id: 'org',
    icon: <BarChart3 className="h-8 w-8" />,
    title: 'Ringkasan Organisasi',
    description: 'Gambaran keseluruhan prestasi dan operasi PUSPA',
    color: 'from-emerald-500 to-teal-600',
    report: `# 📊 Ringkasan Organisasi PUSPA

## Gambaran Keseluruhan
**Tarikh Laporan:** 21 April 2026  
**Tempoh:** Januari - April 2026

---

## Statistik Utama

| Metrik | Nilai | Perubahan |
|--------|-------|-----------|
| Jumlah Ahli Berdaftar | 342 | +12.3% |
| Ahli Aktif | 287 | +8.7% |
| Program Aktif | 15 | +3 baru |
| Sukan Sukarelawan | 48 | +15.2% |
| Kumpulan Donasi (Bulan Ini) | RM 45,230 | +22.1% |

---

## Pencapaian Utama

1. **Program AsnafCare** telah berjaya membantu **89 keluarga** di kawasan Hulu Klang
2. **Kempen Ramadhan 2026** mengumpul **RM 125,000** - melebihi sasaran sebanyak 25%
3. **Kelas Tilawah Dewasa** mencatatkan kehadiran purata **92%** setiap sesi
4. **Program Mentoring Belia** melibatkan **34 orang** belia berusia 18-25 tahun`,
  },
  {
    id: 'finance',
    icon: <Wallet className="h-8 w-8" />,
    title: 'Laporan Kewangan',
    description: 'Analisis kewangan dan aliran wang organisasi',
    color: 'from-amber-500 to-orange-600',
    report: `# 💰 Laporan Kewangan PUSPA

## Suku Tahun Pertama 2026

---

## Ringkasan Kewangan

| Kategori | Jumlah (RM) | Peratus |
|----------|-------------|---------|
| **Pendapatan Jumlah** | **285,450** | 100% |
| └ Donasi Individu | 142,300 | 49.9% |
| └ Derma Korporat | 89,200 | 31.2% |
| └ Geran Kerajaan | 38,500 | 13.5% |
| **Perbelanjaan Jumlah** | **231,780** | 100% |
| └ Bantuan Langsung (BMT) | 128,400 | 55.4% |
| └ Program & Aktiviti | 52,300 | 22.6% |
| **Baki Bersih** | **RM 53,670** | — |`,
  },
  {
    id: 'programme',
    icon: <Heart className="h-8 w-8" />,
    title: 'Laporan Program',
    description: 'Status dan prestasi semua program aktif',
    color: 'from-rose-500 to-pink-600',
    report: `# ❤️ Laporan Program PUSPA

## Status Program Aktif — April 2026

### 1. AsnafCare - 🟢 Aktif - 89 keluarga - Penilaian: 4.5/5.0
### 2. Pusat Sunnah Preschool - 🟢 Aktif - 24 pelajar - Penilaian: 4.8/5.0
### 3. Kelas Tilawah Dewasa - 🟢 Aktif - 67 peserta - Penilaian: 4.3/5.0
### 4. Mentoring Belia PUSPA - 🟡 Sedang Berjalan - 34 belia - Penilaian: 4.0/5.0
### 5. Klinik Kesihatan Komuniti - 🟡 Pendekatan Rakan Strategik - Penilaian: 4.2/5.0`,
  },
  {
    id: 'demographic',
    icon: <Users className="h-8 w-8" />,
    title: 'Demografi Ahli',
    description: 'Analisis demografi dan profil ahli PUSPA',
    color: 'from-violet-500 to-purple-600',
    report: `# 👥 Demografi Ahli PUSPA

## Ringkasan Keahlian

| Kategori | Bilangan | Peratus |
|----------|----------|---------|
| Jumlah Ahli Berdaftar | 342 | 100% |
| Ahli Aktif | 287 | 83.9% |
| Ahli Tidak Aktif | 55 | 16.1% |

## Taburan Mengikut Lokasi
| Kawasan | Bilangan | Percent |
|---------|----------|---------|
| Hulu Klang | 98 | 28.7% |
| Gombak | 85 | 24.9% |
| Ampang | 72 | 21.1% |
| Setapak | 45 | 13.2% |
| Wangsa Maju | 28 | 8.2% |`,
  },
]

const analyticsCards: AnalyticsCard[] = [
  {
    type: 'donor_churn',
    title: 'Ramalan Perpindahan Penderma',
    description: 'Kenal pasti penderma berisiko tinggi untuk berhenti menderma',
    icon: <TrendingDown className="h-6 w-6" />,
    color: 'text-rose-600',
    gradient: 'from-rose-500 to-orange-500',
  },
  {
    type: 'fraud_detection',
    title: 'Pengesanan Penipuan',
    description: 'Kesan anomali dan transaksi mencurigakan secara automatik',
    icon: <ShieldCheck className="h-6 w-6" />,
    color: 'text-amber-600',
    gradient: 'from-amber-500 to-yellow-500',
  },
  {
    type: 'programme_effectiveness',
    title: 'Keberkesanan Program',
    description: 'Nilaikan prestasi dan impak setiap program PUSPA',
    icon: <Target className="h-6 w-6" />,
    color: 'text-emerald-600',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    type: 'sdg_alignment',
    title: 'Penjajaran SDG',
    description: 'Pemetaan sumbangan PUSPA terhadap Matlamat Pembangunan Mampan',
    icon: <Globe className="h-6 w-6" />,
    color: 'text-sky-600',
    gradient: 'from-sky-500 to-cyan-500',
  },
]

const initialMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'ai',
    content:
      'Assalamualaikum! Saya pembantu AI PUSPA. Bagaimana saya boleh membantu anda hari ini?',
    timestamp: new Date(Date.now() - 120000),
  },
]

const quickQuestions = [
  'Berapakah jumlah ahli aktif?',
  'Senaraikan program yang aktif',
  'Berapakah jumlah donasi bulan ini?',
  'Siapakah penerima bantuan terbesar?',
]

const initialCommLogs: CommLog[] = [
  {
    id: '1',
    name: 'Puan Siti Aminah',
    type: 'Lawatan',
    notes: 'Lawatan rumah ke rumah pesakit di Hulu Klang. Keperluan segera: bekalan makanan.',
    date: '2026-04-20',
  },
  {
    id: '2',
    name: 'Encik Ahmad bin Hassan',
    type: 'Panggilan',
    notes: 'Telah dihubungi berkenaan status permohonan BMT. Akan diikuti dengan lawatan minggu depan.',
    date: '2026-04-19',
  },
  {
    id: '3',
    name: 'Puan Nurul Izzah',
    type: 'Email',
    notes: 'Pengesahan penerimaan bantuan pendidikan untuk 3 orang anak. Dokumen lengkap.',
    date: '2026-04-18',
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function MarkdownContent({ content, className = '' }: { content: string; className?: string }) {
  return (
    <div className={`space-y-3 text-sm leading-7 text-slate-700 dark:text-slate-300 ${className}`}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">{children}</h1>,
          h2: ({ children }) => <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">{children}</h2>,
          h3: ({ children }) => <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">{children}</h3>,
          p: ({ children }) => <p className="whitespace-pre-wrap">{children}</p>,
          ul: ({ children }) => <ul className="ml-5 list-disc space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="ml-5 list-decimal space-y-1">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          hr: () => <hr className="my-4 border-muted" />,
          strong: ({ children }) => <strong className="font-semibold text-slate-900 dark:text-white">{children}</strong>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-purple-700 underline underline-offset-4"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

function getRiskBadge(level: string) {
  const map: Record<string, { color: string; label: string }> = {
    TINGGI: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Tinggi' },
    SEDERHANA: { color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Sederhana' },
    SEDANG: { color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Sederhana' },
    RENDAH: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Rendah' },
  }
  const info = map[level] || { color: 'bg-slate-100 text-slate-600 border-slate-200', label: level }
  return <Badge variant="outline" className={info.color}>{info.label}</Badge>
}

function getStatusBadge(status: string) {
  const s = status.toUpperCase()
  if (s.includes('SEMERAH') || s.includes('BERSIH')) {
    return <Badge className="bg-emerald-100 text-emerald-700 border-0">Sudah Bersih</Badge>
  }
  if (s.includes('SEMAKAN')) {
    return <Badge className="bg-amber-100 text-amber-700 border-0">Menunggu Semakan</Badge>
  }
  return <Badge variant="outline">{status}</Badge>
}

function getTrendIcon(trend: string) {
  if (trend === 'meningkat') return <span className="text-emerald-600 font-medium">↑ Meningkat</span>
  if (trend === 'menurun') return <span className="text-red-600 font-medium">↓ Menurun</span>
  return <span className="text-slate-500 font-medium">→ Stabil</span>
}

function getScoreColor(score: number) {
  if (score >= 4.5) return 'text-emerald-600'
  if (score >= 4.0) return 'text-teal-600'
  if (score >= 3.5) return 'text-amber-600'
  return 'text-red-600'
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AIToolsPage() {
  // ── State ──
  const [activeTab, setActiveTab] = useState('laporan')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedReport, setGeneratedReport] = useState('')
  const [customPrompt, setCustomPrompt] = useState('')
  const [customResponse, setCustomResponse] = useState('')
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false)
  const [copied, setCopied] = useState(false)

  // Chat state (connected to backend)
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [chatInput, setChatInput] = useState('')
  const [isChatSending, setIsChatSending] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [chatContext, setChatContext] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Analytics state
  const [selectedAnalytics, setSelectedAnalytics] = useState<string | null>(null)
  const [analyticsData, setAnalyticsData] = useState<DonorChurnData | FraudData | ProgrammeEffectivenessData | SDGData | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsError, setAnalyticsError] = useState('')

  // Member tools state
  const [icInput, setIcInput] = useState('')
  const [icResult, setIcResult] = useState<null | { eligible: boolean; programmes: { name: string; score: number; status: string }[] }>(null)
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false)

  const [calcHouseholdSize, setCalcHouseholdSize] = useState('4')
  const [calcIncome, setCalcIncome] = useState('1500')
  const [calcExpenses, setCalcExpenses] = useState('1200')
  const [calcResult, setCalcResult] = useState<null | { amount: number; breakdown: Record<string, number> }>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  const [welfareSliders, setWelfareSliders] = useState({
    pendapatan: 3,
    perumahan: 4,
    kesihatan: 3,
    pendidikan: 4,
    sokonganSosial: 5,
  })
  const [welfareResult, setWelfareResult] = useState<null | { score: number; recommendation: string }>(null)
  const [isAssessing, setIsAssessing] = useState(false)

  const [commName, setCommName] = useState('')
  const [commType, setCommType] = useState('')
  const [commNotes, setCommNotes] = useState('')
  const [commLogs, setCommLogs] = useState<CommLog[]>(initialCommLogs)

  // ── Effects ──
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Handlers ──

  const handleGenerateReport = useCallback(
    (report: ReportType) => {
      setSelectedReport(report)
      setGeneratedReport('')
      setIsGenerating(true)
      setDialogOpen(true)
      setCopied(false)

      setTimeout(() => {
        setIsGenerating(false)
        setGeneratedReport(report.report)
      }, 2500)
    },
    []
  )

  const handleCopyReport = useCallback(async () => {
    if (!generatedReport) return
    await navigator.clipboard.writeText(generatedReport)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [generatedReport])

  const handleDownloadReport = useCallback(() => {
    if (!generatedReport || !selectedReport) return
    const blob = new Blob([generatedReport], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedReport.id}-laporan-puspa.md`
    a.click()
    URL.revokeObjectURL(url)
  }, [generatedReport, selectedReport])

  const handleCustomGenerate = useCallback(() => {
    if (!customPrompt.trim()) return
    setIsGeneratingCustom(true)
    setCustomResponse('')

    setTimeout(() => {
      setIsGeneratingCustom(false)
      setCustomResponse(
        `## Hasil Analisis AI\n\nBerdasarkan pertanyaan anda: _"${customPrompt}"_\n\n\n### Ringkasan\n\nBerdasarkan data yang terdapat dalam sistem PUSPA, berikut adalah maklumat yang relevan:\n\n- **Jumlah rekod berkaitan**: 47 entri ditemui\n- **Tempoh liputan**: Januari - April 2026\n- **Sumber data**: Sistem Pengurusan Ahli, Modul Kewangan, Modul Program\n\n### Butiran\n\nAnalisis menunjukkan trend positif dalam operasi PUSPA bagi suku tahun pertama 2026. Jumlah ahli aktif mencatatkan peningkatan sebanyak **12.3%** berbanding tempoh yang sama tahun lepas.\n\n### Cadangan\n\n1. Menjalankan audit dalaman untuk data yang lebih tepat\n2. Mengemaskini profil ahli secara berkala\n3. Mempertingkatkan pengumpulan data untuk analisis masa hadapan\n\n> _*Laporan ini dijana oleh AI dan perlu disahkan oleh pentadbir._*`
      )
    }, 3000)
  }, [customPrompt])

  // ── Real AI Chat via backend ──
  const handleSendChat = useCallback(
    async (text?: string) => {
      const messageText = text || chatInput.trim()
      if (!messageText || isChatSending) return

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: messageText,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, userMsg])
      setChatInput('')
      setIsChatSending(true)

      try {
        const response = await api.post<{ response: string; tokens: { input: number; output: number; total: number } }>(
          '/ai/chat',
          { message: messageText, context: chatContext || undefined }
        )

        const aiMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          role: 'ai',
          content: response.response,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, aiMsg])
      } catch {
        const aiMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          role: 'ai',
          content: 'Maaf, saya mengalami masalah teknikal. Sila cuba lagi dalam beberapa saat. Jika masalah berterusan, hubungi pentadbir sistem.',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, aiMsg])
      } finally {
        setIsChatSending(false)
      }
    },
    [chatInput, chatContext, isChatSending]
  )

  const handleQuickQuestion = useCallback(
    (q: string) => {
      handleSendChat(q)
    },
    [handleSendChat]
  )

  const handleMicToggle = useCallback(() => {
    setIsListening((prev) => {
      if (!prev) {
        setTimeout(() => {
          setIsListening(false)
          setChatInput('Berapakah jumlah program yang aktif?')
        }, 2000)
      }
      return !prev
    })
  }, [])

  // ── Analytics Fetcher ──
  const fetchAnalytics = useCallback(async (type: string) => {
    setSelectedAnalytics(type)
    setAnalyticsData(null)
    setAnalyticsError('')
    setAnalyticsLoading(true)

    try {
      const data = await api.get<DonorChurnData | FraudData | ProgrammeEffectivenessData | SDGData>(
        '/ai/analytics',
        { type }
      )
      setAnalyticsData(data)
    } catch {
      setAnalyticsError('Gagal menjana analitik. Sila cuba lagi.')
    } finally {
      setAnalyticsLoading(false)
    }
  }, [])

  // ── Render Analytics Detail ──
  const renderAnalyticsDetail = () => {
    if (analyticsLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <BrainCircuit className="h-12 w-12 text-violet-500 animate-pulse" />
          <p className="text-sm text-slate-500 animate-pulse">AI sedang menganalisis data...</p>
        </div>
      )
    }

    if (analyticsError) {
      return (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <AlertTriangle className="h-12 w-12 text-red-400" />
          <p className="text-sm text-red-500">{analyticsError}</p>
          <Button variant="outline" size="sm" onClick={() => selectedAnalytics && fetchAnalytics(selectedAnalytics)}>
            <RefreshCw className="h-4 w-4 mr-2" /> Cuba Semula
          </Button>
        </div>
      )
    }

    if (!analyticsData) return null

    if (selectedAnalytics === 'donor_churn') {
      const data = analyticsData as DonorChurnData
      const s = data.summary
      return (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Jumlah Penderma', value: s.totalDonors, color: 'text-slate-700' },
              { label: 'Berisiko', value: s.atRisk, color: 'text-red-600' },
              { label: 'Risiko Rendah', value: s.lowRisk, color: 'text-amber-600' },
              { label: 'Risiko Sederhana', value: s.moderateRisk, color: 'text-orange-600' },
              { label: 'Risiko Tinggi', value: s.highRisk, color: 'text-red-700' },
            ].map((item) => (
              <div key={item.label} className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-rose-50 rounded-lg p-4">
            <p className="text-sm text-rose-700">
              <strong>Kadar Perpindahan:</strong> {s.churnRate}% — {s.churnRate > 10 ? 'Melebihi sasaran 10%. Tindakan segera diperlukan.' : 'Dalam had yang boleh diterima.'}
            </p>
          </div>

          {/* Donor List */}
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-3">
              {data.donors.map((d) => (
                <Card key={d.id} className="border shadow-none">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium text-sm">{d.name}</h4>
                          {getRiskBadge(d.riskLevel)}
                          <Badge variant="outline" className="text-xs">
                            Skor: {d.riskScore}/100
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>Purata: RM {d.averageAmount}</span>
                          <span>{d.frequency}</span>
                          <span>{d.tenureMonths} bulan</span>
                          <span>Terakhir: {d.lastDonation}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{d.reason}</p>
                        <div className="mt-2 px-3 py-2 bg-violet-50 rounded-md">
                          <p className="text-xs text-violet-700"><strong>Cadangan:</strong> {d.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          {/* Insights */}
          <Card className="bg-slate-50 border-0">
            <CardContent className="p-4">
              <h4 className="text-sm font-semibold mb-2">💡 Wawasan AI</h4>
              <ul className="space-y-1.5">
                {data.insights.map((insight, i) => (
                  <li key={i} className="text-xs text-slate-600 flex gap-2">
                    <ChevronRight className="h-3 w-3 mt-0.5 shrink-0 text-violet-500" />
                    {insight}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )
    }

    if (selectedAnalytics === 'fraud_detection') {
      const data = analyticsData as FraudData
      const s = data.summary
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Jumlah Transaksi', value: s.totalDisbursements },
              { label: 'Ditanda', value: s.flagged, color: 'text-red-600' },
              { label: 'Perlu Semakan', value: s.reviewRequired, color: 'text-amber-600' },
              { label: 'Sudah Bersih', value: s.cleared, color: 'text-emerald-600' },
            ].map((item) => (
              <div key={item.label} className="bg-slate-50 rounded-lg p-3 text-center">
                <p className={`text-2xl font-bold ${item.color || ''}`}>{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>

          <ScrollArea className="max-h-[400px]">
            <div className="space-y-3">
              {data.flaggedItems.map((item) => (
                <Card key={item.id} className="border shadow-none">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium text-sm">{item.reference}</h4>
                          {getStatusBadge(item.status)}
                          <Badge variant="outline" className="text-xs">Skor: {item.riskScore}/100</Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>{item.type}</span>
                          <span className="font-semibold text-slate-700">RM {item.amount.toLocaleString()}</span>
                          <span>{item.recipient || item.payee || item.donor}</span>
                          <span>{item.date}</span>
                        </div>
                        <div className="mt-2">
                          <p className="text-xs font-medium text-amber-700 mb-1">Anomali dikesan:</p>
                          <ul className="space-y-0.5">
                            {item.anomalies.map((a, i) => (
                              <li key={i} className="text-xs text-slate-600 flex gap-1.5">
                                <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0 text-amber-500" />
                                {a}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="mt-2 px-3 py-2 bg-violet-50 rounded-md">
                          <p className="text-xs text-violet-700"><strong>Tindakan:</strong> {item.recommendedAction}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          <Card className="bg-slate-50 border-0">
            <CardContent className="p-4">
              <h4 className="text-sm font-semibold mb-2">💡 Wawasan AI</h4>
              <ul className="space-y-1.5">
                {data.insights.map((insight, i) => (
                  <li key={i} className="text-xs text-slate-600 flex gap-2">
                    <ChevronRight className="h-3 w-3 mt-0.5 shrink-0 text-violet-500" />
                    {insight}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )
    }

    if (selectedAnalytics === 'programme_effectiveness') {
      const data = analyticsData as ProgrammeEffectivenessData
      const s = data.summary
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Skor Purata', value: s.averageScore.toFixed(1), color: 'text-violet-600' },
              { label: 'Jumlah Program', value: s.totalProgrammes },
              { label: 'Sangat Berkesan', value: s.highlyEffective, color: 'text-emerald-600' },
              { label: 'Berkesan', value: s.effective, color: 'text-teal-600' },
              { label: 'Perlu Peningkatan', value: s.needsImprovement, color: 'text-amber-600' },
            ].map((item) => (
              <div key={item.label} className="bg-slate-50 rounded-lg p-3 text-center">
                <p className={`text-2xl font-bold ${item.color || ''}`}>{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>

          <ScrollArea className="max-h-[500px]">
            <div className="space-y-4">
              {data.programmes.map((prog) => (
                <Card key={prog.id} className="border shadow-none">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">{prog.name}</h4>
                          <Badge variant="outline" className="text-xs">{prog.status}</Badge>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-xs">
                          {getTrendIcon(prog.trend)}
                          <span className="text-muted-foreground ml-1">({prog.trendPercentage > 0 ? '+' : ''}{prog.trendPercentage}%)</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${getScoreColor(prog.effectivenessScore)}`}>
                          {prog.effectivenessScore}
                        </p>
                        <p className="text-[10px] text-muted-foreground">/5.0</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center bg-slate-50 rounded-lg p-2">
                        <p className="text-lg font-bold text-slate-700">{prog.budgetUtilization}%</p>
                        <p className="text-[10px] text-muted-foreground">Utilisasi Belanjawan</p>
                      </div>
                      <div className="text-center bg-slate-50 rounded-lg p-2">
                        <p className="text-lg font-bold text-slate-700">{prog.beneficiarySatisfaction}%</p>
                        <p className="text-[10px] text-muted-foreground">Kepuasan</p>
                      </div>
                      <div className="text-center bg-slate-50 rounded-lg p-2">
                        <p className="text-lg font-bold text-slate-700">RM {prog.costPerBeneficiary}</p>
                        <p className="text-[10px] text-muted-foreground">Kos/Penerima</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-700 mb-1">Metrik Impak:</p>
                      <div className="grid grid-cols-2 gap-1">
                        {Object.entries(prog.impactMetrics).map(([key, val]) => (
                          <div key={key} className="flex justify-between text-xs bg-slate-50 rounded px-2 py-1">
                            <span className="text-muted-foreground">{key}</span>
                            <span className="font-medium">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="bg-emerald-50 rounded-lg p-2">
                        <p className="text-xs font-medium text-emerald-700 mb-1">Kekuatan:</p>
                        {prog.strengths.map((str, i) => (
                          <p key={i} className="text-xs text-emerald-600 flex gap-1"><Check className="h-3 w-3 mt-0.5 shrink-0" />{str}</p>
                        ))}
                      </div>
                      <div className="bg-amber-50 rounded-lg p-2">
                        <p className="text-xs font-medium text-amber-700 mb-1">Penambahbaikan:</p>
                        {prog.improvements.map((imp, i) => (
                          <p key={i} className="text-xs text-amber-600 flex gap-1"><ChevronRight className="h-3 w-3 mt-0.5 shrink-0" />{imp}</p>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          <Card className="bg-slate-50 border-0">
            <CardContent className="p-4">
              <h4 className="text-sm font-semibold mb-2">💡 Wawasan AI</h4>
              <ul className="space-y-1.5">
                {data.insights.map((insight, i) => (
                  <li key={i} className="text-xs text-slate-600 flex gap-2">
                    <ChevronRight className="h-3 w-3 mt-0.5 shrink-0 text-violet-500" />
                    {insight}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )
    }

    if (selectedAnalytics === 'sdg_alignment') {
      const data = analyticsData as SDGData
      const s = data.summary
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'SDG Diliputi', value: s.totalSDGsCovered, color: 'text-sky-600' },
              { label: 'SDG Utama', value: s.primarySDGs, color: 'text-violet-600' },
              { label: 'SDG Sekunder', value: s.secondarySDGs, color: 'text-teal-600' },
              { label: 'Skor Penjajaran', value: `${s.alignmentScore}%`, color: 'text-emerald-600' },
            ].map((item) => (
              <div key={item.label} className="bg-slate-50 rounded-lg p-3 text-center">
                <p className={`text-2xl font-bold ${item.color || ''}`}>{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>

          <ScrollArea className="max-h-[500px]">
            <div className="space-y-3">
              {data.sdgs.map((sdg) => (
                <Card key={sdg.goalNumber} className="border shadow-none overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div
                        className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0"
                        style={{ backgroundColor: sdg.color }}
                      >
                        {sdg.goalNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium text-sm">{sdg.title}</h4>
                          <Badge
                            className={sdg.alignmentLevel === 'UTAMA' ? 'bg-violet-100 text-violet-700 border-0' : 'bg-slate-100 text-slate-600 border-0'}
                          >
                            {sdg.alignmentLevel}
                          </Badge>
                          <Badge variant="outline" className="text-xs">Skor: {sdg.alignmentScore}%</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{sdg.titleEn}</p>
                      </div>
                    </div>

                    <Progress value={sdg.alignmentScore} className="h-2" />

                    <p className="text-xs text-slate-600">{sdg.contribution}</p>

                    <div className="flex flex-wrap gap-1">
                      {sdg.programmes.map((p) => (
                        <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>
                      ))}
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-700 mb-1.5">Metrik:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {sdg.metrics.map((m) => (
                          <div key={m.name} className="bg-slate-50 rounded-lg p-2">
                            <p className="text-xs font-medium text-slate-700">{m.name}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-sm font-bold">{m.value}</span>
                              <span className="text-[10px] text-muted-foreground">/ {m.target}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <details className="group">
                      <summary className="text-xs text-violet-600 cursor-pointer font-medium hover:text-violet-800">
                        Lihat inisiatif dan cadangan
                      </summary>
                      <ul className="mt-2 space-y-1">
                        {sdg.initiatives.map((init, i) => (
                          <li key={i} className="text-xs text-slate-600 flex gap-1.5">
                            <Check className="h-3 w-3 mt-0.5 shrink-0 text-emerald-500" />
                            {init}
                          </li>
                        ))}
                      </ul>
                    </details>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          <Card className="bg-slate-50 border-0">
            <CardContent className="p-4">
              <h4 className="text-sm font-semibold mb-2">💡 Wawasan AI</h4>
              <ul className="space-y-1.5">
                {data.insights.map((insight, i) => (
                  <li key={i} className="text-xs text-slate-600 flex gap-2">
                    <ChevronRight className="h-3 w-3 mt-0.5 shrink-0 text-violet-500" />
                    {insight}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )
    }

    return null
  }

  // ── Eligibility Check ──
  const handleCheckEligibility = useCallback(() => {
    if (!icInput.trim()) return
    setIsCheckingEligibility(true)
    setIcResult(null)

    setTimeout(() => {
      setIsCheckingEligibility(false)
      setIcResult({
        eligible: true,
        programmes: [
          { name: 'AsnafCare - Bantuan Makanan', score: 92, status: 'Layak' },
          { name: 'BMT Kewangan Bulanan', score: 88, status: 'Layak' },
          { name: 'Bantuan Pendidikan Anak', score: 75, status: 'Layak' },
          { name: 'Program Mentoring Belia', score: 60, status: 'Perlu Semakan' },
          { name: 'Tabung Kesihatan Komuniti', score: 45, status: 'Tidak Layak' },
        ],
      })
    }, 2000)
  }, [icInput])

  // ── Financial Calculator ──
  const handleCalculate = useCallback(() => {
    setIsCalculating(true)
    setCalcResult(null)

    const household = parseInt(calcHouseholdSize) || 4
    const income = parseFloat(calcIncome) || 0
    const expenses = parseFloat(calcExpenses) || 0
    const deficit = Math.max(0, expenses - income)
    const bmt = Math.min(deficit * 0.7, household * 400)
    const foodAllowance = Math.min(bmt * 0.45, household * 200)
    const educationAllowance = Math.min(bmt * 0.25, household * 120)
    const healthAllowance = Math.min(bmt * 0.20, household * 80)
    const otherAllowance = bmt - foodAllowance - educationAllowance - healthAllowance

    setTimeout(() => {
      setIsCalculating(false)
      setCalcResult({
        amount: Math.round(bmt),
        breakdown: {
          'Wang Saku Makanan': Math.round(foodAllowance),
          'Bantuan Pendidikan': Math.round(educationAllowance),
          'Tambahan Kesihatan': Math.round(healthAllowance),
          'Lain-lain Keperluan': Math.round(otherAllowance),
        },
      })
    }, 2000)
  }, [calcHouseholdSize, calcIncome, calcExpenses])

  // ── Welfare Assessment ──
  const handleAssessWelfare = useCallback(() => {
    setIsAssessing(true)
    setWelfareResult(null)

    const { pendapatan, perumahan, kesihatan, pendidikan, sokonganSosial } =
      welfareSliders
    const avg =
      (pendapatan + perumahan + kesihatan + pendidikan + sokonganSosial) / 5
    const score = Math.round(avg * 20)

    let recommendation = ''
    if (score >= 80) {
      recommendation =
        'Ahli ini berada dalam tahap kebajikan yang **sangat baik**. Tiada bantuan segera diperlukan. Cadangan: sertakan sebagai sukarelawan atau mentor.'
    } else if (score >= 60) {
      recommendation =
        'Tahap kebajikan adalah **sederhana**. Bantuan pencegahan dan pemantauan berkala dicadangkan. Sertakan dalam program pemerkasaan.'
    } else if (score >= 40) {
      recommendation =
        'Ahli ini **memerlukan bantuan sederhana**. Cadangkan penyertaan dalam program BMT dan pemantauan bulanan oleh pegawai kebajikan.'
    } else {
      recommendation =
        'Ahli ini **memerlukan bantuan segera dan prioriti tinggi**. Segera rujuk kepada Unit Kebajikan untuk tindakan lanjut dan bantuan kecemasan.'
    }

    setTimeout(() => {
      setIsAssessing(false)
      setWelfareResult({ score, recommendation })
    }, 2000)
  }, [welfareSliders])

  // ── Communication Log ──
  const handleAddCommLog = useCallback(() => {
    if (!commName.trim() || !commType || !commNotes.trim()) return
    const newLog: CommLog = {
      id: `cl-${Date.now()}`,
      name: commName,
      type: commType,
      notes: commNotes,
      date: new Date().toISOString().split('T')[0],
    }
    setCommLogs((prev) => [newLog, ...prev])
    setCommName('')
    setCommType('')
    setCommNotes('')
  }, [commName, commType, commNotes])

  // ── Render ──
  return (
    <div className="min-h-screen bg-transparent">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                AI Tools PUSPA
              </h1>
              <p className="text-sm text-muted-foreground">
                Alat pintar untuk pengurusan NGO yang lebih cekap
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          {/* Sub-navigation Tabs — 4 tabs now */}
          <TabsList className="w-full grid grid-cols-4 mb-6 h-auto p-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
            <TabsTrigger
              value="laporan"
              className="py-3 text-sm font-medium rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              <FileText className="h-4 w-4 mr-1.5 hidden sm:inline-block" />
              <span className="text-xs sm:text-sm">Laporan</span>
            </TabsTrigger>
            <TabsTrigger
              value="sembang"
              className="py-3 text-sm font-medium rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              <MessageSquare className="h-4 w-4 mr-1.5 hidden sm:inline-block" />
              <span className="text-xs sm:text-sm">Sembang</span>
            </TabsTrigger>
            <TabsTrigger
              value="analitik"
              className="py-3 text-sm font-medium rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              <BrainCircuit className="h-4 w-4 mr-1.5 hidden sm:inline-block" />
              <span className="text-xs sm:text-sm">Analitik AI</span>
            </TabsTrigger>
            <TabsTrigger
              value="alat"
              className="py-3 text-sm font-medium rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              <Search className="h-4 w-4 mr-1.5 hidden sm:inline-block" />
              <span className="text-xs sm:text-sm">Alat Ahli</span>
            </TabsTrigger>
          </TabsList>

          {/* ════════════════════════════════════════════════════════════════════ */}
          {/* TAB 1: LAPORAN AI                                                   */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          <TabsContent value="laporan" className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {reportTypes.map((report) => (
                <Card
                  key={report.id}
                  className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-white/10 bg-white/5 backdrop-blur-md overflow-hidden"
                  onClick={() => handleGenerateReport(report)}
                >
                  <div
                    className={`h-2 bg-gradient-to-r ${report.color} opacity-40 group-hover:opacity-100 transition-opacity`}
                  />
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div
                        className={`p-3 rounded-xl bg-gradient-to-br ${report.color} text-white shadow-lg`}
                      >
                        {report.icon}
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-cyan-500/10 text-cyan-400 border-cyan-400/30"
                      >
                        Sedia Ada
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mt-3 text-foreground">
                      {report.title}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {report.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button
                      variant="outline"
                      className="w-full border-white/10 text-foreground hover:bg-white/10 transition-colors"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Jana Laporan
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-white/10 bg-white/5 backdrop-blur-md shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Prompt Tersuai
                </CardTitle>
                <CardDescription>
                  Masukkan soalan atau pertanyaan anda untuk menjana laporan khas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Contoh: Jana laporan perbandingan prestasi program Q1 2025 vs Q1 2026..."
                  className="min-h-[100px] resize-none border-white/10 bg-black/20 focus:border-primary/50 focus:ring-primary/20 text-foreground"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    AI akan menganalisis data PUSPA berdasarkan pertanyaan anda
                  </p>
                  <Button
                    onClick={handleCustomGenerate}
                    disabled={!customPrompt.trim() || isGeneratingCustom}
                    className="bg-gradient-to-r from-primary to-violet-600 hover:from-primary/80 hover:to-violet-600/80 text-white shadow-md shadow-primary/20"
                  >
                    {isGeneratingCustom ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menjana...</>
                    ) : (
                      <><Sparkles className="h-4 w-4 mr-2" />Jana Laporan</>
                    )}
                  </Button>
                </div>

                {isGeneratingCustom && (
                  <div className="flex items-center justify-center py-12 space-x-3">
                    <div className="h-3 w-3 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                    <div className="h-3 w-3 rounded-full bg-violet-500 animate-bounce [animation-delay:150ms]" />
                    <div className="h-3 w-3 rounded-full bg-cyan-400 animate-bounce [animation-delay:300ms]" />
                    <span className="text-sm text-muted-foreground ml-2">AI sedang menganalisis data...</span>
                  </div>
                )}

                {customResponse && !isGeneratingCustom && (
                  <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-6">
                    <MarkdownContent content={customResponse} />
                    <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                      <Button variant="outline" size="sm" onClick={async () => { await navigator.clipboard.writeText(customResponse) }} className="text-xs border-white/10 hover:bg-white/5">
                        <Copy className="h-3 w-3 mr-1" />Salin
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        const blob = new Blob([customResponse], { type: 'text/markdown' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = 'laporan-tersuai-puspa.md'
                        a.click()
                        URL.revokeObjectURL(url)
                      }} className="text-xs border-white/10 hover:bg-white/5">
                        <Download className="h-3 w-3 mr-1" />Muat Turun
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ════════════════════════════════════════════════════════════════════ */}
          {/* TAB 2: SEMBANG AI (Connected to backend)                             */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          <TabsContent value="sembang">
           <Card className="border-white/10 bg-white/5 backdrop-blur-md shadow-sm overflow-hidden flex flex-col">
              <CardHeader className="border-b border-white/10 bg-gradient-to-r from-primary to-violet-600 text-white rounded-t-xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-white">
                      Pembantu AI PUSPA
                    </CardTitle>
                    <CardDescription className="text-white/70">
                      Disambungkan ke AI — Sedia membantu anda 24/7
                    </CardDescription>
                  </div>
                  <Badge className="bg-cyan-500/20 text-cyan-100 border-cyan-400/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 mr-1.5 inline-block animate-pulse" />
                    Dalam Talian
                  </Badge>
                </div>
              </CardHeader>

              {/* Context selector */}
              <div className="px-4 pt-3 pb-2 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">Konteks:</Label>
                  <Select value={chatContext} onValueChange={setChatContext}>
                    <SelectTrigger className="h-8 text-xs w-full bg-black/20 border-white/10 text-foreground">
                      <SelectValue placeholder="Pilih konteks..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      <SelectItem value="">Tiada konteks khas</SelectItem>
                      <SelectItem value="kewangan">Data Kewangan</SelectItem>
                      <SelectItem value="ahli">Data Ahli & Keahlian</SelectItem>
                      <SelectItem value="program">Data Program</SelectItem>
                      <SelectItem value="derma">Data Derma & Penderma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Quick Questions */}
              <div className="px-4 pt-3 pb-2 border-b border-white/10 bg-white/5">
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider opacity-60">
                  Soalan Pantas
                </p>
                <div className="flex flex-wrap gap-2">
                  {quickQuestions.map((q, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="text-xs border-white/10 text-foreground hover:bg-white/10 transition-colors"
                      onClick={() => handleQuickQuestion(q)}
                      disabled={isChatSending}
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 min-h-0">
                <ScrollArea className="h-[420px] sm:h-[480px]">
                  <div className="p-4 space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <Avatar
                          className={`h-8 w-8 shrink-0 ${
                            msg.role === 'user'
                              ? 'bg-primary/20'
                              : 'bg-gradient-to-br from-primary to-violet-600'
                          }`}
                        >
                          <AvatarFallback
                            className={
                              msg.role === 'user'
                                ? 'text-primary text-xs'
                                : 'text-white text-xs'
                            }
                          >
                            {msg.role === 'user' ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`max-w-[75%] sm:max-w-[65%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-gradient-to-br from-primary to-violet-600 text-white rounded-tr-sm shadow-lg shadow-primary/10'
                              : 'bg-white/10 backdrop-blur-sm text-foreground rounded-tl-sm border border-white/10'
                          }`}
                        >
                          <MarkdownContent content={msg.content} />
                          <p
                            className={`text-[10px] mt-2 ${
                              msg.role === 'user' ? 'text-white/60' : 'text-muted-foreground'
                            }`}
                          >
                            {msg.timestamp.toLocaleTimeString('ms-MY', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    ))}

                    {isChatSending && (
                      <div className="flex gap-3">
                        <Avatar className="h-8 w-8 shrink-0 bg-gradient-to-br from-primary to-violet-600">
                          <AvatarFallback className="text-white text-xs">
                            <Sparkles className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl rounded-tl-sm px-4 py-3 border border-white/10">
                          <div className="flex gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                            <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                            <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={chatEndRef} />
                  </div>
                </ScrollArea>
              </div>

              {/* Chat Input */}
              <div className="border-t border-white/10 p-4 bg-white/5 backdrop-blur-md">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`shrink-0 rounded-full ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'text-muted-foreground hover:text-primary hover:bg-white/10'}`}
                    onClick={handleMicToggle}
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder="Taip mesej anda di sini..."
                    className="flex-1 rounded-full border-white/10 bg-black/40 focus:border-primary/50 focus:ring-primary/20 text-foreground"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendChat()
                      }
                    }}
                    disabled={isChatSending}
                  />
                  <Button
                    size="icon"
                    className="shrink-0 rounded-full bg-gradient-to-r from-primary to-violet-600 hover:from-primary/80 hover:to-violet-600/80 text-white shadow-md shadow-primary/20"
                    onClick={() => handleSendChat()}
                    disabled={!chatInput.trim() || isChatSending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                {isListening && (
                  <p className="text-xs text-red-500 text-center mt-2 animate-pulse font-medium">
                    Mendengar... sila bercakap sekarang
                  </p>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* ════════════════════════════════════════════════════════════════════ */}
          {/* TAB 3: ANALITIK AI (NEW)                                             */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          <TabsContent value="analitik" className="space-y-6">
            {!selectedAnalytics ? (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-foreground">Analitik AI PUSPA</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Dikuasakan oleh kecerdasan buatan untuk wawasan yang lebih mendalam
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {analyticsCards.map((card) => (
                    <Card
                      key={card.type}
                      className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-white/10 bg-white/5 backdrop-blur-md overflow-hidden"
                      onClick={() => fetchAnalytics(card.type)}
                    >
                      <div
                        className={`h-2 bg-gradient-to-r ${card.gradient} opacity-40 group-hover:opacity-100 transition-opacity`}
                      />
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div
                            className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} text-white shadow-lg`}
                          >
                            {card.icon}
                          </div>
                          <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
                            AI
                          </Badge>
                        </div>
                        <CardTitle className="text-lg mt-3 text-foreground">
                          {card.title}
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                          {card.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Button
                          variant="outline"
                          className="w-full border-white/10 text-foreground hover:bg-white/10 transition-colors"
                        >
                          <BrainCircuit className="h-4 w-4 mr-2" />
                          Mula Analisis
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mb-4"
                  onClick={() => {
                    setSelectedAnalytics(null)
                    setAnalyticsData(null)
                  }}
                >
                  ← Kembali ke Senarai Analitik
                </Button>

                <Card className="border-white/10 bg-white/5 backdrop-blur-md shadow-sm">
                  <CardHeader className="border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                        {analyticsCards.find((c) => c.type === selectedAnalytics)?.icon}
                        {analyticsCards.find((c) => c.type === selectedAnalytics)?.title}
                      </CardTitle>
                      <Button variant="outline" size="sm" onClick={() => selectedAnalytics && fetchAnalytics(selectedAnalytics)} disabled={analyticsLoading} className="border-white/10 hover:bg-white/10">
                        <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${analyticsLoading ? 'animate-spin' : ''}`} />
                        Muat Semula
                      </Button>
                    </div>
                    <CardDescription className="text-muted-foreground">
                      {analyticsCards.find((c) => c.type === selectedAnalytics)?.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {renderAnalyticsDetail()}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* ════════════════════════════════════════════════════════════════════ */}
          {/* TAB 4: ALAT AHLI                                                    */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          <TabsContent value="alat">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* ── Tool 1: Semakan Kelayakan Program ── */}
              <Card className="border-white/10 bg-white/5 backdrop-blur-md shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                      <Search className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Semakan Kelayakan Program</CardTitle>
                      <CardDescription className="text-xs">Semak kelayakan ahli untuk program PUSPA</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">No. Kad Pengenalan</Label>
                    <Input
                      placeholder="Masukkan no. IC (contoh: 901234567890)"
                      value={icInput}
                      onChange={(e) => setIcInput(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <Button
                    onClick={handleCheckEligibility}
                    disabled={!icInput.trim() || isCheckingEligibility}
                    className="w-full"
                  >
                    {isCheckingEligibility ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyemak...</> : <><Search className="h-4 w-4 mr-2" />Semak Kelayakan</>}
                  </Button>
                  {icResult && (
                    <div className="space-y-3 mt-4 pt-4 border-t">
                      <div className="flex items-center gap-2">
                        {icResult.eligible ? <Check className="h-5 w-5 text-emerald-600" /> : <AlertTriangle className="h-5 w-5 text-red-500" />}
                        <span className="font-medium">{icResult.eligible ? 'Layak' : 'Tidak Layak'}</span>
                      </div>
                      {icResult.programmes.map((p, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                          <div>
                            <p className="text-sm font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">Skor: {p.score}%</p>
                          </div>
                          <Badge variant={p.status === 'Layak' ? 'default' : p.status === 'Perlu Semakan' ? 'secondary' : 'outline'} className={p.status === 'Layak' ? 'bg-emerald-600' : ''}>
                            {p.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

               {/* ── Tool 2: Kalkulator Bantuan Kewangan ── */}
              <Card className="border-white/10 bg-white/5 backdrop-blur-md shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                      <Calculator className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Kalkulator Bantuan Kewangan</CardTitle>
                      <CardDescription className="text-xs">Anggar jumlah bantuan BMT yang sesuai</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Saiz Isi Rumah</Label>
                      <Input type="number" value={calcHouseholdSize} onChange={(e) => setCalcHouseholdSize(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Pendapatan (RM)</Label>
                      <Input type="number" value={calcIncome} onChange={(e) => setCalcIncome(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Perbelanjaan (RM)</Label>
                      <Input type="number" value={calcExpenses} onChange={(e) => setCalcExpenses(e.target.value)} className="mt-1" />
                    </div>
                  </div>
                  <Button onClick={handleCalculate} disabled={isCalculating} className="w-full">
                    {isCalculating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Mengira...</> : <><Calculator className="h-4 w-4 mr-2" />Kira Bantuan</>}
                  </Button>
                  {calcResult && (
                    <div className="space-y-2 mt-4 pt-4 border-t">
                      <div className="text-center p-3 bg-emerald-50 rounded-lg">
                        <p className="text-2xl font-bold text-emerald-700">RM {calcResult.amount.toLocaleString()}</p>
                        <p className="text-xs text-emerald-600">Anggaran Bantuan Bulanan</p>
                      </div>
                      {Object.entries(calcResult.breakdown).map(([key, val]) => (
                        <div key={key} className="flex justify-between items-center p-2 rounded-lg bg-slate-50">
                          <span className="text-sm">{key}</span>
                          <span className="font-medium text-sm">RM {val.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ── Tool 3: Penilaian Kebajikan ── */}
              <Card className="border-white/10 bg-white/5 backdrop-blur-md shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center text-white shadow-lg shadow-primary/20">
                      <ClipboardList className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Penilaian Kebajikan</CardTitle>
                      <CardDescription className="text-xs">Nilaikan tahap kebajikan ahli berdasarkan 5 dimensi</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { key: 'pendapatan' as const, label: 'Pendapatan', desc: '1 (Rendah) → 5 (Tinggi)' },
                    { key: 'perumahan' as const, label: 'Perumahan', desc: '1 (Tidak Stabil) → 5 (Stabil)' },
                    { key: 'kesihatan' as const, label: 'Kesihatan', desc: '1 (Lemah) → 5 (Baik)' },
                    { key: 'pendidikan' as const, label: 'Pendidikan', desc: '1 (Rendah) → 5 (Tinggi)' },
                    { key: 'sokonganSosial' as const, label: 'Sokongan Sosial', desc: '1 (Terpencil) → 5 (Kuat)' },
                  ].map((item) => (
                    <div key={item.key} className="space-y-1">
                      <div className="flex justify-between">
                        <Label className="text-sm font-medium">{item.label}</Label>
                        <span className="text-xs text-muted-foreground">{welfareSliders[item.key]}/5</span>
                      </div>
                      <Slider
                        value={[welfareSliders[item.key]]}
                        onValueChange={([v]) => setWelfareSliders((prev) => ({ ...prev, [item.key]: v }))}
                        min={1} max={5} step={1}
                      />
                    </div>
                  ))}
                  <Button onClick={handleAssessWelfare} disabled={isAssessing} className="w-full">
                    {isAssessing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menilai...</> : <><ClipboardList className="h-4 w-4 mr-2" />Nilai Kebajikan</>}
                  </Button>
                  {welfareResult && (
                    <div className="space-y-3 mt-4 pt-4 border-t">
                      <div className="text-center p-3 bg-amber-50 rounded-lg">
                        <p className="text-3xl font-bold text-amber-700">{welfareResult.score}/100</p>
                        <p className="text-xs text-amber-600">Skor Kebajikan</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <MarkdownContent content={welfareResult.recommendation} className="text-sm" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ── Tool 4: Log Komunikasi ── */}
              <Card className="border-white/10 bg-white/5 backdrop-blur-md shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Log Komunikasi</CardTitle>
                      <CardDescription className="text-xs">Rekod interaksi dengan ahli dan pihak berkepentingan</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-2">
                    <Input placeholder="Nama" value={commName} onChange={(e) => setCommName(e.target.value)} />
                    <Select value={commType} onValueChange={setCommType}>
                      <SelectTrigger><SelectValue placeholder="Jenis komunikasi" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Lawatan">Lawatan</SelectItem>
                        <SelectItem value="Panggilan">Panggilan</SelectItem>
                        <SelectItem value="Email">Email</SelectItem>
                        <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                        <SelectItem value="Mesyuarat">Mesyuarat</SelectItem>
                      </SelectContent>
                    </Select>
                    <Textarea placeholder="Catatan..." value={commNotes} onChange={(e) => setCommNotes(e.target.value)} className="min-h-[60px]" />
                  </div>
                  <Button onClick={handleAddCommLog} disabled={!commName.trim() || !commType || !commNotes.trim()} className="w-full">
                    Tambah Rekod
                  </Button>
                  <Separator />
                  <ScrollArea className="max-h-[200px]">
                    <div className="space-y-2">
                      {commLogs.map((log) => (
                        <div key={log.id} className="p-2 bg-slate-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{log.name}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-[10px]">{log.type}</Badge>
                              <span className="text-[10px] text-muted-foreground">{log.date}</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{log.notes}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Report Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] bg-slate-900/95 backdrop-blur-xl border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Sparkles className="h-5 w-5 text-primary" />
              {selectedReport?.title}
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Laporan dijana oleh AI pada {new Date().toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="p-2">
              {isGenerating ? (
                <div className="flex items-center justify-center py-16 space-x-3">
                  <div className="h-3 w-3 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                  <div className="h-3 w-3 rounded-full bg-violet-500 animate-bounce [animation-delay:150ms]" />
                  <div className="h-3 w-3 rounded-full bg-cyan-400 animate-bounce [animation-delay:300ms]" />
                  <span className="text-sm text-white/60 ml-2">Menjana laporan...</span>
                </div>
              ) : (
                <MarkdownContent content={generatedReport} />
              )}
            </div>
          </ScrollArea>
          {generatedReport && !isGenerating && (
            <div className="flex gap-2 pt-4 border-t border-white/10">
              <Button variant="outline" size="sm" onClick={handleCopyReport} className="text-xs border-white/10 hover:bg-white/10 text-white">
                {copied ? <><Check className="h-3 w-3 mr-1" />Disalin</> : <><Copy className="h-3 w-3 mr-1" />Salin</>}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadReport} className="text-xs border-white/10 hover:bg-white/10 text-white">
                <Download className="h-3 w-3 mr-1" />Muat Turun
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
