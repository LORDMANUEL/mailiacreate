'use client';

import useSWR from 'swr';
import { useState } from 'react';
import axios from 'axios';
import { Trash2 } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DomainsPage() {
  const { data, mutate } = useSWR('/admin/api/domains', fetcher);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const domainPattern = /^[a-z0-9.-]+\.[a-z]{2,}$/i;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!domainPattern.test(name)) {
      setError('Dominio inválido. Usa formato ejemplo.com');
      return;
    }
    setLoading(true);
    await axios.post('/admin/api/domains', { name });
    setName('');
    setError('');
    setLoading(false);
    mutate();
  };

  const remove = async (id: string) => {
    await axios.delete(`/admin/api/domains/${id}`);
    mutate();
  };

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/70 p-6">
      <h2 className="text-lg font-semibold text-brand">Dominios gestionados</h2>
      <form onSubmit={submit} className="mt-4 flex gap-3">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          onFocus={() => setError('')}
          placeholder="dominio.com"
          className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading || !domainPattern.test(name)}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
        >
          Añadir
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
      <div className="mt-6 overflow-hidden rounded-md border border-slate-800">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-900/80 text-left text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">Dominio</th>
              <th className="px-4 py-3">Selector DKIM</th>
              <th className="px-4 py-3">Creado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {data?.map((domain: any) => (
              <tr key={domain.id} className="hover:bg-slate-800/40">
                <td className="px-4 py-3 font-medium text-slate-100">{domain.name}</td>
                <td className="px-4 py-3 text-slate-300">{domain.dkimSelector ?? 'mailiacreate'}</td>
                <td className="px-4 py-3 text-slate-400">
                  {domain.createdAt ? new Date(domain.createdAt).toLocaleString() : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => remove(domain.id)}
                    className="inline-flex items-center gap-1 rounded-md border border-red-500/60 px-3 py-1 text-xs text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" /> Eliminar
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
