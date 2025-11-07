import { NextResponse } from 'next/server';
import { queryLoki } from '../../../lib/clients';

export async function GET() {
  const logs = await queryLoki();
  return NextResponse.json(logs);
}
