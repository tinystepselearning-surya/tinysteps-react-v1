import { useEffect } from 'react';
import ClusterSeoNav from '../../components/programs/ClusterSeoNav';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';

const faqItems = [
  {
    question: 'Why is my child not reading properly?',
    answer:
      'Common reasons include gaps in phonics, blending, decoding speed, or reading confidence. With structured live support, these gaps usually improve step by step.',
  },
  {
    question: 'How do I know if my child needs reading support?',
    answer:
      'Signs include guessing words, avoiding reading aloud, frequent pauses, and low confidence during homework. These patterns usually mean your child needs guided decoding and fluency support.',
  },
  {
    question: 'Can phonics help if my child guesses words?',
    answer:
      'Yes. Guessing usually means decoding habits are not yet stable. Structured synthetic phonics and guided reading practice improve word accuracy and reading flow.',
  },
];

export default function ChildNotReadingProperlyPage() {
  useEffect(() => {
    applySeo({
      title: 'Child Not Reading Properly? Parent Support Guide | Tiny Steps Learning',
      description:
        'If your child is not reading properly, learn common causes like phonics and blending gaps, slow decoding, and low confidence—plus practical guided support.',
      canonicalPath: '/child-not-reading-properly',
      ogType: 'website',
    });
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-6 py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">If Your Child Is Struggling to Read, Support Is Available</h1>
        <p className="mt-4 text-lg text-slate-700">
          You are not alone. Tiny Steps helps children close reading gaps with calm, live guidance so confidence and fluency improve step by step.
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
        <h2 className="mb-2 text-lg font-bold text-slate-900">What if my child is not reading properly?</h2>
        <p className="text-slate-700">
          If your child is not reading properly, the most common causes are phonics gaps, weak blending, slow decoding, or low confidence. This is common and fixable with the right plan. Tiny Steps provides live guided reading support to improve accuracy, fluency, and confidence with age-appropriate practice.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Problem explained in simple parent language</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Some children memorize words but do not decode sounds reliably.</li>
          <li>• Blending gaps can make sentence reading feel slow and stressful.</li>
          <li>• Repeated struggle often lowers confidence and avoids reading practice.</li>
          <li>• This is common and fixable with step-by-step reading support.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Common signs parents notice</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Child guesses words instead of sounding them out.</li>
          <li>• Child avoids reading aloud or loses confidence quickly.</li>
          <li>• Child reads very slowly and gets stuck often.</li>
          <li>• Child forgets sound patterns between reading tasks.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-emerald-100 bg-emerald-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">How Tiny Steps helps</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Live guided reading sessions with active teacher correction.</li>
          <li>• Structured progression from phonics and blending to fluent reading.</li>
          <li>• Age-appropriate support to rebuild confidence and reading habits.</li>
          <li>• Parent visibility through clear progress updates and next steps.</li>
          <li>• Trusted by 250+ families with 4.9/5 parent satisfaction and weekly progress updates.</li>
        </ul>
        <p className="mt-4 text-sm text-slate-700">
          Helpful pages:{' '}
          <Link to="/reading-classes-for-kids" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            reading classes for kids
          </Link>
          {' • '}
          <Link to="/phonics" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            phonics classes for kids
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
        <h2 className="text-2xl font-bold">Want practical help for your child’s reading progress?</h2>
        <p className="mt-2 text-slate-200">Book a free assessment and get a focused support plan.</p>
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
