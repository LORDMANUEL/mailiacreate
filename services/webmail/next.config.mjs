import 'dotenv/config';
import { withSentryConfig } from '@sentry/nextjs';

const sentryUploadsEnabled = Boolean(
  process.env.SENTRY_AUTH_TOKEN &&
  process.env.SENTRY_ORG &&
  process.env.SENTRY_PROJECT
);

const baseConfig = {
  output: 'standalone',
  reactStrictMode: true,
  experimental: {
    typedRoutes: true
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'gravatar.com' },
      { protocol: 'https', hostname: 'secure.gravatar.com' }
    ]
  },
  env: {
    NEXT_PUBLIC_APP_NAME: 'MailiaCreate Webmail',
    NEXT_PUBLIC_MIXPANEL_TOKEN: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN,
    NEXT_PUBLIC_HOTJAR_SITE_ID: process.env.NEXT_PUBLIC_HOTJAR_SITE_ID,
    NEXT_PUBLIC_HOTJAR_VERSION: process.env.NEXT_PUBLIC_HOTJAR_VERSION,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE
  }
};

const config = sentryUploadsEnabled
  ? withSentryConfig(
      {
        ...baseConfig,
        sentry: {
          hideSourceMaps: true
        }
      },
      {
        silent: true
      }
    )
  : baseConfig;

export default config;
