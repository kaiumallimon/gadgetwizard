import { HttpError, badRequest } from "@/lib/server/core/errors";
import { renderNewsletterCampaignEmail } from "@/lib/server/mail/templates";
import { assertSmtpConfigured, sendSmtpMail } from "@/lib/server/mail/smtp";
import {
  countActiveNewsletterSubscribers,
  listActiveNewsletterSubscribers,
  upsertNewsletterSubscriber,
} from "@/lib/server/repositories/newsletter-repository";

const NEWSLETTER_SEND_BATCH_SIZE = 4;

function errorCode(error: unknown): string | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code.toUpperCase() : null;
}

function safeErrorText(error: unknown): string {
  return error instanceof Error && error.message.trim().length > 0
    ? error.message.trim()
    : "Unknown SMTP delivery failure";
}

function isDnsTimeoutError(error: unknown): boolean {
  const code = errorCode(error);
  if (code === "EDNS" || code === "ETIMEOUT") {
    return true;
  }

  if (!error || typeof error !== "object") {
    return false;
  }

  const syscall = (error as { syscall?: unknown }).syscall;
  return typeof syscall === "string" && syscall.toLowerCase() === "querya";
}

function isSmtpCredentialError(error: unknown): boolean {
  const code = errorCode(error);
  return code === "EAUTH";
}

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
  let dnsTimeoutFailures = 0;
  let credentialFailures = 0;
  let firstFailure: unknown = null;

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
        if (!firstFailure) {
          firstFailure = error;
        }

        if (isDnsTimeoutError(error)) {
          dnsTimeoutFailures += 1;
        }

        if (isSmtpCredentialError(error)) {
          credentialFailures += 1;
        }

        console.error("Newsletter delivery failed", {
          email: subscriber.email,
          code: errorCode(error),
          message: safeErrorText(error),
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
    if (dnsTimeoutFailures === subscribers.length) {
      throw new HttpError(
        503,
        "SMTP DNS lookup timed out. Check server DNS/network access to your SMTP host and retry.",
        "SMTP_DNS_TIMEOUT",
      );
    }

    if (credentialFailures === subscribers.length) {
      throw new HttpError(
        502,
        "SMTP authentication failed. Verify SMTP username/password (or app password) and retry.",
        "SMTP_AUTH_FAILED",
      );
    }

    throw new HttpError(
      502,
      `Unable to send newsletter. Delivery failed for all subscribers. First error: ${safeErrorText(firstFailure)}`,
      "NEWSLETTER_DELIVERY_FAILED",
    );
  }

  return {
    totalSubscribers: subscribers.length,
    sentCount,
    failedCount,
  };
}
