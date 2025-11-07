"use client";

import { useTheme } from "next-themes";
import { MoonStar, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { sendToast } from "../shared/toaster";

export function TopBar() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <header className="flex h-14 items-center justify-between border-b border-muted bg-background/80 px-6 backdrop-blur">
      <div>
        <p className="text-sm uppercase tracking-wide text-muted-foreground">MailiaCreate</p>
        <h1 className="text-lg font-semibold">Bandeja de entrada inteligente</h1>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Activar modo oscuro"
          onClick={() => {
            const next = resolvedTheme === "dark" ? "light" : "dark";
            setTheme(next);
            sendToast({ title: `Tema ${next === "dark" ? "oscuro" : "claro"} activado` });
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-muted text-foreground transition hover:bg-muted/40"
        >
          {mounted && resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}
