import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { PageShell } from '@/components/site/PageShell';
import { models } from '@/lib/content';
import { createAdminClient } from '@/lib/supabase/admin';
import { beginPortfolioCheckout } from '@/app/actions/auth';
import { isStripeCheckoutReady } from '@/lib/billing/stripe';

type ModelPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ModelDetailPage({ params }: ModelPageProps) {
  const { slug } = await params;
  const model = models.find((item) => item.slug === slug);
  if (!model) notFound();
  const admin = createAdminClient();
  const { data: portfolios } = await admin.from('member_media')
    .select('id,title,alt_text,stripe_price_id')
    .eq('model_slug', slug)
    .not('stripe_price_id', 'is', null)
    .order('created_at', { ascending: false });

  return (
    <PageShell>
      <main className="model-entry-page">
        <section className="model-entry-layout" aria-label={`${model.name} gallery` }>
          <div className="model-entry-copy">
            <h1>{model.name} | {model.location}</h1>
            <p className="model-entry-meta">GALLERY <span>·</span> IMPURA | EXCLUSIVE PHOTOS</p>
            <Link className="model-entry-cta" href="/members">Get Full Access</Link>
            {portfolios?.map((portfolio) => (
              <form action={beginPortfolioCheckout} key={portfolio.id}>
                <input type="hidden" name="mediaId" value={portfolio.id} />
                <button className="model-entry-cta" disabled={!isStripeCheckoutReady()} type="submit">
                  Buy {portfolio.title}
                </button>
              </form>
            ))}
          </div>
          <div className="model-entry-image">
            <Image alt={`${model.name} — ${model.location}`} src={model.image} fill priority sizes="(max-width: 700px) 90vw, 420px" />
          </div>
        </section>
      </main>
    </PageShell>
  );
}
