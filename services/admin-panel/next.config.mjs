await import('dotenv/config');
const { withSentryConfig } = await import('@sentry/nextjs');

const sentryUploadsEnabled = Boolean(
  process.env.SENTRY_AUTH_TOKEN &&
  process.env.SENTRY_ORG &&
  process.env.SENTRY_PROJECT
);

const nextConfig = {
  output: 'standalone',
  sentry: {
    hideSourceMaps: true,
    disableServerWebpackPlugin: !sentryUploadsEnabled,
    disableClientWebpackPlugin: !sentryUploadsEnabled
  },
  env: {
    NEXT_PUBLIC_MIXPANEL_TOKEN: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN,
    NEXT_PUBLIC_HOTJAR_SITE_ID: process.env.NEXT_PUBLIC_HOTJAR_SITE_ID,
    NEXT_PUBLIC_HOTJAR_VERSION: process.env.NEXT_PUBLIC_HOTJAR_VERSION,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE
  }
};

export default withSentryConfig(nextConfig, {
  silent: true,
  dryRun: !sentryUploadsEnabled
});
