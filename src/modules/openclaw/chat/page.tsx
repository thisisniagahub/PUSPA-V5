'use client';

import { useState, useRef, useEffect } from 'react'
import { Bot, RefreshCw, Send, Trash2, Plus, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'

interface SessionInfo {
  key: string
  model?: string
  lastMessageAt?: number
  messageCount?: number
  source?: string
}

interface HistoryMsg {
  id?: string
  role: 'system' | 'user' | 'assistant'
  content: string
  timestamp?: number
  model?: string
  tokens?: number
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [messages, setMessages] = useState<Array<{ role: string; content: string; model?: string; tokens?: number }>>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [gatewayOnline, setGatewayOnline] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newSessionKey, setNewSessionKey] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const loadSessions = async () => {
    setLoading(true)
    try {
      const data = await api.get<SessionInfo[]>('/openclaw/gateway/sessions')
      setSessions(data)
      setGatewayOnline(true)
    } catch {
      setGatewayOnline(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [])

  const loadHistory = async (key: string) => {
    setActiveSession(key)
    try {
      const history = await api.get<HistoryMsg[]>(`/openclaw/gateway/sessions/${key}/history`)
      setMessages(history.map(h => ({
        role: h.role,
        content: h.content,
        model: h.model,
        tokens: h.tokens,
      })))
    } catch {
      setMessages([])
    }
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || !activeSession || sending) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setSending(true)
    try {
      const result = await api.post<{ response: string; model: string; tokens?: number }>(
        `/openclaw/gateway/sessions/${activeSession}/messages`,
        { message: userMsg }
      )
      setMessages(prev => [...prev, { role: 'assistant', content: result.response, model: result.model, tokens: result.tokens }])
    } catch (error) {
      setMessages(prev => [...prev, { role: 'error', content: error instanceof Error ? error.message : 'Gagal mendapat respons' }])
    } finally {
      setSending(false)
    }
  }

  const handleCreateSession = async () => {
    try {
      const payload: Record<string, string> = {}
      if (newSessionKey.trim()) payload.key = newSessionKey.trim()
      const session = await api.post<SessionInfo>('/openclaw/gateway/sessions', payload)
      setSessions(prev => [...prev, session])
      setActiveSession(session.key)
      setMessages([])
      setCreateDialogOpen(false)
      setNewSessionKey('')
    } catch (error) {
      console.error('Failed to create session:', error)
    }
  }

  if (!gatewayOnline) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Bot className="h-6 w-6" />Chat AI</h1>
        <Card>
          <CardContent className="p-6 text-center">
            <Bot className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium">Gateway tidak dapat dihubungi</p>
            <p className="text-sm text-muted-foreground mt-1">
              Pastikan OPENCLAW_GATEWAY_URL dan OPENCLAW_GATEWAY_TOKEN telah dikonfigurasikan.
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              Rujuk docs.openclaw.ai untuk panduan konfigurasi Gateway.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Bot className="h-6 w-6" />Chat AI</h1>
          <p className="text-muted-foreground mt-1">Perbualan langsung dengan ejen AI melalui OpenClaw Gateway API</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadSessions} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />Sesi Baru</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cipta Sesi Baru</DialogTitle>
                <DialogDescription>Sesi membolehkan anda berbual dengan ejen AI yang berbeza</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="session-key">Kunci Sesi (opsional)</Label>
                  <Input id="session-key" placeholder="contoh: laporan-harian" value={newSessionKey} onChange={(e) => setNewSessionKey(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Kosongkan untuk auto-generate</p>
                </div>
                <Button onClick={handleCreateSession} className="w-full">Cipta</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 grid gap-4 lg:grid-cols-[280px_1fr] min-h-0">
        {/* Sessions sidebar */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Sesi ({sessions.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-2 max-h-[calc(100vh-300px)] overflow-y-auto">
            <div className="space-y-1">
              {sessions.map((session) => (
                <button
                  key={session.key}
                  onClick={() => loadHistory(session.key)}
                  className={`w-full text-left rounded-lg p-2.5 text-sm transition-colors ${
                    activeSession === session.key ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate font-medium">{session.key}</span>
                  </div>
                  <div className={`text-xs mt-0.5 ${activeSession === session.key ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {session.model || 'default'} · {session.messageCount ?? 0} mesej
                  </div>
                </button>
              ))}
              {sessions.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">Tiada sesi. Cipta satu!</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat area */}
        <Card className="flex flex-col min-h-0">
          {activeSession ? (
            <>
              <CardHeader className="pb-2 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">{activeSession}</CardTitle>
                    <CardDescription>Perbualan dengan ejen AI</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setActiveSession(null); setMessages([]) }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-muted-foreground">Taip mesej untuk memulakan perbualan...</p>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : msg.role === 'error' ? 'justify-center' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                        msg.role === 'user' ? 'bg-primary text-primary-foreground' :
                        msg.role === 'error' ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400' :
                        'bg-muted'
                      }`}>
                        <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                        {msg.role === 'assistant' && msg.model && (
                          <div className="mt-1.5 text-[10px] opacity-60">
                            {msg.model} {msg.tokens ? `· ${msg.tokens} tokens` : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {sending && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-xl px-4 py-2.5 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" />
                        <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.1s]" />
                        <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-3 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Taip mesej anda..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                    disabled={sending}
                    className="flex-1"
                  />
                  <Button onClick={handleSend} disabled={sending || !input.trim()} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3">
                <Bot className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="font-medium">Pilih atau cipta sesi untuk memulakan</p>
                <p className="text-sm text-muted-foreground">Gunakan butang &quot;Sesi Baru&quot; atau pilih dari senarai</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
