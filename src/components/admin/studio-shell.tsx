"use client";

import { useEffect, useMemo, useState } from "react";
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
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { appCopy } from "@/lib/copy";

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
  const messages = appCopy;
  const [collapsed, setCollapsed] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState("");

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const flatItems = useMemo(
    () =>
      navGroups.flatMap((group) =>
        group.items.map((item) => ({ ...item, group: group.label }))
      ),
    []
  );

  const filteredItems = useMemo(() => {
    const needle = commandSearch.trim().toLowerCase();
    if (!needle) return flatItems;
    return flatItems.filter((item) =>
      `${item.label} ${item.href} ${item.group}`.toLowerCase().includes(needle)
    );
  }, [commandSearch, flatItems]);

  return (
    <div className="flex h-screen overflow-hidden bg-midnight">
      <aside
        className={`flex flex-col border-r border-[var(--ghost-border)] bg-midnight-light transition-all duration-200 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[var(--ghost-border)] px-4 py-4">
          <Link
            href="/admin"
            className={`flex items-center gap-2 ${collapsed ? "mx-auto" : ""}`}
            aria-label={messages.admin.studio}
          >
            <div className="flex size-7 items-center justify-center rounded-md bg-signal-orange font-heading text-xs font-bold text-white">
              CR
            </div>
            {!collapsed && (
              <span className="font-heading text-sm font-semibold text-ice-white">
                {messages.admin.studio}
              </span>
            )}
          </Link>
          {!collapsed && (
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={() => setCollapsed(true)}
              className="hidden text-steel-gray hover:text-ice-white md:inline-flex"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft />
            </Button>
          )}
          {collapsed && (
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={() => setCollapsed(false)}
              className="absolute left-[68px] top-4 hidden text-steel-gray hover:text-ice-white md:inline-flex"
              aria-label="Expand sidebar"
            >
              <ChevronRight />
            </Button>
          )}
        </div>

        {!collapsed && (
          <Button
            variant="outline"
            onClick={() => setCmdOpen(true)}
            className="mx-3 mt-3 justify-between border-[var(--ghost-border)] bg-[var(--ghost-white)] text-steel-gray hover:bg-white/5 hover:text-ice-white"
          >
            <span>{messages.admin.searchPlaceholder}</span>
            <CommandShortcut>Ctrl+K</CommandShortcut>
          </Button>
        )}

        <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-3">
          {navGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <h4 className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-steel-gray/60">
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
                        className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                          isActive
                            ? "border border-signal-orange/20 bg-signal-orange/10 text-signal-orange"
                            : "border border-transparent text-steel-gray hover:bg-white/5 hover:text-ice-white"
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

        <div className="space-y-2 border-t border-[var(--ghost-border)] p-3">
          {session?.user && !collapsed && (
            <div className="rounded-lg border border-[var(--ghost-border)] bg-[var(--ghost-white)] px-2.5 py-2">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-full border border-signal-orange/20 bg-signal-orange/10">
                  <User size={12} className="text-signal-orange" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-ice-white">
                    {session.user.name || session.user.email}
                  </p>
                  <p className="text-[10px] uppercase text-signal-orange">
                    {session.user.role}
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={() => signOut({ callbackUrl: "/login" })}
            variant="ghost"
            className={`w-full justify-start text-steel-gray hover:bg-red-500/5 hover:text-red-400 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut size={14} />
            {!collapsed && <span>{messages.admin.signOut}</span>}
          </Button>
          <Button
            asChild
            variant="ghost"
            className={`w-full justify-start text-steel-gray hover:bg-white/5 hover:text-ice-white ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <Link href="/">
              <ChevronLeft size={14} />
              {!collapsed && <span>{messages.admin.backToSite}</span>}
            </Link>
          </Button>
        </div>
      </aside>

      <main id="main-content" className="flex-1 overflow-y-auto">
        {session?.user?.mustRotatePassword && session.user.role === "admin" && (
          <div className="mx-6 mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
            {messages.admin.securityBanner}
          </div>
        )}
        {children}
      </main>

      <CommandDialog open={cmdOpen} onOpenChange={setCmdOpen}>
        <CommandInput
          autoFocus
          placeholder={messages.admin.searchPlaceholder}
          value={commandSearch}
          onChange={(event) => setCommandSearch(event.target.value)}
        />
        <CommandList>
          {filteredItems.length === 0 ? (
            <CommandEmpty>No matching pages.</CommandEmpty>
          ) : (
            <CommandGroup>
              {filteredItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    setCmdOpen(false);
                    setCommandSearch("");
                  }}
                >
                  <CommandItem className="flex w-full items-center gap-2">
                    <item.icon size={14} />
                    <span className="flex-1 text-left">{item.label}</span>
                    <CommandShortcut>{item.group}</CommandShortcut>
                  </CommandItem>
                </Link>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </div>
  );
}
