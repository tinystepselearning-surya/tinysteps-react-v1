import { useEffect, useMemo, useState } from 'react';
// React import removed (unused)
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
    name: 'Public Speaking (Basic)',
    outcomes: [
      '15-60 second talks, show & tell',
      'Voice, face & body language warmups',
      'Confidence routines + practice prompts',
    ],
    pdf: '/curriculum',
    courseHref: '/courses/basic-public-speaking-early-speakers'
  },
  {
    name: 'Public Speaking (Advanced)',
    outcomes: [
      'Structure, storytelling, and Q&A',
      'Persuasion + debate foundations',
      'Capstone presentation showcase',
    ],
    pdf: '/curriculum',
    courseHref: '/courses/advanced-public-speaking-young-leaders'
  }
];

const stages = [
  { title: 'Stage 1 • Comfort + clarity', duration: 'Lessons 1–12', description: 'Confidence routines, clear speech, simple structure.' },
  { title: 'Stage 2 • Story + Q&A', duration: 'Lessons 13–24', description: 'Describe, show & tell, mini talks, friendly questions.' },
  { title: 'Stage 3 • Presentation readiness', duration: 'Lessons 25–36', description: 'Audience practice, strong openings, showcase speech.' }
];

const quickAnswerFaqItems = [
  {
    question: 'How does speaking confidence grow for children?',
    answer:
      'Speaking confidence usually grows in stages: comfort, sentence flow, and then structured presentation. Children improve fastest with regular guided speaking turns.',
  },
  {
    question: 'Is this useful for shy children who speak very little?',
    answer:
      'Yes. Lessons start with low-pressure prompts and short responses, then build toward longer answers, storytelling, and independent speaking.',
  },
  {
    question: 'What happens in a live speaking lesson?',
    answer:
      'Children practice picture talk, story structure, vocabulary expansion, pronunciation, and feedback-based speaking tasks in live online sessions.',
  },
  {
    question: 'What do parents usually notice first?',
    answer:
      'Parents usually notice better participation first. Then children begin speaking in longer, clearer sentences with more confidence.',
  }
];

const faqItems = [
  {
    question: 'What age should a child start speaking confidence classes?',
    answer: 'Children can begin with short, guided speaking tasks and progress to more structured communication, storytelling, and presentation practice as confidence grows.'
  },
  {
    question: 'Will this help a shy child speak in class?',
    answer: 'Yes. Tiny Steps uses low-pressure, step-by-step speaking routines so shy children build comfort first and confidence next. Over time, children usually speak with longer, clearer responses.'
  },
  {
    question: 'Are online speaking classes effective for kids?',
    answer: 'Yes. Live online speaking classes are effective when children get repeated speaking turns and direct feedback. Consistent practice improves sentence flow, clarity, and participation confidence.'
  },
  {
    question: 'How do you measure speaking progress?',
    answer: 'Parents receive stage-based progress updates with strengths, targets, and recorded speaking evidence. This makes confidence and communication growth measurable over time.'
  }
];
const schemaFaqItems = [...quickAnswerFaqItems, faqItems[1]];

const speakingSeo = getRouteConfig('/speaking');

