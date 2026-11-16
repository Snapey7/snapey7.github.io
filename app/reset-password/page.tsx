import { ResetPasswordForm } from '@/components/site/ResetPasswordForm';
import { PageShell } from '@/components/site/PageShell';

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <PageShell>
      <main className="auth-page">
        <ResetPasswordForm token={token} />
      </main>
    </PageShell>
  );
}
