'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Gift, PackageCheck, Search, ShoppingCart, Warehouse } from 'lucide-react'

const inventory = [
  { code: 'BRG-0001', name: 'Laptop Lenovo ThinkPad', category: 'Elektronik', condition: 'Baik', location: 'Rak E1', disposition: 'Untuk Agihan', value: 800, stock: true },
  { code: 'BRG-0002', name: 'Baju sekolah lelaki', category: 'Pakaian', condition: 'Sederhana', location: 'Rak A3', disposition: 'Pending', value: 30, stock: true },
  { code: 'BRG-0003', name: 'Meja belajar', category: 'Perabot', condition: 'Baik', location: 'Stor Utama', disposition: 'Untuk Jualan', value: 120, stock: true },
  { code: 'BRG-0004', name: 'Set periuk', category: 'Peralatan Dapur', condition: 'Baik', location: 'Rak D2', disposition: 'Diagihkan', value: 90, stock: false },
]

const donations = [
  { no: 'ITM-0001', donor: 'Sumbangan Keluarga Ahmad', phone: '012-3456789', total: 5, status: 'accepted', method: 'Drop-off' },
  { no: 'ITM-0002', donor: 'Puan Siti', phone: '019-2223344', total: 3, status: 'inspected', method: 'Pickup' },
  { no: 'ITM-0003', donor: 'Masjid Al-Falah', phone: '03-12345678', total: 4, status: 'pending', method: 'Courier' },
]

const distributions = [
  { no: 'AGH-0001', item: 'Set periuk', type: 'Agihan', recipient: 'Keluarga Asnaf A', amount: '-', staff: 'Staf PUSPA' },
  { no: 'AGH-0002', item: 'Kerusi makan', type: 'Jualan', recipient: 'Orang Awam', amount: 'RM45', staff: 'Staf PUSPA' },
]

function statusClass(status: string) {
  const s = status.toLowerCase()
  if (s.includes('agihan') || s.includes('accepted')) return 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
  if (s.includes('jual') || s.includes('inspected')) return 'bg-blue-500/15 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200'
  if (s.includes('pending')) return 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200'
  return 'bg-muted text-muted-foreground'
}

