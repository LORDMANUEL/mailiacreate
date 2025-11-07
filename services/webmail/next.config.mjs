await import('dotenv/config');
const { withSentryConfig } = await import('@sentry/nextjs');

const sentryUploadsEnabled = Boolean(
  process.env.SENTRY_AUTH_TOKEN &&
  process.env.SENTRY_ORG &&
  process.env.SENTRY_PROJECT
);

const nextConfig = {
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
  sentry: {
    hideSourceMaps: true,
    disableServerWebpackPlugin: !sentryUploadsEnabled,
    disableClientWebpackPlugin: !sentryUploadsEnabled
  },
  env: {
    NEXT_PUBLIC_APP_NAME: 'MailiaCreate Webmail'
  }
};

export default withSentryConfig(nextConfig, {
  silent: true,
  dryRun: !sentryUploadsEnabled
});
