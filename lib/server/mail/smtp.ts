import nodemailer from "nodemailer";

import { badRequest } from "@/lib/server/core/errors";
import { getEnv } from "@/lib/server/core/env";

declare global {
  var __gadgetwizardMailTransporter: nodemailer.Transporter | undefined;
  var __gadgetwizardMailTransportVerifiedAt: number | undefined;
}

const SMTP_CONNECTION_TIMEOUT_MS = 10_000;
const SMTP_GREETING_TIMEOUT_MS = 10_000;
const SMTP_SOCKET_TIMEOUT_MS = 15_000;
const SMTP_DNS_TIMEOUT_MS = 8_000;
const SMTP_VERIFY_CACHE_TTL_MS = 60_000;

function getMailConfig() {
  const env = getEnv();

  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS || !env.SMTP_FROM_EMAIL) {
    throw badRequest("SMTP is not configured. Set SMTP_HOST, SMTP_USER (or SMTP_USERNAME), SMTP_PASS (or SMTP_PASSWORD), and SMTP_FROM_EMAIL.");
  }

  if (env.SMTP_PORT !== 465) {
    throw badRequest("SMTP_PORT must use secured port 465 for this project");
  }

  return {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: true,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    fromName: env.SMTP_FROM_NAME,
    fromEmail: env.SMTP_FROM_EMAIL,
  };
}

export function assertSmtpConfigured(): void {
  getMailConfig();
}

function getTransporter(): nodemailer.Transporter {
  if (globalThis.__gadgetwizardMailTransporter) {
    return globalThis.__gadgetwizardMailTransporter;
  }

  const config = getMailConfig();
  globalThis.__gadgetwizardMailTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
    connectionTimeout: SMTP_CONNECTION_TIMEOUT_MS,
    greetingTimeout: SMTP_GREETING_TIMEOUT_MS,
    socketTimeout: SMTP_SOCKET_TIMEOUT_MS,
    dnsTimeout: SMTP_DNS_TIMEOUT_MS,
  });

  return globalThis.__gadgetwizardMailTransporter;
}

export async function verifySmtpTransport(): Promise<void> {
  const lastVerifiedAt = globalThis.__gadgetwizardMailTransportVerifiedAt ?? 0;
  if (Date.now() - lastVerifiedAt < SMTP_VERIFY_CACHE_TTL_MS) {
    return;
  }

  const transporter = getTransporter();
  await transporter.verify();
  globalThis.__gadgetwizardMailTransportVerifiedAt = Date.now();
}

export async function sendSmtpMail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const config = getMailConfig();
  const transporter = getTransporter();

  await transporter.sendMail({
    from: `\"${config.fromName}\" <${config.fromEmail}>`,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
}
