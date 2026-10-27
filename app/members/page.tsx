import { MembershipSection } from '@/components/site/MembershipSection';
import { PageShell } from '@/components/site/PageShell';
import { isMembershipCheckoutReady } from '@/lib/billing/verotel';

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const params = await searchParams;
  const checkoutReady = isMembershipCheckoutReady();
  return (
    <PageShell>
      <main className="members-page">
        <section className="archive-hero">
          <p className="eyebrow">MEMBERS</p>
          <h1>Private Access</h1>
          <p className="section-copy">
            Choose the membership that opens the magazine, extended releases,
            interviews, and the private world behind each editorial.
          </p>
          {params.checkout === 'declined' && <p className="auth-notice is-error" role="status">The payment was not completed. You have not been charged.</p>}
          {params.checkout === 'setup' && <p className="auth-notice" role="status">Membership checkout is being configured. No payment was taken. Please check back soon.</p>}
          {params.checkout === 'invalid' && <p className="auth-notice is-error" role="status">That membership option could not be found.</p>}
          {!checkoutReady && <p className="auth-notice" role="status">Online checkout is not live yet. Membership access will only open after the payment provider and private media storage are configured.</p>}
        </section>
        <MembershipSection showHeading={false} />
      </main>
    </PageShell>
  );
}
