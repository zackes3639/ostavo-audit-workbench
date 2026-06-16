# Ostavo Audit Workbench (internal)

A small internal tool for managing and producing paid **Website Cleanup Audits**.
Not customer-facing. Built to deliver the first ~10 paid audits cleanly, with human
review at every step.

> Cleaner websites. Clearer business.

## Run it

```bash
cd "audit app"
npm install
npm run dev
# open http://localhost:3000
```

Other scripts: `npm run build` (production build), `npm start` (serve the build),
`npm run lint`.

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

**Generate draft from template** fills the report sections with editable starting content
derived from the intake. It is a draft for human review — not an automated final report.

## Architecture (built to merge into the marketing repo later)

```
lib/
  types.ts      # Audit model — dependency-free
  constants.ts  # status / business-type / mobile-review options
  store.ts      # file-based JSON persistence behind an AuditStore interface
  template.ts   # generateAuditDraft(audit) — the single seam for an LLM later
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

### Adding an LLM later

Replace the body of `generateAuditDraft(audit)` in `lib/template.ts` with a model call
that returns the same `AuditDraft` shape. Nothing else needs to change. Keep the
human-review step — drafts are always edited before they're sent.

## Deliberately out of scope

Payments, webhooks, customer login/portal, email sending, roles/permissions, analytics,
subscriptions, and any external database.

## Brand language

Customer-facing output stays plain and owner-friendly: cleaner websites, clearer business,
practical fixes, better first impression, more calls/bookings/leads/donations/sales/trust.
No AI, automation, workflow, or SaaS jargon.
