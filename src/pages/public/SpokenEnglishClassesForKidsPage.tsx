import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';

const faqItems = [
  {
    question: 'What age should a child start spoken English classes?',
    answer:
      'Many children can begin from age 4 with short guided speaking routines. Older children usually need structured sentence-building, communication practice, and confidence coaching.',
  },
  {
    question: 'Will spoken English classes help a shy child?',
    answer:
      'Yes. A low-pressure, step-by-step format helps shy children build comfort first, then vocabulary, sentence flow, and speaking confidence.',
  },
  {
    question: 'Are online spoken English classes effective for kids?',
    answer:
      'Yes. Live online spoken English classes are effective when children get frequent speaking turns and direct feedback. Consistent practice improves clarity, confidence, and classroom participation.',
  },
];

export default function SpokenEnglishClassesForKidsPage() {
  useEffect(() => {
    applySeo({
      title: 'Spoken English Classes for Kids India | Tiny Steps Learning',
      description:
        'Spoken English classes for kids in India focused on communication confidence, vocabulary growth, sentence formation, and stage speaking readiness.',
      canonicalPath: '/spoken-english-classes-for-kids',
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
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">Help Your Child Speak English Clearly and Confidently</h1>
        <p className="mt-4 text-lg text-slate-700">
          Tiny Steps live spoken English classes help children move from hesitation to confident speaking in class, conversations, and presentations.
        </p>
        <Link
          to="/book-demo"
          className="mt-8 inline-block rounded-lg bg-slate-900 px-8 py-3 font-semibold text-white transition hover:bg-slate-800"
        >
          Book Free Assessment Class
        </Link>
        <p className="mt-2 text-sm text-slate-600">Takes 30 seconds • No commitment</p>
      </section>

      <section className="mb-10 rounded-xl border border-amber-100 bg-amber-50 p-6">
        <h2 className="mb-2 text-lg font-bold text-slate-900">What are spoken English classes for kids?</h2>
        <p className="text-slate-700">
          Spoken English classes for kids help children speak in clearer sentences, use stronger vocabulary, and communicate with confidence in school and daily life. They work best for children who understand English but hesitate to speak, answer briefly, or avoid speaking tasks.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Why parents choose this path</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Child understands English but hesitates to speak.</li>
          <li>• Child uses short or broken sentences.</li>
          <li>• Parent wants better classroom participation and confidence.</li>
          <li>• Child needs communication readiness for speeches and presentations.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-amber-100 bg-amber-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">How Tiny Steps helps</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Live speaking classes with guided correction and encouragement.</li>
          <li>• Structured progression from sentence speaking to short stage talks.</li>
          <li>• Age-appropriate activities for confidence, clarity, and vocabulary use.</li>
          <li>• Parent-visible progress through speaking milestones and feedback.</li>
          <li>• Trusted by 250+ families with 4.9/5 parent satisfaction and weekly progress updates.</li>
        </ul>
        <p className="mt-4 text-sm text-slate-700">
          Core authority page:{' '}
          <Link to="/speaking" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            public speaking classes for kids
          </Link>
          {' • '}
          <Link to="/confidence-building-program-kids" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            confidence building program
          </Link>
          {' • '}
          <Link to="/shy-child-speaking-confidence" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            shy child speaking confidence help
          </Link>
          {' • '}
          <Link to="/summer-speaking-camp-kids" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            summer speaking camp for kids
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
        <h2 className="text-2xl font-bold">Ready to build speaking confidence?</h2>
        <p className="mt-2 text-slate-200">Book a free assessment to choose the right spoken-English starting point.</p>
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
