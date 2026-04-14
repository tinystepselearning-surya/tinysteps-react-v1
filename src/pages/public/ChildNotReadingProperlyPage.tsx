import { useEffect } from 'react';
import ClusterSeoNav from '../../components/programs/ClusterSeoNav';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';

const faqItems = [
  {
    question: 'What does “my child is not reading properly” usually mean?',
    answer:
      'It usually means one or more reading foundations are not stable yet: sound knowledge, blending, decoding habits, fluency, comprehension, or confidence. The key is to find the exact weak point first instead of treating all reading tasks the same way.',
  },
  {
    question: 'My child knows some words but still struggles with books. Is that normal?',
    answer:
      'Yes, this is common. Children can read familiar words but still struggle with new words, sentence flow, or understanding. That usually means decoding or fluency has not become automatic yet.',
  },
  {
    question: 'How do I know if this is an ABC/phonics issue or a pace issue?',
    answer:
      'If your child knows letter names but cannot sound and blend unfamiliar short words, start with the ABC-to-decoding pathway. If words are mostly accurate but very slow with long pauses, focus on pace and fluency support.',
  },
  {
    question: 'When should I seek structured reading support?',
    answer:
      'Seek structured support when your child continues guessing, cannot blend basic words, avoids reading regularly, or shows limited progress after 6-8 weeks of consistent focused practice.',
  },
  {
    question: 'Can confidence improve even if reading is currently weak?',
    answer:
      'Yes. Confidence usually improves when tasks are level-appropriate, sessions are short and consistent, and correction is calm and specific.',
  },
  {
    question: 'Which page should I use first: broad reading help, ABC issue, or slow-reader help?',
    answer:
      'Use this page first if you are unsure where the breakdown is. If the issue is mainly letter-name to decoding transfer, go to the ABC page. If the issue is mainly pace and choppy flow, go to slow-reader help.',
  },
];

