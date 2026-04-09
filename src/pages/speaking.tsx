import { useState } from 'react';
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
import { createCourseSchema } from '../lib/schemas';
import { getRouteConfig } from '../lib/seo';
import AutoLinkedText from '../components/seo/AutoLinkedText';

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

const faqItems = [
  {
    question: 'What age should a child start speaking confidence classes?',
    answer: 'Most children can begin from age 4 with short, guided speaking tasks. Older children benefit from more structured communication, storytelling, and presentation practice.'
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
  const jsonLd = [
    createCourseSchema({
      name: "Public Speaking Classes for Kids",
      description: "Live online public speaking classes for kids focused on confidence, clarity, storytelling, and presentation structure with coach feedback.",
      url: "https://tinystepslearning.com/speaking",
      courseMode: 'online',
      ageRange: 'Ages 4-15',
      educationalLevel: 'Elementary to Middle School'
    }),
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
        title={speakingSeo?.title ?? 'Online Public Speaking Classes for Kids | Tiny Steps Learning'}
        description={speakingSeo?.description ?? 'Live online public speaking and communication classes for kids with storytelling, structure, and coach feedback.'}
        canonical={`https://tinystepslearning.com${speakingSeo?.canonicalPath ?? '/speaking'}`}
        jsonLd={jsonLd}
      />
      <ProgramHero
        program="Public Speaking"
        title="Online Public Speaking Classes for Kids"
        subtitle="From shy to spotlight-ready with spoken English practice, communication coaching, and stage-based showcases."
        badges={['Ages 4–15', 'S.P.E.A.K habit', 'Parent video notes']}
        highlights={[
          'Show & tell, storytelling, debates, persuasive speeches',
          'AI voice analytics + coach feedback',
          'Capstone performances recorded and certified'
        ]}
      />

      <section className="mx-auto max-w-4xl px-6 pt-8">
        <div className="rounded-2xl border border-amber-100 bg-gradient-to-r from-slate-50 to-amber-50 p-6 shadow-sm">
          <p className="text-lg font-semibold text-slate-900">
            Online speaking classes for kids at Tiny Steps help ages 4-15 build spoken English confidence, clearer communication, and structured presentation skills through live guided practice.
          </p>
          <p className="mt-3 text-sm text-slate-700">
            They are especially useful for children who hesitate to speak, use short answers, or need stronger classroom and stage communication confidence.
          </p>
        </div>
      </section>

      {/* Program at a Glance */}
      <ProgramFacts
        ageRange="Ages 4-15"
        format="Live 1:1 or small group online"
        duration="35-minute classes, 2-3x per week"
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
          { label: 'Public Speaking & Communication', href: '/public-speaking-communication-kids' },
          { label: 'Spoken English Classes', href: '/spoken-english-classes-for-kids' },
          { label: 'Helping a Shy Child Speak', href: '/shy-child-speaking-confidence' },
          { label: 'Confidence Building Programs', href: '/confidence-building-program-kids' },
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
            label: 'Spoken English Classes for Kids',
            href: '/spoken-english-classes-for-kids',
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
