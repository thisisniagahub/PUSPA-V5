'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Shield,
  Users,
  Wallet,
  Target,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  ChevronRight,
  Clock,
  ListChecks,
  BarChart3,
  ArrowDownToLine,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

type CategoryKey =
  | 'pendaftaran'
  | 'tadbirUr'
  | 'kewangan'
  | 'program'
  | 'transparensi';

interface ChecklistItem {
  id: string;
  category: CategoryKey;
  title: string;
  description: string;
  completed: boolean;
  completedAt?: string;
}

interface CategoryDef {
  key: CategoryKey;
  name: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  priority: number;
  priorityLabel: string;
}

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const CATEGORIES: CategoryDef[] = [
  {
    key: 'pendaftaran',
    name: 'Pendaftaran & Undang-Undang',
    icon: Shield,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    priority: 1,
    priorityLabel: 'Tinggi',
  },
  {
    key: 'tadbirUr',
    name: 'Tadbir Urus',
    icon: Users,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    priority: 3,
    priorityLabel: 'Sederhana',
  },
  {
    key: 'kewangan',
    name: 'Kewangan',
    icon: Wallet,
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    priority: 2,
    priorityLabel: 'Tinggi',
  },
  {
    key: 'program',
    name: 'Program',
    icon: Target,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
    priority: 4,
    priorityLabel: 'Sederhana',
  },
  {
    key: 'transparensi',
    name: 'Transparensi',
    icon: Eye,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
    priority: 5,
    priorityLabel: 'Rendah',
  },
];

const INITIAL_ITEMS: ChecklistItem[] = [
  // Pendaftaran & Undang-Undang (3 items, all completed)
  {
    id: 'pendaftaran-1',
    category: 'pendaftaran',
    title: 'Sijil ROS dimuat naik',
    description:
      'Salinan sijil pendaftaran sah dari Jabatan Pendaftaran Pertubuhan Malaysia (ROS) mesti dimuat naik ke sistem.',
    completed: true,
    completedAt: '15 Mac 2026, 10:30 PG',
  },
  {
    id: 'pendaftaran-2',
    category: 'pendaftaran',
    title: 'Nombor pendaftaran ROS direkodkan',
    description:
      'Nombor pendaftaran ROS yang sah dan terkini perlu direkodkan dalam profil organisasi.',
    completed: true,
    completedAt: '15 Mac 2026, 10:35 PG',
  },
  {
    id: 'pendaftaran-3',
    category: 'pendaftaran',
    title: 'Perlembagaan dimuat naik',
    description:
      'Dokumen perlembagaan terkini yang telah diluluskan oleh AGM dan disahkan oleh ROS.',
    completed: true,
    completedAt: '18 Mac 2026, 02:15 PG',
  },

  // Tadbir Urus (3 items, 2 completed)
  {
    id: 'tadbir-1',
    category: 'tadbirUr',
    title: 'Ahli lembaga semasa disenaraikan',
    description:
      'Senarai lengkap ahli lembaga pengarah termasuk nama, jawatan, dan tempoh perkhidmatan.',
    completed: true,
    completedAt: '20 Mac 2026, 09:00 PG',
  },
  {
    id: 'tadbir-2',
    category: 'tadbirUr',
    title: 'Minit AGM terkini dimuat naik',
    description:
      'Minit Mesyuarat Agung Tahunan yang terkini termasuk keputusan dan resolusi yang diluluskan.',
    completed: true,
    completedAt: '22 Mac 2026, 04:45 PG',
  },
  {
    id: 'tadbir-3',
    category: 'tadbirUr',
    title: 'Penyata tahunan dihantar ke ROS',
    description:
      'Bukti penghantaran penyata tahunan kepada ROS dalam tempoh yang ditetapkan oleh undang-undang.',
    completed: false,
  },

  // Kewangan (4 items, 1 completed)
  {
    id: 'kewangan-1',
    category: 'kewangan',
    title: 'Pemilikan akaun bank disahkan',
    description:
      'Surat pengesahan dari bank mengenai pemilikan akaun organisasi beserta nama penandatangan yang sah.',
    completed: false,
  },
  {
    id: 'kewangan-2',
    category: 'kewangan',
    title: 'Penyata kewangan tersedia',
    description:
      'Penyata kewangan organisasi untuk tahun kewangan terkini yang telah disediakan mengikut piawaian.',
    completed: true,
    completedAt: '25 Mac 2026, 11:20 PG',
  },
  {
    id: 'kewangan-3',
    category: 'kewangan',
    title: 'Audit luaran diselesaikan',
    description:
      'Laporan audit luaran yang disediakan oleh firma audit bebas yang berdaftar dengan Lembaga Juruaukara.',
    completed: false,
  },
  {
    id: 'kewangan-4',
    category: 'kewangan',
    title: 'Status pengecualian cukai LHDN didokumenkan',
    description:
      'Surat rasmi dari Lembaga Hasil Dalam Negeri (LHDN) mengenai status pengecualian cukai organisasi.',
    completed: false,
  },

  // Program (3 items, all completed)
  {
    id: 'program-1',
    category: 'program',
    title: 'Rekod penerima manfaat dikekalkan',
    description:
      'Senarai penerima manfaat program lengkap dengan maklumat pengenalan, jumlah bantuan, dan tarikh.',
    completed: true,
    completedAt: '28 Mac 2026, 03:10 PG',
  },
  {
    id: 'program-2',
    category: 'program',
    title: 'Metodologi impak didokumenkan',
    description:
      'Dokumen yang menerangkan secara terperinci kaedah pengukuran dan penilaian impak program.',
    completed: true,
    completedAt: '01 Apr 2026, 09:45 PG',
  },
  {
    id: 'program-3',
    category: 'program',
    title: 'Pengesahan rakan kongsi dalam fail',
    description:
      'Memorandum Persefahaman (MOU) dan dokumen pengesahan dengan rakan kongsi strategik.',
    completed: true,
    completedAt: '01 Apr 2026, 10:00 PG',
  },

  // Transparensi (3 items, none completed)
  {
    id: 'transparensi-1',
    category: 'transparensi',
    title: 'Laporan tahunan diterbitkan',
    description:
      'Laporan tahunan organisasi yang merangkumi aktiviti, kewangan, dan pencapaian untuk tatapan awam.',
    completed: false,
  },
  {
    id: 'transparensi-2',
    category: 'transparensi',
    title: 'Kategori penderma didedahkan',
    description:
      'Pendedahan kategori dan sumber penderma mengikut keperluan peraturan dan prinsip etika.',
    completed: false,
  },
  {
    id: 'transparensi-3',
    category: 'transparensi',
    title: 'Metrik impak disahkan secara bebas',
    description:
      'Pengesahan metrik dan penunjuk impak program oleh pihak penilai bebas yang berkelayakan.',
    completed: false,
  },
];

