'use server';

import { revalidatePath } from 'next/cache';
import { requireContentAdmin } from '@/lib/content-admin';
import { sql } from '@/lib/cloudflare/sql';
import { sendAccountEmail } from '@/lib/cloudflare/auth';

export async function approveCreator(form: FormData) {
  await requireContentAdmin();
  if (!/^price_[A-Za-z0-9]+$/.test(process.env.STRIPE_CREATOR_JOIN_PRICE_ID || '') || !process.env.STRIPE_WEBHOOK_SECRET) throw new Error('Creator joining payments are not configured yet.');
  const id = String(form.get('application_id') || '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error('Invalid application.');
  const application = (await sql('SELECT name,email FROM creator_applications WHERE id=?', [id])).results[0];
  if (!application) throw new Error('Application not found.');
  await sql("INSERT INTO creator_memberships(application_id,status,approved_at) VALUES(?, 'approved', ?) ON CONFLICT(application_id) DO NOTHING", [id, new Date().toISOString()]);
  const membership = (await sql('SELECT status,notification_status FROM creator_memberships WHERE application_id=?', [id])).results[0];
  if (membership?.status === 'approved' && membership.notification_status !== 'sent') {
    try {
      const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.impuravidamagazine.com').replace(/\/$/, '');
      await sendAccountEmail(String(application.email), 'Your Impura Vida creator application', `Hello ${application.name},\n\nYour creator application has been approved. Sign in to your Impura Vida account to complete the one-time $5 joining fee:\n\n${site}/creators/apply\n\nThank you,\nImpura Vida`);
      await sql("UPDATE creator_memberships SET notification_status='sent' WHERE application_id=?", [id]);
    } catch { await sql("UPDATE creator_memberships SET notification_status='failed' WHERE application_id=?", [id]); }
  }
  revalidatePath('/studio');
  revalidatePath('/creators/apply');
}
