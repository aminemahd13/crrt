"use client";

import { Search } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AdminFiltersBar({
  search,
  onSearchChange,
  searchPlaceholder,
  children,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  children?: ReactNode;
}) {
  return (
    <Card className="glass-card border-[var(--ghost-border)] py-0">
      <CardContent className="space-y-3 px-4 py-4">
        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-steel-gray"
          />
          <Input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="border-[var(--ghost-border)] bg-midnight-light pl-9 text-ice-white placeholder:text-steel-gray"
          />
        </div>
        {children ? (
          <div className="flex flex-wrap items-center gap-2">{children}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
