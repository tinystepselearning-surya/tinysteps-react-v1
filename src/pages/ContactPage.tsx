// @ts-nocheck
import type { FC } from 'react';
import { Link } from 'react-router-dom';
import Meta from '../components/common/Meta';
import { trackEvent } from '../lib/analytics';
import { useAuthStore } from '../store/useAuthStore';

const phone = '+91-96183-98383';
const whatsappLink = 'https://wa.me/919618398383';

const ContactPage: FC = () => {
  const { user } = useAuthStore();
  return (
    <div className="page-gradient min-h-screen">
    <Meta title="Contact Tiny Steps Online School" description="Premium 1:1 online English school for ages 3–12. IB-aligned phonics, grammar and public speaking with kind live mentors, AI-guided practice and stage-based parent progress insights. Free assessment class; flexible monthly plans." canonical="https://tinystepslearning.com/contact" />
      <section className="relative px-6 pt-28 pb-12">
        <div className="mx-auto max-w-4xl text-center glass-panel soft-grid px-8 py-10">
          <div className="gradient-chip mx-auto w-max">We're here for parents worldwide</div>
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
              {!user && (
                <li><span className="font-semibold">WhatsApp:</span> <a href={whatsappLink} onClick={() => trackEvent('cta_click', { location: 'contact', label: 'whatsapp_chat' })} className="text-tiny-green-600">Chat with our parent advisor</a></li>
              )}
              {user && (
                <li><span className="font-semibold">Support:</span> <a href="/contact" className="text-tiny-blue-600">Use the contact form to reach our team</a></li>
              )}
              <li><span className="font-semibold">Email:</span> <a href="mailto:hello@tinystepslearning.com" className="text-tiny-blue-600">hello@tinystepslearning.com</a></li>
              <li>
                <span className="font-semibold">Location:</span> Hyderabad, Telangana (online-only; serving families across the globe)
              </li>
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
          <h2 className="text-xl font-semibold text-gray-900">Book Free Assessment Class</h2>
          <p className="mt-3 text-sm text-gray-600">
            Tap below to book your free assessment on the home page.
          </p>
          <Link
            to="/#book-trial"
            onClick={() => trackEvent('cta_click', { location: 'contact', label: 'book_assessment' })}
            className="mt-6 block w-full rounded-2xl bg-gradient-to-r from-tiny-blue-600 to-tiny-purple-600 py-3 text-center text-white font-semibold hover:shadow-lg transition"
          >
            Book Free Assessment
          </Link>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
