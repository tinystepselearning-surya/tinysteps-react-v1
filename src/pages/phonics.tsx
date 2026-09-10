import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { applySeo, getRouteConfig } from '../lib/seo';
import { createCourseSchema, createFAQPageSchema, PUBLIC_FACTS } from '../lib/schemas';
import LevelTabs from '../components/programs/LevelTabs';
import LearningJourney from '../components/programs/LearningJourney';
import ProgramFacts from '../components/programs/ProgramFacts';
import ProgramProof from '../components/programs/ProgramProof';
import NextStepsLinks from '../components/programs/NextStepsLinks';
import TopicClusterLinks from '../components/programs/TopicClusterLinks';
import ResponsiveTeachingSection from '../components/programs/ResponsiveTeachingSection';
import ContentTrustNote from '../components/seo/ContentTrustNote';
import AutoLinkedText from '../components/seo/AutoLinkedText';
import TestimonialSnippets from '../components/common/TestimonialSnippets';

const levels = [
  {
    name: 'Foundations',
    outcomes: [
      'Letter sounds + structured synthetic phonics SATPIN blending routines',
      'Short vowels + early CVC words',
      'Lesson-by-lesson practice prompts',
    ],
    pdf: '/curriculum',
    courseHref: '/courses/phonics-foundation'
  },
  {
    name: 'Early Phonics',
    outcomes: [
      'Digraphs, vowel teams, silent-e',
      'Magic E + long vowel patterns',
      'Stage check-ins for fluency',
    ],
    pdf: '/curriculum',
    courseHref: '/courses/phonics-brush-up'
  },
  {
    name: 'Advanced Phonics',
    outcomes: [
      'Diphthongs, bossy R, alternate vowels',
      'Multisyllabic decoding + spelling rules',
      'Fluency + comprehension practice',
    ],
    pdf: '/curriculum',
    courseHref: '/courses/phonics-advanced'
  }
];

const stages = [
  {
    title: 'Sounds to words',
    duration: 'Stage 1',
    description: 'Letter sounds, SATPIN, short vowels, and first blending routines.',
  },
  {
    title: 'Patterns and teams',
    duration: 'Stage 2',
    description: 'Digraphs, magic-e, vowel teams, tricky words, and spelling support.',
  },
  {
    title: 'Fluency and comprehension',
    duration: 'Stage 3',
    description: 'Reading sentences, short passages, expression, spelling, and early writing confidence.',
  },
];

const faqItems = [
  {
    question: 'Are online phonics classes useful for kids?',
    answer:
      'Yes. Online phonics classes are useful when they teach sound-letter links, blending, decoding, and reading practice in a clear sequence with live correction.',
  },
  {
    question: 'How should parents choose an online phonics class for their child?',
    answer:
      'Look for assessment-first placement, explicit sound teaching, systematic progression, blending and segmenting practice, live correction, reading and spelling transfer, and clear progress visibility. The right class should match the child’s current decoding level and adapt when a prerequisite skill is not secure.',
  },
  {
    question: 'When is live 1:1 phonics support useful?',
    answer:
      'Live 1:1 phonics support is especially useful when a child needs individual pacing, immediate correction, or focused help with a specific blending, decoding, spelling or fluency gap. The teacher can observe each attempt and adjust the next practice step immediately.',
  },
  {
    question: 'At what age should a child start phonics?',
    answer:
      'Many children start around ages 3 to 5 with playful sound work. Older children also benefit when blending, reading fluency, or spelling patterns are weak. The right start depends on current reading readiness, not only age.',
  },
  {
    question: 'How do I know if my child needs phonics support?',
    answer:
      'Signs include knowing letters but not reading words, guessing while reading, struggling to blend sounds, reading very slowly, or frequent spelling confusion.',
  },
  {
    question: 'How are phonics classes different from reading practice?',
    answer:
      'Phonics classes build decoding skills by teaching sound patterns and blending routines. Reading practice builds fluency and understanding after decoding begins to stabilize.',
  },
  {
    question: 'How long does it take to see progress in blending?',
    answer:
      'Blending progress depends on the child’s starting point. We look for increasing accuracy, less prompting, retention across lessons and successful blending of fresh words at the child’s current stage rather than promising a fixed number of lessons.',
  },
  {
    question: 'Do phonics classes help with spelling?',
    answer:
      'Yes. When children understand sound patterns, digraphs, and vowel teams, spelling becomes more logical and less guess-based over time.',
  },
  {
    question: 'Are Tiny Steps phonics classes 1:1?',
    answer:
      'Yes. Tiny Steps offers live 1:1 online phonics guidance with level-based progression and personalized correction.',
  },
  {
    question: 'Do parents get progress updates?',
    answer:
      'Yes. Parents receive practical updates on milestones, current gaps, and the next steps in the child’s phonics learning path.',
  },
  {
    question: 'How long is each Tiny Steps 1:1 phonics class?',
    answer:
      'A standard Tiny Steps live 1:1 phonics class is 35 minutes.',
  },
  {
    question: 'Can families outside India join Tiny Steps phonics classes?',
    answer:
      'Yes. Tiny Steps supports families in India and worldwide through live online phonics classes, subject to compatible teacher and class timings.',
  },
];
const schemaFaqItems = faqItems;
const PHONICS_RESEARCH_GUIDE_PATH = '/blog/phonics-for-parents-guide';
const PHONICS_SEO_KEYWORDS = [
  'online phonics classes',
  'online phonics classes for kids',
  'phonics classes for kids',
  'phonics classes in India',
  'live 1:1 phonics classes',
  '1 to 1 phonics classes online',
  'personalised phonics classes for kids',
  'live online phonics classes',
  'structured phonics classes for kids',
  'synthetic phonics classes',
  'phonics classes for struggling readers',
  'phonics tutor online for kids',
  'phonics classes for blending',
  'phonics classes for decoding',
  'phonics classes for ages 3 to 12',
];

