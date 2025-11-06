import { NextResponse } from 'next/server';
import { updateUser } from '../../../../lib/stalwart';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const payload = await request.json();
  const result = await updateUser(params.id, payload.status);
  return NextResponse.json(result);
}
