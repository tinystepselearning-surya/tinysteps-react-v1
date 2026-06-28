import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { createCourseSchema, createFAQPageSchema, PUBLIC_FACTS } from '../../lib/schemas';

const canonicalPath = '/spoken-english-classes-for-kids-online';
const canonicalUrl = `${PUBLIC_FACTS.primaryWebsite}${canonicalPath}`;

const painPoints = [
  'Child gives one-word answers',
  'Child understands English but does not speak confidently',
  'Child needs sentence expansion',
  'Child is shy in class',
];

const faqItems = [
  {
    question: 'What if my child understands English but does not speak much?',
    answer:
      'That usually means the child needs guided speaking turns, sentence expansion, and confidence practice, not just more listening exposure.',
  },
  {
    question: 'Can these classes help a shy child?',
    answer:
      'Yes. Tiny Steps uses low-pressure live speaking practice so shy children can move from short answers to fuller, clearer responses over time.',
  },
  {
    question: 'Why do some children give only one-word answers?',
    answer:
      'Children often need sentence-building support, more response structure, and guided follow-up questions to move beyond one-word answers.',
  },
  {
    question: 'Do spoken English classes connect with grammar?',
    answer:
      'Yes. Better spoken English depends on grammar in use, sentence formation, and practice applying words clearly in real responses.',
  },
];

export default function SpokenEnglishClassesForKidsPage() {
  useEffect(() => {
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
        { '@type': 'ListItem', position: 2, name: 'Courses', item: 'https://tinystepslearning.com/courses' },
        { '@type': 'ListItem', position: 3, name: 'Spoken English Classes for Kids Online', item: canonicalUrl },
      ],
    };

    const courseSchema = createCourseSchema({
      name: 'Spoken English Classes for Kids Online',
      description:
        'Live spoken English classes for kids online focused on sentence expansion, confident responses, grammar in use, and speaking confidence.',
      url: canonicalUrl,
      educationalLevel: 'School-age spoken English support',
      teaches: ['spoken English', 'sentence expansion', 'grammar in use', 'response confidence', 'public speaking readiness'],
      areaServed: ['India', 'Worldwide'],
    });

    const faqSchema = {
      ...createFAQPageSchema(faqItems),
      '@id': `${canonicalUrl}#faq`,
    };

    applySeo({
      title: 'Spoken English Classes for Kids Online | Tiny Steps Learning',
      description:
        'Live spoken English classes for kids online. Help children move past one-word answers, build sentence confidence, and speak clearly with grammar-linked support.',
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
                Speaking confidence support
              </p>
              <h1 className="mt-4 text-[34px] font-bold leading-[1.05] tracking-[-0.035em] text-slate-900 sm:text-[40px] md:text-[50px]">
                Spoken English Classes for Kids Online
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700 md:text-lg md:leading-8">
                Help your child speak in fuller sentences, answer more confidently, and express ideas clearly through structured live spoken-English classes for kids online.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {painPoints.map((item) => (
                  <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 sm:text-sm">
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/book-demo" className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                  Book a Free Speaking Confidence Assessment
                </Link>
                <Link to="/class-samples" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">
                  See Pricing and Class Samples
                </Link>
              </div>
            </div>

            <aside className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-amber-50 p-6">
              <h2 className="text-xl font-bold text-slate-900">When parents usually land on this page</h2>
              <div className="mt-4 grid gap-3">
                {[
                  'The child can understand English but avoids speaking.',
                  'Answers stop at one or two words.',
                  'Sentence expansion feels hard during school responses.',
                  'The child is shy in class, reading aloud, or presentations.',
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-white bg-white/90 px-4 py-3 text-sm leading-7 text-slate-700 shadow-sm">
                    {item}
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl grid gap-5 lg:grid-cols-2">
          <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">How Tiny Steps helps</h2>
            <ul className="mt-4 space-y-2 text-sm leading-7 text-slate-700">
              <li>• Builds response length through sentence starters and follow-up prompts.</li>
              <li>• Connects spoken English with <Link to="/grammar" className="font-semibold underline underline-offset-4">grammar</Link> so children can apply better sentence structure while speaking.</li>
              <li>• Uses <Link to="/speaking" className="font-semibold underline underline-offset-4">speaking</Link> routines to improve clarity, expression, and confidence.</li>
              <li>• Gives parents visibility into what improved and what needs more practice next.</li>
            </ul>
          </article>

          <article className="rounded-[28px] border border-emerald-200 bg-emerald-50/60 p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Pricing preview and trust proof</h2>
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
            <ul className="mt-4 space-y-2 text-sm leading-7 text-slate-700">
              <li>• 5000+ students served</li>
              <li>• Families in 15+ countries</li>
              <li>• Founder and teacher-led live learning</li>
              <li>• Class samples and assessment before parents decide</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-slate-200 bg-white p-6">
          <h2 className="text-2xl font-bold text-slate-900">How the speaking confidence assessment works</h2>
          <ol className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
            <li>1. We understand where the child gets stuck while speaking.</li>
            <li>2. We check response length, clarity, sentence formation, and confidence.</li>
            <li>3. We identify whether the next step is spoken English practice, grammar-linked sentence work, or broader speaking confidence support.</li>
            <li>4. Parents receive a practical recommendation before enrollment.</li>
          </ol>
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
          <h2 className="text-2xl font-bold">Ready to help your child speak more confidently?</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
            If your child gives one-word answers, hesitates in class, or needs sentence expansion support, start with a free speaking confidence assessment.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/book-demo" className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
              Book a Free Speaking Confidence Assessment
            </Link>
            <Link to="/contact" className="inline-flex rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              Contact Tiny Steps
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
