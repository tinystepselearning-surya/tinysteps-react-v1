// @ts-nocheck
import React, { useState } from 'react';
import { trackEvent } from '../../lib/analytics';
import { useAuthStore } from '../../store/useAuthStore';

const ProgramLeadForm = ({ program }: { program: string }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'idle'|'success'>('idle');

  const { user } = useAuthStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    trackEvent('program_lead', { program, childAge: age });
    setName('');
    setAge('');
    setEmail('');
    setPhone('');
    setStatus('success');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input className="interactive-input" placeholder="Parent name" value={name} onChange={(e)=>setName(e.target.value)} required />
      <input className="interactive-input" placeholder="Child age" value={age} onChange={(e)=>setAge(e.target.value)} required />
      <input className="interactive-input" type="email" placeholder="Email address" value={email} onChange={(e)=>setEmail(e.target.value)} required />
      <input className="interactive-input" placeholder="Phone number" value={phone} onChange={(e)=>setPhone(e.target.value)} required />
      <button className="w-full rounded-2xl bg-gradient-to-r from-[#ff8f5c] via-[#ffb347] to-[#59c3ff] py-3 font-semibold text-white shadow" type="submit">
        Send inquiry
      </button>
      {!user && (
        <a
          href={`https://wa.me/919618398383?text=${encodeURIComponent(`Hi Tiny Steps! I am ${name || 'a parent'}. I'd like details about ${program}. Child age: ${age || '-'}. Email: ${email || '-'}. Phone: ${phone || '-'}.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-2xl border border-gray-200 bg-white px-4 py-3 text-center text-sm font-semibold text-gray-800"
        >
          Chat on WhatsApp - opens new window
        </a>
      )}
      {status === 'success' && (
        <p className="text-xs text-tiny-green-600">Thanks. We received your request and will follow up by email.</p>
      )}
    </form>
  );
};

export default ProgramLeadForm;
