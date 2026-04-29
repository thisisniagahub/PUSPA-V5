'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Eye,
  Pencil,
  Trash2,
  Plus,
  Search,
  CalendarDays,
  Users,
  MapPin,
  Banknote,
  Handshake,
  FileText,
  BarChart3,
  X,
  CheckCircle2,
  Rocket,
  LayoutGrid,
  Utensils,
  GraduationCap,
  Hammer,
  Stethoscope,
  Coins,
  Heart,
  AlertTriangle,
  BookOpen,
  BrainCircuit,
  Lightbulb,
  TrendingUp,
  Zap
} from 'lucide-react';
import { api } from '@/lib/api';
import { getProgrammeStatusLabel } from '@/lib/domain';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

type CategoryKey =
  | 'food_aid'
  | 'education'
  | 'skills_training'
  | 'healthcare'
  | 'financial_assistance'
  | 'community'
  | 'emergency_relief'
  | 'dawah'
  | 'inkubasi_ai'
  | 'mentoring_bisnes'
  | 'geran_modal'
  | 'scale_up';

type StatusKey = 'Aktif' | 'Siap' | 'Ditangguh' | 'Dirancang';

interface Milestone {
  id: string;
  title: string;
  targetDate: string;
  isCompleted: boolean;
}

interface KPI {
  label: string;
  value: string;
  target: string;
}

interface Programme {
  id: string;
  name: string;
  description: string;
  category: CategoryKey;
  status: StatusKey;
  startDate: string;
  endDate: string;
  location: string;
  targetBeneficiaries: number;
  budget: number;
  spent: number;
  currentBeneficiaries: number;
  partners: string;
  notes: string;
  relatedCases: number;
  relatedDonations: number;
  milestones?: Milestone[];
  kpis?: KPI[];
}

