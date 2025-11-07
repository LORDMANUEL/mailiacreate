"use client";

import useSWR from "swr";
import { Mailbox } from "../../lib/jmap";
import { cn } from "../../lib/utils";

export function MailboxList({ selected, onSelect }: { selected?: string; onSelect: (id: string) => void }) {
  const { data, error } = useSWR<{ mailboxes: Mailbox[] }>("/api/jmap/mailboxes");

  if (error) {
    return <div className="p-4 text-sm text-accent">No se pudieron cargar las bandejas.</div>;
  }

  const mailboxes = data?.mailboxes ?? [];

  return (
    <nav className="flex flex-col gap-1 p-3">
      {mailboxes.map((mailbox) => (
        <button
          key={mailbox.id}
          onClick={() => onSelect(mailbox.id)}
          className={cn(
            "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-primary/40",
            selected === mailbox.id
              ? "bg-primary text-primary-foreground shadow"
              : "hover:bg-muted/60 text-foreground"
          )}
        >
          <span className="font-medium">{mailbox.name}</span>
          <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-xs">
            {mailbox.totalEmails}
          </span>
        </button>
      ))}
    </nav>
  );
}
