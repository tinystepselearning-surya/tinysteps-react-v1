import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import ClusterSeoNav from '../../components/programs/ClusterSeoNav';
import { applySeo } from '../../lib/seo';
import { createFAQPageSchema } from '../../lib/schemas';
import { SUMMER_CAMP_2026_ARCHIVE_LABEL } from '../../config/publicFacts';

const faqItems = [
  { question: 'What is the status of the Summer Reading Program 2026?', answer: `${SUMMER_CAMP_2026_ARCHIVE_LABEL} This URL is retained as an evergreen reading-support guide.` },
  { question: 'What should a summer reading plan focus on?', answer: 'Match the plan to the bottleneck: decoding, fluency, vocabulary, comprehension, or confidence. Use fresh reading examples to check transfer.' },
  { question: 'What if my child knows letters but cannot read words?', answer: 'Check letter-sound knowledge and blending first. Knowing alphabet names does not by itself show that the child can decode unfamiliar words.' },
  { question: 'What can families use now?', answer: 'Tiny Steps year-round phonics and reading pathways remain available, with a regular free 35-minute 1:1 assessment before placement.' },
];

export default function SummerReadingProgramKidsPage() {
  useEffect(() => {
    applySeo({
      title: 'Summer Reading Program for Kids: 2026 Archive & Reading Plan',
      description: 'Summer Reading Program 2026 has concluded. Use this evergreen guide to plan decoding, fluency, vocabulary, comprehension, and reading-confidence practice during school breaks.',
      canonicalPath: '/summer-reading-program-kids',
      ogType: 'website',
      jsonLd: [createFAQPageSchema(faqItems)],
    });
  }, []);

  return (
    <main className="container mx-auto max-w-5xl px-6 py-12">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
        {SUMMER_CAMP_2026_ARCHIVE_LABEL} This page is retained as a school-break reading-planning resource.
      </div>
      <section className="py-10">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">Summer Reading Plan for Kids: Decode, Read, Understand</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">School breaks can be useful for rebuilding reading habits, but the plan should match the child’s actual reading stage. A fluent-looking reader may need comprehension work; a hesitant reader may still need decoding or blending support.</p>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        {[
          ['Decoding check', 'Can the child read an appropriate unfamiliar word without guessing from a picture or memorised list?'],
          ['Fluency check', 'Can the child read a short passage with enough accuracy and phrasing to keep meaning available?'],
          ['Vocabulary check', 'Which words block meaning even when the child can pronounce them?'],
          ['Comprehension check', 'Can the child retell the main idea, sequence events, and answer why/how questions?'],
          ['Confidence check', 'Does the child avoid reading because the text is too difficult, correction is stressful, or previous practice has felt unsuccessful?'],
          ['Transfer check', 'Does the child use the same strategy on a new text rather than only succeeding on a practised passage?'],
        ].map(([title, text]) => (
          <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="font-bold text-slate-900">{title}</h2><p className="mt-2 leading-7 text-slate-700">{text}</p></article>
        ))}
      </section>

      <section className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 p-7">
        <h2 className="text-2xl font-bold text-slate-900">A simple school-break reading loop</h2>
        <ol className="mt-5 space-y-3 text-slate-700">
          <li><strong>1.</strong> Preview only the few words that genuinely block access to the text.</li>
          <li><strong>2.</strong> Let the child read an appropriately levelled passage.</li>
          <li><strong>3.</strong> Correct strategically: model, retry, then reread the sentence.</li>
          <li><strong>4.</strong> Ask one meaning question or short retell prompt.</li>
          <li><strong>5.</strong> Revisit the same skill in a different passage later.</li>
        </ol>
      </section>

      <section className="mt-10 rounded-3xl bg-slate-900 p-7 text-white">
        <h2 className="text-2xl font-bold">Need reading support now?</h2>
        <p className="mt-3 text-slate-200">Use the year-round reading or phonics pathway based on the child’s current bottleneck and present reading level.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/reading-classes-for-kids" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900">Reading classes</Link>
          <Link to="/phonics" className="rounded-full border border-slate-600 px-5 py-3 text-sm font-semibold text-white">Phonics pathway</Link>
          <Link to="/book-demo" className="rounded-full border border-slate-600 px-5 py-3 text-sm font-semibold text-white">Regular assessment</Link>
        </div>
      </section>

      <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-7"><h2 className="text-2xl font-bold text-slate-900">FAQs</h2><div className="mt-5 space-y-5">{faqItems.map((item) => <article key={item.question}><h3 className="font-semibold text-slate-900">{item.question}</h3><p className="mt-1 text-slate-700">{item.answer}</p></article>)}</div></section>
      <ClusterSeoNav cluster="phonics" />
    </main>
  );
}
