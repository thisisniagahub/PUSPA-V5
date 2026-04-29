'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, LockKeyhole, Mail } from 'lucide-react'
import { Toaster, toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/components/auth-provider'

function LoginCard({ loading }: { loading: boolean }) {
  return (
    <Card className="border-white/70 bg-white/80 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.6)] backdrop-blur">
      <CardHeader className="space-y-4 pb-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white ring-1 ring-slate-200 shadow-md">
            <Image
              src="/puspa-logo-official.png"
              alt="PUSPA"
              width={36}
              height={36}
              className="object-contain drop-shadow-sm"
              priority
              unoptimized
            />
          </div>
          <div>
            <CardTitle className="text-2xl text-slate-950">Log masuk PUSPA</CardTitle>
            <CardDescription className="text-sm text-slate-600">
              Gunakan akaun staf yang sah untuk mengakses platform.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-40 items-center justify-center text-slate-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Memuatkan borang log masuk...
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const callbackUrl = useMemo(() => {
    const value = searchParams.get('callbackUrl')

    if (value && value.startsWith('/')) {
      return value
    }

    return '/'
  }, [searchParams])

  useEffect(() => {
    if (user && !authLoading) {
      router.replace(callbackUrl)
    }
  }, [callbackUrl, router, user, authLoading])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!email.trim() || !password) {
      toast.error('Sila masukkan emel dan kata laluan anda.')
      return
    }

    setIsSubmitting(true)

    const result = await signIn(email.trim().toLowerCase(), password)

    setIsSubmitting(false)

    if (!result.success) {
      toast.error('Log masuk gagal. Semak emel dan kata laluan anda.')
      return
    }

    router.replace(callbackUrl)
    router.refresh()
  }

  return (
    <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
      <section className="hidden rounded-[32px] border border-white/50 bg-white/35 p-8 shadow-[0_30px_90px_-45px_rgba(76,29,149,0.55)] backdrop-blur xl:block">
        <div className="max-w-lg space-y-6">
          <div className="inline-flex items-center gap-3 rounded-full border border-violet-200/70 bg-white px-4 py-2 text-sm font-medium text-violet-900 shadow-sm">
            <Image
              src="/puspa-logo-official.png"
              alt="PUSPA"
              width={28}
              height={28}
              className="object-contain drop-shadow-sm"
              unoptimized
            />
            Sistem Pengurusan NGO PUSPA
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
              Akses selamat untuk operasi kebajikan yang sensitif.
            </h1>
            <p className="text-base leading-7 text-slate-600">
              Log masuk untuk mengurus ahli asnaf, kes bantuan, audit trail, dan modul pematuhan
              dalam satu ruang kerja berpusat.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              'Akses ikut peranan',
              'Sesi berasaskan token',
              'Kawalan API lebih ketat',
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/70 bg-white/75 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Card className="border-white/70 bg-white/80 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.6)] backdrop-blur">
        <CardHeader className="space-y-4 pb-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white ring-1 ring-slate-200 shadow-md">
              <Image
                src="/puspa-logo-official.png"
                alt="PUSPA"
                width={36}
                height={36}
                className="object-contain drop-shadow-sm"
                priority
                unoptimized
              />
            </div>
            <div>
              <CardTitle className="text-2xl text-slate-950">Log masuk PUSPA</CardTitle>
              <CardDescription className="text-sm text-slate-600">
                Gunakan akaun staf yang sah untuk mengakses platform.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Emel</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@puspa.org.my"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-11 border-slate-200 bg-white pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Kata Laluan</Label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Masukkan kata laluan"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-11 border-slate-200 bg-white pl-10"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="h-11 w-full bg-[linear-gradient(135deg,#4B0082,#6D28D9)] text-white shadow-lg shadow-violet-200 hover:opacity-95"
              disabled={isSubmitting || authLoading}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sedang mengesahkan...
                </>
              ) : (
                'Log masuk'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(75,0,130,0.18),_transparent_40%),linear-gradient(135deg,_#f8fafc_0%,_#eef2ff_45%,_#f5f3ff_100%)]">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.55),transparent_45%,rgba(255,255,255,0.18))]" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10 sm:px-6">
        <Suspense fallback={<LoginCard loading />}>
          <LoginContent />
        </Suspense>
      </div>
      <Toaster position="top-right" richColors />
    </main>
  )
}
