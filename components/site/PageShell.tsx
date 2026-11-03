import type { ReactNode } from 'react';
import { Footer } from './Footer';
import { Header } from './Header';
import { getSupabaseConfig } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';

export async function PageShell({ children }: { children: ReactNode }) {
  let isAuthenticated = false;

  if (getSupabaseConfig()) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      isAuthenticated = Boolean(user);
    } catch {
      // Keep public pages available if the auth service is temporarily unreachable.
    }
  }

  return (
    <>
      <Header isAuthenticated={isAuthenticated} />
      {children}
      <Footer />
    </>
  );
}
