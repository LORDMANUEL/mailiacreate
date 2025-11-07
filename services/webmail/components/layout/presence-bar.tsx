"use client";

import useSWR from "swr";
import { useEffect, useMemo, useState } from "react";
import { Presence } from "../../lib/matrix";

function formatAgo(ms?: number) {
  if (!ms) return "Activo ahora";
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return "Activo ahora";
  if (minutes === 1) return "Activo hace 1 min";
  return `Activo hace ${minutes} min`;
}

export function PresenceBar({ userIds }: { userIds: string[] }) {
  const [intervalMs, setIntervalMs] = useState(15_000);
  const { data, error, mutate } = useSWR<{ presences: Presence[] }>(
    userIds.length ? `/api/matrix/presence?${userIds.map((id) => `userId=${encodeURIComponent(id)}`).join("&")}` : null,
    { refreshInterval: intervalMs }
  );

  useEffect(() => {
    setIntervalMs(10_000);
  }, [userIds.join(",")]);

  const status = useMemo(() => {
    const presences = data?.presences ?? [];
    const online = presences.filter((p) => p.status === "online");
    return { presences, online };
  }, [data]);

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-dashed border-accent/40 bg-accent/10 px-4 py-2 text-xs text-accent">
        No se pudo sincronizar presencia.
        <button className="underline" onClick={() => mutate()}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-md border border-muted bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
      <div className="flex items-center gap-3">
        <span className="font-semibold text-foreground">Colaboradores conectados</span>
        <div className="flex -space-x-2">
          {status.presences.map((presence) => (
            <span
              key={presence.userId}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-background bg-primary/90 text-xs font-semibold text-primary-foreground shadow"
              title={`${presence.displayName} • ${presence.status}`}
            >
              {presence.displayName.slice(0, 2).toUpperCase()}
            </span>
          ))}
        </div>
      </div>
      <div>
        {status.online.length > 0
          ? `${status.online.length} en línea`
          : status.presences.length > 0
          ? `Última actividad ${formatAgo(status.presences[0]?.lastActiveAgo)}`
          : "Sin datos de presencia"}
      </div>
    </div>
  );
}
