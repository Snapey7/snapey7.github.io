import { readFile, writeFile, mkdir, appendFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

// No outbound network is allowed in the media-copy subprocess tests.
globalThis.fetch = async (input, init = {}) => {
  const url = new URL(input);
  if (url.hostname !== 'synthetic-account.r2.cloudflarestorage.com') throw new Error('Unexpected test network destination.');
  const key = url.pathname.split('/').slice(2).map(decodeURIComponent).join('/');
  if (key.includes('..')) throw new Error('Invalid test object path.');
  const path = resolve(process.env.TEST_R2_DIRECTORY, key);
  await appendFile(process.env.TEST_R2_CALLS, (init.method || 'GET') + '\n');
  if (init.method === 'PUT') {
    if (init.headers['If-None-Match'] !== '*') throw new Error('Copy must require an absent destination.');
    await mkdir(dirname(path), { recursive: true });
    try { await writeFile(path, init.body, { flag: 'wx' }); return new Response(null, { status: 200 }); }
    catch (error) { if (error.code === 'EEXIST') return new Response(null, { status: 412 }); throw error; }
  }
  try { return new Response(await readFile(path)); }
  catch (error) { if (error.code === 'ENOENT') return new Response(null, { status: 404 }); throw error; }
};
