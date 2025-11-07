import { NextResponse } from "next/server";
import { getEvents, getTasks } from "../../lib/nextcloud";

export async function GET() {
  try {
    const [events, tasks] = await Promise.all([getEvents(), getTasks()]);
    return NextResponse.json({ events, tasks });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
