const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, imports, globals = {}) {
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(output, { exports, require: (id) => { if (id in imports) return imports[id]; throw new Error(`Unexpected import ${id}`); }, console: { error() {} }, process: { env: {} }, AbortSignal, ...globals }, { filename: file });
  return exports;
}
const priceId = 'price_1UaNp7EYY8tfl15wMCchKu1r';
const catalogueId = '12345678-1234-1234-1234-123456789012';
const price = { id: priceId, active: true, type: 'one_time', livemode: true, unit_amount: 1499, currency: 'gbp', product: { active: true, name: 'Lucy – Digital Catalogue II' } };
function billing({ secret = 'sk_live_example', status = 200, body = price, reject = false } = {}) {
  const calls = [];
  const lib = load('lib/billing/stripe.ts', { 'server-only': {}, 'node:crypto': {}, 'next/navigation': {}, '@/lib/supabase/server': {} }, {
    process: { env: { STRIPE_SECRET_KEY: secret } },
    fetch: async (...args) => { calls.push(args); if (reject) throw new Error('offline'); return new Response(JSON.stringify(body), { status }); },
  });
  return { ...lib, calls };
}

test('retrieves Lucy’s supplied live price with trimmed credentials and no cache', async () => {
  const b = billing({ secret: ' sk_live_example\n' });
  const result = await b.validateStripeOneTimePrice(priceId);
  assert.equal(result.priceId, priceId);
  assert.equal(result.productName, 'Lucy – Digital Catalogue II');
  assert.equal(result.mode, 'live');
  assert.match(b.calls[0][0], new RegExp(`/prices/${priceId}\\?expand`));
  assert.equal(b.calls[0][1].headers.Authorization, 'Bearer sk_live_example');
  assert.equal(b.calls[0][1].cache, 'no-store');
});

test('distinguishes missing key, rejected key, permissions, missing price and connection errors', async () => {
  for (const [options, message] of [
    [{secret:''}, /STRIPE_SECRET_KEY/], [{status:401}, /rejected/], [{status:403}, /permission/], [{status:404}, /connected.*live mode/], [{status:429}, /right now/], [{reject:true}, /reach Stripe/],
  ]) assert.match((await billing(options).validateStripeOneTimePrice(priceId)).error, message);
});

test('rejects archived, recurring, wrong-mode, wrong-ID and inactive-product prices', async () => {
  for (const invalid of [{active:false}, {type:'recurring'}, {livemode:false}, {id:'price_other'}, {unit_amount:null}, {product:{active:false}}, {product:{deleted:true}}]) {
    assert.ok((await billing({body:{...price,...invalid}}).validateStripeOneTimePrice(priceId)).error);
  }
});

function actions({ storedPrice = null, photos = 1, validationError, databaseError, authorized = true } = {}) {
  const updates = [], validated = [];
  const admin = { from(table) { const q = {
    select() { return q; }, eq() { return q; },
    update(values) { updates.push(values); return q; },
    async maybeSingle() { return updates.length ? { data: databaseError ? null : {id:catalogueId,model_slug:'lucy-manzanillo-part-2'}, error:databaseError } : { data: {product_type:'model_catalogue',stripe_price_id:storedPrice} }; },
    then(resolve) { resolve({count:photos,error:null}); },
  }; return q; } };
  const lib = load('app/studio/actions.ts', {
    'next/cache': { revalidatePath() {} },
    '@/lib/content-admin': { async requireContentAdmin() { if (!authorized) throw new Error('unauthorized'); } },
    '@/lib/supabase/admin': { createAdminClient: () => admin },
    '@/lib/content': {}, '@/lib/member-media-r2': {},
    '@/lib/billing/stripe': { async validateStripeOneTimePrice(id) { validated.push(id); return validationError ? {error:validationError} : {priceId:id}; } },
  });
  return {...lib,updates,validated};
}
const input = {catalogueId,description:' Lucy Part II ',stripePriceId:` ${priceId} `,publish:false};

test('saves the exact trimmed price and description, then publishes the saved price with a photo', async () => {
  const a = actions();
  assert.match((await a.updateCatalogue(input)).success, /draft/);
  assert.equal(a.updates[0].stripe_price_id,priceId);
  assert.equal(a.updates[0].description,'Lucy Part II');
  const p = actions({storedPrice:priceId});
  assert.match((await p.updateCatalogue({...input,publish:true})).success, /published/);
  assert.equal(p.validated[0],priceId);
  assert.equal(p.updates[0].status,'published');
});

test('does not persist failed validation or publish a catalogue without photos', async () => {
  const a=actions({validationError:'wrong account'});
  assert.equal((await a.updateCatalogue(input)).error,'wrong account');
  assert.equal(a.updates.length,0);
  const p=actions({photos:0});
  assert.match((await p.updateCatalogue({...input,publish:true})).error,/private image/);
  assert.equal(p.updates.length,0);
});

test('allows a draft without a price but prevents publication; reports duplicate prices', async () => {
  const a=actions();
  assert.ok((await a.updateCatalogue({...input,stripePriceId:''})).success);
  assert.equal(a.updates[0].stripe_price_id,null);
  assert.match((await actions().updateCatalogue({...input,stripePriceId:'',publish:true})).error,/Add a Stripe price/);
  assert.match((await actions({databaseError:{code:'23505'}}).updateCatalogue(input)).error,/another catalogue/);
});

test('requires content-admin authorization before validating or writing', async () => {
  const a=actions({authorized:false});
  await assert.rejects(a.updateCatalogue(input),/unauthorized/);
  assert.equal(a.validated.length,0);
  assert.equal(a.updates.length,0);
});