export default function ChildNotReadingProperlyPage() {
  useEffect(() => {
    applySeo({
      title: 'Child Not Reading Properly? Parent Diagnostic Guide | Tiny Steps Learning',
      description:
        'A practical parent diagnostic guide for children not reading properly: identify likely causes, run simple home checks, and choose the right next support step.',
      canonicalPath: '/child-not-reading-properly',
      ogType: 'website',
    });
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-6 py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">Child Not Reading Properly? Start With a Clear Parent Diagnosis</h1>
        <p className="mt-4 text-lg text-slate-700">
          If reading feels inconsistent, this page helps you identify where it is breaking down first, then choose the right next step without guesswork.
        </p>
        <Link
          to="/book-demo"
          className="mt-8 inline-block rounded-lg bg-slate-900 px-8 py-3 font-semibold text-white transition hover:bg-slate-800"
        >
          Book Free Assessment Class
        </Link>
        <p className="mt-2 text-sm text-slate-600">Takes 30 seconds • No commitment</p>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-2 text-lg font-bold text-slate-900">Quick answer</h2>
        <p className="text-slate-700">
          “Not reading properly” is an umbrella parent concern, not a single diagnosis. Reading may be breaking at sound knowledge, blending, word accuracy, pace, comprehension, or confidence.
          The fastest path is to identify the weakest stage first, then apply targeted support to that stage only.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-indigo-100 bg-indigo-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Use this page as your triage start point</h2>
        <ul className="space-y-2 text-slate-700">
          <li>
            • If your child knows letter names but cannot decode unfamiliar short words, go to{' '}
            <Link to="/blog/child-knows-abc-but-cannot-read" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              My Child Knows ABC but Cannot Read
            </Link>
            .
          </li>
          <li>
            • If words are mostly accurate but reading pace is very slow and choppy, go to{' '}
            <Link to="/slow-reader-child-help" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Slow Reader Child Help
            </Link>
            .
          </li>
          <li>
            • If you already know fluency is the core issue and want structured delivery details, go to{' '}
            <Link to="/reading-fluency-program" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Reading Fluency Program
            </Link>
            .
          </li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What “not reading properly” can mean</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Weak sound knowledge: your child knows some letters but cannot reliably produce sounds.</li>
          <li>• Blending failure: your child can say sounds separately but cannot join them into a word.</li>
          <li>• Guessing habits: your child guesses from pictures, context, or first letters.</li>
          <li>• Poor fluency: word reading is accurate but very slow, effortful, and choppy.</li>
          <li>• Low comprehension: words are read aloud but meaning is not retained.</li>
          <li>• Confidence and avoidance: your child resists reading because it feels risky or tiring.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Parent symptom map</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Child behavior: says letter names but not sounds. What it may mean: sound mapping is weak. Next step: run daily lowercase sound recall before book reading.</li>
          <li>• Child behavior: says sounds but cannot blend. What it may mean: sequencing is weak. Next step: do short oral blending drills, then print blending.</li>
          <li>• Child behavior: guesses from picture or first letter. What it may mean: decoding habit is unstable. Next step: use controlled decodable text and insist on full left-to-right reading.</li>
          <li>• Child behavior: reads accurately but very slowly. What it may mean: fluency is not automatic yet. Next step: repeated short passage reading with gentle pacing support.</li>
          <li>• Child behavior: reads words but cannot tell meaning. What it may mean: comprehension monitoring is weak. Next step: ask one meaning question after each sentence.</li>
          <li>• Child behavior: avoids reading or gets upset quickly. What it may mean: confidence load is high. Next step: shorten sessions, lower difficulty, and end with one success.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What to check at home this week</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Sounds: test 8-10 lowercase letters and ask for sounds, not names.</li>
          <li>• Blending: give 4-5 oral blends and 4-5 printed CVC words.</li>
          <li>• Short reading: ask your child to read 3-5 decodable sentences without picture guessing.</li>
          <li>• Comprehension: ask one simple who/what/where question after each short sentence or line.</li>
          <li>• Confidence behavior: observe avoidance, frustration, and willingness to retry after correction.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What each result suggests</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Sounds low, blending low: start with sound-to-symbol basics before longer text.</li>
          <li>• Sounds good, blending low: focus practice on blending routines and word joining.</li>
          <li>• Word accuracy low with guessing: reduce level and switch to decodable material only for practice time.</li>
          <li>• Word accuracy good, pace low: move to fluency-focused support and repeated short reading.</li>
          <li>• Word reading good, comprehension low: add meaning questions and retell after every short passage.</li>
          <li>• Skills present but avoidance high: prioritize confidence routines and lower daily reading pressure.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-emerald-100 bg-emerald-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What to start doing this week</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Keep one daily 10-minute routine: quick review, focused practice, short reading, one reflection.</li>
          <li>• Teach only at the current weak point instead of mixing many goals in one session.</li>
          <li>• Track one metric per week: guessing frequency, blending success, pace stability, or comprehension response.</li>
          <li>• Use calm correction language: “Let&apos;s try slowly, then fast.”</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-rose-100 bg-rose-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What to stop doing</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Do not jump between random methods every few days.</li>
          <li>• Do not move to harder books before current-level decoding is stable.</li>
          <li>• Do not treat speed alone as success if accuracy and understanding are weak.</li>
          <li>• Do not turn every reading session into a long correction cycle.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-amber-100 bg-amber-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">When to get extra help</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• No clear progress after 6-8 weeks of consistent, focused home support.</li>
          <li>• Persistent guessing or inability to blend even short words.</li>
          <li>• Reading anxiety or avoidance is increasing, not improving.</li>
          <li>• Teachers report a widening gap between classroom expectations and reading performance.</li>
        </ul>
        <p className="mt-4 text-sm text-slate-700">
          If you want a structured next step, explore{' '}
          <Link to="/phonics" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            phonics support
          </Link>{' '}
          or book a guided assessment.
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
            • If the issue is mainly letter names vs real decoding:{' '}
            <Link to="/blog/child-knows-abc-but-cannot-read" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              My Child Knows ABC but Cannot Read
            </Link>
          </li>
          <li>
            • If the issue is mainly reading pace and choppy flow:{' '}
            <Link to="/slow-reader-child-help" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Slow Reader Child Help
            </Link>
          </li>
          <li>
            • If you want a structured guided path:{' '}
            <Link to="/phonics" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Explore Phonics Support
            </Link>
          </li>
          <li>
            • If you need a fluency-focused program overview:{' '}
            <Link to="/reading-fluency-program" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Reading Fluency Program
            </Link>
          </li>
        </ul>
      </section>

      <section className="rounded-xl bg-slate-900 p-8 text-center text-white">
        <p className="mb-3 text-sm text-slate-300">If your child is facing this, the next step is simple:</p>
        <h2 className="text-2xl font-bold">Want practical help for your child&apos;s reading progress?</h2>
        <p className="mt-2 text-slate-200">Book a free assessment and get a focused support plan.</p>
        <Link
          to="/book-demo"
          className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          Book Free Assessment Class
        </Link>
        <p className="mt-2 text-sm text-slate-300">Takes 30 seconds • No commitment</p>
      </section>
      <ClusterSeoNav cluster="phonics" />
    </div>
  );
}
