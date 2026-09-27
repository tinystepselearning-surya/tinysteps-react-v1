import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PUBLIC_AGE_RANGE_LABEL,
  PUBLIC_SESSION_DURATION_LABEL,
  PUBLIC_SITE_FACTS,
  formatPublicInr,
} from '../../config/publicFacts';
import { applySeo } from '../../lib/seo';
import { buildSpeakableSpecification } from '../../lib/breadcrumbAeoGeoRegistry.js';
import { createCourseSchema, createFAQPageSchema, createWebPageSchema, PUBLIC_FACTS } from '../../lib/schemas';
import ProgrammeIntentBoundary from '../../components/programs/ProgrammeIntentBoundary';
import ProgrammeHeroSnapshot from '../../components/programs/ProgrammeHeroSnapshot';
import ProgrammeFaqAccordion from '../../components/programs/ProgrammeFaqAccordion';
import { getProgrammeAiVisibility } from '../../lib/programmeAiVisibility';

const READING_SEO_KEYWORDS = [
  'online reading classes for kids',
  'reading classes for kids',
  'reading classes for kids India',
  'reading classes near me',
  'reading class for kids near me',
  'english reading classes for kids',
  'english reading classes for kids near me',
  'best reading classes for kids',
  'best online reading classes for kids',
  'best reading classes online',
  'online reading improvement classes',
  'reading improvement classes for kids',
  'reading classes for struggling readers',
  'child struggling to read',
  'reading comprehension classes for kids',
  'reading tutor online',
  'online reading tutor for kids',
  'reading support for kids',
  'help child read fluently',
  '1-to-1 reading classes online',
  'online reading classes in India',
  'reading classes in India',
  'online reading classes for kids worldwide',
];

const readingAiVisibility = getProgrammeAiVisibility('/reading-classes-for-kids');

const faqItems = [
  {
    question: 'What do online reading classes for kids usually work on?',
    answer:
      'A strong reading class should target connected-text reading: accurate word and sentence reading, fluency, phrasing, vocabulary, comprehension, retelling, and reading-aloud confidence. If unfamiliar-word decoding or blending is not secure, the child should be routed to phonics rather than treating decoding as a Reading-class skill.',
  },
  {
    question: 'How do I know if my child needs reading support?',
    answer:
      'Common signs include slow or effortful connected reading, frequent pauses, weak phrasing, avoiding reading aloud, weak story understanding, or difficulty explaining a passage. The assessment also checks whether the child should leave this pathway and start with phonics because decoding is still unstable.',
  },
  {
    question: 'What should parents look for in the best reading classes for kids?',
    answer:
      'Look for assessment-first placement, explicit teaching, right-level connected text, live correction, fluency and comprehension work matched to the child, fresh evidence of progress, realistic expectations, and parent-visible next steps. If decoding is not secure, the provider should route the child to phonics instead of blurring the two programmes.',
  },
  {
    question: 'Are online reading classes effective for struggling readers?',
    answer:
      'They can be effective when teaching is live, level-matched, interactive, and specific to the child’s reading difficulty. Passive videos or generic worksheets are less useful when the child needs immediate correction or a different starting point.',
  },
  {
    question: 'What is the difference between phonics classes and reading classes?',
    answer:
      'Phonics owns sound–spelling knowledge, blending, and decoding unfamiliar words. Tiny Steps Reading Classes start from connected reading needs such as accuracy, fluency, phrasing, vocabulary, comprehension, retelling, and reading confidence. If decoding is unstable, the child is routed to the Phonics programme first.',
  },
  {
    question: 'What is the difference between reading fluency and reading comprehension?',
    answer:
      'Reading fluency is accurate, increasingly automatic, and appropriately phrased reading. Reading comprehension is understanding and explaining the meaning of what was read. A child can need support in one or both areas.',
  },
  {
    question: 'Is a 1-to-1 online reading tutor better than a group class?',
    answer:
      'Both formats can work. Live 1:1 reading support is especially useful when a child has a specific connected-reading, fluency, comprehension, vocabulary, or reading-confidence gap that needs individual pacing and immediate correction. Group classes can suit children progressing comfortably at a shared level.',
  },
  {
    question: 'Can reading classes help my child read more fluently?',
    answer:
      'Yes, when the child’s decoding is stable enough and practice uses appropriate text, repeated guided reading, phrasing work, correction, and meaning checks. If accurate word reading is already secure and slow or choppy connected reading is the main difficulty, Tiny Steps uses a dedicated Reading Fluency Programme for that narrower need.',
  },
  {
    question: 'Should I choose general reading classes or the Reading Fluency Programme?',
    answer:
      'Choose general reading support when the child needs help across several reading areas or the main bottleneck is still unclear. Choose the dedicated Reading Fluency Programme when decoding and word accuracy are already established but connected reading remains slow, hesitant, or choppy. The free assessment can help route the child to the right starting point.',
  },
  {
    question: 'Can children outside India join Tiny Steps reading classes?',
    answer:
      'Yes. Tiny Steps reading classes are live online and available to families in India and internationally, including NRI families, subject to a compatible teacher schedule and the child’s learning fit.',
  },
  {
    question: 'How does Tiny Steps decide the right reading path?',
    answer: `Tiny Steps begins with a free ${PUBLIC_SITE_FACTS.standardOffer.demoDurationMinutes}-minute 1:1 online demo assessment class. The teacher checks the child’s current reading behaviour and recommends the next priority instead of assigning the same material to every learner.`,
  },
  {
    question: 'How long is each Tiny Steps reading class?',
    answer: `Standard live 1:1 reading classes are ${PUBLIC_SESSION_DURATION_LABEL}.`,
  },
];

