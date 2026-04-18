import { useEffect } from 'react';
import ClusterSeoNav from '../../components/programs/ClusterSeoNav';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';

const faqItems = [
  {
    question: 'My child talks at home but goes silent in class. Is this common?',
    answer:
      'Yes, this is very common. Many children are verbally capable in safe settings but shut down in performance or peer settings. This is usually a confidence-transfer issue, not a language deficit.',
  },
  {
    question: 'What helps a shy child speak with confidence without pressure?',
    answer:
      'Use low-pressure speaking ladders: one-word answer, short sentence, two-sentence response, then short share. Predictable routines and calm feedback build confidence faster than forcing longer speaking tasks.',
  },
  {
    question: 'Should I push my child to speak more in front of everyone?',
    answer:
      'Not at the start. Forced public speaking can increase avoidance. Build success in smaller audiences first, then gradually increase challenge.',
  },
  {
    question: 'How do I know if my child needs structured speaking support?',
    answer:
      'If school participation remains very low, speaking avoidance is increasing, or your child cannot move beyond very short responses despite consistent home support, structured guidance is usually helpful.',
  },
  {
    question: 'Will confidence support also improve vocabulary and sentence quality?',
    answer:
      'Yes. As hesitation drops, children use longer responses and clearer sentence structure more consistently. Confidence and language quality often improve together.',
  },
];

export default function ShyChildSpeakingConfidencePage() {
  useEffect(() => {
    applySeo({
      title: 'Shy Child Speaking Confidence: Parent Support Guide | Tiny Steps Learning',
      description:
        'Practical support for shy child speaking confidence: identify hesitation patterns, use low-pressure speaking ladders, and build classroom participation step by step.',
      canonicalPath: '/shy-child-speaking-confidence',
      ogType: 'website',
    });
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-6 py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">Shy Child Speaking Confidence: A Practical Parent Guide</h1>
        <p className="mt-4 text-lg text-slate-700">
          If your child understands well but hesitates to speak, this page helps you diagnose why and build confidence safely in small, consistent steps.
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
          Shy speaking usually means confidence is context-dependent: your child may speak in safe spaces but freeze in groups, class settings, or performance moments. The right approach is gradual exposure with sentence support, not pressure.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What shy speaking can look like</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Speaks comfortably at home but gives one-word answers in class.</li>
          <li>• Knows the answer but avoids eye contact and stays silent.</li>
          <li>• Needs repeated prompting before speaking aloud.</li>
          <li>• Voice gets very soft during group sharing or presentations.</li>
          <li>• Becomes anxious before speaking tasks despite preparation.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Parent symptom map (shy speaking edition)</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Child behavior: whispers or avoids eye contact. What it may mean: social-performance stress is high. Next step: begin with 1:1 speaking rounds.</li>
          <li>• Child behavior: says “I know” but will not answer. What it may mean: fear of mistakes. Next step: use sentence starters and praise attempt, not perfection.</li>
          <li>• Child behavior: freezes in groups only. What it may mean: audience size is the trigger. Next step: move from one trusted listener to small-group speaking.</li>
          <li>• Child behavior: gives very short replies. What it may mean: response planning confidence is weak. Next step: use 2-part response frames (answer + one reason).</li>
          <li>• Child behavior: avoids speaking tasks repeatedly. What it may mean: confidence cycle is shrinking. Next step: create daily micro-success speaking goals.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What to check at home this week</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Response length: does your child stay at one word or expand to full sentences?</li>
          <li>• Audience comfort: can your child speak with one adult, two people, then a small group?</li>
          <li>• Voice clarity: is volume steady or does it drop under pressure?</li>
          <li>• Recovery behavior: after a mistake, does your child retry or shut down?</li>
          <li>• Participation pattern: is speaking getting easier across the week or harder?</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What each result suggests</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Home speaking strong, class speaking weak: focus on confidence transfer routines.</li>
          <li>• One-word replies only: build sentence frames before open-ended speaking.</li>
          <li>• Good language, low volume: focus on voice projection practice and confidence cues.</li>
          <li>• Frequent freeze after errors: reduce correction intensity and add retry routines.</li>
          <li>• Avoidance increasing: move to structured guided speaking support.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-emerald-100 bg-emerald-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What to start doing</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Use a daily 8-10 minute speaking ladder: one-word answer -&gt; short sentence -&gt; two-sentence share.</li>
          <li>• Give sentence starters like “I think… because…” or “My idea is…”.</li>
          <li>• Keep speaking topics familiar first, then introduce new topics gradually.</li>
          <li>• End each session with one clear speaking win your child can repeat tomorrow.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-rose-100 bg-rose-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What to avoid</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Do not label your child as “not a speaker” or compare with louder peers.</li>
          <li>• Do not force sudden public performance without smaller preparation steps.</li>
          <li>• Do not over-correct every sentence while confidence is still fragile.</li>
          <li>• Do not switch between too many speaking methods every week.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-amber-100 bg-amber-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">When to seek structured speaking help</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Child participation remains minimal despite consistent home speaking routines.</li>
          <li>• Speaking anxiety is increasing before school presentations or class responses.</li>
          <li>• Child cannot move beyond very short answers in academic settings.</li>
          <li>• You need a guided confidence progression with measurable milestones.</li>
        </ul>
        <p className="mt-4 text-sm text-slate-700">
          If you want a structured next step, explore{' '}
          <Link to="/speaking" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            speaking support
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
            • For broader speaking-confidence program fit:{' '}
            <Link to="/confidence-building-program-kids" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Confidence Building Program for Kids
            </Link>
          </li>
          <li>
            • For structured speaking coaching:{' '}
            <Link to="/speaking" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Public Speaking Classes for Kids
            </Link>
          </li>
          <li>
            • For conversational fluency support:{' '}
            <Link to="/spoken-english-classes-for-kids" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Communication Classes for Kids
            </Link>
          </li>
        </ul>
      </section>

      <section className="rounded-xl bg-slate-900 p-8 text-center text-white">
        <h2 className="text-2xl font-bold">Want a calm plan for your shy child’s speaking confidence?</h2>
        <p className="mt-2 text-slate-200">Book a free assessment and get a step-by-step confidence roadmap.</p>
        <Link
          to="/book-demo"
          className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          Book Demo
        </Link>
      </section>
      <ClusterSeoNav cluster="speaking" />
    </div>
  );
}
