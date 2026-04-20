import { useEffect, useMemo, useState } from 'react';
import ProgramHero from '../components/programs/ProgramHero';
import LevelTabs from '../components/programs/LevelTabs';
import LearningJourney from '../components/programs/LearningJourney';
import ProgramFacts from '../components/programs/ProgramFacts';
import ProgramProof from '../components/programs/ProgramProof';
import ParentReassurance from '../components/programs/ParentReassurance';
import NextStepsLinks from '../components/programs/NextStepsLinks';
import TopicClusterLinks from '../components/programs/TopicClusterLinks';
import Meta from '../components/common/Meta';
import { createCourseSchema, PUBLIC_FACTS } from '../lib/schemas';
import { getRouteConfig } from '../lib/seo';
import AutoLinkedText from '../components/seo/AutoLinkedText';
import ContentTrustNote from '../components/seo/ContentTrustNote';

const levels = [
  {
    name: 'Basic Grammar',
    outcomes: [
      'Nouns, verbs, adjectives mastery',
      'Sentence building + punctuation',
      'Lesson-by-lesson editing practice',
    ],
    pdf: '/curriculum',
    courseHref: '/courses/basic-grammar'
  },
  {
    name: 'Advanced Grammar',
    outcomes: [
      'Clauses, modals, reported speech',
      'Paragraph writing with feedback',
      'Capstone writing showcase',
    ],
    pdf: '/curriculum',
    courseHref: '/courses/advanced-grammar-writing'
  }
];

const stages = [
  { title: 'Stage 1 • Sentence foundations', duration: 'Lessons 1–12', description: 'Parts of speech, simple sentences, quick edits.' },
  { title: 'Stage 2 • Meaning + structure', duration: 'Lessons 13–24', description: 'Prepositions, conjunctions, plurals, run-on fixes.' },
  { title: 'Stage 3 • Tenses + writing', duration: 'Lessons 25–36', description: 'Questions, punctuation, tense accuracy, capstone writing.' }
];

const quickAnswerFaqItems = [
  {
    question: 'What does grammar progress look like for children?',
    answer:
      'Grammar growth usually moves in stages: words, sentence patterns, accuracy, and then clear short writing.',
  },
  {
    question: 'How do you place a child in the right grammar level?',
    answer:
      'Placement checks sentence formation, punctuation control, tense usage, and writing clarity instead of relying only on age or school grade.',
  },
  {
    question: 'What do parents usually notice first?',
    answer:
      'Parents typically notice fewer sentence errors and better punctuation in homework and daily writing.',
  },
  {
    question: 'How is grammar taught beyond worksheets?',
    answer:
      'Children apply rules through speaking prompts, editing drills, and guided writing tasks so grammar becomes usable, not memorized.',
  }
];

const faqItems = [
  {
    question: 'What age should a child start grammar and writing classes?',
    answer: 'Most children benefit from guided grammar and writing support once they are ready for sentence-level work. Tiny Steps places each child by current sentence and writing level, not only age.'
  },
  {
    question: 'Are online grammar classes effective for school writing?',
    answer: 'Yes. Live grammar classes improve sentence accuracy, punctuation, and paragraph clarity when practice is consistent. Children get real-time correction and guided writing tasks in every session.'
  },
  {
    question: 'My child knows rules but still makes writing mistakes. Can this help?',
    answer: 'Yes. This usually needs guided application, not more rule memorization. Tiny Steps uses editing drills and structured writing practice to convert rules into correct usage.'
  },
  {
    question: 'How do you track grammar and writing progress?',
    answer: 'Parents get stage-based updates with writing samples, strengths, and next-step goals. This makes improvement in sentence quality and paragraph structure easy to track.'
  }
];
const schemaFaqItems = [...quickAnswerFaqItems, faqItems[2]];

const grammarSeo = getRouteConfig('/grammar');

