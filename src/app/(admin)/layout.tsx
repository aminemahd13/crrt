import { StudioShell } from "@/components/admin/studio-shell";
import { requireAdminSession } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminSession();
  return <StudioShell>{children}</StudioShell>;
}
