'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Gift, Loader2, PackageCheck, Search, ShoppingCart, Warehouse, ArrowDownCircle, ArrowUpCircle, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'

// ─── API Types ────────────────────────────────────────────────────────

interface ApiDonation {
  id: string
  donationNumber: string
  donorName: string
  donorIC: string | null
  donorEmail: string | null
  donorPhone: string | null
  amount: number
  fundType: 'zakat' | 'sadaqah' | 'waqf' | 'infaq' | 'donation_general'
  status: 'pending' | 'confirmed' | 'failed' | 'refunded'
  method: 'cash' | 'bank_transfer' | 'online' | 'cheque' | 'ewallet'
  channel: string | null
  donatedAt: string
  programmeId: string | null
  programme: { id: string; name: string } | null
  receiptNumber: string | null
  isAnonymous: boolean
  isTaxDeductible: boolean
  notes: string | null
  createdAt: string
}

interface ApiDisbursement {
  id: string
  disbursementNumber: string
  amount: number
  purpose: string
  status: 'pending' | 'approved' | 'processing' | 'disbursed' | 'cancelled' | 'failed'
  recipientName: string
  recipientIC: string | null
  recipientBank: string | null
  recipientAcc: string | null
  scheduledDate: string | null
  processedDate: string | null
  notes: string | null
  caseId: string | null
  programmeId: string | null
  memberId: string | null
  case: { id: string; caseNumber: string; title: string } | null
  programme: { id: string; name: string } | null
  member: { id: string; name: string; memberNumber: string } | null
  createdAt: string
}

// ─── Helpers ──────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return `RM ${amount.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleDateString('ms-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function fundTypeLabel(fundType: string): string {
  const map: Record<string, string> = {
    zakat: 'Zakat',
    sadaqah: 'Sadaqah',
    waqf: 'Waqf',
    infaq: 'Infaq',
    donation_general: 'Sumbangan Am',
  }
  return map[fundType] || fundType
}

function methodLabel(method: string): string {
  const map: Record<string, string> = {
    cash: 'Tunai',
    bank_transfer: 'Transfer Bank',
    online: 'Dalam Talian',
    cheque: 'Cek',
    ewallet: 'E-Wallet',
  }
  return map[method] || method
}

