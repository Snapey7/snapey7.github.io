'use server';

import { createClient } from '@/lib/supabase/server';
import { sql } from '@/lib/cloudflare/sql';
import { sendAccountEmail } from '@/lib/cloudflare/auth';

type Result = { error?: string; success?: string };
export async function submitCreatorApplication(_previous: Result, form: FormData): Promise<Result> {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user?.id || !user.email || !(user.email_confirmed_at || user.confirmed_at)) return { error: 'Please sign in with a verified account before applying.' };
  const field = (key: string) => String(form.get(key) || '').trim();
  const name = field('name'), discipline = field('discipline'), portfolio = field('portfolio'), message = field('message');
  if (field('website')) return { error: 'Unable to submit the application.' };
  if (!name || name.length > 120 || !['Photographer', 'Model', 'Artist', 'Stylist', 'Filmmaker', 'Other'].includes(discipline) || message.length > 2000 || portfolio.length > 500) return { error: 'Please check the form fields and try again.' };
  let url: URL;
  try { url = new URL(portfolio); if (!['https:', 'http:'].includes(url.protocol) || !url.hostname || url.username || url.password) throw new Error(); }
  catch { return { error: 'Enter a valid portfolio link beginning with https://.' }; }
  const id = crypto.randomUUID(), now = new Date().toISOString();
  try {
    const result = await sql(`INSERT INTO creator_applications(id,user_id,email,name,discipline,portfolio_url,message,created_at) SELECT ?,?,?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM creator_applications WHERE user_id=? AND created_at>?)`, [id,user.id,user.email,name,discipline,url.href,message,now,user.id,new Date(Date.now()-60*60*1000).toISOString()]);
    if (!result.meta.changes) return { error: 'An application was already received from this account recently. Please try again later.' };
  } catch { return { error: 'Applications are temporarily unavailable. Please try again shortly.' }; }
  try {
    await sendAccountEmail('benlukesnape@gmail.com', 'New Impura Vida creator application', `A creator has applied.\n\nName: ${name}\nAccount email: ${user.email}\nCreative role: ${discipline}\nPortfolio: ${url.href}\n\nMessage:\n${message || '(No message provided)'}\n\nView applications in the Impura Vida Studio.`);
    await sql('UPDATE creator_applications SET email_status=? WHERE id=?', ['sent',id]);
  } catch (error) { console.error('Creator notification failed; application retained for Studio review', error instanceof Error ? error.message : 'unknown error'); }
  return { success: 'Your application has been received. The Impura Vida team will review it.' };
}
