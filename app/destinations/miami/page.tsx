import { PageShell } from '@/components/site/PageShell';
import { MuseGrid } from '@/components/site/MuseGrid';
import { models } from '@/lib/content';

export default function MiamiMusesPage() {
  return <PageShell>
    <main className="models-page">
      <header className="archive-hero">
        <p className="eyebrow">THE WOMEN OF IMPURA VIDA</p>
        <h1>Miami</h1>
        <p className="section-copy">Explore the muses of Miami.</p>
      </header>
      <MuseGrid muses={models.filter(model => model.location === 'Miami')} />
    </main>
  </PageShell>;
}
