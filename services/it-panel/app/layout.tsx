import './globals.css';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import SessionProvider from '../components/session-provider';
import AnalyticsProvider from '../components/analytics-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'MailiaCreate IT Panel',
  description: 'Monitoreo y operaciones de la suite MailiaCreate'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <SessionProvider>
          <AnalyticsProvider />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
