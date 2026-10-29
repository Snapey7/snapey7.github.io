import Link from 'next/link';
import { PageShell } from '@/components/site/PageShell';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStripePriceLabel, isPhysicalShopCheckoutReady } from '@/lib/billing/stripe';
import { beginShopProductCheckout } from '@/app/actions/auth';

export const dynamic = 'force-dynamic';

export default async function ShopPage() {
  const { data: products } = await createAdminClient().from('shop_products')
    .select('id,title,description,stripe_price_id,status,shop_product_images(id,storage_path,alt_text,position)')
    .in('status', ['published', 'coming_soon']).order('created_at');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  const items = await Promise.all((products || []).map(async (product, index) => ({
    product,
    images: [...(product.shop_product_images || [])].sort((a, b) => a.position - b.position),
    priceLabel: product.status === 'published' ? await getStripePriceLabel(product.stripe_price_id) : null,
    coverPosition: index === 0 ? 'shop-cover-costa-rica' : 'shop-cover-after-dark',
    href: index === 0 ? '/destinations/costa-rica' : '/editorials',
  })));
  const showComingSoonEdition = !items.some(({ product }) => /edition\s*0?2/i.test(product.title));
  const checkoutReady = isPhysicalShopCheckoutReady();
  return (
    <PageShell>
      <main className="shop-page">
        <section aria-labelledby="shop-title" className="shop-content">
          <header className="shop-heading">
            <h1 id="shop-title">SHOP</h1>
            <p>Objects, editions &amp; pieces from the Impura Vida world.</p>
          </header>

          <div className="shop-editions">
            {items.map(({ product, images, priceLabel, coverPosition, href }) => {
              const firstImage = images[0];
              const firstImageUrl = firstImage && supabaseUrl
                ? `${supabaseUrl}/storage/v1/object/public/shop-product-images/${firstImage.storage_path.split('/').map(encodeURIComponent).join('/')}`
                : null;
              return <article className="shop-edition" key={product.id}>
                <div aria-label={`${product.title} product photo`} className={`shop-cover ${coverPosition}${firstImageUrl ? ' shop-cover-product' : ''}`} role="img">
                  {firstImageUrl && <img alt={firstImage.alt_text} src={firstImageUrl} />}
                </div>
                <h2>{product.title}</h2>
                {product.description && <p className="shop-product-description">{product.description}</p>}
                {images.length > 1 && supabaseUrl && <div aria-label={`${product.title} product photos`} className="shop-product-gallery">
                  {images.slice(1).map((image) => <img alt={image.alt_text} key={image.id}
                    src={`${supabaseUrl}/storage/v1/object/public/shop-product-images/${image.storage_path.split('/').map(encodeURIComponent).join('/')}`} />)}
                </div>}
                {product.status === 'coming_soon' ? (
                  <p className="shop-price">COMING SOON</p>
                ) : <>
                  <p className="shop-price">{priceLabel || 'Price at checkout'}</p>
                  <form action={beginShopProductCheckout}>
                    <input name="productId" type="hidden" value={product.id} />
                    <button className="shop-edition-link" disabled={!checkoutReady} type="submit">BUY NOW <span aria-hidden="true">→</span></button>
                  </form>
                  {!checkoutReady && <p className="shop-shipping-note">Checkout opens once shipping regions and rates are set up.</p>}
                </>}
                <Link className="shop-edition-link" href={href}>VIEW DETAILS <span aria-hidden="true">→</span></Link>
              </article>;
            })}
            {showComingSoonEdition && <article className="shop-edition">
              <div aria-label="Edition 02 — After Dark magazine cover" className="shop-cover shop-cover-after-dark" role="img" />
              <h2>Edition 02 — After Dark</h2>
              <p className="shop-price">COMING SOON</p>
              <Link className="shop-edition-link" href="/editorials">VIEW EDITION <span aria-hidden="true">→</span></Link>
            </article>}
          </div>
        </section>
      </main>
    </PageShell>
  );
}
