'use client';

import useSWR from 'swr';
import {
  AreaChart,
  Area,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function formatLatencySeries(series: any[] = []) {
  if (!series.length) return [];
  const [first] = series;
  return first.values?.map((entry: [string, string]) => ({
    timestamp: new Date(Number(entry[0]) * 1000).toLocaleTimeString(),
    value: parseFloat(entry[1])
  }));
}

export default function ItDashboard() {
  const { data: metrics } = useSWR('/it/api/metrics', fetcher, { refreshInterval: 15000 });
  const { data: logs } = useSWR('/it/api/logs', fetcher, { refreshInterval: 30000 });
  const { data: backups } = useSWR('/it/api/backups', fetcher, { refreshInterval: 60000 });

  const latencySeries = formatLatencySeries(metrics?.jmapLatency);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      <section className="grid gap-6 md:grid-cols-3">
        <article className="rounded-lg border border-slate-800 bg-slate-900/60 p-6">
          <p className="text-sm text-slate-400">SMTP Queue</p>
          <p className="mt-2 text-3xl font-semibold text-cyan-400">{metrics?.smtpQueue?.[0]?.value?.[1] ?? '0'}</p>
        </article>
        <article className="rounded-lg border border-slate-800 bg-slate-900/60 p-6">
          <p className="text-sm text-slate-400">Último backup</p>
          <p className="mt-2 text-xl font-medium text-green-400">
            {backups?.lastSuccess
              ? new Date(backups.lastSuccess).toLocaleString()
              : 'Sin registros'}
          </p>
        </article>
        <article className="rounded-lg border border-slate-800 bg-slate-900/60 p-6">
          <p className="text-sm text-slate-400">Alertas activas</p>
          <p className="mt-2 text-3xl font-semibold text-rose-400">{backups?.activeAlerts ?? 0}</p>
        </article>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold text-cyan-300">Latencia JMAP (promedio 5m)</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={latencySeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="timestamp" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" tickFormatter={(value) => `${value.toFixed(2)}s`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#38bdf8', color: '#e2e8f0' }}
                formatter={(value: number) => `${value.toFixed(2)}s`}
              />
              <Area type="monotone" dataKey="value" stroke="#38bdf8" fill="#38bdf833" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold text-cyan-300">Logs recientes</h2>
        <div className="mt-4 space-y-3">
          {logs?.map((stream: any, index: number) => (
            <article key={index} className="rounded-md border border-slate-800/70 bg-slate-950/60 p-4">
              <p className="text-xs text-slate-400">{stream.stream?.service ?? 'servicio'}</p>
              <p className="mt-2 text-sm text-slate-100">{stream.values?.[0]?.[1]}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
