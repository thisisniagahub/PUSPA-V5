'use client';

import { useEffect, useState } from 'react'
import { ExternalLink, MonitorSmartphone, RefreshCw, TerminalSquare } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import type { OpenClawSnapshot } from '@/lib/openclaw'

interface GatewayStatusInfo {
  status: string
  version?: string
  uptime?: number
  sessions?: number
}

export default function TerminalPage() {
  const [snapshot, setSnapshot] = useState<OpenClawSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatusInfo | null>(null)
  const [gatewayUrl, setGatewayUrl] = useState<string>('')

  const load = async () => {
    try {
      setLoading(true)
      try {
        setSnapshot(await api.get<OpenClawSnapshot>('/openclaw/snapshot'))
      } catch { /* bridge offline */ }
      try {
        const status = await api.get<GatewayStatusInfo & { gatewayUrl?: string }>('/openclaw/status')
        if (status.gatewayUrl) setGatewayUrl(status.gatewayUrl)
        if (status.connected || status.status === 'ok') {
          setGatewayStatus(status)
        }
      } catch { /* gateway offline */ }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const consoleUrl = gatewayUrl || snapshot?.controlUrl || 'https://operator.gangniaga.my'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><TerminalSquare className="h-6 w-6" />Console Operator</h1>
          <p className="text-muted-foreground mt-1">
            {gatewayStatus ? `Gateway v${gatewayStatus.version} — ${gatewayStatus.sessions} sesi` : 'Aksi operator kekal di live console'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></Button>
          <Button size="sm" asChild>
            <a href={consoleUrl} target="_blank" rel="noreferrer">
              Buka Console <ExternalLink className="ml-1 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Gateway</p><p className="text-2xl font-bold">{gatewayStatus ? 'LIVE' : snapshot?.gateway.connected ? 'BRIDGE' : loading ? '...' : 'OFFLINE'}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Latency</p><p className="text-2xl font-bold">{snapshot?.gateway.latencyMs ?? 0}ms</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Sessions</p><p className="text-2xl font-bold">{gatewayStatus?.sessions ?? snapshot?.channels.total ?? 0}</p></CardContent></Card>
      </div>

      {/* Gateway API Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gateway REST API</CardTitle>
          <CardDescription>OpenClaw Gateway mendedahkan REST API pada port 18789 secara default</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="space-y-2">
            <p className="font-medium">Endpoint Utama:</p>
            <div className="grid gap-1.5 font-mono text-xs">
              <div className="flex items-center gap-2"><Badge variant="outline" className="w-16 justify-center">GET</Badge><code>/api/status</code><span className="text-muted-foreground">— Health check (tanpa auth)</span></div>
              <div className="flex items-center gap-2"><Badge variant="outline" className="w-16 justify-center">GET</Badge><code>/api/sessions</code><span className="text-muted-foreground">— Senarai sesi</span></div>
              <div className="flex items-center gap-2"><Badge variant="outline" className="w-16 justify-center">POST</Badge><code>/api/sessions/main/messages</code><span className="text-muted-foreground">— Hantar mesej</span></div>
              <div className="flex items-center gap-2"><Badge variant="outline" className="w-16 justify-center">GET</Badge><code>/api/sessions/:key/history</code><span className="text-muted-foreground">— Baca sejarah</span></div>
              <div className="flex items-center gap-2"><Badge variant="outline" className="w-16 justify-center">GET</Badge><code>/api/cron</code><span className="text-muted-foreground">— Senarai cron jobs</span></div>
              <div className="flex items-center gap-2"><Badge variant="outline" className="w-16 justify-center">POST</Badge><code>/api/cron</code><span className="text-muted-foreground">— Cipta cron job</span></div>
              <div className="flex items-center gap-2"><Badge variant="outline" className="w-16 justify-center">GET</Badge><code>/api/hooks</code><span className="text-muted-foreground">— Senarai webhooks</span></div>
              <div className="flex items-center gap-2"><Badge variant="outline" className="w-16 justify-center">GET</Badge><code>/api/skills</code><span className="text-muted-foreground">— Senarai skills</span></div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-medium">Auth:</p>
            <code className="block rounded-lg bg-muted p-2 text-xs">Authorization: Bearer &lt;OPENCLAW_GATEWAY_TOKEN&gt;</code>
          </div>

          <div className="space-y-2">
            <p className="font-medium">Live handoff:</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="gap-1"><MonitorSmartphone className="h-3 w-3" />{consoleUrl}</Badge>
              <Badge variant={gatewayStatus ? 'default' : snapshot?.gateway.connected ? 'default' : 'outline'}>{gatewayStatus ? 'live' : snapshot?.gateway.status || 'unknown'}</Badge>
            </div>
            <p className="text-muted-foreground">Bila klik console, operator terus masuk permukaan live sebenar.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
