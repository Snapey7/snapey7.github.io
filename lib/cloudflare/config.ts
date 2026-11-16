export function usesCloudflareBackend() {
  return process.env.BACKEND_PROVIDER === 'cloudflare';
}

export function isCloudflareBackendConfigured() {
  return Boolean(process.env.CLOUDFLARE_BACKEND_URL && (process.env.CLOUDFLARE_BACKEND_SECRET || '').length >= 32);
}
