import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createFixture } from './fixture.mjs';
import worker from '../../cloudflare/data-worker.mjs';
import { CloudflareQuery } from '../../lib/cloudflare/query.ts';
import { cloudflareRpc } from '../../lib/cloudflare/rpc.ts';

const query = (table, user) => new CloudflareQuery(table, user);
async function insert(table, values) {
  const result = await query(table).insert(values).select().maybeSingle();
  assert.equal(result.error, null); return result.data;
}
const catalogue = (status = 'published') => insert('catalogues', { title: 'Synthetic catalogue', product_type: 'model_catalogue', model_slug: 'test-muse', status });
const photo = (catalogueId, position) => insert('member_media', { title: 'Test', alt_text: 'Test photo', storage_path: randomUUID() + '.jpg', catalogue_id: catalogueId, position, min_tier: 'impura' });
async function event(id, type, object) {
  return cloudflareRpc('apply_stripe_event', { p_event_id: id, p_event_type: type, p_object: object });
}

test('Worker rejects unauthenticated queries and rolls a failed batch back', async () => {
  const f = createFixture();
  try {
    assert.equal((await worker.fetch(new Request('https://data.example.test/query', { method: 'POST', body: '{}' }), f.env)).status, 401);
    const response = await worker.fetch(new Request('https://data.example.test/query', {
      method: 'POST', headers: { authorization: 'Bearer ' + f.env.BACKEND_API_SECRET },
      body: JSON.stringify({ queries: [{ sql: 'INSERT INTO stripe_events(event_id,event_type) VALUES(?,?)', params: ['evt_rollback','test'] }, { sql: 'INSERT INTO missing_table(id) VALUES(?)', params: [1] }] }),
    }), f.env);
    assert.equal(response.status, 500);
    assert.equal(f.database.prepare('SELECT count(*) AS n FROM stripe_events').get().n, 0);
    for (const sql of ['DROP TABLE auth_users', 'PRAGMA table_info(auth_users)']) {
      assert.equal((await worker.fetch(new Request('https://data.example.test/query', { method: 'POST', headers: { authorization: 'Bearer ' + f.env.BACKEND_API_SECRET }, body: JSON.stringify({ queries: [{ sql, params: [] }] }) }), f.env)).status, 400);
    }
  } finally { f.close(); }
});

test('Studio queries preserve relationships, filters, JSON, counts and duplicate errors', async () => {
  const f = createFixture();
  try {
    const cat = await catalogue();
    await photo(cat.id, 2); await photo(cat.id, 1);
    const result = await query('catalogues').select('id,title,member_media(id,position)').eq('id', cat.id).maybeSingle();
    assert.equal(result.error, null); assert.equal(result.data.member_media.length, 2);
    assert.equal((await query('member_media').select('id', { count: 'exact', head: true }).eq('catalogue_id', cat.id)).count, 2);
    assert.equal((await query('catalogues').select('id').in('id', [])).data.length, 0);
    const many = await query('catalogues').select('id').in('id', Array.from({ length: 100 }, (_, i) => i ? randomUUID() : cat.id));
    assert.equal(many.error, null); assert.equal(many.data.length, 1);
    await insert('editorial_stories', { slug: 'test-story', title: 'Test story', body: ['First', 'Second'], status: 'published' });
    await insert('editorial_images', { editorial_slug: 'test-story', storage_path: 'test-story/test.jpg', published: true });
    const story = await query('editorial_stories').select('slug,body,editorial_images(id,published)').eq('editorial_images.published', true).maybeSingle();
    assert.deepEqual(story.data.body, ['First', 'Second']); assert.equal(story.data.editorial_images[0].published, true);
    assert.equal((await query('editorial_images').select('id,editorial_stories!inner(status)').eq('editorial_stories.status', 'published')).data.length, 1);
    await query('editorial_stories').update({ status: 'draft' }).eq('slug', 'test-story');
    assert.equal((await query('editorial_images').select('id,editorial_stories!inner(status)').eq('editorial_stories.status', 'published')).data.length, 0);
    assert.equal((await query('catalogues').insert({ id: cat.id, title: 'duplicate', product_type: 'magazine_edition' })).error.code, '23505');
    assert.equal((await query('catalogues').delete()).error.code, 'INVALID_QUERY');
  } finally { f.close(); }
});

