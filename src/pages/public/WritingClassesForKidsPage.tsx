import { useEffect } from 'react';
import ClusterSeoNav from '../../components/programs/ClusterSeoNav';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { createFAQPageSchema } from '../../lib/schemas';

const faqItems = [
  {
    question: 'What do online writing classes for kids improve first?',
    answer:
      'The first target depends on the child. Common starting points are complete sentence formation, punctuation, tense control, idea organisation, and turning spoken answers into clear written responses.',
  },
  {
    question: 'My child knows grammar rules but cannot write clear answers. Can this help?',
    answer:
      'Yes. That gap usually needs guided application rather than more rule memorisation. The child practises planning an idea, writing it, receiving feedback, editing it, and then using the same skill in a new prompt.',
  },
  {
    question: 'Are live online writing classes useful for school writing?',
    answer:
      'They can be useful when tasks resemble real school demands such as sentence answers, descriptions, paragraphs, summaries, and editing. Progress should be checked with fresh writing samples, not only repeated worksheets.',
  },
  {
    question: 'How is a writing class different from a grammar class?',
    answer:
      'Grammar teaches how language works. Writing requires the child to use grammar while choosing ideas, sequencing information, building sentences, revising, and communicating clearly. Tiny Steps connects the two rather than treating writing as rule memorisation.',
  },
  {
    question: 'How can parents see whether writing is improving?',
    answer:
      'Compare similar writing tasks over time. Look for more complete sentences, fewer repeated errors, clearer organisation, better word choice, greater independence, and the child’s ability to edit their own work.',
  },
];

const skillStages = [
  {
    stage: 'Sentence foundation',
    focus: 'Complete thoughts, capitals, punctuation, basic word order and subject-verb clarity.',
    sample: 'From: “Dog running.” → To: “The brown dog is running across the park.”',
  },
  {
    stage: 'Sentence expansion',
    focus: 'Adding useful detail with adjectives, adverbs, conjunctions, prepositional phrases and reasons.',
    sample: 'From: “I like the beach.” → To: “I like the beach because I can swim and build sandcastles with my family.”',
  },
  {
    stage: 'Paragraph organisation',
    focus: 'Topic sentence, connected supporting ideas, logical order, transitions and a clear ending.',
    sample: 'Child plans three related points before writing instead of listing disconnected sentences.',
  },
  {
    stage: 'Editing and independent expression',
    focus: 'Checking tense, punctuation, sentence variety, repetition, clarity and whether the response answers the prompt.',
    sample: 'Child can identify one weak sentence, improve it, and explain why the revision is clearer.',
  },
];

const lessonLoop = [
  {
    title: 'Understand the prompt',
    detail: 'Identify what the question is actually asking before the child starts writing.',
  },
  {
    title: 'Say the idea first',
    detail: 'Use oral rehearsal when needed so the child can separate idea generation from handwriting or typing.',
  },
  {
    title: 'Write a first version',
    detail: 'The child writes independently enough for the teacher to see real habits, not a copied model answer.',
  },
  {
    title: 'Receive focused feedback',
    detail: 'Correct the highest-value issue first instead of marking every line in red.',
  },
  {
    title: 'Edit and transfer',
    detail: 'The child improves the sentence or paragraph and then uses the same skill in a fresh example.',
  },
];

const parentChecklist = [
  'Can my child explain the idea aloud before writing?',
  'Does each sentence express a complete thought?',
  'Are capitals and end punctuation used consistently?',
  'Is the tense appropriate and reasonably consistent?',
  'Do the sentences connect to the same main idea?',
  'Can my child improve one sentence after feedback?',
  'Can the same skill be used in a new prompt without copying the previous answer?',
];

const progressEvidence = [
  {
    title: 'Before-and-after writing samples',
    detail: 'Save short samples from comparable prompts so improvement is visible in the child’s own work.',
  },
  {
    title: 'Repeated-error tracking',
    detail: 'Track a few recurring errors such as missing punctuation, tense shifts, fragments, or unclear pronouns instead of counting every mistake.',
  },
  {
    title: 'Independence level',
    detail: 'Notice how much prompting is required. Progress includes needing fewer sentence starters, reminders, or adult corrections.',
  },
  {
    title: 'Transfer to school tasks',
    detail: 'Check whether the same sentence and paragraph habits appear in homework, class answers, descriptions, and short compositions.',
  },
];

