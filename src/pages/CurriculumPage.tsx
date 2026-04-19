// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { applySeo, getRouteConfig } from '../lib/seo';
import type { FC } from 'react';
import { WeekAccordion } from '../components/curriculum/WeekAccordion';
import Meta from '../components/common/Meta';
import { loadCurriculumOverrides, type CurriculumOverride } from '../content/curriculumLoader';
import { curriculumBySlug } from '../content/courses';
import type { WeekItem } from '../components/curriculum/WeekAccordion';
import { CollapsibleCard } from '../components/common/CollapsibleCard';
import SmartCard from '../components/ui/SmartCard';
import IBAlignmentSection from '../components/curriculum/IBAlignmentSection';
import { useSearchParams, Link } from 'react-router-dom';
import { createFAQPageSchema, createWebPageSchema, PUBLIC_FACTS } from '../lib/schemas';
import ContentTrustNote from '../components/seo/ContentTrustNote';

type Tab = 'phonics' | 'grammar' | 'speaking';
const CORE_PROGRAMS_TEXT = `${PUBLIC_FACTS.corePrograms[0]}, ${PUBLIC_FACTS.corePrograms[1]}, and ${PUBLIC_FACTS.corePrograms[2]}`;
const curriculumSeo = getRouteConfig('/curriculum');
const curriculumSeoTitle = curriculumSeo?.title ?? 'IB-Aligned English Curriculum | Tiny Steps Learning';
const curriculumSeoDescription =
  curriculumSeo?.description ??
  'See the full learning roadmap across Phonics, Grammar, and Public Speaking, with stage-based progression and clear starting points.';
const curriculumCanonicalPath = curriculumSeo?.canonicalPath ?? '/curriculum';
const curriculumCanonicalUrl =
  curriculumCanonicalPath === '/'
    ? `${PUBLIC_FACTS.primaryWebsite}/`
    : `${PUBLIC_FACTS.primaryWebsite}${curriculumCanonicalPath}`;

const curriculumFaqItems = [
  {
    question: 'What age is this curriculum designed for?',
    answer:
      'The Tiny Steps curriculum is designed as a structured English pathway for children ages 3–12, with level placement based on current skill, not just age.',
  },
  {
    question: 'How do you decide where my child starts?',
    answer:
      'We use a free assessment to identify your child’s current stage in reading, grammar, and speaking, then recommend the most suitable starting point.',
  },
  {
    question: 'How are Phonics, Grammar, and Speaking connected in one curriculum?',
    answer:
      'The curriculum is designed as one connected journey. Children build decoding in phonics, apply language control in grammar, and use both skills for clearer speaking and expression.',
  },
  {
    question: 'How long is each class session in this curriculum?',
    answer:
      `Each live online class runs for ${PUBLIC_FACTS.sessionDuration}, with guided teaching, practice, and teacher feedback in every session.`,
  },
  {
    question: 'Can a child move between pathways as needs change?',
    answer:
      'Yes. Placement is reviewed by skill progression, so children can move to the right next pathway when reading, grammar, or speaking needs shift.',
  },
  {
    question: 'How is this different from school English teaching?',
    answer:
      'School English often follows class pace for everyone. Tiny Steps follows stage-by-stage mastery with live feedback, so your child progresses with clarity and support.',
  },
  {
    question: 'Will this help with spelling mistakes?',
    answer:
      'Yes. As children learn sound patterns, blending, and word families, spelling accuracy improves naturally. We reinforce this through guided practice and correction routines.',
  },
  {
    question: 'Do you teach CBSE / ICSE / IB students?',
    answer:
      'Yes. We support children across CBSE, ICSE, and IB backgrounds. The curriculum focuses on core English skills that transfer well across school systems.',
  },
  {
    question: 'How do parents track progress?',
    answer:
      'Parents receive clear progress updates with what is mastered, what needs reinforcement, and what comes next. This keeps learning transparent and easy to support at home.',
  },
  {
    question: 'Do you give homework or practice activities?',
    answer:
      'Yes. We provide practical home reinforcement between classes. Families can also use our phonics games for daily practice in a low-pressure routine.',
  },
  {
    question: 'What if my child is slow or lacks confidence?',
    answer:
      'That is common, and we handle it with care. We teach at the child’s current level, use supportive routines, and build confidence through small, visible wins.',
  },
];

