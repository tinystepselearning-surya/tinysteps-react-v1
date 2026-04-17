// @ts-nocheck
import React, { useRef, useState } from 'react';
import { trackEvent } from '../../lib/analytics';
import { trackLeadFormStart, trackLeadFormSubmit, trackWhatsappClick } from '../../lib/conversionTracking';
import { useAuthStore } from '../../store/useAuthStore';

const ProgramLeadForm = ({ program }: { program: string }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'idle'|'success'>('idle');
  const hasTrackedFormStartRef = useRef(false);

  const { user } = useAuthStore();
  const whatsappHref = `https://wa.me/919618398383?text=${encodeURIComponent(`Hi Tiny Steps! I am ${name || 'a parent'}. I'd like details about ${program}. Child age: ${age || '-'}. Email: ${email || '-'}. Phone: ${phone || '-'}.`)}`;

  const trackFormStartOnce = () => {
    if (hasTrackedFormStartRef.current) return;
    hasTrackedFormStartRef.current = true;
    trackLeadFormStart({
      form_name: 'program_lead_form',
      source_context: `program:${program}`,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    trackEvent('program_lead', { program, childAge: age });
    trackLeadFormSubmit({
      form_name: 'program_lead_form',
      source_context: `program:${program}`,
    });
    setName('');
    setAge('');
    setEmail('');
    setPhone('');
    setStatus('success');
  };

  return (
    <form onSubmit={handleSubmit} onFocusCapture={trackFormStartOnce} className="space-y-3">
      <input className="interactive-input" placeholder="Parent name" value={name} onChange={(e)=>setName(e.target.value)} required />
      <input className="interactive-input" placeholder="Child age" value={age} onChange={(e)=>setAge(e.target.value)} required />
      <input className="interactive-input" type="email" placeholder="Email address" value={email} onChange={(e)=>setEmail(e.target.value)} required />
      <input className="interactive-input" placeholder="Phone number" value={phone} onChange={(e)=>setPhone(e.target.value)} required />
      <button className="w-full rounded-2xl bg-gradient-to-r from-[#ff8f5c] via-[#ffb347] to-[#59c3ff] py-3 font-semibold text-white shadow" type="submit">
        Send inquiry
      </button>
      {!user && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackWhatsappClick('program_lead_form')}
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
