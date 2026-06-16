// Audit drafting seam.
//
// `generateAuditDraft` is the single entry point for drafting an audit. It calls
// Claude (Opus 4.8) with the site's page text + desktop/mobile screenshots and a
// structured-output schema, then maps the result onto `AuditDraft`.
//
// It degrades gracefully:
//   - no ANTHROPIC_API_KEY  -> deterministic template draft
//   - fetch / browser / model failure -> deterministic template draft
//
// The output is always a STARTING DRAFT for human review, never a finished audit.
// Customer-facing wording stays plain and owner-friendly; the model is told never
// to use AI / automation / SaaS language.

import Anthropic from "@anthropic-ai/sdk";
import type { Audit, AuditFix, MobileReview } from "./types";
import { MOBILE_REVIEW_OPTIONS } from "./constants";
import { fetchSiteContent, normalizeUrl, type SiteContent } from "./fetchSite";
import { captureScreenshots } from "./screenshot";

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

const MODEL = "claude-opus-4-8";

export async function generateAuditDraft(audit: Audit): Promise<AuditDraft> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return buildTemplateDraft(audit);
  }
  try {
    return await generateWithClaude(audit);
  } catch (err) {
    console.error("LLM draft failed; falling back to template draft:", err);
    return buildTemplateDraft(audit);
  }
}

// ---------------------------------------------------------------------------
// Claude-backed drafting
// ---------------------------------------------------------------------------

async function generateWithClaude(audit: Audit): Promise<AuditDraft> {
  const [site, shots] = await Promise.all([
    fetchSiteContent(audit.websiteUrl),
    captureScreenshots(normalizeUrl(audit.websiteUrl)),
  ]);

  if (!site?.text && !shots.desktop && !shots.mobile) {
    throw new Error("Could not read the website (no page text or screenshots).");
  }

  const client = new Anthropic();

  const content: Anthropic.ContentBlockParam[] = [
    { type: "text", text: buildUserText(audit, site) },
  ];
  if (shots.desktop) {
    content.push({ type: "text", text: "Desktop homepage (above the fold):" });
    content.push({
      type: "image",
      source: { type: "base64", media_type: "image/png", data: shots.desktop },
    });
  }
  if (shots.mobile) {
    content.push({ type: "text", text: "Mobile homepage (above the fold):" });
    content.push({
      type: "image",
      source: { type: "base64", media_type: "image/png", data: shots.mobile },
    });
  }

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "high",
      format: { type: "json_schema", schema: AUDIT_DRAFT_SCHEMA },
    },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
  });

  const message = await stream.finalMessage();
  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Model returned no structured output.");
  }
  return normalizeDraft(JSON.parse(textBlock.text) as RawDraft);
}

const SYSTEM_PROMPT = `You are a senior website reviewer for Ostavo, producing a $99 Website Cleanup Audit for a small-business owner. Ostavo's promise: cleaner websites, clearer business.

Score what a real visitor experiences, not how the site was built. Use a 0–100 scale:
- 90–100: clear, trustworthy, and easy to act on.
- 75–89: mostly clear, a few important cleanup opportunities.
- 60–74: understandable, but likely losing people or creating doubt.
- 40–59: confusing, incomplete, or hard to trust.
- 0–39: major clarity problems that block action.

Score four things:
- firstImpression: in the first 5 seconds, can a visitor tell what this is and why it matters?
- clarity: can a visitor quickly understand the offer, who it's for, and the main benefit?
- trust: is there enough proof (reviews, credentials, real contact details) to take the next step?
- cta: is the next step obvious, well-labeled, and repeated at the right moments?
Also give mobileReview as exactly one of: "Strong", "Needs cleanup", "Needs urgent cleanup".

Write for a busy owner. Be plain, calm, specific, and practical. Tie recommendations to the owner's stated business goal and to outcomes like more calls, bookings, leads, donations, sales, or trust.

Voice — use this kind of language: cleaner websites, clearer business, practical fixes, one clear view, better first impression, make your business easier to understand. NEVER use: AI, automation, workflow, data infrastructure, digital transformation, SaaS, or other technical/marketing jargon. Never mention that this audit was generated or that a model was involved.

Fill every field:
- quickSummary: 3–5 sentences — what works, where clarity or trust is lost, and what to fix first. Do not recommend a full redesign unless the site truly blocks trust or action.
- topFixes: EXACTLY 5 fixes, each with a plain-language title, a one-line "whyItMatters", and a concrete "whatToChange". Pick the fixes most likely to improve calls, bookings, leads, donations, sales, or trust.
- mobileNotes: 2–4 short notes, one per line (separate lines with a newline), about the mobile first impression, button placement, and contact path.
- betterHeadline, betterSubheadline, betterCta: concrete rewrites tailored to THIS business — not placeholders.
- recommendedNextCleanup: one narrow, practical next step (e.g. a homepage clarity pass), not a big project.

If you cannot see part of the site, make the best reasonable judgment from what you can see and keep claims modest.`;

