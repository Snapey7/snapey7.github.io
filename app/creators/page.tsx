import Link from 'next/link';
import { PageShell } from '@/components/site/PageShell';
import { editorials } from '@/lib/content';

export default function CreatorsPage() {
  const featured = editorials.slice(0, 3);
  return <PageShell><main className="creators-page">
    <section className="creators-hero">
      <p className="eyebrow">IMPURA VIDA · CREATIVE COMMUNITY</p>
      <h1>Make something<br /><em>worth feeling.</em></h1>
      <p>A place for photographers, models, artists and storytellers drawn to bold ideas and beautiful imagery.</p>
      <div className="creators-actions"><Link className="outline-cta" href="/login">JOIN THE COMMUNITY</Link><a className="creators-text-link" href="#explore">EXPLORE THE WORK ↓</a></div>
    </section>
    <section className="creators-intro"><p className="eyebrow">A WORLD BUILT TOGETHER</p><h2>For the ones who create.</h2><p>We’re building a space for creative voices, original perspectives and collaborations that deserve to be seen. Explore the stories already shaping our world, and join us as the community grows.</p></section>
    <section className="creators-work" id="explore"><div className="creators-section-heading"><div><p className="eyebrow">DISCOVER</p><h2>Stories from our world</h2></div><Link href="/editorials">VIEW ALL EDITORIALS →</Link></div><div className="creators-grid">{featured.map(story => <Link href={`/editorials/${story.slug}`} className="creators-card" key={story.slug}><img src={story.image} alt="" /><div><span>{story.location} · {story.photographer}</span><h3>{story.title}</h3><p>{story.cardDescription}</p></div></Link>)}</div></section>
    <section className="creators-invite"><p className="eyebrow">COME CREATE WITH US</p><h2>Your vision belongs here.</h2><p>Join the Impura Vida community and discover a world of independent creativity.</p><Link className="outline-cta" href="/login">CREATE YOUR ACCOUNT</Link></section>
  </main></PageShell>;
}
