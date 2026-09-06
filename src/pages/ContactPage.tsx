import type { FC } from 'react';
import { Link } from 'react-router-dom';
import Meta from '../components/common/Meta';
import { PUBLIC_CONTACT_EMAIL, PUBLIC_CONTACT_MAILTO } from '../constants/publicContact';
import { createFAQPageSchema, createWebPageSchema, SITE_ORIGIN } from '../lib/schemas';

const ADMISSIONS_WHATSAPP_URL =
  'https://wa.me/919618398383?text=Hi%20Tiny%20Steps!%20I%20need%20help%20with%20admissions%20or%20choosing%20the%20right%20program%20for%20my%20child.';
const PARENT_SUPPORT_WHATSAPP_URL =
  'https://wa.me/919618398383?text=Hi%20Tiny%20Steps!%20I%20am%20an%20existing%20parent%20and%20need%20support%20with%20my%20child%27s%20classes.';
const GENERAL_WHATSAPP_URL =
  'https://wa.me/919618398383?text=Hi%20Tiny%20Steps!%20I%20have%20a%20general%20question.';
const PHONE_URL = 'tel:+919618398383';

const contactSeoTitle = 'Contact Tiny Steps Learning | Admissions & Parent Support';
const contactSeoDescription =
  'Contact Tiny Steps Learning for admissions, parent support, school partnerships and general enquiries. Reach our team by WhatsApp, phone or email.';
const contactCanonicalPath = '/contact';
const contactCanonicalUrl = `${SITE_ORIGIN}${contactCanonicalPath}`;

const faqItems = [
  {
    question: 'What is the fastest way to contact Tiny Steps?',
    answer:
      'WhatsApp is usually the fastest option for parent and admissions enquiries.',
  },
  {
    question: 'I am already a Tiny Steps parent. Where should I ask about my classes?',
    answer:
      'Use Parent Support for attendance, scheduling, payments, class-related questions or teacher support.',
  },
  {
    question: 'How can a school contact Tiny Steps?',
    answer:
      'Schools interested in phonics implementation, teacher training or literacy partnerships can visit the For Schools page or contact Tiny Steps directly.',
  },
  {
    question: 'Where can I see your prices?',
    answer:
      'Current program pricing is available on the Tiny Steps pricing page.',
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
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
      { '@type': 'ListItem', position: 2, name: 'Contact', item: contactCanonicalUrl },
    ],
  },
  { ...createFAQPageSchema(faqItems), '@id': `${contactCanonicalUrl}#faq` },
];

