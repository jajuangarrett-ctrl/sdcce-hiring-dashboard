import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useLocation } from "wouter";

interface NewRecruitmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewRecruitmentDialog({ open, onOpenChange }: NewRecruitmentDialogProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    title: "",
    department: "",
    startDate: today,
    notes: "",
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/recruitments", {
        title: form.title,
        department: form.department || null,
        startDate: form.startDate,
        notes: form.notes || null,
        status: "active",
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/recruitments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      onOpenChange(false);
      setForm({ title: "", department: "", startDate: today, notes: "" });
      toast({ title: "Recruitment created", description: `${data.title} has been created with 36 steps.` });
      navigate(`/${data.id}`);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const isValid = form.title.trim() && form.startDate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">New Recruitment</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Create a new contract faculty recruitment. All 36 hiring process steps will be
          automatically populated from the SDCCD template.
        </p>
        <div className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Position Title <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="e.g. Contract Faculty — Counseling"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              data-testid="input-new-title"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Department</label>
            <Input
              placeholder="e.g. Student Support Services"
              value={form.department}
              onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              data-testid="input-new-department"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Start Date <span className="text-destructive">*</span>
            </label>
            <Input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              data-testid="input-new-start-date"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Notes</label>
            <Textarea
              placeholder="Optional notes about this recruitment..."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              data-testid="input-new-notes"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-new">
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!isValid || createMutation.isPending}
              data-testid="button-create-recruitment"
            >
              {createMutation.isPending ? "Creating..." : "Create Recruitment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
