// @ts-nocheck
import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { applySeo, getRouteConfig } from '../lib/seo';
import { catalogs } from '../content/courses';
import { createCourseListSchema, createFAQPageSchema, PUBLIC_FACTS } from '../lib/schemas';
import AutoLinkedText from '../components/seo/AutoLinkedText';
import { getPublicCoursePathForSlug } from '../lib/publicCoursePages.js';

const coursesSeo = getRouteConfig('/courses');
const coursesSeoTitle = coursesSeo?.title ?? 'English Courses for Kids: Phonics, Grammar and Public Speaking | Tiny Steps Learning';
const coursesSeoDescription =
  coursesSeo?.description ??
  'Compare Tiny Steps English courses for children aged 3–12 across phonics, reading, grammar, sentence formation, and public speaking. Book one free 35-minute 1:1 online demo assessment class to choose the right path.';
const coursesCanonicalPath = coursesSeo?.canonicalPath ?? '/courses';
const coursesCanonicalUrl = `https://tinystepslearning.com${coursesCanonicalPath}`;
const BOOK_ASSESSMENT_HREF = '/book-demo';
const VIEW_PRICING_HREF = '/pricing';
const CORE_PROGRAMS_TEXT = `${PUBLIC_FACTS.corePrograms[0]}, ${PUBLIC_FACTS.corePrograms[1]}, and ${PUBLIC_FACTS.corePrograms[2]}`;

const trustPoints = [
  'Courses for children aged 3–12',
  'Phonics, Grammar, Reading, and Public Speaking paths',
  'Live teacher-guided classes',
  'One free 35-minute 1:1 demo assessment class before course recommendation',
];

const howItWorksSteps = [
  'We understand your child’s age, school level, and parent concerns.',
  'We check reading, phonics, grammar, sentence formation, and speaking confidence based on age.',
  'We identify the strongest starting point: Phonics, Grammar, Reading, Public Speaking, or a combined path.',
  'Parents receive a simple next-step recommendation after the assessment.',
];

const phonicsCards = [
  {
    title: 'Phonics Foundations',
    age: 'Age: 3–5',
    tag: 'Best for beginners',
    focus: ['Recognize letter sounds through structured synthetic phonics', 'Start blending simple words', 'Build confidence in reading'],
    outcome: 'Your child starts reading small words independently',
    href: '/courses/phonics-foundation',
  },
  {
    title: 'Early Phonics',
    age: 'Age: 4–7',
    tag: 'Best for developing readers',
    focus: ['Blend 3–4 letter words', 'Learn digraphs like sh, ch, th', 'Improve decoding skills'],
    outcome: 'Your child reads sentences with confidence',
    href: '/courses/phonics-brush-up',
  },
  {
    title: 'Advanced Phonics',
    age: 'Age: 6–12',
    tag: 'Best for fluent reading',
    focus: ['Long vowels and advanced patterns', 'R-controlled sounds', 'Reading fluency'],
    outcome: 'Your child reads books independently',
    href: '/courses/phonics-advanced',
  },
];

const grammarCards = [
  {
    title: 'Beginner Grammar',
    age: 'Age: 5–10',
    focus: ['Nouns, verbs, adjectives', 'Sentence formation', 'Prepositions and articles'],
    outcome: 'Your child forms correct everyday sentences',
    href: '/courses/grammar',
  },
  {
    title: 'Advanced Grammar',
    age: 'Age: 8–12',
    focus: ['Tenses mastery', 'Complex sentences', 'Paragraph writing'],
    outcome: 'Your child writes and speaks clearly',
    href: '/courses/grammar-mastery',
  },
];

const speakingCards = [
  {
    title: 'Basic Public Speaking',
    age: 'Age: 4–7',
    focus: ['Speak in simple sentences', 'Picture talk', 'Show and tell'],
    outcome: 'Your child starts speaking confidently',
    href: '/courses/public-speaking-foundations',
  },
  {
    title: 'Advanced Public Speaking',
    age: 'Age: 7–12',
    focus: ['Structured speaking', 'Storytelling', 'Presentations and debates'],
    outcome: 'Your child speaks fluently and confidently',
    href: '/courses/public-speaking-excellence',
  },
];

