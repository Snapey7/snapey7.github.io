import 'server-only';

import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type MembershipTier = 'standard' | 'impura';

export const membershipPlans: Record<MembershipTier, { name: string; amount: string }> = {
  standard: { name: 'STANDARD Membership', amount: '14.99' },
  impura: { name: 'IMPURA Membership', amount: '29.99' },
};

export function getVerotelConfig() {
  const shopID = process.env.VEROTEL_SHOP_ID;
  const signatureKey = process.env.VEROTEL_SIGNATURE_KEY;
  if (!shopID || !/^\d+$/.test(shopID) || !signatureKey || signatureKey.startsWith('your-')) return null;
  return { shopID, signatureKey };
}

export function isMembershipCheckoutReady() {
  return Boolean(
    getVerotelConfig() &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !process.env.SUPABASE_SERVICE_ROLE_KEY.startsWith('your-'),
  );
}

function signature(params: Record<string, string>, signatureKey: string) {
  const canonical = Object.entries(params)
    .filter(([key, value]) => key !== 'signature' && key !== 'email' && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join(':');
  return createHash('sha256').update(`${signatureKey}:${canonical}`, 'utf8').digest('hex');
}

export function verifyVerotelSignature(params: Record<string, string>, signatureKey: string) {
  const supplied = params.signature;
  if (!supplied || !/^[a-f\d]{64}$/i.test(supplied)) return false;
  const expected = signature(params, signatureKey);
  return timingSafeEqual(Buffer.from(supplied.toLowerCase()), Buffer.from(expected));
}

export async function startMembershipCheckout(tierInput: string) {
  const tier = tierInput as MembershipTier;
  const plan = membershipPlans[tier];
  if (!plan) redirect('/members?checkout=invalid');

  const config = getVerotelConfig();
  if (!config || !isMembershipCheckoutReady()) redirect('/members?checkout=setup');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=%2Fmembers');

  const { data: current } = await supabase
    .from('memberships')
    .select('id')
    .eq('user_id', user.id)
    .in('status', ['active', 'canceled'])
    .gt('current_period_end', new Date().toISOString())
    .limit(1)
    .maybeSingle();
  if (current) redirect('/account?membership=active');

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.impuravidamagazine.com').replace(/\/$/, '');
  const params: Record<string, string> = {
    version: '4',
    shopID: config.shopID,
    type: 'subscription',
    subscriptionType: 'recurring',
    priceAmount: plan.amount,
    priceCurrency: 'USD',
    period: 'P30D',
    name: plan.name,
    referenceID: randomUUID(),
    custom1: user.id,
    custom2: tier,
    successURL: `${siteUrl}/account?checkout=returned`,
    declineURL: `${siteUrl}/members?checkout=declined`,
  };
  if (user.email) params.email = user.email;
  params.signature = signature(params, config.signatureKey);

  const checkout = new URL('https://secure.verotel.com/startorder');
  Object.entries(params).forEach(([key, value]) => checkout.searchParams.set(key, value));
  redirect(checkout.toString());
}

export function createCancelSubscriptionUrl(saleID: string) {
  const config = getVerotelConfig();
  if (!config || !/^\d+$/.test(saleID)) return null;
  const params = { version: '4', shopID: config.shopID, saleID };
  const url = new URL('https://secure.verotel.com/cancel-subscription');
  Object.entries({ ...params, signature: signature(params, config.signatureKey) })
    .forEach(([key, value]) => url.searchParams.set(key, value));
  return url.toString();
}
