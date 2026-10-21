import { notFound } from 'next/navigation';
import { EditorialCard } from '@/components/site/EditorialCard';
import { PageShell } from '@/components/site/PageShell';
import { editorials, models } from '@/lib/content';

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
  const related = editorials.filter((editorial) =>
    editorial.model.toLowerCase().includes(model.name.split(' ')[0].toLowerCase()),
  );

  return (
    <PageShell>
      <main>
        <section
          className="detail-hero"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.16), #030303), url(${model.image})`,
          }}
        >
          <div className="detail-hero-inner">
            <p className="eyebrow">{model.location}</p>
            <h1>{model.name}</h1>
          </div>
        </section>
        <section className="detail-body">
          <p className="detail-intro">{model.bio}</p>
          <div className="editorial-grid">
            {(related.length ? related : editorials.slice(0, 4)).map((editorial) => (
              <EditorialCard editorial={editorial} key={editorial.slug} />
            ))}
          </div>
        </section>
      </main>
    </PageShell>
  );
}