const readingStages = [
  {
    title: '1. Read connected text accurately',
    detail: 'Strengthen accurate word and sentence reading in appropriately matched text without making phonics/decoding the primary programme target.',
  },
  {
    title: '2. Improve phrasing and smoothness',
    detail: 'Move through sentences with more natural phrasing, fewer disruptive pauses, and better attention to punctuation.',
  },
  {
    title: '3. Build reading fluency',
    detail: 'Develop smoother pace, accuracy, expression, and stamina without turning fluency into a speed race.',
    href: '/reading-fluency-program',
    cta: 'See reading fluency support',
  },
  {
    title: '4. Build vocabulary in context',
    detail: 'Use the text to clarify important word meanings so unfamiliar vocabulary does not block sentence or passage understanding.',
  },
  {
    title: '5. Understand and explain the text',
    detail: 'Work on sentence meaning, sequencing, inference, retelling, and answering questions with evidence from the passage.',
    href: '/blog/why-child-reads-words-but-does-not-understand-story',
    cta: 'Read the comprehension guide',
  },
  {
    title: '6. Read with confidence',
    detail: 'Help the child read aloud with greater independence, expression, and willingness to participate in school and at home.',
  },
];

const bestReadingClassCriteria = [
  {
    title: 'Assessment-first placement',
    detail: 'The programme should identify whether the child belongs in connected-reading support or should first be routed to phonics because decoding is unstable. Within Reading, the main gap may be fluency, comprehension, vocabulary, phrasing, or confidence.',
  },
  {
    title: 'Right-level reading material',
    detail: 'Practice should be difficult enough to grow skill without being so hard that the child depends on guessing or constant adult rescue.',
  },
  {
    title: 'Explicit teaching, not only practice',
    detail: 'A teacher should explain the strategy the child needs, model it, guide an attempt, and then check whether the child can use it independently.',
  },
  {
    title: 'Live correction and retry',
    detail: 'Errors should lead to useful feedback and another attempt so the child learns how to repair the reading process.',
  },
  {
    title: 'A clear reading progression',
    detail: 'The pathway should connect accurate connected reading, phrasing, fluency, vocabulary, comprehension, retelling, and reading confidence while keeping phonics and decoding as a separate earlier pathway.',
  },
  {
    title: 'Fresh evidence of progress',
    detail: 'Progress should be checked on new, appropriately matched words, sentences, or passages—not only material the child has rehearsed repeatedly.',
  },
  {
    title: 'Realistic expectations',
    detail: 'A strong provider avoids fixed guarantees for every child and adjusts pace when the evidence shows a different bottleneck.',
  },
  {
    title: 'Parent-visible next steps',
    detail: 'Parents should know what improved, what still needs work, and what to practise next without receiving vague “doing well” updates.',
  },
];

