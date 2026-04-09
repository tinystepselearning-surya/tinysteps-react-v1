import { useEffect } from 'react';
import ClusterSeoNav from '../../components/programs/ClusterSeoNav';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';

const faqItems = [
  {
    question: 'What do online reading classes help with first?',
    answer:
      'Most children first improve word decoding accuracy and reading confidence. As decoding becomes easier, reading fluency and comprehension usually improve more steadily.',
  },
  {
    question: 'How can I help my child who reads slowly?',
    answer:
      'Slow reading often improves with structured phonics and fluency practice. Live guided reading helps children reduce pauses, read more smoothly, and build confidence.',
  },
  {
    question: 'Are online reading classes effective for kids?',
    answer:
      'Yes. Online reading classes are effective when sessions are live, level-based, and consistent. Two to three classes per week with short home practice is a strong rhythm for progress.',
  },
];

export default function ReadingClassesForKidsPage() {
  useEffect(() => {
    applySeo({
      title: 'Online Reading Classes for Kids | Tiny Steps Learning',
      description:
        'Online reading classes for kids focused on blending, reading fluency, confidence, and early comprehension support through live guided practice.',
      canonicalPath: '/reading-classes-for-kids',
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
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">Help Your Child Read Confidently and Fluently</h1>
        <p className="mt-4 text-lg text-slate-700">
          Tiny Steps live online reading classes help children move from slow, hesitant reading to smoother sentence reading with confidence.
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
        <h2 className="mb-2 text-lg font-bold text-slate-900">What are online reading classes for kids?</h2>
        <p className="text-slate-700">
          Online reading classes for kids help children improve phonics-based decoding, reading fluency, and confidence through live guided teaching. They are especially useful for children who know some words but are not yet reading smoothly, accurately, or comfortably.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Why parents choose reading support</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Child reads words but struggles to read sentences smoothly.</li>
          <li>• Child guesses words instead of decoding carefully.</li>
          <li>• Reading confidence drops during school homework.</li>
          <li>• Parent wants stronger comprehension foundations, not rote reading.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-emerald-100 bg-emerald-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">How Tiny Steps helps</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Live 1:1 or small-group reading classes with active teacher feedback.</li>
          <li>• Structured progression from sound blending to sentence reading.</li>
          <li>• Age-appropriate reading tasks for children who need confidence and flow.</li>
          <li>• Parent-friendly updates on accuracy, fluency, and next reading goals.</li>
          <li>• Trusted by 250+ families with 4.9/5 parent satisfaction and weekly progress updates.</li>
        </ul>
        <p className="mt-4 text-sm text-slate-700">
          Core foundation page:{' '}
          <Link to="/phonics" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            phonics classes for kids
          </Link>
          {' • '}
          <Link to="/reading-fluency-program" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            reading fluency program
          </Link>
          {' • '}
          <Link to="/slow-reader-child-help" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            slow reader child help
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
        <h2 className="text-2xl font-bold">Want your child to read with confidence?</h2>
        <p className="mt-2 text-slate-200">Book a free assessment and get the right starting plan.</p>
        <Link
          to="/book-demo"
          className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          Book Free Assessment Class
        </Link>
        <p className="mt-2 text-sm text-slate-300">Takes 30 seconds • No commitment</p>
      </section>
      <ClusterSeoNav cluster="phonics" />
    </div>
  );
}
