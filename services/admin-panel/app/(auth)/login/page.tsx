'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    await signIn('keycloak', { callbackUrl: '/admin' });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950">
      <div className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900/80 p-8 text-center shadow-xl">
        <h1 className="text-2xl font-semibold text-brand">MailiaCreate Admin</h1>
        <p className="mt-4 text-sm text-slate-300">
          Gestiona dominios, usuarios y políticas desde un único panel protegido por Keycloak.
        </p>
        <button
          onClick={handleLogin}
          disabled={loading}
          className="mt-8 w-full rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark disabled:opacity-60"
        >
          {loading ? 'Redirigiendo…' : 'Ingresar con Keycloak'}
        </button>
      </div>
    </main>
  );
}
