import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { dirname, resolve } from 'node:path';

const [sourcePath, outputPath] = process.argv.slice(2);
if (!sourcePath || !outputPath) throw new Error('Usage: node scripts/prepare-cloudflare-import.mjs <backup.json> <private-output.sql>');
const source = JSON.parse(readFileSync(sourcePath, 'utf8'));
if (source.version !== 1 || !Array.isArray(source.users)) throw new Error('Unsupported migration backup.');
const quote = (v) => v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : typeof v === 'boolean' ? String(Number(v)) : "'" + String(typeof v === 'object' ? JSON.stringify(v) : v).replaceAll("'", "''") + "'";
const identifier = (v) => { if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(v)) throw new Error('Invalid identifier.'); return '"'+v+'"'; };
const tables = ['catalogues','memberships','member_media','portfolio_purchases','shop_products','shop_product_images','shop_orders','editorial_stories','editorial_images','stripe_events','verotel_events'];
const primary = { editorial_stories:'slug',stripe_events:'event_id',verotel_events:'event_key' };
const uuid = "(lower(hex(randomblob(4)))||'-'||lower(hex(randomblob(2)))||'-4'||substr(lower(hex(randomblob(2))),2)||'-8'||substr(lower(hex(randomblob(2))),2)||'-'||lower(hex(randomblob(6))))";
const isoNow = "(strftime('%Y-%m-%dT%H:%M:%fZ','now'))";
let schema = 'PRAGMA foreign_keys=ON;\n';
schema += `CREATE TABLE IF NOT EXISTS auth_users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL COLLATE NOCASE UNIQUE, emailVerified INTEGER NOT NULL DEFAULT 0, image TEXT, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL, bannedUntil TEXT, rawMetadata TEXT);\nCREATE TABLE IF NOT EXISTS auth_sessions (id TEXT PRIMARY KEY, expiresAt TEXT NOT NULL, token TEXT NOT NULL UNIQUE, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL, ipAddress TEXT, userAgent TEXT, userId TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE);\nCREATE INDEX IF NOT EXISTS auth_sessions_user ON auth_sessions(userId);\nCREATE TABLE IF NOT EXISTS auth_accounts (id TEXT PRIMARY KEY, accountId TEXT NOT NULL, providerId TEXT NOT NULL, userId TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE, accessToken TEXT, refreshToken TEXT, idToken TEXT, accessTokenExpiresAt TEXT, refreshTokenExpiresAt TEXT, scope TEXT, password TEXT, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);\nCREATE UNIQUE INDEX IF NOT EXISTS auth_account_provider ON auth_accounts(providerId,accountId);\nCREATE TABLE IF NOT EXISTS auth_verifications (id TEXT PRIMARY KEY, identifier TEXT NOT NULL, value TEXT NOT NULL, expiresAt TEXT NOT NULL, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);\nCREATE INDEX IF NOT EXISTS auth_verifications_identifier ON auth_verifications(identifier);\nCREATE TABLE IF NOT EXISTS auth_rate_limits (id TEXT PRIMARY KEY, key TEXT NOT NULL UNIQUE, count INTEGER NOT NULL, lastRequest INTEGER NOT NULL);\n`;
const foreign = {
 memberships:[['user_id','auth_users','id']], member_media:[['catalogue_id','catalogues','id']],
 portfolio_purchases:[['user_id','auth_users','id'],['media_id','member_media','id'],['catalogue_id','catalogues','id']],
 shop_product_images:[['shop_product_id','shop_products','id']],
 shop_orders:[['user_id','auth_users','id'],['shop_product_id','shop_products','id']],
 editorial_images:[['editorial_slug','editorial_stories','slug']],
};
const checks = {
 catalogues: ["product_type IN ('model_catalogue','magazine_edition','physical_shop')", "status IN ('draft','published')", "(product_type='model_catalogue' AND model_slug IS NOT NULL) OR product_type IN ('magazine_edition','physical_shop')"],
 memberships: ["provider IN ('stripe','verotel')", "tier IN ('standard','impura')", "status IN ('active','canceled','expired','refunded','chargeback')", "billing_interval IS NULL OR billing_interval IN ('monthly','yearly')"],
 member_media: ["bucket IN ('member-media','member-media-r2')", "min_tier IN ('standard','impura')"],
 portfolio_purchases: ["status IN ('paid','refunded','disputed')", '(media_id IS NOT NULL)+(catalogue_id IS NOT NULL)=1'],
 shop_products: ["status IN ('draft','published','coming_soon')"],
 shop_orders: ["status IN ('paid','refunded','disputed')"],
 editorial_stories: ["status IN ('draft','published')", "slug<>'' AND slug NOT GLOB '*[^a-z0-9-]*' AND substr(slug,1,1)<>'-' AND substr(slug,-1)<>'-' AND instr(slug,'--')=0"],
 editorial_images: ['(storage_path IS NOT NULL)+(public_url IS NOT NULL)=1', 'published IN (0,1)'],
};
for (const table of tables) {
 const columns=source.schema.filter((c)=>c.table_name===table);
 if (!columns.length || !Array.isArray(source[table])) throw new Error('Missing table: '+table);
 const definitions=columns.map(c=>{
  let text=identifier(c.column_name)+' '+(['integer','boolean'].includes(c.data_type)?'INTEGER':'TEXT');
  if(c.column_name===(primary[table]||'id')) text+=' PRIMARY KEY';
  if(c.is_nullable==='NO')text+=' NOT NULL';
  const d=c.column_default;
  if(d){
   if(d.includes('gen_random_uuid'))text+=' DEFAULT '+uuid;
   else if(d.includes('now()'))text+=' DEFAULT '+isoNow;
   else if(c.data_type==='boolean')text+=' DEFAULT '+(d==='true'?'1':'0');
   else if(c.data_type==='ARRAY')text+=" DEFAULT '[]'";
   else if(/^-?\d+$/.test(d))text+=' DEFAULT '+d;
   else if(/^'.*'::text$/.test(d))text+=' DEFAULT '+d.slice(0,-6);
  }
  return text;
 });
 for(const [column,target,key] of foreign[table]||[]) definitions.push(`FOREIGN KEY(${identifier(column)}) REFERENCES ${identifier(target)}(${identifier(key)}) ON DELETE ${table==='shop_orders' && column==='shop_product_id' ? 'RESTRICT' : 'CASCADE'}`);
 for(const check of checks[table]||[]) definitions.push(`CHECK (${check})`);
 schema+=`CREATE TABLE IF NOT EXISTS ${identifier(table)} (${definitions.join(',')});\n`;
}
for(const [name,table,columns] of [
 ['catalogue_price','catalogues','stripe_price_id'],['membership_subscription','memberships','provider_subscription_id'],
 ['membership_reference','memberships','provider_reference_id'],
 ['media_path','member_media','storage_path'],['portfolio_media','portfolio_purchases','user_id,media_id'],
 ['portfolio_catalogue','portfolio_purchases','user_id,catalogue_id'],['portfolio_session','portfolio_purchases','stripe_checkout_session_id'],
 ['shop_price','shop_products','stripe_price_id'],['shop_image_path','shop_product_images','storage_path'],
 ['order_session','shop_orders','stripe_checkout_session_id'],['editorial_image_path','editorial_images','storage_path'],
 ])schema+=`CREATE UNIQUE INDEX IF NOT EXISTS ${name} ON ${table}(${columns});\n`;
