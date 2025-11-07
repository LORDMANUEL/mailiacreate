import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '../../lib/auth';
import TopBar from '../../components/top-bar';

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session) {
    redirect('/(auth)/login');
  }
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <TopBar />
      {children}
    </div>
  );
}
