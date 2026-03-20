import {
  type Recruitment,
  type InsertRecruitment,
  type RecruitmentStep,
  type InsertRecruitmentStep,
  recruitments,
  recruitmentSteps,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and, sql } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

export interface IStorage {
  // Recruitments
  getAllRecruitments(): Recruitment[];
  getRecruitment(id: number): Recruitment | undefined;
  createRecruitment(data: InsertRecruitment): Recruitment;
  updateRecruitment(id: number, data: Partial<InsertRecruitment>): Recruitment | undefined;
  deleteRecruitment(id: number): void;

  // Steps
  getStepsForRecruitment(recruitmentId: number): RecruitmentStep[];
  getStep(id: number): RecruitmentStep | undefined;
  createStep(data: InsertRecruitmentStep): RecruitmentStep;
  createSteps(data: InsertRecruitmentStep[]): RecruitmentStep[];
  updateStep(id: number, data: Partial<InsertRecruitmentStep>): RecruitmentStep | undefined;

  // Stats
  getStats(): {
    activeRecruitments: number;
    completedToday: number;
    overdueSteps: number;
    upcomingDeadlines: number;
  };
}

export class DatabaseStorage implements IStorage {
  getAllRecruitments(): Recruitment[] {
    return db.select().from(recruitments).all();
  }

  getRecruitment(id: number): Recruitment | undefined {
    return db.select().from(recruitments).where(eq(recruitments.id, id)).get();
  }

  createRecruitment(data: InsertRecruitment): Recruitment {
    return db.insert(recruitments).values({
      ...data,
      createdAt: new Date().toISOString(),
    }).returning().get();
  }

  updateRecruitment(id: number, data: Partial<InsertRecruitment>): Recruitment | undefined {
    return db.update(recruitments).set(data).where(eq(recruitments.id, id)).returning().get();
  }

  deleteRecruitment(id: number): void {
    db.delete(recruitmentSteps).where(eq(recruitmentSteps.recruitmentId, id)).run();
    db.delete(recruitments).where(eq(recruitments.id, id)).run();
  }

  getStepsForRecruitment(recruitmentId: number): RecruitmentStep[] {
    return db.select().from(recruitmentSteps)
      .where(eq(recruitmentSteps.recruitmentId, recruitmentId))
      .orderBy(recruitmentSteps.stepNumber)
      .all();
  }

  getStep(id: number): RecruitmentStep | undefined {
    return db.select().from(recruitmentSteps).where(eq(recruitmentSteps.id, id)).get();
  }

  createStep(data: InsertRecruitmentStep): RecruitmentStep {
    return db.insert(recruitmentSteps).values(data).returning().get();
  }

  createSteps(data: InsertRecruitmentStep[]): RecruitmentStep[] {
    const results: RecruitmentStep[] = [];
    for (const step of data) {
      results.push(db.insert(recruitmentSteps).values(step).returning().get());
    }
    return results;
  }

  updateStep(id: number, data: Partial<InsertRecruitmentStep>): RecruitmentStep | undefined {
    return db.update(recruitmentSteps).set(data).where(eq(recruitmentSteps.id, id)).returning().get();
  }

  getStats(): {
    activeRecruitments: number;
    completedToday: number;
    overdueSteps: number;
    upcomingDeadlines: number;
  } {
    const today = new Date().toISOString().split("T")[0];

    const activeResult = db
      .select({ count: sql<number>`count(*)` })
      .from(recruitments)
      .where(eq(recruitments.status, "active"))
      .get();

    const completedTodayResult = db
      .select({ count: sql<number>`count(*)` })
      .from(recruitmentSteps)
      .where(
        and(
          eq(recruitmentSteps.status, "completed"),
          sql`${recruitmentSteps.completedDate} LIKE ${today + "%"}`
        )
      )
      .get();

    const overdueResult = db
      .select({ count: sql<number>`count(*)` })
      .from(recruitmentSteps)
      .where(
        and(
          sql`${recruitmentSteps.status} != 'completed'`,
          sql`${recruitmentSteps.projectedEndDate} IS NOT NULL`,
          sql`${recruitmentSteps.projectedEndDate} < ${today}`
        )
      )
      .get();

    // Upcoming = steps with projected end date within next 7 days
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split("T")[0];

    const upcomingResult = db
      .select({ count: sql<number>`count(*)` })
      .from(recruitmentSteps)
      .where(
        and(
          sql`${recruitmentSteps.status} != 'completed'`,
          sql`${recruitmentSteps.projectedEndDate} IS NOT NULL`,
          sql`${recruitmentSteps.projectedEndDate} >= ${today}`,
          sql`${recruitmentSteps.projectedEndDate} <= ${nextWeekStr}`
        )
      )
      .get();

    return {
      activeRecruitments: activeResult?.count ?? 0,
      completedToday: completedTodayResult?.count ?? 0,
      overdueSteps: overdueResult?.count ?? 0,
      upcomingDeadlines: upcomingResult?.count ?? 0,
    };
  }
}

export const storage = new DatabaseStorage();
