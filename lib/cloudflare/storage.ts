import 'server-only';
import { createR2ReadUrl, createR2UploadUrl, deleteR2Object, R2_MEDIA_BUCKET_MARKER } from '@/lib/member-media-r2';
const buckets = new Set(['member-media','editorial-media','shop-product-images',R2_MEDIA_BUCKET_MARKER]);
export function cloudflareStorage(bucket: string) {
  if (!buckets.has(bucket)) throw new Error('Unknown media bucket.');
  const key = (path: string) => {
    if (!path || path.includes('..') || path.includes('\\') || path.startsWith('/')) throw new Error('Invalid media path.');
    return bucket === R2_MEDIA_BUCKET_MARKER ? path : `${bucket}/${path}`;
  };
  return {
    async createSignedUrl(path: string, expires = 60) {
      try { return { data: { signedUrl: await createR2ReadUrl(key(path), expires) }, error: null }; }
      catch { return { data: null, error: { message: 'Media is temporarily unavailable.' } }; }
    },
    async createSignedUrls(paths: string[], expires = 60) {
      try { return { data: await Promise.all(paths.map(async path => ({ path, signedUrl: await createR2ReadUrl(key(path), expires) }))), error: null }; }
      catch { return { data: null, error: { message: 'Media is temporarily unavailable.' } }; }
    },
    async createSignedUploadUrl(path: string) {
      try { return { data: { path, signedUrl: await createR2UploadUrl(key(path)), token: '' }, error: null }; }
      catch { return { data: null, error: { message: 'Uploads are temporarily unavailable.' } }; }
    },
    async remove(paths: string[]) {
      try { for (const path of paths) await deleteR2Object(key(path)); return { data: paths.map(name => ({ name })), error: null }; }
      catch { return { data: null, error: { message: 'Could not remove this file.' } }; }
    },
  };
}
