// @ts-nocheck
import React, { useState } from 'react';
import Meta from '../components/common/Meta';
import { trackEvent } from '../lib/analytics';

const phone = '+91-96183-98383';
const whatsappLink = 'https://wa.me/919618398383';

const ContactPage: React.FC = () => {
  const [status, setStatus] = useState<'idle'|'success'>('idle');
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    form.reset();
    setStatus('success');
    trackEvent('contact_form_submit', { channel: 'site_form' });
  };

  return (
    <div className="page-gradient min-h-screen">
      <Meta title="Contact Tiny Steps Online School" description="Talk to us about phonics, grammar and public speaking programs. Call, WhatsApp or send a note—team replies in 12 hours." canonical="https://tinystepslearning.com/contact" />
      <section className="relative px-6 pt-28 pb-12">
        <div className="mx-auto max-w-4xl text-center glass-panel soft-grid px-8 py-10">
          <div className="gradient-chip mx-auto w-max">We’re here for parents across India</div>
          <h1 className="mt-3 text-3xl font-bold text-gray-900 md:text-4xl">Contact Tiny Steps Online School</h1>
          <p className="mt-3 text-gray-600">Call, WhatsApp, or send a message. We respond within 12 working hours.</p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 pb-20 grid gap-10 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="glass-panel p-6">
            <h2 className="text-xl font-semibold text-gray-900">Direct lines</h2>
            <ul className="mt-4 space-y-3 text-gray-700">
              <li><span className="font-semibold">Phone:</span> <a href="tel:+919618398383" className="text-tiny-blue-600">{phone}</a></li>
              <li><span className="font-semibold">WhatsApp:</span> <a href={whatsappLink} onClick={() => trackEvent('cta_click', { location: 'contact', label: 'whatsapp_chat' })} className="text-tiny-green-600">Chat with our parent advisor</a></li>
              <li><span className="font-semibold">Email:</span> <a href="mailto:hello@tinystepslearning.com" className="text-tiny-blue-600">hello@tinystepslearning.com</a></li>
              <li><span className="font-semibold">Location:</span> Bengaluru, Karnataka (serving families PAN India)</li>
              <li><span className="font-semibold">Hours:</span> Mon–Fri 9 AM – 6 PM IST • Sat 10 AM – 2 PM IST</li>
            </ul>
          </div>
          <div className="glass-panel p-6">
            <h3 className="text-lg font-semibold text-gray-900">Need help fast?</h3>
            <p className="mt-3 text-sm text-gray-600">Book a free trial class, ask curriculum questions, or request pricing breakdowns. A mentor will guide you step by step.</p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full bg-white/70 px-3 py-1">Live 1:1 lessons</span>
              <span className="rounded-full bg-white/70 px-3 py-1">Teacher match guarantee</span>
              <span className="rounded-full bg-white/70 px-3 py-1">Secure payments</span>
            </div>
          </div>
        </div>
        <div className="glass-panel p-6">
          <h2 className="text-xl font-semibold text-gray-900">Send us a message</h2>
          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <input className="interactive-input" required placeholder="Parent name" />
            <input className="interactive-input" type="email" required placeholder="Email" />
            <input className="interactive-input" type="tel" required placeholder="Phone" />
            <textarea className="interactive-input" rows={4} placeholder="How can we help?" />
            <button className="w-full rounded-2xl bg-gradient-to-r from-tiny-blue-600 to-tiny-purple-600 py-3 text-white font-semibold">Send message</button>
            {status === 'success' && <p className="text-sm text-tiny-green-600">Thanks! We’ll respond shortly.</p>}
          </form>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
