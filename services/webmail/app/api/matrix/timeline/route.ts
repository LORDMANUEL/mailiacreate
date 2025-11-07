import { NextResponse } from "next/server";
import { fetchTimeline, sendAnnotation } from "../../../../lib/matrix";

export async function GET() {
  try {
    const timeline = await fetchTimeline();
    return NextResponse.json({ timeline });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { message } = await request.json();
  try {
    await sendAnnotation(message);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
