import 'server-only';
import { tableColumns } from './schema';
import { BackendError, sql, sqlBatch, type SqlQuery } from './sql';

type Row = Record<string, unknown>;
type Filter = { column: string; op: '=' | '>' | 'in' | 'not-null'; value?: unknown };
type Selection = { columns: string[]; relations: { name: string; inner: boolean; select: string }[] };
type Relation = { table: string; local: string; foreign: string; many: boolean };
const relationships: Record<string, Record<string, Relation>> = {
  catalogues: { member_media: { table: 'member_media', local: 'id', foreign: 'catalogue_id', many: true } },
  editorial_stories: { editorial_images: { table: 'editorial_images', local: 'slug', foreign: 'editorial_slug', many: true } },
  editorial_images: { editorial_stories: { table: 'editorial_stories', local: 'editorial_slug', foreign: 'slug', many: false } },
  shop_products: { shop_product_images: { table: 'shop_product_images', local: 'id', foreign: 'shop_product_id', many: true } },
  shop_orders: { shop_products: { table: 'shop_products', local: 'shop_product_id', foreign: 'id', many: false } },
};
const ownedTables = new Set(['memberships', 'portfolio_purchases', 'shop_orders']);
const jsonFields = new Set(['body', 'shipping_details', 'payload']);
const primaryKey = (table: string) => ({ editorial_stories: 'slug', stripe_events: 'event_id', verotel_events: 'event_key' }[table] || 'id');
const ident = (name: string) => { if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) throw new Error('Invalid column.'); return '"' + name + '"'; };
function column(table: string, name: string) {
  if (!tableColumns[table]?.includes(name)) throw new Error('Unknown database column.');
  return ident(name);
}
function bind(value: unknown): string | number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return Number(value);
  if (typeof value === 'number' || typeof value === 'string') return value;
  return JSON.stringify(value);
}
function selection(value: string): Selection {
  const fields: string[] = []; let depth = 0, start = 0;
  for (let i = 0; i <= value.length; i++) {
    if (value[i] === '(') depth++;
    if (value[i] === ')') depth--;
    if ((value[i] === ',' && depth === 0) || i === value.length) { fields.push(value.slice(start, i).trim()); start = i + 1; }
  }
  if (depth !== 0) throw new Error('Invalid selection.');
  const result: Selection = { columns: [], relations: [] };
  for (const field of fields) {
    const match = field.match(/^([a-z_]+)(!inner)?\((.*)\)$/);
    if (match) result.relations.push({ name: match[1], inner: Boolean(match[2]), select: match[3] });
    else if (field) result.columns.push(field);
  }
  return result;
}
function where(table: string, filters: Filter[], alias?: string): { clauses: string[]; params: SqlQuery['params'] } {
  const clauses: string[] = [], params: SqlQuery['params'] = [];
  for (const filter of filters) {
    const name = (alias ? ident(alias) + '.' : '') + column(table, filter.column);
    if (filter.op === 'not-null') { clauses.push(name + ' IS NOT NULL'); continue; }
    if (filter.op === 'in') {
      if (!Array.isArray(filter.value) || filter.value.length > 100) throw new Error('Invalid filter.');
      if (!filter.value.length) { clauses.push('0=1'); continue; }
      clauses.push(name + ' IN (SELECT value FROM json_each(?))');
      params.push(JSON.stringify(filter.value)); continue;
    }
    if (filter.value === null && filter.op === '=') clauses.push(name + ' IS NULL');
    else { clauses.push(name + ' ' + filter.op + ' ?'); params.push(bind(filter.value)); }
  }
  return { clauses, params };
}
function decode(row: Row): Row {
  const result = { ...row };
  for (const field of Object.keys(result)) {
    if (jsonFields.has(field) && typeof result[field] === 'string') result[field] = JSON.parse(result[field] as string);
    if (field === 'published') result[field] = Boolean(result[field]);
  }
  return result;
}

