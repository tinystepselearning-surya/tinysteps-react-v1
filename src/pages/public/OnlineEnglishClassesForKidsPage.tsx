import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { createCourseSchema, createFAQPageSchema, PUBLIC_FACTS } from '../../lib/schemas';

const canonicalPath = '/online-english-classes-for-kids';
const canonicalUrl = `${PUBLIC_FACTS.primaryWebsite}${canonicalPath}`;

const programmeTracks = [
  {
    title: 'Phonics',
    description: 'For children who know letters but need blending, decoding, and early reading confidence.',
    href: '/phonics',
  },
  {
    title: 'Reading',
    description: 'For children who need fluency, comprehension, vocabulary growth, and reading-aloud support.',
    href: '/reading-classes-for-kids',
  },
  {
    title: 'Grammar',
    description: 'For sentence formation, tense control, writing clarity, and stronger school answers.',
    href: '/grammar',
  },
  {
    title: 'Spoken English and Public Speaking',
    description: 'For shy speakers, one-word answers, sentence expansion, and clearer expression.',
    href: '/speaking',
  },
];

const outcomeStages = [
  {
    stage: 'Ages 4 to 6',
    points: ['Letter-sound awareness', 'Early blending and word reading', 'Simple spoken responses'],
  },
  {
    stage: 'Ages 6 to 9',
    points: ['Stronger reading fluency', 'Grammar in complete sentences', 'Longer classroom answers'],
  },
  {
    stage: 'Ages 9 to 13',
    points: ['Reading comprehension', 'Clearer writing structure', 'Confident speaking and presentation readiness'],
  },
];

const faqItems = [
  {
    question: 'How do I know which English class my child needs first?',
    answer:
      'Tiny Steps starts with a free assessment to check whether the main gap is phonics, reading, grammar, sentence formation, or spoken English confidence.',
  },
  {
    question: 'Do you offer one-on-one English classes for kids?',
    answer:
      'Yes. Tiny Steps offers both 1:1 and small-group live online classes, depending on the child’s needs and the parent’s preference.',
  },
  {
    question: 'Can online English classes help if my child is shy or gives short answers?',
    answer:
      'Yes. Children who understand English but do not speak confidently often need guided sentence expansion, structured speaking turns, and low-pressure confidence building.',
  },
  {
    question: 'What is the pricing preview for parents?',
    answer:
      'The current approved pricing preview is ₹400 per class and ₹4,800 for 12 classes. Parents can review pricing after the free assessment confirms the right starting path.',
  },
  {
    question: 'Do you support families outside India?',
    answer:
      'Yes. Tiny Steps teaches families in India and worldwide through live online English classes.',
  },
];

