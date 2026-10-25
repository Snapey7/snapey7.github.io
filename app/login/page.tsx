import { AuthPanel } from '@/components/site/AuthPanel';
import { PageShell } from '@/components/site/PageShell';

export default function LoginPage() {
  return (
    <PageShell>
      <main className="auth-page">
        <AuthPanel />
      </main>
    </PageShell>
  );
}
