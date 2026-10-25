'use client';

import { FormEvent, useState } from 'react';

export function AuthPanel() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [notice, setNotice] = useState('');
  const isSignup = mode === 'signup';

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice('Secure account access is not connected yet. Choose an authentication provider to enable sign-up and login.');
  }

  return (
    <section className="auth-panel" aria-labelledby="auth-heading">
      <h1 id="auth-heading">{isSignup ? 'SIGN UP' : 'LOGIN'}</h1>
      <div className="auth-socials">
        <button type="button" onClick={() => setNotice('Google sign-in will be available once authentication is connected.')}>Google</button>
        <button type="button" onClick={() => setNotice('Social sign-in will be available once authentication is connected.')}>Continue with X</button>
      </div>
      <p className="auth-divider">Or, {isSignup ? 'create an account' : 'log in'} using email</p>
      <form onSubmit={submit}>
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
        <label>
          Password
          <input autoComplete={isSignup ? 'new-password' : 'current-password'} minLength={8} name="password" placeholder="At least 8 characters" required type="password" />
        </label>
        {!isSignup && <button className="auth-forgot" type="button" onClick={() => setNotice('Password recovery will be available once authentication is connected.')}>Forgot your password?</button>}
        <button className="auth-submit" type="submit">{isSignup ? 'Create account' : 'Sign in with email'}</button>
      </form>
      {notice && <p className="auth-notice" role="status">{notice}</p>}
      <p className="auth-switch">
        {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button type="button" onClick={() => { setMode(isSignup ? 'login' : 'signup'); setNotice(''); }}>
          {isSignup ? 'Log in' : 'Sign up'}
        </button>
      </p>
    </section>
  );
}
