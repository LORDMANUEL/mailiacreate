await import('dotenv/config');
const { withSentryConfig } = await import('@sentry/nextjs');

const sentryUploadsEnabled = Boolean(
  process.env.SENTRY_AUTH_TOKEN &&
  process.env.SENTRY_ORG &&
  process.env.SENTRY_PROJECT
);

const baseConfig = {
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
    NEXT_PUBLIC_APP_NAME: 'MailiaCreate Webmail'
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
