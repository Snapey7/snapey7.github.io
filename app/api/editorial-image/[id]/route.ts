import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response('Not found.', { status: 404 });

  const admin = createAdminClient();
  const { data: image, error } = await admin.from('editorial_images')
    .select('id,storage_path,public_url,published,editorial_stories!inner(status)')
    .eq('id', id)
    .eq('published', true)
    .eq('editorial_stories.status', 'published')
    .maybeSingle();
  if (error || !image) return new Response('Not found.', { status: 404 });

  if (image.public_url) {
    if (!image.public_url.startsWith('/assets/') || image.public_url.includes('..')) {
      return new Response('Not found.', { status: 404 });
    }
    return NextResponse.redirect(new URL(image.public_url, request.url), {
      headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' },
    });
  }

  if (!image.storage_path || image.storage_path.includes('..')) return new Response('Not found.', { status: 404 });
  const { data: signed, error: signError } = await admin.storage
    .from('editorial-media').createSignedUrl(image.storage_path, 300);
  if (signError || !signed?.signedUrl) return new Response('Image is unavailable.', { status: 404 });
  return NextResponse.redirect(signed.signedUrl, {
    headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60' },
  });
}
