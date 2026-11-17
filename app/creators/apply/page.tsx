import Link from 'next/link';
import { PageShell } from '@/components/site/PageShell';
import { createClient } from '@/lib/supabase/server';
import { ApplicationForm } from './ApplicationForm';
export const dynamic = 'force-dynamic';
export default async function ApplyPage() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  return <PageShell><main className="creator-application-page"><p className="eyebrow">IMPURA VIDA · CREATIVE COMMUNITY</p><h1>Share your vision.</h1><p>Tell us about your work and share a portfolio link. We personally review applications before featuring creators. Applying is free; the $5 one-time joining fee applies after approval. Joining payments are coming soon.</p>{user ? <><p>Applying as {user.email}</p><ApplicationForm /></> : <><p>Create an account or sign in to apply.</p><Link className="outline-cta" href="/login?next=%2Fcreators%2Fapply">SIGN IN OR CREATE AN ACCOUNT</Link></>}</main></PageShell>;
}
