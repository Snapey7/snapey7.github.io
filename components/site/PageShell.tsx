import type { ReactNode } from 'react';
import { Footer } from './Footer';
import { Header } from './Header';
import { isAccountBackendConfigured } from '@/lib/account-service';
import { createClient } from '@/lib/supabase/server';

export async function PageShell({ children }: { children: ReactNode }) {
  let isAuthenticated = false;
  let isContentAdmin = false;

  if (isAccountBackendConfigured()) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      isAuthenticated = Boolean(user);
      const configuredEmails = (process.env.CONTENT_ADMIN_EMAILS || '')
        .split(',')
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);
      const email = user?.email?.trim().toLowerCase();
      const verifiedEmail = Boolean(user?.email_confirmed_at || user?.confirmed_at);
      isContentAdmin = Boolean(email && verifiedEmail && configuredEmails.includes(email));
    } catch {
      // Keep public pages available if the auth service is temporarily unreachable.
    }
  }

  return (
    <>
      <Header isAuthenticated={isAuthenticated} isContentAdmin={isContentAdmin} />
      {children}
      <Footer />
    </>
  );
}
