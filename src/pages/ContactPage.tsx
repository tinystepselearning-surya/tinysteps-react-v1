import type { FC } from 'react';
import { Link } from 'react-router-dom';
import Meta from '../components/common/Meta';
import AdvisorContactForm from '../components/common/AdvisorContactForm';
import { PUBLIC_CONTACT_EMAIL, PUBLIC_CONTACT_MAILTO } from '../constants/publicContact';
import { getRouteConfig } from '../lib/seo';
import { createFAQPageSchema, createWebPageSchema } from '../lib/schemas';

const WHATSAPP_URL =
  'https://wa.me/919618398383?text=Hi%20Tiny%20Steps!%20I%20want%20help%20choosing%20the%20right%20program%20for%20my%20child.';
const PHONE_URL = 'tel:+919618398383';

const contactSeo = getRouteConfig('/contact');
const contactSeoTitle = contactSeo?.title ?? 'Contact Tiny Steps Learning | Book a Free Assessment';
const contactSeoDescription =
  contactSeo?.description ??
  'Contact Tiny Steps Learning for live online phonics, grammar, reading, and public speaking classes for children. Book a free assessment or message us on WhatsApp.';
const contactCanonicalPath = contactSeo?.canonicalPath ?? '/contact';
const contactCanonicalUrl = `https://tinystepslearning.com${contactCanonicalPath}`;

const faqItems = [
  {
    question: 'How can I contact Tiny Steps Learning?',
    answer:
      'Parents can contact Tiny Steps Learning by WhatsApp, phone, email, or the contact form on this page. The fastest route for admissions help is usually WhatsApp or a free assessment request.',
  },
  {
    question: 'What should I share before booking an assessment?',
    answer:
      'It helps to share your child’s age, the main concern you want help with, and whether you are looking for phonics, grammar, reading, or public speaking support.',
  },
  {
    question: 'Do you work with families outside India?',
    answer:
      'Yes. Tiny Steps supports families in India and international families, including Indian children abroad, through live online classes.',
  },
];

const contactJsonLd = [
  createWebPageSchema({
    name: 'Contact Tiny Steps Learning',
    description: contactSeoDescription,
    url: contactCanonicalUrl,
  }),
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
      { '@type': 'ListItem', position: 2, name: 'Contact', item: contactCanonicalUrl },
    ],
  },
  createFAQPageSchema(faqItems),
];

