import Link from 'next/link';
import { EditorialCard } from '@/components/site/EditorialCard';
import { Hero } from '@/components/site/Hero';
import { ImpactSection } from '@/components/site/ImpactSection';
import { MembershipSection } from '@/components/site/MembershipSection';
import { PageShell } from '@/components/site/PageShell';
import { SectionHeading } from '@/components/site/SectionHeading';
import { editorials } from '@/lib/content';

export default function Home() {
  return (
    <PageShell>
      <main>
        <Hero />

        <section className="editorials-section">
          <div className="palm-shadow left" />
          <div className="palm-shadow right" />
          <SectionHeading
            eyebrow="FEATURED EDITORIALS"
            link={{ label: 'VIEW ALL EDITORIALS', href: '/editorials' }}
            title="The Latest Stories"
          />
          <div className="editorial-grid">
            {editorials.map((editorial) => (
              <EditorialCard editorial={editorial} key={editorial.slug} />
            ))}
          </div>
          <div className="transition-cta">
            <p>Ready to see the poetry?</p>
            <Link className="outline-cta compact" href="/members">
              JOIN THE EXPERIENCE
            </Link>
          </div>
        </section>

        <MembershipSection />
        <ImpactSection />
      </main>
    </PageShell>
  );
}
