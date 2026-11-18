import Link from 'next/link';
import { PageShell } from '@/components/site/PageShell';
import { CreatorsMasthead } from '@/components/site/CreatorsMasthead';
import { createClient } from '@/lib/supabase/server';
import { ApplicationForm } from './ApplicationForm';
import { sql } from '@/lib/cloudflare/sql';
import { startCreatorCheckout } from './checkout';
export const dynamic = 'force-dynamic';
export default async function ApplyPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  const { checkout } = await searchParams;
  const application = user?.id ? (await sql('SELECT m.status FROM creator_applications a LEFT JOIN creator_memberships m ON m.application_id=a.id WHERE a.user_id=? ORDER BY CASE WHEN m.status IS NOT NULL THEN 0 ELSE 1 END, a.created_at DESC LIMIT 1', [user.id])).results[0] : null;
  return <PageShell><div className="creators-page"><CreatorsMasthead /><main className="creator-application-page"><p className="eyebrow">IMPURA VIDA · CREATIVE COMMUNITY</p><h1>Share your vision.</h1><p>Tell us about your work and share a portfolio link. We personally review applications before featuring creators. Applying is free; the £5 or $5 one-time joining fee applies after approval.</p>{checkout === 'unavailable' && <p role="alert">Checkout is temporarily unavailable. Please contact Impura Vida if the problem continues.</p>}{checkout === 'expired' && <p role="status">Your previous checkout expired. Please choose a currency and try again.</p>}{!user ? <><p>Create an account or sign in to apply.</p><Link className="outline-cta" href="/login?next=%2Fcreators%2Fapply">SIGN IN OR CREATE AN ACCOUNT</Link></> : application?.status === 'paid' ? <p>Your creator joining fee has been paid. Thank you!</p> : application?.status === 'approved' ? <><p>Your application has been approved. Complete the one-time £5 or $5 joining fee below.</p><form action={startCreatorCheckout}><label>Currency <select name="currency" defaultValue="gbp"><option value="gbp">GBP — £5</option><option value="usd">USD — $5</option></select></label><button className="outline-cta" type="submit">PAY JOINING FEE</button></form><p>Payment confirmation can take a moment to appear here.</p></> : application ? <p>Your application is awaiting review.</p> : <><p>Applying as {user.email}</p><ApplicationForm /></>}</main></div></PageShell>;
}
