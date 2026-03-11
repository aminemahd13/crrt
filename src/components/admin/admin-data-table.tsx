"use client";

import type { ReactNode } from "react";

export interface AdminDataTableColumn {
  key: string;
  label: string;
  className?: string;
}

export function AdminDataTable({
  columns,
  children,
  empty,
  emptyMessage,
}: {
  columns: AdminDataTableColumn[];
  children: ReactNode;
  empty: boolean;
  emptyMessage: string;
}) {
  return (
    <div className="glass-card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--ghost-border)]">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-steel-gray ${
                  column.className ?? ""
                }`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {empty ? (
            <tr>
              <td
                className="px-4 py-8 text-center text-sm text-steel-gray"
                colSpan={Math.max(columns.length, 1)}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}
