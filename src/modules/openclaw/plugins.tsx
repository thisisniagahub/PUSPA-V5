'use client';

import { useEffect, useState } from 'react'
import { ExternalLink, Plug, RefreshCw, Webhook } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import type { OpenClawSnapshot } from '@/lib/openclaw'

interface SkillInfo {
  id: string
  name?: string
  description?: string
  enabled?: boolean
  path?: string
}

export default function PluginsPage() {
  const [snapshot, setSnapshot] = useState<OpenClawSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [gatewaySkills, setGatewaySkills] = useState<SkillInfo[]>([])
  const [gatewayOnline, setGatewayOnline] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      try {
        setSnapshot(await api.get<OpenClawSnapshot>('/openclaw/snapshot'))
      } catch { /* bridge offline */ }
      try {
        const skills = await api.get<SkillInfo[]>('/openclaw/gateway/skills')
        setGatewaySkills(skills)
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Plug className="h-6 w-6" />Sambungan</h1>
          <p className="text-muted-foreground mt-1">
            {gatewayOnline ? 'Plugin & Skills langsung dari Gateway REST API' : 'Plugin entries dan webhook routes live dari config AI Ops'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></Button>
          {snapshot?.controlUrl ? <Button size="sm" asChild><a href={snapshot.controlUrl} target="_blank" rel="noreferrer">Buka Live<ExternalLink className="ml-1 h-4 w-4" /></a></Button> : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Plugin entries from bridge */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plugin entries</CardTitle>
            <CardDescription>Terus baca dari config gateway operasi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {(snapshot?.plugins.entries ?? []).map((plugin) => (
              <div key={plugin.key} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <span className="font-medium">{plugin.key}</span>
                <Badge variant={plugin.enabled ? 'default' : 'outline'}>{plugin.enabled ? 'enabled' : 'disabled'}</Badge>
              </div>
            ))}
            {!snapshot?.plugins.entries?.length && (
              <p className="text-sm text-muted-foreground">Tiada plugin dari bridge</p>
            )}
          </CardContent>
        </Card>

        {/* Skills from Gateway API */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Webhook className="h-4 w-4" />Skills (Gateway API)</CardTitle>
            <CardDescription>
              {gatewayOnline ? 'Skills langsung dari Gateway REST API' : 'Route yang boleh dipakai sebagai entrypoint automasi'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {gatewayOnline ? gatewaySkills.map((skill) => (
              <div key={skill.id} className="rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{skill.name || skill.id}</span>
                  <Badge variant={skill.enabled !== false ? 'default' : 'outline'}>{skill.enabled !== false ? 'enabled' : 'disabled'}</Badge>
                </div>
                {skill.description ? <p className="mt-1 text-xs text-muted-foreground">{skill.description}</p> : null}
                {skill.path ? <p className="mt-1 font-mono text-xs break-all text-muted-foreground">{skill.path}</p> : null}
              </div>
            )) : (snapshot?.plugins.webhookRoutes ?? []).map((route) => (
              <div key={route.key} className="rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{route.key}</span>
                  <Badge variant="outline" className="gap-1"><Webhook className="h-3 w-3" />webhook</Badge>
                </div>
                <p className="mt-2 font-mono text-xs break-all">{route.path || 'path unavailable'}</p>
              </div>
            ))}
            {!gatewayOnline && !snapshot?.plugins.webhookRoutes?.length && (
              <p className="text-sm text-muted-foreground">Tiada skill/webhook tersedia</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
