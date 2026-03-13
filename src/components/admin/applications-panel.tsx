"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import type { ApplicationRow } from "@/components/admin/events-admin-types";
import {
  formatApplicationDate,
  getApplicationColumns,
  getApplicationStatusCue,
  shouldOpenRowInNewTab,
  shouldOpenRowOnKey,
} from "@/components/admin/applications-panel.helpers";

interface ApplicationsPanelProps {
  rows: ApplicationRow[];
  showEventColumn?: boolean;
  emptyMessage?: string;
  getRowHref?: (row: ApplicationRow) => string;
}

function fallbackHref(row: ApplicationRow): string {
  return `/admin/applications/${row.id}`;
}

export function ApplicationsPanel({
  rows,
  showEventColumn = true,
  emptyMessage = "No applications found.",
  getRowHref = fallbackHref,
}: ApplicationsPanelProps) {
  const router = useRouter();
  const columns = getApplicationColumns(showEventColumn);

  const openRow = useCallback(
    (row: ApplicationRow, newTab = false) => {
      const href = getRowHref(row);
      if (newTab) {
        window.open(href, "_blank", "noopener,noreferrer");
        return;
      }
      router.push(href);
    },
    [getRowHref, router]
  );

  return (
    <AdminDataTable
      columns={columns}
      empty={rows.length === 0}
      emptyMessage={emptyMessage}
    >
      {rows.map((row) => {
        const cue = getApplicationStatusCue(row);
        const rowHref = getRowHref(row);

        return (
          <tr
            key={row.id}
            data-testid="application-row"
            data-application-id={row.id}
            data-href={rowHref}
            data-registration-status={row.registrationStatus ?? ""}
            data-review-status={row.reviewStatus ?? ""}
            data-status-cue={cue.label.toLowerCase().replace(/\s+/g, "_")}
            tabIndex={0}
            role="link"
            onClick={(event) => {
              openRow(
                row,
                shouldOpenRowInNewTab({
                  button: event.button,
                  ctrlKey: event.ctrlKey,
                  metaKey: event.metaKey,
                  shiftKey: event.shiftKey,
                })
              );
            }}
            onAuxClick={(event) => {
              if (event.button !== 1) return;
              event.preventDefault();
              openRow(row, true);
            }}
            onKeyDown={(event) => {
              if (!shouldOpenRowOnKey(event.key)) return;
              event.preventDefault();
              openRow(row, false);
            }}
            className="border-b border-[var(--ghost-border)] last:border-0 align-top cursor-pointer outline-none transition-colors hover:bg-white/[0.03] focus-visible:bg-white/[0.03] focus-visible:ring-2 focus-visible:ring-signal-orange/40"
          >
            <td className="px-4 py-3">
              <p className="text-sm font-medium text-ice-white">
                {row.userName || "Unknown member"}
              </p>
              <div className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-steel-gray">
                <span className={`size-1.5 rounded-full ${cue.toneClassName}`} aria-hidden />
                <span>{cue.label}</span>
              </div>
            </td>
            <td className="px-4 py-3">
              <p className="text-sm text-steel-gray">{row.userEmail || "No email"}</p>
            </td>
            {showEventColumn ? (
              <td className="px-4 py-3">
                <p className="text-sm text-ice-white">{row.eventTitle}</p>
                <p className="text-xs text-steel-gray">{row.eventSlug}</p>
              </td>
            ) : null}
            <td className="px-4 py-3 text-right">
              <p className="text-sm text-ice-white">{formatApplicationDate(row.createdAt)}</p>
              <p className="text-xs text-steel-gray">
                Updated {formatApplicationDate(row.updatedAt)}
              </p>
            </td>
          </tr>
        );
      })}
    </AdminDataTable>
  );
}
