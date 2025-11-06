'use client';

import { signOut } from 'next-auth/react';

export default function TopBar() {
  return (
    <header className="flex items-center justify-between border-b border-slate-800/60 bg-slate-900/60 px-6 py-4 text-sm">
      <div>
        <p className="text-cyan-300">MailiaCreate IT Panel</p>
        <p className="text-xs text-slate-400">Salud y monitoreo unificados</p>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: '/(auth)/login' })}
        className="rounded-md border border-cyan-500 px-3 py-1 text-cyan-300 transition hover:bg-cyan-500 hover:text-slate-900"
      >
        Cerrar sesión
      </button>
    </header>
  );
}
