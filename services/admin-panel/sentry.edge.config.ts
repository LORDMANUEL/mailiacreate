import * as Sentry from '@sentry/nextjs';

export function sentryEdgeInstrumentation() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN && !process.env.SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1),
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development'
  });
}
