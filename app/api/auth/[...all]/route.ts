import { getCloudflareAuth } from '@/lib/cloudflare/auth';
import { usesCloudflareBackend } from '@/lib/cloudflare/config';
export const dynamic = 'force-dynamic';
async function handler(request: Request) {
  if (!usesCloudflareBackend()) return new Response('Account services are unavailable.', { status: 503 });
  return getCloudflareAuth().handler(request);
}
export { handler as GET, handler as POST };
