import Link from "next/link";

export default function AuditNotFound() {
  return (
    <div className="mx-auto max-w-xl rounded-lg border border-line bg-card p-10 text-center">
      <h1 className="text-lg font-semibold text-ink">Audit not found</h1>
      <p className="mt-2 text-sm text-muted">
        This audit may have been deleted, or the link is incorrect.
      </p>
      <Link
        href="/"
        className="mt-4 inline-flex rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-ink"
      >
        Back to all audits
      </Link>
    </div>
  );
}