test('Studio can append photos after two uploads while single-record queries still reject multiple matches', async () => {
  const f = createFixture();
  try {
    const cat = await catalogue();
    for (const position of [0, 1, 2, 3]) {
      const last = await query('member_media').select('position').eq('catalogue_id', cat.id)
        .order('position', { ascending: false }).limit(1).maybeSingle();
      assert.equal(last.error, null);
      assert.equal(last.data?.position ?? -1, position - 1);
      await photo(cat.id, (last.data?.position ?? -1) + 1);
    }
    assert.deepEqual((await query('member_media').select('position').eq('catalogue_id', cat.id).order('position')).data.map(x => x.position), [0, 1, 2, 3]);
    assert.equal((await query('member_media').select('position').eq('catalogue_id', cat.id).maybeSingle()).error.code, 'PGRST116');
    assert.equal((await query('member_media').select('position').eq('catalogue_id', cat.id).limit(3).maybeSingle()).error.code, 'PGRST116');
    await insert('editorial_stories', { slug: 'append-test', title: 'Append test', body: [], status: 'draft' });
    for (const position of [4, 9]) await insert('editorial_images', { editorial_slug: 'append-test', storage_path: `append-test/${position}.jpg`, position });
    const lastEditorial = await query('editorial_images').select('position').eq('editorial_slug', 'append-test').order('position', { ascending: false }).limit(1).maybeSingle();
    assert.equal(lastEditorial.error, null);
    assert.equal(lastEditorial.data.position, 9);
  } finally { f.close(); }
});

test('Customer queries cannot read other customers, drafts, originals or payment logs', async () => {
  const f = createFixture();
  try {
    const a = randomUUID(), b = randomUUID(); f.user(a); f.user(b);
    for (const id of [a,b]) await insert('memberships', { user_id: id, provider: 'stripe', provider_subscription_id: 'sub_' + id, tier: 'impura', status: 'active' });
    assert.equal((await query('memberships', async () => a).select()).data.length, 1);
    assert.equal((await query('memberships', async () => a).select().eq('user_id', b)).data.length, 0);
    assert.equal((await query('memberships', async () => null).select()).data.length, 0);
    assert.equal((await query('memberships', async () => a).update({ tier: 'impura' }).eq('user_id', a)).error.code, 'FORBIDDEN');
    await catalogue('draft'); await catalogue('published');
    assert.equal((await query('catalogues', async () => a).select()).data.length, 1);
    for (const table of ['member_media','stripe_events','verotel_events']) assert.equal((await query(table, async () => a).select()).error.code, 'FORBIDDEN');
  } finally { f.close(); }
});

test('Stripe payments grant access once and refunds/disputes revoke it without duplicate replay', async () => {
  const f = createFixture();
  try {
    const id = randomUUID(); f.user(id); const cat = await catalogue();
    const payment = { id: 'cs_test', mode: 'payment', payment_status: 'paid', metadata: { user_id: id, catalogue_id: cat.id }, payment_intent: 'pi_test' };
    assert.equal((await event('evt_paid','checkout.session.completed',payment)).error, null);
    assert.equal((await event('evt_paid','checkout.session.completed',payment)).error, null);
    assert.equal(f.database.prepare('SELECT count(*) AS n FROM portfolio_purchases').get().n, 1);
    assert.equal((await event('evt_refund','charge.refunded',{ payment_intent: 'pi_test' })).error, null);
    assert.equal(f.database.prepare('SELECT status FROM portfolio_purchases').get().status, 'refunded');
    await event('evt_paid','checkout.session.completed',payment);
    assert.equal(f.database.prepare('SELECT status FROM portfolio_purchases').get().status, 'refunded');
    await query('catalogues').update({ status: 'draft' }).eq('id', cat.id);
    assert.equal((await event('evt_paid','checkout.session.completed',payment)).error, null);
    await query('catalogues').update({ status: 'published' }).eq('id', cat.id);
    await event('evt_dispute','charge.dispute.created',{ payment_intent: 'pi_test' });
    assert.equal(f.database.prepare('SELECT status FROM portfolio_purchases').get().status, 'disputed');
    await event('evt_won','charge.dispute.closed',{ payment_intent: 'pi_test', status: 'won' });
    assert.equal(f.database.prepare('SELECT status FROM portfolio_purchases').get().status, 'paid');
    const draft = await catalogue('draft');
    assert.ok((await event('evt_bad','checkout.session.completed',{ ...payment, id: 'cs_bad', metadata: { user_id: id, catalogue_id: draft.id } })).error);
    assert.equal(f.database.prepare("SELECT count(*) AS n FROM stripe_events WHERE event_id='evt_bad'").get().n, 0);
    assert.ok((await event('evt_fk','checkout.session.completed',{ ...payment, id: 'cs_fk', metadata: { user_id: randomUUID(), catalogue_id: cat.id } })).error);
    assert.equal(f.database.prepare("SELECT count(*) AS n FROM stripe_events WHERE event_id='evt_fk'").get().n, 0);
  } finally { f.close(); }
});

