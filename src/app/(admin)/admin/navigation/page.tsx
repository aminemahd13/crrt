import { prisma } from "@/lib/prisma";
import { NavigationStudioClient } from "./nav-client";

export default async function NavigationStudioPage() {
  const navItems = await prisma.navItem.findMany({
    orderBy: { order: "asc" },
  });

  return <NavigationStudioClient navItems={navItems} />;
}
