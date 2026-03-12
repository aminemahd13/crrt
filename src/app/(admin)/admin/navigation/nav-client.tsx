"use client";

import { useState, useCallback } from "react";
import { Save, Check, Plus, Trash2, GripVertical, Eye, EyeOff, ArrowUp, ArrowDown, AlertCircle } from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  href: string;
  order: number;
  visible: boolean;
  section: string;
}

export function NavigationStudioClient({ navItems }: { navItems: NavItem[] }) {
  const [items, setItems] = useState<NavItem[]>(navItems);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragItem, setDragItem] = useState<string | null>(null);

  const headerItems = items.filter((i) => i.section === "header").sort((a, b) => a.order - b.order);
  const footerItems = items.filter((i) => i.section === "footer").sort((a, b) => a.order - b.order);

  const updateItem = (id: string, key: keyof NavItem, value: string | boolean | number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [key]: value } : item))
    );
    setError(null);
    setSaved(false);
  };

  const addItem = (section: string) => {
    const maxOrder = Math.max(0, ...items.filter((i) => i.section === section).map((i) => i.order));
    setItems((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        label: "",
        href: "/",
        order: maxOrder + 1,
        visible: true,
        section,
      },
    ]);
    setError(null);
    setSaved(false);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setError(null);
    setSaved(false);
  };

  const moveItem = useCallback((id: string, direction: "up" | "down", section: string) => {
    setItems((prev) => {
      const sectionItems = prev.filter((i) => i.section === section).sort((a, b) => a.order - b.order);
      const idx = sectionItems.findIndex((i) => i.id === id);
      if (idx < 0) return prev;
      if (direction === "up" && idx === 0) return prev;
      if (direction === "down" && idx === sectionItems.length - 1) return prev;

      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      const tempOrder = sectionItems[idx].order;
      const result = prev.map((item) => {
        if (item.id === sectionItems[idx].id) return { ...item, order: sectionItems[swapIdx].order };
        if (item.id === sectionItems[swapIdx].id) return { ...item, order: tempOrder };
        return item;
      });
      return result;
    });
    setError(null);
    setSaved(false);
  }, []);

  // Drag and drop
  const handleDragStart = (id: string) => {
    setDragItem(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string, section: string) => {
    e.preventDefault();
    if (!dragItem || dragItem === targetId) return;

    setItems((prev) => {
      const sectionItems = prev.filter((i) => i.section === section).sort((a, b) => a.order - b.order);
      const fromIdx = sectionItems.findIndex((i) => i.id === dragItem);
      const toIdx = sectionItems.findIndex((i) => i.id === targetId);
      if (fromIdx < 0 || toIdx < 0) return prev;

      // Swap orders
      const reordered = [...sectionItems];
      const [moved] = reordered.splice(fromIdx, 1);
      reordered.splice(toIdx, 0, moved);

      // Reassign order values
      const orderMap = new Map<string, number>();
      reordered.forEach((item, i) => orderMap.set(item.id, i));

      return prev.map((item) => {
        const newOrder = orderMap.get(item.id);
        return newOrder !== undefined ? { ...item, order: newOrder } : item;
      });
    });
    setError(null);
    setSaved(false);
  };

  const handleDragEnd = () => {
    setDragItem(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/navigation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(
          typeof payload?.error === "string" ? payload.error : "Failed to save navigation."
        );
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save navigation.");
      setSaved(false);
    } finally {
      setSaving(false);
    }
  };

  const renderSection = (title: string, section: string, sectionItems: NavItem[]) => (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-ice-white text-sm">{title}</h3>
        <button onClick={() => addItem(section)} className="inline-flex items-center gap-1 text-xs text-signal-orange hover:underline">
          <Plus size={12} /> Add Item
        </button>
      </div>

      <div className="space-y-1">
        {sectionItems.map((item, idx) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => handleDragStart(item.id)}
            onDragOver={(e) => handleDragOver(e, item.id, section)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-2 py-1.5 px-1 rounded-lg transition-colors ${
              dragItem === item.id ? "opacity-50 bg-signal-orange/5" : "hover:bg-white/[0.02]"
            }`}
          >
            <GripVertical size={14} className="text-steel-gray/40 cursor-grab shrink-0" />
            <span className="text-[10px] text-steel-gray/40 w-5 shrink-0">{idx + 1}</span>
            <input
              type="text"
              value={item.label}
              onChange={(e) => updateItem(item.id, "label", e.target.value)}
              placeholder="Label"
              className="flex-1 px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
            />
            <input
              type="text"
              value={item.href}
              onChange={(e) => updateItem(item.id, "href", e.target.value)}
              placeholder="/path"
              className="flex-1 px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
            />
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={() => moveItem(item.id, "up", section)}
                disabled={idx === 0}
                className="p-1 text-steel-gray/40 hover:text-ice-white disabled:opacity-20"
              >
                <ArrowUp size={12} />
              </button>
              <button
                onClick={() => moveItem(item.id, "down", section)}
                disabled={idx === sectionItems.length - 1}
                className="p-1 text-steel-gray/40 hover:text-ice-white disabled:opacity-20"
              >
                <ArrowDown size={12} />
              </button>
            </div>
            <button
              onClick={() => updateItem(item.id, "visible", !item.visible)}
              className={`p-2 rounded-md transition-colors ${
                item.visible ? "text-emerald-400" : "text-steel-gray"
              }`}
            >
              {item.visible ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
            <button onClick={() => removeItem(item.id)} className="p-2 text-steel-gray hover:text-red-400">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {sectionItems.length === 0 && (
          <p className="text-sm text-steel-gray/60 py-4 text-center">No items. Click &ldquo;Add Item&rdquo; to get started.</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-ice-white">Navigation Studio</h1>
          <p className="text-sm text-steel-gray mt-1">Drag to reorder, toggle visibility, manage header and footer links.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-signal-orange text-white text-xs font-medium hover:bg-[var(--signal-orange-hover)] transition-colors disabled:opacity-50"
        >
          {saved ? <Check size={12} /> : <Save size={12} />}
          {saving ? "Saving..." : saved ? "Saved!" : "Save"}
        </button>
      </div>
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          <AlertCircle size={12} />
          {error}
        </div>
      )}

      {renderSection("Header Navigation", "header", headerItems)}
      {renderSection("Footer Navigation", "footer", footerItems)}
    </div>
  );
}
