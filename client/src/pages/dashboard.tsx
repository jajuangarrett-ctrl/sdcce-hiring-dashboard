import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  ArrowRight,
  Search,
  Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { NewRecruitmentDialog } from "@/components/new-recruitment-dialog";

interface RecruitmentSummary {
  id: number;
  title: string;
  department: string | null;
  status: string;
  startDate: string;
  notes: string | null;
  createdAt: string;
  completedSteps: number;
  totalSteps: number;
  currentPhase: string;
  nextAction: string | null;
  projectedEndDate: string | null;
}

interface Stats {
  activeRecruitments: number;
  completedToday: number;
  overdueSteps: number;
  upcomingDeadlines: number;
}

export default function Dashboard() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const { data: recruitments, isLoading: recruitmentsLoading } = useQuery<RecruitmentSummary[]>({
    queryKey: ["/api/recruitments"],
  });

  const filtered = useMemo(() => {
    if (!recruitments) return [];
    return recruitments.filter((r) => {
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      const matchesSearch =
        !searchTerm ||
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.department && r.department.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [recruitments, statusFilter, searchTerm]);

  const kpiCards = [
    {
      title: "Active Recruitments",
      value: stats?.activeRecruitments ?? 0,
      icon: Briefcase,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Completed Today",
      value: stats?.completedToday ?? 0,
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Overdue Steps",
      value: stats?.overdueSteps ?? 0,
      icon: AlertTriangle,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      title: "Due This Week",
      value: stats?.upcomingDeadlines ?? 0,
      icon: Clock,
      color: "text-accent dark:text-accent",
      bg: "bg-accent/10",
    },
  ];

  function getPhaseColor(phase: string) {
    const map: Record<string, string> = {
      "Pre-Recruitment": "bg-chart-1/15 text-chart-1 border-chart-1/20",
      "Posting & Committee Formation": "bg-chart-2/15 text-chart-2 border-chart-2/20",
      "Screening": "bg-chart-3/15 text-chart-3 border-chart-3/20",
      "Interviews": "bg-chart-5/15 text-chart-5 border-chart-5/20",
      "Selection & Offer": "bg-accent/15 text-accent border-accent/20",
      "Onboarding (HR Takes Over)": "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      "Complete": "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    };
    return map[phase] || "bg-muted text-muted-foreground border-muted";
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title} className="border border-border" data-testid={`kpi-${kpi.title.toLowerCase().replace(/\s+/g, "-")}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {kpi.title}
                  </p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-2xl font-semibold tabular-nums mt-1" data-testid={`kpi-value-${kpi.title.toLowerCase().replace(/\s+/g, "-")}`}>
                      {kpi.value}
                    </p>
                  )}
                </div>
                <div className={`p-2.5 rounded-lg ${kpi.bg}`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recruitments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto">
          <Button onClick={() => setDialogOpen(true)} data-testid="button-new-recruitment">
            <Plus className="h-4 w-4 mr-1.5" />
            New Recruitment
          </Button>
        </div>
      </div>

      {/* Recruitment Cards */}
      {recruitmentsLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border border-border">
              <CardContent className="p-5">
                <Skeleton className="h-5 w-64 mb-3" />
                <Skeleton className="h-4 w-40 mb-4" />
                <Skeleton className="h-2 w-full mb-3" />
                <Skeleton className="h-4 w-48" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border border-border border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Briefcase className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground text-sm font-medium">
              {recruitments?.length === 0
                ? "No recruitments yet"
                : "No matching recruitments"}
            </p>
            {recruitments?.length === 0 && (
              <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)} data-testid="button-create-first">
                <Plus className="h-4 w-4 mr-1.5" />
                Create Your First Recruitment
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((r) => {
            const progress = r.totalSteps > 0 ? (r.completedSteps / r.totalSteps) * 100 : 0;
            return (
              <Link key={r.id} href={`/${r.id}`}>
                <Card
                  className="border border-border hover:border-primary/30 transition-colors cursor-pointer"
                  data-testid={`card-recruitment-${r.id}`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-display font-semibold text-base truncate">
                            {r.title}
                          </h3>
                          <Badge
                            variant={r.status === "active" ? "default" : "secondary"}
                            className="shrink-0 text-[10px] uppercase"
                            data-testid={`badge-status-${r.id}`}
                          >
                            {r.status}
                          </Badge>
                        </div>
                        {r.department && (
                          <p className="text-sm text-muted-foreground mb-3">{r.department}</p>
                        )}
                        <div className="flex items-center gap-2 mb-2">
                          <Progress value={progress} className="flex-1 h-1.5" />
                          <span className="text-xs font-medium tabular-nums text-muted-foreground shrink-0">
                            {r.completedSteps}/{r.totalSteps}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Badge variant="outline" className={`text-[10px] font-medium ${getPhaseColor(r.currentPhase)}`}>
                              {r.currentPhase}
                            </Badge>
                          </span>
                          {r.nextAction && (
                            <span className="truncate max-w-[200px]">
                              Next: <span className="font-medium text-foreground">{r.nextAction}</span>
                            </span>
                          )}
                          <span className="tabular-nums">
                            Started {formatDate(r.startDate)}
                          </span>
                          {r.projectedEndDate && (
                            <span className="tabular-nums">
                              Est. complete {formatDate(r.projectedEndDate)}
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/50 shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <NewRecruitmentDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
