# Ostavo Audit Workbench (internal)

A small internal tool for managing and producing paid **Website Cleanup Audits**.
Not customer-facing. Built to deliver the first ~10 paid audits cleanly, with human
review at every step.

> Cleaner websites. Clearer business.

## Run it

```bash
cd "audit app"
npm install
npx playwright install chromium   # one-time: browser used for site screenshots
cp .env.example .env.local        # then paste your Anthropic API key into .env.local
npm run dev
# open http://localhost:3000
```

Other scripts: `npm run build` (production build), `npm start` (serve the build),
`npm run lint`.

Without an `ANTHROPIC_API_KEY` the app still runs — it falls back to template-based
drafts instead of model-written ones.

## What it does

1. **Dashboard** (`/`) — list all audits with customer, website, goal, status, and dates;
   search and filter by status.
2. **New audit** (`/audits/new`) — capture intake: name, email, website, business type,
   goal, and notes.
3. **Audit detail** (`/audits/[id]`) — edit every report section, set scores (0–100),
   manage the Top 5 fixes, write the better headline/subheadline/CTA, keep internal notes,
   and change status (`intake_received → draft_started → needs_review → ready_to_send →
   sent`).
4. **Report preview** (the **Preview** tab on the detail page) — a clean, customer-facing
   render. **Copy as Markdown** or **Download .md**.

### Drafting

When a new audit is created, a draft is generated **automatically in the background**: the
app fetches the homepage, captures desktop + mobile screenshots, and asks Claude (Opus 4.8)
to write the scores, Top 5 fixes, headline/subheadline/CTA, mobile notes, and summary. The
detail page shows a "generating…" state and loads the draft when it lands (~20–40s). You can
also re-run it any time with the **Generate draft** button.

It is always a **draft for human review** — never an automated final report. You edit and
approve before sending. Customers never see any AI/automation language; the report stays
plain and owner-friendly.

Cost is roughly $0.10–0.20 per audit on Opus 4.8. If no API key is set (or the fetch /
browser / model call fails), it falls back to a deterministic template draft.

## Architecture (built to merge into the marketing repo later)

```
lib/
  types.ts      # Audit model — dependency-free
  constants.ts  # status / business-type / mobile-review options
  store.ts      # file-based JSON persistence behind an AuditStore interface
  template.ts   # generateAuditDraft(audit) — Claude call + template fallback
  fetchSite.ts  # fetch homepage -> plain visible text
  screenshot.ts # Playwright desktop + mobile screenshots
  report.ts     # renderReportMarkdown(audit) — customer-facing Markdown
app/
  page.tsx                 # dashboard (server) + components/DashboardList (client)
  actions.ts               # server actions: create / update / setStatus / generateDraft / delete
  audits/new/page.tsx      # new-audit form
  audits/[id]/page.tsx     # detail editor + report preview
  components/              # editor, preview, fixes editor, score inputs, badges, export
```

### Persistence

Audits are stored in `data/audits.json` (created on first write, gitignored). To move to
SQLite/Postgres later, implement the `AuditStore` interface in `lib/store.ts` again and
swap the `store` export — callers don't change.

### Drafting internals & swapping the model

All drafting flows through `generateAuditDraft(audit)` in `lib/template.ts`. To change the
model, edit the `MODEL` constant or the request there; to change the prompt/rubric, edit
`SYSTEM_PROMPT`. The structured-output schema maps 1:1 onto `AuditDraft`, and
`normalizeDraft` clamps scores to 0–100 and caps the fix list at 5. The template fallback
(`buildTemplateDraft`) stays as the no-key / failure path.

### Note for merging into the marketing repo (Vercel)

Two things in the draft path assume a long-running local Node process: Playwright (needs a
Chromium binary) and `after()` (runs the draft after the response). On Vercel serverless,
swap Playwright for a hosted screenshot service (or `@sparticuz/chromium`), and keep `after()`
or move drafting to a queue/route handler. Both are isolated to `lib/screenshot.ts` and
`app/actions.ts`.

## Deliberately out of scope

Payments, webhooks, customer login/portal, email sending, roles/permissions, analytics,
subscriptions, and any external database.

## Brand language

Customer-facing output stays plain and owner-friendly: cleaner websites, clearer business,
practical fixes, better first impression, more calls/bookings/leads/donations/sales/trust.
No AI, automation, workflow, or SaaS jargon.
