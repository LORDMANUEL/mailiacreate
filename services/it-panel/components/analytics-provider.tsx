'use client';

import { useEffect } from 'react';
import mixpanel from 'mixpanel-browser';

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || '';
const HOTJAR_SITE_ID = process.env.NEXT_PUBLIC_HOTJAR_SITE_ID || '';
const HOTJAR_VERSION = Number(process.env.NEXT_PUBLIC_HOTJAR_VERSION || 6);

export default function AnalyticsProvider() {
  useEffect(() => {
    if (MIXPANEL_TOKEN) {
      mixpanel.init(MIXPANEL_TOKEN, {
        debug: process.env.NODE_ENV !== 'production',
        track_pageview: true
      });
      mixpanel.track('it_panel_loaded');
    }

    if (HOTJAR_SITE_ID) {
      initHotjar(Number(HOTJAR_SITE_ID), HOTJAR_VERSION);
    }
  }, []);

  return null;
}

function initHotjar(siteId: number, version: number) {
  if (typeof window === 'undefined') {
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

  const script = document.createElement('script');
  script.async = true;
  script.dataset.hotjar = String(siteId);
  script.src = `https://static.hotjar.com/c/hotjar-${siteId}.js?sv=${version}`;
  head.appendChild(script);
}
