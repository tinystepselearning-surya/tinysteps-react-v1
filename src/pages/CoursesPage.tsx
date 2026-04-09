// @ts-nocheck
import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { applySeo, getRouteConfig } from '../lib/seo';
import { catalogs } from '../content/courses';
import { createCourseListSchema } from '../lib/schemas';
import AutoLinkedText from '../components/seo/AutoLinkedText';

const coursesSeo = getRouteConfig('/courses');
const coursesCanonicalPath = coursesSeo?.canonicalPath ?? '/courses';
const coursesCanonicalUrl = `https://tinystepslearning.com${coursesCanonicalPath}`;
const BOOK_ASSESSMENT_HREF = '/courses?book=1';

const trustPoints = [
  '1:1 personalized attention',
  'Structured curriculum',
  'Weekly parent updates',
  'Age-appropriate learning paths',
  'AI-supported practice',
  'International teaching quality',
];

const howItWorksSteps = [
  'Book free assessment',
  'We understand your child’s level',
  'Get a personalized learning plan',
  'Start classes with expert teachers',
];

const phonicsCards = [
  {
    title: 'Phonics Foundations',
    age: 'Age: 3–5',
    tag: 'Best for beginners',
    focus: ['Recognize letter sounds through structured synthetic phonics', 'Start blending simple words', 'Build confidence in reading'],
    outcome: 'Your child starts reading small words independently',
  },
  {
    title: 'Early Phonics',
    age: 'Age: 4–7',
    tag: 'Best for developing readers',
    focus: ['Blend 3–4 letter words', 'Learn digraphs like sh, ch, th', 'Improve decoding skills'],
    outcome: 'Your child reads sentences with confidence',
  },
  {
    title: 'Advanced Phonics',
    age: 'Age: 6–12',
    tag: 'Best for fluent reading',
    focus: ['Long vowels and advanced patterns', 'R-controlled sounds', 'Reading fluency'],
    outcome: 'Your child reads books independently',
  },
];

const grammarCards = [
  {
    title: 'Beginner Grammar',
    age: 'Age: 5–10',
    focus: ['Nouns, verbs, adjectives', 'Sentence formation', 'Prepositions and articles'],
    outcome: 'Your child forms correct everyday sentences',
  },
  {
    title: 'Advanced Grammar',
    age: 'Age: 8–15',
    focus: ['Tenses mastery', 'Complex sentences', 'Paragraph writing'],
    outcome: 'Your child writes and speaks clearly',
  },
];

const speakingCards = [
  {
    title: 'Basic Public Speaking',
    age: 'Age: 4–7',
    focus: ['Speak in simple sentences', 'Picture talk', 'Show and tell'],
    outcome: 'Your child starts speaking confidently',
  },
  {
    title: 'Advanced Public Speaking',
    age: 'Age: 7–15',
    focus: ['Structured speaking', 'Storytelling', 'Presentations and debates'],
    outcome: 'Your child speaks fluently and confidently',
  },
];