const trustChips = [
  {
    label: 'Ages 3–12',
    className: 'border-[#F5DAB7] bg-[#FFF7EC] text-[#7A4A10]',
    dotClassName: 'bg-[#E58E41]',
  },
  {
    label: 'Live 1:1 online classes',
    className: 'border-[#D6E6F7] bg-[#F6FBFF] text-[#234764]',
    dotClassName: 'bg-[#61A5E4]',
  },
  {
    label: 'Free phonics assessment',
    className: 'border-[#E4DCF8] bg-[#FBF8FF] text-[#4C4379]',
    dotClassName: 'bg-[#9D88E5]',
  },
  {
    label: 'Parent progress updates',
    className: 'border-[#D4EFDF] bg-[#F4FFF8] text-[#235F49]',
    dotClassName: 'bg-[#4FB37E]',
  },
];
const pyramidLevels = [
  { step: '5', title: 'Decodable reading fluency', helper: 'Read with smoother confidence' },
  { step: '4', title: 'Digraphs', helper: 'Add vowel teams and patterns' },
  { step: '3', title: 'CVC words', helper: 'Read short vowel words' },
  { step: '2', title: 'Blending', helper: 'Join sounds into words' },
  { step: '1', title: 'Letter sounds', helper: 'Build sound recognition' },
];
const classFitCriteria = [
  {
    title: 'Start from the child’s current level',
    detail: 'Placement should check what the child can already hear, decode, blend, read and spell before selecting the starting point.',
  },
  {
    title: 'Follow a cumulative sequence',
    detail: 'Sound–spelling links should build in a planned order so new patterns depend on skills the child has already secured.',
  },
  {
    title: 'Correct errors while they happen',
    detail: 'The teacher should hear the child read, identify the exact decoding error, model the correction and give another attempt.',
  },
  {
    title: 'Check transfer into real reading',
    detail: 'Progress should appear in fresh word reading, sentence reading and spelling—not only in memorised sound drills.',
  },
];
const intentSupportChips = ['Letter sounds', 'Blending', 'CVC words', 'Reading fluency'];
const parentSearchProblems = [
  {
    icon: '🔤',
    title: 'Child knows letters but cannot read words',
    explanation: 'This usually points to a missing blending routine.',
  },
  {
    icon: '🧩',
    title: 'Child struggles with blending',
    explanation: 'Sounds may be known, but sound-joining is not stable yet.',
  },
  {
    icon: '👀',
    title: 'Child guesses words while reading',
    explanation: 'Decoding habits may need direct correction and guided practice.',
  },
  {
    icon: '🐢',
    title: 'Child reads slowly',
    explanation: 'Reading fluency usually needs repeated level-based text practice.',
  },
  {
    icon: '✍️',
    title: 'Child has spelling confusion',
    explanation: 'Phonics patterns may need explicit and systematic reinforcement.',
  },
  {
    icon: '🏠',
    title: 'Parent wants structured reading support at home',
    explanation: 'Families often need a clear plan with consistent teacher guidance.',
  },
];
const comparisonItems = [
  {
    badge: 'Good for repetition',
    title: 'Phonics apps',
    body: [
      'Apps can help children repeat sounds, match letters, and practise simple games at home.',
      'They are useful after a concept is taught, but they may not notice why a child is guessing, skipping sounds, or blending incorrectly.',
    ],
    footerLabel: 'Best for',
    footerText: 'extra practice after guided teaching',
  },
  {
    badge: 'Good for exposure',
    title: 'School reading practice',
    body: [
      'School reading builds routine, vocabulary, classroom confidence, and regular exposure to books.',
      'But in a group setting, the teacher may not always have time to correct each child’s decoding, sound confusion, or blending gap immediately.',
    ],
    footerLabel: 'Limitation',
    footerText: 'often moves at class pace',
  },
  {
    badge: 'Good for bonding',
    title: 'General reading at home',
    body: [
      'Reading with parents builds listening, vocabulary, story understanding, and love for books.',
      'But if the child has not mastered sound-letter links and blending, more reading alone may not fix word-reading difficulty.',
    ],
    footerLabel: 'Best for',
    footerText: 'comprehension, confidence, and reading habit',
  },
  {
    badge: 'Best for guided correction',
    title: 'Tiny Steps live phonics classes',
    body: [
      'Tiny Steps uses a structured phonics path: letter sounds, blending, CVC words, digraphs, vowel teams, spelling, fluency, and sentence reading.',
      'A trained mentor checks the child’s current level, corrects mistakes live, and gives parents visible progress updates.',
    ],
    footerLabel: 'Best for',
    footerText: 'children who need explicit, level-based reading support',
    checklist: ['structured sequence', 'live correction', 'blending practice', 'parent progress updates'],
  },
];
const reassuranceSteps = [
  {
    icon: '📋',
    title: '1. Free 35-Minute Demo Assessment',
    detail:
      'A live session to understand your child’s current reading stage, decoding gaps, and class readiness.',
  },
  {
    icon: '🎯',
    title: '2. Level-Based Plan',
    detail:
      'A structured starting plan with recommended pathway, lesson flow, and milestones for parent visibility.',
  },
  {
    icon: '✅',
    title: '3. Informed Decision',
    detail:
      'You review the recommendation and choose what works best for your family with no pressure.',
  },
];

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  centered?: boolean;
  tone?: 'dark' | 'light';
};

type SectionShellProps = {
  id?: string;
  className?: string;
  innerClassName?: string;
  children: React.ReactNode;
};

type PremiumCardProps = {
  className?: string;
  children: React.ReactNode;
};

type AccentBadgeProps = {
  children: React.ReactNode;
  className?: string;
};

