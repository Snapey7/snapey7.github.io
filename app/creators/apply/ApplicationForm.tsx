'use client';
import { useActionState } from 'react';
import { submitCreatorApplication } from './actions';
export function ApplicationForm() {
  const [state, action, pending] = useActionState(submitCreatorApplication, {});
  if (state.success) return <p role="status" className="creator-application-success">{state.success}</p>;
  return <form action={action} className="creator-application-form">
    <label>Your name<input name="name" autoComplete="name" maxLength={120} required /></label>
    <label>Creative role<select name="discipline" defaultValue="" required><option value="" disabled>Choose your role</option>{['Photographer','Model','Artist','Stylist','Filmmaker','Other'].map(role => <option key={role}>{role}</option>)}</select></label>
    <label>Portfolio or Instagram link<input name="portfolio" type="url" maxLength={500} placeholder="https://" required /></label>
    <label>Tell us about your work <span>(optional)</span><textarea name="message" maxLength={2000} rows={5} /></label>
    <div className="creator-application-honeypot" aria-hidden="true"><label>Leave blank<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    <p>We’ll use your account email and application details to review your submission and contact you. <a href="/privacy">Privacy policy</a></p>
    {state.error && <p role="alert" className="creator-application-error">{state.error}</p>}
    <button className="outline-cta" disabled={pending} type="submit">{pending ? 'SENDING…' : 'SEND APPLICATION'}</button>
  </form>;
}
