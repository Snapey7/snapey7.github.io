import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createFixture } from './fixture.mjs';
import { sql } from '../../lib/cloudflare/sql.ts';
import { recordCreatorPayment } from '../../lib/billing/creator-payment.ts';

test('creator joining payments require approval, the right account and exactly $5, and replay is safe', async () => {
  const f = createFixture();
  try {
    for (const name of ['0002_creator_applications.sql', '0003_creator_approval.sql']) f.database.exec(readFileSync(new URL('../../cloudflare/migrations/' + name, import.meta.url), 'utf8'));
    const user = randomUUID(), application = randomUUID(); f.user(user);
    await sql('INSERT INTO creator_applications(id,user_id,email,name,discipline,portfolio_url,message,created_at) VALUES(?,?,?,?,?,?,?,?)', [application, user, 'test@example.test', 'Test', 'Artist', 'https://example.test', '', new Date().toISOString()]);
    const payment = { id: 'cs_test_creator', payment_status: 'paid', amount_total: 500, currency: 'usd', metadata: { creator_application_id: application, creator_user_id: user } };
    assert.equal(await recordCreatorPayment(payment, sql), 'review');
    await sql("INSERT INTO creator_memberships(application_id,status,approved_at) VALUES(?,'approved',?)", [application, new Date().toISOString()]);
    await sql('INSERT INTO creator_checkout_attempts(application_id,attempt_id,currency,created_at) VALUES(?,?,?,?)', [application, randomUUID(), 'usd', new Date().toISOString()]);
    assert.equal(await recordCreatorPayment({ ...payment, payment_status: 'unpaid' }, sql), 'unpaid');
    assert.equal(await recordCreatorPayment({ ...payment, amount_total: 499 }, sql), 'invalid');
    assert.equal(await recordCreatorPayment({ ...payment, currency: 'gbp' }, sql), 'review');
    assert.equal(await recordCreatorPayment({ ...payment, metadata: { ...payment.metadata, creator_user_id: randomUUID() } }, sql), 'review');
    assert.equal(await recordCreatorPayment(payment, sql), 'recorded');
    assert.equal(await recordCreatorPayment(payment, sql), 'recorded');
    assert.equal(await recordCreatorPayment({ ...payment, id: 'cs_another' }, sql), 'review');
    assert.equal(f.database.prepare('SELECT status FROM creator_memberships WHERE application_id=?').get(application).status, 'paid');
  } finally { f.close(); }
});
