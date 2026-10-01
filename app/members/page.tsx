import { MembershipSection } from '@/components/site/MembershipSection';
import { PageShell } from '@/components/site/PageShell';

export default function MembersPage() {
  return (
    <PageShell>
      <main>
        <section className="archive-hero">
          <p className="eyebrow">MEMBERS</p>
          <h1>Private Access</h1>
          <p className="section-copy">
            Choose the membership that opens the magazine, extended releases,
            interviews, and the private world behind each editorial.
          </p>
        </section>
        <MembershipSection />
      </main>
    </PageShell>
  );
}
