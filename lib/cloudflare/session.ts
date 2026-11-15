import 'server-only';
import { cache } from 'react';
import { headers } from 'next/headers';
import type { User, SupabaseClient } from '@supabase/supabase-js';
import { getCloudflareAuth } from './auth';
import { CloudflareQuery } from './query';
import { cloudflareStorage } from './storage';

export const getCloudflareUser = cache(async (): Promise<User | null> => {
  const session = await getCloudflareAuth().api.getSession({ headers: await headers() });
  if (!session) return null;
  const u = session.user;
  let metadata: Record<string, unknown> = {};
  try { metadata = JSON.parse(u.rawMetadata || '{}'); } catch { /* Optional imported display metadata. */ }
  return {
    id: u.id, email: u.email, aud: 'authenticated', role: 'authenticated',
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { ...metadata, display_name: u.name },
    email_confirmed_at: u.emailVerified ? u.createdAt.toISOString() : undefined,
    confirmed_at: u.emailVerified ? u.createdAt.toISOString() : undefined,
    created_at: u.createdAt.toISOString(), updated_at: u.updatedAt.toISOString(),
  };
});

export function createCloudflareUserClient(): SupabaseClient {
  return {
    from: (table: string) => new CloudflareQuery(table, async () => (await getCloudflareUser())?.id || null),
    storage: { from: cloudflareStorage },
    auth: {
      getUser: async () => {
        try { return { data: { user: await getCloudflareUser() }, error: null }; }
        catch { return { data: { user: null }, error: { status: 503, message: 'Account services are temporarily unavailable.' } }; }
      },
    },
  } as unknown as SupabaseClient;
}
