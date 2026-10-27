import { ResetPasswordForm } from '@/components/site/ResetPasswordForm';
import { PageShell } from '@/components/site/PageShell';

export default function ResetPasswordPage() {
  return (
    <PageShell>
      <main className="auth-page">
        <ResetPasswordForm />
      </main>
    </PageShell>
  );
}
