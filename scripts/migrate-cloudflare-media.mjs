import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { createR2ReadUrl, createR2UploadUrl, R2_MEDIA_BUCKET_MARKER } from '../lib/member-media-r2.ts';

// Run with server environment variables. Never put credentials in arguments or logs.
// Export is resumable and read-only at the source. Copy refuses to overwrite a
// different existing R2 object, and verifies every uploaded byte by downloading it.
const [mode, backupPath, manifestPath, workDirectory] = process.argv.slice(2);
if (!['export', 'copy', 'audit-existing'].includes(mode) || !backupPath || !manifestPath || !workDirectory) {
  throw new Error('Usage: node scripts/migrate-cloudflare-media.mjs <export|copy|audit-existing> <backup.json> <files.json> <private-directory>');
}
const backup = JSON.parse(await readFile(backupPath, 'utf8'));
const files = JSON.parse(await readFile(manifestPath, 'utf8'));
const directory = resolve(workDirectory);
await mkdir(directory, { recursive: true, mode: 0o700 });
const digest = (bytes, algorithm) => createHash(algorithm).update(bytes).digest('hex');
const safe = path => typeof path === 'string' && path.length && !path.startsWith('/') && !path.includes('..') && !path.includes('\\');
const sourceBuckets = new Set(['member-media', 'editorial-media', 'shop-product-images']);
for (const item of files) {
  if (!sourceBuckets.has(item.bucket) || !safe(item.path) || !Number.isSafeInteger(item.size) || item.size < 1 || !/^[a-f0-9]{32}$/i.test(item.md5)) throw new Error('Invalid source inventory.');
}
if (files.length !== backup.storage_objects.length) throw new Error('The media inventory does not cover the source backup.');
for (const object of backup.storage_objects) {
  const item = files.find(item => item.bucket === object.bucket_id && item.path === object.name);
  if (!item || item.size !== Number(object.metadata.size) || item.md5.toLowerCase() !== object.metadata.eTag.replaceAll('"','').toLowerCase()) throw new Error('Source inventory differs from the database export.');
}
const localPath = item => resolve(directory, 'source', item.bucket, item.path);
async function verifiedSource(item, path = localPath(item)) {
  const bytes = await readFile(path);
  if (bytes.byteLength !== item.size || digest(bytes, 'md5') !== item.md5.toLowerCase()) throw new Error('Source file integrity check failed.');
  return bytes;
}
async function privateWrite(path, bytes) {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  const temporary = path + '.partial';
  await writeFile(temporary, bytes, { mode: 0o600 }); await rename(temporary, path);
}
if (mode === 'export') {
  let recovered = 0;
  // Secure local originals first, even when remote exports remain unavailable.
  const ordered = [...files].sort((a,b) => Number(Boolean(b.local_source)) - Number(Boolean(a.local_source)));
  for (const item of ordered) {
    try { await verifiedSource(item); recovered++; continue; } catch {}
    let bytes;
    if (item.local_source) bytes = await verifiedSource(item, item.local_source);
    else {
      const base = process.env.NEXT_PUBLIC_SUPABASE_URL, secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!base || !secret) throw new Error(`Source export credentials are unavailable; ${recovered}/${files.length} originals preserved locally.`);
      const path = [item.bucket, ...item.path.split('/')].map(encodeURIComponent).join('/');
      const response = await fetch(`${base.replace(/\/$/,'')}/storage/v1/object/authenticated/${path}`, { headers: { Authorization: `Bearer ${secret}`, apikey: secret }, signal: AbortSignal.timeout(60000) });
      if (!response.ok) throw new Error(`Source export blocked (HTTP ${response.status}); ${recovered}/${files.length} originals preserved locally. No source files or R2 objects were changed.`);
      bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.byteLength !== item.size || digest(bytes,'md5') !== item.md5.toLowerCase()) throw new Error('Source download integrity check failed.');
    }
    await privateWrite(localPath(item), bytes); recovered++;
  }
  console.log(JSON.stringify({ originalsPreservedLocally: recovered, expected: files.length }));
} else if (mode === 'copy') {
  // Require all originals before uploading any; no partial migration can pass.
  for (const item of files) await verifiedSource(item);
  const report = [];
  for (const item of files) {
    const bytes = await verifiedSource(item), key = `${item.bucket}/${item.path}`;
    let response = await fetch(await createR2ReadUrl(key), { signal: AbortSignal.timeout(60000) });
    if (response.status === 404) {
      const uploaded = await fetch(await createR2UploadUrl(key), { method: 'PUT', body: bytes, headers: { 'If-None-Match': '*', 'Content-Type': item.path.endsWith('.png') ? 'image/png' : item.path.endsWith('.webp') ? 'image/webp' : item.path.endsWith('.avif') ? 'image/avif' : 'image/jpeg' }, signal: AbortSignal.timeout(60000) });
      if (!uploaded.ok) throw new Error(`Destination upload failed (HTTP ${uploaded.status}).`);
      response = await fetch(await createR2ReadUrl(key), { signal: AbortSignal.timeout(60000) });
    }
    if (!response.ok) throw new Error(`Destination read failed (HTTP ${response.status}).`);
    const copied = Buffer.from(await response.arrayBuffer());
    if (copied.byteLength !== bytes.byteLength || digest(copied,'sha256') !== digest(bytes,'sha256')) throw new Error('Destination integrity mismatch. Existing objects were not overwritten.');
    report.push({ bucket: item.bucket, path: item.path, key, bytes: bytes.byteLength, md5: digest(bytes,'md5'), sha256: digest(bytes,'sha256'), verified: true });
  }
  await privateWrite(resolve(directory,'copied-media.json'), JSON.stringify(report,null,2));
  console.log(JSON.stringify({ verifiedCopies: report.length, expected: files.length, bytes: report.reduce((n,item)=>n+item.bytes,0) }));
} else {
  const existing = backup.member_media.filter(item => item.bucket === R2_MEDIA_BUCKET_MARKER);
  const report = [];
  for (const item of existing) {
    if (!safe(item.storage_path)) throw new Error('Invalid existing R2 path.');
    const response = await fetch(await createR2ReadUrl(item.storage_path), { signal: AbortSignal.timeout(60000) });
    if (!response.ok) throw new Error(`An existing R2 original is unavailable (HTTP ${response.status}).`);
    const bytes = Buffer.from(await response.arrayBuffer());
    report.push({ id: item.id, key: item.storage_path, bytes: bytes.byteLength, sha256: digest(bytes,'sha256') });
  }
  const baselinePath = resolve(directory,'existing-r2-baseline.json');
  let baseline;
  try { baseline = JSON.parse(await readFile(baselinePath,'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (baseline && JSON.stringify(baseline) !== JSON.stringify(report)) throw new Error('Existing R2 originals differ from their migration baseline.');
  if (!baseline) await privateWrite(baselinePath, JSON.stringify(report));
  console.log(JSON.stringify({ existingR2OriginalsVerified: report.length, matchedBaseline: Boolean(baseline) }));
}
