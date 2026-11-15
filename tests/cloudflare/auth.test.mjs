import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { hash } from 'bcryptjs';
import { createFixture } from './fixture.mjs';
import { createCloudflareAuth } from '../../lib/cloudflare/auth.ts';

test('Imported bcrypt accounts sign in with existing passwords; sessions and sign-out work', async () => {
  const f = createFixture();
  try {
    process.env.AUTH_SECRET = 'synthetic-test-auth-secret-at-least-32-characters';
    process.env.AUTH_BASE_URL = 'https://website.example.test';
    const id = randomUUID(); f.user(id, 'existing@example.test');
    f.database.prepare('INSERT INTO auth_accounts(id,accountId,providerId,userId,password,createdAt,updatedAt) VALUES(?,?,\'credential\',?,?,?,?)').run(randomUUID(),id,id,await hash('synthetic-password',10),new Date().toISOString(),new Date().toISOString());
    const auth = createCloudflareAuth({ configured: () => true, send: async () => {} });
    const request = (path, body, cookie) => auth.handler(new Request('https://website.example.test/api/auth/' + path, {
      method: body ? 'POST' : 'GET', headers: { 'x-forwarded-for': '203.0.113.10', ...(body ? { 'Content-Type': 'application/json', Origin: 'https://website.example.test' } : {}), ...(cookie ? { Cookie: cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}),
    }));
    assert.equal((await request('sign-in/email',{ email: 'existing@example.test', password: 'wrong-password' })).status, 401);
    const response = await request('sign-in/email',{ email: 'existing@example.test', password: 'synthetic-password' });
    assert.equal(response.status, 200, await response.clone().text());
    const cookie = response.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');
    const session = await request('get-session',undefined,cookie);
    assert.equal(session.status, 200); assert.equal((await session.json()).user.id, id);
    assert.equal((await request('sign-out',{},cookie)).status, 200);
    assert.equal(await (await request('get-session',undefined,cookie)).json(), null);
    f.database.prepare('UPDATE auth_users SET bannedUntil=? WHERE id=?').run('2099-01-01T00:00:00.000Z',id);
    assert.equal((await request('sign-in/email',{ email: 'existing@example.test', password: 'synthetic-password' })).status, 403);
  } finally { f.close(); }
});

test('Signup requires verification, then password recovery changes the credential', async () => {
  const f = createFixture();
  try {
    process.env.AUTH_SECRET = 'synthetic-test-auth-secret-at-least-32-characters';
    process.env.AUTH_BASE_URL = 'https://website.example.test';
    const messages = [];
    const auth = createCloudflareAuth({ configured: () => true, send: async (to, subject, text) => { messages.push({ to, subject, text }); } });
    const request = (path, body) => auth.handler(new Request('https://website.example.test/api/auth/' + path, {
      method: body ? 'POST' : 'GET', headers: { 'x-forwarded-for': '203.0.113.11', ...(body ? { 'Content-Type': 'application/json', Origin: 'https://website.example.test' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}),
    }));
    const signup = await request('sign-up/email',{ email: 'new@example.test', password: 'old-synthetic-password', name: 'New Test User', callbackURL: '/account' });
    assert.equal(signup.status, 200, await signup.clone().text());
    assert.equal(f.database.prepare('SELECT emailVerified FROM auth_users').get().emailVerified, 0);
    assert.equal(messages.length, 1);
    assert.equal((await request('sign-in/email',{ email: 'new@example.test', password: 'old-synthetic-password' })).status, 403);
    const verification = messages[0].text.match(/https:\/\/\S+/)[0];
    const verified = await auth.handler(new Request(verification));
    assert.equal(verified.status, 302, await verified.clone().text());
    assert.equal(f.database.prepare('SELECT emailVerified FROM auth_users').get().emailVerified, 1);
    assert.equal((await request('sign-in/email',{ email: 'new@example.test', password: 'old-synthetic-password' })).status, 200);
    assert.equal((await request('request-password-reset',{ email: 'new@example.test', redirectTo: '/reset-password' })).status, 200);
    const resetLink = messages.at(-1).text.match(/https:\/\/\S+/)[0];
    const openedReset = await auth.handler(new Request(resetLink));
    assert.equal(openedReset.status, 302, await openedReset.clone().text());
    const token = new URL(openedReset.headers.get('location'), 'https://website.example.test').searchParams.get('token');
    assert.ok(token);
    assert.equal((await request('reset-password',{ newPassword: 'new-synthetic-password', token })).status, 200);
    assert.equal((await request('sign-in/email',{ email: 'new@example.test', password: 'old-synthetic-password' })).status, 401);
    assert.equal((await request('sign-in/email',{ email: 'new@example.test', password: 'new-synthetic-password' })).status, 429);
    // Move the persisted rate-limit window back rather than sleeping in the test.
    f.database.prepare('UPDATE auth_rate_limits SET lastRequest=0').run();
    assert.equal((await request('sign-in/email',{ email: 'new@example.test', password: 'new-synthetic-password' })).status, 200);
    assert.notEqual((await request('reset-password',{ newPassword: 'replayed-password', token })).status, 200);
  } finally { f.close(); }
});

test('Missing email delivery rejects signup without creating an unusable account', async () => {
  const f = createFixture();
  try {
    process.env.AUTH_SECRET = 'synthetic-test-auth-secret-at-least-32-characters';
    process.env.AUTH_BASE_URL = 'https://website.example.test';
    const auth = createCloudflareAuth({ configured: () => false, send: async () => { throw new Error('Email must not be attempted'); } });
    const response = await auth.handler(new Request('https://website.example.test/api/auth/sign-up/email', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://website.example.test' }, body: JSON.stringify({ email: 'blocked@example.test', password: 'synthetic-password', name: 'Blocked Test' }) }));
    assert.equal(response.status, 503, await response.clone().text());
    assert.equal(f.database.prepare('SELECT count(*) AS n FROM auth_users').get().n, 0);
  } finally { f.close(); }
});
