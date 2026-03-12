"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Menu } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { appCopy } from "@/lib/copy";

interface NavLink {
  label: string;
  href: string;
}

export function GlassNav({ links }: { links?: NavLink[] }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const messages = appCopy;
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin";
  const dashboardHref = isAdmin ? "/admin" : "/dashboard";
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 72);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = useMemo(() => {
    if (links) {
      return links;
    }
    return [
      { label: messages.nav.home, href: "/" },
      { label: messages.nav.events, href: "/events" },
      { label: messages.nav.projects, href: "/projects" },
      { label: messages.nav.resources, href: "/resources" },
      { label: messages.nav.blog, href: "/blog" },
      { label: messages.nav.about, href: "/about" },
    ];
  }, [links, messages.nav]);

  return (
    <header
      className={`fixed left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "top-3 mx-auto max-w-6xl rounded-2xl border border-[var(--ghost-border)] glass-surface-strong px-4 py-2"
          : "top-0 border-b border-transparent px-4 py-3"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="CRRT" width={32} height={32} unoptimized className="size-8 rounded-lg object-contain" />
          <span className="font-heading text-sm font-semibold text-ice-white">CRRT</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  isActive
                    ? "bg-signal-orange/10 text-signal-orange"
                    : "text-steel-gray hover:bg-white/5 hover:text-ice-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {status === "authenticated" ? (
            <Button asChild size="sm" className="rounded-full px-4">
              <Link href={dashboardHref}>{messages.nav.dashboard}</Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline" className="rounded-full border-[var(--ghost-border)] bg-transparent px-4 text-ice-white hover:bg-white/5">
              <Link href="/login">{messages.nav.login}</Link>
            </Button>
          )}
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              size="icon-sm"
              variant="ghost"
              className="text-ice-white md:hidden"
              aria-label="Toggle navigation"
            >
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="border-[var(--ghost-border)] bg-midnight p-0 text-ice-white"
          >
            <SheetHeader className="border-b border-[var(--ghost-border)] px-5 py-4">
              <SheetTitle className="font-heading text-ice-white">
                Navigation
              </SheetTitle>
            </SheetHeader>
            <div className="space-y-1 p-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                    pathname === link.href
                      ? "bg-signal-orange/10 text-signal-orange"
                      : "text-steel-gray hover:bg-white/5 hover:text-ice-white"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="space-y-3 border-t border-[var(--ghost-border)] p-4">
              {status === "authenticated" ? (
                <Button
                  asChild
                  className="w-full"
                  onClick={() => setMobileOpen(false)}
                >
                  <Link href={dashboardHref}>{messages.nav.dashboard}</Link>
                </Button>
              ) : (
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-[var(--ghost-border)] bg-transparent text-ice-white hover:bg-white/5"
                  onClick={() => setMobileOpen(false)}
                >
                  <Link href="/login">{messages.nav.login}</Link>
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
