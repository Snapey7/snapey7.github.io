// Run inside the deployment environment; never print credentials or raw Stripe errors.
const priceId = process.argv[2];
if (!/^price_[A-Za-z0-9]+$/.test(priceId || '')) throw new Error('Pass a Stripe Price ID.');
const raw = process.env.STRIPE_SECRET_KEY || '';
const secret = raw.trim();
console.log('STRIPE_DIAGNOSTIC', JSON.stringify({
  configured: Boolean(secret),
  mode: /^(sk|rk)_live_/.test(secret) ? 'live' : 'test or unconfigured',
  trimmed: raw !== secret,
  validFormat: /^(sk|rk)_(test|live)_[A-Za-z0-9]+$/.test(secret),
}));
try {
  for (const path of [`/v1/prices/${priceId}?expand[]=product`]) {
    const response = await fetch(`https://api.stripe.com${path}`, {
      headers: { Authorization: `Bearer ${secret}` }, signal: AbortSignal.timeout(10000),
    });
    const data = await response.json();
    console.log('STRIPE_DIAGNOSTIC', JSON.stringify({
      status: response.status, id: data.id, active: data.active, type: data.type,
      livemode: data.livemode, amount: data.unit_amount, currency: data.currency,
      productId: data.product?.id, product: data.product?.name, errorCode: data.error?.code, errorType: data.error?.type,
      requestId: response.headers.get('request-id'),
    }));
    if (!response.ok) process.exitCode = 1;
  }
} catch {
  console.error('STRIPE_DIAGNOSTIC: Could not reach Stripe.');
  process.exitCode = 1;
}
