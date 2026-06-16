import type { Audit } from "@/lib/types";
import { REPORT_CLOSING, REPORT_TAGLINE, REPORT_TITLE } from "@/lib/report";

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function ScoreCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-line bg-accent px-3 py-2 text-center">
      <div className="text-lg font-semibold text-brand-ink">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-muted">{label}</div>
      <div className="text-[10px] text-muted">/ 100</div>
    </div>
  );
}

function lines(text: string): string[] {
  return (text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function ReportPreview({ audit }: { audit: Audit }) {
  const mobileLines = lines(audit.mobileNotes);

  return (
    <article className="rounded-lg border border-line bg-card p-8 shadow-sm">
      <header className="border-b border-line pb-5">
        <h1 className="text-2xl font-semibold text-ink">{REPORT_TITLE}</h1>
        <p className="text-sm italic text-brand-ink">{REPORT_TAGLINE}</p>
        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          <div>
            <span className="text-muted">Business: </span>
            <span className="text-ink">{audit.customerName || "—"}</span>
          </div>
          <div>
            <span className="text-muted">Website: </span>
            <span className="text-ink">{audit.websiteUrl || "—"}</span>
          </div>
          <div>
            <span className="text-muted">Main business goal: </span>
            <span className="text-ink">{audit.primaryGoal || "—"}</span>
          </div>
          <div>
            <span className="text-muted">Date: </span>
            <span className="text-ink">{fmtDate(audit.updatedAt)}</span>
          </div>
          <div>
            <span className="text-muted">Prepared by: </span>
            <span className="text-ink">Ostavo</span>
          </div>
        </dl>
      </header>

      <Section title="Quick Summary">
        <p className="text-sm text-ink/90">
          {audit.quickSummary?.trim() || (
            <span className="text-muted">
              Add a short summary of what works, where clarity or trust is lost, and what
              to fix first.
            </span>
          )}
        </p>
      </Section>

      <Section title="Scores">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <ScoreCell label="First impression" value={audit.scores.firstImpression} />
          <ScoreCell label="Clarity" value={audit.scores.clarity} />
          <ScoreCell label="Trust" value={audit.scores.trust} />
          <ScoreCell label="CTA" value={audit.scores.cta} />
        </div>
        <p className="mt-3 text-sm text-ink/90">
          <span className="text-muted">Mobile review: </span>
          {audit.mobileReview}
        </p>
      </Section>

      <Section title="Mobile Notes">
        {mobileLines.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5 text-sm text-ink/90">
            {mobileLines.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">
            Add notes on the mobile first impression, button placement, and contact path.
          </p>
        )}
      </Section>

      <Section title="Top 5 Fixes">
        {audit.topFixes.length > 0 ? (
          <ol className="space-y-4">
            {audit.topFixes.map((fix, i) => (
              <li key={i} className="text-sm">
                <p className="font-medium text-ink">
                  {i + 1}. {fix.title || "Fix"}
                </p>
                {fix.whyItMatters?.trim() && (
                  <p className="text-ink/80">
                    <span className="text-muted">Why it matters: </span>
                    {fix.whyItMatters}
                  </p>
                )}
                {fix.whatToChange?.trim() && (
                  <p className="text-ink/80">
                    <span className="text-muted">What to change: </span>
                    {fix.whatToChange}
                  </p>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted">
            Add the fixes most likely to improve calls, bookings, leads, donations, sales,
            or trust.
          </p>
        )}
      </Section>

      <Section title="Recommended Homepage Copy">
        <dl className="space-y-2 text-sm">
          <Recommended label="Headline" value={audit.betterHeadline} />
          <Recommended label="Subheadline" value={audit.betterSubheadline} />
          <Recommended label="Main call to action" value={audit.betterCta} />
        </dl>
      </Section>

      <Section title="Recommended Next Cleanup">
        <p className="text-sm text-ink/90">
          {audit.recommendedNextCleanup?.trim() || (
            <span className="text-muted">Choose one narrow, practical next cleanup.</span>
          )}
        </p>
      </Section>

      <Section title="Closing Note">
        <p className="text-sm text-ink/90">{REPORT_CLOSING}</p>
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-ink">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Recommended({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-muted">{label}: </span>
      <span className="text-ink">{value?.trim() || "—"}</span>
    </div>
  );
}
