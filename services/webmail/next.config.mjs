import { withSentryConfig } from "@sentry/nextjs";

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
    serverActions: true
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "gravatar.com" },
      { protocol: "https", hostname: "secure.gravatar.com" }
    ]
  },
  env: {
    NEXT_PUBLIC_APP_NAME: "MailiaCreate Webmail"
  }
};

export default withSentryConfig(nextConfig, {
  silent: true
});
