import { useState } from 'react';
// React import removed (unused)
import ProgramHero from '../components/programs/ProgramHero';
import LevelTabs from '../components/programs/LevelTabs';
import LearningJourney from '../components/programs/LearningJourney';
import ProgramFacts from '../components/programs/ProgramFacts';
import ProgramProof from '../components/programs/ProgramProof';
import ParentReassurance from '../components/programs/ParentReassurance';
import NextStepsLinks from '../components/programs/NextStepsLinks';
import Meta from '../components/common/Meta';
import { createCourseSchema } from '../lib/schemas';

const levels = [
  {
    name: 'Public Speaking (Basic)',
    outcomes: [
      '15-60 second talks, show & tell',
      'Voice, face & body language warmups',
      'Confidence routines + practice prompts',
    ],
    pdf: '/curriculum'
  },
  {
    name: 'Public Speaking (Advanced)',
    outcomes: [
      'Structure, storytelling, and Q&A',
      'Persuasion + debate foundations',
      'Capstone presentation showcase',
    ],
    pdf: '/curriculum'
  }
];

const stages = [
  { title: 'Stage 1 • Comfort + clarity', duration: 'Lessons 1–12', description: 'Confidence routines, clear speech, simple structure.' },
  { title: 'Stage 2 • Story + Q&A', duration: 'Lessons 13–24', description: 'Describe, show & tell, mini talks, friendly questions.' },
  { title: 'Stage 3 • Presentation readiness', duration: 'Lessons 25–36', description: 'Audience practice, strong openings, showcase speech.' }
];

const faqItems = [
  {
    question: 'What age is best to start public speaking classes?',
    answer: 'Ages 4-6 are great for building basic confidence and clarity. Ages 7-15 benefit from structured presentations, storytelling, and debate foundations. We tailor lessons to each child’s comfort level.'
  },
  {
    question: 'Will this help my shy child?',
    answer: 'Yes. We start with safe, scaffolded activities (show & tell, describing pictures) and build confidence step-by-step. Many shy children surprise their parents once they find their voice in a supportive 1:1 or small-group environment.'
  },
  {
    question: 'What’s the difference between this and debate or drama classes?',
    answer: 'We focus on presentation skills—structure, clarity, body language, and audience connection. It’s not performance or competitive debate. Think: confidence to speak at school assemblies, family events, or future interviews.'
  },
  {
    question: 'How much speaking does my child do in each class?',
    answer: 'Multiple short talks per session. Children give several presentations with live coach feedback. Lessons are interactive, not lecture-based. The goal is practice, not passive listening.'
  },
  {
    question: 'How is progress measured?',
    answer: 'Parents receive stage-based reports every 12 lessons with video recordings of talks, strengths, and next steps. Watching your child’s journey from hesitant to confident is the best measure.'
  },
  {
    question: 'Is a free assessment required?',
    answer: 'Recommended. The 35-minute session helps us understand your child’s current comfort level, set goals, and show you how our coaching works.'
  }
];

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
        title="Online Public Speaking Classes for Kids | Tiny Steps Learning"
        description="Live 1:1 and small-group public speaking classes for kids ages 4-15. Free assessment, confidence building, presentation skills, storytelling with trained coaches."
        canonical="https://tinystepslearning.com/speaking"
        jsonLd={jsonLd}
      />
      <ProgramHero
        program="Public Speaking"
        title="Super Speakers Studio"
        subtitle="From shy to spotlight-ready with live coaches, AI observation notes, and stage-based showcases."
        badges={['Ages 4–15', 'S.P.E.A.K habit', 'Parent video notes']}
        highlights={[
          'Show & tell, storytelling, debates, persuasive speeches',
          'AI voice analytics + coach feedback',
          'Capstone performances recorded and certified'
        ]}
      />

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

      {/* Next Steps Links */}
      <NextStepsLinks
        title="Explore Tiny Steps Public Speaking"
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
                    {item.answer}
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
