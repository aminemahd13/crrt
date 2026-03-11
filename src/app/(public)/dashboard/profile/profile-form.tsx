"use client";

import { motion } from "framer-motion";
import { Check, Save } from "lucide-react";
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
          <p className="text-[10px] text-steel-gray/60">Email cannot be changed.</p>
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
