import type { FC } from 'react';
import { Link } from 'react-router-dom';
import Meta from '../components/common/Meta';
import BookAssessmentForm from '../components/forms/BookAssessmentForm';
import { PUBLIC_CONTACT_EMAIL, PUBLIC_CONTACT_MAILTO } from '../constants/publicContact';
import { getRouteConfig } from '../lib/seo';
import { createFAQPageSchema, createWebPageSchema } from '../lib/schemas';

const WHATSAPP_URL =
  'https://wa.me/919618398383?text=Hi%20Tiny%20Steps!%20I%20want%20help%20choosing%20the%20right%20English%20learning%20path%20for%20my%20child.';
const PHONE_URL = 'tel:+919618398383';

const contactSeo = getRouteConfig('/contact');
const contactSeoTitle =
  contactSeo?.title ?? 'Book a Free Assessment for Your Child | Tiny Steps Learning';
const contactSeoDescription =
  contactSeo?.description ??
  'Book a free assessment for your child with Tiny Steps Learning. Share age, learning concern, and timing preference for phonics, reading, grammar, speaking, and online English support.';
const contactCanonicalPath = contactSeo?.canonicalPath ?? '/contact';
const contactCanonicalUrl = `https://tinystepslearning.com${contactCanonicalPath}`;

const faqItems = [
  {
    question: 'What should I share before booking a free assessment?',
    answer:
      'Parents can share the child’s age, the main concern, and any preferred class timing. That is enough for Tiny Steps to recommend the right starting point.',
  },
  {
    question: 'Can I contact Tiny Steps on WhatsApp instead of filling the form?',
    answer:
      'Yes. WhatsApp is the fastest route for quick parent questions, timing checks, and admissions support. The assessment form is useful when you want to share structured child details first.',
  },
  {
    question: 'Do you support families outside India?',
    answer:
      'Yes. Tiny Steps supports families in India, Hyderabad, and international families through live online English classes for kids.',
  },
  {
    question: 'Will I get pricing before joining?',
    answer:
      'Yes. Parents can review current pricing, class samples, and the recommended starting path after the free assessment.',
  },
];

