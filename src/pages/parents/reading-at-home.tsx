import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { createFAQPageSchema, createHowToSchema } from '../../lib/schemas';
import parentsMeta from '../../content/parentsMeta';
import AboutAuthor from '../../components/AboutAuthor';

const trustPoints = [
  { label: 'Suggested starting routine', value: 'About 10 minutes' },
  { label: 'Core targets', value: 'Accuracy, fluency, meaning' },
  { label: 'Best text level', value: 'Challenging but manageable' },
  { label: 'Parent role', value: 'Coach, not examiner' },
];

const readingPrinciples = [
  {
    title: 'Match the text to the skill being taught',
    detail: 'A beginner who is learning phonics needs text that allows the taught sound patterns to be used. A more fluent reader can work with richer passages and deeper meaning questions.',
    action: 'Ask the teacher what pattern or reading behaviour is the current target before choosing extra material.',
  },
  {
    title: 'Let the child attempt before you supply the word',
    detail: 'If an adult says every difficult word immediately, the page may get finished without the child practising the reading strategy.',
    action: 'Use one prompt such as “show me the sounds” or “try that part again” before giving more help.',
  },
  {
    title: 'Re-reading can make a short text easier to manage',
    detail: 'A second read of the same short passage lets the child practise accuracy and smoother phrasing without introducing a completely new decoding load.',
    action: 'Re-read only a short section and notice what becomes easier on the second attempt.',
  },
  {
    title: 'Check meaning as well as word reading',
    detail: 'Accurate word reading is important, but the child should also know who or what the passage is about and be able to explain a simple idea from it.',
    action: 'Ask one or two quick meaning questions after a short section instead of testing every line.',
  },
];

const routineCards = [
  {
    step: 'Minute 1–2',
    title: 'Warm up',
    detail: 'Review a few familiar sounds, words, or vocabulary items connected to today’s text.',
  },
  {
    step: 'Minute 3–6',
    title: 'Child reads',
    detail: 'Let the child read a short level-appropriate passage while you use limited prompts when needed.',
  },
  {
    step: 'Minute 7–8',
    title: 'Meaning check',
    detail: 'Ask one or two questions such as who, what happened, where, or why.',
  },
  {
    step: 'Minute 9–10',
    title: 'Short re-read',
    detail: 'Repeat one manageable section and notice whether the child reads it more smoothly or independently.',
  },
];

const stagePlan = [
  {
    stage: 'New decoder',
    text: 'Short decodable words and sentences built from patterns the child has already been taught.',
    sample: 'Example: “Pat sat.” or another sentence that matches the child’s current sound set.',
    parentMove: 'Track through the word, encourage blending, and avoid using the picture as the main answer cue.',
  },
  {
    stage: 'Early connected-text reader',
    text: 'Short passages that combine known phonics patterns with a small amount of new vocabulary.',
    sample: 'Use one short paragraph or several connected sentences rather than a long story that overwhelms the child.',
    parentMove: 'Support difficult words briefly, then return to the full sentence so meaning is not lost.',
  },
  {
    stage: 'Growing reader',
    text: 'Short stories or informational passages with vocabulary and comprehension discussion.',
    sample: 'Ask for the main event, one detail, and a short retell in the child’s own words.',
    parentMove: 'Shift some attention from decoding toward phrasing, vocabulary, inference, and explanation.',
  },
];

const troubleshooting = [
  {
    problem: 'My child stops at almost every difficult word',
    fix: 'The text may be too hard or the decoding pattern may not be secure. Reduce the difficulty and use one consistent prompt before supplying the word.',
  },
  {
    problem: 'My child reads the words but cannot explain the passage',
    fix: 'Shorten the amount read before the meaning check. Clarify unfamiliar vocabulary and ask one simple question after one or two sentences.',
  },
  {
    problem: 'My child avoids reading time',
    fix: 'Reduce the length, offer a choice between two similar-level texts, and finish after one successful attempt rather than extending the session into frustration.',
  },
  {
    problem: 'Reading is accurate but still slow',
    fix: 'Use a short re-read and practise phrasing on manageable text. If decoding is already secure, ask whether the next target should be fluency rather than more beginner phonics.',
  },
  {
    problem: 'My child reads in class but forgets at home',
    fix: 'Use a similar but fresh task and the same teacher prompt. Check whether the skill transfers outside the exact class material instead of assuming the child has forgotten everything.',
  },
];

const questionBank = [
  'Who or what is this part about?',
  'What happened first?',
  'Which detail was important?',
  'Why do you think that happened?',
  'Can you tell this part in your own words?',
];

const parentScripts = [
  'Before reading: “We are doing one short reading round, then we will stop.”',
  'When stuck: “Try the strategy you know before I help.”',
  'For decoding: “Show me the sounds and blend through the word.”',
  'For meaning: “What did that sentence tell us?”',
  'After practice: “I noticed you retried that word without giving up.”',
];

const progressChecklist = [
  'The child needs fewer prompts on the same level of text.',
  'Unfamiliar words are attempted with a strategy instead of immediate guessing.',
  'A second read sounds easier or more connected than the first.',
  'The child can answer simple meaning questions in their own words.',
  'The same reading skill begins to appear in a fresh passage, not only a memorised one.',
];

