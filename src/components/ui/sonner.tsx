"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      closeButton
      position="top-right"
      theme="dark"
      toastOptions={{
        className:
          "border border-[var(--ghost-border)] bg-midnight-light text-ice-white",
      }}
    />
  );
}
