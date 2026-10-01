import { EditorialCard } from '@/components/site/EditorialCard';
import { PageShell } from '@/components/site/PageShell';
import { editorials } from '@/lib/content';

export default function EditorialsPage() {
  return (
    <PageShell>
      <main>
        <section className="archive-hero">
          <p className="eyebrow">LATEST DROPS</p>
          <h1>Inspired Vision</h1>
          <p className="section-copy">
            Creativity's whisper, captured after dark. Here is what members are
            experiencing right now.
          </p>
        </section>
        <section className="archive-grid">
          {editorials.map((editorial) => (
            <EditorialCard editorial={editorial} key={editorial.slug} />
          ))}
        </section>
      </main>
    </PageShell>
  );
}
