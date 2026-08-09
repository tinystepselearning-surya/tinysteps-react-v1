import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { createFAQPageSchema } from '../../lib/schemas';
import parentsMeta from '../../content/parentsMeta';
import AboutAuthor from '../../components/AboutAuthor';

const mistakes = [
  {
    title: '1. Comparing one child with another',
    why: 'Children can be at different stages even when they are the same age. Comparison does not tell you which skill your child needs next.',
    replace: 'Compare your child with their own earlier work: fewer prompts, cleaner decoding, clearer sentences, or longer independent answers.',
  },
  {
    title: '2. Adding new content before the current skill is stable',
    why: 'A large volume of rules, words, or worksheets can hide a weak foundation. The child may complete more work without becoming more independent.',
    replace: 'Keep one or two current targets, practise them across fresh examples, and add difficulty after the child can use the skill with low prompting.',
  },
  {
    title: '3. Giving the answer too quickly',
    why: 'When adults supply the word or sentence immediately, the final task may look successful even though the child did not practise the strategy.',
    replace: 'Prompt the process first: “Show me the sounds,” “What happened first?”, or “Start with one complete sentence.” Then help only as much as needed.',
  },
  {
    title: '4. Correcting every mistake while the child is speaking or writing',
    why: 'Too many corrections at once make it difficult to focus on the highest-value change and can turn practice into constant interruption.',
    replace: 'Choose one useful correction, ask for a retry, and leave lower-priority errors for another practice round.',
  },
  {
    title: '5. Measuring activity instead of learning',
    why: 'Attendance, worksheets, chapters, and app streaks show that practice happened. They do not automatically show that a skill transferred.',
    replace: 'Use a fresh task at the same level and ask: can my child do this with less help than before?',
  },
  {
    title: '6. Changing methods every few days',
    why: 'Children need enough repeated exposure to understand a routine and apply it independently. Constantly switching prompts can make the strategy itself unclear.',
    replace: 'Keep a simple routine for long enough to judge whether it is helping, then change one element based on the child’s actual error pattern.',
  },
  {
    title: '7. Making every home interaction feel like a test',
    why: 'Home practice is most useful when the child can attempt, make a mistake, retry, and finish successfully. Constant scoring can shift attention from learning to performance.',
    replace: 'Separate practice from occasional progress checks. During practice, coach the strategy. During a review, use a short comparable task to measure independence.',
  },
];

const resetPlan = [
  'Choose one current learning goal with the teacher.',
  'Reduce practice to a short routine the family can repeat consistently.',
  'Use mostly familiar material plus one small stretch task.',
  'Prompt the strategy before giving the answer.',
  'Keep one evidence sample so progress can be compared later.',
  'Review whether the child needs less help before adding more difficulty.',
];

const faqItems = [
  {
    question: 'What is the most common mistake parents make when helping with English?',
    answer:
      'A common problem is trying to fix too many things at once. Choose one current target, use short consistent practice, and judge progress by what the child can do independently rather than by the amount of work completed.',
  },
  {
    question: 'Should I correct every reading, grammar, or speaking mistake?',
    answer:
      'No. Correct the error that is most relevant to the current learning target. Let the child finish an idea when possible, model the correction briefly, and ask for one retry.',
  },
  {
    question: 'How do I know whether my child is really progressing?',
    answer:
      'Use comparable fresh tasks and track the amount of support needed. Real progress often appears as less guessing, fewer prompts, clearer writing, better self-correction, or more independent spoken responses.',
  },
  {
    question: 'What if home practice is becoming stressful?',
    answer:
      'Reduce the load, return to easier successful examples, shorten the session, and agree on one small goal. If the same difficulty persists, ask the teacher to identify the exact skill gap instead of adding more worksheets.',
  },
  {
    question: 'Should parents teach ahead of the class?',
    answer:
      'Usually it is more useful to reinforce the current target unless the teacher recommends otherwise. Teaching several new patterns or rules ahead can make it harder to see whether the taught skill is actually secure.',
  },
];