const contactJsonLd = [
  createWebPageSchema({
    name: 'Book a Free Assessment for Your Child',
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

const supportCards = [
  {
    title: 'WhatsApp support',
    body: 'Best for quick parent questions, admissions guidance, and assessment slot coordination.',
    href: WHATSAPP_URL,
    tone: 'border-emerald-200 bg-emerald-50/85 text-emerald-900',
    cta: 'Chat on WhatsApp',
  },
  {
    title: 'Phone support',
    body: 'Useful if you prefer a direct conversation about age, level, concern, and timing.',
    href: PHONE_URL,
    tone: 'border-amber-200 bg-amber-50/85 text-slate-900',
    cta: '+91 96183 98383',
  },
  {
    title: 'Email support',
    body: 'Best when you want to share details in writing without long text overflow on mobile.',
    href: PUBLIC_CONTACT_MAILTO,
    tone: 'border-slate-200 bg-white text-slate-900',
    cta: PUBLIC_CONTACT_EMAIL,
  },
];

const quickGuidance = [
  {
    title: 'Pricing guidance',
    body: 'Current approved pricing is ₹400 per class and ₹4,800 for 12 classes. You can review full details after the assessment confirms the right starting path.',
  },
  {
    title: 'Timing guidance',
    body: 'Share your preferred weekday or weekend window. Tiny Steps works with India-based and international families, so available slots are matched after the child details are reviewed.',
  },
  {
    title: 'Response reassurance',
    body: 'WhatsApp is usually the fastest path. Assessment requests and emails are reviewed with the child context so the reply is useful, not generic.',
  },
];

const ContactPage: FC = () => {
  return (
    <div className="overflow-x-clip bg-[linear-gradient(180deg,#fff8ef_0%,#f8fbff_38%,#ffffff_100%)]">
      <Meta
        title={contactSeoTitle}
        description={contactSeoDescription}
        canonical={contactCanonicalUrl}
        jsonLd={contactJsonLd}
      />

      <section className="relative mx-auto max-w-7xl px-4 pb-12 pt-28 sm:px-6 sm:pt-32 lg:px-8 lg:pt-36">
        <div className="pointer-events-none absolute left-0 top-28 h-44 w-44 rounded-full bg-orange-200/35 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-16 h-56 w-56 rounded-full bg-sky-200/30 blur-3xl" />

        <div className="grid gap-8 lg:grid-cols-[1.04fr_0.96fr]">
          <div className="relative rounded-[32px] border border-slate-200/80 bg-white/92 p-7 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur sm:p-9">
            <p className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-700">
              Parent admissions support
            </p>
            <h1 className="mt-4 max-w-3xl text-[36px] font-black leading-[1.03] tracking-[-0.035em] text-slate-950 sm:text-[48px]">
              Book a Free Assessment for Your Child
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-700 sm:text-lg">
              Share your child’s age, current concern, and preferred timing. Tiny Steps will help you choose the right starting point across phonics, reading, grammar, spoken English, and public speaking support.
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              {[
                '5000+ students served',
                'Families in 15+ countries',
                'Live 1:1 and small-group classes',
                'Weekly parent updates',
              ].map((chip, index) => (
                <span
                  key={chip}
                  className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm font-semibold shadow-sm ${
                    index % 2 === 0
                      ? 'border-orange-200 bg-orange-50 text-orange-900'
                      : 'border-sky-200 bg-sky-50 text-sky-900'
                  }`}
                >
                  {chip}
                </span>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#assessment-form"
                className="inline-flex items-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Book Free Assessment
              </a>
              <Link
                to="/pricing"
                className="inline-flex items-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                See Pricing
              </Link>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {supportCards.map((card) => (
                <a
                  key={card.title}
                  href={card.href}
                  target={card.href.startsWith('https://') ? '_blank' : undefined}
                  rel={card.href.startsWith('https://') ? 'noopener noreferrer' : undefined}
                  className={`rounded-[24px] border px-5 py-4 transition hover:-translate-y-0.5 hover:shadow-sm ${card.tone}`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]">{card.title}</p>
                  <p className="mt-2 text-base font-semibold break-words">{card.cta}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-700">{card.body}</p>
                </a>
              ))}
            </div>

            <div className="mt-8 rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#fffaf2_0%,#ffffff_50%,#f4f9ff_100%)] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">What parents usually need here</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {[
                  'My child needs help but I am not sure whether to start with phonics, reading, grammar, or speaking.',
                  'I want a real assessment path instead of a generic inquiry form.',
                  'I need pricing, timing, and class-sample clarity before deciding.',
                  'I want support for a child in India, Hyderabad, or an international timezone.',
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/90 bg-white/90 p-4 text-sm leading-7 text-slate-700 shadow-sm">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {quickGuidance.map((item) => (
                <div key={item.title} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.04)]">
                  <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-700">{item.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-[28px] border border-slate-200 bg-slate-900 p-6 text-white shadow-[0_22px_60px_rgba(15,23,42,0.18)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">Useful next pages</p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
                <Link to="/pricing" className="rounded-full border border-white/15 bg-white/10 px-4 py-2 hover:bg-white/15">
                  See Pricing
                </Link>
                <Link to="/class-samples" className="rounded-full border border-white/15 bg-white/10 px-4 py-2 hover:bg-white/15">
                  See Class Samples
                </Link>
                <Link to="/phonics" className="rounded-full border border-white/15 bg-white/10 px-4 py-2 hover:bg-white/15">
                  Phonics
                </Link>
                <Link to="/grammar" className="rounded-full border border-white/15 bg-white/10 px-4 py-2 hover:bg-white/15">
                  Grammar
                </Link>
                <Link to="/speaking" className="rounded-full border border-white/15 bg-white/10 px-4 py-2 hover:bg-white/15">
                  Speaking
                </Link>
                <Link to="/online-english-classes-for-kids" className="rounded-full border border-white/15 bg-white/10 px-4 py-2 hover:bg-white/15">
                  Online English Classes for Kids
                </Link>
              </div>
            </div>
          </div>

          <div
            id="assessment-form"
            className="relative rounded-[32px] border border-slate-200/80 bg-white/94 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8 lg:sticky lg:top-28 lg:self-start"
          >
            <BookAssessmentForm
              defaultInterest="Phonics"
              source="contact_page_assessment"
              title="Share Your Child’s Details"
              description="Use the regular Tiny Steps assessment flow. Parents can share age, main concern, and timing preference to get the right starting point."
              submitLabel="Book Free Assessment on WhatsApp"
              submitAriaLabel="Book Free Assessment on WhatsApp"
            />

            <div className="mt-8 rounded-[24px] border border-slate-200 bg-slate-50/90 p-5">
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
