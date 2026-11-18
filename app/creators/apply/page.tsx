import Link from 'next/link';
import { PageShell } from '@/components/site/PageShell';
import { createClient } from '@/lib/supabase/server';
import { ApplicationForm } from './ApplicationForm';
import { sql } from '@/lib/cloudflare/sql';
import { startCreatorCheckout } from './checkout';
export const dynamic = 'force-dynamic';
export default async function ApplyPage() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  const application = user?.id ? (await sql('SELECT m.status FROM creator_applications a LEFT JOIN creator_memberships m ON m.application_id=a.id WHERE a.user_id=? ORDER BY a.created_at DESC LIMIT 1', [user.id])).results[0] : null;
  return <PageShell><main className="creator-application-page"><p className="eyebrow">IMPURA VIDA · CREATIVE COMMUNITY</p><h1>Share your vision.</h1><p>Tell us about your work and share a portfolio link. We personally review applications before featuring creators. Applying is free; the $5 one-time joining fee applies after approval.</p>{!user ? <><p>Create an account or sign in to apply.</p><Link className="outline-cta" href="/login?next=%2Fcreators%2Fapply">SIGN IN OR CREATE AN ACCOUNT</Link></> : application?.status === 'paid' ? <p>Your creator joining fee has been paid. Thank you!</p> : application?.status === 'approved' ? <><p>Your application has been approved. Complete the one-time $5 joining fee below.</p><form action={startCreatorCheckout}><button className="outline-cta" type="submit">PAY $5 JOINING FEE</button></form><p>Payment confirmation can take a moment to appear here.</p></> : application ? <p>Your application is awaiting review.</p> : <><p>Applying as {user.email}</p><ApplicationForm /></>}</main></PageShell>;
}
