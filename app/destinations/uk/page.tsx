import Link from 'next/link';
import { PageShell } from '@/components/site/PageShell';

export default function UkDestinationsPage() {
  return <PageShell><main><section className="destinations-page london-destinations-page">
    <header className="destinations-heading"><p className="eyebrow">EXPLORE THE EXTRAORDINARY</p><h1>UK DESTINATIONS</h1><p>Discover the places and stories that shape our world.</p></header>
    <div className="destination-grid"><Link className="destination-card" href="/destinations/london"><img src="/assets/london-background.png" alt="London skyline illuminated at night" /><span className="destination-name"><strong>LONDON</strong><small>UNITED KINGDOM</small><i aria-hidden="true" /></span></Link></div>
    <footer className="destinations-cta"><Link className="outline-cta" href="/destinations">EXPLORE ALL DESTINATIONS</Link></footer>
  </section></main></PageShell>;
}
