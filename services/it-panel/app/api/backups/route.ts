import { NextResponse } from 'next/server';
import { fetchResticStatus } from '../../../lib/clients';

export async function GET() {
  const status = await fetchResticStatus();
  return NextResponse.json(status);
}
