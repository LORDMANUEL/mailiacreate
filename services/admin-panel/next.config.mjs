import { createRequire } from 'module';

const require = createRequire(import.meta.url);
await import('dotenv/config');

const nextConfig = {
  experimental: {
    serverActions: true
  },
  output: 'standalone'
};

export default nextConfig;
