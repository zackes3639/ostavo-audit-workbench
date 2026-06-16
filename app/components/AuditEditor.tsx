"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type {
  Audit,
  AuditFix,
  AuditScores,
  AuditStatus,
  MobileReview,
} from "@/lib/types";
import {
  BUSINESS_TYPES,
  MOBILE_REVIEW_OPTIONS,
  STATUS_LABELS,
  STATUS_ORDER,
} from "@/lib/constants";
import {
  deleteAuditAction,
  generateDraftAction,
  setStatusAction,
  updateAuditAction,
} from "@/app/actions";
import { ScoreInput } from "./ScoreInput";
import { TopFixesEditor } from "./TopFixesEditor";
import { ReportPreview } from "./ReportPreview";
import { CopyExportButtons } from "./CopyExportButtons";
import { StatusBadge } from "./StatusBadge";

const fieldClass =
  "w-full rounded-md border border-line bg-card px-3 py-2 text-sm outline-none focus:border-brand";
const labelClass = "flex flex-col gap-1 text-sm font-medium text-ink";

function fmtTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function hasDraftContent(a: Audit): boolean {
  return Boolean(
    a.quickSummary.trim() ||
      a.mobileNotes.trim() ||
      a.topFixes.length ||
      a.betterHeadline.trim() ||
      a.betterSubheadline.trim() ||
      a.betterCta.trim() ||
      a.recommendedNextCleanup.trim(),
  );
}

