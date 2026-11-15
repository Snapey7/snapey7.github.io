import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { CloudflareQuery } from './query';
import { cloudflareStorage } from './storage';
import { cloudflareRpc } from './rpc';

export function createCloudflareAdminClient(): SupabaseClient {
  return {
    from: (table: string) => new CloudflareQuery(table),
    rpc: cloudflareRpc,
    storage: { from: cloudflareStorage },
  } as unknown as SupabaseClient;
}