export default function WritingClassesForKidsPage() {
  useEffect(() => {
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
        { '@type': 'ListItem', position: 2, name: 'Writing Classes for Kids', item: 'https://tinystepslearning.com/writing-classes-for-kids' },
      ],
    };

    applySeo({
      title: 'English Writing Classes for Kids | Tiny Steps Learning',
      description:
        'Live English writing classes for kids focused on sentence formation, paragraph writing, grammar in use, editing, and clearer idea expression with personalised feedback.',
      canonicalPath: '/writing-classes-for-kids',
      ogType: 'website',
      jsonLd: [breadcrumbSchema, createFAQPageSchema(faqItems)],
    });
  }, []);

  return (
    <div className="container mx-auto max-w-6xl px-6 py-12">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-violet-50 px-6 py-10 text-center shadow-sm md:px-10 md:py-14">
        <div className="mx-auto inline-flex rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
          Tiny Steps • Writing Support
        </div>
        <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-bold text-slate-900 md:text-5xl">
          English Writing Classes for Kids
        </h1>
        <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-700">
          Help your child move from knowing grammar rules to actually using them in clear sentences, paragraphs,
          school answers, descriptions, and independent writing.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/book-demo"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-7 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            Book Free 35-Minute Demo
          </Link>
          <Link
            to="/grammar"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-7 py-3 font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            Explore Grammar & Writing Path
          </Link>
        </div>
      </section>

      <section className="mt-10 rounded-3xl border border-emerald-100 bg-emerald-50 p-6 md:p-8">
        <h2 className="text-2xl font-bold text-slate-900">What are English writing classes for kids?</h2>
        <p className="mt-3 max-w-4xl leading-7 text-slate-700">
          Writing classes give children guided practice in turning ideas into organised written language. A useful programme does more than teach grammar definitions:
          it helps the child understand a prompt, form a complete sentence, connect ideas, revise errors, and use the same skill in an unfamiliar task.
          Tiny Steps uses live feedback so the teacher can see where the writing process is breaking down and target that stage directly.
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
            <li>• Gives good verbal answers but writes only fragments or very short sentences.</li>
            <li>• Knows nouns, verbs or tenses in exercises but does not apply them while writing.</li>
            <li>• Repeats the same sentence pattern and struggles to add useful detail.</li>
            <li>• Has ideas but cannot organise them into a logical paragraph.</li>
            <li>• Takes a long time to start because the blank page feels overwhelming.</li>
            <li>• Makes the same punctuation or tense error even after it has been corrected many times.</li>
            <li>• Copies model answers successfully but struggles with a fresh prompt.</li>
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white md:p-8">
          <h2 className="text-2xl font-bold">What Tiny Steps targets</h2>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-100">
            <li>• Complete sentence formation and clearer word order.</li>
            <li>• Grammar applied inside real writing, not isolated rule drills only.</li>
            <li>• Paragraph planning and connection between ideas.</li>
            <li>• Vocabulary choices that make meaning more precise.</li>
            <li>• Editing habits so children learn to notice and fix their own errors.</li>
            <li>• Transfer into school-style answers, descriptions, summaries, and longer writing.</li>
          </ul>
        </div>
      </section>

      <section className="mt-12 rounded-3xl border border-slate-200 bg-slate-50 p-6 md:p-8">
        <h2 className="text-3xl font-bold text-slate-900">How a guided writing lesson works</h2>
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
          <h2 className="text-2xl font-bold text-slate-900">How to see real progress</h2>
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
          If an adult supplies every sentence, fixes every word before the child finishes, or provides a model that is copied exactly, the final page can look better without the child becoming a stronger writer.
          Good support leaves enough independent work for the teacher and parent to see what the child can really do, then uses focused feedback to improve the next attempt.
        </p>
      </section>

      <section className="mt-12">
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
        <h2 className="text-3xl font-bold">Find the writing bottleneck before choosing a level</h2>
        <p className="mx-auto mt-3 max-w-3xl text-slate-200">
          Book one free 35-minute 1:1 online demo assessment class and ask the teacher to identify whether the first priority is sentence formation, grammar application, paragraph structure, editing, or confidence expressing ideas.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/book-demo" className="rounded-full bg-white px-7 py-3 font-semibold text-slate-900 transition hover:bg-slate-100">
            Book Free Demo
          </Link>
          <Link to="/parents/tracking-progress" className="rounded-full border border-white/20 px-7 py-3 font-semibold text-white">
            How to Track Progress
          </Link>
        </div>
      </section>

      <ClusterSeoNav cluster="grammar" />
    </div>
  );
}
