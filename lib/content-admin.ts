import 'server-only';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function getContentAdminState() {
  const configuredEmails = (process.env.CONTENT_ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const email = user?.email?.trim().toLowerCase();
  const verifiedEmail = Boolean(user?.email_confirmed_at || user?.confirmed_at);
  return {
    user,
    configured: configuredEmails.length > 0,
    authorized: Boolean(email && verifiedEmail && configuredEmails.includes(email)),
  };
}

export async function requireContentAdmin() {
  const state = await getContentAdminState();
  if (!state.user) redirect('/login?next=%2Fstudio');
  if (!state.configured) throw new Error('Content publishing has not been enabled for an admin account yet.');
  if (!state.authorized) throw new Error('You do not have permission to manage site content.');
  return state.user;
}
