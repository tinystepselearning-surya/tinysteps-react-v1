import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';

const faqItems = [
  {
    question: 'What does a summer reading program improve first?',
    answer:
      'Most children first improve reading flow and confidence through regular guided practice. Accuracy, vocabulary, and comprehension readiness improve as fluency becomes steadier.',
  },
  {
    question: 'Is this useful for a child who reads slowly or avoids reading aloud?',
    answer:
      'Yes. This is ideal for children who pause often, guess words, or avoid reading practice. Live support helps them read with better pace and confidence before school reopens.',
  },
  {
    question: 'Are live online summer reading classes effective?',
    answer:
      'Yes. Live online summer reading classes are effective when children get structured decoding and fluency practice consistently. Tiny Steps combines phonics-backed reading support with clear parent progress updates.',
  },
];

export default function SummerReadingProgramKidsPage() {
  useEffect(() => {
    applySeo({
      title: 'Summer Reading Program for Kids | Tiny Steps Learning',
      description:
        'Summer reading program for kids focused on phonics-backed reading fluency, confidence, and comprehension readiness through live guided sessions.',
      canonicalPath: '/summer-reading-program-kids',
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
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">Summer Reading Program for Kids</h1>
        <p className="mt-4 text-lg text-slate-700">
          Prevent summer reading slide with structured live support that improves reading accuracy, fluency, and confidence.
        </p>
        <Link
          to="/book-demo"
          className="mt-8 inline-block rounded-lg bg-slate-900 px-8 py-3 font-semibold text-white transition hover:bg-slate-800"
        >
          Book Free Assessment
        </Link>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-2 text-lg font-bold text-slate-900">What is a summer reading program for kids?</h2>
        <p className="text-slate-700">
          Tiny Steps offers a live online summer reading program for kids (typically ages 5-10) to strengthen decoding, reading fluency, and confidence during school break. Parents use this program to prevent summer learning loss and return to school with stronger reading readiness.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What this summer reading program helps with</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Better decoding and blending consistency during reading.</li>
          <li>• Smoother sentence reading with stronger fluency flow.</li>
          <li>• Improved reading confidence for school assignments.</li>
          <li>• Stronger vocabulary and comprehension readiness.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Why parents choose summer reading support</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Child reads slowly and avoids reading practice.</li>
          <li>• Parent wants continuity in reading progress over summer.</li>
          <li>• Child needs a confidence boost before the next school term.</li>
          <li>• Parent wants live teacher guidance, not only worksheets.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-emerald-100 bg-emerald-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">How Tiny Steps supports summer reading</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Live sessions with real-time reading correction and guidance.</li>
          <li>• Structured progression from phonics accuracy to reading fluency.</li>
          <li>• Child-friendly activities that keep reading practice engaging.</li>
          <li>• Parent updates with clear next goals in reading development.</li>
        </ul>
        <p className="mt-4 text-sm text-slate-700">
          Related pages:{' '}
          <Link to="/reading-classes-for-kids" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            reading classes for kids
          </Link>
          {' • '}
          <Link to="/phonics" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            phonics classes for kids
          </Link>
          {' • '}
          <Link to="/summer-camps" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            premium summer camps for kids
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
        <h2 className="text-2xl font-bold">Want stronger reading confidence this summer?</h2>
        <p className="mt-2 text-slate-200">Book a free assessment and get a focused summer reading plan.</p>
        <Link
          to="/book-demo"
          className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          Book Demo
        </Link>
      </section>
    </div>
  );
}
