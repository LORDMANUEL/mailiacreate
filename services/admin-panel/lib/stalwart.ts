import { randomUUID } from 'crypto';
import { readData, writeData, type DomainRecord, type UserRecord, type AuditRecord, type ExportJob } from './data-store';

const baseUrl = process.env.STALWART_ADMIN_URL;
const adminUser = process.env.STALWART_ADMIN_USER;
const adminPassword = process.env.STALWART_ADMIN_PASSWORD;

async function callStalwart(path: string, init?: RequestInit) {
  if (!baseUrl || !adminUser || !adminPassword) {
    return null;
  }
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Authorization', `Basic ${Buffer.from(`${adminUser}:${adminPassword}`).toString('base64')}`);
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers
  });
  if (!response.ok) {
    throw new Error(`Stalwart request failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

export async function listDomains() {
  if (!baseUrl) {
    const data = await readData();
    return data.domains;
  }
  const result = await callStalwart('/domains');
  return result?.domains ?? [];
}

export async function createDomain(name: string) {
  if (!baseUrl) {
    const data = await readData();
    const record: DomainRecord = {
      id: randomUUID(),
      name,
      dkimSelector: 'mailiacreate',
      createdAt: new Date().toISOString()
    };
    data.domains.push(record);
    data.audits.unshift({
      id: randomUUID(),
      type: 'domain:create',
      actor: 'local-admin',
      message: `Dominio ${name} creado`,
      createdAt: record.createdAt
    });
    await writeData(data);
    return record;
  }
  return callStalwart('/domains', {
    method: 'POST',
    body: JSON.stringify({ name })
  });
}

export async function removeDomain(id: string) {
  if (!baseUrl) {
    const data = await readData();
    data.domains = data.domains.filter((domain) => domain.id !== id);
    data.users = data.users.filter((user) => user.domain !== id);
    data.audits.unshift({
      id: randomUUID(),
      type: 'domain:delete',
      actor: 'local-admin',
      message: `Dominio ${id} eliminado`,
      createdAt: new Date().toISOString()
    });
    await writeData(data);
    return;
  }
  await callStalwart(`/domains/${id}`, { method: 'DELETE' });
}

export async function listUsers() {
  if (!baseUrl) {
    const data = await readData();
    return data.users;
  }
  const result = await callStalwart('/users');
  return result?.users ?? [];
}

export async function createUser(payload: { username: string; displayName: string; domain: string; quotaMb: number }) {
  if (!baseUrl) {
    const data = await readData();
    const record: UserRecord = {
      id: randomUUID(),
      username: payload.username,
      displayName: payload.displayName,
      domain: payload.domain,
      quotaMb: payload.quotaMb,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    data.users.push(record);
    data.audits.unshift({
      id: randomUUID(),
      type: 'user:create',
      actor: 'local-admin',
      message: `Usuario ${payload.username}@${payload.domain} creado`,
      createdAt: record.createdAt
    });
    await writeData(data);
    return record;
  }
  return callStalwart('/users', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateUser(id: string, status: 'active' | 'blocked') {
  if (!baseUrl) {
    const data = await readData();
    const user = data.users.find((item) => item.id === id);
    if (!user) {
      throw new Error('User not found');
    }
    user.status = status;
    data.audits.unshift({
      id: randomUUID(),
      type: 'user:update',
      actor: 'local-admin',
      message: `Usuario ${user.username}@${user.domain} -> ${status}`,
      createdAt: new Date().toISOString()
    });
    await writeData(data);
    return user;
  }
  return callStalwart(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

export async function listAudits() {
  if (!baseUrl) {
    const data = await readData();
    return data.audits;
  }
  const result = await callStalwart('/audit');
  return result?.events ?? [];
}

export async function listExports() {
  if (!baseUrl) {
    const data = await readData();
    return data.exports;
  }
  const result = await callStalwart('/exports');
  return result?.jobs ?? [];
}

export async function requestExport(userId: string) {
  if (!baseUrl) {
    const data = await readData();
    const job: ExportJob = {
      id: randomUUID(),
      userId,
      status: 'completed',
      location: `/exports/${userId}-${Date.now()}.zip`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.exports.unshift(job);
    data.audits.unshift({
      id: randomUUID(),
      type: 'export:create',
      actor: 'local-admin',
      message: `Exportación de buzón para ${userId}`,
      createdAt: job.createdAt
    });
    await writeData(data);
    return job;
  }
  return callStalwart('/exports', {
    method: 'POST',
    body: JSON.stringify({ userId })
  });
}