export class CloudflareQuery implements PromiseLike<{ data: any; error: any; count: number | null }> {
  private fields = '*';
  private selected = false;
  private filters: Filter[] = [];
  private orders: { column: string; ascending: boolean }[] = [];
  private rowLimit?: number;
  private head = false;
  private countRequested = false;
  private one = false;
  private operation: 'select' | 'insert' | 'upsert' | 'update' | 'delete' = 'select';
  private values: Row[] = [];
  private conflict?: string;
  constructor(private table: string, private currentUser?: () => Promise<string | null>) {
    if (!tableColumns[table]) throw new Error('Unknown table.');
  }
  select(fields = '*', options?: { count?: string; head?: boolean }) { this.fields = fields; this.selected = true; this.head = Boolean(options?.head); this.countRequested = Boolean(options?.count); return this; }
  eq(name: string, value: unknown) { this.filters.push({ column: name, op: '=', value }); return this; }
  gt(name: string, value: unknown) { this.filters.push({ column: name, op: '>', value }); return this; }
  in(name: string, value: unknown[]) { this.filters.push({ column: name, op: 'in', value }); return this; }
  not(name: string, operator: string, value: unknown) { if (operator !== 'is' || value !== null) throw new Error('Unsupported filter.'); this.filters.push({ column: name, op: 'not-null' }); return this; }
  order(name: string, options?: { ascending?: boolean }) { this.orders.push({ column: name, ascending: options?.ascending !== false }); return this; }
  limit(value: number) { if (!Number.isSafeInteger(value) || value < 1 || value > 10000) throw new Error('Invalid row limit.'); this.rowLimit = value; return this; }
  maybeSingle() { this.one = true; return this; }
  insert(values: Row | Row[]) { this.operation = 'insert'; this.values = Array.isArray(values) ? values : [values]; return this; }
  upsert(values: Row | Row[], options?: { onConflict?: string }) { this.operation = 'upsert'; this.values = Array.isArray(values) ? values : [values]; this.conflict = options?.onConflict; return this; }
  update(value: Row) { this.operation = 'update'; this.values = [value]; return this; }
  delete() { this.operation = 'delete'; return this; }
  then<TResult1 = { data: any; error: any; count: number | null }, TResult2 = never>(resolve?: ((value: { data: any; error: any; count: number | null }) => TResult1 | PromiseLike<TResult1>) | null, reject?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(resolve, reject);
  }
  private async execute() {
    try {
      if (this.currentUser && this.operation !== 'select') throw new BackendError('FORBIDDEN', 403);
      const localFilters = this.filters.filter(f => !f.column.includes('.'));
      if (this.currentUser && ['member_media', 'stripe_events', 'verotel_events'].includes(this.table)) throw new BackendError('FORBIDDEN', 403);
      if (this.currentUser && ['catalogues', 'editorial_stories'].includes(this.table)) localFilters.push({ column: 'status', op: '=', value: 'published' });
      if (this.currentUser && this.table === 'shop_products') localFilters.push({ column: 'status', op: 'in', value: ['published', 'coming_soon'] });
      if (this.currentUser && this.table === 'editorial_images') localFilters.push({ column: 'published', op: '=', value: true });
      if (this.currentUser && ownedTables.has(this.table)) {
        const userId = await this.currentUser();
        if (!userId) return { data: this.one ? null : [], error: null, count: this.countRequested ? 0 : null };
        localFilters.push({ column: 'user_id', op: '=', value: userId });
      }
      const parsed = selection(this.fields);
      const condition = where(this.table, localFilters, this.operation === 'select' ? 'parent' : undefined);
      if (this.currentUser && this.table === 'editorial_images') condition.clauses.push("EXISTS (SELECT 1 FROM editorial_stories WHERE slug=parent.editorial_slug AND status='published')");
      if (this.currentUser && this.table === 'shop_product_images') condition.clauses.push("EXISTS (SELECT 1 FROM shop_products WHERE id=parent.shop_product_id AND status IN ('published','coming_soon'))");
      for (const r of parsed.relations.filter(r => r.inner)) {
        const relation = relationships[this.table]?.[r.name];
        if (!relation) throw new Error('Unknown relationship.');
        const filters = this.filters.filter(f => f.column.startsWith(r.name + '.')).map(f => ({ ...f, column: f.column.slice(r.name.length + 1) }));
        const child = where(relation.table, filters, 'child');
        condition.clauses.push('EXISTS (SELECT 1 FROM ' + ident(relation.table) + ' AS child WHERE child.' + column(relation.table, relation.foreign) + '=parent.' + column(this.table, relation.local) + (child.clauses.length ? ' AND ' + child.clauses.join(' AND ') : '') + ')');
        condition.params.push(...child.params);
      }
      const whereSql = condition.clauses.length ? ' WHERE ' + condition.clauses.join(' AND ') : '';
      const cols = parsed.columns.includes('*') ? '*' : [...new Set([...parsed.columns, ...parsed.relations.map(r => {
        const relation = relationships[this.table]?.[r.name]; if (!relation) throw new Error('Unknown relationship.'); return relation.local;
      })])].map(c => column(this.table, c)).join(',');
      const orderSql = this.orders.length ? ' ORDER BY ' + this.orders.map(o => column(this.table, o.column) + (o.ascending ? ' ASC' : ' DESC')).join(',') : '';
      const limitSql = ' LIMIT ' + (this.one ? 2 : this.rowLimit || 10000);
      let rows: Row[] = [], count: number | null = null;
      if (this.operation === 'select') {
        if (this.countRequested) count = Number((await sql('SELECT count(*) AS total FROM ' + ident(this.table) + ' AS parent' + whereSql, condition.params)).results[0]?.total || 0);
        if (!this.head) rows = (await sql('SELECT ' + cols + ' FROM ' + ident(this.table) + ' AS parent' + whereSql + orderSql + limitSql, condition.params)).results;
      } else {
        const returning = this.selected ? ' RETURNING ' + cols : '';
        const queries: SqlQuery[] = [];
        if (this.operation === 'delete') {
          if (!localFilters.length) throw new Error('A deletion requires a filter.');
          queries.push({ sql: 'DELETE FROM ' + ident(this.table) + whereSql + returning, params: condition.params });
        } else if (this.operation === 'update') {
          if (!localFilters.length) throw new Error('An update requires a filter.');
          const keys = Object.keys(this.values[0]);
          queries.push({ sql: 'UPDATE ' + ident(this.table) + ' SET ' + keys.map(k => column(this.table, k) + '=?').join(',') + whereSql + returning, params: [...keys.map(k => bind(this.values[0][k])), ...condition.params] });
        } else {
          if (!this.values.length || this.values.length > 100) throw new Error('Invalid insert.');
          for (const row of this.values) {
            const keys = Object.keys(row);
            let conflict = '';
            if (this.operation === 'upsert') {
              const target = this.conflict || primaryKey(this.table);
              conflict = ' ON CONFLICT (' + column(this.table, target) + ') DO UPDATE SET ' + keys.filter(k => k !== target).map(k => column(this.table, k) + '=excluded.' + column(this.table, k)).join(',');
            }
            queries.push({ sql: 'INSERT INTO ' + ident(this.table) + ' (' + keys.map(k => column(this.table, k)).join(',') + ') VALUES (' + keys.map(() => '?').join(',') + ')' + conflict + returning, params: keys.map(k => bind(row[k])) });
          }
        }
        rows = (await sqlBatch(queries)).flatMap(r => r.results);
      }
      rows = rows.map(decode);
      for (const row of rows) for (const r of parsed.relations) {
        const relation = relationships[this.table][r.name];
        const child = new CloudflareQuery(relation.table, this.currentUser).select(r.select).eq(relation.foreign, row[relation.local]);
        for (const f of this.filters.filter(f => f.column.startsWith(r.name + '.'))) child.filters.push({ ...f, column: f.column.slice(r.name.length + 1) });
        const result = await child;
        if (result.error) throw new BackendError(result.error.code);
        row[r.name] = relation.many ? result.data : result.data[0] || null;
      }
      if (this.one && rows.length > 1) return { data: null, error: { code: 'PGRST116', message: 'More than one matching record.' }, count };
      return { data: this.head || (this.operation !== 'select' && !this.selected) ? null : this.one ? rows[0] || null : rows, error: null, count };
    } catch (error) {
      const e = error instanceof BackendError ? error : new BackendError('INVALID_QUERY', 400);
      return { data: null, error: { code: e.code, status: e.status, message: e.message }, count: null };
    }
  }
}
