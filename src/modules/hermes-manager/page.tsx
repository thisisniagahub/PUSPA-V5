'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Card, CardHeader, CardTitle, CardContent, CardDescription,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  BrainCircuit, Sparkles, BookOpen, ClipboardList, Database, Cpu,
  Bot, Clock, Globe, Wrench, Search, Plus, Trash2, RefreshCw,
  CheckCircle2, AlertTriangle, XCircle, Pin, PinOff, RotateCcw,
  Play, Pause, Loader2, Download, Upload, Eye, EyeOff, Zap,
  ArrowRight, ChevronRight, Tag, FileText, Brain, Settings,
  Activity, Server, MessageSquare, Layers, Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Custom hook: fetch on mount without lint warning ──────────
function useFetchOnMount(fetchFn: () => Promise<void>) {
  const called = useRef(false)
  useEffect(() => {
    if (!called.current) {
      called.current = true
      fetchFn()
    }
  }, [fetchFn])
}

// ── Types ────────────────────────────────────────────────────

interface SkillEntry {
  id: string; name: string; description: string; category: string
  instructions: string; triggerPatterns: string[]; platforms: string[]
  status: string; pinnedAt: string | null; lastUsedAt: string | null
  version: number; usageCount: number; successRate: number
  source: string; isActive: boolean; createdAt: string; updatedAt: string
}

interface MemoryEntry {
  id: string; userId: string; category: string; key: string
  value: string; source: string; confidence: number
  accessCount: number; isActive: boolean; createdAt: string
  updatedAt: string; lastAccessed: string | null
}

interface CuratorStatus {
  totalSkills: number; activeSkills: number; staleSkills: number
  archivedSkills: number; pinnedSkills: number
  lastRunAt: string | null; lastRunStatus: string | null
}

interface MCPServer {
  id: string; name: string; command: string; args: string[]
  env: Record<string, string>; status: string
  toolCount: number; createdAt: string
}

interface CronJob {
  id: string; name: string; schedule: string; scheduleType: string
  action: string; isActive: boolean; lastRunAt: string | null
  nextRunAt: string | null; createdAt: string
}

interface Platform {
  id: string; type: string; name: string; config: Record<string, string>
  isActive: boolean; lastMessageAt: string | null; createdAt: string
}

interface SoulConfig {
  personality: string; tone: string; greeting: string
  language: string; customInstructions: string
}

interface SubagentEntry {
  id: string; task: string; status: string; progress: number
  createdAt: string; completedAt: string | null
}

interface SkillHubResult {
  name: string; description: string; author: string
  downloads: number; rating: number; category: string
}

// ── API Helper ───────────────────────────────────────────────

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...opts?.headers },
    ...opts,
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'API error')
  return json.data as T
}

// ── Status Badge ─────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; icon: React.ReactNode }> = {
    active: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800', icon: <CheckCircle2 className="h-3 w-3" /> },
    stale: { color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800', icon: <AlertTriangle className="h-3 w-3" /> },
    archived: { color: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700', icon: <XCircle className="h-3 w-3" /> },
    running: { color: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
    completed: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="h-3 w-3" /> },
    failed: { color: 'bg-red-100 text-red-700 border-red-200', icon: <XCircle className="h-3 w-3" /> },
    connected: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="h-3 w-3" /> },
    disconnected: { color: 'bg-slate-100 text-slate-600 border-slate-200', icon: <XCircle className="h-3 w-3" /> },
    pending: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <Clock className="h-3 w-3" /> },
  }
  const info = map[status] || map.pending
  return (
    <Badge variant="outline" className={cn('text-[10px] gap-1', info.color)}>
      {info.icon} {status}
    </Badge>
  )
}

// ════════════════════════════════════════════════════════════════
// SKILLS TAB
// ════════════════════════════════════════════════════════════════

