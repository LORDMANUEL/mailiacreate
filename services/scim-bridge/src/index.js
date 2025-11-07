import http from 'node:http';
import { URL } from 'node:url';
import * as Sentry from '@sentry/node';

const PORT = Number(process.env.SCIM_BRIDGE_PORT || 8089);
const HOST = process.env.SCIM_BRIDGE_HOST || '0.0.0.0';
const KEYCLOAK_BASE_URL = process.env.KEYCLOAK_BASE_URL || '';
const KEYCLOAK_REALM = process.env.KEYCLOAK_ADMIN_REALM || 'master';
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || '';
const KEYCLOAK_CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET || '';
const STALWART_ADMIN_URL = process.env.STALWART_ADMIN_URL || '';
const STALWART_ADMIN_USER = process.env.STALWART_ADMIN_USER || '';
const STALWART_ADMIN_PASSWORD = process.env.STALWART_ADMIN_PASSWORD || '';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1)
  });
}

const serverState = {
  lastSync: null,
  processed: 0,
  groupProcessed: 0,
  failures: 0
};

const groupCache = new Map();

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
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(error);
    }
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
  const groups = Array.isArray(scimBody.groups)
    ? scimBody.groups
        .map((entry) => entry.value || entry.display || entry)
        .filter(Boolean)
    : [];
  return {
    id: scimBody.id || null,
    username,
    localPart,
    domain: domainPart,
    email: primaryEmail ? primaryEmail.value : username,
    firstName: scimBody.name?.givenName || '',
    lastName: scimBody.name?.familyName || '',
    displayName: scimBody.displayName || `${scimBody.name?.givenName ?? ''} ${scimBody.name?.familyName ?? ''}`.trim(),
    active: scimBody.active !== false,
    groups
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
  const memberships = await fetchKeycloakUserGroups(current.id);
  for (const groupName of memberships) {
    const groupId = await ensureKeycloakGroup(groupName);
    if (groupId) {
      await keycloakRequest(`/users/${current.id}/groups/${groupId}`, { method: 'DELETE' }).catch(() => undefined);
    }
  }
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
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(error);
    }
    throw error;
  }
}

async function ensureKeycloakGroup(groupName) {
  if (!groupName) {
    return null;
  }
  if (groupCache.has(`kc:${groupName}`)) {
    return groupCache.get(`kc:${groupName}`);
  }
  const existing = await keycloakRequest(`/groups?search=${encodeURIComponent(groupName)}`);
  if (Array.isArray(existing)) {
    const match = existing.find((group) => group.path?.endsWith(groupName));
    if (match) {
      groupCache.set(`kc:${groupName}`, match.id);
      return match.id;
    }
  }
  const created = await keycloakRequest('/groups', {
    method: 'POST',
    body: JSON.stringify({
      name: groupName
    })
  });
  const refreshed = await keycloakRequest(`/groups?search=${encodeURIComponent(groupName)}`);
  const identifier = Array.isArray(refreshed) ? refreshed.find((group) => group.path?.endsWith(groupName)) : null;
  if (identifier?.id) {
    groupCache.set(`kc:${groupName}`, identifier.id);
    return identifier.id;
  }
  return created?.id || null;
}

async function ensureStalwartGroup(groupName, domain) {
  if (!groupName || !domain) {
    return;
  }
  const cacheKey = `stalwart:${groupName}@${domain}`;
  if (groupCache.has(cacheKey)) {
    return;
  }
  try {
    await stalwartRequest('/groups', {
      method: 'POST',
      body: JSON.stringify({
        name: groupName,
        domain,
        description: `${groupName} synced via SCIM`
      })
    });
    groupCache.set(cacheKey, true);
  } catch (error) {
    if (error.message.includes('409')) {
      groupCache.set(cacheKey, true);
      return;
    }
    throw error;
  }
}

async function fetchKeycloakUserGroups(userId) {
  const groups = await keycloakRequest(`/users/${userId}/groups`);
  if (!Array.isArray(groups)) {
    return [];
  }
  return groups.map((group) => group.name).filter(Boolean);
}

async function syncKeycloakMemberships(userId, groupNames) {
  if (!userId) {
    return;
  }
  const desired = new Set(groupNames);
  const current = await fetchKeycloakUserGroups(userId);
  for (const groupName of desired) {
    const groupId = await ensureKeycloakGroup(groupName);
    if (!groupId) {
      continue;
    }
    if (!current.includes(groupName)) {
      await keycloakRequest(`/users/${userId}/groups/${groupId}`, { method: 'PUT' });
    }
  }
  for (const existing of current) {
    if (!desired.has(existing)) {
      const groupId = await ensureKeycloakGroup(existing);
      if (groupId) {
        await keycloakRequest(`/users/${userId}/groups/${groupId}`, { method: 'DELETE' }).catch(() => undefined);
      }
    }
  }
}

async function syncStalwartMembership(user, groups) {
  if (!user.domain || !Array.isArray(groups)) {
    return;
  }
  for (const groupName of groups) {
    await ensureStalwartGroup(groupName, user.domain);
    await stalwartRequest(`/groups/${encodeURIComponent(`${groupName}@${user.domain}`)}/members`, {
      method: 'POST',
      body: JSON.stringify({ username: user.localPart })
    }).catch((error) => {
      if (!error.message.includes('409')) {
        throw error;
      }
    });
  }
}

