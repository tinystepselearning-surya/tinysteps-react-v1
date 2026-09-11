import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PUBLIC_SESSION_DURATION_LABEL, PUBLIC_SITE_FACTS } from '../../config/publicFacts';
import { applySeo } from '../../lib/seo';
import { createCourseSchema, createFAQPageSchema, createWebPageSchema, PUBLIC_FACTS } from '../../lib/schemas';

const canonicalPath = '/writing-classes-for-kids';
const canonicalUrl = `${PUBLIC_FACTS.primaryWebsite}${canonicalPath}`;
const demoMinutes = PUBLIC_SITE_FACTS.standardOffer.demoDurationMinutes;

const seoTitle = 'Creative Writing Classes for Kids Online | Live 1:1 | Tiny Steps';
const seoDescription =
  'Live 1:1 creative and English writing classes for kids in India and worldwide. Build ideas, paragraphs, school answers, editing skills and independent writing with personalised feedback.';

const WRITING_SEO_KEYWORDS = [
  'creative writing classes for kids online',
  'online writing classes for kids',
  'writing classes for kids',
  'English writing classes for kids',
  '1 to 1 writing classes online',
  'paragraph writing classes for kids',
  'story writing classes for kids',
  'school writing support for kids',
  'writing tutor for kids online',
  'writing improvement classes for kids',
  'creative writing tutor for kids',
  'online writing classes for kids worldwide',
];

const faqItems = [
  {
    question: 'What do online writing classes for kids improve first?',
    answer:
      'The first target depends on the child. Common starting points are complete written sentences, punctuation, idea organisation, paragraph structure, editing, and turning spoken ideas into clear written responses.',
  },
  {
    question: 'Do Tiny Steps writing classes include creative writing?',
    answer:
      'Yes. Creative writing is developed through idea generation, description, storytelling, vocabulary choice, sentence variety, paragraph organisation, and editing. The aim is independent expression, not copying a model answer.',
  },
  {
    question: 'My child knows grammar rules but cannot write clear answers. Can writing classes help?',
    answer:
      'Yes. That gap usually needs guided application rather than more rule memorisation. The child practises planning an idea, writing it, receiving feedback, editing it, and then using the same skill in a new prompt.',
  },
  {
    question: 'Are live online writing classes useful for school writing?',
    answer:
      'They can be useful when tasks resemble real school demands such as sentence answers, descriptions, paragraphs, summaries, short compositions, and editing. Progress should be checked with fresh writing samples, not only repeated worksheets.',
  },
  {
    question: 'How is a writing class different from a grammar class?',
    answer:
      'Grammar classes focus on accurate language use such as sentence structure, parts of speech, tenses, punctuation, and correction. Writing classes focus on using language to develop ideas, organise paragraphs, write creatively, revise, edit, and produce clearer longer responses. Some children need support in both areas.',
  },
  {
    question: 'Are Tiny Steps writing classes live and 1:1?',
    answer:
      `Yes. Standard Tiny Steps writing classes are live 1:1 online classes and run for ${PUBLIC_SESSION_DURATION_LABEL}, with direct teacher feedback on the child’s writing process and next improvement target.`,
  },
  {
    question: 'Can families outside India join online writing classes?',
    answer:
      'Yes. Tiny Steps supports families in India and worldwide, including NRI families and families in the UAE, United States, United Kingdom, Australia, and Singapore, subject to a compatible teacher schedule and suitable learning fit.',
  },
  {
    question: 'How can parents see whether writing is improving?',
    answer:
      'Compare similar writing tasks over time. Look for more complete ideas, clearer organisation, better word choice, fewer repeated errors, greater independence, and the child’s ability to revise and edit their own work.',
  },
  {
    question: 'What happens in the free writing assessment?',
    answer:
      `The free ${demoMinutes}-minute 1:1 online assessment helps identify whether the first priority is written sentence control, idea generation, paragraph organisation, creative writing, school-answer structure, editing, or a related grammar gap before enrolment.`,
  },
];

