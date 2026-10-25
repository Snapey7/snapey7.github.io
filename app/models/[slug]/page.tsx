import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { PageShell } from '@/components/site/PageShell';
import { models } from '@/lib/content';

type ModelPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return models.map((model) => ({ slug: model.slug }));
}

export default async function ModelDetailPage({ params }: ModelPageProps) {
  const { slug } = await params;
  const model = models.find((item) => item.slug === slug);
  if (!model) notFound();

  return (
    <PageShell>
      <main className="model-entry-page">
        <section className="model-entry-layout" aria-label={`${model.name} gallery` }>
          <div className="model-entry-copy">
            <h1>{model.name} | {model.location}</h1>
            <p className="model-entry-meta">GALLERY <span>·</span> IMPURA | EXCLUSIVE PHOTOS</p>
            <Link className="model-entry-cta" href="/members">Get Full Access</Link>
          </div>
          <div className="model-entry-image">
            <Image alt={`${model.name} — ${model.location}`} src={model.image} fill priority sizes="(max-width: 700px) 90vw, 420px" />
          </div>
        </section>
      </main>
    </PageShell>
  );
}
