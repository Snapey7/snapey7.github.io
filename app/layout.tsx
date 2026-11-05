import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import './globals.css';

const display = Cormorant_Garamond({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const sans = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.impuravidamagazine.com'),
  title: {
    default: 'IMPURA VIDA Magazine',
    template: '%s | IMPURA VIDA',
  },
  description:
    'A digital magazine celebrating freedom, beauty, and temptation in Costa Rica and beyond. Discover cinematic editorials, muses, and destinations.',
  icons: {
    icon: [
      { url: '/assets/impura-icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/assets/impura-icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      {
        url: '/assets/impura-apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
  appleWebApp: {
    capable: true,
    title: 'IMPURA VIDA',
    statusBarStyle: 'black-translucent',
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: 'IMPURA VIDA',
    url: 'https://www.impuravidamagazine.com/',
    title: 'IMPURA VIDA — A Digital Magazine',
    description:
      'A digital magazine celebrating freedom, beauty, and temptation in Costa Rica and beyond. Discover cinematic editorials, muses, and destinations.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'IMPURA VIDA Magazine — Freedom, beauty, and temptation in Costa Rica and beyond.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IMPURA VIDA — A Digital Magazine',
    description:
      'A digital magazine celebrating freedom, beauty, and temptation in Costa Rica and beyond.',
    images: ['/opengraph-image'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable}`}>{children}</body>
    </html>
  );
}
