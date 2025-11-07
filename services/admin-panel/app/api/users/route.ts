import { NextResponse } from 'next/server';
import { createUser, listUsers } from '../../../lib/stalwart';

export async function GET() {
  const users = await listUsers();
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const payload = await request.json();
  const result = await createUser(payload);
  return NextResponse.json(result);
}
