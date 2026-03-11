"use client";

import Link from "next/link";
import { Github, Linkedin, Instagram, Mail } from "lucide-react";
import { appCopy } from "@/lib/copy";

const socialLinks = [
  { icon: Linkedin, href: "https://linkedin.com/company/crrt/", label: "LinkedIn" },
  { icon: Instagram, href: "https://instagram.com/club_robotique_crrt", label: "Instagram" },
  { icon: Github, href: "https://github.com/crrt-ensa", label: "GitHub" },
  { icon: Mail, href: "mailto:crrt@ensa-agadir.ac.ma", label: "Email" },
];

export function SiteFooter() {
  const messages = appCopy;

  const footerLinks = {
    about: [
      { label: messages.footer.missionLink, href: "/about" },
      { label: messages.footer.teamLink, href: "/about#team" },
      { label: messages.footer.timelineLink, href: "/about#timeline" },
    ],
    explore: [
      { label: messages.nav.events, href: "/events" },
      { label: messages.nav.projects, href: "/projects" },
      { label: messages.nav.blog, href: "/blog" },
    ],
    connect: [
      { label: messages.footer.contact, href: "mailto:crrt@ensa-agadir.ac.ma" },
      { label: "LinkedIn", href: "https://linkedin.com/company/crrt/" },
      { label: "Instagram", href: "https://instagram.com/club_robotique_crrt" },
    ],
  } as const;

  return (
    <footer className="relative mt-24 border-t border-[var(--ghost-border)]">
      <div className="pointer-events-none absolute inset-0 blueprint-grid opacity-40" />

      <div className="relative mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-signal-orange font-heading text-sm font-bold text-white">
                CR
              </div>
              <span className="font-heading text-lg font-semibold text-ice-white">CRRT</span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-steel-gray">
              {messages.footer.mission}
            </p>
            <div className="flex items-center gap-2 pt-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex size-9 items-center justify-center rounded-full border border-[var(--ghost-border)] bg-[var(--ghost-white)] text-steel-gray transition-all hover:border-signal-orange/30 hover:text-signal-orange"
                  aria-label={social.label}
                >
                  <social.icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="mb-4 font-heading text-sm font-semibold uppercase tracking-wider text-ice-white">
                {title === "about"
                  ? messages.footer.about
                  : title === "explore"
                    ? messages.footer.explore
                    : messages.footer.connect}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-steel-gray transition-colors hover:text-ice-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="section-divider mb-6 mt-12" />
        <div className="flex flex-col items-center justify-between gap-4 text-xs text-steel-gray sm:flex-row">
          <p>
            © {new Date().getFullYear()} CRRT - ENSA Agadir.{" "}
            {messages.footer.copyright}
          </p>
          <p className="font-heading italic opacity-60">
            &ldquo;{messages.footer.slogan}&rdquo;
          </p>
        </div>
      </div>
    </footer>
  );
}
