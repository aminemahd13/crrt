"use client";

export function InlineStatusControl<TStatus extends string>({
  value,
  options,
  labels,
  onChange,
  disabled,
}: {
  value: TStatus | null;
  options: TStatus[];
  labels: Record<TStatus, string>;
  onChange: (status: TStatus) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-1">
      {options.map((status) => (
        <button
          key={status}
          type="button"
          onClick={() => onChange(status)}
          disabled={disabled || value === status}
          className={`rounded-md border px-2 py-1 text-[10px] transition-colors ${
            value === status
              ? "border-signal-orange/30 bg-signal-orange/10 text-signal-orange"
              : "border-[var(--ghost-border)] text-steel-gray hover:bg-white/5 hover:text-ice-white"
          }`}
        >
          {labels[status]}
        </button>
      ))}
    </div>
  );
}
