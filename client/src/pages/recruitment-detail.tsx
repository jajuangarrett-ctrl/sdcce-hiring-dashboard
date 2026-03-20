import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Recruitment, RecruitmentStep } from "@shared/schema";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";

interface RecruitmentWithSteps extends Recruitment {
  steps: RecruitmentStep[];
}

export default function RecruitmentDetail() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id || "0");
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [openPhases, setOpenPhases] = useState<Set<string>>(new Set());
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());
  const [editingDays, setEditingDays] = useState<number | null>(null);
  const [daysValue, setDaysValue] = useState("");
  const [editDialog, setEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", department: "", startDate: "", notes: "" });

  const { data, isLoading } = useQuery<RecruitmentWithSteps>({
    queryKey: ["/api/recruitments", id],
  });

  const updateStepMutation = useMutation({
    mutationFn: async ({ stepId, body }: { stepId: number; body: any }) => {
      const res = await apiRequest("PATCH", `/api/recruitments/${id}/steps/${stepId}`, body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recruitments", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recruitments"] });
    },
  });

  const updateRecruitmentMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await apiRequest("PATCH", `/api/recruitments/${id}`, body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recruitments", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/recruitments"] });
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

  // Group steps by phase
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
      groups.push({ phase, steps });
    }
    return groups;
  }, [data?.steps]);

  // Auto-expand current phase on load
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
      if (next.has(phase)) {
        next.delete(phase);
      } else {
        next.add(phase);
      }
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

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  function formatDateLong(dateStr: string | null) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
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
      "Posting & Committee Formation": "bg-chart-2",
      "Screening": "bg-chart-3",
      "Interviews": "bg-chart-5",
      "Selection & Offer": "bg-accent",
      "Onboarding (HR Takes Over)": "bg-emerald-500",
    };
    return map[phase] || "bg-muted-foreground";
  }

  function parseForms(forms: string | null): string[] {
    if (!forms) return [];
    try {
      return JSON.parse(forms);
    } catch {
      return [];
    }
  }

  function isOverdue(step: RecruitmentStep) {
    if (step.status === "completed" || !step.projectedEndDate) return false;
    return new Date(step.projectedEndDate) < new Date();
  }

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
  const totalProgress = (totalCompleted / data.steps.length) * 100;
  const projectedEnd = data.steps.length > 0 ? data.steps[data.steps.length - 1].projectedEndDate : null;

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

          {/* Phase timeline bar */}
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
                    {group.steps.map((step) => {
                      const forms = parseForms(step.forms);
                      const overdue = isOverdue(step);
                      const noteExpanded = expandedNotes.has(step.id);

                      return (
                        <div
                          key={step.id}
                          className={`px-4 py-3 border-b border-border last:border-b-0 ${
                            step.status === "completed" ? "bg-muted/30" : overdue ? "bg-destructive/5" : ""
                          }`}
                          data-testid={`step-${step.id}`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Checkbox */}
                            <Checkbox
                              checked={step.status === "completed"}
                              onCheckedChange={() => handleStepToggle(step)}
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
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {getStatusIcon(step.status)}
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
                                {/* Forms */}
                                {forms.length > 0 && (
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <FileText className="h-3 w-3 shrink-0" />
                                    {forms.map((f) => (
                                      <Badge
                                        key={f}
                                        variant="outline"
                                        className="text-[9px] font-normal h-4 bg-card"
                                      >
                                        {f}
                                      </Badge>
                                    ))}
                                  </div>
                                )}

                                {/* Responsible */}
                                {step.responsible && (
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {step.responsible}
                                  </span>
                                )}

                                {/* Approver */}
                                {step.approver && (
                                  <span className="flex items-center gap-1">
                                    <Shield className="h-3 w-3" />
                                    {step.approver}
                                  </span>
                                )}

                                {/* Estimated Days (editable) */}
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {editingDays === step.id ? (
                                    <Input
                                      type="number"
                                      value={daysValue}
                                      onChange={(e) => setDaysValue(e.target.value)}
                                      onBlur={() => handleDaysSave(step.id)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") handleDaysSave(step.id);
                                        if (e.key === "Escape") setEditingDays(null);
                                      }}
                                      className="h-5 w-12 text-xs tabular-nums p-1"
                                      autoFocus
                                      data-testid={`input-days-${step.id}`}
                                    />
                                  ) : (
                                    <button
                                      className="tabular-nums hover:text-foreground transition-colors underline decoration-dotted"
                                      onClick={() => {
                                        setEditingDays(step.id);
                                        setDaysValue(String(step.estimatedDays));
                                      }}
                                      data-testid={`button-edit-days-${step.id}`}
                                    >
                                      {step.estimatedDays}d
                                    </button>
                                  )}
                                </span>

                                {/* Projected dates */}
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
                                  onClick={() => {
                                    setExpandedNotes((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(step.id)) next.delete(step.id);
                                      else next.add(step.id);
                                      return next;
                                    });
                                  }}
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
                                    onBlur={(e) => handleStepNotesSave(step.id, e.target.value)}
                                    data-testid={`textarea-notes-${step.id}`}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Edit Recruitment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Title</label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                data-testid="input-edit-title"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Department</label>
              <Input
                value={editForm.department}
                onChange={(e) => setEditForm((f) => ({ ...f, department: e.target.value }))}
                data-testid="input-edit-department"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Start Date</label>
              <Input
                type="date"
                value={editForm.startDate}
                onChange={(e) => setEditForm((f) => ({ ...f, startDate: e.target.value }))}
                data-testid="input-edit-start-date"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                data-testid="input-edit-notes"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => updateRecruitmentMutation.mutate(editForm)}
                disabled={updateRecruitmentMutation.isPending}
                data-testid="button-save-edit"
              >
                {updateRecruitmentMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
