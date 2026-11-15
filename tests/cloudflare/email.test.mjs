import {test} from 'node:test';
import assert from 'node:assert/strict';
import {accountEmailConfigured,sendAccountEmail} from '../../lib/cloudflare/auth.ts';
test('Resend HTTPS delivery carries account mail and fails clearly when unavailable',async()=>{
 const fetchBefore=globalThis.fetch;
 process.env.AUTH_RESEND_API_KEY='re_synthetic_test_key';process.env.AUTH_EMAIL_FROM='Test <noreply@example.test>';
 try {
  assert.equal(accountEmailConfigured(),true);
  globalThis.fetch=async(url,options)=>{assert.equal(url,'https://api.resend.com/emails');assert.equal(options.headers.Authorization,'Bearer re_synthetic_test_key');const payload=JSON.parse(options.body);assert.deepEqual(payload.to,['synthetic@example.test']);assert.equal(payload.text,'Synthetic verification link');return Response.json({id:'test_email'});};
  await sendAccountEmail('synthetic@example.test','Confirm account','Synthetic verification link');
  globalThis.fetch=async()=>Response.json({message:'provider unavailable'},{status:503});
  await assert.rejects(sendAccountEmail('synthetic@example.test','Confirm account','Synthetic verification link'),/temporarily unavailable/);
 }finally {globalThis.fetch=fetchBefore;delete process.env.AUTH_RESEND_API_KEY;delete process.env.AUTH_EMAIL_FROM;}
});
