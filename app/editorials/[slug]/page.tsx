import Link from 'next/link';
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
      <main>
        <section
          className="detail-hero"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.12), #030303), url(${editorial.image})`,
          }}
        >
          <div className="detail-hero-inner">
            <p className="eyebrow">{editorial.location}</p>
            <h1>{editorial.title}</h1>
            <div className="detail-meta">
              {editorial.model && <span>{editorial.model}</span>}
              {editorial.photographer && <span>{editorial.photographer}</span>}
              {editorial.date && <span>{editorial.date}</span>}
            </div>
          </div>
        </section>
        <section className="detail-body">
          <p className="detail-intro">{editorial.intro}</p>
          <p>{editorial.cardDescription}</p>
          <figure className="editorial-story-image">
            <img alt={`${editorial.title} — public editorial story`} src={editorial.image} />
          </figure>
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
