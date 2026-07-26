import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';

const faqItems = [
  {
    question: 'What is an online summer camp for kids in India?',
    answer:
      'An online summer camp for kids in India is a live, structured program during school breaks that builds reading, grammar, and speaking skills. It helps children maintain momentum and return to school with stronger confidence.',
  },
  {
    question: 'Is a summer camp useful if my child already takes English classes?',
    answer:
      'Yes. A summer camp adds focused revision and confidence practice in a shorter timeline. It helps children consolidate skills and avoid learning loss during long breaks.',
  },
  {
    question: 'How many summer classes per week are ideal for kids?',
    answer:
      'Tiny Steps Summer Camp 2026 follows a Monday to Saturday schedule with 24 live classes in 4 weeks, and Sunday is kept as a holiday. In general, the ideal rhythm still depends on age, current level, and attention span.',
  },
  {
    question: 'Are there multiple batch start dates in the current summer camp season?',
    answer:
      'Yes. The Summer Camp season runs from 27 April 2026 to 13 June 2026, and available batch start dates are 27 April, 4 May, 11 May and 18 May 2026. Each child joins one 4-week batch.',
  },
  {
    question: 'Will the final batch finish before school reopens?',
    answer:
      'Yes. The final batch is designed to close by 13 June 2026, before schools reopen on 15 June 2026.',
  },
];

export default function SummerCampForKidsIndiaPage() {
  useEffect(() => {
    applySeo({
      title: 'Summer Camp for Kids India (Parent Planning Guide) | Tiny Steps Learning',
      description:
        'Parent planning guide to choose the right online summer camp for kids in India by age, track, and learning outcome, with the current Tiny Steps Summer Camp 2026 format clearly explained.',
      canonicalPath: '/summer-camp-for-kids-india',
      ogType: 'website',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqItems.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.answer,
            },
          })),
        },
      ],
    });
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-6 py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">Summer Camp for Kids India: Parent Planning Guide</h1>
        <p className="mt-4 text-lg text-slate-700">
          Use this guide to choose the right Tiny Steps summer learning track by age, skill gap, and expected outcome before you book.
        </p>
        <p className="mt-3 text-sm font-medium text-slate-600">
          Current official offer: Summer Camp Season 27 April 2026 to 13 June 2026. Each child joins one 24 live-class batch in 4 weeks, Monday to Saturday, with Sunday kept as a holiday. Batch start dates: 27 April, 4 May, 11 May and 18 May 2026.
        </p>
        <Link
          to="/book-demo"
          className="mt-8 inline-block rounded-lg bg-slate-900 px-8 py-3 font-semibold text-white transition hover:bg-slate-800"
        >
          Book Free Assessment Class
        </Link>
        <p className="mt-2 text-sm text-slate-600">Takes 30 seconds • No commitment</p>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-2 text-lg font-bold text-slate-900">What is a summer camp for kids in India?</h2>
        <p className="text-slate-700">
          A summer camp for kids in India helps children strengthen reading, grammar, and speaking through live guided classes during school break. This page is a parent planning guide to help you compare tracks and pick the best fit before enrollment.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What this summer camp helps with</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Better reading flow and confidence during daily practice.</li>
          <li>• Stronger grammar basics for cleaner sentence usage.</li>
          <li>• More confident speaking in school and social settings.</li>
          <li>• Productive summer routine with measurable progress.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Why parents choose summer support</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Child needs meaningful learning instead of passive screen time.</li>
          <li>• Parent wants structured revision before the next term.</li>
          <li>• Child needs confidence in reading and speaking after a long break.</li>
          <li>• Parent wants small-group live interaction, not only recordings.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-emerald-100 bg-emerald-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">How Tiny Steps supports summer learning</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Live online classes with active teacher feedback.</li>
          <li>• Child-friendly progression across reading, grammar, and speaking.</li>
          <li>• Small-batch environment for better participation.</li>
          <li>• Parent visibility through progress updates and next-step guidance.</li>
          <li>• Trusted by 250+ families with 4.9/5 parent satisfaction and weekly progress updates.</li>
        </ul>
        <p className="mt-4 text-sm text-slate-700">
          Related pages:{' '}
          <Link to="/summer-camps" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            Tiny Steps Summer Camp 2026
          </Link>
          {' • '}
          <Link to="/online-english-classes-for-kids" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            online english classes for kids india
          </Link>
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">FAQs</h2>
        <div className="space-y-4">
          {faqItems.map((item) => (
            <article key={item.question}>
              <h3 className="font-semibold text-slate-900">{item.question}</h3>
              <p className="mt-1 text-sm text-slate-700">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-slate-900 p-8 text-center text-white">
        <p className="mb-3 text-sm text-slate-300">If your child is facing this, the next step is simple:</p>
        <h2 className="text-2xl font-bold">Planning a focused summer for your child?</h2>
        <p className="mt-2 text-slate-200">Book a free assessment and choose the right summer learning track.</p>
        <Link
          to="/book-demo"
          className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          Book Free Assessment Class
        </Link>
        <p className="mt-2 text-sm text-slate-300">Takes 30 seconds • No commitment</p>
      </section>
    </div>
  );
}
