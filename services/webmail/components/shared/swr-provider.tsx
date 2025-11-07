"use client";

import { SWRConfig } from "swr";

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: async (resource, init) => {
          const res = await fetch(resource, init);
          if (!res.ok) {
            throw new Error(`Solicitud falló con estado ${res.status}`);
          }
          return res.json();
        },
        dedupingInterval: 10_000,
        revalidateOnFocus: true
      }}
    >
      {children}
    </SWRConfig>
  );
}
