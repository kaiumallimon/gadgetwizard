import nodemailer from "nodemailer";

import { badRequest } from "@/lib/server/core/errors";
import { getEnv } from "@/lib/server/core/env";

declare global {
  var __gadgetwizardMailTransporter: nodemailer.Transporter | undefined;
}

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
  });

  return globalThis.__gadgetwizardMailTransporter;
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
