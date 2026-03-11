import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--ghost-border)] bg-midnight-light px-6 py-12 text-center">
      <h2 className="text-base font-heading font-semibold text-ice-white">{title}</h2>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm text-steel-gray">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
