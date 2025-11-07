import { promises as fs } from 'fs';
import path from 'path';

export type DomainRecord = {
  id: string;
  name: string;
  dkimSelector: string;
  createdAt: string;
};

export type UserRecord = {
  id: string;
  username: string;
  displayName: string;
  domain: string;
  quotaMb: number;
  status: 'active' | 'blocked';
  createdAt: string;
};

export type AuditRecord = {
  id: string;
  type: string;
  actor: string;
  message: string;
  createdAt: string;
};

export type ExportJob = {
  id: string;
  userId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  location?: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminData = {
  domains: DomainRecord[];
  users: UserRecord[];
  audits: AuditRecord[];
  exports: ExportJob[];
};

const dataDir = path.join(process.cwd(), 'data');
const dataFile = path.join(dataDir, 'admin-data.json');

async function ensureSeed() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(dataFile);
  } catch {
    const seed: AdminData = {
      domains: [],
      users: [],
      audits: [],
      exports: []
    };
    await fs.writeFile(dataFile, JSON.stringify(seed, null, 2));
  }
}

export async function readData(): Promise<AdminData> {
  await ensureSeed();
  const raw = await fs.readFile(dataFile, 'utf-8');
  return JSON.parse(raw) as AdminData;
}

export async function writeData(data: AdminData) {
  await ensureSeed();
  await fs.writeFile(dataFile, JSON.stringify(data, null, 2));
}
