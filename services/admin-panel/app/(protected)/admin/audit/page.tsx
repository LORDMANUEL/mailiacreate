'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AuditPage() {
  const { data } = useSWR('/admin/api/audit', fetcher, { refreshInterval: 60000 });

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/70 p-6">
      <h2 className="text-lg font-semibold text-brand">Auditoría</h2>
      <p className="mt-2 text-sm text-slate-400">
        Eventos firmados de cambios en la plataforma. Los datos se guardan localmente si no se configuró Stalwart.
      </p>
      <div className="mt-6 space-y-3">
        {data?.map((event: any) => (
          <article key={event.id} className="rounded-md border border-slate-800/60 bg-slate-900/50 p-4">
            <header className="flex items-center justify-between text-sm text-slate-400">
              <span className="font-semibold text-brand-light">{event.type}</span>
              <span>{new Date(event.createdAt).toLocaleString()}</span>
            </header>
            <p className="mt-2 text-slate-200">{event.message}</p>
            {event.actor && <p className="text-xs text-slate-500">Actor: {event.actor}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
