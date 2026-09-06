import type { FC } from 'react';
import { Link } from 'react-router-dom';
import Meta from '../components/common/Meta';
import { PUBLIC_CONTACT_EMAIL, PUBLIC_CONTACT_MAILTO } from '../constants/publicContact';
import { getRouteConfig } from '../lib/seo';
import { createFAQPageSchema, createWebPageSchema, SITE_ORIGIN } from '../lib/schemas';

const ADMISSIONS_WHATSAPP_URL =
  'https://wa.me/919618398383?text=Hi%20Tiny%20Steps!%20I%20need%20help%20with%20admissions%20or%20choosing%20the%20right%20program%20for%20my%20child.';
const PARENT_SUPPORT_WHATSAPP_URL =
  'https://wa.me/919618398383?text=Hi%20Tiny%20Steps!%20I%20am%20an%20existing%20parent%20and%20need%20support%20with%20my%20child%27s%20classes.';
const GENERAL_WHATSAPP_URL =
  'https://wa.me/919618398383?text=Hi%20Tiny%20Steps!%20I%20have%20a%20general%20question.';
const PHONE_URL = 'tel:+919618398383';

const contactSeo = getRouteConfig('/contact');
const contactSeoTitle =
  contactSeo?.title ?? 'Contact Tiny Steps Learning | Admissions & Parent Support';
const contactSeoDescription =
  contactSeo?.description ??
  'Contact Tiny Steps Learning for admissions, parent support, school partnerships and general enquiries. Reach our team by WhatsApp, phone or email.';
