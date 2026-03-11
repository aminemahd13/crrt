"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export function PayloadEditorDrawer({
  open,
  onOpenChange,
  title,
  description,
  value,
  onSave,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  value: Record<string, string>;
  onSave: (next: Record<string, string>) => Promise<void> | void;
  loading?: boolean;
}) {
  const [draft, setDraft] = useState<Record<string, string>>(() => value);

  const keys = Object.keys(draft);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-xl border-[var(--ghost-border)] bg-midnight text-ice-white">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription className="text-steel-gray">{description}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4">
          {keys.length === 0 ? (
            <p className="rounded-lg border border-[var(--ghost-border)] bg-midnight-light px-3 py-3 text-xs text-steel-gray">
              No payload fields available for this submission.
            </p>
          ) : (
            keys.map((key) => (
              <div key={key} className="space-y-1 rounded-lg border border-[var(--ghost-border)] bg-midnight-light p-3">
                <label className="text-[11px] uppercase tracking-wider text-steel-gray">{key}</label>
                <textarea
                  rows={3}
                  value={draft[key]}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      [key]: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-[var(--ghost-border)] bg-midnight px-2.5 py-2 text-xs text-ice-white"
                />
              </div>
            ))
          )}
        </div>

        <SheetFooter className="border-t border-[var(--ghost-border)]">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[var(--ghost-border)] bg-transparent text-steel-gray hover:text-ice-white"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              void onSave(draft);
            }}
            disabled={loading}
            className="bg-signal-orange text-white hover:bg-[var(--signal-orange-hover)]"
          >
            {loading ? "Saving..." : "Save Payload"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
