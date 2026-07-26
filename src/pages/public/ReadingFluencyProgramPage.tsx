import { useEffect } from 'react';
import ClusterSeoNav from '../../components/programs/ClusterSeoNav';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { createFAQPageSchema } from '../../lib/schemas';

const faqItems = [
  {
    question: 'What is reading fluency?',
    answer:
      'Reading fluency is the ability to read with accuracy, appropriate pace, natural expression, and understanding. A fluent reader does not pause at every word and can focus on meaning while reading.',
  },
  {
    question: 'Why does my child read slowly even after knowing phonics?',
    answer:
      'Even after phonics improves, some children still struggle with blending automaticity, sentence flow, or reading stamina. They may decode words correctly but not read connected text smoothly.',
  },
  {
    question: 'Should my child read more books to improve fluency?',
    answer:
      'Reading more helps only when text level and guidance are right. If a child has unresolved blending or fluency gaps, guided practice is usually more effective than only increasing reading quantity.',
  },
  {
    question: 'How do I know if the problem is fluency or comprehension?',
    answer:
      'If your child reads accurately but slowly with frequent pauses, fluency may be the main issue. If your child reads the words but cannot explain meaning, comprehension needs focused support.',
  },
  {
    question: 'Can online classes improve reading fluency?',
    answer:
      'Yes. Online classes can improve reading fluency when teachers provide right-level passages, guided correction, repeated reading routines, and meaning checks.',
  },
  {
    question: 'What happens in a Tiny Steps reading fluency assessment?',
    answer:
      'Tiny Steps checks phonics stability, blending accuracy, sentence reading pace, expression, and comprehension readiness before recommending the right fluency path.',
  },
];

export default function ReadingFluencyProgramPage() {
  useEffect(() => {
    const faqSchema = {
      ...createFAQPageSchema(faqItems),
      '@id': 'https://tinystepslearning.com/reading-fluency-program#faq',
    };

    applySeo({
      title: 'Reading Fluency Program for Kids | Tiny Steps Learning',
      description:
        'Reading fluency program for kids focused on decoding-to-fluency progression, smoother reading pace, stronger accuracy, confidence, and comprehension support.',
      canonicalPath: '/reading-fluency-program',
      ogType: 'website',
      jsonLd: [faqSchema],
    });
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-6 py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">Reading Fluency Program for Kids Who Read Slowly</h1>
        <p className="mt-4 text-lg text-slate-700">
          For children who can decode many words but still read slowly, this program builds smoother pace, stronger phrasing, and better comprehension confidence.
        </p>
        <Link
          to="/book-demo"
          className="mt-8 inline-block rounded-lg bg-slate-900 px-8 py-3 font-semibold text-white transition hover:bg-slate-800"
        >
          Book Free 35-Minute Demo
        </Link>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-2 text-lg font-bold text-slate-900">Quick Answer for Parents</h2>
        <p className="text-slate-700">
          This reading fluency program is for children whose reading is accurate but not yet automatic. We focus on sentence flow, pacing, expression, and meaning so reading becomes smoother and less tiring.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Who this program is for</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Child can decode many words but reads in a choppy, word-by-word style.</li>
          <li>• Child pauses often and loses flow in connected text.</li>
          <li>• Child can finish short passages but comprehension drops as length increases.</li>
          <li>• Child avoids reading aloud because it feels effortful.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Common signs of weak reading fluency</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Word-by-word reading even when many words are known.</li>
          <li>• Frequent pauses that break sentence meaning.</li>
          <li>• Slow pace that increases reading fatigue.</li>
          <li>• Flat expression and weak phrasing during read-aloud.</li>
          <li>• Accuracy drops or comprehension drops in longer passages.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Difference between reading accuracy, reading speed, expression, and comprehension</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-lg font-semibold text-slate-900">Reading accuracy</h3>
            <p className="mt-2 text-sm text-slate-700">How correctly a child reads words.</p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-lg font-semibold text-slate-900">Reading speed</h3>
            <p className="mt-2 text-sm text-slate-700">How smoothly and efficiently a child reads connected text.</p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-lg font-semibold text-slate-900">Expression</h3>
            <p className="mt-2 text-sm text-slate-700">How naturally the child uses phrasing, pauses, and voice while reading.</p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-lg font-semibold text-slate-900">Comprehension</h3>
            <p className="mt-2 text-sm text-slate-700">How well the child understands and explains what was read.</p>
          </article>
        </div>
      </section>

      <section className="mb-10 rounded-xl border border-rose-100 bg-rose-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Why fluency cannot be fixed by “just reading more” for every child</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Some children are reading text above their current decoding or blending stability.</li>
          <li>• Repetition without guided correction can reinforce weak reading habits.</li>
          <li>• Speed-only focus can reduce meaning and confidence.</li>
          <li>• Fluency grows faster with structured passage practice, phrasing work, and meaning checks.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Tiny Steps reading fluency approach</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Step 1: Baseline check for decoding stability, pace pattern, and comprehension under load.</li>
          <li>• Step 2: Targeted fluency drills on right-level passages with guided correction.</li>
          <li>• Step 3: Repeated reading and phrasing practice to build automatic flow.</li>
          <li>• Step 4: Meaning checks and short retell so speed and understanding grow together.</li>
          <li>• Step 5: Parent update with one clear home focus for the coming week.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-emerald-100 bg-emerald-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What we check before suggesting a fluency path</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Phonics and decoding stability</li>
          <li>• Blending accuracy at word and sentence level</li>
          <li>• Passage reading pace and expression quality</li>
          <li>• Comprehension and retell consistency after reading</li>
          <li>• Reading confidence and response under guided practice</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Recommended learning path</h2>
        <p className="text-slate-700">
          phonics gaps → blending accuracy → sentence reading → fluency → comprehension → confidence
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

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Relevant next-step links</h2>
        <ul className="space-y-2 text-slate-700">
          <li>
            • For full reading support pathways:{' '}
            <Link to="/reading-classes-for-kids" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Reading Classes for Kids
            </Link>
          </li>
          <li>
            • For pace-diagnostic self-checks:{' '}
            <Link to="/slow-reader-child-help" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Slow Reader Child Help
            </Link>
          </li>
          <li>
            • For broad reading-issue diagnosis:{' '}
            <Link to="/child-not-reading-properly" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Child Not Reading Properly
            </Link>
          </li>
          <li>
            • For structured next action:{' '}
            <Link to="/phonics" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Explore Phonics Support
            </Link>
          </li>
          <li>
            • For comparing all learning pathways:{' '}
            <Link to="/courses" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Explore Courses
            </Link>
          </li>
          <li>
            • For immediate assessment booking:{' '}
            <Link to="/book-demo" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Book Free 35-Minute Demo
            </Link>
          </li>
        </ul>
      </section>

      <section className="rounded-xl bg-slate-900 p-8 text-center text-white">
        <h2 className="text-2xl font-bold">Parent action: book one free 35-minute 1:1 online demo assessment class first</h2>
        <p className="mt-2 text-slate-200">Book one free 35-minute 1:1 online demo assessment class and get a focused reading fluency roadmap for your child.</p>
        <Link
          to="/book-demo"
          className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          Book Free 35-Minute Demo
        </Link>
      </section>
      <ClusterSeoNav cluster="phonics" />
    </div>
  );
}
