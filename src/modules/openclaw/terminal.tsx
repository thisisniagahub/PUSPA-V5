'use client';

import { useEffect, useState } from 'react'
import { ExternalLink, MonitorSmartphone, RefreshCw, TerminalSquare } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import type { OpenClawSnapshot } from '@/lib/openclaw'

export default function TerminalPage() {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><TerminalSquare className="h-6 w-6" />Console Operator</h1>
          <p className="text-muted-foreground mt-1">Aksi operator kekal di live console, status di sini datang terus dari VPS</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></Button>
          {snapshot?.controlUrl ? <Button size="sm" asChild><a href={snapshot.controlUrl} target="_blank" rel="noreferrer">Buka Console<ExternalLink className="ml-1 h-4 w-4" /></a></Button> : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Gateway</p><p className="text-2xl font-bold">{snapshot?.gateway.connected ? 'LIVE' : loading ? '...' : 'OFFLINE'}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Latency</p><p className="text-2xl font-bold">{snapshot?.gateway.latencyMs ?? 0}ms</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Accounts</p><p className="text-2xl font-bold">{snapshot?.channels.total ?? 0}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Live handoff</CardTitle>
          <CardDescription>PUSPA tunjuk runtime truth, execution sebenar stay di control panel live</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1"><MonitorSmartphone className="h-3 w-3" />{snapshot?.controlUrl || 'https://operator.gangniaga.my'}</Badge>
            <Badge variant={snapshot?.gateway.connected ? 'default' : 'outline'}>{snapshot?.gateway.status || 'unknown'}</Badge>
          </div>
          <p className="text-muted-foreground">Ini elak fake terminal dalam app. Bila klik console, operator terus masuk permukaan live sebenar.</p>
        </CardContent>
      </Card>
    </div>
  )
}
