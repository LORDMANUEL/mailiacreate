"use client";

import { useState } from "react";
import { MailboxList } from "../mail/mailbox-list";
import { MessageList } from "../mail/message-list";
import { MessageViewer } from "../mail/message-viewer";
import { AnchoredModules } from "../modules/anchored-modules";

export function ThreePaneExperience() {
  const [mailboxId, setMailboxId] = useState<string | undefined>();
  const [messageId, setMessageId] = useState<string | undefined>();

  return (
    <div className="grid h-full grid-cols-[280px_1fr_360px] gap-4 overflow-hidden">
      <aside className="rounded-xl border border-muted bg-background/70 shadow-sm">
        <MailboxList
          selected={mailboxId}
          onSelect={(id) => {
            setMailboxId(id);
            setMessageId(undefined);
          }}
        />
      </aside>
      <section className="flex h-full flex-col overflow-hidden rounded-xl border border-muted bg-background/70 shadow-sm">
        <MessageList mailboxId={mailboxId} selected={messageId} onSelect={setMessageId} />
      </section>
      <aside className="flex h-full flex-col gap-4">
        <div className="h-1/2 overflow-hidden rounded-xl border border-muted bg-background/70 shadow-sm">
          <MessageViewer messageId={messageId} />
        </div>
        <div className="flex-1 overflow-hidden rounded-xl border border-muted bg-background/70 p-4 shadow-sm">
          <AnchoredModules threadId={messageId} />
        </div>
      </aside>
    </div>
  );
}