const readingProblemRoutes = [
  {
    signal: 'Knows letters or sounds but cannot read words',
    likelyGap: 'Phonics, blending, or decoding may still be unstable.',
    route: '/phonics',
    label: 'Explore phonics support',
  },
  {
    signal: 'Reads accurately but very slowly',
    likelyGap: 'Fluency, automaticity, phrasing, or reading stamina may be the priority.',
    route: '/reading-fluency-program',
    label: 'Explore reading fluency support',
  },
  {
    signal: 'Reads the words but cannot explain the story',
    likelyGap: 'Vocabulary, language comprehension, sequencing, or inference may need direct support.',
    route: '/blog/phonics-comprehension',
    label: 'Read the comprehension guide',
  },
  {
    signal: 'Guesses words, skips words, or makes mixed reading errors',
    likelyGap: 'The child may need a broader diagnostic before choosing phonics or fluency work.',
    route: '/child-not-reading-properly',
    label: 'Use the reading-problem guide',
  },
  {
    signal: 'Avoids reading aloud or becomes anxious quickly',
    likelyGap: 'Accuracy, fluency, confidence, or several of these may be interacting.',
    route: '/slow-reader-child-help',
    label: 'Check slow-reader support',
  },
];

const proofLinks = [
  {
    title: 'Phonics programme',
    href: '/phonics',
    detail: 'Use this when decoding and blending are still the main bottleneck.',
  },
  {
    title: 'Reading fluency programme',
    href: '/reading-fluency-program',
    detail: 'Use this when word reading is mostly accurate but connected reading remains slow or choppy.',
  },
  {
    title: 'Curriculum',
    href: '/curriculum',
    detail: 'Review the broader Tiny Steps learning progression and how skills connect.',
  },
  {
    title: 'Class samples',
    href: '/class-samples',
    detail: 'See how live teaching, correction, pacing, and child participation look before deciding.',
  },
  {
    title: 'Parent testimonials',
    href: '/testimonials',
    detail: 'Use parent feedback as supporting evidence together with programme structure and class samples.',
  },
  {
    title: 'Pricing',
    href: '/pricing',
    detail: 'Check the current public class price and package options before booking.',
  },
];

