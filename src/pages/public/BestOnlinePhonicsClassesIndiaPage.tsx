import { useEffect, useState } from 'react';
import { applySeo } from '../../lib/seo';
import { Link } from 'react-router-dom';
import Meta from '../../components/common/Meta';
import PageHero from '../../components/common/PageHero';
import {
  formatINR,
  ONE_TO_ONE_MONTHLY_PACKAGES,
  PER_CLASS_PRICE,
  ULTRA_PREMIUM_PRICING,
} from '../../config/pricing';

type PricingProgram = 'premium' | 'ultra';

const planMeta = {
  starter: {
    title: '12 Classes / Month',
    badge: 'New families',
    highlight: false,
    color: 'from-white via-[#fff7ec] to-[#ffe0b5]',
  },
  growth: {
    title: '16 Classes / Month',
    badge: 'Most popular',
    highlight: true,
    color: 'from-[#fff1d6] via-white to-[#dff1ff]',
  },
  intensive: {
    title: '24 Classes / Month',
    badge: 'Fast-track',
    highlight: false,
    color: 'from-white via-[#e8f3ff] to-[#f4e8ff]',
  },
} as const;

const checklistPoints = [
  { title: 'Proven curriculum', detail: 'Uses systematic synthetic phonics (SATPIN, Jolly Phonics, Letters and Sounds) with clear progression from sounds to blending to reading.' },
  { title: '1:1 vs group', detail: "1:1 classes adapt to your child's pace and finish faster (12 weeks vs 20+ weeks for groups)." },
  { title: 'Qualified teachers', detail: 'Mentors with phonics certifications (Jolly Phonics, TESOL, B.Ed) and ongoing training.' },
  { title: 'Free trial/assessment', detail: "Quality programs should offer a free assessment to recommend the right starting point." },
  { title: 'Progress transparency', detail: 'Stage-based reports with mastered skills, upcoming topics, and home practice tips.' },
  { title: 'Pronunciation focus', detail: 'Live correction for Indian English clarity (R/L/TH/W-V sounds), not only reading drills.' },
  { title: 'Flexible scheduling', detail: 'Weekend and evening slots with simple rescheduling options.' },
  { title: 'Age-appropriate tracks', detail: 'Separate pathways for beginners (3–5), elementary (6–8), and catch-up (7–12).' },
  { title: 'Home practice support', detail: 'Short daily activities (5–10 min) with clear parent instructions.' },
  { title: 'School alignment', detail: 'Works with IB, CBSE, ICSE, and international syllabi without conflict.' },
];

const offeringPoints = [
  'Free 35-minute assessment session to evaluate current level and recommend starting point',
  'Systematic SATPIN-based curriculum from letter sounds to fluent reading in 12–16 weeks',
  '1:1 live sessions (35 min) with certified mentors trained in phonics methodology',
  'AI-guided practice games (Phonics Mission, CVC Builder) for daily reinforcement',
  'Stage-based progress reports showing mastered skills, upcoming topics, and home practice tips',
  'Lesson recordings for parent review and quality assurance',
  'Pronunciation coaching targeting Indian English clarity (R/L/TH/W-V sounds)',
  'Digital materials (worksheets, flashcards, practice activities) included—no extra purchases',
  'Monthly parent calls to discuss progress, answer questions, and adjust pacing',
  'Flexible scheduling with weekend/evening slots and easy rescheduling',
];

const progressSteps = [
  {
    icon: '📝',
    title: 'Free initial assessment session (35 min)',
    detail: "Mentor evaluates your child's current level, identifies sound/blending gaps, and recommends the right starting point in a conversational, low-pressure format.",
  },
  {
    icon: '🎯',
    title: 'Personalized learning plan',
    detail: "A custom 12–16 week roadmap is built from the assessment, aligned to Tiny Steps phonics curriculum and adapted to your child's pace.",
  },
  {
    icon: '📊',
    title: 'Stage progress updates',
    detail: "After sessions, parents get teacher notes, mastered skills, next focus, and quick home-practice pointers so progress is always visible.",
  },
  {
    icon: '🎥',
    title: 'Lesson recordings',
    detail: 'Sessions are recorded (with permission) for replay, reinforcement, and transparent quality review at home.',
  },
  {
    icon: '📞',
    title: 'Monthly parent check-ins',
    detail: 'Parents can review progress with the mentor, ask questions, and fine-tune pace or focus areas.',
  },
  {
    icon: '✅',
    title: 'Mastery verification and next steps',
    detail: 'Each level ends with capstone checks and a recommended next step: advanced phonics, grammar transition, or public speaking add-on.',
  },
];

