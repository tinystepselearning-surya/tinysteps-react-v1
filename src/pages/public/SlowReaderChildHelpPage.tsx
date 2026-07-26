import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import ClusterSeoNav from '../../components/programs/ClusterSeoNav';
import { createFAQPageSchema } from '../../lib/schemas';

const faqItems = [
  {
    question: 'Why is my child reading very slowly?',
    answer:
      'A child may read slowly because of phonics gaps, weak blending, low reading fluency, limited vocabulary, comprehension difficulty, or low confidence while reading aloud.',
  },
  {
    question: 'Is slow reading a phonics problem or a fluency problem?',
    answer:
      'It can be either. If a child cannot decode words, the gap is usually phonics or blending. If a child can decode but reads word-by-word with long pauses, the gap is usually reading fluency.',
  },
  {
    question: 'Should my child read more books or first improve blending?',
    answer:
      'Reading more helps when a child already has decoding basics. If blending is weak, improving blending first usually gives faster progress than only increasing reading quantity.',
  },
  {
    question: 'Can online reading classes help a slow reader?',
    answer:
      'Yes. Online reading classes can help when the teacher identifies the child’s gap and gives guided practice with words, sentences, passages, pace, expression, and comprehension.',
  },
  {
    question: 'How long does it take to improve reading speed?',
    answer:
      'Timelines vary by age, starting level, and consistency. Many children show early improvement in accuracy and confidence first, then build smoother pace and better comprehension through regular guided practice.',
  },
  {
    question: 'What happens in a Tiny Steps reading assessment?',
    answer:
      'Tiny Steps checks phonics foundation, blending accuracy, reading pace, fluency, comprehension, sentence formation, and communication confidence. Parents then receive a clear recommended path.',
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
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">Slow Reader Child Help: Find the Right Reading Support</h1>
        <p className="mt-4 text-lg text-slate-700">
          Slow reading can happen because of phonics gaps, weak blending, low fluency, poor comprehension, or low confidence. Tiny Steps helps identify the real reason and recommends the right learning path.
        </p>
        <ul className="mx-auto mt-5 grid max-w-3xl gap-2 text-left text-sm text-slate-700 sm:grid-cols-2">
          <li>• Parent-friendly reading fluency check</li>
          <li>• Phonics, blending, fluency, and comprehension support</li>
          <li>• Live teacher-guided reading practice</li>
          <li>• One free 35-minute 1:1 demo assessment class before course recommendation</li>
        </ul>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/book-demo"
            className="inline-block rounded-lg bg-slate-900 px-8 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            Book Free 35-Minute Demo
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
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Quick Answer for Parents</h2>
        <p className="text-slate-700">
          Slow reading is usually a skill-gap issue, not a motivation issue. The right next step is to identify whether your child needs phonics, blending, fluency, or comprehension support, then follow a stage-based reading path with guided correction.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Signs your child may be reading slowly</h2>
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

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Why slow reading happens</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Phonics foundations are incomplete, so decoding stays slow.</li>
          <li>• Blending is inconsistent, so words are read letter-by-letter.</li>
          <li>• Reading fluency is under-practised, so pace and expression stay weak.</li>
          <li>• Comprehension is overloaded by slow decoding, so meaning is missed.</li>
          <li>• Confidence drops, and children start avoiding reading practice.</li>
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
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Difference between slow reading, weak blending, weak fluency, and weak comprehension</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-lg font-semibold text-slate-900">Slow reading (overall pattern)</h3>
            <p className="mt-2 text-sm text-slate-700">
              The child reads with frequent pauses, low pace, and reduced confidence across words, sentences, and passages.
            </p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-lg font-semibold text-slate-900">Weak blending</h3>
            <p className="mt-2 text-sm text-slate-700">
              The child can identify some sounds but struggles to blend them into complete words smoothly.
            </p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-lg font-semibold text-slate-900">Weak fluency</h3>
            <p className="mt-2 text-sm text-slate-700">
              The child can read many words but still reads word-by-word, without smooth pace, rhythm, or expression.
            </p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-lg font-semibold text-slate-900">Weak comprehension</h3>
            <p className="mt-2 text-sm text-slate-700">
              The child reads text but cannot explain key meaning, retell ideas, or answer simple questions after reading.
            </p>
          </article>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold">
          <Link to="/phonics" className="underline underline-offset-2">Explore Phonics Support</Link>
          <Link to="/reading-classes-for-kids" className="underline underline-offset-2">Explore Reading Classes</Link>
          <Link to="/reading-fluency-program" className="underline underline-offset-2">Explore Reading Fluency Program</Link>
        </div>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Tiny Steps reading support approach</h2>
        <ul className="space-y-2 text-slate-700">
          <li>1. We check whether the child is slow because of phonics, blending, fluency, comprehension, or confidence.</li>
          <li>2. We choose the right starting point instead of giving random reading passages.</li>
          <li>3. The child practises guided words, sentences, and short passages.</li>
          <li>4. The teacher supports pace, accuracy, expression, and understanding.</li>
          <li>5. Parents receive clear feedback and next-step guidance.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What we check before suggesting a path</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Letter-sound and phonics foundation</li>
          <li>• Blending accuracy and decoding consistency</li>
          <li>• Sentence-level pace, expression, and fluency</li>
          <li>• Passage understanding and retelling ability</li>
          <li>• Sentence formation, communication readiness, and confidence signals</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Recommended learning path</h2>
        <p className="text-slate-700">
          phonics foundation → blending accuracy → reading fluency → comprehension → confidence
        </p>
        <p className="mt-3 text-sm text-slate-700">
          This progression helps children build lasting reading strength in the correct order rather than practicing disconnected tasks.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold">
          <Link to="/child-not-reading-properly" className="underline underline-offset-2">Read Parent Gap Guide</Link>
          <Link to="/reading-classes-for-kids" className="underline underline-offset-2">Explore Reading Classes</Link>
          <Link to="/phonics" className="underline underline-offset-2">Explore Phonics</Link>
          <Link to="/reading-fluency-program" className="underline underline-offset-2">Explore Reading Fluency Program</Link>
          <Link to="/courses" className="underline underline-offset-2">Compare All Courses</Link>
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
        <h2 className="text-2xl font-bold">Parent action: book one free 35-minute 1:1 online demo assessment class first</h2>
        <p className="mt-3 text-slate-200">
          Start with a free 35-minute 1:1 online demo assessment class. Tiny Steps will check whether your child needs phonics, reading fluency, comprehension, or a combined learning path.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/book-demo"
            className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            Book Free 35-Minute Demo
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
