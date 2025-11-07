'use client';

import { signOut } from 'next-auth/react';

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/(auth)/login' })}
      className="rounded-md border border-brand px-3 py-1 text-sm text-brand transition hover:bg-brand hover:text-white"
    >
      Cerrar sesión
    </button>
  );
}
