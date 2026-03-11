"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
    <Card className="glass-card overflow-hidden border-[var(--ghost-border)] py-0">
      <Table>
        <TableHeader>
          <TableRow className="border-[var(--ghost-border)] hover:bg-transparent">
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={`px-4 text-xs font-semibold uppercase tracking-wider text-steel-gray ${
                  column.className ?? ""
                }`}
              >
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {empty ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                className="px-4 py-8 text-center text-sm text-steel-gray"
                colSpan={Math.max(columns.length, 1)}
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            children
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
