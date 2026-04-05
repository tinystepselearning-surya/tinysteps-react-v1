import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';

const faqItems = [
  {
    question: 'What do online English classes for kids include?',
    answer:
      'Strong online English classes include reading foundations, grammar-writing support, and spoken communication practice. This combination helps children improve both school performance and confidence.',
  },
  {
    question: 'How do I choose the right English class focus for my child?',
    answer:
      'Start with your child’s biggest gap first—reading, writing, or speaking. Then build a balanced plan so all three skills grow together over time.',
  },
  {
    question: 'Are online English classes effective for kids?',
    answer:
      'Yes. Online English classes are effective when they are live, level-based, and consistent. Many children benefit from one integrated plan across reading, writing, and speaking.',
  },
];

export default function OnlineEnglishClassesForKidsIndiaPage() {
  useEffect(() => {
    applySeo({
      title: 'Online English Classes for Kids India | Tiny Steps Learning',
      description:
        'Online English classes for kids in India covering phonics-based reading, grammar and writing, and speaking confidence through live guided learning.',
      canonicalPath: '/online-english-classes-for-kids-india',
      ogType: 'website',
    });
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-6 py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">Build Strong Reading, Writing, and Speaking Confidence</h1>
        <p className="mt-4 text-lg text-slate-700">
          Tiny Steps live online English classes help children improve school performance and communication confidence with one structured plan.
        </p>
        <Link
          to="/book-demo"
          className="mt-8 inline-block rounded-lg bg-slate-900 px-8 py-3 font-semibold text-white transition hover:bg-slate-800"
        >
          Book Free Assessment Class
        </Link>
        <p className="mt-2 text-sm text-slate-600">Takes 30 seconds • No commitment</p>
      </section>

      <section className="mb-10 rounded-xl border border-indigo-100 bg-indigo-50 p-6">
        <h2 className="mb-2 text-lg font-bold text-slate-900">What are online english classes for kids?</h2>
        <p className="text-slate-700">
          Online English classes for kids help children improve reading, grammar-writing, and speaking confidence through live, age-appropriate instruction. Tiny Steps uses structured guided classes for ages 4-15 so children can communicate more clearly and perform better in school tasks.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Why parents choose full English support</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Child needs improvement across more than one English skill area.</li>
          <li>• Reading, writing, and speaking progress feels unbalanced.</li>
          <li>• Parent wants a clear long-term plan, not disconnected classes.</li>
          <li>• School expectations increase with grade level and confidence demands.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-indigo-100 bg-indigo-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">How Tiny Steps helps</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Live classes across core English pillars: reading, grammar-writing, and speaking.</li>
          <li>• Structured progression by age and current level.</li>
          <li>• Practical teaching for comprehension, expression, and confidence.</li>
          <li>• Parent updates with clear milestones and next actions.</li>
          <li>• Trusted by 250+ families with 4.9/5 parent satisfaction and weekly progress updates.</li>
        </ul>
        <p className="mt-4 text-sm text-slate-700">
          Explore core authority pages:{' '}
          <Link to="/phonics" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            phonics
          </Link>
          {' • '}
          <Link to="/grammar" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            grammar
          </Link>
          {' • '}
          <Link to="/speaking" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            speaking
          </Link>
          {' • '}
          <Link to="/writing-classes-for-kids" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            writing classes for kids
          </Link>
          {' • '}
          <Link to="/english-foundation-program" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            english foundation program
          </Link>
          {' • '}
          <Link to="/english-classes-for-7-10-year-old" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            english classes for 7 to 10 year old
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
        <h2 className="text-2xl font-bold">Ready for a complete English growth plan?</h2>
        <p className="mt-2 text-slate-200">Book a free assessment and get a tailored roadmap for your child.</p>
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
