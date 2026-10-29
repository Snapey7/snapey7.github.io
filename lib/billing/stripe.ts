import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type MembershipTier = 'standard' | 'impura';
type BillingInterval = 'monthly' | 'yearly';

const priceEnv: Record<MembershipTier, Record<BillingInterval, string>> = {
  standard: { monthly: 'STRIPE_PRICE_STANDARD_MONTHLY', yearly: 'STRIPE_PRICE_STANDARD_YEARLY' },
  impura: { monthly: 'STRIPE_PRICE_IMPURA_MONTHLY', yearly: 'STRIPE_PRICE_IMPURA_YEARLY' },
};

const configuredPrice = (key: string) => /^price_[A-Za-z0-9]+$/.test(process.env[key] || '');

export function isStripeCheckoutReady() {
  return Boolean(
    /^sk_(test|live)_[A-Za-z0-9]+$/.test(process.env.STRIPE_SECRET_KEY || '') &&
    configuredPrice('STRIPE_PRICE_STANDARD_MONTHLY') &&
    configuredPrice('STRIPE_PRICE_STANDARD_YEARLY') &&
    configuredPrice('STRIPE_PRICE_IMPURA_MONTHLY') &&
    configuredPrice('STRIPE_PRICE_IMPURA_YEARLY') &&
    /^whsec_\S+$/.test(process.env.STRIPE_WEBHOOK_SECRET || '') &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !process.env.SUPABASE_SERVICE_ROLE_KEY.startsWith('your-'),
  );
}

export async function createStripeCheckout(fields: Record<string, string>, successPath: string, cancelPath: string) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret || !/^sk_(test|live)_[A-Za-z0-9]+$/.test(secret)) throw new Error('Stripe is not configured.');
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.impuravidamagazine.com').replace(/\/$/, '');
  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      ...fields,
      success_url: `${siteUrl}${successPath}`,
      cancel_url: `${siteUrl}${cancelPath}`,
      'billing_address_collection': 'auto',
    }),
    cache: 'no-store',
  });
  const result = await response.json() as { url?: string; error?: { message?: string } };
  if (!response.ok || !result.url) throw new Error(result.error?.message || 'Stripe could not start checkout.');
  return result.url;
}

export async function createStripePortal(customerId: string) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret || !/^sk_(test|live)_[A-Za-z0-9]+$/.test(secret)) throw new Error('Stripe is not configured.');
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.impuravidamagazine.com').replace(/\/$/, '');
  const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ customer: customerId, return_url: `${siteUrl}/account` }),
    cache: 'no-store',
  });
  const result = await response.json() as { url?: string; error?: { message?: string } };
  if (!response.ok || !result.url) throw new Error(result.error?.message || 'Stripe could not open subscription management.');
  return result.url;
}

export async function startMembershipCheckout(tierInput: string, intervalInput: string) {
  if (!['standard', 'impura'].includes(tierInput) || !['monthly', 'yearly'].includes(intervalInput)) redirect('/members?checkout=invalid');
  const tier = tierInput as MembershipTier;
  const interval = intervalInput as BillingInterval;
  const price = process.env[priceEnv[tier][interval]];
  if (!price || !configuredPrice(priceEnv[tier][interval]) || !/^sk_(test|live)_[A-Za-z0-9]+$/.test(process.env.STRIPE_SECRET_KEY || '')) redirect('/members?checkout=setup');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=%2Fmembers');
  const { data: current } = await supabase.from('memberships').select('id')
    .eq('user_id', user.id).in('status', ['active', 'canceled'])
    .gt('current_period_end', new Date().toISOString()).limit(1).maybeSingle();
  if (current) redirect('/account?membership=active');

  try {
    const sessionUrl = await createStripeCheckout({
      mode: 'subscription',
      'line_items[0][price]': price,
      'line_items[0][quantity]': '1',
      client_reference_id: user.id,
      ...(user.email ? { customer_email: user.email } : {}),
      'metadata[user_id]': user.id,
      'metadata[tier]': tier,
      'metadata[interval]': interval,
      'subscription_data[metadata][user_id]': user.id,
      'subscription_data[metadata][tier]': tier,
      'subscription_data[metadata][interval]': interval,
    }, '/account?checkout=returned', '/members?checkout=cancelled');
    redirect(sessionUrl);
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) throw error;
    console.error('Stripe membership checkout failed:', error);
    redirect('/members?checkout=setup');
  }
}

export async function startPortfolioCheckout(mediaId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(mediaId) || !isStripeCheckoutReady()) redirect('/models?checkout=unavailable');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/api/billing/stripe/portfolio/${mediaId}`)}`);
  const adminModule = await import('@/lib/supabase/admin');
  const admin = adminModule.createAdminClient();
  const { data: priorPurchase } = await admin.from('portfolio_purchases').select('id')
    .eq('user_id', user.id).eq('media_id', mediaId).eq('status', 'paid').maybeSingle();
  if (priorPurchase) redirect('/library');
  const { data: item } = await admin.from('member_media').select('id,stripe_price_id').eq('id', mediaId).maybeSingle();
  if (!item?.stripe_price_id || !/^price_[A-Za-z0-9]+$/.test(item.stripe_price_id)) redirect('/models?checkout=unavailable');
  try {
    const sessionUrl = await createStripeCheckout({
      mode: 'payment',
      'line_items[0][price]': item.stripe_price_id,
      'line_items[0][quantity]': '1',
      client_reference_id: user.id,
      ...(user.email ? { customer_email: user.email } : {}),
      'metadata[user_id]': user.id,
      'metadata[media_id]': mediaId,
    }, `/account?purchase=returned`, `/models?checkout=cancelled`);
    redirect(sessionUrl);
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) throw error;
    console.error('Stripe portfolio checkout failed:', error);
    redirect('/models?checkout=unavailable');
  }
}

export function verifyStripeSignature(payload: string, signatureHeader: string | null, secret: string) {
  if (!signatureHeader) return false;
  const parts = signatureHeader.split(',').map((part) => part.split('='));
  const timestamp = parts.find(([key]) => key === 't')?.[1];
  const signatures = parts.filter(([key]) => key === 'v1').map(([, value]) => value);
  if (!timestamp || !/^\d+$/.test(timestamp) || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const expected = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex');
  return signatures.some((signature) => {
    if (!signature || !/^[a-f\d]{64}$/i.test(signature)) return false;
    const supplied = Buffer.from(signature, 'hex');
    const wanted = Buffer.from(expected, 'hex');
    return supplied.length === wanted.length && timingSafeEqual(supplied, wanted);
  });
}
