"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Audit, AuditStatus } from "@/lib/types";
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/constants";
import { StatusBadge } from "./StatusBadge";

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DashboardList({ audits }: { audits: Audit[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<AuditStatus | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return audits.filter((a) => {
      if (status !== "all" && a.status !== status) return false;
      if (!q) return true;
      return [
        a.customerName,
        a.websiteUrl,
        a.primaryGoal,
        a.customerEmail,
        a.businessType,
      ].some((v) => v?.toLowerCase().includes(q));
    });
  }, [audits, query, status]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-ink">Audits</h1>
        <p className="text-sm text-muted">
          {audits.length === 0
            ? "No audits yet."
            : `${audits.length} audit${audits.length === 1 ? "" : "s"} total.`}
        </p>
      </div>

      {audits.length > 0 && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, website, or goal…"
            className="w-full rounded-md border border-line bg-card px-3 py-2 text-sm outline-none focus:border-brand sm:max-w-xs"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as AuditStatus | "all")}
            className="rounded-md border border-line bg-card px-3 py-2 text-sm outline-none focus:border-brand"
          >
            <option value="all">All statuses</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      )}

      {audits.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-card p-10 text-center">
          <p className="text-sm text-muted">
            Create your first audit record after a customer pays and submits intake.
          </p>
          <Link
            href="/audits/new"
            className="mt-4 inline-flex rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-ink"
          >
            New audit
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-line bg-card p-8 text-center text-sm text-muted">
          No audits match your search.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((audit) => (
            <li key={audit.id}>
              <Link
                href={`/audits/${audit.id}`}
                className="block rounded-lg border border-line bg-card p-4 transition-colors hover:border-brand"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">
                      {audit.customerName || "Untitled customer"}
                    </p>
                    <p className="truncate text-sm text-muted">
                      {audit.websiteUrl || "No website provided"}
                    </p>
                    {audit.primaryGoal && (
                      <p className="mt-1 truncate text-sm text-ink/80">
                        Goal: {audit.primaryGoal}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <StatusBadge status={audit.status} />
                    <span className="text-xs text-muted">
                      Created {fmtDate(audit.createdAt)}
                    </span>
                    <span className="text-xs text-muted">
                      Updated {fmtDate(audit.updatedAt)}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
