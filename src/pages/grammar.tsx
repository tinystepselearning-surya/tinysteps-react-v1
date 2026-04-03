import { useState } from 'react';
import ProgramHero from '../components/programs/ProgramHero';
import LevelTabs from '../components/programs/LevelTabs';
import LearningJourney from '../components/programs/LearningJourney';
import ProgramFacts from '../components/programs/ProgramFacts';
import ProgramProof from '../components/programs/ProgramProof';
import ParentReassurance from '../components/programs/ParentReassurance';
import NextStepsLinks from '../components/programs/NextStepsLinks';
import Meta from '../components/common/Meta';
import { createCourseSchema } from '../lib/schemas';
import { getRouteConfig } from '../lib/seo';

const levels = [
  {
    name: 'Basic Grammar',
    outcomes: [
      'Nouns, verbs, adjectives mastery',
      'Sentence building + punctuation',
      'Lesson-by-lesson editing practice',
    ],
    pdf: '/curriculum'
  },
  {
    name: 'Advanced Grammar',
    outcomes: [
      'Clauses, modals, reported speech',
      'Paragraph writing with feedback',
      'Capstone writing showcase',
    ],
    pdf: '/curriculum'
  }
];

const stages = [
  { title: 'Stage 1 • Sentence foundations', duration: 'Lessons 1–12', description: 'Parts of speech, simple sentences, quick edits.' },
  { title: 'Stage 2 • Meaning + structure', duration: 'Lessons 13–24', description: 'Prepositions, conjunctions, plurals, run-on fixes.' },
  { title: 'Stage 3 • Tenses + writing', duration: 'Lessons 25–36', description: 'Questions, punctuation, tense accuracy, capstone writing.' }
];

const faqItems = [
  {
    question: 'What age should my child start grammar classes?',
    answer: 'Ages 5-7 are ideal for basic grammar (parts of speech, simple sentences). Ages 8-12+ benefit from advanced grammar with paragraph writing and editing. We assess during the free session to recommend the right level.'
  },
  {
    question: 'How is this different from school English or general tuition?',
    answer: 'We focus specifically on sentence structure, punctuation, and writing mechanics—not comprehension or literature. Lessons use grammar games, editing drills, and AI writing coach support, not just worksheets.'
  },
  {
    question: 'Will my child actually write during class?',
    answer: 'Yes. Every lesson includes writing practice—from simple sentence edits to paragraph writing. Teachers give live feedback, and AI tools help children improve between sessions.'
  },
  {
    question: 'What if my child finds grammar boring?',
    answer: 'We use sentence dice, grammar bingo, and editing relays to make it playful. Children see their writing improve lesson-by-lesson, which builds intrinsic motivation.'
  },
  {
    question: 'How do you track progress in grammar?',
    answer: 'Parents receive stage-based reports every 12 lessons with writing samples, strengths, and next steps. Children see their own writing evolve, which is the clearest measure of progress.'
  },
  {
    question: 'Do I need to book a free assessment first?',
    answer: 'Recommended. The 35-minute assessment helps us place your child in the right level (Basic or Advanced) and show you exactly how our lessons work.'
  }
];

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
  const jsonLd = [
    createCourseSchema({
      name: "Grammar & Writing Classes for Kids",
      description: "Live online grammar and writing classes with sentence building, punctuation, guided writing, and stage-based parent updates.",
      url: "https://tinystepslearning.com/grammar",
      courseMode: 'online',
      ageRange: 'Ages 5-15',
      educationalLevel: 'Elementary to Middle School'
    }),
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
      "mainEntity": faqItems.map(item => ({
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
        description={grammarSeo?.description ?? 'Live online grammar and writing classes for kids with sentence structure, punctuation, and guided writing.'}
        canonical={`https://tinystepslearning.com${grammarSeo?.canonicalPath ?? '/grammar'}`}
        jsonLd={jsonLd}
      />
      <ProgramHero
        program="Grammar"
        title="Online Grammar and Writing Classes for Kids"
        subtitle="Playful grammar drills, sentence-structure practice, and AI writing coach help kids write clearly and confidently."
        badges={['Ages 5–15', 'Live feedback', 'Lesson-based writing samples']}
        highlights={[
          'Sentence dice, grammar bingo, editing relays',
          'AI writing assistant + downloadable worksheets',
          'Parent dashboard with writing samples & next steps'
        ]}
      />

      <section className="mx-auto max-w-4xl px-6 pt-8">
        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-slate-50 to-emerald-50 p-6 shadow-sm">
          <p className="text-lg font-semibold text-slate-900">
            Tiny Steps runs live online grammar and writing classes for kids that build sentence structure, punctuation, grammar accuracy, and clear written expression.
          </p>
          <p className="mt-3 text-sm text-slate-700">
            Parent intent: grammar classes for kids • grammar and writing classes • sentence structure and paragraph writing support.
          </p>
        </div>
      </section>

      {/* Program at a Glance */}
      <ProgramFacts
        ageRange="Ages 5-15"
        format="Live 1:1 or small group online"
        duration="35-minute classes, 2-3x per week"
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

      {/* Next Steps Links */}
      <NextStepsLinks
        title="Explore Tiny Steps Grammar & Writing"
        links={[
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
                    {item.answer}
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
