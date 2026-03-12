import { prisma } from "@/lib/prisma";
import {
  Calendar,
  FolderOpen,
  FileText,
  Users,
  Ticket,
  UserCheck,
  Plus,
  ClipboardList,
  ArrowUpRight,
  Clock,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

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
    { label: "Events", value: eventCount, icon: Calendar, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", href: "/admin/events" },
    { label: "Projects", value: projectCount, icon: FolderOpen, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", href: "/admin/projects" },
    { label: "Posts", value: postCount, icon: FileText, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", href: "/admin/posts" },
    { label: "Registrations", value: registrationCount, icon: Ticket, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", href: "/admin/applications" },
    { label: "Users", value: userCount, icon: UserCheck, color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20", href: "/admin/settings" },
    { label: "Team", value: memberCount, icon: Users, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", href: "/admin/home" },
  ];

  const recentEvents = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { _count: { select: { registrations: true } } },
  });

  const upcomingEvents = await prisma.event.findMany({
    where: { published: true, startDate: { gte: new Date() } },
    orderBy: { startDate: "asc" },
    take: 3,
    include: { _count: { select: { registrations: true } } },
  });

  const recentRegistrations = await prisma.eventRegistration.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      user: { select: { name: true, email: true } },
      event: { select: { title: true } },
    },
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-ice-white">Dashboard</h1>
          <p className="text-sm text-steel-gray mt-1">Welcome to CRRT Studio.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline" className="border-[var(--ghost-border)] bg-transparent text-steel-gray hover:bg-white/5 hover:text-ice-white">
            <Link href="/admin/posts/new"><Plus size={14} /> New Post</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/admin/events/new"><Plus size={14} /> New Event</Link>
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="border-[var(--ghost-border)] bg-midnight-light/50 hover:bg-white/[0.03] transition-colors cursor-pointer py-0">
              <CardContent className="p-4 space-y-3">
                <div className={`inline-flex items-center justify-center size-8 rounded-lg ${stat.bg} border ${stat.border}`}>
                  <stat.icon size={14} className={stat.color} />
                </div>
                <div>
                  <p className="text-2xl font-heading font-bold text-ice-white">{stat.value}</p>
                  <p className="text-xs text-steel-gray">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Events */}
        <div className="lg:col-span-2">
          <Card className="border-[var(--ghost-border)] bg-midnight-light/50 py-0">
            <CardHeader className="flex flex-row items-center justify-between px-6 py-4 border-b border-[var(--ghost-border)]">
              <CardTitle className="font-heading text-base text-ice-white">Recent Events</CardTitle>
              <Link href="/admin/events" className="text-xs text-signal-orange hover:underline flex items-center gap-1">
                View all <ArrowUpRight size={12} />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-[var(--ghost-border)]">
                {recentEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/admin/events/${event.id}`}
                    className="flex items-center justify-between px-6 py-3.5 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ice-white truncate">{event.title}</p>
                      <p className="text-xs text-steel-gray mt-0.5">
                        {new Date(event.startDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        {" · "}
                        {event._count.registrations} registrations
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        event.published
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }
                    >
                      {event.published ? "Published" : "Draft"}
                    </Badge>
                  </Link>
                ))}
                {recentEvents.length === 0 && (
                  <div className="px-6 py-8 text-center text-sm text-steel-gray">No events yet.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions + Recent Registrations */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="border-[var(--ghost-border)] bg-midnight-light/50 py-0">
            <CardHeader className="px-6 py-4 border-b border-[var(--ghost-border)]">
              <CardTitle className="font-heading text-base text-ice-white flex items-center gap-2">
                <TrendingUp size={14} className="text-signal-orange" /> Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <Button asChild variant="ghost" className="w-full justify-start text-steel-gray hover:text-ice-white hover:bg-white/5">
                <Link href="/admin/events/new"><Calendar size={14} className="text-blue-400" /> Create Event</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-start text-steel-gray hover:text-ice-white hover:bg-white/5">
                <Link href="/admin/applications"><ClipboardList size={14} className="text-amber-400" /> Review Applications</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-start text-steel-gray hover:text-ice-white hover:bg-white/5">
                <Link href="/admin/posts/new"><FileText size={14} className="text-purple-400" /> Write a Post</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-start text-steel-gray hover:text-ice-white hover:bg-white/5">
                <Link href="/admin/projects/new"><FolderOpen size={14} className="text-emerald-400" /> New Project</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Registrations */}
          <Card className="border-[var(--ghost-border)] bg-midnight-light/50 py-0">
            <CardHeader className="px-6 py-4 border-b border-[var(--ghost-border)]">
              <CardTitle className="font-heading text-base text-ice-white flex items-center gap-2">
                <Clock size={14} className="text-signal-orange" /> Recent Registrations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-[var(--ghost-border)]">
                {recentRegistrations.map((reg) => (
                  <div key={reg.id} className="px-6 py-3">
                    <p className="text-sm text-ice-white truncate">{reg.user.name || reg.user.email}</p>
                    <p className="text-xs text-steel-gray mt-0.5 truncate">{reg.event.title}</p>
                  </div>
                ))}
                {recentRegistrations.length === 0 && (
                  <div className="px-6 py-6 text-center text-sm text-steel-gray">No registrations yet.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div>
          <h2 className="font-heading font-semibold text-ice-white mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-signal-orange" /> Upcoming Events
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingEvents.map((event) => {
              const daysUntil = Math.ceil((new Date(event.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              const fillPercent = event.capacity ? Math.round((event._count.registrations / event.capacity) * 100) : 0;

              return (
                <Link key={event.id} href={`/admin/events/${event.id}`}>
                  <Card className="border-[var(--ghost-border)] bg-midnight-light/50 hover:bg-white/[0.03] transition-colors cursor-pointer py-0">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                          {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil}d away`}
                        </Badge>
                        <span className="text-xs text-steel-gray">
                          {new Date(event.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <h3 className="font-heading font-semibold text-sm text-ice-white truncate">{event.title}</h3>
                      {event.capacity && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs text-steel-gray">
                            <span>{event._count.registrations} / {event.capacity} registered</span>
                            <span>{fillPercent}%</span>
                          </div>
                          <Progress value={fillPercent} className="h-1.5" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
