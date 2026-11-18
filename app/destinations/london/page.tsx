import Link from 'next/link';
import { PageShell } from '@/components/site/PageShell';

const londonPlaces = [
  {
    name: 'Soho',
    theme: 'Sin & Neon',
    image: '/assets/london-soho.jpg',
  },
  {
    name: 'Mayfair',
    theme: 'Luxury & Desire',
    image: '/assets/london-mayfair.jpg',
  },
  {
    name: 'The City',
    theme: 'Power & Pleasure',
    image: '/assets/london-city.jpg',
  },
  {
    name: 'Hampstead',
    theme: 'Private Affairs',
    image: '/assets/london-hampstead.jpg',
  },
  {
    name: 'Shoreditch',
    theme: 'Rebellion & Freedom',
    image: '/assets/london-shoreditch.jpg',
  },
  {
    name: 'Richmond',
    theme: 'Escape & Romance',
    image: '/assets/london-richmond.jpg',
  },
];

export default function LondonDestinationsPage() {
  return (
    <PageShell>
      <main>
        <section className="destinations-page london-destinations-page">
          <header className="destinations-heading london-destinations-heading">
            <p className="eyebrow">EXPLORE THE EXTRAORDINARY</p>
            <h1>LONDON AFTER DARK</h1>
            <p>
              A city of hidden doors, whispered encounters and unforgettable nights.
              <br />
              Six sides of London, each with its own temptation.
            </p>
          </header>
          <div className="destination-grid london-destination-grid">
            {londonPlaces.map((place) => (
              <article className="destination-card london-destination-card" key={place.name}>
                <img alt={`${place.name}, London`} src={place.image} />
                <span className="destination-lock">COMING SOON</span>
                <span className="destination-name london-destination-name"><strong>{place.name}</strong><small>{place.theme}</small><i aria-hidden="true" /></span>
              </article>
            ))}
          </div>
          <footer className="destinations-cta london-destinations-cta">
            <p>More stories from London are coming soon.</p>
            <Link className="outline-cta" href="/destinations/uk">
              EXPLORE UK DESTINATIONS
            </Link>
          </footer>
        </section>
      </main>
    </PageShell>
  );
}