type MetricPillProps = {
  children: React.ReactNode;
  className?: string;
};

function SectionShell({ id, className = '', innerClassName = '', children }: SectionShellProps) {
  return (
    <section id={id} className={`px-5 py-10 sm:px-6 sm:py-12 ${className}`}>
      <div className={`mx-auto max-w-7xl ${innerClassName}`}>{children}</div>
    </section>
  );
}

function SectionHeader({ eyebrow, title, subtitle, centered = false, tone = 'dark' }: SectionHeaderProps) {
  const eyebrowClass = tone === 'light' ? 'text-slate-300' : 'text-slate-500';
  const titleClass = tone === 'light' ? 'text-white' : 'text-slate-900';
  const subtitleClass = tone === 'light' ? 'text-slate-200' : 'text-slate-700';

  return (
    <div className={centered ? 'text-center' : ''}>
      {eyebrow ? (
        <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${eyebrowClass}`}>{eyebrow}</p>
      ) : null}
      <h2 className={`mt-2 text-2xl font-bold leading-tight tracking-[-0.02em] sm:text-3xl ${titleClass}`}>{title}</h2>
      {subtitle ? <p className={`mt-2 max-w-4xl text-sm leading-relaxed sm:text-base ${subtitleClass}`}>{subtitle}</p> : null}
    </div>
  );
}

function PremiumCard({ className = '', children }: PremiumCardProps) {
  return (
    <div className={`rounded-3xl border border-slate-200 bg-white/95 shadow-[0_14px_38px_rgba(15,23,42,0.07)] ${className}`}>
      {children}
    </div>
  );
}

function AccentBadge({ children, className = '' }: AccentBadgeProps) {
  return (
    <span className={`inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-slate-700 ${className}`}>
      {children}
    </span>
  );
}

function MetricPill({ children, className = '' }: MetricPillProps) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm ${className}`}>
      {children}
    </span>
  );
}

function Pill({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold shadow-sm backdrop-blur ${className}`}>
      {children}
    </span>
  );
}

function NumberBadge({ value }: { value: number }) {
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-sky-500 text-xs font-bold text-white shadow">
      {value}
    </span>
  );
}

type PhonicsSeoOverrides = {
  title?: string;
  description?: string;
  canonicalPath?: string;
  breadcrumbName?: string;
};

type PhonicsPageProps = {
  seoOverrides?: PhonicsSeoOverrides;
  heroTitleOverride?: string;
  heroSubtitleOverride?: string;
  afterHeroContent?: React.ReactNode;
  afterContent?: React.ReactNode;
  extraJsonLd?: object[];
};

export default function PhonicsPage({
  seoOverrides,
  heroTitleOverride,
  heroSubtitleOverride,
  afterHeroContent,
  afterContent,
  extraJsonLd,
}: PhonicsPageProps) {
  const [openFaqIndexes, setOpenFaqIndexes] = useState<number[]>([0]);
  const canonicalPath = seoOverrides?.canonicalPath ?? "/phonics";
  const registry = getRouteConfig(canonicalPath);
  const title = seoOverrides?.title ?? registry?.title ?? "Online Phonics Classes for Kids | Live 1:1 | Tiny Steps";
  const description =
    seoOverrides?.description ??
    registry?.description ??
    "Live 1:1 online phonics classes for kids ages 3–12 in India and worldwide. Build blending, decoding, spelling and reading fluency with assessment-first placement.";
  const breadcrumbName = seoOverrides?.breadcrumbName ?? "Phonics";
  const canonicalUrl = `${PUBLIC_FACTS.primaryWebsite}${canonicalPath}`;
  const heroTitle = heroTitleOverride ?? "Online Phonics Classes for Kids";
  const heroSubtitle =
    heroSubtitleOverride ??
    "Live 1:1 online phonics classes for children ages 3–12 in India and worldwide. We teach letter sounds, blending, decoding, spelling patterns and reading fluency through a structured level-based pathway with parent-visible progress.";
  const allFaqOpen = openFaqIndexes.length === faqItems.length;

  const toggleFaq = (index: number) => {
    setOpenFaqIndexes((prev) =>
      prev.includes(index) ? prev.filter((item) => item !== index) : [...prev, index],
    );
  };

  const expandAllFaq = () => setOpenFaqIndexes(faqItems.map((_, index) => index));
  const collapseAllFaq = () => setOpenFaqIndexes([]);

  useEffect(() => {
    const courseSchema = createCourseSchema({
      name: "Online Phonics Classes for Kids",
      description:
        "Structured online phonics classes for children aged 3–12, covering letter sounds, blending, decoding, reading fluency, and confidence through live guided practice.",
      url: canonicalUrl,
      educationalLevel: 'Foundation to Advanced',
      teaches: ['letter sounds', 'blending', 'CVC words', 'digraphs', 'vowel teams', 'reading fluency', 'spelling'],
      areaServed: ['India', 'Worldwide'],
    });
    const phonicsPathwaySchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': `${canonicalUrl}#phonics-pathway`,
      name: 'Phonics learning pathway for children',
      itemListElement: stages.map((stage, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Thing',
          name: stage.title,
          description: `${stage.duration} — ${stage.description}`,
        },
      })),
    };
    const phonicsQualityCriteriaSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': `${canonicalUrl}#phonics-class-quality-criteria`,
      name: 'How parents can evaluate online phonics classes',
      itemListElement: classFitCriteria.map((criterion, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Thing',
          name: criterion.title,
          description: criterion.detail,
        },
      })),
    };

    const baseJsonLd = [
      courseSchema,
      phonicsPathwaySchema,
      phonicsQualityCriteriaSchema,
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://tinystepslearning.com/" },
          { "@type": "ListItem", "position": 2, "name": "Curriculum", "item": "https://tinystepslearning.com/curriculum" },
          { "@type": "ListItem", "position": 3, "name": breadcrumbName, "item": canonicalUrl }
        ]
      },
      createFAQPageSchema(schemaFaqItems)
    ];

    applySeo({
      title,
      description,
      keywords: PHONICS_SEO_KEYWORDS,
      canonicalPath,
      ogType: "website",
      jsonLd: extraJsonLd?.length ? [...baseJsonLd, ...extraJsonLd] : baseJsonLd,
    });
  }, [title, description, canonicalPath, breadcrumbName, canonicalUrl, extraJsonLd]);

  return (
    <div className="relative overflow-x-clip bg-[linear-gradient(180deg,#fffaf5_0%,#ffffff_24%,#f8fbff_100%)] pb-28">
      <div className="pointer-events-none absolute -left-24 top-24 h-64 w-64 rounded-full bg-sky-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-12 top-10 h-72 w-72 rounded-full bg-orange-200/30 blur-3xl" />

      <section className="relative overflow-hidden bg-gradient-to-br from-[#FFF8EF] via-[#FFFDF8] to-[#EEF8FF] px-5 py-10 sm:px-6 md:py-12 lg:px-8 lg:py-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,_rgba(251,146,60,0.18),_transparent_34%),radial-gradient(circle_at_85%_0%,_rgba(125,211,252,0.24),_transparent_40%),radial-gradient(circle_at_60%_88%,_rgba(196,181,253,0.14),_transparent_26%),linear-gradient(180deg,_rgba(255,247,237,0.96),_rgba(248,250,252,0.94))]" />
        <div className="pointer-events-none absolute -right-16 top-8 h-64 w-64 rounded-full bg-orange-200/35 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-sky-200/35 blur-3xl" />
        <div className="pointer-events-none absolute bottom-2 right-1/4 h-40 w-40 rounded-full bg-violet-200/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="inline-flex items-center rounded-full border border-orange-200/80 bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-700 shadow-sm backdrop-blur">Tiny Steps Phonics</p>
            <h1 className="mt-4 max-w-[680px] text-[40px] font-black leading-[1.03] tracking-[-0.035em] text-slate-950 md:text-[48px] lg:text-[56px]">{heroTitle}</h1>
            <p className="mt-5 max-w-[660px] text-base leading-7 text-slate-700 md:text-lg md:leading-8">{heroSubtitle}</p>
            <div className="mt-7 flex flex-wrap gap-2.5">
              {trustChips.map((chip) => (
                <Pill key={chip.label} className={chip.className}>
                  <span className={`h-2 w-2 rounded-full ${chip.dotClassName}`} aria-hidden="true" />
                  {chip.label}
                </Pill>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/book-demo"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#FF7B66] to-[#FF9B72] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(255,126,99,0.3)] transition hover:-translate-y-0.5 hover:from-[#FF715B] hover:to-[#FF9267]"
              >
                Book Free 35-Minute Demo
              </Link>
              <Link
                to="/phonics#learning-path"
                className="inline-flex items-center justify-center rounded-full border border-[#E9D7C0] bg-white/88 px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
              >
                See Learning Path
              </Link>
              <Link
                to="/curriculum?tab=phonics"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white/75 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-white"
              >
                Full Curriculum Roadmap
              </Link>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <MetricPill>Free 35-minute demo assessment</MetricPill>
              <MetricPill>Level-based plan</MetricPill>
              <MetricPill>Parent progress updates</MetricPill>
            </div>
            <p className="mt-5 max-w-[660px] text-sm leading-6 text-slate-700">
              If you want a provider-by-provider decision framework, use our{' '}
              <Link to="/best-online-phonics-classes-for-kids-in-india" className="font-semibold text-slate-900 underline underline-offset-4 hover:text-sky-700">
                phonics class comparison guide
              </Link>{' '}
              before booking a free 35-minute 1:1 online demo assessment class.
            </p>
            <p className="mt-3 text-xs font-medium text-slate-600">
              Founder-reviewed academic page · structured synthetic phonics pathway.
            </p>
          </div>

          <PremiumCard className="mx-auto w-full max-w-[560px] rounded-[28px] border border-slate-200/70 bg-[linear-gradient(150deg,rgba(255,255,255,0.98),rgba(248,251,255,0.94),rgba(255,250,244,0.92))] p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] md:p-6 lg:ml-auto lg:p-7">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500 md:text-xs">Your child&apos;s reading journey</p>
              <p className="mt-1 text-sm text-slate-700 md:text-base">From first sounds to confident reading</p>

              <div className="mx-auto mt-5 flex max-w-[450px] flex-col items-center">
                {pyramidLevels.map((level, index) => {
                  const widthClass =
                    index === 0
                      ? 'w-[50%]'
                      : index === 1
                        ? 'w-[62%]'
                        : index === 2
                          ? 'w-[74%]'
                          : index === 3
                            ? 'w-[86%]'
                            : 'w-[98%]';
                  const background = index === 0
                    ? '#FFB562'
                    : index === 1
                      ? '#BFE7F2'
                      : index === 2
                        ? '#8ED8E8'
                        : index === 3
                          ? '#58C4DD'
                          : '#2E8FD0';
                  const textColor = index >= 3 ? '#FFFFFF' : '#0A192F';

                  return (
                    <div key={level.step} className={`${index === 0 ? '' : '-mt-[1px]'} ${widthClass} mx-auto`}>
                      <div
                        className="flex h-[44px] items-center justify-center border border-white/70 px-4 text-center shadow-[0_5px_14px_rgba(15,23,42,0.05)] md:h-[48px] lg:h-[50px]"
                        style={{
                          clipPath: 'polygon(8% 0%, 92% 0%, 100% 100%, 0% 100%)',
                          background,
                        }}
                      >
                        <span className="text-[14px] font-bold leading-tight md:text-[15px] lg:text-[16px]" style={{ color: textColor }}>
                          {level.title}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 rounded-[20px] border border-white/80 bg-[linear-gradient(145deg,rgba(255,248,239,0.9),rgba(247,251,255,0.9))] px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)] md:px-5">
                <div className="flex flex-col gap-3">
                  <span className="w-fit rounded-full border border-white/80 bg-white/92 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                    We keep parents updated
                  </span>
                  <div className="flex flex-nowrap items-center justify-center gap-1 overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <Link
                      to="/book-demo"
                      className="whitespace-nowrap rounded-full bg-[#0B1B44] px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm md:px-3 md:text-[11px]"
                    >
                      Assessment
                    </Link>
                    <span className="text-[10px] text-slate-400 md:text-[11px]">→</span>
                    <a
                      href="#program"
                      className="whitespace-nowrap rounded-full bg-[#0B1B44] px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm md:px-3 md:text-[11px]"
                    >
                      Level plan
                    </a>
                    <span className="text-[10px] text-slate-400 md:text-[11px]">→</span>
                    <Link
                      to="/free-letter-tracing-game-for-kids"
                      className="whitespace-nowrap rounded-full bg-[#0B1B44] px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm md:px-3 md:text-[11px]"
                    >
                      Practice
                    </Link>
                    <span className="text-[10px] text-slate-400 md:text-[11px]">→</span>
                    <a
                      href="#progress"
                      className="whitespace-nowrap rounded-full bg-[#0B1B44] px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm md:px-3 md:text-[11px]"
                    >
                      Progress
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </PremiumCard>
        </div>
      </section>

      <SectionShell className="pb-6 pt-0" innerClassName="max-w-6xl">
        <div className="sticky top-[5.25rem] z-20 rounded-full border border-slate-200/90 bg-white/88 p-2 shadow-[0_10px_28px_rgba(15,23,42,0.07)] backdrop-blur-xl">
          <nav className="flex items-center gap-1.5 overflow-x-auto px-1 text-xs font-semibold text-slate-700 sm:text-sm">
            {[
              ['Overview', '#overview'],
              ['Who It’s For', '#problems'],
              ['How to Choose', '#choosing-phonics-support'],
              ['Teaching', '#teacher-delivery'],
              ['Program', '#program'],
              ['Progress', '#progress'],
              ['Resources', '#resources'],
              ['FAQ', '#faq'],
              ['Assessment', '#assessment'],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="whitespace-nowrap rounded-full border border-transparent px-3 py-1.5 transition hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </SectionShell>

      <SectionShell id="overview" className="pt-2">
        <PremiumCard className="relative overflow-hidden border-sky-100 p-7 sm:p-9 lg:p-10">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-400 via-orange-300 to-sky-300" />
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Quick answer for parents</p>
          <h2 className="mt-2 max-w-4xl text-2xl font-bold leading-tight tracking-[-0.02em] text-slate-900 sm:text-3xl">Quick Answer: What are online phonics classes for kids?</h2>
          <p className="mt-3 max-w-5xl text-base leading-relaxed text-slate-700">
            Online phonics classes help children connect letters with sounds, blend sounds into words, read CVC words, understand digraphs and vowel teams, and build early reading fluency. Tiny Steps uses live 1:1 guidance, assessment-first placement, and parent-visible progress updates so families can follow a clear, level-based phonics path from first sounds to independent reading with confidence.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {intentSupportChips.map((label) => (
              <MetricPill key={label}>{label}</MetricPill>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-4xl text-sm leading-6 text-slate-700">
              Need to compare providers, formats or value? Use our{' '}
              <Link to="/best-online-phonics-classes-for-kids-in-india" className="font-semibold text-slate-900 underline underline-offset-4 hover:text-sky-700">
                dedicated phonics comparison guide
              </Link>{' '}
              or book one free 35-minute 1:1 online demo assessment class to check the right starting level.
            </p>
            <Link to="/book-demo" className="inline-flex shrink-0 items-center justify-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800">
              Check the Starting Level
            </Link>
          </div>
        </PremiumCard>
      </SectionShell>

      <SectionShell id="problems">
        <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white via-sky-50/30 to-orange-50/30 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)] sm:p-8">
          <SectionHeader
            eyebrow="Start with the child, not the course"
            title="Who this page is for"
            subtitle="These parent concerns usually point to decoding, blending, fluency, or spelling gaps."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {parentSearchProblems.map((item, index) => (
              <PremiumCard
                key={item.title}
                className={`p-5 transition hover:-translate-y-0.5 hover:shadow-lg ${index % 2 ? 'bg-sky-50/40' : 'bg-orange-50/40'}`}
              >
                <div
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl text-lg shadow-sm ${
                    index % 2 ? 'bg-sky-50' : 'bg-orange-50'
                  }`}
                >
                  {item.icon}
                </div>
                <h3 className="mt-3 text-base font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">What it may mean</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">{item.explanation}</p>
              </PremiumCard>
            ))}
          </div>
          <div className="mt-6 grid gap-4 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-slate-900">Not sure which gap is causing the reading difficulty?</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-700">
                We check your child&apos;s current level first, then recommend the right phonics path. For a deeper parent guide, start with{' '}
                <Link to="/child-not-reading-properly" className="font-semibold text-slate-900 underline underline-offset-4 hover:text-sky-700">
                  child-not-reading support
                </Link>{' '}
                or read{' '}
                <Link to="/blog/child-knows-letter-sounds-but-cannot-read" className="font-semibold text-slate-900 underline underline-offset-4 hover:text-sky-700">
                  why children know sounds but cannot read words
                </Link>
                .
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/book-demo" className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800">
                Check My Child&apos;s Level
              </Link>
              <Link to="/class-samples" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">
                See Class Samples
              </Link>
            </div>
          </div>
        </div>
      </SectionShell>

      <SectionShell id="choosing-phonics-support">
        <div className="rounded-[2rem] border border-orange-100 bg-gradient-to-br from-[#FFF9F1] via-white to-[#F2FAFF] p-6 shadow-xl sm:p-8">
          <SectionHeader
            eyebrow="Choosing the right support"
            title="How to evaluate an online phonics class for your child"
            subtitle="A useful phonics class should begin at the child’s actual reading level, teach skills cumulatively, correct errors live, and check whether learning transfers into fresh words and connected reading."
          />
          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {classFitCriteria.map((criterion, index) => (
              <PremiumCard key={criterion.title} className="h-full p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex items-center gap-3">
                  <NumberBadge value={index + 1} />
                  <h3 className="text-base font-semibold text-slate-900">{criterion.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-700">{criterion.detail}</p>
              </PremiumCard>
            ))}
          </div>
          <div className="mt-7 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <h3 className="text-lg font-semibold text-slate-900">Want a deeper provider comparison?</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                The dedicated comparison guide covers 1:1 versus group format, curriculum structure, teacher attention, pricing, placement and parent support. This programme page stays focused on how Tiny Steps phonics works.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/best-online-phonics-classes-for-kids-in-india" className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800">
                Open comparison guide
              </Link>
              <Link to="/curriculum?tab=phonics" className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50">
                Review curriculum
              </Link>
            </div>
          </div>
        </div>
      </SectionShell>

      <SectionShell className="py-7 sm:py-8">
        <PremiumCard className="border-slate-200 bg-white p-5 sm:p-7">
          <TestimonialSnippets courseTag="phonics" title="What phonics parents noticed first" />
        </PremiumCard>
      </SectionShell>

      <ContentTrustNote text="This page is created by the Tiny Steps academic team and reviewed by the founder to help parents understand structured phonics and reading development." />

      <ResponsiveTeachingSection
        id="teacher-delivery"
        program="Phonics"
        introduction="Teachers keep the phonics progression cumulative while responding to the child’s decoding behaviour. A lesson uses clear sound and word modelling, guided blending practice, immediate correction and retries before support is reduced."
        steps={[
          { title: 'Model and blend', detail: 'The teacher models the sound–spelling link and how to blend through the whole word without guessing.' },
          { title: 'Observe and correct', detail: 'The child tries known and unfamiliar words while the teacher watches sound accuracy, blending and recurring confusion.' },
          { title: 'Retry and release', detail: 'Prompts, examples, repetition and practice time are adjusted, then support is reduced as decoding becomes secure.' },
        ]}
        observation="sound–spelling accuracy, whether the child blends or guesses, which prerequisite pattern is insecure, and when independent reading is ready to increase."
      />

      <SectionShell id="program">
        <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-sky-50/60 via-white to-orange-50/50 p-3 shadow-xl">
          <div className="px-4 pt-4 sm:px-5 sm:pt-5">
            <SectionHeader
              eyebrow="Choose the right starting level"
              title="Program structure and options"
              subtitle="Ages 3–12, live 1:1 guidance, stage-based progression, and three curriculum levels parents can inspect before deciding."
            />
          </div>
          <ProgramFacts
            ageRange="Ages 3–12"
            format="Live 1:1 online guidance"
            duration="35 minutes per live 1:1 class"
            structure="3 levels, 101 structured lessons with stage-based progression"
            outcomes={[
              'Build sound-letter recognition',
              'Blend sounds into first words',
              'Read CVC words and simple sentences',
              'Progress to digraphs, vowel teams, spelling patterns, and reading fluency',
            ]}
            ctaHref="/book-demo"
          />
          <div className="px-2 pb-2">
            <div className="rounded-3xl border border-slate-200 bg-white/95 shadow-sm">
              <LevelTabs levels={levels} />
            </div>
          </div>
        </div>
      </SectionShell>

      {afterHeroContent}

      <SectionShell id="learning-path">
        <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-sky-50/45 via-white to-slate-50 p-3 shadow-xl">
          <div className="px-6 pt-6">
            <SectionHeader
              eyebrow="Roadmap"
              title="Phonics learning path"
              subtitle="Structured synthetic phonics progression from sound awareness to reading fluency."
            />
          </div>
          <div className="rounded-[1.5rem] bg-white/85">
            <LearningJourney stages={stages} />
          </div>
        </div>
      </SectionShell>

      <SectionShell id="progress">
        <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-sky-50/45 via-white to-orange-50/35 p-3 shadow-xl">
          <div className="px-6 pt-6">
            <AccentBadge>Measurable progress</AccentBadge>
            <h2 className="mt-3 text-2xl font-bold tracking-[-0.02em] text-slate-900 sm:text-3xl">How parents can see progress</h2>
            <p className="mt-2 max-w-4xl text-sm leading-relaxed text-slate-700 sm:text-base">
              Clear milestones, guided correction, and visible improvement checkpoints keep the next learning goal understandable without promising the same timeline for every child.
            </p>
          </div>
          <ProgramProof
            title="Progress parents can track lesson by lesson"
            metrics={[
              { value: 'Fresh-word transfer', label: 'Blending checked on unfamiliar words at the child’s current stage' },
              { value: 'Individual pace', label: 'Progression depends on starting level, retention, accuracy and transfer' },
              { value: 'Stage-based', label: 'Parent-visible progress checkpoints' },
              { value: 'Live 1:1', label: 'Immediate correction, pacing and guided retries' },
            ]}
          />
        </div>
      </SectionShell>

      <SectionShell>
        <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white via-slate-50/60 to-sky-50/40 p-6 shadow-xl sm:p-8">
          <SectionHeader
            eyebrow="Compare the role of each support"
            title="Online phonics classes vs apps vs school reading practice"
            subtitle="A respectful comparison to help parents choose the right support when a child knows letters but still struggles to blend, read, or spell confidently."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {comparisonItems.map((item) => (
              <PremiumCard
                key={item.title}
                className={`h-full p-5 transition hover:-translate-y-0.5 hover:shadow-lg ${
                  item.title === 'Tiny Steps live phonics classes'
                    ? 'border-orange-200 bg-gradient-to-br from-orange-50/85 to-sky-50'
                    : ''
                }`}
              >
                {item.title === 'Tiny Steps live phonics classes' ? (
                  <AccentBadge className="mb-3 border-orange-200 bg-white text-[11px] tracking-[0.06em]">
                    {item.badge}
                  </AccentBadge>
                ) : (
                  <AccentBadge className="mb-3 border-slate-200 bg-white text-[11px] tracking-[0.06em]">
                    {item.badge}
                  </AccentBadge>
                )}
                <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                <div className="mt-2 space-y-2 text-sm leading-relaxed text-slate-700">
                  {item.body.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
                {item.title === 'Tiny Steps live phonics classes' ? (
                  <ul className="mt-3 space-y-1.5 text-xs font-medium text-slate-700">
                    {item.checklist?.map((point) => (
                      <li key={point}>✓ {point}</li>
                    ))}
                  </ul>
                ) : null}
                <p className="mt-3 border-t border-slate-100 pt-2 text-xs font-medium text-slate-600">
                  <span className="font-semibold text-slate-700">{item.footerLabel}:</span> {item.footerText}
                </p>
              </PremiumCard>
            ))}
          </div>
          <p className="mt-5 text-sm leading-relaxed text-slate-700">
            Most children benefit from all three: school reading, home reading, and practice tools. But when a child knows letters and still cannot read words, structured live phonics support helps identify the missing step and rebuild the reading path. Check current{' '}
            <Link to="/phonics-fees-india" className="font-semibold text-slate-900 underline underline-offset-4 hover:text-sky-700">
              phonics fees in India
            </Link>{' '}
            before booking your{' '}
            <Link to="/book-demo" className="font-semibold text-slate-900 underline underline-offset-4 hover:text-sky-700">
              free 35-minute 1:1 online demo assessment class
            </Link>
            .
          </p>
        </div>
      </SectionShell>

      <SectionShell>
        <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white via-orange-50/30 to-sky-50/30 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-8">
          <SectionHeader
            eyebrow="India and worldwide"
            title="Live online phonics classes for families in India and worldwide"
            subtitle="One structured live 1:1 pathway, with class timings matched where teacher availability allows."
          />
          <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
            <div>
              <p className="text-sm leading-relaxed text-slate-700">
                Tiny Steps supports children in India and worldwide through live online classes. Families in India, the UAE, United States, United Kingdom, Australia, Singapore and other locations—including NRI families—can request a free 35-minute 1:1 demo assessment, subject to compatible teacher and class timings.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                Families often combine phonics with{' '}
                <Link to="/reading-classes-for-kids" className="font-semibold text-slate-900 underline underline-offset-4 hover:text-sky-700">
                  reading classes for kids
                </Link>
                ,{' '}
                <Link to="/grammar" className="font-semibold text-slate-900 underline underline-offset-4 hover:text-sky-700">
                  grammar and sentence formation support
                </Link>
                ,{' '}
                <Link to="/speaking" className="font-semibold text-slate-900 underline underline-offset-4 hover:text-sky-700">
                  public speaking and communication classes
                </Link>
                , and broader{' '}
                <Link to="/online-english-classes-for-kids" className="font-semibold text-slate-900 underline underline-offset-4 hover:text-sky-700">
                  online English classes for kids
                </Link>
                .
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">How online delivery helps</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li>✓ One consistent live 1:1 format</li>
                <li>✓ Level-based placement before the pathway begins</li>
                <li>✓ Parent-visible progress independent of location</li>
              </ul>
            </div>
          </div>
        </div>
      </SectionShell>

      {afterContent}

      <SectionShell id="resources">
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-[#1f2a44] p-6 text-white shadow-2xl sm:p-8">
          <div className="pointer-events-none absolute -left-12 top-8 h-40 w-40 rounded-full bg-sky-400/20 blur-2xl" />
          <div className="pointer-events-none absolute -right-10 bottom-8 h-44 w-44 rounded-full bg-orange-400/20 blur-2xl" />
          <div className="relative">
            <SectionHeader
              eyebrow="Research, practice and next steps"
              title="Phonics parent resource hub"
              subtitle="Keep exploring without losing the main learning journey: understand phonics, practise at home, open a specific parent guide, or explore related support."
              tone="light"
            />
            <div className="mt-7 grid gap-4 md:grid-cols-2">
              <PremiumCard className="border-white/20 bg-white p-5 text-slate-900 shadow-xl transition hover:-translate-y-0.5 hover:shadow-2xl">
                <h3 className="text-base font-semibold text-slate-900">📘 What phonics is and how to support it at home</h3>
                <p className="mt-2 text-sm text-slate-700">Understand synthetic phonics, blending, and practical home routines.</p>
                <Link to={PHONICS_RESEARCH_GUIDE_PATH} className="mt-3 inline-flex rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800">
                  Read parent guide
                </Link>
              </PremiumCard>
              <PremiumCard className="border-white/20 bg-white p-5 text-slate-900 shadow-xl transition hover:-translate-y-0.5 hover:shadow-2xl">
                <h3 className="text-base font-semibold text-slate-900">✍️ Free tracing practice for home</h3>
                <p className="mt-2 text-sm text-slate-700">Short sound and letter practice between classes.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link to="/free-letter-tracing-game-for-kids" className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-slate-900 hover:bg-sky-100">
                    Free ABC Tracing Game
                  </Link>
                  <Link to="/letter-tracing-with-sounds-game" className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-slate-900 hover:bg-orange-100">
                    Tracing With Sounds
                  </Link>
                </div>
              </PremiumCard>
            </div>

            <div className="mt-6 rounded-[1.75rem] border border-white/15 bg-white p-4 text-slate-900 shadow-xl sm:p-5">
              <TopicClusterLinks
                className="max-w-none py-2"
                title="Explore specific phonics topics"
                links={[
                  { label: 'What is Phonics for Kids?', href: '/blog/what-is-phonics-for-kids' },
                  { label: 'SATPIN Phonics Guide', href: '/blog/satpin-phonics-guide' },
                  { label: 'Synthetic Phonics vs Traditional', href: '/blog/synthetic-phonics-vs-traditional-reading' },
                  { label: 'Child Knows Sounds but Cannot Read', href: '/blog/child-knows-letter-sounds-but-cannot-read' },
                  { label: 'Why Child is Not Reading Properly', href: '/child-not-reading-properly' },
                  { label: 'Phonics Blending Explained', href: '/blog/phonics-blending-activities' },
                  { label: 'CVC Words Guide', href: '/blog/cvc-words-explained-for-parents' },
                  { label: 'How Kids Learn Blending', href: '/blog/how-kids-learn-blending' },
                  { label: 'Phonics Games for Preschoolers', href: '/phonics-games-for-preschoolers' },
                ]}
              />
              <div className="border-t border-slate-200 pt-3">
                <NextStepsLinks
                  title="Related Tiny Steps support"
                  links={[
                    {
                      label: 'Reading Classes for Kids',
                      href: '/reading-classes-for-kids',
                      description: 'Support route for children who read slowly',
                      icon: '📖'
                    },
                    {
                      label: 'Reading Fluency Program',
                      href: '/reading-fluency-program',
                      description: 'Move from slow decoding to smoother reading',
                      icon: '🚀'
                    },
                    {
                      label: 'Grammar Pathway',
                      href: '/grammar',
                      description: 'Build sentence accuracy after decoding',
                      icon: '✍️'
                    },
                    {
                      label: 'Speaking Pathway',
                      href: '/speaking',
                      description: 'Build communication confidence alongside reading',
                      icon: '🎤'
                    },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      </SectionShell>

      <SectionShell id="faq">
        <div className="rounded-[2rem] border border-sky-100 bg-gradient-to-br from-sky-50/70 via-white to-slate-50 p-6 shadow-xl sm:p-8">
          <SectionHeader
            eyebrow="Remaining parent questions"
            title="Phonics questions parents ask before enrolling"
            subtitle="One place for clear answers before you book one free 35-minute 1:1 online demo assessment class."
          />
          <div className="mt-4 flex flex-wrap items-center gap-2">
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

          <div className="mt-5 space-y-3">
            {faqItems.map((item, index) => {
              const isOpen = openFaqIndexes.includes(index);
              return (
                <article key={item.question} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-slate-50 sm:px-5"
                    aria-expanded={isOpen}
                  >
                    <span className="text-base font-semibold text-slate-900">{item.question}</span>
                    <span className={`text-xl font-bold text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`}>
                      +
                    </span>
                  </button>
                  <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden px-5 pb-5 text-slate-700">
                      <AutoLinkedText text={item.answer} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </SectionShell>

      <SectionShell>
        <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-orange-50/45 via-white to-sky-50/45 p-6 shadow-xl sm:p-8">
          <SectionHeader
            eyebrow="No commitment required"
            title="What happens next?"
            subtitle="We make placement simple, clear, and parent-friendly before any enrollment decision."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {reassuranceSteps.map((step) => (
              <PremiumCard key={step.title} className="p-5">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-lg shadow-sm">
                  {step.icon}
                </div>
                <h3 className="mt-3 text-base font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">{step.detail}</p>
              </PremiumCard>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50/60 px-5 py-4">
            <p className="text-sm font-semibold text-slate-900">What parents receive after the assessment</p>
            <ul className="mt-2 grid gap-1 text-sm text-slate-700 sm:grid-cols-2">
              <li>• Current skill-level summary</li>
              <li>• Recommended starting pathway</li>
              <li>• Suggested at-home practice focus</li>
              <li>• Clear next-step class options</li>
            </ul>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-medium text-slate-600">Booking takes about 2 minutes • no commitment required</p>
            <Link
              to="/book-demo"
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Book Free 35-Minute Demo
            </Link>
          </div>
        </div>
      </SectionShell>

      <SectionShell id="assessment" className="py-14">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-r from-slate-950 via-[#1f2a44] to-[#263e6d] p-8 text-center text-white shadow-2xl sm:p-11 lg:pr-20">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-400/30 blur-2xl" />
          <div className="pointer-events-none absolute -left-12 bottom-0 h-36 w-36 rounded-full bg-sky-300/20 blur-2xl" />
          <p className="mb-4 inline-flex rounded-full border border-emerald-300/40 bg-emerald-300/10 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-emerald-100">
            FREE 35-MINUTE DEMO ASSESSMENT
          </p>
          <h2 className="mb-4 text-2xl font-bold text-white sm:text-3xl">Find the right phonics starting point for your child</h2>
          <p className="mx-auto mb-6 max-w-2xl text-lg text-slate-100">
            Book one free 35-minute 1:1 online demo assessment class to understand your child&apos;s current reading level, phonics gaps, and recommended learning path.
          </p>
          <Link
            to="/book-demo"
            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:bg-slate-100"
          >
            Book Free 35-Minute Demo
          </Link>
          <p className="mt-3 text-sm text-slate-200">No commitment required.</p>
        </div>
      </SectionShell>
    </div>
  );
}
