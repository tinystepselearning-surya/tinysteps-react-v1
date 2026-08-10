import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { createFAQPageSchema, createHowToSchema } from '../../lib/schemas';
import parentsMeta from '../../content/parentsMeta';
import AboutAuthor from '../../components/AboutAuthor';

const confidenceMarkers = [
  {
    title: 'Answers become longer',
    detail: 'Your child moves from one-word replies toward complete thoughts without needing every sentence supplied by an adult.',
  },
  {
    title: 'Starting becomes easier',
    detail: 'There is less freezing at the beginning of a response, even if the child still pauses or searches for words.',
  },
  {
    title: 'Voice becomes more audible',
    detail: 'Volume and clarity improve naturally as the child becomes more comfortable with familiar speaking routines.',
  },
  {
    title: 'Recovery improves',
    detail: 'A forgotten word or small grammar mistake no longer ends the whole speaking attempt; the child tries again and continues.',
  },
];

const dailyRoutine = [
  {
    step: 'Choose one safe prompt',
    detail: 'Use a familiar topic such as a favourite animal, school lunch, weekend plan, toy, book, or picture.',
  },
  {
    step: 'Give thinking time',
    detail: 'Ask the question, wait quietly, and avoid filling every silence. A short pause gives the child space to organise an answer.',
  },
  {
    step: 'Model only when needed',
    detail: 'If the child is stuck, give one starter such as “I think…” or “My favourite part was…” instead of giving the full answer.',
  },
  {
    step: 'Extend one idea',
    detail: 'Ask one gentle follow-up: “Why?”, “What happened next?”, or “Can you tell me one more thing?”',
  },
  {
    step: 'Close with specific praise',
    detail: 'Praise the speaking behaviour you want repeated: trying, using a full sentence, speaking clearly, or continuing after a mistake.',
  },
];

const parentScripts = [
  'When your child freezes: “Take your time. Start with just the first idea.”',
  'When an answer is too short: “Good start. Tell me one more thing about it.”',
  'When grammar is imperfect: “I understood your idea. Let us say that sentence once more smoothly.”',
  'When your child says “I do not know”: “Choose one: did you like it, dislike it, or feel unsure? Tell me why.”',
  'Before a presentation: “You do not need to be perfect. Your job is to share your idea clearly.”',
];

const troubleshooting = [
  {
    problem: 'My child talks freely at home but becomes silent in class',
    response:
      'Practise the same school-style response at home first: answering a question, introducing a topic, or explaining one picture. Familiar structure reduces the number of things the child must think about at once.',
  },
  {
    problem: 'My child gives only one-word answers',
    response:
      'Use sentence starters and one follow-up question. Build from “dog” to “I like dogs” to “I like dogs because they are playful.”',
  },
  {
    problem: 'My child speaks too softly or mumbles',
    response:
      'Work on one clarity target at a time. Ask for the same short sentence once in a normal home voice and once as if speaking to someone across the room.',
  },
  {
    problem: 'My child gets upset when corrected',
    response:
      'Separate communication from correction. Let the child finish the thought first, then choose only one sentence to improve together.',
  },
  {
    problem: 'My child memorises a speech but cannot answer questions',
    response:
      'Add flexible speaking: ask the child to explain the same idea in different words, answer “why” questions, and describe an unexpected picture.',
  },
];

const confidenceLadder = [
  'Level 1: answer a familiar question in one complete sentence.',
  'Level 2: add one reason or detail without being prompted word-by-word.',
  'Level 3: describe a picture or event in three connected sentences.',
  'Level 4: speak on a familiar topic and answer one follow-up question.',
  'Level 5: transfer the same skills to school, relatives, group activities, or presentations.',
];

const faqItems = [
  {
    question: 'How can I help a shy child speak more confidently?',
    answer:
      'Use predictable, low-pressure speaking routines. Start with familiar topics, allow thinking time, use sentence starters only when needed, and praise the attempt before correcting details.',
  },
  {
    question: 'Should I correct grammar while my child is speaking?',
    answer:
      'Not every sentence. Let the child complete the idea first. Then choose one useful correction and ask for a smooth retry so confidence and accuracy can grow together.',
  },
  {
    question: 'What if my child speaks at home but not at school?',
    answer:
      'Practise school-like speaking tasks at home first, such as answering a teacher question, describing a picture, or giving a short show-and-tell. If silence is persistent or causes significant distress, discuss it with the child’s school and an appropriate qualified professional rather than treating it only as a practice problem.',
  },
  {
    question: 'Are public speaking classes only for speeches and competitions?',
    answer:
      'No. For many children the first goal is everyday communication: longer answers, clearer sentences, better question responses, storytelling, and confidence speaking with unfamiliar people.',
  },
  {
    question: 'How do I know speaking confidence is improving?',
    answer:
      'Look for observable changes: longer answers, less avoidance, clearer voice, more independent sentence starts, better recovery after mistakes, and transfer into real conversations.',
  },
];

