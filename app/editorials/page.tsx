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
  return (
    <PageShell>
      <main>
        <section className="archive-hero editorials-archive-hero">
          <h1>Editorials</h1>
          <p className="section-copy">
            Creativity's whisper, captured after dark. Here is a peak into what
            members are experiencing right now, subscribe to go all the way.
          </p>
        </section>
        <section className="archive-grid editorials-archive-grid">
          <article className="editorial-card editorial-card-captioned editorial-featured-gallery">
            <div className="editorial-card-media editorial-featured-gallery-media">
              <Image
                alt="Ana on a city balcony for A Private Kind of Summer"
                className="object-cover"
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                src="/assets/editorial-ana-cover.jpg"
              />
              <div className="editorial-featured-gallery-shade" />
              <div className="editorial-placeholder-badge">
                <BookOpen aria-hidden="true" size={11} />
                GALLERY
              </div>
            </div>
            <div className="editorial-card-caption">
              <h2>A Private Kind of Summer</h2>
              <p>Ana’s Little Vice, where temptation turns an ordinary afternoon into something far more sinful.</p>
              <span>Impura Vida</span>
            </div>
          </article>
          <article className="editorial-card editorial-card-captioned editorial-featured-gallery">
            <div className="editorial-card-media editorial-featured-gallery-media">
              <Image
                alt="Lucy at a secluded cove in Manzanillo, Costa Rica"
                className="object-cover"
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                src="/assets/editorial-manzanillo-cover.jpg"
              />
              <div className="editorial-featured-gallery-shade" />
              <div className="editorial-placeholder-badge">
                <BookOpen aria-hidden="true" size={11} />
                GALLERY
              </div>
            </div>
            <div className="editorial-card-caption">
              <h2>Manzanillo Part I — Nothing Beyond the Horizon</h2>
              <p>Lucy’s secret cove at the edge of the jungle.</p>
              <span>Impura Vida</span>
            </div>
          </article>
          <article className="editorial-card editorial-card-captioned editorial-featured-gallery">
            <div className="editorial-card-media editorial-featured-gallery-media">
              <Image
                alt="Angie and Daya sharing an afternoon beside a green window"
                className="object-cover"
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                src="/assets/editorial-angie-daya-cover.png"
              />
              <div className="editorial-featured-gallery-shade" />
              <div className="editorial-placeholder-badge">
                <BookOpen aria-hidden="true" size={11} />
                GALLERY
              </div>
            </div>
            <div className="editorial-card-caption">
              <h2>Where the Green Comes In</h2>
              <p>A shared afternoon with Angie and Daya.</p>
              <span>Impura Vida</span>
            </div>
          </article>
          <article className="editorial-card editorial-card-captioned editorial-featured-gallery">
            <div className="editorial-card-media editorial-featured-gallery-media">
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
            </div>
            <div className="editorial-card-caption">
              <h2>The House Keeps the Shadows</h2>
              <p>An intimate portrait in warm light and deep shadow.</p>
              <span>Impura Vida</span>
            </div>
          </article>
          {editorials.map((editorial) => (
            <EditorialCard captioned editorial={editorial} key={editorial.slug} />
          ))}
        </section>
      </main>
    </PageShell>
  );
}
