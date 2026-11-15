import 'server-only';
import { betterAuth, APIError } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { compare, hash } from 'bcryptjs';
import { createTransport } from 'nodemailer';
import { authDatabase } from './dialect';

export function accountEmailConfigured() {
  if (process.env.AUTH_RESEND_API_KEY && process.env.AUTH_EMAIL_FROM) return true;
  return Boolean(process.env.AUTH_SMTP_HOST && process.env.AUTH_SMTP_USER && process.env.AUTH_SMTP_PASSWORD && process.env.AUTH_EMAIL_FROM);
}

export async function sendAccountEmail(to: string, subject: string, text: string) {
  if (!accountEmailConfigured()) throw new Error('Account email delivery is not configured.');
  if (process.env.AUTH_RESEND_API_KEY) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${process.env.AUTH_RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.AUTH_EMAIL_FROM, to: [to], subject, text }),
      cache: 'no-store', signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error('Account email delivery is temporarily unavailable.');
    return;
  }
  const port = Number(process.env.AUTH_SMTP_PORT || 587);
  const transport = createTransport({
    host: process.env.AUTH_SMTP_HOST, port, secure: port === 465, requireTLS: port !== 465,
    auth: { user: process.env.AUTH_SMTP_USER, pass: process.env.AUTH_SMTP_PASSWORD },
    tls: { minVersion: 'TLSv1.2' }, connectionTimeout: 10000, socketTimeout: 15000,
  });
  await transport.sendMail({ from: process.env.AUTH_EMAIL_FROM, to, subject, text });
}

export function createCloudflareAuth(email = { configured: accountEmailConfigured, send: sendAccountEmail }) {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error('Account services are not configured.');
  const baseURL = process.env.AUTH_BASE_URL ||
    (process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
  return betterAuth({
    appName: 'IMPURA VIDA', baseURL, secret,
    database: { db: authDatabase, type: 'sqlite', transaction: false },
    trustedOrigins: [baseURL, ...(process.env.NEXT_PUBLIC_SITE_URL ? [process.env.NEXT_PUBLIC_SITE_URL] : [])],
    user: { modelName: 'auth_users', additionalFields: {
      bannedUntil: { type: 'date', required: false, input: false },
      rawMetadata: { type: 'string', required: false, input: false },
    } },
    session: { modelName: 'auth_sessions', expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
    account: { modelName: 'auth_accounts' },
    verification: { modelName: 'auth_verifications' },
    advanced: { database: { generateId: () => crypto.randomUUID() } },
    rateLimit: { enabled: true, storage: 'database', modelName: 'auth_rate_limits', window: 60, max: 50 },
    emailAndPassword: {
      enabled: true, requireEmailVerification: true, minPasswordLength: 8, maxPasswordLength: 72,
      password: {
        hash: async (password) => {
          if (Buffer.byteLength(password, 'utf8') > 72) throw new APIError('BAD_REQUEST', { message: 'Use a shorter password.' });
          return hash(password, 12);
        },
        verify: ({ hash: storedHash, password }) => compare(password, storedHash),
      },
      sendResetPassword: async ({ user, url }) => email.send(user.email, 'Reset your IMPURA VIDA password', `Use this link to choose a new password:\n\n${url}\n\nIf you did not request this, you can ignore this email.`),
    },
    emailVerification: {
      sendOnSignUp: true, sendOnSignIn: true, autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => email.send(user.email, 'Confirm your IMPURA VIDA account', `Confirm your email address to finish creating your account:\n\n${url}`),
    },
    databaseHooks: {
      user: { create: { before: async () => {
        if (!email.configured()) throw new APIError('SERVICE_UNAVAILABLE', { message: 'Account registration is temporarily unavailable. Please try again shortly.' });
      } } },
      session: { create: { before: async (session) => {
        const user = await authDatabase.selectFrom('auth_users').select('bannedUntil').where('id', '=', session.userId).executeTakeFirst();
        if (user?.bannedUntil && Date.parse(String(user.bannedUntil)) > Date.now()) throw new APIError('FORBIDDEN', { message: 'This account is unavailable.' });
      } } },
    },
    plugins: [nextCookies()],
  });
}

let instance: ReturnType<typeof createCloudflareAuth> | undefined;
export function getCloudflareAuth() { return instance ||= createCloudflareAuth(); }
