// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { applySeo } from '../lib/seo';
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

type Tab = 'phonics' | 'grammar' | 'speaking';

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
    const breadcrumb = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
        { '@type': 'ListItem', position: 2, name: 'Curriculum', item: 'https://tinystepslearning.com/curriculum' },
      ],
    };

    applySeo({
      title: "English Curriculum & Syllabus | Phonics, Grammar & Public Speaking Roadmap (Ages 3–12) | Tiny Steps",
      description:
        "A clear, lesson-by-lesson English curriculum for ages 3–12 covering phonics, blending, reading, spelling patterns and grammar with parent-friendly milestones.",
      canonicalPath: "/curriculum",
      ogType: "website",
      jsonLd: [breadcrumb],
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
        title="English Curriculum & Syllabus | Phonics, Grammar & Public Speaking Roadmap (Ages 3–12) | Tiny Steps"
        description="A clear, lesson-by-lesson English curriculum for ages 3–12 covering phonics, blending, reading, spelling patterns and grammar with parent-friendly milestones."
        canonical="https://tinystepslearning.com/curriculum"
      />

      <div className="mx-auto max-w-6xl px-6 pt-8 pb-10">
        <div className="glass-panel soft-grid overflow-hidden px-6 py-10 text-center">
          <div className="gradient-chip mx-auto mb-4 w-max">Cambridge-aligned • Ages 3-15</div>
          <h1 className="font-heading text-3xl md:text-4xl">Tiny Steps Curriculum (Ages 3–12)</h1>
          <p className="mt-3 text-base text-gray-700">Scannable tabs, IB Approaches to Learning call-outs, and immersive lesson-by-lesson details so parents know exactly what’s next.</p>
          <p className="mt-2 text-sm text-gray-600">
            For daily home reinforcement, see our <Link to="/phonics-learning-games" className="font-semibold text-primary-600">phonics learning games</Link> with tracing, sound practice, and a 3-day free trial.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3 text-sm text-gray-600">
            <span className="rounded-full bg-white/80 px-4 py-1">Phonics mastery</span>
            <span className="rounded-full bg-white/80 px-4 py-1">Grammar confidence</span>
            <span className="rounded-full bg-white/80 px-4 py-1">Public speaking courage</span>
          </div>
        </div>
      </div>

      <section aria-labelledby="programs-heading" className="mx-auto max-w-6xl px-6 py-12">
        <h2 id="programs-heading" className="text-3xl font-semibold text-center">Our Programs</h2>
        <p className="mt-2 text-center text-gray-700">Live 1-on-1 classes in phonics, grammar and public speaking—tailored to your child's level.</p>

        <div className="mt-8 grid gap-6 grid-cols-1 md:grid-cols-3">
          <article className="rounded-lg border p-6 shadow-sm">
            <h3 className="text-xl font-medium">Phonics (Ages 3–7)</h3>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li>• Alphabet & letter sounds</li>
              <li>• Blending & digraphs</li>
              <li>• Early reading fluency</li>
              <li>• Fun games & songs</li>
            </ul>
            <div className="mt-4">
              <Link to="/?book=1" className="inline-block rounded bg-primary-500 px-4 py-2 text-white">Book Free Assessment Class</Link>
            </div>
          </article>

          <article className="rounded-lg border p-6 shadow-sm">
            <h3 className="text-xl font-medium">Grammar (Ages 6–12)</h3>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li>• Parts of speech & sentence building</li>
              <li>• Tenses & punctuation</li>
              <li>• Creative writing practice</li>
              <li>• School-aligned reinforcement</li>
            </ul>
            <div className="mt-4">
              <Link to="/?book=1" className="inline-block rounded bg-primary-500 px-4 py-2 text-white">Book Free Assessment Class</Link>
            </div>
          </article>

          <article className="rounded-lg border p-6 shadow-sm">
            <h3 className="text-xl font-medium">Public Speaking (Ages 8–12)</h3>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li>• Storytelling & speech structure</li>
              <li>• Voice, clarity & projection</li>
              <li>• Presentation practice & Q&A</li>
              <li>• Confidence-building activities</li>
            </ul>
            <div className="mt-4">
              <Link to="/?book=1" className="inline-block rounded bg-primary-500 px-4 py-2 text-white">Book Free Assessment Class</Link>
            </div>
          </article>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 pb-6 grid gap-4 md:grid-cols-3">
        <SmartCard title="Phonics pathways" description="Early, Advanced, and Foundations" badge="Ages 3-12">
          <ul className="list-disc pl-5 text-sm text-gray-600">
            <li>SATPIN → vowel teams → multisyllabic strategies</li>
            <li>Lesson mastery checks + decodable reading</li>
          </ul>
        </SmartCard>
        <SmartCard title="Grammar roadmap" description="Basic + Advanced modules" badge="Ages 5-15">
          <ul className="list-disc pl-5 text-sm text-gray-600">
            <li>Parts of speech → complex tenses</li>
            <li>Paragraphs, editing drills, rubric-based outputs</li>
          </ul>
        </SmartCard>
        <SmartCard title="Speaking journey" description="Confidence to commanding stage" badge="Ages 4-15">
          <ul className="list-disc pl-5 text-sm text-gray-600">
            <li>S.P.E.A.K. habits, debates, visual aids</li>
            <li>Recorded feedback + capstone speeches</li>
          </ul>
        </SmartCard>
      </div>

      <IBAlignmentSection />

      <div className="sticky top-28 z-20 border-y border-white/40 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-3 flex flex-wrap gap-3">
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

      <div className="mx-auto max-w-6xl px-6 py-10 space-y-12">
        {tab === 'phonics' && (
          <div key="phonics" className="space-y-10">
            <CollapsibleCard icon={<span>📚</span>} title="Phonics: From Sounds to Fluent Reading" subtext="Cambridge-aligned | Ages 3-12 | Lesson-based tracks" className="glass-panel">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <div className="font-semibold">PHONICS FOUNDATIONS (30 lessons)</div>
                  <ul className="list-disc pl-5 text-sm text-gray-700">
                    <li>Letter sounds + short vowels</li>
                    <li>Build sound confidence and early blending</li>
                    <li>Perfect for ages 3-7 with no reading base</li>
                  </ul>
                </div>
                <div>
                  <div className="font-semibold">EARLY PHONICS (41 lessons)</div>
                  <ul className="list-disc pl-5 text-sm text-gray-700">
                    <li>Sound sets → digraphs → vowel teams</li>
                    <li>Magic E + longer word rules</li>
                    <li>Great for ages 4-8 building reading fluency</li>
                  </ul>
                </div>
                <div>
                  <div className="font-semibold">ADVANCED PHONICS (20 lessons)</div>
                  <ul className="list-disc pl-5 text-sm text-gray-700">
                    <li>Diphthongs → Bossy R → alternate vowels</li>
                    <li>Endings + fluency practice</li>
                    <li>Perfect for ages 6-12 with reading base</li>
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
            <CollapsibleCard icon={<span>📝</span>} title="Grammar: Speaking & Writing Mastery" subtext="Parts of speech → Sentences → Tenses | Lesson-based" className="glass-panel">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="font-semibold">BASIC GRAMMAR (36 lessons)</div>
                  <ul className="list-disc pl-5 text-sm text-gray-700">
                    <li>Nouns → Verbs → Adjectives → Tenses</li>
                    <li>Foundation for clear communication</li>
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
              <h3 className="mb-3 font-heading text-2xl font-bold">Basic Grammar (36 lessons)</h3>
              <WeekAccordion key="basic-grammar" items={getWeeks('basic-grammar')} />
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
            <li><strong>Phonics (3–7):</strong> Letter recognition, phonemic awareness, blends & digraphs, early decoding.</li>
            <li><strong>Grammar (6–12):</strong> Parts of speech, tenses, sentence structure, punctuation, creative writing.</li>
            <li><strong>Public Speaking (8–12):</strong> Story structure, voice control, audience engagement, presentation skills.</li>
          </ul>
          <p className="mt-3 text-sm text-gray-500">Aligned to foundational literacy goals and supporting school curricula.</p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-10" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-2xl font-semibold">Frequently asked questions</h2>
        <div className="mt-6 space-y-4">
          <details className="p-4 border rounded">
            <summary className="font-medium">Do you offer a free trial class?</summary>
            <div className="mt-2 text-gray-700">Yes — book one free 1-on-1 trial to evaluate fit and teacher interaction.</div>
          </details>
          <details className="p-4 border rounded">
            <summary className="font-medium">What age groups do you teach?</summary>
            <div className="mt-2 text-gray-700">We teach ages 3–12, with program tracks tuned to developmental milestones in each range.</div>
          </details>
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
