'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { api, apiFetch } from '@/lib/api'
import type { OpenClawSnapshot, OpenClawStatus } from '@/lib/openclaw'
import { useOpsStore, type ConductorTab, type OpsWorkItem } from '@/stores/ops-store'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MessageSquare, ListTodo, BarChart3, Zap, GitBranch, Send, Plus, Filter,
  CheckCircle2, XCircle, Loader2, Clock, AlertTriangle, Inbox, ChevronRight,
  Package, FileText, Gavel, Heart, Users, Bell, ArrowRight, Sparkles, Bot,
  User, RotateCcw, Trash2, Calendar, Play, Pause, Shield, FolderKanban,
  Activity, CheckSquare, Square, AlertOctagon, TrendingUp, Timer, Target,
  Workflow, ClipboardList, UsersRound, Eye, MoreHorizontal, X, Ban, Redo, ExternalLink, MonitorSmartphone
} from 'lucide-react'

/* ─── Constants ──────────────────────────────────────────────────────────────── */

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  queued:        { label: 'Menunggu', color: 'bg-white/5 text-muted-foreground border-white/10', dot: 'bg-slate-400' },
  in_progress:   { label: 'Aktif', color: 'bg-primary/20 text-primary border-primary/30', dot: 'bg-primary' },
  waiting_user:  { label: 'Menunggu Anda', color: 'bg-amber-500/20 text-amber-400 border-amber-400/30', dot: 'bg-amber-400' },
  scheduled:     { label: 'Dijadualkan', color: 'bg-violet-500/20 text-violet-400 border-violet-400/30', dot: 'bg-violet-400' },
  blocked:       { label: 'Disekat', color: 'bg-red-500/20 text-red-400 border-red-400/30', dot: 'bg-red-400' },
  completed:     { label: 'Selesai', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-400/30', dot: 'bg-cyan-400' },
  failed:        { label: 'Gagal', color: 'bg-red-500/20 text-red-400 border-red-400/30', dot: 'bg-red-400' },
  archived:      { label: 'Diarkib', color: 'bg-white/5 text-muted-foreground border-white/10', dot: 'bg-slate-500' },
}

