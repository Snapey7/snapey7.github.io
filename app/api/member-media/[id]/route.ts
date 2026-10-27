import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentMembership, membershipAllows } from '@/lib/membership';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const membership = await getCurrentMembership().catch(() => null);
  const { id } = await context.params;
  if (!membership) return NextResponse.redirect(new URL('/login', request.url));

  const admin = createAdminClient();
  const { data: media, error } = await admin
    .from('member_media')
    .select('storage_path,bucket,min_tier')
    .eq('id', id)
    .maybeSingle();
  if (error || !media) return new Response('Not found.', { status: 404 });
  if (!membershipAllows(membership, media.min_tier)) return new Response('Membership required.', { status: 403 });

  const { data: signed, error: signError } = await admin.storage
    .from(media.bucket)
    .createSignedUrl(media.storage_path, 60);
  if (signError || !signed?.signedUrl) return new Response('Media is unavailable.', { status: 404 });
  return NextResponse.redirect(signed.signedUrl, { headers: { 'Cache-Control': 'private, no-store' } });
}