const audienceProfiles = [
  {
    icon: '👶',
    label: 'Beginners (Ages 3–5)',
    detail:
      'Children just starting letters and sounds. We use playful multisensory routines to build core phonics readiness.',
  },
  {
    icon: '📚',
    label: 'Elementary (Ages 6–8)',
    detail:
      'Children building fluency in CVC words, digraphs, tricky words, and comprehension with confidence-focused practice.',
  },
  {
    icon: '🎯',
    label: 'Catch-Up (Ages 7–12)',
    detail:
      'Children who are behind in reading can close key decoding gaps through targeted, high-frequency phonics support.',
  },
  {
    icon: '🏠',
    label: 'Non-native English households',
    detail:
      'Families wanting explicit pronunciation and language-structure support to build stronger English foundations at home.',
  },
];

const faqItems = [
  {
    question: 'What age is best for online phonics classes?',
    answer:
      'Ages 3–8 are ideal for foundational phonics. Children can recognize sounds and begin blending by age 3–4. Older kids (7–12) struggling with reading benefit from intensive phonics catch-up programs. Start with a free assessment to determine the right level.',
  },
  {
    question: 'Do online phonics classes offer free trial lessons?',
    answer:
      "Most quality programs offer a free assessment or trial class. Tiny Steps provides a free 35-minute session where mentors evaluate your child's current level, learning style, and recommend a personalized plan. No credit card required.",
  },
  {
    question: "What's better: 1:1 or group phonics classes?",
    answer:
      "1:1 classes adapt to your child's pace, provide instant feedback, and finish faster (12 weeks vs 20+ weeks). Group classes cost less but work best for children who follow instructions well. For phonics mastery, 1:1 delivers better outcomes.",
  },
  {
    question: 'How often should my child attend phonics classes?',
    answer:
      '2–3 sessions per week is optimal for steady progress. Daily 10-minute home practice between classes reinforces learning. Most children complete foundational phonics in 12–16 weeks with consistent attendance.',
  },
  {
    question: 'How long does it take to see reading improvement with phonics?',
    answer:
      'Many children show early gains in blending and decoding within 3–4 weeks of consistent practice (2–3 sessions per week plus daily home practice). Full reading fluency takes longer and depends on starting level, attendance consistency, and home reinforcement. Children starting from zero typically need 12–16 weeks to reach basic fluency, while catch-up learners may see faster progress in targeted areas.',
  },
  {
    question: 'Do I get progress reports for online phonics classes?',
    answer:
      'Yes. Quality programs provide stage-based progress updates showing mastered skills, upcoming topics, and home practice tips. Tiny Steps includes lesson recordings, mastery bands, and monthly parent calls for full transparency.',
  },
  {
    question: "Will online classes fix my child's pronunciation?",
    answer:
      'Yes, if the program includes explicit pronunciation coaching. Look for mentors trained in phonetic clarity (R/L/TH/W-V sounds). Tiny Steps targets Indian English clarity with live correction and pronunciation practice in every lesson.',
  },
  {
    question: 'What materials do I need for online phonics classes?',
    answer:
      'You need a device (laptop/tablet), stable internet, and a quiet space. Quality programs provide digital materials: worksheets, flashcards, and practice games. No expensive workbooks or physical kits required.',
  },
  {
    question: 'Are online phonics teachers properly trained?',
    answer:
      'Check for teachers with phonics certifications (Jolly Phonics, TESOL, B.Ed). Tiny Steps mentors complete 40+ hours of phonics methodology training and ongoing quality reviews. All sessions are recorded for accountability.',
  },
  {
    question: 'Can international students join online phonics classes from India?',
    answer:
      'Yes. Online classes work globally. Tiny Steps serves families in India, UAE, Singapore, UK, and US with flexible time slots (6 AM–9 PM IST). Classes adapt to IB, CBSE, or international curriculum needs.',
  },
];

