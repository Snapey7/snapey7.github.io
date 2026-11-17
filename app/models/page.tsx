import Link from 'next/link';
import { MuseGrid } from '@/components/site/MuseGrid';
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
        <MuseGrid muses={models} />
      </main>
    </PageShell>
  );
}