const quickAnswerFaqItems = [
  {
    question: 'What does the full Tiny Steps learning roadmap include?',
    answer:
      `The roadmap connects ${CORE_PROGRAMS_TEXT} so children build reading, sentence control, writing clarity, and confident expression in a structured sequence.`,
  },
  {
    question: 'How are children placed in the roadmap?',
    answer:
      'Children are placed by current skill level through assessment, then mapped to the most suitable starting stage instead of a fixed age-only track.',
  },
  {
    question: 'How is progression structured across programs?',
    answer:
      'Each pathway follows stage-based milestones, and children move forward when they show readiness in class practice, participation, and application.',
  },
  {
    question: 'What do parents usually notice first after placement?',
    answer:
      'Parents usually notice clearer focus in classes and steadier weekly progress because goals and next steps are mapped in advance.',
  },
];
const schemaFaqItems = [...quickAnswerFaqItems, curriculumFaqItems[3]];

const VALID_TABS = ['phonics', 'grammar', 'speaking'] as const;
type ValidTab = (typeof VALID_TABS)[number];

function isValidTab(v: any): v is ValidTab {
  return VALID_TABS.includes(v);
}

function inferTabFromCourseSlug(courseSlug: string): ValidTab {
  const s = (courseSlug || '').toLowerCase();
  if (s.includes('grammar')) return 'grammar';
  if (s.includes('public-speaking') || s.includes('speaking')) return 'speaking';
  return 'phonics';
}

// Aliases to tolerate slug differences between Courses and Curriculum
const COURSE_SLUG_ALIASES: Record<string, string> = {
  'phonics-foundation': 'phonics-early',
  'phonics-early': 'phonics-foundation',
  'phonics-foundations': 'phonics-brush-up', // backward compat: old name → new key
  'grammar-essentials': 'basic-grammar',
  'grammar-mastery': 'advanced-grammar',
  'public-speaking-foundations': 'basic-public-speaking',
  'public-speaking-excellence': 'advanced-public-speaking',
};

function safeTab(value: string | null): Tab {
  const v = (value ?? '').trim() as Tab;
  return (['phonics', 'grammar', 'speaking'] as Tab[]).includes(v) ? v : 'phonics';
}

