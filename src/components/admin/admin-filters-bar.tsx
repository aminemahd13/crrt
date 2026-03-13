"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AdminFiltersBar({
  search,
  onSearchChange,
  searchPlaceholder,
  children,
  advancedChildren,
  advancedLabel = "More filters",
  defaultAdvancedOpen = false,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  children?: ReactNode;
  advancedChildren?: ReactNode;
  advancedLabel?: string;
  defaultAdvancedOpen?: boolean;
}) {
  const [advancedOpen, setAdvancedOpen] = useState(defaultAdvancedOpen);
  const hasAdvanced = Boolean(advancedChildren);

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
        {hasAdvanced ? (
          <div className="space-y-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setAdvancedOpen((prev) => !prev)}
              className="h-8 px-2 text-xs text-steel-gray hover:bg-white/5 hover:text-ice-white"
            >
              {advancedOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {advancedLabel}
            </Button>
            {advancedOpen ? (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--ghost-border)] bg-midnight/30 p-3">
                {advancedChildren}
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
