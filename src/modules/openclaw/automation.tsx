'use client';

import { useEffect, useState } from 'react'
import { Bot, Clock3, ExternalLink, RefreshCw, Trash2, Workflow, Plus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import type { OpenClawSnapshot } from '@/lib/openclaw'

interface CronJob {
  id: string
  name?: string
  enabled: boolean
  schedule: string
  task: string
  session?: string
  lastRunAt?: number | null
  lastRunStatus?: string | null
  nextRunAt?: number | null
}

export default function AutomationPage() {
  const [snapshot, setSnapshot] = useState<OpenClawSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [gatewayCron, setGatewayCron] = useState<CronJob[]>([])
  const [gatewayOnline, setGatewayOnline] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newCron, setNewCron] = useState({ name: '', schedule: '', task: '', session: '' })
  const [creating, setCreating] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      try {
        setSnapshot(await api.get<OpenClawSnapshot>('/openclaw/snapshot'))
      } catch { /* bridge offline */ }
      try {
        const jobs = await api.get<CronJob[]>('/openclaw/gateway/cron')
        setGatewayCron(jobs)
        setGatewayOnline(true)
      } catch {
        setGatewayOnline(false)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreateCron = async () => {
    if (!newCron.name || !newCron.schedule || !newCron.task) return
    setCreating(true)
    try {
      await api.post('/openclaw/gateway/cron', {
        name: newCron.name,
        schedule: newCron.schedule,
        task: newCron.task,
        session: newCron.session || undefined,
        enabled: true,
      })
      setCreateDialogOpen(false)
      setNewCron({ name: '', schedule: '', task: '', session: '' })
      await load()
    } catch (error) {
      console.error('Failed to create cron job:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteCron = async (id: string) => {
    try {
      await api.delete(`/openclaw/gateway/cron/${id}`)
      await load()
    } catch (error) {
      console.error('Failed to delete cron job:', error)
    }
  }

  const tasks = snapshot?.automation.tasks

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Workflow className="h-6 w-6" />Automasi Latar</h1>
          <p className="text-muted-foreground mt-1">
            {gatewayOnline ? 'Cron jobs langsung dari Gateway REST API — boleh cipta & padam' : 'Cron dan background task live dari AI Ops VPS'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></Button>
          {gatewayOnline && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" />Cron Baru</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cipta Cron Job</DialogTitle>
                  <DialogDescription>Jadualkan tugas berulang pada Gateway OpenClaw</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cron-name">Nama</Label>
                    <Input id="cron-name" placeholder="contoh: laporan-harian" value={newCron.name} onChange={(e) => setNewCron(prev => ({ ...prev, name: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cron-schedule">Jadual (cron expression)</Label>
                    <Input id="cron-schedule" placeholder="contoh: 0 9 * * *" value={newCron.schedule} onChange={(e) => setNewCron(prev => ({ ...prev, schedule: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cron-task">Tugas (prompt)</Label>
                    <Input id="cron-task" placeholder="contoh: Himpun laporan harian" value={newCron.task} onChange={(e) => setNewCron(prev => ({ ...prev, task: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cron-session">Sesi (opsional)</Label>
                    <Input id="cron-session" placeholder="contoh: main" value={newCron.session} onChange={(e) => setNewCron(prev => ({ ...prev, session: e.target.value }))} />
                  </div>
                  <Button onClick={handleCreateCron} disabled={creating || !newCron.name || !newCron.schedule || !newCron.task} className="w-full">
                    {creating ? 'Mencipta...' : 'Cipta Cron Job'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          {snapshot?.controlUrl ? <Button size="sm" asChild><a href={snapshot.controlUrl} target="_blank" rel="noreferrer">Buka Live<ExternalLink className="ml-1 h-4 w-4" /></a></Button> : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Cron jobs</p><p className="text-2xl font-bold">{gatewayOnline ? gatewayCron.length : (snapshot?.automation.cron.length ?? 0)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Tasks tracked</p><p className="text-2xl font-bold">{tasks?.total ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Running</p><p className="text-2xl font-bold">{tasks?.byStatus.running ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Failed</p><p className="text-2xl font-bold">{tasks?.byStatus.failed ?? 0}</p></CardContent></Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {/* Cron jobs - Gateway API */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cron jobs</CardTitle>
            <CardDescription>
              {gatewayOnline ? 'Live jobs dari Gateway REST API — boleh cipta & padam' : 'Live jobs yang memang wujud atas VPS'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {gatewayOnline ? gatewayCron.map((job) => (
              <div key={job.id} className="rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{job.name || job.id}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={job.enabled ? 'default' : 'outline'}>{job.enabled ? 'enabled' : 'disabled'}</Badge>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteCron(job.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                    </Button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="gap-1"><Clock3 className="h-3 w-3" />{job.schedule || 'schedule n/a'}</Badge>
                  {job.lastRunStatus ? <Badge variant="outline">last: {job.lastRunStatus}</Badge> : null}
                  {job.nextRunAt ? <Badge variant="outline">next: {new Date(job.nextRunAt).toLocaleString('ms-MY')}</Badge> : null}
                  {job.session ? <Badge variant="outline">session: {job.session}</Badge> : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{job.task}</p>
              </div>
            )) : (snapshot?.automation.cron ?? []).map((job) => (
              <div key={job.id} className="rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{job.name}</p>
                  <Badge variant={job.enabled ? 'default' : 'outline'}>{job.enabled ? 'enabled' : 'disabled'}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="gap-1"><Clock3 className="h-3 w-3" />{job.schedule || 'schedule n/a'}</Badge>
                  {job.lastRunStatus ? <Badge variant="outline">last: {job.lastRunStatus}</Badge> : null}
                  {job.nextRunAtMs ? <Badge variant="outline">next: {new Date(job.nextRunAtMs).toLocaleString('ms-MY')}</Badge> : null}
                </div>
              </div>
            ))}
            {!gatewayOnline && !snapshot?.automation.cron?.length && (
              <p className="text-sm text-muted-foreground">Tiada cron job tersedia</p>
            )}
          </CardContent>
        </Card>

        {/* Recent tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent tasks</CardTitle>
            <CardDescription>Snapshot latest background work</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {(tasks?.recent ?? []).map((task) => (
              <div key={task.taskId} className="rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium line-clamp-2">{task.task || task.taskId}</p>
                  <Badge variant="outline">{task.status}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="gap-1"><Bot className="h-3 w-3" />{task.runtime}</Badge>
                  {task.lastEventAt ? <Badge variant="outline">{new Date(task.lastEventAt).toLocaleString('ms-MY')}</Badge> : null}
                </div>
              </div>
            ))}
            {!tasks?.recent?.length && (
              <p className="text-sm text-muted-foreground">Tiada recent task tersedia</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