function safeCourse(value: string | null): string | null {
  const raw = (value ?? '').trim();
  if (!raw) return null;
  const alt = COURSE_SLUG_ALIASES[raw];
  if (alt && curriculumBySlug?.[alt]) return alt;
  if (curriculumBySlug?.[raw]) return raw;
  return raw;
}
  const CurriculumPage: FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const [tab, setTab] = useState<Tab>(() => safeTab(searchParams.get('tab')));
    const [focusedCourse, setFocusedCourse] = useState<string | null>(() => safeCourse(searchParams.get('course')));

    const [curriculumData, setCurriculumData] = useState<CurriculumOverride | null>(null);
  useEffect(() => {
    loadCurriculumOverrides()
      .then((data) => setCurriculumData(data))
      .catch(() => null);
  }, []);

  useEffect(() => {
    const pageUrl = curriculumCanonicalUrl;
    const breadcrumb = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
        { '@type': 'ListItem', position: 2, name: 'Curriculum', item: pageUrl },
      ],
    };

    const faqSchema = createFAQPageSchema(
      schemaFaqItems.map((item) => ({
        question: item.question,
        answer: item.answer,
      }))
    );

    const webpageSchema = createWebPageSchema({
      name: 'Tiny Steps Curriculum (Ages 3–12)',
      description:
        'What the full learning journey looks like: a structured online roadmap connecting phonics, grammar, and speaking through stage-based progression.',
      url: pageUrl,
    });

    applySeo({
      title: curriculumSeoTitle,
      description: curriculumSeoDescription,
      canonicalPath: curriculumCanonicalPath,
      ogType: "website",
      jsonLd: [breadcrumb, webpageSchema, faqSchema],
    });
  }, []);


  const getWeeks = (courseSlug: string): WeekItem[] => {
    const pickWeeks = (slug: string): WeekItem[] => {
      const overrideWeeks = (curriculumData?.courses?.[slug]?.weeks ?? []) as WeekItem[];
      const baseWeeks = (curriculumBySlug?.[slug]?.weeks ?? []) as WeekItem[];
      if (baseWeeks.length && overrideWeeks.length === baseWeeks.length) {
        return baseWeeks.map((base, idx) => ({
          ...base,
          focus: overrideWeeks[idx]?.focus ?? base.focus,
          learns: overrideWeeks[idx]?.learns ?? base.learns,
          activities: overrideWeeks[idx]?.activities ?? base.activities,
          homework: overrideWeeks[idx]?.homework ?? base.homework,
          mastery: overrideWeeks[idx]?.mastery ?? base.mastery,
        })) as WeekItem[];
      }
      return (baseWeeks.length ? baseWeeks : overrideWeeks) as WeekItem[];
    };

    const primary = pickWeeks(courseSlug);
    if (primary?.length) return primary;

    const alt = COURSE_SLUG_ALIASES[courseSlug];
    if (alt) {
      const secondary = pickWeeks(alt);
      if (secondary?.length) return secondary;
    }

    return [];
  };

  // Keep URL tab in sync when user clicks tabs
  const setTabAndUrl = (nextTab: Tab, courseSlug?: string | null) => {
    const nextSafeTab = safeTab(nextTab as string);
    const nextSafeCourse = courseSlug ? safeCourse(courseSlug) : null;

    setTab(nextSafeTab);
    setFocusedCourse(nextSafeCourse);

    const sp = new URLSearchParams(searchParams);
    sp.set('tab', nextSafeTab);

    if (nextSafeCourse) sp.set('course', nextSafeCourse);
    else sp.delete('course');

    setSearchParams(sp, { replace: true });
  };

  // If URL changes (e.g., coming from Courses page), update tab accordingly
  useEffect(() => {
    const urlTab = safeTab(searchParams.get('tab'));
    const urlCourse = safeCourse(searchParams.get('course'));

    if (urlTab !== tab) setTab(urlTab);
    if (urlCourse !== focusedCourse) setFocusedCourse(urlCourse);
  }, [searchParams, tab, focusedCourse]);

  // After render + after overrides loaded, scroll to the right course section
  useEffect(() => {
    if (!focusedCourse) return;

    const id = `course-${focusedCourse}`;
    const el = document.getElementById(id);
    if (!el) return;

    // small delay so layout settles (accordions/tabs/sticky header)
    window.setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }, [tab, focusedCourse, curriculumData]);

  return (
    <div className="page-gradient relative overflow-hidden">
        <Meta
        title={curriculumSeoTitle}
        description={curriculumSeoDescription}
        canonical={curriculumCanonicalUrl}
      />

      <div className="mx-auto max-w-6xl px-4 pt-8 pb-10 sm:px-6">
        <div className="glass-panel soft-grid overflow-hidden px-5 py-8 text-center sm:px-6 sm:py-10">
          <div className="gradient-chip mx-auto mb-4 w-max">Cambridge-aligned • Ages 3–12</div>
          <h1 className="font-heading text-3xl md:text-4xl">Tiny Steps Curriculum (Ages 3–12)</h1>
          <p className="mt-3 text-base text-gray-700">What does the full learning journey look like? This curriculum maps a clear pathway across phonics, grammar, and speaking so parents know exactly what comes next.</p>
          <p className="mt-2 text-sm text-gray-600">
            For daily home reinforcement, explore our <Link to="/phonics-learning-games" className="font-semibold text-primary-600">phonics games</Link> with tracing, sound practice, and a 3-day free trial.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3 text-sm text-gray-600">
            <span className="rounded-full bg-white/80 px-4 py-1">Phonics mastery</span>
            <span className="rounded-full bg-white/80 px-4 py-1">Grammar confidence</span>
            <span className="rounded-full bg-white/80 px-4 py-1">Public speaking courage</span>
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-4 pb-6 sm:px-6">
        <div className="glass-panel p-6 md:p-7">
          <h2 className="text-2xl font-semibold text-gray-900">What does the full learning journey look like?</h2>
          <p className="mt-3 text-sm text-gray-700 md:text-base">
            The journey is structured in pathways and levels, not random topics. Each stage builds on the previous
            one: phonics foundations support grammar control, and both support confident speaking. Parents can track
            what is mastered, what comes next, and when a child is ready to progress. Next step: use assessment
            placement to start at the right entry point.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {quickAnswerFaqItems.map((item) => (
              <article key={item.question} className="rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900">{item.question}</h3>
                <p className="mt-2 text-sm text-gray-700">{item.answer}</p>
              </article>
            ))}
          </div>

          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-900">Curriculum includes:</p>
            <ul className="mt-2 grid gap-2 text-sm text-gray-700 md:grid-cols-3">
              <li className="rounded-full bg-white/80 px-4 py-2">Phonics and reading foundations</li>
              <li className="rounded-full bg-white/80 px-4 py-2">Grammar and sentence building</li>
              <li className="rounded-full bg-white/80 px-4 py-2">Speaking and communication confidence</li>
            </ul>
          </div>
        </div>
      </section>

      <ContentTrustNote text="This curriculum page is created by the Tiny Steps academic team and reviewed by the founder to keep program pathways clear, practical, and child-friendly for families." />

      <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        <h2 className="text-2xl font-semibold text-gray-900">Proof: how the curriculum roadmap builds stage by stage</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {[
            'Phase 1: Sound and reading foundations through phonics progression',
            'Phase 2: Sentence and grammar control for clear writing accuracy',
            'Phase 3: Expression and speaking structure for confident communication',
            'Phase 4: Ongoing progression based on readiness, not random topic order',
          ].map((item) => (
            <div key={item} className="rounded-2xl border border-gray-200 bg-white/80 px-5 py-4 shadow-sm">
              <p className="text-sm font-medium text-gray-800 md:text-base">{item}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-gray-700">
          Next step: once your child is placed, follow the roadmap stage by stage rather than switching topics randomly.
        </p>
      </section>

      <section aria-labelledby="programs-heading" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 id="programs-heading" className="text-2xl font-semibold text-center sm:text-3xl">Our Programs</h2>
        <p className="mt-2 text-center text-gray-700">Live online 1-on-1 classes in the <Link to="/phonics" className="font-semibold text-primary-600">phonics program</Link>, <Link to="/grammar" className="font-semibold text-primary-600">grammar program</Link>, and <Link to="/speaking" className="font-semibold text-primary-600">speaking program</Link>—tailored to your child’s level.</p>

        <div className="mt-8 grid gap-6 grid-cols-1 md:grid-cols-3">
          <article className="rounded-lg border p-6 shadow-sm">
            <h3 className="text-xl font-medium">Phonics Pathway (Ages 3–12)</h3>
            <p className="mt-2 text-sm text-gray-600">Best for early learners and children building synthetic phonics and phonics-based reading confidence.</p>
            <details className="mt-3 rounded-lg border border-gray-200 bg-white/80 p-3 text-left">
              <summary className="text-sm font-semibold text-gray-900">▶ What is Jolly Phonics? (and how we use it)</summary>
              <p className="mt-2 text-sm text-gray-700">
                Jolly Phonics is a popular synthetic phonics method that teaches children to read by connecting sounds with letters and blending them into words.
              </p>
              <p className="mt-2 text-sm text-gray-700">
                Our phonics program is based on synthetic phonics principles, including techniques used in Jolly Phonics.
              </p>
              <p className="mt-2 text-sm text-gray-700">
                Tiny Steps uses a structured synthetic phonics approach inspired by Jolly Phonics to help children read confidently.
              </p>
            </details>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li>• Alphabet & letter sounds</li>
              <li>• Blending & digraphs</li>
              <li>• Early reading fluency</li>
              <li>• Fun games & songs</li>
            </ul>
            <p className="mt-3 text-sm font-medium text-gray-800">Outcome: Your child reads with better accuracy and confidence.</p>
            <div className="mt-4">
              <Link to="/?book=1" className="inline-block rounded bg-primary-500 px-4 py-2 text-white">Book Free Assessment Class</Link>
            </div>
          </article>

          <article className="rounded-lg border p-6 shadow-sm">
            <h3 className="text-xl font-medium">Grammar Pathway (Ages 3–12)</h3>
            <p className="mt-2 text-sm text-gray-600">Best for children who can read but need stronger sentence control.</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li>• Parts of speech & sentence building</li>
              <li>• Tenses & punctuation</li>
              <li>• Creative writing practice</li>
              <li>• School-aligned reinforcement</li>
            </ul>
            <p className="mt-3 text-sm font-medium text-gray-800">Outcome: Your child builds correct, usable grammar in daily writing and speech.</p>
            <div className="mt-4">
              <Link to="/?book=1" className="inline-block rounded bg-primary-500 px-4 py-2 text-white">Book Free Assessment Class</Link>
            </div>
          </article>

          <article className="rounded-lg border p-6 shadow-sm">
            <h3 className="text-xl font-medium">Speaking Pathway (Ages 3–12)</h3>
            <p className="mt-2 text-sm text-gray-600">Best for children ready to improve confidence and expression.</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li>• Storytelling & speech structure</li>
              <li>• Voice, clarity & projection</li>
              <li>• Presentation practice & Q&A</li>
              <li>• Confidence-building activities</li>
            </ul>
            <p className="mt-3 text-sm font-medium text-gray-800">Outcome: Your child speaks with more clarity, structure, and confidence.</p>
            <div className="mt-4">
              <Link to="/?book=1" className="inline-block rounded bg-primary-500 px-4 py-2 text-white">Book Free Assessment Class</Link>
            </div>
          </article>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pb-6 sm:px-6">
        <p className="mb-4 text-sm text-gray-700">How your child progresses step by step inside each program</p>
        <div className="grid gap-4 md:grid-cols-3">
        <SmartCard title="Phonics learning journey" description="Early, Advanced, and Foundations" badge="Ages 3–12">
          <ul className="list-disc pl-5 text-sm text-gray-600">
            <li>SATPIN → vowel teams → multisyllabic strategies</li>
            <li>Progression from sound recognition to fluent decoding routines</li>
          </ul>
        </SmartCard>
        <SmartCard title="Grammar learning journey" description="Basic + Advanced modules" badge="Ages 3–12">
          <ul className="list-disc pl-5 text-sm text-gray-600">
            <li>Parts of speech → complex tenses</li>
            <li>Progression from sentence basics to structured writing control</li>
          </ul>
        </SmartCard>
        <SmartCard title="Speaking learning journey" description="Confidence to commanding stage" badge="Ages 3–12">
          <ul className="list-disc pl-5 text-sm text-gray-600">
            <li>S.P.E.A.K. habits, debates, visual aids</li>
            <li>Progression from guided speaking to independent presentation skills</li>
          </ul>
        </SmartCard>
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6" aria-labelledby="difference-heading">
        <h2 id="difference-heading" className="text-2xl font-semibold text-gray-900">Why Tiny Steps curriculum feels different</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {[
            {
              title: 'Structured progression',
              text: 'Children move through a clear pathway instead of random topic jumps.',
            },
            {
              title: 'Live teacher guidance',
              text: 'Real-time feedback helps children apply learning, not just watch lessons.',
            },
            {
              title: 'Stage-by-stage mastery',
              text: 'Advancement is based on readiness and confidence, not guesswork.',
            },
            {
              title: 'Parent visibility',
              text: 'You get clear updates on progress, next targets, and support areas.',
            },
          ].map((item) => (
            <article key={item.title} className="rounded-2xl border border-gray-200 bg-white/80 p-5 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900">{item.title}</h3>
              <p className="mt-2 text-sm text-gray-700">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <IBAlignmentSection />
      <div className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <p className="rounded-2xl border border-gray-100 bg-white/75 px-5 py-4 text-sm text-gray-700">
          In simple terms, children do not just learn English content — they also learn to think clearly, express ideas, reflect, and communicate with confidence.
        </p>
      </div>

      <div className="sticky top-28 z-20 border-y border-white/40 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-2.5 px-4 py-3 sm:gap-3 sm:px-6">
          {(['phonics','grammar','speaking'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTabAndUrl(t)}
              className={`pointer-events-auto hover-highlight rounded-full px-4 py-2 text-sm font-semibold transition ${tab===t?'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg':'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              {t[0].toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6">
        {tab === 'phonics' && (
          <div key="phonics" className="space-y-10">
            <CollapsibleCard icon={<span>📚</span>} title="Phonics: From Sounds to Fluent Reading" subtext="Cambridge-aligned | Ages 3–12 | Lesson-based tracks" className="glass-panel">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <div className="font-semibold">PHONICS FOUNDATIONS (30 lessons)</div>
                  <ul className="list-disc pl-5 text-sm text-gray-700">
                    <li>Letter sounds + short vowels</li>
                    <li>Build sound confidence and early blending</li>
                    <li>Perfect for ages 3–7 with no reading base</li>
                  </ul>
                </div>
                <div>
                  <div className="font-semibold">EARLY PHONICS (41 lessons)</div>
                  <ul className="list-disc pl-5 text-sm text-gray-700">
                    <li>Sound sets → digraphs → vowel teams</li>
                    <li>Magic E + longer word rules</li>
                    <li>Great for ages 4–8 building reading fluency</li>
                  </ul>
                </div>
                <div>
                  <div className="font-semibold">ADVANCED PHONICS (20 lessons)</div>
                  <ul className="list-disc pl-5 text-sm text-gray-700">
                    <li>Diphthongs → Bossy R → alternate vowels</li>
                    <li>Endings + fluency practice</li>
                    <li>Perfect for ages 6–12 with reading base</li>
                  </ul>
                </div>
              </div>
            </CollapsibleCard>

            <div id="course-phonics-foundation" className={`glass-panel p-6 scroll-mt-36 ${focusedCourse === 'phonics-foundation' ? 'ring-2 ring-primary-300' : ''}`}>
              <h3 className="mb-3 font-heading text-2xl font-bold">Phonics Foundations (30 lessons)</h3>
              <WeekAccordion key="phonics-foundation" items={getWeeks('phonics-foundation')} />
            </div>

            <div id="course-phonics-advanced" className={`glass-panel p-6 scroll-mt-36 ${focusedCourse === 'phonics-advanced' ? 'ring-2 ring-primary-300' : ''}`}>
              <h3 className="mb-3 font-heading text-2xl font-bold">Advanced Phonics (20 lessons)</h3>
              <WeekAccordion key="phonics-advanced" items={getWeeks('phonics-advanced')} />
            </div>

            <div id="course-phonics-brush-up" className={`glass-panel p-6 scroll-mt-36 ${focusedCourse === 'phonics-brush-up' ? 'ring-2 ring-primary-300' : ''}`}>
              <h3 className="mb-3 font-heading text-2xl font-bold">Early Phonics (41 lessons)</h3>
              <WeekAccordion key="phonics-brush-up" items={getWeeks('phonics-brush-up')} />
            </div>
          </div>
        )}

        {tab === 'grammar' && (
          <div key="grammar" className="space-y-10">
            <CollapsibleCard icon={<span>📝</span>} title="Grammar: Speaking & Writing Mastery" subtext="Beginner grammar foundations to advanced writing skills | Lesson-based" className="glass-panel">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="font-semibold">BEGINNER GRAMMAR (36 lessons)</div>
                  <ul className="list-disc pl-5 text-sm text-gray-700">
                    <li>Word foundations → Grammar basics → Sentence building → Tenses → Guided writing</li>
                    <li>Child-friendly progression for clear, confident sentence writing</li>
                  </ul>
                </div>
                <div>
                  <div className="font-semibold">ADVANCED GRAMMAR (36 lessons)</div>
                  <ul className="list-disc pl-5 text-sm text-gray-700">
                    <li>All 12 tenses → Complex sentences → Advanced punctuation</li>
                    <li>Essay/presentation ready</li>
                  </ul>
                </div>
              </div>
            </CollapsibleCard>

            <div id="course-basic-grammar" className={`glass-panel p-6 scroll-mt-36 ${focusedCourse === 'basic-grammar' ? 'ring-2 ring-primary-300' : ''}`}>
              <h3 className="mb-3 font-heading text-2xl font-bold">Beginner Grammar Curriculum (36 lessons)</h3>
              <p className="mb-4 text-sm text-gray-700 md:text-base">
                Our Beginner Grammar program helps children build strong sentence foundations step by step. They learn word types, grammar basics, punctuation, sentence building, tenses, and guided writing in a simple and child-friendly way.
              </p>
              <WeekAccordion key="basic-grammar" items={getWeeks('basic-grammar')} />
              <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50/80 p-4 text-sm text-gray-700">
                <p className="font-semibold text-gray-900">Classroom Flow</p>
                <p className="mt-2">This is the Beginner Grammar curriculum outline only. Actual lesson delivery can follow the Tiny Steps classroom flow:</p>
                <ul className="mt-2 list-disc pl-5">
                  <li>Tuning In</li>
                  <li>Inquiry</li>
                  <li>Concept Building</li>
                  <li>Guided Practice</li>
                  <li>Application</li>
                  <li>Reflection</li>
                </ul>
              </div>
            </div>

            <div id="course-advanced-grammar" className={`glass-panel p-6 scroll-mt-36 ${focusedCourse === 'advanced-grammar' ? 'ring-2 ring-primary-300' : ''}`}>
              <h3 className="mb-3 font-heading text-2xl font-bold">Advanced Grammar (36 lessons)</h3>
              <WeekAccordion key="advanced-grammar" items={getWeeks('advanced-grammar')} />
            </div>
          </div>
        )}

        {tab === 'speaking' && (
          <div key="speaking" className="space-y-10">
            <CollapsibleCard icon={<span>🎤</span>} title="Public Speaking: Confidence to Expertise" subtext="Find your voice → Speak with structure | Lesson-based" className="glass-panel">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="font-semibold">BASIC PUBLIC SPEAKING (36 lessons)</div>
                  <ul className="list-disc pl-5 text-sm text-gray-700">
                    <li>Confidence → Clear voice & body language</li>
                    <li>From 15–45s talks to structured stories</li>
                  </ul>
                </div>
                <div>
                  <div className="font-semibold">ADVANCED PUBLIC SPEAKING (36 lessons)</div>
                  <ul className="list-disc pl-5 text-sm text-gray-700">
                    <li>Hook‑Body‑Close → Persuade & debate</li>
                    <li>From 60–120s speeches to presentations</li>
                  </ul>
                </div>
              </div>
            </CollapsibleCard>

            <div id="course-basic-public-speaking" className={`glass-panel p-6 scroll-mt-36 ${focusedCourse === 'basic-public-speaking' ? 'ring-2 ring-primary-300' : ''}`}>
              <h3 className="mb-3 font-heading text-2xl font-bold">Basic Public Speaking (36 lessons)</h3>
              <WeekAccordion key="basic-public-speaking" items={getWeeks('basic-public-speaking')} />
            </div>

            <div id="course-advanced-public-speaking" className={`glass-panel p-6 scroll-mt-36 ${focusedCourse === 'advanced-public-speaking' ? 'ring-2 ring-primary-300' : ''}`}>
              <h3 className="mb-3 font-heading text-2xl font-bold">Advanced Public Speaking (36 lessons)</h3>
              <WeekAccordion key="advanced-public-speaking" items={getWeeks('advanced-public-speaking')} />
            </div>
          </div>
        )}

      </div>

      <section className="bg-gray-50 py-10 px-4" aria-labelledby="curriculum-breakdown">
        <div className="max-w-4xl mx-auto">
          <h2 id="curriculum-breakdown" className="text-2xl font-semibold">Curriculum Breakdown</h2>
          <ul className="mt-4 space-y-3 text-gray-700">
            <li><strong>Phonics pathway (Ages 3–12):</strong> Letter recognition, phonemic awareness, blends & digraphs, and decoding that supports confident reading.</li>
            <li><strong>Grammar pathway (Ages 3–12):</strong> Word types, sentence building, punctuation, tenses, and guided writing children can apply in school and beyond.</li>
            <li><strong>Speaking pathway (Ages 3–12):</strong> Story structure, voice control, audience engagement, and presentation confidence built step by step.</li>
          </ul>
          <p className="mt-3 text-sm text-gray-500">Aligned to foundational literacy goals and designed to support school expectations with clearer communication outcomes.</p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-10" aria-labelledby="who-for-heading">
        <h2 id="who-for-heading" className="text-2xl font-semibold">Who this curriculum is designed for</h2>
        <ul className="mt-5 space-y-3 text-gray-700">
          <li>• Your child knows letters but cannot blend words yet.</li>
          <li>• Your child reads a little but lacks fluency and confidence.</li>
          <li>• Your child struggles to build sentences correctly.</li>
          <li>• Your child feels shy while speaking or presenting.</li>
          <li>• You want structured progression, not random worksheets.</li>
        </ul>
        <p className="mt-4 text-sm text-gray-700">
          If this sounds familiar, start with a free assessment and we will place your child at the right stage.
          {' '}
          <Link to="/?book=1" className="font-semibold text-primary-600">Book Free Assessment Class</Link>
        </p>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-10" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-2xl font-semibold">Frequently asked questions</h2>
        <div className="mt-6 space-y-4">
          {curriculumFaqItems.map((item) => (
            <details key={item.question} className="p-4 border rounded bg-white/80">
              <summary className="font-medium">{item.question}</summary>
              <div className="mt-2 text-gray-700">{item.answer}</div>
            </details>
          ))}
        </div>
      </section>

      {/* Sticky CTA for mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 md:hidden z-50">
        <Link to="/?book=1" className="block w-full text-center bg-primary-500 text-white py-3 rounded font-semibold">Book Free Assessment Class</Link>
      </div>

    </div>
  );
};

export default CurriculumPage;