const skillStages = [
  {
    stage: 'Written sentence foundation',
    focus: 'Complete thoughts, capitals, punctuation, basic word order and clear written meaning.',
    sample: 'From: “Dog running.” → To: “The brown dog is running across the park.”',
  },
  {
    stage: 'Sentence development',
    focus: 'Adding useful detail with description, conjunctions, reasons, examples and varied sentence openings.',
    sample: 'From: “I like the beach.” → To: “I like the beach because I can swim and build sandcastles with my family.”',
  },
  {
    stage: 'Paragraph organisation',
    focus: 'Topic sentence, connected supporting ideas, logical order, transitions and a clear ending.',
    sample: 'Child plans three related points before writing instead of listing disconnected sentences.',
  },
  {
    stage: 'Editing and independent expression',
    focus: 'Checking clarity, tense consistency, punctuation, sentence variety, repetition and whether the response answers the prompt.',
    sample: 'Child can identify one weak sentence, improve it, and explain why the revision is clearer.',
  },
];

const lessonLoop = [
  {
    title: 'Understand the prompt',
    detail: 'Identify what the question is actually asking before the child starts writing.',
  },
  {
    title: 'Say or plan the idea first',
    detail: 'Use oral rehearsal or a short plan when needed so idea generation is separated from the mechanics of writing.',
  },
  {
    title: 'Write a first version',
    detail: 'The child writes independently enough for the teacher to see real habits rather than a copied model answer.',
  },
  {
    title: 'Receive focused feedback',
    detail: 'The teacher targets the highest-value issue instead of correcting every line at once.',
  },
  {
    title: 'Edit and transfer',
    detail: 'The child improves the response and then applies the same skill to a fresh prompt or writing task.',
  },
];

const parentChecklist = [
  'Can my child explain or plan the main idea before writing?',
  'Does each sentence express a complete thought?',
  'Are capitals and end punctuation used consistently?',
  'Do the sentences connect to the same main idea?',
  'Does the paragraph have a clear order rather than a list of unrelated sentences?',
  'Can my child improve one sentence or paragraph after feedback?',
  'Can the same skill be used in a new prompt without copying the previous answer?',
];

const progressEvidence = [
  {
    title: 'Before-and-after writing samples',
    detail: 'Save short samples from comparable prompts so improvement is visible in the child’s own work.',
  },
  {
    title: 'Repeated-error tracking',
    detail: 'Track a few recurring issues such as fragments, unclear organisation, repeated vocabulary or punctuation errors instead of counting every mistake.',
  },
  {
    title: 'Independence level',
    detail: 'Notice how much prompting is required. Progress includes needing fewer sentence starters, reminders, model answers, or adult corrections.',
  },
  {
    title: 'Transfer to school tasks',
    detail: 'Check whether the same planning, sentence and paragraph habits appear in homework, class answers, descriptions, summaries, and compositions.',
  },
];

