"use client";

import useSWR from "swr";
import { Signature } from "../../lib/signatures";
import { sendToast } from "../shared/toaster";

export function SignatureBoard() {
  const { data, mutate } = useSWR<{ signatures: Signature[] }>("/api/signatures");

  async function handleToggleDefault(id: string) {
    const next = (data?.signatures ?? []).map((signature) => ({
      ...signature,
      default: signature.id === id
    }));
    await fetch("/api/signatures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signatures: next })
    });
    sendToast({ title: "Firma predeterminada actualizada" });
    mutate();
  }

  return (
    <div className="space-y-3">
      {(data?.signatures ?? []).map((signature) => (
        <article key={signature.id} className="rounded-lg border border-muted bg-muted/30 p-3">
          <header className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground">{signature.name}</h4>
            <button
              onClick={() => handleToggleDefault(signature.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                signature.default
                  ? "bg-primary text-primary-foreground"
                  : "border border-muted text-muted-foreground hover:bg-muted/60"
              }`}
            >
              {signature.default ? "Predeterminada" : "Usar"}
            </button>
          </header>
          <div className="prose prose-sm mt-2 dark:prose-invert" dangerouslySetInnerHTML={{ __html: signature.html }} />
        </article>
      ))}
      {data?.signatures?.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Crea firmas desde el módulo de co-redacción y aparecerán aquí para gestionarlas.
        </p>
      ) : null}
    </div>
  );
}
