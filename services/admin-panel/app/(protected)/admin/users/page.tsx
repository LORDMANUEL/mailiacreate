'use client';

import useSWR from 'swr';
import { useState } from 'react';
import axios from 'axios';
import { ShieldAlert } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function UsersPage() {
  const { data, mutate } = useSWR('/admin/api/users', fetcher);
  const [form, setForm] = useState({
    username: '',
    displayName: '',
    domain: '',
    quotaMb: 1024
  });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    await axios.post('/admin/api/users', form);
    setForm({ username: '', displayName: '', domain: '', quotaMb: 1024 });
    mutate();
  };

  const toggle = async (id: string, status: 'active' | 'blocked') => {
    await axios.patch(`/admin/api/users/${id}`, { status });
    mutate();
  };

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/70 p-6">
      <h2 className="text-lg font-semibold text-brand">Usuarios</h2>
      <form onSubmit={submit} className="mt-4 grid gap-3 md:grid-cols-4">
        <input
          value={form.username}
          onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
          placeholder="usuario"
          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        />
        <input
          value={form.displayName}
          onChange={(event) => setForm((prev) => ({ ...prev, displayName: event.target.value }))}
          placeholder="Nombre para mostrar"
          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        />
        <input
          value={form.domain}
          onChange={(event) => setForm((prev) => ({ ...prev, domain: event.target.value }))}
          placeholder="dominio.com"
          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        />
        <input
          type="number"
          value={form.quotaMb}
          onChange={(event) => setForm((prev) => ({ ...prev, quotaMb: Number(event.target.value) }))}
          placeholder="Cuota (MB)"
          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        />
        <button className="md:col-span-4 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
          Crear usuario
        </button>
      </form>

      <div className="mt-6 overflow-hidden rounded-md border border-slate-800">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-900/80 text-left text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Dominio</th>
              <th className="px-4 py-3">Cuota</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {data?.map((user: any) => (
              <tr key={user.id} className="hover:bg-slate-800/40">
                <td className="px-4 py-3 font-medium text-slate-100">{user.username}</td>
                <td className="px-4 py-3 text-slate-300">{user.displayName}</td>
                <td className="px-4 py-3 text-slate-300">{user.domain}</td>
                <td className="px-4 py-3 text-slate-300">{user.quotaMb} MB</td>
                <td className="px-4 py-3 text-slate-400">{user.status}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => toggle(user.id, user.status === 'active' ? 'blocked' : 'active')}
                    className="inline-flex items-center gap-2 rounded-md border border-yellow-500/60 px-3 py-1 text-xs text-yellow-200 hover:bg-yellow-500/10"
                  >
                    <ShieldAlert className="h-4 w-4" />
                    {user.status === 'active' ? 'Bloquear' : 'Reactivar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
