'use client';

import React, { useState, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Banknote,
  Clock,
  Loader2,
  CheckCircle,
  Plus,
  Search,
  Eye,
  Edit2,
  X,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Ban,
  Play,
  Check,
  ArrowRight,
  Building2,
  CreditCard,
  User,
  StickyNote,
  Link2,
  Target,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

// ─── Types ───────────────────────────────────────────────────────────────────

type DisbursementStatus =
  | 'pending'
  | 'approved'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

interface Disbursement {
  id: string;
  no: string;
  recipientName: string;
  recipientIC: string;
  bankName: string;
  accountNumber: string;
  amount: number;
  purpose: string;
  linkedCase: string;
  linkedProgramme: string;
  scheduledDate: string;
  notes: string;
  status: DisbursementStatus;
  createdAt: string;
}

interface DisbursementFormData {
  recipientName: string;
  recipientIC: string;
  bankName: string;
  accountNumber: string;
  amount: string;
  purpose: string;
  linkedCase: string;
  linkedProgramme: string;
  scheduledDate: string;
  notes: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 5;

const STATUS_CONFIG: Record<
  DisbursementStatus,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  pending: {
    label: 'Menunggu',
    color: 'text-amber-800',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
  },
  approved: {
    label: 'Diluluskan',
    color: 'text-blue-800',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
  },
  processing: {
    label: 'Diproses',
    color: 'text-cyan-800',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-300',
  },
  completed: {
    label: 'Berjaya',
    color: 'text-green-800',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
  },
  failed: {
    label: 'Gagal',
    color: 'text-red-800',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
  },
  cancelled: {
    label: 'Dibatalkan',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
  },
};

const BANK_OPTIONS = [
  'Maybank',
  'CIMB Bank',
  'Public Bank',
  'RHB Bank',
  'Hong Leong Bank',
  'AmBank',
  'Bank Islam',
  'Bank Rakyat',
  'BSN',
  'UOB Bank',
  'OCBC Bank',
  'HSBC Bank',
];

const CASE_OPTIONS = [
  'KES-2024-001 - Bantuan Sara Hidup Keluarga Ahmad',
  'KES-2024-002 - Pembiayaan Perubatan Puan Siti',
  'KES-2024-003 - Bantuan Pendidikan Anak Yatim',
  'KES-2024-004 - Pembinaan Rumah Mangsa Banjir',
  'KES-2024-005 - Bantuan Usahawan Kecil',
  'KES-2024-006 - Sokongan OKU',
];

const PROGRAMME_OPTIONS = [
  'PRG-001 - Program Bantuan Sara Hidup',
  'PRG-002 - Program Kesihatan Komuniti',
  'PRG-003 - Program Pendidikan Anak-anak',
  'PRG-004 - Program Pembangunan Komuniti',
  'PRG-005 - Program Keusahawanan',
  'PRG-006 - Program Sokongan OKU',
];

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'approved', label: 'Diluluskan' },
  { value: 'processing', label: 'Diproses' },
  { value: 'completed', label: 'Berjaya' },
  { value: 'failed', label: 'Gagal' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

// ─── Schema ──────────────────────────────────────────────────────────────────

const disbursementSchema = z.object({
  recipientName: z.string().min(1, 'Nama penerima diperlukan'),
  recipientIC: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  amount: z.string().min(1, 'Jumlah diperlukan'),
  purpose: z.string().min(1, 'Tujuan diperlukan'),
  linkedCase: z.string().optional(),
  linkedProgramme: z.string().optional(),
  scheduledDate: z.string().optional(),
  notes: z.string().optional(),
});

// ─── Mock Data ───────────────────────────────────────────────────────────────

const INITIAL_DATA: Disbursement[] = [
  {
    id: '1',
    no: 'DB-0001',
    recipientName: 'Ahmad bin Ismail',
    recipientIC: '850101-01-5123',
    bankName: 'Maybank',
    accountNumber: '1234 5678 9012',
    amount: 1500,
    purpose: 'Bantuan sara hidup bulan Januari 2025 untuk keluarga yang memerlukan.',
    linkedCase: 'KES-2024-001 - Bantuan Sara Hidup Keluarga Ahmad',
    linkedProgramme: 'PRG-001 - Program Bantuan Sara Hidup',
    scheduledDate: '2025-01-15',
    notes: 'Keluarga dengan 4 orang anak. Bapa bekerja sebagai pemandu teksi.',
    status: 'completed',
    createdAt: '2025-01-02',
  },
  {
    id: '2',
    no: 'DB-0002',
    recipientName: 'Siti binti Hassan',
    recipientIC: '900215-03-5456',
    bankName: 'CIMB Bank',
    accountNumber: '2345 6789 0123',
    amount: 3000,
    purpose: 'Pembiayaan pembedahan dan rawatan lanjut di Hospital Universiti.',
    linkedCase: 'KES-2024-002 - Pembiayaan Perubatan Puan Siti',
    linkedProgramme: 'PRG-002 - Program Kesihatan Komuniti',
    scheduledDate: '2025-01-20',
    notes: 'Pesakit kanser tahap 2. Memerlukan rawatan segera.',
    status: 'approved',
    createdAt: '2025-01-05',
  },
  {
    id: '3',
    no: 'DB-0003',
    recipientName: 'Mohd Farid bin Ali',
    recipientIC: '880512-14-5789',
    bankName: 'Public Bank',
    accountNumber: '3456 7890 1234',
    amount: 800,
    purpose: 'Yuran sekolah dan buku teks untuk semester pertama.',
    linkedCase: 'KES-2024-003 - Bantuan Pendidikan Anak Yatim',
    linkedProgramme: 'PRG-003 - Program Pendidikan Anak-anak',
    scheduledDate: '2025-01-18',
    notes: 'Pelajar cemerlang di Sekolah Menengah Kebangsaan Hulu Kelang.',
    status: 'pending',
    createdAt: '2025-01-08',
  },
  {
    id: '4',
    no: 'DB-0004',
    recipientName: 'Nurul Aisyah binti Md Noor',
    recipientIC: '920830-07-5234',
    bankName: 'RHB Bank',
    accountNumber: '4567 8901 2345',
    amount: 5000,
    purpose: 'Pembinaan semula rumah yang rosak teruk akibat banjir.',
    linkedCase: 'KES-2024-004 - Pembinaan Rumah Mangsa Banjir',
    linkedProgramme: 'PRG-004 - Program Pembangunan Komuniti',
    scheduledDate: '2025-02-01',
    notes: 'Rumah separuh musnah. Keluarga tinggal sementara di pusat pemindahan.',
    status: 'processing',
    createdAt: '2025-01-10',
  },
  {
    id: '5',
    no: 'DB-0005',
    recipientName: 'Rajesh a/l Subramaniam',
    recipientIC: '950710-08-5678',
    bankName: 'Hong Leong Bank',
    accountNumber: '5678 9012 3456',
    amount: 2000,
    purpose: 'Modal permulaan perniagaan makanan ringan di kawasan perumahan.',
    linkedCase: 'KES-2024-005 - Bantuan Usahawan Kecil',
    linkedProgramme: 'PRG-005 - Program Keusahawanan',
    scheduledDate: '2025-01-25',
    notes: 'Usahawan muda. Telah mengikuti kursus keusahawanan asas.',
    status: 'pending',
    createdAt: '2025-01-12',
  },
  {
    id: '6',
    no: 'DB-0006',
    recipientName: 'Lee Siew Ling',
    recipientIC: '870325-10-5901',
    bankName: 'AmBank',
    accountNumber: '6789 0123 4567',
    amount: 1200,
    purpose: 'Bantuan peralatan sokongan untuk orang kurang upaya.',
    linkedCase: 'KES-2024-006 - Sokongan OKU',
    linkedProgramme: 'PRG-006 - Program Sokongan OKU',
    scheduledDate: '2025-01-22',
    notes: 'Kerusi roda dan alat bantu pendengaran.',
    status: 'completed',
    createdAt: '2025-01-03',
  },
  {
    id: '7',
    no: 'DB-0007',
    recipientName: 'Fatimah binti Abdullah',
    recipientIC: '930618-05-5345',
    bankName: 'Bank Islam',
    accountNumber: '7890 1234 5678',
    amount: 450,
    purpose: 'Bantuan keperluan harian dan barangan runcit.',
    linkedCase: 'KES-2024-001 - Bantuan Sara Hidup Keluarga Ahmad',
    linkedProgramme: 'PRG-001 - Program Bantuan Sara Hidup',
    scheduledDate: '2025-01-10',
    notes: 'Ibu tunggal dengan 3 orang anak.',
    status: 'failed',
    createdAt: '2025-01-06',
  },
  {
    id: '8',
    no: 'DB-0008',
    recipientName: 'Kumar a/l Muthu',
    recipientIC: '810405-01-5890',
    bankName: 'Bank Rakyat',
    accountNumber: '8901 2345 6789',
    amount: 2500,
    purpose: 'Pembaikan saluran paip dan bekalan air di rumah.',
    linkedCase: 'KES-2024-004 - Pembinaan Rumah Mangsa Banjir',
    linkedProgramme: 'PRG-004 - Program Pembangunan Komuniti',
    scheduledDate: '2025-02-05',
    notes: 'Kerosakan berpunca dari banjir Disember lalu.',
    status: 'pending',
    createdAt: '2025-01-14',
  },
  {
    id: '9',
    no: 'DB-0009',
    recipientName: 'Aminah binti Yusof',
    recipientIC: '900912-04-5612',
    bankName: 'BSN',
    accountNumber: '9012 3456 7890',
    amount: 600,
    purpose: 'Yuran kursus komputer asas untuk meningkatkan kemahiran.',
    linkedCase: 'KES-2024-005 - Bantuan Usahawan Kecil',
    linkedProgramme: 'PRG-005 - Program Keusahawanan',
    scheduledDate: '2025-01-28',
    notes: 'Ingin memulakan perniagaan dalam talian.',
    status: 'cancelled',
    createdAt: '2025-01-09',
  },
  {
    id: '10',
    no: 'DB-0010',
    recipientName: 'Tan Wei Ming',
    recipientIC: '960123-14-5478',
    bankName: 'UOB Bank',
    accountNumber: '0123 4567 8901',
    amount: 750,
    purpose: 'Pembelian buku rujukan dan alat tulis untuk peperiksaan SPM.',
    linkedCase: 'KES-2024-003 - Bantuan Pendidikan Anak Yatim',
    linkedProgramme: 'PRG-003 - Program Pendidikan Anak-anak',
    scheduledDate: '2025-01-30',
    notes: 'Pelajar tingkatan 5 dari keluarga berpendapatan rendah.',
    status: 'approved',
    createdAt: '2025-01-11',
  },
  {
    id: '11',
    no: 'DB-0011',
    recipientName: 'Zulkifli bin Hamid',
    recipientIC: '840628-01-5234',
    bankName: 'OCBC Bank',
    accountNumber: '1122 3344 5566',
    amount: 1800,
    purpose: 'Bantuan perubatan untuk rawatan diabetes dan komplikasi buah pinggang.',
    linkedCase: 'KES-2024-002 - Pembiayaan Perubatan Puan Siti',
    linkedProgramme: 'PRG-002 - Program Kesihatan Komuniti',
    scheduledDate: '2025-02-10',
    notes: 'Pesakit diabetes kronik. Memerlukan dialisis dua kali seminggu.',
    status: 'processing',
    createdAt: '2025-01-13',
  },
  {
    id: '12',
    no: 'DB-0012',
    recipientName: 'Susila a/p Rajan',
    recipientIC: '990517-10-5670',
    bankName: 'HSBC Bank',
    accountNumber: '2233 4455 6677',
    amount: 350,
    purpose: 'Bantuan makanan tambahan dan susu untuk kanak-kanak kurang pemakanan.',
    linkedCase: 'KES-2024-006 - Sokongan OKU',
    linkedProgramme: 'PRG-006 - Program Sokongan OKU',
    scheduledDate: '2025-01-16',
    notes: 'Anak berusia 3 tahun dengan masalah kurang berat badan.',
    status: 'pending',
    createdAt: '2025-01-15',
  },
];

// ─── Helper Functions ────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return `RM ${amount.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ms-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function generateNo(existing: Disbursement[]): string {
  if (existing.length === 0) return 'DB-0001';
  const numbers = existing.map((d) => parseInt(d.no.replace('DB-', ''), 10));
  const maxNo = Math.max(...numbers);
  return `DB-${String(maxNo + 1).padStart(4, '0')}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DisbursementsPage() {

  // ── State ────────────────────────────────────────────────────────────────
  const [data, setData] = useState<Disbursement[]>(INITIAL_DATA);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);

  // Alert dialog state
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertAction, setAlertAction] = useState<'reject' | 'cancel' | null>(null);

  // ── Computed ─────────────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch =
        search === '' ||
        item.recipientName.toLowerCase().includes(search.toLowerCase()) ||
        item.no.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [data, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const summaryStats = useMemo(() => {
    const totalAmount = data.reduce((sum, d) => sum + d.amount, 0);
    const pending = data.filter((d) => d.status === 'pending').length;
    const processing = data.filter((d) => d.status === 'processing').length;
    const completed = data.filter((d) => d.status === 'completed').length;
    return { totalAmount, pending, processing, completed };
  }, [data]);

  const viewingItem = useMemo(
    () => data.find((d) => d.id === viewingId),
    [data, viewingId]
  );

  const editingItem = useMemo(
    () => (editingId ? data.find((d) => d.id === editingId) : null),
    [data, editingId]
  );

  // ── Form ─────────────────────────────────────────────────────────────────
  const form = useForm<DisbursementFormData>({
    resolver: zodResolver(disbursementSchema) as any,
    defaultValues: {
      recipientName: '',
      recipientIC: '',
      bankName: '',
      accountNumber: '',
      amount: '',
      purpose: '',
      linkedCase: '',
      linkedProgramme: '',
      scheduledDate: '',
      notes: '',
    },
  });

  // ── Handlers ─────────────────────────────────────────────────────────────
  function openCreateDialog() {
    setEditingId(null);
    form.reset({
      recipientName: '',
      recipientIC: '',
      bankName: '',
      accountNumber: '',
      amount: '',
      purpose: '',
      linkedCase: '',
      linkedProgramme: '',
      scheduledDate: '',
      notes: '',
    });
    setDialogOpen(true);
  }

  function openEditDialog(item: Disbursement) {
    setEditingId(item.id);
    form.reset({
      recipientName: item.recipientName,
      recipientIC: item.recipientIC || '',
      bankName: item.bankName || '',
      accountNumber: item.accountNumber || '',
      amount: String(item.amount),
      purpose: item.purpose,
      linkedCase: item.linkedCase || '',
      linkedProgramme: item.linkedProgramme || '',
      scheduledDate: item.scheduledDate || '',
      notes: item.notes || '',
    });
    setDialogOpen(true);
  }

  function openViewSheet(item: Disbursement) {
    setViewingId(item.id);
    setSheetOpen(true);
  }

  function onSubmit(formData: DisbursementFormData) {
    if (editingId) {
      setData((prev) =>
        prev.map((d) =>
          d.id === editingId
            ? {
                ...d,
                recipientName: formData.recipientName,
                recipientIC: formData.recipientIC,
                bankName: formData.bankName,
                accountNumber: formData.accountNumber,
                amount: parseFloat(formData.amount) || 0,
                purpose: formData.purpose,
                linkedCase: formData.linkedCase,
                linkedProgramme: formData.linkedProgramme,
                scheduledDate: formData.scheduledDate,
                notes: formData.notes,
              }
            : d
        )
      );
    } else {
      const newItem: Disbursement = {
        id: String(Date.now()),
        no: generateNo(data),
        recipientName: formData.recipientName,
        recipientIC: formData.recipientIC,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        amount: parseFloat(formData.amount) || 0,
        purpose: formData.purpose,
        linkedCase: formData.linkedCase,
        linkedProgramme: formData.linkedProgramme,
        scheduledDate: formData.scheduledDate,
        notes: formData.notes,
        status: 'pending',
        createdAt: new Date().toISOString().split('T')[0],
      };
      setData((prev) => [...prev, newItem]);
    }
    setDialogOpen(false);
    form.reset();
    setEditingId(null);
  }

  function advanceStatus(id: string) {
    setData((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const flow: Record<string, DisbursementStatus> = {
          pending: 'approved',
          approved: 'processing',
          processing: 'completed',
        };
        return flow[d.status] ? { ...d, status: flow[d.status] } : d;
      })
    );
  }

  function handleRejectOrCancel() {
    if (!viewingItem || !alertAction) return;
    const newStatus: DisbursementStatus = alertAction === 'reject' ? 'failed' : 'cancelled';
    setData((prev) =>
      prev.map((d) => (d.id === viewingItem.id ? { ...d, status: newStatus } : d))
    );
    setAlertOpen(false);
    setAlertAction(null);
    setSheetOpen(false);
  }

  function openAlert(action: 'reject' | 'cancel') {
    setAlertAction(action);
    setAlertOpen(true);
  }

  // ── Sub-components ───────────────────────────────────────────────────────

  function StatusBadge({ status }: { status: DisbursementStatus }) {
    const cfg = STATUS_CONFIG[status];
    return (
      <Badge
        variant="outline"
        className={`${cfg.bgColor} ${cfg.color} ${cfg.borderColor} border font-medium text-xs px-2.5 py-0.5`}
      >
        {cfg.label}
      </Badge>
    );
  }

  function SummaryCard({
    icon: Icon,
    title,
    value,
    subtitle,
    iconBg,
    iconColor,
  }: {
    icon: React.ElementType;
    title: string;
    value: string;
    subtitle?: string;
    iconBg: string;
    iconColor: string;
  }) {
    return (
      <Card className="border shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-4">
            <div className={`rounded-xl p-2.5 ${iconBg}`}>
              <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{title}</p>
              <p className="text-lg sm:text-2xl font-bold tracking-tight">{value}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  function MobileCard({ item }: { item: Disbursement }) {
    return (
      <Card className="border shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <p className="font-semibold text-sm">{item.no}</p>
              <p className="text-sm text-muted-foreground">{item.recipientName}</p>
            </div>
            <StatusBadge status={item.status} />
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Jumlah</span>
              <span className="font-semibold text-emerald-700">{formatCurrency(item.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tujuan</span>
              <span className="text-right max-w-[60%] truncate">{item.purpose}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tarikh</span>
              <span>{formatDate(item.createdAt)}</span>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => openViewSheet(item)}
            >
              <Eye className="h-4 w-4 mr-1.5" />
              Lihat
            </Button>
            {item.status === 'pending' && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => openEditDialog(item)}
              >
                <Edit2 className="h-4 w-4 mr-1.5" />
                Edit
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  function DisbursementForm() {
    const bankName = useWatch({
      control: form.control,
      name: 'bankName',
    });
    const linkedCase = useWatch({
      control: form.control,
      name: 'linkedCase',
    });
    const linkedProgramme = useWatch({
      control: form.control,
      name: 'linkedProgramme',
    });

    return (
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Recipient info */}
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Maklumat Penerima
          </h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="recipientName" className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              Nama Penerima <span className="text-red-500">*</span>
            </Label>
            <Input
              id="recipientName"
              placeholder="Masukkan nama penerima"
              {...form.register('recipientName')}
            />
            {form.formState.errors.recipientName && (
              <p className="text-xs text-red-500">{form.formState.errors.recipientName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipientIC" className="flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5" />
              No. Kad Pengenalan
            </Label>
            <Input
              id="recipientIC"
              placeholder="Contoh: 850101-01-5123"
              {...form.register('recipientIC')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankName" className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              Nama Bank
            </Label>
            <Select
              value={bankName}
              onValueChange={(val) => form.setValue('bankName', val)}
            >
              <SelectTrigger id="bankName">
                <SelectValue placeholder="Pilih bank" />
              </SelectTrigger>
              <SelectContent>
                {BANK_OPTIONS.map((bank) => (
                  <SelectItem key={bank} value={bank}>
                    {bank}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="accountNumber" className="flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5" />
              No. Akaun Bank
            </Label>
            <Input
              id="accountNumber"
              placeholder="Contoh: 1234 5678 9012"
              {...form.register('accountNumber')}
            />
          </div>
        </div>

        <Separator />

        {/* Payment details */}
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Butiran Pembayaran
          </h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center gap-1.5">
              <Banknote className="h-3.5 w-3.5" />
              Jumlah (RM) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              {...form.register('amount')}
            />
            {form.formState.errors.amount && (
              <p className="text-xs text-red-500">{form.formState.errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduledDate" className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Tarikh Dijadualkan
            </Label>
            <Input
              id="scheduledDate"
              type="date"
              {...form.register('scheduledDate')}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="purpose" className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Tujuan <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="purpose"
              placeholder="Terangkan tujuan pembayaran ini"
              rows={3}
              {...form.register('purpose')}
            />
            {form.formState.errors.purpose && (
              <p className="text-xs text-red-500">{form.formState.errors.purpose.message}</p>
            )}
          </div>
        </div>

        <Separator />

        {/* Linked records */}
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Kes &amp; Program Berkaitan
          </h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="linkedCase" className="flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5" />
              Kes Berkaitan
            </Label>
            <Select
              value={linkedCase}
              onValueChange={(val) => form.setValue('linkedCase', val)}
            >
              <SelectTrigger id="linkedCase">
                <SelectValue placeholder="Pilih kes" />
              </SelectTrigger>
              <SelectContent>
                {CASE_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedProgramme" className="flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" />
              Program Berkaitan
            </Label>
            <Select
              value={linkedProgramme}
              onValueChange={(val) => form.setValue('linkedProgramme', val)}
            >
              <SelectTrigger id="linkedProgramme">
                <SelectValue placeholder="Pilih program" />
              </SelectTrigger>
              <SelectContent>
                {PROGRAMME_OPTIONS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="flex items-center gap-1.5">
            <StickyNote className="h-3.5 w-3.5" />
            Catatan
          </Label>
          <Textarea
            id="notes"
            placeholder="Catatan tambahan (pilihan)"
            rows={2}
            {...form.register('notes')}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
            Batal
          </Button>
          <Button type="submit">{editingId ? 'Kemaskini' : 'Buat Pembayaran'}</Button>
        </div>
      </form>
    );
  }

  function ViewSheetContent() {
    if (!viewingItem) return null;
    const item = viewingItem;

    const cfg = STATUS_CONFIG[item.status];

    function getAvailableActions() {
      const actions: { label: string; action: () => void; variant: 'default' | 'destructive' | 'outline'; icon: React.ElementType }[] = [];

      if (item.status === 'pending') {
        actions.push({
          label: 'Luluskan',
          action: () => advanceStatus(item.id),
          variant: 'default',
          icon: Check,
        });
        actions.push({
          label: 'Tolak',
          action: () => openAlert('reject'),
          variant: 'destructive',
          icon: Ban,
        });
      } else if (item.status === 'approved') {
        actions.push({
          label: 'Proses',
          action: () => advanceStatus(item.id),
          variant: 'default',
          icon: Play,
        });
        actions.push({
          label: 'Batalkan',
          action: () => openAlert('cancel'),
          variant: 'destructive',
          icon: Ban,
        });
      } else if (item.status === 'processing') {
        actions.push({
          label: 'Selesai',
          action: () => advanceStatus(item.id),
          variant: 'default',
          icon: Check,
        });
      }

      return actions;
    }

    const actions = getAvailableActions();

    return (
      <div className="space-y-6 overflow-y-auto h-full pb-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{viewingItem.no}</p>
            <h3 className="text-lg font-bold">{viewingItem.recipientName}</h3>
          </div>
          <StatusBadge status={viewingItem.status} />
        </div>

        {/* Workflow progress */}
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Aliran Kerja
          </p>
          <div className="flex items-center justify-between gap-1">
            {(['pending', 'approved', 'processing', 'completed'] as const).map((step, idx) => {
              const stepLabels: Record<string, string> = {
                pending: 'Menunggu',
                approved: 'Diluluskan',
                processing: 'Diproses',
                completed: 'Berjaya',
              };
              const statusOrder = ['pending', 'approved', 'processing', 'completed', 'failed', 'cancelled'];
              const currentIdx = statusOrder.indexOf(viewingItem.status);
              const stepIdx = statusOrder.indexOf(step);

              const isActive = viewingItem.status === step;
              const isDone = stepIdx < currentIdx || (viewingItem.status === 'completed');
              const isTerminalFailed = (viewingItem.status === 'failed' || viewingItem.status === 'cancelled') && stepIdx > currentIdx;

              return (
                <React.Fragment key={step}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                        isDone
                          ? 'bg-green-500 border-green-500 text-white'
                          : isActive
                          ? `${cfg.bgColor} ${cfg.borderColor} ${cfg.color}`
                          : isTerminalFailed
                          ? 'bg-gray-200 border-gray-300 text-gray-400'
                          : 'bg-white border-gray-300 text-gray-400'
                      }`}
                    >
                      {isDone ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span
                      className={`text-[10px] sm:text-xs text-center leading-tight ${
                        isActive ? 'font-semibold' : 'text-muted-foreground'
                      }`}
                    >
                      {stepLabels[step]}
                    </span>
                  </div>
                  {idx < 3 && (
                    <div className="flex-1 mt-[-18px]">
                      <div
                        className={`h-0.5 rounded ${
                          isDone ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
          {(viewingItem.status === 'failed' || viewingItem.status === 'cancelled') && (
            <div className="mt-3 text-center">
              <Badge
                variant="outline"
                className={`${STATUS_CONFIG[viewingItem.status].bgColor} ${STATUS_CONFIG[viewingItem.status].color} ${STATUS_CONFIG[viewingItem.status].borderColor} border`}
              >
                {STATUS_CONFIG[viewingItem.status].label}
              </Badge>
            </div>
          )}
        </div>

        <Separator />

        {/* Recipient details */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Maklumat Penerima
          </h4>
          <div className="grid gap-3 text-sm">
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">No. KP</span>
              <span className="font-medium">{viewingItem.recipientIC || '-'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Bank</span>
              <span className="font-medium">{viewingItem.bankName || '-'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">No. Akaun</span>
              <span className="font-medium font-mono">{viewingItem.accountNumber || '-'}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Payment details */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Butiran Pembayaran
          </h4>
          <div className="grid gap-3 text-sm">
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Jumlah</span>
              <span className="font-bold text-emerald-700 text-base">
                {formatCurrency(viewingItem.amount)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Tujuan</span>
              <span className="font-medium text-right max-w-[60%]">{viewingItem.purpose}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Tarikh Dijadualkan</span>
              <span className="font-medium">{formatDate(viewingItem.scheduledDate)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Tarikh Dicipta</span>
              <span className="font-medium">{formatDate(viewingItem.createdAt)}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Linked records */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Kes &amp; Program Berkaitan
          </h4>
          <div className="grid gap-3 text-sm">
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Kes</span>
              <span className="font-medium text-right max-w-[60%]">
                {viewingItem.linkedCase || '-'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Program</span>
              <span className="font-medium text-right max-w-[60%]">
                {viewingItem.linkedProgramme || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {viewingItem.notes && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Catatan
              </h4>
              <p className="text-sm bg-muted/50 rounded-lg p-3">{viewingItem.notes}</p>
            </div>
          </>
        )}

        {/* Action buttons */}
        {actions.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Tindakan
              </h4>
              <div className="flex flex-wrap gap-2">
                {actions.map((act) => (
                  <Button
                    key={act.label}
                    variant={act.variant}
                    size="sm"
                    onClick={act.action}
                    className="gap-1.5"
                  >
                    <act.icon className="h-4 w-4" />
                    {act.label}
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Main Render ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0c10] text-white p-4 lg:p-8">
      {/* Aurora Background Ambient Layer */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-5%] right-[-5%] w-[30%] h-[30%] bg-emerald-600/10 blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[30%] bg-blue-600/10 blur-[100px] animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/5 backdrop-blur-xl border-b border-white/10 shadow-sm rounded-2xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Pengurusan Pembayaran
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                Urus dan jejak semua pembayaran disbursement PUSPA
              </p>
            </div>
            <Button onClick={openCreateDialog} className="gap-2 shadow-sm">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Buat Pembayaran</span>
              <span className="sm:hidden">Buat</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <SummaryCard
            icon={Banknote}
            title="Jumlah Pembayaran"
            value={formatCurrency(summaryStats.totalAmount)}
            subtitle={`${data.length} transaksi`}
            iconBg="bg-emerald-100"
            iconColor="text-emerald-600"
          />
          <SummaryCard
            icon={Clock}
            title="Menunggu Kelulusan"
            value={String(summaryStats.pending)}
            subtitle="Memerlukan tindakan"
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
          />
          <SummaryCard
            icon={Loader2}
            title="Sedang Diproses"
            value={String(summaryStats.processing)}
            subtitle="Dalam pemprosesan"
            iconBg="bg-cyan-100"
            iconColor="text-cyan-600"
          />
          <SummaryCard
            icon={CheckCircle}
            title="Berjaya"
            value={String(summaryStats.completed)}
            subtitle="Pembayaran selesai"
            iconBg="bg-green-100"
            iconColor="text-green-600"
          />
        </div>

        {/* Filter bar */}
        <Card className="border shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama penerima atau no. pembayaran..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {FILTER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Desktop Table */}
        <Card className="border shadow-sm hidden md:block">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-[130px] text-xs font-semibold">No. Pembayaran</TableHead>
                    <TableHead className="text-xs font-semibold">Penerima</TableHead>
                    <TableHead className="text-right text-xs font-semibold">Jumlah (RM)</TableHead>
                    <TableHead className="text-xs font-semibold max-w-[200px]">Tujuan</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold">Tarikh</TableHead>
                    <TableHead className="text-right text-xs font-semibold">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Search className="h-8 w-8 opacity-30" />
                          <p>Tiada pembayaran dijumpai</p>
                          <p className="text-xs">
                            Cuba ubah carian atau tapis status
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((item) => (
                      <TableRow key={item.id} className="group">
                        <TableCell className="font-mono text-sm font-medium">
                          {item.no}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{item.recipientName}</p>
                            <p className="text-xs text-muted-foreground">{item.recipientIC}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-sm">
                          {formatCurrency(item.amount)}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <p className="text-sm truncate" title={item.purpose}>
                            {item.purpose}
                          </p>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={item.status} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(item.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openViewSheet(item)}
                              title="Lihat butiran"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {item.status === 'pending' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEditDialog(item)}
                                title="Edit"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {filteredData.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Menunjukkan {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} daripada{' '}
                  {filteredData.length}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {paginatedData.length === 0 ? (
            <Card className="border">
              <CardContent className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                <Search className="h-8 w-8 opacity-30" />
                <p>Tiada pembayaran dijumpai</p>
                <p className="text-xs">Cuba ubah carian atau tapis status</p>
              </CardContent>
            </Card>
          ) : (
            paginatedData.map((item) => <MobileCard key={item.id} item={item} />)
          )}

          {/* Mobile pagination */}
          {filteredData.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} /{' '}
                {filteredData.length}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm px-2 font-medium">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Create/Edit Dialog ──────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingId ? (
                <>
                  <Edit2 className="h-5 w-5" />
                  Kemaskini Pembayaran
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  Buat Pembayaran Baharu
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <DisbursementForm />
        </DialogContent>
      </Dialog>

      {/* ── View Sheet ──────────────────────────────────────────────────── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto border-white/10 bg-slate-900 text-white">
          <SheetHeader className="border-b border-white/10 pb-4">
            <SheetTitle className="flex items-center gap-2 text-white">
              <Eye className="h-5 w-5" />
              Butiran Pembayaran
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <ViewSheetContent />
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Alert Dialog for Reject/Cancel ──────────────────────────────── */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent className="border-white/10 bg-slate-900 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-white">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {alertAction === 'reject' ? 'Tolak Pembayaran' : 'Batalkan Pembayaran'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              {alertAction === 'reject'
                ? 'Anda pasti ingin menolak pembayaran ini? Tindakan ini tidak boleh diundur.'
                : 'Anda pasti ingin membatalkan pembayaran ini? Tindakan ini tidak boleh diundur.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAlertAction(null)} className="border-white/10 bg-white/5 text-white hover:bg-white/10">Tidak</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectOrCancel}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Ya, {alertAction === 'reject' ? 'Tolak' : 'Batalkan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
}
