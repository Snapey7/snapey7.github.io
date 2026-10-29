import { AuthPanel } from '@/components/site/AuthPanel';
import { PageShell } from '@/components/site/PageShell';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ authError?: string; next?: string }> }) {
  const params = await searchParams;
  const next = params.next?.startsWith('/') && !params.next.startsWith('//') && !params.next.includes('\\') ? params.next : '/account';
  return (
    <PageShell>
      <main className="auth-page">
        <AuthPanel initialError={params.authError === '1'} redirectTo={next} />
      </main>
    </PageShell>
  );
}