function SkillsTab() {
  const [skills, setSkills] = useState<SkillEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [newSkill, setNewSkill] = useState({ name: '', description: '', category: 'general', instructions: '', triggerPatterns: '' })
  const [creating, setCreating] = useState(false)

  const loadSkills = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<{ skills: SkillEntry[] }>('/api/v1/hermes/skills')
      setSkills(data.skills || [])
    } catch { setSkills([]) }
    setLoading(false)
  }, [])

  useFetchOnMount(loadSkills)

  const filtered = skills.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = async () => {
    setCreating(true)
    try {
      await apiFetch('/api/v1/hermes/skills', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create',
          name: newSkill.name,
          description: newSkill.description,
          category: newSkill.category,
          instructions: newSkill.instructions,
          triggerPatterns: newSkill.triggerPatterns.split(',').map(p => p.trim()).filter(Boolean),
        }),
      })
      setCreateOpen(false)
      setNewSkill({ name: '', description: '', category: 'general', instructions: '', triggerPatterns: '' })
      await loadSkills()
    } catch { /* error */ }
    setCreating(false)
  }

  const handleDelete = async (skillId: string) => {
    try {
      await apiFetch('/api/v1/hermes/skills', {
        method: 'POST',
        body: JSON.stringify({ action: 'delete', skillId }),
      })
      await loadSkills()
    } catch { /* error */ }
  }

  const handlePin = async (skillId: string, pin: boolean) => {
    try {
      await apiFetch(`/api/v1/hermes/curator/${skillId}`, {
        method: 'POST',
        body: JSON.stringify({ action: pin ? 'pin' : 'unpin' }),
      })
      await loadSkills()
    } catch { /* error */ }
  }

  const handleExport = async (skillId: string) => {
    try {
      const data = await apiFetch<{ skillMd: string }>(`/api/v1/hermes/skills?export=${skillId}`)
      if (data?.skillMd) {
        const blob = new Blob([data.skillMd], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = `SKILL.md`; a.click()
        URL.revokeObjectURL(url)
      }
    } catch { /* error */ }
  }

  const stats = {
    total: skills.length,
    active: skills.filter(s => s.status === 'active').length,
    auto: skills.filter(s => s.source === 'auto').length,
    manual: skills.filter(s => s.source === 'manual').length,
  }

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Jumlah Skill', value: stats.total, icon: <BookOpen className="h-4 w-4" />, color: 'text-violet-600' },
          { label: 'Aktif', value: stats.active, icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-emerald-600' },
          { label: 'Auto-Learn', value: stats.auto, icon: <Sparkles className="h-4 w-4" />, color: 'text-amber-600' },
          { label: 'Manual', value: stats.manual, icon: <Wrench className="h-4 w-4" />, color: 'text-slate-600' },
        ].map(s => (
          <Card key={s.label} className="border shadow-none">
            <CardContent className="p-3 flex items-center gap-3">
              <div className={cn('p-2 rounded-xl bg-muted/50', s.color)}>{s.icon}</div>
              <div>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Create */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari skill..." className="pl-9 h-9" />
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm" className="h-9 gap-1.5 bg-violet-600 text-white hover:bg-violet-700">
          <Plus className="h-4 w-4" /> Skill Baru
        </Button>
        <Button onClick={loadSkills} variant="outline" size="icon" className="h-9 w-9">
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
        </Button>
      </div>

      {/* Skills List */}
      <ScrollArea className="max-h-[500px]">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Tiada skill dijumpai</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(skill => (
              <Card key={skill.id} className="border shadow-none hover:shadow-sm transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{skill.name}</span>
                        <StatusBadge status={skill.status} />
                        <Badge variant="outline" className="text-[9px]">{skill.category}</Badge>
                        <Badge variant="secondary" className="text-[9px]">v{skill.version}</Badge>
                        {skill.pinnedAt && <Pin className="h-3 w-3 text-violet-500" />}
                        <Badge variant="outline" className="text-[9px]">{skill.source}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{skill.description}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                        <span>Digunakan: {skill.usageCount}x</span>
                        <span>Kejayaan: {Math.round(skill.successRate * 100)}%</span>
                        {skill.triggerPatterns.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Tag className="h-2.5 w-2.5" />
                            {skill.triggerPatterns.slice(0, 3).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handlePin(skill.id, !skill.pinnedAt)} title={skill.pinnedAt ? 'Unpin' : 'Pin'}>
                        {skill.pinnedAt ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleExport(skill.id)} title="Export SKILL.md">
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(skill.id)} title="Padam">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Cipta Skill Baru</DialogTitle>
            <DialogDescription>Tambah skill dalam format SKILL.md (agentskills.io)</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nama</Label>
              <Input value={newSkill.name} onChange={e => setNewSkill(p => ({ ...p, name: e.target.value }))} placeholder="e.g. member-search" className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Keterangan</Label>
              <Input value={newSkill.description} onChange={e => setNewSkill(p => ({ ...p, description: e.target.value }))} placeholder="Cari ahli asnaf..." className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Kategori</Label>
              <Select value={newSkill.category} onValueChange={v => setNewSkill(p => ({ ...p, category: v }))}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['general', 'data-query', 'crud', 'workflow', 'analysis', 'reporting', 'navigation'].map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Arahan (Instructions)</Label>
              <Textarea value={newSkill.instructions} onChange={e => setNewSkill(p => ({ ...p, instructions: e.target.value }))} placeholder="1. Langkah pertama&#10;2. Langkah kedua..." rows={4} className="text-xs" />
            </div>
            <div>
              <Label className="text-xs">Corak Pencetus (koma)</Label>
              <Input value={newSkill.triggerPatterns} onChange={e => setNewSkill(p => ({ ...p, triggerPatterns: e.target.value }))} placeholder="cari ahli, search member, profil" className="h-9" />
            </div>
            <Button onClick={handleCreate} disabled={creating || !newSkill.name} className="w-full bg-violet-600 text-white hover:bg-violet-700">
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Cipta Skill
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// CURATOR TAB
// ════════════════════════════════════════════════════════════════

function CuratorTab() {
  const [status, setStatus] = useState<CuratorStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [lru, setLru] = useState<{ id: string; name: string; status: string; lastUsedAt: string | null; usageCount: number }[]>([])
  const [runResult, setRunResult] = useState<string | null>(null)

  const loadStatus = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<CuratorStatus>('/api/v1/hermes/curator')
      setStatus(data)
      const lruData = await apiFetch<{ skills: typeof lru }>('/api/v1/hermes/curator?action=lru')
      setLru(lruData.skills || [])
    } catch { /* error */ }
    setLoading(false)
  }, [])

  useFetchOnMount(loadStatus)

  const handleRun = async (dryRun: boolean) => {
    setRunning(true)
    setRunResult(null)
    try {
      const data = await apiFetch<{ summary: string; skillsReviewed: number; skillsStaled: number; skillsArchived: number; skillsPatched: number; skillsConsolidated: number }>('/api/v1/hermes/curator', {
        method: 'POST',
        body: JSON.stringify({ dryRun }),
      })
      setRunResult(`✅ ${data.summary} (Reviewed: ${data.skillsReviewed}, Staled: ${data.skillsStaled}, Archived: ${data.skillsArchived}, Patched: ${data.skillsPatched}, Consolidated: ${data.skillsConsolidated})`)
      await loadStatus()
    } catch (e: any) {
      setRunResult(`❌ Gagal: ${e.message}`)
    }
    setRunning(false)
  }

  return (
    <div className="space-y-4">
      {/* Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Jumlah', value: status?.totalSkills || 0, color: 'text-slate-700' },
          { label: 'Aktif', value: status?.activeSkills || 0, color: 'text-emerald-600' },
          { label: 'Stale', value: status?.staleSkills || 0, color: 'text-amber-600' },
          { label: 'Archived', value: status?.archivedSkills || 0, color: 'text-slate-400' },
          { label: 'Dipin', value: status?.pinnedSkills || 0, color: 'text-violet-600' },
        ].map(s => (
          <Card key={s.label} className="border shadow-none">
            <CardContent className="p-3 text-center">
              <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lifecycle Diagram */}
      <Card className="border shadow-none">
        <CardContent className="p-4">
          <h4 className="text-xs font-semibold mb-3 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-violet-500" /> Kitaran Hidup Skill
          </h4>
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <Badge className="bg-emerald-100 text-emerald-700 border-0">🟢 Active</Badge>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">30 hari tidak diguna</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <Badge className="bg-amber-100 text-amber-700 border-0">🟡 Stale</Badge>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">90 hari tidak diguna</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <Badge className="bg-slate-100 text-slate-600 border-0">⚪ Archived</Badge>
            <span className="text-[10px] text-muted-foreground ml-2">(Dipin = dilindung)</span>
            <Pin className="h-3 w-3 text-violet-500" />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="border shadow-none">
        <CardContent className="p-4 space-y-3">
          <h4 className="text-xs font-semibold flex items-center gap-2">
            <Play className="h-4 w-4 text-violet-500" /> Jalankan Curator
          </h4>
          <div className="flex gap-2">
            <Button onClick={() => handleRun(true)} disabled={running} variant="outline" size="sm" className="gap-1.5">
              {running ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
              Dry Run
            </Button>
            <Button onClick={() => handleRun(false)} disabled={running} size="sm" className="gap-1.5 bg-violet-600 text-white hover:bg-violet-700">
              {running ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
              Jalankan
            </Button>
          </div>
          {runResult && (
            <div className={cn('text-xs p-3 rounded-xl border', runResult.startsWith('✅') ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100')}>
              {runResult}
            </div>
          )}
          {status?.lastRunAt && (
            <p className="text-[10px] text-muted-foreground">
              Terakhir dijalankan: {new Date(status.lastRunAt).toLocaleString('ms-MY')} — {status.lastRunStatus}
            </p>
          )}
        </CardContent>
      </Card>

      {/* LRU Skills */}
      <Card className="border shadow-none">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xs flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" /> Skill Paling Lama Tidak Diguna (LRU)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {lru.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Semua skill aktif diguna baru-baru ini</p>
          ) : (
            <div className="space-y-1.5">
              {lru.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground w-4">{i + 1}.</span>
                    <span className="font-medium">{s.name}</span>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span>{s.usageCount}x diguna</span>
                    <span>{s.lastUsedAt ? new Date(s.lastUsedAt).toLocaleDateString('ms-MY') : 'Tidak pernah'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// MEMORY TAB
// ════════════════════════════════════════════════════════════════

function MemoryTab() {
  const [memories, setMemories] = useState<MemoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [consolidating, setConsolidating] = useState(false)
  const [consolidateResult, setConsolidateResult] = useState<string | null>(null)

  const loadMemories = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<{ memories: MemoryEntry[] }>('/api/v1/hermes/skills?memory=true')
      setMemories(data.memories || [])
    } catch { setMemories([]) }
    setLoading(false)
  }, [])

  useFetchOnMount(loadMemories)

  const categories = ['all', ...new Set(memories.map(m => m.category))]
  const filtered = memories.filter(m => {
    if (filterCat !== 'all' && m.category !== filterCat) return false
    if (search && !m.key.toLowerCase().includes(search.toLowerCase()) && !m.value.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleConsolidate = async () => {
    setConsolidating(true)
    setConsolidateResult(null)
    try {
      const data = await apiFetch<{ merged: number; deleted: number; totalBefore: number; totalAfter: number }>('/api/v1/hermes/memory-provider', {
        method: 'POST',
        body: JSON.stringify({ action: 'consolidate' }),
      })
      setConsolidateResult(`✅ Digabung: ${data.merged}, Dihapus: ${data.deleted} (${data.totalBefore} → ${data.totalAfter})`)
      await loadMemories()
    } catch (e: any) {
      setConsolidateResult(`❌ Gagal: ${e.message}`)
    }
    setConsolidating(false)
  }

  const handleForget = async (key: string) => {
    try {
      await apiFetch('/api/v1/hermes/memory-provider', {
        method: 'DELETE',
        body: JSON.stringify({ key }),
      })
      await loadMemories()
    } catch { /* error */ }
  }

  const catIcon = (cat: string) => {
    switch (cat) {
      case 'preference': return '⚙️'
      case 'fact': return '📌'
      case 'procedure': return '🔧'
      case 'context': return '🤝'
      default: return '💭'
    }
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Jumlah', value: memories.length, icon: <Database className="h-4 w-4" />, color: 'text-violet-600' },
          { label: 'Keutamaan', value: memories.filter(m => m.category === 'preference').length, icon: <Settings className="h-4 w-4" />, color: 'text-amber-600' },
          { label: 'Fakta', value: memories.filter(m => m.category === 'fact').length, icon: <FileText className="h-4 w-4" />, color: 'text-emerald-600' },
          { label: 'Avg Keyakinan', value: memories.length ? Math.round(memories.reduce((a, m) => a + m.confidence, 0) / memories.length * 100) + '%' : '0%', icon: <Brain className="h-4 w-4" />, color: 'text-sky-600' },
        ].map(s => (
          <Card key={s.label} className="border shadow-none">
            <CardContent className="p-3 flex items-center gap-3">
              <div className={cn('p-2 rounded-xl bg-muted/50', s.color)}>{s.icon}</div>
              <div>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari memori..." className="pl-9 h-9" />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {categories.map(c => <SelectItem key={c} value={c}>{c === 'all' ? 'Semua' : c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={handleConsolidate} disabled={consolidating} variant="outline" size="sm" className="h-9 gap-1.5">
          {consolidating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Layers className="h-3 w-3" />}
          Gabung
        </Button>
      </div>

      {consolidateResult && (
        <div className={cn('text-xs p-3 rounded-xl border', consolidateResult.startsWith('✅') ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100')}>
          {consolidateResult}
        </div>
      )}

      {/* Memory List */}
      <ScrollArea className="max-h-[450px]">
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-violet-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Database className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Tiada memori dijumpai</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(m => (
              <Card key={m.id} className="border shadow-none hover:shadow-sm transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm">{catIcon(m.category)}</span>
                        <span className="font-medium text-sm">{m.key}</span>
                        <Badge variant="outline" className="text-[9px]">{m.category}</Badge>
                        <Badge variant="secondary" className="text-[9px]">{Math.round(m.confidence * 100)}%</Badge>
                        <Badge variant="outline" className="text-[9px]">{m.source}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.value}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                        <span>Diakses: {m.accessCount}x</span>
                        <span>{new Date(m.updatedAt).toLocaleDateString('ms-MY')}</span>
                      </div>
                      <div className="mt-1.5">
                        <Progress value={m.confidence * 100} className="h-1" />
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => handleForget(m.key)} title="Lupa">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// SOUL.MD TAB
// ════════════════════════════════════════════════════════════════

function SoulTab() {
  const [soul, setSoul] = useState<SoulConfig>({ personality: '', tone: '', greeting: '', language: 'ms', customInstructions: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const loadSoul = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<SoulConfig>('/api/v1/hermes/soul')
      if (data) setSoul(data)
    } catch { /* use defaults */ }
    setLoading(false)
  }, [])

  useFetchOnMount(loadSoul)

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await apiFetch('/api/v1/hermes/soul', {
        method: 'PUT',
        body: JSON.stringify(soul),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch { /* error */ }
    setSaving(false)
  }

  const handleReset = async () => {
    try {
      await apiFetch('/api/v1/hermes/soul', { method: 'DELETE' })
      await loadSoul()
    } catch { /* error */ }
  }

  return (
    <div className="space-y-4">
      <Card className="border shadow-none">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-700">
              <BrainCircuit className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold">SOUL.md — Personaliti AI</h3>
              <p className="text-[10px] text-muted-foreground">Konfigurasi personaliti dan gaya respons PUSPA AI</p>
            </div>
          </div>

          <div>
            <Label className="text-xs">Personaliti</Label>
            <Textarea value={soul.personality} onChange={e => setSoul(p => ({ ...p, personality: e.target.value }))} placeholder="Cerdas, mesra, proaktif, dan sentiasa sedia membantu..." rows={2} className="text-xs" />
          </div>

          <div>
            <Label className="text-xs">Nada (Tone)</Label>
            <Input value={soul.tone} onChange={e => setSoul(p => ({ ...p, tone: e.target.value }))} placeholder="Profesional tetapi mesra, ringkas dan padat" className="h-9 text-xs" />
          </div>

          <div>
            <Label className="text-xs">Sapaan (Greeting)</Label>
            <Input value={soul.greeting} onChange={e => setSoul(p => ({ ...p, greeting: e.target.value }))} placeholder="Hai! 👋 Saya PUSPA, AI Assistant anda..." className="h-9 text-xs" />
          </div>

          <div>
            <Label className="text-xs">Bahasa Utama</Label>
            <Select value={soul.language} onValueChange={v => setSoul(p => ({ ...p, language: v }))}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ms">Bahasa Melayu</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="bilingual">Bilingual (MS/EN)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Arahan Kustom</Label>
            <Textarea value={soul.customInstructions} onChange={e => setSoul(p => ({ ...p, customInstructions: e.target.value }))} placeholder="Arahan tambahan untuk AI..." rows={4} className="text-xs" />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} className="flex-1 bg-violet-600 text-white hover:bg-violet-700 gap-1.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
              {saved ? 'Disimpan!' : 'Simpan'}
            </Button>
            <Button onClick={handleReset} variant="outline" className="gap-1.5">
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card className="border shadow-none">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xs flex items-center gap-2">
            <Eye className="h-4 w-4 text-violet-500" /> Preview SOUL.md
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <pre className="text-[10px] p-3 rounded-xl bg-muted/50 font-mono overflow-x-auto whitespace-pre-wrap">
{`---
name: PUSPA AI
personality: ${soul.personality || '(tidak ditetapkan)'}
tone: ${soul.tone || '(tidak ditetapkan)'}
language: ${soul.language}
---

# Greeting
${soul.greeting || '(tiada sapaan)'}

# Custom Instructions
${soul.customInstructions || '(tiada arahan kustom)'}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// MCP SERVERS TAB
// ════════════════════════════════════════════════════════════════

function McpTab() {
  const [servers, setServers] = useState<MCPServer[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [newServer, setNewServer] = useState({ name: '', command: '', args: '', env: '' })
  const [adding, setAdding] = useState(false)

  const loadServers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<{ servers: MCPServer[] }>('/api/v1/hermes/mcp')
      setServers(data.servers || [])
    } catch { setServers([]) }
    setLoading(false)
  }, [])

  useFetchOnMount(loadServers)

  const handleAdd = async () => {
    setAdding(true)
    try {
      await apiFetch('/api/v1/hermes/mcp', {
        method: 'POST',
        body: JSON.stringify({
          name: newServer.name,
          command: newServer.command,
          args: newServer.args.split(' '),
          env: newServer.env ? JSON.parse(newServer.env) : {},
        }),
      })
      setAddOpen(false)
      setNewServer({ name: '', command: '', args: '', env: '' })
      await loadServers()
    } catch { /* error */ }
    setAdding(false)
  }

  const handleRemove = async (id: string) => {
    try {
      await apiFetch(`/api/v1/hermes/mcp/${id}`, { method: 'DELETE' })
      await loadServers()
    } catch { /* error */ }
  }

  const handleConnect = async (id: string) => {
    try {
      await apiFetch(`/api/v1/hermes/mcp/${id}`, { method: 'POST', body: JSON.stringify({ action: 'connect' }) })
      await loadServers()
    } catch { /* error */ }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Pelayan MCP (Model Context Protocol)</h3>
          <p className="text-[10px] text-muted-foreground">Sambung tool dan sumber data luaran</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setAddOpen(true)} size="sm" className="gap-1.5 bg-violet-600 text-white hover:bg-violet-700">
            <Plus className="h-3 w-3" /> Tambah
          </Button>
          <Button onClick={loadServers} variant="outline" size="icon" className="h-9 w-9">
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      <ScrollArea className="max-h-[500px]">
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-violet-500" /></div>
        ) : servers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Server className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Tiada pelayan MCP dikonfigurasi</p>
            <p className="text-[10px] mt-1">Tambah pelayan MCP untuk mengakses tool luaran</p>
          </div>
        ) : (
          <div className="space-y-2">
            {servers.map(srv => (
              <Card key={srv.id} className="border shadow-none">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-muted/50">
                        <Server className="h-4 w-4 text-violet-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{srv.name}</span>
                          <StatusBadge status={srv.status} />
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono">{srv.command} {srv.args.join(' ')}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                          <span>{srv.toolCount} tools</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {srv.status !== 'connected' && (
                        <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => handleConnect(srv.id)}>
                          <Play className="h-3 w-3" /> Sambung
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemove(srv.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah Pelayan MCP</DialogTitle>
            <DialogDescription>Sambung pelayan MCP untuk akses tool luaran</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nama</Label>
              <Input value={newServer.name} onChange={e => setNewServer(p => ({ ...p, name: e.target.value }))} placeholder="e.g. filesystem" className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Command</Label>
              <Input value={newServer.command} onChange={e => setNewServer(p => ({ ...p, command: e.target.value }))} placeholder="npx @anthropic/mcp-filesystem" className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Args (spasi)</Label>
              <Input value={newServer.args} onChange={e => setNewServer(p => ({ ...p, args: e.target.value }))} placeholder="/path/to/dir" className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Env (JSON)</Label>
              <Textarea value={newServer.env} onChange={e => setNewServer(p => ({ ...p, env: e.target.value }))} placeholder='{"API_KEY": "..."}' rows={2} className="text-xs" />
            </div>
            <Button onClick={handleAdd} disabled={adding || !newServer.name} className="w-full bg-violet-600 text-white hover:bg-violet-700">
              {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Tambah Pelayan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// SUBAGENTS TAB
// ════════════════════════════════════════════════════════════════

function SubagentsTab() {
  const [subagents, setSubagents] = useState<SubagentEntry[]>([])
  const [loading, setLoading] = useState(true)

  const loadSubagents = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<{ subagents: SubagentEntry[] }>('/api/v1/hermes/subagent')
      setSubagents(data.subagents || [])
    } catch { setSubagents([]) }
    setLoading(false)
  }, [])

  useFetchOnMount(loadSubagents)

  const handleCancel = async (id: string) => {
    try {
      await apiFetch(`/api/v1/hermes/subagent/${id}`, { method: 'DELETE' })
      await loadSubagents()
    } catch { /* error */ }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Subagent Delegation</h3>
          <p className="text-[10px] text-muted-foreground">Tugasan yang diurus oleh subagent secara async</p>
        </div>
        <Button onClick={loadSubagents} variant="outline" size="icon" className="h-9 w-9">
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-violet-500" /></div>
      ) : subagents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Bot className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Tiada subagent aktif</p>
          <p className="text-[10px] mt-1">Subagent dihasilkan secara automatik apabila tugasan kompleks diuruskan</p>
        </div>
      ) : (
        <div className="space-y-2">
          {subagents.map(sa => (
            <Card key={sa.id} className="border shadow-none">
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-violet-500" />
                      <span className="font-medium text-sm">{sa.task}</span>
                      <StatusBadge status={sa.status} />
                    </div>
                    <div className="mt-2">
                      <Progress value={sa.progress} className="h-1.5" />
                      <span className="text-[10px] text-muted-foreground">{sa.progress}%</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                      <span>Dicipta: {new Date(sa.createdAt).toLocaleString('ms-MY')}</span>
                      {sa.completedAt && <span>Siap: {new Date(sa.completedAt).toLocaleString('ms-MY')}</span>}
                    </div>
                  </div>
                  {sa.status === 'running' && (
                    <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 text-destructive" onClick={() => handleCancel(sa.id)}>
                      <Pause className="h-3 w-3" /> Batal
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// CRON JOBS TAB
// ════════════════════════════════════════════════════════════════

function CronTab() {
  const [jobs, setJobs] = useState<CronJob[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [newJob, setNewJob] = useState({ name: '', schedule: '', scheduleType: 'cron', action: '' })
  const [adding, setAdding] = useState(false)

  const loadJobs = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<{ jobs: CronJob[] }>('/api/v1/hermes/cron')
      setJobs(data.jobs || [])
    } catch { setJobs([]) }
    setLoading(false)
  }, [])

  useFetchOnMount(loadJobs)

  const handleAdd = async () => {
    setAdding(true)
    try {
      await apiFetch('/api/v1/hermes/cron', {
        method: 'POST',
        body: JSON.stringify(newJob),
      })
      setAddOpen(false)
      setNewJob({ name: '', schedule: '', scheduleType: 'cron', action: '' })
      await loadJobs()
    } catch { /* error */ }
    setAdding(false)
  }

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await apiFetch(`/api/v1/hermes/cron/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !isActive }),
      })
      await loadJobs()
    } catch { /* error */ }
  }

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/api/v1/hermes/cron/${id}`, { method: 'DELETE' })
      await loadJobs()
    } catch { /* error */ }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Automasi Cron</h3>
          <p className="text-[10px] text-muted-foreground">Jadualkan tugasan berulang secara automatik</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setAddOpen(true)} size="sm" className="gap-1.5 bg-violet-600 text-white hover:bg-violet-700">
            <Plus className="h-3 w-3" /> Tambah
          </Button>
          <Button onClick={loadJobs} variant="outline" size="icon" className="h-9 w-9">
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-violet-500" /></div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Tiada cron job dikonfigurasi</p>
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map(job => (
            <Card key={job.id} className="border shadow-none">
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-violet-500" />
                      <span className="font-semibold text-sm">{job.name}</span>
                      <Badge variant="outline" className="text-[9px]">{job.scheduleType}</Badge>
                      {job.isActive ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[9px]">Aktif</Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-600 border-0 text-[9px]">Dihenti</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                      <span className="font-mono">{job.schedule}</span>
                      <span>Aksi: {job.action.slice(0, 50)}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                      {job.lastRunAt && <span>Terakhir: {new Date(job.lastRunAt).toLocaleString('ms-MY')}</span>}
                      {job.nextRunAt && <span>Seterusnya: {new Date(job.nextRunAt).toLocaleString('ms-MY')}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggle(job.id, job.isActive)}>
                      {job.isActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(job.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah Cron Job</DialogTitle>
            <DialogDescription>Jadualkan tugasan berulang</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nama</Label>
              <Input value={newJob.name} onChange={e => setNewJob(p => ({ ...p, name: e.target.value }))} placeholder="Laporan harian" className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Jenis Jadual</Label>
              <Select value={newJob.scheduleType} onValueChange={v => setNewJob(p => ({ ...p, scheduleType: v }))}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cron">Cron Expression</SelectItem>
                  <SelectItem value="fixed_rate">Fixed Rate</SelectItem>
                  <SelectItem value="one_time">Sekali Sahaja</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Jadual</Label>
              <Input value={newJob.schedule} onChange={e => setNewJob(p => ({ ...p, schedule: e.target.value }))} placeholder={newJob.scheduleType === 'cron' ? '0 9 * * *' : '60'} className="h-9" />
              <p className="text-[10px] text-muted-foreground mt-1">
                {newJob.scheduleType === 'cron' ? 'Cron: min jam hari bulan hariMinggu' : newJob.scheduleType === 'fixed_rate' ? 'Selang dalam minit' : 'Epoch milliseconds'}
              </p>
            </div>
            <div>
              <Label className="text-xs">Aksi</Label>
              <Textarea value={newJob.action} onChange={e => setNewJob(p => ({ ...p, action: e.target.value }))} placeholder="Jana laporan donasi bulanan..." rows={3} className="text-xs" />
            </div>
            <Button onClick={handleAdd} disabled={adding || !newJob.name} className="w-full bg-violet-600 text-white hover:bg-violet-700">
              {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Tambah Cron
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// PLATFORMS TAB
// ════════════════════════════════════════════════════════════════

function PlatformsTab() {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [newPlatform, setNewPlatform] = useState({ type: 'telegram', name: '', token: '' })
  const [adding, setAdding] = useState(false)

  const platformTypes = ['telegram', 'discord', 'slack', 'whatsapp', 'signal', 'matrix']

  const loadPlatforms = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<{ platforms: Platform[] }>('/api/v1/hermes/platforms')
      setPlatforms(data.platforms || [])
    } catch { setPlatforms([]) }
    setLoading(false)
  }, [])

  useFetchOnMount(loadPlatforms)

  const handleAdd = async () => {
    setAdding(true)
    try {
      await apiFetch('/api/v1/hermes/platforms', {
        method: 'POST',
        body: JSON.stringify({
          type: newPlatform.type,
          name: newPlatform.name || newPlatform.type,
          config: { token: newPlatform.token },
        }),
      })
      setAddOpen(false)
      setNewPlatform({ type: 'telegram', name: '', token: '' })
      await loadPlatforms()
    } catch { /* error */ }
    setAdding(false)
  }

  const handleRemove = async (id: string) => {
    try {
      await apiFetch(`/api/v1/hermes/platforms/${id}`, { method: 'DELETE' })
      await loadPlatforms()
    } catch { /* error */ }
  }

  const handleTest = async (id: string) => {
    try {
      await apiFetch(`/api/v1/hermes/platforms/${id}`, { method: 'POST', body: JSON.stringify({ action: 'test' }) })
    } catch { /* error */ }
  }

  const platformIcon = (type: string) => {
    switch (type) {
      case 'telegram': return '📨'
      case 'discord': return '🎮'
      case 'slack': return '💼'
      case 'whatsapp': return '📱'
      case 'signal': return '🔒'
      case 'matrix': return '🧮'
      default: return '🌐'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Platform Berbilang Saluran</h3>
          <p className="text-[10px] text-muted-foreground">Sambung PUSPA AI ke pelbagai platform mesej</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setAddOpen(true)} size="sm" className="gap-1.5 bg-violet-600 text-white hover:bg-violet-700">
            <Plus className="h-3 w-3" /> Sambung
          </Button>
          <Button onClick={loadPlatforms} variant="outline" size="icon" className="h-9 w-9">
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-violet-500" /></div>
      ) : platforms.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Globe className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Tiada platform disambung</p>
          <p className="text-[10px] mt-1">Sambung Telegram, Discord, Slack, WhatsApp, Signal, atau Matrix</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {platforms.map(p => (
            <Card key={p.id} className="border shadow-none">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{platformIcon(p.type)}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{p.name}</span>
                        {p.isActive ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[9px]">Aktif</Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-600 border-0 text-[9px]">Tidak Aktif</Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground capitalize">{p.type}</p>
                      {p.lastMessageAt && (
                        <p className="text-[10px] text-muted-foreground">Mesej terakhir: {new Date(p.lastMessageAt).toLocaleString('ms-MY')}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => handleTest(p.id)}>
                      <Zap className="h-3 w-3" /> Uji
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemove(p.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Sambung Platform</DialogTitle>
            <DialogDescription>Tambah saluran mesej baru</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Jenis Platform</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {platformTypes.map(t => (
                  <button
                    key={t}
                    onClick={() => setNewPlatform(p => ({ ...p, type: t }))}
                    className={cn(
                      'flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all text-xs',
                      newPlatform.type === t ? 'border-violet-600 bg-violet-50 text-violet-700' : 'border-border hover:border-violet-200',
                    )}
                  >
                    <span className="text-lg">{platformIcon(t)}</span>
                    <span className="font-medium capitalize">{t}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs">Nama</Label>
              <Input value={newPlatform.name} onChange={e => setNewPlatform(p => ({ ...p, name: e.target.value }))} placeholder="Bot Telegram PUSPA" className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Token / API Key</Label>
              <Input value={newPlatform.token} onChange={e => setNewPlatform(p => ({ ...p, token: e.target.value }))} placeholder="bot_token atau api_key" className="h-9" type="password" />
            </div>
            <Button onClick={handleAdd} disabled={adding || !newPlatform.token} className="w-full bg-violet-600 text-white hover:bg-violet-700">
              {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Sambung Platform
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// AUXILIARY MODEL TAB
// ════════════════════════════════════════════════════════════════

function AuxiliaryTab() {
  const [config, setConfig] = useState({ vision: 'zai', compression: 'zai', curator: 'zai', summarization: 'zai' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const loadConfig = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<typeof config>('/api/v1/hermes/auxiliary')
      if (data) setConfig(data)
    } catch { /* use defaults */ }
    setLoading(false)
  }, [])

  useFetchOnMount(loadConfig)

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await apiFetch('/api/v1/hermes/auxiliary', { method: 'PUT', body: JSON.stringify(config) })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch { /* error */ }
    setSaving(false)
  }

  const tasks = [
    { key: 'vision' as const, label: 'Vision', desc: 'Analisis imej', icon: <Eye className="h-4 w-4" /> },
    { key: 'compression' as const, label: 'Compression', desc: 'Mampatan konteks', icon: <Layers className="h-4 w-4" /> },
    { key: 'curator' as const, label: 'Curator', desc: 'Semakan skill', icon: <ClipboardList className="h-4 w-4" /> },
    { key: 'summarization' as const, label: 'Summarization', desc: 'Ringkasan teks', icon: <FileText className="h-4 w-4" /> },
  ]

  return (
    <div className="space-y-4">
      <Card className="border shadow-none">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-xl bg-muted/50">
              <Cpu className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Model Auxilliari</h3>
              <p className="text-[10px] text-muted-foreground">Lantik model berbeza untuk tugasan khusus</p>
            </div>
          </div>

          {tasks.map(task => (
            <div key={task.key} className="flex items-center justify-between py-2 border-b last:border-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted/30">{task.icon}</div>
                <div>
                  <p className="text-sm font-medium">{task.label}</p>
                  <p className="text-[10px] text-muted-foreground">{task.desc}</p>
                </div>
              </div>
              <Select value={config[task.key]} onValueChange={v => setConfig(p => ({ ...p, [task.key]: v }))}>
                <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="zai">Z-AI (Free)</SelectItem>
                  <SelectItem value="openrouter">OpenRouter</SelectItem>
                  <SelectItem value="ollama">Ollama</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}

          <Button onClick={handleSave} disabled={saving} className="w-full bg-violet-600 text-white hover:bg-violet-700 gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
            {saved ? 'Disimpan!' : 'Simpan Konfigurasi'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// SKILL HUB TAB
// ════════════════════════════════════════════════════════════════

function SkillHubTab() {
  const [results, setResults] = useState<SkillHubResult[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [installing, setInstalling] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!search.trim()) return
    setLoading(true)
    try {
      const data = await apiFetch<{ skills: SkillHubResult[] }>(`/api/v1/hermes/skill-hub?search=${encodeURIComponent(search)}`)
      setResults(data.skills || [])
    } catch { setResults([]) }
    setLoading(false)
  }

  const handleInstall = async (name: string) => {
    setInstalling(name)
    try {
      await apiFetch('/api/v1/hermes/skill-hub', {
        method: 'POST',
        body: JSON.stringify({ name }),
      })
    } catch { /* error */ }
    setInstalling(null)
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Skill Hub — Komuniti</h3>
        <p className="text-[10px] text-muted-foreground">Cari dan pasang skill dari direktori komuniti (agentskills.io)</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Cari skill komuniti..." className="pl-9 h-9" />
        </div>
        <Button onClick={handleSearch} disabled={loading} size="sm" className="h-9 gap-1.5 bg-violet-600 text-white hover:bg-violet-700">
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
          Cari
        </Button>
      </div>

      {results.length === 0 && !loading ? (
        <div className="text-center py-12 text-muted-foreground">
          <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Cari skill dari direktori komuniti</p>
          <p className="text-[10px] mt-1">Contoh: "data analysis", "report", "member management"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {results.map(r => (
            <Card key={r.name} className="border shadow-none">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm">{r.name}</span>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                      <span>👤 {r.author}</span>
                      <span>⬇️ {r.downloads}</span>
                      <span>⭐ {r.rating}</span>
                      <Badge variant="outline" className="text-[8px]">{r.category}</Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] gap-1 shrink-0"
                    disabled={installing === r.name}
                    onClick={() => handleInstall(r.name)}
                  >
                    {installing === r.name ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                    Pasang
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// CONTEXT COMPRESSION TAB
// ════════════════════════════════════════════════════════════════

function CompressionTab() {
  const [history, setHistory] = useState<{ id: string; createdAt: string; tokenCount: number; compressionRatio: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [compressing, setCompressing] = useState(false)

  const loadHistory = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<{ snapshots: typeof history }>('/api/v1/hermes/conversations?compression=true')
      setHistory(data.snapshots || [])
    } catch { setHistory([]) }
    setLoading(false)
  }, [])

  useFetchOnMount(loadHistory)

  const handleCompress = async () => {
    setCompressing(true)
    try {
      await apiFetch('/api/v1/hermes/conversations', {
        method: 'POST',
        body: JSON.stringify({ action: 'compress' }),
      })
      await loadHistory()
    } catch { /* error */ }
    setCompressing(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Mampatan Konteks</h3>
          <p className="text-[10px] text-muted-foreground">Ringkas sembang panjang untuk kekal dalam had token</p>
        </div>
        <Button onClick={handleCompress} disabled={compressing} size="sm" className="gap-1.5 bg-violet-600 text-white hover:bg-violet-700">
          {compressing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Layers className="h-3 w-3" />}
          Mampat Sekarang
        </Button>
      </div>

      <Card className="border shadow-none">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Activity className="h-5 w-5 text-violet-500" />
            <div>
              <p className="text-sm font-medium">Cara Kerja</p>
              <p className="text-[10px] text-muted-foreground">Apabila sembang melebihi had token, sistem akan meringkas mesej lalu dan menyimpan ringkasan sebagai snapshot konteks</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="outline" className="gap-1">📄 Mesej Penuh</Badge>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <Badge variant="outline" className="gap-1">🧠 Ringkasan AI</Badge>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <Badge variant="outline" className="gap-1">💾 Snapshot</Badge>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-violet-500" /></div>
      ) : history.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Layers className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Tiada snapshot mampatan</p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map(h => (
            <Card key={h.id} className="border shadow-none">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Layers className="h-4 w-4 text-violet-500" />
                  <div>
                    <p className="text-sm font-medium">{h.tokenCount.toLocaleString()} tokens</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(h.createdAt).toLocaleString('ms-MY')}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px]">{Math.round(h.compressionRatio * 100)}% nisbah</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// MEMORY PROVIDERS TAB
// ════════════════════════════════════════════════════════════════

function MemoryProvidersTab() {
  const [provider, setProvider] = useState('builtin')
  const [config, setConfig] = useState({ apiKey: '', baseUrl: '', userId: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const providers = [
    { id: 'builtin', name: 'Built-in', desc: 'Penyimpanan SQLite tempatan', icon: <Database className="h-5 w-5" /> },
    { id: 'honcho', name: 'Honcho', desc: 'Honcho Cloud memory', icon: <Cloud className="h-5 w-5" /> },
    { id: 'mem0', name: 'Mem0', desc: 'Mem0 managed memory', icon: <Brain className="h-5 w-5" /> },
    { id: 'hindsight', name: 'Hindsight', desc: 'Plastic Labs Hindsight', icon: <Eye className="h-5 w-5" /> },
  ]

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await apiFetch('/api/v1/hermes/memory-provider', {
        method: 'PUT',
        body: JSON.stringify({ provider, ...config }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch { /* error */ }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Penyedia Memori Luaran</h3>
        <p className="text-[10px] text-muted-foreground">Pilih penyedia storan memori AI</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {providers.map(p => (
          <Card
            key={p.id}
            className={cn(
              'border shadow-none cursor-pointer transition-all',
              provider === p.id ? 'border-violet-600 ring-2 ring-violet-200' : 'hover:border-violet-200',
            )}
            onClick={() => setProvider(p.id)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn('p-2 rounded-xl', provider === p.id ? 'bg-violet-100 text-violet-700' : 'bg-muted/50 text-muted-foreground')}>
                {p.icon}
              </div>
              <div>
                <p className="text-sm font-semibold">{p.name}</p>
                <p className="text-[10px] text-muted-foreground">{p.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {provider !== 'builtin' && (
        <Card className="border shadow-none">
          <CardContent className="p-4 space-y-3">
            <h4 className="text-xs font-semibold">Konfigurasi {providers.find(p => p.id === provider)?.name}</h4>
            <div>
              <Label className="text-xs">API Key</Label>
              <Input value={config.apiKey} onChange={e => setConfig(p => ({ ...p, apiKey: e.target.value }))} placeholder="sk-..." type="password" className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Base URL</Label>
              <Input value={config.baseUrl} onChange={e => setConfig(p => ({ ...p, baseUrl: e.target.value }))} placeholder="https://api.example.com" className="h-9" />
            </div>
            <div>
              <Label className="text-xs">User ID</Label>
              <Input value={config.userId} onChange={e => setConfig(p => ({ ...p, userId: e.target.value }))} placeholder="auto" className="h-9" />
            </div>
          </CardContent>
        </Card>
      )}

      <Button onClick={handleSave} disabled={saving} className="w-full bg-violet-600 text-white hover:bg-violet-700 gap-1.5">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
        {saved ? 'Disimpan!' : 'Simpan'}
      </Button>
    </div>
  )
}

// Cloud icon helper
function Cloud({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    </svg>
  )
}

// ════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════

export default function HermesManagerPage() {
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', label: 'Gambaran', icon: <Activity className="h-4 w-4" /> },
    { id: 'skills', label: 'Skills', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'curator', label: 'Curator', icon: <ClipboardList className="h-4 w-4" /> },
    { id: 'memory', label: 'Memori', icon: <Database className="h-4 w-4" /> },
    { id: 'soul', label: 'SOUL.md', icon: <Brain className="h-4 w-4" /> },
    { id: 'mcp', label: 'MCP', icon: <Server className="h-4 w-4" /> },
    { id: 'subagents', label: 'Subagent', icon: <Bot className="h-4 w-4" /> },
    { id: 'compression', label: 'Konteks', icon: <Layers className="h-4 w-4" /> },
    { id: 'cron', label: 'Cron', icon: <Clock className="h-4 w-4" /> },
    { id: 'platforms', label: 'Platform', icon: <Globe className="h-4 w-4" /> },
    { id: 'auxiliary', label: 'Aux Model', icon: <Cpu className="h-4 w-4" /> },
    { id: 'hub', label: 'Skill Hub', icon: <Sparkles className="h-4 w-4" /> },
    { id: 'providers', label: 'Memori Ext', icon: <Shield className="h-4 w-4" /> },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 shadow-lg shadow-violet-500/20">
          <BrainCircuit className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Hermes Agent Manager</h1>
          <p className="text-sm text-muted-foreground">
            Pengurusan penuh AI Agent — Skills, Curator, Memori, SOUL.md, MCP, Subagent, Cron, Platform &amp; lain-lain
          </p>
        </div>
      </div>

      {/* Phase Badges */}
      <div className="flex flex-wrap gap-2">
        <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] gap-1">
          <CheckCircle2 className="h-3 w-3" /> Fasa 1: Core Learning Loop
        </Badge>
        <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px] gap-1">
          <CheckCircle2 className="h-3 w-3" /> Fasa 2: Extended Capabilities
        </Badge>
        <Badge className="bg-sky-100 text-sky-700 border-0 text-[10px] gap-1">
          <CheckCircle2 className="h-3 w-3" /> Fasa 3: Automation & Platform
        </Badge>
        <Badge className="bg-violet-100 text-violet-700 border-0 text-[10px] gap-1">
          <CheckCircle2 className="h-3 w-3" /> Fasa 4: Advanced
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto scrollbar-none">
          <TabsList className="w-full inline-flex h-auto p-1 bg-muted/50 rounded-xl gap-0.5 mb-4">
            {tabs.map(tab => (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-violet-700 whitespace-nowrap">
                {tab.icon} {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="overview">
          <OverviewTab onNavigate={setActiveTab} />
        </TabsContent>
        <TabsContent value="skills"><SkillsTab /></TabsContent>
        <TabsContent value="curator"><CuratorTab /></TabsContent>
        <TabsContent value="memory"><MemoryTab /></TabsContent>
        <TabsContent value="soul"><SoulTab /></TabsContent>
        <TabsContent value="mcp"><McpTab /></TabsContent>
        <TabsContent value="subagents"><SubagentsTab /></TabsContent>
        <TabsContent value="compression"><CompressionTab /></TabsContent>
        <TabsContent value="cron"><CronTab /></TabsContent>
        <TabsContent value="platforms"><PlatformsTab /></TabsContent>
        <TabsContent value="auxiliary"><AuxiliaryTab /></TabsContent>
        <TabsContent value="hub"><SkillHubTab /></TabsContent>
        <TabsContent value="providers"><MemoryProvidersTab /></TabsContent>
      </Tabs>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// OVERVIEW TAB
// ════════════════════════════════════════════════════════════════

function OverviewTab({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const features = [
    { tab: 'skills', title: 'SKILL.md Format', desc: 'Skill dalam format agentskills.io dengan progressive disclosure (Level 0/1/2)', phase: 1, icon: <BookOpen className="h-5 w-5" />, color: 'from-violet-500 to-purple-600' },
    { tab: 'curator', title: 'Curator System', desc: 'Kitaran hidup skill: active → stale → archived dengan LLM review & consolidation', phase: 1, icon: <ClipboardList className="h-5 w-5" />, color: 'from-emerald-500 to-teal-600' },
    { tab: 'memory', title: 'Enhanced Memory', desc: 'Pattern + LLM extraction, consolidation, nudging, cross-session recall', phase: 1, icon: <Database className="h-5 w-5" />, color: 'from-amber-500 to-orange-600' },
    { tab: 'soul', title: 'SOUL.md Personality', desc: 'Konfigurasi personaliti AI — tone, bahasa, sapaan, arahan kustom', phase: 2, icon: <Brain className="h-5 w-5" />, color: 'from-rose-500 to-pink-600' },
    { tab: 'mcp', title: 'MCP Integration', desc: 'Model Context Protocol — sambung tool & sumber data luaran', phase: 2, icon: <Server className="h-5 w-5" />, color: 'from-sky-500 to-cyan-600' },
    { tab: 'subagents', title: 'Subagent Delegation', desc: 'Tugasan async diurus oleh subagent secara selari', phase: 2, icon: <Bot className="h-5 w-5" />, color: 'from-fuchsia-500 to-purple-600' },
    { tab: 'compression', title: 'Context Compression', desc: 'Mampatan konteks automatik dengan LLM summarization', phase: 2, icon: <Layers className="h-5 w-5" />, color: 'from-teal-500 to-emerald-600' },
    { tab: 'cron', title: 'Built-in Cron', desc: 'Jadualkan tugasan berulang — cron, fixed rate, one-time', phase: 3, icon: <Clock className="h-5 w-5" />, color: 'from-orange-500 to-red-600' },
    { tab: 'platforms', title: 'Multi-Platform Gateway', desc: 'Telegram, Discord, Slack, WhatsApp, Signal, Matrix', phase: 3, icon: <Globe className="h-5 w-5" />, color: 'from-indigo-500 to-violet-600' },
    { tab: 'auxiliary', title: 'Auxiliary Model', desc: 'Lantik model berbeza untuk vision, compression, curator, summarization', phase: 3, icon: <Cpu className="h-5 w-5" />, color: 'from-lime-500 to-green-600' },
    { tab: 'providers', title: 'External Memory', desc: 'Honcho, Mem0, Hindsight — penyedia memori luaran', phase: 4, icon: <Shield className="h-5 w-5" />, color: 'from-slate-500 to-zinc-600' },
    { tab: 'hub', title: 'Skill Hub', desc: 'Cari & pasang skill dari direktori komuniti agentskills.io', phase: 4, icon: <Sparkles className="h-5 w-5" />, color: 'from-pink-500 to-rose-600' },
  ]

  return (
    <div className="space-y-6">
      {/* Architecture Overview */}
      <Card className="border shadow-none overflow-hidden">
        <div className="bg-gradient-to-r from-violet-600 to-purple-700 p-4 text-white">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <BrainCircuit className="h-5 w-5" /> Hermes Agent Architecture
          </h3>
          <p className="text-[10px] text-violet-200 mt-1">Closed Learning Loop — Self-improving AI Agent (inspired by Nous Research Hermes)</p>
        </div>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-center gap-2 text-[10px]">
            <div className="px-3 py-1.5 rounded-xl bg-violet-100 text-violet-700 font-semibold">User Input</div>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <div className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-700 font-semibold">Prompt Builder</div>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <div className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-700 font-semibold">Provider + Model</div>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <div className="px-3 py-1.5 rounded-xl bg-sky-100 text-sky-700 font-semibold">Tool Dispatch</div>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <div className="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-700 font-semibold">Response</div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] mt-3">
            <div className="px-2 py-1 rounded-lg bg-violet-50 text-violet-600">Skills (SKILL.md)</div>
            <div className="px-2 py-1 rounded-lg bg-violet-50 text-violet-600">Memory</div>
            <div className="px-2 py-1 rounded-lg bg-violet-50 text-violet-600">SOUL.md</div>
            <div className="px-2 py-1 rounded-lg bg-violet-50 text-violet-600">MCP Tools</div>
            <div className="px-2 py-1 rounded-lg bg-violet-50 text-violet-600">Subagents</div>
            <div className="px-2 py-1 rounded-lg bg-violet-50 text-violet-600">Curator</div>
          </div>
          <div className="flex items-center justify-center gap-2 mt-3 text-[10px]">
            <span className="text-muted-foreground">Loop:</span>
            <div className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600">Auto-Learn Skill</div>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <div className="px-2 py-1 rounded-lg bg-amber-50 text-amber-600">Curator Review</div>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <div className="px-2 py-1 rounded-lg bg-rose-50 text-rose-600">Memory Extract</div>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">→ Next turn is smarter ✨</span>
          </div>
        </CardContent>
      </Card>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {features.map(f => (
          <Card
            key={f.tab}
            className="border shadow-none cursor-pointer hover:shadow-md transition-all group"
            onClick={() => onNavigate(f.tab)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={cn('p-2.5 rounded-xl bg-gradient-to-br text-white shrink-0', f.color)}>
                  {f.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm group-hover:text-violet-700 transition-colors">{f.title}</span>
                    <Badge variant="outline" className="text-[8px] px-1 py-0">Fasa {f.phase}</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{f.desc}</p>
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Urus</span> <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