const quickAnswerFaqItems = [
  {
    question: 'Which Tiny Steps course is right for my child?',
    answer:
      'The right course depends on the child’s current level. Children who struggle with reading may need phonics or reading support, while children who make sentence mistakes may need grammar. Children who are shy or give short answers may benefit from public speaking and communication practice.',
  },
  {
    question: 'Should my child start with phonics or grammar?',
    answer:
      'If the child cannot read words confidently, phonics usually comes first. If the child can read but struggles to form correct sentences, grammar and sentence formation may be the better starting point.',
  },
  {
    question: 'Does Tiny Steps offer public speaking classes for kids?',
    answer:
      'Yes. Tiny Steps offers online public speaking and communication classes that help children speak in full sentences, explain ideas, tell stories, and build confidence.',
  },
  {
    question: 'Can one child take more than one course?',
    answer:
      'Yes. Some children may need a combined path, such as phonics with reading fluency or grammar with public speaking, depending on their current level and goals.',
  },
  {
    question: 'How do I know where to start?',
    answer:
      'Parents can book one free 35-minute 1:1 online demo assessment class. The assessment helps identify the child’s current level and recommends the most suitable Tiny Steps course path.',
  },
];
const quickAnswerFaqSchema = {
  ...createFAQPageSchema(quickAnswerFaqItems),
  '@id': 'https://tinystepslearning.com/courses#quick-answer-faq',
};

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
        `Which course should your child start with? Compare Tiny Steps ${CORE_PROGRAMS_TEXT} programs by learning need and starting priority.`,
      url: coursesCanonicalUrl,
      courses: catalogs.map((c) => ({
        id: `https://tinystepslearning.com${getPublicCoursePathForSlug(c.slug) || `/courses/${c.slug}`}`,
        name: c.name,
        description: `${c.duration} live ${c.track} program for ${c.age.toLowerCase()}. ${c.overview.join(', ')}.`,
        url: `https://tinystepslearning.com${getPublicCoursePathForSlug(c.slug) || `/courses/${c.slug}`}`,
        educationalLevel: c.level,
        audienceType: c.age,
        inLanguage: 'en-IN',
      })),
    });

    const mainPathItemListSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': 'https://tinystepslearning.com/courses#main-paths',
      name: 'Tiny Steps core learning paths',
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      numberOfItems: 5,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Phonics', url: 'https://tinystepslearning.com/phonics' },
        { '@type': 'ListItem', position: 2, name: 'Grammar', url: 'https://tinystepslearning.com/grammar' },
        { '@type': 'ListItem', position: 3, name: 'Reading Classes', url: 'https://tinystepslearning.com/reading-classes-for-kids' },
        { '@type': 'ListItem', position: 4, name: 'Public Speaking', url: 'https://tinystepslearning.com/speaking' },
        { '@type': 'ListItem', position: 5, name: 'Courses', url: 'https://tinystepslearning.com/courses' },
      ],
    };

    applySeo({
      title: coursesSeoTitle,
      description: coursesSeoDescription,
      canonicalPath: coursesCanonicalPath,
      ogType: 'website',
      jsonLd: [breadcrumb, courseListSchema, mainPathItemListSchema, quickAnswerFaqSchema],
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
      <section className="px-6 py-14 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-[32px] border border-slate-200/80 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-7 text-white shadow-[0_24px_60px_rgba(15,23,42,0.24)] sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/75">Course Selection Hub</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">Find the Right English Course for Your Child</h1>
            <p className="mt-4 max-w-3xl text-sm text-white/85 sm:text-base">
              Tiny Steps helps children build stronger reading, grammar, sentence formation, and speaking confidence through structured live online classes.
            </p>

            <div className="mt-6 grid gap-2 text-sm text-white/90 sm:grid-cols-2">
              {trustPoints.map((point) => (
                <p key={point}>• {point}</p>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={BOOK_ASSESSMENT_HREF}
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
              >
                Book Free 35-Minute Demo
              </Link>
              <Link
                to={VIEW_PRICING_HREF}
                className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                View Pricing
              </Link>
            </div>

            <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold text-white/90">
              <Link to="/online-english-classes-for-kids" className="underline underline-offset-4">
                Online English Classes for Kids
              </Link>
              <Link to="/spoken-english-classes-for-kids-online" className="underline underline-offset-4">
                Spoken English Classes Online
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="program-overview" className="px-6 py-5 sm:py-7">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-8">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Journey overview</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Which course should my child start with?</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
              Every child starts at a different level. Use this quick guide to pick the best starting point.
            </p>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {[
              {
                title: 'Phonics',
                bestFor: 'Children who know letters but cannot read words confidently, guess while reading, or struggle with blending.',
                ctaLabel: 'Explore Phonics',
                href: '/phonics',
              },
              {
                title: 'Grammar',
                bestFor: 'Children who make sentence mistakes, struggle with tenses, punctuation, articles, prepositions, or writing clear sentences.',
                ctaLabel: 'Explore Grammar',
                href: '/grammar',
              },
              {
                title: 'Reading',
                bestFor: 'Children who read slowly, forget words, avoid reading, or need fluency and comprehension support.',
                ctaLabel: 'Explore Reading Support',
                href: '/reading-classes-for-kids',
              },
              {
                title: 'Public Speaking',
                bestFor: 'Children who give one-word answers, feel shy, speak unclearly, or need confidence while expressing ideas.',
                ctaLabel: 'Explore Public Speaking',
                href: '/speaking',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/80 to-white p-5 shadow-sm"
              >
                <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.bestFor}</p>
                <Link to={item.href} className="mt-4 inline-flex text-sm font-semibold text-slate-900 underline underline-offset-2">
                  {item.ctaLabel}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="phonics-program-section" className="px-6 py-10">
        <div className="mx-auto max-w-6xl mb-8 rounded-[28px] border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-sky-50 p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)] sm:p-8">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Parent FAQs before choosing a course</h2>
          <p className="mt-3 max-w-4xl text-sm text-slate-700 sm:text-base">
            Choose the first course based on your child&apos;s main bottleneck. Reading and blending gaps usually need
            Phonics first, sentence accuracy and writing gaps usually need Grammar first, and hesitation or expression
            gaps usually need Speaking first. This focused start makes progress easier to see and avoids overload.
            Next step: book one assessment to confirm the starting track and level.
          </p>
          <p className="mt-3 max-w-4xl text-sm text-slate-700">
            Parent help reads: <Link to="/blog/child-knows-letter-sounds-but-cannot-read" className="font-medium underline underline-offset-2 hover:text-slate-900">child knows sounds but cannot read words</Link>, <Link to="/blog/how-to-improve-sentence-formation-in-kids" className="font-medium underline underline-offset-2 hover:text-slate-900">improve sentence formation in kids</Link>, and <Link to="/blog/why-child-answers-only-in-one-word" className="font-medium underline underline-offset-2 hover:text-slate-900">child answers only in one word</Link>.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {quickAnswerFaqItems.map((item) => (
              <article key={item.question} className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">{item.question}</h3>
                <p className="mt-2 text-sm text-slate-700">
                  {item.answer}
                </p>
              </article>
            ))}
          </div>
        </div>

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
                    Book Free 35-Minute Demo
                  </a>
                  <Link to={card.href} className="w-full text-center text-[11px] font-medium text-slate-500 underline decoration-slate-300/80 underline-offset-2 transition hover:text-slate-700 sm:w-auto sm:text-left">
                    View course details
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
                    Book Free 35-Minute Demo
                  </a>
                  <Link to={card.href} className="w-full text-center text-[11px] font-medium text-slate-500 underline decoration-slate-300/80 underline-offset-2 transition hover:text-slate-700 sm:w-auto sm:text-left">
                    View course details
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
                    Book Free 35-Minute Demo
                  </a>
                  <Link to={card.href} className="w-full text-center text-[11px] font-medium text-slate-500 underline decoration-slate-300/80 underline-offset-2 transition hover:text-slate-700 sm:w-auto sm:text-left">
                    View course details
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
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">How we recommend the right path</h2>
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

      <section className="px-6 pb-8">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)] sm:p-8">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Common parent situations</h2>
          <p className="mt-3 text-sm text-slate-700">
            For parents in Hyderabad, Tiny Steps offers live online classes across phonics, reading, grammar, sentence formation, and public speaking through{' '}
            <Link to="/online-english-classes-hyderabad" className="font-semibold underline underline-offset-2">
              Online English Classes in Hyderabad
            </Link>
            .
          </p>
          <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">&ldquo;My child knows ABC but cannot read words.&rdquo; → Start with <Link to="/phonics" className="font-semibold underline underline-offset-2">Phonics</Link></p>
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">&ldquo;My child reads but makes many sentence mistakes.&rdquo; → Start with <Link to="/grammar" className="font-semibold underline underline-offset-2">Grammar</Link></p>
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">&ldquo;My child gives one-word answers.&rdquo; → Start with <Link to="/speaking" className="font-semibold underline underline-offset-2">Public Speaking and Sentence Formation</Link></p>
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">&ldquo;My child reads slowly and avoids books.&rdquo; → Start with <Link to="/reading-classes-for-kids" className="font-semibold underline underline-offset-2">Reading Fluency support</Link></p>
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 md:col-span-2">&ldquo;I am not sure where to start.&rdquo; → <Link to={BOOK_ASSESSMENT_HREF} className="font-semibold underline underline-offset-2">Book Free 35-Minute Demo</Link></p>
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
            Book Free 35-Minute Demo
          </a>
          <p className="mt-5 text-xs font-medium text-white/80">Takes 20–30 seconds • No commitment • Get slots instantly on WhatsApp</p>
        </div>
      </section>
    </div>
  );
}

export default CoursesPage;
