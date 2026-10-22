import Link from 'next/link';
import { PageShell } from '@/components/site/PageShell';
import { models } from '@/lib/content';

export default function ModelsPage() {
  return (
    <PageShell>
      <main className="models-page">
        <section className="archive-hero">
          <p className="eyebrow">THE WOMEN OF IMPURA VIDA</p>
          <h1>Muse</h1>
          <p className="section-copy">
            Portrait-led profiles from the women shaping the IMPURA VIDA visual world.
          </p>
        </section>
        <section className="model-grid">
          {models.map((model) => (
            <Link className="model-card" href={`/models/${model.slug}`} key={model.slug}>
              <img alt={model.name} src={model.image} />
              <div>
                <h3>{model.name}</h3>
                <p>{model.location}</p>
              </div>
            </Link>
          ))}
        </section>
      </main>
    </PageShell>
  );
}
