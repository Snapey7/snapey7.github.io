'use client';
import { createBrowserClient } from '@supabase/ssr';
export async function uploadStudioFile(target: { path: string; uploadUrl?: string; token?: string }, file: File, bucket: string) {
  if (target.uploadUrl) {
    const response = await fetch(target.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
    if (!response.ok) throw new Error('The image could not be uploaded. Please try again.');
    return;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || !target.token) throw new Error('Image uploads are temporarily unavailable.');
  const { error } = await createBrowserClient(url, key).storage.from(bucket).uploadToSignedUrl(target.path, target.token, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);
}
