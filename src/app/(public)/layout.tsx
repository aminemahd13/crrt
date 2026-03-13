import { GlassNav } from "@/components/layout/glass-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { getPublicNavigationConfig } from "@/lib/site-config";

export const revalidate = 120;

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigation = await getPublicNavigationConfig();

  return (
    <>
      <GlassNav links={navigation.header} />
      <main id="main-content" className="relative z-10 pt-20">
        {children}
      </main>
      <SiteFooter links={navigation.footer} />
    </>
  );
}
