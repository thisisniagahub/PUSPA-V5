"use client";

import React, { useState, useCallback, useMemo, useEffect, useRef, useOptimistic, startTransition } from "react";
import { io, Socket } from "socket.io-client";
// NOTE: Socket.IO only works in local dev (mini-services on port 3003).
// On Vercel serverless, WebSocket is unavailable — features degrade gracefully
// (Live badge shows "Disconnected", real-time sync disabled).
import { updateActivityStatus } from "@/app/actions/activities";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverlay,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Plus,
  RefreshCw,
  GripVertical,
  Pencil,
  Trash2,
  CalendarDays,
  MapPin,
  Users,
  FileText,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type ActivityStatus = "dirancang" | "dalam_proses" | "selesai" | "dibatalkan";
type ActivityType = "tugas" | "acara" | "mesyuarat" | "kerja_lapangan";

interface Activity {
  id: string;
  title: string;
  description: string;
  type: ActivityType;
  status: ActivityStatus;
  date: string | null;
  endDate: string | null;
  location: string | null;
  programme: string | null;
  assignees: string[];
  notes: string;
}

interface ColumnDef {
  id: ActivityStatus;
  label: string;
  icon: string;
  headerClass: string;
  bgClass: string;
  borderClass: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const COLUMNS: ColumnDef[] = [
  {
    id: "dirancang",
    label: "Dirancang",
    icon: "\u{1F4CB}",
    headerClass: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white",
    bgClass: "bg-white/5 backdrop-blur-md",
    borderClass: "border-blue-500/20",
  },
  {
    id: "dalam_proses",
    label: "Dalam Proses",
    icon: "\u{1F504}",
    headerClass: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
    bgClass: "bg-white/5 backdrop-blur-md",
    borderClass: "border-amber-500/20",
  },
  {
    id: "selesai",
    label: "Selesai",
    icon: "\u2705",
    headerClass: "bg-gradient-to-r from-emerald-600 to-teal-600 text-white",
    bgClass: "bg-white/5 backdrop-blur-md",
    borderClass: "border-emerald-500/20",
  },
  {
    id: "dibatalkan",
    label: "Dibatalkan",
    icon: "\u274C",
    headerClass: "bg-gradient-to-r from-rose-500 to-red-600 text-white",
    bgClass: "bg-white/5 backdrop-blur-md",
    borderClass: "border-rose-500/20",
  },
];

const TYPE_CONFIG: Record<
  ActivityType,
  { label: string; className: string }
> = {
  tugas: {
    label: "Tugas",
    className: "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600",
  },
  acara: {
    label: "Acara",
    className: "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700",
  },
  mesyuarat: {
    label: "Mesyuarat",
    className: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700",
  },
  kerja_lapangan: {
    label: "Kerja Lapangan",
    className: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700",
  },
};

const STATUS_OPTIONS: { value: ActivityStatus; label: string }[] = [
  { value: "dirancang", label: "Dirancang" },
  { value: "dalam_proses", label: "Dalam Proses" },
  { value: "selesai", label: "Selesai" },
  { value: "dibatalkan", label: "Dibatalkan" },
];

const TYPE_OPTIONS: { value: ActivityType; label: string }[] = [
  { value: "tugas", label: "Tugas" },
  { value: "acara", label: "Acara" },
  { value: "mesyuarat", label: "Mesyuarat" },
  { value: "kerja_lapangan", label: "Kerja Lapangan" },
];

const PROGRAMMES = [
  "Program Bantuan Raya",
  "Program Pendidikan",
  "Program Kesihatan",
  "Program Keusahawanan",
  "Program Kebajikan",
  "Program Dakwah",
];

// ─── Mock Data ───────────────────────────────────────────────────────────────

const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: "1",
    title: "Sembang Santai dengan Asnaf",
    description:
      "Sesi perbincangan santai bersama asnaf untuk mengetahui keperluan dan masalah yang dihadapi mereka.",
    type: "acara",
    status: "dirancang",
    date: "2026-05-15",
    endDate: null,
    location: "Pusat Komuniti PUSPA",
    programme: "Program Kebajikan",
    assignees: ["Ahmad", "Siti"],
    notes: "Sediakan minuman dan makanan ringan.",
  },
  {
    id: "2",
    title: "Agihan Bantuan Raya 2026",
    description:
      "Pengagihan duit raya dan barangan keperluan kepada asnaf yang layak di kawasan Gombak.",
    type: "acara",
    status: "dalam_proses",
    date: "2026-04-28",
    endDate: "2026-04-30",
    location: "Masjid Al-Ehsan, Gombak",
    programme: "Program Bantuan Raya",
    assignees: ["Ustaz Hassan", "Fatimah", "Rizal"],
    notes: "Senarai asnaf telah disahkan oleh jawatankuasa.",
  },
  {
    id: "3",
    title: "Mesyuarat Jawatankuasa Bulanan",
    description:
      "Mesyuarat bulanan untuk membincangkan kemajuan program dan perancangan masa hadapan.",
    type: "mesyuarat",
    status: "dalam_proses",
    date: "2026-04-25",
    endDate: null,
    location: "Bilik Mesyuarat PUSPA",
    programme: null,
    assignees: ["Semua AJK"],
    notes: "Agenda akan diedarkan 3 hari sebelum mesyuarat.",
  },
  {
    id: "4",
    title: "Lawatan ke Rumah Asnaf di Gombak",
    description:
      "Lawatan ke rumah-rumah asnaf untuk menilai keperluan dan memberikan bantuan segera.",
    type: "kerja_lapangan",
    status: "selesai",
    date: "2026-04-20",
    endDate: "2026-04-20",
    location: "Taman Sri Gombak",
    programme: "Program Kebajikan",
    assignees: ["Ali", "Nurul", "Farid"],
    notes: "Jumlah rumah yang dilawati: 15 buah.",
  },
  {
    id: "5",
    title: "Program iftar bersama komuniti",
    description:
      "Program berbuka puasa bersama komuniti setempat termasuk asnaf dan penduduk sekitar.",
    type: "acara",
    status: "selesai",
    date: "2026-04-18",
    endDate: null,
    location: "Dataran Komuniti Gombak",
    programme: "Program Dakwah",
    assignees: ["Jawatankuasa Katering", "Sukarelawan"],
    notes: "Kira-kira 200 orang hadir. Program berjalan lancar.",
  },
  {
    id: "6",
    title: "Kelas Tajwid Mingguan",
    description:
      "Kelas pembelajaran tajwid Al-Quran untuk kanak-kanak dan remaja di kawasan setempat.",
    type: "tugas",
    status: "dirancang",
    date: "2026-05-03",
    endDate: null,
    location: "Surau Al-Hikmah",
    programme: "Program Pendidikan",
    assignees: ["Ustazah Maryam"],
    notes: "Setiap Sabtu, jam 10 pagi hingga 12 tengahari.",
  },
  {
    id: "7",
    title: "Gotong-royong pembersihan masjid",
    description:
      "Aktiviti gotong-royong membersihkan masjid bersama penduduk setempat dan ahli PUSPA.",
    type: "kerja_lapangan",
    status: "dibatalkan",
    date: "2026-04-22",
    endDate: null,
    location: "Masjid Jamek Gombak",
    programme: null,
    assignees: ["Sukarelawan PUSPA"],
    notes: "Dibatalkan kerana cuaca buruk. Akan dijadualkan semula.",
  },
  {
    id: "8",
    title: "Bengkel Keusahawanan",
    description:
      "Bengkel latihan keusahawanan untuk asnaf bagi membantu mereka menjana pendapatan sendiri.",
    type: "acara",
    status: "dirancang",
    date: "2026-05-20",
    endDate: "2026-05-21",
    location: "Dewan Komuniti PUSPA",
    programme: "Program Keusahawanan",
    assignees: ["Encik Kamal", "Puan Aisha"],
    notes: "Menyediakan bahan bengkel dan senarai peserta.",
  },
  {
    id: "9",
    title: "Kempen Derma Darah",
    description:
      "Menguruskan kempen derma darah bersama Hospital Gombak untuk kebajikan komuniti.",
    type: "acara",
    status: "dalam_proses",
    date: "2026-05-10",
    endDate: null,
    location: "Hospital Gombak",
    programme: "Program Kesihatan",
    assignees: ["Dr. Lim", "Sister Aminah"],
    notes: "Target peserta: 100 orang penderma.",
  },
  {
    id: "10",
    title: "Penyediaan Laporan Tahunan",
    description:
      "Menyediakan laporan tahunan aktiviti dan kewangan PUSPA untuk mesyuarat AGM.",
    type: "tugas",
    status: "dirancang",
    date: "2026-06-01",
    endDate: "2026-06-15",
    location: null,
    programme: null,
    assignees: ["Bendahari", "Setiausaha"],
    notes: "Mengumpulkan data daripada semua jawatankuasa.",
  },
];