function buildUserText(audit: Audit, site: SiteContent | null): string {
  const lines = [
    "Please produce the Website Cleanup Audit draft for this business.",
    "",
    "INTAKE",
    `- Business: ${audit.customerName || "—"}`,
    `- Business type: ${audit.businessType || "—"}`,
    `- Website: ${audit.websiteUrl || "—"}`,
    `- Main business goal: ${audit.primaryGoal || "—"}`,
    `- Notes from intake: ${audit.intakeNotes?.trim() || "—"}`,
    "",
  ];
  if (site?.text) {
    lines.push(
      "HOMEPAGE CONTENT (visible text extracted from the page)",
      site.title ? `Page title: ${site.title}` : "",
      "",
      site.text,
    );
  } else {
    lines.push(
      "HOMEPAGE CONTENT: the page text could not be read; rely on the screenshots below.",
    );
  }
  return lines.filter((l) => l !== undefined).join("\n");
}

// JSON Schema for structured output. Structured outputs disallow numeric min/max
// and array length constraints, so ranges/counts are enforced in normalizeDraft.
const AUDIT_DRAFT_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  properties: {
    quickSummary: { type: "string" },
    scores: {
      type: "object",
      additionalProperties: false,
      properties: {
        firstImpression: { type: "integer" },
        clarity: { type: "integer" },
        trust: { type: "integer" },
        cta: { type: "integer" },
      },
      required: ["firstImpression", "clarity", "trust", "cta"],
    },
    mobileReview: {
      type: "string",
      enum: MOBILE_REVIEW_OPTIONS,
    },
    mobileNotes: { type: "string" },
    topFixes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          whyItMatters: { type: "string" },
          whatToChange: { type: "string" },
        },
        required: ["title", "whyItMatters", "whatToChange"],
      },
    },
    betterHeadline: { type: "string" },
    betterSubheadline: { type: "string" },
    betterCta: { type: "string" },
    recommendedNextCleanup: { type: "string" },
  },
  required: [
    "quickSummary",
    "scores",
    "mobileReview",
    "mobileNotes",
    "topFixes",
    "betterHeadline",
    "betterSubheadline",
    "betterCta",
    "recommendedNextCleanup",
  ],
};

interface RawDraft {
  quickSummary?: string;
  scores?: {
    firstImpression?: number;
    clarity?: number;
    trust?: number;
    cta?: number;
  };
  mobileReview?: string;
  mobileNotes?: string;
  topFixes?: Array<{ title?: string; whyItMatters?: string; whatToChange?: string }>;
  betterHeadline?: string;
  betterSubheadline?: string;
  betterCta?: string;
  recommendedNextCleanup?: string;
}

function clampScore(n: unknown): number {
  const value = Math.round(Number(n));
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function normalizeDraft(raw: RawDraft): AuditDraft {
  const mobileReview: MobileReview = MOBILE_REVIEW_OPTIONS.includes(
    raw.mobileReview as MobileReview,
  )
    ? (raw.mobileReview as MobileReview)
    : "Needs cleanup";

  const topFixes: AuditFix[] = (raw.topFixes ?? [])
    .slice(0, 5)
    .map((fix) => ({
      title: (fix.title ?? "").trim(),
      whyItMatters: (fix.whyItMatters ?? "").trim(),
      whatToChange: (fix.whatToChange ?? "").trim(),
    }))
    .filter((fix) => fix.title);

  return {
    quickSummary: (raw.quickSummary ?? "").trim(),
    scores: {
      firstImpression: clampScore(raw.scores?.firstImpression),
      clarity: clampScore(raw.scores?.clarity),
      trust: clampScore(raw.scores?.trust),
      cta: clampScore(raw.scores?.cta),
    },
    mobileReview,
    mobileNotes: (raw.mobileNotes ?? "").trim(),
    topFixes,
    betterHeadline: (raw.betterHeadline ?? "").trim(),
    betterSubheadline: (raw.betterSubheadline ?? "").trim(),
    betterCta: (raw.betterCta ?? "").trim(),
    recommendedNextCleanup: (raw.recommendedNextCleanup ?? "").trim(),
  };
}

// ---------------------------------------------------------------------------
// Deterministic fallback (no API key, or any failure above)
// ---------------------------------------------------------------------------

function buildTemplateDraft(audit: Audit): AuditDraft {
  const type = audit.businessType?.trim();
  const businessPhrase = type ? `this ${type.toLowerCase()}` : "this business";
  const goal =
    audit.primaryGoal?.trim() || "more calls, bookings, leads, donations, or sales";

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
