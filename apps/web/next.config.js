/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@juicyway/attribution', '@juicyway/event-schema', '@juicyway/experiments'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
