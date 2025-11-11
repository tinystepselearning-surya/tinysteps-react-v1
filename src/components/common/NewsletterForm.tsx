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
    <form onSubmit={onSubmit} className={`w-full ${compact? 'flex gap-2' : ''}`}>
      <input
        className="interactive-input"
        type="email"
        placeholder="Email address"
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
        required
      />
      <button className="px-4 rounded-2xl bg-primary-600 text-white" disabled={status==='loading'}>
        {status==='loading' ? 'Subscribing…' : 'Subscribe'}
      </button>
      {message && <div className="mt-2 text-xs text-gray-600">{message}</div>}
    </form>
  );
};

export default NewsletterForm;
