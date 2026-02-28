import { GlassNav } from "@/components/layout/glass-nav";
import { SiteFooter } from "@/components/layout/site-footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GlassNav />
      <main className="relative z-10 pt-20">{children}</main>
      <SiteFooter />
    </>
  );
}