const faqItems = [
  {
    question: 'How long should a child read at home each day?',
    answer: 'Start with a short routine the child can complete successfully. Around 10 minutes can be a practical starting point for many families, but the right duration depends on age, attention, reading level, and the difficulty of the text.',
  },
  {
    question: 'Should I correct every reading mistake?',
    answer: 'No. Let the child attempt first and focus on the error that is most relevant to the current target. Too much interruption can make it difficult to maintain meaning and reading flow.',
  },
  {
    question: 'What should I do if the reading book is too hard?',
    answer: 'Move to a more manageable text and tell the teacher what happened. A child needs enough challenge to practise, but not so much that nearly every word requires adult help.',
  },
  {
    question: 'How can I tell whether home reading is helping?',
    answer: 'Compare similar-level tasks over time. Look for fewer prompts, better unfamiliar-word attempts, smoother re-reading, stronger meaning recall, and transfer to a fresh passage.',
  },
  {
    question: 'My child can decode but reads very slowly. Should we keep doing phonics?',
    answer: 'Some phonics review may still be useful, but if decoding is accurate the next bottleneck may be fluency. Ask the teacher to distinguish between a decoding problem and a pace or phrasing problem before adding more beginner phonics.',
  },
];

const ReadingAtHome: React.FC = () => {
  useEffect(() => {
    const howToSchema = createHowToSchema(
      'How to build a short daily reading routine at home',
      routineCards.map((card) => `${card.step}: ${card.title} - ${card.detail}`),
    );

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
        { '@type': 'ListItem', position: 2, name: 'Parents Hub', item: 'https://tinystepslearning.com/parents' },
        { '@type': 'ListItem', position: 3, name: 'Reading at Home', item: 'https://tinystepslearning.com/parents/reading-at-home' },
      ],
    };

    applySeo({
      ...parentsMeta['/parents/reading-at-home'],
      jsonLd: [howToSchema, breadcrumbSchema, createFAQPageSchema(faqItems)],
    });
  }, []);

  return (
    <article className="mx-auto max-w-6xl px-6 py-8 md:py-12">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-amber-50 via-white to-sky-50 shadow-sm">
        <div className="px-6 py-8 md:px-10 md:py-12">
          <div className="inline-flex items-center rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
            Tiny Steps • Parent Reading Guide
          </div>
          <h1 className="mt-4 text-3xl font-bold text-slate-900 md:text-4xl">Reading at Home: A Practical 10-Minute Parent Routine</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700 md:text-lg">
            Home reading works best when the text matches the child’s current stage and the adult supports the strategy without taking over. Use this routine to practise accuracy, smoother reading, and meaning in one short session.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link to="/book-demo" className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              Book Free 35-Minute Demo
            </Link>
            <Link to="/parents/choosing-course" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50">
              Choose the Right Reading Path
            </Link>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {trustPoints.map((point) => (
              <div key={point.label} className="rounded-2xl border border-white/80 bg-white/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{point.label}</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{point.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-10 rounded-3xl border border-emerald-100 bg-emerald-50 p-6 md:p-8">
        <h2 className="text-2xl font-bold text-slate-900">Quick answer: what should parents do during reading practice?</h2>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-700 md:text-base">
          Give the child a manageable text, let them attempt before helping, use one consistent prompt, ask a quick meaning question, and finish with a short re-read or success point. If nearly every word needs adult help, reduce the text difficulty rather than pushing through the page.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-slate-900">Four useful reading principles</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {readingPrinciples.map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{item.detail}</p>
              <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">Parent action: {item.action}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-slate-900">A 10-minute daily reading routine</h2>
        <p className="mt-2 text-sm text-slate-600">Use the timing as a flexible starting structure, not a test.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {routineCards.map((card) => (
            <div key={card.step} className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">{card.step}</p>
              <h3 className="mt-2 text-base font-semibold text-slate-900">{card.title}</h3>
              <p className="mt-2 text-sm text-slate-700">{card.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-slate-900">What to read at each stage</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {stagePlan.map((stage) => (
            <div key={stage.stage} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-base font-semibold text-slate-900">{stage.stage}</h3>
              <p className="mt-2 text-sm text-slate-700"><strong>Text type:</strong> {stage.text}</p>
              <p className="mt-2 text-sm text-slate-700"><strong>Example:</strong> {stage.sample}</p>
              <p className="mt-2 text-sm text-slate-700"><strong>Parent move:</strong> {stage.parentMove}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6">
          <h2 className="text-xl font-bold text-slate-900">Troubleshooting common home-reading problems</h2>
          <div className="mt-4 space-y-3">
            {troubleshooting.map((item) => (
              <div key={item.problem} className="rounded-xl border border-rose-100 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">{item.problem}</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">{item.fix}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-xl font-bold text-slate-900">Parent script bank</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700">
            {parentScripts.map((item) => <li key={item}>{item}</li>)}
          </ul>

          <h3 className="mt-6 text-base font-semibold text-slate-900">Meaning questions you can reuse</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
            {questionBank.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </section>

      <section className="mt-12 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="text-xl font-bold text-slate-900">How to see whether reading is becoming more independent</h2>
        <ul className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
          {progressChecklist.map((item) => (
            <li key={item} className="rounded-xl bg-slate-50 px-4 py-3">• {item}</li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-slate-900">Frequently asked questions</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {faqItems.map((item) => (
            <section key={item.question} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="font-semibold text-slate-900">{item.question}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{item.answer}</p>
            </section>
          ))}
        </div>
      </section>

      <AboutAuthor className="mt-12" />

      <section className="mt-12 rounded-3xl border border-slate-200 bg-slate-900 px-6 py-8 text-white md:px-8">
        <h2 className="text-2xl font-bold">Unsure whether the gap is decoding, fluency, or comprehension?</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200 md:text-base">
          Use the free 35-minute 1:1 online demo assessment class to identify the first reading priority before adding more books, worksheets, or phonics rules.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link to="/book-demo" className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
            Book Free 35-Minute Demo
          </Link>
          <Link to="/parents/tracking-progress" className="inline-flex items-center justify-center rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
            Learn How to Track Progress
          </Link>
        </div>
      </section>
    </article>
  );
};

export default ReadingAtHome;
