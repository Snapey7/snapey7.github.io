import { notFound } from 'next/navigation';
import Image from 'next/image';
import { PageShell } from '@/components/site/PageShell';
import { models } from '@/lib/content';
import { createAdminClient } from '@/lib/supabase/admin';
import { beginCatalogueCheckout } from '@/app/actions/auth';
import { isStripeOneTimeCheckoutReady } from '@/lib/billing/stripe';
import { createClient } from '@/lib/supabase/server';
import { getCurrentMembership, membershipAllows } from '@/lib/membership';
import { PrivateCatalogueExperience } from './PrivateCatalogueExperience';

type ModelPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ checkout?: string }>;
};

export default async function ModelDetailPage({ params, searchParams }: ModelPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const model = models.find((item) => item.slug === slug);
  if (!model) notFound();
  const admin = createAdminClient();
  const [{ data: catalogue }, { data: { user } }, membership] = await Promise.all([
    admin.from('catalogues').select('id,title,description,stripe_price_id,status')
      .eq('model_slug', slug).eq('product_type', 'model_catalogue').maybeSingle(),
    createClient().then((client) => client.auth.getUser()),
    getCurrentMembership(),
  ]);
  const { data: media } = catalogue?.status === 'published'
    ? await admin.from('member_media').select('id,title,alt_text').eq('catalogue_id', catalogue.id).order('created_at')
    : { data: [] };
  let purchased = false;
  if (user && catalogue) {
    const { data: purchase } = await admin.from('portfolio_purchases').select('id')
      .eq('user_id', user.id).eq('catalogue_id', catalogue.id).eq('status', 'paid').maybeSingle();
    purchased = Boolean(purchase);
  }
  const canView = Boolean(catalogue?.status === 'published' && (purchased || membershipAllows(membership, 'impura')));

  return (
    <PageShell>
      {canView ? (
        <PrivateCatalogueExperience
          coverImage={model.image}
          description={catalogue?.description || ''}
          location={model.location}
          modelName={model.name}
          photos={media || []}
        />
      ) : (
        <main className="model-entry-page">
          <section className="model-entry-layout" aria-label={`${model.name} gallery`}>
            <div className="model-entry-copy">
              <h1>{model.name} | {model.location}</h1>
              <p className="model-entry-meta">GALLERY <span>·</span> IMPURA | EXCLUSIVE PHOTOS</p>
              {query.checkout === 'setup' && <p className="auth-notice is-error" role="status">Checkout could not start. Please try again or contact us if this keeps happening.</p>}
              {query.checkout === 'cancelled' && <p className="auth-notice" role="status">Checkout was cancelled. You can try again whenever you’re ready.</p>}
              {catalogue?.status === 'published' && catalogue.description && <p>{catalogue.description}</p>}
              {catalogue?.status === 'published' && <form action={beginCatalogueCheckout}>
                <input type="hidden" name="catalogueId" value={catalogue.id} />
                <button className="model-entry-cta" disabled={!isStripeOneTimeCheckoutReady()} type="submit">
                  Get Access
                </button>
              </form>}
              {catalogue && catalogue.status !== 'published' && <p className="model-entry-availability">This catalogue is being prepared and isn’t available to buy yet.</p>}
            </div>
            <div className="model-entry-image">
              <Image alt={`${model.name} — ${model.location}`} src={model.image} fill priority sizes="(max-width: 700px) 90vw, 420px" />
            </div>
          </section>
        </main>
      )}
    </PageShell>
  );
}
