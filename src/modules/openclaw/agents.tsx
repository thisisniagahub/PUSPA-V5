'use client';

import { useEffect, useState } from 'react'
import { Bot, Cpu, ExternalLink, MessageSquare, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import type { OpenClawSnapshot } from '@/lib/openclaw'

export default function AgentsPage() {
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

  const activeAgents = snapshot?.agents.filter((agent) => (agent.sessionCount || 0) > 0).length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-6 w-6" />
            Ejen AI
          </h1>
          <p className="text-muted-foreground mt-1">Live worker AI dari VPS, bukan mock list</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          {snapshot?.controlUrl ? (
            <Button size="sm" asChild>
              <a href={snapshot.controlUrl} target="_blank" rel="noreferrer">
                Buka Live
                <ExternalLink className="ml-1 h-4 w-4" />
              </a>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Worker profiles</p><p className="text-2xl font-bold">{snapshot?.agents.length ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Aktif baru-baru ini</p><p className="text-2xl font-bold">{activeAgents}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Gateway</p><p className="text-2xl font-bold">{snapshot?.gateway.connected ? 'LIVE' : loading ? '...' : 'OFFLINE'}</p></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {(snapshot?.agents ?? []).map((agent) => (
          <Card key={agent.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{agent.id}</CardTitle>
                  <CardDescription>{agent.lastUpdatedAt ? new Date(agent.lastUpdatedAt).toLocaleString('ms-MY') : 'Tiada sesi direkodkan'}</CardDescription>
                </div>
                <Badge variant={agent.sessionCount > 0 ? 'default' : 'outline'}>{agent.sessionCount} sesi</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex flex-wrap gap-2">
                {agent.lastModel ? <Badge variant="outline" className="gap-1"><Cpu className="h-3 w-3" />{agent.lastModel}</Badge> : null}
                {agent.lastKey ? <Badge variant="outline" className="gap-1"><MessageSquare className="h-3 w-3" />live session tracked</Badge> : null}
              </div>
              <p className="text-xs text-muted-foreground break-all">{agent.lastKey || 'Belum ada session key baru.'}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
