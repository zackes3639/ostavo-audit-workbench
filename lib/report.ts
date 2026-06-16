// Customer-facing report renderer.
//
// Produces Markdown that follows docs/AUDIT_TEMPLATE.md (section order + headings),
// uses /100 scores, and reads like a calm cleanup report — not a technical analysis.
// Pure (types only), so it is safe to import in both server and client components.

import type { Audit } from "./types";

const TITLE = "Website Cleanup Audit";
const TAGLINE = "Cleaner websites. Clearer business.";
const CLOSING =
  "Your website does not need to become complicated. The highest-value next step is to make the business easier to understand, make the next action easier to find, and add the trust signals a visitor needs before they reach out.";

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function bulletsOrPlaceholder(text: string, placeholder: string): string {
  const trimmed = (text ?? "").trim();
  if (!trimmed) return `_${placeholder}_`;
  return trimmed
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `- ${line}`)
    .join("\n");
}

export function renderReportMarkdown(audit: Audit): string {
  const lines: string[] = [];
  const push = (line = "") => lines.push(line);

  push(`# ${TITLE}`);
  push(`_${TAGLINE}_`);
  push();
  push(`**Business:** ${audit.customerName || "—"}`);
  push(`**Website:** ${audit.websiteUrl || "—"}`);
  push(`**Main business goal:** ${audit.primaryGoal || "—"}`);
  push(`**Date:** ${fmtDate(audit.updatedAt)}`);
  push("**Prepared by:** Ostavo");
  push();

  push("## Quick Summary");
  push(
    audit.quickSummary?.trim() ||
      "_Add a 3–5 sentence summary of what works, where clarity or trust is lost, and what to fix first._",
  );
  push();

  push("## Scores");
  push(`- First Impression: ${audit.scores.firstImpression} / 100`);
  push(`- Clarity: ${audit.scores.clarity} / 100`);
  push(`- Trust: ${audit.scores.trust} / 100`);
  push(`- CTA: ${audit.scores.cta} / 100`);
  push(`- Mobile Review: ${audit.mobileReview}`);
  push();

  push("## Mobile Notes");
  push(
    bulletsOrPlaceholder(
      audit.mobileNotes,
      "Add notes on the mobile first impression, button placement, and contact path.",
    ),
  );
  push();

  push("## Top 5 Fixes");
  if (audit.topFixes.length === 0) {
    push(
      "_Add the fixes most likely to improve calls, bookings, leads, donations, sales, or trust._",
    );
    push();
  } else {
    audit.topFixes.forEach((fix, i) => {
      push(`${i + 1}. **${fix.title?.trim() || "Fix"}**`);
      if (fix.whyItMatters?.trim()) push(`   - Why it matters: ${fix.whyItMatters.trim()}`);
      if (fix.whatToChange?.trim()) push(`   - What to change: ${fix.whatToChange.trim()}`);
      push();
    });
  }

  push("## Homepage Headline");
  push(`**Recommended headline:** ${audit.betterHeadline?.trim() || "—"}`);
  push();

  push("## Homepage Subheadline");
  push(`**Recommended subheadline:** ${audit.betterSubheadline?.trim() || "—"}`);
  push();

  push("## Main Call To Action");
  push(`**Recommended CTA:** ${audit.betterCta?.trim() || "—"}`);
  push();

  push("## Recommended Next Cleanup");
  push(
    audit.recommendedNextCleanup?.trim() ||
      "_Choose one narrow, practical next cleanup._",
  );
  push();

  push("## Closing Note");
  push(CLOSING);

  return lines.join("\n");
}

export const REPORT_TITLE = TITLE;
export const REPORT_TAGLINE = TAGLINE;
export const REPORT_CLOSING = CLOSING;