async function pruneStalwartMembership(user, groups) {
  if (!user.domain) {
    return;
  }
  const desired = new Set(groups);
  const members = await stalwartRequest(
    `/groups?domain=${encodeURIComponent(user.domain)}&member=${encodeURIComponent(user.localPart)}`
  );
  if (!Array.isArray(members)) {
    return;
  }
  for (const entry of members) {
    const groupName = entry.name || entry.id || '';
    if (groupName && !desired.has(groupName)) {
      await stalwartRequest(`/groups/${encodeURIComponent(`${groupName}@${user.domain}`)}/members/${encodeURIComponent(user.localPart)}`, {
        method: 'DELETE'
      }).catch(() => undefined);
    }
  }
}

async function syncGroupsForUser(user, groups) {
  const uniqueGroups = Array.from(new Set(groups || [])).filter(Boolean);
  const userId = await ensureKeycloakUser(user);
  await syncKeycloakMemberships(userId, uniqueGroups);
  await syncStalwartMembership(user, uniqueGroups);
  await pruneStalwartMembership(user, uniqueGroups);
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
  const userId = await ensureKeycloakUser(user);
  await syncStalwartUser(user);
  if (user.groups?.length) {
    await syncGroupsForUser(user, user.groups);
  }
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
    if (operation.path?.toLowerCase() === 'active') {
      merged.active = operation.value !== false;
    }
  }
  const user = mapScimUser({ ...merged, userName: scimId });
  const userId = await ensureKeycloakUser(user);
  await syncStalwartUser(user);
  if (user.groups?.length) {
    await syncGroupsForUser(user, user.groups);
  } else {
    await syncKeycloakMemberships(userId, []);
    await pruneStalwartMembership(user, []);
  }
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

function mapScimGroup(scimBody) {
  if (!scimBody || typeof scimBody !== 'object') {
    throw new Error('Invalid SCIM group payload');
  }
  const name = scimBody.displayName || scimBody.id || scimBody.externalId;
  if (!name) {
    throw new Error('SCIM group missing displayName');
  }
  const members = Array.isArray(scimBody.members)
    ? scimBody.members.map((member) => member.value || member).filter(Boolean)
    : [];
  return { name, members };
}

async function handleScimGroupCreate(req, res) {
  const body = await readBody(req);
  const group = mapScimGroup(body);
  const domain = body?.meta?.attributes?.domain || process.env.SCIM_DEFAULT_DOMAIN || '';
  await ensureKeycloakGroup(group.name);
  await ensureStalwartGroup(group.name, domain);
  for (const member of group.members) {
    const user = mapScimUser({ userName: member });
    await syncGroupsForUser(user, [group.name]);
  }
  serverState.groupProcessed += 1;
  serverState.lastSync = new Date().toISOString();
  sendJson(res, 201, { id: group.name, status: 'group-created' });
}

async function handleScimGroupDelete(res, groupId) {
  const domain = process.env.SCIM_DEFAULT_DOMAIN || '';
  await keycloakRequest(`/groups/${encodeURIComponent(groupId)}`, { method: 'DELETE' }).catch(() => undefined);
  if (domain) {
    await stalwartRequest(`/groups/${encodeURIComponent(`${groupId}@${domain}`)}`, { method: 'DELETE' }).catch(() => undefined);
  }
  serverState.groupProcessed += 1;
  serverState.lastSync = new Date().toISOString();
  sendJson(res, 200, { id: groupId, status: 'group-removed' });
}

async function handleScimGroupPatch(req, res, groupId) {
  const body = await readBody(req);
  const operations = Array.isArray(body?.Operations) ? body.Operations : [];
  const members = new Set();
  for (const operation of operations) {
    if (operation.path?.toLowerCase() !== 'members') {
      continue;
    }
    const value = Array.isArray(operation.value) ? operation.value : [];
    for (const entry of value) {
      if (entry?.value) {
        members.add(entry.value);
      }
    }
  }
  const domain = process.env.SCIM_DEFAULT_DOMAIN || '';
  await ensureKeycloakGroup(groupId);
  if (domain) {
    await ensureStalwartGroup(groupId, domain);
  }
  for (const member of members) {
    const user = mapScimUser({ userName: member });
    await syncGroupsForUser(user, [groupId]);
  }
  serverState.groupProcessed += 1;
  serverState.lastSync = new Date().toISOString();
  sendJson(res, 200, { id: groupId, status: 'group-updated' });
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
    if (req.method === 'POST' && url.pathname === '/scim/v2/Groups') {
      await handleScimGroupCreate(req, res);
      return;
    }
    if (req.method === 'DELETE' && url.pathname.startsWith('/scim/v2/Groups/')) {
      const groupId = decodeURIComponent(url.pathname.replace('/scim/v2/Groups/', ''));
      await handleScimGroupDelete(res, groupId);
      return;
    }
    if (req.method === 'PATCH' && url.pathname.startsWith('/scim/v2/Groups/')) {
      const groupId = decodeURIComponent(url.pathname.replace('/scim/v2/Groups/', ''));
      await handleScimGroupPatch(req, res, groupId);
      return;
    }
    sendJson(res, 404, { error: 'Not found' });
  } catch (error) {
    serverState.failures += 1;
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(error);
    }
    sendJson(res, 400, { error: error.message || 'Unexpected error' });
  }
});

if (process.env.SENTRY_DSN) {
  process.on('unhandledRejection', (error) => {
    Sentry.captureException(error);
  });
  process.on('uncaughtException', (error) => {
    Sentry.captureException(error);
  });
}

server.on('error', (error) => {
  console.error('[scim-bridge] server error', error.message);
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error);
  }
});

server.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`SCIM bridge listening on ${HOST}:${PORT}`);
});
