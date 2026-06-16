"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createAudit,
  deleteAudit,
  getAudit,
  updateAudit,
} from "@/lib/store";
import { generateAuditDraft } from "@/lib/template";
import type { Audit, AuditEditableFields, AuditStatus } from "@/lib/types";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function createAuditAction(formData: FormData): Promise<void> {
  const audit = await createAudit({
    customerName: str(formData, "customerName"),
    customerEmail: str(formData, "customerEmail"),
    websiteUrl: str(formData, "websiteUrl"),
    businessType: str(formData, "businessType"),
    primaryGoal: str(formData, "primaryGoal"),
    intakeNotes: str(formData, "intakeNotes"),
  });
  revalidatePath("/");
  redirect(`/audits/${audit.id}`);
}

export async function updateAuditAction(
  id: string,
  patch: AuditEditableFields,
): Promise<Audit | null> {
  const updated = await updateAudit(id, patch);
  revalidatePath("/");
  revalidatePath(`/audits/${id}`);
  return updated;
}

export async function setStatusAction(
  id: string,
  status: AuditStatus,
): Promise<Audit | null> {
  const updated = await updateAudit(id, { status });
  revalidatePath("/");
  revalidatePath(`/audits/${id}`);
  return updated;
}

export async function generateDraftAction(id: string): Promise<Audit | null> {
  const audit = await getAudit(id);
  if (!audit) return null;

  const draft = await generateAuditDraft(audit);
  const updated = await updateAudit(id, {
    ...draft,
    // Advance the workflow only from the initial state.
    status: audit.status === "intake_received" ? "draft_started" : audit.status,
  });

  revalidatePath("/");
  revalidatePath(`/audits/${id}`);
  return updated;
}

export async function deleteAuditAction(id: string): Promise<void> {
  await deleteAudit(id);
  revalidatePath("/");
  redirect("/");
}
