'use server';

import { revalidatePath } from 'next/cache';
import { requireContentAdmin } from '@/lib/content-admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { isStripeOneTimePrice } from '@/lib/billing/stripe';

const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const maxImageBytes = 20 * 1024 * 1024;

function validExtension(fileName: string, contentType: string) {
  const extension = fileName.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
  const allowed = new Map([['jpeg', 'jpg'], ['jpg', 'jpg'], ['png', 'png'], ['webp', 'webp'], ['avif', 'avif']]);
  return allowedImageTypes.has(contentType) ? allowed.get(extension) || null : null;
}

function validProductId(id: string) {
  return /^[0-9a-f-]{36}$/i.test(id);
}

export async function createShopImageUploadTarget(input: {
  productId: string;
  fileName: string;
  contentType: string;
  size: number;
}) {
  await requireContentAdmin();
  if (!input || typeof input !== 'object' || typeof input.productId !== 'string' || typeof input.fileName !== 'string' || typeof input.contentType !== 'string') {
    return { error: 'Invalid shop photo details.' };
  }
  if (!validProductId(input.productId)) return { error: 'Choose a valid shop product.' };
  if (!Number.isFinite(input.size) || input.size <= 0 || input.size > maxImageBytes) {
    return { error: 'Each shop photo must be no larger than 20 MB.' };
  }
  const extension = validExtension(input.fileName, input.contentType);
  if (!extension) return { error: 'Upload JPEG, PNG, WebP, or AVIF photos.' };

  const admin = createAdminClient();
  const { data: product } = await admin.from('shop_products').select('id').eq('id', input.productId).maybeSingle();
  if (!product) return { error: 'Shop product not found.' };
  const path = `${input.productId}/${crypto.randomUUID()}.${extension}`;
  const { data, error } = await admin.storage.from('shop-product-images').createSignedUploadUrl(path, { upsert: false });
  if (error || !data?.token) return { error: 'Could not prepare the shop photo upload. Check the shop image bucket migration.' };
  return { path, token: data.token };
}

export async function saveShopImages(productId: string, paths: string[]) {
  await requireContentAdmin();
  if (!validProductId(productId) || !Array.isArray(paths) || paths.length < 1 || paths.length > 100) {
    return { error: 'Choose a shop product and at least one photo.' };
  }
  if (paths.some((path) => typeof path !== 'string' || !path.startsWith(`${productId}/`) || path.includes('..'))) {
    return { error: 'One or more uploaded photo paths are invalid.' };
  }
  const admin = createAdminClient();
  const { data: product } = await admin.from('shop_products').select('id,title').eq('id', productId).maybeSingle();
  if (!product) return { error: 'Shop product not found.' };
  const { count } = await admin.from('shop_product_images').select('id', { count: 'exact', head: true }).eq('shop_product_id', productId);
  const start = count || 0;
  const rows = paths.map((path, index) => ({
    shop_product_id: productId,
    storage_path: path,
    alt_text: `${product.title} product photo ${start + index + 1}`,
    position: start + index,
  }));
  const { error } = await admin.from('shop_product_images').insert(rows);
  if (error) return { error: 'Photos uploaded, but the shop product could not be updated. Please retry.' };
  revalidatePath('/studio');
  revalidatePath('/shop');
  return { success: `${rows.length} public shop photo${rows.length === 1 ? '' : 's'} added.` };
}

export async function removeUnusedShopUploads(productId: string, paths: string[]) {
  await requireContentAdmin();
  if (!validProductId(productId) || !Array.isArray(paths) || paths.length > 100) return;
  if (paths.some((path) => typeof path !== 'string' || !path.startsWith(`${productId}/`) || path.includes('..'))) return;
  if (!paths.length) return;
  const admin = createAdminClient();
  const { data: saved } = await admin.from('shop_product_images').select('storage_path').in('storage_path', paths);
  const savedPaths = new Set((saved || []).map((item) => item.storage_path));
  const unused = paths.filter((path) => !savedPaths.has(path));
  if (unused.length) await admin.storage.from('shop-product-images').remove(unused);
}

export async function removeShopImage(productId: string, imageId: string) {
  await requireContentAdmin();
  if (!validProductId(productId) || !validProductId(imageId)) return { error: 'Invalid shop photo.' };
  const admin = createAdminClient();
  const { data: image } = await admin.from('shop_product_images').select('id,storage_path')
    .eq('id', imageId).eq('shop_product_id', productId).maybeSingle();
  if (!image || !image.storage_path.startsWith(`${productId}/`) || image.storage_path.includes('..')) {
    return { error: 'Shop photo not found.' };
  }
  const { error } = await admin.from('shop_product_images').delete().eq('id', imageId).eq('shop_product_id', productId);
  if (error) return { error: 'Could not remove this shop photo.' };
  await admin.storage.from('shop-product-images').remove([image.storage_path]);
  revalidatePath('/studio');
  revalidatePath('/shop');
  return { success: 'Shop photo removed.' };
}

export async function updateShopProduct(input: { productId: string; description: string; status: 'draft' | 'published' | 'coming_soon' }) {
  await requireContentAdmin();
  if (!input || typeof input !== 'object' || typeof input.productId !== 'string' || typeof input.description !== 'string' || !['draft', 'published', 'coming_soon'].includes(input.status)) {
    return { error: 'Invalid shop product details.' };
  }
  if (!validProductId(input.productId)) return { error: 'Choose a valid shop product.' };
  const description = input.description.trim().slice(0, 2000);
  const { data, error } = await createAdminClient().from('shop_products')
    .update({ description, status: input.status, updated_at: new Date().toISOString() })
    .eq('id', input.productId).select('id').maybeSingle();
  if (error || !data) return { error: 'Could not save this shop product.' };
  revalidatePath('/studio');
  revalidatePath('/shop');
  const messages = {
    draft: 'Shop product saved as a draft.',
    coming_soon: 'Shop product marked as coming soon. Customers can see it but cannot purchase it.',
    published: 'Shop product published for sale.',
  };
  return { success: messages[input.status] };
}

export async function createShopProduct(input: { title: string; stripePriceId: string }) {
  await requireContentAdmin();
  if (!input || typeof input !== 'object' || typeof input.title !== 'string' || typeof input.stripePriceId !== 'string') {
    return { error: 'Enter a product name and Stripe Price ID.' };
  }
  const title = input.title.trim().slice(0, 160);
  const stripePriceId = input.stripePriceId.trim();
  if (!title) return { error: 'Enter the product name.' };
  if (!await isStripeOneTimePrice(stripePriceId)) {
    return { error: 'That does not look like an active one-time Stripe price. Copy a price ID from the same Stripe mode used by this deployment.' };
  }
  const { data, error } = await createAdminClient().from('shop_products')
    .insert({ title, stripe_price_id: stripePriceId, status: 'draft' }).select('id').maybeSingle();
  if (error || !data) return { error: 'Could not add this product. Check whether that Stripe price is already connected.' };
  revalidatePath('/studio');
  revalidatePath('/shop');
  return { success: 'Shop product added as a draft. Add public product photos and publish it when ready.' };
}
