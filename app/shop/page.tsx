import Link from 'next/link';
import { PageShell } from '@/components/site/PageShell';

const editions = [
  {
    number: '01',
    title: 'Edition 01 — Costa Rica',
    href: '/destinations/costa-rica',
    coverPosition: 'shop-cover-costa-rica',
  },
  {
    number: '02',
    title: 'Edition 02 — After Dark',
    href: '/editorials',
    coverPosition: 'shop-cover-after-dark',
  },
];

export default function ShopPage() {
  return (
    <PageShell>
      <main className="shop-page">
        <section aria-labelledby="shop-title" className="shop-content">
          <header className="shop-heading">
            <h1 id="shop-title">SHOP</h1>
            <p>Objects, editions &amp; pieces from the Impura Vida world.</p>
          </header>

          <div className="shop-editions">
            {editions.map((edition) => (
              <article className="shop-edition" key={edition.number}>
                <div
                  aria-label={`${edition.title} magazine cover`}
                  className={`shop-cover ${edition.coverPosition}`}
                  role="img"
                />
                <h2>{edition.title}</h2>
                <p className="shop-price">$500</p>
                <Link className="shop-edition-link" href={edition.href}>
                  VIEW EDITION <span aria-hidden="true">→</span>
                </Link>
              </article>
            ))}
          </div>
        </section>
      </main>
    </PageShell>
  );
}
