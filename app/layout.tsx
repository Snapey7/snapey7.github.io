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
  metadataBase: new URL('https://puravidamagazine.vercel.app'),
  title: 'IMPURA VIDA Magazine',
  description:
    'A premium nocturnal Costa Rica-inspired digital editorial magazine for members.',
  openGraph: {
    title: 'IMPURA VIDA Magazine',
    description:
      'A private world of cinematic tropical editorials, membership, and Costa Rica impact.',
    images: ['/assets/hero.png'],
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
