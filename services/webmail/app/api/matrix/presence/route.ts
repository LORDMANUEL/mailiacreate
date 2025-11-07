import { NextRequest, NextResponse } from "next/server";
import { fetchPresence } from "../../../../lib/matrix";

export async function GET(request: NextRequest) {
  const ids = request.nextUrl.searchParams.getAll("userId");
  if (ids.length === 0) {
    return NextResponse.json({ presences: [] });
  }
  try {
    const presences = await fetchPresence(ids);
    return NextResponse.json({ presences });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
