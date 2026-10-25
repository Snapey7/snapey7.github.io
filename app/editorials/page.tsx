import type { Metadata } from 'next';
import Image from 'next/image';
import { EditorialCard, GalleryHoverDetails } from '@/components/site/EditorialCard';
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
  const futureGallerySlots = [13, 14, 15, 16];

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
          <article
            className="editorial-card editorial-card-captioned editorial-hover-card editorial-featured-gallery"
            tabIndex={0}
          >
            <div className="editorial-card-media editorial-featured-gallery-media">
              <Image
                alt="Ana on a city balcony for A Private Kind of Summer"
                className="object-cover"
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                src="/assets/editorial-ana-cover.jpg"
              />
              <GalleryHoverDetails location="Miami" name="Ana" />
            </div>
          </article>
          <article
            className="editorial-card editorial-card-captioned editorial-hover-card editorial-featured-gallery"
            tabIndex={0}
          >
            <div className="editorial-card-media editorial-featured-gallery-media">
              <Image
                alt="Lucy at a secluded cove in Manzanillo, Costa Rica"
                className="object-cover"
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                src="/assets/editorial-manzanillo-cover.jpg"
              />
              <GalleryHoverDetails location="Manzanillo" name="Lucy" />
            </div>
          </article>
          <article
            className="editorial-card editorial-card-captioned editorial-hover-card editorial-featured-gallery"
            tabIndex={0}
          >
            <div className="editorial-card-media editorial-featured-gallery-media">
              <Image
                alt="Angie and Daya sharing an afternoon beside a green window"
                className="object-cover"
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                src="/assets/editorial-angie-daya-cover.png"
              />
              <GalleryHoverDetails location="Costa Rica" name="Angie & Daya" />
            </div>
          </article>
          <article
            className="editorial-card editorial-card-captioned editorial-hover-card editorial-featured-gallery"
            tabIndex={0}
          >
            <div className="editorial-card-media editorial-featured-gallery-media">
              <Image
                alt="Cynthia in warm, low light for The House Keeps the Shadows"
                className="object-cover"
                fill
                priority
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                src="/assets/editorial-cynthia-cover.jpg"
              />
              <GalleryHoverDetails location="Costa Rica" name="Cynthia" />
            </div>
          </article>
          {editorials.map((editorial) => (
            <EditorialCard captioned editorial={editorial} key={editorial.slug} />
          ))}
          {futureGallerySlots.map((slot) => (
            <article
              className="editorial-card editorial-card-captioned editorial-hover-card editorial-upcoming-card"
              key={slot}
              tabIndex={0}
            >
              <div className="editorial-card-media editorial-upcoming-media">
                <span className="editorial-upcoming-label">COMING SOON</span>
                <GalleryHoverDetails
                  location="Coming soon"
                  name={`New Gallery ${slot}`}
                />
              </div>
            </article>
          ))}
        </section>
      </main>
    </PageShell>
  );
}
