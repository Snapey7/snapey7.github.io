import 'server-only';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCloudflareAuth, accountEmailConfigured } from './auth';
import { isCloudflareBackendConfigured } from './config';
import type { AuthFormState } from '@/app/actions/auth';

const unavailable = 'Account services are temporarily unavailable. Please try again shortly.';
function errorMessage(error: unknown, fallback: string) {
  const e = error as { statusCode?: number; status?: number; body?: { code?: string } };
  if (e.body?.code === 'EMAIL_NOT_VERIFIED') return 'Check your inbox and confirm your email address before signing in.';
  if (e.statusCode === 429 || e.status === 429) return 'Too many attempts. Please wait a few minutes and try again.';
  if (!e.statusCode || e.statusCode >= 500) return unavailable;
  return fallback;
}

export async function submitCloudflareAuth(formData: FormData): Promise<AuthFormState> {
  if (!isCloudflareBackendConfigured() || !process.env.AUTH_SECRET) return { type: 'error', message: unavailable };
  const mode = String(formData.get('mode') || '');
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  const candidate = String(formData.get('next') || '');
  const next = candidate.startsWith('/') && !candidate.startsWith('//') && !candidate.includes('\\') ? candidate : '/account';
  if (!email || !email.includes('@')) return { type: 'error', message: 'Enter a valid email address.' };
  if (!['forgot','signup','login'].includes(mode)) return { type: 'error', message: 'Choose sign in or create an account.' };
  if (mode !== 'forgot' && password.length < 8) return { type: 'error', message: 'Use a password with at least 8 characters.' };
  const requestHeaders = await headers();
  const auth = getCloudflareAuth();
  if (mode === 'forgot') {
    if (!accountEmailConfigured()) return { type: 'error', message: unavailable };
    try {
      await auth.api.requestPasswordReset({ headers: requestHeaders, body: { email, redirectTo: '/reset-password' } });
      return { type: 'success', message: 'If an account exists for that address, a password reset link is on its way.' };
    } catch (error) { return { type: 'error', message: errorMessage(error, 'We could not send a reset link. Please try again.') }; }
  }
  if (mode === 'signup') {
    const name = String(formData.get('name') || '').trim();
    if (!name) return { type: 'error', message: 'Enter your name to create an account.' };
    if (!accountEmailConfigured()) return { type: 'error', message: unavailable };
    try {
      await auth.api.signUpEmail({ headers: requestHeaders, body: { email, password, name, callbackURL: next } });
      return { type: 'success', message: 'Check your inbox for a confirmation link to finish creating your account.' };
    } catch (error) { return { type: 'error', message: errorMessage(error, 'We could not create your account. Please try signing in or request a password reset.') }; }
  }
  try { await auth.api.signInEmail({ headers: requestHeaders, body: { email, password } }); }
  catch (error) { return { type: 'error', message: errorMessage(error, 'Those sign-in details did not work. Check them and try again.') }; }
  redirect(next);
}

export async function updateCloudflarePassword(formData: FormData): Promise<AuthFormState> {
  const password = String(formData.get('password') || ''), token = String(formData.get('token') || '');
  if (password.length < 8) return { type: 'error', message: 'Use a password with at least 8 characters.' };
  if (!token || token.length > 2048) return { type: 'error', message: 'Request a new password reset link and open it before choosing a password.' };
  try { await getCloudflareAuth().api.resetPassword({ headers: await headers(), body: { newPassword: password, token } }); }
  catch (error) { return { type: 'error', message: errorMessage(error, 'This reset link is unavailable. Request another reset link and try again.') }; }
  redirect('/login?passwordUpdated=1');
}

export async function signOutCloudflare() {
  await getCloudflareAuth().api.signOut({ headers: await headers() });
}