export default function GrammarPage() {
  const [openFaqIndexes, setOpenFaqIndexes] = useState<number[]>([0]);
  const allFaqOpen = openFaqIndexes.length === faqItems.length;

  const toggleFaq = (index: number) => {
    setOpenFaqIndexes((prev) =>
      prev.includes(index) ? prev.filter((item) => item !== index) : [...prev, index]
    );
  };

  const expandAllFaq = () => setOpenFaqIndexes(faqItems.map((_, index) => index));
  const collapseAllFaq = () => setOpenFaqIndexes([]);

  const courseSchema = useMemo(
    () =>
      createCourseSchema({
        name: "Grammar & Writing Classes for Kids",
        description: "How grammar classes improve real language use: children move from word types to sentence control, punctuation, and clearer writing.",
        url: `${PUBLIC_FACTS.primaryWebsite}/grammar`,
        courseMode: 'online',
        ageRange: 'Ages 3-12',
        educationalLevel: 'Elementary to Middle School'
      }),
    [],
  );

  const jsonLd = [
    courseSchema,
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://tinystepslearning.com/" },
        { "@type": "ListItem", "position": 2, "name": "Grammar", "item": "https://tinystepslearning.com/grammar" }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": schemaFaqItems.map(item => ({
        "@type": "Question",
        "name": item.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.answer
        }
      }))
    }
  ];

  return (
    <div>
      <Meta
        title={grammarSeo?.title ?? 'Online Grammar and Writing Classes for Kids | Tiny Steps Learning'}
        description={grammarSeo?.description ?? 'Grammar lessons build sentence control, punctuation accuracy, and writing clarity. See how children progress from word types to clearer expression.'}
        canonical={`https://tinystepslearning.com${grammarSeo?.canonicalPath ?? '/grammar'}`}
        jsonLd={jsonLd}
      />
      <ProgramHero
        program="Grammar"
        title="Online Grammar and Writing Classes for Kids"
        subtitle="How grammar improves real language use: children move from word types to sentence control and clear writing through guided live practice."
        badges={['Ages 3–12', 'Live feedback', 'Lesson-based writing samples']}
        highlights={[
          'Sentence dice, grammar bingo, editing relays',
          'AI writing assistant + downloadable worksheets',
          'Parent dashboard with writing samples & next steps'
        ]}
      />

      <section className="mx-auto max-w-4xl px-6 pt-8">
        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-slate-50 to-emerald-50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">How do grammar classes improve real language use?</h2>
          <p className="mt-2 text-base text-slate-800">
            Grammar classes improve real language use by helping children build correct sentences they can use in both
            speech and writing. Lessons move from word types to sentence structure, punctuation, and guided writing.
            Parents usually notice fewer sentence errors first, then clearer and more confident writing. Next step:
            place your child by current sentence ability and begin at the right level.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {quickAnswerFaqItems.map((item) => (
              <article key={item.question} className="rounded-xl border border-emerald-100 bg-white/90 p-4">
                <h3 className="text-sm font-semibold text-slate-900">{item.question}</h3>
                <p className="mt-2 text-sm text-slate-700">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ContentTrustNote text="This page is created by the Tiny Steps academic team and reviewed by the founder to help parents understand grammar progression and writing clarity for children." />

      <section className="mx-auto mt-8 max-w-4xl px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Proof: what grammar progress looks like</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[
              {
                stage: 'Stage 1',
                title: 'Words to sentences',
                detail: 'Children move from parts of speech to complete sentence patterns.',
              },
              {
                stage: 'Stage 2',
                title: 'Accuracy and control',
                detail: 'Punctuation, tense usage, and sentence corrections become more consistent.',
              },
              {
                stage: 'Stage 3',
                title: 'Writing with clarity',
                detail: 'Children organize ideas into clearer short paragraphs with fewer errors.',
              },
            ].map((item) => (
              <article key={item.title} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{item.stage}</p>
                <h3 className="mt-2 text-sm font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-700">{item.detail}</p>
              </article>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-700">
            Next step: choose the starting level based on your child&apos;s current sentence control, then progress stage by stage.
          </p>
        </div>
      </section>

      {/* Program at a Glance */}
      <ProgramFacts
        ageRange="Ages 3-12"
        format="Live 1:1 or small group online"
        duration={`${PUBLIC_FACTS.sessionDuration}, 2-3x per week`}
        structure="2 levels (Basic & Advanced), 36+ lessons with stage-based progression"
        outcomes={[
          'Learn parts of speech, sentence structure, and punctuation rules',
          'Write clear, grammatically correct sentences with confidence',
          'Progress from simple edits to paragraph writing with guided feedback',
          'Gain writing confidence through visible improvement and AI coach support',
        ]}
        ctaLabel="Book Free Assessment"
        ctaHref="/?book=1"
      />

      <LevelTabs levels={levels} />
      <LearningJourney stages={stages} />

      {/* Program Proof */}
      <ProgramProof
        metrics={[
          { value: '36+', label: 'Structured grammar lessons' },
          { value: '2 levels', label: 'Basic to advanced progression' },
          { value: 'Stage-based', label: 'Clear progress reports every 12 lessons' },
          { value: 'Live 1:1 or group', label: 'Personalized feedback on writing' },
        ]}
      />

      <TopicClusterLinks
        title="Learn More About Grammar & Writing"
        links={[
          { label: 'English Grammar & Writing Classes', href: '/english-grammar-writing-classes' },
          { label: 'Writing Classes for Kids', href: '/writing-classes-for-kids' },
          { label: 'From Nouns to Paragraphs', href: '/blog/week-7-grammar-nouns-to-paragraphs' },
          { label: 'Tenses for Kids', href: '/blog/week-8-grammar-tenses' },
          { label: 'Using Conjunctions Effectively', href: '/blog/week-9-grammar-conjunctions' },
          { label: 'Subject-Verb Agreement', href: '/blog/week-10-grammar-subject-verb' },
          { label: 'English Foundation Program', href: '/english-foundation-program' }
        ]}
      />

      {/* Next Steps Links */}
      <NextStepsLinks
        title="Explore Tiny Steps Grammar & Writing"
        links={[
          { 
            label: 'All Courses', 
            href: '/courses', 
            description: 'Compare all phonics, grammar & speaking courses',
            icon: '🏫'
          },
          { 
            label: 'Grammar Nouns Guide', 
            href: '/blog/week-7-grammar-nouns-to-paragraphs', 
            description: 'Help your child build better sentences',
            icon: '📝'
          },
          { 
            label: 'Full Curriculum', 
            href: '/curriculum', 
            description: 'See all lesson topics across 2 levels',
            icon: '📚'
          },
          { 
            label: 'Pricing Options', 
            href: '/pricing', 
            description: '1:1 and small group packages',
            icon: '💰'
          },
          { 
            label: 'Why Tiny Steps', 
            href: '/why-tiny-steps', 
            description: 'Our approach and teaching philosophy',
            icon: '⭐'
          },
          { 
            label: 'Choosing a Course', 
            href: '/parents/choosing-course', 
            description: 'Find the right level for your child',
            icon: '🧑‍🏫'
          },
          { 
            label: 'Helping with Homework', 
            href: '/parents/helping-with-homework', 
            description: '5-10 minute daily practice tips',
            icon: '✍️'
          },
          { 
            label: 'Tracking Progress', 
            href: '/parents/tracking-progress', 
            description: 'How to see visible improvement',
            icon: '📊'
          },
          {
            label: 'Writing Classes for Kids',
            href: '/writing-classes-for-kids',
            description: 'Focused sentence and paragraph writing support',
            icon: '🧾'
          },
          {
            label: 'English Foundation Program',
            href: '/english-foundation-program',
            description: 'Integrated reading, grammar, and speaking growth',
            icon: '🏗️'
          },
          {
            label: 'English Classes for 6 Year Old',
            href: '/english-classes-for-6-year-old',
            description: 'Reading fluency plus grammar basics for Class 1 readiness',
            icon: '6️⃣'
          },
          {
            label: 'English Classes for 7 to 10 Year Old',
            href: '/english-classes-for-7-10-year-old',
            description: 'Grammar usage, writing clarity, and communication support',
            icon: '🔟'
          },
        ]}
      />

      {/* FAQ Section */}
      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Parent FAQs</p>
            <h2 className="text-3xl font-bold text-slate-900">Common questions about grammar classes</h2>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={expandAllFaq}
              disabled={allFaqOpen}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Expand all
            </button>
            <button
              type="button"
              onClick={collapseAllFaq}
              disabled={!openFaqIndexes.length}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Collapse all
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, index) => {
            const isOpen = openFaqIndexes.includes(index);
            return (
              <article key={item.question} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
                  aria-expanded={isOpen}
                >
                  <span className="text-base font-semibold text-slate-900">{item.question}</span>
                  <span className={`text-xl font-bold text-slate-500 transition-transform duration-300 ${
                    isOpen ? 'rotate-45' : 'rotate-0'
                  }`}>
                    +
                  </span>
                </button>
                <div className={`grid transition-all duration-300 ease-in-out ${
                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}>
                  <div className="overflow-hidden px-5 pb-5 text-slate-700">
                    <AutoLinkedText text={item.answer} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Parent Reassurance */}
      <ParentReassurance programName="our grammar classes" />
    </div>
  );
}
