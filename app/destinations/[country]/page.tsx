import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/site/PageShell';

const countries = {
  usa: 'USA',
  spain: 'SPAIN',
  italy: 'ITALY',
  france: 'FRANCE',
} as const;

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(countries).map((country) => ({ country }));
}

export default async function CountryDestinationsPage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country } = await params;
  const name = countries[country as keyof typeof countries];

  if (!name) notFound();

  return (
    <PageShell>
      <main>
        <section className="destinations-page">
          <header className="destinations-heading">
            <p className="eyebrow">EXPLORE THE EXTRAORDINARY</p>
            <h1>{name} DESTINATIONS</h1>
            <p>{country === 'usa' ? 'Explore our muses and stories from the USA.' : `Stories and places from ${name} are coming soon.`}</p>
          </header>
          {country === 'usa' && <div className="destination-grid">
            <Link className="destination-card" href="/destinations/miami">
              <img alt="Miami skyline glowing with pink and turquoise neon above the waterfront" src="/assets/miami-neon-city.jpg" />
              <span className="destination-name"><strong>MIAMI</strong><small>USA</small><i aria-hidden="true" /></span>
            </Link>
          </div>}
          <footer className="destinations-cta">
            <Link className="outline-cta" href="/destinations">
              EXPLORE ALL DESTINATIONS
            </Link>
          </footer>
        </section>
      </main>
    </PageShell>
  );
}
