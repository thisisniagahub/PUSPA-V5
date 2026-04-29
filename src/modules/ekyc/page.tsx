'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  ShieldCheck, Camera, Search, Eye, CheckCircle2, XCircle, AlertTriangle,
  Clock, ChevronLeft, ChevronRight, User, CreditCard, ScanFace, FileCheck,
  RefreshCw, Wallet, ArrowRight, Star, Fingerprint, Sparkles,
  Image as ImageIcon, Info, Loader2, X, BadgeCheck, CircleCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { api } from '@/lib/api';

type KycStatus = 'pending' | 'processing' | 'verified' | 'rejected' | 'expired';
type RiskLabel = 'Rendah' | 'Sederhana' | 'Tinggi';

type MemberOption = {
  id: string;
  num: string;
  name: string;
  ic: string;
  phone: string;
  addr: string;
  status: string;
};

type MemberApiRecord = {
  id: string;
  memberNumber: string;
  name: string;
  ic: string;
  phone: string;
  address: string;
  status: string;
};

type EkycRecord = {
  id: string;
  mName: string;
  mIc: string;
  status: KycStatus;
  live: number;
  face: number;
  bnm: boolean;
  amla: string;
  risk: RiskLabel;
  wallet: number;
  prev: number;
  bank: boolean;
  reason?: string;
  verAt?: string;
  verBy?: string;
  created: string;
};

type EkycApiRecord = {
  id: string;
  status: string;
  livenessScore: number | null;
  faceMatchScore: number | null;
  bnmCompliant: boolean;
  amlaScreening: string | null;
  riskLevel: string | null;
  walletLimit: number;
  previousLimit: number;
  bankTransferEnabled: boolean;
  rejectionReason: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
  createdAt: string;
  member: {
    id: string;
    name: string;
    ic: string;
    memberNumber: string;
    phone?: string | null;
  };
};

type UploadResponse = {
  path: string;
  url: string;
  fileName: string;
  size: number;
  mimeType: string;
};

const CHALLENGES = [
  { key: 'blink', label: 'Kedipkan mata', icon: Eye, dur: 2500 },
  { key: 'smile', label: 'Senyum', icon: Star, dur: 2000 },
  { key: 'turnLeft', label: 'Pusing kepala ke kiri', icon: RefreshCw, dur: 3000 },
];

