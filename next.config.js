/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverActions: {
    bodySizeLimit: '10MB',
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10MB',
    },
    staleTimes: {
      dynamic: 0,
      static: 30,
    },
  },
};

module.exports = nextConfig;