const SpeechConfidence: React.FC = () => {
  useEffect(() => {
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
        { '@type': 'ListItem', position: 2, name: 'Parents Hub', item: 'https://tinystepslearning.com/parents' },
        { '@type': 'ListItem', position: 3, name: 'Speaking Confidence', item: 'https://tinystepslearning.com/parents/speech-confidence' },
      ],
    };

    const howToSchema = createHowToSchema(
      'How to build speaking confidence at home',
      dailyRoutine.map((item) => `${item.step}: ${item.detail}`),
    );

    applySeo({
      ...parentsMeta['/parents/speech-confidence'],
      jsonLd: [
        parentsMeta['/parents/speech-confidence'].jsonLd,
        breadcrumbSchema,
        howToSchema,
        createFAQPageSchema(faqItems),
      ],
    });
  }, []);

  return (
    <article className="mx-auto max-w-6xl px-6 py-8 md:py-12">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-violet-50 via-white to-orange-50 shadow-sm">
        <div className="px-6 py-8 md:px-10 md:py-12">
          <div className="inline-flex items-center rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
            Tiny Steps • Parent Speaking Guide
          </div>
          <h1 className="mt-4 max-w-4xl text-3xl font-bold text-slate-900 md:text-4xl">
            How to Build Speaking Confidence in Children Without Adding Pressure
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700 md:text-lg">
            Speaking confidence is not only about stage performance. For many children, the first wins are simpler:
            answering in full sentences, starting without freezing, explaining an idea, and continuing after a small mistake.
            This guide gives parents a practical way to build those skills at home.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link to="/speaking" className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              Explore Speaking Classes
            </Link>
            <Link to="/book-demo" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50">
              Book Free 35-Minute Demo
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold text-slate-900">What progress actually looks like</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Do not measure confidence only by whether your child can give a long speech. Track small behaviours that show the child is becoming more willing and independent.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {confidenceMarkers.map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-3xl border border-slate-200 bg-slate-50 p-6 md:p-8">
        <h2 className="text-2xl font-bold text-slate-900">A low-pressure daily speaking routine</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Keep the structure predictable. The goal is to make speaking feel normal and repeatable, not like a test.
        </p>
        <ol className="mt-6 grid gap-4 lg:grid-cols-5">
          {dailyRoutine.map((item, index) => (
            <li key={item.step} className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Step {index + 1}</p>
              <h3 className="mt-2 text-sm font-semibold text-slate-900">{item.step}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{item.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
          <h2 className="text-xl font-bold text-slate-900">Parent scripts you can use immediately</h2>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
            {parentScripts.map((script) => (
              <li key={script} className="rounded-xl bg-violet-50 px-4 py-3">{script}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white md:p-8">
          <h2 className="text-xl font-bold">A simple confidence ladder</h2>
          <p className="mt-2 text-sm leading-6 text-slate-200">
            Move up only when the previous step feels comfortable. A child can move forward and backward depending on the setting.
          </p>
          <ol className="mt-5 space-y-3 text-sm leading-6 text-slate-100">
            {confidenceLadder.map((item) => (
              <li key={item} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">{item}</li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-slate-900">Troubleshooting common speaking problems</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {troubleshooting.map((item) => (
            <div key={item.problem} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="font-semibold text-slate-900">{item.problem}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{item.response}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-3xl border border-amber-200 bg-amber-50 p-6 md:p-8">
        <h2 className="text-xl font-bold text-slate-900">What not to do</h2>
        <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-700 md:grid-cols-2">
          <li>• Do not correct every grammar or pronunciation error while the child is trying to express an idea.</li>
          <li>• Do not compare a quiet child with a naturally talkative sibling or classmate.</li>
          <li>• Do not force long speeches before the child can answer ordinary questions comfortably.</li>
          <li>• Do not turn every conversation into a lesson; children also need relaxed, natural talk.</li>
          <li>• Do not interpret every pause as failure. Thinking time is part of communication.</li>
          <li>• Do not promise a fixed number of lessons for confidence; progress depends on the child and the setting.</li>
        </ul>
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

      <section className="mt-12 rounded-3xl bg-slate-900 px-6 py-8 text-white md:px-8">
        <h2 className="text-2xl font-bold">Need help identifying the real speaking gap?</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200 md:text-base">
          If you are unsure whether the main issue is confidence, sentence formation, vocabulary, pronunciation, or response structure, start with a live assessment and ask for one clear first target.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/book-demo" className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900">
            Book Free 35-Minute Demo
          </Link>
          <Link to="/parents/choosing-course" className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white">
            Choose the Right Course
          </Link>
        </div>
      </section>

      <AboutAuthor className="mt-12" />
    </article>
  );
};

export default SpeechConfidence;
