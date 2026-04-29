'use client';

import { useEffect, useState } from 'react'
import { Brain, ExternalLink, KeyRound, RefreshCw, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import type { OpenClawSnapshot } from '@/lib/openclaw'

export default function ModelsPage() {
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
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Brain className="h-6 w-6" />Enjin Model</h1>
          <p className="text-muted-foreground mt-1">Live model config dan auth footprint dari AI Ops VPS</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></Button>
          {snapshot?.controlUrl ? <Button size="sm" asChild><a href={snapshot.controlUrl} target="_blank" rel="noreferrer">Buka Live<ExternalLink className="ml-1 h-4 w-4" /></a></Button> : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Default</p><p className="text-sm font-semibold break-all">{snapshot?.models.resolvedDefault || '-'}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Fallbacks</p><p className="text-2xl font-bold">{snapshot?.models.fallbacks.length ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Allowed models</p><p className="text-2xl font-bold">{snapshot?.models.allowedCount ?? 0}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fallback chain</CardTitle>
          <CardDescription>Ini live fallback chain yang PUSPA baca dari bridge</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {(snapshot?.models.fallbacks ?? []).map((model) => <Badge key={model} variant="outline">{model}</Badge>)}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {(snapshot?.models.oauthProviders ?? []).map((provider) => (
          <Card key={provider.provider}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">{provider.provider}</CardTitle>
                <Badge variant="outline">{provider.profileCount} profiles</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2 text-sm">
              <Badge className="bg-emerald-600 hover:bg-emerald-700 gap-1"><ShieldCheck className="h-3 w-3" />oauth {provider.oauthCount}</Badge>
              <Badge variant="outline" className="gap-1"><KeyRound className="h-3 w-3" />api keys {provider.apiKeyCount}</Badge>
              <Badge variant="outline">tokens {provider.tokenCount}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
