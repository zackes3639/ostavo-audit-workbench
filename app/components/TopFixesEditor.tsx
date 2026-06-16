import type { AuditFix } from "@/lib/types";

const MAX_FIXES = 5;
const fieldClass =
  "w-full rounded-md border border-line bg-card px-3 py-2 text-sm outline-none focus:border-brand";

export function TopFixesEditor({
  fixes,
  onChange,
}: {
  fixes: AuditFix[];
  onChange: (fixes: AuditFix[]) => void;
}) {
  function update(index: number, patch: Partial<AuditFix>) {
    onChange(fixes.map((fix, i) => (i === index ? { ...fix, ...patch } : fix)));
  }

  function add() {
    if (fixes.length >= MAX_FIXES) return;
    onChange([...fixes, { title: "", whyItMatters: "", whatToChange: "" }]);
  }

  function remove(index: number) {
    onChange(fixes.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-4">
      {fixes.length === 0 && (
        <p className="text-sm text-muted">
          No fixes yet. Add up to five, or generate a draft to start.
        </p>
      )}

      {fixes.map((fix, index) => (
        <div key={index} className="rounded-md border border-line p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Fix {index + 1}
            </span>
            <button
              type="button"
              onClick={() => remove(index)}
              className="text-xs text-muted hover:text-ink"
            >
              Remove
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={fix.title}
              onChange={(e) => update(index, { title: e.target.value })}
              placeholder="The fix, in plain language"
              className={fieldClass}
            />
            <input
              type="text"
              value={fix.whyItMatters}
              onChange={(e) => update(index, { whyItMatters: e.target.value })}
              placeholder="Why it matters"
              className={fieldClass}
            />
            <input
              type="text"
              value={fix.whatToChange}
              onChange={(e) => update(index, { whatToChange: e.target.value })}
              placeholder="What to change"
              className={fieldClass}
            />
          </div>
        </div>
      ))}

      {fixes.length < MAX_FIXES && (
        <button
          type="button"
          onClick={add}
          className="self-start rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink hover:border-brand hover:text-brand-ink"
        >
          + Add fix ({fixes.length}/{MAX_FIXES})
        </button>
      )}
    </div>
  );
}
