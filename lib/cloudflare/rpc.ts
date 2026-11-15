import 'server-only';
import { randomUUID } from 'node:crypto';
import { BackendError, sql, sqlBatch, type SqlQuery } from './sql';
type Payload = Record<string, any>;
const uuid = (value: unknown) => typeof value === 'string' && /^[0-9a-f-]{36}$/i.test(value);
const now = () => new Date().toISOString();

async function stripeEvent(args: Payload) {
  const eventId = args.p_event_id, type = args.p_event_type, object = args.p_object;
  if (typeof eventId !== 'string' || typeof type !== 'string' || !object || typeof object !== 'object') throw new BackendError('INVALID_EVENT', 400);
  const marker = randomUUID();
  const guard = 'EXISTS (SELECT 1 FROM stripe_events WHERE event_id=? AND processing_token=?)';
  const token = [eventId, marker];
  const queries: SqlQuery[] = [{ sql: 'INSERT INTO stripe_events(event_id,event_type,processing_token) VALUES(?,?,?) ON CONFLICT(event_id) DO NOTHING', params: [eventId, type, marker] }];
  if (['customer.subscription.created','customer.subscription.updated','customer.subscription.deleted'].includes(type)) {
    const subscriptionId = object.id;
    let userId = object.metadata?.user_id;
    if (!userId) userId = (await sql('SELECT user_id FROM memberships WHERE provider=? AND provider_subscription_id=?', ['stripe', subscriptionId])).results[0]?.user_id;
    const tier = object.metadata?.tier, interval = object.metadata?.interval;
    if (!uuid(userId) || !['standard','impura'].includes(tier) || !['monthly','yearly'].includes(interval) || typeof subscriptionId !== 'string') throw new BackendError('INVALID_EVENT', 400);
    const status = object.status === 'active' || object.status === 'trialing' ? 'active' : object.status === 'canceled' ? 'canceled' : 'expired';
    const end = Number(object.items?.data?.[0]?.current_period_end || object.current_period_end || 0);
    if (!Number.isFinite(end)) throw new BackendError('INVALID_EVENT', 400);
    queries.push({
      sql: `INSERT INTO memberships(id,user_id,provider,tier,status,provider_subscription_id,stripe_customer_id,billing_interval,current_period_end,updated_at) SELECT ?,?,'stripe',?,?,?,?,?,?,? WHERE ${guard} ON CONFLICT(provider_subscription_id) DO UPDATE SET user_id=excluded.user_id,tier=excluded.tier,status=excluded.status,stripe_customer_id=excluded.stripe_customer_id,billing_interval=excluded.billing_interval,current_period_end=excluded.current_period_end,updated_at=excluded.updated_at`,
      params: [randomUUID(), userId, tier, status, subscriptionId, object.customer || null, interval, new Date(end * 1000).toISOString(), now(), ...token],
    });
  } else if (['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(type) && object.mode === 'payment' && object.payment_status === 'paid') {
    const metadata = object.metadata || {}, userId = metadata.user_id;
    if (!uuid(userId) || typeof object.id !== 'string') throw new BackendError('INVALID_EVENT', 400);
    if (metadata.shop_product_id) {
      const product = (await sql('SELECT status FROM shop_products WHERE id=?', [metadata.shop_product_id])).results[0];
      if (product?.status !== 'published') throw new BackendError('INVALID_EVENT', 400);
      queries.push({
        sql: `INSERT INTO shop_orders(id,user_id,shop_product_id,stripe_checkout_session_id,stripe_payment_intent_id,customer_email,shipping_details,status) SELECT ?,?,?,?,?,?,?,'paid' WHERE ${guard} ON CONFLICT(stripe_checkout_session_id) DO UPDATE SET status='paid',stripe_payment_intent_id=excluded.stripe_payment_intent_id,customer_email=excluded.customer_email,shipping_details=excluded.shipping_details,updated_at=?`,
        params: [randomUUID(),userId,metadata.shop_product_id,object.id,object.payment_intent || null,object.customer_details?.email || null,JSON.stringify(object.shipping_details || object.collected_information?.shipping_details || null),...token,now()],
      });
    } else {
      const catalogueId = metadata.catalogue_id || null, mediaId = metadata.media_id || null;
      if ((Boolean(catalogueId) === Boolean(mediaId)) || (catalogueId && !uuid(catalogueId)) || (mediaId && !uuid(mediaId))) throw new BackendError('INVALID_EVENT', 400);
      if (catalogueId && (await sql('SELECT status FROM catalogues WHERE id=?', [catalogueId])).results[0]?.status !== 'published') throw new BackendError('INVALID_EVENT', 400);
      const conflict = catalogueId ? 'user_id,catalogue_id' : 'user_id,media_id';
      queries.push({
        sql: `INSERT INTO portfolio_purchases(id,user_id,media_id,catalogue_id,stripe_checkout_session_id,stripe_payment_intent_id,status) SELECT ?,?,?,?,?,?,'paid' WHERE ${guard} ON CONFLICT(${conflict}) DO UPDATE SET status='paid',stripe_checkout_session_id=excluded.stripe_checkout_session_id,stripe_payment_intent_id=excluded.stripe_payment_intent_id`,
        params: [randomUUID(),userId,mediaId,catalogueId,object.id,object.payment_intent || null,...token],
      });
    }
  } else if (['charge.refunded','charge.dispute.created','charge.dispute.closed'].includes(type) && object.payment_intent) {
    const status = type === 'charge.refunded' ? 'refunded' : type === 'charge.dispute.closed' && object.status === 'won' ? 'paid' : 'disputed';
    queries.push({ sql: `UPDATE portfolio_purchases SET status=? WHERE stripe_payment_intent_id=? AND ${guard}`, params: [status,object.payment_intent,...token] });
    queries.push({ sql: `UPDATE shop_orders SET status=?,updated_at=? WHERE stripe_payment_intent_id=? AND ${guard}`, params: [status,now(),object.payment_intent,...token] });
  }
  await sqlBatch(queries);
}

async function verotelEvent(args: Payload) {
  const p = args.p_payload, key = args.p_event_key;
  if (!p || typeof key !== 'string' || !uuid(p.custom1) || !['standard','impura'].includes(p.custom2) || !p.saleID || !p.event) throw new BackendError('INVALID_EVENT', 400);
  let status: string | undefined, periodEnd = new Date();
  if (['initial','rebill','extend','uncancel','upgrade'].includes(p.event)) {
    status = 'active'; const date = p.nextChargeOn || p.expiresOn;
    periodEnd = /^\d{4}-\d{2}-\d{2}$/.test(date || '') ? new Date(Date.parse(date + 'T00:00:00Z') + 86400000) : new Date(Date.now() + 30 * 86400000);
  } else if (p.event === 'cancel') {
    status = 'canceled'; if (/^\d{4}-\d{2}-\d{2}$/.test(p.expiresOn || '')) periodEnd = new Date(Date.parse(p.expiresOn + 'T00:00:00Z') + 86400000);
  } else if (p.event === 'expiry') status = 'expired';
  else if (p.event === 'chargeback') status = 'chargeback';
  else if (p.event === 'credit' && p.subscriptionPhase === 'terminated') status = 'refunded';
  const marker = randomUUID();
  const queries: SqlQuery[] = [{ sql: 'INSERT INTO verotel_events(event_key,event_type,provider_subscription_id,payload,processing_token) VALUES(?,?,?,?,?) ON CONFLICT(event_key) DO NOTHING', params: [key,p.event,p.saleID,JSON.stringify(p),marker] }];
  if (status) queries.push({
    sql: "INSERT INTO memberships(id,user_id,provider,tier,status,provider_subscription_id,provider_reference_id,current_period_end,updated_at) SELECT ?,?,'verotel',?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM verotel_events WHERE event_key=? AND processing_token=?) ON CONFLICT(provider_subscription_id) DO UPDATE SET user_id=excluded.user_id,tier=excluded.tier,status=excluded.status,provider_reference_id=coalesce(excluded.provider_reference_id,memberships.provider_reference_id),current_period_end=excluded.current_period_end,updated_at=excluded.updated_at",
    params: [randomUUID(),p.custom1,p.custom2,status,p.saleID,p.referenceID || null,periodEnd.toISOString(),now(),key,marker],
  });
  await sqlBatch(queries);
}

async function movePhoto(args: Payload) {
  const catalogue = args.p_catalogue_id, photo = args.p_photo_id;
  const direction = args.p_direction === 'up' ? -1 : args.p_direction === 'down' ? 1 : 0;
  if (!uuid(catalogue) || !uuid(photo) || !direction) throw new BackendError('INVALID_QUERY', 400);
  const result = await sql(`WITH ordered AS (SELECT id,row_number() OVER(ORDER BY position,created_at,id)-1 AS idx FROM member_media WHERE catalogue_id=?), target AS (SELECT idx FROM ordered WHERE id=?) UPDATE member_media SET position=(SELECT CASE WHEN o.id=? THEN target.idx+? WHEN o.idx=target.idx+? THEN target.idx ELSE o.idx END FROM ordered o,target WHERE o.id=member_media.id) WHERE catalogue_id=? AND EXISTS(SELECT 1 FROM ordered,target WHERE ordered.idx=target.idx+?)`, [catalogue,photo,photo,direction,direction,catalogue,direction]);
  return Boolean(result.meta.changes);
}

export async function cloudflareRpc(name: string, args: Payload) {
  try {
    let data: unknown = null;
    if (name === 'apply_stripe_event') await stripeEvent(args);
    else if (name === 'apply_verotel_event') await verotelEvent(args);
    else if (name === 'move_catalogue_photo') data = await movePhoto(args);
    else throw new BackendError('UNKNOWN_OPERATION', 400);
    return { data, error: null };
  } catch (error) {
    const e = error instanceof BackendError ? error : new BackendError('BACKEND_ERROR');
    return { data: null, error: { code: e.code, status: e.status, message: e.message } };
  }
}
