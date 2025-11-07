'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-950 p-6 text-neutral-100">
        <div className="max-w-md text-center">
          <h2 className="mb-2 text-2xl font-semibold">Ups, algo salió mal</h2>
          <p className="text-sm text-neutral-300">
            Registramos el incidente para su análisis. Intenta actualizar la vista o vuelve a la bandeja de entrada.
          </p>
        </div>
        <button
          type="button"
          className="rounded bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-400"
          onClick={() => reset()}
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}
