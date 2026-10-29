import Image from 'next/image';
import Link from 'next/link';
import { Hero } from '@/components/site/Hero';
import { ImpactSection } from '@/components/site/ImpactSection';
import { MembershipSection } from '@/components/site/MembershipSection';
import { PageShell } from '@/components/site/PageShell';
import { SectionHeading } from '@/components/site/SectionHeading';
import { models } from '@/lib/content';

const latestStoryMuses = ['ana', 'cynthia', 'lucy', 'angie']
  .map((slug) => models.find((model) => model.slug === slug))
  .filter((model): model is (typeof models)[number] => Boolean(model));

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
            {latestStoryMuses.map((model) => (
              <Link
                className="editorial-card group"
                href={`/models/${model.slug}`}
                key={model.slug}
              >
                <Image
                  alt={`${model.name} — ${model.location}`}
                  className="object-cover transition duration-700 group-hover:scale-[1.045]"
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  src={model.image}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/5 to-black/75" />
                <div className="absolute inset-0 border border-white/10 transition duration-500 group-hover:border-coral/45 group-hover:shadow-[0_0_28px_rgba(255,99,105,0.16)]" />
                <span className="featured-editorial-gallery-label">GALLERY</span>
                <div className="absolute inset-x-0 bottom-0 px-5 pb-5 text-center transition duration-500 group-hover:-translate-y-1">
                  <h3 className="font-serif text-[1.03rem] uppercase tracking-[0.03em] text-ivory">
                    {model.name}
                  </h3>
                </div>
              </Link>
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
