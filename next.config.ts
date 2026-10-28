import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/opengraph-image': [
      './public/assets/hero.png',
      './public/assets/impura-vida-logo.png',
    ],
  },
};

export default nextConfig;
