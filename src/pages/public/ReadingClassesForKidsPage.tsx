import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import ClusterSeoNav from '../../components/programs/ClusterSeoNav';
import {
  PUBLIC_AGE_RANGE_LABEL,
  PUBLIC_SESSION_DURATION_LABEL,
  PUBLIC_SITE_FACTS,
  formatPublicInr,
} from '../../config/publicFacts';
import { applySeo } from '../../lib/seo';
import { createFAQPageSchema, createWebPageSchema, PUBLIC_FACTS } from '../../lib/schemas';

const READING_SEO_KEYWORDS = [
  'online reading classes for kids',
  'reading classes for kids',
  'best reading classes for kids',
  'best online reading classes for kids',
  'best reading classes online',
  'online reading improvement classes',
  'reading improvement classes for kids',
  'reading classes for struggling readers',
  'child struggling to read',
  'reading fluency classes',
  'reading comprehension classes',
  'reading tutor online',
  'online reading tutor for kids',
  'reading support for kids',
  'help child read fluently',
  '1-to-1 reading classes online',
  'online reading classes in India',
  'reading classes in India',
];

const faqItems = [
  {
    question: 'What do online reading classes for kids usually work on?',
    answer:
      'A strong reading class should first identify the child’s current bottleneck, then target the right stage: decoding, word reading, sentence reading, fluency, vocabulary, comprehension, or reading-aloud confidence. Not every struggling reader needs the same lesson plan.',
  },
  {
    question: 'How do I know if my child needs reading support?',
    answer:
      'Common signs include guessing words, slow word-by-word reading, frequent pauses, avoiding reading aloud, weak story understanding, or difficulty answering questions about a passage. An assessment helps separate a phonics problem from a fluency or comprehension problem.',
  },
  {
    question: 'What should parents look for in the best reading classes for kids?',
    answer:
      'Look for assessment-first placement, explicit teaching, right-level text, live correction, a clear decoding-to-fluency-to-comprehension pathway, measurable progress evidence, realistic expectations, and parent-visible next steps. “Best” depends on the child’s actual reading gap, not a ranking claim alone.',
  },
  {
    question: 'Are online reading classes effective for struggling readers?',
    answer:
      'They can be effective when teaching is live, level-matched, interactive, and specific to the child’s reading difficulty. Passive videos or generic worksheets are less useful when the child needs immediate correction or a different starting point.',
  },
  {
    question: 'What is the difference between phonics classes and reading classes?',
    answer:
      'Phonics focuses on how print represents sounds and how children decode unfamiliar words. Reading classes can include phonics when needed, but also extend into sentence reading, fluency, vocabulary, comprehension, retelling, and reading confidence.',
  },
  {
    question: 'What is the difference between reading fluency and reading comprehension?',
    answer:
      'Reading fluency is accurate, increasingly automatic and appropriately phrased reading. Reading comprehension is understanding and explaining the meaning of what was read. A child can need support in one or both areas.',
  },
  {
    question: 'Is a 1-to-1 online reading tutor better than a group class?',
    answer:
      'Both formats can work. Live 1:1 reading support is especially useful when a child has a specific decoding, fluency, comprehension, or confidence gap that needs individual pacing and immediate correction. Group classes can suit children progressing comfortably at a shared level.',
  },
  {
    question: 'Can reading classes help my child read more fluently?',
    answer:
      'Yes, when the child’s decoding is stable enough and practice uses appropriate text, repeated guided reading, phrasing work, correction, and meaning checks. If decoding is still weak, that should be addressed before speed becomes the main goal.',
  },
  {
    question: 'How does Tiny Steps decide the right reading path?',
    answer: `Tiny Steps begins with a free ${PUBLIC_SITE_FACTS.standardOffer.demoDurationMinutes}-minute 1:1 online demo assessment class. The teacher checks the child’s current reading behaviour and recommends the next priority instead of assigning the same material to every learner.`,
  },
  {
    question: 'How long is each Tiny Steps reading class?',
    answer: `Live classes are typically ${PUBLIC_SESSION_DURATION_LABEL}.`,
  },
];

