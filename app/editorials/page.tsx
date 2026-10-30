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
        <section className="archive-hero editorials-archive-hero">
          <p className="eyebrow editorial-archive-kicker">THE STORY BEHIND THE IMAGE</p>
          <h1>Editorials</h1>
          <p className="section-copy">
            Stories from the shoots, and the creative voices, places, and ideas
            behind each frame.
          </p>
        </section>
        <section className="archive-grid editorials-archive-grid">
          {editorials.map((editorial) => (
            <EditorialCard captioned editorial={editorial} key={editorial.slug} />
          ))}
        </section>
      </main>
    </PageShell>
  );
}
