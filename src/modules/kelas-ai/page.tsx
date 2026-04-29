'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { GraduationCap, Laptop, Target, Users, WalletCards } from 'lucide-react'

const phases = [
  { title: 'Fasa 1 — Asas Digital', weeks: 'Minggu 1-4', output: 'Email, akaun AI, prompt templates, halaman web peribadi' },
  { title: 'Fasa 2 — Vibe Coding', weeks: 'Minggu 5-8', output: 'Landing page, app data, mini full-stack app, deployment' },
  { title: 'Fasa 3 — Capstone & Kerjaya', weeks: 'Minggu 9-12', output: 'Projek capstone, portfolio, profil freelance, Demo Day' },
]

const sponsorship = [
  { tier: 'Platinum', amount: 'RM50,000', detail: 'Naming rights, laporan impak eksklusif, peluang rekrut graduan' },
  { tier: 'Gold', amount: 'RM25,000', detail: 'Logo banner & sijil, mentor syarikat, laporan impak' },
  { tier: 'Silver', amount: 'RM10,000', detail: 'Logo sijil & website, ringkasan impak' },
  { tier: 'Community', amount: 'RM5,000 / barangan', detail: 'Laptop, WiFi, meja, makanan atau sokongan komuniti' },
]

const kpis = [
  { label: 'Kehadiran', value: 80 },
  { label: 'Tamat program', value: 75 },
  { label: 'Portfolio GitHub', value: 100 },
  { label: 'Freelance aktif', value: 60 },
]

export default function KelasAIPage() {
  return (
    <div className="space-y-6 p-6 text-foreground">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card/80 p-6 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-black/30 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <Badge className="w-fit bg-cyan-500/15 text-cyan-700 hover:bg-cyan-500/15 dark:bg-cyan-500/20 dark:text-cyan-200 dark:hover:bg-cyan-500/20">Program Tajaan</Badge>
          <h1 className="text-3xl font-bold tracking-tight text-pretty">Kelas AI & Vibe Coding Untuk Asnaf</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Dari Asnaf ke Digital Entrepreneur — program 12 minggu untuk melatih peserta membina web app, portfolio dan peluang pendapatan dengan bantuan AI.
          </p>
        </div>
        <div className="space-y-1 text-left lg:text-right">
          <Button disabled className="bg-cyan-600 text-white disabled:opacity-70 dark:bg-cyan-500 dark:text-black">Buka Pelan Pelaksanaan</Button>
          <p className="text-xs text-muted-foreground">CTA belum disambungkan kepada pelan pelaksanaan.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: Users, label: 'Peserta / Batch', value: '20-30', desc: '2 batch setahun' },
          { icon: Laptop, label: 'Tempoh Latihan', value: '12 Minggu', desc: '36 sesi / 108 jam' },
          { icon: WalletCards, label: 'Bajet Ideal', value: 'RM100K', desc: 'Minimum viable RM35K-45K' },
          { icon: Target, label: 'Sasaran Outcome', value: '40%', desc: 'Kerja/freelance aktif 6 bulan' },
        ].map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.label} className="border-border bg-card text-card-foreground dark:border-white/10 dark:bg-white/5 dark:text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
                <Icon aria-hidden="true" className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{item.value}</div>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Tabs defaultValue="kurikulum" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 bg-muted lg:w-[560px] lg:grid-cols-4 dark:bg-black/40">
          <TabsTrigger value="kurikulum">Kurikulum</TabsTrigger>
          <TabsTrigger value="tajaan">Tajaan</TabsTrigger>
          <TabsTrigger value="impak">Impak</TabsTrigger>
          <TabsTrigger value="integrasi">Integrasi</TabsTrigger>
        </TabsList>
        <TabsContent value="kurikulum" className="grid gap-4 md:grid-cols-3">
          {phases.map((phase) => (
            <Card key={phase.title} className="border-border bg-card text-card-foreground dark:border-white/10 dark:bg-white/5 dark:text-white">
              <CardHeader>
                <CardTitle className="text-base">{phase.title}</CardTitle>
                <CardDescription>{phase.weeks}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{phase.output}</CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="tajaan" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {sponsorship.map((item) => (
            <Card key={item.tier} className="border-border bg-card text-card-foreground dark:border-white/10 dark:bg-white/5 dark:text-white">
              <CardHeader>
                <CardTitle>{item.tier}</CardTitle>
                <CardDescription>{item.amount}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{item.detail}</CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="impak" className="grid gap-4 md:grid-cols-2">
          {kpis.map((kpi) => (
            <Card key={kpi.label} className="border-border bg-card text-card-foreground dark:border-white/10 dark:bg-white/5 dark:text-white">
              <CardHeader>
                <CardTitle className="text-sm">{kpi.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Progress value={kpi.value} />
                <p className="text-sm text-muted-foreground">Sasaran {kpi.value}%</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="integrasi">
          <Card className="border-border bg-card text-card-foreground dark:border-white/10 dark:bg-white/5 dark:text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-cyan-600 dark:text-cyan-300" /> Integrasi PuspaCare</CardTitle>
              <CardDescription>Program ini dihubungkan dengan modul sedia ada.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
              <p>• Programmes: batch kelas dan status pelaksanaan</p>
              <p>• Members: peserta asnaf dan keluarga</p>
              <p>• Volunteers: mentor dan instructor</p>
              <p>• Donations: sponsorship masuk</p>
              <p>• Disbursements: kos operasi program</p>
              <p>• Gudang Barangan: laptop terpakai untuk peserta</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
