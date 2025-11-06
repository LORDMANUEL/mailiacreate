import { listDomains, listUsers, listAudits } from '../../../lib/stalwart';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [domains, users, audits] = await Promise.all([listDomains(), listUsers(), listAudits()]);

  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-6 shadow">
        <h3 className="text-sm font-medium text-slate-400">Dominios</h3>
        <p className="mt-2 text-3xl font-semibold">{domains.length}</p>
      </div>
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-6 shadow">
        <h3 className="text-sm font-medium text-slate-400">Usuarios</h3>
        <p className="mt-2 text-3xl font-semibold">{users.length}</p>
      </div>
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-6 shadow lg:col-span-1 lg:row-span-2">
        <h3 className="text-sm font-medium text-slate-400">Auditoría reciente</h3>
        <ul className="mt-4 space-y-3 text-sm">
          {audits.slice(0, 5).map((audit: any) => (
            <li key={audit.id} className="rounded-md border border-slate-800/60 bg-slate-900/50 p-3">
              <p className="font-medium text-brand-light">{audit.type}</p>
              <p className="text-slate-300">{audit.message}</p>
              <p className="text-xs text-slate-500">{new Date(audit.createdAt).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
