import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getVerotelConfig, verifyVerotelSignature } from '@/lib/billing/verotel';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const config = getVerotelConfig();
  if (!config) return new Response('Payment provider is not configured.', { status: 503 });

  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  if (!verifyVerotelSignature(params, config.signatureKey)) {
    return new Response('Invalid signature.', { status: 400 });
  }
  if (params.shopID !== config.shopID || params.type !== 'subscription') {
    return new Response('Invalid merchant or transaction type.', { status: 400 });
  }
  if (!params.event || !params.saleID || !params.custom1 || !params.custom2) {
    return new Response('Missing required subscription fields.', { status: 400 });
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(params.custom1)) {
    return new Response('Invalid member reference.', { status: 400 });
  }

  const eventKey = params.transactionID
    ? `${params.saleID}:${params.event}:${params.transactionID}`
    : `${params.saleID}:${params.event}:${params.nextChargeOn || params.expiresOn || params.event}`;
  const retainedFields = [
    'event', 'saleID', 'transactionID', 'referenceID', 'custom1', 'custom2',
    'nextChargeOn', 'expiresOn', 'subscriptionPhase', 'subscriptionType',
  ];
  const safePayload = Object.fromEntries(retainedFields
    .filter((key) => params[key] !== undefined)
    .map((key) => [key, params[key]]));
  const { error } = await createAdminClient().rpc('apply_verotel_event', {
    p_event_key: eventKey,
    p_payload: safePayload,
  });
  if (error) {
    console.error('Could not apply signed Verotel event:', error.message);
    return new Response('Could not process event.', { status: 500 });
  }
  return new Response('OK', { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
