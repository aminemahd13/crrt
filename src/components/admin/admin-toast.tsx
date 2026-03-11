"use client";

import { useCallback, useState } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

export type AdminToastKind = "success" | "error" | "info";

export interface AdminToastItem {
  id: string;
  kind: AdminToastKind;
  message: string;
}

const TOAST_STYLES: Record<AdminToastKind, string> = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  error: "border-red-500/30 bg-red-500/10 text-red-300",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-300",
};

const TOAST_ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

export function useAdminToast() {
  const [toasts, setToasts] = useState<AdminToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const pushToast = useCallback(
    (kind: AdminToastKind, message: string) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setToasts((prev) => [...prev, { id, kind, message }]);
      setTimeout(() => dismissToast(id), 3500);
    },
    [dismissToast]
  );

  return {
    toasts,
    dismissToast,
    pushToast,
  };
}

export function AdminToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: AdminToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-6 top-6 z-[70] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((item) => {
        const Icon = TOAST_ICONS[item.kind];
        return (
          <div
            key={item.id}
            className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-xs shadow-lg ${TOAST_STYLES[item.kind]}`}
            role="status"
            aria-live="polite"
          >
            <Icon size={14} className="mt-0.5 shrink-0" />
            <p className="flex-1 leading-relaxed">{item.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(item.id)}
              className="rounded p-0.5 opacity-70 transition hover:opacity-100"
              aria-label="Dismiss notification"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
