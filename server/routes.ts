import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRecruitmentSchema } from "@shared/schema";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

// Load template steps from research file
function getTemplateSteps(): any[] {
  const researchPath = path.resolve("../hiring-research.json");
  const fallbackPath = path.resolve("./hiring-research.json");
  let filePath = researchPath;
  if (!fs.existsSync(filePath)) {
    filePath = fallbackPath;
  }
  // Try workspace path
  if (!fs.existsSync(filePath)) {
    filePath = path.resolve("/home/user/workspace/hiring-research.json");
  }
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const steps: any[] = [];
  for (const phase of data.phases) {
    for (const step of phase.steps) {
      steps.push({
        stepNumber: step.id,
        phase: phase.phase,
        title: step.title,
        description: step.description,
        forms: JSON.stringify(step.forms || []),
        responsible: step.responsible || null,
        approver: step.approver || null,
        estimatedDays: step.estimated_days,
        notes: step.notes || null,
      });
    }
  }
  return steps;
}

// Calculate projected dates for steps based on start date and cumulative days
function calculateProjectedDates(startDate: string, steps: any[]): any[] {
  let currentDate = new Date(startDate);
  
  function addBusinessDays(date: Date, days: number): Date {
    const result = new Date(date);
    let added = 0;
    while (added < days) {
      result.setDate(result.getDate() + 1);
      const dayOfWeek = result.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        added++;
      }
    }
    return result;
  }

  return steps.map((step, index) => {
    const projectedStartDate = new Date(currentDate).toISOString().split("T")[0];
    const projectedEndDate = addBusinessDays(new Date(currentDate), step.estimatedDays).toISOString().split("T")[0];
    currentDate = addBusinessDays(new Date(currentDate), step.estimatedDays);
    return {
      ...step,
      projectedStartDate,
      projectedEndDate,
    };
  });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // GET /api/stats - dashboard statistics
  app.get("/api/stats", (_req, res) => {
    try {
      const stats = storage.getStats();
      res.json(stats);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // GET /api/recruitments - list all
  app.get("/api/recruitments", (_req, res) => {
    try {
      const all = storage.getAllRecruitments();
      // For each recruitment, also get step summary
      const result = all.map((r) => {
        const steps = storage.getStepsForRecruitment(r.id);
        const completedSteps = steps.filter((s) => s.status === "completed").length;
        const totalSteps = steps.length;
        const currentStep = steps.find((s) => s.status !== "completed");
        const currentPhase = currentStep?.phase || "Complete";
        return {
          ...r,
          completedSteps,
          totalSteps,
          currentPhase,
          nextAction: currentStep?.title || null,
          projectedEndDate: steps.length > 0 ? steps[steps.length - 1].projectedEndDate : null,
        };
      });
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST /api/recruitments - create new with all template steps
  app.post("/api/recruitments", (req, res) => {
    try {
      const body = insertRecruitmentSchema.parse(req.body);
      const recruitment = storage.createRecruitment(body);
      
      // Create template steps with projected dates
      const templateSteps = getTemplateSteps();
      const stepsWithDates = calculateProjectedDates(body.startDate, templateSteps);
      
      const steps = storage.createSteps(
        stepsWithDates.map((step: any) => ({
          ...step,
          recruitmentId: recruitment.id,
          status: "pending",
        }))
      );

      res.status(201).json({ ...recruitment, steps });
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ error: e.errors });
      } else {
        res.status(500).json({ error: e.message });
      }
    }
  });

  // GET /api/recruitments/:id - get one with all steps
  app.get("/api/recruitments/:id", (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const recruitment = storage.getRecruitment(id);
      if (!recruitment) {
        return res.status(404).json({ error: "Recruitment not found" });
      }
      const steps = storage.getStepsForRecruitment(id);
      res.json({ ...recruitment, steps });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // PATCH /api/recruitments/:id - update recruitment
  app.patch("/api/recruitments/:id", (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = storage.getRecruitment(id);
      if (!existing) {
        return res.status(404).json({ error: "Recruitment not found" });
      }
      const updated = storage.updateRecruitment(id, req.body);
      
      // If startDate changed, recalculate projected dates
      if (req.body.startDate && req.body.startDate !== existing.startDate) {
        const steps = storage.getStepsForRecruitment(id);
        const stepsWithDates = calculateProjectedDates(req.body.startDate, steps);
        for (const step of stepsWithDates) {
          storage.updateStep(step.id, {
            projectedStartDate: step.projectedStartDate,
            projectedEndDate: step.projectedEndDate,
          });
        }
      }
      
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // DELETE /api/recruitments/:id - delete recruitment and its steps
  app.delete("/api/recruitments/:id", (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = storage.getRecruitment(id);
      if (!existing) {
        return res.status(404).json({ error: "Recruitment not found" });
      }
      storage.deleteRecruitment(id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // PATCH /api/recruitments/:id/steps/:stepId - update a step
  app.patch("/api/recruitments/:id/steps/:stepId", (req, res) => {
    try {
      const recruitmentId = parseInt(req.params.id);
      const stepId = parseInt(req.params.stepId);
      const step = storage.getStep(stepId);
      if (!step || step.recruitmentId !== recruitmentId) {
        return res.status(404).json({ error: "Step not found" });
      }
      
      const updateData: any = { ...req.body };
      
      // If marking as completed, set completedDate
      if (updateData.status === "completed" && step.status !== "completed") {
        updateData.completedDate = new Date().toISOString();
      }
      // If un-completing, clear completedDate
      if (updateData.status && updateData.status !== "completed") {
        updateData.completedDate = null;
      }
      
      const updated = storage.updateStep(stepId, updateData);

      // If estimatedDays changed, recalculate all projected dates
      if (updateData.estimatedDays !== undefined) {
        const recruitment = storage.getRecruitment(recruitmentId);
        if (recruitment) {
          const allSteps = storage.getStepsForRecruitment(recruitmentId);
          const stepsWithDates = calculateProjectedDates(recruitment.startDate, allSteps);
          for (const s of stepsWithDates) {
            storage.updateStep(s.id, {
              projectedStartDate: s.projectedStartDate,
              projectedEndDate: s.projectedEndDate,
            });
          }
        }
      }
      
      // Re-fetch to get latest data
      const freshStep = storage.getStep(stepId);
      res.json(freshStep);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  return httpServer;
}
