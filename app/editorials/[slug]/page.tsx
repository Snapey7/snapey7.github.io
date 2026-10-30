import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/site/PageShell';
import { getPublicEditorials, editorialBody } from '@/lib/editorials';

type EditorialPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: EditorialPageProps) {
  const { slug } = await params;
  const allEditorials = await getPublicEditorials();
  const editorial = allEditorials.find((item) => item.slug === slug);
  if (!editorial) return {};
  return {
    title: `${editorial.title} | IMPURA VIDA`,
    description: editorial.intro,
    openGraph: {
      title: `${editorial.title} | IMPURA VIDA`,
      description: editorial.intro,
      images: [editorial.image],
    },
  };
}

export const dynamic = 'force-dynamic';

export default async function EditorialDetailPage({ params }: EditorialPageProps) {
  const { slug } = await params;
  const allEditorials = await getPublicEditorials();
  const editorial = allEditorials.find((item) => item.slug === slug);
  if (!editorial) notFound();
  const index = allEditorials.findIndex((item) => item.slug === editorial.slug);
  const previous = allEditorials[(index - 1 + allEditorials.length) % allEditorials.length];
  const next = allEditorials[(index + 1) % allEditorials.length];
  const paragraphs = editorialBody(editorial);
  const isLucy =
    editorial.slug === 'manzanillo-part-i-nothing-beyond-the-horizon' ||
    editorial.model?.trim().toLowerCase() === 'lucy';
  const gallery = editorial.gallery || [];
  const openingCount = gallery.length ? Math.min(2, paragraphs.length) : paragraphs.length;
  const storyOpening = paragraphs.slice(0, openingCount).map((text, index) => ({ text, index }));
  let paragraphCursor = openingCount;
  const storyBeats = gallery.map((photo, photoIndex) => {
    const beatsRemaining = gallery.length - photoIndex;
    const paragraphsInBeat = Math.ceil((paragraphs.length - paragraphCursor) / beatsRemaining);
    const text = paragraphs
      .slice(paragraphCursor, paragraphCursor + paragraphsInBeat)
      .map((paragraph, offset) => ({ text: paragraph, index: paragraphCursor + offset }));
    paragraphCursor += text.length;
    return { photo, photoIndex, text };
  });

  return (
    <PageShell>
      <main className={`editorial-story-page editorial-story-layout-${index % 4}${isLucy ? ' editorial-story-lucy' : ''}`}>
        {isLucy ? (
          <>
            <figure className="editorial-flow-hero">
              <img src={editorial.image} alt={`${editorial.model} on the Manzanillo shoreline`} />
              <figcaption>IMPURA VIDA <span>·</span> EDITORIAL {String(index + 1).padStart(2, '0')}</figcaption>
            </figure>
            <header className="editorial-flow-heading">
              <p className="eyebrow">{editorial.location} <span>·</span> EDITORIAL</p>
              <h1>{editorial.title}</h1>
              <p className="editorial-story-deck">{editorial.cardDescription}</p>
            </header>
            <section className="editorial-flow-story" aria-label="The story">
              <div className="editorial-flow-copy editorial-story-paragraphs">
                {storyOpening.map(({ text, index }) => <p className={index === paragraphs.length - 1 ? 'editorial-story-ending' : undefined} key={`opening-${index}`}>{text}</p>)}
              </div>
              {storyBeats.map(({ photo, photoIndex, text }) => (
                <div className={`editorial-flow-beat editorial-flow-beat-${photoIndex}`} key={photo.id || photo.src}>
                  <figure className={`editorial-flow-photo editorial-flow-photo-${photoIndex}`}>
                    <img src={photo.src} alt={photo.alt} />
                  </figure>
                  <div className="editorial-flow-copy editorial-story-paragraphs">
                    {text.map(({ text: paragraph, index }) => <p className={index === paragraphs.length - 1 ? 'editorial-story-ending' : undefined} key={`beat-${photoIndex}-${index}`}>{paragraph}</p>)}
                  </div>
                </div>
              ))}
            </section>
          </>
        ) : (
          <>
            <section className="editorial-story-hero">
              <figure className="editorial-story-art">
                <Image
                  alt={`${editorial.title} — public editorial story`}
                  className="editorial-story-photo"
                  fill
                  priority
                  sizes="(max-width: 760px) 100vw, (max-width: 1200px) 55vw, 760px"
                  src={editorial.image}
                />
                <figcaption>IMPURA VIDA <span>·</span> EDITORIAL {String(index + 1).padStart(2, '0')}</figcaption>
              </figure>
              <header className="editorial-story-heading">
                <p className="eyebrow">{editorial.location} <span>·</span> EDITORIAL</p>
                <h1>{editorial.title}</h1>
                <p className="editorial-story-deck">{editorial.cardDescription}</p>
              </header>
            </section>
            <section className="editorial-story-body">
              <div className="editorial-story-copy">
                <p className="editorial-story-label">THE STORY</p>
                <div className="editorial-story-paragraphs">
                  {paragraphs.map((paragraph, paragraphIndex) => (
                    <p className={paragraphIndex === paragraphs.length - 1 ? 'editorial-story-ending' : undefined} key={`${paragraphIndex}-${paragraph.slice(0, 24)}`}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
        <section className={`editorial-story-body${isLucy ? ' editorial-story-body-credits' : ''}`}>
          <div className="editorial-story-byline" aria-label="Editorial credits">
            {editorial.model && <p><span>FEATURING</span>{editorial.model}</p>}
            {editorial.photographer && <p><span>PHOTOGRAPHY</span>{editorial.photographer}</p>}
            {editorial.date && <p><span>RELEASE</span>{editorial.date}</p>}
            <p><span>LOCATION</span>{editorial.location}</p>
          </div>
          <div className="pager">
            <Link className="under-link" href={`/editorials/${previous.slug}`}>
              PREVIOUS · {previous.title}
            </Link>
            <Link className="under-link" href={`/editorials/${next.slug}`}>
              NEXT · {next.title}
            </Link>
          </div>
        </section>
        {!isLucy && editorial.gallery?.length ? (
          <section className="editorial-story-gallery" aria-label={`${editorial.model} editorial photographs`}>
            {editorial.gallery.map((photo, photoIndex) => (
              <figure className={`editorial-story-gallery-item editorial-story-gallery-item-${photoIndex % 3}`} key={photo.id || photo.src}>
                <Image alt={photo.alt} fill sizes="(max-width: 760px) 100vw, 50vw" src={photo.src} />
                <figcaption>{String(photoIndex + 2).padStart(2, '0')} <span>·</span> {photo.alt}</figcaption>
              </figure>
            ))}
          </section>
        ) : null}
      </main>
    </PageShell>
  );
}
