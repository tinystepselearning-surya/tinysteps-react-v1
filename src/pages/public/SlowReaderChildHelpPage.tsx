import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import ClusterSeoNav from '../../components/programs/ClusterSeoNav';
import { createFAQPageSchema } from '../../lib/schemas';

const faqItems = [
  {
    question: 'Why does my child read English so slowly even when they know the words?',
    answer:
      'Recognising individual words is not the same as reading connected text smoothly. A child may still need practice in accurate decoding, automatic word recognition, phrasing, vocabulary, or understanding the passage.',
  },
  {
    question: 'Should I ask my child to read faster?',
    answer:
      'Focus first on accurate words, comfortable phrasing, expression, and understanding. Racing a timer or repeatedly demanding more speed can make reading stressful without fixing the underlying difficulty.',
  },
  {
    question: 'What can I do at home to help a slow reader?',
    answer:
      'Choose a short, manageable passage. Model one sentence, let your child read it, offer gentle correction, read it again for expression, and ask one question about its meaning. Keep practice brief and positive.',
  },
  {
    question: 'Is my child struggling with phonics or reading fluency?',
    answer:
      'If new words are frequently guessed or sound-by-sound blending breaks down, start by checking phonics and decoding. If words are mostly accurate but passages remain hesitant or word-by-word, fluency practice may be more appropriate.',
  },
  {
    question: 'Can online reading classes help a child who reads slowly?',
    answer:
      'A live teacher can observe where reading becomes effortful and guide matched word, sentence, and passage practice. Tiny Steps offers a free 35-minute 1:1 demo assessment to help recommend an educational starting point.',
  },
  {
    question: 'How quickly will my child become a fluent reader?',
    answer:
      'There is no reliable fixed timeline. Progress depends on the starting skills, text difficulty, teaching, and practice. Look for improved accuracy, reduced effort, phrasing, and understanding rather than a promised words-per-minute increase.',
  },
  {
    question: 'Does slow reading mean dyslexia?',
    answer:
      'No. Reading slowly alone does not establish dyslexia or another learning condition. If difficulties persist despite appropriate teaching, appear across languages or settings, or cause significant distress, discuss them with the school and a qualified reading or developmental professional.',
  },
];

