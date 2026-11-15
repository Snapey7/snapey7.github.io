import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'impura-media-test-'));
  const bytes = Buffer.from('synthetic image fixture bytes');
  const item = { bucket: 'member-media', path: 'catalogue/photo.jpg', size: bytes.length, md5: createHash('md5').update(bytes).digest('hex') };
  const backup = { storage_objects: [{ bucket_id: item.bucket, name: item.path, metadata: { size: item.size, eTag: item.md5 } }], member_media: [] };
  const backupPath = join(directory,'backup.json'), manifestPath = join(directory,'files.json'), work = join(directory,'media');
  writeFileSync(backupPath,JSON.stringify(backup)); writeFileSync(manifestPath,JSON.stringify([item]));
  const source = join(work,'source',item.bucket,item.path), destination = join(directory,'r2',item.bucket,item.path);
  const put = (path, data) => { mkdirSync(dirname(path),{recursive:true});writeFileSync(path,data); };
  const run = mode => spawnSync(process.execPath, ['--import', fileURLToPath(new URL('./media-network-fixture.mjs',import.meta.url)), fileURLToPath(new URL('../../scripts/migrate-cloudflare-media.mjs',import.meta.url)),mode,backupPath,manifestPath,work], {
    encoding: 'utf8', env: { ...process.env, R2_ACCOUNT_ID:'synthetic-account',R2_ACCESS_KEY_ID:'synthetic-access',R2_SECRET_ACCESS_KEY:'synthetic-secret',R2_BUCKET_NAME:'test-bucket',TEST_R2_DIRECTORY:join(directory,'r2'),TEST_R2_CALLS:join(directory,'calls.txt') },
  });
  return {directory,bytes,item,backupPath,manifestPath,work,source,destination,put,run,close:()=>rmSync(directory,{recursive:true,force:true})};
}

test('Image copying stops before contacting R2 if any original is missing or damaged', () => {
  const f = fixture();
  try {
    assert.notEqual(f.run('copy').status,0);
    assert.equal(existsSync(join(f.directory,'calls.txt')),false);
    f.put(f.source,Buffer.from('damaged'));
    assert.notEqual(f.run('copy').status,0);
    assert.equal(existsSync(join(f.directory,'calls.txt')),false);
  } finally { f.close(); }
});

test('Verified image copies round-trip with checksums and resume without overwriting', () => {
  const f = fixture();
  try {
    f.put(f.source,f.bytes);
    const copied = f.run('copy'); assert.equal(copied.status,0,copied.stderr);
    assert.deepEqual(readFileSync(f.destination),f.bytes);
    const report=JSON.parse(readFileSync(join(f.work,'copied-media.json'),'utf8'));
    assert.equal(report.length,1);assert.equal(report[0].verified,true);
    assert.equal(report[0].sha256,createHash('sha256').update(f.bytes).digest('hex'));
    const before = readFileSync(join(f.directory,'calls.txt'),'utf8').split('\n').filter(x=>x==='PUT').length;
    assert.equal(f.run('copy').status,0);
    const after = readFileSync(join(f.directory,'calls.txt'),'utf8').split('\n').filter(x=>x==='PUT').length;
    assert.equal(after,before);
    f.put(f.destination,Buffer.from('different existing object'));
    assert.notEqual(f.run('copy').status,0);
    assert.equal(readFileSync(f.destination,'utf8'),'different existing object');
  } finally { f.close(); }
});

test('Image inventory must match the source database export', () => {
  const f = fixture();
  try {
    f.put(f.source,f.bytes);
    writeFileSync(f.manifestPath,JSON.stringify([{...f.item,path:'wrong.jpg'}]));
    assert.notEqual(f.run('copy').status,0);
    assert.equal(existsSync(join(f.directory,'calls.txt')),false);
  } finally { f.close(); }
});
