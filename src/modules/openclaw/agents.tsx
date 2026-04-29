'use client';

import { useEffect, useState } from 'react'
import { Bot, Cpu, ExternalLink, MessageSquare, RefreshCw, Send, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { api } from '@/lib/api'
import type { OpenClawSnapshot } from '@/lib/openclaw'

interface SessionInfo {
  key: string
  model?: string
  lastMessageAt?: number
  messageCount?: number
  source?: string
}

export default function AgentsPage() {
  const [snapshot, setSnapshot] = useState<OpenClawSnapshot | null>(null)
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [gatewayOnline, setGatewayOnline] = useState(false)
  const [chatSession, setChatSession] = useState<string | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([])
  const [chatLoading, setChatLoading] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      // Try snapshot first (bridge)
      try {
        setSnapshot(await api.get<OpenClawSnapshot>('/openclaw/snapshot'))
      } catch {
        // Bridge may be offline
      }
      // Try direct Gateway sessions
      try {
        const data = await api.get<SessionInfo[]>('/openclaw/gateway/sessions')
        setSessions(data)
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

  const activeAgents = snapshot?.agents.filter((agent) => (agent.sessionCount || 0) > 0).length ?? 0

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !chatSession) return
    const userMsg = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setChatLoading(true)
    try {
      const result = await api.post<{ response: string; model: string; tokens?: number }>(
        `/openclaw/gateway/sessions/${chatSession}/messages`,
        { message: userMsg }
      )
      setChatMessages(prev => [...prev, { role: 'assistant', content: result.response }])
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'error', content: error instanceof Error ? error.message : 'Failed to get response' }])
    } finally {
      setChatLoading(false)
    }
  }

  const handleCreateSession = async () => {
    try {
      const session = await api.post<SessionInfo>('/openclaw/gateway/sessions', {})
      setSessions(prev => [...prev, session])
      setChatSession(session.key)
      setChatMessages([])
    } catch (error) {
      console.error('Failed to create session:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-6 w-6" />
            Ejen AI
          </h1>
          <p className="text-muted-foreground mt-1">
            {gatewayOnline ? 'Terhubung ke OpenClaw Gateway — sesi & mesej langsung dari API' : 'Live worker AI dari VPS bridge'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          {gatewayOnline && (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" onClick={handleCreateSession}>
                  <Send className="h-4 w-4 mr-1" />
                  Sesi Baru
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Sesi AI Baru</DialogTitle>
                  <DialogDescription>Crekan sesi baru dengan ejen AI melalui Gateway</DialogDescription>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">Klik &quot;Sesi Baru&quot; untuk memulakan perbualan.</p>
              </DialogContent>
            </Dialog>
          )}
          {snapshot?.controlUrl ? (
            <Button size="sm" variant="outline" asChild>
              <a href={snapshot.controlUrl} target="_blank" rel="noreferrer">
                Buka Live <ExternalLink className="ml-1 h-4 w-4" />
              </a>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Worker profiles</p><p className="text-2xl font-bold">{snapshot?.agents.length ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Aktif baru-baru ini</p><p className="text-2xl font-bold">{activeAgents}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Gateway</p><p className="text-2xl font-bold">{gatewayOnline ? 'LIVE' : snapshot?.gateway.connected ? 'BRIDGE' : loading ? '...' : 'OFFLINE'}</p></CardContent></Card>
      </div>

      {/* Gateway Sessions — real API data */}
      {gatewayOnline && sessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4" />Sesi Aktif (Gateway API)</CardTitle>
            <CardDescription>Sesi langsung dari OpenClaw Gateway REST API</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sessions.map((session) => (
                <div key={session.key} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <div>
                    <p className="font-medium">{session.key}</p>
                    <p className="text-xs text-muted-foreground">
                      {session.model || 'default model'} · {session.messageCount ?? 0} mesej
                      {session.lastMessageAt ? ` · Terakhir: ${new Date(session.lastMessageAt).toLocaleString('ms-MY')}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setChatSession(session.key); setChatMessages([]) }}>
                      <MessageSquare className="h-3.5 w-3.5 mr-1" />Chat
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Interface */}
      {chatSession && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Chat: {chatSession}</CardTitle>
                <CardDescription>Perbualan langsung melalui OpenClaw Gateway</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setChatSession(null); setChatMessages([]) }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <ScrollArea className="h-64 w-full rounded-lg border p-3">
              {chatMessages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Taip mesej untuk memulakan perbualan...</p>
              ) : (
                <div className="space-y-3">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`text-sm ${msg.role === 'user' ? 'text-right' : msg.role === 'error' ? 'text-rose-500' : 'text-left'}`}>
                      <span className={`inline-block max-w-[80%] rounded-lg px-3 py-2 ${
                        msg.role === 'user' ? 'bg-primary text-primary-foreground' :
                        msg.role === 'error' ? 'bg-rose-50 dark:bg-rose-950/30' :
                        'bg-muted'
                      }`}>
                        {msg.content}
                      </span>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="text-sm text-muted-foreground text-center">Ejen sedang menaip...</div>
                  )}
                </div>
              )}
            </ScrollArea>
            <div className="flex gap-2">
              <Input
                placeholder="Taip mesej anda..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage() } }}
                disabled={chatLoading}
              />
              <Button onClick={handleSendMessage} disabled={chatLoading || !chatInput.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bridge-based agent profiles */}
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

      {!gatewayOnline && !snapshot?.agents?.length && !loading && (
        <Card>
          <CardContent className="p-6 text-center">
            <Bot className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium">Gateway tidak dapat dihubungi</p>
            <p className="text-sm text-muted-foreground mt-1">
              Pastikan OPENCLAW_GATEWAY_URL dan OPENCLAW_GATEWAY_TOKEN telah dikonfigurasikan.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
