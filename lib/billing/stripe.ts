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
    /^(sk|rk)_(test|live)_[A-Za-z0-9]+$/.test(process.env.STRIPE_SECRET_KEY?.trim() || '') &&
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

export function isStripeOneTimeCheckoutReady() {
  return Boolean(
    /^(sk|rk)_(test|live)_[A-Za-z0-9]+$/.test(process.env.STRIPE_SECRET_KEY?.trim() || '') &&
    /^whsec_\S+$/.test(process.env.STRIPE_WEBHOOK_SECRET || '') &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !process.env.SUPABASE_SERVICE_ROLE_KEY.startsWith('your-'),
  );
}

function shopShippingConfig() {
  const countries = (process.env.SHOP_SHIPPING_COUNTRIES || '').split(',').map((item) => item.trim().toUpperCase()).filter(Boolean);
  const rates = (process.env.SHOP_SHIPPING_RATE_IDS || '').split(',').map((item) => item.trim()).filter(Boolean);
  if (!countries.length || countries.some((country) => !/^[A-Z]{2}$/.test(country))) return null;
  if (!rates.length || rates.some((rate) => !/^shr_[A-Za-z0-9]+$/.test(rate))) return null;
  return { countries, rates };
}

export function isPhysicalShopCheckoutReady() {
  return isStripeOneTimeCheckoutReady() && Boolean(shopShippingConfig());
}

export async function getStripePriceLabel(priceId: string) {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!/^price_[A-Za-z0-9]+$/.test(priceId) || !secret || !/^(sk|rk)_(test|live)_[A-Za-z0-9]+$/.test(secret)) return null;
  try {
    const response = await fetch(`https://api.stripe.com/v1/prices/${encodeURIComponent(priceId)}`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: 'no-store',
    });
    if (!response.ok) return null;
    const price = await response.json() as { unit_amount?: number | null; currency?: string };
    if (typeof price.unit_amount !== 'number' || !price.currency) return null;
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: price.currency.toUpperCase() })
      .format(price.unit_amount / 100);
  } catch {
    return null;
  }
}

export async function validateStripeOneTimePrice(priceId: string) {
  if (!/^price_[A-Za-z0-9]+$/.test(priceId)) {
    return { error: 'Enter a valid Stripe Price ID beginning with price_.' };
  }
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret || !/^(sk|rk)_(test|live)_[A-Za-z0-9]+$/.test(secret)) {
    return { error: 'This deployment has no valid STRIPE_SECRET_KEY. Check its server environment and redeploy.' };
  }
  const mode = secret.startsWith('sk_live_') || secret.startsWith('rk_live_') ? 'live' : 'test';
  try {
    const response = await fetch(`https://api.stripe.com/v1/prices/${encodeURIComponent(priceId)}?expand[]=product`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      // Keep credentials and Stripe's raw error text out of logs and action responses.
      console.error('Stripe price lookup failed:', { status: response.status, requestId: response.headers.get('request-id'), mode });
      if (response.status === 401) return { error: 'Stripe rejected this deployment’s secret key. Check STRIPE_SECRET_KEY and redeploy.' };
      if (response.status === 403) return { error: 'This deployment’s Stripe key does not have permission to read prices and products.' };
      if (response.status === 404) return { error: `Stripe could not find this price in the account connected to this deployment (${mode} mode). Check the account and Price ID.` };
      return { error: 'Stripe could not verify this price right now. Please try saving again.' };
    }
    const price = await response.json() as {
      id?: string; active?: boolean; type?: string; livemode?: boolean;
      unit_amount?: number | null; currency?: string;
      product?: string | { name?: string; active?: boolean; deleted?: boolean };
    };
    if (price.id !== priceId || price.livemode !== (mode === 'live')) {
      return { error: `Stripe returned a price that does not match this deployment’s ${mode} mode.` };
    }
    if (!price.active || price.type !== 'one_time') return { error: 'Choose an active one-time Stripe price, rather than a recurring or archived price.' };
    if (typeof price.unit_amount !== 'number' || !price.currency) return { error: 'Choose a Stripe price with a fixed amount and currency.' };
    if (!price.product || typeof price.product === 'string' || price.product.deleted || price.product.active !== true) {
      return { error: 'Choose a Stripe price attached to an active product.' };
    }
    return { priceId: price.id, productName: price.product.name || 'Catalogue', mode };
  } catch {
    return { error: 'Could not reach Stripe to verify this price. Please try saving again.' };
  }
}

export async function isStripeOneTimePrice(priceId: string) {
  return !('error' in await validateStripeOneTimePrice(priceId));
}

