import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/site/PageShell';
import { editorials } from '@/lib/content';

type EditorialPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return editorials.map((editorial) => ({ slug: editorial.slug }));
}

export async function generateMetadata({ params }: EditorialPageProps) {
  const { slug } = await params;
  const editorial = editorials.find((item) => item.slug === slug);
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

export default async function EditorialDetailPage({ params }: EditorialPageProps) {
  const { slug } = await params;
  const editorial = editorials.find((item) => item.slug === slug);
  if (!editorial) notFound();
  const index = editorials.findIndex((item) => item.slug === editorial.slug);
  const previous = editorials[(index - 1 + editorials.length) % editorials.length];
  const next = editorials[(index + 1) % editorials.length];

  return (
    <PageShell>
      <main className={`editorial-story-page editorial-story-layout-${index % 4}`}>
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
            <p className="detail-intro">{editorial.intro}</p>
          </div>
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
      </main>
    </PageShell>
  );
}
