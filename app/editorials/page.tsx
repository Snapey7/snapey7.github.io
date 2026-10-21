import type { Metadata } from 'next';
import { EditorialCard } from '@/components/site/EditorialCard';
import { PageShell } from '@/components/site/PageShell';
import { editorials } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Editorials',
  description:
    'Explore cinematic photo stories, magazine editions, and Costa Rica location features from IMPURA VIDA.',
  openGraph: {
    type: 'website',
    siteName: 'IMPURA VIDA',
    url: 'https://www.impuravidamagazine.com/editorials',
    title: 'Editorials | IMPURA VIDA',
    description:
      'Explore cinematic photo stories, magazine editions, and Costa Rica location features from IMPURA VIDA.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'IMPURA VIDA Magazine — Freedom, beauty, and temptation in Costa Rica and beyond.',
      },
    ],
  },
};

export default function EditorialsPage() {
  return (
    <PageShell>
      <main>
        <section className="archive-hero">
          <p className="eyebrow">LATEST DROPS</p>
          <h1>Inspired Vision</h1>
          <p className="section-copy">
            Creativity's whisper, captured after dark. Here is what members are
            experiencing right now.
          </p>
        </section>
        <section className="archive-grid">
          {editorials.map((editorial) => (
            <EditorialCard editorial={editorial} key={editorial.slug} />
          ))}
        </section>
      </main>
    </PageShell>
  );
}
