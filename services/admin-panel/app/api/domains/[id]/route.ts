import { NextResponse } from 'next/server';
import { removeDomain } from '../../../../lib/stalwart';

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await removeDomain(params.id);
  return NextResponse.json({ ok: true });
}
