import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Recruitment, RecruitmentStep } from "@shared/schema";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
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
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  FileText,
  Calendar,
  User,
  Shield,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Loader2,
  Pencil,
  Trash2,
  StickyNote,
  Plus,
  GripVertical,
} from "lucide-react";
import React, { useState, useMemo, useCallback } from "react";
import { useLocation } from "wouter";

// ─── dnd-kit ────────────────────────────────────────────────────────
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";

interface RecruitmentWithSteps extends Recruitment {
  steps: RecruitmentStep[];
}

// ─── Default form state for add/edit step ─────────────────────────────
const EMPTY_STEP_FORM = {
  title: "",
  description: "",
  responsible: "",
  approver: "",
  forms: "",
  estimatedDays: "1",
  notes: "",
};

// ─── Step Form Fields (shared between Add and Edit dialogs) ────────
// Defined at module level so React sees a stable component identity
// across parent re-renders (prevents input focus loss on keystroke).
function StepFormFields({
  form,
  setForm,
}: {
  form: typeof EMPTY_STEP_FORM;
  setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_STEP_FORM>>;
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm font-medium">Title</Label>
        <Input
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="e.g., Complete Background Check"
          data-testid="input-step-title"
        />
      </div>
      <div>
        <Label className="text-sm font-medium">Description</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="What needs to happen in this step..."
          className="min-h-[70px]"
          data-testid="input-step-description"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm font-medium">Responsible</Label>
          <Input
            value={form.responsible}
            onChange={(e) => setForm((f) => ({ ...f, responsible: e.target.value }))}
            placeholder="e.g., Dean / HR"
            data-testid="input-step-responsible"
          />
        </div>
        <div>
          <Label className="text-sm font-medium">Approver</Label>
          <Input
            value={form.approver}
            onChange={(e) => setForm((f) => ({ ...f, approver: e.target.value }))}
            placeholder="e.g., College President"
            data-testid="input-step-approver"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm font-medium">Forms (comma-separated)</Label>
          <Input
            value={form.forms}
            onChange={(e) => setForm((f) => ({ ...f, forms: e.target.value }))}
            placeholder="e.g., Form A, Form B"
            data-testid="input-step-forms"
          />
        </div>
        <div>
          <Label className="text-sm font-medium">Estimated Days</Label>
          <Input
            type="number"
            min="1"
            value={form.estimatedDays}
            onChange={(e) => setForm((f) => ({ ...f, estimatedDays: e.target.value }))}
            data-testid="input-step-days"
          />
        </div>
      </div>
      <div>
        <Label className="text-sm font-medium">Notes</Label>
        <Textarea
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder="Additional notes..."
          className="min-h-[50px]"
          data-testid="input-step-notes"
        />
      </div>
    </div>
  );
}

