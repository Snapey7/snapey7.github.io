import Link from 'next/link';
import { LockKeyhole } from 'lucide-react';
import { PageShell } from '@/components/site/PageShell';
import { destinations } from '@/lib/destinations';

export default function CostaRicaDestinationsPage() {
  return (
    <PageShell>
      <main>
        <section className="destinations-page">
          <header className="destinations-heading">
            <p className="eyebrow">EXPLORE THE EXTRAORDINARY</p>
            <h1>Beyond the Ordinary</h1>
            <p>Six corners of Costa Rica. A thousand ways to lose yourself.</p>
          </header>
          <div className="destination-grid">
            {destinations.map((destination) => (
              <Link
                className="destination-card"
                href="/members"
                key={destination.name}
              >
                <img
                  alt={`${destination.name}, Costa Rica`}
                  src={destination.image}
                  style={{ objectPosition: destination.position }}
                />
                <span className="destination-lock">
                  <LockKeyhole aria-hidden="true" size={10} />
                  MEMBERS ONLY
                </span>
                <span className="destination-name">
                  <strong>{destination.name}</strong>
                  <small>COSTA RICA</small>
                  <i aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
          <footer className="destinations-cta">
            <p>The wild has a way of finding you.</p>
            <Link className="outline-cta" href="/members">
              DISCOVER YOUR ESCAPE
            </Link>
          </footer>
        </section>
      </main>
    </PageShell>
  );
}
