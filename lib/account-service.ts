import { isCloudflareBackendConfigured, usesCloudflareBackend } from './cloudflare/config';
export function isAccountBackendConfigured() {
  if (usesCloudflareBackend()) return isCloudflareBackendConfigured() && Boolean(process.env.AUTH_SECRET);
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY.startsWith('your-'));
}
export function accountErrorMessage(error: { status?: number } | null, fallback: string) {
  if (error && (error.status === 402 || (error.status || 0) >= 500)) return 'Account services are temporarily unavailable. Please try again shortly.';
  if (error?.status === 429) return 'Too many attempts. Please wait a few minutes and try again.';
  return fallback;
}
