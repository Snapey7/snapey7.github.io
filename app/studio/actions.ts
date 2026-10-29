'use server';

import { revalidatePath } from 'next/cache';
import { requireContentAdmin } from '@/lib/content-admin';
import { createAdminClient } from '@/lib/supabase/admin';

const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const maxImageBytes = 20 * 1024 * 1024;

function safeExtension(fileName: string, contentType: string) {
  const ext = fileName.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
  const allowed = new Map([['jpeg', 'jpg'], ['jpg', 'jpg'], ['png', 'png'], ['webp', 'webp'], ['avif', 'avif']]);
  if (!allowedImageTypes.has(contentType) || !allowed.has(ext)) return null;
  return allowed.get(ext) || null;
}

export async function createCatalogueUploadTarget(input: {
  catalogueId: string;
  fileName: string;
  contentType: string;
  size: number;
}) {
  await requireContentAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(input.catalogueId)) return { error: 'Choose a valid catalogue.' };
  if (!Number.isFinite(input.size) || input.size <= 0 || input.size > maxImageBytes) {
    return { error: 'Each image must be no larger than 20 MB.' };
  }
  const extension = safeExtension(input.fileName, input.contentType);
  if (!extension) return { error: 'Upload JPEG, PNG, WebP, or AVIF images.' };

  const admin = createAdminClient();
  const { data: catalogue } = await admin.from('catalogues').select('id').eq('id', input.catalogueId).maybeSingle();
  if (!catalogue) return { error: 'Catalogue not found.' };
  const path = `${input.catalogueId}/${crypto.randomUUID()}.${extension}`;
  const { data, error } = await admin.storage.from('member-media').createSignedUploadUrl(path, { upsert: false });
  if (error || !data?.token) return { error: 'Could not prepare a secure upload. Check the private Supabase storage bucket.' };
  return { path, token: data.token };
}

export async function saveCatalogueMedia(catalogueId: string, paths: string[]) {
  await requireContentAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(catalogueId) || !Array.isArray(paths) || paths.length < 1 || paths.length > 100) {
    return { error: 'Choose a catalogue and at least one image.' };
  }
  if (paths.some((path) => typeof path !== 'string' || !path.startsWith(`${catalogueId}/`) || path.includes('..'))) {
    return { error: 'One or more uploaded image paths are invalid.' };
  }
  const admin = createAdminClient();
  const { data: catalogue, error: catalogueError } = await admin.from('catalogues')
    .select('id,title,model_slug,status,product_type').eq('id', catalogueId).maybeSingle();
  if (catalogueError || !catalogue) return { error: 'Catalogue not found.' };

  const rows = paths.map((path, index) => ({
    title: catalogue.title,
    alt_text: `${catalogue.title}, photograph ${index + 1}`,
    bucket: 'member-media' as const,
    storage_path: path,
    min_tier: catalogue.product_type === 'magazine_edition' ? 'standard' as const : 'impura' as const,
    model_slug: catalogue.model_slug,
    catalogue_id: catalogue.id,
  }));
  const { error } = await admin.from('member_media').insert(rows);
  if (error) return { error: 'Images uploaded, but the catalogue could not be updated. Please retry or contact support.' };
  revalidatePath('/studio');
  if (catalogue.model_slug) revalidatePath(`/models/${catalogue.model_slug}`);
  revalidatePath('/library');
  revalidatePath('/shop');
  return { success: `${rows.length} image${rows.length === 1 ? '' : 's'} uploaded to ${catalogue.title}.` };
}

export async function removeCatalogueUploads(catalogueId: string, paths: string[]) {
  await requireContentAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(catalogueId) || !Array.isArray(paths) || paths.length > 100) return;
  if (paths.some((path) => typeof path !== 'string' || !path.startsWith(`${catalogueId}/`) || path.includes('..'))) return;
  if (paths.length) await createAdminClient().storage.from('member-media').remove(paths);
}

export async function updateCatalogue(input: { catalogueId: string; description: string; publish: boolean }) {
  await requireContentAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(input.catalogueId)) return { error: 'Choose a valid catalogue.' };
  const description = input.description.trim().slice(0, 2000);
  const admin = createAdminClient();
  if (input.publish) {
    const { count, error: countError } = await admin.from('member_media')
      .select('id', { count: 'exact', head: true }).eq('catalogue_id', input.catalogueId);
    if (countError || !count) return { error: 'Upload at least one private image before publishing.' };
  }
  const { data: catalogue, error } = await admin.from('catalogues')
    .update({ description, status: input.publish ? 'published' : 'draft', updated_at: new Date().toISOString() })
    .eq('id', input.catalogueId).select('id,model_slug,product_type').maybeSingle();
  if (error || !catalogue) return { error: 'Could not save this catalogue.' };
  revalidatePath('/studio');
  revalidatePath('/models');
  revalidatePath('/shop');
  revalidatePath('/library');
  if (catalogue.model_slug) revalidatePath(`/models/${catalogue.model_slug}`);
  return { success: input.publish ? 'Catalogue published.' : 'Catalogue saved as a draft.' };
}

export async function createMagazineIssue(titleInput: string) {
  await requireContentAdmin();
  if (typeof titleInput !== 'string') return { error: 'Enter an issue title.' };
  const title = titleInput.trim().slice(0, 160);
  if (!title) return { error: 'Enter an issue title.' };
  const { data, error } = await createAdminClient().from('catalogues')
    .insert({ title, description: '', product_type: 'magazine_edition', model_slug: null, stripe_price_id: null, status: 'draft' })
    .select('id').maybeSingle();
  if (error || !data) return { error: 'Could not create the subscriber issue. Apply the latest Supabase migration first.' };
  revalidatePath('/studio');
  revalidatePath('/library');
  return { success: 'Subscriber issue created as a draft. Upload its private pages and publish it when ready.' };
}
