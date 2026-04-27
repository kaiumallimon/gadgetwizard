"use client";

import { type FormEvent, useState } from "react";
import { Mail, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { apiClient } from "@/lib/client/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function safeErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function NewsletterSubscribeForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      toast.error("Please enter your email address.");
      return;
    }

    try {
      setSubmitting(true);
      const result = await apiClient.subscribeNewsletter(normalizedEmail);
      setEmail("");
      toast.success(result.message);
    } catch (error) {
      toast.error(safeErrorMessage(error, "Unable to subscribe right now."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-orange-300">
        <Sparkles className="h-3.5 w-3.5" /> Newsletter
      </p>
      <p className="text-sm text-zinc-300">Get premium product drops and members-only offers in your inbox.</p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="your@email.com"
          className="h-10 border-zinc-700 bg-zinc-900/70 text-zinc-100 placeholder:text-zinc-500 gw-soft-border-dark"
          disabled={submitting}
          required
        />

        <Button type="submit" disabled={submitting} className="h-10 bg-[#f36523] text-white hover:bg-[#e95a17]">
          <Mail className="h-4 w-4" /> {submitting ? "Subscribing..." : "Subscribe"}
        </Button>
      </div>
    </form>
  );
}
