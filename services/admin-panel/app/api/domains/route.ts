import { NextResponse } from 'next/server';
import { createDomain, listDomains } from '../../../lib/stalwart';

export async function GET() {
  const domains = await listDomains();
  return NextResponse.json(domains);
}

export async function POST(request: Request) {
  const payload = await request.json();
  const result = await createDomain(payload.name);
  return NextResponse.json(result);
}
