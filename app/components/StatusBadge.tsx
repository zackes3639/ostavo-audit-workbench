import type { AuditStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/constants";

const STYLES: Record<AuditStatus, string> = {
  intake_received: "bg-slate-100 text-slate-700",
  draft_started: "bg-amber-100 text-amber-800",
  needs_review: "bg-orange-100 text-orange-800",
  ready_to_send: "bg-emerald-100 text-emerald-800",
  sent: "bg-teal-100 text-teal-800",
};

export function StatusBadge({ status }: { status: AuditStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