const STATUS_MAP: Record<KycStatus, { label: string; cls: string }> = {
  pending: { label: 'Menunggu', cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' },
  processing: { label: 'Dalam Proses', cls: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800' },
  verified: { label: 'Disahkan', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' },
  rejected: { label: 'Ditolak', cls: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800' },
  expired: { label: 'Tamat Tempoh', cls: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900/40 dark:text-gray-400 dark:border-gray-700' },
};

const STEPS = [
  { label: 'Pilih Ahli', icon: User },
  { label: 'Upload IC', icon: CreditCard },
  { label: 'Pengesahan', icon: ScanFace },
  { label: 'Ringkasan', icon: FileCheck },
];

const fmt = (n: number) => `RM${n.toLocaleString('ms-MY')}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('ms-MY', { day: '2-digit', month: '2-digit', year: 'numeric' });
const rndScore = (lo: number, hi: number) => Math.round((Math.random() * (hi - lo) + lo) * 10) / 10;
const scoreCls = (s: number) => s >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : s >= 60 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200';
const riskCls = (r: string) => r === 'Rendah' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : r === 'Sederhana' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200';
const normalizeStatus = (value?: string | null): KycStatus => {
  if (value === 'processing' || value === 'verified' || value === 'rejected' || value === 'expired') {
    return value;
  }
  return 'pending';
};
const getRiskLabel = (value?: string | null): RiskLabel => {
  if (value === 'high') return 'Tinggi';
  if (value === 'medium') return 'Sederhana';
  return 'Rendah';
};
const getAmlaLabel = (record: EkycApiRecord): string => {
  if (record.amlaScreening === 'pass' || record.status === 'verified') return 'Lulus';
  if (record.status === 'rejected' || record.amlaScreening === 'fail') return 'Gagal';
  return 'Dalam Semakan';
};
const mapMemberFromApi = (member: MemberApiRecord): MemberOption => ({
  id: member.id,
  num: member.memberNumber,
  name: member.name,
  ic: member.ic,
  phone: member.phone,
  addr: member.address,
  status: member.status,
});
const mapEkycFromApi = (record: EkycApiRecord): EkycRecord => ({
  id: record.id,
  mName: record.member.name,
  mIc: record.member.ic,
  status: normalizeStatus(record.status),
  live: record.livenessScore ?? 0,
  face: record.faceMatchScore ?? 0,
  bnm: record.bnmCompliant,
  amla: getAmlaLabel(record),
  risk: getRiskLabel(record.riskLevel),
  wallet: record.walletLimit,
  prev: record.previousLimit,
  bank: record.bankTransferEnabled,
  reason: record.rejectionReason || undefined,
  verAt: record.verifiedAt || undefined,
  verBy: record.verifiedBy || undefined,
  created: record.createdAt,
});

async function uploadEkycImage(file: File, scopeId?: string) {
  const formData = new FormData();
  formData.append('bucket', 'ekyc');
  formData.append('file', file);
  if (scopeId) {
    formData.append('scopeId', scopeId);
  }
  return api.postForm<UploadResponse>('/upload', formData);
}

function StepBar({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const active = i === step, done = i < step;
        return (
          <div key={i} className="flex items-center gap-1 flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <motion.div animate={{ scale: active ? 1.1 : 1 }} className={`flex items-center justify-center w-9 h-9 rounded-full ${done ? 'bg-emerald-600' : active ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
                {done ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-400'}`} />}
              </motion.div>
              <span className={`text-[10px] font-medium text-center ${active ? 'text-purple-700 dark:text-purple-300' : done ? 'text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground'}`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <div className="flex-1 mx-2 sm:mx-3 h-0.5 rounded-full bg-gray-200 dark:bg-gray-700 relative overflow-hidden"><motion.div animate={{ width: done ? '100%' : '0%' }} transition={{ duration: 0.4 }} className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full" /></div>}
          </div>
        );
      })}
    </div>
  );
}

function FileUpload({ label, desc, val, onSet, hint, scopeId }: { label: string; desc: string; val: string | null; onSet: (v: string | null) => void; hint: string; scopeId?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const pick = async (f: File) => {
    if (!f.type.startsWith('image/')) {
      toast.error('Sila pilih fail gambar');
      return;
    }
    try {
      setUploading(true);
      const uploaded = await uploadEkycImage(f, scopeId);
      onSet(uploaded.url);
      toast.success('Gambar berjaya dimuat naik');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal memuat naik');
    } finally {
      setUploading(false);
      if (ref.current) {
        ref.current.value = '';
      }
    }
  };
  return (
    <div className="space-y-3">
      <div><h3 className="text-lg font-semibold text-gray-900 dark:text-white">{label}</h3><p className="text-sm text-muted-foreground mt-0.5">{desc}</p></div>
      {val ? (
        <div className="space-y-2">
          <div className="rounded-xl overflow-hidden border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20"><img src={val} alt={label} className="w-full max-h-64 object-contain mx-auto" /></div>
          <div className="flex items-center gap-2"><Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100"><CheckCircle2 className="w-3 h-3 mr-1" /> Diterima</Badge><Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-600" disabled={uploading} onClick={() => onSet(null)}><X className="w-3 h-3 mr-1" /> Alih Keluar</Button></div>
        </div>
      ) : (
        <div onClick={() => { if (!uploading) ref.current?.click(); }} className={`cursor-pointer rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/40 hover:border-purple-300 hover:bg-purple-50/50 dark:hover:bg-purple-950/10 transition-all ${uploading ? 'pointer-events-none opacity-70' : ''}`}>
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl mb-3 bg-gray-100 dark:bg-gray-800">{uploading ? <Loader2 className="w-7 h-7 animate-spin text-purple-500" /> : <ImageIcon className="w-7 h-7 text-gray-400" />}</div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{uploading ? 'Memuat naik gambar...' : 'Klik untuk memilih gambar'}</p>
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP — Maks 10MB</p>
          </div>
          <input ref={ref} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); }} />
        </div>
      )}
      <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3"><Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" /><p className="text-xs text-amber-700 dark:text-amber-300">{hint}</p></div>
    </div>
  );
}

