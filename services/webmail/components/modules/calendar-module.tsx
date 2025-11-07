"use client";

import useSWR from "swr";
import { CalendarEvent, TaskItem } from "../../lib/nextcloud";
import { formatDate } from "../../lib/utils";

export function CalendarModule() {
  const { data } = useSWR<{ events: CalendarEvent[]; tasks: TaskItem[] }>("/api/tasks", {
    refreshInterval: 60_000
  });

  return (
    <div className="grid h-full grid-rows-[min-content_1fr] gap-3">
      <section className="rounded-lg border border-muted bg-muted/40 p-3">
        <h3 className="text-sm font-semibold text-foreground">Próximos eventos</h3>
        <ul className="mt-2 space-y-2 text-sm">
          {data?.events && data.events.length > 0 ? (
            data.events.map((event) => (
              <li key={event.id} className="rounded-md bg-background/80 p-2 shadow-sm">
                <p className="font-medium text-foreground">{event.summary}</p>
                <p className="text-xs text-muted-foreground">{formatDate(event.start)} • {event.location}</p>
                {event.description ? (
                  <p className="mt-1 text-xs text-muted-foreground">{event.description}</p>
                ) : null}
              </li>
            ))
          ) : (
            <li className="text-xs text-muted-foreground">Sin eventos próximos.</li>
          )}
        </ul>
      </section>
      <section className="rounded-lg border border-muted bg-muted/40 p-3">
        <h3 className="text-sm font-semibold text-foreground">Tareas vinculadas</h3>
        <ul className="mt-2 space-y-2 text-sm">
          {data?.tasks && data.tasks.length > 0 ? (
            data.tasks.map((task) => (
              <li key={task.id} className="flex items-start gap-2">
                <input type="checkbox" checked={task.completed} readOnly className="mt-1 h-4 w-4 rounded border-muted" />
                <div>
                  <p className="font-medium text-foreground">{task.title}</p>
                  {task.due ? <p className="text-xs text-muted-foreground">Vence {formatDate(task.due)}</p> : null}
                </div>
              </li>
            ))
          ) : (
            <li className="text-xs text-muted-foreground">No hay tareas pendientes.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
