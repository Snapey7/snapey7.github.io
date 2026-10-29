import { redirect } from 'next/navigation';
import { PageShell } from '@/components/site/PageShell';
import { manageStripeSubscription, signOut } from '@/app/actions/auth';
import { getSupabaseConfig } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';
import { getCurrentMembership } from '@/lib/membership';
import { createCancelSubscriptionUrl } from '@/lib/billing/verotel';

export const dynamic = 'force-dynamic';

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ passwordUpdated?: string; checkout?: string; membership?: string }> }) {
  if (!getSupabaseConfig()) {
    return (
      <PageShell>
        <main className="auth-page">
          <section className="auth-panel">
            <h1>ACCOUNT</h1>
            <p className="auth-notice">Account services are ready to connect. Add the Supabase project URL and publishable key to start accepting sign-ups.</p>
          </section>
        </main>
      </PageShell>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const params = await searchParams;
  const displayName = typeof user.user_metadata?.display_name === 'string' ? user.user_metadata.display_name : '';
  const membership = await getCurrentMembership();
  const cancelUrl = membership?.status === 'active'
    && membership.provider === 'verotel'
    ? createCancelSubscriptionUrl(membership.provider_subscription_id)
    : null;

  return (
    <PageShell>
      <main className="auth-page">
        <section className="auth-panel account-panel">
          <h1>YOUR ACCOUNT</h1>
          <p>{displayName ? `Welcome, ${displayName}.` : 'You are signed in.'}</p>
          <p className="account-email">{user.email}</p>
          {params.passwordUpdated === '1' && <p className="auth-notice is-success" role="status">Your password has been updated.</p>}
          {membership ? (
            <div className="account-membership-note">
              <p><strong>{membership.tier === 'impura' ? 'IMPURA' : 'STANDARD'} MEMBERSHIP</strong></p>
              <p>Status: {membership.status === 'canceled' ? 'Canceled; access remains until the paid period ends.' : 'Active'}</p>
              {membership.current_period_end && <p>Access through {new Date(membership.current_period_end).toLocaleDateString('en-GB', { dateStyle: 'long', timeZone: 'UTC' })}.</p>}
              <a className="under-link" href="/library">OPEN YOUR PRIVATE LIBRARY</a>
              {membership.provider === 'stripe' && membership.stripe_customer_id && (
                <form action={manageStripeSubscription}>
                  <button className="under-link" type="submit">MANAGE OR CANCEL MEMBERSHIP</button>
                </form>
              )}
              {cancelUrl && <a className="under-link" href={cancelUrl}>MANAGE OR CANCEL MEMBERSHIP</a>}
            </div>
          ) : (
            <p className="account-membership-note">
              {params.checkout === 'returned'
                ? 'Your payment page returned. We are waiting for the provider’s verified confirmation before enabling membership access.'
                : 'No active membership yet.'}{' '}
              <a className="under-link" href="/members">VIEW MEMBERSHIPS</a>
            </p>
          )}
          {params.membership === 'active' && <p className="auth-notice" role="status">You already have an active membership. Contact support if you need help changing your tier.</p>}
          <form action={signOut}>
            <button className="auth-submit" type="submit">Sign out</button>
          </form>
        </section>
      </main>
    </PageShell>
  );
}
