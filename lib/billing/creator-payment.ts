type Query = (statement: string, params?: (string | number | null)[]) => Promise<{ results: Record<string, unknown>[]; meta: { changes?: number } }>;
export async function recordCreatorPayment(object: Record<string, unknown>, sql: Query): Promise<'recorded' | 'unpaid' | 'invalid' | 'review'> {
  const metadata = object.metadata as Record<string, unknown> | null | undefined;
  const applicationId = String(metadata?.creator_application_id || ''), userId = String(metadata?.creator_user_id || '');
  if (object.payment_status !== 'paid') return 'unpaid';
  if (!/^[0-9a-f-]{36}$/i.test(applicationId) || !userId || object.amount_total !== 500 || object.currency !== 'usd' || typeof object.id !== 'string') return 'invalid';
  const result = await sql("UPDATE creator_memberships SET status='paid',paid_at=?,stripe_session_id=? WHERE application_id=? AND status='approved' AND EXISTS (SELECT 1 FROM creator_applications WHERE id=? AND user_id=?)", [new Date().toISOString(), object.id, applicationId, applicationId, userId]);
  if (result.meta.changes) return 'recorded';
  const prior = (await sql("SELECT application_id FROM creator_memberships WHERE application_id=? AND status='paid' AND stripe_session_id=?", [applicationId, object.id])).results[0];
  return prior ? 'recorded' : 'review';
}
