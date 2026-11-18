import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyStripeSignature } from '@/lib/billing/stripe';
import { sql } from '@/lib/cloudflare/sql';
import { recordCreatorPayment } from '@/lib/billing/creator-payment';

export const dynamic = 'force-dynamic';

const handledEvents = new Set([
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'charge.refunded',
  'charge.dispute.created',
  'charge.dispute.closed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]);

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return new Response('Webhook is not configured.', { status: 503 });
  const rawBody = await request.text();
  if (!verifyStripeSignature(rawBody, request.headers.get('stripe-signature'), secret)) {
    return new Response('Invalid Stripe signature.', { status: 400 });
  }

  let event: { id?: string; type?: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response('Invalid event body.', { status: 400 });
  }
  if (!event.id || !event.type) return new Response('Missing event fields.', { status: 400 });
  if (!handledEvents.has(event.type)) return new Response('Ignored.', { status: 200 });

  const object = event.data?.object;
  if (!object) return new Response('Missing event object.', { status: 400 });
  const metadata = object.metadata as Record<string, unknown> | null | undefined;
  if ((event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') && metadata?.creator_application_id) {
    try {
      const result = await recordCreatorPayment(object, sql);
      if (result === 'invalid') return new Response('Invalid creator payment.', { status: 400 });
      if (result === 'review') return new Response('Creator payment requires review.', { status: 500 });
      return new Response('OK', { status: 200 });
    } catch { return new Response('Could not process creator payment.', { status: 500 }); }
  }
  const { error } = await createAdminClient().rpc('apply_stripe_event', {
    p_event_id: event.id,
    p_event_type: event.type,
    p_object: object,
  });
  if (error) {
    console.error('Could not apply Stripe event:', error.message);
    return new Response('Could not process event.', { status: 500 });
  }
  return new Response('OK', { status: 200 });
}
