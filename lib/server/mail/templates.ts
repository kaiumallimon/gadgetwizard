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
        <a href="${input.ctaUrl}" style="display:inline-block;background:#f37021;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;">${input.ctaLabel}</a>
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
