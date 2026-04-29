'use client';

import { useEffect, useState } from 'react'
import { ExternalLink, RefreshCw, Server } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import type { OpenClawSnapshot } from '@/lib/openclaw'

export default function MCPPage() {
  const [snapshot, setSnapshot] = useState<OpenClawSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [gatewaySkills, setGatewaySkills] = useState<Array<{ id: string; name?: string; description?: string; enabled?: boolean }>>([])
  const [gatewayOnline, setGatewayOnline] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      try {
        setSnapshot(await api.get<OpenClawSnapshot>('/openclaw/snapshot'))
      } catch { /* bridge offline */ }
      try {
        const skills = await api.get<Array<{ id: string; name?: string; description?: string; enabled?: boolean }>>('/openclaw/gateway/skills')
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
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Server className="h-6 w-6" />MCP & Skills</h1>
          <p className="text-muted-foreground mt-1">
            {gatewayOnline ? 'MCP servers + Skills langsung dari Gateway API' : 'MCP server inventory live dari config AI Ops'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></Button>
          {snapshot?.controlUrl ? <Button size="sm" asChild><a href={snapshot.controlUrl} target="_blank" rel="noreferrer">Buka Live<ExternalLink className="ml-1 h-4 w-4" /></a></Button> : null}
        </div>
      </div>

      {/* MCP Servers from bridge/snapshot */}
      <div className="grid gap-4 lg:grid-cols-2">
        {(snapshot?.mcp.servers ?? []).map((server) => (
          <Card key={`${server.name}-${server.source || 'source'}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">{server.name}</CardTitle>
                <Badge variant={server.enabled ? 'default' : 'outline'}>{server.enabled ? 'enabled' : 'disabled'}</Badge>
              </div>
              <CardDescription>{server.transport}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-xs break-all text-muted-foreground">{server.source || 'source unavailable'}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Skills from Gateway API */}
      {gatewayOnline && gatewaySkills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Skills (Gateway API)</CardTitle>
            <CardDescription>Skills yang didaftarkan di OpenClaw Gateway</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {gatewaySkills.map((skill) => (
              <div key={skill.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <div>
                  <p className="font-medium">{skill.name || skill.id}</p>
                  {skill.description ? <p className="text-xs text-muted-foreground mt-0.5">{skill.description}</p> : null}
                </div>
                <Badge variant={skill.enabled !== false ? 'default' : 'outline'}>{skill.enabled !== false ? 'active' : 'disabled'}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!snapshot?.mcp.servers?.length && !gatewaySkills.length && !loading && (
        <Card>
          <CardContent className="p-6 text-center">
            <Server className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium">Tiada MCP server atau Skills dijumpai</p>
            <p className="text-sm text-muted-foreground mt-1">
              Pastikan Gateway dikonfigurasikan dan MCP servers telah diaktifkan.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
