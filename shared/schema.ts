import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const recruitments = sqliteTable("recruitments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  department: text("department"),
  status: text("status").notNull().default("active"),
  startDate: text("start_date").notNull(),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});

export const recruitmentSteps = sqliteTable("recruitment_steps", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  recruitmentId: integer("recruitment_id").notNull().references(() => recruitments.id),
  stepNumber: integer("step_number").notNull(),
  phase: text("phase").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  forms: text("forms"), // JSON array of form names
  responsible: text("responsible"),
  approver: text("approver"),
  estimatedDays: integer("estimated_days").notNull(),
  actualDays: integer("actual_days"),
  projectedStartDate: text("projected_start_date"),
  projectedEndDate: text("projected_end_date"),
  completedDate: text("completed_date"),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
});

export const insertRecruitmentSchema = createInsertSchema(recruitments).omit({
  id: true,
  createdAt: true,
});

export const insertRecruitmentStepSchema = createInsertSchema(recruitmentSteps).omit({
  id: true,
});

export type InsertRecruitment = z.infer<typeof insertRecruitmentSchema>;
export type Recruitment = typeof recruitments.$inferSelect;
export type InsertRecruitmentStep = z.infer<typeof insertRecruitmentStepSchema>;
export type RecruitmentStep = typeof recruitmentSteps.$inferSelect;