export default function GudangBaranganPage() {
  const [query, setQuery] = useState('')
  const filteredInventory = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return inventory
    return inventory.filter((item) => `${item.code} ${item.name} ${item.category} ${item.location}`.toLowerCase().includes(q))
  }, [query])

  const stats = {
    inStock: inventory.filter((item) => item.stock).length,
    distributed: distributions.filter((item) => item.type === 'Agihan').length,
    sold: distributions.filter((item) => item.type === 'Jualan').length,
    pending: donations.filter((item) => item.status === 'pending').length,
  }

  return (
    <div className="space-y-6 p-6 text-foreground">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card/80 p-6 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-black/30 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <Badge className="w-fit bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:bg-emerald-500/20 dark:text-emerald-200 dark:hover:bg-emerald-500/20">Lifecycle Barangan</Badge>
          <h1 className="text-3xl font-bold tracking-tight text-pretty">Gudang Barangan</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Track barang pre-loved daripada penderma, pemeriksaan, inventori gudang, agihan kepada asnaf dan jualan murah untuk dana operasi.
          </p>
        </div>
        <div className="space-y-1 text-left lg:text-right">
          <Button disabled className="bg-emerald-600 text-white disabled:opacity-70 dark:bg-emerald-500 dark:text-black">+ Terima Sumbangan Baru</Button>
          <p className="text-xs text-muted-foreground">CTA belum disambungkan kepada borang penerimaan barang.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: Warehouse, label: 'Dalam Stok', value: stats.inStock, desc: 'Barang tersedia' },
          { icon: Gift, label: 'Diagihkan', value: stats.distributed, desc: 'Kepada asnaf' },
          { icon: ShoppingCart, label: 'Dijual', value: stats.sold, desc: 'Jualan murah' },
          { icon: PackageCheck, label: 'Menunggu Pemeriksaan', value: stats.pending, desc: 'Perlu disemak' },
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

      <Tabs defaultValue="ringkasan" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 bg-muted lg:w-[720px] lg:grid-cols-4 dark:bg-black/40">
          <TabsTrigger value="ringkasan">Ringkasan</TabsTrigger>
          <TabsTrigger value="terima">Terima Barang</TabsTrigger>
          <TabsTrigger value="inventori">Inventori Gudang</TabsTrigger>
          <TabsTrigger value="agihan">Agihan & Jualan</TabsTrigger>
        </TabsList>

        <TabsContent value="ringkasan" className="grid gap-4 lg:grid-cols-2">
          <Card className="border-border bg-card text-card-foreground dark:border-white/10 dark:bg-white/5 dark:text-white">
            <CardHeader><CardTitle>Pecahan Kategori</CardTitle><CardDescription>Contoh kategori stok gudang.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {['Elektronik', 'Pakaian', 'Perabot', 'Peralatan Dapur'].map((category) => (
                <div key={category} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm dark:bg-white/5">
                  <span>{category}</span><Badge className="bg-background text-foreground dark:bg-white/10 dark:text-white">{inventory.filter((i) => i.category === category).length}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="border-border bg-card text-card-foreground dark:border-white/10 dark:bg-white/5 dark:text-white">
            <CardHeader><CardTitle>Aktiviti Terkini</CardTitle><CardDescription>Sample aliran operasi gudang.</CardDescription></CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>• ITM-0001 diterima daripada Keluarga Ahmad</p>
              <p>• BRG-0001 ditandakan untuk agihan program Kelas AI</p>
              <p>• AGH-0001 diagihkan kepada keluarga asnaf</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="terima">
          <Card className="border-border bg-card text-card-foreground dark:border-white/10 dark:bg-white/5 dark:text-white">
            <CardHeader><CardTitle>Rekod Sumbangan Barang</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>No.</TableHead><TableHead>Penderma</TableHead><TableHead>Telefon</TableHead><TableHead>Jumlah</TableHead><TableHead>Status</TableHead><TableHead>Kaedah</TableHead></TableRow></TableHeader>
                <TableBody>{donations.map((item) => <TableRow key={item.no}><TableCell>{item.no}</TableCell><TableCell>{item.donor}</TableCell><TableCell>{item.phone}</TableCell><TableCell>{item.total}</TableCell><TableCell><Badge className={statusClass(item.status)}>{item.status}</Badge></TableCell><TableCell>{item.method}</TableCell></TableRow>)}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventori" className="space-y-4">
          <div className="relative max-w-md">
            <Search aria-hidden="true" className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="border-border bg-background pl-9 dark:border-white/10 dark:bg-white/5" placeholder="Cari kod, nama, kategori…" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <Card className="border-border bg-card text-card-foreground dark:border-white/10 dark:bg-white/5 dark:text-white">
            <CardHeader><CardTitle>Inventori</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Kod</TableHead><TableHead>Nama</TableHead><TableHead>Kategori</TableHead><TableHead>Keadaan</TableHead><TableHead>Lokasi</TableHead><TableHead>Disposisi</TableHead><TableHead>Nilai</TableHead></TableRow></TableHeader>
                <TableBody>{filteredInventory.map((item) => <TableRow key={item.code}><TableCell>{item.code}</TableCell><TableCell>{item.name}</TableCell><TableCell>{item.category}</TableCell><TableCell>{item.condition}</TableCell><TableCell>{item.location}</TableCell><TableCell><Badge className={statusClass(item.disposition)}>{item.disposition}</Badge></TableCell><TableCell>RM{item.value}</TableCell></TableRow>)}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agihan">
          <Card className="border-border bg-card text-card-foreground dark:border-white/10 dark:bg-white/5 dark:text-white">
            <CardHeader><CardTitle>Agihan & Jualan</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>No.</TableHead><TableHead>Barang</TableHead><TableHead>Jenis</TableHead><TableHead>Penerima</TableHead><TableHead>Jumlah</TableHead><TableHead>Staf</TableHead></TableRow></TableHeader>
                <TableBody>{distributions.map((item) => <TableRow key={item.no}><TableCell>{item.no}</TableCell><TableCell>{item.item}</TableCell><TableCell><Badge className={statusClass(item.type)}>{item.type}</Badge></TableCell><TableCell>{item.recipient}</TableCell><TableCell>{item.amount}</TableCell><TableCell>{item.staff}</TableCell></TableRow>)}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