export async function createStripeCheckout(fields: Record<string, string>, successPath: string, cancelPath: string) {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret || !/^(sk|rk)_(test|live)_[A-Za-z0-9]+$/.test(secret)) throw new Error('Stripe is not configured.');
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
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret || !/^(sk|rk)_(test|live)_[A-Za-z0-9]+$/.test(secret)) throw new Error('Stripe is not configured.');
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
  if (!price || !configuredPrice(priceEnv[tier][interval]) || !/^(sk|rk)_(test|live)_[A-Za-z0-9]+$/.test(process.env.STRIPE_SECRET_KEY?.trim() || '')) redirect('/members?checkout=setup');

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
  if (!/^[0-9a-f-]{36}$/i.test(mediaId) || !isStripeOneTimeCheckoutReady()) redirect('/models?checkout=unavailable');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/api/billing/stripe/portfolio/${mediaId}`)}`);
  const adminModule = await import('@/lib/supabase/admin');
  const admin = adminModule.createAdminClient();
  const { data: priorPurchase } = await admin.from('portfolio_purchases').select('id')
    .eq('user_id', user.id).eq('media_id', mediaId).eq('status', 'paid').maybeSingle();
  if (priorPurchase) redirect('/library');
  const { data: item } = await admin.from('member_media').select('id,stripe_price_id,catalogue_id').eq('id', mediaId).maybeSingle();
  if (!item?.stripe_price_id || item.catalogue_id || !/^price_[A-Za-z0-9]+$/.test(item.stripe_price_id)) redirect('/models?checkout=unavailable');
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

export async function startCatalogueCheckout(catalogueId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(catalogueId) || !isStripeOneTimeCheckoutReady()) {
    redirect('/models?checkout=unavailable');
  }
  const admin = (await import('@/lib/supabase/admin')).createAdminClient();
  const { data: catalogue } = await admin.from('catalogues')
    .select('id,stripe_price_id,status,model_slug').eq('id', catalogueId).maybeSingle();
  if (!catalogue || catalogue.status !== 'published' || !/^price_[A-Za-z0-9]+$/.test(catalogue.stripe_price_id)) {
    redirect('/models?checkout=unavailable');
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const returnPath = catalogue.model_slug ? `/models/${catalogue.model_slug}` : '/shop';
  if (!user) redirect(`/login?next=${encodeURIComponent(`/checkout/catalogue/${catalogue.id}`)}`);

  const { data: priorPurchase } = await admin.from('portfolio_purchases').select('id')
    .eq('user_id', user.id).eq('catalogue_id', catalogueId).eq('status', 'paid').maybeSingle();
  if (priorPurchase) redirect('/library');

  try {
    const sessionUrl = await createStripeCheckout({
      mode: 'payment',
      'line_items[0][price]': catalogue.stripe_price_id,
      'line_items[0][quantity]': '1',
      client_reference_id: user.id,
      ...(user.email ? { customer_email: user.email } : {}),
      'metadata[user_id]': user.id,
      'metadata[catalogue_id]': catalogue.id,
      'payment_intent_data[metadata][user_id]': user.id,
      'payment_intent_data[metadata][catalogue_id]': catalogue.id,
    }, '/library?purchase=returned', `${returnPath}?checkout=cancelled`);
    redirect(sessionUrl);
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) throw error;
    console.error('Stripe catalogue checkout failed:', error);
    redirect(`${returnPath}?checkout=setup`);
  }
}

export async function startShopProductCheckout(productId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(productId) || !isPhysicalShopCheckoutReady()) redirect('/shop?checkout=unavailable');
  const shipping = shopShippingConfig();
  if (!shipping) redirect('/shop?checkout=unavailable');
  const admin = (await import('@/lib/supabase/admin')).createAdminClient();
  const { data: product } = await admin.from('shop_products').select('id,stripe_price_id,status').eq('id', productId).maybeSingle();
  if (!product || product.status !== 'published' || !/^price_[A-Za-z0-9]+$/.test(product.stripe_price_id)) {
    redirect('/shop?checkout=unavailable');
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent('/shop')}`);
  const { data: priorOrder } = await admin.from('shop_orders').select('id')
    .eq('user_id', user.id).eq('shop_product_id', productId).eq('status', 'paid').maybeSingle();
  if (priorOrder) redirect('/shop?purchase=already-owned');

  const fields: Record<string, string> = {
    mode: 'payment',
    'line_items[0][price]': product.stripe_price_id,
    'line_items[0][quantity]': '1',
    client_reference_id: user.id,
    ...(user.email ? { customer_email: user.email } : {}),
    'metadata[user_id]': user.id,
    'metadata[shop_product_id]': product.id,
    'payment_intent_data[metadata][user_id]': user.id,
    'payment_intent_data[metadata][shop_product_id]': product.id,
    'shipping_address_collection[allowed_countries][0]': shipping.countries[0],
  };
  shipping.countries.slice(1).forEach((country, index) => {
    fields[`shipping_address_collection[allowed_countries][${index + 1}]`] = country;
  });
  shipping.rates.forEach((rate, index) => { fields[`shipping_options[${index}][shipping_rate]`] = rate; });

  try {
    const sessionUrl = await createStripeCheckout(fields, '/account?purchase=shop-returned', '/shop?checkout=cancelled');
    redirect(sessionUrl);
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) throw error;
    console.error('Stripe physical shop checkout failed:', error);
    redirect('/shop?checkout=setup');
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
