"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import mixpanel from "mixpanel-browser";

const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const mixpanelToken = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
const hotjarId = process.env.NEXT_PUBLIC_HOTJAR_SITE_ID;
const hotjarVersion = process.env.NEXT_PUBLIC_HOTJAR_VERSION || "6";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (sentryDsn) {
      Sentry.init({
        dsn: sentryDsn,
        tracesSampleRate: 0.1
      });
    }
    if (mixpanelToken) {
      mixpanel.init(mixpanelToken, { debug: false, track_pageview: true });
    }
    if (hotjarId) {
      initHotjar(Number(hotjarId), Number(hotjarVersion));
    }
  }, []);

  return <>{children}</>;
}

function initHotjar(siteId: number, version: number) {
  if (typeof window === "undefined") {
    return;
  }

  const win = window as typeof window & {
    hj?: ((...args: unknown[]) => void) & { q?: unknown[][] };
    _hjSettings?: { hjid: number; hjsv: number };
  };

  if (win.hj) {
    return;
  }

  win._hjSettings = { hjid: siteId, hjsv: version };

  const queue: unknown[][] = [];
  const hotjarFn = ((...args: unknown[]) => {
    queue.push(args);
  }) as typeof win.hj;

  win.hj = Object.assign(hotjarFn, { q: queue });

  const head = document.head;
  if (!head || head.querySelector(`script[data-hotjar="${siteId}"]`)) {
    return;
  }

  const script = document.createElement("script");
  script.async = true;
  script.dataset.hotjar = String(siteId);
  script.src = `https://static.hotjar.com/c/hotjar-${siteId}.js?sv=${version}`;
  head.appendChild(script);
}
