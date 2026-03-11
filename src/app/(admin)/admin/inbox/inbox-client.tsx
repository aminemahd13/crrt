"use client";

import { useState } from "react";
import { Search, Download, ChevronDown, CheckCircle, Clock, XCircle, Eye } from "lucide-react";

interface Submission {
  id: string;
  formTitle: string;
  data: Record<string, string>;
  status: string;
  createdAt: string;
}

const statusConfig: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  new: { icon: Clock, color: "text-blue-400 bg-blue-500/10 border-blue-500/20", label: "New" },
  in_review: { icon: Eye, color: "text-amber-400 bg-amber-500/10 border-amber-500/20", label: "In Review" },
  accepted: { icon: CheckCircle, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", label: "Accepted" },
  rejected: { icon: XCircle, color: "text-red-400 bg-red-500/10 border-red-500/20", label: "Rejected" },
};

export function InboxClient({ submissions }: { submissions: Submission[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = submissions
    .filter((s) => !statusFilter || s.status === statusFilter)
    .filter(
      (s) =>
        s.formTitle.toLowerCase().includes(search.toLowerCase()) ||
        JSON.stringify(s.data).toLowerCase().includes(search.toLowerCase())
    );

  const handleExportCSV = () => {
    const headers = ["ID", "Form", "Status", "Date", "Data"];
    const rows = filtered.map((s) => [
      s.id,
      s.formTitle,
      s.status,
      new Date(s.createdAt).toLocaleDateString(),
      JSON.stringify(s.data),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "submissions.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    await fetch(`/api/admin/submissions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    window.location.reload();
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-ice-white">Inbox</h1>
          <p className="text-sm text-steel-gray mt-1">
            {submissions.length} submissions • All form responses in one place.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[var(--ghost-border)] text-xs text-steel-gray hover:text-ice-white hover:bg-white/5 transition-colors"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-steel-gray" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search submissions..."
            className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-midnight-light border border-[var(--ghost-border)] text-sm text-ice-white placeholder:text-steel-gray focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setStatusFilter(null)}
            className={`track-chip ${!statusFilter ? "active" : ""}`}
          >
            All
          </button>
          {Object.entries(statusConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(statusFilter === key ? null : key)}
              className={`track-chip ${statusFilter === key ? "active" : ""}`}
            >
              {config.label}
            </button>
          ))}
        </div>
      </div>

      {/* Submissions */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-steel-gray">No submissions found.</p>
          </div>
        ) : (
          filtered.map((sub) => {
            const cfg = statusConfig[sub.status] || statusConfig.new;
            const StatusIcon = cfg.icon;
            const isExpanded = expandedId === sub.id;
            const parsedData = sub.data;

            return (
              <div key={sub.id} className="glass-card overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors text-left"
                >
                  <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}>
                    <StatusIcon size={10} />
                    {cfg.label}
                  </span>
                  <span className="text-sm text-ice-white flex-1">{sub.formTitle}</span>
                  <span className="text-xs text-steel-gray">
                    {new Date(sub.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`text-steel-gray transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  />
                </button>

                {isExpanded && (
                  <div className="border-t border-[var(--ghost-border)] px-5 py-4 bg-midnight/30 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(parsedData).map(([key, value]) => (
                        <div key={key}>
                          <label className="text-[10px] text-steel-gray uppercase tracking-wider">{key}</label>
                          <p className="text-sm text-ice-white mt-0.5">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <span className="text-xs text-steel-gray">Update status:</span>
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <button
                          key={key}
                          onClick={() => updateStatus(sub.id, key)}
                          disabled={sub.status === key}
                          className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${
                            sub.status === key
                              ? config.color + " cursor-default"
                              : "border-[var(--ghost-border)] text-steel-gray hover:text-ice-white hover:bg-white/5"
                          }`}
                        >
                          {config.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
