import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/*': [
      './public/assets/hero.png',
      './public/assets/impura-vida-logo.png',
    ],
  },
};

export default nextConfig;
