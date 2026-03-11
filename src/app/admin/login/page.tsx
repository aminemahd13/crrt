import { redirect } from "next/navigation";

function sanitizeCallback(value: string | undefined): string {
  if (!value || !value.startsWith("/")) return "/admin";
  if (value.startsWith("/admin/login")) return "/admin";
  return value;
}

export default async function AdminLoginAliasPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const target = sanitizeCallback(callbackUrl);
  redirect(`/login?callbackUrl=${encodeURIComponent(target)}`);
}
