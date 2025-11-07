import { NextRequest, NextResponse } from "next/server";
import { getMessage, listMessages } from "../../../../lib/jmap";

export async function GET(request: NextRequest) {
  const mailboxId = request.nextUrl.searchParams.get("mailboxId");
  const messageId = request.nextUrl.searchParams.get("messageId");

  try {
    if (messageId) {
      const message = await getMessage(messageId);
      return NextResponse.json({ message });
    }
    if (!mailboxId) {
      return NextResponse.json({ error: "mailboxId requerido" }, { status: 400 });
    }
    const messages = await listMessages(mailboxId);
    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
