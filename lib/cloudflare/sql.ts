import 'server-only';

export type SqlQuery = { sql: string; params: (string | number | null)[] };
export type SqlResult = { results: Record<string, unknown>[]; meta: { changes?: number; last_row_id?: number } };

export class BackendError extends Error {
  constructor(public code: string, public status = 503) {
    super(code === '23505' ? 'This record already exists.' : 'Account and catalogue services are temporarily unavailable. Please try again shortly.');
  }
}

export async function sqlBatch(queries: SqlQuery[]): Promise<SqlResult[]> {
  const base = process.env.CLOUDFLARE_BACKEND_URL;
  const secret = process.env.CLOUDFLARE_BACKEND_SECRET;
  if (!base || !secret || secret.length < 32) throw new BackendError('BACKEND_NOT_CONFIGURED');
  const url = new URL('/query', base);
  if (url.protocol !== 'https:' && url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') throw new BackendError('BACKEND_NOT_CONFIGURED');
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(15000),
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ queries }),
    });
  } catch { throw new BackendError('BACKEND_UNREACHABLE'); }
  const data = await response.json().catch(() => ({})) as { results?: SqlResult[]; error?: { code?: string } };
  if (!response.ok || !data.results) throw new BackendError(data.error?.code || 'BACKEND_UNAVAILABLE', response.status);
  return data.results;
}

export async function sql(sql: string, params: SqlQuery['params'] = []) {
  return (await sqlBatch([{ sql, params }]))[0];
}
