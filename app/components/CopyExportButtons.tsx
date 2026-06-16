"use client";

import { useState } from "react";
import type { Audit } from "@/lib/types";
import { renderReportMarkdown } from "@/lib/report";

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "audit";
}

export function CopyExportButtons({ audit }: { audit: Audit }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const markdown = renderReportMarkdown(audit);
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked; fall back to a download.
      download();
    }
  }

  function download() {
    const markdown = renderReportMarkdown(audit);
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `website-cleanup-audit-${slugify(audit.customerName)}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={copy}
        className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-ink"
      >
        {copied ? "Copied!" : "Copy as Markdown"}
      </button>
      <button
        type="button"
        onClick={download}
        className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink hover:border-brand hover:text-brand-ink"
      >
        Download .md
      </button>
    </div>
  );
}
