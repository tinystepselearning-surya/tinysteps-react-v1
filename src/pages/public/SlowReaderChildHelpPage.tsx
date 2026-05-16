import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import ClusterSeoNav from '../../components/programs/ClusterSeoNav';
import { createFAQPageSchema } from '../../lib/schemas';

const faqItems = [
  {
    question: 'Why does my child read slowly?',
    answer:
      'A child may read slowly because of phonics gaps, weak blending, low reading fluency, limited vocabulary, comprehension difficulty, or low confidence while reading aloud.',
  },
  {
    question: 'Should I make my child read more books if they read slowly?',
    answer:
      'More reading can help, but only when the child has the right support. If the child struggles with sounds, blending, or fluency, guided practice is usually better than simply giving more books.',
  },
  {
    question: 'Is slow reading a phonics problem?',
    answer:
      'Sometimes. If the child struggles to decode words or blend sounds, phonics support may be needed. If the child can decode but reads word-by-word, reading fluency support may be more suitable.',
  },
  {
    question: 'Can online reading classes help a slow reader?',
    answer:
      'Yes. Online reading classes can help when the teacher identifies the child’s gap and gives guided practice with words, sentences, passages, pace, expression, and comprehension.',
  },
  {
    question: 'How do I know the right starting point?',
    answer:
      'A free assessment can help identify whether the child needs phonics, blending, reading fluency, comprehension support, or a combined learning path.',
  },
];

export default function SlowReaderChildHelpPage() {
  useEffect(() => {
    const faqSchema = {
      ...createFAQPageSchema(faqItems),
      '@id': 'https://tinystepslearning.com/slow-reader-child-help#faq',
    };

    applySeo({
      title: 'Slow Reader Child Help | Reading Support for Kids | Tiny Steps Learning',
      description:
        'Is your child reading slowly? Learn whether the gap is phonics, blending, fluency, comprehension, or confidence. Book a free reading assessment.',
      canonicalPath: '/slow-reader-child-help',
      ogType: 'website',
      jsonLd: [faqSchema],
    });
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-6 py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">Is Your Child Reading Slowly? Find the Right Support</h1>
        <p className="mt-4 text-lg text-slate-700">
          Slow reading can happen because of phonics gaps, weak blending, low fluency, poor comprehension, or low confidence. Tiny Steps helps identify the real reason and recommends the right learning path.
        </p>
        <ul className="mx-auto mt-5 grid max-w-3xl gap-2 text-left text-sm text-slate-700 sm:grid-cols-2">
          <li>• Parent-friendly reading fluency check</li>
          <li>• Phonics, blending, fluency, and comprehension support</li>
          <li>• Live teacher-guided reading practice</li>
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
            to="/reading-classes-for-kids"
            className="inline-block rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-900 transition hover:border-slate-400"
          >
            Explore Reading Classes
          </Link>
          <Link
            to="/phonics"
            className="inline-block rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-900 transition hover:border-slate-400"
          >
            Explore Phonics
          </Link>
        </div>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Why some children read slowly</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• They still sound out every letter slowly.</li>
          <li>• They know sounds but take time to blend them.</li>
          <li>• They guess words instead of reading carefully.</li>
          <li>• They stop often and lose the meaning of the sentence.</li>
          <li>• They read without expression or natural pace.</li>
          <li>• They feel nervous when asked to read aloud.</li>
          <li>• They need repeated guided reading practice.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-emerald-100 bg-emerald-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What parents can check at home</h2>
        <p className="text-slate-700">Ask your child to:</p>
        <ol className="mt-3 space-y-2 pl-5 text-slate-700">
          <li>1. Read 5 simple words.</li>
          <li>2. Read one short sentence.</li>
          <li>3. Read the same sentence again.</li>
          <li>4. Tell what the sentence means.</li>
          <li>5. Read a short passage of 3 to 4 lines.</li>
        </ol>
        <p className="mt-4 text-sm text-slate-700">
          If your child struggles to read the words, phonics or blending support may be needed.
        </p>
        <p className="mt-1 text-sm text-slate-700">
          If your child reads the words but takes too long, reading fluency support may be needed.
        </p>
        <p className="mt-1 text-sm text-slate-700">
          If your child reads but cannot explain the meaning, comprehension support may be needed.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Slow decoding vs Slow fluency</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-lg font-semibold text-slate-900">Slow decoding</h3>
            <p className="mt-2 text-sm text-slate-700">
              The child struggles to recognize sounds, blend letters, or read unfamiliar words.
            </p>
            <Link to="/phonics" className="mt-3 inline-block text-sm font-semibold underline underline-offset-2">
              Phonics support
            </Link>
          </article>
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-lg font-semibold text-slate-900">Slow fluency</h3>
            <p className="mt-2 text-sm text-slate-700">
              The child can read some words but reads word-by-word, pauses often, loses meaning, or lacks confidence.
            </p>
            <Link to="/reading-classes-for-kids" className="mt-3 inline-block text-sm font-semibold underline underline-offset-2">
              Reading fluency support
            </Link>
          </article>
        </div>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">How Tiny Steps helps slow readers</h2>
        <ul className="space-y-2 text-slate-700">
          <li>1. We check whether the child is slow because of phonics, blending, fluency, comprehension, or confidence.</li>
          <li>2. We choose the right starting point instead of giving random reading passages.</li>
          <li>3. The child practises guided words, sentences, and short passages.</li>
          <li>4. The teacher supports pace, accuracy, expression, and understanding.</li>
          <li>5. Parents receive clear feedback and next-step guidance.</li>
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
        <h2 className="text-2xl font-bold">Not sure why your child reads slowly?</h2>
        <p className="mt-3 text-slate-200">
          Start with a free assessment. Tiny Steps will check whether your child needs phonics, reading fluency, comprehension, or a combined learning path.
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
