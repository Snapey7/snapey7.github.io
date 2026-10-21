import Link from 'next/link';
import { PageShell } from '@/components/site/PageShell';

const londonPlaces = [
  {
    name: 'Westminster',
    theme: 'Power & Pleasure',
    image: '/assets/london-reference-westminster.png',
  },
  {
    name: 'Mayfair',
    theme: 'Luxury & Desire',
    image: '/assets/london-reference-mayfair.png',
  },
  {
    name: 'The City',
    theme: 'Ambition & Excess',
    image: '/assets/london-reference-the-city.png',
  },
  {
    name: 'Notting Hill',
    theme: 'Beauty & Secrets',
    image: '/assets/london-reference-notting-hill.png',
  },
  {
    name: 'Shoreditch',
    theme: 'Nights & Freedom',
    image: '/assets/london-reference-shoreditch.png',
  },
  {
    name: 'Richmond',
    theme: 'Escape & Desire',
    image: '/assets/london-reference-richmond.png',
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
              <Link
                className="destination-card london-destination-card"
                href="/members"
                key={place.name}
              >
                <img
                  alt={`${place.name}, ${place.theme}. Members only.`}
                  src={place.image}
                />
              </Link>
            ))}
          </div>
          <footer className="destinations-cta london-destinations-cta">
            <p>A darker side of the capital awaits.</p>
            <Link className="outline-cta" href="/members">
              DISCOVER YOUR ESCAPE
            </Link>
          </footer>
        </section>
      </main>
    </PageShell>
  );
}
