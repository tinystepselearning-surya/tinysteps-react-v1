import { useEffect } from 'react';
import ClusterSeoNav from '../../components/programs/ClusterSeoNav';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { createFAQPageSchema } from '../../lib/schemas';

const faqItems = [
  {
    question: 'Why is my child not reading properly?',
    answer:
      'A child may struggle with reading because of gaps in letter sounds, blending, decoding, reading fluency, vocabulary, comprehension, or confidence. The exact gap should be identified before choosing worksheets or classes.',
  },
  {
    question: 'My child knows ABC but cannot read words. What should I do?',
    answer:
      'If a child knows letters but cannot read words, they may need phonics and blending support. Start with letter sounds, simple blending, and guided word reading instead of memorizing word lists.',
  },
  {
    question: 'What is the difference between phonics support and reading support?',
    answer:
      'Phonics support helps children decode sounds and words. Reading support helps children improve fluency, expression, comprehension, and confidence while reading sentences and passages.',
  },
  {
    question: 'Can online classes help a child who reads slowly?',
    answer:
      'Yes. Live online reading classes can help when the teacher checks the child’s reading stage, corrects mistakes, builds fluency, and gives guided practice through words, sentences, and passages.',
  },
  {
    question: 'How do I know which course my child needs?',
    answer:
      'A free assessment can help identify whether the child needs phonics, reading fluency, comprehension, grammar, or a combined learning path.',
  },
];

export default function ChildNotReadingProperlyPage() {
  useEffect(() => {
    const faqSchema = {
      ...createFAQPageSchema(faqItems),
      '@id': 'https://tinystepslearning.com/child-not-reading-properly#faq',
    };

    applySeo({
      title: 'Child Not Reading Properly? Parent Support Guide | Tiny Steps Learning',
      description:
        'If your child is not reading properly, learn whether the gap is phonics, blending, fluency, comprehension, or confidence. Book a free reading assessment.',
      canonicalPath: '/child-not-reading-properly',
      ogType: 'website',
      jsonLd: [faqSchema],
    });
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-6 py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">Child Not Reading Properly? Start by Finding the Real Gap</h1>
        <p className="mt-4 text-lg text-slate-700">
          Some children know letters but cannot blend words. Some can read words but read slowly, guess often, or struggle to understand passages. Tiny Steps helps parents identify the right starting point.
        </p>
        <ul className="mx-auto mt-5 grid max-w-3xl gap-2 text-left text-sm text-slate-700 sm:grid-cols-2">
          <li>• Parent-friendly reading gap check</li>
          <li>• Phonics, blending, fluency, and comprehension support</li>
          <li>• Live teacher-guided classes</li>
          <li>• Free assessment before course recommendation</li>
        </ul>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/book-demo"
            className="inline-block rounded-lg bg-slate-900 px-8 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            Book Free Assessment
          </Link>
          <Link
            to="/phonics"
            className="inline-block rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-900 transition hover:border-slate-400"
          >
            Explore Phonics
          </Link>
          <Link
            to="/reading-classes-for-kids"
            className="inline-block rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-900 transition hover:border-slate-400"
          >
            Explore Reading Support
          </Link>
        </div>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Why children may not read properly</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• They know letter names but not letter sounds.</li>
          <li>• They know sounds but cannot blend them into words.</li>
          <li>• They guess words from pictures or memory.</li>
          <li>• They read one word at a time without fluency.</li>
          <li>• They forget words they read earlier.</li>
          <li>• They can read words but do not understand the passage.</li>
          <li>• They feel nervous or avoid reading because of low confidence.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-emerald-100 bg-emerald-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Quick parent check at home</h2>
        <p className="text-slate-700">Ask your child to:</p>
        <ol className="mt-3 space-y-2 pl-5 text-slate-700">
          <li>1. Say the sound of a few letters.</li>
          <li>2. Blend simple words like cat, pin, sun, mat.</li>
          <li>3. Read a short sentence slowly and carefully.</li>
          <li>4. Retell one simple idea from a short passage.</li>
          <li>5. Read the same sentence again with smoother pace.</li>
        </ol>
        <p className="mt-4 text-sm text-slate-700">
          If your child struggles at step 1 or 2, phonics support may be needed.
        </p>
        <p className="mt-1 text-sm text-slate-700">
          If your child struggles at step 3, 4, or 5, reading fluency or comprehension support may be needed.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Phonics gap vs Reading fluency gap</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-lg font-semibold text-slate-900">Phonics gap</h3>
            <p className="mt-2 text-sm text-slate-700">
              The child struggles to connect sounds with letters, blend sounds, decode new words, or read simple CVC words.
            </p>
            <Link to="/phonics" className="mt-3 inline-block text-sm font-semibold underline underline-offset-2">
              Explore Online Phonics Classes
            </Link>
          </article>
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-lg font-semibold text-slate-900">Reading fluency gap</h3>
            <p className="mt-2 text-sm text-slate-700">
              The child can read some words but reads slowly, guesses often, loses meaning, avoids passages, or lacks confidence while reading.
            </p>
            <Link to="/reading-classes-for-kids" className="mt-3 inline-block text-sm font-semibold underline underline-offset-2">
              Explore Reading Classes
            </Link>
          </article>
        </div>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">How Tiny Steps helps</h2>
        <ul className="space-y-2 text-slate-700">
          <li>1. We understand the child’s age, school level, and reading concern.</li>
          <li>2. We check whether the gap is phonics, blending, fluency, comprehension, or confidence.</li>
          <li>3. We recommend the right path: phonics, reading support, or a combined plan.</li>
          <li>4. The child practises through live guided words, sentences, passages, and correction.</li>
          <li>5. Parents receive clear next-step guidance and progress updates.</li>
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
        <h2 className="text-2xl font-bold">Not sure why your child is struggling to read?</h2>
        <p className="mt-3 text-slate-200">
          Start with a free assessment. Tiny Steps will check your child&apos;s reading stage and recommend whether the right starting point is phonics, reading support, grammar, or a combined path.
        </p>
        <Link
          to="/book-demo"
          className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          Book Free Assessment
        </Link>
      </section>
      <ClusterSeoNav cluster="phonics" />
    </div>
  );
}
