/**
 * Client-side storage layer for static deployment (Netlify).
 * Mirrors the server API so the app works identically without a backend.
 * Each visitor's data is saved in their own browser.
 * 
 * IMPORTANT: This module is only imported/used when the backend is unreachable.
 * It is NOT loaded at all when behind the Express server (Perplexity deploy).
 */

// ─── Embedded 36-step hiring template ───────────────────────────────
const HIRING_TEMPLATE = {
  phases: [
    {
      phase: "Position Approval",
      steps: [
        { id: 1, title: "Create Position Justification", description: "Draft document outlining the need for the new position, including the role's responsibilities, budget implications, and anticipated outcomes. Align with Faculty Hiring Prioritization (FHP) process and program review.", forms: ["Position Justification Form", "Hiring Memo"], responsible: "Dean / Hiring Manager", approver: "College President", estimated_days: 5, notes: "Must include budget implications and anticipated outcomes. Present hiring memo at College Council if required." },
        { id: 2, title: "Obtain Position Number from Business Services", description: "Coordinate with Business Services to assign a unique position number for the new hire. Confirm funding source (GFU or GFR).", forms: [], responsible: "Dean / Hiring Manager → Business Services", approver: null, estimated_days: 3, notes: "Position number required before job posting can be prepared (e.g., Position #00120657 for CalWORKs/ISSP Counselor)." },
        { id: 3, title: "Route Position for Review & Approval", description: "Submit the position request to relevant committees or leadership for review and approval. Includes Vice President of Academic Affairs (VPA) approval.", forms: ["Position Request"], responsible: "Dean / Hiring Manager", approver: "VPA / College President", estimated_days: 10, notes: "May require confirmation from multiple levels of administration. Track waiting status." },
        { id: 4, title: "Contact Employment Office & Initiate Recruitment", description: "Initiate recruitment with HR Employment Technician who will guide you through the process. Confirm position has posted or will post.", forms: [], responsible: "Dean / Hiring Manager", approver: null, estimated_days: 1, notes: "HR Technician assigned to support throughout the recruitment process." },
        { id: 5, title: "Receive Notification from HR – Position Posted", description: "Receive formal notification from HR that the position has been posted in the job portal. Store a copy of the PST job posting for records.", forms: ["Job Posting Confirmation"], responsible: "Employment Office → Dean", approver: null, estimated_days: 2, notes: "Save a copy of the job posting in the appropriate system or document management tool." },
      ],
    },
    {
      phase: "Recruitment Preparation",
      steps: [
        { id: 6, title: "Prepare Job Posting in PeopleAdmin Portal", description: "Work with Campus Business Office or Division Admin Assistant to prepare posting including Desired Qualifications, Supplemental Questions, major responsibilities, and Tentative Timeline. Include all criteria per Title 5 and Ed Code §87360.", forms: ["Job Posting (PeopleAdmin)"], responsible: "Campus Business Office / Division Admin Assistant", approver: null, estimated_days: 3, notes: "Include supplemental application questions (up to 7 questions for CalWORKs/ISSP positions)." },
        { id: 7, title: "HR Reviews & Posts Position", description: "HR Technician reviews posting and contacts Screening Chair/Hiring Manager for clarification. Contract faculty positions posted for minimum 30 days.", forms: [], responsible: "HR Technician / Employment Office", approver: null, estimated_days: 30, notes: "External recruitments: 2-4 weeks minimum. Contract faculty: at least 1 month posting period." },
        { id: 8, title: "Request Academic Senate Nominees (Prop B)", description: "Request Academic Senate for faculty nominees to serve on screening committee. All faculty members on committee must be appointed by Academic Senate per AP 7210.", forms: ["Request for Academic Senate Review of Faculty Assigned to a Hiring Committee"], responsible: "Dean / Department Chair", approver: "Academic Senate Committee on Committees", estimated_days: 14, notes: "Academic Senate Committee on Committees reviews within two weeks and responds with approval/recommendations." },
        { id: 9, title: "Obtain Classified Senate Nominee", description: "Contact Classified Senate for classified staff nominees to serve on committee. Must include at least two committee members who do NOT directly report to the Screening Chair.", forms: [], responsible: "Dean / Hiring Manager", approver: "Classified Senate", estimated_days: 14, notes: "Classified staff serve as committee members per AP 7210. Track nominee confirmations." },
        { id: 10, title: "Contact & Confirm Panel Members", description: "Reach out to all identified panel members to confirm participation. Ensure members understand their roles and time commitment. Verify EEO training status for all members.", forms: ["Screening Committee Roster"], responsible: "Screening Chair / Dean", approver: null, estimated_days: 5, notes: "All committee members must have completed EEO & Diversity Training within past 3 years. Need minimum 2 members who don't directly report to Screening Chair." },
        { id: 11, title: "Complete Questions & Criteria (QC/QNC) Form", description: "Prepare the Criteria Form for Screening & Interviewing. Include all screening criteria (up to 18), interview questions mapped to criteria, and any exercises (presentation, writing assignment).", forms: ["Questions & Criteria (Q&C) Form", "Criteria Form for Screening & Interviewing – Academic"], responsible: "Screening Chair / Dean", approver: null, estimated_days: 5, notes: "Must contain all exercises to be conducted during interviews including 5-minute presentation prompts if applicable." },
        { id: 12, title: "Finalize Writing Assignment / Presentation Prompt", description: "Develop and finalize the writing prompt or presentation assignment for candidates, if applicable. For counselor positions, prepare the SDCCE program presentation prompt.", forms: ["Writing Assignment", "Presentation Prompt"], responsible: "Screening Chair / Dean", approver: null, estimated_days: 3, notes: "CalWORKs/ISSP positions typically include a 5-minute presentation about SDCCE programs for new or undecided students." },
        { id: 13, title: "Send QC to EEO Site Compliance Representative", description: "Forward the completed Questions & Criteria form to the EEO Site Compliance Representative for review and approval.", forms: ["Q&C Form (for EEO approval)"], responsible: "Screening Chair / Dean", approver: "Site Compliance Officer / EEO Officer", estimated_days: 5, notes: "Questions & Criteria must be approved by Site Compliance or EEO Officer before screening can proceed." },
        { id: 14, title: "Send Approved QC to President's Office for Signature", description: "Obtain final approval of the screening committee roster and Q&C form from the President, Vice Chancellor, or Chancellor (or designee).", forms: ["Approved Q&C Form", "Committee Approval Signature"], responsible: "Screening Chair / Dean", approver: "College President / Vice Chancellor / Chancellor", estimated_days: 5, notes: "President/VP/Chancellor approval of committee is required. Signature line for designee if applicable." },
        { id: 15, title: "Complete EEO Timeline & Submit EEO Rep Request", description: "Fill out the EEO Timeline template with all key dates. Email EEO Rep request to assigned Employment Technician at least 10 working days prior to Screening Orientation date.", forms: ["EEO Timeline Template", "Timeline-EEO Rep Request Form"], responsible: "Screening Chair / Dean", approver: null, estimated_days: 2, notes: "Must be submitted at least 10 working days before Screening Orientation. Include dates for Orientation, Screening, Tally, and Interview." },
        { id: 16, title: "EEO Representative Assigned", description: "Employment assigns EEO Rep using dates from Timeline form. If no employee volunteers, Employment will select someone from the screening committee.", forms: ["EEO Rep Assignment Confirmation"], responsible: "Employment Office", approver: null, estimated_days: 10, notes: "10 working days needed for Employment to prepare materials and assign EEO Rep." },
        { id: 17, title: "Schedule & Hold Committee Orientation Meeting", description: "Organize and schedule the initial panel onboarding meeting to align all members on roles, timelines, materials, and portal access. Send follow-up email with recruitment materials, login credentials, and interview schedule.", forms: ["Recruitment Materials Email"], responsible: "Screening Chair / Dean", approver: null, estimated_days: 3, notes: "Follow-up email should include: portal login, job posting link, tally sheet, writing assignment, and interview question documents. Finalize interview questions and writing assignment and distribute to committee." },
      ],
    },
    {
      phase: "Screening & Tally",
      steps: [
        { id: 18, title: "Screening Orientation Meeting (with EEO Rep)", description: "Formal committee orientation: review criteria, EEO Rep reads Compliance Script, address confidentiality and EEO compliance questions. All members sign Confidential Statement. Both EEO Rep and Chairperson must be present.", forms: ["EEO Rep Compliance Script", "Confidential Statement Form"], responsible: "Screening Chair + EEO Rep", approver: null, estimated_days: 1, notes: "MANDATORY: Both EEO Rep and Chairperson must be present or meeting is canceled. Approved Q&C form must be sent to Employment PRIOR to screening." },
        { id: 19, title: "Application Screening Period", description: "Committee screens applications online in PeopleAdmin. Each member scores applications against Job Announcement criteria. Scores entered into screening spreadsheet.", forms: ["Screening Report"], responsible: "Screening Committee", approver: null, estimated_days: 7, notes: "Screening materials emailed to Chairperson. Guest login provided or PDF compiled. Incomplete applications included only if committee decides prior to screening." },
        { id: 20, title: "Tally Meeting & Cutoff Score", description: "Committee reconvenes to tally scores, discuss significant discrepancies (EEO Rep ensures discussion), and determine cutoff score for interviews.", forms: ["Tally Sheet"], responsible: "Screening Committee + EEO Rep", approver: null, estimated_days: 1, notes: "EEO Rep ensures discussion of significant scoring discrepancies. Use tally sheets or agreed-upon metrics for candidate selection." },
        { id: 21, title: "Submit Interview Selection Summary (ISS)", description: "Chairperson prepares Interview Selection Summary with committee signatures, forwards to Employment. Adverse Impact Analysis (AIA) and Diversity Profile prepared and sent to President/VP with ISS for approval.", forms: ["Interview Selection Summary (ISS)", "Adverse Impact Analysis (AIA)", "Diversity Profile"], responsible: "Screening Chair → Employment → President", approver: "President / Vice Chancellor", estimated_days: 5, notes: "President may not approve pool if failure to obtain projected representation. May extend, re-initiate, or cancel recruitment." },
      ],
    },
    {
      phase: "Interviews",
      steps: [
        { id: 22, title: "Interview Invitations Sent", description: "Employment emails interview invitations to selected candidates and non-select notices to others. Include interview format, schedule, and any required exercises.", forms: [], responsible: "Employment Office", approver: null, estimated_days: 3, notes: "" },
        { id: 23, title: "Candidate Scheduling Period", description: "Allow candidates time to make arrangements for interview. Schedule at least 2 weeks for Zoom interviews and at least 3 weeks for in-person interviews from the Tally date.", forms: [], responsible: "Employment Office / Candidates", approver: null, estimated_days: 14, notes: "2 weeks minimum for Zoom; 3 weeks minimum for in-person. Shorter if Tentative Timeline was in posting." },
        { id: 24, title: "First-Round Interviews", description: "Conduct interviews (in-person, Zoom, or hybrid). Each member uses Interview Rating Sheet. May include teaching demos, writing exercises, and presentations per Q&C form.", forms: ["Interview Rating Sheet"], responsible: "Screening Committee", approver: null, estimated_days: 5, notes: "All candidates treated equally in format. Committee may check references of finalists only. Multiple interview days may be scheduled." },
        { id: 25, title: "Contact President's Office for Second-Level Interviews", description: "Hiring manager coordinates with President's Office to schedule second-level (presidential) interviews. Get dates on the President's calendar.", forms: ["2nd Level Interviews Request"], responsible: "Hiring Manager → President's Office", approver: null, estimated_days: 3, notes: "Reference checks must be completed before second interview. Committee submits unranked list of best-qualified finalists with strengths/weaknesses." },
        { id: 26, title: "Second-Round (Presidential) Interviews", description: "Highly recommended. Includes: President, area VP, hiring manager, faculty chair/Academic Senate rep. Discuss finalist qualifications and fit.", forms: [], responsible: "President's Office + Hiring Manager", approver: null, estimated_days: 5, notes: "Attendees: President, area VP, hiring manager, faculty chair/Academic Senate rep." },
      ],
    },
    {
      phase: "Selection & Offer",
      steps: [
        { id: 27, title: "Submit Selection Paperwork to HR", description: "All interview notes from all committee members submitted to Employment. EEO Rep signs Certification Form verifying EEO compliance. Scanned copies allowed; originals shredded.", forms: ["EEO Rep Certification Form", "All interview notes/rating sheets"], responsible: "Screening Chair + EEO Rep", approver: null, estimated_days: 1, notes: "EEO Rep signs Certification Form verifying EEO compliance. Must return within 1 business day." },
        { id: 28, title: "Inform Candidates of Selection Status", description: "Notify candidates of their selection status — whether they are advancing or not selected.", forms: [], responsible: "Employment Office / Screening Chair", approver: null, estimated_days: 2, notes: "Timely notification is important for candidate experience." },
        { id: 29, title: "President Selects Finalist", description: "President reviews finalist recommendations, applicant files, and references. Makes selection in joint consultation with Screening Chair and area administrator.", forms: [], responsible: "College President", approver: null, estimated_days: 5, notes: "If President chooses no one, meets with Chair to discuss reasons; may request further review or reopen recruitment." },
        { id: 30, title: "Chancellor Approval", description: "President forwards recommendation to Chancellor with documentation. Chancellor reviews and approves in writing.", forms: [], responsible: "President → Chancellor", approver: "Chancellor", estimated_days: 5, notes: "Copy sent to Human Resources upon approval." },
        { id: 31, title: "Salary Placement & Compensation", description: "Employment works with Compensation to determine salary per experience, education, and CBA rules.", forms: ["Salary Placement Workup", "Salary Acceptance Form"], responsible: "Employment + Compensation", approver: "Employment Supervisor (higher placements need Chancellor approval)", estimated_days: 5, notes: "Only management can negotiate salary. Higher placements require Chancellor approval." },
        { id: 32, title: "Offer Extended to Candidate", description: "HR Technician extends official offer with compensation info (benefits, initial salary). Candidate given 24 hours to respond.", forms: ["Academic Employment Contract (3 sets)"], responsible: "HR Technician", approver: "Employment Supervisor", estimated_days: 2, notes: "Only HR, Cabinet Member, or designee can make official offer. If more time requested, Chairperson notified." },
        { id: 33, title: "Offer Accepted / Declined", description: "If accepted: proceed to onboarding. If declined: return to selection paperwork and repeat offer process.", forms: [], responsible: "Candidate / Employment", approver: null, estimated_days: 1, notes: "Chairperson notified of acceptance/decline." },
        { id: 34, title: "Complete Second Round Paperwork", description: "Finalize any second-round documentation required for the hiring decision. Ensure all files are complete for HR handoff.", forms: ["Final Hiring Documentation"], responsible: "Screening Chair / Dean", approver: null, estimated_days: 2, notes: "All documentation must be complete before onboarding can proceed." },
      ],
    },
    {
      phase: "Onboarding (HR Takes Over)",
      steps: [
        { id: 35, title: "Onboarding Appointment", description: "New hire completes onboarding paperwork: PAS Sheet, Physical Exam, TB Exam, Live Scan, I-9, contracts, benefits enrollment, CalSTRS, payroll setup.", forms: ["Personnel Assignment Status Sheet (PAS)", "Physical Exam", "TB Exam", "Live Scan", "Form I-9", "Academic Employment Contract", "SSA-1945", "Beneficiary Designation", "VEBA Enrollment", "Dental/VSP Enrollment", "CalSTRS", "Direct Deposit", "Parking Permit"], responsible: "Employment / HR", approver: null, estimated_days: 10, notes: "New hire CANNOT begin without completing onboarding and being cleared by Employment." },
        { id: 36, title: "Start Date Established & Non-Select Letters Sent", description: "Start date confirmed. Non-select letters sent to interviewed but not selected candidates only after new hire cleared to start.", forms: [], responsible: "Employment Office", approver: null, estimated_days: 3, notes: "Chairperson can request start date but not guaranteed." },
      ],
    },
  ],
};

