import Link from 'next/link';
import { LockKeyhole } from 'lucide-react';
import { PageShell } from '@/components/site/PageShell';
import { models } from '@/lib/content';

const upcomingMuses = ['New muse', 'New muse', 'New muse'];

function MuseDetails({ name, location }: { name: string; location: string }) {
  return (
    <div className="muse-hover-details">
      <span className="muse-unlock"><LockKeyhole aria-hidden="true" /> UNLOCK</span>
      <span className="muse-person">{name} | {location}</span>
      <span className="muse-meta">GALLERY <i>·</i> IMPURA | EXCLUSIVE PHOTOS</span>
    </div>
  );
}

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
              <MuseDetails name={model.name} location={model.location} />
            </Link>
          ))}
          {upcomingMuses.map((name, index) => (
            <article className="model-card model-card-upcoming" key={`${name}-${index}`}>
              <div className="muse-upcoming-label">MORE MUSES<br />COMING SOON</div>
              <MuseDetails name="New muse" location="Coming soon" />
            </article>
          ))}
        </section>
      </main>
    </PageShell>
  );
}
