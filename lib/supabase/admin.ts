import 'server-only';
import { usesCloudflareBackend } from '@/lib/cloudflare/config';
import { createCloudflareAdminClient } from '@/lib/cloudflare/client';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createAdminClient() {
  if (usesCloudflareBackend()) return createCloudflareAdminClient();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || key.startsWith('your-')) throw new Error('Supabase admin is not configured.');
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
