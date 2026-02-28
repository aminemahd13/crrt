"use client";

import { useState, useRef } from "react";
import { Upload, Search, Grid, List, Trash2, Copy, Check, Image as ImageIcon, X } from "lucide-react";

interface MediaItem {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  alt: string | null;
  usedIn: string | null;
  createdAt: Date;
}

export function MediaStudioClient({ media: initialMedia }: { media: MediaItem[] }) {
  const [media, setMedia] = useState<MediaItem[]>(initialMedia);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = media.filter((m) =>
    m.filename.toLowerCase().includes(search.toLowerCase())
  );

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const newMedia = await res.json();
        setMedia((prev) => [newMedia, ...prev]);
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this file? This cannot be undone.")) return;
    setDeleting(id);

    const res = await fetch(`/api/admin/media?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setMedia((prev) => prev.filter((m) => m.id !== id));
    }
    setDeleting(null);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-ice-white">Media Library</h1>
          <p className="text-sm text-steel-gray mt-1">
            {media.length} files • Manage images and media assets.
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,.svg,.pdf"
            multiple
            onChange={handleUpload}
            className="hidden"
            id="media-upload"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-signal-orange text-white text-xs font-medium hover:bg-[var(--signal-orange-hover)] transition-colors disabled:opacity-50"
          >
            <Upload size={14} />
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-steel-gray" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files..."
            className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-midnight-light border border-[var(--ghost-border)] text-sm text-ice-white placeholder:text-steel-gray focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-midnight-light border border-[var(--ghost-border)]">
          <button
            onClick={() => setView("grid")}
            className={`p-1.5 rounded-md transition-colors ${
              view === "grid" ? "bg-signal-orange/10 text-signal-orange" : "text-steel-gray hover:text-ice-white"
            }`}
          >
            <Grid size={14} />
          </button>
          <button
            onClick={() => setView("list")}
            className={`p-1.5 rounded-md transition-colors ${
              view === "list" ? "bg-signal-orange/10 text-signal-orange" : "text-steel-gray hover:text-ice-white"
            }`}
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* Media Grid / List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <ImageIcon size={40} className="mx-auto text-steel-gray/30 mb-3" />
          <p className="text-sm text-steel-gray">No media files yet.</p>
          <p className="text-xs text-steel-gray/60 mt-1">Upload images to use across your content.</p>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((item) => (
            <div key={item.id} className="glass-card overflow-hidden group relative">
              {deleting === item.id && (
                <div className="absolute inset-0 z-10 bg-midnight/80 flex items-center justify-center">
                  <span className="text-xs text-steel-gray">Deleting...</span>
                </div>
              )}
              <div className="aspect-square bg-midnight flex items-center justify-center">
                {item.mimeType.startsWith("image/") ? (
                  <img src={item.url} alt={item.alt ?? item.filename} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={24} className="text-steel-gray/40" />
                )}
              </div>
              <div className="p-3 space-y-1">
                <p className="text-xs text-ice-white truncate">{item.filename}</p>
                <p className="text-[10px] text-steel-gray">{formatSize(item.size)}</p>
                {item.usedIn && (
                  <p className="text-[10px] text-signal-orange">Used in: {item.usedIn}</p>
                )}
              </div>
              <div className="flex items-center border-t border-[var(--ghost-border)] opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => copyUrl(item.url, item.id)}
                  className="flex-1 py-2 text-[10px] text-steel-gray hover:text-ice-white hover:bg-white/5 flex items-center justify-center gap-1"
                >
                  {copiedId === item.id ? <Check size={10} /> : <Copy size={10} />}
                  {copiedId === item.id ? "Copied!" : "Copy URL"}
                </button>
                <div className="w-px h-4 bg-[var(--ghost-border)]" />
                <button
                  onClick={() => handleDelete(item.id)}
                  className="flex-1 py-2 text-[10px] text-steel-gray hover:text-red-400 hover:bg-red-500/5 flex items-center justify-center gap-1"
                >
                  <Trash2 size={10} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 px-4 py-3 border-b border-[var(--ghost-border)] last:border-0 hover:bg-white/[0.02]"
            >
              <div className="w-10 h-10 rounded-lg bg-midnight flex items-center justify-center overflow-hidden shrink-0">
                {item.mimeType.startsWith("image/") ? (
                  <img src={item.url} alt={item.filename} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={16} className="text-steel-gray/40" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ice-white truncate">{item.filename}</p>
                <p className="text-xs text-steel-gray">{formatSize(item.size)} • {item.mimeType}</p>
              </div>
              {item.usedIn && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-signal-orange/10 text-signal-orange border border-signal-orange/20">
                  Used in: {item.usedIn}
                </span>
              )}
              <button
                onClick={() => copyUrl(item.url, item.id)}
                className="p-1.5 rounded-md text-steel-gray hover:text-ice-white hover:bg-white/5"
              >
                {copiedId === item.id ? <Check size={14} /> : <Copy size={14} />}
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="p-1.5 rounded-md text-steel-gray hover:text-red-400 hover:bg-red-500/5"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