function CoursesPage() {
  const phonicsUsedHrefs = useMemo(() => new Set<string>(), []);
  const grammarUsedHrefs = useMemo(() => new Set<string>(), []);
  const speakingUsedHrefs = useMemo(() => new Set<string>(), []);

  useEffect(() => {
    const breadcrumb = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
        { '@type': 'ListItem', position: 2, name: 'Courses', item: coursesCanonicalUrl },
      ],
    };

    const courseListSchema = createCourseListSchema({
      name: 'Tiny Steps English courses for kids',
      description:
        'Browse Tiny Steps online phonics, grammar, and speaking programs for kids with clear learning paths and parent-visible outcomes.',
      url: coursesCanonicalUrl,
      courses: catalogs.map((c) => ({
        id: `https://tinystepslearning.com/courses/${c.slug}`,
        name: c.name,
        description: `${c.duration} live ${c.track} program for ${c.age.toLowerCase()}. ${c.overview.join(', ')}.`,
        url: `https://tinystepslearning.com/courses/${c.slug}`,
        educationalLevel: c.level,
        audienceType: c.age,
        inLanguage: 'en-IN',
      })),
    });

    applySeo({
      title:
        coursesSeo?.title ??
        'Online English Courses for Kids | Phonics, Grammar & Speaking | Tiny Steps Learning',
      description:
        coursesSeo?.description ??
        'Explore Tiny Steps phonics, grammar, and speaking programs for kids with structured progression, clear outcomes, and live mentor support, including synthetic phonics foundations in the phonics track.',
      canonicalPath: coursesCanonicalPath,
      ogType: 'website',
      jsonLd: [breadcrumb, courseListSchema],
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
      <section className="px-6 py-14 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-[32px] border border-slate-200/80 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-7 text-white shadow-[0_24px_60px_rgba(15,23,42,0.24)] sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/75">Trusted by families across 15+ countries</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">A Complete English Learning Journey for Your Child</h1>
            <p className="mt-4 max-w-3xl text-sm text-white/85 sm:text-base">
              <AutoLinkedText text="Phonics, grammar, and confident speaking — taught step by step with clarity, care, and proven results." />
            </p>

            <div className="mt-7 flex flex-wrap gap-3 sm:gap-3.5">
              <span className="rounded-full border border-white/30 bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold leading-none">4.9/5 parent satisfaction</span>
              <span className="rounded-full border border-white/30 bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold leading-none">Trusted by 250+ families</span>
              <span className="rounded-full border border-white/30 bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold leading-none">Weekly progress updates</span>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={BOOK_ASSESSMENT_HREF}
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
              >
                Book Free Assessment
              </a>
              <a
                href="#program-overview"
                className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Explore Programs
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="program-overview" className="px-6 py-5 sm:py-7">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-8">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Journey overview</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Choose the Right Starting Point</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
              <AutoLinkedText text="Every child starts at a different level. We guide them step by step to confident English." />
            </p>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-3">
            {[
              { title: 'Phonics', subtitle: 'Build reading', icon: '🔤' },
              { title: 'Grammar', subtitle: 'Build sentences', icon: '✍️' },
              { title: 'Speaking', subtitle: 'Build confidence', icon: '🎤' },
            ].map((item, index) => (
              <div
                key={item.title}
                role="button"
                tabIndex={0}
                onClick={() => {
                  const sectionId = `${item.title.toLowerCase()}-program-section`;
                  document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    const sectionId = `${item.title.toLowerCase()}-program-section`;
                    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="group relative cursor-pointer rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/80 to-white p-5 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-300/80"
              >
                <p className="mx-auto mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-base">{item.icon}</p>
                <p className="text-lg font-bold text-slate-900">{item.title}</p>
                <p className="mt-1 text-sm font-medium text-slate-600">{item.subtitle}</p>
                <p className="mt-3 text-base font-semibold text-slate-400 transition-transform duration-200 group-hover:translate-x-1">→</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="phonics-program-section" className="px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Phonics Program — From Sounds to Reading Confidence</h2>
          <p className="mt-3 max-w-3xl text-sm text-slate-700 sm:text-base">
            <AutoLinkedText text="Your child learns to read naturally — not by memorizing, but by understanding sounds." />
          </p>
          <p className="mt-2 max-w-3xl text-sm text-slate-700 sm:text-base">
            <AutoLinkedText text="Our phonics track follows a structured synthetic phonics approach inspired by methods such as Jolly Phonics." />
          </p>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {phonicsCards.map((card) => (
              <article key={card.title} className="flex h-full flex-col rounded-3xl border border-emerald-100/80 bg-gradient-to-b from-emerald-50/35 to-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">{card.tag}</p>
                <h3 className="mt-2 text-xl font-bold text-slate-900">{card.title}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-600">{card.age}</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-700">
                  {card.focus.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span><AutoLinkedText text={point} usedHrefs={phonicsUsedHrefs} /></span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">Outcome: <AutoLinkedText text={card.outcome} usedHrefs={phonicsUsedHrefs} /></p>
                <div className="mt-5 flex flex-wrap items-center gap-2.5 sm:justify-between sm:gap-3">
                  <a
                    href={BOOK_ASSESSMENT_HREF}
                    className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
                  >
                    Book Free Assessment
                  </a>
                  <Link to="/curriculum" className="w-full text-center text-[11px] font-medium text-slate-500 underline decoration-slate-300/80 underline-offset-2 transition hover:text-slate-700 sm:w-auto sm:text-left">
                    View Full Curriculum
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="grammar-program-section" className="px-6 py-7">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-sky-100/90 bg-gradient-to-r from-sky-50/45 to-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)] sm:p-8">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Grammar Program — From Words to Clear Sentences</h2>
          <p className="mt-3 max-w-3xl text-sm text-slate-700 sm:text-base">
            <AutoLinkedText text="Structured progression from sentence basics to fluent writing and expression." />
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {grammarCards.map((card) => (
              <article key={card.title} className="flex h-full flex-col rounded-3xl border border-sky-100/80 bg-gradient-to-b from-sky-50/25 to-white p-6 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900">{card.title}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-600">{card.age}</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-700">
                  {card.focus.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-500" />
                      <span><AutoLinkedText text={point} usedHrefs={grammarUsedHrefs} /></span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 rounded-xl bg-sky-50 px-3 py-2 text-sm font-medium text-sky-900">Outcome: <AutoLinkedText text={card.outcome} usedHrefs={grammarUsedHrefs} /></p>
                <div className="mt-5 flex flex-wrap items-center gap-2.5 sm:justify-between sm:gap-3">
                  <a
                    href={BOOK_ASSESSMENT_HREF}
                    className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
                  >
                    Book Free Assessment
                  </a>
                  <Link to="/curriculum" className="w-full text-center text-[11px] font-medium text-slate-500 underline decoration-slate-300/80 underline-offset-2 transition hover:text-slate-700 sm:w-auto sm:text-left">
                    View Full Curriculum
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="speaking-program-section" className="px-6 py-10">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-amber-100/80 bg-gradient-to-r from-amber-50/40 to-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)] sm:p-8">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Speaking Program — From Confidence to Expression</h2>
          <p className="mt-3 max-w-3xl text-sm text-slate-700 sm:text-base">
            <AutoLinkedText text="Your child learns to communicate clearly, confidently, and naturally in real-life situations." />
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {speakingCards.map((card) => (
              <article key={card.title} className="flex h-full flex-col rounded-3xl border border-amber-100/80 bg-gradient-to-b from-amber-50/25 to-white p-6 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900">{card.title}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-600">{card.age}</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-700">
                  {card.focus.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                      <span><AutoLinkedText text={point} usedHrefs={speakingUsedHrefs} /></span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">Outcome: <AutoLinkedText text={card.outcome} usedHrefs={speakingUsedHrefs} /></p>
                <div className="mt-5 flex flex-wrap items-center gap-2.5 sm:justify-between sm:gap-3">
                  <a
                    href={BOOK_ASSESSMENT_HREF}
                    className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
                  >
                    Book Free Assessment
                  </a>
                  <Link to="/curriculum" className="w-full text-center text-[11px] font-medium text-slate-500 underline decoration-slate-300/80 underline-offset-2 transition hover:text-slate-700 sm:w-auto sm:text-left">
                    View Full Curriculum
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-6">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-8">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Why Parents Choose Tiny Steps</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {trustPoints.map((point) => (
              <div key={point} className="flex items-start gap-3 rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white to-slate-50 px-4 py-3.5 text-sm font-medium text-slate-700 shadow-sm">
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-xs text-emerald-700">✓</span>
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-10">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)] sm:p-8">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">How It Works</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-4">
            {howItWorksSteps.map((step, index) => (
              <div key={step} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Step {index + 1}</p>
                <p className="mt-2 font-semibold text-slate-900">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-16 pt-4">
        <div className="mx-auto max-w-6xl rounded-[32px] border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-7 text-center text-white shadow-[0_24px_60px_rgba(15,23,42,0.24)] sm:p-10">
          <h2 className="text-2xl font-bold sm:text-3xl">Start Your Child’s English Journey Today</h2>
          <p className="mt-3 text-sm text-white/85 sm:text-base">No pressure. Just the right start.</p>
          <a
            href={BOOK_ASSESSMENT_HREF}
            className="mt-7 inline-flex items-center justify-center rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-slate-900 shadow-[0_10px_26px_rgba(255,255,255,0.2)] transition hover:-translate-y-0.5 hover:bg-slate-100"
          >
            Book Free Assessment Now
          </a>
          <p className="mt-5 text-xs font-medium text-white/80">Takes 20–30 seconds • No commitment • Get slots instantly on WhatsApp</p>
        </div>
      </section>
    </div>
  );
}

export default CoursesPage;
