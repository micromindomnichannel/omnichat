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
      // Never let a provider/network stall hold an auth request open until the
      // platform proxy kills it and the UI reports a misleading cold start.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' }
        : undefined,
    });
  }
  return transporter;
}

export function mailConfigured() {
  return Boolean(process.env.RESEND_API_KEY || process.env.SMTP_HOST);
}

export async function sendMail({ to, subject, text }) {
  if (process.env.RESEND_API_KEY) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || process.env.SMTP_FROM,
          to: [to],
          subject,
          text,
        }),
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || `Resend HTTP ${response.status}`);
      }
      return { delivered: true, provider: 'resend' };
    } catch (err) {
      const message = err?.name === 'AbortError'
        ? 'Resend request timed out'
        : (err?.message || 'Resend delivery failed');
      console.error(`[mailer] Resend delivery failed: ${message}`);
      throw new Error(`Email delivery failed: ${message}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  const t = getTransporter();
  if (!t) {
    console.log(`[mailer] DEV-ONLY email to ${to} (${subject}): ${String(text).slice(0, 200)}`);
    return { delivered: false, devOnly: true };
  }
  try {
    await t.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, text });
    return { delivered: true };
  } catch (err) {
    const message = err?.message || 'SMTP delivery failed';
    console.error(`[mailer] SMTP delivery failed: ${message}`);
    throw new Error(`Email delivery failed: ${message}`);
  }
}
