await import('dotenv/config');

const nextConfig = {
  experimental: {
    serverActions: true
  },
  output: 'standalone'
};

export default nextConfig;
