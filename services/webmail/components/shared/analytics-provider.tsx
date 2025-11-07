"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import mixpanel from "mixpanel-browser";
import { init as initHotjar } from "@hotjar/browser";

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
