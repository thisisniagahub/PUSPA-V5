'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  Heart,
  HandCoins,
  UserCheck,
  ShieldCheck,
  FileText,
  DollarSign,
  UserPlus,
  Calendar,
  Activity,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Clock,
  CheckCircle2,
  ClipboardList,
  Package,
  Zap,
  Code,
  Cpu,
  Terminal,
  ChevronRight,
} from 'lucide-react'
import { useAppStore } from '@/stores/app-store'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth-provider'
import { normalizeUserRole } from '@/lib/auth-shared'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { FlowingMenu } from '@/components/ui/flowing-menu'
import { PluginSlot } from '@/components/plugins/PluginSlot'

// ---------------------------------------------------------------------------
// Developer Specific Components
// ---------------------------------------------------------------------------

function SystemMetrics() {
  const cpuData = [
    { time: '10:00', usage: 45 }, { time: '10:05', usage: 52 }, { time: '10:10', usage: 48 },
    { time: '10:15', usage: 61 }, { time: '10:20', usage: 55 }, { time: '10:25', usage: 42 },
  ]
  
  return (
    <Card className="border border-white/10 shadow-2xl bg-card backdrop-blur-xl text-white overflow-hidden">
      <CardHeader className="border-b border-white/5 pb-4 bg-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary">System Health (Dev Mode)</CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono border-primary/50 text-primary bg-primary/10">Live Metrics</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-1">
            <p className="text-[10px] text-white/40 uppercase font-bold">API Latency</p>
            <p className="text-xl font-bold text-emerald-400">124ms</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-white/40 uppercase font-bold">Server Load</p>
            <p className="text-xl font-bold text-secondary-fixed-dim">1.28%</p>
          </div>
        </div>
        <div className="h-[120px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cpuData}>
              <defs>
                <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ecb2ff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ecb2ff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="usage" stroke="#ecb2ff" fillOpacity={1} fill="url(#colorUsage)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function AIStatusCard() {
  const setView = useAppStore((s) => s.setView)
  return (
    <Card className="border border-white/10 shadow-2xl bg-gradient-to-br from-[#520071] to-[#101415] text-white overflow-hidden group cursor-pointer" onClick={() => setView('openclaw-terminal')}>
      <CardContent className="p-6 relative">
        <div className="absolute right-0 top-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
          <Terminal className="h-24 w-24" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-primary fill-primary" />
            <h3 className="font-bold text-lg text-primary">AI Ops Engine</h3>
          </div>
          <p className="text-sm text-white/70 mb-4 max-w-[200px]">OpenClaw MCP Gateway is active. 12 agents online.</p>
          <div className="flex items-center gap-2 text-white text-xs font-bold">
            Enter Console <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

interface DashboardStats {
  jumlahAhliAsnaf: number
  programAktif: number
  jumlahDonasi: number
  sukarelawanAktif: number
  skorCompliance: number
  trendAhli: number
  trendProgram: number
  trendDonasi: number
  trendSukarelawan: number
  trendCompliance: number
}

const FUND_COLORS: Record<string, string> = {
  zakat: '#ecb2ff',
  sadaqah: '#00fbfb',
  waqf: '#e1e2e5',
  infaq: '#bd00ff',
  general: '#313536',
}

const ACTIVITY_BADGE_STYLES: Record<string, string> = {
  case: 'bg-primary/20 text-primary border border-primary/30',
  donation: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  member: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  programme: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
}

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  accentColor, 
  iconBgColor, 
  trend,
  isCurrency = false 
}: { 
  title: string
  value: number
  subtitle?: string
  icon: React.ReactNode
  accentColor: string
  iconBgColor: string
  trend?: number
  isCurrency?: boolean
}) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  return (
    <Card 
      onMouseMove={handleMouseMove}
      className="group relative overflow-hidden border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-500 hover:shadow-[0_0_40px_rgba(236,178,255,0.1)] hover:-translate-y-1.5 rounded-3xl"
    >
      {/* Spotlight Effect */}
      <div 
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, ${accentColor}10, transparent 40%)`
        }}
      />
      
      <CardContent className="flex items-start gap-4 p-6">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm"
          style={{ backgroundColor: iconBgColor }}
        >
          <span style={{ color: accentColor }}>{icon}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white/50">{title}</p>
          <div className="mt-1 flex items-baseline gap-1">
            <AnimatedCounter 
              value={value} 
              className="text-2xl font-bold tracking-tight text-white"
              format={(v) => isCurrency ? 
                new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR', maximumFractionDigits: 0 }).format(v) : 
                Math.floor(v).toLocaleString('ms-MY')
              }
            />
          </div>
          {subtitle && (
            <p className="mt-0.5 text-xs text-white/40 font-medium">{subtitle}</p>
          )}
          {trend !== undefined && trend !== 0 && (
            <div className="mt-2 flex items-center gap-1.5">
              <div className={cn(
                "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold",
                trend > 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40" : "bg-rose-100 text-rose-700 dark:bg-rose-950/40"
              )}>
                {trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(trend)}%
              </div>
              <span className="text-[10px] text-white/30">vs bulan lepas</span>
            </div>
          )}
        </div>
      </CardContent>
      <div className="absolute bottom-0 left-0 h-1 w-full opacity-30 transition-all duration-500 group-hover:opacity-100" style={{ backgroundColor: accentColor }} />
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main Dashboard Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const { user } = useAuth()
  const effectiveRole = normalizeUserRole(user?.role)
  const isDeveloper = effectiveRole === 'developer'

  const [stats, setStats] = useState<DashboardStats>({
    jumlahAhliAsnaf: 0, programAktif: 0, jumlahDonasi: 0, sukarelawanAktif: 0, skorCompliance: 0,
    trendAhli: 0, trendProgram: 0, trendDonasi: 0, trendSukarelawan: 0, trendCompliance: 0
  })
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [memberData, setMemberData] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const setView = useAppStore((s) => s.setView)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get<any>('/dashboard');
        
        if (res) {
          setStats({
            jumlahAhliAsnaf: res.totalMembers ?? 0,
            programAktif: res.activeProgrammes ?? 0,
            jumlahDonasi: res.totalDonations ?? 0,
            sukarelawanAktif: res.activeVolunteers ?? 0,
            skorCompliance: res.complianceScore ?? 0,
            trendAhli: res.trendMembers ?? 0,
            trendProgram: res.trendProgrammes ?? 0,
            trendDonasi: res.trendDonations ?? 0,
            trendSukarelawan: res.trendVolunteers ?? 0,
            trendCompliance: res.trendCompliance ?? 0,
          });
          
          setMonthlyData(res.monthlyDonationTrend || []);
          
          // Map member distribution data colors
          const distribution = res.memberCategoryBreakdown || [];
          const statusColors: Record<string, string> = {
            active: '#10b981',
            inactive: '#64748b',
            pending: '#f59e0b',
            suspended: '#ef4444',
            graduated: '#3b82f6',
          };
          
          const mappedMemberData = distribution.map((item: any) => ({
            name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
            value: item.count,
            color: statusColors[item.status.toLowerCase()] || '#6366f1',
          }));
          setMemberData(mappedMemberData);
          
          // Map activities data
          const activitiesRaw = res.recentActivities || [];
          const mappedActivities = activitiesRaw.map((act: any) => ({
            id: act.id,
            title: act.title,
            description: act.description,
            timestamp: new Date(act.createdAt).toLocaleString('ms-MY', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            }),
            type: act.type,
          }));
          setActivities(mappedActivities);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return (
    <div className="mx-auto max-w-7xl px-4 py-8"><Skeleton className="h-8 w-64" /><div className="mt-8 grid grid-cols-5 gap-4"><Skeleton className="h-32 rounded-xl" /></div></div>
  )

  const flowingItems = [
    { label: '3 Kes Menunggu', description: 'Permohonan bantuan perlu disemak', icon: Clock, color: '#d97706', onClick: () => setView('cases') },
    { label: '5 Donasi Baharu', description: 'Sumbangan belum direkodkan', icon: DollarSign, color: '#059669', onClick: () => setView('donations') },
    { label: '2 eKYC Pending', description: 'Pengesahan identiti menunggu', icon: ShieldCheck, color: '#2563eb', onClick: () => setView('ekyc') },
    { label: '1 Program Minggu Ini', description: 'Program bantuan perlu dijalankan', icon: Calendar, color: '#7c3aed', onClick: () => setView('programmes') },
  ]

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8"
    >
      {/* Developer Section (Hidden from others) */}
      {isDeveloper && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold tracking-tight">Developer Overview</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <AIStatusCard />
            </div>
            <SystemMetrics />
          </div>
        </section>
      )}

      {/* 🧩 Plugin Injection Slot */}
      <PluginSlot name="DashboardWidgetSlot" />

      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-[2rem] p-8 text-white shadow-2xl border border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#520071] via-[#101415] to-black opacity-95" />
        
        {/* Animated Orbs */}
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-primary/10 blur-[100px]" 
        />
        <motion.div 
          animate={{ x: [0, -40, 0], y: [0, 50, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-indigo-600/20 blur-[80px]" 
        />

        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-6">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-white p-1 shadow-2xl ring-4 ring-white/10">
              <Image src="/puspa-logo-official.png" alt="PUSPA" width={64} height={64} className="object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-200">
                  Selamat Datang, Admin
                </h1>
                <Zap className="h-6 w-6 text-yellow-400 fill-yellow-400" />
              </div>
              <p className="mt-2 text-lg text-purple-100/80 font-medium">
                Sistem Pengurusan Pusat Kebajikan Pintar PUSPA
              </p>
              <div className="mt-4 flex items-center gap-3">
                <Badge className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md px-3 py-1">
                  v2.2.0 Enterprise Developer
                </Badge>
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-purple-200 font-medium tracking-wide">SISTEM AKTIF & TERJAMIN</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics (Hero) */}
          <div className="grid grid-cols-2 gap-3 sm:flex">
            {[
              { label: 'Skor Pematuhan', value: `${stats.skorCompliance}%`, icon: ShieldCheck, color: 'text-emerald-400' },
              { label: 'Uptime Sistem', value: '100%', icon: Activity, color: 'text-sky-400' }
            ].map((m, i) => (
              <div key={i} className="flex flex-col rounded-2xl bg-white/5 p-4 border border-white/10 backdrop-blur-xl">
                <div className="flex items-center gap-2 mb-1">
                  <m.icon className={cn("h-4 w-4", m.color)} />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-purple-200/60">{m.label}</span>
                </div>
                <span className="text-2xl font-bold">{m.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Statistic Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Ahli Asnaf" value={stats.jumlahAhliAsnaf} icon={<Users className="h-6 w-6" />} accentColor="#ecb2ff" iconBgColor="rgba(236, 178, 255, 0.1)" trend={stats.trendAhli} />
        <StatCard title="Program Aktif" value={stats.programAktif} subtitle="sedang berjalan" icon={<Heart className="h-6 w-6" />} accentColor="#00fbfb" iconBgColor="rgba(0, 251, 251, 0.1)" trend={stats.trendProgram} />
        <StatCard title="Jumlah Donasi" value={stats.jumlahDonasi} subtitle="tahun 2024" icon={<HandCoins className="h-6 w-6" />} accentColor="#ffffff" iconBgColor="rgba(255, 255, 255, 0.1)" trend={stats.trendDonasi} isCurrency />
        <StatCard title="Sukarelawan" value={stats.sukarelawanAktif} subtitle="aktif lapangan" icon={<UserCheck className="h-6 w-6" />} accentColor="#bd00ff" iconBgColor="rgba(189, 0, 255, 0.1)" trend={stats.trendSukarelawan} />
        <StatCard title="Compliance" value={stats.skorCompliance} subtitle="keseluruhan" icon={<ShieldCheck className="h-6 w-6" />} accentColor="#ecb2ff" iconBgColor="rgba(236, 178, 255, 0.1)" trend={stats.trendCompliance} />
      </div>

      {/* Tindakan Pintas (Flowing Menu) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-purple-600" />
          <h2 className="text-lg font-bold tracking-tight">Tindakan Pintas</h2>
        </div>
        <FlowingMenu items={flowingItems} />
      </section>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden border border-white/10 shadow-2xl bg-white/5 backdrop-blur-2xl rounded-3xl">
          <CardHeader className="bg-white/5 pb-8">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-white">Trend Sumbangan</CardTitle>
                <CardDescription className="text-white/50">Analisis kemasukan dana bulanan (2024)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="bulan" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 500 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(v) => `RM${v/1000}k`} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} />
                  <Bar dataKey="zakat" stackId="a" fill="#ecb2ff" radius={[4, 4, 0, 0]} barSize={32} />
                  <Bar dataKey="sadaqah" stackId="a" fill="#00fbfb" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-white/10 shadow-2xl bg-white/5 backdrop-blur-2xl rounded-3xl">
          <CardHeader className="bg-white/5">
            <CardTitle className="text-xl font-bold text-white">Pecahan Asnaf</CardTitle>
            <CardDescription className="text-white/50">Taburan mengikut kategori</CardDescription>
          </CardHeader>
          <CardContent className="pt-10">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={memberData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value">
                    {memberData.map((entry: any, i: number) => <Cell key={i} fill={entry.color} stroke="none" />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-8 space-y-3">
              {memberData.map((entry: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-sm font-medium text-white/70">{entry.name}</span>
                  </div>
                  <span className="text-sm font-bold text-white">{entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card className="border border-white/10 shadow-2xl bg-white/5 backdrop-blur-2xl rounded-3xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-white">Log Aktiviti Operasi</CardTitle>
            <Button variant="ghost" className="text-emerald-400 font-bold hover:bg-emerald-500/10">Lihat Semua Log</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative space-y-6 before:absolute before:left-5 before:top-2 before:h-[calc(100%-16px)] before:w-0.5 before:bg-slate-100">
            {activities.map((activity: any, i: number) => (
              <div key={i} className="relative flex items-start gap-6 pl-12 group">
                <div className="absolute left-3 top-1 z-10 h-4 w-4 rounded-full border-4 border-[#101415] bg-primary shadow-sm transition-transform group-hover:scale-125" />
                <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-4 transition-all hover:shadow-md hover:bg-white/10">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-white">{activity.title}</h4>
                    <span className="text-[10px] font-bold uppercase text-white/40">{activity.timestamp}</span>
                  </div>
                  <p className="text-sm text-white/60">{activity.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
