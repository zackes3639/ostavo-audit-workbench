import { listAudits } from "@/lib/store";
import { DashboardList } from "@/app/components/DashboardList";

// Always read the latest from disk (this is a single-user internal tool).
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const audits = await listAudits();
  return <DashboardList audits={audits} />;
}
