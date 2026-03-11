import { prisma } from "@/lib/prisma";
import { Calendar, FolderOpen, FileText, Users, Ticket, UserCheck } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const [eventCount, projectCount, postCount, registrationCount, memberCount, userCount] =
    await Promise.all([
      prisma.event.count(),
      prisma.project.count(),
      prisma.post.count(),
      prisma.eventRegistration.count(),
      prisma.teamMember.count(),
      prisma.user.count(),
    ]);

  const stats = [
    { label: "Events", value: eventCount, icon: Calendar, color: "text-blue-400", href: "/admin/events" },
    { label: "Projects", value: projectCount, icon: FolderOpen, color: "text-emerald-400", href: "/admin/projects" },
    { label: "Posts", value: postCount, icon: FileText, color: "text-purple-400", href: "/admin/blog" },
    { label: "Registrations", value: registrationCount, icon: Ticket, color: "text-amber-400", href: "/admin/events" },
    { label: "Users", value: userCount, icon: UserCheck, color: "text-pink-400", href: "/admin/home" },
    { label: "Team", value: memberCount, icon: Users, color: "text-cyan-400", href: "/admin/home" },
  ];

  const recentEvents = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { _count: { select: { registrations: true } } },
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-heading font-bold text-ice-white">Dashboard</h1>
        <p className="text-sm text-steel-gray mt-1">Welcome to CRRT Studio.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="glass-card p-4 space-y-2 hover:bg-white/[0.03] transition-colors"
          >
            <div className="flex items-center justify-between">
              <stat.icon size={16} className={stat.color} />
            </div>
            <div className="text-2xl font-heading font-bold text-ice-white">{stat.value}</div>
            <div className="text-xs text-steel-gray">{stat.label}</div>
          </Link>
        ))}
      </div>

      {/* Recent Events */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-semibold text-ice-white">Recent Events</h2>
          <Link href="/admin/events" className="text-xs text-signal-orange hover:underline">
            View all
          </Link>
        </div>
        <div className="space-y-3">
          {recentEvents.map((event) => (
            <Link
              key={event.id}
              href={`/admin/events/${event.id}`}
              className="flex items-center justify-between py-2.5 px-3 -mx-3 rounded-lg border-b border-[var(--ghost-border)] last:border-0 hover:bg-white/[0.03] transition-colors"
            >
              <div>
                <p className="text-sm text-ice-white">{event.title}</p>
                <p className="text-xs text-steel-gray">
                  {new Date(event.startDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {" · "}
                  {event._count.registrations} registrations
                </p>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  event.published
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                }`}
              >
                {event.published ? "Published" : "Draft"}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
