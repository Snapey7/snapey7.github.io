const base = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://invalid.local');
if (!base.hostname.endsWith('.supabase.co')) throw new Error('Expected the configured Supabase project.');
const sample = JSON.parse(process.env.MIGRATION_STORAGE_SAMPLE || '{}');
if (!sample.bucket || !sample.path) throw new Error('Pass one storage object in MIGRATION_STORAGE_SAMPLE.');
const path = '/storage/v1/object/authenticated/' + encodeURIComponent(sample.bucket) + '/' + sample.path.split('/').map(encodeURIComponent).join('/');
const direct = new URL(base);direct.hostname=base.hostname.replace('.supabase.co','.storage.supabase.co');
for (const [kind,host] of [['standard',base],['direct-storage',direct]]) {
 try {
  const response=await fetch(new URL(path,host),{headers:{Authorization:'Bearer '+process.env.SUPABASE_SERVICE_ROLE_KEY,apikey:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY},signal:AbortSignal.timeout(10000)});
  console.log('STORAGE_EXPORT_PROBE',JSON.stringify({kind,status:response.status,bytes:Number(response.headers.get('content-length')||0),type:response.headers.get('content-type')}));
  await response.body?.cancel();
 } catch { console.log('STORAGE_EXPORT_PROBE',JSON.stringify({kind,error:'connection-failed'})); }
}