export default function ReadingClassesForKidsPage() {
  const canonicalPath = '/reading-classes-for-kids';
  const canonicalUrl = `${PUBLIC_FACTS.primaryWebsite}${canonicalPath}`;
  // Keep these values aligned with routeSeoRegistry.js because that registry supplies build-time prerender metadata.
  const seoTitle = 'Online Reading Classes for Kids | Live 1:1 | Tiny Steps';
  const seoDescription =
    'Live 1:1 online reading classes for kids ages 3–12 in India and worldwide. Build accurate reading, comprehension, vocabulary and reading confidence with assessment-first support.';

  useEffect(() => {
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${PUBLIC_FACTS.primaryWebsite}/` },
        { '@type': 'ListItem', position: 2, name: 'Courses', item: `${PUBLIC_FACTS.primaryWebsite}/courses` },
        { '@type': 'ListItem', position: 3, name: 'Reading Classes for Kids', item: canonicalUrl },
      ],
    };

    const webpageSchema = {
      ...createWebPageSchema({
        name: 'Online Reading Classes for Kids',
        description: seoDescription,
        url: canonicalUrl,
      }),
      '@id': `${canonicalUrl}#webpage`,
      about: [
        { '@type': 'Thing', name: 'Online reading classes for kids' },
        { '@type': 'Thing', name: 'Reading support for struggling readers' },
        { '@type': 'Thing', name: 'Connected-text reading' },
        { '@type': 'Thing', name: 'Reading fluency' },
        { '@type': 'Thing', name: 'Reading fluency and phrasing' },
        { '@type': 'Thing', name: 'Reading comprehension' },
        { '@type': 'Thing', name: 'Vocabulary and retelling' },
        { '@type': 'Thing', name: 'Online reading tutoring' },
      ],
      speakable: buildSpeakableSpecification([
        '.ts-reading-answer-title',
        '.ts-reading-answer-summary',
      ]),
    };

    const pathwaySchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': `${canonicalUrl}#reading-pathway`,
      name: 'Tiny Steps connected-reading pathway',
      itemListElement: readingStages.map((stage, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Thing',
          name: stage.title,
          description: stage.detail,
        },
      })),
    };

    const qualityCriteriaSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': `${canonicalUrl}#reading-class-quality-criteria`,
      name: 'What parents should look for in online reading classes for kids',
      itemListElement: bestReadingClassCriteria.map((criterion, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Thing',
          name: criterion.title,
          description: criterion.detail,
        },
      })),
    };

    const faqSchema = {
      ...createFAQPageSchema(faqItems),
      '@id': `${canonicalUrl}#faq`,
    };

    const courseSchema = createCourseSchema({
      name: 'Online Reading Classes for Kids',
      description:
        'Live 1:1 online reading classes for kids focused on connected-text accuracy, fluency, phrasing, vocabulary, comprehension, retelling and reading confidence, with phonics used as a separate route when decoding is unstable.',
      url: canonicalUrl,
      educationalLevel: 'Children ages 3–12; placement by current reading need',
      teaches: ['connected reading', 'reading fluency', 'phrasing', 'vocabulary', 'reading comprehension', 'retelling', 'reading confidence'],
      areaServed: ['India', 'Worldwide'],
    });

    applySeo({
      title: seoTitle,
      description: seoDescription,
      canonicalPath,
      robots: 'index,follow',
      ogType: 'website',
      keywords: READING_SEO_KEYWORDS,
      jsonLd: [breadcrumbSchema, webpageSchema, courseSchema, pathwaySchema, qualityCriteriaSchema, faqSchema],
    });
  }, [canonicalUrl]);

  const demoMinutes = PUBLIC_SITE_FACTS.standardOffer.demoDurationMinutes;
  const oneToOnePrice = formatPublicInr(PUBLIC_SITE_FACTS.standardOffer.oneToOnePerClassInr);

  return (
    <div className="bg-[#fbfbfd] pb-12">
      <section className="relative overflow-hidden px-4 pb-8 pt-7 sm:px-5 md:pb-10 md:pt-9 lg:px-8 lg:pb-12">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#f4faff_0%,#fff_70%,#fbfbfd_100%)]" />
        <div className="pointer-events-none absolute left-[-10%] top-[-25%] h-[560px] w-[560px] rounded-full bg-sky-200/35 blur-[120px]" />
        <div className="pointer-events-none absolute right-[-4%] top-[-24%] h-[520px] w-[520px] rounded-full bg-orange-100/70 blur-[120px]" />

        <div className="relative mx-auto max-w-7xl">
          <nav aria-label="Breadcrumb" className="mb-4 text-xs text-slate-600 sm:text-sm">
            <ol className="flex flex-wrap items-center gap-2">
              <li><Link to="/" className="hover:text-slate-900 hover:underline">Home</Link></li>
              <li aria-hidden="true">›</li>
              <li><Link to="/courses" className="hover:text-slate-900 hover:underline">Courses</Link></li>
              <li aria-hidden="true">›</li>
              <li className="font-medium text-slate-900">Reading Classes for Kids</li>
            </ol>
          </nav>

          <div className="grid gap-7 lg:grid-cols-[1.06fr_0.94fr] lg:items-center lg:gap-10">
            <div>
              <p className="inline-flex rounded-full border border-sky-200/80 bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-sky-800 shadow-[0_8px_22px_rgba(14,165,233,0.08)] backdrop-blur">
                Connected reading after phonics
              </p>
              <h1 className="mt-5 max-w-[760px] text-[clamp(2.65rem,8vw,4.65rem)] font-black leading-[0.95] tracking-[-0.055em] text-[#172033]">
                Online Reading Classes for Kids
              </h1>
              <p className="mt-5 max-w-[690px] text-base font-medium leading-7 text-slate-700 md:text-[1.08rem] md:leading-8">
                Live 1:1 reading support for ages 3–12 in India and worldwide, focused on connected-text accuracy, fluency, phrasing, vocabulary, comprehension, retelling, and reading confidence.
              </p>
              <p className="mt-3 max-w-[680px] text-sm leading-6 text-slate-600 md:text-[15px] md:leading-7">
                Phonics owns sound–spelling knowledge, blending, and decoding unfamiliar words. If those skills are unstable, the child is routed to the Phonics programme first. If word reading is secure but connected reading is slow or choppy, the specialist Reading Fluency Programme may be the better fit.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link to="/book-demo" className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#182338] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(23,32,51,0.18)] transition hover:bg-[#111b2d]">
                  Book Free {demoMinutes}-Minute Demo
                </Link>
                <Link to="/class-samples" className="inline-flex min-h-[46px] items-center justify-center rounded-full border border-slate-300/80 bg-white/85 px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-white">
                  See Class Samples
                </Link>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  PUBLIC_AGE_RANGE_LABEL,
                  `${PUBLIC_SESSION_DURATION_LABEL} live 1:1`,
                  'India + worldwide',
                  'Parent-visible progress',
                ].map((chip) => (
                  <span key={chip} className="rounded-full border border-slate-200/80 bg-white/75 px-3 py-1.5 text-xs font-medium text-slate-600 backdrop-blur sm:px-3.5 sm:text-sm">
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            <ProgrammeHeroSnapshot
              variant="reading"
              eyebrow="Reading programme focus"
              title="What this programme builds"
              summary="Reading support begins with connected text: accurate reading, smoother phrasing, vocabulary, comprehension, retelling, and confident reading aloud."
              items={[
                'Connected-text accuracy',
                'Sentence reading',
                'Fluency & phrasing',
                'Vocabulary in context',
                'Comprehension & retelling',
                'Reading confidence',
              ]}
              footer={
                <>
                  If unfamiliar-word decoding or blending is unstable, start with{' '}
                  <Link to="/phonics" className="font-semibold text-slate-900 underline underline-offset-2">
                    Phonics
                  </Link>.
                  {' '}Standard live 1:1 classes are {PUBLIC_SESSION_DURATION_LABEL}; current standard pricing is ₹{oneToOnePrice} per class.
                </>
              }
            />
          </div>
        </div>
      </section>

      <section className="px-4 py-5 sm:px-5 md:py-7 lg:px-6">
        <div className="mx-auto grid max-w-6xl gap-4 border-y border-slate-200/80 py-5 md:grid-cols-[0.28fr_0.72fr] md:items-start md:gap-8 md:py-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-700">Parent clarity</p>
          <div>
            <h2 className="ts-reading-answer-title text-xl font-semibold tracking-[-0.025em] text-slate-950 md:text-2xl">
              Quick Answer: What do online reading classes for kids work on?
            </h2>
            <p className="ts-reading-answer-summary mt-2 max-w-[920px] text-sm leading-6 text-slate-600 md:text-[15px] md:leading-7">
              Reading classes should target connected-text reading: accurate word and sentence reading, fluency, phrasing, vocabulary, comprehension, retelling, and reading-aloud confidence. If unfamiliar-word decoding or blending is not secure, the child should start with Phonics rather than treating decoding as a Reading-class skill.
            </p>
          </div>
        </div>
      </section>

      {readingAiVisibility ? <ProgrammeIntentBoundary config={readingAiVisibility} /> : null}

      <section className="px-4 py-7 sm:px-5 md:py-9 lg:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 md:grid-cols-[0.72fr_1.28fr] md:gap-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Reading support for struggling readers</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">Start with the child&apos;s actual reading problem</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                “My child is struggling to read” can describe very different bottlenecks. The first decision is whether decoding belongs in Phonics or whether connected-reading support is now the right next step.
              </p>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              {readingProblemRoutes.map((item, index) => (
                <Link
                  key={item.signal}
                  to={item.route}
                  className={`group rounded-[18px] border border-slate-200 bg-white px-4 py-3.5 transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)] ${index === 4 ? 'sm:col-span-2' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold leading-5 text-slate-950">{item.signal}</h3>
                      <p className="mt-1 text-xs leading-5 text-slate-600 sm:text-sm">{item.likelyGap}</p>
                    </div>
                    <span aria-hidden="true" className="text-slate-300 transition group-hover:text-slate-600">↗</span>
                  </div>
                  <span className="mt-2 inline-block text-xs font-semibold text-slate-700">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-6 sm:px-5 md:py-8 lg:px-6">
        <div className="mx-auto max-w-6xl border-y border-slate-200/80 py-5 md:py-7">
          <div className="grid gap-4 md:grid-cols-[0.78fr_1.22fr] md:items-end md:gap-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-700">Reading pathway</p>
              <h2 className="mt-2 max-w-2xl text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
                From accurate connected reading to comprehension and confidence
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              This Reading pathway begins after the phonics decision. If decoding is unstable, the child is routed to Phonics; once decoding is reasonably secure, Reading can focus on connected-text accuracy, fluency, vocabulary, comprehension and retelling.
            </p>
          </div>

          <div className="mt-5 grid gap-x-5 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {readingStages.map((stage) => (
              <article key={stage.title} className="border-l border-slate-200 py-1 pl-4">
                <h3 className="text-sm font-semibold text-slate-950 md:text-[15px]">{stage.title}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-600 md:text-sm">{stage.detail}</p>
                {stage.href && stage.cta ? (
                  <Link to={stage.href} className="mt-1.5 inline-block text-xs font-semibold text-slate-800 underline underline-offset-2">
                    {stage.cta}
                  </Link>
                ) : null}
              </article>
            ))}
          </div>

          <p className="mt-5 text-sm leading-6 text-slate-600">
            <strong className="text-slate-950">General Reading or specialist fluency?</strong>{' '}
            Stay here when support spans several connected-reading skills. If word accuracy is secure but connected reading remains slow, hesitant, or choppy, use the{' '}
            <Link to="/reading-fluency-program" className="font-semibold text-sky-800 underline underline-offset-2">Reading Fluency Programme</Link>.
          </p>
        </div>
      </section>

      <section className="px-4 py-6 sm:px-5 md:py-8 lg:px-6">
        <div className="mx-auto max-w-6xl rounded-[24px] border border-slate-200/80 bg-white/80 p-5 md:p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Choosing reading support</p>
          <div className="mt-2 grid gap-4 md:grid-cols-[0.85fr_1.15fr] md:items-start md:gap-8">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">What should parents look for in the best online reading classes?</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                “Best” should mean best fit for the child&apos;s current needs. Four checks cover the eight detailed criteria below without turning the page into a long comparison document.
              </p>
            </div>

            <div className="divide-y divide-slate-200 border-y border-slate-200">
              {[
                {
                  title: 'Assess correctly',
                  summary: 'Start with the right pathway and the right reading level.',
                  criteria: bestReadingClassCriteria.slice(0, 2),
                },
                {
                  title: 'Teach explicitly',
                  summary: 'Model the strategy, correct live, and let the child retry.',
                  criteria: bestReadingClassCriteria.slice(2, 4),
                },
                {
                  title: 'Measure real progress',
                  summary: 'Use a clear progression and check transfer on fresh text.',
                  criteria: bestReadingClassCriteria.slice(4, 6),
                },
                {
                  title: 'Keep expectations and next steps clear',
                  summary: 'Avoid fixed guarantees and show parents what comes next.',
                  criteria: bestReadingClassCriteria.slice(6, 8),
                },
              ].map((principle) => (
                <details key={principle.title} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3.5 [&::-webkit-details-marker]:hidden">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-950">{principle.title}</h3>
                      <p className="mt-0.5 text-xs leading-5 text-slate-600 sm:text-sm">{principle.summary}</p>
                    </div>
                    <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 text-base text-slate-500 transition group-open:rotate-45">+</span>
                  </summary>
                  <div className="grid gap-3 pb-4 sm:grid-cols-2">
                    {principle.criteria.map((criterion) => (
                      <div key={criterion.title} className="rounded-[14px] bg-slate-50 px-3.5 py-3">
                        <p className="text-xs font-semibold text-slate-950">{criterion.title}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-600">{criterion.detail}</p>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-500">
            No reading provider is the best fit for every child. For sentence, paragraph, and creative-writing support, use{' '}
            <Link to="/writing-classes-for-kids" className="font-semibold text-slate-700 underline underline-offset-2">Writing Classes for Kids</Link>.
          </p>
        </div>
      </section>

      <section className="px-4 py-6 sm:px-5 md:py-8 lg:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <article className="border-y border-slate-200 py-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">How Tiny Steps teaches</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em] text-slate-950">Assessment → targeted teaching → fresh check → next step</h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {[
                  ['1. Assess', 'Identify the current reading bottleneck.'],
                  ['2. Teach', 'Model and practise the right strategy at the right level.'],
                  ['3. Check', 'Use fresh text to see whether the skill transfers.'],
                  ['4. Progress', 'Share the next priority and move forward when evidence supports it.'],
                ].map(([title, detail]) => (
                  <div key={title} className="border-l border-slate-200 pl-3">
                    <p className="text-xs font-semibold text-slate-950">{title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-slate-600">{detail}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-500">
                Live 1:1 support is especially useful when a child needs individual pacing and immediate correction; group reading can also work for children progressing comfortably at a shared level.
              </p>
            </article>

            <div className="border-y border-slate-200 py-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-700">Evidence before enrolment</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em] text-slate-950">Check the programme, teaching, parent evidence, and cost</h2>
              <div className="mt-4 grid gap-x-5 gap-y-2 sm:grid-cols-2">
                {proofLinks.map((item) => (
                  <Link key={item.href} to={item.href} className="group flex items-center justify-between gap-3 border-b border-slate-100 py-2.5">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-950">{item.title}</h3>
                      <p className="mt-0.5 text-xs leading-5 text-slate-500">{item.detail}</p>
                    </div>
                    <span className="shrink-0 text-slate-300 transition group-hover:text-slate-600">↗</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-slate-200 pb-5">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Reading guides</span>
            {[
              ['/blog/how-to-improve-reading-fluency-in-children', 'Improve reading fluency'],
              ['/blog/phonics-comprehension', 'From decoding to comprehension'],
              ['/blog/why-child-knows-letter-sounds-but-cannot-read-words', 'Why letter sounds are not enough'],
              ['/child-not-reading-properly', 'Parent diagnostic guide'],
            ].map(([href, title]) => (
              <Link key={href} to={href} className="text-xs font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-950">
                {title}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-7 sm:px-5 md:py-9 lg:px-6">
        <div className="mx-auto max-w-6xl rounded-[26px] bg-slate-950 p-5 text-white shadow-[0_24px_60px_rgba(15,23,42,0.12)] md:p-7">
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-300">Free reading assessment</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">What happens before we recommend a reading path?</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 md:text-[15px]">
                During the free {demoMinutes}-minute 1:1 online demo assessment class, the teacher may check letter-sound knowledge, blending, word reading, sentence reading, fluency, story understanding, vocabulary, and reading-aloud confidence. The goal is to find the next teaching priority—not to label every child with the same difficulty.
              </p>
              <Link to="/book-demo" className="mt-5 inline-flex min-h-[46px] items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
                Book Free {demoMinutes}-Minute Demo
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-sm">
              {['Decode or route to Phonics', 'Connected-text accuracy', 'Fluency & phrasing', 'Vocabulary & meaning', 'Comprehension & retelling', 'Reading confidence'].map((item) => (
                <div key={item} className="rounded-[16px] border border-white/10 bg-white/5 px-3 py-3 text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="px-4 py-6 sm:px-5 md:py-8 lg:px-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Quick answers</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">Questions parents ask about online reading classes</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Open only the question you need; all answers stay collapsed by default.</p>
          <ProgrammeFaqAccordion items={faqItems} accent="sky" />
        </div>
      </section>

      <section className="px-4 pb-9 pt-6 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_52%,#fff7ed_100%)] p-6 text-center sm:p-8 md:p-9">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950 md:text-3xl">Not sure which reading path fits your child?</h2>
          <p className="mx-auto mt-3 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
            Start with one free {demoMinutes}-minute 1:1 assessment. We will separate Phonics, general Reading, and specialist fluency needs before recommending the next step.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/book-demo" className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-slate-950 px-7 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              Book Free {demoMinutes}-Minute Demo
            </Link>
            <Link to="/pricing" className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-slate-300 bg-white px-7 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">
              See Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
