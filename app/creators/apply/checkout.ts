'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { sql } from '@/lib/cloudflare/sql';

export async function startCreatorCheckout(form: FormData) {
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!user?.id || !user.email || !(user.email_confirmed_at || user.confirmed_at)) redirect('/login?next=%2Fcreators%2Fapply');
  const membership = (await sql("SELECT a.id,m.status FROM creator_applications a JOIN creator_memberships m ON m.application_id=a.id WHERE a.user_id=? ORDER BY m.approved_at DESC LIMIT 1", [user.id])).results[0];
  if (!membership || membership.status !== 'approved') redirect('/creators/apply');
  const currency = String(form.get('currency') || 'gbp');
  if (currency !== 'gbp' && currency !== 'usd') redirect('/creators/apply?checkout=unavailable');
  const key = process.env.STRIPE_SECRET_KEY || '', price = (currency === 'gbp' ? process.env.STRIPE_CREATOR_JOIN_GBP_PRICE_ID : process.env.STRIPE_CREATOR_JOIN_USD_PRICE_ID) || '';
  if (!/^(sk|rk)_(test|live)_[A-Za-z0-9]+$/.test(key) || !/^price_[A-Za-z0-9]+$/.test(price) || !process.env.STRIPE_WEBHOOK_SECRET) redirect('/creators/apply?checkout=unavailable');
  let url = '';
  try {
    const priceResponse = await fetch(`https://api.stripe.com/v1/prices/${encodeURIComponent(price)}`, { headers: { Authorization: `Bearer ${key}` }, cache: 'no-store' });
    const details = await priceResponse.json() as { active?: boolean; currency?: string; unit_amount?: number; recurring?: unknown; livemode?: boolean };
    if (!priceResponse.ok || !details.active || details.currency !== currency || details.unit_amount !== 500 || details.recurring || details.livemode !== key.includes('_live_')) throw new Error('Invalid creator joining price.');
    const applicationId = String(membership.id);
    await sql('INSERT INTO creator_checkout_attempts(application_id,attempt_id,currency,created_at) VALUES(?,?,?,?) ON CONFLICT(application_id) DO NOTHING', [applicationId, crypto.randomUUID(), currency, new Date().toISOString()]);
    const attempt = (await sql('SELECT attempt_id,currency,created_at,stripe_session_id FROM creator_checkout_attempts WHERE application_id=?', [applicationId])).results[0];
    if (!attempt || !attempt.attempt_id) throw new Error('Checkout unavailable.');
    if (attempt.stripe_session_id) {
      const existingResponse = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(String(attempt.stripe_session_id))}`, { headers: { Authorization: `Bearer ${key}` }, cache: 'no-store' });
      const existing = await existingResponse.json() as { status?: string; url?: string };
      if (!existingResponse.ok) throw new Error('Checkout unavailable.');
      if (existing.status === 'open' && existing.url) redirect(existing.url);
      if (existing.status === 'expired') {
        await sql('DELETE FROM creator_checkout_attempts WHERE application_id=? AND attempt_id=? AND stripe_session_id=?', [applicationId, String(attempt.attempt_id), String(attempt.stripe_session_id)]);
        redirect('/creators/apply?checkout=expired');
      }
      // Completed sessions can still be awaiting a delayed payment notification.
      throw new Error('Checkout session requires review.');
    }
    if (attempt.currency !== currency) throw new Error('Checkout is still being prepared. Please retry in the original currency.');
    // Stripe can forget idempotency keys after 24 hours; fail closed if an earlier
    // request might have succeeded but its response was never stored.
    if (Date.now() - Date.parse(String(attempt.created_at)) > 23 * 60 * 60 * 1000) throw new Error('Checkout attempt requires review.');
    const site = process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.impuravidamagazine.com').replace(/\/$/, '');
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded', 'Idempotency-Key': `creator-join-${attempt.attempt_id}` }, body: new URLSearchParams({ mode: 'payment', 'adaptive_pricing[enabled]': 'false', 'line_items[0][price]': price, 'line_items[0][quantity]': '1', customer_email: user.email, client_reference_id: user.id, 'metadata[creator_application_id]': applicationId, 'metadata[creator_user_id]': user.id, success_url: `${site}/creators/apply?checkout=returned`, cancel_url: `${site}/creators/apply?checkout=cancelled` }), cache: 'no-store' });
    const session = await response.json() as { id?: string; url?: string; status?: string };
    if (!response.ok || !session.url || session.status !== 'open') throw new Error('Checkout unavailable.');
    if (!session.id) throw new Error('Checkout unavailable.');
    await sql('UPDATE creator_checkout_attempts SET stripe_session_id=? WHERE application_id=? AND attempt_id=?', [session.id, applicationId, String(attempt.attempt_id)]);
    url = session.url;
  } catch (error) { if (error && typeof error === 'object' && 'digest' in error) throw error; redirect('/creators/apply?checkout=unavailable'); }
  redirect(url);
}
