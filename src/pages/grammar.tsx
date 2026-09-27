import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import TestimonialSnippets from '../components/common/TestimonialSnippets';
import { PUBLIC_SESSION_DURATION_LABEL, PUBLIC_SITE_FACTS } from '../config/publicFacts';
import { SEMANTIC_FACTS } from '../config/semanticFacts';
import { applySeo } from '../lib/seo';
import { buildSpeakableSpecification } from '../lib/breadcrumbAeoGeoRegistry.js';
import { createCourseSchema, createFAQPageSchema, createWebPageSchema, PUBLIC_FACTS } from '../lib/schemas';
import ResponsiveTeachingSection from '../components/programs/ResponsiveTeachingSection';
import ProgrammeIntentBoundary from '../components/programs/ProgrammeIntentBoundary';
import ProgrammeHeroSnapshot from '../components/programs/ProgrammeHeroSnapshot';
import { getProgrammeAiVisibility } from '../lib/programmeAiVisibility';

const grammarFacts = SEMANTIC_FACTS.programmes.grammar;
const demoMinutes = PUBLIC_SITE_FACTS.standardOffer.demoDurationMinutes;
const grammarAiVisibility = getProgrammeAiVisibility('/grammar');

const GRAMMAR_SEO_KEYWORDS = [
  'online grammar classes for kids',
  'grammar classes for kids',
  'grammar classes for kids India',
  'English grammar classes for kids',
  '1 to 1 grammar classes online',
  'online grammar tutor for kids',
  'sentence formation classes for kids',
  'grammar classes for sentence formation',
  'grammar classes to improve school answers',
  'grammar correction classes for kids',
  'online grammar classes in India',
  'online grammar classes for kids worldwide',
];

const faqItems = [
  {
    question: 'How do I know if my child needs grammar support?',
    answer:
      'Common signs include sentence errors, tense confusion, short or unclear school answers, and frequent grammar mistakes in speaking or writing. A grammar assessment helps identify the exact gap and starting point.',
  },
  {
    question: 'Why does my child know grammar rules but still make mistakes?',
    answer:
      'Many children can recall grammar rules but struggle to apply them in real sentences. They usually need guided correction, repetition in context, and sentence formation practice.',
  },
  {
    question: 'Can grammar classes improve sentence formation?',
    answer:
      'Yes. Grammar becomes useful when children apply it in complete sentences. This improves sentence structure, clarity, and confidence in both writing and speaking.',
  },
  {
    question: 'Can grammar help my child write better school answers?',
    answer:
      'Yes. Grammar supports written sentence accuracy by improving sentence structure, punctuation, and tense usage. This helps children write clearer, more complete school answers.',
  },
  {
    question: 'How does Tiny Steps show grammar progress to parents?',
    answer:
      'Parents receive practical progress visibility: what was practised, common errors, improvement points, and next-step goals across grammar accuracy, sentence formation, written sentence accuracy, and school-answer confidence.',
  },
  {
    question: 'What ages are Tiny Steps grammar classes for?',
    answer:
      'Beginner Grammar is designed for ages 5–10 and Advanced Grammar for ages 8–12. The age ranges overlap intentionally because placement depends on the child’s current grammar control and readiness, not age alone.',
  },
  {
    question: 'Are Tiny Steps grammar classes live and 1:1?',
    answer:
      `Yes. Standard Tiny Steps grammar classes are live 1:1 online classes and run for ${PUBLIC_SESSION_DURATION_LABEL}.`,
  },
  {
    question: 'Can children outside India join Tiny Steps grammar classes?',
    answer:
      'Yes. Tiny Steps grammar classes are available to families in India and worldwide, including NRI families, subject to a compatible teacher schedule and the child’s learning fit.',
  },
  {
    question: 'What is the difference between grammar classes and writing classes?',
    answer:
      'Grammar classes focus on sentence structure, parts of speech, tenses, punctuation, correction and accurate language use. Writing classes go further into idea development, paragraph structure, creative writing, editing and longer written responses. A child may need one or both depending on the assessment.',
  },
];

