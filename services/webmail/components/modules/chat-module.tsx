"use client";

import useSWR from "swr";
import { TimelineEvent } from "../../lib/matrix";
import { useState } from "react";
import { sendToast } from "../shared/toaster";

export function ChatModule() {
  const { data, mutate } = useSWR<{ timeline: TimelineEvent[] }>("/api/matrix/timeline", {
    refreshInterval: 15_000
  });
  const [draft, setDraft] = useState("");

  async function handleSend() {
    if (!draft.trim()) return;
    await fetch("/api/matrix/timeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: draft })
    });
    setDraft("");
    sendToast({ title: "Mensaje enviado" });
    mutate();
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex-1 space-y-3 overflow-y-auto">
        {data?.timeline.map((event) => (
          <div key={event.eventId} className="rounded-lg bg-muted/50 p-3 text-sm">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{event.sender}</span>
              <time>{new Date(event.timestamp).toLocaleTimeString()}</time>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{event.body}</p>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-muted bg-background p-2">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Envía una nota rápida al equipo…"
          className="h-20 w-full resize-none rounded-md border border-muted bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <div className="mt-2 flex justify-end">
          <button
            onClick={handleSend}
            className="rounded-full bg-primary px-4 py-1 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
