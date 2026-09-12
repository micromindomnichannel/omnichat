// Outbound email (signup OTP today; extend as needed).
// Transport comes from SMTP_* env (e.g. Gmail App Password). With no SMTP
// configured, sendMail logs in dev and reports delivered:false — callers must
// fall back to an explicit dev path (ALLOW_DEBUG_*), never silently pretend.
import nodemailer from 'nodemailer';

let transporter = null;
function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' }
        : undefined,
    });
  }
  return transporter;
}

export function mailConfigured() {
  return Boolean(process.env.SMTP_HOST);
}

export async function sendMail({ to, subject, text }) {
  const t = getTransporter();
  if (!t) {
    console.log(`[mailer] DEV-ONLY email to ${to} (${subject}): ${String(text).slice(0, 200)}`);
    return { delivered: false, devOnly: true };
  }
  await t.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, text });
  return { delivered: true };
}
