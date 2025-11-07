"use client";

import { useState } from "react";
import { ChatModule } from "./chat-module";
import { CalendarModule } from "./calendar-module";
import { CollaborativeComposer } from "../mail/composer";
import { SignatureBoard } from "./signature-board";

const modules = [
  { id: "chat", label: "Chat" },
  { id: "cal", label: "Calendario & Tareas" },
  { id: "composer", label: "Co-redacción" },
  { id: "signatures", label: "Firmas" }
] as const;

export function AnchoredModules({ threadId }: { threadId?: string }) {
  const [active, setActive] = useState<(typeof modules)[number]["id"]>("chat");

  return (
    <div className="flex h-full flex-col">
      <div className="flex gap-2 border-b border-muted pb-2">
        {modules.map((module) => (
          <button
            key={module.id}
            onClick={() => setActive(module.id)}
            className={`rounded-full px-4 py-1 text-sm font-semibold transition ${
              active === module.id ? "bg-primary text-primary-foreground shadow" : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
            }`}
          >
            {module.label}
          </button>
        ))}
      </div>
      <div className="mt-4 flex-1 overflow-hidden">
        {active === "chat" && <ChatModule />}
        {active === "cal" && <CalendarModule />}
        {active === "composer" && <CollaborativeComposer threadId={threadId} />}
        {active === "signatures" && <SignatureBoard />}
      </div>
    </div>
  );
}
