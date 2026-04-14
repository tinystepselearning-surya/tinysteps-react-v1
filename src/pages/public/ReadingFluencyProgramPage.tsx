import { useEffect } from 'react';
import ClusterSeoNav from '../../components/programs/ClusterSeoNav';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';

const faqItems = [
  {
    question: 'What is a reading fluency program, exactly?',
    answer:
      'A reading fluency program is structured support that helps children read accurately, smoothly, and with understanding. It goes beyond basic decoding by building phrasing, pacing, and comprehension under real text load.',
  },
  {
    question: 'My child can decode words but still reads slowly. Is this the right program?',
    answer:
      'Usually yes. This program is designed for children who can read many words in isolation but struggle with flow, long pauses, or sentence-level stamina.',
  },
  {
    question: 'How is this different from basic phonics classes?',
    answer:
      'Basic phonics builds sound-to-word decoding. Fluency work builds automaticity and connected reading quality so children can read with better pace and retain meaning.',
  },
  {
    question: 'Will fluency work also help comprehension?',
    answer:
      'Yes. As decoding effort drops and phrasing improves, children can allocate more attention to meaning. We still include explicit meaning checks in fluency sessions.',
  },
  {
    question: 'When should parents seek structured fluency support?',
    answer:
      'If reading remains slow and effortful after consistent home practice, if child avoids passage reading, or if comprehension drops sharply during longer text, structured fluency support is usually appropriate.',
  },
];

export default function ReadingFluencyProgramPage() {
  useEffect(() => {
    applySeo({
      title: 'Reading Fluency Program for Kids: Pace and Comprehension Support | Tiny Steps Learning',
      description:
        'Parent guide to our reading fluency program for kids: who it helps, what it targets, weekly structure, and when to choose fluency support over decoding-only practice.',
      canonicalPath: '/reading-fluency-program',
      ogType: 'website',
    });
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-6 py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">Reading Fluency Program for Kids</h1>
        <p className="mt-4 text-lg text-slate-700">
          For children who can decode many words but still read slowly, this program builds smoother pace, stronger phrasing, and better comprehension confidence.
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
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What this program targets</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Accuracy under passage-level reading, not just isolated word drills.</li>
          <li>• Phrasing and natural grouping instead of one-word-at-a-time reading.</li>
          <li>• Reading pace that improves without sacrificing accuracy.</li>
          <li>• Comprehension checks embedded into fluency practice.</li>
          <li>• Confidence behaviors such as willingness to retry and read aloud.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Program flow (what happens week to week)</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Step 1: Baseline check for decoding stability, pace pattern, and comprehension under load.</li>
          <li>• Step 2: Targeted fluency drills on right-level passages with guided correction.</li>
          <li>• Step 3: Repeated reading and phrasing practice to build automatic flow.</li>
          <li>• Step 4: Meaning checks and short retell so speed and understanding grow together.</li>
          <li>• Step 5: Parent update with one clear home focus for the coming week.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-emerald-100 bg-emerald-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What parents can check at home this week</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Can your child read short sentence chunks smoothly, not only single words?</li>
          <li>• Does pace collapse after a few lines even when accuracy starts well?</li>
          <li>• Can your child answer one simple meaning question after each short paragraph?</li>
          <li>• Is reading resistance going up as passage length increases?</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-rose-100 bg-rose-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What to avoid while building fluency</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Do not push speed targets on text that is still too difficult.</li>
          <li>• Do not use words-per-minute as the only measure of progress.</li>
          <li>• Do not skip meaning checks while working on pace.</li>
          <li>• Do not switch reading methods every week.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-amber-100 bg-amber-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">When to choose this program</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Home routines are consistent but passage-level fluency remains weak.</li>
          <li>• Child is accurate on many words yet still too slow for school reading load.</li>
          <li>• Confidence drops during longer reading tasks.</li>
          <li>• You want guided correction plus measurable weekly fluency goals.</li>
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

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Relevant next-step links</h2>
        <ul className="space-y-2 text-slate-700">
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
            • For ABC-to-decoding gap specifically:{' '}
            <Link to="/blog/child-knows-abc-but-cannot-read" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              My Child Knows ABC but Cannot Read
            </Link>
          </li>
          <li>
            • For structured next action:{' '}
            <Link to="/phonics" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Explore Phonics Support
            </Link>
          </li>
        </ul>
      </section>

      <section className="rounded-xl bg-slate-900 p-8 text-center text-white">
        <h2 className="text-2xl font-bold">Ready for a structured fluency plan?</h2>
        <p className="mt-2 text-slate-200">Book a free assessment and get a focused reading fluency roadmap for your child.</p>
        <Link
          to="/book-demo"
          className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          Book Demo
        </Link>
      </section>
      <ClusterSeoNav cluster="phonics" />
    </div>
  );
}