interface ProgrammeApiRecord {
  id: string;
  name: string;
  description: string | null;
  category: CategoryKey;
  status: string;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
  targetBeneficiaries: number | null;
  actualBeneficiaries: number;
  budget: number;
  totalSpent: number;
  partners: string | null;
  notes: string | null;
  _count?: {
    cases?: number;
    activities?: number;
    impactMetrics?: number;
  };
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<
  CategoryKey,
  { label: string; color: string; badgeClass: string; icon: any }
> = {
  food_aid: {
    label: 'Bantuan Makanan',
    color: 'orange',
    badgeClass: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    icon: Utensils
  },
  education: {
    label: 'Pendidikan',
    color: 'blue',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    icon: GraduationCap
  },
  skills_training: {
    label: 'Latihan Kemahiran',
    color: 'purple',
    badgeClass: 'bg-primary/10 text-primary border-primary/20',
    icon: Hammer
  },
  healthcare: {
    label: 'Kesihatan',
    color: 'rose',
    badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    icon: Stethoscope
  },
  financial_assistance: {
    label: 'Bantuan Kewangan',
    color: 'emerald',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    icon: Coins
  },
  community: {
    label: 'Komuniti',
    color: 'cyan',
    badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    icon: Heart
  },
  emergency_relief: {
    label: 'Bantuan Kecemasan',
    color: 'red',
    badgeClass: 'bg-red-500/10 text-red-400 border-red-500/20',
    icon: AlertTriangle
  },
  dawah: {
    label: 'Dakwah',
    color: 'amber',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    icon: BookOpen
  },
  inkubasi_ai: {
    label: 'Inkubasi AI & SaaS',
    color: 'indigo',
    badgeClass: 'bg-primary/20 text-primary border-primary/30 shadow-lg shadow-primary/10',
    icon: BrainCircuit
  },
  mentoring_bisnes: {
    label: 'Mentoring Bisnes',
    color: 'violet',
    badgeClass: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    icon: Lightbulb
  },
  geran_modal: {
    label: 'Geran & Modal Pusingan',
    color: 'emerald',
    badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    icon: TrendingUp
  },
  scale_up: {
    label: 'Scale-up & Marketing',
    color: 'pink',
    badgeClass: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    icon: Zap
  },
};

const STATUS_CONFIG: Record<
  StatusKey,
  { label: string; badgeClass: string }
> = {
  Aktif: {
    label: 'Aktif',
    badgeClass:
      'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
  Siap: {
    label: 'Siap',
    badgeClass:
      'bg-white/10 text-white/50 border-white/20',
  },
  Ditangguh: {
    label: 'Ditangguh',
    badgeClass:
      'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  Dirancang: {
    label: 'Dirancang',
    badgeClass:
      'bg-primary/20 text-primary border-primary/30',
  },
};

const CATEGORY_OPTIONS: { value: CategoryKey; label: string }[] = [
  { value: 'food_aid', label: 'Bantuan Makanan' },
  { value: 'education', label: 'Pendidikan' },
  { value: 'skills_training', label: 'Latihan Kemahiran' },
  { value: 'healthcare', label: 'Kesihatan' },
  { value: 'financial_assistance', label: 'Bantuan Kewangan' },
  { value: 'community', label: 'Komuniti' },
  { value: 'emergency_relief', label: 'Bantuan Kecemasan' },
  { value: 'dawah', label: 'Dakwah' },
  { value: 'inkubasi_ai', label: 'Inkubasi AI & SaaS' },
  { value: 'mentoring_bisnes', label: 'Mentoring Bisnes' },
  { value: 'geran_modal', label: 'Geran & Modal Pusingan' },
  { value: 'scale_up', label: 'Scale-up & Marketing' },
];

const STATUS_OPTIONS: { value: StatusKey; label: string }[] = [
  { value: 'Aktif', label: 'Aktif' },
  { value: 'Siap', label: 'Siap' },
  { value: 'Ditangguh', label: 'Ditangguh' },
  { value: 'Dirancang', label: 'Dirancang' },
];

const FILTER_TABS = [
  { value: 'Semua', label: 'Semua', icon: LayoutGrid },
  { value: 'food_aid', label: 'Bantuan Makanan', icon: Utensils },
  { value: 'education', label: 'Pendidikan', icon: GraduationCap },
  { value: 'skills_training', label: 'Latihan Kemahiran', icon: Hammer },
  { value: 'healthcare', label: 'Kesihatan', icon: Stethoscope },
  { value: 'financial_assistance', label: 'Bantuan Kewangan', icon: Coins },
  { value: 'community', label: 'Komuniti', icon: Heart },
  { value: 'emergency_relief', label: 'Bantuan Kecemasan', icon: AlertTriangle },
  { value: 'dawah', label: 'Dakwah', icon: BookOpen },
  { value: 'inkubasi_ai', label: 'Inkubasi AI & SaaS', icon: BrainCircuit },
  { value: 'mentoring_bisnes', label: 'Mentoring Bisnes', icon: Lightbulb },
  { value: 'geran_modal', label: 'Geran & Modal Pusingan', icon: TrendingUp },
  { value: 'scale_up', label: 'Scale-up & Marketing', icon: Zap },
];

// ─── Mock Data ───────────────────────────────────────────────────────────────

const INITIAL_PROGRAMMES: Programme[] = [];

// ─── Zod Schema ──────────────────────────────────────────────────────────────

const programmeSchema = z.object({
  name: z.string().min(1, 'Nama program diperlukan'),
  description: z.string().optional().default(''),
  category: z.enum([
    'food_aid',
    'education',
    'skills_training',
    'healthcare',
    'financial_assistance',
    'community',
    'emergency_relief',
    'dawah',
    'inkubasi_ai',
    'mentoring_bisnes',
    'geran_modal',
    'scale_up',
  ]),
  status: z.enum(['Aktif', 'Siap', 'Ditangguh', 'Dirancang']),
  startDate: z.string().min(1, 'Tarikh mula diperlukan'),
  endDate: z.string().min(1, 'Tarikh tamat diperlukan'),
  location: z.string().optional().default(''),
  targetBeneficiaries: z
    .number({ message: 'Sila masukkan nombor' })
    .min(0, 'Sasaran peserta tidak boleh negatif'),
  budget: z
    .number({ message: 'Sila masukkan nombor' })
    .min(0, 'Bajet tidak boleh negatif'),
  partners: z.string().optional().default(''),
  notes: z.string().optional().default(''),
});

type ProgrammeFormData = z.infer<typeof programmeSchema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatCurrency(amount: number): string {
  return `RM ${amount.toLocaleString('ms-MY')}`;
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

function getProgressColor(spent: number, budget: number): string {
  if (budget === 0) return '[&>div]:bg-white/20';
  if (spent > budget) return '[&>div]:bg-destructive';
  const pct = (spent / budget) * 100;
  if (pct >= 80) return '[&>div]:bg-amber-400';
  return '[&>div]:bg-primary';
}

function mapProgrammeFromApi(programme: ProgrammeApiRecord): Programme {
  return {
    id: programme.id,
    name: programme.name,
    description: programme.description || '',
    category: programme.category,
    status: getProgrammeStatusLabel(programme.status) as StatusKey,
    startDate: programme.startDate ? programme.startDate.split('T')[0] : '',
    endDate: programme.endDate ? programme.endDate.split('T')[0] : '',
    location: programme.location || '',
    targetBeneficiaries: programme.targetBeneficiaries || 0,
    budget: programme.budget || 0,
    spent: programme.totalSpent || 0,
    currentBeneficiaries: programme.actualBeneficiaries || 0,
    partners: programme.partners || '',
    notes: programme.notes || '',
    relatedCases: programme._count?.cases || 0,
    relatedDonations: 0,
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProgrammesPage() {
  const [programmes, setProgrammes] = useState<Programme[]>(INITIAL_PROGRAMMES);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProgramme, setEditingProgramme] = useState<Programme | null>(
    null
  );
  const [viewingProgramme, setViewingProgramme] = useState<Programme | null>(
    null
  );
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadProgrammes = async () => {
    try {
      setLoading(true);
      const data = await api.get<ProgrammeApiRecord[]>('/programmes');
      setProgrammes(data.map(mapProgrammeFromApi));
    } catch {
      setProgrammes([]);
      toast.error('Gagal memuatkan data program');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgrammes();
  }, []);

  // ─── Form ─────────────────────────────────────────────────────────────────

  const form = useForm<ProgrammeFormData>({
    resolver: zodResolver(programmeSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      category: 'food_aid',
      status: 'Dirancang',
      startDate: '',
      endDate: '',
      location: '',
      targetBeneficiaries: 0,
      budget: 0,
      partners: '',
      notes: '',
    },
  });

  const watchedCategory = useWatch({
    control: form.control,
    name: 'category',
  });
  
  const watchedStatus = useWatch({
    control: form.control,
    name: 'status',
  });


  // ─── Filtered Programmes ──────────────────────────────────────────────────

  const filteredProgrammes = useMemo(() => {
    return programmes.filter((p) => {
      const matchesCategory =
        activeTab === 'Semua' || p.category === activeTab;
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [programmes, activeTab, searchQuery]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  function openCreateDialog() {
    setEditingProgramme(null);
    form.reset({
      name: '',
      description: '',
      category: 'food_aid',
      status: 'Dirancang',
      startDate: '',
      endDate: '',
      location: '',
      targetBeneficiaries: 0,
      budget: 0,
      partners: '',
      notes: '',
    });
    setIsDialogOpen(true);
  }

  function openEditDialog(programme: Programme) {
    setEditingProgramme(programme);
    form.reset({
      name: programme.name,
      description: programme.description,
      category: programme.category,
      status: programme.status,
      startDate: programme.startDate,
      endDate: programme.endDate,
      location: programme.location,
      targetBeneficiaries: programme.targetBeneficiaries,
      budget: programme.budget,
      partners: programme.partners,
      notes: programme.notes,
    });
    setIsDialogOpen(true);
  }

  async function onSubmit(data: ProgrammeFormData) {
    try {
      setSubmitting(true);
      const payload = {
        name: data.name,
        description: data.description,
        category: data.category,
        status: data.status,
        startDate: data.startDate,
        endDate: data.endDate,
        location: data.location,
        targetBeneficiaries: data.targetBeneficiaries,
        budget: data.budget,
        partners: data.partners,
        notes: data.notes,
      };

      if (editingProgramme) {
        const updated = await api.put<ProgrammeApiRecord>('/programmes', {
          id: editingProgramme.id,
          ...payload,
        });
        const mapped = mapProgrammeFromApi(updated);
        setProgrammes((prev) =>
          prev.map((programme) => (programme.id === editingProgramme.id ? mapped : programme))
        );
        if (viewingProgramme?.id === editingProgramme.id) {
          setViewingProgramme(mapped);
        }
        toast.success('Program berjaya dikemas kini');
      } else {
        const created = await api.post<ProgrammeApiRecord>('/programmes', payload);
        setProgrammes((prev) => [mapProgrammeFromApi(created), ...prev]);
        toast.success('Program berjaya ditambah');
      }

      setIsDialogOpen(false);
      setEditingProgramme(null);
      form.reset();
    } catch {
      toast.error(editingProgramme ? 'Gagal mengemas kini program' : 'Gagal menambah program');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete('/programmes', { id });
      setProgrammes((prev) => prev.filter((p) => p.id !== id));
      if (viewingProgramme?.id === id) {
        setViewingProgramme(null);
      }
      toast.success('Program berjaya dipadam');
    } catch {
      toast.error('Gagal memadam program');
      return;
    }
    setDeleteConfirmId(null);
  }

  // ─── Stats ────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const totalBudget = programmes.reduce((sum, p) => sum + p.budget, 0);
    const totalSpent = programmes.reduce((sum, p) => sum + p.spent, 0);
    const totalBeneficiaries = programmes.reduce(
      (sum, p) => sum + p.currentBeneficiaries,
      0
    );
    const activeCount = programmes.filter((p) => p.status === 'Aktif').length;
    return { totalBudget, totalSpent, totalBeneficiaries, activeCount };
  }, [programmes]);

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent">
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 space-y-2">
            <div className="h-8 w-56 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-72 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="border-0 bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="h-12 animate-pulse rounded bg-gray-100" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Pengurusan Program
              </h1>
              <p className="text-sm text-white/60">
                Urus dan pantau semua program PUSPA NGO
              </p>
            </div>
            <Button onClick={openCreateDialog} className="shrink-0">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Program
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="border border-white/10 bg-card backdrop-blur-xl">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-500">
                Jumlah Program
              </p>
              <p className="text-2xl font-bold text-white">
                {programmes.length}
              </p>
            </CardContent>
          </Card>
          <Card className="border border-white/10 bg-card backdrop-blur-xl">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-400">Program Aktif</p>
              <p className="text-2xl font-bold text-primary">
                {stats.activeCount}
              </p>
            </CardContent>
          </Card>
          <Card className="border border-white/10 bg-card backdrop-blur-xl">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-400">
                Jumlah Bajet
              </p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(stats.totalBudget)}
              </p>
            </CardContent>
          </Card>
          <Card className="border border-white/10 bg-card backdrop-blur-xl">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-400">
                Jumlah Peserta
              </p>
              <p className="text-2xl font-bold text-white">
                {stats.totalBeneficiaries.toLocaleString('ms-MY')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 space-y-4">
          {/* Search */}
          <div className="group relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-emerald-400" />
            <Input
              placeholder="Cari program, lokasi, atau keterangan..."
              className="h-12 pl-12 pr-4 bg-white/5 border-white/10 rounded-2xl shadow-xl focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 transition-all text-base text-white placeholder:text-white/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <kbd className="hidden sm:inline-flex h-6 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-white/40 opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="relative w-full overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-50/50 to-transparent z-10 pointer-events-none md:hidden" />
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-50/50 to-transparent z-10 pointer-events-none md:hidden" />
              
              <div className="overflow-x-auto no-scrollbar pb-1">
                <TabsList className="inline-flex w-max p-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl gap-1 h-auto shadow-xl">
                  {FILTER_TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.value;
                    const count = programmes.filter(
                      (p) => tab.value === 'Semua' || p.category === tab.value
                    ).length;

                    return (
                      <TabsTrigger 
                        key={tab.value} 
                        value={tab.value} 
                        className={cn(
                          "relative px-4 py-2.5 rounded-lg text-xs font-medium transition-all duration-300",
                          "flex items-center gap-2 border border-transparent whitespace-nowrap",
                          "data-[state=active]:bg-white/10 data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm data-[state=active]:border-white/20",
                          "text-white/50 hover:text-white hover:bg-white/5"
                        )}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-emerald-400" : "text-white/30")} />
                        <span>{tab.label}</span>
                        <span className={cn(
                          "ml-1 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold transition-colors",
                          isActive 
                            ? "bg-emerald-500/20 text-emerald-400" 
                            : "bg-white/10 text-white/40 group-hover:bg-white/20"
                        )}>
                          {count}
                        </span>
                        {isActive && (
                          <motion.div 
                            layoutId="activeTab"
                            className="absolute -bottom-[1px] left-2 right-2 h-[2px] bg-emerald-400 rounded-full"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>
            </div>
          </Tabs>
        </div>

        {/* Programme Cards Grid */}
        {filteredProgrammes.length === 0 ? (
          <Card className="border border-white/10 bg-card backdrop-blur-xl">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-white">
                Tiada Program Dijumpai
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Cuba ubah penapis carian atau tambah program baru.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProgrammes.map((programme, idx) => {
              const catConfig = CATEGORY_CONFIG[programme.category];
              const statusConfig = STATUS_CONFIG[programme.status];
              const budgetPercent =
                programme.budget > 0
                  ? Math.min((programme.spent / programme.budget) * 100, 100)
                  : 0;
              const isOverBudget = programme.spent > programme.budget;
              const CatIcon = catConfig.icon;

              return (
                <motion.div
                  key={programme.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  layout
                >
                  <Card className="group relative flex h-full flex-col border-white/10 bg-card backdrop-blur-xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 hover:border-primary/30">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/40 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <CardTitle className="line-clamp-2 text-lg font-bold leading-tight text-white group-hover:text-emerald-400 transition-colors">
                          {programme.name}
                        </CardTitle>
                        <div className={cn(
                          "p-2 rounded-xl shrink-0 transition-colors border border-white/10",
                          catConfig.badgeClass
                        )}>
                          <CatIcon size={20} />
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        <Badge
                          variant="secondary"
                          className={cn("rounded-lg border font-medium px-2 py-0.5", statusConfig.badgeClass)}
                        >
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </CardHeader>
  
                    <CardContent className="flex-1 space-y-5 pb-4">
                      {/* Description */}
                      <p className="text-sm leading-relaxed text-white/50 line-clamp-3">
                        {programme.description}
                      </p>
  
                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3 py-2 border-y border-white/5">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase tracking-wider font-bold text-white/30">Budget</p>
                          <p className="text-sm font-bold text-white">{formatCurrency(programme.budget)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase tracking-wider font-bold text-white/30">Peserta</p>
                          <p className="text-sm font-bold text-white">{programme.currentBeneficiaries} <span className="text-white/30 font-normal">/ {programme.targetBeneficiaries}</span></p>
                        </div>
                      </div>
  
                      {/* Budget Progress */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 font-semibold text-white/60">
                            <Banknote className="h-4 w-4 text-emerald-400" />
                            Dibelanjakan
                          </span>
                          <span className={cn(
                            "font-bold px-2 py-0.5 rounded-md",
                            isOverBudget ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                          )}>
                            {programme.budget > 0
                              ? `${Math.round((programme.spent / programme.budget) * 100)}%`
                              : '0%'}
                          </span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-white/5 p-0.5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(budgetPercent, 100)}%` }}
                            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                            className={cn(
                              "h-full rounded-full transition-all shadow-[0_0_12px_rgba(16,185,129,0.4)]",
                              isOverBudget ? 'bg-red-500' : budgetPercent >= 80 ? 'bg-yellow-500' : 'bg-emerald-400'
                            )}
                          />
                        </div>
                      </div>
  
                      {/* Meta Info */}
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center text-xs text-white/40 group/item">
                          <CalendarDays className="mr-2 h-4 w-4 shrink-0 text-white/30 group-hover/item:text-emerald-400 transition-colors" />
                          <span className="font-medium text-white/60">{formatDate(programme.startDate)}</span>
                          <span className="mx-1 text-white/20">-</span>
                          <span className="font-medium text-white/60">{formatDate(programme.endDate)}</span>
                        </div>
    
                        {programme.location && (
                          <div className="flex items-center text-xs text-white/40 group/item">
                            <MapPin className="mr-2 h-4 w-4 shrink-0 text-white/30 group-hover/item:text-emerald-400 transition-colors" />
                            <span className="truncate text-white/60">{programme.location}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
  
                    <CardFooter className="border-t border-white/5 bg-white/5 px-4 py-3 group-hover:bg-white/10 transition-colors">
                      <div className="flex w-full items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs bg-white/5 border-white/10 text-white hover:bg-white/10"
                          onClick={() => setViewingProgramme(programme)}
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          Lihat
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs bg-white/5 border-white/10 text-white hover:bg-white/10"
                          onClick={() => openEditDialog(programme)}
                        >
                          <Pencil className="mr-1.5 h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                          onClick={() => setDeleteConfirmId(programme.id)}
                        >
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                          Padam
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* ─── Create / Edit Dialog ────────────────────────────────────────── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingProgramme ? 'Edit Program' : 'Tambah Program Baru'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Nama Program <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Masukkan nama program"
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Keterangan
              </label>
              <Textarea
                placeholder="Keterangan ringkas tentang program"
                rows={3}
                {...form.register('description')}
              />
            </div>

            {/* Category & Status */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Kategori <span className="text-red-500">*</span>
                </label>
                <Select
                  value={watchedCategory}
                  onValueChange={(val) =>
                    form.setValue('category', val as CategoryKey)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Status
                </label>
                <Select
                  value={watchedStatus}
                  onValueChange={(val) =>
                    form.setValue('status', val as StatusKey)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Tarikh Mula <span className="text-red-500">*</span>
                </label>
                <Input type="date" {...form.register('startDate')} />
                {form.formState.errors.startDate && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.startDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Tarikh Tamat <span className="text-red-500">*</span>
                </label>
                <Input type="date" {...form.register('endDate')} />
                {form.formState.errors.endDate && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.endDate.message}
                  </p>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Lokasi
              </label>
              <Input
                placeholder="Lokasi program"
                {...form.register('location')}
              />
            </div>

            {/* Target & Budget */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Sasaran Peserta
                </label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  {...form.register('targetBeneficiaries', {
                    valueAsNumber: true,
                  })}
                />
                {form.formState.errors.targetBeneficiaries && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.targetBeneficiaries.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Bajet (RM)
                </label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  {...form.register('budget', { valueAsNumber: true })}
                />
                {form.formState.errors.budget && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.budget.message}
                  </p>
                )}
              </div>
            </div>

            {/* Partners */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Rakan Kongsi
              </label>
              <Textarea
                placeholder="Senarai rakan kongsi program"
                rows={2}
                {...form.register('partners')}
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Nota
              </label>
              <Textarea
                placeholder="Nota tambahan"
                rows={2}
                {...form.register('notes')}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? 'Menyimpan...'
                  : editingProgramme
                    ? 'Simpan Perubahan'
                    : 'Tambah Program'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── View Programme Sheet ─────────────────────────────────────────── */}
      <Sheet
        open={!!viewingProgramme}
        onOpenChange={(open) => !open && setViewingProgramme(null)}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {viewingProgramme && (
            <>
              <SheetHeader>
                <div className="flex flex-wrap items-center gap-2 pb-2">
                  <Badge
                    variant="outline"
                    className={
                      CATEGORY_CONFIG[viewingProgramme.category].badgeClass
                    }
                  >
                    {CATEGORY_CONFIG[viewingProgramme.category].label}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      STATUS_CONFIG[viewingProgramme.status].badgeClass
                    }
                  >
                    {STATUS_CONFIG[viewingProgramme.status].label}
                  </Badge>
                </div>
                <SheetTitle className="text-xl">
                  {viewingProgramme.name}
                </SheetTitle>
                <p className="text-xs text-gray-500">
                  ID: {viewingProgramme.id}
                </p>
              </SheetHeader>

              <div className="mt-6 space-y-6 pb-6">
                {/* Description */}
                <section>
                  <h4 className="mb-2 text-sm font-semibold text-gray-900">
                    Keterangan
                  </h4>
                  <p className="text-sm leading-relaxed text-gray-600">
                    {viewingProgramme.description || 'Tiada keterangan.'}
                  </p>
                </section>

                {/* Date & Location */}
                <section className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Butiran Program
                  </h4>
                  <div className="space-y-2 rounded-lg border bg-gray-50/50 p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarDays className="h-4 w-4 shrink-0 text-gray-400" />
                      <span className="text-gray-500">Tarikh:</span>
                      <span className="font-medium text-gray-900">
                        {formatDate(viewingProgramme.startDate)} —{' '}
                        {formatDate(viewingProgramme.endDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
                      <span className="text-gray-500">Lokasi:</span>
                      <span className="font-medium text-gray-900">
                        {viewingProgramme.location || '-'}
                      </span>
                    </div>
                  </div>
                </section>

                {/* Budget Section */}
                <section>
                  <h4 className="mb-2 text-sm font-semibold text-gray-900">
                    Bajet & Perbelanjaan
                  </h4>
                  <div className="rounded-lg border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Perbelanjaan</p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(viewingProgramme.spent)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Jumlah Bajet</p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(viewingProgramme.budget)}
                        </p>
                      </div>
                    </div>
                    <Progress
                      value={
                        viewingProgramme.budget > 0
                          ? Math.min(
                              (viewingProgramme.spent /
                                viewingProgramme.budget) *
                                100,
                              100
                            )
                          : 0
                      }
                      className={`h-3 ${getProgressColor(viewingProgramme.spent, viewingProgramme.budget)}`}
                    />
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span
                        className={
                          viewingProgramme.spent > viewingProgramme.budget
                            ? 'font-semibold text-red-600'
                            : 'text-gray-500'
                        }
                      >
                        {viewingProgramme.budget > 0
                          ? `${Math.round((viewingProgramme.spent / viewingProgramme.budget) * 100)}% digunakan`
                          : 'Tiada bajet'}
                      </span>
                      {viewingProgramme.spent > viewingProgramme.budget && (
                        <span className="font-semibold text-red-600">
                          ⚠ Bajet melebihi!
                        </span>
                      )}
                      {viewingProgramme.budget > 0 &&
                        viewingProgramme.spent <=
                          viewingProgramme.budget && (
                          <span className="text-gray-500">
                            Baki:{' '}
                            {formatCurrency(
                              viewingProgramme.budget -
                                viewingProgramme.spent
                            )}
                          </span>
                        )}
                    </div>
                  </div>
                </section>

                {/* Beneficiaries */}
                <section>
                  <h4 className="mb-2 text-sm font-semibold text-gray-900">
                    Peserta & Sasaran
                  </h4>
                  <div className="rounded-lg border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Peserta Semasa</p>
                        <p className="text-lg font-bold text-gray-900">
                          {viewingProgramme.currentBeneficiaries.toLocaleString(
                            'ms-MY'
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Sasaran</p>
                        <p className="text-lg font-bold text-gray-900">
                          {viewingProgramme.targetBeneficiaries.toLocaleString(
                            'ms-MY'
                          )}
                        </p>
                      </div>
                    </div>
                    <Progress
                      value={
                        viewingProgramme.targetBeneficiaries > 0
                          ? Math.min(
                              (viewingProgramme.currentBeneficiaries /
                                viewingProgramme.targetBeneficiaries) *
                                100,
                              100
                            )
                          : 0
                      }
                      className="h-3 [&>div]:bg-blue-500"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      {viewingProgramme.targetBeneficiaries > 0
                        ? `${Math.round((viewingProgramme.currentBeneficiaries / viewingProgramme.targetBeneficiaries) * 100)}% sasaran dicapai`
                        : 'Tiada sasaran ditetapkan'}
                    </p>
                  </div>
                </section>

                {/* Milestones (Expanded Feature) */}
                <section>
                  <h4 className="mb-2 text-sm font-semibold text-gray-900">
                    Pencapaian & Milestone
                  </h4>
                  <div className="space-y-2">
                    {(viewingProgramme.milestones || [
                      { id: '1', title: 'Penyediaan Modul', targetDate: '2026-05-01', isCompleted: true },
                      { id: '2', title: 'Sesi Onboarding', targetDate: '2026-06-15', isCompleted: false },
                      { id: '3', title: 'Penilaian Fasa 1', targetDate: '2026-08-30', isCompleted: false },
                    ]).map((m) => (
                      <div key={m.id} className="flex items-center justify-between rounded-lg border p-3 bg-white shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-5 w-5 rounded-full flex items-center justify-center border",
                            m.isCompleted ? "bg-green-500 border-green-600 text-white" : "border-slate-300"
                          )}>
                            {m.isCompleted && <CheckCircle2 className="h-3 w-3" />}
                          </div>
                          <div>
                            <p className={cn("text-sm font-medium", m.isCompleted && "line-through text-slate-400")}>{m.title}</p>
                            <p className="text-[10px] text-slate-500">Sasaran: {formatDate(m.targetDate)}</p>
                          </div>
                        </div>
                        {['inkubasi_ai', 'mentoring_bisnes', 'geran_modal', 'scale_up'].includes(viewingProgramme.category) && (
                          <Badge variant="outline" className="text-[9px] bg-purple-50 text-purple-700 border-purple-100">AI Priority</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                {/* Asnafpreneur Special View (Expanded Feature) */}
                {['inkubasi_ai', 'mentoring_bisnes', 'geran_modal', 'scale_up'].includes(viewingProgramme.category) && (
                  <section className="rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 p-5 text-white shadow-lg">
                    <div className="flex items-center gap-2 mb-4">
                      <Rocket className="h-5 w-5 text-indigo-200" />
                      <h4 className="text-sm font-bold uppercase tracking-wider">Asnafpreneur Hub</h4>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs mb-1.5 opacity-90">
                          <span>Business Readiness Score</span>
                          <span className="font-bold">78%</span>
                        </div>
                        <Progress value={78} className="h-1.5 bg-white/20 [&>div]:bg-white" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/10 rounded-lg p-2.5 backdrop-blur-md">
                          <p className="text-[10px] opacity-70">AI Adoption</p>
                          <p className="text-lg font-bold">High</p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-2.5 backdrop-blur-md">
                          <p className="text-[10px] opacity-70">Revenue Pot.</p>
                          <p className="text-lg font-bold">RM2k+</p>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* Related Data */}
                <section>
                  <h4 className="mb-2 text-sm font-semibold text-gray-900">
                    Data Berkaitan
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border bg-gray-50/50 p-3 text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {viewingProgramme.relatedCases}
                      </p>
                      <p className="text-xs text-gray-500">Kes Berkaitan</p>
                    </div>
                    <div className="rounded-lg border bg-gray-50/50 p-3 text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {viewingProgramme.relatedDonations}
                      </p>
                      <p className="text-xs text-gray-500">
                        Derma Berkaitan
                      </p>
                    </div>
                  </div>
                </section>

                {/* Impact Metrics (Placeholder) */}
                <section>
                  <h4 className="mb-2 text-sm font-semibold text-gray-900">
                    Metrik Impak
                  </h4>
                  <div className="rounded-lg border border-dashed bg-gray-50/30 p-6">
                    <div className="flex flex-col items-center text-center">
                      <BarChart3 className="mb-2 h-8 w-8 text-gray-300" />
                      <p className="text-sm font-medium text-gray-500">
                        Metrik impak akan tersedia selepas
                      </p>
                      <p className="text-sm text-gray-500">
                        pelaksanaan program lengkap.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Partners */}
                {viewingProgramme.partners && (
                  <section>
                    <h4 className="mb-2 text-sm font-semibold text-gray-900">
                      Rakan Kongsi
                    </h4>
                    <div className="flex items-start gap-2 rounded-lg border bg-gray-50/50 p-3">
                      <Handshake className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                      <p className="text-sm text-gray-700">
                        {viewingProgramme.partners}
                      </p>
                    </div>
                  </section>
                )}

                {/* Notes */}
                {viewingProgramme.notes && (
                  <section>
                    <h4 className="mb-2 text-sm font-semibold text-gray-900">
                      Nota
                    </h4>
                    <div className="flex items-start gap-2 rounded-lg border bg-gray-50/50 p-3">
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                      <p className="text-sm text-gray-700">
                        {viewingProgramme.notes}
                      </p>
                    </div>
                  </section>
                )}
              </div>

              <SheetFooter className="flex-row gap-2 border-t pt-4 sm:flex-row">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    openEditDialog(viewingProgramme);
                    setViewingProgramme(null);
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => {
                    setDeleteConfirmId(viewingProgramme.id);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Padam
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ─── Delete Confirmation Dialog ───────────────────────────────────── */}
      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Sahkan Padam
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-gray-600">
              Adakah anda pasti ingin memadam program ini? Tindakan ini tidak
              boleh dibatalkan.
            </p>
            {deleteConfirmId && (
              <p className="mt-2 rounded-md bg-red-50 p-2 text-sm font-medium text-red-700">
                {programmes.find((p) => p.id === deleteConfirmId)?.name}
              </p>
            )}
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteConfirmId(null)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              Padam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
