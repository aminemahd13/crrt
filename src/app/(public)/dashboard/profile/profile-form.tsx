"use client";

import { motion } from "framer-motion";
import { Check, Save } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface ProfileData {
  name: string | null;
  email: string | null;
  emailVerified: Date | null;
  phone: string | null;
  bio: string | null;
  organization: string | null;
  city: string | null;
}

const profileSchema = z.object({
  name: z.string().trim().max(120).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  bio: z.string().trim().max(600).optional().or(z.literal("")),
  organization: z.string().trim().max(120).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
});

type ProfileValues = z.infer<typeof profileSchema>;

export function ProfileForm({ initialData }: { initialData: ProfileData }) {
  const [newEmail, setNewEmail] = useState("");
  const [emailActionBusy, setEmailActionBusy] = useState<"change" | "resend" | null>(null);
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initialData.name ?? "",
      phone: initialData.phone ?? "",
      bio: initialData.bio ?? "",
      organization: initialData.organization ?? "",
      city: initialData.city ?? "",
    },
  });

  const handleSave = async (values: ProfileValues) => {
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        toast.error(payload.error ?? "Failed to update profile.");
        return;
      }

      toast.success("Profile updated.");
      form.reset(values);
    } catch {
      toast.error("Failed to update profile.");
    }
  };

  const requestEmailChange = async () => {
    const candidate = newEmail.trim().toLowerCase();
    if (!candidate) {
      toast.error("Please enter your new email.");
      return;
    }

    setEmailActionBusy("change");
    try {
      const response = await fetch("/api/user/email-change/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: candidate }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        toast.error(payload.error ?? "Unable to request email change.");
        return;
      }

      toast.success("Verification sent to your new email address.");
      setNewEmail("");
    } catch {
      toast.error("Unable to request email change.");
    } finally {
      setEmailActionBusy(null);
    }
  };

  const resendVerification = async () => {
    setEmailActionBusy("resend");
    try {
      const response = await fetch("/api/user/email-verification/request", {
        method: "POST",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        toast.error(payload.error ?? "Unable to resend verification.");
        return;
      }

      toast.success("Verification email sent.");
    } catch {
      toast.error("Unable to resend verification.");
    } finally {
      setEmailActionBusy(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-ice-white">Profile</h1>
        <Button
          onClick={form.handleSubmit(handleSave)}
          disabled={form.formState.isSubmitting}
          className="inline-flex items-center gap-1.5"
        >
          {form.formState.isSubmitSuccessful ? <Check size={14} /> : <Save size={14} />}
          {form.formState.isSubmitting
            ? "Saving..."
            : form.formState.isSubmitSuccessful
              ? "Saved"
              : "Save"}
        </Button>
      </div>

      <motion.div
        className="glass-card space-y-5 border-[var(--ghost-border)] p-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-wider text-steel-gray">
            Email
          </label>
          <Input
            type="email"
            value={initialData.email ?? ""}
            disabled
            className="cursor-not-allowed border-[var(--ghost-border)] bg-midnight text-steel-gray"
          />

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Input
              type="email"
              value={newEmail}
              onChange={(event) => setNewEmail(event.target.value)}
              placeholder="new-email@example.com"
              className="border-[var(--ghost-border)] bg-midnight text-ice-white placeholder:text-steel-gray/40"
            />
            <Button
              type="button"
              onClick={requestEmailChange}
              disabled={emailActionBusy !== null}
              variant="outline"
              className="border-[var(--ghost-border)]"
            >
              {emailActionBusy === "change" ? "Sending..." : "Send verification to new email"}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-steel-gray/80">
            <span>
              Status: {initialData.emailVerified ? "Verified" : "Not verified"}
            </span>
            {!initialData.emailVerified ? (
              <Button
                type="button"
                onClick={resendVerification}
                disabled={emailActionBusy !== null}
                variant="link"
                className="h-auto p-0 text-[11px] text-signal-orange"
              >
                {emailActionBusy === "resend" ? "Sending..." : "Resend verification"}
              </Button>
            ) : null}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-5" noValidate>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Your name"
                      className="border-[var(--ghost-border)] bg-midnight text-ice-white placeholder:text-steel-gray/40"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="tel"
                      placeholder="+212 6XX XXX XXX"
                      className="border-[var(--ghost-border)] bg-midnight text-ice-white placeholder:text-steel-gray/40"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="organization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="University, company, or club"
                      className="border-[var(--ghost-border)] bg-midnight text-ice-white placeholder:text-steel-gray/40"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Your city"
                      className="border-[var(--ghost-border)] bg-midnight text-ice-white placeholder:text-steel-gray/40"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="Tell us a bit about yourself..."
                      className="border-[var(--ghost-border)] bg-midnight text-ice-white placeholder:text-steel-gray/40"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </motion.div>
    </div>
  );
}
