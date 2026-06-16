// Audit drafting seam.
//
// `generateAuditDraft` is the single function to swap when you want an LLM to draft
// audits. Today it returns deterministic, template-based content derived from the
// intake fields. Later, replace the body with a model call (keep the same signature)
// and every caller keeps working.
//
// IMPORTANT: the output is a STARTING DRAFT for human review, not a finished audit.
// Scores and copy are sensible placeholders meant to be edited before sending.

import type { Audit, AuditFix } from "./types";

export type AuditDraft = Partial<
  Pick<
    Audit,
    | "quickSummary"
    | "scores"
    | "mobileReview"
    | "mobileNotes"
    | "topFixes"
    | "betterHeadline"
    | "betterSubheadline"
    | "betterCta"
    | "recommendedNextCleanup"
  >
>;

export async function generateAuditDraft(audit: Audit): Promise<AuditDraft> {
  // To add an LLM later: call it here and map the response onto AuditDraft.
  return buildTemplateDraft(audit);
}

function buildTemplateDraft(audit: Audit): AuditDraft {
  const type = audit.businessType?.trim();
  const businessPhrase = type ? `this ${type.toLowerCase()}` : "this business";
  const goal = audit.primaryGoal?.trim() || "more calls, bookings, leads, donations, or sales";

  const quickSummary = [
    "The website has a real offer, but the homepage takes too long to explain who it helps and what to do next.",
    "The biggest opportunity is to make the first screen clearer, add trust signals near the main action, and make the next step easier to find.",
    `The site does not need a full redesign first — it needs a clearer headline, a stronger next step, and a few trust signals in the right places to support ${goal}.`,
  ].join(" ");

  const topFixes: AuditFix[] = [
    {
      title: "Make the homepage headline say what you do in plain English.",
      whyItMatters:
        "New visitors should not have to guess what the business offers in the first few seconds.",
      whatToChange:
        "Name the service, who it is for, and the main outcome right at the top of the page.",
    },
    {
      title: "Move the main next step into the first screen.",
      whyItMatters: "People who are ready to act should not have to search for how.",
      whatToChange: `Add one clear button near the headline and repeat it after the main explanation, pointing toward ${goal}.`,
    },
    {
      title: "Add trust signals near the main action.",
      whyItMatters: "Visitors need a little proof before they call, book, donate, or buy.",
      whatToChange:
        "Place a short review, credential, or recognizable client near the first button.",
    },
    {
      title: "Simplify the busiest section of the page.",
      whyItMatters: "Too many equal choices make the page feel harder to use.",
      whatToChange:
        "Group related items by what the visitor needs, and link to detail pages only after the main options are clear.",
    },
    {
      title: "Strengthen the mobile first impression.",
      whyItMatters: "Many first-time visitors will decide from their phone.",
      whatToChange:
        "Shorten the top copy, move the main button higher, and make phone and contact details easy to tap.",
    },
  ];

  return {
    quickSummary,
    scores: { firstImpression: 70, clarity: 65, trust: 65, cta: 60 },
    mobileReview: "Needs cleanup",
    mobileNotes: [
      "The first screen looks fine, but visitors scroll too far before understanding the offer.",
      "The main button should appear before the detailed sections.",
      "Contact and location details could be easier to tap.",
    ].join("\n"),
    topFixes,
    betterHeadline: `Plain-English headline that names what ${businessPhrase} does and who it helps.`,
    betterSubheadline: `One short line naming the audience, the main service, and the next step toward ${goal}.`,
    betterCta: "Book a Call",
    recommendedNextCleanup:
      "Homepage clarity pass: rewrite the top of the page, simplify the busiest section, and add trust signals near the main action.",
  };
}
