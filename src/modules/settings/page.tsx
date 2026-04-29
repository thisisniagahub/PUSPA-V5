'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings, User, Shield, Bell, Users, Key, Eye, EyeOff,
  Save, Plus, Pencil, Trash2, CheckCircle2, AlertCircle,
  Loader2, Mail, Phone, Lock, Camera, ToggleLeft, ToggleRight,
  Monitor, Moon, Sun, Globe, Clock, LogOut, Smartphone,
  UserPlus, Crown, Code2, Briefcase, Flower2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  phone: string
  avatar: string | null
  isActive: boolean
  lastLogin: string | null
  createdAt: string
}

interface NotificationSetting {
  id: string
  label: string
  description: string
  enabled: boolean
  category: 'email' | 'push' | 'sms'
}

// ─────────────────────────────────────────────
// Role Config (with PUSPA violet theme)
// ─────────────────────────────────────────────
const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode; description: string }> = {
  staff: { label: 'Staf', color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200 dark:bg-violet-950 dark:border-violet-800 dark:text-violet-400', icon: <Briefcase className="h-3.5 w-3.5" />, description: 'Akses baca & operasi asas' },
  admin: { label: 'Pentadbir', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-400', icon: <Crown className="h-3.5 w-3.5" />, description: 'Akses penuh CRUD & pentadbiran' },
  developer: { label: 'Developer', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800 dark:text-purple-400', icon: <Code2 className="h-3.5 w-3.5" />, description: 'Akses penuh termasuk AI & sistem' },
  ops: { label: 'Operasi', color: 'text-zinc-600', bg: 'bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-400', icon: <Briefcase className="h-3.5 w-3.5" />, description: 'Akses operasi' },
  finance: { label: 'Kewangan', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-400', icon: <Briefcase className="h-3.5 w-3.5" />, description: 'Akses kewangan' },
}

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
export default function SettingsPage() {
  const { user } = useAuth()
  const currentUser = user

  // ── Profile State ──
  const [profileName, setProfileName] = useState(currentUser?.name || '')
  const [profileEmail, setProfileEmail] = useState(currentUser?.email || '')
  const [profilePhone, setProfilePhone] = useState('')
  const [profileBio, setProfileBio] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  // ── Password State ──
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordSaved, setPasswordSaved] = useState(false)

  // ── Notification State ──
  const [notifSettings, setNotifSettings] = useState<NotificationSetting[]>([
    { id: 'n1', label: 'Kes Baru', description: 'Notifikasi apabila ada kes bantuan baru', enabled: true, category: 'email' },
    { id: 'n2', label: 'Donasi Masuk', description: 'Notifikasi apabila ada donasi baru diterima', enabled: true, category: 'email' },
    { id: 'n3', label: 'Kelulusan Pembayaran', description: 'Notifikasi apabila pembayaran diluluskan', enabled: true, category: 'push' },
    { id: 'n4', label: 'Pematuhan Tertunggak', description: 'Peringatan item pematuhan belum selesai', enabled: false, category: 'email' },
    { id: 'n5', label: 'Laporan Mingguan', description: 'Ringkasan aktiviti setiap minggu', enabled: true, category: 'email' },
    { id: 'n6', label: 'Aktiviti Sukarelawan', description: 'Notifikasi aktiviti sukarelawan baru', enabled: false, category: 'push' },
    { id: 'n7', label: 'Keselamatan Akaun', description: 'Amaran aktiviti mencurigakan akaun', enabled: true, category: 'sms' },
    { id: 'n8', label: 'Kemas Kini Sistem', description: 'Notifikasi kemas kini dan penyelenggaraan', enabled: false, category: 'email' },
  ])

  // ── Users Management State ──
  const [users, setUsers] = useState<UserProfile[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null)
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'staff', phone: '' })
  const [savingUser, setSavingUser] = useState(false)

  // ── Appearance State ──
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark')
  const [language, setLanguage] = useState('ms')
  const [compactMode, setCompactMode] = useState(false)

  // ── Fetch Users ──
  const fetchUsers = useCallback(async () => {
    try {
      setUsersLoading(true)
      const res = await fetch('/api/v1/users')
      const json = await res.json()
      if (json.success) {
        setUsers(json.data)
      }
    } catch {
      toast.error('Gagal memuatkan senarai pengguna')
    } finally {
      setUsersLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // ── Handlers ──

  // Profile
  const handleSaveProfile = async () => {
    setSavingProfile(true)
    try {
      const res = await fetch('/api/v1/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentUser?.id || 'unknown',
          name: profileName,
          phone: profilePhone,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setProfileSaved(true)
        toast.success('Profil berjaya dikemaskini')
        setTimeout(() => setProfileSaved(false), 2000)
      } else {
        toast.error(json.error || 'Gagal menyimpan profil')
      }
    } catch {
      toast.error('Gagal menyimpan profil')
    } finally {
      setSavingProfile(false)
    }
  }

  // Password
  const handleSavePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Kata laluan baru tidak sepadan')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Kata laluan mestilah sekurang-kurangnya 8 aksara')
      return
    }
    setSavingPassword(true)
    try {
      const res = await fetch('/api/v1/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentUser?.id || 'unknown',
          currentPassword,
          newPassword,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setPasswordSaved(true)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        toast.success('Kata laluan berjaya ditukar')
        setTimeout(() => setPasswordSaved(false), 2000)
      } else {
        toast.error(json.error || 'Gagal menukar kata laluan')
      }
    } catch {
      toast.error('Gagal menukar kata laluan')
    } finally {
      setSavingPassword(false)
    }
  }

  // Notifications
  const toggleNotif = (id: string) => {
    setNotifSettings(prev => prev.map(n => n.id === id ? { ...n, enabled: !n.enabled } : n))
  }

  // User CRUD
  const openUserDialog = (user?: UserProfile) => {
    if (user) {
      setEditingUser(user)
      setUserForm({ name: user.name, email: user.email, password: '', role: user.role, phone: user.phone || '' })
    } else {
      setEditingUser(null)
      setUserForm({ name: '', email: '', password: '', role: 'staff', phone: '' })
    }
    setUserDialogOpen(true)
  }

  const handleSaveUser = async () => {
    if (!userForm.name || !userForm.email) {
      toast.error('Nama dan emel diperlukan')
      return
    }
    if (!editingUser && !userForm.password) {
      toast.error('Kata laluan diperlukan untuk pengguna baru')
      return
    }
    if (!editingUser && userForm.password.length < 8) {
      toast.error('Kata laluan mestilah sekurang-kurangnya 8 aksara')
      return
    }
    setSavingUser(true)
    try {
      if (editingUser) {
        const res = await fetch('/api/v1/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingUser.id,
            name: userForm.name,
            email: userForm.email,
            role: userForm.role,
            phone: userForm.phone,
          }),
        })
        const json = await res.json()
        if (json.success) {
          toast.success('Pengguna berjaya dikemaskini')
        } else {
          toast.error(json.error || 'Gagal mengemaskini')
        }
      } else {
        const res = await fetch('/api/v1/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userForm),
        })
        const json = await res.json()
        if (json.success) {
          toast.success('Akaun baharu berjaya dicipta! 🌸')
        } else {
          toast.error(json.error || 'Gagal mencipta akaun')
        }
      }
      setUserDialogOpen(false)
      fetchUsers()
    } catch {
      toast.error('Ralat menyimpan pengguna')
    } finally {
      setSavingUser(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!deletingUser) return
    try {
      const res = await fetch(`/api/v1/users?id=${deletingUser.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        toast.success('Pengguna berjaya dinyahaktifkan')
        fetchUsers()
      } else {
        toast.error(json.error || 'Gagal memadam')
      }
    } catch {
      toast.error('Ralat memadam pengguna')
    }
    setDeleteDialogOpen(false)
    setDeletingUser(null)
  }

  const effectiveRole = currentUser?.role || 'staff'
  const isAdmin = effectiveRole === 'admin' || effectiveRole === 'developer'

  // Count users by role
  const staffCount = users.filter(u => u.role === 'staff').length
  const adminCount = users.filter(u => u.role === 'admin' || u.role === 'ops' || u.role === 'finance').length
  const devCount = users.filter(u => u.role === 'developer').length

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800">
          <Settings className="h-5 w-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Tetapan</h1>
          <p className="text-sm text-zinc-500">Urus profil akaun, keselamatan dan konfigurasi sistem</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profil" className="space-y-6">
        <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 h-auto p-1.5 bg-zinc-100 dark:bg-zinc-800/50 border border-black/5 dark:border-white/5 rounded-2xl">
          <TabsTrigger value="profil" className="flex items-center gap-2 py-2.5 rounded-xl text-xs data-[state=active]:bg-violet-600 data-[state=active]:text-white dark:data-[state=active]:bg-violet-600 dark:data-[state=active]:text-white">
            <User className="h-3.5 w-3.5" /> Profil
          </TabsTrigger>
          <TabsTrigger value="keselamatan" className="flex items-center gap-2 py-2.5 rounded-xl text-xs data-[state=active]:bg-violet-600 data-[state=active]:text-white dark:data-[state=active]:bg-violet-600 dark:data-[state=active]:text-white">
            <Shield className="h-3.5 w-3.5" /> Keselamatan
          </TabsTrigger>
          <TabsTrigger value="notifikasi" className="flex items-center gap-2 py-2.5 rounded-xl text-xs data-[state=active]:bg-violet-600 data-[state=active]:text-white dark:data-[state=active]:bg-violet-600 dark:data-[state=active]:text-white">
            <Bell className="h-3.5 w-3.5" /> Notifikasi
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="pengguna" className="flex items-center gap-2 py-2.5 rounded-xl text-xs data-[state=active]:bg-violet-600 data-[state=active]:text-white dark:data-[state=active]:bg-violet-600 dark:data-[state=active]:text-white">
              <Users className="h-3.5 w-3.5" /> Pengguna
            </TabsTrigger>
          )}
        </TabsList>

        {/* ═══════════════════════════════════════
            TAB 1: PROFIL
        ═══════════════════════════════════════ */}
        <TabsContent value="profil" className="space-y-6">
          {/* Avatar Card */}
          <Card className="rounded-3xl border-black/5 dark:border-white/5">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative group">
                  <Avatar className="h-24 w-24 border-4 border-violet-100 dark:border-violet-900/50 shadow-lg">
                    <AvatarFallback className="text-2xl font-bold bg-violet-600 text-white">
                      {getInitials(profileName || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <button className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-6 w-6 text-white" />
                  </button>
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{profileName || 'Pengguna'}</h2>
                  <p className="text-sm text-zinc-500 mt-0.5">{profileEmail}</p>
                  <Badge className={cn('mt-2 border', ROLE_CONFIG[effectiveRole]?.bg || ROLE_CONFIG.staff.bg)}>
                    {ROLE_CONFIG[effectiveRole]?.icon}
                    <span className="ml-1">{ROLE_CONFIG[effectiveRole]?.label || effectiveRole}</span>
                  </Badge>
                  <p className="text-xs text-zinc-400 mt-2">
                    Akaun aktif
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Form */}
          <Card className="rounded-3xl border-black/5 dark:border-white/5">
            <CardHeader>
              <CardTitle className="text-base">Maklumat Peribadi</CardTitle>
              <CardDescription>Kemaskini maklumat profil anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-zinc-500">Nama Penuh</Label>
                  <Input value={profileName} onChange={e => setProfileName(e.target.value)} className="rounded-xl border-black/10 dark:border-white/10 focus-visible:ring-violet-500/30" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-zinc-500">Emel</Label>
                  <Input value={profileEmail} disabled className="rounded-xl bg-zinc-50 dark:bg-zinc-800 border-black/5 dark:border-white/5" />
                  <p className="text-[10px] text-zinc-400">Emel tidak boleh diubah. Hubungi pentadbir.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-zinc-500">No. Telefon</Label>
                  <Input value={profilePhone} onChange={e => setProfilePhone(e.target.value)} placeholder="01x-xxxxxxx" className="rounded-xl border-black/10 dark:border-white/10 focus-visible:ring-violet-500/30" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-zinc-500">Peranan</Label>
                  <Input value={ROLE_CONFIG[effectiveRole]?.label || effectiveRole} disabled className="rounded-xl bg-zinc-50 dark:bg-zinc-800 border-black/5 dark:border-white/5" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-zinc-500">Bio</Label>
                <Textarea value={profileBio} onChange={e => setProfileBio(e.target.value)} placeholder="Perkenalan ringkas tentang diri anda..." rows={3} className="rounded-xl border-black/10 dark:border-white/10 focus-visible:ring-violet-500/30" />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={savingProfile} className="gap-2 bg-violet-600 text-white hover:bg-violet-700 rounded-xl">
                  {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : profileSaved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                  {profileSaved ? 'Disimpan!' : 'Simpan Profil'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card className="rounded-3xl border-black/5 dark:border-white/5">
            <CardHeader>
              <CardTitle className="text-base">Penampilan</CardTitle>
              <CardDescription>Sesuaikan paparan dan bahasa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                    {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Tema</p>
                    <p className="text-xs text-zinc-500">Pilih tema gelap atau cerah</p>
                  </div>
                </div>
                <Select value={theme} onValueChange={v => setTheme(v as any)}>
                  <SelectTrigger className="w-[140px] rounded-xl border-black/10 dark:border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark"><span className="flex items-center gap-2"><Moon className="h-3 w-3" /> Gelap</span></SelectItem>
                    <SelectItem value="light"><span className="flex items-center gap-2"><Sun className="h-3 w-3" /> Cerah</span></SelectItem>
                    <SelectItem value="system"><span className="flex items-center gap-2"><Monitor className="h-3 w-3" /> Sistem</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Bahasa</p>
                    <p className="text-xs text-zinc-500">Pilih bahasa antaramuka</p>
                  </div>
                </div>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-[140px] rounded-xl border-black/10 dark:border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ms">🇲🇾 Bahasa Melayu</SelectItem>
                    <SelectItem value="en">🇬🇧 English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                    <Monitor className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Mod Padat</p>
                    <p className="text-xs text-zinc-500">Kurangkan jarak untuk lebih banyak data</p>
                  </div>
                </div>
                <Switch checked={compactMode} onCheckedChange={setCompactMode} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════
            TAB 2: KESELAMATAN
        ═══════════════════════════════════════ */}
        <TabsContent value="keselamatan" className="space-y-6">
          {/* Change Password */}
          <Card className="rounded-3xl border-black/5 dark:border-white/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                  <Key className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base">Tukar Kata Laluan</CardTitle>
                  <CardDescription>Kemaskini kata laluan akaun anda</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-zinc-500">Kata Laluan Semasa</Label>
                <div className="relative">
                  <Input type={showCurrentPw ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="rounded-xl border-black/10 dark:border-white/10 pr-10 focus-visible:ring-violet-500/30" />
                  <button onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                    {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-zinc-500">Kata Laluan Baru</Label>
                  <div className="relative">
                    <Input type={showNewPw ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 8 aksara" className="rounded-xl border-black/10 dark:border-white/10 pr-10 focus-visible:ring-violet-500/30" />
                    <button onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                      {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-zinc-500">Sahkan Kata Laluan</Label>
                  <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Sahkan kata laluan" className="rounded-xl border-black/10 dark:border-white/10 focus-visible:ring-violet-500/30" />
                </div>
              </div>
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Kata laluan tidak sepadan</p>
              )}
              <div className="flex justify-end">
                <Button onClick={handleSavePassword} disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword} className="gap-2 bg-violet-600 text-white hover:bg-violet-700 rounded-xl">
                  {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : passwordSaved ? <CheckCircle2 className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  {passwordSaved ? 'Disimpan!' : 'Tukar Kata Laluan'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security Info */}
          <Card className="rounded-3xl border-black/5 dark:border-white/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base">Status Keselamatan</CardTitle>
                  <CardDescription>Maklumat keselamatan akaun anda</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { icon: <Lock className="h-4 w-4" />, label: 'Kata Laluan', status: 'Disetkan', ok: true },
                { icon: <Smartphone className="h-4 w-4" />, label: 'eKYC Pengesahan', status: 'Belum disahkan', ok: false },
                { icon: <Shield className="h-4 w-4" />, label: 'TapSecure', status: 'Belum diaktifkan', ok: false },
                { icon: <Clock className="h-4 w-4" />, label: 'Sesi Aktif', status: '1 peranti', ok: true },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                      {item.icon}
                    </div>
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">{item.label}</span>
                  </div>
                  <Badge variant="outline" className={cn('text-[10px] border', item.ok ? 'bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-950 dark:text-violet-400 dark:border-violet-800' : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800')}>
                    {item.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Logout */}
          <Card className="rounded-3xl border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                    <LogOut className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-700 dark:text-red-400">Log Keluar</p>
                    <p className="text-xs text-red-500/70">Tamatkan sesi semasa anda</p>
                  </div>
                </div>
                <Button variant="outline" className="gap-2 text-red-600 border-red-200 hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-900/50 rounded-xl">
                  <LogOut className="h-4 w-4" /> Log Keluar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════
            TAB 3: NOTIFIKASI
        ═══════════════════════════════════════ */}
        <TabsContent value="notifikasi" className="space-y-6">
          <Card className="rounded-3xl border-black/5 dark:border-white/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base">Keutamaan Notifikasi</CardTitle>
                  <CardDescription>Pilih jenis notifikasi yang anda ingin terima</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {['email', 'push', 'sms'].map(category => {
                const catLabel = category === 'email' ? '📧 Emel' : category === 'push' ? '🔔 Pemberitahuan' : '📱 SMS'
                const items = notifSettings.filter(n => n.category === category)
                if (items.length === 0) return null
                return (
                  <div key={category}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 px-1 py-3">{catLabel}</p>
                    {items.map((notif) => (
                      <div key={notif.id} className="flex items-center justify-between py-3 px-1 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{notif.label}</p>
                          <p className="text-xs text-zinc-500">{notif.description}</p>
                        </div>
                        <Switch checked={notif.enabled} onCheckedChange={() => toggleNotif(notif.id)} />
                      </div>
                    ))}
                    <Separator className="my-2" />
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════
            TAB 4: PENGGUNA — CIPTA AKAUN (Admin Only)
        ═══════════════════════════════════════ */}
        {isAdmin && (
          <TabsContent value="pengguna" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="rounded-2xl border-black/5 dark:border-white/5">
                <CardContent className="p-4 text-center">
                  <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-900/30 mb-2">
                    <Briefcase className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{staffCount}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Staf</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-black/5 dark:border-white/5">
                <CardContent className="p-4 text-center">
                  <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/30 mb-2">
                    <Crown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{adminCount}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Pentadbir</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-black/5 dark:border-white/5">
                <CardContent className="p-4 text-center">
                  <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-900/30 mb-2">
                    <Code2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{devCount}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Developer</p>
                </CardContent>
              </Card>
            </div>

            {/* Header + Add Button */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Pengguna Sistem</h2>
                <p className="text-sm text-zinc-500">{users.length} pengguna berdaftar</p>
              </div>
              <Button onClick={() => openUserDialog()} className="gap-2 bg-violet-600 text-white hover:bg-violet-700 rounded-xl">
                <UserPlus className="h-4 w-4" /> <span className="hidden sm:inline">Cipta Akaun</span>
              </Button>
            </div>

            {/* Users List */}
            <Card className="rounded-3xl border-black/5 dark:border-white/5 overflow-hidden">
              {usersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                </div>
              ) : users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-50 dark:bg-violet-900/30 mb-3">
                    <Users className="h-8 w-8 text-violet-400" />
                  </div>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Tiada pengguna dijumpai</p>
                  <p className="text-xs text-zinc-400 mt-1">Cipta akaun baharu untuk mula</p>
                  <Button onClick={() => openUserDialog()} className="gap-2 mt-4 bg-violet-600 text-white hover:bg-violet-700 rounded-xl" size="sm">
                    <UserPlus className="h-3.5 w-3.5" /> Cipta Akaun Pertama
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-black/5 dark:divide-white/5">
                  {users.map((user, idx) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="flex items-center justify-between px-5 py-4 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-10 w-10 border border-violet-200 dark:border-violet-800">
                          <AvatarFallback className="text-sm bg-violet-600 text-white font-semibold">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{user.name}</p>
                            {!user.isActive && (
                              <Badge variant="outline" className="text-[9px] bg-red-50 text-red-500 border-red-200 dark:bg-red-950 dark:border-red-800">Tidak Aktif</Badge>
                            )}
                          </div>
                          <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <Badge className={cn('text-[10px] border gap-1', (ROLE_CONFIG[user.role]?.bg || ROLE_CONFIG.staff.bg))}>
                          {ROLE_CONFIG[user.role]?.icon}
                          {ROLE_CONFIG[user.role]?.label || user.role}
                        </Badge>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-violet-100 dark:hover:bg-violet-900/30" onClick={() => openUserDialog(user)}>
                            <Pencil className="h-3.5 w-3.5 text-zinc-400" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30" onClick={() => { setDeletingUser(user); setDeleteDialogOpen(true) }}>
                            <Trash2 className="h-3.5 w-3.5 text-zinc-400" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>

            {/* ─── User Create/Edit Dialog ─── */}
            <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
              <DialogContent className="max-w-md rounded-3xl">
                <DialogHeader>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-900/30">
                      {editingUser ? <Pencil className="h-5 w-5 text-violet-600 dark:text-violet-400" /> : <UserPlus className="h-5 w-5 text-violet-600 dark:text-violet-400" />}
                    </div>
                    <div>
                      <DialogTitle className="text-lg">{editingUser ? 'Edit Pengguna' : 'Cipta Akaun Baharu'}</DialogTitle>
                      <DialogDescription className="text-xs">
                        {editingUser ? 'Kemaskini maklumat pengguna' : 'Isikan maklumat untuk mencipta akaun baharu dalam sistem PUSPA'}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">Nama Penuh <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <Input value={userForm.name} onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))} placeholder="Masukkan nama penuh" className="rounded-xl pl-9 focus-visible:ring-violet-500/30" />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">Emel <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <Input type="email" value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} placeholder="emel@puspa.org.my" className="rounded-xl pl-9 focus-visible:ring-violet-500/30" />
                    </div>
                  </div>

                  {/* Password (only for new users) */}
                  {!editingUser && (
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">Kata Laluan <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <Input type="password" value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 8 aksara" className="rounded-xl pl-9 focus-visible:ring-violet-500/30" />
                      </div>
                      <p className="text-[10px] text-zinc-400 ml-1">Kata laluan mestilah sekurang-kurangnya 8 aksara</p>
                    </div>
                  )}

                  {/* Role Selection - Visual Cards */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">Peranan</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {['staff', 'admin', 'developer'].map((role) => {
                        const config = ROLE_CONFIG[role]
                        const isSelected = userForm.role === role
                        return (
                          <button
                            key={role}
                            type="button"
                            onClick={() => setUserForm(f => ({ ...f, role }))}
                            className={cn(
                              'flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all',
                              isSelected
                                ? 'border-violet-600 bg-violet-50 dark:bg-violet-900/30 ring-2 ring-violet-500/20'
                                : 'border-black/5 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50/50 dark:hover:bg-violet-900/10',
                            )}
                          >
                            <div className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                              isSelected ? 'bg-violet-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                            )}>
                              {config?.icon}
                            </div>
                            <span className={cn(
                              'text-[11px] font-semibold',
                              isSelected ? 'text-violet-700 dark:text-violet-300' : 'text-zinc-600 dark:text-zinc-400'
                            )}>
                              {config?.label}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                    {ROLE_CONFIG[userForm.role] && (
                      <p className="text-[10px] text-zinc-400 ml-1">{ROLE_CONFIG[userForm.role].description}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">No. Telefon</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <Input value={userForm.phone} onChange={e => setUserForm(f => ({ ...f, phone: e.target.value }))} placeholder="01x-xxxxxxx" className="rounded-xl pl-9 focus-visible:ring-violet-500/30" />
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setUserDialogOpen(false)} className="rounded-xl flex-1">Batal</Button>
                  <Button onClick={handleSaveUser} disabled={savingUser} className="gap-2 bg-violet-600 text-white hover:bg-violet-700 rounded-xl flex-1">
                    {savingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : editingUser ? <Save className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                    {editingUser ? 'Kemaskini' : 'Cipta Akaun'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Delete Confirm Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogContent className="rounded-3xl">
                <AlertDialogHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30">
                      <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <AlertDialogTitle>Nyahaktifkan Pengguna?</AlertDialogTitle>
                  </div>
                  <AlertDialogDescription>
                    Pengguna <strong>{deletingUser?.name}</strong> akan dinyahaktifkan dan tidak boleh log masuk. Tindakan ini boleh dibatalkan kemudian.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700 rounded-xl">Nyahaktifkan</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
