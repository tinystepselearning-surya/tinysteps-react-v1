import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { createFAQPageSchema } from '../../lib/schemas';

const faqItems = [
  {
    question: 'What do children learn in Tiny Steps online English classes?',
    answer:
      'Children build skills in phonics, reading fluency, grammar, sentence formation, communication, and confidence through live guided classes matched to their stage.',
  },
  {
    question: 'Are these classes suitable for children who cannot read properly?',
    answer:
      'Yes. If a child cannot read properly, the class path usually starts with phonics and blending, then moves to reading fluency and comprehension in a structured sequence.',
  },
  {
    question: 'How do I know whether my child needs phonics, grammar, reading, or communication support?',
    answer:
      'Tiny Steps uses a free assessment to check current level and identify the strongest starting point. Parents receive a clear recommendation based on reading, grammar, sentence formation, and communication needs.',
  },
  {
    question: 'Are the classes one-to-one?',
    answer:
      'Tiny Steps offers premium 1:1 live support and may also suggest suitable formats based on the child’s level and goals. The assessment helps choose the right fit.',
  },
  {
    question: 'Can online English classes help children build confidence?',
    answer:
      'Yes. Confidence improves when children receive guided correction, stage-wise practice, and consistent speaking and sentence-building opportunities in a supportive environment.',
  },
  {
    question: 'What happens in the free assessment class?',
    answer:
      'In the free assessment, Tiny Steps checks reading stage, phonics, grammar, sentence formation, and communication confidence, then recommends the right course pathway.',
  },
];

export default function OnlineEnglishClassesForKidsIndiaPage() {
  useEffect(() => {
    const faqSchema = {
      ...createFAQPageSchema(faqItems),
      '@id': 'https://tinystepslearning.com/online-english-classes-for-kids-india#faq',
    };

    applySeo({
      title: 'Online English Classes for Kids India | Tiny Steps Learning',
      description:
        'Online English classes for kids in India covering phonics-based reading, grammar and writing, and speaking confidence through live guided learning.',
      canonicalPath: '/online-english-classes-for-kids-india',
      ogType: 'website',
      jsonLd: [faqSchema],
    });
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-6 py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">Online English Classes for Kids in India</h1>
        <p className="mt-4 text-lg text-slate-700">
          Tiny Steps helps children build stronger phonics, reading, grammar, sentence formation, communication, and confidence through structured live online classes.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/book-demo"
            className="inline-block rounded-lg bg-slate-900 px-8 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            Book Free Assessment
          </Link>
          <Link
            to="/courses"
            className="inline-block rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-900 transition hover:border-slate-400"
          >
            Explore Courses
          </Link>
        </div>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Quick Answer for Parents</h2>
        <p className="text-slate-700">
          If you are looking for online English classes in India, start with a program that identifies your child’s exact gap first, then teaches in the right progression. Tiny Steps follows a stage-wise path so children improve skill clarity and confidence together.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Who this program is for</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Children who know some basics but need structured reading and language progression.</li>
          <li>• Children who can read words but struggle with sentence formation or confidence.</li>
          <li>• Children who need grammar accuracy and clearer expression in school tasks.</li>
          <li>• Parents who want one guided pathway instead of random worksheets or disconnected activities.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-indigo-100 bg-indigo-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What children learn at Tiny Steps</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Phonics and decoding for accurate word reading.</li>
          <li>• Reading fluency and comprehension for stronger understanding.</li>
          <li>• Grammar and sentence formation for clearer writing and speaking.</li>
          <li>• Communication practice for structured answers and confidence.</li>
          <li>• Stage-based progression with regular parent guidance.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">How Tiny Steps is different from generic tuition or random activity classes</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• We start with skill diagnosis before class planning.</li>
          <li>• We follow a defined pathway instead of topic hopping.</li>
          <li>• We focus on application: reading, sentence use, and communication confidence.</li>
          <li>• Parents receive clear next-step guidance, not just homework lists.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Program pathways</h2>
        <p className="text-slate-700">
          phonics → reading → grammar → sentence formation → communication confidence
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold">
          <Link to="/phonics" className="underline underline-offset-2">Explore Phonics</Link>
          <Link to="/reading-classes-for-kids" className="underline underline-offset-2">Explore Reading Classes</Link>
          <Link to="/grammar" className="underline underline-offset-2">Explore Grammar</Link>
          <Link to="/speaking" className="underline underline-offset-2">Explore Communication Classes</Link>
        </div>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Age-wise guidance</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-lg font-semibold text-slate-900">Ages 4-6</h3>
            <p className="mt-2 text-sm text-slate-700">Best stage to build phonics foundation, blending, and early reading confidence.</p>
            <Link to="/english-classes-for-5-year-old" className="mt-3 inline-block text-sm font-semibold underline underline-offset-2">
              Explore ages 4-6 path
            </Link>
          </article>
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-lg font-semibold text-slate-900">Ages 7-10</h3>
            <p className="mt-2 text-sm text-slate-700">Strong focus on reading fluency, grammar usage, sentence formation, and clarity.</p>
            <Link to="/english-classes-for-7-10-year-old" className="mt-3 inline-block text-sm font-semibold underline underline-offset-2">
              Explore ages 7-10 path
            </Link>
          </article>
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-lg font-semibold text-slate-900">Ages 11-12</h3>
            <p className="mt-2 text-sm text-slate-700">Focus on comprehension depth, structured expression, grammar accuracy, and communication confidence.</p>
          </article>
        </div>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">How to choose the right class for your child</h2>
        <ol className="space-y-2 text-slate-700">
          <li>1. Start with your child’s current gap, not just age.</li>
          <li>2. Check whether the first need is phonics, reading fluency, grammar, or communication.</li>
          <li>3. Choose a stage-based pathway with visible progression.</li>
          <li>4. Review regularly and move to the next stage when the current foundation is stable.</li>
        </ol>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Tiny Steps assessment: what we check before suggesting a course</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Phonics and blending foundation</li>
          <li>• Reading pace, fluency, and comprehension</li>
          <li>• Grammar control and sentence formation ability</li>
          <li>• Communication confidence and expression clarity</li>
          <li>• Best starting pathway for the next 8-12 weeks</li>
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

      <section className="rounded-xl bg-slate-900 p-8 text-center text-white">
        <h2 className="text-2xl font-bold">Parent action: book a free assessment first</h2>
        <p className="mt-2 text-slate-200">Get a clear course recommendation before choosing the program path.</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/book-demo"
            className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            Book Free Assessment
          </Link>
          <Link
            to="/courses"
            className="inline-block rounded-lg border border-white/40 px-6 py-3 font-semibold text-white transition hover:border-white/70"
          >
            Explore Courses
          </Link>
        </div>
      </section>
    </div>
  );
}
