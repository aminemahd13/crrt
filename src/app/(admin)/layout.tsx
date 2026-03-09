import { StudioShell } from "@/components/admin/studio-shell";

export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StudioShell>{children}</StudioShell>;
}
