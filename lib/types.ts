// Core data model for the Ostavo audit workbench.
// Kept dependency-free so it is trivial to move into the marketing repo later.

export type AuditStatus =
  | "intake_received"
  | "draft_started"
  | "needs_review"
  | "ready_to_send"
  | "sent";

export type MobileReview = "Strong" | "Needs cleanup" | "Needs urgent cleanup";

// All scores are 0–100, matching the existing AUDIT_TEMPLATE / SAMPLE_AUDIT / sample PDF.
export interface AuditScores {
  firstImpression: number;
  clarity: number;
  trust: number;
  cta: number;
}

export interface AuditFix {
  title: string;
  whyItMatters: string;
  whatToChange: string;
}

export interface Audit {
  id: string;

  // Intake
  customerName: string;
  customerEmail: string;
  websiteUrl: string;
  businessType: string;
  primaryGoal: string;
  intakeNotes: string;

  // Workflow
  status: AuditStatus;

  // Report sections
  quickSummary: string;
  scores: AuditScores;
  mobileReview: MobileReview;
  mobileNotes: string;
  topFixes: AuditFix[];
  betterHeadline: string;
  betterSubheadline: string;
  betterCta: string;
  recommendedNextCleanup: string;

  // Internal only (never shown in the customer report)
  internalNotes: string;

  createdAt: string; // ISO
  updatedAt: string; // ISO
}

// The subset of fields the detail editor is allowed to change.
export type AuditEditableFields = Partial<
  Pick<
    Audit,
    | "status"
    | "quickSummary"
    | "scores"
    | "mobileReview"
    | "mobileNotes"
    | "topFixes"
    | "betterHeadline"
    | "betterSubheadline"
    | "betterCta"
    | "recommendedNextCleanup"
    | "internalNotes"
    | "customerName"
    | "customerEmail"
    | "websiteUrl"
    | "businessType"
    | "primaryGoal"
    | "intakeNotes"
  >
>;