const ContactPage: FC = () => {
  return (
    <div className="overflow-x-clip bg-[linear-gradient(180deg,#fffaf4_0%,#f8fbff_35%,#ffffff_100%)] text-slate-900">
      <Meta
        title={contactSeoTitle}
        description={contactSeoDescription}
        canonical={contactCanonicalUrl}
        jsonLd={contactJsonLd}
      />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-[-90px] top-20 h-72 w-72 rounded-full bg-orange-200/35 blur-3xl" />
        <div className="pointer-events-none absolute right-[-90px] top-10 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-16 text-center sm:px-6 md:pb-16 md:pt-20 lg:px-8">
          <p className="mx-auto inline-flex rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-orange-700">
            Tiny Steps support
          </p>
          <h1 className="mx-auto mt-5 max-w-4xl text-4xl font-black leading-[1.05] tracking-[-0.03em] text-slate-950 md:text-6xl">
            How Can We Help?
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-700 md:text-xl">
            Contact Tiny Steps for admissions, existing classes, school partnerships or general enquiries.
          </p>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Choose the most relevant option below and our team will guide you.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2">
          <a
            href={ADMISSIONS_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-[28px] border border-orange-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">Admissions</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">Admissions & New Enrolments</h2>
              </div>
              <span className="text-2xl transition group-hover:translate-x-1" aria-hidden="true">→</span>
            </div>
            <p className="mt-4 leading-7 text-slate-600">
              Questions about Tiny Steps programs, class availability, pricing or assessment bookings.
            </p>
            <span className="mt-5 inline-flex font-bold text-slate-950">Admissions Support</span>
          </a>

          <a
            href={PARENT_SUPPORT_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-[28px] border border-sky-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Existing families</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">Existing Parent Support</h2>
              </div>
              <span className="text-2xl transition group-hover:translate-x-1" aria-hidden="true">→</span>
            </div>
            <p className="mt-4 leading-7 text-slate-600">
              Help with attendance, rescheduling, payments, classes, teacher-related queries or the parent dashboard.
            </p>
            <span className="mt-5 inline-flex font-bold text-slate-950">Parent Support</span>
          </a>

          <Link
            to="/for-schools"
            className="group rounded-[28px] border border-violet-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-700">For educators</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">School Partnerships</h2>
              </div>
              <span className="text-2xl transition group-hover:translate-x-1" aria-hidden="true">→</span>
            </div>
            <p className="mt-4 leading-7 text-slate-600">
              For schools interested in phonics implementation, teacher training, literacy programs or curriculum partnerships.
            </p>
            <span className="mt-5 inline-flex font-bold text-slate-950">Explore School Partnerships</span>
          </Link>

          <a
            href={PUBLIC_CONTACT_MAILTO}
            className="group rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Other enquiries</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">General Enquiries</h2>
              </div>
              <span className="text-2xl transition group-hover:translate-x-1" aria-hidden="true">→</span>
            </div>
            <p className="mt-4 leading-7 text-slate-600">
              For collaborations, business enquiries or anything that does not fit the options above.
            </p>
            <span className="mt-5 inline-flex break-all font-bold text-slate-950">Email Tiny Steps</span>
          </a>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-white/70 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Direct contact</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.02em] text-slate-950 md:text-4xl">Reach Tiny Steps</h2>
          </div>

          <div className="mt-9 grid gap-5 md:grid-cols-3">
            <a
              href={GENERAL_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[26px] border border-emerald-200 bg-emerald-50/70 p-6 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">WhatsApp</p>
              <h3 className="mt-2 text-xl font-black text-slate-950">Fastest for parent support</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Use WhatsApp for admissions, assessments, scheduling and parent queries.
              </p>
              <span className="mt-5 inline-flex font-bold text-emerald-800">Chat on WhatsApp →</span>
            </a>

            <a
              href={PHONE_URL}
              className="rounded-[26px] border border-amber-200 bg-amber-50/70 p-6 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Phone</p>
              <h3 className="mt-2 text-xl font-black text-slate-950">+91 96183 98383</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                For enquiries that are easier to discuss by phone.
              </p>
              <span className="mt-5 inline-flex font-bold text-slate-950">Call Tiny Steps →</span>
            </a>

            <a
              href={PUBLIC_CONTACT_MAILTO}
              className="rounded-[26px] border border-slate-200 bg-slate-50/70 p-6 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Email</p>
              <h3 className="mt-2 break-all text-xl font-black text-slate-950">{PUBLIC_CONTACT_EMAIL}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                For partnerships, formal enquiries and detailed communication.
              </p>
              <span className="mt-5 inline-flex font-bold text-slate-950">Email Tiny Steps →</span>
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[34px] border border-orange-200 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_52%,#eff6ff_100%)] p-7 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-10 md:flex md:items-center md:justify-between md:gap-8">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-700">Child assessment</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.02em] text-slate-950">Looking for a Class Assessment?</h2>
            <p className="mt-3 leading-7 text-slate-700">
              If you would like us to understand your child&apos;s current level before recommending a program, book one free 35-minute assessment.
            </p>
          </div>
          <Link
            to="/book-demo"
            className="mt-6 inline-flex shrink-0 items-center justify-center rounded-full bg-slate-950 px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800 md:mt-0"
          >
            Book Free Demo Assessment
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Useful next pages</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.02em] text-slate-950 md:text-4xl">Helpful Pages</h2>
        </div>

        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: 'Programs & Curriculum', body: 'Explore the Tiny Steps learning pathways.', to: '/curriculum' },
            { title: 'Pricing', body: 'View current class fees and plan options.', to: '/pricing' },
            { title: 'Class Samples', body: 'See how Tiny Steps classes are taught.', to: '/class-samples' },
            { title: 'Frequently Asked Questions', body: 'Answers to common parent questions.', to: '/faq' },
          ].map((item) => (
            <Link
              key={item.title}
              to={item.to}
              className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <h3 className="text-lg font-black text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
              <span className="mt-4 inline-flex text-sm font-bold text-slate-950">Open page →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-100 bg-slate-50/70 py-16" aria-labelledby="contact-faq-heading">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Support questions</p>
            <h2 id="contact-faq-heading" className="mt-3 text-3xl font-black tracking-[-0.02em] text-slate-950 md:text-4xl">
              Contact & Support FAQs
            </h2>
          </div>

          <div className="mt-9 grid gap-4 md:grid-cols-2">
            {faqItems.map((faq) => (
              <article key={faq.question} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-black text-slate-950">{faq.question}</h3>
                <p className="mt-2 leading-7 text-slate-600">{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
