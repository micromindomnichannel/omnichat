// Gmail provider — PLACEHOLDER.
// Requires: Google Cloud OAuth consent (gmail.send/gmail.readonly), stored refresh
// token in the vault, and a Pub/Sub watch for inbound. None of that is configured,
// so every entry point below throws {code:'gmail_pending'}. The channel row,
// webhook route, and connect path already exist; this file is the seam to fill.

export function gmailPending(what = 'Gmail slice') {
  const err = new Error(`${what} requires Google OAuth + Pub/Sub watch (not configured)`);
  err.code = 'gmail_pending';
  err.status = 501;
  return err;
}

export function parseGmailPush() {
  throw gmailPending('Gmail inbound');
}

export async function sendGmail() {
  throw gmailPending('Gmail send');
}
