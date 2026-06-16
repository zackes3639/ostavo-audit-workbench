import type { AuditStatus, MobileReview } from "./types";

export const STATUS_ORDER: AuditStatus[] = [
  "intake_received",
  "draft_started",
  "needs_review",
  "ready_to_send",
  "sent",
];

export const STATUS_LABELS: Record<AuditStatus, string> = {
  intake_received: "Intake received",
  draft_started: "Draft started",
  needs_review: "Needs review",
  ready_to_send: "Ready to send",
  sent: "Sent",
};

export const MOBILE_REVIEW_OPTIONS: MobileReview[] = [
  "Strong",
  "Needs cleanup",
  "Needs urgent cleanup",
];

// Owner-friendly categories — no jargon.
export const BUSINESS_TYPES: string[] = [
  "Local / service business",
  "Wellness clinic",
  "Contractor / trades",
  "Nonprofit",
  "Owner-led company",
  "Small team / operator",
  "Other",
];
