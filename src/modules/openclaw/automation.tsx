'use client';

import { useEffect, useState } from 'react'
import { Bot, Clock3, ExternalLink, RefreshCw, Workflow } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import type { OpenClawSnapshot } from '@/lib/openclaw'

export default function AutomationPage() {
  const [snapshot, setSnapshot] = useState<OpenClawSnapshot | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      setLoading(true)
      setSnapshot(await api.get<OpenClawSnapshot>('/openclaw/snapshot'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const tasks = snapshot?.automation.tasks

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Workflow className="h-6 w-6" />Automasi Latar</h1>
          <p className="text-muted-foreground mt-1">Cron dan background task live dari AI Ops VPS</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></Button>
          {snapshot?.controlUrl ? <Button size="sm" asChild><a href={snapshot.controlUrl} target="_blank" rel="noreferrer">Buka Live<ExternalLink className="ml-1 h-4 w-4" /></a></Button> : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Cron jobs</p><p className="text-2xl font-bold">{snapshot?.automation.cron.length ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Tasks tracked</p><p className="text-2xl font-bold">{tasks?.total ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Running</p><p className="text-2xl font-bold">{tasks?.byStatus.running ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Failed</p><p className="text-2xl font-bold">{tasks?.byStatus.failed ?? 0}</p></CardContent></Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cron jobs</CardTitle>
            <CardDescription>Live jobs yang memang wujud atas VPS</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(snapshot?.automation.cron ?? []).map((job) => (
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent tasks</CardTitle>
            <CardDescription>Snapshot latest background work</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
