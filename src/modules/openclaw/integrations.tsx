'use client';

import { useEffect, useState } from 'react'
import { Brain, ExternalLink, Link2, MessageSquare, RefreshCw, Server, Webhook, Workflow } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import type { OpenClawSnapshot } from '@/lib/openclaw'

interface HookInfo {
  id: string
  name?: string
  path: string
  session?: string
  enabled?: boolean
}

export default function IntegrationsPage() {
  const [snapshot, setSnapshot] = useState<OpenClawSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [gatewayHooks, setGatewayHooks] = useState<HookInfo[]>([])
  const [gatewayOnline, setGatewayOnline] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      try {
        setSnapshot(await api.get<OpenClawSnapshot>('/openclaw/snapshot'))
      } catch { /* bridge offline */ }
      try {
        const hooks = await api.get<HookInfo[]>('/openclaw/gateway/hooks')
        setGatewayHooks(hooks)
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Link2 className="h-6 w-6" />Gateway & Channel</h1>
        <p className="text-muted-foreground mt-1">
          {gatewayOnline ? 'Gateway & Hooks langsung dari REST API' : 'PUSPA baca runtime AI Ops live dari VPS bridge'}
        </p>
      </div>

      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2"><Server className="h-4 w-4" />Gateway Operasi</CardTitle>
              <CardDescription>Sambungan real ke OpenClaw Gateway</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={load} disabled={loading}><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /></Button>
              {snapshot?.controlUrl ? <Button size="sm" asChild><a href={snapshot.controlUrl} target="_blank" rel="noreferrer">Buka Live<ExternalLink className="ml-1 h-3.5 w-3.5" /></a></Button> : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap gap-2">
            <Badge className={snapshot?.gateway.connected ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}>{snapshot?.gateway.connected ? 'LIVE' : loading ? 'CHECKING' : 'OFFLINE'}</Badge>
            {snapshot?.gateway.status ? <Badge variant="outline">status: {snapshot.gateway.status}</Badge> : null}
            <Badge variant="outline">latency: {snapshot?.gateway.latencyMs ?? 0}ms</Badge>
            <Badge variant="outline">checked: {snapshot?.generatedAt ? new Date(snapshot.generatedAt).toLocaleString('ms-MY') : '-'}</Badge>
          </div>
          <p className="font-mono text-xs break-all">{snapshot?.controlUrl || 'https://operator.gangniaga.my'}</p>
          {snapshot?.gateway.error ? <p className="text-xs text-rose-600 dark:text-rose-400">{snapshot.gateway.error}</p> : <p className="text-xs text-muted-foreground">Ini runtime live sebenar, bukan shell statik dalam app.</p>}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><MessageSquare className="h-5 w-5" /><div><p className="text-sm text-muted-foreground">Connected channels</p><p className="text-2xl font-bold">{snapshot?.channels.connected ?? 0}/{snapshot?.channels.total ?? 0}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><Brain className="h-5 w-5" /><div><p className="text-sm text-muted-foreground">Model fallbacks</p><p className="text-2xl font-bold">{snapshot?.models.fallbacks.length ?? 0}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><Workflow className="h-5 w-5" /><div><p className="text-sm text-muted-foreground">Cron jobs</p><p className="text-2xl font-bold">{snapshot?.automation.cron.length ?? 0}</p></div></div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Channels from bridge */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Channels</CardTitle>
            <CardDescription>Live account state dari gateway operasi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {(snapshot?.channels.items ?? []).map((channel) => (
              <div key={`${channel.channelId}-${channel.accountId}`} className="rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{channel.channelId} / {channel.accountId}</p>
                    <p className="text-xs text-muted-foreground">{channel.label || 'label unavailable'}</p>
                  </div>
                  <Badge variant={channel.connected ? 'default' : 'outline'}>{channel.healthState}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {channel.mode ? <Badge variant="outline">mode: {channel.mode}</Badge> : null}
                  {channel.lastEventAt ? <Badge variant="outline">last: {new Date(channel.lastEventAt).toLocaleString('ms-MY')}</Badge> : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Hooks from Gateway API */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Webhook className="h-4 w-4" />Webhooks</CardTitle>
            <CardDescription>
              {gatewayOnline ? 'Hooks langsung dari Gateway REST API' : 'Route yang boleh dipakai sebagai entrypoint automasi'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {gatewayOnline && gatewayHooks.map((hook) => (
              <div key={hook.id} className="rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{hook.name || hook.id}</p>
                  <Badge variant={hook.enabled !== false ? 'default' : 'outline'}>{hook.enabled !== false ? 'active' : 'disabled'}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="gap-1"><Webhook className="h-3 w-3" />{hook.path}</Badge>
                  {hook.session ? <Badge variant="outline">session: {hook.session}</Badge> : null}
                </div>
              </div>
            ))}
            {!gatewayOnline && (snapshot?.plugins.webhookRoutes ?? []).map((route) => (
              <div key={route.key} className="rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{route.key}</span>
                  <Badge variant="outline" className="gap-1"><Webhook className="h-3 w-3" />webhook</Badge>
                </div>
                <p className="mt-2 font-mono text-xs break-all">{route.path || 'path unavailable'}</p>
              </div>
            ))}
            {!gatewayOnline && !snapshot?.plugins.webhookRoutes?.length && (
              <p className="text-sm text-muted-foreground">Tiada webhook tersedia</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Model aliases */}
      {snapshot?.models.aliases && Object.keys(snapshot.models.aliases).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Model aliases</CardTitle>
            <CardDescription>Alias yang boleh dipakai oleh automasi</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {Object.entries(snapshot.models.aliases).map(([alias, model]) => (
              <div key={alias} className="flex items-center gap-2 rounded-lg border p-2">
                <Badge>{alias}</Badge>
                <p className="font-mono text-xs break-all">{model}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