export default function OnlineEnglishClassesForKidsPage() {
  useEffect(() => {
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
        { '@type': 'ListItem', position: 2, name: 'Courses', item: 'https://tinystepslearning.com/courses' },
        { '@type': 'ListItem', position: 3, name: 'Online English Classes for Kids', item: canonicalUrl },
      ],
    };

    const courseSchema = createCourseSchema({
      name: 'Online English Classes for Kids',
      description:
        'Live online English classes for kids in India and worldwide covering phonics, reading, grammar, spoken English, and public speaking confidence.',
      url: canonicalUrl,
      educationalLevel: 'Beginner to advanced school-age English support',
      teaches: [
        'phonics',
        'reading fluency',
        'grammar',
        'sentence formation',
        'spoken English',
        'public speaking confidence',
      ],
      areaServed: ['India', 'Worldwide'],
    });

    const faqSchema = {
      ...createFAQPageSchema(faqItems),
      '@id': `${canonicalUrl}#faq`,
    };

    applySeo({
      title: 'Online English Classes for Kids in India and Worldwide | Tiny Steps',
      description:
        'Live online English classes for kids with phonics, reading, grammar, spoken English, and confidence-building support. Book a free assessment and review transparent pricing.',
      canonicalPath,
      ogType: 'website',
      jsonLd: [breadcrumbSchema, courseSchema, faqSchema],
    });
  }, []);

  return (
    <div className="bg-gradient-to-b from-[#FFF8EF] via-white to-[#EEF8FF] pb-16">
      <section className="px-4 py-8 sm:px-6 md:py-12 lg:px-8 lg:py-14">
        <div className="mx-auto max-w-7xl rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-700">
                India and worldwide
              </p>
              <h1 className="mt-4 text-[34px] font-bold leading-[1.05] tracking-[-0.035em] text-slate-900 sm:text-[40px] md:text-[50px]">
                Online English Classes for Kids
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700 md:text-lg md:leading-8">
                Live 1:1 and small-group classes that help children build reading, grammar, spoken-English, and public-speaking confidence step by step.
              </p>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-700 md:text-lg md:leading-8">
                Tiny Steps starts with a free assessment, shows parents the right learning path, keeps pricing transparent, and shares visible progress through weekly parent updates.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/book-demo" className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                  Book Free Assessment
                </Link>
                <Link to="/pricing" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50">
                  See Pricing
                </Link>
                <Link to="/class-samples" className="inline-flex items-center justify-center rounded-full border border-sky-200 bg-sky-50 px-6 py-3 text-sm font-semibold text-sky-900 transition hover:bg-sky-100">
                  Class Samples
                </Link>
              </div>
            </div>

            <aside className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-orange-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Why parents choose Tiny Steps</p>
              <div className="mt-4 grid gap-3">
                {[
                  '5000+ students served',
                  'Families in 15+ countries',
                  '1:1 and small-group classes',
                  'Founder and teacher-led learning',
                  'Weekly parent updates',
                  'Free assessment before enrollment',
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-white bg-white/90 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                    {item}
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Who this is for</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              'Parents looking for online English classes for children instead of general tuition.',
              'Children who need phonics, reading, grammar, or spoken-English support in one clear learning system.',
              'Families comparing one-on-one English classes for kids and small-group options.',
              'Parents in India or abroad who want live classes with visible progress and clear next steps.',
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm leading-7 text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-slate-900">Programme tracks</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {programmeTracks.map((track) => (
              <article key={track.title} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">{track.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-700">{track.description}</p>
                <Link to={track.href} className="mt-3 inline-flex text-sm font-semibold text-slate-900 underline underline-offset-4">
                  Explore {track.title}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-slate-200 bg-white p-6">
          <h2 className="text-2xl font-bold text-slate-900">Outcomes by age and stage</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {outcomeStages.map((item) => (
              <article key={item.stage} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                <h3 className="text-lg font-semibold text-slate-900">{item.stage}</h3>
                <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-700">
                  {item.points.map((point) => (
                    <li key={point}>• {point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl grid gap-5 lg:grid-cols-2">
          <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">How the free assessment works</h2>
            <ol className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
              <li>1. Parents share the child&apos;s age, current concerns, and goals.</li>
              <li>2. Tiny Steps checks reading, grammar, sentence formation, and speaking readiness.</li>
              <li>3. Families receive a clear recommended starting path and next-step plan.</li>
              <li>4. Parents then review class samples, pricing, and scheduling with context.</li>
            </ol>
          </article>
          <article className="rounded-[28px] border border-emerald-200 bg-emerald-50/60 p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Pricing preview</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Current approved pricing is simple and transparent:
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Per class</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">₹400</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">12 classes</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">₹4,800</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-700">
              Parents can <Link to="/pricing" className="font-semibold underline underline-offset-4">review pricing</Link> and <Link to="/class-samples" className="font-semibold underline underline-offset-4">class samples</Link> after the free assessment confirms the right fit.
            </p>
          </article>
        </div>
      </section>

      <section className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-slate-200 bg-white p-6">
          <h2 className="text-2xl font-bold text-slate-900">Available for Hyderabad and online learners worldwide</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700">
            This page is the national and global parent-money page for families comparing online English classes for kids. If you are specifically searching for Hyderabad-focused English support, visit the local page for location-based context and messaging.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/online-english-classes-hyderabad" className="inline-flex rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">
              Hyderabad page
            </Link>
            <Link to="/contact" className="inline-flex rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">
              Talk to our team
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-slate-200 bg-white p-6">
          <h2 className="text-2xl font-bold text-slate-900">Helpful next pages</h2>
          <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-slate-900">
            <Link to="/phonics" className="underline underline-offset-4">/phonics</Link>
            <Link to="/grammar" className="underline underline-offset-4">/grammar</Link>
            <Link to="/speaking" className="underline underline-offset-4">/speaking</Link>
            <Link to="/reading-classes-for-kids" className="underline underline-offset-4">/reading-classes-for-kids</Link>
            <Link to="/pricing" className="underline underline-offset-4">/pricing</Link>
            <Link to="/class-samples" className="underline underline-offset-4">/class-samples</Link>
            <Link to="/contact" className="underline underline-offset-4">/contact</Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-slate-200 bg-white p-6">
          <h2 className="text-2xl font-bold text-slate-900">FAQs</h2>
          <div className="mt-4 space-y-4">
            {faqItems.map((faq) => (
              <article key={faq.question}>
                <h3 className="text-base font-semibold text-slate-900">{faq.question}</h3>
                <p className="mt-1 text-sm leading-7 text-slate-700">{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-[32px] bg-slate-900 p-8 text-white">
          <h2 className="text-2xl font-bold">Ready to choose the right English path for your child?</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
            Book a free assessment, review transparent pricing, and see class samples before you decide on phonics, reading, grammar, or spoken-English support.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/book-demo" className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
              Book Free Assessment
            </Link>
            <Link to="/class-samples" className="inline-flex rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              See Pricing and Class Samples
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