export default function SpeakingPage() {
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
        name: "Public Speaking Classes for Kids",
        description: "How speaking classes build confidence: children move from guided short responses to story-based and structured speaking with live feedback.",
        url: `${PUBLIC_FACTS.primaryWebsite}/speaking`,
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
        { "@type": "ListItem", "position": 2, "name": "Public Speaking", "item": "https://tinystepslearning.com/speaking" }
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
        title={speakingSeo?.title ?? 'Public Speaking Classes for Kids Online | Tiny Steps Learning'}
        description={speakingSeo?.description ?? 'Public speaking classes for kids online that build communication skills, clarity, and confidence speaking through structured live practice.'}
        canonical={`https://tinystepslearning.com${speakingSeo?.canonicalPath ?? '/speaking'}`}
        jsonLd={jsonLd}
      />
      <ProgramHero
        program="Public Speaking"
        title="Public Speaking Classes for Kids Online"
        subtitle="Build communication skills and confidence speaking through guided practice, from short responses to structured presentations."
        badges={['Ages 3–12', 'S.P.E.A.K habit', 'Parent video notes']}
        highlights={[
          'Show & tell, storytelling, debates, persuasive speeches',
          'AI voice analytics + coach feedback',
          'Capstone performances recorded and certified'
        ]}
      />

      <section className="mx-auto max-w-4xl px-6 pt-8">
        <div className="rounded-2xl border border-amber-100 bg-gradient-to-r from-slate-50 to-amber-50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">How do public speaking classes build communication confidence?</h2>
          <p className="mt-2 text-base text-slate-800">
            Speaking classes build confidence through repeated, guided speaking turns in a safe live setting. Children
            move from short responses to picture talk, storytelling, and structured speaking. Parents usually notice
            more participation first, then clearer and longer responses. Next step: begin with a comfortable speaking
            baseline so teaching starts at the right pace.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {quickAnswerFaqItems.map((item) => (
              <article key={item.question} className="rounded-xl border border-amber-100 bg-white/90 p-4">
                <h3 className="text-sm font-semibold text-slate-900">{item.question}</h3>
                <p className="mt-2 text-sm text-slate-700">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ContentTrustNote text="This page is created by the Tiny Steps academic team and reviewed by the founder to help parents support communication confidence and public speaking development." />

      <section className="mx-auto mt-8 max-w-4xl px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Proof: how speaking confidence grows in stages</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[
              {
                stage: 'Stage 1',
                title: 'Comfort to speak',
                detail: 'Children begin with guided prompts, short responses, and low-pressure speaking routines.',
              },
              {
                stage: 'Stage 2',
                title: 'Clear expression',
                detail: 'Sentence length, vocabulary choice, and speaking clarity improve with regular feedback.',
              },
              {
                stage: 'Stage 3',
                title: 'Structured presentation',
                detail: 'Children learn how to organize ideas, present confidently, and handle simple questions.',
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
            Next step: use your child&apos;s current comfort level to start at the right stage and build steadily.
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
          'Build confidence to speak clearly in front of others',
          'Strengthen voice clarity, body language, and presentation delivery',
          'Progress from simple show & tell to structured presentations',
          'Master storytelling, persuasion, and Q&A techniques with live coach feedback',
        ]}
        ctaLabel="Book Free Assessment"
        ctaHref="/?book=1"
      />

      <LevelTabs levels={levels} />
      <LearningJourney stages={stages} />

      {/* Program Proof */}
      <ProgramProof
        metrics={[
          { value: '36+', label: 'Structured speaking lessons' },
          { value: '2 levels', label: 'Basic to advanced progression' },
          { value: 'Stage-based', label: 'Clear progress reports every 12 lessons' },
          { value: 'Live 1:1 or group', label: 'Personalized coach feedback' },
        ]}
      />

      <TopicClusterLinks
        title="Learn More About Public Speaking for Kids"
        links={[
          { label: 'Public Speaking & Communication', href: '/speaking' },
          { label: 'Child Answers Only in One Word', href: '/blog/why-child-answers-only-in-one-word' },
          { label: 'Improve Sentence Formation in Kids', href: '/blog/how-to-improve-sentence-formation-in-kids' },
          { label: 'How Phonics, Grammar and Communication Work Together', href: '/blog/how-phonics-grammar-and-communication-work-together' },
          { label: 'Confidence Seeds (Parents Guide)', href: '/blog/week-12-speaking-confidence-seeds' },
          { label: 'Structuring a Speech', href: '/blog/week-13-speaking-structure' },
          { label: 'Visual Aids & Expression', href: '/blog/week-14-speaking-visual-aids' }
        ]}
      />

      {/* Next Steps Links */}
      <NextStepsLinks
        title="Explore Tiny Steps Public Speaking"
        links={[
          { 
            label: 'All Courses', 
            href: '/courses', 
            description: 'Compare all phonics, grammar & speaking courses',
            icon: '🏫'
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
            label: 'Building Speech Confidence', 
            href: '/parents/speech-confidence', 
            description: '1-2 minute daily speaking practice',
            icon: '🎤'
          },
          { 
            label: 'Choosing a Course', 
            href: '/parents/choosing-course', 
            description: 'Find the right level for your child',
            icon: '🧑‍🏫'
          },
          { 
            label: 'Tracking Progress', 
            href: '/parents/tracking-progress', 
            description: 'How to see visible improvement',
            icon: '📊'
          },
          {
            label: 'Communication & Public Speaking for Kids',
            href: '/speaking',
            description: 'Communication confidence with sentence support',
            icon: '🗣️'
          },
          {
            label: 'Confidence Building Program',
            href: '/confidence-building-program-kids',
            description: 'Step-by-step support for hesitant speakers',
            icon: '💪'
          },
          {
            label: 'Summer Speaking Camp',
            href: '/summer-speaking-camp-kids',
            description: 'Seasonal speaking confidence track for kids',
            icon: '☀️'
          },
          {
            label: 'English Classes for 5 Year Old',
            href: '/english-classes-for-5-year-old',
            description: 'Early sentence speaking confidence for younger learners',
            icon: '5️⃣'
          },
          {
            label: 'Shy Child Speaking Confidence Help',
            href: '/shy-child-speaking-confidence',
            description: 'Low-pressure support for children who hesitate to speak',
            icon: '🌱'
          },
        ]}
      />

      {/* FAQ Section */}
      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Parent FAQs</p>
            <h2 className="text-3xl font-bold text-slate-900">Common questions about public speaking classes</h2>
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
      <ParentReassurance programName="our speaking classes" />
    </div>
  );
}
