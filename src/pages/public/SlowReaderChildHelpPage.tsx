import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import ClusterSeoNav from '../../components/programs/ClusterSeoNav';

const faqItems = [
  {
    question: 'My child reads correctly but very slowly. Is that a problem?',
    answer:
      'It can be. Slow, effortful reading often means fluency is not automatic yet. Children spend so much energy decoding that understanding and confidence drop.',
  },
  {
    question: 'How do I know if this is fluency or a basic decoding gap?',
    answer:
      'If your child cannot reliably sound and blend short unfamiliar words, start with decoding foundations first. If word accuracy is mostly stable but pace is very choppy, focus on fluency routines.',
  },
  {
    question: 'Should I push speed drills every day?',
    answer:
      'No. Build fluency through accurate repeated reading, phrasing practice, and short comprehension checks. Speed without accuracy and meaning is not real progress.',
  },
  {
    question: 'How long before fluency usually improves?',
    answer:
      'Many families notice smoother flow within a few weeks when practice is consistent, text level is appropriate, and correction is calm and specific.',
  },
  {
    question: 'When should I seek structured help for slow reading?',
    answer:
      'Seek structured support if pace remains very slow after 6-8 weeks of focused practice, if frustration keeps increasing, or if comprehension drops sharply during longer reading.',
  },
];

export default function SlowReaderChildHelpPage() {
  useEffect(() => {
    applySeo({
      title: 'Slow Reader Child Help: Parent Fluency Guide | Tiny Steps Learning',
      description:
        'Practical slow reader child help for parents: identify why pace is breaking, run at-home fluency checks, and choose the right next support step.',
      canonicalPath: '/slow-reader-child-help',
      ogType: 'website',
    });
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-6 py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">Slow Reader Child Help: A Practical Parent Fluency Guide</h1>
        <p className="mt-4 text-lg text-slate-700">
          If your child reads word-by-word with long pauses, this page helps you diagnose pace and fluency breakdowns and choose the right next steps.
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
          Slow reading usually means reading is accurate but not yet automatic. Children pause too often, lose phrasing, and spend too much effort on each word. The goal is not just faster reading; it is smoother, accurate reading with understanding.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Why slow reading happens</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Decoding is still effortful, so each word takes too long.</li>
          <li>• Blending is accurate but not automatic yet.</li>
          <li>• Child reads one word at a time instead of reading in phrases.</li>
          <li>• Over-correction or difficult text makes reading tense and hesitant.</li>
          <li>• Meaning drops because all attention goes into sounding out words.</li>
          <li>• Confidence falls, and child starts avoiding longer passages.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Parent symptom map for pace and fluency</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Child behavior: accurate on short words but very slow on sentences. What it may mean: decoding load is still high. Next step: repeated short sentence reading at the same level.</li>
          <li>• Child behavior: reads flat, one-word-at-a-time. What it may mean: phrasing is weak. Next step: model phrase chunks and echo reading.</li>
          <li>• Child behavior: starts okay, then pace collapses after a few lines. What it may mean: stamina is low. Next step: 3 short passages instead of one long passage.</li>
          <li>• Child behavior: rereads many words even when correct. What it may mean: confidence monitoring is high-anxiety. Next step: reduce correction frequency and praise smooth reading attempts.</li>
          <li>• Child behavior: reads words but cannot explain passage. What it may mean: fluency is consuming attention. Next step: short comprehension check after each small chunk.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What to check at home this week</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Word-level pace: read a short familiar word list and note long hesitation points.</li>
          <li>• Phrase reading: check if your child can read 4-6 word chunks smoothly, not one word at a time.</li>
          <li>• Passage flow: use one short decodable passage and track pauses, restarts, and loss of place.</li>
          <li>• Comprehension under load: ask one question after each short paragraph, not only at the end.</li>
          <li>• Confidence behavior: observe body language, refusal, and willingness to retry.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What each result suggests</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Accuracy low and pace low: rebuild decoding first, then fluency.</li>
          <li>• Accuracy stable but pace low: prioritize repeated reading and phrase-level practice.</li>
          <li>• Pace improves in short text only: build stamina gradually with controlled passage length.</li>
          <li>• Pace improves but comprehension stays weak: add frequent meaning checks and short retell.</li>
          <li>• Technical skills present but avoidance high: reduce pressure and raise early success rate.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-emerald-100 bg-emerald-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What to start doing</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Run one 10-12 minute fluency routine daily: warm-up, repeated short reading, one comprehension check.</li>
          <li>• Keep text level slightly below frustration level for flow-building days.</li>
          <li>• Use echo reading and phrase marking to model natural pacing.</li>
          <li>• Track one weekly metric: pauses per passage, smooth phrase count, or comprehension response quality.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-rose-100 bg-rose-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What to avoid</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Do not force faster reading on text that is still too difficult.</li>
          <li>• Do not chase words-per-minute as the only success measure.</li>
          <li>• Do not correct every tiny error in real time and break flow constantly.</li>
          <li>• Do not skip comprehension checks while working on pace.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-amber-100 bg-amber-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">When to seek structured fluency help</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Slow, choppy reading persists despite consistent home fluency routines for 6-8 weeks.</li>
          <li>• Child can decode short words but breaks down on connected text repeatedly.</li>
          <li>• Reading stress is increasing and school reading demands are rising.</li>
          <li>• Comprehension continues to fall whenever passage length increases.</li>
        </ul>
        <p className="mt-4 text-sm text-slate-700">
          If you want a guided next step, explore{' '}
          <Link to="/phonics" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            structured phonics and reading support
          </Link>
          .
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
            • For broad multi-cause diagnosis:{' '}
            <Link to="/child-not-reading-properly" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Child Not Reading Properly Guide
            </Link>
          </li>
          <li>
            • For letter-name to decoding breakdown:{' '}
            <Link to="/blog/child-knows-abc-but-cannot-read" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              My Child Knows ABC but Cannot Read
            </Link>
          </li>
          <li>
            • For confidence-focused reading routines:{' '}
            <Link to="/blog/how-phonics-builds-reading-confidence" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              How Phonics Builds Reading Confidence
            </Link>
          </li>
          <li>
            • For program-level next action:{' '}
            <Link to="/phonics" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Explore Phonics Support
            </Link>
          </li>
        </ul>
      </section>

      <section className="rounded-xl bg-slate-900 p-8 text-center text-white">
        <h2 className="text-2xl font-bold">Need a practical plan for slow reading pace?</h2>
        <p className="mt-2 text-slate-200">Book a free assessment and get a focused fluency improvement plan.</p>
        <Link
          to="/book-demo"
          className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          Book Free Assessment Class
        </Link>
      </section>

      <ClusterSeoNav cluster="phonics" />
    </div>
  );
}
