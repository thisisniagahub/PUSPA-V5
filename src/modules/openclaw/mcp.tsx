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
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Server className="h-6 w-6" />MCP</h1>
          <p className="text-muted-foreground mt-1">MCP server inventory live dari config AI Ops</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></Button>
          {snapshot?.controlUrl ? <Button size="sm" asChild><a href={snapshot.controlUrl} target="_blank" rel="noreferrer">Buka Live<ExternalLink className="ml-1 h-4 w-4" /></a></Button> : null}
        </div>
      </div>

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
    </div>
  )
}
