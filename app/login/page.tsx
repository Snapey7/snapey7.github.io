import Link from 'next/link';
import { PageShell } from '@/components/site/PageShell';

export default function LoginPage() {
  return (
    <PageShell>
      <main>
        <section className="simple-page">
          <p className="eyebrow">MEMBER LOGIN</p>
          <h1>Enter The Room</h1>
          <p className="section-copy">
            Member authentication will connect here. For now, the page holds the
            gated-access route and visual system.
          </p>
          <Link className="outline-cta" href="/members">
            JOIN THE EXPERIENCE
          </Link>
        </section>
      </main>
    </PageShell>
  );
}
