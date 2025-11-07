"use client";

import useSWR from "swr";
import { useMemo } from "react";
import { MessageSummary } from "../../lib/jmap";
import { cn, formatDate } from "../../lib/utils";

export function MessageList({
  mailboxId,
  selected,
  onSelect
}: {
  mailboxId?: string;
  selected?: string;
  onSelect: (id: string) => void;
}) {
  const { data, error, isLoading } = useSWR<{ messages: MessageSummary[] }>(
    mailboxId ? `/api/jmap/messages?mailboxId=${mailboxId}` : null
  );

  const messages = useMemo(() => data?.messages ?? [], [data]);

  if (!mailboxId) {
    return <div className="p-4 text-sm text-muted-foreground">Selecciona una bandeja para comenzar.</div>;
  }
  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Sincronizando mensajes…</div>;
  }
  if (error) {
    return <div className="p-4 text-sm text-accent">No se pudieron cargar los mensajes.</div>;
  }

  return (
    <div className="flex flex-col divide-y divide-muted overflow-y-auto">
      {messages.map((message) => (
        <button
          key={message.id}
          onClick={() => onSelect(message.id)}
          className={cn(
            "flex flex-col gap-1 p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            selected === message.id ? "bg-primary/10 shadow-inner" : "hover:bg-muted/40"
          )}
        >
          <div className="flex items-center justify-between">
            <p className="font-semibold text-foreground">{message.subject}</p>
            <span className="text-xs text-muted-foreground">{formatDate(message.receivedAt)}</span>
          </div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{message.from}</p>
          <p className="line-clamp-2 text-sm text-muted-foreground">{message.preview}</p>
        </button>
      ))}
    </div>
  );
}
