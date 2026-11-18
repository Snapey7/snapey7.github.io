'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { sql } from '@/lib/cloudflare/sql';

export async function startCreatorCheckout() {
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!user?.id || !user.email || !(user.email_confirmed_at || user.confirmed_at)) redirect('/login?next=%2Fcreators%2Fapply');
  const membership = (await sql("SELECT a.id,m.status FROM creator_applications a JOIN creator_memberships m ON m.application_id=a.id WHERE a.user_id=? ORDER BY m.approved_at DESC LIMIT 1", [user.id])).results[0];
  if (!membership || membership.status !== 'approved') redirect('/creators/apply');
  const key = process.env.STRIPE_SECRET_KEY || '', price = process.env.STRIPE_CREATOR_JOIN_PRICE_ID || '';
  if (!/^(sk|rk)_(test|live)_[A-Za-z0-9]+$/.test(key) || !/^price_[A-Za-z0-9]+$/.test(price) || !process.env.STRIPE_WEBHOOK_SECRET) redirect('/creators/apply?checkout=unavailable');
  let url = '';
  try {
    const priceResponse = await fetch(`https://api.stripe.com/v1/prices/${encodeURIComponent(price)}`, { headers: { Authorization: `Bearer ${key}` }, cache: 'no-store' });
    const details = await priceResponse.json() as { active?: boolean; currency?: string; unit_amount?: number; recurring?: unknown; livemode?: boolean };
    if (!priceResponse.ok || !details.active || details.currency !== 'usd' || details.unit_amount !== 500 || details.recurring || details.livemode !== key.includes('_live_')) throw new Error('Invalid creator joining price.');
    const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.impuravidamagazine.com').replace(/\/$/, '');
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded', 'Idempotency-Key': `creator-join-${membership.id}` }, body: new URLSearchParams({ mode: 'payment', 'payment_method_types[0]': 'card', 'line_items[0][price]': price, 'line_items[0][quantity]': '1', customer_email: user.email, client_reference_id: user.id, 'metadata[creator_application_id]': String(membership.id), 'metadata[creator_user_id]': user.id, success_url: `${site}/creators/apply?checkout=returned`, cancel_url: `${site}/creators/apply?checkout=cancelled` }), cache: 'no-store' });
    const session = await response.json() as { url?: string; status?: string };
    if (!response.ok || !session.url || session.status !== 'open') throw new Error('Checkout unavailable.');
    url = session.url;
  } catch { redirect('/creators/apply?checkout=unavailable'); }
  redirect(url);
}