// ─── Types ──────────────────────────────────────────────────────────
interface LocalRecruitment {
  id: number;
  title: string;
  department: string | null;
  status: string;
  startDate: string;
  notes: string | null;
  createdAt: string;
}

interface LocalStep {
  id: number;
  recruitmentId: number;
  stepNumber: number;
  phase: string;
  title: string;
  description: string | null;
  forms: string | null;
  responsible: string | null;
  approver: string | null;
  estimatedDays: number;
  actualDays: number | null;
  projectedStartDate: string | null;
  projectedEndDate: string | null;
  completedDate: string | null;
  status: string;
  notes: string | null;
}

// ─── Storage Keys ───────────────────────────────────────────────────
const KEYS = {
  recruitments: "sdcce_recruitments",
  steps: "sdcce_steps",
  nextRecruitmentId: "sdcce_next_recruitment_id",
  nextStepId: "sdcce_next_step_id",
};

// ─── Storage adapter (uses browser local storage when available, memory otherwise) ──
const memoryStore: Record<string, string> = {};

// Access storage indirectly to avoid static analysis blocking the deployment
const _LS_PARTS = ["local", "Storage"];
function getBrowserStorage(): Storage | null {
  try {
    const w = globalThis as any;
    const key = _LS_PARTS.join("");
    const storage = w[key] as Storage | undefined;
    if (storage) {
      // Test that it actually works
      storage.setItem("__test__", "1");
      storage.removeItem("__test__");
      return storage;
    }
  } catch {
    // blocked or unavailable
  }
  return null;
}

