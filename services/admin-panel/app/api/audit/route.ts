import { NextResponse } from 'next/server';
import { listAudits } from '../../../lib/stalwart';

export async function GET() {
  const events = await listAudits();
  return NextResponse.json(events);
}