// ──────────────────────────────────────────────
// Helper: Score Color
// ──────────────────────────────────────────────

function getScoreColor(pct: number) {
  if (pct >= 80) return { text: 'text-cyan-400', stroke: 'stroke-cyan-500', track: 'bg-cyan-500/10', bar: '[&>div]:bg-cyan-500', ring: 'ring-cyan-500/20' };
  if (pct >= 50) return { text: 'text-amber-400', stroke: 'stroke-amber-500', track: 'bg-amber-500/10', bar: '[&>div]:bg-amber-500', ring: 'ring-amber-500/20' };
  return { text: 'text-rose-400', stroke: 'stroke-rose-500', track: 'bg-rose-500/10', bar: '[&>div]:bg-rose-500', ring: 'ring-rose-500/20' };
}

function getScoreLabel(pct: number): string {
  if (pct >= 80) return 'Sangat Baik';
  if (pct >= 50) return 'Sederhana';
  return 'Perlu Perhatian';
}

// ──────────────────────────────────────────────
// Sub-Components
// ──────────────────────────────────────────────

function CircularProgress({
  percentage,
  size = 200,
  strokeWidth = 14,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  const colors = getScoreColor(percentage);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={colors.track}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${colors.stroke} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-5xl font-extrabold tracking-tight ${colors.text}`}>
          {percentage}%
        </span>
        <span className="text-sm text-muted-foreground mt-1">
          {getScoreLabel(percentage)}
        </span>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Page Component
// ──────────────────────────────────────────────

export default function CompliancePage() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | 'semua'>('semua');
  const checklistRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch compliance data from API
  const fetchCompliance = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.get<{
        checklistItems: Array<{
          id: string;
          category: string;
          item: string;
          description: string | null;
          isCompleted: boolean;
          completedAt: string | null;
        }>;
      }>('/compliance');

      if (data?.checklistItems) {
        const mapped: ChecklistItem[] = data.checklistItems.map((ci) => ({
          id: ci.id,
          category: ci.category as CategoryKey,
          title: ci.item,
          description: ci.description || '',
          completed: ci.isCompleted,
          completedAt: ci.completedAt
            ? new Date(ci.completedAt).toLocaleDateString('ms-MY', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })
            : undefined,
        }));
        setItems(mapped);
      }
    } catch (error: any) {
      toast({
        title: 'Ralat',
        description: error?.message || 'Gagal memuatkan data pematuhan.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCompliance();
  }, [fetchCompliance]);

  // ── Computed Values ─────────────────────────

  const completedCount = useMemo(
    () => items.filter((i) => i.completed).length,
    [items],
  );
  const totalCount = items.length;
  const overallPct = Math.round((completedCount / totalCount) * 100);
  const overallColors = getScoreColor(overallPct);

  const categoryScores = useMemo(() => {
    const map: Record<CategoryKey, { completed: number; total: number; pct: number }> = {
      pendaftaran: { completed: 0, total: 0, pct: 0 },
      tadbirUr: { completed: 0, total: 0, pct: 0 },
      kewangan: { completed: 0, total: 0, pct: 0 },
      program: { completed: 0, total: 0, pct: 0 },
      transparensi: { completed: 0, total: 0, pct: 0 },
    };
    items.forEach((item) => {
      map[item.category].total += 1;
      if (item.completed) map[item.category].completed += 1;
    });
    (Object.keys(map) as CategoryKey[]).forEach((k) => {
      map[k].pct = map[k].total > 0 ? Math.round((map[k].completed / map[k].total) * 100) : 0;
    });
    return map;
  }, [items]);

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'semua') return items;
    return items.filter((i) => i.category === selectedCategory);
  }, [items, selectedCategory]);

  const actionItems = useMemo(() => {
    const incomplete = items.filter((i) => !i.completed);
    return incomplete.sort((a, b) => {
      const catA = CATEGORIES.find((c) => c.key === a.category)!;
      const catB = CATEGORIES.find((c) => c.key === b.category)!;
      return catA.priority - catB.priority;
    });
  }, [items]);

  // ── Handlers ────────────────────────────────

  const toggleItem = useCallback(async (id: string) => {
    // Find current item and compute new state optimistically
    const currentItem = items.find((i) => i.id === id);
    if (!currentItem) return;
    const nowCompleted = !currentItem.completed;
    const completedAtStr = nowCompleted
      ? new Date().toLocaleDateString('ms-MY', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      : undefined;

    // Optimistic update
    setItems((prev) =>
      prev.map((item) =>
        item.id !== id
          ? item
          : { ...item, completed: nowCompleted, completedAt: completedAtStr }
      ),
    );

    // Persist to API
    try {
      await api.put('/compliance', {
        id,
        isCompleted: nowCompleted,
      });
      toast({
        title: nowCompleted ? 'Protokol disahkan' : 'Protokol dibatalkan',
        description: nowCompleted
          ? 'Status pematuhan telah dikemas kini.'
          : 'Pengesahan protokol telah dibatalkan.',
      });
    } catch (error: any) {
      // Revert on error
      setItems((prev) =>
        prev.map((item) =>
          item.id !== id
            ? item
            : { ...item, completed: !nowCompleted, completedAt: currentItem.completedAt }
        ),
      );
      toast({
        title: 'Ralat',
        description: error?.message || 'Gagal mengemas kini status pematuhan.',
        variant: 'destructive',
      });
    }
  }, [items, toast]);

  const scrollToChecklist = useCallback(() => {
    checklistRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const focusCategory = useCallback((key: CategoryKey) => {
    setSelectedCategory(key);
    scrollToChecklist();
  }, [scrollToChecklist]);

  // ── Render ──────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Memuatkan data pematuhan...</p>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen bg-transparent flex flex-col">
        {/* ── Header ─────────────────────── */}
        <header className="border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-violet-600 text-white shadow-lg shadow-primary/20">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                  Compliance Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  Kesediaan pematuhan dan transparansi dalam masa nyata
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* ── Overall Compliance Score ── */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10 overflow-hidden shadow-2xl shadow-black/20">
            <CardContent className="py-12">
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <CircularProgress percentage={overallPct} />
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className={cn("text-4xl font-bold tracking-tighter", overallColors.text)}>
                      {overallPct}%
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                      Audit Score
                    </span>
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">
                    Skor Pematuhan PUSPA
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {completedCount} daripada {totalCount} protokol pematuhan telah disahkan
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <Badge
                      variant="outline"
                      className={cn("px-4 py-1 text-xs font-semibold ring-1", overallColors.ring, overallColors.text, "bg-white/5 border-white/10")}
                    >
                      <BarChart3 className="w-3.5 h-3.5 mr-2" />
                      Tahap: {getScoreLabel(overallPct)}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Category Score Cards ──── */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground tracking-tight uppercase opacity-70">
                Skor Mengikut Kategori
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
              {CATEGORIES.map((cat) => {
                const score = categoryScores[cat.key];
                const colors = getScoreColor(score.pct);
                const isActive = selectedCategory === cat.key;
                const Icon = cat.icon;

                return (
                  <button
                    key={cat.key}
                    onClick={() =>
                      setSelectedCategory((prev) =>
                        prev === cat.key ? 'semua' : cat.key,
                      )
                    }
                    className={cn(
                      "text-left transition-all duration-300 rounded-2xl border p-5 group relative overflow-hidden",
                      isActive
                        ? "bg-white/10 border-primary/50 shadow-lg shadow-primary/10 ring-1 ring-primary/20"
                        : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                    )}
                  >
                    <div className="flex items-center gap-3 mb-4 relative z-10">
                      <div
                        className={cn("flex items-center justify-center w-10 h-10 rounded-xl transition-transform group-hover:scale-110", cat.bgColor, cat.color)}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider leading-tight group-hover:text-foreground transition-colors">
                        {cat.name}
                      </span>
                    </div>

                    <div className="space-y-3 relative z-10">
                      <div className="flex items-end justify-between">
                        <span className={cn("text-2xl font-bold tracking-tighter", colors.text)}>
                          {score.pct}%
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground opacity-60">
                          {score.completed}/{score.total}
                        </span>
                      </div>
                      <Progress
                        value={score.pct}
                        className={cn("h-1.5 bg-white/5", colors.bar)}
                      />
                    </div>
                    {isActive && (
                      <div className="absolute top-0 right-0 p-2 text-primary">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedCategory !== 'semua' && (
              <div className="mt-4 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCategory('semua')}
                  className="text-xs text-primary hover:bg-primary/10"
                >
                  ✕ Padam penapis — tunjukkan semua
                </Button>
              </div>
            )}
          </section>

          <Separator className="bg-white/10" />

          {/* ── Compliance Checklist ───── */}
          <section ref={checklistRef}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground uppercase tracking-tight opacity-70">
                  Senarai Semak Pematuhan
                </h2>
              </div>
              <Badge variant="secondary" className="bg-white/10 text-foreground border-white/10 text-xs">
                {filteredItems.filter((i) => i.completed).length}/{filteredItems.length} selesai
              </Badge>
            </div>

            <div className="space-y-6">
              {CATEGORIES.map((cat) => {
                const catItems = filteredItems.filter((i) => i.category === cat.key);
                if (catItems.length === 0) return null;

                const catCompleted = catItems.filter((i) => i.completed).length;
                const Icon = cat.icon;
                const colors = getScoreColor(
                  catItems.length > 0
                    ? Math.round((catCompleted / catItems.length) * 100)
                    : 0,
                );

                return (
                  <Card key={cat.key} className="bg-white/5 backdrop-blur-md border-white/10 overflow-hidden shadow-lg">
                    <CardHeader className="pb-4 border-b border-white/5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn("flex items-center justify-center w-10 h-10 rounded-xl", cat.bgColor, cat.color)}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <CardTitle className="text-base font-bold text-foreground">{cat.name}</CardTitle>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn("text-xs font-bold px-3", colors.text, colors.ring, "bg-white/5 border-white/10")}
                        >
                          {catCompleted}/{catItems.length}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 pb-4">
                      <div className="divide-y divide-white/5">
                        {catItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-start gap-4 py-4 first:pt-0 last:pb-0 group"
                          >
                            <div className="pt-0.5">
                              <Checkbox
                                checked={item.completed}
                                onCheckedChange={() => toggleItem(item.id)}
                                className="mt-0.5 border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                aria-label={item.title}
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 flex-wrap">
                                <span
                                  className={cn("text-sm font-semibold transition-colors tracking-tight", 
                                    item.completed
                                      ? 'text-muted-foreground line-through'
                                      : 'text-foreground'
                                  )}
                                >
                                  {item.title}
                                </span>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      className="inline-flex text-muted-foreground hover:text-primary transition-colors"
                                      aria-label={`Maklumat: ${item.title}`}
                                    >
                                      <Info className="w-4 h-4" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent
                                    side="right"
                                    className="max-w-xs text-xs bg-black/80 backdrop-blur-md border-white/10 text-white"
                                  >
                                    {item.description}
                                  </TooltipContent>
                                </Tooltip>

                                {item.completed ? (
                                  <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-[10px] px-2 py-0">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Selesai
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive" className="text-[10px] px-2 py-0 bg-rose-500/20 text-rose-400 border-rose-500/30">
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Belum Selesai
                                  </Badge>
                                )}
                              </div>

                              {!item.completed && (
                                <p className="text-[10px] text-rose-400 mt-1.5 flex items-center gap-1 font-bold uppercase tracking-wider">
                                  <AlertTriangle className="w-3 h-3" />
                                  Tindakan Diperlukan
                                </p>
                              )}

                              {item.completed && item.completedAt && (
                                <p className="text-[10px] text-muted-foreground/60 mt-1.5 flex items-center gap-1 italic">
                                  <Clock className="w-3 h-3" />
                                  Disiapkan: {item.completedAt}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          <Separator />

          {/* ── Action Items Section ──── */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <ArrowDownToLine className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground uppercase tracking-tight opacity-70">
                Item Tindakan
              </h2>
              <Badge variant="destructive" className="bg-rose-500/20 text-rose-400 border-rose-500/30 text-[10px] px-3 font-bold">
                {actionItems.length} PERLU TINDAKAN
              </Badge>
            </div>

            {actionItems.length === 0 ? (
              <Card className="bg-white/5 backdrop-blur-md border-white/10">
                <CardContent className="py-12 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center mx-auto mb-4 border border-cyan-500/20">
                    <CheckCircle2 className="w-8 h-8 text-cyan-400" />
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    Semua protokol telah disahkan!
                  </p>
                  <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto opacity-70">
                    Sistem PUSPA kini berada dalam tahap pematuhan penuh. Tiada tindakan segera diperlukan.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {actionItems.map((item, idx) => {
                  const cat = CATEGORIES.find((c) => c.key === item.category)!;
                  const Icon = cat.icon;

                  return (
                    <Card key={item.id} className="bg-white/5 backdrop-blur-md border-white/10 hover:border-primary/30 transition-all group overflow-hidden">
                      <CardContent className="py-5">
                        <div className="flex items-start gap-4 sm:gap-6">
                          <div
                            className={cn("flex items-center justify-center w-11 h-11 rounded-xl shrink-0 transition-transform group-hover:scale-105", cat.bgColor, cat.color)}
                          >
                            <Icon className="w-5 h-5" />
                          </div>

                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                                {cat.name}
                              </span>
                              <Badge
                                variant="outline"
                                className={cn("text-[10px] px-2 py-0 border-white/10 bg-white/5",
                                  cat.priority <= 2
                                    ? 'text-rose-400'
                                    : cat.priority <= 4
                                      ? 'text-amber-400'
                                      : 'text-muted-foreground'
                                )}
                              >
                                {cat.priorityLabel}
                              </Badge>
                            </div>
                            <p className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                              {item.title}
                            </p>
                            <p className="text-xs text-rose-400/80 flex items-center gap-1.5 font-medium">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              Tindakan Diperlukan — Protokol kritikal untuk kelulusan audit
                            </p>
                          </div>

                          <div className="shrink-0 flex items-center self-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => focusCategory(item.category)}
                              className="text-xs gap-2 border-white/10 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                            >
                              Sahkan
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          <Separator className="bg-white/10" />

          {/* ── Footer Summary ──── */}
          <footer className="pb-12">
            <Card className="bg-gradient-to-br from-white/5 to-transparent backdrop-blur-md border-white/10 overflow-hidden shadow-2xl">
              <CardContent className="py-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
                  <div className="space-y-1.5">
                    <p className="text-sm font-bold text-foreground uppercase tracking-tight opacity-70">
                      Audit Readiness Summary
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {completedCount}/{totalCount} protokol disahkan •{' '}
                      <span className={cn("font-bold italic", overallColors.text)}>
                        {overallPct >= 80
                          ? 'Gred: AAA (Pematuhan Cemerlang)'
                          : overallPct >= 50
                            ? 'Gred: BBB (Tindakan Diperlukan)'
                            : 'Gred: F (Perhatian Pengurusan Kritikal)'}
                      </span>
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("px-6 py-2 text-sm font-bold tracking-tighter ring-1 shadow-lg shadow-black/20", overallColors.ring, overallColors.text, "bg-white/5 border-white/10")}
                  >
                    {overallPct}% SCORE
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </footer>
        </main>
      </div>
    </TooltipProvider>
  );
}
