import { redirect } from 'next/navigation';
import { PageShell } from '@/components/site/PageShell';
import { signOut } from '@/app/actions/auth';
import { getSupabaseConfig } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ passwordUpdated?: string }> }) {
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

  return (
    <PageShell>
      <main className="auth-page">
        <section className="auth-panel account-panel">
          <h1>YOUR ACCOUNT</h1>
          <p>{displayName ? `Welcome, ${displayName}.` : 'You are signed in.'}</p>
          <p className="account-email">{user.email}</p>
          {params.passwordUpdated === '1' && <p className="auth-notice is-success" role="status">Your password has been updated.</p>}
          <p className="account-membership-note">Membership access will appear here once subscriptions are connected.</p>
          <form action={signOut}>
            <button className="auth-submit" type="submit">Sign out</button>
          </form>
        </section>
      </main>
    </PageShell>
  );
}
