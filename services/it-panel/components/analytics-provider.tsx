'use client';

import { useEffect } from 'react';
import mixpanel from 'mixpanel-browser';
import { hotjar } from '@hotjar/browser';

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
      hotjar.init(Number(HOTJAR_SITE_ID), HOTJAR_VERSION);
    }
  }, []);

  return null;
}
