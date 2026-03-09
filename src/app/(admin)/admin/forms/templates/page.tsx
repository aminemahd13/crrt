"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Users, Trophy, BookOpen, Handshake } from "lucide-react";

const templates = [
  {
    id: "training",
    title: "Training Registration",
    description: "Arduino / Raspberry Pi / embedded systems workshop registration.",
    icon: BookOpen,
    fields: [
      { label: "Full Name", type: "text", required: true },
      { label: "Email", type: "text", required: true },
      { label: "Student ID", type: "text", required: true },
      { label: "Year of Study", type: "select", required: true, options: "1A,2A,3A,4A,5A" },
      { label: "Prior Experience", type: "textarea", required: false },
    ],
  },
  {
    id: "competition",
    title: "Competition Registration",
    description: "Team-based robotics competition entry with member repeater.",
    icon: Trophy,
    fields: [
      { label: "Team Name", type: "text", required: true },
      { label: "Captain Name", type: "text", required: true },
      { label: "Captain Email", type: "text", required: true },
      { label: "Number of Members", type: "number", required: true },
      { label: "Team Members (names)", type: "textarea", required: true },
      { label: "Project Description", type: "textarea", required: true },
    ],
  },
  {
    id: "membership",
    title: "Membership Application",
    description: "New member intake form for CRRT.",
    icon: Users,
    fields: [
      { label: "Full Name", type: "text", required: true },
      { label: "Email", type: "text", required: true },
      { label: "Phone", type: "text", required: false },
      { label: "Student ID", type: "text", required: true },
      { label: "Filière", type: "text", required: true },
      { label: "Skills / Interests", type: "textarea", required: true },
      { label: "Why do you want to join CRRT?", type: "textarea", required: true },
    ],
  },
  {
    id: "sponsor",
    title: "Partner / Sponsor Intake",
    description: "Sponsorship proposal and partner onboarding.",
    icon: Handshake,
    fields: [
      { label: "Organization Name", type: "text", required: true },
      { label: "Contact Person", type: "text", required: true },
      { label: "Email", type: "text", required: true },
      { label: "Sponsorship Level", type: "select", required: true, options: "Platinum,Gold,Silver,Bronze" },
      { label: "Message", type: "textarea", required: false },
    ],
  },
];

export default function FormTemplatesPage() {
  const router = useRouter();

  const handleUseTemplate = async (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    const res = await fetch("/api/admin/forms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: template.title,
        fields: template.fields,
      }),
    });
    const form = await res.json();
    router.push(`/admin/forms/${form.id}`);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-ice-white">CRRT Form Templates</h1>
        <p className="text-sm text-steel-gray mt-1">
          Start from a pre-built template matching CRRT&apos;s real activity patterns.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => (
          <div key={template.id} className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-signal-orange/10 border border-signal-orange/20 flex items-center justify-center text-signal-orange">
                <template.icon size={18} />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-ice-white">{template.title}</h3>
                <p className="text-xs text-steel-gray">{template.fields.length} fields</p>
              </div>
            </div>
            <p className="text-sm text-steel-gray leading-relaxed">{template.description}</p>
            <div className="flex flex-wrap gap-1">
              {template.fields.map((f) => (
                <span
                  key={f.label}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--ghost-white)] border border-[var(--ghost-border)] text-steel-gray"
                >
                  {f.label}
                </span>
              ))}
            </div>
            <button
              onClick={() => handleUseTemplate(template.id)}
              className="inline-flex items-center gap-1.5 text-xs text-signal-orange hover:underline"
            >
              Use Template <ArrowRight size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