// ─── Zod Schema ──────────────────────────────────────────────────────────────

const activitySchema = z.object({
  title: z.string().min(1, "Tajuk aktiviti diperlukan"),
  description: z.string().optional().default(""),
  type: z.enum(["tugas", "acara", "mesyuarat", "kerja_lapangan"], {
    message: "Sila pilih jenis aktiviti",
  }),
  status: z.enum(["dirancang", "dalam_proses", "selesai", "dibatalkan"], {
    message: "Sila pilih status",
  }),
  date: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
  location: z.string().optional().default(""),
  programme: z.string().optional().default(""),
  assignees: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

type ActivityFormData = z.infer<typeof activitySchema>;

// ─── Utility Functions ───────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ms-MY", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

// ─── Sortable Activity Card ──────────────────────────────────────────────────

interface SortableCardProps {
  activity: Activity;
  onEdit: (activity: Activity) => void;
  onDelete: (activity: Activity) => void;
}

function SortableActivityCard({
  activity,
  onEdit,
  onDelete,
}: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: activity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const typeConfig = TYPE_CONFIG[activity.type];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-3.5 shadow-xl transition-all duration-300 ${
        isDragging
          ? "scale-105 opacity-70 shadow-2xl ring-2 ring-primary/50 z-50"
          : "hover:shadow-[0_0_20px_rgba(236,178,255,0.1)] hover:border-primary/30 hover:-translate-y-0.5"
      }`}
    >
      {/* Drag Handle + Title */}
      <div className="flex items-start gap-2 mb-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors touch-none"
          aria-label="Seret untuk mengubah status"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <h4 className="font-medium text-sm leading-snug flex-1">
          {activity.title}
        </h4>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(activity)}
            className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            aria-label={`Edit ${activity.title}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(activity)}
            className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            aria-label={`Padam ${activity.title}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Description */}
      {activity.description && (
        <p className="text-xs text-muted-foreground mb-2.5 line-clamp-2">
          {activity.description}
        </p>
      )}

      {/* Badges Row */}
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Type Badge */}
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${typeConfig.className}`}>
          {typeConfig.label}
        </Badge>

        {/* Date Badge */}
        {activity.date && (
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 gap-1"
          >
            <CalendarDays className="h-2.5 w-2.5" />
            {formatDate(activity.date)}
          </Badge>
        )}

        {/* Location Badge */}
        {activity.location && (
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 gap-1"
          >
            <MapPin className="h-2.5 w-2.5" />
            <span className="max-w-[100px] truncate">{activity.location}</span>
          </Badge>
        )}
      </div>

      {/* Programme */}
      {activity.programme && (
        <div className="mt-2 text-[10px] text-muted-foreground flex items-center gap-1">
          <FileText className="h-2.5 w-2.5 flex-shrink-0" />
          <span className="truncate">{activity.programme}</span>
        </div>
      )}

      {/* Assignees */}
      {activity.assignees.length > 0 && (
        <div className="mt-1.5 text-[10px] text-muted-foreground flex items-center gap-1">
          <Users className="h-2.5 w-2.5 flex-shrink-0" />
          <span className="truncate">{activity.assignees.join(", ")}</span>
        </div>
      )}
    </div>
  );
}

