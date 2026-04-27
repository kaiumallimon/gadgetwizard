"use client";

import { useMemo, useState } from "react";
import { MailCheck, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { apiClient } from "@/lib/client/api";
import type { NewsletterAdminSummary, NewsletterSendSummary } from "@/lib/client/types";
import { useAuthStore } from "@/lib/stores/auth-store";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface NewsletterManagerProps {
  initialSummary: NewsletterAdminSummary;
}

function plainTextFromHtml(value: string): string {
  return value
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function safeErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function NewsletterManager({ initialSummary }: NewsletterManagerProps) {
  const { token } = useAuthStore();

  const [subject, setSubject] = useState("Weekly Gadget Digest - Curated picks for you");
  const [preheader, setPreheader] = useState("Exclusive deals, fresh arrivals, and premium picks inside.");
  const [bodyHtml, setBodyHtml] = useState("<p>Start writing your premium newsletter content here...</p>");
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<NewsletterSendSummary | null>(null);

  const bodyTextLength = useMemo(() => plainTextFromHtml(bodyHtml).length, [bodyHtml]);

  async function uploadEditorImage(file: File): Promise<string> {
    const response = await apiClient.adminUploadCdnImage(file, token ?? undefined);
    return response.item.url;
  }

  async function sendNewsletter() {
    const normalizedSubject = subject.trim();
    const normalizedPreheader = preheader.trim();

    if (normalizedSubject.length < 3) {
      toast.error("Subject must be at least 3 characters.");
      return;
    }

    if (bodyTextLength < 20) {
      toast.error("Newsletter content must include at least 20 characters.");
      return;
    }

    const confirmed = window.confirm(
      `Send this newsletter to ${initialSummary.activeSubscribers} active subscribers?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setSending(true);

      const response = await apiClient.adminSendNewsletter(
        {
          subject: normalizedSubject,
          preheader: normalizedPreheader || undefined,
          bodyHtml,
        },
        token ?? undefined,
      );

      setLastResult(response.summary);

      if (response.summary.failedCount > 0) {
        toast.warning(
          `Newsletter sent to ${response.summary.sentCount}/${response.summary.totalSubscribers}. ${response.summary.failedCount} failed.`,
        );
      } else {
        toast.success(`Newsletter sent to ${response.summary.sentCount} subscribers.`);
      }
    } catch (error) {
      toast.error(safeErrorMessage(error, "Unable to send newsletter"));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Active Subscribers</CardTitle>
            <CardDescription>Current verified audience for this campaign.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-3">
              <p className="text-3xl font-semibold text-zinc-900">{initialSummary.activeSubscribers}</p>
              <Badge variant="outline" className="inline-flex items-center gap-1">
                <MailCheck className="h-3.5 w-3.5" /> Ready to send
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Campaign Quality</CardTitle>
            <CardDescription>Keep the subject clear and content polished for premium delivery.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-zinc-600">
            <p className="inline-flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-orange-500" />
              Body text length: {bodyTextLength} characters
            </p>
            {lastResult ? (
              <p>
                Last send: {lastResult.sentCount}/{lastResult.totalSubscribers} delivered
                {lastResult.failedCount > 0 ? `, ${lastResult.failedCount} failed.` : "."}
              </p>
            ) : (
              <p>No campaign sent in this session yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compose Newsletter</CardTitle>
          <CardDescription>
            Use the same rich editor as product descriptions to create a premium, image-rich campaign.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Email Subject</span>
              <Input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Campaign subject"
                maxLength={180}
                disabled={sending}
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Preheader (Optional)</span>
              <Input
                value={preheader}
                onChange={(event) => setPreheader(event.target.value)}
                placeholder="Short preview shown in inbox"
                maxLength={255}
                disabled={sending}
              />
            </label>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Newsletter Content</span>
            <RichTextEditor
              value={bodyHtml}
              onChange={setBodyHtml}
              onImageUpload={uploadEditorImage}
              placeholder="Write a premium campaign with headings, highlights, links, and visuals..."
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200 pt-3">
            <p className="text-xs text-zinc-500">
              Emails follow GadgetWizard brand colors and typography. Your rich text content defines the campaign body.
            </p>

            <Button type="button" onClick={sendNewsletter} disabled={sending || initialSummary.activeSubscribers === 0}>
              <Send className="h-4 w-4" /> {sending ? "Sending..." : "Send Newsletter"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
