'use client';

import useSWR from 'swr';
import axios from 'axios';
import { useState } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ExportPage() {
  const { data: users } = useSWR('/admin/api/users', fetcher);
  const { data: jobs, mutate } = useSWR('/admin/api/export', fetcher, { refreshInterval: 15000 });
  const [selectedUser, setSelectedUser] = useState('');

  const trigger = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedUser) return;
    await axios.post('/admin/api/export', { userId: selectedUser });
    mutate();
  };

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/70 p-6">
      <h2 className="text-lg font-semibold text-brand">Exportaciones de buzón</h2>
      <form onSubmit={trigger} className="mt-4 flex gap-3">
        <select
          value={selectedUser}
          onChange={(event) => setSelectedUser(event.target.value)}
          className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        >
          <option value="">Selecciona usuario</option>
          {users?.map((user: any) => (
            <option key={user.id} value={user.id}>
              {user.username}@{user.domain}
            </option>
          ))}
        </select>
        <button className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
          Generar exportación
        </button>
      </form>

      <div className="mt-6 space-y-3">
        {jobs?.map((job: any) => (
          <article key={job.id} className="rounded-md border border-slate-800/60 bg-slate-900/50 p-4">
            <header className="flex items-center justify-between text-sm text-slate-400">
              <span className="font-semibold text-brand-light">{job.userId}</span>
              <span>{new Date(job.createdAt).toLocaleString()}</span>
            </header>
            <p className="text-slate-300">Estado: {job.status}</p>
            {job.location && (
              <a className="text-sm text-brand" href={job.location}>
                Descargar paquete
              </a>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
