import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '../../lib/auth';
import Sidebar from '../../components/sidebar';
import SignOutButton from '../../components/sign-out-button';

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session) {
    redirect('/(auth)/login');
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-slate-950/80 p-8">
        <header className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-semibold">Bienvenido, {session.user?.name ?? 'administrador'}</h2>
            <p className="text-sm text-slate-400">Gestiona tu tenant de correo.</p>
          </div>
          <SignOutButton />
        </header>
        <div className="mt-6 space-y-6">{children}</div>
      </main>
    </div>
  );
}
