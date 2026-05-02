interface EmailLayoutInput {
  preheader: string;
  title: string;
  subtitle: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
}

function baseEmailLayout(input: EmailLayoutInput): string {
  const ctaHtml = input.ctaLabel && input.ctaUrl
    ? `<p style="margin: 28px 0 0;">
        <a href="${input.ctaUrl}" style="display:inline-block;background:#f36523;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;">${input.ctaLabel}</a>
      </p>`
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${input.title}</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f5f4;font-family:Inter,Segoe UI,Arial,sans-serif;color:#18181b;">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${input.preheader}</span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #e4e4e7;border-radius:18px;overflow:hidden;">
            <tr>
              <td style="background:#111827;padding:22px 26px;">
                <p style="margin:0;color:#f3f4f6;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;">GadgetWizard</p>
                <p style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:700;line-height:1.25;">${input.title}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:26px;">
                <p style="margin:0 0 16px;color:#3f3f46;font-size:15px;line-height:1.65;">${input.subtitle}</p>
                ${input.bodyHtml}
                ${ctaHtml}
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid #e4e4e7;padding:18px 26px;background:#fafafa;">
                <p style="margin:0;color:#71717a;font-size:12px;line-height:1.6;">
                  ${input.footerNote ?? "If you did not request this action, you can ignore this email safely."}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderAdminWelcomeEmail(input: {
  name: string;
  email: string;
  password: string;
  loginUrl: string;
}): string {
  return baseEmailLayout({
    preheader: "Your admin account is ready. Use your temporary password to sign in.",
    title: "Your Admin Access Is Ready",
    subtitle: `Hello ${input.name}, your GadgetWizard admin account has been created.`,
    bodyHtml: `
      <div style="border:1px solid #e4e4e7;border-radius:14px;padding:14px 16px;background:#fff7ed;">
        <p style="margin:0 0 8px;color:#7c2d12;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;">Temporary Credentials</p>
        <p style="margin:0;color:#1f2937;font-size:14px;line-height:1.7;"><strong>Email:</strong> ${input.email}</p>
        <p style="margin:6px 0 0;color:#1f2937;font-size:14px;line-height:1.7;"><strong>Password:</strong> ${input.password}</p>
      </div>
      <p style="margin:14px 0 0;color:#3f3f46;font-size:14px;line-height:1.7;">After login, reset your password immediately from the password reset flow for better security.</p>
    `,
    ctaLabel: "Open Login",
    ctaUrl: input.loginUrl,
    footerNote: "This temporary password was generated securely. For safety, do not share it over chat or screenshots.",
  });
}

export function renderPasswordResetEmail(input: {
  name: string;
  resetUrl: string;
  expiresInMinutes: number;
}): string {
  return baseEmailLayout({
    preheader: "Reset your GadgetWizard password securely.",
    title: "Password Reset Verification",
    subtitle: `Hello ${input.name}, we received a request to reset your password.`,
    bodyHtml: `
      <p style="margin:0;color:#3f3f46;font-size:14px;line-height:1.7;">Click the secure button below to verify your email and set a new password.</p>
      <p style="margin:12px 0 0;color:#3f3f46;font-size:14px;line-height:1.7;">This link expires in <strong>${input.expiresInMinutes} minutes</strong> and can only be used once.</p>
    `,
    ctaLabel: "Reset Password",
    ctaUrl: input.resetUrl,
  });
}

export function renderNewsletterCampaignEmail(input: {
  subject: string;
  preheader?: string;
  bodyHtml: string;
}): string {
  const trimmedPreheader = input.preheader?.trim();

  return baseEmailLayout({
    preheader: trimmedPreheader || `Latest update: ${input.subject}`,
    title: input.subject,
    subtitle: "Curated updates and exclusive product highlights from GadgetWizard.",
    bodyHtml: `
      <div style="border:1px solid #fed7aa;border-radius:14px;padding:14px 16px;background:#fff7ed;">
        <p style="margin:0;color:#9a3412;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;">Newsletter</p>
        <p style="margin:8px 0 0;color:#7c2d12;font-size:13px;line-height:1.7;">Premium picks, price drops, and launches selected for GadgetWizard subscribers.</p>
      </div>

      <div style="margin-top:16px;border:1px solid #e4e4e7;border-radius:14px;padding:18px;background:#ffffff;">
        <div style="color:#18181b;font-size:14px;line-height:1.75;">${input.bodyHtml}</div>
      </div>
    `,
    footerNote: "You are receiving this email because you subscribed to GadgetWizard newsletter updates.",
  });
}

export function renderOrderPartialFulfillmentEmail(input: {
  name: string;
  orderId: number;
  refundAmount: number;
  items: Array<{
    productName: string;
    deliveredQuantity: number;
    refundedQuantity: number;
    refundTotal: number;
  }>;
  orderUrl?: string;
}): string {
  const itemRows = input.items.map((item) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #e4e4e7;color:#18181b;font-size:14px;">${item.productName}</td>
      <td style="padding:10px 0;border-bottom:1px solid #e4e4e7;color:#3f3f46;font-size:13px;text-align:center;">${item.deliveredQuantity}</td>
      <td style="padding:10px 0;border-bottom:1px solid #e4e4e7;color:#3f3f46;font-size:13px;text-align:center;">${item.refundedQuantity}</td>
      <td style="padding:10px 0;border-bottom:1px solid #e4e4e7;color:#111827;font-size:13px;text-align:right;">A$${item.refundTotal.toFixed(2)}</td>
    </tr>
  `).join("");

  const tableHtml = input.items.length > 0
    ? `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-top:16px;">
        <thead>
          <tr>
            <th align="left" style="padding:6px 0;border-bottom:1px solid #e4e4e7;color:#52525b;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;">Item</th>
            <th align="center" style="padding:6px 10px;border-bottom:1px solid #e4e4e7;color:#52525b;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;">Delivered</th>
            <th align="center" style="padding:6px 10px;border-bottom:1px solid #e4e4e7;color:#52525b;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;">Refunded</th>
            <th align="right" style="padding:6px 0;border-bottom:1px solid #e4e4e7;color:#52525b;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;">Refund</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
    `
    : "";

  return baseEmailLayout({
    preheader: `We've issued a partial refund for order #${input.orderId}.`,
    title: "Partial Refund Processed",
    subtitle: `Hello ${input.name}, we're sorry that we could only fulfill part of your order.`,
    bodyHtml: `
      <p style="margin:0;color:#3f3f46;font-size:14px;line-height:1.7;">
        We have processed a refund for the unavailable items. The delivered items are on the way, and the refund will appear on your original payment method.
      </p>
      <div style="margin:16px 0 0;border:1px solid #fde68a;border-radius:14px;padding:14px 16px;background:#fffbeb;">
        <p style="margin:0 0 6px;color:#92400e;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;">Refund total</p>
        <p style="margin:0;color:#111827;font-size:20px;font-weight:700;">A$${input.refundAmount.toFixed(2)}</p>
      </div>
      ${tableHtml}
      <p style="margin:16px 0 0;color:#3f3f46;font-size:14px;line-height:1.7;">
        We apologize for the inconvenience, and thank you for your understanding.
      </p>
    `,
    ctaLabel: input.orderUrl ? "View Order" : undefined,
    ctaUrl: input.orderUrl,
    footerNote: "If you have any questions, reply to this email and our team will help right away.",
  });
}
