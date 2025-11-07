'use client';

import useSWR from 'swr';
import { useEffect, useState } from 'react';
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
  const [errors, setErrors] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const issues: string[] = [];
    const usernamePattern = /^[a-z0-9._-]{3,}$/i;
    const domainPattern = /^[a-z0-9.-]+\.[a-z]{2,}$/i;
    if (!usernamePattern.test(form.username)) {
      issues.push('Usuario debe tener al menos 3 caracteres alfanuméricos.');
    }
    if (!form.displayName.trim()) {
      issues.push('Nombre para mostrar es obligatorio.');
    }
    if (!domainPattern.test(form.domain)) {
      issues.push('Dominio inválido. Usa el formato ejemplo.com.');
    }
    if (Number.isNaN(form.quotaMb) || form.quotaMb < 128) {
      issues.push('Cuota mínima permitida: 128 MB.');
    }
    if (!touched) {
      setErrors([]);
      setIsValid(false);
      return;
    }
    setErrors(issues);
    setIsValid(issues.length === 0);
  }, [form, touched]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValid) return;
    await axios.post('/admin/api/users', form);
    setForm({ username: '', displayName: '', domain: '', quotaMb: 1024 });
    setTouched(false);
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
          onChange={(event) => {
            setTouched(true);
            setForm((prev) => ({ ...prev, username: event.target.value }));
          }}
          placeholder="usuario"
          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        />
        <input
          value={form.displayName}
          onChange={(event) => setForm((prev) => ({ ...prev, displayName: event.target.value }))}
          onFocus={() => setTouched(true)}
          placeholder="Nombre para mostrar"
          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        />
        <input
          value={form.domain}
          onChange={(event) => setForm((prev) => ({ ...prev, domain: event.target.value }))}
          onFocus={() => setTouched(true)}
          placeholder="dominio.com"
          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        />
        <input
          type="number"
          value={form.quotaMb}
          onChange={(event) => setForm((prev) => ({ ...prev, quotaMb: Number(event.target.value) }))}
          onFocus={() => setTouched(true)}
          placeholder="Cuota (MB)"
          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        />
        <button
          disabled={!isValid}
          className="md:col-span-4 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
        >
          Crear usuario
        </button>
      </form>
      {errors.length > 0 && (
        <ul className="md:col-span-4 mt-2 list-disc space-y-1 rounded-md border border-red-500/60 bg-red-500/10 p-3 text-sm text-red-200">
          {errors.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      )}

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
