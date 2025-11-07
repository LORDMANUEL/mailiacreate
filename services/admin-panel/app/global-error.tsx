'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 p-6 text-slate-100">
        <div className="max-w-md text-center">
          <h2 className="mb-2 text-2xl font-semibold">Algo salió mal</h2>
          <p className="text-sm text-slate-300">
            Se registró el incidente y nuestro equipo lo revisará. Puedes intentar refrescar la página o volver al panel principal.
          </p>
        </div>
        <button
          type="button"
          className="rounded bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
          onClick={() => reset()}
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}
