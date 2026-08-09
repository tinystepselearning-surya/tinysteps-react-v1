import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { createFAQPageSchema, createHowToSchema } from '../../lib/schemas';
import parentsMeta from '../../content/parentsMeta';
import AboutAuthor from '../../components/AboutAuthor';

const progressFramework = [
  {
    title: '1. Start with a baseline',
    detail:
      'Write down what your child can do independently today. Use observable skills such as reading unfamiliar CVC words, writing a complete sentence, or answering a question in two connected sentences.',
  },
  {
    title: '2. Track one skill at a time',
    detail:
      'Choose one or two current targets from the teacher. A short list makes progress easier to see than a broad goal such as “improve English.”',
  },
  {
    title: '3. Collect real evidence',
    detail:
      'Use reading samples, short writing samples, lesson notes, speaking observations, and teacher feedback. Progress should be visible in what the child can now do with less help.',
  },
  {
    title: '4. Review and decide the next step',
    detail:
      'At each milestone, ask what is secure, what still needs prompting, and what should be taught next. The purpose of tracking is better teaching decisions, not more pressure.',
  },
];

const skillEvidence = [
  {
    skill: 'Phonics / decoding',
    weakSignal: 'Guesses unfamiliar words or waits for the adult to say them.',
    progressSignal: 'Uses taught sound patterns and blends unfamiliar words with less prompting.',
    evidence: 'Keep a small list of unfamiliar words attempted independently.',
  },
  {
    skill: 'Reading fluency',
    weakSignal: 'Stops at nearly every word and loses the meaning of the sentence.',
    progressSignal: 'Reads familiar-level text more smoothly while keeping accuracy and meaning.',
    evidence: 'Compare two short reading samples from similar-level text.',
  },
  {
    skill: 'Grammar / writing',
    weakSignal: 'Knows rules orally but repeats the same sentence errors in writing.',
    progressSignal: 'Produces clearer sentences and begins to self-correct common errors.',
    evidence: 'Save one short writing sample periodically and compare sentence control.',
  },
  {
    skill: 'Speaking',
    weakSignal: 'Relies on one-word answers, memorised lines, or adult sentence completion.',
    progressSignal: 'Answers more independently, adds details, and recovers after small mistakes.',
    evidence: 'Note the type of prompt needed rather than judging accent or personality.',
  },
];

const parentTracker = [
  'Current target: What exact skill are we practising now?',
  'Independent evidence: What can my child do without help?',
  'Prompt needed: What cue or correction is still required?',
  'Transfer check: Can my child use the skill in a new word, sentence, passage, or conversation?',
  'Next target: What should become easier before we add more difficulty?',
];

const teacherQuestions = [
  'What is the single most important skill my child is working on now?',
  'What can my child do independently that they could not do at the last review?',
  'Where is my child still depending on prompts?',
  'Can you show me one example of transfer to an unfamiliar task?',
  'What should we practise at home, and what should we avoid teaching ahead?',
  'What will count as “ready to move on” for this target?',
];

const troubleshooting = [
  {
    problem: 'The progress report says “good,” but I cannot see the difference at home',
    response:
      'Ask for skill-specific evidence. Replace broad labels with examples: words decoded independently, types of writing errors reduced, or speaking tasks completed with less prompting.',
  },
  {
    problem: 'My child performs well in class but not at home',
    response:
      'Check transfer. Use a similar but unfamiliar task at home and keep the teacher’s prompting style consistent. A learned skill should gradually work outside the exact practice material.',
  },
  {
    problem: 'Progress seems to have stopped',
    response:
      'Review the baseline and current target before adding more content. The child may need more cumulative practice, a smaller step, or a different explanation rather than a completely new programme.',
  },
  {
    problem: 'I am checking progress every day and both of us are frustrated',
    response:
      'Separate practice from measurement. Use daily practice for learning and occasional milestone checks for comparison so the child does not feel tested constantly.',
  },
];

const faqItems = [
  {
    question: 'How should parents measure progress in online English classes?',
    answer:
      'Measure observable skills, not only attendance or marks. Compare what the child can read, write, explain, or say independently at one milestone with the same type of task later.',
  },
  {
    question: 'What is better: grades or skill-based progress?',
    answer:
      'Both can be useful, but skill-based evidence is more actionable for teaching. It shows which specific behaviour has improved and what still needs instruction.',
  },
  {
    question: 'How often should I ask the teacher for a progress review?',
    answer:
      'Use natural learning milestones rather than checking after every class. Ask for a review when a stage or target set has had enough practice to judge independent performance.',
  },
  {
    question: 'What if my child improves in class but not in schoolwork?',
    answer:
      'Ask for transfer practice using unfamiliar examples and school-like tasks. If a skill only appears in rehearsed material, it may not yet be stable enough to generalise.',
  },
  {
    question: 'What should a useful progress update include?',
    answer:
      'A useful update should identify the current target, what the child can now do independently, where prompts are still needed, one example of evidence, and the next learning priority.',
  },
];

