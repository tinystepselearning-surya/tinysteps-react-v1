import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import ClusterSeoNav from '../../components/programs/ClusterSeoNav';
import { applySeo } from '../../lib/seo';
import { createFAQPageSchema } from '../../lib/schemas';
import { SUMMER_CAMP_2026_ARCHIVE_LABEL } from '../../config/publicFacts';

const faqItems = [
  { question: 'Is the Summer Speaking Camp 2026 still open?', answer: `No. ${SUMMER_CAMP_2026_ARCHIVE_LABEL} This page is retained as an evergreen communication-practice guide.` },
  { question: 'How can a school break help a shy or hesitant speaker?', answer: 'A lower-pressure period can create more opportunities for short structured answers, storytelling, description, and presentation practice without rushing the child.' },
  { question: 'What if my child gives only one-word answers?', answer: 'Start with sentence frames, wait time, and one extra-detail prompts. The aim is to build idea organisation and comfort, not force long speeches immediately.' },
  { question: 'What can families use now?', answer: 'Tiny Steps year-round speaking and grammar pathways remain available, with a regular free 35-minute 1:1 assessment before placement.' },
];

export default function SummerSpeakingCampKidsPage() {
  useEffect(() => {
    applySeo({
      title: 'Summer Speaking Camp for Kids: 2026 Archive & Speaking Plan',
      description: 'Summer Speaking Camp 2026 has concluded. Use this evergreen guide for sentence expansion, storytelling, expression, presentation structure, and speaking-confidence practice.',
      canonicalPath: '/summer-speaking-camp-kids',
      ogType: 'website',
      jsonLd: [createFAQPageSchema(faqItems)],
    });
  }, []);

  return (
    <main className="container mx-auto max-w-5xl px-6 py-12">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
        {SUMMER_CAMP_2026_ARCHIVE_LABEL} This page is a communication-practice resource, not an active summer enrollment page.
      </div>
      <section className="py-10">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">School-Break Speaking Practice: From Short Answers to Clear Expression</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">Speaking confidence grows when children repeatedly organise ideas, use complete sentences, receive supportive feedback, and try again. A school break can be useful for low-pressure practice, but confidence should be measured by independent communication rather than memorised scripts.</p>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        {[
          ['Start with comfort', 'Use familiar topics and enough wait time so the child has space to organise a response.'],
          ['Expand one step', 'Turn a one-word answer into one complete sentence, then add a reason, example, or detail.'],
          ['Build structure', 'Use simple beginning-middle-end storytelling or point-reason-example answer structures.'],
          ['Practise listening', 'Good speaking includes responding to what another person said rather than delivering only rehearsed lines.'],
          ['Use fresh prompts', 'Change the picture, topic, question, or audience so the child learns to transfer the speaking skill.'],
          ['Track observable progress', 'Notice longer independent answers, clearer organisation, fewer abandoned responses, and better recovery after a mistake.'],
        ].map(([title, text]) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="font-bold text-slate-900">{title}</h2><p className="mt-2 leading-7 text-slate-700">{text}</p></article>)}
      </section>

      <section className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 p-7">
        <h2 className="text-2xl font-bold text-slate-900">A practical speaking loop</h2>
        <ol className="mt-5 space-y-3 text-slate-700">
          <li><strong>1.</strong> Ask an open question the child can genuinely answer.</li>
          <li><strong>2.</strong> Give wait time before repeating or rephrasing.</li>
          <li><strong>3.</strong> If needed, offer a sentence starter rather than the whole answer.</li>
          <li><strong>4.</strong> Ask for one extra detail: because, for example, first/then, or how it felt.</li>
          <li><strong>5.</strong> Reuse the same structure with a new topic later.</li>
        </ol>
      </section>

      <section className="mt-10 rounded-3xl bg-slate-900 p-7 text-white">
        <h2 className="text-2xl font-bold">Need communication support now?</h2>
        <p className="mt-3 text-slate-200">The 2026 seasonal programme is closed. Use the year-round speaking or grammar pathway based on the child’s current need.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/speaking" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900">Speaking programme</Link>
          <Link to="/grammar" className="rounded-full border border-slate-600 px-5 py-3 text-sm font-semibold text-white">Grammar pathway</Link>
          <Link to="/book-demo" className="rounded-full border border-slate-600 px-5 py-3 text-sm font-semibold text-white">Regular assessment</Link>
        </div>
      </section>

      <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-7"><h2 className="text-2xl font-bold text-slate-900">FAQs</h2><div className="mt-5 space-y-5">{faqItems.map((item) => <article key={item.question}><h3 className="font-semibold text-slate-900">{item.question}</h3><p className="mt-1 text-slate-700">{item.answer}</p></article>)}</div></section>
      <ClusterSeoNav cluster="speaking" />
    </main>
  );
}
