import { redirect } from 'next/navigation';
import { PageShell } from '@/components/site/PageShell';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentMembership, membershipAllows } from '@/lib/membership';

export const dynamic = 'force-dynamic';

export default async function MemberLibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=%2Flibrary');

  const membership = await getCurrentMembership();
  const admin = createAdminClient();
  const [{ data: media }, { data: purchases }] = await Promise.all([
    admin
    .from('member_media')
    .select('id,title,alt_text,min_tier')
    .order('created_at', { ascending: false }),
    admin.from('portfolio_purchases').select('media_id').eq('user_id', user.id).eq('status', 'paid'),
  ]);
  const ownedIds = new Set((purchases ?? []).map((purchase) => purchase.media_id));
  const accessibleMedia = (media ?? []).filter((item) => ownedIds.has(item.id) || membershipAllows(membership, item.min_tier));
  if (!membership && !accessibleMedia.length) redirect('/members');

  return (
    <PageShell>
      <main className="auth-page">
        <section className="auth-panel member-library">
          <p className="eyebrow">{membership ? `${membership.tier.toUpperCase()} MEMBERSHIP` : 'YOUR PURCHASES'}</p>
          <h1>YOUR PRIVATE LIBRARY</h1>
          {accessibleMedia.length ? (
            <div className="member-library-grid">
              {accessibleMedia.map((item) => (
                <article className="member-library-card" key={item.id}>
                  <div className="member-library-image">
                    <img alt={item.alt_text} loading="lazy" src={`/api/member-media/${item.id}`} />
                  </div>
                  <h2>{item.title}</h2>
                </article>
              ))}
            </div>
          ) : (
            <p className="auth-notice">Your membership is active. New private releases will appear here as they are published.</p>
          )}
        </section>
      </main>
    </PageShell>
  );
}
