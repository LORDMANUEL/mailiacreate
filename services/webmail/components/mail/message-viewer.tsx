"use client";

import useSWR from "swr";
import { formatDate } from "../../lib/utils";
import { useMemo } from "react";

export function MessageViewer({ messageId }: { messageId?: string }) {
  const { data, error, isLoading } = useSWR<{ message: any }>(
    messageId ? `/api/jmap/messages?messageId=${messageId}` : null
  );

  const message = useMemo(() => data?.message, [data]);

  if (!messageId) {
    return <div className="p-6 text-sm text-muted-foreground">Elige un correo para visualizar.</div>;
  }
  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Cargando correo…</div>;
  }
  if (error || !message) {
    return <div className="p-6 text-sm text-accent">No se pudo cargar el correo seleccionado.</div>;
  }

  return (
    <article className="flex h-full flex-col overflow-hidden">
      <header className="flex flex-col gap-2 border-b border-muted bg-background/60 p-6">
        <h2 className="text-xl font-semibold text-foreground">{message.subject}</h2>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">{message.from}</p>
            <p>Para: {message.to}</p>
          </div>
          <span>{formatDate(message.receivedAt)}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {message.labels?.map((label: string) => (
            <span key={label} className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
              {label}
            </span>
          ))}
        </div>
      </header>
      <section className="prose prose-sm dark:prose-invert flex-1 overflow-y-auto p-6">
        {message.htmlBody ? (
          <div dangerouslySetInnerHTML={{ __html: message.htmlBody }} />
        ) : (
          <pre className="whitespace-pre-wrap text-sm">{message.textBody}</pre>
        )}
      </section>
    </article>
  );
}
