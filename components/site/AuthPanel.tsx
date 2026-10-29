'use client';

import { useActionState, useState } from 'react';
import { submitAuth, type AuthFormState } from '@/app/actions/auth';

type AuthMode = 'login' | 'signup' | 'forgot';

export function AuthPanel({ initialError = false, redirectTo = '/account' }: { initialError?: boolean; redirectTo?: string }) {
  const [mode, setMode] = useState<AuthMode>('login');
  const heading = mode === 'signup' ? 'SIGN UP' : mode === 'forgot' ? 'RESET PASSWORD' : 'LOGIN';

  return (
    <section className="auth-panel" aria-labelledby="auth-heading">
      <h1 id="auth-heading">{heading}</h1>
      {initialError && <p className="auth-notice is-error" role="status">That sign-in link expired or could not be verified. Request a new link and try again.</p>}
      <p className="auth-divider">
        {mode === 'signup' ? 'Create your member account using email' : mode === 'forgot' ? 'We will email you a secure password reset link' : 'Log in using your member email'}
      </p>
      <AuthForm key={mode} mode={mode} redirectTo={redirectTo} onForgot={() => setMode('forgot')} />
      <p className="auth-switch">
        {mode === 'signup' ? 'Already have an account?' : mode === 'forgot' ? 'Remembered your password?' : "Don't have an account?"}{' '}
        <button type="button" onClick={() => setMode(mode === 'signup' || mode === 'forgot' ? 'login' : 'signup')}>
          {mode === 'signup' || mode === 'forgot' ? 'Log in' : 'Sign up'}
        </button>
      </p>
    </section>
  );
}

function AuthForm({ mode, redirectTo, onForgot }: { mode: AuthMode; redirectTo: string; onForgot: () => void }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(submitAuth, {});
  const isSignup = mode === 'signup';

  return (
    <>
      <form action={action}>
        <input type="hidden" name="mode" value={mode} />
        <input type="hidden" name="next" value={redirectTo} />
        {isSignup && (
          <label>
            Name
            <input autoComplete="name" name="name" placeholder="Your name" required />
          </label>
        )}
        <label>
          Email address
          <input autoComplete="email" name="email" placeholder="you@example.com" required type="email" />
        </label>
        {mode !== 'forgot' && (
          <label>
            Password
            <input autoComplete={isSignup ? 'new-password' : 'current-password'} minLength={8} name="password" placeholder={isSignup ? 'At least 8 characters' : 'Your password'} required type="password" />
          </label>
        )}
        {mode === 'login' && (
          <button className="auth-forgot" type="button" onClick={onForgot}>
            Forgot your password?
          </button>
        )}
        <button className="auth-submit" disabled={pending} type="submit">
          {pending ? 'Please wait…' : mode === 'signup' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Sign in with email'}
        </button>
      </form>
      {state.message && <p className={`auth-notice ${state.type === 'error' ? 'is-error' : 'is-success'}`} role="status">{state.message}</p>}
    </>
  );
}
