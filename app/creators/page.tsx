import Link from 'next/link';
import { PageShell } from '@/components/site/PageShell';
import { editorials } from '@/lib/content';

export default function CreatorsPage() {
  const featured = editorials.slice(0, 3);
  return <PageShell><main className="creators-page">
    <div className="creators-masthead"><div><p>IMPURA VIDA</p><h2>Creators</h2><span>Original work from our creative community</span></div></div>
    <section className="creators-hero">
      <p className="eyebrow">IMPURA VIDA · CREATIVE COMMUNITY</p>
      <h1>Make something<br /><em>worth feeling.</em></h1>
      <p>A place for photographers, models, artists and storytellers drawn to bold ideas and beautiful imagery.</p>
      <div className="creators-actions"><Link className="outline-cta" href="/creators/apply">APPLY TO JOIN</Link><a className="creators-text-link" href="#explore">EXPLORE THE WORK ↓</a></div>
    </section>
    <section className="creators-intro"><p className="eyebrow">A WORLD BUILT TOGETHER</p><h2>For the ones who create.</h2><p>We’re building a space for creative voices, original perspectives and collaborations that deserve to be seen. Explore the stories already shaping our world, and join us as the community grows.</p></section>
    <section className="creators-offer" aria-labelledby="creator-offer-title"><div><p className="eyebrow">CREATE WITH IMPURA VIDA</p><h2 id="creator-offer-title">Your work.<br /><em>Our community.</em></h2><p>Connect with an independent creative community and share your vision with an audience that appreciates original work.</p><p>Apply with your portfolio for a personal review. If approved, the one-time joining fee is $5; there is no fee to apply.</p></div><div className="creators-offer-terms"><div><span>JOINING FEE · AFTER APPROVAL</span><strong>$5</strong><p>One-time joining fee, with no recurring creator membership fee. Joining payments are coming soon.</p></div><div><span>FUTURE CREATOR SALES</span><strong>20%</strong><p>Impura Vida commission on each eligible creator sale. Creator sales are coming soon; payment and content terms will be confirmed before launch.</p></div></div></section>
    <section className="creators-work" id="explore"><div className="creators-section-heading"><div><p className="eyebrow">DISCOVER</p><h2>Stories from our world</h2></div><Link href="/editorials">VIEW ALL EDITORIALS →</Link></div><div className="creators-grid">{featured.map(story => <Link href={`/editorials/${story.slug}`} className="creators-card" key={story.slug}><img src={story.image} alt="" /><div><span>{story.location} · {story.photographer}</span><h3>{story.title}</h3><p>{story.cardDescription}</p></div></Link>)}</div></section>
    <section className="creators-invite"><p className="eyebrow">COME CREATE WITH US</p><h2>Your vision belongs here.</h2><p>Join the Impura Vida community and discover a world of independent creativity.</p><Link className="outline-cta" href="/creators/apply">APPLY TO JOIN</Link></section>
  </main></PageShell>;
}
