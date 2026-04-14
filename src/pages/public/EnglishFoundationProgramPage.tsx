import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';

const faqItems = [
  {
    question: 'What is an English foundation program for kids?',
    answer:
      'An English foundation program is a structured multi-skill plan that strengthens reading, grammar, writing, and speaking basics together. It is useful when a child needs balanced core improvement rather than one isolated skill class.',
  },
  {
    question: 'How do I know if my child needs foundation support instead of only phonics or only grammar?',
    answer:
      'If your child shows mixed gaps across two or more areas (for example reading accuracy plus weak sentence writing or low speaking confidence), a foundation pathway is usually better than a single-skill class.',
  },
  {
    question: 'Which age group is this best for?',
    answer:
      'This format is commonly useful for ages 5-12, especially during transitions when school language demands increase and children need stronger basics across comprehension, writing, and communication.',
  },
  {
    question: 'How is this different from general online English classes?',
    answer:
      'General English pages describe broad offerings. This page focuses on a baseline-building pathway with clear sequencing across core language pillars and weekly parent-visible progression.',
  },
  {
    question: 'When should parents seek a structured foundation program?',
    answer:
      'Choose structured foundation support when progress is uneven across reading, grammar, writing, and speaking despite regular effort, or when school expectations are rising faster than current language confidence.',
  },
];

export default function EnglishFoundationProgramPage() {
  useEffect(() => {
    applySeo({
      title: 'English Foundation Program for Kids: Core Skills Pathway | Tiny Steps Learning',
      description:
        'Parent guide to our English foundation program for kids: who it fits, baseline checks across reading-grammar-writing-speaking, and when to choose a structured core-skills pathway.',
      canonicalPath: '/english-foundation-program',
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
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">English Foundation Program for Kids</h1>
        <p className="mt-4 text-lg text-slate-700">
          Build strong language basics across reading, grammar, writing, and speaking through one structured core-skills pathway.
        </p>
        <Link
          to="/book-demo"
          className="mt-8 inline-block rounded-lg bg-slate-900 px-8 py-3 font-semibold text-white transition hover:bg-slate-800"
        >
          Book Free Assessment
        </Link>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-2 text-lg font-bold text-slate-900">Quick answer</h2>
        <p className="text-slate-700">
          This program is for children who need dependable English basics across multiple skills, not one narrow fix. It is most useful when reading, grammar, writing, and speaking progress are uneven or disconnected.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Who this foundation pathway is for</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Child can perform in one area but struggles to transfer skills into school tasks.</li>
          <li>• Parent sees mixed patterns: reading okay, writing weak; grammar okay, speaking hesitant.</li>
          <li>• Child needs stronger sentence control, comprehension consistency, and communication confidence.</li>
          <li>• Family wants one coherent pathway instead of separate disconnected classes.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Use this as a decision page: foundation vs single-skill</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Choose foundation pathway when 2-4 domains need support together.</li>
          <li>• Choose phonics-first when decoding is the primary blocker in reading.</li>
          <li>• Choose grammar-focused support when sentence accuracy is the main issue.</li>
          <li>• Choose speaking-focused support when expression confidence is the main issue.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What to check at home this week</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Reading: can your child read short grade-level passages with stable understanding?</li>
          <li>• Grammar: can your child apply basic rules in their own sentence writing, not only identify errors?</li>
          <li>• Writing: can your child produce clear 3-5 sentence responses with logical flow?</li>
          <li>• Speaking: can your child explain one idea in complete sentences with low hesitation?</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What each result usually suggests</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• One domain weak, others stable: start with targeted single-skill support.</li>
          <li>• Two or more domains weak: foundation pathway is usually the better fit.</li>
          <li>• Good worksheet performance but weak real communication: add speaking and applied writing tasks.</li>
          <li>• Strong oral language but weak reading/writing transfer: reinforce structured literacy and sentence construction together.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-emerald-100 bg-emerald-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What to start doing now</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Use one weekly plan that includes reading, grammar, writing, and speaking practice in short cycles.</li>
          <li>• Track one clear outcome per domain each week instead of one broad “English improved” goal.</li>
          <li>• Keep routines consistent and level-appropriate before increasing difficulty.</li>
          <li>• Review progress weekly and adjust focus to the weakest domain without abandoning the others.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-rose-100 bg-rose-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What to avoid</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Do not split learning into random disconnected activities every week.</li>
          <li>• Do not assume rule memorization equals real language transfer.</li>
          <li>• Do not focus only on marks while ignoring expression confidence.</li>
          <li>• Do not overload one skill and neglect the others for long periods.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-amber-100 bg-amber-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">When to choose structured foundation support</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• School tasks show recurring weaknesses across more than one language area.</li>
          <li>• Home effort is regular but progress remains inconsistent.</li>
          <li>• Child confidence is dropping because language gaps appear in multiple contexts.</li>
          <li>• Parent needs a clear sequenced plan with weekly direction.</li>
        </ul>
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

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Relevant next-step links</h2>
        <ul className="space-y-2 text-slate-700">
          <li>
            • For broad English options overview:{' '}
            <Link to="/online-english-classes-for-kids-india" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Online English Classes for Kids India
            </Link>
          </li>
          <li>
            • For age-specific planning (7-10):{' '}
            <Link to="/english-classes-for-7-10-year-old" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              English Classes for 7 to 10 Year Old
            </Link>
          </li>
          <li>
            • For decoding-first pathway:{' '}
            <Link to="/phonics" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Phonics
            </Link>
          </li>
          <li>
            • For grammar-first pathway:{' '}
            <Link to="/grammar" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Grammar
            </Link>
          </li>
          <li>
            • For speaking-first pathway:{' '}
            <Link to="/speaking" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Speaking
            </Link>
          </li>
        </ul>
      </section>

      <section className="rounded-xl bg-slate-900 p-8 text-center text-white">
        <h2 className="text-2xl font-bold">Ready to build strong English fundamentals?</h2>
        <p className="mt-2 text-slate-200">Book a free assessment and get a structured foundation roadmap.</p>
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