function donationStatusBadge(status: string) {
  const config: Record<string, { label: string; className: string }> = {
    confirmed: { label: 'Diterima', className: 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200' },
    pending: { label: 'Menunggu', className: 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200' },
    failed: { label: 'Gagal', className: 'bg-red-500/15 text-red-700 dark:bg-red-500/20 dark:text-red-200' },
    refunded: { label: 'Dikembalikan', className: 'bg-slate-500/15 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200' },
  }
  const c = config[status] || { label: status, className: 'bg-muted text-muted-foreground' }
  return <Badge className={c.className}>{c.label}</Badge>
}

function disbursementStatusBadge(status: string) {
  const config: Record<string, { label: string; className: string }> = {
    pending: { label: 'Menunggu', className: 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200' },
    approved: { label: 'Diluluskan', className: 'bg-blue-500/15 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200' },
    processing: { label: 'Diproses', className: 'bg-cyan-500/15 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-200' },
    disbursed: { label: 'Diagihkan', className: 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200' },
    cancelled: { label: 'Dibatalkan', className: 'bg-slate-500/15 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200' },
    failed: { label: 'Gagal', className: 'bg-red-500/15 text-red-700 dark:bg-red-500/20 dark:text-red-200' },
  }
  const c = config[status] || { label: status, className: 'bg-muted text-muted-foreground' }
  return <Badge className={c.className}>{c.label}</Badge>
}

// ─── Main Component ──────────────────────────────────────────────────

export default function GudangBaranganPage() {
  const [donations, setDonations] = React.useState<ApiDonation[]>([])
  const [disbursements, setDisbursements] = React.useState<ApiDisbursement[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [query, setQuery] = React.useState('')

  // ─── Data Fetching ──────────────────────────────────────────────────

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [donationsRes, disbursementsRes] = await Promise.all([
        api.getEnvelope<ApiDonation[]>('/donations', { page: 1, pageSize: 500 }),
        api.getEnvelope<ApiDisbursement[]>('/disbursements', { page: 1, pageSize: 500 }),
      ])
      setDonations(donationsRes.data || [])
      setDisbursements(disbursementsRes.data || [])
    } catch (err) {
      console.error('Error fetching warehouse data:', err)
      setError(err instanceof Error ? err.message : 'Gagal memuatkan data gudang')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void fetchData()
  }, [fetchData])

  // ─── Computed Stats ─────────────────────────────────────────────────

  const confirmedDonations = React.useMemo(
    () => donations.filter((d) => d.status === 'confirmed'),
    [donations],
  )

  const totalIn = React.useMemo(
    () => confirmedDonations.reduce((sum, d) => sum + Number(d.amount), 0),
    [confirmedDonations],
  )

  const totalOut = React.useMemo(
    () => disbursements.filter((d) => d.status === 'disbursed').reduce((sum, d) => sum + Number(d.amount), 0),
    [disbursements],
  )

  const stats = React.useMemo(() => {
    const inCount = confirmedDonations.length
    const disbursedCount = disbursements.filter((d) => d.status === 'disbursed').length
    const pendingCount = donations.filter((d) => d.status === 'pending').length
    const balance = totalIn - totalOut
    return { inCount, disbursedCount, pendingCount, balance }
  }, [confirmedDonations, disbursements, donations, totalIn, totalOut])

  // ─── Fund Type Breakdown ────────────────────────────────────────────

  const fundTypeBreakdown = React.useMemo(() => {
    const breakdown: Record<string, { count: number; amount: number }> = {}
    confirmedDonations.forEach((d) => {
      const ft = d.fundType
      if (!breakdown[ft]) breakdown[ft] = { count: 0, amount: 0 }
      breakdown[ft].count += 1
      breakdown[ft].amount += Number(d.amount)
    })
    return Object.entries(breakdown)
      .sort((a, b) => b[1].amount - a[1].amount)
      .map(([type, data]) => ({ type, ...data }))
  }, [confirmedDonations])

  // ─── Recent Activity ────────────────────────────────────────────────

  const recentActivity = React.useMemo(() => {
    const activities: { date: string; text: string; type: 'in' | 'out' }[] = []

    donations.slice(0, 5).forEach((d) => {
      activities.push({
        date: d.createdAt,
        text: `${d.donationNumber} diterima daripada ${d.isAnonymous ? 'Penderma Tanpa Nama' : d.donorName}`,
        type: 'in',
      })
    })

    disbursements.slice(0, 5).forEach((d) => {
      activities.push({
        date: d.createdAt,
        text: `${d.disbursementNumber} diagihkan kepada ${d.recipientName}`,
        type: 'out',
      })
    })

    return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8)
  }, [donations, disbursements])

  // ─── Search Filter for Donation Table ───────────────────────────────

  const filteredDonations = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return donations
    return donations.filter(
      (d) =>
        d.donationNumber.toLowerCase().includes(q) ||
        d.donorName.toLowerCase().includes(q) ||
        fundTypeLabel(d.fundType).toLowerCase().includes(q) ||
        methodLabel(d.method).toLowerCase().includes(q),
    )
  }, [donations, query])

  // ─── Loading State ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-300" />
          <p className="text-sm">Memuatkan data gudang...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <Button variant="outline" size="sm" onClick={() => void fetchData()}>
            Cuba Lagi
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 text-foreground">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card/80 p-6 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-black/30 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <Badge className="w-fit bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:bg-emerald-500/20 dark:text-emerald-200 dark:hover:bg-emerald-500/20">
            Lifecycle Barangan
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-pretty">Gudang Barangan</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Track barang pre-loved daripada penderma, pemeriksaan, inventori gudang, agihan kepada asnaf dan jualan murah untuk dana operasi.
          </p>
        </div>
        <div className="space-y-1 text-left lg:text-right">
          <Button disabled className="bg-emerald-600 text-white disabled:opacity-70 dark:bg-emerald-500 dark:text-black">
            + Terima Sumbangan Baru
          </Button>
          <p className="text-xs text-muted-foreground">CTA belum disambungkan kepada borang penerimaan barang.</p>
        </div>
      </div>

      {/* ─── Stats Cards ─────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: Warehouse, label: 'Barangan Masuk', value: stats.inCount, desc: `Nilai: ${formatCurrency(totalIn)}` },
          { icon: Gift, label: 'Diagihkan', value: stats.disbursedCount, desc: `Nilai: ${formatCurrency(totalOut)}` },
          { icon: ShoppingCart, label: 'Baki Inventori', value: formatCurrency(stats.balance), desc: 'Masuk − Keluar' },
          { icon: PackageCheck, label: 'Menunggu Pengesahan', value: stats.pendingCount, desc: 'Perlu disahkan' },
        ].map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.label} className="border-border bg-card text-card-foreground dark:border-white/10 dark:bg-white/5 dark:text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
                <Icon aria-hidden="true" className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{item.value}</div>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ─── Tabs ────────────────────────────────────────────────────── */}
      <Tabs defaultValue="ringkasan" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 bg-muted lg:w-[720px] lg:grid-cols-4 dark:bg-black/40">
          <TabsTrigger value="ringkasan">Ringkasan</TabsTrigger>
          <TabsTrigger value="terima">Barangan Masuk</TabsTrigger>
          <TabsTrigger value="inventori">Inventori</TabsTrigger>
          <TabsTrigger value="agihan">Barangan Keluar</TabsTrigger>
        </TabsList>

        {/* ─── Ringkasan Tab ─────────────────────────────────────────── */}
        <TabsContent value="ringkasan" className="grid gap-4 lg:grid-cols-2">
          <Card className="border-border bg-card text-card-foreground dark:border-white/10 dark:bg-white/5 dark:text-white">
            <CardHeader>
              <CardTitle>Pecahan Jenis Dana</CardTitle>
              <CardDescription>Kategori sumbangan yang diterima (disahkan).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {fundTypeBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Tiada data buat masa ini.</p>
              ) : (
                fundTypeBreakdown.map(({ type, count, amount }) => (
                  <div key={type} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm dark:bg-white/5">
                    <span>{fundTypeLabel(type)}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{formatCurrency(amount)}</span>
                      <Badge className="bg-background text-foreground dark:bg-white/10 dark:text-white">
                        {count}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card text-card-foreground dark:border-white/10 dark:bg-white/5 dark:text-white">
            <CardHeader>
              <CardTitle>Aktiviti Terkini</CardTitle>
              <CardDescription>Aliran operasi gudang terkini.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground max-h-96 overflow-y-auto">
              {recentActivity.length === 0 ? (
                <p className="py-4 text-center">Tiada aktiviti direkodkan.</p>
              ) : (
                recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    {activity.type === 'in' ? (
                      <ArrowDownCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
                    ) : (
                      <ArrowUpCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-300" />
                    )}
                    <div className="flex-1">
                      <p>{activity.text}</p>
                      <p className="text-xs text-muted-foreground/60">{formatDate(activity.date)}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Barangan Masuk (Donations) Tab ─────────────────────────── */}
        <TabsContent value="terima">
          <Card className="border-border bg-card text-card-foreground dark:border-white/10 dark:bg-white/5 dark:text-white">
            <CardHeader>
              <CardTitle>Rekod Barangan Masuk</CardTitle>
              <CardDescription>Senarai sumbangan yang diterima (daripada modul donasi).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No.</TableHead>
                      <TableHead>Penderma</TableHead>
                      <TableHead>Jenis Dana</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                      <TableHead>Kaedah</TableHead>
                      <TableHead>Tarikh</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {donations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          Tiada rekod sumbangan dijumpai.
                        </TableCell>
                      </TableRow>
                    ) : (
                      donations.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell className="font-mono text-xs">{d.donationNumber}</TableCell>
                          <TableCell>
                            {d.isAnonymous ? (
                              <span className="italic text-muted-foreground">Tanpa Nama</span>
                            ) : (
                              d.donorName
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-0 bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
                              {fundTypeLabel(d.fundType)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(Number(d.amount))}</TableCell>
                          <TableCell>{methodLabel(d.method)}</TableCell>
                          <TableCell className="text-sm">{formatDate(d.donatedAt)}</TableCell>
                          <TableCell>{donationStatusBadge(d.status)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Inventori Tab ──────────────────────────────────────────── */}
        <TabsContent value="inventori" className="space-y-4">
          <div className="relative max-w-md">
            <Search aria-hidden="true" className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="border-border bg-background pl-9 dark:border-white/10 dark:bg-white/5"
              placeholder="Cari no. sumbangan, penderma, jenis dana..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <Card className="border-border bg-card text-card-foreground dark:border-white/10 dark:bg-white/5 dark:text-white">
            <CardHeader>
              <CardTitle>Inventori — Sumbangan Disahkan</CardTitle>
              <CardDescription>Barangan/dana yang telah disahkan dan tersedia untuk agihan.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No.</TableHead>
                      <TableHead>Penderma</TableHead>
                      <TableHead>Jenis Dana</TableHead>
                      <TableHead className="text-right">Nilai</TableHead>
                      <TableHead>Kaedah</TableHead>
                      <TableHead>Tarikh</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDonations.filter((d) => d.status === 'confirmed').length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          Tiada inventori disahkan.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDonations
                        .filter((d) => d.status === 'confirmed')
                        .map((d) => (
                          <TableRow key={d.id}>
                            <TableCell className="font-mono text-xs">{d.donationNumber}</TableCell>
                            <TableCell>
                              {d.isAnonymous ? (
                                <span className="italic text-muted-foreground">Tanpa Nama</span>
                              ) : (
                                d.donorName
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="border-0 bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
                                {fundTypeLabel(d.fundType)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold">{formatCurrency(Number(d.amount))}</TableCell>
                            <TableCell>{methodLabel(d.method)}</TableCell>
                            <TableCell className="text-sm">{formatDate(d.donatedAt)}</TableCell>
                            <TableCell>
                              <Badge className="bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
                                Tersedia
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Barangan Keluar (Disbursements) Tab ────────────────────── */}
        <TabsContent value="agihan">
          <Card className="border-border bg-card text-card-foreground dark:border-white/10 dark:bg-white/5 dark:text-white">
            <CardHeader>
              <CardTitle>Rekod Barangan Keluar</CardTitle>
              <CardDescription>Senarai agihan dan pembayaran yang dilakukan (daripada modul agihan).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No.</TableHead>
                      <TableHead>Penerima</TableHead>
                      <TableHead>Tujuan</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>Tarikh</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disbursements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          Tiada rekod agihan dijumpai.
                        </TableCell>
                      </TableRow>
                    ) : (
                      disbursements.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell className="font-mono text-xs">{d.disbursementNumber}</TableCell>
                          <TableCell>{d.recipientName}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{d.purpose}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(Number(d.amount))}</TableCell>
                          <TableCell>{d.programme?.name || '-'}</TableCell>
                          <TableCell className="text-sm">{formatDate(d.createdAt)}</TableCell>
                          <TableCell>{disbursementStatusBadge(d.status)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