const TrackingProgress: React.FC = () => {
  useEffect(() => {
    const howToSchema = createHowToSchema(
      'How to track your child’s English learning progress',
      progressFramework.map((item) => `${item.title}: ${item.detail}`),
    );

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
        { '@type': 'ListItem', position: 2, name: 'Parents Hub', item: 'https://tinystepslearning.com/parents' },
        { '@type': 'ListItem', position: 3, name: 'Tracking Progress', item: 'https://tinystepslearning.com/parents/tracking-progress' },
      ],
    };

    applySeo({
      ...parentsMeta['/parents/tracking-progress'],
      jsonLd: [
        parentsMeta['/parents/tracking-progress'].jsonLd,
        howToSchema,
        breadcrumbSchema,
        createFAQPageSchema(faqItems),
      ],
    });
  }, []);

  return (
    <article className="mx-auto max-w-6xl px-6 py-8 md:py-12">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-sky-50 shadow-sm">
        <div className="px-6 py-8 md:px-10 md:py-12">
          <div className="inline-flex items-center rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
            Tiny Steps • Parent Progress Guide
          </div>
          <h1 className="mt-4 max-w-4xl text-3xl font-bold text-slate-900 md:text-4xl">
            How to Track Your Child’s English Learning Progress
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700 md:text-lg">
            A useful progress report should answer a simple question: <strong>what can my child do now with less help than before?</strong>
            This guide shows parents how to track phonics, reading, writing, grammar, and speaking using visible evidence instead of vague labels.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link to="/book-demo" className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              Book Free 35-Minute Demo
            </Link>
            <Link to="/parents/choosing-course" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50">
              Choose the Right Course
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold text-slate-900">The four-part progress framework</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Use the same framework whether your child is learning phonics, grammar, reading, writing, or public speaking.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {progressFramework.map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-slate-900">What evidence should you look for?</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Strong evidence is specific, repeatable, and connected to the skill being taught. It should show increasing independence, not just familiarity with one worksheet.
        </p>
        <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-900">
              <tr>
                <th className="px-4 py-3 font-semibold">Skill</th>
                <th className="px-4 py-3 font-semibold">Still needs support</th>
                <th className="px-4 py-3 font-semibold">Visible progress</th>
                <th className="px-4 py-3 font-semibold">Evidence to keep</th>
              </tr>
            </thead>
            <tbody>
              {skillEvidence.map((row) => (
                <tr key={row.skill} className="border-t border-slate-100 align-top">
                  <td className="px-4 py-4 font-semibold text-slate-900">{row.skill}</td>
                  <td className="px-4 py-4 leading-6 text-slate-700">{row.weakSignal}</td>
                  <td className="px-4 py-4 leading-6 text-slate-700">{row.progressSignal}</td>
                  <td className="px-4 py-4 leading-6 text-slate-700">{row.evidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 md:p-8">
          <h2 className="text-xl font-bold text-slate-900">A simple parent tracker</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Keep one short note at each review. You do not need a complicated spreadsheet.
          </p>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
            {parentTracker.map((item) => (
              <li key={item} className="rounded-xl border border-slate-200 bg-white px-4 py-3">{item}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white md:p-8">
          <h2 className="text-xl font-bold">Questions to ask the teacher</h2>
          <p className="mt-2 text-sm leading-6 text-slate-200">
            These questions turn a general progress conversation into a useful learning decision.
          </p>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-100">
            {teacherQuestions.map((item) => (
              <li key={item} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-12 rounded-3xl border border-amber-200 bg-amber-50 p-6 md:p-8">
        <h2 className="text-xl font-bold text-slate-900">Avoid misleading progress signals</h2>
        <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-700 md:grid-cols-2">
          <li>• Attendance alone does not prove a skill has improved.</li>
          <li>• Finishing more worksheets does not automatically mean better transfer.</li>
          <li>• Memorising one passage can look fluent without showing new-word decoding.</li>
          <li>• High marks on repeated material may not show performance on unfamiliar tasks.</li>
          <li>• A child speaking more at home may still need support transferring confidence to school.</li>
          <li>• Comparing children with each other hides the most useful comparison: the same child over time.</li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-slate-900">When progress feels unclear</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {troubleshooting.map((item) => (
            <div key={item.problem} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="font-semibold text-slate-900">{item.problem}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{item.response}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-slate-900">Frequently asked questions</h2>
        <div className="mt-5 space-y-4">
          {faqItems.map((item) => (
            <div key={item.question} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="font-semibold text-slate-900">{item.question}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-3xl bg-emerald-950 px-6 py-8 text-white md:px-8">
        <h2 className="text-2xl font-bold">Need a clear baseline before choosing a programme?</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-emerald-100 md:text-base">
          Start with an assessment, identify the child’s current independent skills, and ask for one measurable first learning target. That gives you a baseline you can actually compare later.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/book-demo" className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-emerald-950">
            Book Free Demo Assessment
          </Link>
          <Link to="/curriculum" className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white">
            View Curriculum Path
          </Link>
        </div>
      </section>

      <AboutAuthor className="mt-12" />
    </article>
  );
};

export default TrackingProgress;
