"use client";

import React, { useState, useCallback, useMemo, useEffect, useRef, useOptimistic, startTransition } from "react";
import { io, Socket } from "socket.io-client";
// NOTE: Socket.IO only works in local dev (mini-services on port 3003).
// On Vercel serverless, WebSocket is unavailable — features degrade gracefully
// (Live badge shows "Disconnected", real-time sync disabled).
import { api } from "@/lib/api";
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
  Loader2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type ActivityStatus = "dirancang" | "dalam_proses" | "selesai" | "dibatalkan";
type ActivityType = "tugas" | "acara" | "mesyuarat" | "kerja_lapangan";

// API-side types
type ApiActivityStatus = "planned" | "in_progress" | "completed" | "cancelled";
type ApiActivityType = "event" | "meeting" | "training" | "outreach" | "fundraiser" | "volunteer" | "audit" | "visit" | "other";

interface Activity {
  id: string;
  title: string;
  description: string;
  type: ActivityType;
  status: ActivityStatus;
  date: string | null;
  endDate: string | null;
  location: string | null;
  programmeId: string | null;
  programme: string | null;
  assignees: string[];
  notes: string;
}

interface ProgrammeOption {
  id: string;
  name: string;
}

interface ColumnDef {
  id: ActivityStatus;
  label: string;
  icon: string;
  headerClass: string;
  bgClass: string;
  borderClass: string;
}

// ─── Mapping Functions ────────────────────────────────────────────────────────

const UI_TO_API_STATUS: Record<ActivityStatus, ApiActivityStatus> = {
  dirancang: "planned",
  dalam_proses: "in_progress",
  selesai: "completed",
  dibatalkan: "cancelled",
};

const API_TO_UI_STATUS: Record<ApiActivityStatus, ActivityStatus> = {
  planned: "dirancang",
  in_progress: "dalam_proses",
  completed: "selesai",
  cancelled: "dibatalkan",
};

const UI_TO_API_TYPE: Record<ActivityType, ApiActivityType> = {
  tugas: "other",
  acara: "event",
  mesyuarat: "meeting",
  kerja_lapangan: "outreach",
};

const API_TO_UI_TYPE: Record<string, ActivityType> = {
  event: "acara",
  meeting: "mesyuarat",
  training: "tugas",
  outreach: "kerja_lapangan",
  fundraiser: "acara",
  volunteer: "kerja_lapangan",
  audit: "tugas",
  visit: "kerja_lapangan",
  other: "tugas",
};

