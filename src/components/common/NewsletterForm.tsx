// @ts-nocheck
import React, { useState } from 'react';

const endpoint = import.meta.env.VITE_NEWSLETTER_ENDPOINT || '';

const NewsletterForm: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle');
  const [message, setMessage] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    setMessage('');
    try {
      if (endpoint) {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        if (!res.ok) throw new Error('Subscribe failed');
      } else {
        const { getFunctions, httpsCallable } = await import('firebase/functions');
        const { app } = await import('../../lib/firebaseConfig');
        const functions = getFunctions(app);
        const subscribe = httpsCallable(functions, 'subscribeNewsletter');
        await subscribe({ email });
      }
      setStatus('success');
      setMessage('Thanks! Please check your email to confirm.');
      setEmail('');
    } catch (err:any) {
      setStatus('error');
      setMessage('Could not subscribe. Please try again.');
    }
  };

  return (
    <form onSubmit={onSubmit} className={`w-full ${compact ? 'space-y-2' : 'space-y-3'}`}>
      <div className={`w-full ${compact ? 'flex flex-col gap-2 sm:flex-row' : 'flex flex-col gap-3 sm:flex-row'}`}>
        <input
          className="w-full rounded-2xl border border-white/30 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-white/60"
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          required
        />
        <button
          className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={status==='loading'}
          type="submit"
        >
          {status==='loading' ? 'Subscribing…' : 'Subscribe'}
        </button>
      </div>
      {message ? (
        <div
          className={`rounded-2xl px-3 py-2 text-xs ${
            status === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'
          }`}
          role="status"
          aria-live="polite"
        >
          {message}
        </div>
      ) : null}
    </form>
  );
};

export default NewsletterForm;