test('Subscriptions and physical orders retain linked customers and shipping details', async () => {
  const f = createFixture();
  try {
    const id = randomUUID(); f.user(id);
    const sub = { id: 'sub_test', customer: 'cus_test', status: 'active', metadata: { user_id: id, tier: 'standard', interval: 'monthly' }, current_period_end: 2_000_000_000 };
    assert.equal((await event('evt_sub','customer.subscription.created',sub)).error, null);
    assert.equal((await event('evt_cancel','customer.subscription.deleted',{ ...sub, status: 'canceled', metadata: { tier: 'standard', interval: 'monthly' } })).error, null);
    assert.equal(f.database.prepare('SELECT status,user_id FROM memberships').get().status, 'canceled');
    const product = await insert('shop_products', { title: 'Test edition', status: 'published', stripe_price_id: 'price_test' });
    const order = { id: 'cs_order', mode: 'payment', payment_status: 'paid', metadata: { user_id: id, shop_product_id: product.id }, payment_intent: 'pi_order', customer_details: { email: 'synthetic@example.test' }, collected_information: { shipping_details: { name: 'Synthetic Customer', address: { country: 'GB' } } } };
    assert.equal((await event('evt_order','checkout.session.completed',order)).error, null);
    const result = await query('shop_orders').select('id,shipping_details,shop_products(title)').maybeSingle();
    assert.equal(result.data.shipping_details.address.country, 'GB'); assert.equal(result.data.shop_products.title, 'Test edition');
    await event('evt_order_refund','charge.refunded',{ payment_intent: 'pi_order' });
    assert.equal(f.database.prepare('SELECT status FROM shop_orders').get().status, 'refunded');
  } finally { f.close(); }
});

test('Private photo ordering swaps neighbours and handles both edges', async () => {
  const f = createFixture();
  try {
    const cat = await catalogue(); const a = await photo(cat.id, 5), b = await photo(cat.id, 10), c = await photo(cat.id, 15);
    const move = (id, direction) => cloudflareRpc('move_catalogue_photo', { p_catalogue_id: cat.id, p_photo_id: id, p_direction: direction });
    assert.equal((await move(a.id,'up')).data, false);
    assert.equal((await move(b.id,'up')).data, true);
    assert.deepEqual((await query('member_media').select('id').order('position')).data.map(x => x.id), [b.id,a.id,c.id]);
    assert.equal((await move(c.id,'down')).data, false);
    assert.equal((await move(a.id,'down')).data, true);
    assert.deepEqual((await query('member_media').select('id').order('position')).data.map(x => x.id), [b.id,c.id,a.id]);
  } finally { f.close(); }
});

test('Legacy Verotel memberships preserve cancellation and event idempotency', async () => {
  const f = createFixture();
  try {
    const id = randomUUID(); f.user(id);
    const payload = { custom1: id, custom2: 'impura', saleID: 'sale_test', event: 'initial', nextChargeOn: '2030-01-01' };
    const send = (key, p) => cloudflareRpc('apply_verotel_event', { p_event_key: key, p_payload: p });
    assert.equal((await send('initial',payload)).error, null);
    assert.equal((await send('cancel',{ ...payload, event: 'cancel', expiresOn: '2030-01-01' })).error, null);
    await send('initial',payload);
    assert.equal(f.database.prepare('SELECT status,current_period_end FROM memberships').get().status, 'canceled');
    assert.equal(f.database.prepare('SELECT current_period_end FROM memberships').get().current_period_end, '2030-01-02T00:00:00.000Z');
  } finally { f.close(); }
});

test('Authentication startup inspects its schema through D1-compatible table functions', async () => {
  const f = createFixture();
  try {
    const {authDatabase} = await import('../../lib/cloudflare/dialect.ts');
    const tables = await authDatabase.introspection.getTables();
    assert.deepEqual(tables.map(t=>t.name).sort(),['auth_accounts','auth_rate_limits','auth_sessions','auth_users','auth_verifications']);
    const users=tables.find(t=>t.name==='auth_users');
    assert.ok(users.columns.some(c=>c.name==='emailVerified' && c.dataType==='INTEGER'));
    assert.ok(users.columns.some(c=>c.name==='bannedUntil'));
  } finally { f.close(); }
});
