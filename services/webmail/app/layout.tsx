import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { AnalyticsProvider } from "../components/shared/analytics-provider";
import { SWRProvider } from "../components/shared/swr-provider";
import { Toaster } from "../components/shared/toaster";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "MailiaCreate Webmail",
  description:
    "Suite webmail modular estilo Gmail+ con chat, calendario, tareas y colaboración en tiempo real."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AnalyticsProvider>
            <SWRProvider>
              {children}
              <Toaster />
            </SWRProvider>
          </AnalyticsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
