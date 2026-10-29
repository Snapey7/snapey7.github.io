import { startCatalogueCheckout } from '@/lib/billing/stripe';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await startCatalogueCheckout(id);
}
