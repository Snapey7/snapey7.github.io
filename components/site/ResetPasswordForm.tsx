'use client';

import { useActionState } from 'react';
import { updatePassword, type AuthFormState } from '@/app/actions/auth';

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(updatePassword, {});
  return (
    <section className="auth-panel" aria-labelledby="reset-heading">
      <h1 id="reset-heading">CHOOSE A NEW PASSWORD</h1>
      <form action={action}>
        <label>
          New password
          <input autoComplete="new-password" minLength={8} name="password" placeholder="At least 8 characters" required type="password" />
        </label>
        <button className="auth-submit" disabled={pending} type="submit">{pending ? 'Please wait…' : 'Update password'}</button>
      </form>
      {state.message && <p className={`auth-notice ${state.type === 'error' ? 'is-error' : 'is-success'}`} role="status">{state.message}</p>}
    </section>
  );
}
