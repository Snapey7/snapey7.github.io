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
            <p>Stories and places from {name} are coming soon.</p>
          </header>
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
