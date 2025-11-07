import * as Sentry from '@sentry/nextjs';

const clientDsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

if (clientDsn) {
  Sentry.init({
    dsn: clientDsn,
    tracesSampleRate: Number(
      process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1
    ),
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development'
  });
}
