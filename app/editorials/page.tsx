import type { Metadata } from 'next';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';
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
  const newGallerySlots = ['01', '02', '03'];

  return (
    <PageShell>
      <main>
        <section className="archive-hero editorials-archive-hero">
          <p className="eyebrow">LATEST DROPS</p>
          <h1>Inspired Vision</h1>
          <p className="section-copy">
            Creativity's whisper, captured after dark. Here is a peak into what
            members are experiencing right now, subscribe to go all the way.
          </p>
        </section>
        <section className="archive-grid editorials-archive-grid">
          {newGallerySlots.map((slot) => (
            <article className="editorial-card editorial-placeholder" key={slot}>
              <div className="editorial-placeholder-badge">
                <BookOpen aria-hidden="true" size={11} />
                GALLERY
              </div>
              <div className="editorial-placeholder-copy">
                <p>NEW GALLERY</p>
                <span>PHOTO TO BE ADDED</span>
              </div>
            </article>
          ))}
          <article className="editorial-card editorial-placeholder editorial-featured-gallery">
            <Image
              alt="Cynthia in warm, low light for The House Keeps the Shadows"
              className="object-cover"
              fill
              priority
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              src="/assets/editorial-cynthia-cover.jpg"
            />
            <div className="editorial-featured-gallery-shade" />
            <div className="editorial-placeholder-badge">
              <BookOpen aria-hidden="true" size={11} />
              GALLERY
            </div>
            <div className="editorial-featured-gallery-copy">
              <h2>The House Keeps the Shadows</h2>
            </div>
          </article>
          {editorials.map((editorial) => (
            <EditorialCard editorial={editorial} key={editorial.slug} />
          ))}
        </section>
      </main>
    </PageShell>
  );
}
