"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Signature } from "../../lib/signatures";
import { sendToast } from "../shared/toaster";

export function CollaborativeComposer({ threadId }: { threadId?: string }) {
  const [body, setBody] = useState("");
  const [selectedSignature, setSelectedSignature] = useState<string>("");
  const { data: signaturesData, mutate: refetchSignatures } = useSWR<{ signatures: Signature[] }>(
    "/api/signatures"
  );
  const { mutate: sendAnnotation } = useSWR(
    threadId ? ["annotation", threadId] : null,
    async () => {
      return { ok: true };
    },
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  const signatures = useMemo(() => signaturesData?.signatures ?? [], [signaturesData]);

  useEffect(() => {
    const defaultSignature = signatures.find((item) => item.default) ?? signatures[0];
    if (defaultSignature) {
      setSelectedSignature(defaultSignature.id);
    }
  }, [signatures]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!threadId) return;
    const payload = `${body}\n\n${getSignatureHtml()?.replace(/<[^>]+>/g, "") ?? ""}`.trim();
    await fetch("/api/matrix/timeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: `[draft:${threadId}] ${payload}` })
    });
    sendToast({ title: "Borrador sincronizado", description: "Tus colegas verán los cambios en segundos." });
    await sendAnnotation();
  }

  function getSignatureHtml() {
    return signatures.find((item) => item.id === selectedSignature)?.html;
  }

  async function handleAddSignature() {
    const name = prompt("Nombre de la firma");
    const html = prompt("Contenido HTML de la firma", "<p>Saludos cordiales</p>") ?? "";
    if (!name) return;
    const next = [...signatures, { id: crypto.randomUUID(), name, html }];
    await fetch("/api/signatures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signatures: next })
    });
    sendToast({ title: "Firma guardada" });
    refetchSignatures();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-muted bg-background/80 p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-foreground">Co-redactar respuesta</span>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs text-muted-foreground" htmlFor="signature">
            Firma dinámica
          </label>
          <select
            id="signature"
            className="rounded-md border border-muted bg-transparent px-2 py-1 text-xs"
            value={selectedSignature}
            onChange={(event) => setSelectedSignature(event.target.value)}
          >
            {signatures.map((signature) => (
              <option key={signature.id} value={signature.id}>
                {signature.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="rounded-md border border-muted px-2 py-1 text-xs hover:bg-muted/60"
            onClick={handleAddSignature}
          >
            Nueva
          </button>
        </div>
      </div>
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Comparte ideas, asigna follow-ups o redacta junto a tu equipo…"
        className="min-h-[120px] w-full rounded-md border border-muted bg-background px-3 py-2 text-sm text-foreground shadow-inner focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
      {getSignatureHtml() ? (
        <div className="rounded-md border border-dashed border-muted bg-muted/30 p-3 text-xs" dangerouslySetInnerHTML={{ __html: getSignatureHtml() ?? "" }} />
      ) : null}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <p>Los cambios se comparten vía Matrix en tiempo real.</p>
        <button
          type="submit"
          className="rounded-full bg-primary px-4 py-1 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90"
        >
          Publicar borrador
        </button>
      </div>
    </form>
  );
}
