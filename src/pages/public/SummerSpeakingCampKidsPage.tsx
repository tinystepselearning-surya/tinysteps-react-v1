import { useEffect } from 'react';
import ClusterSeoNav from '../../components/programs/ClusterSeoNav';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';

const faqItems = [
  {
    question: 'What does a summer speaking camp improve first?',
    answer:
      'Most children first improve speaking comfort and sentence flow. With consistent live practice, vocabulary use and presentation clarity improve next.',
  },
  {
    question: 'Will this help a shy child speak more confidently?',
    answer:
      'Yes. Tiny Steps uses low-pressure speaking routines, structured prompts, and supportive feedback so shy children build confidence step by step.',
  },
  {
    question: 'Are live online speaking camps effective for school presentations?',
    answer:
      'Yes. Live online speaking camps are effective when children get regular speaking turns and coaching. They learn to organize ideas, speak clearly, and present with better confidence.',
  },
];

export default function SummerSpeakingCampKidsPage() {
  useEffect(() => {
    applySeo({
      title: 'Summer Speaking Camp for Kids | Tiny Steps Learning',
      description:
        'Summer speaking camp for kids focused on communication confidence, expressive speaking, vocabulary growth, and presentation readiness through live sessions.',
      canonicalPath: '/summer-speaking-camp-kids',
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
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">Summer Speaking Camp for Kids</h1>
        <p className="mt-4 text-lg text-slate-700">
          Build confident communication this summer with structured live speaking sessions designed for children.
        </p>
        <Link
          to="/book-demo"
          className="mt-8 inline-block rounded-lg bg-slate-900 px-8 py-3 font-semibold text-white transition hover:bg-slate-800"
        >
          Book Free Assessment
        </Link>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-2 text-lg font-bold text-slate-900">What is a summer speaking camp for kids?</h2>
        <p className="text-slate-700">
          Tiny Steps runs a live online summer speaking camp for kids (typically ages 6-14) to improve communication confidence, sentence clarity, and presentation readiness. Parents choose it to help children return to school speaking with less hesitation and stronger communication confidence.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What this summer speaking camp helps with</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Higher speaking confidence in classroom participation.</li>
          <li>• Better sentence flow and clearer verbal expression.</li>
          <li>• Improved vocabulary use in everyday communication.</li>
          <li>• Stronger readiness for presentations and stage speaking.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Why parents choose summer speaking support</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Child feels shy and avoids speaking in groups.</li>
          <li>• Parent wants expressive communication, not memorized answers.</li>
          <li>• Child needs confidence before school talks and activities.</li>
          <li>• Parent wants live speaking practice with real teacher feedback.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-emerald-100 bg-emerald-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">How Tiny Steps supports summer speaking</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Live teacher-led sessions with supportive speaking correction.</li>
          <li>• Structured progression from basic expression to confident delivery.</li>
          <li>• Child-friendly speaking activities for steady confidence growth.</li>
          <li>• Parent updates with practical milestones and next goals.</li>
        </ul>
        <p className="mt-4 text-sm text-slate-700">
          Related pages:{' '}
          <Link to="/speaking" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            public speaking classes for kids
          </Link>
          {' • '}
          <Link to="/spoken-english-classes-for-kids" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            communication classes for kids
          </Link>
          {' • '}
          <Link to="/summer-camps" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            Tiny Steps Summer Camp 2026
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
        <h2 className="text-2xl font-bold">Ready to build speaking confidence this summer?</h2>
        <p className="mt-2 text-slate-200">Book a free assessment and get the right summer speaking plan.</p>
        <Link
          to="/book-demo"
          className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          Book Demo
        </Link>
      </section>
      <ClusterSeoNav cluster="speaking" />
    </div>
  );
}
