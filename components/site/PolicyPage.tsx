import type { ReactNode } from 'react';
import { PageShell } from './PageShell';

export function PolicyPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <PageShell>
      <main className="policy-page">
        <article className="policy-content">
          <p className="eyebrow">IMPURA VIDA MAGAZINE · POLICIES</p>
          <h1>{title}</h1>
          <p className="policy-intro">{intro}</p>
          <p className="policy-updated">Last updated: 3 November 2026</p>
          <div className="policy-sections">{children}</div>
          <p className="policy-contact">
            Questions about this policy? Contact <a href="mailto:impuravidamag@gmail.com">impuravidamag@gmail.com</a>.
          </p>
        </article>
      </main>
    </PageShell>
  );
}

export function PolicySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
