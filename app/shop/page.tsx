import Link from 'next/link';
import { PageShell } from '@/components/site/PageShell';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStripePriceLabel, isStripeOneTimeCheckoutReady } from '@/lib/billing/stripe';
import { beginCatalogueCheckout } from '@/app/actions/auth';

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

export const dynamic = 'force-dynamic';

export default async function ShopPage() {
  const { data: edition } = await createAdminClient().from('catalogues')
    .select('id,title,stripe_price_id,status').eq('product_type', 'magazine_edition').maybeSingle();
  const priceLabel = edition?.status === 'published' ? await getStripePriceLabel(edition.stripe_price_id) : null;
  return (
    <PageShell>
      <main className="shop-page">
        <section aria-labelledby="shop-title" className="shop-content">
          <header className="shop-heading">
            <h1 id="shop-title">SHOP</h1>
            <p>Objects, editions &amp; pieces from the Impura Vida world.</p>
          </header>

          <div className="shop-editions">
            {editions.map((item) => {
              const isEditionOne = item.number === '01';
              const canBuy = Boolean(isEditionOne && edition?.status === 'published');
              return <article className="shop-edition" key={item.number}>
                <div aria-label={`${item.title} magazine cover`} className={`shop-cover ${item.coverPosition}`} role="img" />
                <h2>{item.title}</h2>
                <p className="shop-price">{canBuy ? priceLabel || 'Price at checkout' : 'COMING SOON'}</p>
                {canBuy && <form action={beginCatalogueCheckout}>
                  <input name="catalogueId" type="hidden" value={edition?.id ?? ''} />
                  <button className="shop-edition-link" disabled={!isStripeOneTimeCheckoutReady()} type="submit">BUY EDITION <span aria-hidden="true">→</span></button>
                </form>}
                <Link className="shop-edition-link" href={item.href}>
                  VIEW EDITION <span aria-hidden="true">→</span>
                </Link>
              </article>;
            })}
          </div>
        </section>
      </main>
    </PageShell>
  );
}