const readingStages = [
  {
    title: '1. Decode words',
    detail: 'Check sound–spelling knowledge, blending, and whether the child can work through unfamiliar words instead of guessing.',
    href: '/phonics',
    cta: 'Explore phonics support',
  },
  {
    title: '2. Read words accurately',
    detail: 'Strengthen accurate word reading so attention is not consumed by repeated decoding errors.',
    href: '/reading-classes-for-kids',
    cta: 'Reading classes for kids',
  },
  {
    title: '3. Read sentences smoothly',
    detail: 'Move from isolated words into connected sentence reading with better phrasing and fewer disruptive pauses.',
    href: '/reading-classes-for-kids',
    cta: 'Build sentence reading',
  },
  {
    title: '4. Build reading fluency',
    detail: 'Develop smoother pace, accuracy, expression, and stamina without turning fluency into a speed race.',
    href: '/reading-fluency-program',
    cta: 'See the fluency programme',
  },
  {
    title: '5. Understand what was read',
    detail: 'Work on vocabulary, sentence meaning, sequencing, inference, retelling, and answering questions from the text.',
    href: '/blog/week-6-phonics-comprehension',
    cta: 'Read the comprehension guide',
  },
  {
    title: '6. Read with confidence',
    detail: 'Help the child read aloud with greater independence, expression, and willingness to participate in school and at home.',
    href: '/speaking',
    cta: 'Explore communication support',
  },
];

const bestReadingClassCriteria = [
  {
    title: 'Assessment-first placement',
    detail: 'The programme should identify whether the main gap is decoding, fluency, comprehension, vocabulary, or confidence before choosing the starting point.',
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
    detail: 'The pathway should connect decoding, accurate word reading, sentence reading, fluency, comprehension, vocabulary, and reading confidence.',
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
    label: 'Go to the phonics programme',
  },
  {
    signal: 'Reads accurately but very slowly',
    likelyGap: 'Fluency, automaticity, phrasing, or reading stamina may be the priority.',
    route: '/reading-fluency-program',
    label: 'Go to reading fluency support',
  },
  {
    signal: 'Reads the words but cannot explain the story',
    likelyGap: 'Vocabulary, language comprehension, sequencing, or inference may need direct support.',
    route: '/reading-classes-for-kids',
    label: 'Stay with broad reading support',
  },
  {
    signal: 'Guesses words, skips words, or makes mixed reading errors',
    likelyGap: 'The child may need a broader diagnostic before choosing phonics or fluency work.',
    route: '/child-not-reading-properly',
    label: 'Use the reading-problem diagnostic',
  },
  {
    signal: 'Avoids reading aloud or becomes anxious quickly',
    likelyGap: 'Accuracy, fluency, confidence, or several of these may be interacting.',
    route: '/slow-reader-child-help',
    label: 'Check the slow-reader support page',
  },
];

