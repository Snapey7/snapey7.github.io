import { AuthPanel } from '@/components/site/AuthPanel';
import { PageShell } from '@/components/site/PageShell';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ authError?: string }> }) {
  const params = await searchParams;
  return (
    <PageShell>
      <main className="auth-page">
        <AuthPanel initialError={params.authError === '1'} />
      </main>
    </PageShell>
  );
}