schema+='ALTER TABLE stripe_events ADD COLUMN processing_token TEXT;\nALTER TABLE verotel_events ADD COLUMN processing_token TEXT;\n';
schema+='CREATE INDEX IF NOT EXISTS member_media_catalogue ON member_media(catalogue_id);\nCREATE INDEX IF NOT EXISTS editorial_images_story ON editorial_images(editorial_slug,position);\n';
let inserts='';
function insert(table,row) { const keys=Object.keys(row); inserts+=`INSERT INTO ${identifier(table)} (${keys.map(identifier).join(',')}) VALUES (${keys.map(k=>quote(row[k])).join(',')});\n`; }
for(const u of source.users){
 if(!u.id||!u.email||!/^\$2[aby]\$/.test(u.encrypted_password||''))throw new Error('An account requires a supported password hash before import.');
 const name=u.raw_user_meta_data?.display_name||u.raw_user_meta_data?.name||u.email.split('@')[0];
 insert('auth_users',{id:u.id,name,email:u.email.toLowerCase(),emailVerified:Boolean(u.email_confirmed_at),image:null,createdAt:new Date(u.created_at).toISOString(),updatedAt:new Date(u.updated_at).toISOString(),bannedUntil:u.banned_until,rawMetadata:JSON.stringify(u.raw_user_meta_data||{})});
 insert('auth_accounts',{id:randomUUID(),accountId:u.id,providerId:'credential',userId:u.id,password:u.encrypted_password,createdAt:new Date(u.created_at).toISOString(),updatedAt:new Date(u.updated_at).toISOString()});
}
for(const table of ['catalogues','shop_products','editorial_stories','memberships','member_media','portfolio_purchases','shop_product_images','shop_orders','editorial_images','stripe_events','verotel_events']){
 const columns=source.schema.filter(c=>c.table_name===table);
 for(const row of source[table]){
  const normalized={...row};
  for(const col of columns)if(normalized[col.column_name]!==null&&col.data_type.startsWith('timestamp'))normalized[col.column_name]=new Date(normalized[col.column_name]).toISOString();
  insert(table,normalized);
 }
}
const out=resolve(outputPath);mkdirSync(dirname(out),{recursive:true,mode:0o700});
writeFileSync(out,inserts,{mode:0o600});
writeFileSync(new URL('../cloudflare/migrations/0001_backend.sql',import.meta.url),schema);
console.log(JSON.stringify({accounts:source.users.length,tables:tables.length,records:tables.reduce((n,t)=>n+source[t].length,0),privateImportWritten:true}));