export default function BestOnlinePhonicsClassesIndiaPage() {
  const [activeProgram, setActiveProgram] = useState<PricingProgram>('premium');
  const [activeProgressStep, setActiveProgressStep] = useState(0);
  const [activeAudienceTab, setActiveAudienceTab] = useState(0);
  const [openFaqIndexes, setOpenFaqIndexes] = useState<number[]>([0]);
  const premiumMonthlyEstimate =
    ONE_TO_ONE_MONTHLY_PACKAGES.find((row) => row.id === 'starter')?.monthlyFee ?? 0;
  const ultraMonthlyEstimate =
    ULTRA_PREMIUM_PRICING.find((row) => row.ratio === '1:1')?.package12 ?? 0;
  const premiumPlans = ONE_TO_ONE_MONTHLY_PACKAGES.map((pkg) => {
    const meta = planMeta[pkg.id as keyof typeof planMeta] ?? planMeta.starter;
    return {
      id: pkg.id,
      classes: pkg.classes,
      monthlyFee: pkg.monthlyFee,
      title: meta.title,
      badge: meta.badge,
      highlight: meta.highlight,
      color: meta.color,
    };
  });
  const allFaqOpen = openFaqIndexes.length === faqItems.length;

  const toggleFaq = (index: number) => {
    setOpenFaqIndexes((prev) =>
      prev.includes(index) ? prev.filter((item) => item !== index) : [...prev, index],
    );
  };

  const expandAllFaq = () => setOpenFaqIndexes(faqItems.map((_, index) => index));
  const collapseAllFaq = () => setOpenFaqIndexes([]);

  useEffect(() => {
    applySeo({
      title: "Best Online Phonics Classes in India (2026) — Parent Checklist | Tiny Steps Learning",
      description: "Looking for online phonics classes in India? Learn what makes classes effective, what to check before enrolling, and how Tiny Steps' 1:1 approach helps kids master reading.",
      canonicalPath: "/best-online-phonics-classes-india",
      ogType: "article",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://tinystepslearning.com/" },
            { "@type": "ListItem", "position": 2, "name": "Best Online Phonics Classes India", "item": "https://tinystepslearning.com/best-online-phonics-classes-india" }
          ]
        },
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "Best Online Phonics Classes in India (2026) — Parent Checklist",
          "description": "A comprehensive guide for Indian parents to evaluate and choose the best online phonics classes for their children ages 3–12.",
          "author": {
            "@type": "Organization",
            "name": "Tiny Steps Learning"
          },
          "publisher": {
            "@type": "Organization",
            "name": "Tiny Steps Learning",
            "logo": {
              "@type": "ImageObject",
              "url": "https://tinystepslearning.com/logo-square.webp"
            }
          },
          "datePublished": "2026-02-14",
          "dateModified": "2026-02-14"
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://tinystepslearning.com/"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Best Online Phonics Classes in India",
              "item": "https://tinystepslearning.com/best-online-phonics-classes-india"
            }
          ]
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What age is best for online phonics classes?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Ages 3–8 are ideal for foundational phonics. Children can recognize sounds and begin blending by age 3–4. Older kids (7–12) struggling with reading benefit from intensive phonics catch-up programs. Start with a free assessment to determine the right level."
              }
            },
            {
              "@type": "Question",
              "name": "Do online phonics classes offer free trial lessons?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Most quality programs offer a free assessment or trial class. Tiny Steps provides a free 35-minute session where mentors evaluate your child's current level, learning style, and recommend a personalized plan. No credit card required."
              }
            },
            {
              "@type": "Question",
              "name": "What's better: 1:1 or group phonics classes?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "1:1 classes adapt to your child's pace, provide instant feedback, and finish faster (12 weeks vs 20+ weeks). Group classes cost less but work best for children who follow instructions well. For phonics mastery, 1:1 delivers better outcomes."
              }
            },
            {
              "@type": "Question",
              "name": "Which phonics curriculum is used in online classes?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Quality programs use systematic synthetic phonics (like Jolly Phonics, Letters and Sounds, or SATPIN-based). Tiny Steps uses a SATPIN-first approach with multisensory actions, blending drills, and progression aligned to IB/CBSE school expectations."
              }
            },
            {
              "@type": "Question",
              "name": "How often should my child attend phonics classes?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "2–3 sessions per week is optimal for steady progress. Daily 10-minute home practice between classes reinforces learning. Most children complete foundational phonics in 12–16 weeks with consistent attendance."
              }
            },
            {
              "@type": "Question",
              "name": "How long does it take to see reading improvement with phonics?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Many children show early gains in blending and decoding within 3–4 weeks of consistent practice (2–3 sessions per week plus daily home practice). Full reading fluency takes longer and depends on starting level, attendance consistency, and home reinforcement. Children starting from zero typically need 12–16 weeks to reach basic fluency, while catch-up learners may see faster progress in targeted areas."
              }
            },
            {
              "@type": "Question",
              "name": "Do I get progress reports for online phonics classes?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes. Quality programs provide stage-based progress updates showing mastered skills, upcoming topics, and home practice tips. Tiny Steps includes lesson recordings, mastery bands, and monthly parent calls for full transparency."
              }
            },
            {
              "@type": "Question",
              "name": "Will online classes fix my child's pronunciation?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, if the program includes explicit pronunciation coaching. Look for mentors trained in phonetic clarity (R/L/TH/W-V sounds). Tiny Steps targets Indian English clarity with live correction and pronunciation practice in every lesson."
              }
            },
            {
              "@type": "Question",
              "name": "What materials do I need for online phonics classes?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "You need a device (laptop/tablet), stable internet, and a quiet space. Quality programs provide digital materials: worksheets, flashcards, and practice games. No expensive workbooks or physical kits required."
              }
            },
            {
              "@type": "Question",
              "name": "Are online phonics teachers properly trained?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Check for teachers with phonics certifications (Jolly Phonics, TESOL, B.Ed). Tiny Steps mentors complete 40+ hours of phonics methodology training and ongoing quality reviews. All sessions are recorded for accountability."
              }
            },
            {
              "@type": "Question",
              "name": "Can international students join online phonics classes from India?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes. Online classes work globally. Tiny Steps serves families in India, UAE, Singapore, UK, and US with flexible time slots (6 AM–9 PM IST). Classes adapt to IB, CBSE, or international curriculum needs."
              }
            }
          ]
        }
      ]
    });
  }, []);

  return (
    <div className="bg-white">
      <Meta
        title="Best Online Phonics Classes in India (2026) | Tiny Steps Learning"
        description="Use this parent checklist to compare online phonics classes in India and understand what to look for before enrolling your child."
        canonical="https://tinystepslearning.com/best-online-phonics-classes-india"
      />

      <PageHero
        eyebrow="Parent Checklist"
        title="Best Online Phonics Classes in India"
        description="Use this 2026 checklist to compare teaching quality, class format, parent visibility, and curriculum fit before you enrol your child."
        badges={['India-focused checklist', 'For ages 3–12', '1:1 vs group explained']}
        actions={(
          <Link
            to="/?book=1"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Book Free Assessment
          </Link>
        )}
      />

      <div className="container mx-auto max-w-4xl px-6 pb-12">

      {/* AEO Direct Answer Block */}
      <section className="mb-12 rounded-2xl border border-sky-100 bg-gradient-to-r from-slate-50 to-sky-50 p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-bold text-slate-900">What are the best online phonics classes in India?</h2>
        <p className="leading-relaxed text-slate-700">
          The best online phonics classes for Indian children provide 1:1 personalized instruction using systematic synthetic phonics (SATPIN, Jolly Phonics), live mentor feedback, stage-based progress updates, and curricula aligned to IB/CBSE standards. Tiny Steps Learning offers 1:1 online phonics, grammar, and public speaking classes for ages 3–12, combining proven methods with AI-guided practice, lesson recordings, and parent transparency—helping children master reading in 12–16 weeks with consistent practice.
        </p>
      </section>

      {/* How to Choose Checklist */}
      <section id="checklist" className="mb-12">
        <h2 className="mb-6 text-3xl font-bold text-slate-900">How to choose online phonics classes: parent checklist</h2>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="mb-4 text-slate-700">Before enrolling, evaluate programs using these criteria:</p>
          <ul className="space-y-3 text-slate-700">
            {checklistPoints.map((point) => (
              <li key={point.title} className="flex items-start gap-3">
                <span className="mt-1 text-lg font-bold text-sky-600">✓</span>
                <span><strong>{point.title}:</strong> {point.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* What Tiny Steps Includes */}
      <section id="what-we-offer" className="mb-12 rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
        <h2 className="mb-4 text-3xl font-bold text-slate-900">What Tiny Steps online phonics classes include</h2>
        <p className="mb-4 text-slate-700">
          Our 1:1 live phonics program combines proven methodology with parent transparency:
        </p>
        <ul className="space-y-2 text-slate-700">
          {offeringPoints.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span className="mt-2 inline-block h-2 w-2 rounded-full bg-sky-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <Link to="/phonics" className="font-semibold text-slate-900 hover:text-sky-700 hover:underline">
            View phonics program details →
          </Link>
        </div>
      </section>

      {/* How We Assess & Track Progress */}
      <section id="assessment-tracking" className="mb-12">
        <h2 className="mb-2 text-3xl font-bold text-slate-900">How we assess and track progress</h2>
        <p className="mb-6 text-slate-700">
          Transparent tracking ensures you see exactly what your child is learning each week.
        </p>

        <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
          {progressSteps.map((step, index) => (
            <button
              key={step.title}
              type="button"
              onClick={() => setActiveProgressStep(index)}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                activeProgressStep === index
                  ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                  : 'border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-slate-300'
              }`}
              aria-pressed={activeProgressStep === index}
            >
              {step.icon} {step.title}
            </button>
          ))}
        </div>

        <article className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm transition-all duration-300">
          <h3 className="text-xl font-bold text-slate-900">
            {progressSteps[activeProgressStep].icon} {progressSteps[activeProgressStep].title}
          </h3>
          <p className="mt-3 leading-7 text-slate-700">{progressSteps[activeProgressStep].detail}</p>
          <p className="mt-4 text-sm text-slate-600">
            See <Link to="/pricing" className="font-semibold text-slate-900 hover:text-sky-700 hover:underline">pricing options</Link> and
            {' '}<Link to="/parents/tracking-progress" className="font-semibold text-slate-900 hover:text-sky-700 hover:underline">parent tracking details</Link>.
          </p>
        </article>

        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
          <p className="text-slate-700">
            <strong className="text-emerald-700">Trust signal:</strong> Most parents report visible progress in blending, pronunciation, and confidence within 4–6 sessions.
          </p>
        </div>
      </section>

      {/* Who It's Best For */}
      <section id="who" className="mb-12">
        <h2 className="mb-6 text-3xl font-bold text-slate-900">Who Tiny Steps phonics classes are best for</h2>
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
          {audienceProfiles.map((profile, index) => (
            <button
              key={profile.label}
              type="button"
              onClick={() => setActiveAudienceTab(index)}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                activeAudienceTab === index
                  ? 'border-[#1f2a44] bg-[#1f2a44] text-white shadow-lg'
                  : 'border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-slate-300'
              }`}
              aria-pressed={activeAudienceTab === index}
            >
              {profile.icon} {profile.label}
            </button>
          ))}
        </div>
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300">
          <h3 className="text-xl font-bold text-slate-900">
            {audienceProfiles[activeAudienceTab].icon} {audienceProfiles[activeAudienceTab].label}
          </h3>
          <p className="mt-3 text-base leading-7 text-slate-700">
            {audienceProfiles[activeAudienceTab].detail}
          </p>
        </article>
      </section>

      {/* Comparison Table */}
      <section id="comparison" className="mb-12">
        <h2 className="mb-6 text-3xl font-bold text-slate-900">Quick comparison: 4 ways parents choose phonics support</h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
          <table className="w-full border-collapse bg-white">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="border border-slate-700 px-4 py-3 text-left font-bold">Option</th>
                <th className="border border-slate-700 px-4 py-3 text-left font-bold">Best for</th>
                <th className="border border-slate-700 px-4 py-3 text-left font-bold">Watch-outs</th>
                <th className="border border-slate-700 px-4 py-3 text-left font-bold">What to look for</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-3 font-semibold text-gray-900">1:1 online phonics school</td>
                <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">Personalized pacing, pronunciation fixes, catching up fast</td>
                <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">Higher cost; mentor quality varies widely</td>
                <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">Certified mentors, stage-based progress updates, lesson recordings</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="border border-gray-300 px-4 py-3 font-semibold text-gray-900">Small group online class</td>
                <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">Lower cost, peer motivation for social learners</td>
                <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">Fixed pace, less individual feedback, takes 20+ weeks</td>
                <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">Max 4–6 kids per group, teacher training, makeup policy</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-3 font-semibold text-gray-900">App-only / recorded course</td>
                <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">Practice drills, supplementing school, budget constraints</td>
                <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">No pronunciation correction, no live feedback, limited for beginners</td>
                <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">Structured progression, speech recognition, parent dashboard</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="border border-gray-300 px-4 py-3 font-semibold text-gray-900">Local tuition / coaching</td>
                <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">Hands-on materials, familiar local context</td>
                <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">Travel time, inconsistent methodology, harder to track progress</td>
                <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">Phonics certification, small batch size, parent updates</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-gray-700 mt-4 text-sm">
          If you want a checklist for choosing, read our buyer guide section above.
        </p>
      </section>

      {/* Pricing Approach */}
      <section id="pricing" className="mb-12">
        <div className="rounded-[32px] border border-slate-100 bg-gradient-to-br from-[#f8f6fc] via-white to-[#f3f7ff] p-6 shadow-sm sm:p-8">
          <h2 className="text-3xl font-bold text-slate-900">Pricing approach</h2>
          <p className="mt-3 text-gray-700">
            Use the same program toggles as our main pricing page to compare Standard and Ultra Premium options.
          </p>

          <div className="mt-6 mx-auto grid max-w-3xl gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setActiveProgram('premium')}
              className={`rounded-2xl border px-5 py-4 text-left transition ${
                activeProgram === 'premium'
                  ? 'border-slate-900 bg-slate-900 text-white shadow-2xl'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
              aria-pressed={activeProgram === 'premium'}
            >
              <p className="text-base font-semibold">Premium Classes</p>
              <p className={`mt-1 text-xs ${activeProgram === 'premium' ? 'text-slate-200' : 'text-slate-500'}`}>
                Tiny Steps Standard • Expert Indian teachers
              </p>
            </button>
            <button
              type="button"
              onClick={() => setActiveProgram('ultra')}
              className={`rounded-2xl border px-5 py-4 text-left transition ${
                activeProgram === 'ultra'
                  ? 'border-amber-300 bg-gradient-to-r from-[#131c2f] to-[#1f2a44] text-white shadow-2xl'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
              aria-pressed={activeProgram === 'ultra'}
            >
              <p className="text-base font-semibold">Ultra Premium Classes</p>
              <p className={`mt-1 text-xs ${activeProgram === 'ultra' ? 'text-amber-100' : 'text-slate-500'}`}>
                Native English-speaking teachers
              </p>
            </button>
          </div>

          <p className="mt-3 text-sm text-gray-600">
            {activeProgram === 'premium'
              ? `Premium monthly estimate (12 sessions): ${formatINR(premiumMonthlyEstimate)}/month.`
              : `Ultra Premium monthly estimate (12 sessions): ${formatINR(ultraMonthlyEstimate)}/month.`}
          </p>

          {activeProgram === 'premium' ? (
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {premiumPlans.map((plan) => (
                <article
                  key={plan.id}
                  className={`relative overflow-hidden rounded-3xl border border-gray-100 bg-gradient-to-br ${plan.color} p-6 shadow-card-hover`}
                >
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${
                      plan.highlight ? 'bg-[#ff8f5c] text-white' : 'bg-white/80 text-gray-700'
                    }`}
                  >
                    {plan.badge.toUpperCase()}
                  </span>
                  <h3 className="mt-4 text-2xl font-semibold text-gray-900">{plan.title}</h3>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">{formatINR(plan.monthlyFee)} / month</p>
                  <p className="mt-2 text-xs text-gray-500">
                    {formatINR(PER_CLASS_PRICE)} per class • {plan.classes} live classes
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-6">
              <div className="overflow-x-auto rounded-3xl bg-white shadow-card-hover border border-amber-100">
                <table className="w-full min-w-[560px] border-collapse text-sm text-gray-700">
                  <thead>
                    <tr className="bg-slate-900 text-left text-xs uppercase tracking-wide text-slate-100">
                      <th className="px-4 py-3">Format</th>
                      <th className="px-4 py-3">Per class</th>
                      <th className="px-4 py-3">12-class package</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ULTRA_PREMIUM_PRICING.map((row) => (
                      <tr key={row.ratio} className="border-t border-gray-100">
                        <td className="px-4 py-4 font-semibold text-gray-900">{row.format}</td>
                        <td className="px-4 py-4">{formatINR(row.perClass)}{row.ratio === '1:1' ? '' : ' / child'}</td>
                        <td className="px-4 py-4">{formatINR(row.package12)}{row.ratio === '1:1' ? '' : ' / child'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-gray-600">
                Batch availability depends on age, level, and suitable peer matching.
              </p>
            </div>
          )}

          <p className="mt-5 text-gray-700">
            <Link to="/pricing" className="font-semibold text-slate-900 hover:underline">
              View detailed pricing and package options →
            </Link>
          </p>
        </div>
      </section>

      {/* Internal Links Section */}
      <section id="resources" className="mb-12">
        <h2 className="mb-6 text-3xl font-bold text-slate-900">Related resources</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Link to="/phonics" className="rounded-lg border border-gray-200 p-4 transition hover:border-sky-300 hover:shadow-md">
            <h3 className="mb-2 font-bold text-slate-900">Phonics Program</h3>
            <p className="text-sm text-gray-700">Full curriculum details, learning outcomes, and sample lessons</p>
          </Link>
          <Link to="/grammar" className="rounded-lg border border-gray-200 p-4 transition hover:border-sky-300 hover:shadow-md">
            <h3 className="mb-2 font-bold text-slate-900">Grammar Program</h3>
            <p className="text-sm text-gray-700">Structured grammar and writing classes for ages 5–15</p>
          </Link>
          <Link to="/speaking" className="rounded-lg border border-gray-200 p-4 transition hover:border-sky-300 hover:shadow-md">
            <h3 className="mb-2 font-bold text-slate-900">Speaking Program</h3>
            <p className="text-sm text-gray-700">Public speaking and communication classes for ages 4–15</p>
          </Link>
          <Link to="/?book=1" className="rounded-lg border border-gray-200 p-4 transition hover:border-sky-300 hover:shadow-md">
            <h3 className="mb-2 font-bold text-slate-900">Book Free Assessment</h3>
            <p className="text-sm text-gray-700">Get personalized recommendations and trial class details</p>
          </Link>
          <Link to="/reading-classes-for-kids" className="rounded-lg border border-gray-200 p-4 transition hover:border-sky-300 hover:shadow-md">
            <h3 className="mb-2 font-bold text-slate-900">Reading Classes for Kids</h3>
            <p className="text-sm text-gray-700">Support-focused path from decoding to confident reading</p>
          </Link>
          <Link to="/reading-fluency-program" className="rounded-lg border border-gray-200 p-4 transition hover:border-sky-300 hover:shadow-md">
            <h3 className="mb-2 font-bold text-slate-900">Reading Fluency Program</h3>
            <p className="text-sm text-gray-700">Improve pace, flow, and reading confidence</p>
          </Link>
          <Link to="/phonics-fees-india" className="rounded-lg border border-gray-200 p-4 transition hover:border-sky-300 hover:shadow-md">
            <h3 className="mb-2 font-bold text-slate-900">Phonics Fees in India</h3>
            <p className="text-sm text-gray-700">Understand fee-to-outcome fit before enrolling</p>
          </Link>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="mb-12">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-3xl font-bold text-slate-900">Frequently asked questions</h2>
          <div className="flex items-center gap-2">
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
                  <span className={`text-xl font-bold text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`}>
                    +
                  </span>
                </button>
                <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden px-5 pb-5 text-slate-700">
                    {item.answer}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Final CTA */}
      <section className="rounded-2xl bg-gradient-to-r from-slate-900 via-[#1f2a44] to-[#263e6d] p-8 text-center text-white">
        <p className="mb-4 inline-flex rounded-full border border-emerald-300/40 bg-emerald-300/10 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-emerald-100">
          TRUSTED BY PARENTS
        </p>
        <h2 className="text-2xl font-bold mb-4">Ready to start?</h2>
        <p className="mb-6">
          Book a free 35-minute session to see if Tiny Steps phonics classes are right for your child.
        </p>
        <Link
          to="/?book=1"
          className="inline-block rounded-full bg-white px-8 py-3 font-bold text-slate-900 transition hover:-translate-y-0.5 hover:bg-slate-100"
        >
          Book Free Assessment
        </Link>
      </section>
      </div>
    </div>
  );
}