export function AuditEditor({ initialAudit }: { initialAudit: Audit }) {
  const [audit, setAudit] = useState<Audit>(initialAudit);
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [savedAt, setSavedAt] = useState(initialAudit.updatedAt);
  const [dirty, setDirty] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Local field updates (mark dirty until saved).
  function set<K extends keyof Audit>(key: K, value: Audit[K]) {
    setAudit((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }
  function setScore(key: keyof AuditScores, value: number) {
    setAudit((prev) => ({ ...prev, scores: { ...prev.scores, [key]: value } }));
    setDirty(true);
  }

  function handleSave() {
    startTransition(async () => {
      const updated = await updateAuditAction(audit.id, {
        status: audit.status,
        quickSummary: audit.quickSummary,
        scores: audit.scores,
        mobileReview: audit.mobileReview,
        mobileNotes: audit.mobileNotes,
        topFixes: audit.topFixes,
        betterHeadline: audit.betterHeadline,
        betterSubheadline: audit.betterSubheadline,
        betterCta: audit.betterCta,
        recommendedNextCleanup: audit.recommendedNextCleanup,
        internalNotes: audit.internalNotes,
        customerName: audit.customerName,
        customerEmail: audit.customerEmail,
        websiteUrl: audit.websiteUrl,
        businessType: audit.businessType,
        primaryGoal: audit.primaryGoal,
        intakeNotes: audit.intakeNotes,
      });
      if (updated) {
        setAudit(updated);
        setSavedAt(updated.updatedAt);
        setDirty(false);
      }
    });
  }

  function handleStatusChange(status: AuditStatus) {
    setAudit((prev) => ({ ...prev, status }));
    startTransition(async () => {
      const updated = await setStatusAction(audit.id, status);
      if (updated) {
        setSavedAt(updated.updatedAt);
        setAudit((prev) => ({ ...prev, updatedAt: updated.updatedAt }));
      }
    });
  }

  function handleDelete() {
    if (!window.confirm("Delete this audit? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteAuditAction(audit.id);
    });
  }

  function handleGenerateDraft() {
    if (
      hasDraftContent(audit) &&
      !window.confirm(
        "Replace the current draft sections with fresh template content? This cannot be undone.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      const updated = await generateDraftAction(audit.id);
      if (updated) {
        setAudit(updated);
        setSavedAt(updated.updatedAt);
        setDirty(false);
      }
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <Link href="/" className="text-sm text-brand hover:text-brand-ink">
          ← Back to all audits
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-ink">
              {audit.customerName || "Untitled customer"}
            </h1>
            <p className="text-sm text-muted">{audit.websiteUrl || "No website"}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={audit.status} />
            <span className="text-xs text-muted">
              {dirty ? "Unsaved changes" : `Saved ${fmtTime(savedAt)}`}
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-card p-3">
        <div className="inline-flex rounded-md border border-line p-0.5">
          <button
            type="button"
            onClick={() => setView("edit")}
            className={`rounded px-3 py-1 text-sm font-medium ${
              view === "edit" ? "bg-brand text-white" : "text-ink hover:text-brand-ink"
            }`}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setView("preview")}
            className={`rounded px-3 py-1 text-sm font-medium ${
              view === "preview" ? "bg-brand text-white" : "text-ink hover:text-brand-ink"
            }`}
          >
            Preview
          </button>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink">
          Status
          <select
            value={audit.status}
            onChange={(e) => handleStatusChange(e.target.value as AuditStatus)}
            className="rounded-md border border-line bg-card px-2 py-1 text-sm outline-none focus:border-brand"
          >
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={handleGenerateDraft}
            disabled={isPending}
            className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink hover:border-brand hover:text-brand-ink disabled:opacity-50"
          >
            Generate draft from template
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending || !dirty}
            className="rounded-md bg-brand px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-ink disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {view === "preview" ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">
              Customer-facing preview. Save your edits, then copy or download the report.
            </p>
            <CopyExportButtons audit={audit} />
          </div>
          <ReportPreview audit={audit} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Intake */}
          <Card title="Intake" subtitle="From the customer after payment.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                Customer name
                <input
                  className={fieldClass}
                  value={audit.customerName}
                  onChange={(e) => set("customerName", e.target.value)}
                />
              </label>
              <label className={labelClass}>
                Customer email
                <input
                  className={fieldClass}
                  value={audit.customerEmail}
                  onChange={(e) => set("customerEmail", e.target.value)}
                />
              </label>
              <label className={labelClass}>
                Website URL
                <input
                  className={fieldClass}
                  value={audit.websiteUrl}
                  onChange={(e) => set("websiteUrl", e.target.value)}
                />
              </label>
              <label className={labelClass}>
                Business type
                <select
                  className={fieldClass}
                  value={audit.businessType}
                  onChange={(e) => set("businessType", e.target.value)}
                >
                  <option value="">Select…</option>
                  {BUSINESS_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label className={`${labelClass} sm:col-span-2`}>
                Primary business goal
                <input
                  className={fieldClass}
                  value={audit.primaryGoal}
                  onChange={(e) => set("primaryGoal", e.target.value)}
                />
              </label>
              <label className={`${labelClass} sm:col-span-2`}>
                Notes from intake
                <textarea
                  className={fieldClass}
                  rows={3}
                  value={audit.intakeNotes}
                  onChange={(e) => set("intakeNotes", e.target.value)}
                />
              </label>
            </div>
          </Card>

          {/* Quick summary */}
          <Card title="Quick summary" subtitle="3–5 sentences a busy owner can act on.">
            <textarea
              className={fieldClass}
              rows={4}
              value={audit.quickSummary}
              onChange={(e) => set("quickSummary", e.target.value)}
              placeholder="What works, where clarity or trust is lost, and what to fix first."
            />
          </Card>

          {/* Scores */}
          <Card title="Scores" subtitle="Score what a real visitor experiences (0–100).">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ScoreInput
                label="First impression"
                value={audit.scores.firstImpression}
                onChange={(v) => setScore("firstImpression", v)}
              />
              <ScoreInput
                label="Clarity"
                value={audit.scores.clarity}
                onChange={(v) => setScore("clarity", v)}
              />
              <ScoreInput
                label="Trust"
                value={audit.scores.trust}
                onChange={(v) => setScore("trust", v)}
              />
              <ScoreInput
                label="CTA"
                value={audit.scores.cta}
                onChange={(v) => setScore("cta", v)}
              />
            </div>
            <label className={`${labelClass} mt-4 sm:max-w-xs`}>
              Mobile review
              <select
                className={fieldClass}
                value={audit.mobileReview}
                onChange={(e) => set("mobileReview", e.target.value as MobileReview)}
              >
                {MOBILE_REVIEW_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
          </Card>

          {/* Mobile notes */}
          <Card title="Mobile notes" subtitle="One note per line.">
            <textarea
              className={fieldClass}
              rows={3}
              value={audit.mobileNotes}
              onChange={(e) => set("mobileNotes", e.target.value)}
              placeholder={"First impression on a phone\nButton placement\nContact path"}
            />
          </Card>

          {/* Top 5 fixes */}
          <Card
            title="Top 5 fixes"
            subtitle="The fixes most likely to improve calls, bookings, leads, donations, sales, or trust."
          >
            <TopFixesEditor
              fixes={audit.topFixes}
              onChange={(fixes: AuditFix[]) => set("topFixes", fixes)}
            />
          </Card>

          {/* Recommended copy */}
          <Card title="Recommended homepage copy">
            <div className="flex flex-col gap-4">
              <label className={labelClass}>
                Better headline
                <input
                  className={fieldClass}
                  value={audit.betterHeadline}
                  onChange={(e) => set("betterHeadline", e.target.value)}
                />
              </label>
              <label className={labelClass}>
                Better subheadline
                <input
                  className={fieldClass}
                  value={audit.betterSubheadline}
                  onChange={(e) => set("betterSubheadline", e.target.value)}
                />
              </label>
              <label className={labelClass}>
                Better call to action
                <input
                  className={fieldClass}
                  value={audit.betterCta}
                  onChange={(e) => set("betterCta", e.target.value)}
                />
              </label>
            </div>
          </Card>

          {/* Next cleanup */}
          <Card title="Recommended next cleanup" subtitle="Keep it narrow and practical.">
            <textarea
              className={fieldClass}
              rows={3}
              value={audit.recommendedNextCleanup}
              onChange={(e) => set("recommendedNextCleanup", e.target.value)}
            />
          </Card>

          {/* Internal notes */}
          <Card
            title="Internal notes"
            subtitle="Only for you — never included in the customer report."
          >
            <textarea
              className={fieldClass}
              rows={3}
              value={audit.internalNotes}
              onChange={(e) => set("internalNotes", e.target.value)}
            />
          </Card>
        </div>
      )}

      <div className="mt-8 border-t border-line pt-4">
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="text-xs text-muted hover:text-red-600 disabled:opacity-50"
        >
          Delete this audit
        </button>
      </div>
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-line bg-card p-5">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}
