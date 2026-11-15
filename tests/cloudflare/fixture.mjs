import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import worker from '../../cloudflare/data-worker.mjs';

export function createFixture() {
  const database = new DatabaseSync(':memory:');
  database.exec(readFileSync(new URL('../../cloudflare/migrations/0001_backend.sql', import.meta.url), 'utf8'));
  const binding = {
    prepare(sql) { return { bind: (...params) => ({ sql, params }) }; },
    async batch(queries) {
      database.exec('BEGIN');
      try {
        const results = queries.map(({ sql, params }) => {
          const statement = database.prepare(sql);
          if (statement.columns().length) return { results: statement.all(...params), meta: { changes: Number(database.prepare('SELECT changes() AS n').get().n) } };
          const result = statement.run(...params);
          return { results: [], meta: { changes: Number(result.changes), last_row_id: Number(result.lastInsertRowid) } };
        });
        database.exec('COMMIT'); return results;
      } catch (error) { database.exec('ROLLBACK'); throw error; }
    },
  };
  const secret = 'test-only-worker-secret-at-least-32-characters';
  const env = { DB: binding, BACKEND_API_SECRET: secret };
  const originalFetch = globalThis.fetch;
  process.env.CLOUDFLARE_BACKEND_URL = 'https://data.example.test';
  process.env.CLOUDFLARE_BACKEND_SECRET = secret;
  globalThis.fetch = async (input, init) => {
    const request = new Request(input, init);
    if (new URL(request.url).hostname !== 'data.example.test') throw new Error('Unexpected network request in offline migration tests.');
    return worker.fetch(request, env);
  };
  const user = (id, email = `${id}@example.test`) => database.prepare('INSERT INTO auth_users(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,1,?,?)').run(id, 'Test User', email, new Date().toISOString(), new Date().toISOString());
  return { database, env, user, close() { globalThis.fetch = originalFetch; database.close(); } };
}
