"use client";

import { useState } from "react";
import { Send, Check, AlertCircle } from "lucide-react";

interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  placeholder: string | null;
  options: string[];
}

interface PublicFormClientProps {
  form: {
    id: string;
    title: string;
    fields: FormField[];
  };
}

export function PublicFormClient({ form }: PublicFormClientProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateValue = (fieldId: string, value: string) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side required validation
    for (const field of form.fields) {
      if (field.required && !values[field.id]?.trim()) {
        setError(`"${field.label}" is required.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/forms/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formId: form.id, data: values }),
      });

      if (!res.ok) throw new Error("Submission failed");
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <Check size={28} className="text-emerald-400" />
          </div>
          <h2 className="text-xl font-heading font-bold text-ice-white">Submitted!</h2>
          <p className="text-sm text-steel-gray max-w-sm mx-auto">
            Thank you for your response. We&apos;ll get back to you soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-16 px-4">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-signal-orange/10 border border-signal-orange/20 text-[10px] font-medium text-signal-orange uppercase tracking-wider mb-3">
            Registration Form
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-ice-white">{form.title}</h1>
          <p className="text-sm text-steel-gray">Fill out the form below. Fields marked with * are required.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {form.fields.map((field) => (
            <div key={field.id} className="glass-card p-5 space-y-2">
              <label className="text-xs font-medium text-ice-white">
                {field.label}
                {field.required && <span className="text-signal-orange ml-0.5">*</span>}
              </label>

              {field.type === "text" && (
                <input
                  type="text"
                  value={values[field.id] ?? ""}
                  onChange={(e) => updateValue(field.id, e.target.value)}
                  placeholder={field.placeholder ?? ""}
                  required={field.required}
                  className="w-full px-3 py-2.5 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white placeholder:text-steel-gray/50 focus:border-signal-orange/30 focus:outline-none transition-colors"
                />
              )}

              {field.type === "number" && (
                <input
                  type="number"
                  value={values[field.id] ?? ""}
                  onChange={(e) => updateValue(field.id, e.target.value)}
                  placeholder={field.placeholder ?? ""}
                  required={field.required}
                  className="w-full px-3 py-2.5 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white focus:border-signal-orange/30 focus:outline-none transition-colors"
                />
              )}

              {field.type === "textarea" && (
                <textarea
                  value={values[field.id] ?? ""}
                  onChange={(e) => updateValue(field.id, e.target.value)}
                  placeholder={field.placeholder ?? ""}
                  required={field.required}
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white placeholder:text-steel-gray/50 focus:border-signal-orange/30 focus:outline-none transition-colors resize-y"
                />
              )}

              {field.type === "select" && (
                <select
                  value={values[field.id] ?? ""}
                  onChange={(e) => updateValue(field.id, e.target.value)}
                  required={field.required}
                  className="w-full px-3 py-2.5 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white focus:border-signal-orange/30 focus:outline-none"
                >
                  <option value="">Select...</option>
                  {field.options.map((opt) => (
                    <option key={opt.trim()} value={opt.trim()}>
                      {opt.trim()}
                    </option>
                  ))}
                </select>
              )}

              {field.type === "checkbox" && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={values[field.id] === "true"}
                    onChange={(e) => updateValue(field.id, e.target.checked ? "true" : "false")}
                    className="accent-signal-orange w-4 h-4"
                  />
                  <span className="text-sm text-steel-gray">{field.placeholder || field.label}</span>
                </label>
              )}

              {field.type === "date" && (
                <input
                  type="date"
                  value={values[field.id] ?? ""}
                  onChange={(e) => updateValue(field.id, e.target.value)}
                  required={field.required}
                  className="w-full px-3 py-2.5 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white focus:border-signal-orange/30 focus:outline-none"
                />
              )}
            </div>
          ))}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-signal-orange text-white font-heading font-semibold text-sm hover:bg-[var(--signal-orange-hover)] transition-colors disabled:opacity-50"
          >
            <Send size={14} />
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}
