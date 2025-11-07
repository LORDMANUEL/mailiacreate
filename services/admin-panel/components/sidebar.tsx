'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../lib/utils';

const links = [
  { href: '/admin', label: 'Resumen' },
  { href: '/admin/domains', label: 'Dominios' },
  { href: '/admin/users', label: 'Usuarios' },
  { href: '/admin/audit', label: 'Auditoría' },
  { href: '/admin/export', label: 'Exportaciones' }
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-slate-800 bg-slate-900/80 p-4">
      <h1 className="text-xl font-semibold text-brand">MailiaCreate Admin</h1>
      <nav className="mt-6 space-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'block rounded-md px-3 py-2 text-sm transition-colors hover:bg-brand/10 hover:text-brand-light',
              pathname === link.href ? 'bg-brand/20 text-brand-light' : 'text-slate-200'
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