const contactCanonicalPath = contactSeo?.canonicalPath ?? '/contact';
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
    <div className="overflow-x-clip bg-[#fbfaf8] text-slate-900">
      <Meta
        title={contactSeoTitle}
        description={contactSeoDescription}
        canonical={contactCanonicalUrl}
        jsonLd={contactJsonLd}
      />

      <section className="relative overflow-hidden border-b border-slate-200/70 bg-[radial-gradient(circle_at_12%_18%,rgba(251,146,60,0.16),transparent_28%),radial-gradient(circle_at_88%_10%,rgba(125,211,252,0.18),transparent_30%),linear-gradient(180deg,#fffdfa_0%,#f7fbff_100%)]">
        <div className="pointer-events-none absolute left-1/2 top-[-16rem] h-[32rem] w-[54rem] -translate-x-1/2 rounded-full border border-orange-100/70" />

        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-28 text-center sm:px-6 sm:pt-32 md:pb-16 lg:px-8 lg:pt-36">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/85 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-700 shadow-sm backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            Tiny Steps support
          </div>
          <h1 className="mx-auto mt-6 max-w-4xl font-heading text-4xl font-black leading-[1.03] tracking-[-0.045em] text-slate-950 sm:text-5xl md:text-6xl">
            How Can We Help?
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-700 md:text-xl">
            Contact Tiny Steps for admissions, existing classes, school partnerships or general enquiries.
          </p>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Choose the most relevant option below and our team will guide you.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="overflow-hidden rounded-[36px] bg-slate-950 p-6 text-white shadow-[0_32px_90px_rgba(15,23,42,0.16)] sm:p-8 lg:p-10">
          <div className="flex flex-col gap-4 border-b border-white/10 pb-8 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">Start here</p>
              <h2 className="mt-2 font-heading text-3xl font-black tracking-[-0.03em] text-white md:text-4xl">
                Choose the right support path
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-400 md:text-right">
              Each route goes directly to the team or page best suited to your enquiry.
            </p>
          </div>

          <div className="grid md:grid-cols-2">
            <a
              href={ADMISSIONS_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group border-b border-white/10 py-7 transition hover:bg-white/[0.035] md:border-r md:px-7"
            >
              <div className="flex items-start gap-4">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-orange-300/30 bg-orange-300/10 text-xs font-black tracking-[0.12em] text-orange-200">01</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">Admissions</p>
                      <h3 className="mt-2 text-xl font-black text-white sm:text-2xl">Admissions & New Enrolments</h3>
                    </div>
                    <span className="text-xl text-slate-500 transition group-hover:translate-x-1 group-hover:text-white" aria-hidden="true">→</span>
                  </div>
                  <p className="mt-3 max-w-lg text-sm leading-7 text-slate-400">
                    Programs, class availability, pricing or choosing the right starting point.
                  </p>
                  <span className="mt-4 inline-flex text-sm font-bold text-white">Admissions Support</span>
                </div>
              </div>
            </a>

            <a
              href={PARENT_SUPPORT_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group border-b border-white/10 py-7 transition hover:bg-white/[0.035] md:px-7"
            >
              <div className="flex items-start gap-4">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-sky-300/30 bg-sky-300/10 text-xs font-black tracking-[0.12em] text-sky-200">02</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">Existing families</p>
                      <h3 className="mt-2 text-xl font-black text-white sm:text-2xl">Existing Parent Support</h3>
                    </div>
                    <span className="text-xl text-slate-500 transition group-hover:translate-x-1 group-hover:text-white" aria-hidden="true">→</span>
                  </div>
                  <p className="mt-3 max-w-lg text-sm leading-7 text-slate-400">
                    Attendance, rescheduling, payments, classes, teacher-related queries or the parent dashboard.
                  </p>
                  <span className="mt-4 inline-flex text-sm font-bold text-white">Parent Support</span>
                </div>
              </div>
            </a>

            <Link
              to="/for-schools"
              className="group border-b border-white/10 py-7 transition hover:bg-white/[0.035] md:border-b-0 md:border-r md:px-7"
            >
              <div className="flex items-start gap-4">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-violet-300/30 bg-violet-300/10 text-xs font-black tracking-[0.12em] text-violet-200">03</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">For educators</p>
                      <h3 className="mt-2 text-xl font-black text-white sm:text-2xl">School Partnerships</h3>
                    </div>
                    <span className="text-xl text-slate-500 transition group-hover:translate-x-1 group-hover:text-white" aria-hidden="true">→</span>
                  </div>
                  <p className="mt-3 max-w-lg text-sm leading-7 text-slate-400">
                    Phonics implementation, teacher training, literacy programs or curriculum partnerships.
                  </p>
                  <span className="mt-4 inline-flex text-sm font-bold text-white">Explore School Partnerships</span>
                </div>
              </div>
            </Link>

            <a
              href={PUBLIC_CONTACT_MAILTO}
              className="group py-7 transition hover:bg-white/[0.035] md:px-7"
            >
              <div className="flex items-start gap-4">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-xs font-black tracking-[0.12em] text-slate-300">04</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Other enquiries</p>
                      <h3 className="mt-2 text-xl font-black text-white sm:text-2xl">General Enquiries</h3>
                    </div>
                    <span className="text-xl text-slate-500 transition group-hover:translate-x-1 group-hover:text-white" aria-hidden="true">→</span>
                  </div>
                  <p className="mt-3 max-w-lg text-sm leading-7 text-slate-400">
                    Collaborations, business enquiries or anything that does not fit the options above.
                  </p>
                  <span className="mt-4 inline-flex text-sm font-bold text-white">Email Tiny Steps</span>
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start lg:gap-16">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-700">Direct contact</p>
              <h2 className="mt-3 font-heading text-3xl font-black tracking-[-0.03em] text-slate-950 md:text-4xl">Reach Tiny Steps</h2>
              <p className="mt-4 max-w-md leading-7 text-slate-600">
                Prefer to contact us directly? Choose whichever channel is most convenient.
              </p>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-[#fcfcfb]">
              <a
                href={GENERAL_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group grid gap-3 border-b border-slate-200 px-6 py-6 transition hover:bg-emerald-50/60 sm:grid-cols-[150px_1fr_auto] sm:items-center sm:px-7"
              >
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">WhatsApp</p>
                <div>
                  <h3 className="text-lg font-black text-slate-950">Fastest for most enquiries</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Admissions, scheduling and parent queries.</p>
                </div>
                <span className="text-sm font-black text-emerald-800 transition group-hover:translate-x-1">Chat →</span>
              </a>

              <a
                href={PHONE_URL}
                className="group grid gap-3 border-b border-slate-200 px-6 py-6 transition hover:bg-amber-50/60 sm:grid-cols-[150px_1fr_auto] sm:items-center sm:px-7"
              >
                <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Phone</p>
                <div>
                  <h3 className="text-lg font-black text-slate-950">+91 96183 98383</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">For enquiries that are easier to discuss by phone.</p>
                </div>
                <span className="text-sm font-black text-slate-950 transition group-hover:translate-x-1">Call →</span>
              </a>

              <a
                href={PUBLIC_CONTACT_MAILTO}
                className="group grid gap-3 px-6 py-6 transition hover:bg-slate-50 sm:grid-cols-[150px_1fr_auto] sm:items-center sm:px-7"
              >
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Email</p>
                <div className="min-w-0">
                  <h3 className="break-all text-lg font-black text-slate-950">{PUBLIC_CONTACT_EMAIL}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Partnerships, formal enquiries and detailed communication.</p>
                </div>
                <span className="text-sm font-black text-slate-950 transition group-hover:translate-x-1">Email →</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[34px] border border-orange-200 bg-[linear-gradient(115deg,#fff1e6_0%,#fff9f3_45%,#edf7ff_100%)] px-6 py-10 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:px-10 md:flex md:items-center md:justify-between md:gap-10 lg:px-12">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-700">Child assessment</p>
            <h2 className="mt-2 font-heading text-3xl font-black tracking-[-0.03em] text-slate-950 md:text-4xl">Looking for a Class Assessment?</h2>
            <p className="mt-3 max-w-2xl leading-7 text-slate-700">
              If you would like us to understand your child&apos;s current level before recommending a program, book one free 35-minute assessment.
            </p>
          </div>
          <Link
            to="/book-demo"
            data-no-booking-intercept="1"
            className="mt-7 inline-flex shrink-0 items-center justify-center rounded-full bg-slate-950 px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800 md:mt-0"
          >
            Book Free 35-Minute Demo Assessment
          </Link>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-7 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Useful next pages</p>
              <h2 className="mt-2 font-heading text-3xl font-black tracking-[-0.03em] text-slate-950 md:text-4xl">Helpful Pages</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-500 md:text-right">Explore the information parents usually want before making a decision.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'Programs & Curriculum', body: 'Explore the Tiny Steps learning pathways.', to: '/curriculum' },
              { title: 'Pricing', body: 'View current class fees and plan options.', to: '/pricing' },
              { title: 'Class Samples', body: 'See how Tiny Steps classes are taught.', to: '/class-samples' },
              { title: 'Frequently Asked Questions', body: 'Answers to common parent questions.', to: '/faq' },
            ].map((item, index) => (
              <Link
                key={item.title}
                to={item.to}
                className={`group py-7 transition hover:bg-slate-50 md:px-6 ${index > 0 ? 'border-t border-slate-200 md:border-t-0 md:border-l' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg font-black text-slate-950">{item.title}</h3>
                  <span className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-950" aria-hidden="true">→</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20" aria-labelledby="contact-faq-heading">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-700">Support questions</p>
              <h2 id="contact-faq-heading" className="mt-3 font-heading text-3xl font-black tracking-[-0.03em] text-slate-950 md:text-4xl">
                Contact & Support FAQs
              </h2>
              <p className="mt-4 max-w-md leading-7 text-slate-600">
                Quick answers for common contact and support questions.
              </p>
            </div>

            <div className="divide-y divide-slate-200 border-y border-slate-200">
              {faqItems.map((faq) => (
                <details key={faq.question} className="group py-1">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 text-left">
                    <span className="text-base font-black text-slate-950 sm:text-lg">{faq.question}</span>
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 text-xl font-light text-slate-500 transition group-open:rotate-45" aria-hidden="true">+</span>
                  </summary>
                  <p className="max-w-2xl pb-5 pr-12 leading-7 text-slate-600">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;