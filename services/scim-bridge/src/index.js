import http from 'node:http';
import { URL } from 'node:url';

const PORT = Number(process.env.SCIM_BRIDGE_PORT || 8089);
const HOST = process.env.SCIM_BRIDGE_HOST || '0.0.0.0';
const KEYCLOAK_BASE_URL = process.env.KEYCLOAK_BASE_URL || '';
const KEYCLOAK_REALM = process.env.KEYCLOAK_ADMIN_REALM || 'master';
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || '';
const KEYCLOAK_CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET || '';
const STALWART_ADMIN_URL = process.env.STALWART_ADMIN_URL || '';
const STALWART_ADMIN_USER = process.env.STALWART_ADMIN_USER || '';
const STALWART_ADMIN_PASSWORD = process.env.STALWART_ADMIN_PASSWORD || '';

const serverState = {
  lastSync: null,
  processed: 0,
  failures: 0
};

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks).toString('utf8');
  if (!buffer) {
    return null;
  }
  try {
    return JSON.parse(buffer);
  } catch (error) {
    throw new Error('Invalid JSON payload');
  }
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  });
  res.end(payload);
}

async function fetchKeycloakToken() {
  if (!KEYCLOAK_BASE_URL || !KEYCLOAK_CLIENT_ID || !KEYCLOAK_CLIENT_SECRET) {
    throw new Error('Keycloak environment variables are missing');
  }
  const response = await fetch(
    `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: KEYCLOAK_CLIENT_ID,
        client_secret: KEYCLOAK_CLIENT_SECRET
      })
    }
  );
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Keycloak token request failed: ${response.status} ${detail}`);
  }
  const data = await response.json();
  return data.access_token;
}

async function keycloakRequest(path, init = {}) {
  const token = await fetchKeycloakToken();
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');
  const response = await fetch(`${KEYCLOAK_BASE_URL}/admin/realms/${KEYCLOAK_REALM}${path}`, {
    ...init,
    headers
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Keycloak request failed: ${response.status} ${detail}`);
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

async function stalwartRequest(path, init = {}) {
  if (!STALWART_ADMIN_URL || !STALWART_ADMIN_USER || !STALWART_ADMIN_PASSWORD) {
    throw new Error('Stalwart environment variables are missing');
  }
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  headers.set(
    'Authorization',
    `Basic ${Buffer.from(`${STALWART_ADMIN_USER}:${STALWART_ADMIN_PASSWORD}`).toString('base64')}`
  );
  const response = await fetch(`${STALWART_ADMIN_URL}${path}`, {
    ...init,
    headers
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Stalwart request failed: ${response.status} ${detail}`);
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

function mapScimUser(scimBody) {
  if (!scimBody || typeof scimBody !== 'object') {
    throw new Error('Invalid SCIM user payload');
  }
  const emails = Array.isArray(scimBody.emails) ? scimBody.emails : [];
  const primaryEmail = emails.find((entry) => entry.primary) || emails[0];
  const username = scimBody.userName || (primaryEmail ? primaryEmail.value : null);
  if (!username) {
    throw new Error('SCIM user missing userName');
  }
  const [localPart, domainPart = ''] = username.split('@');
  return {
    id: scimBody.id || null,
    username,
    localPart,
    domain: domainPart,
    email: primaryEmail ? primaryEmail.value : username,
    firstName: scimBody.name?.givenName || '',
    lastName: scimBody.name?.familyName || '',
    displayName: scimBody.displayName || `${scimBody.name?.givenName ?? ''} ${scimBody.name?.familyName ?? ''}`.trim(),
    active: scimBody.active !== false
  };
}

async function ensureKeycloakUser(user) {
  const existing = await keycloakRequest(`/users?username=${encodeURIComponent(user.username)}`);
  if (Array.isArray(existing) && existing.length > 0) {
    const current = existing[0];
    await keycloakRequest(`/users/${current.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        enabled: user.active
      })
    });
    return current.id;
  }
  const response = await keycloakRequest('/users', {
    method: 'POST',
    body: JSON.stringify({
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      enabled: user.active
    })
  });
  if (response && response.id) {
    return response.id;
  }
  const created = await keycloakRequest(`/users?username=${encodeURIComponent(user.username)}`);
  if (Array.isArray(created) && created[0]) {
    return created[0].id;
  }
  throw new Error('Unable to determine Keycloak user id');
}

async function disableKeycloakUser(username) {
  const existing = await keycloakRequest(`/users?username=${encodeURIComponent(username)}`);
  if (!Array.isArray(existing) || existing.length === 0) {
    return;
  }
  const current = existing[0];
  await keycloakRequest(`/users/${current.id}`, {
    method: 'PUT',
    body: JSON.stringify({ enabled: false })
  });
}

async function syncStalwartUser(user) {
  if (!user.domain) {
    return;
  }
  const payload = {
    username: user.localPart,
    displayName: user.displayName || user.localPart,
    domain: user.domain,
    quotaMb: Number(process.env.SCIM_DEFAULT_QUOTA_MB || 1024)
  };
  try {
    await stalwartRequest('/users', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } catch (error) {
    if (error.message.includes('409')) {
      await stalwartRequest(`/users/${encodeURIComponent(user.username)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: user.active ? 'active' : 'blocked' })
      });
      return;
    }
    throw error;
  }
}