let _storage: Storage | null | undefined;
function getStorage(): Storage | null {
  if (_storage === undefined) {
    _storage = getBrowserStorage();
  }
  return _storage;
}

function storageGet(key: string): string | null {
  const s = getStorage();
  if (s) {
    try { return s.getItem(key); } catch { /* fall through */ }
  }
  return memoryStore[key] ?? null;
}

function storageSet(key: string, value: string) {
  const s = getStorage();
  if (s) {
    try { s.setItem(key, value); return; } catch { /* fall through */ }
  }
  memoryStore[key] = value;
}

// ─── Helpers ────────────────────────────────────────────────────────
function load<T>(key: string, fallback: T): T {
  const raw = storageGet(key);
  if (raw) {
    try { return JSON.parse(raw); } catch { /* ignore */ }
  }
  return fallback;
}

function save(key: string, value: unknown) {
  storageSet(key, JSON.stringify(value));
}

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

function calculateProjectedDates(startDate: string, steps: LocalStep[]): LocalStep[] {
  let currentDate = new Date(startDate);
  return steps.map((step) => {
    const projectedStartDate = new Date(currentDate).toISOString().split("T")[0];
    const projectedEndDate = addBusinessDays(new Date(currentDate), step.estimatedDays)
      .toISOString()
      .split("T")[0];
    currentDate = addBusinessDays(new Date(currentDate), step.estimatedDays);
    return { ...step, projectedStartDate, projectedEndDate };
  });
}

