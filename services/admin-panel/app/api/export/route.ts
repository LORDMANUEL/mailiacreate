import { NextResponse } from 'next/server';
import { listExports, requestExport } from '../../../lib/stalwart';

export async function GET() {
  const jobs = await listExports();
  return NextResponse.json(jobs);
}

export async function POST(request: Request) {
  const payload = await request.json();
  const job = await requestExport(payload.userId);
  return NextResponse.json(job);
}