// ─── Kanban Column ───────────────────────────────────────────────────────────

interface KanbanColumnProps {
  column: ColumnDef;
  activities: Activity[];
  onEdit: (activity: Activity) => void;
  onDelete: (activity: Activity) => void;
}

function KanbanColumn({ column, activities, onEdit, onDelete }: KanbanColumnProps) {
  return (
    <div
      className={`flex flex-col rounded-xl border ${column.borderClass} ${column.bgClass} min-w-[300px] max-w-[340px] w-full flex-shrink-0`}
    >
      {/* Column Header */}
      <div
        className={`rounded-t-xl px-4 py-3 flex items-center justify-between ${column.headerClass}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-base" role="img" aria-hidden="true">
            {column.icon}
          </span>
          <h3 className="font-semibold text-sm">{column.label}</h3>
        </div>
        <Badge
          className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-[10px] px-1.5 py-0"
        >
          {activities.length}
        </Badge>
      </div>

      {/* Cards */}
      <div className="p-2.5 flex-1 min-h-[120px]">
        <SortableContext
          items={activities.map((a) => a.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2.5">
            {activities.length === 0 && (
              <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
                Tiada aktiviti
              </div>
            )}
            {activities.map((activity) => (
              <SortableActivityCard
                key={activity.id}
                activity={activity}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

// ─── Activity Form Dialog ────────────────────────────────────────────────────

interface ActivityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: Activity | null;
  onSave: (data: ActivityFormData, id?: string) => void;
}

function ActivityFormDialog({
  open,
  onOpenChange,
  activity,
  onSave,
}: ActivityFormDialogProps) {
  const isEditing = !!activity;

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema) as any,
    defaultValues: {
      title: activity?.title || "",
      description: activity?.description || "",
      type: activity?.type || "tugas",
      status: activity?.status || "dirancang",
      date: activity?.date || "",
      endDate: activity?.endDate || "",
      location: activity?.location || "",
      programme: activity?.programme || "",
      assignees: activity?.assignees?.join(", ") || "",
      notes: activity?.notes || "",
    },
    values: activity
      ? {
          title: activity.title,
          description: activity.description,
          type: activity.type,
          status: activity.status,
          date: activity.date || "",
          endDate: activity.endDate || "",
          location: activity.location || "",
          programme: activity.programme || "",
          assignees: activity.assignees.join(", "),
          notes: activity.notes,
        }
      : undefined,
  });

  React.useEffect(() => {
    if (open) {
      form.reset(
        activity
          ? {
              title: activity.title,
              description: activity.description,
              type: activity.type,
              status: activity.status,
              date: activity.date || "",
              endDate: activity.endDate || "",
              location: activity.location || "",
              programme: activity.programme || "",
              assignees: activity.assignees.join(", "),
              notes: activity.notes,
            }
          : {
              title: "",
              description: "",
              type: "tugas",
              status: "dirancang",
              date: "",
              endDate: "",
              location: "",
              programme: "",
              assignees: "",
              notes: "",
            }
      );
    }
  }, [open, activity, form]);

  const handleSubmit = (data: ActivityFormData) => {
    onSave(data, isEditing ? activity!.id : undefined);
    onOpenChange(false);
  };

  const typeValue = useWatch({
    control: form.control,
    name: "type",
  });
  const statusValue = useWatch({
    control: form.control,
    name: "status",
  });
  const programmeValue = useWatch({
    control: form.control,
    name: "programme",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Aktiviti" : "Tambah Aktiviti Baru"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Kemaskini maklumat aktiviti di bawah."
              : "Isikan maklumat untuk menambah aktiviti baru."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Title */}
          <div className="grid gap-2">
            <Label htmlFor="title">
              Tajuk Aktiviti <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Masukkan tajuk aktiviti"
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p className="text-destructive text-xs">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">Penerangan</Label>
            <Textarea
              id="description"
              placeholder="Penerangan ringkas tentang aktiviti"
              rows={3}
              {...form.register("description")}
            />
          </div>

          {/* Type & Status Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Jenis</Label>
              <Select
                value={typeValue}
                onValueChange={(val) =>
                  form.setValue("type", val as ActivityType)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih jenis" />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={statusValue}
                onValueChange={(val) =>
                  form.setValue("status", val as ActivityStatus)
                }
              >
                <SelectTrigger className="w-full">
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

          {/* Date & End Date Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="date">Tarikh Mula</Label>
              <Input
                id="date"
                type="date"
                {...form.register("date")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endDate">Tarikh Tamat</Label>
              <Input
                id="endDate"
                type="date"
                {...form.register("endDate")}
              />
            </div>
          </div>

          {/* Location */}
          <div className="grid gap-2">
            <Label htmlFor="location">Lokasi</Label>
            <Input
              id="location"
              placeholder="Lokasi aktiviti"
              {...form.register("location")}
            />
          </div>

          {/* Programme */}
          <div className="grid gap-2">
            <Label>Program</Label>
            <Select
              value={programmeValue}
              onValueChange={(val) => form.setValue("programme", val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih program (pilihan)" />
              </SelectTrigger>
              <SelectContent>
                {PROGRAMMES.map((prog) => (
                  <SelectItem key={prog} value={prog}>
                    {prog}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assignees */}
          <div className="grid gap-2">
            <Label htmlFor="assignees">Penugasan</Label>
            <Input
              id="assignees"
              placeholder="Nama, dipisahkan dengan koma"
              {...form.register("assignees")}
            />
            <p className="text-[10px] text-muted-foreground">
              Contoh: Ahmad, Siti, Ali
            </p>
          </div>

          {/* Notes */}
          <div className="grid gap-2">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea
              id="notes"
              placeholder="Catatan tambahan (pilihan)"
              rows={2}
              {...form.register("notes")}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit">
              {isEditing ? "Simpan Perubahan" : "Tambah Aktiviti"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Confirmation Dialog ──────────────────────────────────────────────

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: Activity | null;
  onConfirm: () => void;
}

function DeleteConfirmDialog({
  open,
  onOpenChange,
  activity,
  onConfirm,
}: DeleteDialogProps) {
  if (!activity) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Padam Aktiviti?</AlertDialogTitle>
          <AlertDialogDescription>
            Adakah anda pasti ingin memadam aktiviti{" "}
            <span className="font-semibold text-foreground">
              &ldquo;{activity.title}&rdquo;
            </span>
            ? Tindakan ini tidak boleh dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            Padam
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function ActivitiesKanbanPage() {
  const [activities, setActivities] = useState<Activity[]>(INITIAL_ACTIVITIES);
  const [optimisticActivities, addOptimisticActivity] = useOptimistic<Activity[], { id: string, status: ActivityStatus }>(
    activities,
    (state, { id, status }) => state.map(a => a.id === id ? { ...a, status } : a)
  );
  const [formOpen, setFormOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingActivity, setDeletingActivity] = useState<Activity | null>(
    null
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileActiveTab, setMobileActiveTab] = useState<ActivityStatus>(
    "dirancang"
  );

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Only attempt WebSocket in development (local server on port 3003)
    // On Vercel, this gracefully fails and real-time sync is disabled
    if (process.env.NODE_ENV !== 'production') {
      const socket = io('/?XTransformPort=3003', {
        transports: ['websocket', 'polling'],
        forceNew: true,
        reconnection: true,
        timeout: 3000,
      });
      socketRef.current = socket;

      socket.on('connect', () => setIsConnected(true));
      socket.on('disconnect', () => setIsConnected(false));

      socket.on('activity-action', (data: { action: string; activity?: Activity; id?: string }) => {
        if (data.action === 'add' && data.activity) {
          setActivities((prev) => {
            if (prev.find(a => a.id === data.activity!.id)) return prev;
            return [...prev, data.activity!];
          });
        } else if (data.action === 'update' && data.activity) {
          setActivities((prev) =>
            prev.map((a) => (a.id === data.activity!.id ? data.activity! : a))
          );
        } else if (data.action === 'delete' && data.id) {
          setActivities((prev) => prev.filter((a) => a.id !== data.id));
        }
      });

      return () => {
        socket.disconnect();
      };
    }
  }, []);

  const emitAction = useCallback((action: 'add' | 'update' | 'delete', payload: { activity?: Activity, id?: string }) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('activity-action', { action, ...payload });
    }
  }, []);

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group activities by status
  const activitiesByStatus = useMemo(() => {
    const grouped: Record<ActivityStatus, Activity[]> = {
      dirancang: [],
      dalam_proses: [],
      selesai: [],
      dibatalkan: [],
    };
    optimisticActivities.forEach((activity) => {
      grouped[activity.status].push(activity);
    });
    return grouped;
  }, [optimisticActivities]);

  // Active dragging item
  const activeActivity = useMemo(
    () => optimisticActivities.find((a) => a.id === activeId) || null,
    [optimisticActivities, activeId]
  );

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  // Handle drag end — update status based on target column
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over) return;

      // Find which column the item was dropped in
      const targetColumnId = over.id as ActivityStatus;
      const isColumn = COLUMNS.some((col) => col.id === targetColumnId);

      let newStatus: ActivityStatus | null = null;

      if (isColumn) {
        newStatus = targetColumnId;
      } else {
        // If dropped on another card, find the card's status
        const targetCard = optimisticActivities.find((a) => a.id === targetColumnId);
        if (targetCard) {
          newStatus = targetCard.status;
        }
      }

      const activeActivity = optimisticActivities.find((a) => a.id === active.id);

      if (newStatus && activeActivity && activeActivity.status !== newStatus) {
        const statusToUpdate = newStatus;
        const activityId = active.id as string;

        startTransition(async () => {
          // Optimistic update for instant UI feedback
          addOptimisticActivity({ id: activityId, status: statusToUpdate });

          // Call Server Action
          const res = await updateActivityStatus(activityId, statusToUpdate);

          if (res.success) {
            // Update local state if successful
            setActivities((prev) =>
              prev.map((a) =>
                a.id === activityId ? { ...a, status: statusToUpdate } : a
              )
            );
            emitAction('update', { activity: { ...activeActivity, status: statusToUpdate } });
          } else {
            console.error("Failed to update activity status");
            // If failed, state naturally reverts when transition ends because we didn't update activities
          }
        });
      }
    },
    [optimisticActivities, emitAction, addOptimisticActivity]
  );

  // Open add form
  const handleAdd = useCallback(() => {
    setEditingActivity(null);
    setFormOpen(true);
  }, []);

  // Open edit form
  const handleEdit = useCallback((activity: Activity) => {
    setEditingActivity(activity);
    setFormOpen(true);
  }, []);

  // Open delete dialog
  const handleDeleteRequest = useCallback((activity: Activity) => {
    setDeletingActivity(activity);
    setDeleteOpen(true);
  }, []);

  // Confirm delete
  const handleDeleteConfirm = useCallback(() => {
    if (deletingActivity) {
      const idToDelete = deletingActivity.id;
      setActivities((prev) =>
        prev.filter((a) => a.id !== idToDelete)
      );
      emitAction('delete', { id: idToDelete });
      setDeleteOpen(false);
      setDeletingActivity(null);
    }
  }, [deletingActivity, emitAction]);

  // Save (add or edit)
  const handleSave = useCallback(
    (data: ActivityFormData, existingId?: string) => {
      const assignees = data.assignees
        ? data.assignees
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      if (existingId) {
        // Update existing
        let updatedActivity: Activity | null = null;
        setActivities((prev) =>
          prev.map((a) => {
            if (a.id === existingId) {
              updatedActivity = {
                ...a,
                title: data.title,
                description: data.description || "",
                type: data.type,
                status: data.status,
                date: data.date || null,
                endDate: data.endDate || null,
                location: data.location || null,
                programme: data.programme || null,
                assignees,
                notes: data.notes || "",
              };
              return updatedActivity;
            }
            return a;
          })
        );
        if (updatedActivity) {
          emitAction('update', { activity: updatedActivity });
        }
      } else {
        // Add new
        const newActivity: Activity = {
          id: generateId(),
          title: data.title,
          description: data.description || "",
          type: data.type,
          status: data.status,
          date: data.date || null,
          endDate: data.endDate || null,
          location: data.location || null,
          programme: data.programme || null,
          assignees,
          notes: data.notes || "",
        };
        setActivities((prev) => [...prev, newActivity]);
        emitAction('add', { activity: newActivity });
      }
    },
    [emitAction]
  );

  // Refresh
  const handleRefresh = useCallback(() => {
    setActivities(INITIAL_ACTIVITIES);
  }, []);

  // Total activity count
  const totalCount = optimisticActivities.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Pengurusan Aktiviti
                </h1>
                <Badge variant={isConnected ? "default" : "destructive"} className={isConnected ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                  {isConnected ? "Live" : "Disconnected"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {totalCount} aktiviti keseluruhan &middot; Papan Kanban
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Muat Semula
              </Button>
              <Button size="sm" onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-1.5" />
                Tambah Aktiviti
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 sm:py-6">
        {/* Desktop: Kanban Board */}
        <div className="hidden lg:block">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-x-auto pb-4">
              {COLUMNS.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  activities={activitiesByStatus[column.id]}
                  onEdit={handleEdit}
                  onDelete={handleDeleteRequest}
                />
              ))}
            </div>
          </DndContext>
        </div>

        {/* Tablet: Horizontal Scroll Kanban */}
        <div className="hidden md:block lg:hidden">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <ScrollArea className="w-full">
              <div className="flex gap-4 pb-4" style={{ minWidth: "max-content" }}>
                {COLUMNS.map((column) => (
                  <KanbanColumn
                    key={column.id}
                    column={column}
                    activities={activitiesByStatus[column.id]}
                    onEdit={handleEdit}
                    onDelete={handleDeleteRequest}
                  />
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </DndContext>
        </div>

        {/* Mobile: Vertical Tabs */}
        <div className="md:hidden">
          {/* Tab Buttons */}
          <div className="flex gap-1.5 overflow-x-auto pb-3 mb-4 -mx-1 px-1">
            {COLUMNS.map((col) => (
              <button
                key={col.id}
                onClick={() => setMobileActiveTab(col.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  mobileActiveTab === col.id
                    ? col.headerClass + " shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <span>{col.icon}</span>
                <span>{col.label}</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1 py-0 ml-0.5 ${
                    mobileActiveTab === col.id
                      ? "bg-white/20 text-white border-white/30"
                      : ""
                  }`}
                >
                  {activitiesByStatus[col.id].length}
                </Badge>
              </button>
            ))}
          </div>

          {/* Mobile Column Content */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex flex-col gap-2.5">
              {activitiesByStatus[mobileActiveTab].length === 0 && (
                <div className="flex items-center justify-center h-32 text-sm text-muted-foreground rounded-lg border border-dashed">
                  Tiada aktiviti dalam &ldquo;{COLUMNS.find((c) => c.id === mobileActiveTab)?.label}&rdquo;
                </div>
              )}
              {activitiesByStatus[mobileActiveTab].map((activity) => (
                <SortableActivityCard
                  key={activity.id}
                  activity={activity}
                  onEdit={handleEdit}
                  onDelete={handleDeleteRequest}
                />
              ))}
            </div>
          </DndContext>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {COLUMNS.map((col) => (
            <div
              key={col.id}
              className={`rounded-lg border p-3 text-center ${col.bgClass} ${col.borderClass}`}
            >
              <p className="text-2xl font-bold">
                {activitiesByStatus[col.id].length}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {col.icon} {col.label}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Activity Form Dialog */}
      <ActivityFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        activity={editingActivity}
        onSave={handleSave}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        activity={deletingActivity}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
