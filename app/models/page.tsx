import Link from 'next/link';
import { PageShell } from '@/components/site/PageShell';
import { models } from '@/lib/content';

export default function ModelsPage() {
  return (
    <PageShell>
      <main className="models-page">
        <section className="archive-hero">
          <p className="eyebrow">THE WOMEN OF IMPURA VIDA</p>
          <p className="section-copy">
            Unlock more from the women shaping the IMPURA VIDA visual world.
          </p>
        </section>
        <nav className="muse-categories" aria-label="Muse categories">
          <Link href="#impura">IMPURA</Link>
          <Link href="#behind-the-scenes">BEHIND THE SCENES</Link>
          <Link href="#interviews">INTERVIEWS</Link>
        </nav>
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
