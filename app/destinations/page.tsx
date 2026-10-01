import { EditorialCard } from '@/components/site/EditorialCard';
import { PageShell } from '@/components/site/PageShell';
import { editorials } from '@/lib/content';

export default function DestinationsPage() {
  return (
    <PageShell>
      <main>
        <section className="archive-hero">
          <p className="eyebrow">DESTINATIONS</p>
          <h1>Costa Rica After Dark</h1>
          <p className="section-copy">
            A travel archive of beaches, villas, jungle rooms, and private
            sanctuaries that shape each edition.
          </p>
        </section>
        <section className="archive-grid">
          {editorials.slice(0, 4).map((editorial) => (
            <EditorialCard editorial={editorial} key={editorial.slug} />
          ))}
        </section>
      </main>
    </PageShell>
  );
}
