"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Palette,
  Home,
  Calendar,
  FolderOpen,
  FileText,
  Image,
  Inbox,
  Navigation,
  Mail,
  Settings,
  Command,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
} from "lucide-react";

const navGroups = [
  {
    label: "Operate",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Applications", href: "/admin/applications", icon: Inbox },
    ],
  },
  {
    label: "Build",
    items: [
      { label: "Theme Studio", href: "/admin/theme", icon: Palette },
      { label: "Home Studio", href: "/admin/home", icon: Home },
      { label: "Navigation", href: "/admin/navigation", icon: Navigation },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Events", href: "/admin/events", icon: Calendar },
      { label: "Projects", href: "/admin/projects", icon: FolderOpen },
      { label: "Posts", href: "/admin/posts", icon: FileText },
      { label: "Media", href: "/admin/media", icon: Image },
      { label: "Resources", href: "/admin/resources", icon: FileText },
      { label: "Resource Categories", href: "/admin/resource-categories", icon: FolderOpen },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Email Templates", href: "/admin/email-templates", icon: Mail },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

export function StudioShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  const visibleNavGroups = navGroups;

  return (
    <div className="flex h-screen bg-midnight overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`flex flex-col border-r border-[var(--ghost-border)] bg-midnight-light transition-all duration-200 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--ghost-border)]">
          {!collapsed && (
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-signal-orange flex items-center justify-center text-white text-xs font-bold font-heading">
                CR
              </div>
              <span className="font-heading font-semibold text-sm text-ice-white">Studio</span>
            </Link>
          )}
          {collapsed && (
            <div className="w-7 h-7 rounded-md bg-signal-orange flex items-center justify-center text-white text-xs font-bold font-heading mx-auto">
              CR
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-md hover:bg-white/5 text-steel-gray hidden md:block"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Command palette trigger */}
        {!collapsed && (
          <button
            onClick={() => setCmdOpen(true)}
            className="mx-3 mt-3 flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--ghost-border)] bg-[var(--ghost-white)] text-xs text-steel-gray hover:text-ice-white hover:border-[rgba(248,250,252,0.15)] transition-all"
          >
            <Command size={12} />
            <span className="flex-1 text-left">Search...</span>
            <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-midnight border border-[var(--ghost-border)]">⌘K</kbd>
          </button>
        )}

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {visibleNavGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <h4 className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-steel-gray/60">
                  {group.label}
                </h4>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/admin" && pathname.startsWith(item.href));
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                          isActive
                            ? "bg-signal-orange/10 text-signal-orange border border-signal-orange/20"
                            : "text-steel-gray hover:text-ice-white hover:bg-white/5 border border-transparent"
                        } ${collapsed ? "justify-center" : ""}`}
                        title={collapsed ? item.label : undefined}
                      >
                        <item.icon size={16} />
                        {!collapsed && <span>{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-3 border-t border-[var(--ghost-border)] space-y-2">
          {session?.user && !collapsed && (
            <div className="px-2.5 py-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-signal-orange/10 border border-signal-orange/20 flex items-center justify-center">
                  <User size={12} className="text-signal-orange" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ice-white truncate">{session.user.name || session.user.email}</p>
                  <p className="text-[10px] text-signal-orange">{session.user.role}</p>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-steel-gray hover:text-red-400 hover:bg-red-500/5 transition-colors w-full ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut size={14} />
            {!collapsed && <span>Sign Out</span>}
          </button>
          <Link
            href="/"
            className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-steel-gray hover:text-ice-white hover:bg-white/5 transition-colors ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <ChevronLeft size={14} />
            {!collapsed && <span>Back to site</span>}
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {session?.user?.mustRotatePassword && session.user.role === "admin" && (
          <div className="mx-6 mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
            Default seeded admin password is still active. Change it from Settings for production safety.
          </div>
        )}
        {children}
      </main>

      {/* Command palette overlay */}
      {cmdOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-[20vh]"
          onClick={() => setCmdOpen(false)}
        >
          <div
            className="glass-surface-strong w-full max-w-lg rounded-xl p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              autoFocus
              placeholder="Search studios, pages, actions..."
              className="w-full bg-transparent border-b border-[var(--ghost-border)] pb-3 text-sm text-ice-white placeholder:text-steel-gray focus:outline-none"
            />
            <div className="space-y-1">
              {visibleNavGroups.flatMap((g) => g.items).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setCmdOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-steel-gray hover:text-ice-white hover:bg-white/5 transition-colors"
                >
                  <item.icon size={14} />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
