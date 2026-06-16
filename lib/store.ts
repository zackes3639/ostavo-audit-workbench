// File-based persistence for audits.
//
// This is intentionally the simplest reliable option for the first ~10 audits:
// a single JSON file behind an `AuditStore` interface. To move to SQLite/Postgres
// later, implement `AuditStore` again and swap the `store` export — no caller changes.
//
// Server-only: this module uses `fs`. Import it from server components and
// server actions, never from client components.

import { promises as fs } from "fs";
import path from "path";
import type { Audit } from "./types";

export type NewAuditInput = Pick<
  Audit,
  | "customerName"
  | "customerEmail"
  | "websiteUrl"
  | "businessType"
  | "primaryGoal"
  | "intakeNotes"
>;

export interface AuditStore {
  listAudits(): Promise<Audit[]>;
  getAudit(id: string): Promise<Audit | null>;
  createAudit(input: NewAuditInput): Promise<Audit>;
  updateAudit(id: string, patch: Partial<Audit>): Promise<Audit | null>;
  deleteAudit(id: string): Promise<boolean>;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "audits.json");

function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && "code" in err;
}

function nowIso(): string {
  return new Date().toISOString();
}

function defaultScores(): Audit["scores"] {
  return { firstImpression: 0, clarity: 0, trust: 0, cta: 0 };
}

async function readAll(): Promise<Audit[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Audit[]) : [];
  } catch (err: unknown) {
    if (isNodeError(err) && err.code === "ENOENT") return [];
    throw err;
  }
}

async function writeAll(audits: Audit[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, `${JSON.stringify(audits, null, 2)}\n`, "utf8");
}

const fileStore: AuditStore = {
  async listAudits() {
    const audits = await readAll();
    return audits.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async getAudit(id) {
    const audits = await readAll();
    return audits.find((a) => a.id === id) ?? null;
  },

  async createAudit(input) {
    const audits = await readAll();
    const ts = nowIso();
    const audit: Audit = {
      id: crypto.randomUUID(),
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      websiteUrl: input.websiteUrl,
      businessType: input.businessType,
      primaryGoal: input.primaryGoal,
      intakeNotes: input.intakeNotes,
      status: "intake_received",
      quickSummary: "",
      scores: defaultScores(),
      mobileReview: "Needs cleanup",
      mobileNotes: "",
      topFixes: [],
      betterHeadline: "",
      betterSubheadline: "",
      betterCta: "",
      recommendedNextCleanup: "",
      internalNotes: "",
      createdAt: ts,
      updatedAt: ts,
    };
    audits.push(audit);
    await writeAll(audits);
    return audit;
  },

  async updateAudit(id, patch) {
    const audits = await readAll();
    const idx = audits.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    const existing = audits[idx];
    const updated: Audit = {
      ...existing,
      ...patch,
      // Protect immutable fields.
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: nowIso(),
    };
    audits[idx] = updated;
    await writeAll(audits);
    return updated;
  },

  async deleteAudit(id) {
    const audits = await readAll();
    const next = audits.filter((a) => a.id !== id);
    if (next.length === audits.length) return false;
    await writeAll(next);
    return true;
  },
};

export const store: AuditStore = fileStore;

// Convenience function exports so callers don't reach into `store` directly.
export const listAudits = (): Promise<Audit[]> => store.listAudits();
export const getAudit = (id: string): Promise<Audit | null> => store.getAudit(id);
export const createAudit = (input: NewAuditInput): Promise<Audit> =>
  store.createAudit(input);
export const updateAudit = (
  id: string,
  patch: Partial<Audit>,
): Promise<Audit | null> => store.updateAudit(id, patch);
export const deleteAudit = (id: string): Promise<boolean> => store.deleteAudit(id);