// Parse assignees from API (JSON string or null) to string array
function parseAssignees(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

// Map an API activity object to the UI Activity shape
function mapApiToUiActivity(raw: Record<string, unknown>): Activity {
  const apiStatus = (raw.status as ApiActivityStatus) || "planned";
  const apiType = (raw.type as string) || "other";
  return {
    id: raw.id as string,
    title: (raw.title as string) || "",
    description: (raw.description as string) || "",
    type: API_TO_UI_TYPE[apiType] || "tugas",
    status: API_TO_UI_STATUS[apiStatus] || "dirancang",
    date: raw.date ? String(raw.date) : null,
    endDate: raw.endDate ? String(raw.endDate) : null,
    location: (raw.location as string) || null,
    programmeId: (raw.programmeId as string) || null,
    programme: (raw.programme && typeof raw.programme === "object")
      ? (raw.programme as Record<string, unknown>).name as string
      : null,
    assignees: parseAssignees(raw.assignees),
    notes: (raw.notes as string) || "",
  };
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
  programmeId: z.string().optional().default(""),
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
  programmes: ProgrammeOption[];
  onSave: (data: ActivityFormData, id?: string) => void;
}

function ActivityFormDialog({
  open,
  onOpenChange,
  activity,
  programmes,
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
      programmeId: activity?.programmeId || "",
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
          programmeId: activity.programmeId || "",
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
              programmeId: activity.programmeId || "",
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
              programmeId: "",
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
  const programmeIdValue = useWatch({
    control: form.control,
    name: "programmeId",
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
              value={programmeIdValue}
              onValueChange={(val) => form.setValue("programmeId", val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih program (pilihan)" />
              </SelectTrigger>
              <SelectContent>
                {programmes.map((prog) => (
                  <SelectItem key={prog.id} value={prog.id}>
                    {prog.name}
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
  const [activities, setActivities] = useState<Activity[]>([]);
  const [programmes, setProgrammes] = useState<ProgrammeOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  // Fetch activities from the API
  const fetchActivities = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.get<Record<string, unknown>[]>("/activities");
      const mapped = data.map(mapApiToUiActivity);
      setActivities(mapped);
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch programmes from the API
  const fetchProgrammes = useCallback(async () => {
    try {
      const data = await api.get<Record<string, unknown>[]>("/programmes");
      const mapped: ProgrammeOption[] = data.map((p) => ({
        id: p.id as string,
        name: p.name as string,
      }));
      setProgrammes(mapped);
    } catch (error) {
      console.error("Failed to fetch programmes:", error);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchActivities();
    fetchProgrammes();
  }, [fetchActivities, fetchProgrammes]);

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

      socket.on('activity-action', (data: { action: string; activity?: Record<string, unknown>; id?: string }) => {
        if (data.action === 'add' && data.activity) {
          const mapped = mapApiToUiActivity(data.activity);
          setActivities((prev) => {
            if (prev.find(a => a.id === mapped.id)) return prev;
            return [...prev, mapped];
          });
        } else if (data.action === 'update' && data.activity) {
          const mapped = mapApiToUiActivity(data.activity);
          setActivities((prev) =>
            prev.map((a) => (a.id === mapped.id ? mapped : a))
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

  const emitAction = useCallback((action: 'add' | 'update' | 'delete', payload: { activity?: Record<string, unknown>, id?: string }) => {
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

      const draggedActivity = optimisticActivities.find((a) => a.id === active.id);

      if (newStatus && draggedActivity && draggedActivity.status !== newStatus) {
        const statusToUpdate = newStatus;
        const activityId = active.id as string;
        const apiStatus = UI_TO_API_STATUS[statusToUpdate];

        startTransition(async () => {
          // Optimistic update for instant UI feedback
          addOptimisticActivity({ id: activityId, status: statusToUpdate });

          try {
            // Call API to update status
            await api.put<Record<string, unknown>>("/activities", {
              id: activityId,
              status: apiStatus,
            });

            // Update local state with the new status
            setActivities((prev) =>
              prev.map((a) =>
                a.id === activityId ? { ...a, status: statusToUpdate } : a
              )
            );
            emitAction('update', { activity: { ...draggedActivity, status: statusToUpdate } as unknown as Record<string, unknown> });
          } catch (error) {
            console.error("Failed to update activity status:", error);
            // Re-fetch to get the correct state from the server
            fetchActivities();
          }
        });
      }
    },
    [optimisticActivities, emitAction, addOptimisticActivity, fetchActivities]
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

      // Optimistic removal
      setActivities((prev) =>
        prev.filter((a) => a.id !== idToDelete)
      );
      emitAction('delete', { id: idToDelete });
      setDeleteOpen(false);
      setDeletingActivity(null);

      // Fire-and-forget API call
      api.delete("/activities", { id: idToDelete }).catch((error) => {
        console.error("Failed to delete activity:", error);
        // Re-fetch to restore correct state
        fetchActivities();
      });
    }
  }, [deletingActivity, emitAction, fetchActivities]);

  // Save (add or edit)
  const handleSave = useCallback(
    (data: ActivityFormData, existingId?: string) => {
      const assignees = data.assignees
        ? data.assignees
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      const programmeId = data.programmeId || undefined;
      const programmeName = programmeId
        ? programmes.find((p) => p.id === programmeId)?.name || null
        : null;

      // Build API payload with mapped values
      const apiPayload: Record<string, unknown> = {
        title: data.title,
        description: data.description || undefined,
        type: UI_TO_API_TYPE[data.type],
        status: UI_TO_API_STATUS[data.status],
        date: data.date || undefined,
        endDate: data.endDate || undefined,
        location: data.location || undefined,
        programmeId: programmeId || undefined,
        assignees: assignees.length > 0 ? assignees : undefined,
        notes: data.notes || undefined,
      };

      if (existingId) {
        // Update existing via API
        api.put<Record<string, unknown>>("/activities", { id: existingId, ...apiPayload })
          .then((updated) => {
            const mapped = mapApiToUiActivity(updated);
            setActivities((prev) =>
              prev.map((a) => (a.id === mapped.id ? mapped : a))
            );
            emitAction('update', { activity: updated });
          })
          .catch((error) => {
            console.error("Failed to update activity:", error);
            fetchActivities();
          });
      } else {
        // Create new via API
        api.post<Record<string, unknown>>("/activities", apiPayload)
          .then((created) => {
            const mapped = mapApiToUiActivity(created);
            setActivities((prev) => [...prev, mapped]);
            emitAction('add', { activity: created });
          })
          .catch((error) => {
            console.error("Failed to create activity:", error);
            fetchActivities();
          });
      }
    },
    [emitAction, fetchActivities, programmes]
  );

  // Refresh — re-fetch from API
  const handleRefresh = useCallback(() => {
    fetchActivities();
  }, [fetchActivities]);

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
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Memuatkan aktiviti...</span>
          </div>
        )}

        {/* Desktop: Kanban Board */}
        {!isLoading && (
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
        )}

        {/* Tablet: Horizontal Scroll Kanban */}
        {!isLoading && (
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
        )}

        {/* Mobile: Vertical Tabs */}
        {!isLoading && (
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
        )}

        {/* Summary Stats */}
        {!isLoading && (
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
        )}
      </main>

      {/* Activity Form Dialog */}
      <ActivityFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        activity={editingActivity}
        programmes={programmes}
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
