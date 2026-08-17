import nodemailer, { type Transporter } from "nodemailer";

/**
 * Where contact-form submissions land. Overridable so staging can point
 * somewhere harmless, but the production inbox is the default.
 */
export const CONTACT_INBOX =
  process.env.CONTACT_TO_EMAIL || "sujonhasan171@gmail.com";

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

/**
 * Read lazily, never at module scope: `next build` imports every route module
 * to collect page data, so a throw here would break builds on machines that
 * have no SMTP credentials instead of failing the one request that needs them.
 */
function getSmtpConfig(): SmtpConfig | null {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!user || !pass) return null;

  const port = Number(process.env.SMTP_PORT || 465);

  return {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port,
    // 465 is implicit TLS; 587 upgrades via STARTTLS.
    secure: port === 465,
    user,
    pass,
    from: process.env.SMTP_FROM || user,
  };
}

export function isMailerConfigured(): boolean {
  return getSmtpConfig() !== null;
}

/**
 * Transports open a connection pool, so reuse one across warm invocations the
 * same way `connectDB` reuses its mongoose connection.
 */
declare global {
  var mailTransporter: Transporter | undefined;
}

function getTransporter(config: SmtpConfig): Transporter {
  if (!global.mailTransporter) {
    global.mailTransporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.user, pass: config.pass },
    });
  }
  return global.mailTransporter;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Header values are attacker-controlled (they come straight off a public
 * form), so strip anything that could inject an extra header line.
 */
function sanitizeHeaderValue(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim().slice(0, 200);
}

export interface ContactMessagePayload {
  name: string;
  email: string;
  subject: string;
  message: string;
  meta?: {
    submittedAt?: Date;
    ip?: string;
    userAgent?: string;
  };
}

function buildHtml({ name, email, subject, message, meta }: ContactMessagePayload) {
  const submittedAt = (meta?.submittedAt ?? new Date()).toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
  });

  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:10px 0;width:96px;vertical-align:top;color:#64748b;font-size:13px;">${label}</td>
      <td style="padding:10px 0;color:#0f172a;font-size:14px;font-weight:500;">${value}</td>
    </tr>`;

  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;">
      <tr>
        <td style="background:linear-gradient(100deg,#2563eb,#3b82f6);padding:22px 28px;">
          <p style="margin:0;color:#dbeafe;font-size:12px;letter-spacing:.09em;text-transform:uppercase;">Portfolio contact form</p>
          <h1 style="margin:6px 0 0;color:#ffffff;font-size:20px;font-weight:600;">New message from ${escapeHtml(name)}</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 28px 8px;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
            ${row("From", escapeHtml(name))}
            ${row("Email", `<a href="mailto:${escapeHtml(email)}" style="color:#2563eb;text-decoration:none;">${escapeHtml(email)}</a>`)}
            ${row("Subject", escapeHtml(subject))}
            ${row("Received", escapeHtml(submittedAt) + " (Dhaka)")}
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 28px 24px;">
          <p style="margin:0 0 8px;color:#64748b;font-size:13px;">Message</p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-left:3px solid #2563eb;border-radius:10px;padding:16px;color:#0f172a;font-size:14px;line-height:1.65;white-space:pre-wrap;">${escapeHtml(message)}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:0 28px 26px;">
          <a href="mailto:${escapeHtml(email)}?subject=${encodeURIComponent("Re: " + subject)}"
             style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:11px 22px;border-radius:999px;font-size:14px;font-weight:500;">
            Reply to ${escapeHtml(name)}
          </a>
          <p style="margin:14px 0 0;color:#94a3b8;font-size:12px;line-height:1.6;">
            Hitting reply in your mail client also works &mdash; this email's reply-to is already set to ${escapeHtml(email)}.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildText({ name, email, subject, message }: ContactMessagePayload) {
  return [
    "New portfolio contact form message",
    "",
    `From:    ${name}`,
    `Email:   ${email}`,
    `Subject: ${subject}`,
    "",
    "Message:",
    message,
    "",
    "---",
    `Reply directly to this email to reach ${name}.`,
  ].join("\n");
}

/**
 * Delivers a contact submission to {@link CONTACT_INBOX}. `replyTo` is the
 * visitor's address, so hitting Reply in Gmail answers them directly while the
 * message itself is still sent from the site's own authenticated account.
 */
export async function sendContactEmail(payload: ContactMessagePayload) {
  const config = getSmtpConfig();
  if (!config) {
    throw new Error("SMTP is not configured (set SMTP_USER and SMTP_PASSWORD)");
  }

  const safeName = sanitizeHeaderValue(payload.name);
  const safeEmail = sanitizeHeaderValue(payload.email);
  const safeSubject = sanitizeHeaderValue(payload.subject);

  await getTransporter(config).sendMail({
    from: `"Portfolio Contact" <${config.from}>`,
    to: CONTACT_INBOX,
    replyTo: `"${safeName.replace(/"/g, "")}" <${safeEmail}>`,
    subject: `Portfolio: ${safeSubject}`,
    text: buildText(payload),
    html: buildHtml(payload),
  });
}

/**
 * Optional courtesy auto-reply to the visitor. Failing to send this must never
 * fail the submission, so callers treat its rejection as non-fatal.
 */
export async function sendContactAcknowledgement(payload: ContactMessagePayload) {
  const config = getSmtpConfig();
  if (!config) return;

  const safeName = sanitizeHeaderValue(payload.name);
  const safeEmail = sanitizeHeaderValue(payload.email);

  await getTransporter(config).sendMail({
    from: `"Sujon Hasan" <${config.from}>`,
    to: safeEmail,
    replyTo: CONTACT_INBOX,
    subject: "Thanks for reaching out",
    text: [
      `Hi ${safeName},`,
      "",
      "Thanks for getting in touch. Your message landed in my inbox and I'll",
      "get back to you within 24 hours.",
      "",
      "For reference, here's what you sent:",
      "",
      payload.message,
      "",
      "— Sujon Hasan",
    ].join("\n"),
    html: `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;">
      <tr><td style="background:linear-gradient(100deg,#2563eb,#3b82f6);padding:20px 28px;">
        <h1 style="margin:0;color:#ffffff;font-size:19px;font-weight:600;">Message received &#10003;</h1>
      </td></tr>
      <tr><td style="padding:24px 28px;color:#0f172a;font-size:14px;line-height:1.7;">
        <p style="margin:0 0 14px;">Hi ${escapeHtml(safeName)},</p>
        <p style="margin:0 0 14px;">Thanks for getting in touch. Your message landed in my inbox and I&rsquo;ll get back to you within 24 hours.</p>
        <p style="margin:0 0 8px;color:#64748b;font-size:13px;">For reference, here&rsquo;s what you sent:</p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-left:3px solid #2563eb;border-radius:10px;padding:14px;white-space:pre-wrap;font-size:14px;line-height:1.65;">${escapeHtml(payload.message)}</div>
        <p style="margin:18px 0 0;">&mdash; Sujon Hasan</p>
      </td></tr>
    </table>
  </body>
</html>`,
  });
}
