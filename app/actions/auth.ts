'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseConfig } from '@/lib/supabase/config';

export type AuthFormState = { type?: 'error' | 'success'; message?: string };

const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.impuravidamagazine.com').replace(/\/$/, '');

export async function submitAuth(_previousState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (!getSupabaseConfig()) {
    return { type: 'error', message: 'Account signup is not connected yet. Add the Supabase project URL and publishable key to the deployment environment.' };
  }

  const mode = String(formData.get('mode') || '');
  const email = String(formData.get('email') || '').trim().toLowerCase();
  if (!email || !email.includes('@')) return { type: 'error', message: 'Enter a valid email address.' };

  const supabase = await createClient();
  if (mode === 'forgot') {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl()}/auth/callback?next=%2Freset-password`,
    });
    if (error) return { type: 'error', message: 'We could not send a reset link. Check the email address and try again.' };
    return { type: 'success', message: 'If an account exists for that address, a password reset link is on its way.' };
  }

  const password = String(formData.get('password') || '');
  if (password.length < 8) return { type: 'error', message: 'Use a password with at least 8 characters.' };

  if (mode === 'signup') {
    const name = String(formData.get('name') || '').trim();
    if (!name) return { type: 'error', message: 'Enter your name to create an account.' };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name },
        emailRedirectTo: `${siteUrl()}/auth/callback?next=%2Faccount`,
      },
    });
    if (error) return { type: 'error', message: 'We could not create your account. Check your details and try again.' };
    if (data.session) redirect('/account');
    return { type: 'success', message: 'Check your inbox for a confirmation link to finish creating your account.' };
  }

  if (mode !== 'login') return { type: 'error', message: 'Choose sign in or create an account.' };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { type: 'error', message: 'Those sign-in details did not work. Check them and try again.' };
  redirect('/account');
}

export async function updatePassword(_previousState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (!getSupabaseConfig()) return { type: 'error', message: 'Account services are not configured yet.' };
  const password = String(formData.get('password') || '');
  if (password.length < 8) return { type: 'error', message: 'Use a password with at least 8 characters.' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { type: 'error', message: 'We could not update your password. Request another reset link and try again.' };
  redirect('/account?passwordUpdated=1');
}

export async function signOut() {
  if (getSupabaseConfig()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect('/login');
}
