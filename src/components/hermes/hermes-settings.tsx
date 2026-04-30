'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, ChevronDown, Eye, EyeOff, Loader2, Save, Zap, Globe, Server } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useHermesStore } from '@/stores/hermes-store'
import { PROVIDERS, type ProviderId } from '@/lib/hermes/provider-types'
import { cn } from '@/lib/utils'

export function HermesSettings() {
  const { providerState, setProviderState, loadProviderConfig } = useHermesStore()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)
  const [localProvider, setLocalProvider] = useState<ProviderId>(providerState.provider)
  const [localModel, setLocalModel] = useState(providerState.model)
  const [localApiKey, setLocalApiKey] = useState('')
  const [localBaseUrl, setLocalBaseUrl] = useState(providerState.baseUrl || '')

  useEffect(() => {
    setLocalProvider(providerState.provider)
    setLocalModel(providerState.model)
    setLocalBaseUrl(providerState.baseUrl || '')
  }, [providerState])

  const currentProvider = PROVIDERS[localProvider]

  const handleProviderChange = (provider: ProviderId) => {
    setLocalProvider(provider)
    setLocalModel(PROVIDERS[provider].defaultModel)
    setTestResult(null)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)

    try {
      const res = await fetch('/api/v1/hermes/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: localProvider,
          model: localModel,
          apiKey: localApiKey || undefined,
          baseUrl: localBaseUrl || undefined,
        }),
      })

      const json = await res.json()
      if (json.success) {
        setSaved(true)
        setLocalApiKey('') // Clear local copy after save
        await loadProviderConfig()
        setTimeout(() => setSaved(false), 2000)
      }
    } catch {
      // Error
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      const res = await fetch('/api/v1/hermes/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello, test connection' }],
          currentView: 'dashboard',
          userRole: 'staff',
          locale: 'en',
        }),
      })

      const json = await res.json()
      setTestResult(json.success ? 'success' : 'error')
    } catch {
      setTestResult('error')
    } finally {
      setTesting(false)
      setTimeout(() => setTestResult(null), 3000)
    }
  }

  return (
    <div className="p-4 space-y-4 bg-zinc-50 dark:bg-zinc-900/50">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">⚙ Tetapan Provider</div>

      {/* Provider Selection */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Provider AI</label>
        <div className="grid grid-cols-3 gap-2">
          {Object.values(PROVIDERS).map((provider) => (
            <button
              key={provider.id}
              onClick={() => handleProviderChange(provider.id)}
              className={cn(
                'flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all',
                localProvider === provider.id
                  ? 'border-violet-600 bg-violet-600 text-white'
                  : 'border-black/5 dark:border-white/10 hover:border-violet-300 hover:bg-violet-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400',
              )}
            >
              <span className="text-lg">{provider.icon}</span>
              <span className="text-[10px] font-medium leading-tight">{provider.name}</span>
              {provider.id !== 'zai' && (
                <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
                  {provider.id === 'openrouter' ? 'Free tier' : 'Local'}
                </Badge>
              )}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground">{currentProvider.description}</p>
      </div>

      {/* Model Selection */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Model</label>
        <div className="relative">
          <select
            value={localModel}
            onChange={(e) => setLocalModel(e.target.value)}
            className="w-full h-9 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-800 px-3 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-500/30"
          >
            {currentProvider.models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} {model.isFree ? '✓ Free' : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* API Key (OpenRouter) */}
      {localProvider === 'openrouter' && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            API Key
            {providerState.hasApiKey && (
              <span className="text-violet-500 ml-2">✓ Disimpan ({providerState.apiKeyPrefix})</span>
            )}
          </label>
          <div className="relative">
            <Input
              type={showApiKey ? 'text' : 'password'}
              value={localApiKey}
              onChange={(e) => setLocalApiKey(e.target.value)}
              placeholder="sk-or-v1-..."
              className="pr-10 text-sm h-9"
            />
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Dapatkan API key percuma di{' '}
            <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-violet-500 underline">
              openrouter.ai/keys
            </a>
          </p>
        </div>
      )}

      {/* Base URL (Ollama) */}
      {localProvider === 'ollama' && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Base URL</label>
          <Input
            value={localBaseUrl}
            onChange={(e) => setLocalBaseUrl(e.target.value)}
            placeholder="http://localhost:11434/v1"
            className="text-sm h-9"
          />
          <p className="text-[10px] text-muted-foreground">
            Pastikan Ollama berjalan di komputer anda. Muat turun di{' '}
            <a href="https://ollama.com" target="_blank" rel="noopener noreferrer" className="text-violet-500 underline">
              ollama.com
            </a>
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button
          onClick={handleSave}
          disabled={saving}
          size="sm"
          className="flex-1 h-8 text-xs gap-1.5 bg-violet-600 text-white hover:bg-violet-700"
        >
          {saving ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : saved ? (
            <Check className="h-3 w-3" />
          ) : (
            <Save className="h-3 w-3" />
          )}
          {saved ? 'Disimpan!' : 'Simpan'}
        </Button>

        <Button
          onClick={handleTestConnection}
          disabled={testing}
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5 border-black/10 dark:border-white/10"
        >
          {testing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Zap className="h-3 w-3" />
          )}
          Uji
        </Button>
      </div>

      {/* Test Result */}
      {testResult && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'text-xs px-3 py-2 rounded-xl border',
            testResult === 'success' ? 'bg-violet-50 text-violet-600 border-violet-100' : 'bg-red-50 text-red-600 border-red-100',
          )}
        >
          {testResult === 'success' ? '✅ Sambungan berjaya!' : '❌ Sambungan gagal. Semak konfigurasi.'}
        </motion.div>
      )}
    </div>
  )
}
