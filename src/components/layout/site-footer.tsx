import Link from "next/link";
import { Github, Linkedin, Instagram, Mail } from "lucide-react";

const footerLinks = {
  about: [
    { label: "Our Mission", href: "/about" },
    { label: "Team", href: "/about#team" },
    { label: "Timeline", href: "/about#timeline" },
  ],
  explore: [
    { label: "Events", href: "/events" },
    { label: "Projects", href: "/projects" },
    { label: "Blog", href: "/blog" },
  ],
  connect: [
    { label: "Contact Us", href: "mailto:crrt@ensa-agadir.ac.ma" },
    { label: "LinkedIn", href: "https://linkedin.com/company/crrt/" },
    { label: "Instagram", href: "https://instagram.com/club_robotique_crrt" },
  ],
};

const socialLinks = [
  { icon: Linkedin, href: "https://linkedin.com/company/crrt/", label: "LinkedIn" },
  { icon: Instagram, href: "https://instagram.com/club_robotique_crrt", label: "Instagram" },
  { icon: Github, href: "https://github.com/crrt-ensa", label: "GitHub" },
  { icon: Mail, href: "mailto:crrt@ensa-agadir.ac.ma", label: "Email" },
];

export function SiteFooter() {
  return (
    <footer className="relative border-t border-[var(--ghost-border)] mt-24">
      {/* Blueprint grid fade */}
      <div className="absolute inset-0 blueprint-grid opacity-40 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-signal-orange flex items-center justify-center font-heading font-bold text-sm text-white">
                CR
              </div>
              <span className="font-heading font-semibold text-lg text-ice-white">CRRT</span>
            </div>
            <p className="text-sm text-steel-gray leading-relaxed max-w-xs">
              Club Robotique & Recherche Technologique.
              Building the future at ENSA Agadir since 2008.
            </p>
            {/* Social pills */}
            <div className="flex items-center gap-2 pt-2">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--ghost-white)] border border-[var(--ghost-border)] text-steel-gray hover:text-signal-orange hover:border-signal-orange/30 transition-all"
                  aria-label={s.label}
                >
                  <s.icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-heading font-semibold text-ice-white text-sm uppercase tracking-wider mb-4">
                {title}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-steel-gray hover:text-ice-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="section-divider mt-12 mb-6" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-steel-gray">
          <p>© {new Date().getFullYear()} CRRT — ENSA Agadir. All rights reserved.</p>
          <p className="font-heading italic opacity-60">&ldquo;Our robots never sleep.&rdquo;</p>
        </div>
      </div>
    </footer>
  );
}