const proofLinks = [
  {
    title: 'Main phonics programme',
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
  const seoTitle = 'Online Reading Classes for Kids in India | Tiny Steps';
  const seoDescription =
    'Live 1:1 online reading classes for kids in India. Support decoding, fluency, comprehension and reading confidence with assessment-first placement for struggling readers.';

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

    const pathwaySchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': `${canonicalUrl}#reading-pathway`,
      name: 'Tiny Steps reading pathway',
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

    const webpageSchema = {
      ...createWebPageSchema({
        name: 'Online Reading Classes for Kids in India',
        description: seoDescription,
        url: canonicalUrl,
      }),
      '@id': `${canonicalUrl}#webpage`,
      about: [
        { '@type': 'Thing', name: 'Online reading classes for kids' },
        { '@type': 'Thing', name: 'Reading support for struggling readers' },
        { '@type': 'Thing', name: 'Reading fluency' },
        { '@type': 'Thing', name: 'Reading comprehension' },
        { '@type': 'Thing', name: 'Online reading tutoring' },
      ],
    };

    const faqSchema = {
      ...createFAQPageSchema(faqItems),
      '@id': `${canonicalUrl}#faq`,
    };

    applySeo({
      title: seoTitle,
      description: seoDescription,
      canonicalPath,
      robots: 'index,follow',
      ogType: 'website',
      keywords: READING_SEO_KEYWORDS,
      jsonLd: [breadcrumbSchema, webpageSchema, pathwaySchema, qualityCriteriaSchema, faqSchema],
    });
  }, [canonicalUrl]);

  const demoMinutes = PUBLIC_SITE_FACTS.standardOffer.demoDurationMinutes;
  const oneToOnePrice = formatPublicInr(PUBLIC_SITE_FACTS.standardOffer.oneToOnePerClassInr);

  return (
    <div className="bg-gradient-to-b from-[#FFF8EF] via-white to-[#EEF8FF] pb-16">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#FFF8EF] via-white to-[#EEF8FF] px-4 py-9 sm:px-5 md:py-14 lg:px-8 lg:py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(255,190,133,0.18),transparent_28%),radial-gradient(circle_at_85%_16%,rgba(145,205,245,0.20),transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl">
          <nav aria-label="Breadcrumb" className="mb-5 text-xs text-slate-600 sm:text-sm">
            <ol className="flex flex-wrap items-center gap-2">
              <li><Link to="/" className="hover:underline">Home</Link></li>
              <li aria-hidden="true">›</li>
              <li><Link to="/courses" className="hover:underline">Courses</Link></li>
              <li aria-hidden="true">›</li>
              <li className="font-semibold text-slate-900">Reading Classes for Kids</li>
            </ol>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="inline-flex rounded-full border border-orange-200 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-700 shadow-sm">
                Assessment-led reading support
              </p>
              <h1 className="mt-4 max-w-[800px] text-[34px] font-bold leading-[1.05] tracking-[-0.035em] text-slate-900 sm:text-[40px] md:text-[48px] lg:text-[54px]">
                Online Reading Classes for Kids in India
              </h1>
              <p className="mt-5 max-w-[760px] text-base leading-7 text-slate-700 md:text-lg md:leading-8">
                Tiny Steps provides live 1:1 reading support for children who need help with decoding, sentence reading, fluency, comprehension, vocabulary, or reading confidence. We identify the reading gap first, then teach the next skill instead of giving every child the same reading practice.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {[
                  PUBLIC_AGE_RANGE_LABEL,
                  'Live 1:1 online classes',
                  `${demoMinutes}-minute free demo assessment`,
                  'Parent-visible progress',
                ].map((chip) => (
                  <span key={chip} className="rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm sm:text-sm">
                    {chip}
                  </span>
                ))}
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to="/book-demo" className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-slate-900 px-7 py-3.5 font-bold text-white shadow-lg transition hover:bg-slate-800">
                  Book Free {demoMinutes}-Minute Demo
                </Link>
                <Link to="/class-samples" className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-slate-300 bg-white px-7 py-3.5 font-semibold text-slate-900 transition hover:bg-slate-50">
                  See Class Samples
                </Link>
              </div>
            </div>

            <aside className="rounded-[30px] border border-sky-100 bg-white/95 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.09)] md:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Quick answer</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">What should reading classes actually fix?</h2>
              <p className="mt-3 leading-7 text-slate-700">
                The answer depends on where reading breaks down. One child may still need phonics and blending. Another may decode correctly but read slowly. Another may read smoothly but not understand the passage. Strong reading support identifies that difference before choosing the lesson.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {['Decoding', 'Sentence reading', 'Fluency', 'Comprehension', 'Vocabulary', 'Reading confidence'].map((skill) => (
                  <div key={skill} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800">
                    {skill}
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="bg-[#fffaf3] px-4 py-9 sm:px-5 md:py-12 lg:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl border border-[#F0D6AD] bg-white p-5 shadow-sm md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">Reading support for struggling readers</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Start with the child’s actual reading problem</h2>
            <p className="mt-3 max-w-4xl leading-7 text-slate-700">
              “My child is struggling to read” can describe several different problems. The fastest useful next step is not to choose more worksheets; it is to identify whether the bottleneck is decoding, fluency, comprehension, or confidence.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {readingProblemRoutes.map((item) => (
                <article key={item.signal} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <h3 className="font-semibold text-slate-900">{item.signal}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-slate-700">{item.likelyGap}</p>
                  <Link to={item.route} className="mt-4 text-sm font-semibold text-slate-900 underline underline-offset-3">
                    {item.label}
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-5 md:py-14 lg:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Reading pathway</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">From decoding to comprehension and reading confidence</h2>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              This is the broad reading owner page. Specialist pages handle narrower problems such as unresolved phonics or fluency-only support.
            </p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {readingStages.map((stage, index) => (
              <article key={stage.title} className={`rounded-3xl border p-5 shadow-sm ${index % 2 === 0 ? 'border-sky-100 bg-sky-50/55' : 'border-orange-100 bg-orange-50/45'}`}>
                <h3 className="text-lg font-bold text-slate-900">{stage.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-700">{stage.detail}</p>
                <Link to={stage.href} className="mt-4 inline-block text-sm font-semibold text-slate-900 underline underline-offset-3">
                  {stage.cta}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#eef7ff] px-4 py-10 sm:px-5 md:py-14 lg:px-6">
        <div className="mx-auto max-w-6xl rounded-[32px] border border-sky-100 bg-white p-5 shadow-sm md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Parent selection framework</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">What should parents look for in the best online reading classes?</h2>
          <p className="mt-3 max-w-4xl leading-7 text-slate-700">
            Parents searching for the best reading classes for kids should compare the teaching process, not just a provider’s headline claim. These criteria help you judge whether a class is likely to fit the child’s real reading stage.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {bestReadingClassCriteria.map((criterion, index) => (
              <article key={criterion.title} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">{index + 1}</span>
                <h3 className="mt-3 font-bold text-slate-900">{criterion.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{criterion.detail}</p>
              </article>
            ))}
          </div>
          <p className="mt-6 text-sm leading-6 text-slate-600">
            Tiny Steps does not claim to be an objectively ranked “#1” reading provider. The useful question is whether the programme can show the right placement, teaching response, evidence, and next step for your child.
          </p>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-5 md:py-14 lg:px-6">
        <div className="mx-auto max-w-6xl grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">1:1 reading tutor online</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">When individual reading support is useful</h2>
            <p className="mt-3 leading-7 text-slate-700">
              A live online reading tutor is most useful when the child needs individual pacing, immediate correction, or a specific intervention for decoding, fluency, comprehension, or confidence. 1:1 support is not automatically superior for every learner, but it makes the teaching response easier to match to the child’s errors in real time.
            </p>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
              {[
                'The child’s mistakes are inconsistent or difficult to diagnose in a group.',
                'The child needs repeated guided attempts without waiting for a batch to move on.',
                'The reading level is above or below the typical age-group material.',
                'Confidence drops quickly when the child is asked to read aloud.',
              ].map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </div>

          <div className="rounded-3xl border border-orange-100 bg-orange-50/55 p-5 shadow-sm md:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">Commercial clarity</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Reading class format, duration and current price</h2>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white bg-white p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Core format</dt>
                <dd className="mt-2 font-bold text-slate-900">Live 1:1 online</dd>
              </div>
              <div className="rounded-2xl border border-white bg-white p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Class duration</dt>
                <dd className="mt-2 font-bold text-slate-900">{PUBLIC_SESSION_DURATION_LABEL}</dd>
              </div>
              <div className="rounded-2xl border border-white bg-white p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Standard reference</dt>
                <dd className="mt-2 font-bold text-slate-900">₹{oneToOnePrice} per class</dd>
              </div>
              <div className="rounded-2xl border border-white bg-white p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">First step</dt>
                <dd className="mt-2 font-bold text-slate-900">Free {demoMinutes}-minute demo assessment</dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/pricing" className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50">View Pricing</Link>
              <Link to="/book-demo" className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Book Assessment</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#fffaf3] px-4 py-10 sm:px-5 md:py-14 lg:px-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Evidence before enrollment</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">How Tiny Steps maps reading support to evidence</h2>
          <p className="mt-3 max-w-4xl leading-7 text-slate-700">
            A parent should be able to inspect programme structure, teaching examples, parent feedback, and practical pricing before deciding. Use these pages together rather than relying on one marketing statement.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {proofLinks.map((item) => (
              <Link key={item.href} to={item.href} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <h3 className="font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
              </Link>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold text-slate-900">Useful parent reading guides</h3>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <Link to="/blog/how-to-improve-reading-fluency-in-children" className="font-semibold underline underline-offset-3">How to improve reading fluency</Link>
              <Link to="/blog/week-6-phonics-comprehension" className="font-semibold underline underline-offset-3">From decoding to comprehension</Link>
              <Link to="/child-not-reading-properly" className="font-semibold underline underline-offset-3">Why a child may not be reading properly</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-5 md:py-14 lg:px-6">
        <div className="mx-auto max-w-6xl rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Assessment-first placement</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">What happens before Tiny Steps recommends a reading path?</h2>
          <p className="mt-3 max-w-4xl leading-7 text-slate-700">
            During the free {demoMinutes}-minute 1:1 online demo assessment class, the teacher checks the skills that matter for the child’s current stage. That may include letter-sound knowledge, blending, word reading, sentence reading, pace, expression, vocabulary, comprehension, retelling, and confidence while reading aloud.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {[
              ['1', 'Observe', 'See how the child actually reads rather than relying only on age or grade.'],
              ['2', 'Locate', 'Identify the main bottleneck and prerequisite skills.'],
              ['3', 'Recommend', 'Choose the most useful starting path and class focus.'],
              ['4', 'Review', 'Explain what parents should watch for and what comes next.'],
            ].map(([number, title, detail]) => (
              <article key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">{number}</span>
                <h3 className="mt-3 font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="bg-[#eef6ff] px-4 py-10 sm:px-5 md:py-14 lg:px-6">
        <div className="mx-auto max-w-6xl rounded-[32px] border border-sky-100 bg-white p-5 shadow-sm md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Frequently asked questions about reading classes for kids</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {faqItems.map((item) => (
              <article key={item.question} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                <h3 className="text-[17px] font-semibold text-slate-900">{item.question}</h3>
                <p className="mt-2 text-[15px] leading-7 text-slate-700">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-10 pt-8 sm:px-5 md:pb-14 lg:px-6">
        <div className="mx-auto max-w-6xl rounded-[32px] bg-gradient-to-r from-slate-950 via-[#1f2a44] to-slate-950 p-6 text-center text-white shadow-[0_20px_50px_rgba(15,23,42,0.2)] sm:p-8 md:p-10">
          <h2 className="text-2xl font-bold md:text-3xl">Not sure whether your child needs phonics, fluency or comprehension support?</h2>
          <p className="mx-auto mt-3 max-w-3xl leading-7 text-slate-200">
            Book a free {demoMinutes}-minute 1:1 online demo assessment class. Tiny Steps will identify the current reading bottleneck and recommend the next useful step instead of starting from a generic level.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link to="/book-demo" className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-white px-8 py-3 font-bold text-slate-900 hover:bg-slate-100">
              Book Free {demoMinutes}-Minute Demo
            </Link>
            <Link to="/pricing" className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/30 px-8 py-3 font-semibold text-white hover:bg-white/10">
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      <ClusterSeoNav cluster="phonics" />
    </div>
  );
}
