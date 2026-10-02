// Meta OAuth helpers. The app secret and tokens stay backend-only.
const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v19.0';

function graphUrl(path, params = {}) {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  });
  return url;
}

async function graphJson(path, params = {}, accessToken) {
  const url = graphUrl(path, params);
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    const err = new Error(`Meta Graph ${path} -> ${data?.error?.message || `Graph ${res.status}`}`);
    err.status = res.status;
    err.code = data?.error?.code;
    throw err;
  }
  return data;
}

export async function subscribePage(pageId, pageAccessToken) {
  const url = graphUrl(`/${pageId}/subscribed_apps`);
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${pageAccessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscribed_fields: 'messages,messaging_postbacks' }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error || data.success === false) {
    const err = new Error(`Meta webhook subscription failed: ${data?.error?.message || `Graph ${res.status}`}`);
    err.status = res.status;
    err.code = data?.error?.code || 'meta_webhook_subscription_failed';
    throw err;
  }
  return data;
}

export function metaConfigured() {
  return Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET && (process.env.META_OAUTH_REDIRECT_URI || process.env.ORBIT_BACKEND_URL));
}

export function metaRedirectUri(channel) {
  return (channel === 'instagram' ? process.env.META_OAUTH_REDIRECT_URI_INSTAGRAM : process.env.META_OAUTH_REDIRECT_URI_MESSENGER) || process.env.META_OAUTH_REDIRECT_URI ||
    `${String(process.env.ORBIT_BACKEND_URL || '').replace(/\/$/, '')}/api/v1/channels/${channel}/oauth/callback`;
}

export function buildMetaAuthUrl({ channel, state }) {
  if (!metaConfigured()) return null;
  const scopes = process.env.META_OAUTH_SCOPES ||
    'pages_show_list,pages_read_engagement,pages_messaging,instagram_basic,instagram_manage_messages,business_management';
  return graphUrl('/dialog/oauth', {
    client_id: process.env.META_APP_ID,
    redirect_uri: metaRedirectUri(channel),
    state,
    response_type: 'code',
    scope: scopes,
  }).toString();
}

export async function exchangeMetaCode({ code, channel }) {
  if (!metaConfigured()) {
    const err = new Error('Meta OAuth is not configured: set META_APP_ID and META_APP_SECRET');
    err.code = 'meta_oauth_not_configured';
    err.status = 503;
    throw err;
  }
  const url = graphUrl('/oauth/access_token', {
    client_id: process.env.META_APP_ID,
    client_secret: process.env.META_APP_SECRET,
    redirect_uri: metaRedirectUri(channel),
    code,
  });
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error || !data.access_token) {
    const err = new Error(`Meta OAuth code exchange failed: ${data?.error?.message || `Graph ${res.status}`}`);
    err.status = res.status;
    err.code = data?.error?.code || 'meta_oauth_exchange_failed';
    throw err;
  }
  return data;
}

export async function discoverMetaAssets(userAccessToken) {
  const user = await graphJson('/me', { fields: 'id,name' }, userAccessToken);
  const pages = await graphJson('/me/accounts', {
    fields: 'id,name,username,access_token,instagram_business_account{id,username,name}',
    limit: 100,
  }, userAccessToken);
  const assets = [];
  for (const page of pages.data || []) {
    if (page.access_token) assets.push({
      channel: 'messenger', externalAccountId: page.id,
      displayName: page.name || page.id, username: page.username || null,
      pageAccessToken: page.access_token, pageId: page.id,
    });
    const ig = page.instagram_business_account;
    if (ig?.id && page.access_token) assets.push({
      channel: 'instagram', externalAccountId: ig.id,
      displayName: ig.name || ig.username || page.name || ig.id,
      username: ig.username || null, pageAccessToken: page.access_token,
      pageId: page.id, instagramBusinessId: ig.id,
    });
  }
  return { user, assets };
}

export { GRAPH_VERSION };
