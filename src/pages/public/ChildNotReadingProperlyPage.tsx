import { useEffect } from 'react';
import ClusterSeoNav from '../../components/programs/ClusterSeoNav';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { createFAQPageSchema } from '../../lib/schemas';

const faqItems = [
  {
    question: 'Why does my child know letters but still not read words?',
    answer:
      'Many children know letter names but still struggle with letter sounds, blending, or decoding. Reading improves when the exact gap is identified and taught in a clear sequence.',
  },
  {
    question: 'Should I start with phonics or reading practice?',
    answer:
      'If your child cannot decode words, phonics and blending should come first. If your child can decode but reads slowly or misses meaning, focused reading fluency and comprehension practice may be the better starting point.',
  },
  {
    question: 'How do I know if my child needs reading support?',
    answer:
      'A child may need reading support if they read slowly, guess words, avoid passages, forget words quickly, or cannot explain what they read after finishing.',
  },
  {
    question: 'Can online classes help a child who is not reading properly?',
    answer:
      'Yes. Live online classes can help when the teacher identifies the child’s gap, gives guided correction, and builds skills step by step through words, sentences, passages, and comprehension tasks.',
  },
  {
    question: 'How long does reading improvement usually take?',
    answer:
      'Improvement timelines differ by age, starting level, and consistency. Many parents notice early confidence and accuracy improvements first, followed by stronger fluency and comprehension with regular guided practice.',
  },
  {
    question: 'What happens in a Tiny Steps assessment?',
    answer:
      'In the assessment, Tiny Steps checks reading stage, phonics, blending, fluency, comprehension, sentence formation, and communication confidence. Parents then receive a clear recommendation for the next learning path.',
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
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Quick Answer for Parents</h2>
        <p className="text-slate-700">
          If your child is not reading properly, the issue is usually not effort. It is usually a skill-sequencing gap in phonics, blending, reading fluency, comprehension, or confidence. The fastest progress comes from identifying the exact gap first, then following the right learning path.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Common signs parents notice</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Your child knows letters but cannot read simple words.</li>
          <li>• Your child guesses words instead of decoding carefully.</li>
          <li>• Your child reads one word at a time with long pauses.</li>
          <li>• Your child forgets words and avoids reading passages.</li>
          <li>• Your child can read but cannot explain what was read.</li>
          <li>• Your child becomes nervous or shuts down during reading.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Why children may know letters but still struggle to read</h2>
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
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Tiny Steps reading support approach</h2>
        <ul className="space-y-2 text-slate-700">
          <li>1. We understand the child’s age, school level, and reading concern.</li>
          <li>2. We identify whether the root gap is phonics, blending, fluency, comprehension, or confidence.</li>
          <li>3. We use live teacher-guided practice with correction, repetition, and stage-based progression.</li>
          <li>4. We connect reading skills with grammar, sentence formation, communication, and confidence growth.</li>
          <li>5. Parents receive clear next steps and practical home support guidance.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What we check in the assessment</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Letter-sound awareness and decoding readiness</li>
          <li>• Blending accuracy and word-reading speed</li>
          <li>• Sentence reading fluency and expression</li>
          <li>• Passage understanding and retelling</li>
          <li>• Sentence formation, communication, and confidence indicators</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Recommended learning path</h2>
        <p className="text-slate-700">
          phonics → blending → reading fluency → comprehension → confidence
        </p>
        <p className="mt-3 text-sm text-slate-700">
          This pathway helps children build reading skill in the right order instead of jumping to random worksheets or memorization.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
          <Link to="/phonics" className="underline underline-offset-2">
            Explore Phonics
          </Link>
          <Link to="/reading-classes-for-kids" className="underline underline-offset-2">
            Explore Reading Support
          </Link>
          <Link to="/courses" className="underline underline-offset-2">
            Compare All Courses
          </Link>
          <Link to="/slow-reader-child-help" className="underline underline-offset-2">
            Read Slow Reader Help
          </Link>
        </div>
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
        <h2 className="text-2xl font-bold">Parent action: start with a free assessment</h2>
        <p className="mt-3 text-slate-200">
          Start with a free assessment. Tiny Steps will check your child&apos;s reading stage and recommend whether the right starting point is phonics, reading support, grammar, or a combined path.
        </p>
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
      <ClusterSeoNav cluster="phonics" />
    </div>
  );
}
