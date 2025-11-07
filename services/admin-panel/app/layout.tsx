import './globals.css';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import SessionProvider from '../components/session-provider';
import AnalyticsProvider from '../components/analytics-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'MailiaCreate Admin',
  description: 'Panel administrativo para dominios y usuarios MailiaCreate'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className={`${inter.className} h-full bg-slate-950 text-slate-100`}>
        <SessionProvider>
          <AnalyticsProvider />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
