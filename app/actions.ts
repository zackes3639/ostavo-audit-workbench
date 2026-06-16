"use server";

import { after } from "next/server";
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

// Shared draft routine: read the audit, draft it (Claude or template fallback),
// persist, and advance status from the initial state. Not exported — `"use server"`
// modules may only export async functions, and this is called by the actions below.
async function runDraft(id: string): Promise<Audit | null> {
  const audit = await getAudit(id);
  if (!audit) return null;

  const draft = await generateAuditDraft(audit);
  const updated = await updateAudit(id, {
    ...draft,
    status: audit.status === "intake_received" ? "draft_started" : audit.status,
  });

  revalidatePath("/");
  revalidatePath(`/audits/${id}`);
  return updated;
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

  // Draft automatically, after the response is sent, so creating stays instant.
  after(async () => {
    try {
      await runDraft(audit.id);
    } catch (err) {
      console.error("Auto-draft on create failed:", err);
    }
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
  return runDraft(id);
}

// Used by the detail page to poll for the auto-draft landing.
export async function refetchAuditAction(id: string): Promise<Audit | null> {
  return getAudit(id);
}

export async function deleteAuditAction(id: string): Promise<void> {
  await deleteAudit(id);
  revalidatePath("/");
  redirect("/");
}
