import { PageShell } from '@/components/site/PageShell';
import { MuseGrid } from '@/components/site/MuseGrid';
import { models } from '@/lib/content';

export default function CostaRicaMusesPage() {
  return <PageShell>
    <main className="models-page">
      <header className="archive-hero">
        <p className="eyebrow">THE WOMEN OF IMPURA VIDA</p>
        <h1>Costa Rica</h1>
        <p className="section-copy">Explore our muses from Santa Teresa and across Costa Rica.</p>
      </header>
      <MuseGrid muses={models.filter(model => model.location !== 'Miami')} />
    </main>
  </PageShell>;
}
