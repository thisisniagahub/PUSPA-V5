'use client';

import { useEffect, useState } from 'react'
import { ExternalLink, Plug, RefreshCw, Webhook } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import type { OpenClawSnapshot } from '@/lib/openclaw'

export default function PluginsPage() {
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
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Plug className="h-6 w-6" />Sambungan</h1>
          <p className="text-muted-foreground mt-1">Plugin entries dan webhook routes live dari config AI Ops</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></Button>
          {snapshot?.controlUrl ? <Button size="sm" asChild><a href={snapshot.controlUrl} target="_blank" rel="noreferrer">Buka Live<ExternalLink className="ml-1 h-4 w-4" /></a></Button> : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plugin entries</CardTitle>
            <CardDescription>Terus baca dari config gateway operasi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(snapshot?.plugins.entries ?? []).map((plugin) => (
              <div key={plugin.key} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <span className="font-medium">{plugin.key}</span>
                <Badge variant={plugin.enabled ? 'default' : 'outline'}>{plugin.enabled ? 'enabled' : 'disabled'}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Webhook routes</CardTitle>
            <CardDescription>Route yang boleh dipakai sebagai entrypoint automasi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(snapshot?.plugins.webhookRoutes ?? []).map((route) => (
              <div key={route.key} className="rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{route.key}</span>
                  <Badge variant="outline" className="gap-1"><Webhook className="h-3 w-3" />webhook</Badge>
                </div>
                <p className="mt-2 font-mono text-xs break-all">{route.path || 'path unavailable'}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
