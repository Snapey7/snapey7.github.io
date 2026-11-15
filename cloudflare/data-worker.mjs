import { timingSafeEqual } from 'node:crypto';

function authorized(request, env) {
  const expected = env.BACKEND_API_SECRET;
  const supplied = request.headers.get('authorization')?.replace(/^Bearer /, '');
  if (!expected || expected.length < 32 || !supplied) return false;
  const a = new TextEncoder().encode(expected);
  const b = new TextEncoder().encode(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/health' && request.method === 'GET') {
      return Response.json({ service: 'impura-data', version: 1 });
    }
    if (!authorized(request, env)) return new Response('Unauthorized', { status: 401 });
    if (url.pathname !== '/query' || request.method !== 'POST') return new Response('Not found', { status: 404 });
    if (Number(request.headers.get('content-length') || 0) > 1_000_000) return new Response('Too large', { status: 413 });
    try {
      const body = await request.json();
      if (!Array.isArray(body.queries) || !body.queries.length || body.queries.length > 100) {
        return Response.json({ error: { code: 'INVALID_QUERY' } }, { status: 400 });
      }
      for (const query of body.queries) {
        if (typeof query.sql !== 'string' || query.sql.length > 100_000 ||
            !/^\s*(select|with|insert|update|delete)\b/i.test(query.sql) ||
            !Array.isArray(query.params) || query.params.length > 100 ||
            query.params.some((p) => p !== null && typeof p !== 'string' && typeof p !== 'number')) {
          return Response.json({ error: { code: 'INVALID_QUERY' } }, { status: 400 });
        }
      }
      // D1 executes the whole batch atomically, including payment-event updates.
      const results = await env.DB.batch(body.queries.map((q) => env.DB.prepare(q.sql).bind(...q.params)));
      return Response.json({ results }, { headers: { 'Cache-Control': 'private, no-store' } });
    } catch (error) {
      const duplicate = String(error?.message || '').includes('UNIQUE constraint failed');
      return Response.json({ error: { code: duplicate ? '23505' : 'BACKEND_ERROR' } }, { status: duplicate ? 409 : 500 });
    }
  },
};