const grammarPathwayCards = [
  {
    name: 'Parts of speech',
    description: 'Understand naming words, action words, describing words, and basic word roles.',
    href: '/grammar',
    anchor: 'grammar classes for kids',
    url: `${PUBLIC_FACTS.primaryWebsite}/grammar`,
  },
  {
    name: 'Sentence structure',
    description: 'Build complete sentences with clearer order, meaning, and response flow.',
    href: '/grammar',
    anchor: 'grammar classes for kids',
    url: `${PUBLIC_FACTS.primaryWebsite}/grammar`,
  },
  {
    name: 'Tenses',
    description: 'Use past, present, and future correctly in everyday speaking and writing.',
    href: '/grammar',
    anchor: 'grammar classes for kids',
    url: `${PUBLIC_FACTS.primaryWebsite}/grammar`,
  },
  {
    name: 'Punctuation',
    description: 'Apply punctuation marks correctly for cleaner, clearer sentence writing.',
    href: '/grammar',
    anchor: 'grammar classes for kids',
    url: `${PUBLIC_FACTS.primaryWebsite}/grammar`,
  },
  {
    name: 'Written sentence accuracy',
    description: 'Apply grammar accurately in written sentences and short school answers; use the dedicated writing programme for paragraph and creative-writing development.',
    href: '/writing-classes-for-kids',
    anchor: 'writing classes for kids',
    url: `${PUBLIC_FACTS.primaryWebsite}/writing-classes-for-kids`,
  },
  {
    name: 'Confident school answers',
    description: 'Apply grammar accurately when building complete, clear school responses.',
    href: '/grammar',
    anchor: 'grammar classes for school-answer clarity',
    url: `${PUBLIC_FACTS.primaryWebsite}/grammar`,
  },
];


