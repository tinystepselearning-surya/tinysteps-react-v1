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
import { createCourseSchema } from '../lib/schemas';
import { getRouteConfig } from '../lib/seo';
import AutoLinkedText from '../components/seo/AutoLinkedText';
import {
  createCourseReviewSchemaFragment,
  fetchApprovedTestimonialsCatalog,
  filterApprovedTestimonialsByCourse,
  getFallbackTestimonials,
  type Testimonial,
} from '../lib/testimonials';

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
    question: 'What does a child learn in Tiny Steps grammar classes?',
    answer:
      'Children learn nouns, verbs, adjectives, pronouns, articles, prepositions, punctuation, tenses, sentence formation, and paragraph writing step by step.'
  },
  {
    question: 'Are the classes suitable for beginners?',
    answer:
      'Yes. Children can begin with basic word types and simple sentences, then move gradually into grammar rules, expanded sentences, and short writing tasks.'
  },
  {
    question: 'How are online grammar classes conducted?',
    answer:
      'Classes are teacher-led through live online sessions using examples, visuals, picture talk, sentence-building tasks, worksheets, and guided correction.'
  },
  {
    question: 'How do parents know the child is improving?',
    answer:
      'Parents receive updates on the child’s grammar understanding, sentence formation, writing clarity, participation, and areas that need more practice.'
  }
];

const faqItems = [
  {
    question: 'What age should a child start grammar and writing classes?',
    answer: 'Most children benefit from guided grammar and writing support from ages 5 and above. Tiny Steps places each child by current sentence and writing level, not only age.'
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

const grammarSeo = getRouteConfig('/grammar');

export default function GrammarPage() {
  const [openFaqIndexes, setOpenFaqIndexes] = useState<number[]>([0]);
  const [courseReviewItems, setCourseReviewItems] = useState<Testimonial[]>(() =>
    filterApprovedTestimonialsByCourse(getFallbackTestimonials({ limit: 800 }), 'grammar'),
  );
  const allFaqOpen = openFaqIndexes.length === faqItems.length;

  const toggleFaq = (index: number) => {
    setOpenFaqIndexes((prev) =>
      prev.includes(index) ? prev.filter((item) => item !== index) : [...prev, index]
    );
  };

  const expandAllFaq = () => setOpenFaqIndexes(faqItems.map((_, index) => index));
  const collapseAllFaq = () => setOpenFaqIndexes([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const approved = await fetchApprovedTestimonialsCatalog(800);
        const catalog = approved.length ? approved : getFallbackTestimonials({ limit: 800 });
        const filtered = filterApprovedTestimonialsByCourse(catalog, 'grammar');
        if (!cancelled) setCourseReviewItems(filtered);
      } catch {
        if (cancelled) return;
        setCourseReviewItems(
          filterApprovedTestimonialsByCourse(getFallbackTestimonials({ limit: 800 }), 'grammar'),
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const courseSchema = useMemo(
    () => ({
      ...createCourseSchema({
        name: "Grammar & Writing Classes for Kids",
        description: "Live online grammar and writing classes with sentence building, punctuation, guided writing, and stage-based parent updates.",
        url: "https://tinystepslearning.com/grammar",
        courseMode: 'online',
        ageRange: 'Ages 5-15',
        educationalLevel: 'Elementary to Middle School'
      }),
      ...createCourseReviewSchemaFragment({
        items: courseReviewItems,
        maxReviews: 5,
      }),
    }),
    [courseReviewItems],
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
      "mainEntity": [...quickAnswerFaqItems, ...faqItems].map(item => ({
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
          <h2 className="text-lg font-semibold text-slate-900">Quick Answer for Parents</h2>
          <p className="mt-2 text-base text-slate-800">
            Tiny Steps Learning offers online grammar classes for children and sentence-building classes for children who need support with grammar foundations,
            sentence formation, writing clarity, and confident expression. The program teaches grammar step by step through examples, guided practice,
            picture-based activities, reading tasks, and writing exercises. Classes are available in one-on-one and small-group formats, with parent
            updates to show what the child is learning and where the child needs more practice.
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
