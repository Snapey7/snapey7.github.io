import 'server-only';
import { Kysely, SqliteAdapter, SqliteQueryCompiler, type DatabaseConnection, type DatabaseIntrospector, type Dialect, type Driver, type CompiledQuery, type QueryResult } from 'kysely';
import { sql } from './sql';

function bind(value: unknown): string | number | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'boolean') return Number(value);
  if (typeof value === 'number' || typeof value === 'string') return value;
  throw new Error('Unsupported database parameter.');
}

class CloudflareConnection implements DatabaseConnection {
  async executeQuery<R>(query: CompiledQuery): Promise<QueryResult<R>> {
    const result = await sql(query.sql, query.parameters.map(bind));
    return { rows: result.results as R[], numAffectedRows: BigInt(result.meta.changes || 0) };
  }
  async *streamQuery<R>(query: CompiledQuery): AsyncIterableIterator<QueryResult<R>> {
    yield await this.executeQuery<R>(query);
  }
}

class CloudflareDriver implements Driver {
  async init() {}
  async acquireConnection() { return new CloudflareConnection(); }
  async beginTransaction() { throw new Error('Use a D1 atomic batch instead of a multi-request transaction.'); }
  async commitTransaction() { throw new Error('Multi-request transactions are not supported.'); }
  async rollbackTransaction() { throw new Error('Multi-request transactions are not supported.'); }
  async releaseConnection() {}
  async destroy() {}
}

const dialect: Dialect = {
  createAdapter: () => new SqliteAdapter(),
  createDriver: () => new CloudflareDriver(),
  createQueryCompiler: () => new SqliteQueryCompiler(),
  createIntrospector: (): DatabaseIntrospector => {
    const getTables = async () => {
      // D1 rejects the generic SQLite introspector's correlated PRAGMA query.
      // Read only the authentication schema using D1's supported table function.
      const tables = (await sql("SELECT name,type FROM sqlite_master WHERE name IN ('auth_users','auth_sessions','auth_accounts','auth_verifications','auth_rate_limits') AND type='table'")).results;
      return Promise.all(tables.map(async table => ({
        name: String(table.name), isView: false, isForeign: false,
        columns: (await sql('SELECT * FROM pragma_table_info(?)', [String(table.name)])).results.map(column => ({
          name: String(column.name), dataType: String(column.type),
          isNullable: !column.notnull, isAutoIncrementing: false, hasDefaultValue: column.dflt_value !== null,
        })),
      })));
    };
    return { getSchemas: async () => [], getTables };
  },
};

// Better Auth owns its schema and uses this authenticated Worker connection.
export const authDatabase = new Kysely<Record<string, Record<string, unknown>>>({ dialect });