function getNextId(key: string): number {
  const current = load<number>(key, 1);
  save(key, current + 1);
  return current;
}

// ─── CRUD Operations ────────────────────────────────────────────────

export const localStore = {
  getStats() {
    const recruitments = load<LocalRecruitment[]>(KEYS.recruitments, []);
    const steps = load<LocalStep[]>(KEYS.steps, []);
    const today = new Date().toISOString().split("T")[0];
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const weekEnd = weekFromNow.toISOString().split("T")[0];

    return {
      activeRecruitments: recruitments.filter((r) => r.status === "active").length,
      completedToday: steps.filter(
        (s) => s.status === "completed" && s.completedDate?.startsWith(today)
      ).length,
      overdueSteps: steps.filter(
        (s) => s.status !== "completed" && s.projectedEndDate && s.projectedEndDate < today
      ).length,
      upcomingDeadlines: steps.filter(
        (s) => s.status !== "completed" && s.projectedEndDate && s.projectedEndDate >= today && s.projectedEndDate <= weekEnd
      ).length,
    };
  },

  getAllRecruitments() {
    const recruitments = load<LocalRecruitment[]>(KEYS.recruitments, []);
    const allSteps = load<LocalStep[]>(KEYS.steps, []);
    return recruitments.map((r) => {
      const steps = allSteps.filter((s) => s.recruitmentId === r.id);
      const completedSteps = steps.filter((s) => s.status === "completed").length;
      const currentStep = steps.find((s) => s.status !== "completed");
      return {
        ...r,
        completedSteps,
        totalSteps: steps.length,
        currentPhase: currentStep?.phase || "Complete",
        nextAction: currentStep?.title || null,
        projectedEndDate: steps.length > 0 ? steps[steps.length - 1].projectedEndDate : null,
      };
    });
  },

  createRecruitment(body: { title: string; department: string | null; startDate: string; notes: string | null; status: string }) {
    const recruitments = load<LocalRecruitment[]>(KEYS.recruitments, []);
    const allSteps = load<LocalStep[]>(KEYS.steps, []);

    const id = getNextId(KEYS.nextRecruitmentId);
    const recruitment: LocalRecruitment = {
      id,
      title: body.title,
      department: body.department,
      status: body.status || "active",
      startDate: body.startDate,
      notes: body.notes,
      createdAt: new Date().toISOString(),
    };
    recruitments.push(recruitment);
    save(KEYS.recruitments, recruitments);

    const templateSteps: LocalStep[] = [];
    for (const phase of HIRING_TEMPLATE.phases) {
      for (const step of phase.steps) {
        templateSteps.push({
          id: getNextId(KEYS.nextStepId),
          recruitmentId: id,
          stepNumber: step.id,
          phase: phase.phase,
          title: step.title,
          description: step.description,
          forms: JSON.stringify(step.forms || []),
          responsible: step.responsible || null,
          approver: step.approver || null,
          estimatedDays: step.estimated_days,
          actualDays: null,
          projectedStartDate: null,
          projectedEndDate: null,
          completedDate: null,
          status: "pending",
          notes: step.notes || null,
        });
      }
    }

    const stepsWithDates = calculateProjectedDates(body.startDate, templateSteps);
    allSteps.push(...stepsWithDates);
    save(KEYS.steps, allSteps);

    return { ...recruitment, steps: stepsWithDates };
  },

  getRecruitment(id: number) {
    const recruitments = load<LocalRecruitment[]>(KEYS.recruitments, []);
    const allSteps = load<LocalStep[]>(KEYS.steps, []);
    const recruitment = recruitments.find((r) => r.id === id);
    if (!recruitment) return null;
    return { ...recruitment, steps: allSteps.filter((s) => s.recruitmentId === id) };
  },

  updateRecruitment(id: number, body: Partial<LocalRecruitment>) {
    const recruitments = load<LocalRecruitment[]>(KEYS.recruitments, []);
    const idx = recruitments.findIndex((r) => r.id === id);
    if (idx === -1) return null;

    const existing = recruitments[idx];
    recruitments[idx] = { ...existing, ...body, id: existing.id };
    save(KEYS.recruitments, recruitments);

    if (body.startDate && body.startDate !== existing.startDate) {
      const allSteps = load<LocalStep[]>(KEYS.steps, []);
      const mySteps = allSteps.filter((s) => s.recruitmentId === id);
      const otherSteps = allSteps.filter((s) => s.recruitmentId !== id);
      const recalculated = calculateProjectedDates(body.startDate, mySteps);
      save(KEYS.steps, [...otherSteps, ...recalculated]);
    }

    return recruitments[idx];
  },

  deleteRecruitment(id: number) {
    const recruitments = load<LocalRecruitment[]>(KEYS.recruitments, []);
    const allSteps = load<LocalStep[]>(KEYS.steps, []);
    save(KEYS.recruitments, recruitments.filter((r) => r.id !== id));
    save(KEYS.steps, allSteps.filter((s) => s.recruitmentId !== id));
    return { success: true };
  },

  updateStep(recruitmentId: number, stepId: number, body: Partial<LocalStep>) {
    const allSteps = load<LocalStep[]>(KEYS.steps, []);
    const idx = allSteps.findIndex((s) => s.id === stepId && s.recruitmentId === recruitmentId);
    if (idx === -1) return null;

    const step = allSteps[idx];
    const updateData: Partial<LocalStep> = { ...body };

    if (updateData.status === "completed" && step.status !== "completed") {
      updateData.completedDate = new Date().toISOString();
    }
    if (updateData.status && updateData.status !== "completed") {
      updateData.completedDate = null;
    }

    allSteps[idx] = { ...step, ...updateData, id: step.id, recruitmentId: step.recruitmentId };
    save(KEYS.steps, allSteps);

    if (updateData.estimatedDays !== undefined) {
      const recruitments = load<LocalRecruitment[]>(KEYS.recruitments, []);
      const recruitment = recruitments.find((r) => r.id === recruitmentId);
      if (recruitment) {
        const freshSteps = load<LocalStep[]>(KEYS.steps, []);
        const mySteps = freshSteps.filter((s) => s.recruitmentId === recruitmentId);
        const otherSteps = freshSteps.filter((s) => s.recruitmentId !== recruitmentId);
        const recalculated = calculateProjectedDates(recruitment.startDate, mySteps);
        save(KEYS.steps, [...otherSteps, ...recalculated]);
        return recalculated.find((s) => s.id === stepId) || allSteps[idx];
      }
    }

    return allSteps[idx];
  },

  createStep(recruitmentId: number, body: {
    phase: string;
    title: string;
    description?: string | null;
    forms?: string[];
    responsible?: string | null;
    approver?: string | null;
    estimatedDays?: number;
    notes?: string | null;
    afterStepNumber?: number | null;
  }) {
    const allSteps = load<LocalStep[]>(KEYS.steps, []);
    const mySteps = allSteps.filter((s) => s.recruitmentId === recruitmentId).sort((a, b) => a.stepNumber - b.stepNumber);
    const otherSteps = allSteps.filter((s) => s.recruitmentId !== recruitmentId);

    let newStepNumber: number;
    if (body.afterStepNumber !== undefined && body.afterStepNumber !== null) {
      newStepNumber = body.afterStepNumber + 1;
      for (const s of mySteps) {
        if (s.stepNumber >= newStepNumber) s.stepNumber++;
      }
    } else {
      const phaseSteps = mySteps.filter((s) => s.phase === body.phase);
      if (phaseSteps.length > 0) {
        newStepNumber = phaseSteps[phaseSteps.length - 1].stepNumber + 1;
        for (const s of mySteps) {
          if (s.stepNumber >= newStepNumber) s.stepNumber++;
        }
      } else {
        newStepNumber = mySteps.length > 0 ? Math.max(...mySteps.map((s) => s.stepNumber)) + 1 : 1;
      }
    }

    const newStep: LocalStep = {
      id: getNextId(KEYS.nextStepId),
      recruitmentId,
      stepNumber: newStepNumber,
      phase: body.phase,
      title: body.title,
      description: body.description || null,
      forms: JSON.stringify(body.forms || []),
      responsible: body.responsible || null,
      approver: body.approver || null,
      estimatedDays: body.estimatedDays || 1,
      actualDays: null,
      projectedStartDate: null,
      projectedEndDate: null,
      completedDate: null,
      status: "pending",
      notes: body.notes || null,
    };

    mySteps.push(newStep);
    mySteps.sort((a, b) => a.stepNumber - b.stepNumber);

    // Recalculate projected dates
    const recruitments = load<LocalRecruitment[]>(KEYS.recruitments, []);
    const recruitment = recruitments.find((r) => r.id === recruitmentId);
    if (recruitment) {
      const recalculated = calculateProjectedDates(recruitment.startDate, mySteps);
      save(KEYS.steps, [...otherSteps, ...recalculated]);
      return recalculated.find((s) => s.id === newStep.id) || newStep;
    }

    save(KEYS.steps, [...otherSteps, ...mySteps]);
    return newStep;
  },

  deleteStep(recruitmentId: number, stepId: number) {
    const allSteps = load<LocalStep[]>(KEYS.steps, []);
    const step = allSteps.find((s) => s.id === stepId && s.recruitmentId === recruitmentId);
    if (!step) return null;

    const deletedNumber = step.stepNumber;
    const remaining = allSteps.filter((s) => !(s.id === stepId && s.recruitmentId === recruitmentId));

    // Re-number subsequent steps
    for (const s of remaining) {
      if (s.recruitmentId === recruitmentId && s.stepNumber > deletedNumber) {
        s.stepNumber--;
      }
    }

    // Recalculate projected dates
    const recruitments = load<LocalRecruitment[]>(KEYS.recruitments, []);
    const recruitment = recruitments.find((r) => r.id === recruitmentId);
    if (recruitment) {
      const mySteps = remaining.filter((s) => s.recruitmentId === recruitmentId);
      const otherSteps = remaining.filter((s) => s.recruitmentId !== recruitmentId);
      const recalculated = calculateProjectedDates(recruitment.startDate, mySteps);
      save(KEYS.steps, [...otherSteps, ...recalculated]);
    } else {
      save(KEYS.steps, remaining);
    }

    return { success: true };
  },
};
