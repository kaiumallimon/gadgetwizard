import { badRequest } from "@/lib/server/core/errors";
import { renderNewsletterCampaignEmail } from "@/lib/server/mail/templates";
import { assertSmtpConfigured, sendSmtpMail } from "@/lib/server/mail/smtp";
import {
  countActiveNewsletterSubscribers,
  listActiveNewsletterSubscribers,
  upsertNewsletterSubscriber,
} from "@/lib/server/repositories/newsletter-repository";

const NEWSLETTER_SEND_BATCH_SIZE = 4;

function stripHtmlToText(value: string): string {
  return value
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeNewsletterHtml(value: string): string {
  return value
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/ on[a-z]+="[^"]*"/gi, "")
    .replace(/ on[a-z]+='[^']*'/gi, "");
}

function buildPlainTextBody(input: { subject: string; bodyHtml: string }): string {
  const bodyText = stripHtmlToText(input.bodyHtml);
  return [
    `GadgetWizard Newsletter: ${input.subject}`,
    "",
    bodyText,
    "",
    "You are receiving this email because you subscribed to GadgetWizard updates.",
  ].join("\n");
}

export async function subscribeNewsletter(input: { email: string }) {
  const normalizedEmail = input.email.trim().toLowerCase();
  const subscriber = await upsertNewsletterSubscriber(normalizedEmail);

  return {
    subscriber,
    message: "You have been subscribed to the GadgetWizard newsletter.",
  };
}

export async function getNewsletterAdminSummary() {
  const activeSubscribers = await countActiveNewsletterSubscribers();
  return {
    activeSubscribers,
  };
}

export async function sendNewsletterCampaignAdmin(input: {
  subject: string;
  preheader?: string;
  bodyHtml: string;
}) {
  assertSmtpConfigured();

  const subscribers = await listActiveNewsletterSubscribers();
  if (subscribers.length === 0) {
    throw badRequest("No active newsletter subscribers yet.");
  }

  const subject = input.subject.trim();
  const preheader = input.preheader?.trim();
  const sanitizedBodyHtml = sanitizeNewsletterHtml(input.bodyHtml.trim());
  const plainText = buildPlainTextBody({ subject, bodyHtml: sanitizedBodyHtml });

  let sentCount = 0;
  let failedCount = 0;

  for (let index = 0; index < subscribers.length; index += NEWSLETTER_SEND_BATCH_SIZE) {
    const batch = subscribers.slice(index, index + NEWSLETTER_SEND_BATCH_SIZE);

    const results = await Promise.all(batch.map(async (subscriber) => {
      try {
        await sendSmtpMail({
          to: subscriber.email,
          subject,
          html: renderNewsletterCampaignEmail({
            subject,
            preheader,
            bodyHtml: sanitizedBodyHtml,
          }),
          text: plainText,
        });

        return true;
      } catch (error) {
        console.error("Newsletter delivery failed", {
          email: subscriber.email,
          error,
        });
        return false;
      }
    }));

    for (const delivered of results) {
      if (delivered) {
        sentCount += 1;
      } else {
        failedCount += 1;
      }
    }
  }

  if (sentCount === 0) {
    throw badRequest("Unable to send newsletter. Delivery failed for all subscribers.");
  }

  return {
    totalSubscribers: subscribers.length,
    sentCount,
    failedCount,
  };
}