export default function WritingClassesForKidsPage() {
  useEffect(() => {
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${PUBLIC_FACTS.primaryWebsite}/` },
        { '@type': 'ListItem', position: 2, name: 'Writing Classes for Kids', item: canonicalUrl },
      ],
    };

    const webpageSchema = {
      ...createWebPageSchema({
        name: 'Creative Writing Classes for Kids Online',
        description: seoDescription,
        url: canonicalUrl,
      }),
      '@id': `${canonicalUrl}#webpage`,
    };

    const courseSchema = createCourseSchema({
      name: 'Creative Writing Classes for Kids Online',
      description:
        'Live 1:1 online writing classes for kids focused on creative writing, idea development, paragraph organisation, school writing, editing, and independent written expression.',
      url: canonicalUrl,
      educationalLevel: 'School-age writing support; placement based on current writing control and readiness',
      teaches: [
        'creative writing',
        'idea development',
        'paragraph writing',
        'story writing',
        'school writing',
        'editing',
        'sentence variety',
        'independent written expression',
      ],
      areaServed: ['India', 'Worldwide'],
    });

    const faqSchema = {
      ...createFAQPageSchema(faqItems),
      '@id': `${canonicalUrl}#faq`,
    };

    applySeo({
      title: seoTitle,
      description: seoDescription,
      canonicalPath,
      robots: 'index,follow',
      ogType: 'website',
      keywords: WRITING_SEO_KEYWORDS,
      jsonLd: [breadcrumbSchema, webpageSchema, courseSchema, faqSchema],
    });
  }, []);

  return (
    <main className="container mx-auto max-w-6xl px-6 py-12">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-violet-50 px-6 py-10 text-center shadow-sm md:px-10 md:py-14">
        <div className="mx-auto inline-flex rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
          Tiny Steps • Live 1:1 Writing Support
        </div>
        <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-bold text-slate-900 md:text-5xl">
          Creative Writing Classes for Kids Online
        </h1>
        <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-700">
          Help your child turn ideas into engaging stories, clearer school answers, organised paragraphs, stronger descriptions, and more independent writing through live 1:1 guidance.
        </p>
        <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          Available to families in India and worldwide. Standard live 1:1 classes are {PUBLIC_SESSION_DURATION_LABEL}, and parents can start with one free {demoMinutes}-minute 1:1 online demo assessment before enrolment.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/book-demo"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-7 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            Book Free {demoMinutes}-Minute Demo
          </Link>
          <Link
            to="/pricing"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-7 py-3 font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            See Class Pricing
          </Link>
        </div>
      </section>

      <section className="mt-10 rounded-3xl border border-emerald-100 bg-emerald-50 p-6 md:p-8">
        <h2 className="text-2xl font-bold text-slate-900">What do online creative writing classes for kids teach?</h2>
        <p className="mt-3 max-w-4xl leading-7 text-slate-700">
          Writing classes give children guided practice in turning ideas into organised written language. A useful programme does more than teach grammar definitions: it helps the child understand a prompt, generate ideas, build complete written responses, add useful detail, connect ideas into paragraphs, revise weak sections, and use the same skill in an unfamiliar task. Tiny Steps uses live feedback so the teacher can see where the writing process is breaking down and target that stage directly.
        </p>
      </section>

      <section className="mt-12 rounded-3xl border border-sky-100 bg-sky-50/70 p-6 md:p-8">
        <h2 className="text-2xl font-bold text-slate-900">Grammar classes or writing classes: which does your child need?</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-semibold text-slate-900">Choose Grammar when accuracy is the main gap</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              If the child mainly struggles with parts of speech, tense control, articles, prepositions, punctuation, sentence structure, or correcting grammar errors, the dedicated Grammar programme is the better owner.
            </p>
            <Link to="/grammar" className="mt-4 inline-block text-sm font-semibold text-slate-900 underline underline-offset-2">
              Explore Online Grammar Classes for Kids
            </Link>
          </article>
          <article className="rounded-2xl border border-emerald-200 bg-white p-5">
            <h3 className="text-lg font-semibold text-slate-900">Choose Writing when expression is the main gap</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              If the child can produce basic sentences but struggles to generate ideas, organise paragraphs, write creatively, develop school answers, revise, edit, or write independently, this Writing programme is the better starting point.
            </p>
            <Link to="/book-demo" className="mt-4 inline-block text-sm font-semibold text-slate-900 underline underline-offset-2">
              Check the right starting point
            </Link>
          </article>
        </div>
        <p className="mt-4 text-sm leading-7 text-slate-700">
          Some children need both. The free assessment helps separate a grammar-accuracy gap from a broader writing-development gap before enrolment.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-3xl font-bold text-slate-900">Which writing gap does your child have?</h2>
        <p className="mt-2 max-w-3xl text-slate-600">
          Two children can both “struggle with writing” for completely different reasons. The first step is identifying the real bottleneck.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {skillStages.map((item) => (
            <article key={item.stage} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-slate-900">{item.stage}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{item.focus}</p>
              <p className="mt-4 rounded-xl bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-700"><strong>Example:</strong> {item.sample}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900">Common signs a child needs guided writing support</h2>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
            <li>• Gives good verbal answers but writes only fragments or very short responses.</li>
            <li>• Knows grammar rules in exercises but does not apply them consistently while writing.</li>
            <li>• Repeats the same sentence pattern and struggles to add useful detail.</li>
            <li>• Has ideas but cannot organise them into a logical paragraph.</li>
            <li>• Takes a long time to start because the blank page feels overwhelming.</li>
            <li>• Makes the same writing error even after it has been corrected many times.</li>
            <li>• Copies model answers successfully but struggles with a fresh prompt.</li>
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white md:p-8">
          <h2 className="text-2xl font-bold">What Tiny Steps targets</h2>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-100">
            <li>• Clear written sentences that communicate complete ideas.</li>
            <li>• Creative idea development, description, storytelling, and vocabulary choice.</li>
            <li>• Paragraph planning and connection between ideas.</li>
            <li>• Grammar applied naturally inside real writing.</li>
            <li>• Editing habits so children learn to notice and improve their own work.</li>
            <li>• Transfer into school-style answers, descriptions, summaries, and longer writing.</li>
          </ul>
        </div>
      </section>

      <section className="mt-12 rounded-3xl border border-slate-200 bg-slate-50 p-6 md:p-8">
        <h2 className="text-3xl font-bold text-slate-900">How a guided 1:1 writing lesson works</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {lessonLoop.map((item, index) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Step {index + 1}</p>
              <h3 className="mt-2 font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900">Parent checklist for a writing sample</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            You do not need to correct everything. Use a few questions to understand whether the underlying writing skill is becoming stronger.
          </p>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
            {parentChecklist.map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </div>

        <div className="rounded-3xl border border-violet-100 bg-violet-50 p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900">How to see real writing progress</h2>
          <div className="mt-5 space-y-4">
            {progressEvidence.map((item) => (
              <div key={item.title} className="rounded-xl border border-violet-100 bg-white p-4">
                <h3 className="font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-700">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-12 rounded-3xl border border-amber-200 bg-amber-50 p-6 md:p-8">
        <h2 className="text-2xl font-bold text-slate-900">Writing support should not become adult-written homework</h2>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-700">
          If an adult supplies every sentence, fixes every word before the child finishes, or provides a model that is copied exactly, the final page can look better without the child becoming a stronger writer. Good support leaves enough independent work for the teacher and parent to see what the child can really do, then uses focused feedback to improve the next attempt.
        </p>
      </section>

      <section className="mt-12 rounded-3xl border border-indigo-100 bg-indigo-50/60 p-6 md:p-8">
        <h2 className="text-2xl font-bold text-slate-900">Online writing classes for families in India and worldwide</h2>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-700">
          Tiny Steps uses the same canonical online Writing programme for families in India and internationally. NRI families and families in the UAE, United States, United Kingdom, Australia, Singapore, and other locations can enquire through the same page; teacher timings and learning fit are confirmed before enrolment.
        </p>
      </section>

      <section id="faq" className="mt-12">
        <h2 className="text-3xl font-bold text-slate-900">Frequently asked questions</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {faqItems.map((item) => (
            <article key={item.question} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="font-semibold text-slate-900">{item.question}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-3xl bg-slate-900 p-8 text-center text-white md:p-10">
        <h2 className="text-3xl font-bold">Find the writing bottleneck before choosing a learning path</h2>
        <p className="mx-auto mt-3 max-w-3xl text-slate-200">
          Book one free {demoMinutes}-minute 1:1 online demo assessment class and identify whether the first priority is written sentence control, creative idea development, paragraph structure, school-answer writing, editing, or a related grammar gap.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/book-demo" className="rounded-full bg-white px-7 py-3 font-semibold text-slate-900 transition hover:bg-slate-100">
            Book Free {demoMinutes}-Minute Demo
          </Link>
          <Link to="/pricing" className="rounded-full border border-white/20 px-7 py-3 font-semibold text-white">
            See Pricing
          </Link>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-slate-300">
          <Link to="/grammar" className="underline underline-offset-2 hover:text-white">grammar classes for kids</Link>
          <span className="hidden sm:inline text-slate-500">•</span>
          <Link to="/resources/grammar" className="underline underline-offset-2 hover:text-white">grammar & writing resources</Link>
          <span className="hidden sm:inline text-slate-500">•</span>
          <Link to="/online-english-classes-for-kids" className="underline underline-offset-2 hover:text-white">online English classes for kids</Link>
        </div>
      </section>
    </main>
  );
}
