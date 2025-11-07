import { z } from "zod";

const matrixEnv = z.object({
  MATRIX_BASE_URL: z.string().url(),
  MATRIX_ACCESS_TOKEN: z.string(),
  MATRIX_ROOM_ID: z.string()
});

const matrixConfig = matrixEnv.safeParse({
  MATRIX_BASE_URL: process.env.WEBMAIL_MATRIX_BASE_URL || process.env.MATRIX_BASE_URL || "",
  MATRIX_ACCESS_TOKEN: process.env.WEBMAIL_MATRIX_ACCESS_TOKEN || process.env.MATRIX_ACCESS_TOKEN || "",
  MATRIX_ROOM_ID: process.env.WEBMAIL_MATRIX_ROOM_ID || process.env.MATRIX_ROOM_ID || ""
});

if (!matrixConfig.success) {
  console.warn("Configuración Matrix incompleta", matrixConfig.error.flatten());
}

export type Presence = {
  userId: string;
  displayName: string;
  status: "online" | "offline" | "unavailable";
  lastActiveAgo?: number;
};

export type TimelineEvent = {
  eventId: string;
  sender: string;
  body: string;
  timestamp: number;
};

export async function fetchPresence(userIds: string[]): Promise<Presence[]> {
  if (!matrixConfig.success) {
    return [];
  }
  const responses = await Promise.all(
    userIds.map(async (userId) => {
      const res = await fetch(
        `${matrixConfig.data.MATRIX_BASE_URL}/_matrix/client/v3/presence/${encodeURIComponent(userId)}/status`,
        {
          headers: {
            Authorization: `Bearer ${matrixConfig.data.MATRIX_ACCESS_TOKEN}`
          }
        }
      );
      if (!res.ok) return null;
      const json = await res.json();
      return {
        userId,
        displayName: json.status_msg || userId,
        status: json.presence || "offline",
        lastActiveAgo: json.last_active_ago
      } satisfies Presence;
    })
  );
  return responses.filter((item): item is Presence => Boolean(item));
}

export async function fetchTimeline(limit = 15): Promise<TimelineEvent[]> {
  if (!matrixConfig.success) {
    return [];
  }
  const res = await fetch(
    `${matrixConfig.data.MATRIX_BASE_URL}/_matrix/client/v3/rooms/${encodeURIComponent(matrixConfig.data.MATRIX_ROOM_ID)}/messages?dir=b&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${matrixConfig.data.MATRIX_ACCESS_TOKEN}`
      }
    }
  );
  if (!res.ok) {
    throw new Error(`Matrix timeline error ${res.status}`);
  }
  const data = await res.json();
  const chunk = data.chunk || [];
  return chunk
    .filter((event: any) => event.type === "m.room.message" && event.content?.body)
    .map(
      (event: any) => ({
        eventId: event.event_id,
        sender: event.sender,
        body: event.content.body,
        timestamp: event.origin_server_ts
      })
    )
    .reverse();
}

export async function sendAnnotation(message: string) {
  if (!matrixConfig.success) {
    throw new Error("Matrix no configurado");
  }
  const res = await fetch(
    `${matrixConfig.data.MATRIX_BASE_URL}/_matrix/client/v3/rooms/${encodeURIComponent(matrixConfig.data.MATRIX_ROOM_ID)}/send/m.room.message/${Date.now()}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${matrixConfig.data.MATRIX_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        msgtype: "m.text",
        body: message
      })
    }
  );
  if (!res.ok) {
    throw new Error(`No se pudo enviar la anotación (${res.status})`);
  }
}
