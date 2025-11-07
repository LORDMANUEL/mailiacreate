import { NextRequest, NextResponse } from "next/server";
import { listSignatures, saveSignatures } from "../../../lib/signatures";

export async function GET() {
  try {
    const signatures = await listSignatures();
    return NextResponse.json({ signatures });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  try {
    await saveSignatures(body.signatures ?? []);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