async function removeStalwartUser(user) {
  if (!user.domain) {
    return;
  }
  await stalwartRequest(`/users/${encodeURIComponent(user.username)}`, {
    method: 'DELETE'
  });
}

async function handleScimCreate(req, res) {
  const body = await readBody(req);
  const user = mapScimUser(body);
  await ensureKeycloakUser(user);
  await syncStalwartUser(user);
  serverState.lastSync = new Date().toISOString();
  serverState.processed += 1;
  sendJson(res, 201, { id: user.username, status: 'created' });
}

async function handleScimPatch(req, res, scimId) {
  const body = await readBody(req);
  const patches = Array.isArray(body?.Operations) ? body.Operations : [];
  const merged = { id: scimId };
  for (const operation of patches) {
    if (operation.op?.toLowerCase() !== 'replace') {
      continue;
    }
    if (operation.value && typeof operation.value === 'object') {
      Object.assign(merged, operation.value);
    }
  }
  const user = mapScimUser({ ...merged, userName: scimId });
  await ensureKeycloakUser(user);
  await syncStalwartUser(user);
  serverState.lastSync = new Date().toISOString();
  serverState.processed += 1;
  sendJson(res, 200, { id: user.username, status: 'updated' });
}

async function handleScimDelete(res, scimId) {
  await disableKeycloakUser(scimId);
  await removeStalwartUser({ username: scimId, domain: scimId.split('@')[1] || '' });
  serverState.lastSync = new Date().toISOString();
  serverState.processed += 1;
  sendJson(res, 200, { id: scimId, status: 'deactivated' });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (req.method === 'GET' && url.pathname === '/healthz') {
      sendJson(res, 200, { status: 'ok', lastSync: serverState.lastSync, processed: serverState.processed });
      return;
    }
    if (req.method === 'POST' && url.pathname === '/scim/v2/Users') {
      await handleScimCreate(req, res);
      return;
    }
    if (req.method === 'PATCH' && url.pathname.startsWith('/scim/v2/Users/')) {
      const scimId = decodeURIComponent(url.pathname.replace('/scim/v2/Users/', ''));
      await handleScimPatch(req, res, scimId);
      return;
    }
    if (req.method === 'DELETE' && url.pathname.startsWith('/scim/v2/Users/')) {
      const scimId = decodeURIComponent(url.pathname.replace('/scim/v2/Users/', ''));
      await handleScimDelete(res, scimId);
      return;
    }
    sendJson(res, 404, { error: 'Not found' });
  } catch (error) {
    serverState.failures += 1;
    sendJson(res, 400, { error: error.message || 'Unexpected error' });
  }
});

server.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`SCIM bridge listening on ${HOST}:${PORT}`);
});
