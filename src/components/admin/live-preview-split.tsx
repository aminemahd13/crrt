"use client";

import { useState } from "react";
import { Monitor, Tablet, Smartphone, Languages } from "lucide-react";

const previewModes = [
  { id: "desktop", icon: Monitor, width: "100%", label: "Desktop" },
  { id: "tablet", icon: Tablet, width: "768px", label: "Tablet" },
  { id: "mobile", icon: Smartphone, width: "375px", label: "Mobile" },
] as const;

interface LivePreviewSplitProps {
  editor: React.ReactNode;
  previewUrl?: string;
  children?: React.ReactNode;
}

export function LivePreviewSplit({ editor, previewUrl, children }: LivePreviewSplitProps) {
  const [mode, setMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [rtl, setRtl] = useState(false);

  const currentMode = previewModes.find((m) => m.id === mode)!;

  return (
    <div className="flex h-full">
      {/* Editor pane */}
      <div className="w-1/2 min-w-[400px] border-r border-[var(--ghost-border)] overflow-y-auto p-6">
        {editor}
      </div>

      {/* Preview pane */}
      <div className="flex-1 flex flex-col bg-midnight">
        {/* Preview toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--ghost-border)] bg-midnight-light">
          <span className="text-xs text-steel-gray font-heading">Live Preview</span>
          <div className="flex items-center gap-1">
            {previewModes.map((pm) => (
              <button
                key={pm.id}
                onClick={() => setMode(pm.id)}
                className={`p-1.5 rounded-md transition-colors ${
                  mode === pm.id
                    ? "bg-signal-orange/10 text-signal-orange"
                    : "text-steel-gray hover:text-ice-white hover:bg-white/5"
                }`}
                title={pm.label}
              >
                <pm.icon size={14} />
              </button>
            ))}
            <div className="w-px h-4 bg-[var(--ghost-border)] mx-1" />
            <button
              onClick={() => setRtl(!rtl)}
              className={`p-1.5 rounded-md transition-colors ${
                rtl
                  ? "bg-signal-orange/10 text-signal-orange"
                  : "text-steel-gray hover:text-ice-white hover:bg-white/5"
              }`}
              title="Toggle RTL"
            >
              <Languages size={14} />
            </button>
          </div>
        </div>

        {/* Preview content */}
        <div className="flex-1 flex items-start justify-center p-6 overflow-auto">
          <div
            className="bg-midnight-light border border-[var(--ghost-border)] rounded-xl overflow-hidden transition-all duration-300 h-full"
            style={{
              width: currentMode.width,
              maxWidth: "100%",
              direction: rtl ? "rtl" : "ltr",
            }}
          >
            {previewUrl ? (
              <iframe
                src={previewUrl}
                className="w-full h-full border-0"
                title="Preview"
              />
            ) : (
              children || (
                <div className="flex items-center justify-center h-full text-steel-gray text-sm">
                  Preview will appear here
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