const CommonMistakes: React.FC = () => {
  useEffect(() => {
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
        { '@type': 'ListItem', position: 2, name: 'Parents Hub', item: 'https://tinystepslearning.com/parents' },
        { '@type': 'ListItem', position: 3, name: 'Common Learning Mistakes', item: 'https://tinystepslearning.com/parents/common-mistakes' },
      ],
    };

    applySeo({
      ...parentsMeta['/parents/common-mistakes'],
      jsonLd: [parentsMeta['/parents/common-mistakes'].jsonLd, breadcrumbSchema, createFAQPageSchema(faqItems)],
    });
  }, []);

  return (
    <article className="mx-auto max-w-6xl px-6 py-8 md:py-12">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-amber-50 via-white to-sky-50 px-6 py-8 shadow-sm md:px-10 md:py-12">
        <div className="inline-flex rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
          Tiny Steps • Parent Learning Guide
        </div>
        <h1 className="mt-4 max-w-4xl text-3xl font-bold text-slate-900 md:text-4xl">
          Common Parent Mistakes That Can Slow English Learning Progress
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700 md:text-lg">
          Most home-learning problems are not caused by a lack of effort. They happen when practice becomes too broad, too corrective, or difficult to measure. This guide shows what to replace so phonics, reading, grammar, writing, and speaking practice stays useful.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/parents/getting-started" className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white">
            Start with the Parent Guide
          </Link>
          <Link to="/parents/tracking-progress" className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900">
            Learn How to Track Progress
          </Link>
        </div>
      </section>

      <section className="mt-10 rounded-3xl border border-emerald-100 bg-emerald-50 p-6 md:p-8">
        <h2 className="text-2xl font-bold text-slate-900">Quick answer: what should parents focus on?</h2>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-700 md:text-base">
          Keep the target small, let the child attempt before helping, correct one useful thing at a time, and compare the child with their own earlier work. The goal is increasing independence—not finishing the largest number of pages.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-slate-900">7 common mistakes and what to do instead</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {mistakes.map((item) => (
            <section key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700"><strong>Why it can slow progress:</strong> {item.why}</p>
              <p className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700"><strong>Do this instead:</strong> {item.replace}</p>
            </section>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 md:p-8">
          <h2 className="text-xl font-bold text-slate-900">A simple reset plan when learning feels stuck</h2>
          <ol className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
            {resetPlan.map((item, index) => (
              <li key={item} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <strong>{index + 1}.</strong> {item}
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white md:p-8">
          <h2 className="text-xl font-bold">Useful parent prompts</h2>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-100">
            <li className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">Reading: “Show me the sounds first, then blend.”</li>
            <li className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">Writing: “Say your idea first. Now write one complete sentence.”</li>
            <li className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">Speaking: “Take your time. Tell me one more detail.”</li>
            <li className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">Correction: “Good attempt. Let us improve just this one part.”</li>
            <li className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">Progress: “What can you do today that needed help last time?”</li>
          </ul>
        </div>
      </section>

      <section className="mt-12 rounded-3xl border border-amber-200 bg-amber-50 p-6 md:p-8">
        <h2 className="text-xl font-bold text-slate-900">When a parent should ask the teacher for a deeper review</h2>
        <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-700 md:grid-cols-2">
          <li>• The same sound, decoding, grammar, or sentence error continues despite consistent practice.</li>
          <li>• The child performs well only on memorised material and struggles on fresh examples.</li>
          <li>• Home practice regularly becomes conflict even after the load is reduced.</li>
          <li>• Parents cannot identify the current target or what “ready to move on” means.</li>
          <li>• The child appears to need a different level rather than simply more repetition.</li>
          <li>• Progress reports use broad labels but do not show observable skill evidence.</li>
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

      <section className="mt-12 rounded-3xl bg-emerald-950 p-6 text-white md:p-8">
        <h2 className="text-2xl font-bold">Need help identifying the first target?</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-emerald-100 md:text-base">
          Use the parent course guide or book one free 35-minute 1:1 demo assessment class to identify whether phonics, reading, grammar and writing, or speaking confidence should come first.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/parents/choosing-course" className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-emerald-950">
            Choose the Right Course
          </Link>
          <Link to="/book-demo" className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white">
            Book Free Demo Assessment
          </Link>
        </div>
      </section>

      <AboutAuthor className="mt-12" />
    </article>
  );
};

export default CommonMistakes;
