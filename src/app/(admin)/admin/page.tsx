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
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  encodeRegistrationApplicationId,
  encodeSubmissionApplicationId,
} from "@/lib/application-id";

function formatDate(value: Date): string {
  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function AdminDashboard() {
  const now = new Date();
  const [
    eventCount,
    projectCount,
    postCount,
    registrationCount,
    memberCount,
    userCount,
    reviewQueueCount,
    recentEvents,
    upcomingEvents,
    recentRegistrations,
    pendingReviewRows,
  ] = await Promise.all([
    prisma.event.count(),
    prisma.project.count(),
    prisma.post.count(),
    prisma.eventRegistration.count(),
    prisma.teamMember.count(),
    prisma.user.count(),
    prisma.formSubmission.count({ where: { status: { in: ["new", "in_review"] } } }),
    prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { _count: { select: { registrations: true } } },
    }),
    prisma.event.findMany({
      where: { published: true, startDate: { gte: now } },
      orderBy: { startDate: "asc" },
      take: 3,
      include: { _count: { select: { registrations: true } } },
    }),
    prisma.eventRegistration.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: { select: { name: true, email: true } },
        event: { select: { title: true } },
      },
    }),
    prisma.formSubmission.findMany({
      where: { status: { in: ["new", "in_review"] } },
      orderBy: { createdAt: "asc" },
      take: 5,
      include: {
        form: {
          include: {
            event: { select: { id: true, title: true } },
          },
        },
        eventRegistration: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
    }),
  ]);

  const stats = [
    {
      label: "Events",
      value: eventCount,
      icon: Calendar,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      href: "/admin/events",
    },
    {
      label: "Projects",
      value: projectCount,
      icon: FolderOpen,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      href: "/admin/projects",
    },
    {
      label: "Posts",
      value: postCount,
      icon: FileText,
      color: "text-violet-300",
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
      href: "/admin/posts",
    },
    {
      label: "Registrations",
      value: registrationCount,
      icon: Ticket,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      href: "/admin/applications",
    },
    {
      label: "Review Queue",
      value: reviewQueueCount,
      icon: ClipboardList,
      color: "text-rose-300",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      href: "/admin/review-queue",
    },
    {
      label: "Users",
      value: userCount,
      icon: UserCheck,
      color: "text-pink-400",
      bg: "bg-pink-500/10",
      border: "border-pink-500/20",
      href: "/admin/settings",
    },
    {
      label: "Team",
      value: memberCount,
      icon: Users,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
      href: "/admin/about",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold text-ice-white">Dashboard</h1>
          <p className="mt-1 text-sm text-steel-gray">Metrics-first overview of CRRT admin activity.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            asChild
            size="sm"
            variant="outline"
            className="border-[var(--ghost-border)] bg-transparent text-steel-gray hover:bg-white/5 hover:text-ice-white"
          >
            <Link href="/admin/posts/new">
              <Plus size={14} /> New Post
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/admin/events/new">
              <Plus size={14} /> New Event
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-7">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="cursor-pointer border-[var(--ghost-border)] bg-midnight-light/50 py-0 transition-colors hover:bg-white/[0.03]">
              <CardContent className="space-y-3 p-4">
                <div className={`inline-flex size-8 items-center justify-center rounded-lg border ${stat.bg} ${stat.border}`}>
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="border-[var(--ghost-border)] bg-midnight-light/50 py-0">
            <CardHeader className="flex flex-row items-center justify-between border-b border-[var(--ghost-border)] px-6 py-4">
              <CardTitle className="font-heading text-base text-ice-white">Recent Events</CardTitle>
              <Link href="/admin/events" className="flex items-center gap-1 text-xs text-signal-orange hover:underline">
                View all <ArrowUpRight size={12} />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-[var(--ghost-border)]">
                {recentEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/admin/events/${event.id}`}
                    className="flex items-center justify-between px-6 py-3.5 transition-colors hover:bg-white/[0.02]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-ice-white">{event.title}</p>
                      <p className="mt-0.5 text-xs text-steel-gray">
                        {formatDate(event.startDate)} - {event._count.registrations} registrations
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        event.published
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                          : "border-amber-500/20 bg-amber-500/10 text-amber-400"
                      }
                    >
                      {event.published ? "Published" : "Draft"}
                    </Badge>
                  </Link>
                ))}
                {recentEvents.length === 0 ? (
                  <div className="px-6 py-8 text-center text-sm text-steel-gray">No events yet.</div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-[var(--ghost-border)] bg-midnight-light/50 py-0">
            <CardHeader className="flex flex-row items-center justify-between border-b border-[var(--ghost-border)] px-6 py-4">
              <CardTitle className="font-heading text-base text-ice-white">Review Queue</CardTitle>
              <Link href="/admin/review-queue" className="text-xs text-signal-orange hover:underline">
                Open queue
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-[var(--ghost-border)]">
                {pendingReviewRows.map((item) => {
                  const href = item.eventRegistrationId
                    ? `/admin/applications/${encodeRegistrationApplicationId(item.eventRegistrationId)}?returnTo=${encodeURIComponent("/admin/review-queue")}`
                    : `/admin/applications/${encodeSubmissionApplicationId(item.id)}?returnTo=${encodeURIComponent("/admin/review-queue")}`;
                  const applicant = item.eventRegistration?.user?.name
                    || item.eventRegistration?.user?.email
                    || "Unknown applicant";
                  return (
                    <Link
                      key={item.id}
                      href={href}
                      className="block px-6 py-3 transition-colors hover:bg-white/[0.02]"
                    >
                      <p className="text-sm text-ice-white">{applicant}</p>
                      <p className="text-xs text-steel-gray">{item.form.event?.title ?? "Unknown event"}</p>
                      <p className="mt-1 text-[11px] text-steel-gray">
                        {item.status === "in_review" ? "In Review" : "New"} since {formatDate(item.createdAt)}
                      </p>
                    </Link>
                  );
                })}
                {pendingReviewRows.length === 0 ? (
                  <div className="px-6 py-6 text-center text-sm text-steel-gray">Queue is clear.</div>
                ) : null}
              </div>
            </CardContent>
          </Card>

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
                {recentRegistrations.length === 0 ? (
                  <div className="px-6 py-6 text-center text-sm text-steel-gray">No registrations yet.</div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {upcomingEvents.length > 0 ? (
        <div>
          <h2 className="mb-4 flex items-center gap-2 font-heading font-semibold text-ice-white">
            <Calendar size={16} className="text-signal-orange" /> Upcoming Events
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {upcomingEvents.map((event) => {
              const daysUntil = Math.ceil(
                (new Date(event.startDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
              );
              const fillPercent = event.capacity
                ? Math.round((event._count.registrations / event.capacity) * 100)
                : 0;

              return (
                <Link key={event.id} href={`/admin/events/${event.id}`}>
                  <Card className="cursor-pointer border-[var(--ghost-border)] bg-midnight-light/50 py-0 transition-colors hover:bg-white/[0.03]">
                    <CardContent className="space-y-3 p-5">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="border-blue-500/20 bg-blue-500/10 text-blue-400">
                          {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil}d away`}
                        </Badge>
                        <span className="text-xs text-steel-gray">
                          {new Date(event.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <h3 className="truncate text-sm font-heading font-semibold text-ice-white">{event.title}</h3>
                      {event.capacity ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs text-steel-gray">
                            <span>
                              {event._count.registrations} / {event.capacity} registered
                            </span>
                            <span>{fillPercent}%</span>
                          </div>
                          <Progress value={fillPercent} className="h-1.5" />
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
