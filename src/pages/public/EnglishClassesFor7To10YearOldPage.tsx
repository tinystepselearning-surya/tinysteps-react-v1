import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';

const faqItems = [
  {
    question: 'What should english classes for 7 to 10 year old children include?',
    answer:
      'Strong classes should combine reading comprehension, grammar usage, writing clarity, and speaking confidence in a structured progression.',
  },
  {
    question: 'My child reads but struggles to explain answers. Will this help?',
    answer:
      'Yes. A combined approach improves comprehension, sentence quality, and spoken explanation, which helps in school performance and confidence.',
  },
  {
    question: 'Can one program support reading, grammar, and speaking together?',
    answer:
      'Yes. Many children in this age group need integrated support across reading, writing, and communication rather than isolated skill practice.',
  },
];

export default function EnglishClassesFor7To10YearOldPage() {
  useEffect(() => {
    applySeo({
      title: 'English Classes for 7 to 10 Year Old | Tiny Steps Learning',
      description:
        'English classes for 7 to 10 year old children focused on reading comprehension, grammar usage, writing clarity, speaking confidence, and communication skills.',
      canonicalPath: '/english-classes-for-7-10-year-old',
      ogType: 'website',
    });
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-6 py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">English Classes for 7 to 10 Year Old</h1>
        <p className="mt-4 text-lg text-slate-700">
          Build complete English confidence with guided support in reading, grammar, writing, and speaking.
        </p>
        <Link
          to="/book-demo"
          className="mt-8 inline-block rounded-lg bg-slate-900 px-8 py-3 font-semibold text-white transition hover:bg-slate-800"
        >
          Book Free Assessment
        </Link>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-2 text-lg font-bold text-slate-900">What are english classes for 7 to 10 year old children?</h2>
        <p className="text-slate-700">
          English classes for 7 to 10 year old children should improve reading comprehension, grammar usage, writing clarity, and speaking confidence through structured, age-appropriate teaching.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What children at this age usually need</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Reading comprehension support, not just word reading.</li>
          <li>• Grammar application in writing and speaking tasks.</li>
          <li>• Clear writing for school answers and paragraph work.</li>
          <li>• Speaking confidence for presentations and communication.</li>
          <li>• Better stage presence and classroom participation.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Common parent concerns</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• My child reads but misses meaning in passages.</li>
          <li>• My child knows grammar rules but cannot apply them well.</li>
          <li>• My child writes short or unclear answers.</li>
          <li>• My child avoids speaking in class or on stage.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-emerald-100 bg-emerald-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">How Tiny Steps helps</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Live guided teaching across reading, grammar, writing, and speaking.</li>
          <li>• Age-appropriate progression aligned to school expectations.</li>
          <li>• Interactive tasks for comprehension, expression, and communication.</li>
          <li>• Personal attention with clear parent updates and next-step goals.</li>
        </ul>
        <p className="mt-4 text-sm text-slate-700">
          Core authority pages:{' '}
          <Link to="/grammar" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            grammar classes
          </Link>
          {' • '}
          <Link to="/speaking" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            speaking classes
          </Link>
          {' • '}
          <Link to="/reading-classes-for-kids" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            reading classes for kids
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
        <h2 className="text-2xl font-bold">Ready to strengthen your child’s full English skills?</h2>
        <p className="mt-2 text-slate-200">Book a free assessment and get a complete English improvement roadmap.</p>
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