export default function GrammarPage() {
  const canonicalPath = '/grammar';
  const canonicalUrl = `${PUBLIC_FACTS.primaryWebsite}${canonicalPath}`;
  const seoTitle = 'Online Grammar Classes for Kids | Live 1:1 | Tiny Steps';
  const seoDescription =
    'Live 1:1 online grammar classes for kids in India and worldwide. Build sentence formation, tenses, punctuation, grammar accuracy and clearer school answers with assessment-first placement.';

  useEffect(() => {
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
        { '@type': 'ListItem', position: 2, name: 'Curriculum', item: 'https://tinystepslearning.com/curriculum' },
        { '@type': 'ListItem', position: 3, name: 'Grammar Classes for Kids', item: canonicalUrl },
      ],
    };

    const webpageSchema = {
      ...createWebPageSchema({
        name: 'Online Grammar Classes for Kids',
        description: seoDescription,
        url: canonicalUrl,
      }),
      '@id': `${canonicalUrl}#webpage`,
      about: [
        { '@type': 'Thing', name: 'Online grammar classes for kids' },
        { '@type': 'Thing', name: 'Sentence formation' },
        { '@type': 'Thing', name: 'English tenses' },
        { '@type': 'Thing', name: 'Punctuation' },
        { '@type': 'Thing', name: 'Grammar correction' },
      ],
      speakable: buildSpeakableSpecification([
        '.ts-grammar-answer-title',
        '.ts-grammar-answer-summary',
      ]),
    };

    const pathwayItemListSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Tiny Steps grammar pathway',
      url: canonicalUrl,
      numberOfItems: grammarPathwayCards.length,
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      itemListElement: grammarPathwayCards.map((card, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: card.url,
        item: {
          '@type': 'Thing',
          name: card.name,
          description: card.description,
        },
      })),
    };

    const faqSchema = {
      ...createFAQPageSchema(faqItems),
      '@id': `${canonicalUrl}#faq`,
    };

    const courseSchema = createCourseSchema({
      name: 'Online Grammar Classes for Kids',
      description:
        'Live 1:1 online grammar classes for kids focused on sentence formation, parts of speech, tenses, punctuation, grammar correction and clearer school answers.',
      url: canonicalUrl,
      educationalLevel: 'Beginner Grammar ages 5–10; Advanced Grammar ages 8–12',
      teaches: ['grammar', 'sentence formation', 'parts of speech', 'tenses', 'punctuation', 'grammar correction', 'school-answer clarity'],
      areaServed: ['India', 'Worldwide'],
    });

    applySeo({
      title: seoTitle,
      description: seoDescription,
      canonicalPath,
      robots: 'index,follow',
      ogType: 'website',
      keywords: GRAMMAR_SEO_KEYWORDS,
      jsonLd: [breadcrumbSchema, webpageSchema, courseSchema, pathwayItemListSchema, faqSchema],
    });
  }, [canonicalPath, canonicalUrl]);

  return (
    <div className="bg-[#fbfbfd] pb-12">
      <section className="relative overflow-hidden px-4 pb-8 pt-7 sm:px-5 md:pb-10 md:pt-9 lg:px-8 lg:pb-12">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#fff8f2_0%,#fff_72%,#fbfbfd_100%)]" />
        <div className="pointer-events-none absolute left-[-8%] top-[-28%] h-[560px] w-[560px] rounded-full bg-orange-200/35 blur-[120px]" />
        <div className="pointer-events-none absolute right-[-6%] top-[-20%] h-[520px] w-[520px] rounded-full bg-sky-100/70 blur-[120px]" />
        <div className="relative mx-auto max-w-7xl">
          <nav aria-label="Breadcrumb" className="mb-4 text-xs text-slate-600 sm:text-sm">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link to="/" className="hover:text-slate-900 hover:underline">Home</Link>
              </li>
              <li aria-hidden="true">&gt;</li>
              <li>
                <Link to="/curriculum" className="hover:text-slate-900 hover:underline">Curriculum</Link>
              </li>
              <li aria-hidden="true">&gt;</li>
              <li className="font-medium text-slate-900">Grammar Classes for Kids</li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 items-center gap-7 lg:grid-cols-[1.06fr_0.94fr] lg:gap-10">
            <div>
              <p className="inline-flex items-center rounded-full border border-orange-200/80 bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-orange-700 shadow-[0_8px_22px_rgba(249,115,22,0.08)] backdrop-blur">
                Grammar clarity for children
              </p>
              <h1 className="mt-5 max-w-[720px] text-[clamp(2.65rem,8vw,4.65rem)] font-black leading-[0.95] tracking-[-0.055em] text-[#172033]">
                Online Grammar Classes for Kids
              </h1>
              <p className="mt-5 max-w-[680px] text-base font-medium leading-7 text-slate-700 md:text-[1.08rem] md:leading-8">
                Live 1:1 grammar support for children in India and worldwide, focused on sentence formation, tense control, punctuation, correction, and accurate short school answers.
              </p>
              <p className="mt-3 max-w-[660px] text-sm leading-6 text-slate-600 md:text-[15px] md:leading-7">
                Assessment first separates a grammar-control problem from writing-composition or conversational-fluency needs, then identifies the right Beginner, Advanced, or focused starting point.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  to="/book-demo"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#182338] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(23,32,51,0.18)] transition hover:bg-[#111b2d]"
                >
                  Book Free 35-Minute Demo
                </Link>
                <Link
                  to="/curriculum?tab=grammar"
                  className="inline-flex min-h-[46px] items-center justify-center rounded-full border border-slate-300/80 bg-white/85 px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-white"
                >
                  View Full Curriculum Roadmap
                </Link>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {[grammarFacts.levels.beginner.ageRange.label + ' Beginner', grammarFacts.levels.advanced.ageRange.label + ' Advanced', `${PUBLIC_SESSION_DURATION_LABEL} live 1:1`, 'India + worldwide'].map((chip) => (
                  <span key={chip} className="rounded-full border border-slate-200/80 bg-white/75 px-3 py-1.5 text-xs font-medium text-slate-600 backdrop-blur sm:px-3.5 sm:text-sm">
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            <ProgrammeHeroSnapshot
              variant="grammar"
              eyebrow="Grammar programme focus"
              title="What this programme builds"
              summary="Sentence-level grammar control is the core job: understand the pattern, use it accurately, correct mistakes, and transfer it into clear short responses."
              items={[
                'Sentence formation',
                'Parts of speech',
                'Tense control',
                'Punctuation',
                'Grammar correction',
                'Written sentence accuracy',
              ]}
              footer={
                <>
                  Placement is assessment-led across Beginner and Advanced Grammar. For paragraph development and longer composition, use the{' '}
                  <Link to="/writing-classes-for-kids" className="font-semibold text-slate-900 underline underline-offset-2">
                    Writing programme
                  </Link>.
                </>
              }
            />
          </div>
        </div>
      </section>

      <section className="px-4 py-5 sm:px-5 md:py-7 lg:px-6">
        <div className="mx-auto grid max-w-6xl gap-4 border-y border-slate-200/80 py-5 md:grid-cols-[0.28fr_0.72fr] md:items-start md:gap-8 md:py-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-700">Parent clarity</p>
          <div>
            <h2 className="ts-grammar-answer-title text-xl font-semibold tracking-[-0.025em] text-slate-950 md:text-2xl">Quick Answer: What do grammar classes for kids include?</h2>
            <p className="ts-grammar-answer-summary mt-2 max-w-[920px] text-sm leading-6 text-slate-600 md:text-[15px] md:leading-7">
              Grammar classes should build sentence-level language control: parts of speech, complete sentence formation, tense use, punctuation, correction, and grammar accuracy in short spoken or written responses. Paragraph development, creative writing, editing, and longer composition belong to the dedicated Writing programme rather than this Grammar owner.
            </p>
          </div>
        </div>
      </section>

      {grammarAiVisibility ? <ProgrammeIntentBoundary config={grammarAiVisibility} /> : null}

      <ResponsiveTeachingSection
        appearance="premium"
        id="teacher-delivery"
        program="Grammar"
        introduction="Teachers move from a clear sentence model to guided practice and independent use. Correction stays specific: the child sees the error, retries the sentence in context and receives only as much prompting as needed."
        steps={[
          { title: 'Model the pattern', detail: 'The teacher demonstrates the grammar feature inside a meaningful spoken or written sentence.' },
          { title: 'Guide and correct', detail: 'The child builds and edits sentences while the teacher observes recurring errors and gives focused prompts.' },
          { title: 'Apply independently', detail: 'Examples, repetition and practice time change with readiness, and support reduces as the child self-corrects.' },
        ]}
        observation="whether the child can use the pattern beyond a rule exercise, explain or correct an error, and build a complete sentence with less support."
      />

      <section className="px-4 pb-8 pt-8 sm:px-5 md:pb-10 md:pt-10 lg:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Common grammar gaps</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Find your child&apos;s grammar gap</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-600">
              These are starting signals, not fixed labels. The assessment confirms whether Grammar is the primary need or another programme should take over.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                pill: 'Grammar application',
                problem: 'Child knows grammar rules but cannot use them',
                meaning: 'Rules may be recalled, but articles, prepositions, agreement, or word order still break in new sentences.',
                support: 'Focus: apply and correct grammar in fresh sentences',
                href: '/grammar',
                anchor: 'Explore grammar support',
                tone: 'bg-[#F3FAFF] border-[#D7ECFA]',
              },
              {
                pill: 'Sentence formation',
                problem: 'Child struggles to build complete sentences',
                meaning: 'Sentence structure and idea order may need guided modelling, correction, and repeated use in context.',
                support: 'Focus: complete, accurate sentence construction',
                href: '/grammar',
                anchor: 'Explore sentence formation support',
                tone: 'bg-[#FFF8F0] border-[#F6D9B9]',
              },
              {
                pill: 'Tense control',
                problem: 'Child mixes past, present, and future',
                meaning: 'Tense forms may be known in exercises but not yet stable in everyday answers or explanations.',
                support: 'Focus: choose and maintain the correct tense',
                href: '/grammar',
                anchor: 'Explore tense support',
                tone: 'bg-[#F3FFF6] border-[#CFEFD7]',
              },
              {
                pill: 'School-answer accuracy',
                problem: 'Child writes short answers with repeated grammar errors',
                meaning: 'Sentence accuracy, punctuation, or correction may be the main gap. If the difficulty is idea development or paragraphs, Writing is the better owner.',
                support: 'Focus: accurate short written responses',
                href: '/grammar',
                anchor: 'Explore school-answer grammar support',
                tone: 'bg-[#FFFBEA] border-[#F4E2A0]',
              },
            ].map((item) => (
              <article
                key={item.problem}
                data-grammar-gap-card
                className={`rounded-[22px] border p-5 md:p-6 ${item.tone}`}
              >
                <span className="inline-flex rounded-full border border-white/80 bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600 md:text-[11px]">
                  {item.pill}
                </span>
                <h3 className="mt-3 text-lg font-bold leading-snug text-slate-950 md:text-xl">{item.problem}</h3>
                <p className="mt-2 text-[15px] leading-6 text-slate-700 md:text-base">{item.meaning}</p>
                <p className="mt-3 text-sm font-semibold text-slate-900">{item.support}</p>
                <Link to={item.href} className="mt-2 inline-block text-sm font-semibold text-slate-900 underline underline-offset-2">
                  {item.anchor}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>





      <section className="px-4 py-7 sm:px-5 md:py-9 lg:px-6">
        <div className="mx-auto max-w-6xl border-y border-slate-200/80 py-6 md:py-8">
          <h2 className="mb-4 text-2xl font-bold text-slate-900 sm:text-3xl">Tiny Steps grammar pathway</h2>

          <div className="flex flex-wrap gap-2">
            {['1 Parts of speech', '2 Sentence structure', '3 Tenses', '4 Punctuation', '5 Written sentence accuracy', '6 Confident school answers'].map((step) => (
              <span key={step} className="rounded-full border border-sky-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800">
                {step}
              </span>
            ))}
          </div>

          <p className="mt-3 text-slate-700">
            Children do not all struggle with grammar at the same stage. Some need basic parts of speech, while others need sentence formation, tense correction, punctuation, or grammar application in school answers.
          </p>
          <p className="mt-3 text-slate-700">
            Tiny Steps uses assessment-first placement to find the exact grammar gap and then helps the child move forward step by step.
          </p>

          <div className="mt-5 grid gap-x-6 gap-y-4 md:grid-cols-3">
            {grammarPathwayCards.map((card) => (
              <article key={card.name} className="flex h-full flex-col border-l border-slate-200 pl-4">
                <h3 className="text-lg font-semibold text-slate-900">{card.name}</h3>
                <p className="mt-2 text-sm text-slate-700 md:text-base">{card.description}</p>
                <Link to={card.href} className="mt-4 inline-block text-sm font-semibold text-slate-900 underline underline-offset-2">
                  {card.anchor}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-6 sm:px-5 md:py-8 lg:px-6">
        <div className="mx-auto max-w-6xl rounded-[24px] border border-slate-200 bg-white p-5 md:p-6">
          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Programme boundary</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Grammar supports writing, but it is not the writing programme</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700 md:text-base">
                Grammar owns sentence-level control: sentence formation, tenses, punctuation, correction, and <strong className="font-semibold text-slate-900">written sentence accuracy</strong> in short answers. It should help children use grammar correctly, not only name rules.
              </p>
            </div>
            <div className="grid gap-3">
              <Link to="/writing-classes-for-kids" className="rounded-[18px] border border-slate-200 bg-slate-50/70 p-4 transition hover:bg-white">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Choose Writing when</span>
                <p className="mt-1 text-sm leading-6 text-slate-700">idea development, paragraphs, stories, editing, or longer composition is the main need.</p>
              </Link>
              <Link to="/spoken-english-classes-for-kids-online" className="rounded-[18px] border border-slate-200 bg-slate-50/70 p-4 transition hover:bg-white">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Choose Spoken English when</span>
                <p className="mt-1 text-sm leading-6 text-slate-700">everyday conversational fluency and fuller spontaneous responses are the main need.</p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-7 sm:px-5 md:py-9 lg:px-6">
        <div className="mx-auto max-w-6xl rounded-[26px] border border-slate-200/80 bg-white/80 p-5 md:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Decision support</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">What to look for in a strong grammar programme</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
            The useful difference is not more worksheets. Look for teaching that identifies the gap, uses grammar in real sentences, corrects errors live, and shows parents what is changing.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {[
              {
                title: 'Assessment before placement',
                lookFor: "A starting level based on the child's current grammar control.",
                avoid: 'The same worksheet sequence for every child.',
              },
              {
                title: 'Grammar used in real sentences',
                lookFor: 'Sentence formation, short answers, and grammar transfer in context.',
                avoid: 'Rules taught mainly as isolated definitions or drills.',
              },
              {
                title: 'Live correction and retry',
                lookFor: 'Specific teacher feedback followed by another attempt.',
                avoid: 'App-only practice with no explanation of recurring errors.',
              },
              {
                title: 'Parent-visible progress',
                lookFor: 'Clear strengths, repeated errors, improvement areas, and next steps.',
                avoid: 'Vague progress updates without skill-level evidence.',
              },
            ].map((item) => (
              <article key={item.title} data-grammar-decision-card className="rounded-[20px] border border-slate-200 bg-slate-50/60 p-4 md:p-5">
                <h3 className="font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700"><strong className="font-semibold text-emerald-700">Look for:</strong> {item.lookFor}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600"><strong className="font-semibold text-slate-700">Avoid:</strong> {item.avoid}</p>
              </article>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-700">
            <Link to="/pricing" className="font-semibold underline underline-offset-2">Review class pricing</Link>
            <Link to="/book-demo" className="font-semibold underline underline-offset-2">Book the free {demoMinutes}-minute assessment</Link>
            <Link to="/class-samples" className="font-semibold underline underline-offset-2">See real class samples</Link>
          </div>

          <div className="mt-7 border-t border-slate-200 pt-6">
            <TestimonialSnippets courseTag="grammar" title="What grammar parents noticed first" />
          </div>
        </div>
      </section>



      <section className="px-4 py-7 sm:px-5 md:py-9 lg:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-5 text-2xl font-bold text-slate-900 sm:text-3xl">Grammar levels and age guidance</h2>
          <div className="grid gap-4 md:gap-5 md:grid-cols-3">
            <article className="flex h-full flex-col rounded-[22px] border border-amber-100 bg-white p-5">
              <span className="inline-flex w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">{grammarFacts.levels.beginner.label} · {grammarFacts.levels.beginner.ageRange.label}</span>
              <p className="mt-3 text-sm text-slate-700">
                {grammarFacts.levels.beginner.lessonCount} lessons build core grammar, sentence formation, punctuation, tense foundations, and accurate use in meaningful sentences.
              </p>
              <Link to="/curriculum?tab=grammar" className="mt-4 inline-block text-sm font-semibold underline underline-offset-2">
                See Beginner Grammar curriculum
              </Link>
            </article>

            <article className="flex h-full flex-col rounded-[22px] border border-sky-100 bg-white p-5">
              <span className="inline-flex w-fit rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-800">{grammarFacts.levels.advanced.label} · {grammarFacts.levels.advanced.ageRange.label}</span>
              <p className="mt-3 text-sm text-slate-700">
                {grammarFacts.levels.advanced.lessonCount} lessons develop stronger tense control, sentence complexity, correction, grammar in context, and accurate written and spoken expression.
              </p>
              <Link to="/curriculum?tab=grammar" className="mt-4 inline-block text-sm font-semibold underline underline-offset-2">
                See Advanced Grammar curriculum
              </Link>
            </article>

            <article className="flex h-full flex-col rounded-[22px] border border-indigo-100 bg-white p-5">
              <span className="inline-flex w-fit rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-800">Placement by readiness</span>
              <p className="mt-3 text-sm text-slate-700">
                The age ranges overlap intentionally. Assessment considers current grammar accuracy, sentence control, correction skill, and readiness so the child starts in the appropriate track rather than being placed by age alone.
              </p>
              <Link to="/book-demo" className="mt-4 inline-block text-sm font-semibold underline underline-offset-2">
                Check the right grammar level
              </Link>
            </article>
          </div>
          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-slate-900">Live online in India and worldwide</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                The same Grammar programme supports families in India and internationally, including NRI families; compatible teacher timings are confirmed before enrolment.
              </p>
            </div>
            <Link to="/book-demo" className="shrink-0 text-sm font-semibold text-slate-900 underline underline-offset-2">
              Check programme fit
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-7 sm:px-5 md:py-9 lg:px-6">
        <div className="mx-auto max-w-6xl rounded-[26px] bg-slate-950 p-5 text-white shadow-[0_24px_60px_rgba(15,23,42,0.12)] md:p-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-300">Free 1:1 starting check</p>
          <h2 className="mb-4 mt-2 text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">What happens in the free grammar assessment?</h2>
          <div className="grid gap-6 md:gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-base leading-7 text-slate-300">
                The free grammar assessment helps us understand where your child is currently getting stuck.
              </p>
              <p className="mt-3 text-base leading-7 text-slate-300">
                During the assessment, we may check sentence formation, parts of speech, tenses, articles, prepositions, punctuation, sentence correction, written answers, and confidence while explaining ideas. Based on this, Tiny Steps recommends the right grammar path.
              </p>
              <Link
                to="/book-demo"
                className="mt-6 inline-flex min-h-[46px] w-full items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 sm:w-auto"
              >
                Book Free 35-Minute Demo
              </Link>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/5 p-5 md:p-6">
              <h3 className="text-lg font-semibold text-white">Assessment steps</h3>
              <ol className="mt-3 space-y-2.5 text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-950">1</span>
                  <span>Check the child&apos;s current grammar level</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-950">2</span>
                  <span>Identify the grammar and sentence gap</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-950">3</span>
                  <span>Recommend the right learning path</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-950">4</span>
                  <span>Explain the next steps to parents</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-7 sm:px-5 md:py-9 lg:px-6">
        <div className="mx-auto max-w-6xl rounded-[26px] border border-sky-100 bg-sky-50/45 p-5 md:p-7">
          <p className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-800">Parent visibility</p>
          <h2 className="mb-4 mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">How parents see grammar progress</h2>
          <p className="text-slate-700">Parents should not have to guess whether grammar is improving.</p>
          <p className="mt-3 text-slate-700">
            Tiny Steps focuses on visible grammar progress through class updates, skill-based feedback, strengths, improvement areas, and next-step guidance.
          </p>
          <ul className="mt-5 grid gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              'Grammar topics practised',
              'Sentence formation progress',
              'Common mistakes noticed',
              'Written sentence accuracy',
              'Skills that need more support',
              'Suggested next grammar practice',
            ].map((item) => (
              <li key={item} className="h-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-700 shadow-sm md:text-base">
                <span className="mr-2 font-semibold text-emerald-600">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-slate-700">
            See <Link to="/parents/tracking-progress" className="font-semibold underline underline-offset-2">how Tiny Steps tracks progress</Link> and review{' '}
            <Link to="/why-tiny-steps" className="font-semibold underline underline-offset-2">why parents choose Tiny Steps</Link> before deciding next steps.
          </p>
        </div>
      </section>

      <section id="faq" className="px-4 py-7 sm:px-5 md:py-9 lg:px-6">
        <div className="mx-auto max-w-6xl border-y border-slate-200/80 py-6 md:py-8">
          <h2 className="mb-4 text-2xl font-bold text-slate-900 sm:text-3xl">Frequently asked questions</h2>
          <div className="space-y-3 md:space-y-4">
            {faqItems.map((item) => (
              <article key={item.question} className="border-b border-slate-200 py-4 last:border-b-0">
                <h3 className="faq-question text-[17px] font-semibold text-slate-900 md:text-lg">{item.question}</h3>
                <p className="faq-answer mt-2 text-[15px] leading-6 text-slate-700 md:text-base">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-9 pt-6 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_52%,#eff6ff_100%)] p-6 text-center text-slate-950 sm:p-8 md:p-9">
          <h2 className="text-2xl font-bold md:text-3xl">Not sure where your child is stuck in grammar?</h2>
          <p className="mx-auto mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Book one free 35-minute 1:1 online demo assessment class to identify whether the main gap is sentence formation, tense control, punctuation, correction, or written sentence accuracy.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/book-demo"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-slate-950 px-8 py-3 font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
            >
              Book Free 35-Minute Demo
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-slate-600">
            <Link to="/writing-classes-for-kids" className="font-semibold underline underline-offset-2 hover:text-slate-950">writing classes for kids</Link>
            <span className="hidden sm:inline text-slate-300">•</span>
            <Link to="/spoken-english-classes-for-kids-online" className="font-semibold underline underline-offset-2 hover:text-slate-950">spoken English classes for kids</Link>
            <span className="hidden sm:inline text-slate-300">•</span>
            <Link to="/pricing" className="font-semibold underline underline-offset-2 hover:text-slate-950">class pricing</Link>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-slate-600">
            <Link to="/online-english-classes-for-kids" className="underline underline-offset-2 hover:text-slate-950">online English classes for kids</Link>
            <span className="hidden sm:inline text-slate-400">•</span>
            <Link to="/class-samples" className="underline underline-offset-2 hover:text-slate-950">real class samples</Link>
          </div>
        </div>
      </section>

    </div>
  );
}
