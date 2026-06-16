import { notFound } from "next/navigation";
import { getAudit } from "@/lib/store";
import { AuditEditor } from "@/app/components/AuditEditor";

export const dynamic = "force-dynamic";

export default async function AuditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const audit = await getAudit(id);
  if (!audit) notFound();

  return <AuditEditor initialAudit={audit} />;
}
