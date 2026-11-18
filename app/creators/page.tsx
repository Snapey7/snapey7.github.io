import Link from 'next/link';
import { PageShell } from '@/components/site/PageShell';
import { editorials } from '@/lib/content';

export default function CreatorsPage() {
  const featured = editorials.slice(0, 3);
  const gallery = editorials.slice(0, 4);
  const questions = [
    ['Who can apply?', 'Photographers, models, artists, filmmakers, stylists and other visual storytellers are welcome to apply. We review each portfolio personally.'],
    ['How do I join?', 'Create an account and send us a portfolio or Instagram link. We will review your application and contact you by email. Applying is free.'],
    ['What does it cost?', 'The joining fee is a one-time £5 or $5 after approval. There is no fee to apply and no recurring creator membership fee.'],
    ['Can I sell my work?', 'Creator sales are coming soon. Our proposed commission is 20% per eligible sale; payment, payout and content terms will be confirmed before sales open.'],
    ['Will my work appear automatically?', 'No. Impura Vida reviews creators and individual submissions before anything is featured or published.'],
    ['What can I submit?', 'We welcome original creative work you have the rights and consent to share. Content must meet our editorial standards and payment-provider requirements. Submission tools and full guidelines are coming soon.'],
  ];
  return <PageShell><main className="creators-page">
    <div className="creators-masthead"><div><p>IMPURA VIDA</p><h2>Creators</h2><span>Original work from our creative community</span></div></div>
    <section className="creators-hero">
      <p className="eyebrow">IMPURA VIDA · CREATIVE COMMUNITY</p>
      <h1>Make something<br /><em>worth feeling.</em></h1>
      <p>A place for photographers, models, artists and storytellers drawn to bold ideas and beautiful imagery.</p>
      <div className="creators-actions"><Link className="outline-cta" href="/creators/apply">APPLY TO JOIN</Link><a className="creators-text-link" href="#explore">EXPLORE THE WORK ↓</a></div>
    </section>
    <section className="creators-visuals" aria-label="Explore Impura Vida editorial work"><div className="creators-visuals-grid">{gallery.map(story => <Link href={`/editorials/${story.slug}`} className="creators-visual" key={story.slug}><img src={story.image} alt={story.title} /><span>{story.location} · {story.title}</span></Link>)}</div><p>Discover stories from the Impura Vida archive.</p></section>
    <section className="creators-intro"><p className="eyebrow">A WORLD BUILT TOGETHER</p><h2>For the ones who create.</h2><p>We’re building a space for creative voices, original perspectives and collaborations that deserve to be seen. Explore the stories already shaping our world, and join us as the community grows.</p></section>
    <section className="creators-benefits" aria-labelledby="creators-benefits-heading"><p className="eyebrow">MADE FOR CREATIVE PEOPLE</p><h2 id="creators-benefits-heading">Create. Connect. Be seen.</h2><p>A considered space for the people behind the work.</p><div className="creators-benefits-grid"><article><span>01</span><h3>Share your vision</h3><p>Bring your perspective to a growing community of independent creatives and visual storytellers.</p></article><article><span>02</span><h3>Curated with care</h3><p>We review every application and submission, keeping the focus on considered work and meaningful collaboration.</p></article><article><span>03</span><h3>Grow together</h3><p>Meet a community that values creativity and explore opportunities to feature your work as Impura Vida grows.</p></article></div></section>
    <section className="creators-offer" aria-labelledby="creator-offer-title"><div><p className="eyebrow">CREATE WITH IMPURA VIDA</p><h2 id="creator-offer-title">Your work.<br /><em>Our community.</em></h2><p>Connect with an independent creative community and share your vision with an audience that appreciates original work.</p><p>Apply with your portfolio for a personal review. If approved, the one-time joining fee is £5 or $5; there is no fee to apply.</p></div><div className="creators-offer-terms"><div><span>JOINING FEE · AFTER APPROVAL</span><strong>£5 / $5</strong><p>One-time joining fee after approval, with no recurring creator membership fee.</p></div><div><span>FUTURE CREATOR SALES</span><strong>20%</strong><p>Impura Vida commission on each eligible creator sale. Creator sales are coming soon; payment and content terms will be confirmed before launch.</p></div></div></section>
    <section className="creators-work" id="explore"><div className="creators-section-heading"><div><p className="eyebrow">DISCOVER</p><h2>Stories from our world</h2></div><Link href="/editorials">VIEW ALL EDITORIALS →</Link></div><div className="creators-grid">{featured.map(story => <Link href={`/editorials/${story.slug}`} className="creators-card" key={story.slug}><img src={story.image} alt="" /><div><span>{story.location} · {story.photographer}</span><h3>{story.title}</h3><p>{story.cardDescription}</p></div></Link>)}</div></section>
    <section className="creators-faq" aria-labelledby="creators-faq-heading"><p className="eyebrow">THE DETAILS</p><h2 id="creators-faq-heading">Your questions, answered.</h2><div className="creators-faq-list">{questions.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></section>
    <section className="creators-invite"><p className="eyebrow">COME CREATE WITH US</p><h2>Your vision belongs here.</h2><p>Join the Impura Vida community and discover a world of independent creativity.</p><Link className="outline-cta" href="/creators/apply">APPLY TO JOIN</Link></section>
  </main></PageShell>;
}
