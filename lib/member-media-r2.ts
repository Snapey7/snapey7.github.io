import { createHash, createHmac } from 'node:crypto';

export const R2_MEDIA_BUCKET_MARKER = 'member-media-r2';

function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) return null;
  return { accountId, accessKeyId, secretAccessKey, bucketName };
}

export function isR2MediaConfigured() {
  return getR2Config() !== null;
}

function awsEncode(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
}

function hmac(key: Buffer | string, value: string) {
  return createHmac('sha256', key).update(value).digest();
}

function signingKey(secret: string, date: string) {
  const dateKey = hmac(`AWS4${secret}`, date);
  const regionKey = hmac(dateKey, 'auto');
  const serviceKey = hmac(regionKey, 's3');
  return hmac(serviceKey, 'aws4_request');
}

async function signR2Request(method: 'GET' | 'PUT' | 'DELETE', path: string, expiresSeconds: number) {
  const config = getR2Config();
  if (!config) throw new Error('Cloudflare R2 is not configured.');
  const host = `${config.accountId}.r2.cloudflarestorage.com`;
  const encodedPath = path.split('/').map(awsEncode).join('/');
  const canonicalUri = `/${awsEncode(config.bucketName)}/${encodedPath}`;
  const now = new Date();
  const dateTime = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const shortDate = dateTime.slice(0, 8);
  const scope = `${shortDate}/auto/s3/aws4_request`;
  const query = [
    ['X-Amz-Algorithm', 'AWS4-HMAC-SHA256'],
    ['X-Amz-Credential', `${config.accessKeyId}/${scope}`],
    ['X-Amz-Date', dateTime],
    ['X-Amz-Expires', String(expiresSeconds)],
    ['X-Amz-SignedHeaders', 'host'],
  ].sort(([left], [right]) => left.localeCompare(right));
  const canonicalQuery = query.map(([key, value]) => `${awsEncode(key)}=${awsEncode(value)}`).join('&');
  const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQuery}\nhost:${host}\n\nhost\nUNSIGNED-PAYLOAD`;
  const stringToSign = `AWS4-HMAC-SHA256\n${dateTime}\n${scope}\n${createHash('sha256').update(canonicalRequest).digest('hex')}`;
  const signature = hmac(signingKey(config.secretAccessKey, shortDate), stringToSign).toString('hex');
  return `https://${host}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}

export function createR2UploadUrl(path: string) {
  return signR2Request('PUT', path, 300);
}

export function createR2ReadUrl(path: string, expiresSeconds = 60) {
  return signR2Request('GET', path, expiresSeconds);
}

export async function deleteR2Object(path: string) {
  const url = await signR2Request('DELETE', path, 60);
  const response = await fetch(url, { method: 'DELETE', cache: 'no-store' });
  if (!response.ok) throw new Error(`R2 object deletion failed (${response.status}).`);
}