const ContactPage: FC = () => {
  return (
    <div className="bg-[linear-gradient(180deg,#fff9f2_0%,#f8fbff_38%,#ffffff_100%)]">
      <Meta
        title={contactSeoTitle}
        description={contactSeoDescription}
        canonical={contactCanonicalUrl}
        jsonLd={contactJsonLd}
      />

      <section className="mx-auto max-w-6xl px-6 pb-10 pt-28 sm:pt-32 lg:pt-36">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white/95 p-7 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-9">
            <p className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-800">
              Parent support
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              Contact Tiny Steps Learning
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-700 sm:text-lg">
              Tiny Steps offers live online phonics, grammar, reading, and public speaking support for
              children aged 4 to 15. If you want help choosing the right starting point, book a free
              assessment or send us your question here.
            </p>

            <div className="mt-6 rounded-[28px] border border-sky-100 bg-sky-50/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-800">Quick answer</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">What is the best way for a parent to reach Tiny Steps?</h2>
              <p className="mt-3 text-sm leading-7 text-slate-700 sm:text-base">
                If you want the fastest admissions help, use WhatsApp or book a free assessment. If you
                prefer email or a callback, use the contact form and share your child&apos;s age plus the
                skill area you want help with.
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-left transition hover:border-emerald-300 hover:bg-emerald-100/70"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">WhatsApp</p>
                <p className="mt-2 text-base font-semibold text-slate-900">Talk to Us on WhatsApp</p>
                <p className="mt-1 text-sm text-slate-600">Best for quick parent questions and assessment scheduling.</p>
              </a>
              <a
                href={PHONE_URL}
                className="rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-left transition hover:border-amber-300 hover:bg-amber-100/70"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">Phone</p>
                <p className="mt-2 text-base font-semibold text-slate-900">+91 96183 98383</p>
                <p className="mt-1 text-sm text-slate-600">Use this if you prefer a direct conversation.</p>
              </a>
              <a
                href={PUBLIC_CONTACT_MAILTO}
                className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4 text-left transition hover:border-slate-300 hover:bg-slate-100/80"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">Email</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{PUBLIC_CONTACT_EMAIL}</p>
                <p className="mt-1 text-sm text-slate-600">Best if you want to share details in writing.</p>
              </a>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/book-demo"
                className="inline-flex items-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Book Free Assessment
              </Link>
              <Link
                to="/phonics"
                className="inline-flex items-center rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50"
              >
                View Phonics Program
              </Link>
            </div>

            <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Trust proof</p>
              <p className="mt-3 text-sm font-semibold text-slate-900">5000+ students served • Families in 15+ countries</p>
              <p className="mt-2 text-sm leading-7 text-slate-700">
                Parents usually contact us when they want help choosing between phonics, grammar, reading, or speaking support and want a real person to guide the next step.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                <h2 className="text-lg font-semibold text-slate-900">Who this page is for</h2>
                <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-700">
                  <li>Parents comparing phonics, grammar, reading, or speaking support</li>
                  <li>Families in India and international families looking for live online classes</li>
                  <li>Parents who want a clear next step instead of generic tuition inquiries</li>
                </ul>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                <h2 className="text-lg font-semibold text-slate-900">Popular next pages</h2>
                <div className="mt-3 flex flex-col gap-2 text-sm font-medium text-slate-900">
                  <Link to="/phonics" className="underline decoration-slate-300 underline-offset-4 hover:decoration-slate-700">
                    Online phonics classes for kids
                  </Link>
                  <Link to="/grammar" className="underline decoration-slate-300 underline-offset-4 hover:decoration-slate-700">
                    Grammar classes for children
                  </Link>
                  <Link to="/speaking" className="underline decoration-slate-300 underline-offset-4 hover:decoration-slate-700">
                    Public speaking classes for kids
                  </Link>
                  <Link to="/pricing" className="underline decoration-slate-300 underline-offset-4 hover:decoration-slate-700">
                    Pricing and assessment options
                  </Link>
                  <Link to="/class-samples" className="underline decoration-slate-300 underline-offset-4 hover:decoration-slate-700">
                    Class samples for parents
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                <h2 className="text-lg font-semibold text-slate-900">Pricing and support</h2>
                <p className="mt-2 text-sm leading-7 text-slate-700">
                  If you want package clarity first, review <Link to="/pricing" className="font-semibold underline underline-offset-4">pricing</Link>. If you want teaching style proof, open <Link to="/class-samples" className="font-semibold underline underline-offset-4">class samples</Link>.
                </p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                <h2 className="text-lg font-semibold text-slate-900">Timing guidance</h2>
                <p className="mt-2 text-sm leading-7 text-slate-700">
                  Share your preferred weekday or weekend window. We support families in India and abroad, so morning and evening options are usually discussed during the assessment call.
                </p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                <h2 className="text-lg font-semibold text-slate-900">Response time</h2>
                <p className="mt-2 text-sm leading-7 text-slate-700">
                  WhatsApp is the fastest path. Form and email enquiries usually receive a response once the admissions team reviews the child details and preferred timing.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white/95 p-7 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-9">
            <AdvisorContactForm
              topic="Contact page inquiry"
              title="Send your child&apos;s details"
              description="Share your child&apos;s age, your main concern, and which program you want help choosing. We&apos;ll follow up by email or phone."
              surface="plain"
            />

            <div className="mt-8 rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
              <h2 className="text-lg font-semibold text-slate-900">Parents also ask</h2>
              <div className="mt-4 space-y-4">
                {faqItems.map((faq) => (
                  <article key={faq.question}>
                    <h3 className="text-sm font-semibold text-slate-900">{faq.question}</h3>
                    <p className="mt-1 text-sm leading-7 text-slate-700">{faq.answer}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
