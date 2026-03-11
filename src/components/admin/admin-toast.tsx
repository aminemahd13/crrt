"use client";

import { useCallback } from "react";
import { toast } from "sonner";

export type AdminToastKind = "success" | "error" | "info";

export interface AdminToastItem {
  id: string;
  kind: AdminToastKind;
  message: string;
}

export function useAdminToast() {
  const dismissToast = useCallback((id: string) => {
    toast.dismiss(id);
  }, []);

  const pushToast = useCallback((kind: AdminToastKind, message: string) => {
    if (kind === "success") {
      toast.success(message);
      return;
    }
    if (kind === "error") {
      toast.error(message);
      return;
    }
    toast(message);
  }, []);

  return {
    toasts: [] as AdminToastItem[],
    dismissToast,
    pushToast,
  };
}

export function AdminToastViewport({
  toasts,
  onDismiss,
}: {
  toasts?: AdminToastItem[];
  onDismiss?: (id: string) => void;
}) {
  void toasts;
  void onDismiss;
  return null;
}