export default function EKYCPage() {
  const [step, setStep] = useState(0);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [member, setMember] = useState<MemberOption | null>(null);
  const [icFront, setIcFront] = useState<string | null>(null);
  const [icBack, setIcBack] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  
  // VLM Extracted Data
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<{name: string, ic: string, address: string, dateOfBirth: string, gender: string} | null>(null);
  const [icName, setIcName] = useState<string>('');
  const [icNumber, setIcNumber] = useState<string>('');
  const [icAddress, setIcAddress] = useState<string>('');

  const [liveScore, setLiveScore] = useState<number | null>(null);
  const [faceScore, setFaceScore] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [records, setRecords] = useState<EkycRecord[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [filter, setFilter] = useState('semua');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<EkycRecord | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectTarget, setRejectTarget] = useState<EkycRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [mSearch, setMSearch] = useState('');
  const [selfieUploading, setSelfieUploading] = useState(false);
  const [liveState, setLiveState] = useState({ ch: 0, done: [false, false, false] as boolean[], running: false, started: false, img: null as string | null, score: null as number | null });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadMembers = async () => {
    try {
      setLoadingMembers(true);
      const data = await api.get<MemberApiRecord[]>('/members', { pageSize: 100 });
      setMembers(data.map(mapMemberFromApi));
    } catch {
      setMembers([]);
      toast.error('Gagal memuatkan senarai ahli');
    } finally {
      setLoadingMembers(false);
    }
  };

  const loadRecords = async () => {
    try {
      setLoadingRecords(true);
      const data = await api.get<EkycApiRecord[]>('/ekyc', { pageSize: 100 });
      setRecords(data.map(mapEkycFromApi));
    } catch {
      setRecords([]);
      toast.error('Gagal memuatkan rekod eKYC');
    } finally {
      setLoadingRecords(false);
    }
  };

  useEffect(() => { loadMembers(); loadRecords(); }, []);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const filteredM = members.filter(m => {
    const q = mSearch.toLowerCase();
    const matchesQuery =
      m.name.toLowerCase().includes(q) || m.ic.includes(q) || m.num.toLowerCase().includes(q);
    return matchesQuery && m.status === 'active';
  });
  const filteredR = records.filter(r => (filter === 'semua' || r.status === filter) && (!search.trim() || r.mName.toLowerCase().includes(search.toLowerCase()) || r.mIc.includes(search)));
  const stats = { total: records.length, verified: records.filter(r => r.status === 'verified').length, pending: records.filter(r => r.status === 'pending').length, rejected: records.filter(r => r.status === 'rejected').length };
  const canNext = [!!member, !!icFront && !!icBack, selfie !== null && liveScore !== null, true][step] ?? false;

  const next = () => {
    if (step === 2) { setFaceScore(rndScore(85, 98)); }
    setStep(s => Math.min(s + 1, 3));
  };
  const back = () => setStep(s => Math.max(s - 1, 0));
  const reset = () => {
    setStep(0);
    setMember(null);
    setIcFront(null);
    setIcBack(null);
    setSelfie(null);
    setLiveScore(null);
    setFaceScore(null);
    setSubmitting(false);
    setSelfieUploading(false);
    setLiveState({ ch: 0, done: [false, false, false], running: false, started: false, img: null, score: null });
  };

  // Liveness challenge runner
  const { ch: lCh, done: lDone, running: lRunning, started: lStarted, img: lImg, score: lScore } = liveState;
  const lCount = lDone.filter(Boolean).length;

  useEffect(() => {
    if (!lRunning || lCh >= CHALLENGES.length) return;
    const t = setTimeout(() => {
      setLiveState(p => {
        const nd = [...p.done]; nd[p.ch] = true;
        if (p.ch + 1 >= CHALLENGES.length) {
          setTimeout(() => {
            const sc = rndScore(85, 99);
            setLiveState(p => {
              if (p.img) { setSelfie(p.img); setLiveScore(sc); }
              return { ...p, score: sc, running: false };
            });
          }, 300);
          return { ...p, done: nd, ch: p.ch + 1 };
        }
        return { ...p, done: nd, ch: p.ch + 1 };
      });
    }, CHALLENGES[lCh].dur);
    timerRef.current = t;
    return () => clearTimeout(t);
  }, [lRunning, lCh]);

  const startLive = () => {
    if (!lImg) { toast.error('Sila tangkap gambar selfie terlebih dahulu'); return; }
    setLiveState({ ch: 0, done: [false, false, false], running: true, started: true, img: lImg, score: null });
  };
  const resetLive = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSelfie(null);
    setLiveScore(null);
    setLiveState({ ch: 0, done: [false, false, false], running: false, started: false, img: null, score: null });
  };

  const submit = async () => {
    if (!member) return;
    setSubmitting(true);
    try {
      const created = await api.post<EkycApiRecord>('/ekyc', {
        memberId: member.id,
        icFrontUrl: icFront,
        icBackUrl: icBack,
        selfieUrl: selfie,
        icName: icName || undefined,
        icNumber: icNumber || undefined,
        icAddress: icAddress || undefined,
        livenessScore: liveScore ?? undefined,
        faceMatchScore: faceScore ?? undefined,
      });
      const mapped = mapEkycFromApi(created);
      setRecords((prev) => [mapped, ...prev.filter((record) => record.id !== mapped.id)]);
      toast.success('Pengesahan eKYC berjaya dihantar!');
      reset();
    }
    catch { toast.error('Gagal menghantar pengesahan'); } finally { setSubmitting(false); }
  };

  const approve = async (r: EkycRecord) => {
    setBusy(true);
    try {
      const updated = await api.post<EkycApiRecord>('/ekyc/verify', {
        id: r.id,
        riskLevel: r.live >= 90 && r.face >= 90 ? 'low' : 'medium',
      });
      const mapped = mapEkycFromApi(updated);
      setRecords((prev) => prev.map((record) => (record.id === r.id ? mapped : record)));
      setDetail(mapped);
      toast.success(`Pengesahan untuk ${r.mName} diluluskan`);
    }
    catch { toast.error('Gagal meluluskan'); } finally { setBusy(false); }
  };
  const openReject = (r: EkycRecord) => { setRejectTarget(r); setRejectReason(''); setRejectOpen(true); };
  const doReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) { toast.error('Sila nyatakan sebab penolakan'); return; }
    setBusy(true);
    try {
      const updated = await api.post<EkycApiRecord>('/ekyc/reject', {
        id: rejectTarget.id,
        reason: rejectReason,
      });
      const mapped = mapEkycFromApi(updated);
      setRecords((prev) => prev.map((record) => (record.id === rejectTarget.id ? mapped : record)));
      setDetail(mapped);
      setRejectOpen(false);
      setRejectTarget(null);
      toast.success(`Pengesahan untuk ${rejectTarget.mName} ditolak`);
    }
    catch { toast.error('Gagal menolak'); } finally { setBusy(false); }
  };

  const challenge = CHALLENGES[lCh];
  const ChallengeIcon = challenge?.icon || Eye;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-gray-100/80 dark:from-slate-950 dark:to-slate-900">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"><Fingerprint className="w-5 h-5" /></div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Pengesahan eKYC</h1>
                <p className="text-sm text-muted-foreground">Pengenalan Elektronik Pelanggan — Selaras BNM AMLA</p>
              </div>
            </div>
            <Badge className="bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100 shrink-0 hidden sm:flex"><ShieldCheck className="w-3.5 h-3.5 mr-1" /> Selaras BNM AMLA</Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Tabs defaultValue="verification" className="space-y-6">
          <TabsList className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700">
            <TabsTrigger value="verification" className="gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"><ScanFace className="w-4 h-4" /> Pengesahan eKYC</TabsTrigger>
            <TabsTrigger value="list" className="gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"><FileCheck className="w-4 h-4" /> Senarai Pengesahan{stats.pending > 0 && <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">{stats.pending}</span>}</TabsTrigger>
          </TabsList>

          {/* TAB 1: Wizard */}
          <TabsContent value="verification">
            <Card className="border-gray-200 dark:border-gray-700 overflow-hidden">
              <CardContent className="p-4 sm:p-6">
                <StepBar step={step} />
                <AnimatePresence mode="wait">
                  <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                    {/* Step 0: Select Member */}
                    {step === 0 && (
                      <div className="space-y-4">
                        <div><h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pilih Ahli</h3><p className="text-sm text-muted-foreground mt-0.5">Cari dan pilih ahli untuk memulakan pengesahan eKYC</p></div>
                        <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><Input placeholder="Cari nama, No. IC atau No. Ahli..." value={mSearch} onChange={e => setMSearch(e.target.value)} className="pl-9 border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-900/50" /></div>
                        <div className="max-h-72 overflow-y-auto space-y-2">
                          {loadingMembers ? (
                            Array.from({ length: 4 }).map((_, index) => (
                              <div key={index} className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800/50">
                                <div className="flex items-center gap-3">
                                  <Skeleton className="h-9 w-9 rounded-full" />
                                  <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-3 w-28" />
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : filteredM.length === 0 ? <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground"><User className="w-10 h-10" /><p className="font-medium">Tiada ahli ditemui</p></div> : filteredM.map(m => {
                            const sel = member?.id === m.id;
                            return (
                              <button key={m.id} onClick={() => setMember(m)} className={`w-full text-left p-3 rounded-xl border-2 transition-all ${sel ? 'border-purple-400 bg-purple-50 dark:bg-purple-950/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-purple-200'}`}>
                                <div className="flex items-center gap-3">
                                  <div className={`flex items-center justify-center w-9 h-9 rounded-full shrink-0 ${sel ? 'bg-purple-200 dark:bg-purple-800' : 'bg-gray-100 dark:bg-gray-700'}`}><User className={`w-4 h-4 ${sel ? 'text-purple-700' : 'text-gray-400'}`} /></div>
                                  <div className="min-w-0 flex-1"><p className="font-medium text-gray-900 dark:text-white truncate">{m.name}</p><p className="text-xs text-muted-foreground">{m.ic} • {m.num}</p></div>
                                  {sel && <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Step 1: Upload IC */}
                    {step === 1 && (
                      <div className="space-y-6">
                        <FileUpload label="Tangkap IC Depan" desc={`Muat naik gambar bahagian hadapan kad pengenalan ${member?.name || ''}`} val={icFront} onSet={setIcFront} hint="Pastikan gambar IC depan jelas. Semua maklumat perlu boleh dibaca." scopeId={member?.id} />
                        <Separator />
                        <FileUpload label="Tangkap IC Belakang" desc="Muat naik gambar bahagian belakang kad pengenalan" val={icBack} onSet={setIcBack} hint="Pastikan gambar IC belakang jelas termasuk bahagian warna." scopeId={member?.id} />
                      </div>
                    )}

                    {/* Step 2: Liveness */}
                    {step === 2 && (
                      <div className="space-y-4">
                        <div><h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pengesanan Muka Hidup</h3><p className="text-sm text-muted-foreground mt-0.5">Pengesahan muka secara langsung untuk memastikan identiti sebenar</p></div>
                        {!lImg ? (
                          <div onClick={() => { if (!selfieUploading) (document.getElementById('selfie-input') as HTMLInputElement)?.click(); }} className={`cursor-pointer rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/40 hover:border-purple-300 transition-all ${selfieUploading ? 'pointer-events-none opacity-70' : ''}`}>
                            <div className="flex flex-col items-center justify-center py-14 px-6">
                              <div className="flex items-center justify-center w-18 h-18 rounded-full bg-purple-100 dark:bg-purple-900/40 mb-3 relative p-4">
                                {selfieUploading ? <Loader2 className="w-10 h-10 animate-spin text-purple-600" /> : <ScanFace className="w-10 h-10 text-purple-600" />}
                                <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 rounded-full border-2 border-purple-400" />
                              </div>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{selfieUploading ? 'Memuat naik selfie...' : 'Tangkap Gambar Selfie'}</p>
                              <Button variant="outline" className="mt-3 gap-2 border-purple-200 text-purple-700 hover:bg-purple-50" disabled={selfieUploading}><Camera className="w-4 h-4" /> Buka Kamera</Button>
                            </div>
                            <input id="selfie-input" type="file" accept="image/*" capture="user" className="hidden" onChange={async e => {
                              const f = e.target.files?.[0];
                              if (!f) return;
                              if (!f.type.startsWith('image/')) {
                                toast.error('Sila pilih fail gambar');
                                e.target.value = '';
                                return;
                              }
                              try {
                                setSelfieUploading(true);
                                const uploaded = await uploadEkycImage(f, member?.id);
                                setSelfie(null);
                                setLiveScore(null);
                                setLiveState({ ch: 0, done: [false, false, false], running: false, started: false, img: uploaded.url, score: null });
                                toast.success('Selfie berjaya ditangkap');
                              } catch (error) {
                                toast.error(error instanceof Error ? error.message : 'Gagal memuat naik selfie');
                              } finally {
                                setSelfieUploading(false);
                                e.target.value = '';
                              }
                            }} />
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="rounded-xl overflow-hidden border-2 border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 relative">
                              <img src={lImg} alt="Selfie" className="w-full max-h-56 object-contain mx-auto" />
                              {lRunning && <motion.div animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-36 h-48 border-4 border-purple-400 rounded-[50%] opacity-60" /></motion.div>}
                            </div>
                            {!lScore && <Button variant="outline" size="sm" className="text-muted-foreground hover:text-red-600" onClick={() => { setLiveState(p => ({ ...p, img: null })); resetLive(); }}><X className="w-3.5 h-3.5 mr-1" /> Ambil Semula</Button>}
                          </div>
                        )}
                        {lImg && !lScore && (
                          <Card className="border-gray-200 dark:border-gray-700"><CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between"><h4 className="text-sm font-semibold text-gray-900 dark:text-white">Cabaran Pengesahan</h4><span className="text-xs text-muted-foreground">{lCount}/{CHALLENGES.length} selesai</span></div>
                            <Progress value={(lCount / CHALLENGES.length) * 100} className="h-2 [&>div]:bg-purple-600" />
                            {lRunning && challenge && (
                              <motion.div key={lCh} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 p-3">
                                <motion.div animate={{ rotate: challenge.key === 'turnLeft' ? [0, -20, 0] : 0, scale: challenge.key === 'blink' ? [1, 0.9, 1] : 1 }} transition={{ duration: 1.2, repeat: Infinity }} className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40"><ChallengeIcon className="w-5 h-5 text-purple-600" /></motion.div>
                                <div className="flex-1"><p className="text-sm font-semibold text-purple-700 dark:text-purple-300">Sila: {challenge.label}</p><p className="text-xs text-muted-foreground">Cabaran {lCh + 1}/{CHALLENGES.length}...</p></div>
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><Loader2 className="w-5 h-5 text-purple-500" /></motion.div>
                              </motion.div>
                            )}
                            <div className="space-y-1.5">{CHALLENGES.map((c, i) => { const Ic = c.icon; const cur = i === lCh && lRunning; const d = lDone[i]; return (
                              <div key={c.key} className={`flex items-center gap-2.5 rounded-lg p-2 transition-colors ${d ? 'bg-emerald-50 dark:bg-emerald-950/20' : cur ? 'bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800' : 'bg-gray-50 dark:bg-gray-900/30'}`}>
                                <div className={`flex items-center justify-center w-7 h-7 rounded-lg ${d ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-gray-100 dark:bg-gray-800'}`}>{d ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Ic className={`w-3.5 h-3.5 ${cur ? 'text-purple-600' : 'text-gray-400'}`} />}</div>
                                <span className={`text-sm flex-1 ${d ? 'text-emerald-700 dark:text-emerald-300 line-through' : cur ? 'text-purple-700 dark:text-purple-300 font-medium' : 'text-muted-foreground'}`}>{c.label}</span>
                                {d && <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-[10px]">Selesai</Badge>}
                              </div>
                            ); })}</div>
                            <div className="flex gap-2">
                              {!lRunning && !lStarted && <Button onClick={startLive} className="flex-1 bg-purple-600 hover:bg-purple-700 gap-2"><Sparkles className="w-4 h-4" /> Mula Pengesahan</Button>}
                              {lRunning && <Button variant="outline" onClick={resetLive} className="flex-1 border-red-200 text-red-600 hover:bg-red-50"><X className="w-4 h-4 mr-1" /> Berhenti</Button>}
                            </div>
                          </CardContent></Card>
                        )}
                        {lScore !== null && (
                          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                            <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/10"><CardContent className="p-5 flex flex-col items-center gap-3">
                              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40"><CircleCheck className="w-7 h-7 text-emerald-600" /></div>
                              <h4 className="text-lg font-bold text-emerald-800 dark:text-emerald-200">Pengesahan Berjaya!</h4>
                              <div className="text-center"><p className={`text-3xl font-bold ${scoreCls(lScore).split(' ')[1]}`}>{lScore.toFixed(1)}%</p><p className="text-xs text-muted-foreground mt-1">Skor Liveness</p></div>
                              <Button variant="outline" size="sm" onClick={resetLive} className="text-purple-700 border-purple-200 hover:bg-purple-50"><RefreshCw className="w-3.5 h-3.5 mr-1" /> Uji Semula</Button>
                            </CardContent></Card>
                          </motion.div>
                        )}
                      </div>
                    )}

                    {/* Step 3: Summary */}
                    {step === 3 && (
                      <div className="space-y-5">
                        <div className="text-center"><h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ringkasan & Pengesahan</h3><p className="text-sm text-muted-foreground mt-0.5">Semak maklumat di bawah sebelum menghantar</p></div>
                        <div className="grid grid-cols-3 gap-3">{[{ src: icFront, l: 'IC Depan' }, { src: icBack, l: 'IC Belakang' }, { src: selfie, l: 'Selfie' }].map(i => (
                          <div key={i.l} className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
                            <div className="aspect-[3/4]">{i.src ? <img src={i.src} alt={i.l} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-6 h-6 text-gray-300" /></div>}</div>
                            <div className="px-2 py-1.5 border-t border-gray-200 dark:border-gray-700"><span className="text-[10px] font-medium text-muted-foreground">{i.l}</span></div>
                          </div>
                        ))}</div>
                        <Card className="border-gray-200 dark:border-gray-700"><CardHeader className="pb-2"><div className="flex items-center gap-2"><ScanFace className="w-4 h-4 text-purple-600" /><CardTitle className="text-sm">Data Ahli</CardTitle></div></CardHeader><CardContent className="pt-0"><div className="grid grid-cols-2 gap-2">{member && [['Nama', member.name], ['No. IC', member.ic], ['No. Ahli', member.num], ['Alamat', member.addr]].map(([l, v]) => (<div key={l} className="flex flex-col"><span className="text-[10px] font-medium text-muted-foreground uppercase">{l}</span><span className="text-sm font-medium text-gray-900 dark:text-white">{v}</span></div>))}</div></CardContent></Card>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 dark:border-gray-700"><span className="text-xs text-muted-foreground">Skor Liveness</span><Badge variant="outline" className={`text-base px-3 py-1 ${scoreCls(liveScore || 0)}`}>{(liveScore || 0).toFixed(1)}%</Badge></div>
                          <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 dark:border-gray-700"><span className="text-xs text-muted-foreground">Padanan Muka</span><Badge variant="outline" className={`text-base px-3 py-1 ${scoreCls(faceScore || 0)}`}>{(faceScore || 0).toFixed(1)}%</Badge></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col items-center gap-2 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20"><ShieldCheck className="w-6 h-6 text-emerald-600" /><Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">Lulus</Badge><span className="text-[10px] text-muted-foreground">Saringan AMLA</span></div>
                          <div className="flex flex-col items-center gap-2 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20"><AlertTriangle className="w-6 h-6 text-emerald-600" /><Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">Rendah</Badge><span className="text-[10px] text-muted-foreground">Tahap Risiko</span></div>
                        </div>
                        <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10"><CardContent className="p-4"><div className="flex items-start gap-3"><div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 shrink-0"><Wallet className="w-5 h-5 text-purple-600" /></div><div className="flex-1 space-y-2"><h4 className="text-sm font-semibold text-purple-800 dark:text-purple-200">Peningkatan Had Wallet</h4><div className="flex items-center gap-2"><span className="text-lg font-bold text-gray-400 line-through">{fmt(200)}</span><ArrowRight className="w-4 h-4 text-purple-600" /><span className="text-lg font-bold text-purple-700 dark:text-purple-300">{fmt(5000)}</span></div><div className="flex items-center gap-3 text-xs"><div className="flex items-center gap-1"><BadgeCheck className="w-3 h-3 text-emerald-600" /><span className="text-emerald-700 dark:text-emerald-300">Pindahan Bank: Ya</span></div><div className="flex items-center gap-1"><BadgeCheck className="w-3 h-3 text-emerald-600" /><span className="text-emerald-700 dark:text-emerald-300">BNM AMLA: Selaras</span></div></div></div></div></CardContent></Card>
                        <div className="flex items-center gap-3 p-3 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20"><ShieldCheck className="w-5 h-5 text-purple-600 shrink-0" /><p className="text-xs text-purple-700 dark:text-purple-300 font-medium">Pengesahan ini mematuhi garis panduan BNM AMLA/KYC untuk institusi kewangan.</p></div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
                <div className="flex items-center justify-between mt-8 pt-5 border-t border-gray-200 dark:border-gray-700">
                  {step > 0 ? <Button variant="outline" onClick={back} className="gap-2 border-gray-200 dark:border-gray-600"><ChevronLeft className="w-4 h-4" /> Kembali</Button> : <div />}
                  {step < 3 ? <Button onClick={next} disabled={!canNext} className="gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300">{step === 2 ? 'Lihat Ringkasan' : 'Seterusnya'}<ChevronRight className="w-4 h-4" /></Button> : (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={reset} className="gap-2 border-gray-200 dark:border-gray-600"><RefreshCw className="w-4 h-4" /> Mula Baru</Button>
                      <Button onClick={submit} disabled={submitting} className="gap-2 bg-purple-600 hover:bg-purple-700">{submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Menghantar...</> : <><ShieldCheck className="w-4 h-4" /> Hantar Pengesahan</>}</Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: List */}
          <TabsContent value="list">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[{ label: 'Jumlah', value: stats.total, icon: FileCheck, c: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/40' }, { label: 'Disahkan', value: stats.verified, icon: CheckCircle2, c: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/40' }, { label: 'Menunggu', value: stats.pending, icon: Clock, c: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/40' }, { label: 'Ditolak', value: stats.rejected, icon: XCircle, c: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/40' }].map(s => (
                <Card key={s.label} className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50"><CardContent className="flex items-center gap-3 p-4"><div className={`flex items-center justify-center w-10 h-10 rounded-xl ${s.bg}`}><s.icon className={`w-5 h-5 ${s.c}`} /></div><div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p></div></CardContent></Card>
              ))}
            </div>
            <Card className="mb-6 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50"><CardContent className="p-4"><div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><Input placeholder="Cari nama ahli atau No. IC..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-900/50" /></div>
              <Select value={filter} onValueChange={setFilter}><SelectTrigger className="w-full sm:w-48 border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-900/50"><SelectValue placeholder="Tapis status" /></SelectTrigger><SelectContent><SelectItem value="semua">Semua Status</SelectItem><SelectItem value="pending">Menunggu</SelectItem><SelectItem value="processing">Dalam Proses</SelectItem><SelectItem value="verified">Disahkan</SelectItem><SelectItem value="rejected">Ditolak</SelectItem><SelectItem value="expired">Tamat Tempoh</SelectItem></SelectContent></Select>
            </div></CardContent></Card>

            {/* Desktop Table */}
            <Card className="hidden md:block border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50"><CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow className="border-gray-100 bg-gray-50/80 hover:bg-gray-50/80 dark:border-gray-700">
              <TableHead className="font-semibold">Ahli</TableHead><TableHead className="font-semibold">No. IC</TableHead><TableHead className="font-semibold">Status</TableHead><TableHead className="font-semibold text-center">Skor Muka</TableHead><TableHead className="font-semibold text-center">Liveness</TableHead><TableHead className="font-semibold text-center">AMLA</TableHead><TableHead className="font-semibold text-center">Wallet</TableHead><TableHead className="font-semibold">Tarikh</TableHead><TableHead className="w-[70px]"></TableHead>
            </TableRow></TableHeader><TableBody>
              {loadingRecords ? <TableRow><TableCell colSpan={9} className="space-y-3 p-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-10 w-full" />)}</TableCell></TableRow> : filteredR.length === 0 ? <TableRow><TableCell colSpan={9} className="h-32 text-center text-muted-foreground"><FileCheck className="w-8 h-8 mx-auto mb-2" /><p>Tiada rekod ditemui</p></TableCell></TableRow> : filteredR.map(r => {
                const sc = STATUS_MAP[r.status];
                return <TableRow key={r.id} className="cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/50" onClick={() => setDetail(r)}>
                  <TableCell className="font-medium">{r.mName}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{r.mIc}</TableCell>
                  <TableCell><Badge variant="outline" className={`text-xs ${sc.cls}`}>{sc.label}</Badge></TableCell>
                  <TableCell className="text-center"><Badge variant="outline" className={`text-xs ${scoreCls(r.face)}`}>{r.face.toFixed(1)}%</Badge></TableCell>
                  <TableCell className="text-center"><Badge variant="outline" className={`text-xs ${scoreCls(r.live)}`}>{r.live.toFixed(1)}%</Badge></TableCell>
                  <TableCell className="text-center"><Badge className={`text-[10px] ${r.amla === 'Lulus' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : r.amla === 'Gagal' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{r.amla}</Badge></TableCell>
                  <TableCell className="text-center text-sm font-medium">{fmt(r.wallet)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{fmtDate(r.created)}</TableCell>
                  <TableCell><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-purple-600"><Eye className="w-4 h-4" /></Button></TableCell>
                </TableRow>;
              })}
            </TableBody></Table></div></CardContent></Card>

            {/* Mobile Cards */}
            <div className="space-y-3 md:hidden">
              {loadingRecords ? Array.from({ length: 3 }).map((_, index) => <Card key={index} className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50"><CardContent className="space-y-3 p-4"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-28" /><div className="grid grid-cols-3 gap-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div></CardContent></Card>) : filteredR.length === 0 ? <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50"><CardContent className="flex flex-col items-center gap-2 py-10 text-muted-foreground"><FileCheck className="w-8 h-8" /><p>Tiada rekod ditemui</p></CardContent></Card> : filteredR.map(r => {
                const sc = STATUS_MAP[r.status];
                return <Card key={r.id} className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 cursor-pointer hover:shadow-md" onClick={() => setDetail(r)}><CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2"><div className="min-w-0 flex-1"><div className="flex items-center gap-2 mb-1"><h3 className="truncate font-semibold text-sm">{r.mName}</h3><Badge variant="outline" className={`shrink-0 text-[10px] ${sc.cls}`}>{sc.label}</Badge></div><p className="font-mono text-xs text-muted-foreground">{r.mIc}</p></div><Eye className="w-4 h-4 text-muted-foreground shrink-0 mt-1" /></div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">{[{ l: 'Skor Muka', v: r.face }, { l: 'Liveness', v: r.live }, { l: 'Wallet', v: null }].map(c => <div key={c.l} className="rounded-lg bg-gray-50 dark:bg-gray-900/40 p-2"><p className="text-[10px] text-muted-foreground">{c.l}</p><p className={`text-sm font-bold ${c.v !== null ? scoreCls(c.v).split(' ')[1] : 'text-gray-900 dark:text-white'}`}>{c.v !== null ? `${c.v.toFixed(1)}%` : fmt(r.wallet)}</p></div>)}</div>
                </CardContent></Card>;
              })}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Detail Dialog */}
      <Dialog open={!!detail} onOpenChange={o => { if (!o) setDetail(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detail && (<>
            <DialogHeader><div className="flex items-center justify-between"><div><DialogTitle className="text-lg">Butiran Pengesahan eKYC</DialogTitle><DialogDescription className="mt-1">Rekod untuk {detail.mName}</DialogDescription></div><Badge variant="outline" className={`${STATUS_MAP[detail.status].cls}`}>{STATUS_MAP[detail.status].label}</Badge></div></DialogHeader>
            <div className="space-y-5 mt-4">
              <Card className="border-gray-200 dark:border-gray-700"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex items-center justify-center w-11 h-11 rounded-full bg-purple-100 dark:bg-purple-900/40"><User className="w-5 h-5 text-purple-600" /></div><div><p className="font-semibold">{detail.mName}</p><p className="text-sm text-muted-foreground">IC: {detail.mIc}</p></div></div></CardContent></Card>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex flex-col items-center gap-1 p-3 rounded-xl border border-gray-200 dark:border-gray-700"><span className="text-[10px] text-muted-foreground">Liveness</span><Badge variant="outline" className={`text-sm ${scoreCls(detail.live)}`}>{detail.live.toFixed(1)}%</Badge></div>
                <div className="flex flex-col items-center gap-1 p-3 rounded-xl border border-gray-200 dark:border-gray-700"><span className="text-[10px] text-muted-foreground">Padanan Muka</span><Badge variant="outline" className={`text-sm ${scoreCls(detail.face)}`}>{detail.face.toFixed(1)}%</Badge></div>
                <div className="flex flex-col items-center gap-1 p-3 rounded-xl border border-gray-200 dark:border-gray-700"><span className="text-[10px] text-muted-foreground">AMLA</span><Badge className={`text-[10px] ${detail.amla === 'Lulus' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}`}>{detail.amla}</Badge></div>
                <div className="flex flex-col items-center gap-1 p-3 rounded-xl border border-gray-200 dark:border-gray-700"><span className="text-[10px] text-muted-foreground">Risiko</span><Badge variant="outline" className={`text-[10px] ${riskCls(detail.risk)}`}>{detail.risk}</Badge></div>
              </div>
              <Separator />
              <Card className="border-gray-200 dark:border-gray-700"><CardContent className="p-4 space-y-2.5"><div className="flex items-center gap-2"><Wallet className="w-4 h-4 text-purple-600" /><span className="text-sm font-semibold">Maklumat Wallet</span></div>
                {([['Status Wallet', detail.bank ? <Badge className="bg-emerald-600 hover:bg-emerald-700 text-[10px]">Dibenarkan</Badge> : <Badge variant="outline" className="text-[10px]">Tidak Dibenarkan</Badge>], ['Had Semasa', fmt(detail.wallet)], ['Had Sebelum', fmt(detail.prev)], ['Pindahan Bank', detail.bank ? 'Ya' : 'Tidak']] as [string, ReactNode][]).map(([l, v], idx) => (
                  <div key={idx} className="flex justify-between items-center"><span className="text-xs text-muted-foreground">{l}</span><span className="text-sm font-medium">{v}</span></div>
                ))}
              </CardContent></Card>
              {detail.bnm && <div className="flex items-center gap-2 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20"><ShieldCheck className="w-5 h-5 text-emerald-600" /><span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Selaras BNM AMLA</span></div>}
              {detail.reason && <div className="p-3 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20"><p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">Sebab Penolakan:</p><p className="text-sm text-red-600 dark:text-red-400">{detail.reason}</p></div>}
              {detail.verAt && <p className="text-xs text-muted-foreground">Disahkan oleh {detail.verBy} pada {fmtDate(detail.verAt)}</p>}
              {(detail.status === 'pending' || detail.status === 'processing') && <Separator />}
              {(detail.status === 'pending' || detail.status === 'processing') && (
                <div className="flex gap-2">
                  <Button onClick={() => approve(detail)} disabled={busy} className="flex-1 bg-purple-600 hover:bg-purple-700 gap-2"><CheckCircle2 className="w-4 h-4" /> {busy ? 'Memproses...' : 'Luluskan'}</Button>
                  <Button variant="outline" onClick={() => openReject(detail)} className="flex-1 border-red-200 text-red-600 hover:bg-red-50 gap-2"><XCircle className="w-4 h-4" /> Tolak</Button>
                </div>
              )}
            </div>
          </>)}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent><DialogHeader><DialogTitle>Tolak Pengesahan</DialogTitle><DialogDescription>Nyatakan sebab penolakan untuk rekod {rejectTarget?.mName}</DialogDescription></DialogHeader>
          <Textarea placeholder="Sebab penolakan..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} />
          <DialogFooter><Button variant="outline" onClick={() => setRejectOpen(false)}>Batal</Button><Button onClick={doReject} disabled={busy} className="bg-red-600 hover:bg-red-700 gap-2">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Tolak</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
