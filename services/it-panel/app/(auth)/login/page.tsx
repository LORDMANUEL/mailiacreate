'use client';

import { signIn } from 'next-auth/react';

export default function Login() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950">
      <div className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900/80 p-8 text-center shadow-xl">
        <h1 className="text-2xl font-semibold text-cyan-400">MailiaCreate IT</h1>
        <p className="mt-4 text-sm text-slate-300">
          Panel de operaciones. Inicia sesión con Keycloak.
        </p>
        <button
          onClick={() => signIn('keycloak', { callbackUrl: '/it' })}
          className="mt-8 w-full rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-cyan-400"
        >
          Acceder
        </button>
      </div>
    </main>
  );
}
