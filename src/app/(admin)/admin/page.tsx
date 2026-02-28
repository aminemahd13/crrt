import { prisma } from "@/lib/prisma";
import { Calendar, FolderOpen, FileText, Users, Inbox, FormInput } from "lucide-react";

export default async function AdminDashboard() {
  const [eventCount, projectCount, postCount, submissionCount, formCount, memberCount] =
    await Promise.all([
      prisma.event.count(),
      prisma.project.count(),
      prisma.post.count(),
      prisma.formSubmission.count(),
      prisma.form.count(),
      prisma.teamMember.count(),
    ]);

  const stats = [
    { label: "Events", value: eventCount, icon: Calendar, color: "text-blue-400" },
    { label: "Projects", value: projectCount, icon: FolderOpen, color: "text-emerald-400" },
    { label: "Posts", value: postCount, icon: FileText, color: "text-purple-400" },
    { label: "Forms", value: formCount, icon: FormInput, color: "text-amber-400" },
    { label: "Submissions", value: submissionCount, icon: Inbox, color: "text-pink-400" },
    { label: "Members", value: memberCount, icon: Users, color: "text-cyan-400" },
  ];

  const recentEvents = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
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
          <div
            key={stat.label}
            className="glass-card p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <stat.icon size={16} className={stat.color} />
            </div>
            <div className="text-2xl font-heading font-bold text-ice-white">{stat.value}</div>
            <div className="text-xs text-steel-gray">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Events */}
      <div className="glass-card p-6">
        <h2 className="font-heading font-semibold text-ice-white mb-4">Recent Events</h2>
        <div className="space-y-3">
          {recentEvents.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between py-2 border-b border-[var(--ghost-border)] last:border-0"
            >
              <div>
                <p className="text-sm text-ice-white">{event.title}</p>
                <p className="text-xs text-steel-gray">
                  {new Date(event.startDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
