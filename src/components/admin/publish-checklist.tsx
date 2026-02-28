"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Image as ImageIcon,
  FileText,
  Link2,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface CheckItem {
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
}

interface PublishChecklistProps {
  contentType: "event" | "project" | "post";
  data: {
    title?: string;
    description?: string;
    slug?: string;
    content?: string;
    coverImage?: string | null;
    status?: string;
  };
}

export function PublishChecklist({ contentType, data }: PublishChecklistProps) {
  const [open, setOpen] = useState(false);
  const [checks, setChecks] = useState<CheckItem[]>([]);

  useEffect(() => {
    const items: CheckItem[] = [];

    // SEO: Title length
    if (!data.title || data.title.length === 0) {
      items.push({ label: "Title", status: "fail", detail: "Title is missing" });
    } else if (data.title.length < 10) {
      items.push({ label: "Title", status: "warn", detail: `Title is short (${data.title.length} chars, aim for 30-60)` });
    } else if (data.title.length > 80) {
      items.push({ label: "Title", status: "warn", detail: `Title is long (${data.title.length} chars, aim for 30-60)` });
    } else {
      items.push({ label: "Title", status: "pass", detail: `${data.title.length} characters — optimal` });
    }

    // SEO: Description / excerpt
    if (!data.description || data.description.length === 0) {
      items.push({ label: "Description", status: "warn", detail: "No description provided — important for SEO" });
    } else if (data.description.length < 50) {
      items.push({ label: "Description", status: "warn", detail: `Description is short (${data.description.length} chars, aim for 100-160)` });
    } else {
      items.push({ label: "Description", status: "pass", detail: `${data.description.length} characters` });
    }

    // Slug
    if (!data.slug || data.slug.length === 0) {
      items.push({ label: "URL Slug", status: "fail", detail: "Slug is required for publishing" });
    } else if (/[^a-z0-9-]/.test(data.slug)) {
      items.push({ label: "URL Slug", status: "warn", detail: "Slug contains non-standard characters" });
    } else {
      items.push({ label: "URL Slug", status: "pass", detail: `/${contentType}s/${data.slug}` });
    }

    // Cover image
    if (!data.coverImage) {
      items.push({ label: "Cover Image", status: "warn", detail: "No cover image — recommended for social sharing" });
    } else {
      items.push({ label: "Cover Image", status: "pass", detail: "Cover image set" });
    }

    // Content length
    if (!data.content || data.content.length < 50) {
      items.push({ label: "Content", status: "warn", detail: `Content is very short (${data.content?.length ?? 0} chars)` });
    } else {
      const wordCount = data.content.split(/\s+/).length;
      items.push({ label: "Content", status: "pass", detail: `${wordCount} words` });
    }

    // Check for broken image references
    if (data.content) {
      const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
      let hasImages = false;
      let match;
      while ((match = imgRegex.exec(data.content)) !== null) {
        hasImages = true;
        const src = match[2];
        if (!src.startsWith("http") && !src.startsWith("/")) {
          items.push({ label: "Image Link", status: "warn", detail: `Relative path "${src}" — may not resolve correctly` });
        }
      }
      if (hasImages) {
        items.push({ label: "Images", status: "pass", detail: "Content contains embedded images" });
      }

      // Check for internal links
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      while ((match = linkRegex.exec(data.content)) !== null) {
        const href = match[2];
        if (href.startsWith("/") && !href.startsWith("/uploads")) {
          // Internal link — just note it
          items.push({ label: "Internal Link", status: "pass", detail: `Links to ${href}` });
        }
      }
    }

    setChecks(items);
  }, [data, contentType]);

  const passCount = checks.filter((c) => c.status === "pass").length;
  const warnCount = checks.filter((c) => c.status === "warn").length;
  const failCount = checks.filter((c) => c.status === "fail").length;

  const statusIcon = (status: "pass" | "warn" | "fail") => {
    switch (status) {
      case "pass":
        return <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />;
      case "warn":
        return <AlertCircle size={14} className="text-amber-400 shrink-0" />;
      case "fail":
        return <XCircle size={14} className="text-red-400 shrink-0" />;
    }
  };

  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Search size={14} className="text-steel-gray" />
          <span className="text-xs font-medium text-ice-white">Publish Checklist</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {passCount}
          </span>
          {warnCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {warnCount}
            </span>
          )}
          {failCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
              {failCount}
            </span>
          )}
        </div>
        {open ? <ChevronUp size={14} className="text-steel-gray" /> : <ChevronDown size={14} className="text-steel-gray" />}
      </button>

      {open && (
        <div className="border-t border-[var(--ghost-border)] px-4 py-2 space-y-1">
          {checks.map((check, i) => (
            <div key={i} className="flex items-start gap-2 py-1.5">
              {statusIcon(check.status)}
              <div>
                <p className="text-xs text-ice-white">{check.label}</p>
                <p className="text-[10px] text-steel-gray">{check.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
