import { redirect } from 'next/navigation';
import { PageShell } from '@/components/site/PageShell';
import { getContentAdminState } from '@/lib/content-admin';
import { editorials, type Editorial } from '@/lib/content';
import { createAdminClient } from '@/lib/supabase/admin';
import { CatalogueManager } from './CatalogueManager';
import { EditorialManager } from './EditorialManager';
import { ShopProductManager } from './ShopProductManager';

export const dynamic = 'force-dynamic';

export default async function StudioPage() {
  const state = await getContentAdminState();
  if (!state.user) redirect('/login?next=%2Fstudio');

  if (!state.configured) {
    return (
      <PageShell>
        <main className="studio-page">
          <p className="eyebrow">PRIVATE PUBLISHING</p>
          <h1>Enable your content studio</h1>
          <p>Add <code>CONTENT_ADMIN_EMAILS</code> in Vercel with your sign-in email, then redeploy. Only that allowlisted account can upload or publish.</p>
        </main>
      </PageShell>
    );
  }
  if (!state.authorized) redirect('/account?studio=unauthorized');

  let catalogues: {
    id: string;
    title: string;
    description: string;
    product_type: 'model_catalogue' | 'magazine_edition';
    model_slug: string | null;
    status: 'draft' | 'published';
    member_media: { id: string; title: string; alt_text: string; preview_url: string; position: number }[];
  }[] = [];
  let loadError = '';
  let editorialLoadError = '';
  let editorialItems: (Editorial & { status: 'draft' | 'published'; images: { id: string; storage_path: string | null; preview_url: string; alt_text: string }[] })[] = editorials.map((item) => ({
    ...item,
    status: 'published',
    images: [
      { id: `static-${item.slug}`, storage_path: null, preview_url: item.image, alt_text: item.title },
      ...(item.gallery || []).map((photo, index) => ({ id: `static-${item.slug}-${index}`, storage_path: null, preview_url: photo.src, alt_text: photo.alt })),
    ],
  }));
  let shopProducts: {
    id: string;
    title: string;
    description: string;
    status: 'draft' | 'published' | 'coming_soon';
    shop_product_images: { id: string; storage_path: string; alt_text: string; position: number }[];
  }[] = [];
  let shopOrders: {
    id: string;
    status: string;
    created_at: string;
    customer_email: string | null;
    shipping_details: { name?: string; address?: Record<string, string | null> } | null;
    shop_products: { title: string } | null;
  }[] = [];
  try {
    const admin = createAdminClient();
    const { data: storyRows, error: editorialError } = await admin.from('editorial_stories')
      .select('slug,title,location,model,deck,body,photographer,release_date,status,editorial_images(id,storage_path,public_url,alt_text,position)')
      .order('title');
    if (editorialError) {
      editorialLoadError = 'Apply the editorial studio migration in Supabase to manage public stories and photos.';
    } else {
      const bySlug = new Map((storyRows || []).map((row) => [row.slug, row]));
      const allPaths = (storyRows || []).flatMap((row) => (row.editorial_images || [])
        .filter((photo) => photo.storage_path)
        .map((photo) => photo.storage_path as string));
      const { data: signedPhotos } = allPaths.length
        ? await admin.storage.from('editorial-media').createSignedUrls(allPaths, 600)
        : { data: [] };
      const signedUrls = new Map((signedPhotos || []).map((photo) => [photo.path, photo.signedUrl || '']));
      editorialItems = editorials.map((base) => {
        const row = bySlug.get(base.slug);
        if (!row) return { ...base, status: 'published' as const, images: [
          { id: `static-${base.slug}`, storage_path: null, preview_url: base.image, alt_text: base.title },
          ...(base.gallery || []).map((photo, index) => ({ id: `static-${base.slug}-${index}`, storage_path: null, preview_url: photo.src, alt_text: photo.alt })),
        ] };
        return {
          ...base,
          title: row.title,
          location: row.location,
          model: row.model,
          cardDescription: row.deck,
          photographer: row.photographer,
          date: row.release_date,
          body: row.body,
          intro: row.body?.[0] || base.intro,
          status: row.status as 'draft' | 'published',
          images: [...(row.editorial_images || [])].sort((a, b) => a.position - b.position || a.id.localeCompare(b.id)).map((photo) => ({
            id: photo.id,
            storage_path: photo.storage_path,
            preview_url: photo.public_url || (photo.storage_path ? signedUrls.get(photo.storage_path) || '' : ''),
            alt_text: photo.alt_text,
          })),
        };
      });
    }
    const { data, error } = await admin.from('catalogues')
      .select('id,title,description,product_type,model_slug,status,member_media(id,title,alt_text,bucket,storage_path,position)')
      .order('product_type').order('title');
    if (error) loadError = 'Apply the catalogue publishing migration in Supabase to finish connecting the content studio.';
    else {
      const privateCatalogues = (data || []).filter((item) => item.product_type !== 'physical_shop');
      const photoPaths = privateCatalogues.flatMap((item) => (item.member_media || [])
        .filter((photo) => photo.bucket === 'member-media')
        .map((photo) => photo.storage_path));
      const { data: signedPhotos } = photoPaths.length
        ? await admin.storage.from('member-media').createSignedUrls(photoPaths, 600)
        : { data: [] };
      const signedUrls = new Map((signedPhotos || []).map((photo) => [photo.path, photo.signedUrl || '']));
      catalogues = privateCatalogues.map((item) => ({
        ...item,
        member_media: (item.member_media || []).filter((photo) => photo.bucket === 'member-media').map((photo) => ({
          id: photo.id,
          title: photo.title,
          alt_text: photo.alt_text,
          preview_url: signedUrls.get(photo.storage_path) || '',
          position: photo.position,
        })).sort((a, b) => a.position - b.position || a.id.localeCompare(b.id)),
      }));
    }
    if (!error) {
      const { data: products, error: productsError } = await admin.from('shop_products')
        .select('id,title,description,status,shop_product_images(id,storage_path,alt_text,position)')
        .order('created_at');
      if (productsError) loadError = 'Apply the shop product migration in Supabase to manage public shop photos.';
      else shopProducts = (products || []).map((item) => ({
        ...item,
        shop_product_images: [...(item.shop_product_images || [])].sort((a, b) => a.position - b.position),
      }));
      if (!productsError) {
        const { data: orders, error: ordersError } = await admin.from('shop_orders')
          .select('id,status,created_at,customer_email,shipping_details,shop_products(title)')
          .order('created_at', { ascending: false }).limit(100);
        if (ordersError) loadError = 'Shop photos are connected, but the orders table is unavailable.';
        else shopOrders = (orders || []).map((order) => ({ ...order, shop_products: Array.isArray(order.shop_products) ? order.shop_products[0] || null : order.shop_products }));
      }
    }
  } catch {
    loadError = 'Supabase server access is not configured. Add the service role key in Vercel, then redeploy.';
  }

  return (
    <PageShell>
      <main className="studio-page">
        <p className="eyebrow">PRIVATE PUBLISHING</p>
        <h1>Content studio</h1>
        <p className="studio-intro">Private releases are stored in the subscriber vault. Public shop photos are managed separately and visible to everyone.</p>
        {loadError && <p className="studio-feedback" role="status">{loadError}</p>}
        <section aria-labelledby="studio-editorials-heading" className="studio-section">
          <h2 id="studio-editorials-heading">Public editorials</h2>
          <p>Write and publish public shoot stories here. These photographs are separate from the paid Muse catalogue. Draft uploads stay in private storage until you publish.</p>
          {editorialLoadError && <p className="studio-feedback" role="status">{editorialLoadError}</p>}
          <EditorialManager editorials={editorialItems} />
        </section>
        {!loadError && <>
          <section aria-labelledby="studio-shop-heading" className="studio-section">
            <h2 id="studio-shop-heading">Shop products · public display photos</h2>
            <p>These photos are visible to anyone on the Shop page. Upload product previews only; subscriber originals belong in the private release vault below.</p>
            <ShopProductManager products={shopProducts} />
          </section>
          <section aria-labelledby="studio-private-heading" className="studio-section">
            <h2 id="studio-private-heading">Subscriber vault · private releases</h2>
            <p>Published magazine issues are included with Standard and Impura memberships. Muse catalogues are included with Impura or can be bought individually.</p>
            <CatalogueManager catalogues={catalogues} />
          </section>
          <section aria-labelledby="studio-orders-heading" className="studio-section">
            <h2 id="studio-orders-heading">Physical shop orders</h2>
            {shopOrders.length ? <div className="studio-orders">
              {shopOrders.map((order) => {
                const address = order.shipping_details?.address || {};
                const addressLines = [address.line1, address.line2, address.city, address.state, address.postal_code, address.country].filter(Boolean);
                return <article className="studio-order" key={order.id}>
                  <div><strong>{order.shop_products?.title || 'Shop product'}</strong><span className={`studio-status ${order.status}`}>{order.status}</span></div>
                  <p>{order.shipping_details?.name || 'Name not supplied'} · {order.customer_email || 'Email not supplied'}</p>
                  <p>{addressLines.join(', ') || 'Shipping address not supplied'}</p>
                  <small>{new Date(order.created_at).toLocaleString('en-GB')}</small>
                </article>;
              })}
            </div> : <p>No physical shop orders yet.</p>}
          </section>
        </>}
      </main>
    </PageShell>
  );
}