export default function SlowReaderChildHelpPage() {
  useEffect(() => {
    const faqSchema = {
      ...createFAQPageSchema(faqItems),
      '@id': 'https://tinystepslearning.com/slow-reader-child-help#faq',
    };

    applySeo({
      title: 'Child Reads Slowly? Causes & Reading Help | Tiny Steps',
      description:
        'Why does my child read so slowly? Try a gentle at-home reading check, learn what helps word-by-word reading, and explore live support at Tiny Steps.',
      canonicalPath: '/slow-reader-child-help',
      ogType: 'website',
      jsonLd: [faqSchema],
    });
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-6 py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">Why Is My Child Reading So Slowly? A Parent Guide to Helping</h1>
        <p className="mt-4 text-lg text-slate-700">
          Some children recognise words but pause through every sentence. Others guess unfamiliar words or finish a paragraph without understanding it. Learn how to spot the difference, what to try at home, and when teacher-guided reading support can help.
        </p>
        <ul className="mx-auto mt-5 grid max-w-3xl gap-2 text-left text-sm text-slate-700 sm:grid-cols-2">
          <li>• Gentle five-minute home reading check with examples</li>
          <li>• Help for word-by-word reading and hesitant passages</li>
          <li>• Accuracy, phrasing, understanding, and confidence first</li>
          <li>• Free 35-minute 1:1 live demo assessment before a learning recommendation</li>
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
          <a
            href="#home-reading-check"
            className="inline-block rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-900 transition hover:border-slate-400"
          >
            Try the 5-Minute Reading Check
          </a>
        </div>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Quick Answer for Parents</h2>
        <p className="text-slate-700">
          Slow reading is a description, not a diagnosis. Notice whether your child struggles to work out words, reads words accurately but with effort, or reads the words without following the meaning. The best next step is different for each pattern. Reading well means <strong>accuracy, appropriate pace, expression, and understanding</strong>—not simply finishing first.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What slow or effortful reading can look like</h2>
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
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Why reading can feel difficult even when a child knows letters</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Phonics foundations are incomplete, so decoding stays slow.</li>
          <li>• Blending is inconsistent, so words are read letter-by-letter.</li>
          <li>• Words can be accurate in isolation but not yet recognised easily in a sentence.</li>
          <li>• Unfamiliar vocabulary, harder text, or limited English exposure can increase effort.</li>
          <li>• Anxiety about reading aloud or repeated correction can make practice harder.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-emerald-100 bg-emerald-50 p-6" aria-labelledby="home-reading-check">
        <h2 id="home-reading-check" className="mb-3 text-2xl font-bold text-slate-900">A gentle five-minute reading check you can try at home</h2>
        <p className="text-slate-700">
          Choose a relaxed moment. Use words and a short text that match what your child has already been taught. This is a way to observe their reading, <strong>not a formal reading test or diagnosis</strong>. Stop if your child feels upset.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-emerald-200 bg-white p-4">
            <h3 className="font-semibold text-slate-900">Early-reader example</h3>
            <p className="mt-2 text-sm text-slate-700">If these sounds have been taught, try: <strong>sat, mat, pin, sun, cup</strong>.</p>
            <p className="mt-2 text-sm text-slate-700">Then: <strong>“Sam sat on a mat.”</strong></p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-white p-4">
            <h3 className="font-semibold text-slate-900">For a child already reading sentences</h3>
            <p className="mt-2 text-sm text-slate-700">Choose three or four short lines from a familiar, level-appropriate story. Avoid giving text that is much harder than the child's current reading.</p>
            <p className="mt-2 text-sm text-slate-700">Ask: <strong>“What happened?”</strong> and <strong>“How do you know?”</strong></p>
          </div>
        </div>
        <ol className="mt-4 list-decimal space-y-2 pl-6 text-slate-700">
          <li>Invite your child to read a few familiar words and one sentence without rushing.</li>
          <li>Notice whether they work out each sound, blend correctly, guess from the first letter, or recognise words with ease.</li>
          <li>Model the sentence naturally, then let them read it again with expression.</li>
          <li>Ask one simple meaning question. Notice whether they can answer in their own words.</li>
        </ol>
        <p className="mt-4 text-sm text-slate-700">
          <strong>What the observations suggest:</strong> struggling with unfamiliar words points to decoding or blending support; accurate but choppy sentence reading suggests fluency practice; accurate reading without understanding suggests vocabulary or comprehension support. One short check cannot establish a learning difficulty.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link to="/book-demo" className="inline-flex rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800">
            Discuss Your Child's Reading in a Free Demo
          </Link>
          <Link to="/reading-fluency-program" className="font-semibold text-slate-900 underline underline-offset-2">
            Explore Fluency Support
          </Link>
        </div>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">A simple seven-minute routine for more comfortable reading</h2>
        <p className="text-slate-700">Use this as a starting point when your child is ready to practise. Short, supportive practice is more helpful than making reading a race.</p>
        <ol className="mt-4 list-decimal space-y-3 pl-6 text-slate-700">
          <li><strong>Two minutes:</strong> revisit a few words containing letter patterns your child has already learned. Help them look through the full word rather than guess.</li>
          <li><strong>Two minutes:</strong> read one short passage together. Model a sentence and offer calm, specific corrections when needed.</li>
          <li><strong>Two minutes:</strong> reread a sentence or short passage with a purpose—this time focus on phrasing, expression, or smoother word recognition.</li>
          <li><strong>One minute:</strong> ask the child to explain what happened or share a favourite part. Praise an observable success, not just speed.</li>
        </ol>
        <p className="mt-4 text-sm text-slate-700">If the text is too hard, return to easier material. When decoding itself is unreliable, prioritise sound-to-word work instead of repeated passage drills.</p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Difference between slow reading, weak blending, weak fluency, and weak comprehension</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-lg font-semibold text-slate-900">Slow reading (overall pattern)</h3>
            <p className="mt-2 text-sm text-slate-700">
              The child reads with long pauses or visible effort. This tells you what is happening, but not yet why.
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
              The child reads individual words accurately but finds it hard to group words into meaningful phrases, maintain a comfortable pace, or use expression.
            </p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-lg font-semibold text-slate-900">Weak comprehension</h3>
            <p className="mt-2 text-sm text-slate-700">
              The child may pronounce the words but struggle with vocabulary, retelling the ideas, or explaining what happened.
            </p>
          </article>
        </div>
        <p className="mt-4 text-sm leading-7 text-slate-700">
          If decoding is accurate but still slow or word-by-word, see our
          <Link to="/blog/how-to-improve-reading-fluency-in-children" className="ml-1 font-semibold underline underline-offset-2">parent guide to reading fluency</Link>.
          For a child who continues sounding out familiar words, read how
          <Link to="/blog/how-children-recognise-words-automatically-after-phonics" className="ml-1 font-semibold underline underline-offset-2">accurate decoding becomes quicker word recognition</Link>.
          If unfamiliar words are still guessed or misread, strengthen the taught phonics patterns before focusing on speed.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold">
          <Link to="/phonics" className="underline underline-offset-2">Explore Phonics Support</Link>
          <Link to="/reading-classes-for-kids" className="underline underline-offset-2">Explore Reading Classes</Link>
          <Link to="/reading-fluency-program" className="underline underline-offset-2">Explore Reading Fluency Program</Link>
        </div>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Tiny Steps reading support approach</h2>
        <ul className="space-y-2 text-slate-700">
          <li>1. In the demo, we listen to what your child can already read and where the effort begins.</li>
          <li>2. We identify a practical teaching starting point: sounds and blending, word reading, sentence fluency, or understanding.</li>
          <li>3. Lessons use matched words, sentences, short passages, and guided corrections appropriate to that starting point.</li>
          <li>4. The teacher works on accurate reading, increasingly natural phrasing, meaning, and confidence rather than speed alone.</li>
          <li>5. Parents receive feedback on observed skills and the recommended next learning step.</li>
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
          Accurate decoding and word recognition support smoother reading. Vocabulary, comprehension, and confidence are developed alongside these skills—not left until a final stage.
        </p>
        <p className="mt-3 text-sm text-slate-700">
          The starting point depends on your child. A child who guesses unfamiliar words needs a different plan from one who reads accurately but pauses at every sentence.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold">
          <Link to="/child-not-reading-properly" className="underline underline-offset-2">Read Parent Gap Guide</Link>
          <Link to="/reading-classes-for-kids" className="underline underline-offset-2">Explore Reading Classes</Link>
          <Link to="/phonics" className="underline underline-offset-2">Explore Phonics</Link>
          <Link to="/reading-fluency-program" className="underline underline-offset-2">Explore Reading Fluency Program</Link>
          <Link to="/courses" className="underline underline-offset-2">Compare All Courses</Link>
        </div>
      </section>

      <section className="mb-10 rounded-xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="mb-3 text-2xl font-bold text-slate-900">When a reading difficulty needs further evaluation</h2>
        <p className="text-slate-700">
          Slow English reading does not automatically mean a disorder. Age, the child's first language, reading instruction, and the difficulty of the text all matter. If reading remains unusually effortful despite suitable teaching and practice, or concerns occur across languages or school subjects, speak with your child's teacher and consider an evaluation by a qualified professional.
        </p>
        <p className="mt-3 text-sm text-slate-700">
          Tiny Steps provides educational reading support; a demo class is not a medical or dyslexia diagnostic assessment. If vision, hearing, speech, or developmental concerns are present, consult an appropriate healthcare professional.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-3 text-2xl font-bold text-slate-900">Evidence behind the approach</h2>
        <p className="text-slate-700">
          Reading fluency involves accuracy, ease, expression, and appropriate pacing. Guided repeated oral reading with feedback can help children develop fluent reading; the goal is to make room for understanding, not to reward speed alone. See the <a href="https://www.nichd.nih.gov/publications/pubs/nrp/findings" target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2">National Reading Panel's research summary</a> and the <a href="https://ies.ed.gov/ncee/wwc/PracticeGuide/21" target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2">What Works Clearinghouse's foundational reading guidance for Kindergarten–Grade 3</a>.
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
        <h2 className="text-2xl font-bold">Get a clearer starting point for your child's reading</h2>
        <p className="mt-3 text-slate-200">
          Tell us what you are noticing—slow word-by-word reading, guessing words, or difficulty understanding stories. In a free 35-minute live 1:1 demo assessment, we can observe relevant skills and suggest an educational starting point. There is no need to choose a course in advance.
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
