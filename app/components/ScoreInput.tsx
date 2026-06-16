function clamp(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function ScoreInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-ink">{label}</span>
        <span className="text-xs text-muted">{value} / 100</span>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
          className="flex-1 accent-[var(--color-brand)]"
          aria-label={label}
        />
        <input
          type="number"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
          className="w-16 rounded-md border border-line bg-card px-2 py-1 text-sm outline-none focus:border-brand"
          aria-label={`${label} value`}
        />
      </div>
    </div>
  );
}
