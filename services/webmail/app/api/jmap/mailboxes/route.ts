import { NextResponse } from "next/server";
import { listMailboxes } from "../../../../lib/jmap";

export async function GET() {
  try {
    const mailboxes = await listMailboxes();
    return NextResponse.json({ mailboxes });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
