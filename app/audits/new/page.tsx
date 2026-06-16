import Link from "next/link";
import { createAuditAction } from "@/app/actions";
import { BUSINESS_TYPES } from "@/lib/constants";

const fieldClass =
  "w-full rounded-md border border-line bg-card px-3 py-2 text-sm outline-none focus:border-brand";
const labelClass = "flex flex-col gap-1 text-sm font-medium text-ink";

export default function NewAuditPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/" className="text-sm text-brand hover:text-brand-ink">
        ← Back to all audits
      </Link>

      <h1 className="mt-3 text-2xl font-semibold text-ink">New audit</h1>
      <p className="mt-1 text-sm text-muted">
        Create a record after a customer has paid and submitted intake.
      </p>

      <form action={createAuditAction} className="mt-6 flex flex-col gap-4">
        <label className={labelClass}>
          Customer name
          <input
            name="customerName"
            type="text"
            required
            placeholder="Harbor Lane Wellness"
            className={fieldClass}
          />
        </label>

        <label className={labelClass}>
          Customer email
          <input
            name="customerEmail"
            type="email"
            placeholder="owner@example.com"
            className={fieldClass}
          />
        </label>

        <label className={labelClass}>
          Website URL
          <input
            name="websiteUrl"
            type="text"
            required
            placeholder="https://example.com"
            className={fieldClass}
          />
        </label>

        <label className={labelClass}>
          Business type
          <select name="businessType" defaultValue="" className={fieldClass} required>
            <option value="" disabled>
              Select a business type…
            </option>
            {BUSINESS_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          Primary business goal
          <input
            name="primaryGoal"
            type="text"
            placeholder="More first-time appointments"
            className={fieldClass}
          />
        </label>

        <label className={labelClass}>
          Notes from intake
          <textarea
            name="intakeNotes"
            rows={4}
            placeholder="Anything the customer asked you to look at, plus what action they want visitors to take."
            className={fieldClass}
          />
        </label>

        <div className="mt-2 flex items-center gap-3">
          <button
            type="submit"
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-ink"
          >
            Save audit
          </button>
          <Link href="/" className="text-sm text-muted hover:text-ink">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