const DOMAIN_CONFIG: Record<string, { label: string; icon: typeof Package; color: string }> = {
  inventory:   { label: 'Inventori',    icon: Package,  color: 'bg-amber-500/20 text-amber-400 border-amber-400/30' },
  reports:     { label: 'Laporan',      icon: FileText, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-400/30' },
  cases:       { label: 'Kes',          icon: Gavel,    color: 'bg-primary/20 text-primary border-primary/30' },
  donors:      { label: 'Penderma',     icon: Heart,    color: 'bg-rose-500/20 text-rose-400 border-rose-400/30' },
  volunteers:  { label: 'Sukarelawan',  icon: Users,    color: 'bg-orange-500/20 text-orange-400 border-orange-400/30' },
  reminders:   { label: 'Peringatan',   icon: Bell,     color: 'bg-rose-500/20 text-rose-400 border-rose-400/30' },
  general:     { label: 'Umum',         icon: Inbox,    color: 'bg-white/10 text-muted-foreground border-white/10' },
  dashboard:   { label: 'Dashboard',    icon: BarChart3, color: 'bg-violet-500/20 text-violet-400 border-violet-400/30' },
  continuity:  { label: 'Sambungan',    icon: RotateCcw, color: 'bg-teal-500/20 text-teal-400 border-teal-400/30' },
  messaging:   { label: 'Mesej',        icon: MessageSquare, color: 'bg-sky-500/20 text-sky-400 border-sky-400/30' },
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  urgent: { label: 'Mendesak', color: 'bg-red-500' },
  high:   { label: 'Tinggi',   color: 'bg-orange-500' },
  normal: { label: 'Normal',   color: 'bg-blue-500' },
  low:    { label: 'Rendah',   color: 'bg-gray-400' },
}

const TABS: { key: ConductorTab; label: string; icon: typeof MessageSquare }[] = [
  { key: 'chat',        label: 'Sembang',         icon: MessageSquare },
  { key: 'tasks',       label: 'Tugasan',          icon: ListTodo },
  { key: 'dashboard',   label: 'Papan Pintasan',   icon: BarChart3 },
  { key: 'automations', label: 'Automasi',         icon: Zap },
  { key: 'projects',    label: 'Projek',           icon: FolderKanban },
  { key: 'agents',      label: 'Ejen & Jejak',     icon: Workflow },
  { key: 'trace',       label: 'Jejak',            icon: GitBranch },
]

const QUICK_SUGGESTIONS = [
  'Check stok beras',
  'Senarai kes pending',
  'Status donasi bulan ni',
  'Sukarelawan aktif',
  'Buat reminder',
  'Continue task tadi',
  'Buat dashboard operasi',
  'Status tugasan blocked',
]

const BRAND_GRADIENT = 'linear-gradient(135deg, #4B0082, #6B21A8)'

/* ─── Helpers ────────────────────────────────────────────────────────────────── */

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}
function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return 'baru saja'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min lalu`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam lalu`
  return formatDate(iso)
}
function formatMs(ms: number) {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

interface IntentResult {
  intent: string; domain: string; confidence: number
  actionMode: string; suggestedTitle: string; needsClarification: boolean
}

async function fetchDomainData(intent: string): Promise<string> {
  try {
    switch (intent) {
      case 'inventory_lookup': {
        const data = await api.get<any>('/disbursements', { pageSize: 5 })
        if (Array.isArray(data) && data.length > 0) {
          return 'Senarai pembayaran terkini:\n' + data.slice(0, 5).map((d: any) =>
            `- ${d.programme?.name || 'Tiada program'}: RM ${(d.amount || 0).toLocaleString()} (${d.status})`
          ).join('\n') + `\n\nJumlah: ${data.length} rekod.`
        }
        return 'Tiada data inventori/pembayaran buat masa ini.'
      }
      case 'report_list': {
        const data = await api.get<any>('/reports')
        const s = data?.summary
        if (s) return `Ringkasan Laporan Kewangan:\n- Pendapatan: RM ${(s.totalIncome || 0).toLocaleString()}\n- Perbelanjaan: RM ${(s.totalExpenditure || 0).toLocaleString()}\n- Baki: RM ${(s.netBalance || 0).toLocaleString()}`
        return 'Laporan kewangan dimuat turun.'
      }
      case 'case_query': {
        const data = await api.get<any>('/cases', { status: 'OPEN', pageSize: 5 })
        if (Array.isArray(data) && data.length > 0) {
          return 'Kes terbuka:\n' + data.slice(0, 5).map((c: any) =>
            `- ${c.caseNumber}: ${c.title} (${c.applicantName || 'N/A'}) - ${c.status}`
          ).join('\n')
        }
        return 'Tiada kes terbuka.'
      }
      case 'donor_summary': {
        const data = await api.get<any>('/donors', { pageSize: 5 })
        const donors = Array.isArray(data) ? data : []
        let summary = 'Ringkasan Penderma:\n'
        if (donors.length > 0) {
          summary += donors.slice(0, 5).map((dn: any) =>
            `- ${dn.name} (${dn.donorNumber}) - Segmen: ${dn.segment}, Jumlah: RM ${(dn.totalDonated || 0).toLocaleString()}`
          ).join('\n')
        }
        return summary + '\nJumlah rekod: ' + donors.length
      }
      case 'volunteer_list': {
        const data = await api.get<any>('/volunteers', { status: 'active', pageSize: 5 })
        const vols = Array.isArray(data) ? data : []
        let summary = 'Ringkasan Sukarelawan:\n'
        if (vols.length > 0) {
          summary += vols.slice(0, 5).map((v: any) =>
            `- ${v.name} (${v.volunteerNumber}) - ${v.totalHours || 0} jam`
          ).join('\n')
        }
        return summary + '\nJumlah rekod: ' + vols.length
      }
      case 'dashboard_generate': {
        const data = await api.get<any>('/ops/dashboard')
        if (data) {
          const statusStr = Object.entries(data.workItems?.byStatus || {}).map(([k, v]: [string, any]) =>
            `${STATUS_CONFIG[k]?.label || k}: ${v}`
          ).join(', ')
          const domainStr = Object.entries(data.domainSummary || {}).map(([k, v]: [string, any]) =>
            `${DOMAIN_CONFIG[k]?.label || k}: ${v}`
          ).join(', ')
          return `Dashboard Operasi:\n\nStatus: ${statusStr}\nDomain: ${domainStr}\nAutomasi: ${data.automations?.active || 0}/${data.automations?.total || 0} aktif`
        }
        return 'Gagal memuatkan dashboard.'
      }
      default: return ''
    }
  } catch (err: any) {
    return `Ralat: ${err.message || 'Tidak diketahui'}`
  }
}

/* ─── Main Component ────────────────────────────────────────────────────────── */

export default function OpsConductor() {
  const store = useOpsStore()
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [dashLoading, setDashLoading] = useState(false)
  const [tasksLoading, setTasksLoading] = useState(false)
  const [autosLoading, setAutosLoading] = useState(false)
  const [leftFilter, setLeftFilter] = useState<string>('all')
  const [tasksFilter, setTasksFilter] = useState<string>('all')
  const [tasksDomainFilter, setTasksDomainFilter] = useState<string>('')
  const [createAutoOpen, setCreateAutoOpen] = useState(false)
  const [newAuto, setNewAuto] = useState({ title: '', description: '', kind: 'one_time' as string, domain: 'general', expr: '' })
  const [createAutoLoading, setCreateAutoLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [bulkAction, setBulkAction] = useState<string>('')
  const [approvalOpen, setApprovalOpen] = useState(false)
  const [approvalAction, setApprovalAction] = useState('')
  const [approvalRisk, setApprovalRisk] = useState<'low' | 'medium' | 'high'>('low')
  const [approvalReason, setApprovalReason] = useState('')
  const [liveStatus, setLiveStatus] = useState<OpenClawStatus | null>(null)
  const [liveSnapshot, setLiveSnapshot] = useState<OpenClawSnapshot | null>(null)
  const [liveLoading, setLiveLoading] = useState(false)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const traceEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [store.messages])
  useEffect(() => { traceEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [store.traceEntries])
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [inputValue])

  /* ─── Keyboard shortcuts ─────────────────────────────────────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '1') { e.preventDefault(); store.setActiveTab('chat') }
      if ((e.metaKey || e.ctrlKey) && e.key === '2') { e.preventDefault(); store.setActiveTab('tasks') }
      if ((e.metaKey || e.ctrlKey) && e.key === '3') { e.preventDefault(); store.setActiveTab('dashboard') }
      if ((e.metaKey || e.ctrlKey) && e.key === '4') { e.preventDefault(); store.setActiveTab('automations') }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [store])

  /* ─── Data loaders ───────────────────────────────────────────────────────── */

  const loadDashboard = useCallback(async () => {
    setDashLoading(true)
    try {
      const data = await api.get<any>('/ops/dashboard')
      store.setDashboardSummary({
        workItemsByStatus: data.workItems?.byStatus || {},
        automationCounts: { active: data.automations?.active || 0, total: data.automations?.total || 0 },
        recentEvents: (data.recentEvents || []).map((e: any) => ({ id: e.id, workItemId: e.workItemId || '', type: e.type || '', summary: e.summary || '', detail: e.detail, toolName: e.toolName, status: e.status || 'success', latencyMs: e.latencyMs, createdAt: e.createdAt || new Date().toISOString() })),
        domainSummary: data.domainSummary || {},
        upcomingAutomations: (data.upcomingAutomations || []).map((a: any) => ({ id: a.id, title: a.title, description: a.description, kind: a.kind, expr: a.expr, domain: a.domain, relatedProject: a.relatedProject, isEnabled: a.isEnabled, lastRunAt: a.lastRunAt, nextRunAt: a.nextRunAt, lastResult: a.lastResult, failureState: a.failureState })),
      })
      const stats = await api.get<any>('/ops/stats')
      store.setOpsStats(stats)
    } catch { /* silent */ }
    setDashLoading(false)
  }, [store])

  const loadLiveBridge = useCallback(async () => {
    setLiveLoading(true)
    try {
      const [status, snapshot] = await Promise.all([
        api.get<OpenClawStatus>('/openclaw/status'),
        api.get<OpenClawSnapshot>('/openclaw/snapshot'),
      ])
      setLiveStatus(status)
      setLiveSnapshot(snapshot)
    } catch {
      // Keep existing values if bridge polling fails
    } finally {
      setLiveLoading(false)
    }
  }, [])

  const openExternalLink = useCallback((url?: string) => {
    if (!url || typeof window === 'undefined') return
    window.open(url, '_blank', 'noopener,noreferrer')
  }, [])

  const loadTasks = useCallback(async () => {
    setTasksLoading(true)
    try {
      const data = await api.get<any>('/ops/work-items', { pageSize: 50 })
      const items = Array.isArray(data) ? data : (data?.items || [])
      store.setWorkItems(items.map((wi: any) => ({
        id: wi.id, workItemNumber: wi.workItemNumber, title: wi.title, project: wi.project || 'PUSPA',
        domain: wi.domain, sourceChannel: wi.sourceChannel || 'conductor', requestText: wi.requestText || '',
        intent: wi.intent || '', status: wi.status, priority: wi.priority || 'normal',
        currentStep: wi.currentStep, nextAction: wi.nextAction, blockerReason: wi.blockerReason,
        resolutionSummary: wi.resolutionSummary, tags: wi.tags, createdAt: wi.createdAt,
        updatedAt: wi.updatedAt, startedAt: wi.startedAt, completedAt: wi.completedAt,
      })))
    } catch { /* silent */ }
    setTasksLoading(false)
  }, [store])

  const loadAutomations = useCallback(async () => {
    setAutosLoading(true)
    try {
      const data = await api.get<any>('/ops/automations')
      store.setAutomations((Array.isArray(data) ? data : []).map((a: any) => ({
        id: a.id, title: a.title, description: a.description, kind: a.kind || 'one_time',
        expr: a.expr, domain: a.domain || 'general', relatedProject: a.relatedProject || 'PUSPA',
        workItemId: a.workItemId, isEnabled: a.isEnabled, lastRunAt: a.lastRunAt,
        nextRunAt: a.nextRunAt, lastResult: a.lastResult, failureState: a.failureState,
      })))
    } catch { /* silent */ }
    setAutosLoading(false)
  }, [store])

  const loadTrace = useCallback(async (workItemId: string) => {
    try {
      const data = await api.get<any>(`/ops/work-items/${workItemId}`)
      if (data) {
        store.setSelectedWorkItem({
          id: data.id, workItemNumber: data.workItemNumber, title: data.title,
          project: data.project || 'PUSPA', domain: data.domain, sourceChannel: data.sourceChannel || 'conductor',
          requestText: data.requestText || '', intent: data.intent || '', status: data.status,
          priority: data.priority || 'normal', currentStep: data.currentStep, nextAction: data.nextAction,
          blockerReason: data.blockerReason, resolutionSummary: data.resolutionSummary, tags: data.tags,
          createdAt: data.createdAt, updatedAt: data.updatedAt, startedAt: data.startedAt,
          completedAt: data.completedAt,
          executionEvents: (data.executionEvents || []).map((e: any) => ({ id: e.id, workItemId: e.workItemId || workItemId, type: e.type || '', summary: e.summary || '', detail: e.detail, toolName: e.toolName, status: e.status || 'success', latencyMs: e.latencyMs, createdAt: e.createdAt || new Date().toISOString() })),
          artifacts: (data.artifacts || []).map((a: any) => ({ id: a.id, workItemId: a.workItemId, type: a.type || '', title: a.title || '', summary: a.summary, pathOrRef: a.pathOrRef, metadata: a.metadata, createdAt: a.createdAt || new Date().toISOString() })),
        })
        store.setTraceEntries((data.executionEvents || []).map((e: any) => ({ id: e.id, workItemId: e.workItemId || workItemId, type: e.type || '', summary: e.summary || '', detail: e.detail, toolName: e.toolName, status: e.status || 'success', latencyMs: e.latencyMs, createdAt: e.createdAt || new Date().toISOString() })))
        store.setArtifacts((data.artifacts || []).map((a: any) => ({ id: a.id, workItemId: a.workItemId, type: a.type || '', title: a.title || '', summary: a.summary, pathOrRef: a.pathOrRef, metadata: a.metadata, createdAt: a.createdAt || new Date().toISOString() })))
      }
    } catch { /* silent */ }
  }, [store])

  const loadProjects = useCallback(async () => {
    try { store.setProjects(await api.get<any[]>('/ops/projects')) } catch { /* silent */ }
  }, [store])

  /* ─── Init logic ───────────────────────────────────────────────────────────── */
  useEffect(() => {
    const initializeDashboard = async () => {
      if (store.activeTab === 'dashboard') {
        if (!store.dashboardSummary) {
          await loadDashboard();
        }
        if (!liveStatus || !liveSnapshot) {
          await loadLiveBridge();
        }
      }
    };
    initializeDashboard();
  }, [store.activeTab, store.dashboardSummary, loadDashboard, liveStatus, liveSnapshot, loadLiveBridge]);

  useEffect(() => {
    let cancelled = false
    const init = async () => {
      if (!cancelled) {
        await loadTasks()
        await loadAutomations()
        await loadProjects()
        await loadLiveBridge()
      }
    }
    init()
    return () => { cancelled = true }
  }, [loadTasks, loadAutomations, loadProjects, loadLiveBridge])

  useEffect(() => {
    if (store.activeTab === 'dashboard') {
      if (!store.dashboardSummary) loadDashboard()
      if (!liveStatus || !liveSnapshot) loadLiveBridge()
    }
  }, [store.activeTab, store.dashboardSummary, loadDashboard, liveStatus, liveSnapshot, loadLiveBridge])

  /* ─── Chat flow with resume & fallback ────────────────────────────────────── */

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || store.isProcessing) return
    const msg = text.trim()
    setInputValue('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    store.addMessage({ role: 'user', content: msg })
    store.setProcessing(true)
    setIsLoading(true)

    try {
      // Step 1: Classify intent
      store.addTraceEntry({ workItemId: '__current__', type: 'intent_classification', summary: `Mengelas: "${msg.slice(0, 80)}"`, status: 'running' })
      const intentResult = await api.post<IntentResult>('/ops/intent', { message: msg })

      // Step 2: Handle resume intent
      if (intentResult.intent === 'work_resume') {
        store.addTraceEntry({ workItemId: '__current__', type: 'work_resume', summary: 'Mencari tugasan belum selesai...', status: 'running' })
        const resumeData = await api.post<any>('/ops/work-items/resume', { context: msg })
        if (resumeData.message === 'no_unfinished_work') {
          store.addMessage({ role: 'assistant', content: 'Tiada tugasan yang belum selesai. Semua tugasan telah dilengkapkan! 🎉' })
          store.addTraceEntry({ workItemId: '__current__', type: 'work_resume', summary: 'Tiada tugasan belum selesai ditemui', status: 'success' })
          return
        }
        const wi = resumeData.workItem || resumeData
        store.setCurrentWorkItemId(wi.id)
        store.addMessage({ role: 'assistant', content: `**Menyambung: ${wi.workItemNumber}**\n\n${wi.title}\nStatus: ${STATUS_CONFIG[wi.status]?.label || wi.status}\nDicipta: ${formatRelative(wi.createdAt)}\n\n${wi.blockerReason ? `⚠️ Disekat: ${wi.blockerReason}\n\n` : ''}${wi.currentStep ? `Langkah seterusnya: ${wi.currentStep}\n` : ''}Saya akan teruskan tugasan ini. Apa yang anda mahu saya lakukan seterusnya?`, workItemId: wi.id })
        await loadTrace(wi.id)
        store.addTraceEntry({ workItemId: wi.id, type: 'work_resume', summary: `Menyambung ${wi.workItemNumber}`, status: 'success' })
        return
      }

      // Step 3: Create work item
      const workItem = await api.post<OpsWorkItem>('/ops/work-items', {
        title: intentResult.suggestedTitle || msg.slice(0, 80), project: 'PUSPA',
        domain: intentResult.domain, requestText: msg, intent: intentResult.intent,
        priority: intentResult.actionMode === 'background' ? 'high' : 'normal',
      })
      store.setCurrentWorkItemId(workItem.id)
      store.addTraceEntry({ workItemId: workItem.id, type: 'intent_routed', summary: `${intentResult.intent} → ${intentResult.domain} (${(intentResult.confidence * 100).toFixed(0)}%)`, status: 'success' })

      // Step 4: Fetch domain data with fallback
      let domainContext = ''
      if (!['general', 'reminder_create'].includes(intentResult.intent)) {
        store.addTraceEntry({ workItemId: workItem.id, type: 'tool_called', summary: `Mengambil data ${intentResult.domain}...`, toolName: intentResult.domain, status: 'running' })
        const t0 = Date.now()
        try {
          domainContext = await fetchDomainData(intentResult.intent)
          store.addTraceEntry({ workItemId: workItem.id, type: 'tool_completed', summary: `Data ${intentResult.domain} dimuat`, toolName: intentResult.domain, status: 'success', latencyMs: Date.now() - t0 })
        } catch (err: any) {
          store.addTraceEntry({ workItemId: workItem.id, type: 'fallback_used', summary: `Fallback: data tidak tersedia - ${err.message}`, status: 'failed', latencyMs: Date.now() - t0 })
          domainContext = `Data ${intentResult.domain} tidak tersedia buat masa ini. Sila semak sambungan pangkalan data.`
        }
      }

      // Step 5: Handle reminder
      if (intentResult.intent === 'reminder_create') {
        domainContext = 'Pengguna ingin membuat peringatan. Sila gunakan tab Automasi untuk membuat reminder.'
        store.addTraceEntry({ workItemId: workItem.id, type: 'reminder_redirect', summary: 'Dihalakan ke tab Automasi', status: 'success' })
      }

      // Step 6: Generate AI response
      store.addTraceEntry({ workItemId: workItem.id, type: 'ai_response_generating', summary: 'Menjana respons AI...', status: 'running' })
      const t1 = Date.now()
      const aiResult = await api.post<{ response: string }>('/ai/chat', {
        message: msg,
        context: domainContext ? `[Data PUSPA]:\n${domainContext}\n\n[Jawab dalam BM, ringkas dan profesional.]` : undefined,
      })
      const aiResponse = aiResult.response
      store.addMessage({ role: 'assistant', content: aiResponse, workItemId: workItem.id })
      store.addTraceEntry({ workItemId: workItem.id, type: 'ai_response_complete', summary: `Respons AI dijana (${Date.now() - t1}ms)`, status: 'success', latencyMs: Date.now() - t1 })

      // Step 7: Update work item
      try {
        await apiFetch<any>(`/ops/work-items/${workItem.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'completed', resolutionSummary: aiResponse.slice(0, 300) }) })
      } catch {
        store.addTraceEntry({ workItemId: workItem.id, type: 'fallback_used', summary: 'Gagal kemas kini status', status: 'failed' })
      }
      loadTasks()
    } catch (err: any) {
      store.addMessage({ role: 'assistant', content: `Maaf, ralat: ${err.message || 'Tidak diketahui'}. Sila cuba lagi.` })
      store.addTraceEntry({ workItemId: '__current__', type: 'error', summary: `Ralat: ${err.message}`, status: 'failed' })
    } finally {
      store.setProcessing(false)
      setIsLoading(false)
    }
  }, [store, loadTasks])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(inputValue) }
  }, [sendMessage, inputValue])

  /* ─── Bulk actions ───────────────────────────────────────────────────────── */

  const executeBulkAction = useCallback(async (action: string) => {
    if (store.selectedWorkItemIds.length === 0) return
    try {
      await api.post('/ops/bulk', { action, workItemIds: store.selectedWorkItemIds })
      store.clearSelection()
      loadTasks()
      setBulkAction('')
    } catch { /* silent */ }
  }, [store, loadTasks])

  /* ─── Approval flow ──────────────────────────────────────────────────────── */

  const submitApproval = useCallback(async () => {
    if (!store.selectedWorkItem || !approvalAction.trim()) return
    try {
      await api.post(`/ops/work-items/${store.selectedWorkItem.id}/approve`, {
        action: approvalAction, reason: approvalReason, riskLevel: approvalRisk,
      })
      setApprovalOpen(false)
      setApprovalAction('')
      setApprovalReason('')
      loadTasks()
    } catch { /* silent */ }
  }, [store.selectedWorkItem, approvalAction, approvalReason, approvalRisk, loadTasks])

  /* ─── Automation actions ─────────────────────────────────────────────────── */

  const toggleAutomation = useCallback(async (id: string, isEnabled: boolean) => {
    try {
      await apiFetch<any>(`/ops/automations/${id}`, { method: 'PATCH', body: JSON.stringify({ isEnabled: !isEnabled }) })
      store.setAutomations(store.automations.map(a => a.id === id ? { ...a, isEnabled: !isEnabled } : a))
    } catch { /* silent */ }
  }, [store])

  const handleCreateAutomation = useCallback(async () => {
    if (!newAuto.title.trim()) return
    setCreateAutoLoading(true)
    try {
      await api.post('/ops/automations', { title: newAuto.title, description: newAuto.description || undefined, kind: newAuto.kind, expr: newAuto.expr || undefined, domain: newAuto.domain })
      setCreateAutoOpen(false)
      setNewAuto({ title: '', description: '', kind: 'one_time', domain: 'general', expr: '' })
      loadAutomations()
    } catch { /* silent */ }
    setCreateAutoLoading(false)
  }, [newAuto, loadAutomations])

  const selectWorkItem = useCallback((wi: OpsWorkItem) => {
    store.setSelectedWorkItem(wi)
    loadTrace(wi.id)
    if (isMobile) store.setActiveTab('trace')
  }, [store, loadTrace, isMobile])

  /* ─── Filtered items ──────────────────────────────────────────────────────── */

  const leftFilteredItems = store.workItems.filter(wi => {
    if (leftFilter === 'active') return ['in_progress', 'queued', 'blocked', 'waiting_user'].includes(wi.status)
    if (leftFilter === 'blocked') return wi.status === 'blocked'
    if (leftFilter === 'completed') return wi.status === 'completed'
    return true
  }).slice(0, 25)

  const centerFilteredItems = store.workItems.filter(wi => {
    if (tasksFilter !== 'all' && wi.status !== tasksFilter) return false
    if (tasksDomainFilter && wi.domain !== tasksDomainFilter) return false
    return true
  })

  /* ─── Left sidebar ──────────────────────────────────────────────────────── */

  const renderLeftSidebar = () => (
    <aside className="hidden lg:flex flex-col w-[280px] border-r border-white/10 bg-white/5 backdrop-blur-md shrink-0">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider opacity-70">Tugasan</h3>
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs border-white/10 hover:bg-white/10" onClick={() => store.setActiveTab('chat')}>
            <Plus className="h-3 w-3 mr-1" /> Baru
          </Button>
        </div>
        <div className="flex gap-1 bg-black/20 p-1 rounded-lg border border-white/5">
          {(['all', 'active', 'blocked', 'completed'] as const).map((f) => (
            <Button key={f} size="sm" variant="ghost"
              className={cn('h-7 px-1 text-[10px] flex-1 rounded-md transition-all', leftFilter === f ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:bg-white/5')}
              onClick={() => setLeftFilter(f)}>
              {f === 'all' ? 'Semua' : f === 'active' ? 'Aktif' : f === 'blocked' ? 'Sekat' : 'Siap'}
            </Button>
          ))}
        </div>
      </div>
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-2 pb-6">
          {tasksLoading && leftFilteredItems.length === 0 ? (
            Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl bg-white/5" />)
          ) : leftFilteredItems.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-12 opacity-50 italic">Tiada tugasan ditemui</div>
          ) : leftFilteredItems.map((wi) => (
            <button key={wi.id}
              className={cn('w-full text-left p-3 rounded-xl transition-all duration-200 border border-transparent hover:bg-white/10 hover:border-white/10 space-y-1 group relative overflow-hidden',
                store.selectedWorkItem?.id === wi.id && 'bg-white/10 border-primary/50 shadow-lg shadow-primary/5')}
              onClick={() => selectWorkItem(wi)}>
              <div className="flex items-center gap-2">
                <span className={cn('inline-block h-1.5 w-1.5 rounded-full shrink-0', STATUS_CONFIG[wi.status]?.dot)} />
                <span className="text-[10px] font-mono font-medium text-muted-foreground/80 tracking-tighter">{wi.workItemNumber}</span>
                <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0 h-3.5 ml-auto border-0', DOMAIN_CONFIG[wi.domain]?.color)}>
                  {DOMAIN_CONFIG[wi.domain]?.label || wi.domain}
                </Badge>
              </div>
              <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">{wi.title}</p>
              <p className="text-[10px] text-muted-foreground/60">{formatRelative(wi.createdAt)}</p>
              {store.selectedWorkItem?.id === wi.id && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>
      </ScrollArea>
    </aside>
  )

  /* ─── Render functions ─── */

  /* ─── Right trace panel ──────────────────────────────────────────────────── */

  const renderTracePanel = () => {
    const wi = store.selectedWorkItem
    if (!wi) return (
      <aside className="hidden lg:flex flex-col w-[300px] border-l bg-muted/20 shrink-0 items-center justify-center p-6 text-center">
        <GitBranch className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">Pilih tugasan untuk melihat jejak</p>
      </aside>
    )
    return (
      <aside className="hidden lg:flex flex-col w-[300px] border-l bg-muted/20 shrink-0">
        <div className="p-3 border-b space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn('text-xs', STATUS_CONFIG[wi.status]?.color)}>{STATUS_CONFIG[wi.status]?.label}</Badge>
            <Badge variant="outline" className={cn('text-[10px]', DOMAIN_CONFIG[wi.domain]?.color)}>{DOMAIN_CONFIG[wi.domain]?.label}</Badge>
            <span className={cn('ml-auto h-2 w-2 rounded-full', PRIORITY_CONFIG[wi.priority]?.color)} title={PRIORITY_CONFIG[wi.priority]?.label} />
          </div>
          <p className="text-xs font-mono text-muted-foreground">{wi.workItemNumber}</p>
          <p className="text-sm font-semibold">{wi.title}</p>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(wi.createdAt)}</span>
            {wi.startedAt && <span className="flex items-center gap-1"><Play className="h-3 w-3" />{formatTime(wi.startedAt)}</span>}
            {wi.completedAt && <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />{formatTime(wi.completedAt)}</span>}
          </div>
          {wi.blockerReason && (
            <div className="flex items-start gap-1.5 p-2 rounded bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-[11px]">
              <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
              <span>{wi.blockerReason}</span>
            </div>
          )}
          {/* Approval / Unblock buttons */}
          <div className="flex gap-1.5 pt-1">
            {wi.status === 'blocked' && (
              <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => {
                apiFetch<any>(`/ops/work-items/${wi.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'in_progress', blockerReason: null }) }).then(() => loadTasks())
              }}>
                <Redo className="h-3 w-3 mr-1" /> Unblock
              </Button>
            )}
            {wi.status === 'waiting_user' && (
              <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => {
                apiFetch<any>(`/ops/work-items/${wi.id}/approve/decision`, { method: 'POST', body: JSON.stringify({ decision: 'approve', comment: 'Diluluskan oleh operator' }) }).then(() => loadTasks())
              }}>
                <CheckCircle2 className="h-3 w-3 mr-1" /> Luluskan
              </Button>
            )}
            {wi.status === 'in_progress' && (
              <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => setApprovalOpen(true)}>
                <Shield className="h-3 w-3 mr-1" /> Mohon Kelulusan
              </Button>
            )}
          </div>
        </div>
        <div className="px-3 py-2 border-b">
          <h4 className="text-xs font-semibold flex items-center gap-1.5" style={{ color: '#4B0082' }}>
            <GitBranch className="h-3.5 w-3.5" /> Jejak Pelaksanaan ({store.traceEntries.length})
          </h4>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2.5">
            {store.traceEntries.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Tiada jejak</p>
            ) : store.traceEntries.map((entry, idx) => (
              <div key={entry.id} className="flex gap-2">
                <div className="flex flex-col items-center">
                  <div className={cn('flex items-center justify-center h-5 w-5 rounded-full text-[9px] font-bold text-white shrink-0',
                    entry.status === 'success' ? 'bg-emerald-500' : entry.status === 'failed' ? 'bg-red-500' : entry.status === 'running' ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600')}>
                    {entry.status === 'running' ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : (idx + 1)}
                  </div>
                  {idx < store.traceEntries.length - 1 && <div className="w-px flex-1 bg-border mt-0.5" />}
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 font-mono">{entry.type.replace(/_/g, ' ')}</Badge>
                    {entry.latencyMs != null && <span className="text-[9px] text-muted-foreground">{formatMs(entry.latencyMs)}</span>}
                  </div>
                  <p className="text-[11px] leading-relaxed">{entry.summary}</p>
                  <p className="text-[9px] text-muted-foreground">{formatTime(entry.createdAt)}</p>
                </div>
              </div>
            ))}
            <div ref={traceEndRef} />
          </div>
        </ScrollArea>
        {store.artifacts.length > 0 && (
          <div className="border-t p-3 space-y-1.5">
            <h4 className="text-[11px] font-semibold" style={{ color: '#4B0082' }}>
              <FileText className="h-3 w-3 inline mr-1" /> Artifak ({store.artifacts.length})
            </h4>
            {store.artifacts.map((art) => (
              <div key={art.id} className="flex items-center gap-1.5 p-1.5 rounded bg-background text-[11px]">
                <FileText className="h-3 w-3 text-muted-foreground" />
                <span className="truncate">{art.title}</span>
                <Badge variant="outline" className="text-[9px] ml-auto">{art.type}</Badge>
              </div>
            ))}
          </div>
        )}
      </aside>
    )
  }

  /* ─── Chat Tab ───────────────────────────────────────────────────────────── */

  const renderChatTab = () => (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 px-4">
        <div className="max-w-2xl mx-auto py-4 space-y-4">
          {store.messages.length === 0 && (
            <div className="text-center py-12 space-y-3">
              <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: BRAND_GRADIENT }}>
                <Bot className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: '#4B0082' }}>Ops Conductor</h3>
                <p className="text-sm text-muted-foreground mt-1">Pembantu operasi AI untuk pengurusan PUSPA</p>
              </div>
              <p className="text-xs text-muted-foreground">Taip mesej atau pilih cadangan di bawah</p>
            </div>
          )}
          {store.messages.map((msg) => (
            <div key={msg.id} className={cn('flex gap-2.5', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              {msg.role === 'assistant' && (
                <div className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: BRAND_GRADIENT }}>
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              <div className={cn('max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
                msg.role === 'user' ? 'text-white rounded-br-md' : 'bg-muted rounded-bl-md'
              )} style={msg.role === 'user' ? { background: BRAND_GRADIENT } : {}}>
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="h-4 w-4 text-primary" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2.5 justify-start">
              <div className="h-7 w-7 rounded-full flex items-center justify-center shrink-0" style={{ background: BRAND_GRADIENT }}>
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Memproses...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </ScrollArea>
      {store.messages.length === 0 && !isLoading && (
        <div className="px-4 pb-2">
          <div className="max-w-2xl mx-auto flex flex-wrap gap-1.5">
            {QUICK_SUGGESTIONS.map((s) => (
              <Button key={s} variant="outline" size="sm" className="h-7 text-[11px] rounded-full" onClick={() => sendMessage(s)}>
                <Sparkles className="h-2.5 w-2.5 mr-1 text-purple-500" />{s}
              </Button>
            ))}
          </div>
        </div>
      )}
      <div className="border-t p-3 bg-background">
        <div className="max-w-2xl mx-auto flex items-end gap-2">
          <Textarea ref={textareaRef} value={inputValue} onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown} placeholder="Taip arahan anda..."
            className="min-h-[40px] max-h-[120px] resize-none rounded-xl text-sm" rows={1} disabled={isLoading} />
          <Button size="icon" className="h-10 w-10 rounded-xl shrink-0 text-white" style={{ background: BRAND_GRADIENT }}
            onClick={() => sendMessage(inputValue)} disabled={!inputValue.trim() || isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-1">Shift+Enter baris baru · Enter hantar · ⌘1-4 tukar tab</p>
      </div>
    </div>
  )

  /* ─── Tasks Tab ──────────────────────────────────────────────────────────── */

  const renderTasksTab = () => (
    <div className="p-4 space-y-3 overflow-auto h-full">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 flex-wrap">
          {['all', 'queued', 'in_progress', 'blocked', 'completed'].map((s) => (
            <Button key={s} size="sm" variant={tasksFilter === s ? 'default' : 'ghost'}
              className={cn('h-7 px-2.5 text-xs', tasksFilter === s && 'text-white')}
              style={tasksFilter === s ? { background: BRAND_GRADIENT } : {}}
              onClick={() => setTasksFilter(s)}>
              {s === 'all' ? 'Semua' : STATUS_CONFIG[s]?.label || s}
            </Button>
          ))}
        </div>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <select className="h-7 text-xs border rounded-md px-2 bg-background" value={tasksDomainFilter}
          onChange={(e) => setTasksDomainFilter(e.target.value)}>
          <option value="">Semua Domain</option>
          {Object.entries(DOMAIN_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <span className="text-xs text-muted-foreground ml-auto">{centerFilteredItems.length} tugasan</span>
      </div>
      {/* Bulk actions bar */}
      {store.selectedWorkItemIds.length > 0 && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border">
          <span className="text-xs font-medium">{store.selectedWorkItemIds.length} dipilih</span>
          <div className="flex gap-1 ml-auto">
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => executeBulkAction('complete')}>
              <CheckCircle2 className="h-3 w-3 mr-1" /> Siapkan
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => executeBulkAction('archive')}>
              <FolderKanban className="h-3 w-3 mr-1" /> Arkib
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs text-red-600" onClick={() => executeBulkAction('cancel')}>
              <XCircle className="h-3 w-3 mr-1" /> Batal
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => store.clearSelection()}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {tasksLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
        ) : centerFilteredItems.length === 0 ? (
          <div className="text-center text-muted-foreground py-12 text-sm">Tiada tugasan</div>
        ) : centerFilteredItems.map((wi) => (
          <Card key={wi.id} className={cn('cursor-pointer transition-all hover:shadow-md', store.selectedWorkItemIds.includes(wi.id) && 'ring-2 ring-purple-500')}
            onClick={(e) => { if (!e.shiftKey) selectWorkItem(wi); else store.toggleWorkItemSelection(wi.id) }}>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <input type="checkbox" className="rounded border-gray-300" checked={store.selectedWorkItemIds.includes(wi.id)}
                  onChange={(e) => { e.stopPropagation(); store.toggleWorkItemSelection(wi.id) }} />
                <span className="text-xs font-mono text-muted-foreground">{wi.workItemNumber}</span>
                <Badge className={cn('text-[10px]', STATUS_CONFIG[wi.status]?.color)}>{STATUS_CONFIG[wi.status]?.label}</Badge>
                <Badge variant="outline" className={cn('text-[10px]', DOMAIN_CONFIG[wi.domain]?.color)}>{DOMAIN_CONFIG[wi.domain]?.label}</Badge>
                <span className={cn('ml-auto h-2 w-2 rounded-full', PRIORITY_CONFIG[wi.priority]?.color)} />
              </div>
              <p className="text-sm font-medium">{wi.title}</p>
              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{wi.requestText}</p>
              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                <span>{formatRelative(wi.createdAt)}</span>
                {wi.blockerReason && <span className="text-red-500 flex items-center gap-0.5"><AlertTriangle className="h-2.5 w-2.5" /> Disekat</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  /* ─── Dashboard Tab ──────────────────────────────────────────────────────── */

  const renderDashboardTab = () => {
    const ds = store.dashboardSummary
    const st = store.opsStats
    const channelConnected = liveSnapshot?.channels.connected ?? 0
    const channelTotal = liveSnapshot?.channels.total ?? 0
    if (dashLoading) return <div className="p-4 space-y-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
    return (
      <ScrollArea className="h-full">
        <div className="p-4 space-y-4">
          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Jumlah Tugasan', value: st?.totalWorkItems || store.workItems.length, icon: ClipboardList, color: 'text-purple-600' },
              { label: 'Siap Hari Ini', value: st?.completedToday || 0, icon: CheckCircle2, color: 'text-emerald-600' },
              { label: 'Automasi Aktif', value: ds?.automationCounts?.active || store.automations.filter(a => a.isEnabled).length, icon: Zap, color: 'text-amber-600' },
              { label: 'Kadar Kegagalan', value: `${(st?.failureRate || 0).toFixed(1)}%`, icon: AlertOctagon, color: st?.failureRate && st.failureRate > 20 ? 'text-red-600' : 'text-blue-600' },
            ].map((card) => (
              <Card key={card.label} className="hover:shadow-md transition-shadow">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center bg-muted', card.color)}>
                    <card.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">{card.label}</p>
                    <p className="text-lg font-bold">{card.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Live bridge panel */}
          <Card className="border-primary/20">
            <CardHeader className="p-3 pb-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MonitorSmartphone className="h-4 w-4" /> AI Ops Live Bridge
                  </CardTitle>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Snapshot runtime terus dari operator bridge</p>
                </div>
                <div className="flex items-center gap-1.5">
                    <Input
                      placeholder="Masukkan parameter (cth: domain=asnafpreneur.ai)..."
                      className="bg-white/5 border-white/10 text-foreground"
                      title="Parameter Tugasan"
                    />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    disabled={liveLoading}
                    onClick={() => loadLiveBridge()}
                  >
                    <RotateCcw className={cn('h-3 w-3 mr-1', liveLoading && 'animate-spin')} /> Refresh
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs text-white"
                    style={{ background: BRAND_GRADIENT }}
                    onClick={() => openExternalLink(liveStatus?.controlUrl || liveSnapshot?.controlUrl)}
                    disabled={!liveStatus?.controlUrl && !liveSnapshot?.controlUrl}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" /> Console
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge className={liveStatus?.connected ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}>
                  {liveStatus?.connected ? 'LIVE' : liveLoading ? 'CHECKING' : 'OFFLINE'}
                </Badge>
                {liveStatus?.status ? <Badge variant="outline">status: {liveStatus.status}</Badge> : null}
                <Badge variant="outline">latency: {liveStatus?.latencyMs ?? 0}ms</Badge>
                <Badge variant="outline">channels: {channelConnected}/{channelTotal}</Badge>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                <div className="rounded-lg border p-2">
                  <p className="text-muted-foreground">Gateway</p>
                  <p className="font-semibold truncate">{liveStatus?.gatewayUrl || '-'}</p>
                </div>
                <div className="rounded-lg border p-2">
                  <p className="text-muted-foreground">Control</p>
                  <p className="font-semibold truncate">{liveStatus?.controlUrl || liveSnapshot?.controlUrl || '-'}</p>
                </div>
                <div className="rounded-lg border p-2">
                  <p className="text-muted-foreground">Health</p>
                  <p className="font-semibold truncate">{liveStatus?.healthUrl || '-'}</p>
                </div>
                <div className="rounded-lg border p-2">
                  <p className="text-muted-foreground">Updated</p>
                  <p className="font-semibold">{liveStatus?.checkedAt ? formatRelative(liveStatus.checkedAt) : '-'}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => openExternalLink(liveStatus?.healthUrl)}
                  disabled={!liveStatus?.healthUrl}
                >
                  <Eye className="h-3 w-3 mr-1" /> Health
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => openExternalLink(liveStatus?.gatewayUrl)}
                  disabled={!liveStatus?.gatewayUrl}
                >
                  <ExternalLink className="h-3 w-3 mr-1" /> Gateway
                </Button>
              </div>

              {liveStatus?.error ? <p className="text-xs text-rose-600 dark:text-rose-400">{liveStatus.error}</p> : null}
            </CardContent>
          </Card>

          {/* Domain summary cards */}
          <div>
            <h4 className="text-sm font-semibold mb-2" style={{ color: '#4B0082' }}>Domain Operasi</h4>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
              {Object.entries(DOMAIN_CONFIG).map(([key, cfg]) => {
                const count = ds?.domainSummary?.[key] || 0
                return (
                  <Card key={key} className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]" onClick={() => { setTasksDomainFilter(key); store.setActiveTab('tasks') }}>
                    <CardContent className="p-3 text-center">
                      <cfg.icon className={cn('h-5 w-5 mx-auto mb-1', cfg.color.split(' ')[1])} />
                      <p className="text-lg font-bold">{count}</p>
                      <p className="text-[10px] text-muted-foreground">{cfg.label}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Status distribution */}
          <Card>
            <CardHeader className="p-3 pb-2"><CardTitle className="text-sm">Taburan Status</CardTitle></CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="space-y-1.5">
                {Object.entries(ds?.workItemsByStatus || {}).filter(([, v]) => (v as number) > 0).map(([status, count]) => {
                  const total = Object.values(ds?.workItemsByStatus || {}).reduce((a: number, b: any) => a + (b as number), 0)
                  const pct = total > 0 ? ((count as number) / total) * 100 : 0
                  return (
                    <div key={status} className="flex items-center gap-2">
                      <Badge className={cn('text-[10px] w-24 justify-center', STATUS_CONFIG[status]?.color)}>{STATUS_CONFIG[status]?.label || status}</Badge>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className={cn('h-full rounded-full transition-all', STATUS_CONFIG[status]?.dot)} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-medium w-8 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent events */}
          <Card>
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Aktiviti Terkini</CardTitle>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { store.setDashboardSummary(null); store.setOpsStats(null); loadDashboard(); loadLiveBridge() }}>
                  <RotateCcw className="h-3 w-3 mr-1" /> Muat semula
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="space-y-1.5">
                {(ds?.recentEvents || []).slice(0, 10).map((evt) => (
                  <div key={evt.id} className="flex items-center gap-2 text-xs">
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 font-mono shrink-0">{evt.type.replace(/_/g, ' ')}</Badge>
                    <span className="flex-1 truncate">{evt.summary}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{formatRelative(evt.createdAt)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    )
  }

  /* ─── Automations Tab ────────────────────────────────────────────────────── */

  const renderAutomationsTab = () => (
    <div className="p-4 space-y-3 overflow-auto h-full">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Automasi & Peringatan</h4>
        <Dialog open={createAutoOpen} onOpenChange={setCreateAutoOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="text-xs text-white" style={{ background: BRAND_GRADIENT }}>
              <Plus className="h-3 w-3 mr-1" /> Buat Peringatan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Buat Peringatan</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <div><Label className="text-xs">Tajuk</Label><Input className="mt-1" placeholder="Contoh: Follow up supplier" value={newAuto.title} onChange={(e) => setNewAuto(p => ({ ...p, title: e.target.value }))} /></div>
              <div><Label className="text-xs">Penerangan</Label><Textarea className="mt-1" placeholder="Butiran peringatan..." value={newAuto.description} onChange={(e) => setNewAuto(p => ({ ...p, description: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Jenis</Label>
                  <select className="mt-1 h-9 text-sm border rounded-md px-2 bg-background" value={newAuto.kind} onChange={(e) => setNewAuto(p => ({ ...p, kind: e.target.value }))}>
                    <option value="one_time">Sekali sahaja</option><option value="fixed_rate">Berulang</option><option value="cron">Cron</option>
                  </select>
                </div>
                <div><Label className="text-xs">Domain</Label>
                  <select className="mt-1 h-9 text-sm border rounded-md px-2 bg-background" value={newAuto.domain} onChange={(e) => setNewAuto(p => ({ ...p, domain: e.target.value }))}>
                    {Object.entries(DOMAIN_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              {newAuto.kind !== 'one_time' && (
                <div><Label className="text-xs">Jadual (cron / minit)</Label><Input className="mt-1" placeholder="0 9 * * 1 (setiap isnin 9pg)" value={newAuto.expr} onChange={(e) => setNewAuto(p => ({ ...p, expr: e.target.value }))} /></div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateAutoOpen(false)}>Batal</Button>
              <Button onClick={handleCreateAutomation} disabled={createAutoLoading || !newAuto.title.trim()} className="text-white" style={{ background: BRAND_GRADIENT }}>
                {createAutoLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3 mr-1" /> } Cipta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {autosLoading ? (
        Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
      ) : store.automations.length === 0 ? (
        <div className="text-center text-muted-foreground py-12 text-sm">Tiada automasi</div>
      ) : store.automations.map((auto) => (
        <Card key={auto.id} className={cn('transition-all', !auto.isEnabled && 'opacity-60')}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Switch checked={auto.isEnabled} onCheckedChange={() => toggleAutomation(auto.id, auto.isEnabled)} />
              <span className="text-sm font-medium flex-1">{auto.title}</span>
              <Badge variant="outline" className={cn('text-[10px]', DOMAIN_CONFIG[auto.domain]?.color)}>{DOMAIN_CONFIG[auto.domain]?.label}</Badge>
            </div>
            {auto.description && <p className="text-[11px] text-muted-foreground">{auto.description}</p>}
            <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{auto.kind}</span>
              {auto.lastRunAt && <span>Terakhir: {formatRelative(auto.lastRunAt)}</span>}
              {auto.nextRunAt && <span>Seterusnya: {formatRelative(auto.nextRunAt)}</span>}
              {auto.failureState && <span className="text-red-500 flex items-center gap-0.5"><AlertTriangle className="h-2.5 w-2.5" />{auto.failureState}</span>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  /* ─── Projects Tab ───────────────────────────────────────────────────────── */

  const renderProjectsTab = () => (
    <div className="p-4 space-y-4 overflow-auto h-full">
      <h4 className="text-sm font-semibold" style={{ color: '#4B0082' }}>Projek</h4>
      {store.projects.length === 0 ? (
        <div className="text-center text-muted-foreground py-12 text-sm">Tiada projek. Tugasan akan dikumpulkan mengikut projek secara automatik.</div>
      ) : store.projects.map((proj) => (
        <Card key={proj.name} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <FolderKanban className="h-5 w-5" style={{ color: '#4B0082' }} />
              <h5 className="text-sm font-semibold">{proj.name}</h5>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div><p className="text-lg font-bold">{proj.workItemCount}</p><p className="text-[10px] text-muted-foreground">Jumlah</p></div>
              <div><p className="text-lg font-bold text-emerald-600">{proj.completedCount}</p><p className="text-[10px] text-muted-foreground">Selesai</p></div>
              <div><p className="text-lg font-bold text-red-600">{proj.blockedCount}</p><p className="text-[10px] text-muted-foreground">Disekat</p></div>
            </div>
            {proj.lastActivity && <p className="text-[10px] text-muted-foreground mt-2">Aktiviti terakhir: {formatRelative(proj.lastActivity)}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  )

  /* ─── Agents & Trace Tab ─────────────────────────────────────────────────── */

  const renderAgentsTab = () => (
    <div className="p-4 space-y-4 overflow-auto h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Agent workforce summary */}
        <Card>
          <CardHeader className="p-3 pb-2"><CardTitle className="text-sm flex items-center gap-2"><Workflow className="h-4 w-4" /> Ejen Operasi</CardTitle></CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Intent Router</span>
                <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Aktif</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">AI Chat Engine</span>
                <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Aktif</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Domain Fetchers</span>
                <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Aktif</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Automation Engine</span>
                <Badge className={`${store.automations.filter(a => a.isEnabled).length > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'} text-[10px]`}>
                  {store.automations.filter(a => a.isEnabled).length > 0 ? 'Aktif' : 'Idle'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance metrics */}
        <Card>
          <CardHeader className="p-3 pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Prestasi</CardTitle></CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Purata Resolusi</span>
                <span className="font-medium">{store.opsStats?.avgResolutionTime ? formatMs(store.opsStats.avgResolutionTime) : 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Siap Minggu Ini</span>
                <span className="font-medium">{store.opsStats?.completedThisWeek || 0}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Siap Bulan Ini</span>
                <span className="font-medium">{store.opsStats?.completedThisMonth || 0}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Kegagalan</span>
                <span className={cn('font-medium', (store.opsStats?.failureRate || 0) > 20 ? 'text-red-600' : 'text-emerald-600')}>
                  {(store.opsStats?.failureRate || 0).toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top intents */}
      <Card>
        <CardHeader className="p-3 pb-2"><CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4" /> Intent Teratas</CardTitle></CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="space-y-1.5">
            {(store.opsStats?.topIntents || []).map((item, i) => (
              <div key={item.intent} className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground w-5 text-right">{i + 1}.</span>
                <Badge variant="secondary" className="text-[10px] font-mono">{item.intent}</Badge>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-purple-500" style={{ width: `${Math.min(100, (item.count / Math.max(1, (store.opsStats?.topIntents?.[0]?.count || 1))) * 100)}%` }} />
                </div>
                <span className="font-medium w-6 text-right">{item.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top domains */}
      <Card>
        <CardHeader className="p-3 pb-2"><CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4" /> Domain Teratas</CardTitle></CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="space-y-1.5">
            {(store.opsStats?.topDomains || []).map((item, i) => {
              const cfg = DOMAIN_CONFIG[item.domain]
              return (
                <div key={item.domain} className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground w-5 text-right">{i + 1}.</span>
                  {cfg && <Badge variant="outline" className={cn('text-[10px]', cfg.color)}>{cfg.label}</Badge>}
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-purple-500" style={{ width: `${Math.min(100, (item.count / Math.max(1, (store.opsStats?.topDomains?.[0]?.count || 1))) * 100)}%` }} />
                  </div>
                  <span className="font-medium w-6 text-right">{item.count}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  /* ─── Trace Tab (center/mobile) ──────────────────────────────────────────── */

  const renderTraceTabCenter = () => {
    const wi = store.selectedWorkItem
    if (!wi) return <div className="text-center text-muted-foreground py-16 text-sm">Pilih tugasan untuk melihat jejak</div>
    return (
      <ScrollArea className="h-full">
        <div className="p-4 space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-mono font-bold">{wi.workItemNumber}</span>
                <Badge className={cn('text-xs', STATUS_CONFIG[wi.status]?.color)}>{STATUS_CONFIG[wi.status]?.label}</Badge>
                <Badge variant="outline" className={cn('text-xs', DOMAIN_CONFIG[wi.domain]?.color)}>{DOMAIN_CONFIG[wi.domain]?.label}</Badge>
                <Badge variant="outline" className="text-xs"><span className={cn('inline-block h-2 w-2 rounded-full mr-1', PRIORITY_CONFIG[wi.priority]?.color)} />{PRIORITY_CONFIG[wi.priority]?.label}</Badge>
              </div>
              <h3 className="text-base font-semibold">{wi.title}</h3>
              <p className="text-xs text-muted-foreground">{wi.requestText}</p>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span>Dicipta: {formatDate(wi.createdAt)}</span>
                {wi.startedAt && <span>Mula: {formatTime(wi.startedAt)}</span>}
                {wi.completedAt && <span>Selesai: {formatTime(wi.completedAt)}</span>}
              </div>
              {wi.resolutionSummary && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-sm">
                  <p className="font-medium text-emerald-700 dark:text-emerald-400 mb-1">Ringkasan Resolusi</p>
                  <p className="text-emerald-600 dark:text-emerald-300 text-xs">{wi.resolutionSummary}</p>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="p-3 pb-2"><CardTitle className="text-sm">Jejak Pelaksanaan ({store.traceEntries.length})</CardTitle></CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="space-y-3">
                {store.traceEntries.map((entry, idx) => (
                  <div key={entry.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={cn('flex items-center justify-center h-7 w-7 rounded-full text-[10px] font-bold text-white shrink-0',
                        entry.status === 'success' ? 'bg-emerald-500' : entry.status === 'failed' ? 'bg-red-500' : entry.status === 'running' ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600')}>
                        {entry.status === 'success' ? <CheckCircle2 className="h-3.5 w-3.5" /> : entry.status === 'failed' ? <XCircle className="h-3.5 w-3.5" /> : entry.status === 'running' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (idx + 1)}
                      </div>
                      {idx < store.traceEntries.length - 1 && <div className="w-px flex-1 bg-border" />}
                    </div>
                    <div className="flex-1 min-w-0 pb-2">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-mono">{entry.type.replace(/_/g, ' ')}</Badge>
                        {entry.latencyMs != null && <span className="text-[10px] text-muted-foreground">{formatMs(entry.latencyMs)}</span>}
                        <span className="text-[10px] text-muted-foreground ml-auto">{formatTime(entry.createdAt)}</span>
                      </div>
                      <p className="text-xs leading-relaxed">{entry.summary}</p>
                    </div>
                  </div>
                ))}
                <div ref={traceEndRef} />
              </div>
            </CardContent>
          </Card>
          {store.artifacts.length > 0 && (
            <Card>
              <CardHeader className="p-3 pb-2"><CardTitle className="text-sm">Artifak ({store.artifacts.length})</CardTitle></CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="space-y-1.5">
                  {store.artifacts.map((art) => (
                    <div key={art.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-xs">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{art.title}</p>
                        {art.summary && <p className="text-[10px] text-muted-foreground truncate">{art.summary}</p>}
                      </div>
                      <Badge variant="outline" className="text-[10px]">{art.type}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    )
  }

  /* ─── Center panel router ─────────────────────────────────────────────────── */

  const renderCenterPanel = () => {
    switch (store.activeTab) {
      case 'chat': return renderChatTab()
      case 'tasks': return renderTasksTab()
      case 'dashboard': return renderDashboardTab()
      case 'automations': return renderAutomationsTab()
      case 'projects': return renderProjectsTab()
      case 'agents': return renderAgentsTab()
      case 'trace': return renderTraceTabCenter()
      default: return renderChatTab()
    }
  }

  /* ─── Tab bar ────────────────────────────────────────────────────────────── */

  const renderTabBar = () => (
    <div className="flex items-center gap-1 overflow-x-auto px-2 py-1.5 border-b bg-card/50 scrollbar-none">
      {TABS.map((tab) => (
        <button key={tab.key} onClick={() => store.setActiveTab(tab.key)}
          className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0',
            store.activeTab === tab.key ? 'text-white shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
          style={store.activeTab === tab.key ? { background: BRAND_GRADIENT } : {}}>
          <tab.icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </div>
  )

  /* ─── Header stats badges ────────────────────────────────────────────────── */

  const activeCount = store.workItems.filter(wi => ['in_progress', 'queued', 'blocked', 'waiting_user'].includes(wi.status)).length
  const completedCount = store.workItems.filter(wi => wi.status === 'completed').length
  const blockedCount = store.workItems.filter(wi => wi.status === 'blocked').length

  /* ─── Main render ─────────────────────────────────────────────────────────── */

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-transparent flex flex-col">
        {/* Header */}
        <div className="border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0 z-20">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-lg shadow-primary/20">
                  <GitBranch className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    Ops Conductor
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Orkestrasi operasi NGO PUSPA dalam masa nyata
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeCount > 0 && (
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
                    <Activity className="h-3 w-3 mr-1" />
                    {activeCount} aktif
                  </Badge>
                )}
                {blockedCount > 0 && (
                  <Badge className="bg-red-500/20 text-red-400 border-red-400/30 text-[10px]">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {blockedCount} sekat
                  </Badge>
                )}
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-400/30 text-[10px]">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {completedCount} siap
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        {renderTabBar()}

        {/* Three-panel layout */}
        <div className="flex flex-1 min-h-0">
          {!isMobile && renderLeftSidebar()}
          <main className="flex-1 min-w-0 flex flex-col">
            {renderCenterPanel()}
          </main>
          {!isMobile && renderTracePanel()}
        </div>

        {/* Approval Dialog */}
        <Dialog open={approvalOpen} onOpenChange={setApprovalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Mohon Kelulusan</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <div><Label className="text-xs">Tindakan</Label><Input className="mt-1" placeholder="Terangkan tindakan yang perlu kelulusan" value={approvalAction} onChange={(e) => setApprovalAction(e.target.value)} /></div>
              <div><Label className="text-xs">Sebab</Label><Textarea className="mt-1" placeholder="Mengapa kelulusan diperlukan?" value={approvalReason} onChange={(e) => setApprovalReason(e.target.value)} /></div>
              <div><Label className="text-xs">Tahap Risiko</Label>
                <div className="flex gap-2 mt-1">
                  {(['low', 'medium', 'high'] as const).map((r) => (
                    <Button key={r} size="sm" variant={approvalRisk === r ? 'default' : 'outline'}
                      className={cn('text-xs flex-1', approvalRisk === r && 'text-white')}
                      style={approvalRisk === r ? { background: r === 'high' ? '#dc2626' : r === 'medium' ? '#f97316' : BRAND_GRADIENT } : {}}
                      onClick={() => setApprovalRisk(r)}>
                      {r === 'low' ? 'Rendah' : r === 'medium' ? 'Sederhana' : 'Tinggi'}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setApprovalOpen(false)}>Batal</Button>
              <Button onClick={submitApproval} disabled={!approvalAction.trim()} className="text-white" style={{ background: BRAND_GRADIENT }}>
                <Shield className="h-3 w-3 mr-1" /> Hantar Mohon
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
