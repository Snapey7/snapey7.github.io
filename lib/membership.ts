import 'server-only';

import { createClient } from '@/lib/supabase/server';

export type Membership = {
  tier: 'standard' | 'impura';
  status: 'active' | 'canceled' | 'expired' | 'refunded' | 'chargeback';
  current_period_end: string | null;
  provider_subscription_id: string;
  provider: 'stripe' | 'verotel';
  stripe_customer_id: string | null;
};

export async function getCurrentMembership(): Promise<Membership | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('memberships')
    .select('tier,status,current_period_end,provider_subscription_id,provider,stripe_customer_id')
    .eq('user_id', user.id)
    .in('status', ['active', 'canceled'])
    .gt('current_period_end', new Date().toISOString())
    .order('current_period_end', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as Membership | null;
}

export function membershipAllows(membership: Membership | null, required: 'standard' | 'impura') {
  if (!membership || !membership.current_period_end || Date.parse(membership.current_period_end) <= Date.now()) return false;
  if (!['active', 'canceled'].includes(membership.status)) return false;
  return required === 'standard' || membership.tier === 'impura';
}
