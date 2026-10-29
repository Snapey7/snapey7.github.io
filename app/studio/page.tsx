import { redirect } from 'next/navigation';
import { PageShell } from '@/components/site/PageShell';
import { getContentAdminState } from '@/lib/content-admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { CatalogueManager } from './CatalogueManager';

export const dynamic = 'force-dynamic';

export default async function StudioPage() {
  const state = await getContentAdminState();
  if (!state.user) redirect('/login?next=%2Fstudio');

  if (!state.configured) {
    return (
      <PageShell>
        <main className="studio-page">
          <p className="eyebrow">PRIVATE PUBLISHING</p>
          <h1>Enable your content studio</h1>
          <p>Add <code>CONTENT_ADMIN_EMAILS</code> in Vercel with your sign-in email, then redeploy. Only that allowlisted account can upload or publish.</p>
        </main>
      </PageShell>
    );
  }
  if (!state.authorized) redirect('/account?studio=unauthorized');

  let catalogues: {
    id: string;
    title: string;
    description: string;
    product_type: 'model_catalogue' | 'magazine_edition';
    model_slug: string | null;
    status: 'draft' | 'published';
    member_media: { id: string }[];
  }[] = [];
  let loadError = '';
  try {
    const { data, error } = await createAdminClient().from('catalogues')
      .select('id,title,description,product_type,model_slug,status,member_media(id)')
      .order('product_type').order('title');
    if (error) loadError = 'Apply the catalogue publishing migration in Supabase to finish connecting the content studio.';
    else catalogues = (data || []).map((item) => ({ ...item, member_media: item.member_media || [] }));
  } catch {
    loadError = 'Supabase server access is not configured. Add the service role key in Vercel, then redeploy.';
  }

  return (
    <PageShell>
      <main className="studio-page">
        <p className="eyebrow">PRIVATE PUBLISHING</p>
        <h1>Content studio</h1>
        <p className="studio-intro">Upload images to private storage, save releases as drafts, and publish when they’re ready. Stripe prices stay attached to each catalogue.</p>
        {loadError ? <p className="studio-feedback" role="status">{loadError}</p> : <CatalogueManager catalogues={catalogues} />}
      </main>
    </PageShell>
  );
}