// ─── Sortable Step Row Component ────────────────────────────────────
function SortableStepRow({
  step,
  overdue,
  noteExpanded,
  editingDays,
  daysValue,
  updateStepMutation,
  onToggle,
  onEditDaysStart,
  onDaysChange,
  onDaysSave,
  onDaysCancel,
  onNotesSave,
  onToggleNotes,
  onEditStep,
  onDeleteStep,
  parseForms,
  formatDate,
  getStatusIcon,
}: {
  step: RecruitmentStep;
  overdue: boolean;
  noteExpanded: boolean;
  editingDays: number | null;
  daysValue: string;
  updateStepMutation: { isPending: boolean };
  onToggle: () => void;
  onEditDaysStart: () => void;
  onDaysChange: (v: string) => void;
  onDaysSave: () => void;
  onDaysCancel: () => void;
  onNotesSave: (notes: string) => void;
  onToggleNotes: () => void;
  onEditStep: () => void;
  onDeleteStep: () => void;
  parseForms: (forms: string | null) => string[];
  formatDate: (d: string | null) => string;
  getStatusIcon: (s: string) => JSX.Element;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: isDragging ? "relative" as const : undefined,
  };

  const forms = parseForms(step.forms);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`px-4 py-3 border-b border-border last:border-b-0 ${
        step.status === "completed" ? "bg-muted/30" : overdue ? "bg-destructive/5" : ""
      } ${isDragging ? "opacity-50 bg-muted shadow-lg rounded" : ""}`}
      data-testid={`step-${step.id}`}
    >
      <div className="flex items-start gap-2">
        {/* Drag Handle */}
        <button
          className="mt-1 shrink-0 cursor-grab active:cursor-grabbing touch-none p-0.5 rounded text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          {...attributes}
          {...listeners}
          title="Drag to reorder"
          data-testid={`drag-handle-${step.id}`}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Checkbox */}
        <Checkbox
          checked={step.status === "completed"}
          onCheckedChange={onToggle}
          className="mt-0.5 shrink-0"
          disabled={updateStepMutation.isPending}
          data-testid={`checkbox-step-${step.id}`}
        />

        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-sm font-medium ${
                  step.status === "completed" ? "line-through text-muted-foreground" : ""
                }`}
              >
                <span className="tabular-nums text-muted-foreground mr-1.5">
                  {step.stepNumber}.
                </span>
                {step.title}
              </span>
              {overdue && (
                <Badge variant="destructive" className="text-[9px] uppercase h-4">
                  Overdue
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                onClick={onEditStep}
                title="Edit step"
                data-testid={`button-edit-step-${step.id}`}
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                className="p-1 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                onClick={onDeleteStep}
                title="Delete step"
                data-testid={`button-delete-step-${step.id}`}
              >
                <Trash2 className="h-3 w-3" />
              </button>
              <span className="ml-1">{getStatusIcon(step.status)}</span>
            </div>
          </div>

          {/* Description */}
          {step.description && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {step.description}
            </p>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs text-muted-foreground">
            {forms.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                <FileText className="h-3 w-3 shrink-0" />
                {forms.map((f) => (
                  <Badge key={f} variant="outline" className="text-[9px] font-normal h-4 bg-card">
                    {f}
                  </Badge>
                ))}
              </div>
            )}
            {step.responsible && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {step.responsible}
              </span>
            )}
            {step.approver && (
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {step.approver}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {editingDays === step.id ? (
                <Input
                  type="number"
                  value={daysValue}
                  onChange={(e) => onDaysChange(e.target.value)}
                  onBlur={onDaysSave}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onDaysSave();
                    if (e.key === "Escape") onDaysCancel();
                  }}
                  className="h-5 w-12 text-xs tabular-nums p-1"
                  autoFocus
                  data-testid={`input-days-${step.id}`}
                />
              ) : (
                <button
                  className="tabular-nums hover:text-foreground transition-colors underline decoration-dotted"
                  onClick={onEditDaysStart}
                  data-testid={`button-edit-days-${step.id}`}
                >
                  {step.estimatedDays}d
                </button>
              )}
            </span>
            {step.projectedStartDate && step.projectedEndDate && (
              <span className="flex items-center gap-1 tabular-nums">
                <Calendar className="h-3 w-3" />
                {formatDate(step.projectedStartDate)} – {formatDate(step.projectedEndDate)}
              </span>
            )}
            {step.completedDate && (
              <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">
                Done {formatDate(step.completedDate)}
              </span>
            )}
          </div>

          {/* Notes */}
          <div className="mt-2">
            <button
              className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              onClick={onToggleNotes}
              data-testid={`button-notes-${step.id}`}
            >
              <StickyNote className="h-3 w-3" />
              {step.notes ? "View/Edit Notes" : "Add Note"}
            </button>
            {noteExpanded && (
              <Textarea
                className="mt-1.5 text-xs min-h-[60px]"
                placeholder="Add notes for this step..."
                defaultValue={step.notes || ""}
                onBlur={(e) => onNotesSave(e.target.value)}
                data-testid={`textarea-notes-${step.id}`}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// Main Component
// ═════════════════════════════════════════════════════════════════════

export default function RecruitmentDetail() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id || "0");
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [openPhases, setOpenPhases] = useState<Set<string>>(new Set());
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());
  const [editingDays, setEditingDays] = useState<number | null>(null);
  const [daysValue, setDaysValue] = useState("");
  const [editDialog, setEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", department: "", startDate: "", notes: "" });
  const [addStepPhase, setAddStepPhase] = useState<string | null>(null);
  const [addStepForm, setAddStepForm] = useState(EMPTY_STEP_FORM);
  const [editStepTarget, setEditStepTarget] = useState<RecruitmentStep | null>(null);
  const [editStepForm, setEditStepForm] = useState(EMPTY_STEP_FORM);
  const [deleteStepTarget, setDeleteStepTarget] = useState<RecruitmentStep | null>(null);
  const [activeDragId, setActiveDragId] = useState<number | null>(null);

  // ─── DnD sensors ──────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const { data, isLoading } = useQuery<RecruitmentWithSteps>({
    queryKey: ["/api/recruitments", id],
  });

  // ─── Mutations ─────────────────────────────────────────────────────

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/recruitments", id] });
    queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    queryClient.invalidateQueries({ queryKey: ["/api/recruitments"] });
  };

  const updateStepMutation = useMutation({
    mutationFn: async ({ stepId, body }: { stepId: number; body: any }) => {
      const res = await apiRequest("PATCH", `/api/recruitments/${id}/steps/${stepId}`, body);
      return res.json();
    },
    onSuccess: invalidateAll,
  });

  const createStepMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await apiRequest("POST", `/api/recruitments/${id}/steps`, body);
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      setAddStepPhase(null);
      setAddStepForm(EMPTY_STEP_FORM);
      toast({ title: "Step added" });
    },
  });

  const deleteStepMutation = useMutation({
    mutationFn: async (stepId: number) => {
      const res = await apiRequest("DELETE", `/api/recruitments/${id}/steps/${stepId}`);
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      setDeleteStepTarget(null);
      toast({ title: "Step deleted" });
    },
  });

  const editStepMutation = useMutation({
    mutationFn: async ({ stepId, body }: { stepId: number; body: any }) => {
      const res = await apiRequest("PATCH", `/api/recruitments/${id}/steps/${stepId}`, body);
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      setEditStepTarget(null);
      toast({ title: "Step updated" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (order: { id: number; stepNumber: number }[]) => {
      const res = await apiRequest("PATCH", `/api/recruitments/${id}/steps/reorder`, { order });
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Steps reordered" });
    },
  });

  const updateRecruitmentMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await apiRequest("PATCH", `/api/recruitments/${id}`, body);
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      setEditDialog(false);
      toast({ title: "Recruitment updated" });
    },
  });

  const deleteRecruitmentMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/recruitments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recruitments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      navigate("/");
      toast({ title: "Recruitment deleted" });
    },
  });

  // ─── Helpers ───────────────────────────────────────────────────────

  const phaseGroups = useMemo(() => {
    if (!data?.steps) return [];
    const groups: { phase: string; steps: RecruitmentStep[] }[] = [];
    const phaseMap = new Map<string, RecruitmentStep[]>();
    for (const step of data.steps) {
      if (!phaseMap.has(step.phase)) {
        phaseMap.set(step.phase, []);
      }
      phaseMap.get(step.phase)!.push(step);
    }
    for (const [phase, steps] of phaseMap) {
      groups.push({ phase, steps: steps.sort((a, b) => a.stepNumber - b.stepNumber) });
    }
    return groups;
  }, [data?.steps]);

  useMemo(() => {
    if (phaseGroups.length > 0 && openPhases.size === 0) {
      const current = phaseGroups.find((g) =>
        g.steps.some((s) => s.status !== "completed")
      );
      if (current) {
        setOpenPhases(new Set([current.phase]));
      }
    }
  }, [phaseGroups]);

  function togglePhase(phase: string) {
    setOpenPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phase)) next.delete(phase);
      else next.add(phase);
      return next;
    });
  }

  function handleStepToggle(step: RecruitmentStep) {
    const newStatus = step.status === "completed" ? "pending" : "completed";
    updateStepMutation.mutate({ stepId: step.id, body: { status: newStatus } });
  }

  function handleDaysSave(stepId: number) {
    const days = parseInt(daysValue);
    if (!isNaN(days) && days > 0) {
      updateStepMutation.mutate({ stepId, body: { estimatedDays: days } });
    }
    setEditingDays(null);
  }

  function handleStepNotesSave(stepId: number, notes: string) {
    updateStepMutation.mutate({ stepId, body: { notes } });
  }

  function handleAddStepSubmit() {
    if (!addStepPhase || !addStepForm.title.trim()) return;
    const formsArray = addStepForm.forms.split(",").map((f) => f.trim()).filter(Boolean);
    createStepMutation.mutate({
      phase: addStepPhase,
      title: addStepForm.title.trim(),
      description: addStepForm.description.trim() || null,
      responsible: addStepForm.responsible.trim() || null,
      approver: addStepForm.approver.trim() || null,
      forms: formsArray,
      estimatedDays: parseInt(addStepForm.estimatedDays) || 1,
      notes: addStepForm.notes.trim() || null,
    });
  }

  function openEditStep(step: RecruitmentStep) {
    let formsStr = "";
    try {
      const arr = JSON.parse(step.forms || "[]");
      formsStr = Array.isArray(arr) ? arr.join(", ") : "";
    } catch { formsStr = ""; }
    setEditStepForm({
      title: step.title,
      description: step.description || "",
      responsible: step.responsible || "",
      approver: step.approver || "",
      forms: formsStr,
      estimatedDays: String(step.estimatedDays),
      notes: step.notes || "",
    });
    setEditStepTarget(step);
  }

  function handleEditStepSubmit() {
    if (!editStepTarget || !editStepForm.title.trim()) return;
    const formsArray = editStepForm.forms.split(",").map((f) => f.trim()).filter(Boolean);
    editStepMutation.mutate({
      stepId: editStepTarget.id,
      body: {
        title: editStepForm.title.trim(),
        description: editStepForm.description.trim() || null,
        responsible: editStepForm.responsible.trim() || null,
        approver: editStepForm.approver.trim() || null,
        forms: JSON.stringify(formsArray),
        estimatedDays: parseInt(editStepForm.estimatedDays) || 1,
        notes: editStepForm.notes.trim() || null,
      },
    });
  }

  // ─── DnD handlers ─────────────────────────────────────────────────
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id as number);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent, phaseSteps: RecruitmentStep[], allSteps: RecruitmentStep[]) => {
      setActiveDragId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = phaseSteps.findIndex((s) => s.id === active.id);
      const newIndex = phaseSteps.findIndex((s) => s.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(phaseSteps, oldIndex, newIndex);

      // Build the full new ordering for ALL steps in this recruitment.
      // Steps in other phases keep their relative order; the moved phase gets new numbers.
      const otherSteps = allSteps.filter((s) => !reordered.some((r) => r.id === s.id));
      // Sort other steps by stepNumber
      otherSteps.sort((a, b) => a.stepNumber - b.stepNumber);

      // Merge: we need to figure out where this phase sits in the global order.
      // The first step of the phase in the original data tells us the starting global position.
      const phaseStartGlobal = phaseSteps[0].stepNumber;

      // Build the full ordered list:
      // 1. All steps before this phase (stepNumber < phaseStartGlobal)
      // 2. The reordered phase steps
      // 3. All steps after this phase (stepNumber > last step of phase)
      const phaseEndGlobal = phaseSteps[phaseSteps.length - 1].stepNumber;
      const beforePhase = otherSteps.filter((s) => s.stepNumber < phaseStartGlobal);
      const afterPhase = otherSteps.filter((s) => s.stepNumber > phaseEndGlobal);

      const fullOrder: { id: number; stepNumber: number }[] = [];
      let num = 1;

      for (const s of beforePhase) {
        fullOrder.push({ id: s.id, stepNumber: num++ });
      }
      for (const s of reordered) {
        fullOrder.push({ id: s.id, stepNumber: num++ });
      }
      for (const s of afterPhase) {
        fullOrder.push({ id: s.id, stepNumber: num++ });
      }

      reorderMutation.mutate(fullOrder);
    },
    [reorderMutation]
  );

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function formatDateLong(dateStr: string | null) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case "in_progress":
        return <Loader2 className="h-4 w-4 text-accent animate-spin" />;
      case "blocked":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground/40" />;
    }
  }

  function getPhaseProgress(steps: RecruitmentStep[]) {
    const completed = steps.filter((s) => s.status === "completed").length;
    return { completed, total: steps.length, percent: (completed / steps.length) * 100 };
  }

  function getPhaseColor(phase: string) {
    const map: Record<string, string> = {
      "Pre-Recruitment": "bg-chart-1",
      "Position Approval": "bg-chart-1",
      "Posting & Committee Formation": "bg-chart-2",
      "Recruitment Preparation": "bg-chart-2",
      "Screening": "bg-chart-3",
      "Screening & Tally": "bg-chart-3",
      "Interviews": "bg-chart-5",
      "Selection & Offer": "bg-accent",
      "Onboarding (HR Takes Over)": "bg-emerald-500",
    };
    return map[phase] || "bg-muted-foreground";
  }

  function parseForms(forms: string | null): string[] {
    if (!forms) return [];
    try { return JSON.parse(forms); } catch { return []; }
  }

  function isOverdue(step: RecruitmentStep) {
    if (step.status === "completed" || !step.projectedEndDate) return false;
    return new Date(step.projectedEndDate) < new Date();
  }

  // ─── Render ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground mb-4">Recruitment not found</p>
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const totalCompleted = data.steps.filter((s) => s.status === "completed").length;
  const totalProgress = data.steps.length > 0 ? (totalCompleted / data.steps.length) * 100 : 0;
  const projectedEnd = data.steps.length > 0 ? data.steps[data.steps.length - 1].projectedEndDate : null;

  // StepFormFields is now defined at module level (above) to prevent
  // focus loss on keystroke caused by React re-creating inner components.

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-2 -ml-2 text-muted-foreground" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-1" /> All Recruitments
            </Button>
          </Link>
          <h1 className="font-display font-bold text-xl" data-testid="text-recruitment-title">
            {data.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
            {data.department && <span>{data.department}</span>}
            <span className="tabular-nums">Started {formatDateLong(data.startDate)}</span>
            {projectedEnd && (
              <span className="tabular-nums">Est. complete {formatDateLong(projectedEnd)}</span>
            )}
            <Badge variant={data.status === "active" ? "default" : "secondary"} className="text-[10px] uppercase">
              {data.status}
            </Badge>
          </div>
          {data.notes && (
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{data.notes}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditForm({
                title: data.title,
                department: data.department || "",
                startDate: data.startDate,
                notes: data.notes || "",
              });
              setEditDialog(true);
            }}
            data-testid="button-edit-recruitment"
          >
            <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              if (confirm("Delete this recruitment and all its steps?")) {
                deleteRecruitmentMutation.mutate();
              }
            }}
            data-testid="button-delete-recruitment"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Overall Progress + Timeline */}
      <Card className="border border-border">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm font-medium tabular-nums">
              {totalCompleted}/{data.steps.length} steps
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 mb-4">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${totalProgress}%` }}
            />
          </div>
          <div className="flex gap-1 h-6 rounded overflow-hidden">
            {phaseGroups.map((group) => {
              const prog = getPhaseProgress(group.steps);
              const widthPercent = (group.steps.length / data.steps.length) * 100;
              return (
                <div
                  key={group.phase}
                  className="relative group cursor-pointer"
                  style={{ width: `${widthPercent}%` }}
                  onClick={() => togglePhase(group.phase)}
                  title={`${group.phase}: ${prog.completed}/${prog.total}`}
                  data-testid={`timeline-phase-${group.phase.replace(/\s+/g, "-").toLowerCase()}`}
                >
                  <div className="h-full bg-muted rounded-sm overflow-hidden">
                    <div
                      className={`h-full ${getPhaseColor(group.phase)} transition-all duration-300 opacity-80`}
                      style={{ width: `${prog.percent}%` }}
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[9px] font-medium text-foreground/70 truncate px-1 hidden sm:inline">
                      {group.phase.split("(")[0].trim()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Phase Sections */}
      <div className="space-y-3">
        {phaseGroups.map((group) => {
          const prog = getPhaseProgress(group.steps);
          const isOpen = openPhases.has(group.phase);
          const stepIds = group.steps.map((s) => s.id);

          return (
            <Card key={group.phase} className="border border-border overflow-hidden" data-testid={`phase-${group.phase.replace(/\s+/g, "-").toLowerCase()}`}>
              <Collapsible open={isOpen} onOpenChange={() => togglePhase(group.phase)}>
                <CollapsibleTrigger asChild>
                  <button className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left" data-testid={`button-toggle-phase-${group.phase.replace(/\s+/g, "-").toLowerCase()}`}>
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <div className={`w-2 h-2 rounded-full shrink-0 ${getPhaseColor(group.phase)}`} />
                    <span className="font-display font-semibold text-sm flex-1">{group.phase}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {prog.completed}/{prog.total}
                    </span>
                    <div className="w-16 bg-muted rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${getPhaseColor(group.phase)}`}
                        style={{ width: `${prog.percent}%` }}
                      />
                    </div>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border-t border-border">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragStart={handleDragStart}
                      onDragEnd={(event) => handleDragEnd(event, group.steps, data.steps)}
                      modifiers={[restrictToVerticalAxis]}
                    >
                      <SortableContext items={stepIds} strategy={verticalListSortingStrategy}>
                        {group.steps.map((step) => (
                          <SortableStepRow
                            key={step.id}
                            step={step}
                            overdue={isOverdue(step)}
                            noteExpanded={expandedNotes.has(step.id)}
                            editingDays={editingDays}
                            daysValue={daysValue}
                            updateStepMutation={updateStepMutation}
                            onToggle={() => handleStepToggle(step)}
                            onEditDaysStart={() => {
                              setEditingDays(step.id);
                              setDaysValue(String(step.estimatedDays));
                            }}
                            onDaysChange={setDaysValue}
                            onDaysSave={() => handleDaysSave(step.id)}
                            onDaysCancel={() => setEditingDays(null)}
                            onNotesSave={(notes) => handleStepNotesSave(step.id, notes)}
                            onToggleNotes={() => {
                              setExpandedNotes((prev) => {
                                const next = new Set(prev);
                                if (next.has(step.id)) next.delete(step.id);
                                else next.add(step.id);
                                return next;
                              });
                            }}
                            onEditStep={() => openEditStep(step)}
                            onDeleteStep={() => setDeleteStepTarget(step)}
                            parseForms={parseForms}
                            formatDate={formatDate}
                            getStatusIcon={getStatusIcon}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>

                    {/* Add Step button */}
                    <div className="px-4 py-2 bg-muted/20 border-t border-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-7"
                        onClick={() => {
                          setAddStepForm(EMPTY_STEP_FORM);
                          setAddStepPhase(group.phase);
                        }}
                        data-testid={`button-add-step-${group.phase.replace(/\s+/g, "-").toLowerCase()}`}
                      >
                        <Plus className="h-3 w-3" />
                        Add Step to {group.phase.split("(")[0].trim()}
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {/* ═══════════════ DIALOGS ═══════════════ */}

      {/* Edit Recruitment Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Edit Recruitment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-sm font-medium mb-1 block">Title</Label>
              <Input value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} data-testid="input-edit-title" />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1 block">Department</Label>
              <Input value={editForm.department} onChange={(e) => setEditForm((f) => ({ ...f, department: e.target.value }))} data-testid="input-edit-department" />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1 block">Start Date</Label>
              <Input type="date" value={editForm.startDate} onChange={(e) => setEditForm((f) => ({ ...f, startDate: e.target.value }))} data-testid="input-edit-start-date" />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1 block">Notes</Label>
              <Textarea value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} data-testid="input-edit-notes" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialog(false)}>Cancel</Button>
              <Button onClick={() => updateRecruitmentMutation.mutate(editForm)} disabled={updateRecruitmentMutation.isPending} data-testid="button-save-edit">
                {updateRecruitmentMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Step Dialog */}
      <Dialog open={!!addStepPhase} onOpenChange={(open) => { if (!open) setAddStepPhase(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-base">
              Add Step to {addStepPhase?.split("(")[0].trim()}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <StepFormFields form={addStepForm} setForm={setAddStepForm} />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setAddStepPhase(null)}>Cancel</Button>
              <Button onClick={handleAddStepSubmit} disabled={createStepMutation.isPending || !addStepForm.title.trim()} data-testid="button-save-add-step">
                {createStepMutation.isPending ? "Adding..." : "Add Step"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Step Dialog */}
      <Dialog open={!!editStepTarget} onOpenChange={(open) => { if (!open) setEditStepTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-base">
              Edit Step: {editStepTarget?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <StepFormFields form={editStepForm} setForm={setEditStepForm} />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setEditStepTarget(null)}>Cancel</Button>
              <Button onClick={handleEditStepSubmit} disabled={editStepMutation.isPending || !editStepForm.title.trim()} data-testid="button-save-edit-step">
                {editStepMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Step Confirmation */}
      <AlertDialog open={!!deleteStepTarget} onOpenChange={(open) => { if (!open) setDeleteStepTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Step</AlertDialogTitle>
            <AlertDialogDescription>
              Remove "{deleteStepTarget?.title}" from this recruitment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteStepTarget) deleteStepMutation.mutate(deleteStepTarget.id); }}
              data-testid="button-confirm-delete-step"
            >
              {deleteStepMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
