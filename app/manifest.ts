import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'IMPURA VIDA Magazine',
    short_name: 'IMPURA VIDA',
    description:
      'A digital magazine celebrating freedom, beauty, and temptation in Costa Rica and beyond.',
    start_url: '/',
    display: 'standalone',
    background_color: '#050505',
    theme_color: '#050505',
    icons: [
      {
        src: '/assets/impura-icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/assets/impura-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
