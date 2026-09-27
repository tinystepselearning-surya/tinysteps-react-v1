import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import ClusterSeoNav from '../components/programs/ClusterSeoNav';
import TestimonialSnippets from '../components/common/TestimonialSnippets';
import { PUBLIC_SESSION_DURATION_LABEL, PUBLIC_SITE_FACTS } from '../config/publicFacts';
import { SEMANTIC_FACTS } from '../config/semanticFacts';
import { applySeo } from '../lib/seo';
import { buildSpeakableSpecification } from '../lib/breadcrumbAeoGeoRegistry.js';
import { createFAQPageSchema, createWebPageSchema, PUBLIC_FACTS } from '../lib/schemas';
import ResponsiveTeachingSection from '../components/programs/ResponsiveTeachingSection';
import ProgrammeIntentBoundary from '../components/programs/ProgrammeIntentBoundary';
import ProgrammeHeroSnapshot from '../components/programs/ProgrammeHeroSnapshot';
import ProgrammeFaqAccordion from '../components/programs/ProgrammeFaqAccordion';
import { getProgrammeAiVisibility } from '../lib/programmeAiVisibility';
import {
  SPEAKING_PROGRESS_DIMENSIONS,
  SPEAKING_PROGRESS_FRAMEWORK_PATH,
  SPEAKING_PROGRESS_OBSERVATION_BANDS,
} from '../lib/speakingProgressFramework';
import {
  SPEAKING_EVIDENCE_SURFACES,
} from '../lib/speakingEvidenceLayer';

const speakingFacts = SEMANTIC_FACTS.programmes.speaking;
const demoMinutes = PUBLIC_SITE_FACTS.standardOffer.demoDurationMinutes;
const speakingAiVisibility = getProgrammeAiVisibility('/speaking');
const seoTitle = 'Public Speaking & Communication Classes for Kids | Tiny Steps';
const seoDescription =
  'Live 1:1 public speaking and communication classes for kids in India and worldwide. Build structured answers, storytelling, presentations and communication confidence in 35-minute classes.';

const SPEAKING_SEO_KEYWORDS = [
  'public speaking classes for kids online',
  'public speaking classes for kids',
  'communication skills classes for kids online',
  'communication classes for kids',
  '1 to 1 public speaking classes for kids',
  'online public speaking classes for kids India',
  'public speaking classes for kids in India',
  'online communication classes for kids',
  'storytelling classes for kids online',
  'presentation skills classes for kids',
  'show and tell practice for kids',
  'public speaking classes for kids worldwide',
];

const faqItems = [
  {
    question: 'What do public speaking and communication classes for kids teach?',
    answer:
      'Tiny Steps focuses on structured answers, storytelling, show-and-tell, presentation skills, audience awareness, clear expression, listening, idea organisation, and communication confidence through guided live speaking practice.',
  },
  {
    question: 'What is the difference between spoken English and public speaking classes?',
    answer:
      'Spoken English focuses mainly on everyday conversation, fuller sentences, response fluency, and comfortable English speaking. Public speaking and communication classes add structured answers, storytelling, presentations, show-and-tell, audience awareness, and school communication. Children whose main need is conversational fluency should use the dedicated Spoken English programme.',
  },
  {
    question: 'Are communication-skills classes included in the Tiny Steps Speaking programme?',
    answer:
      'Yes. General communication-skills work such as organising ideas, answering clearly, listening and responding, storytelling, classroom participation, and presentation confidence is part of the Tiny Steps Speaking & Communication pathway.',
  },
  {
    question: 'When is the confidence-building programme a better fit?',
    answer:
      'If the primary difficulty is hesitation, participation confidence, or speaking comfort across situations rather than public-speaking structure or communication skills, the dedicated Confidence Building programme may be the better starting point. The free assessment helps separate these needs.',
  },
  {
    question: 'What ages are the Tiny Steps Public Speaking levels for?',
    answer:
      `Basic Public Speaking is designed for ${speakingFacts.levels.beginner.ageRange.label} and has ${speakingFacts.levels.beginner.lessonCount} lessons. Advanced Public Speaking is designed for ${speakingFacts.levels.advanced.ageRange.label} and has ${speakingFacts.levels.advanced.lessonCount} lessons. The ranges overlap at age 7, so placement also considers speaking readiness and current skill level.`,
  },
  {
    question: 'Are Tiny Steps public speaking classes live and 1:1?',
    answer:
      `Yes. Standard Tiny Steps 1:1 classes are live online and run for ${PUBLIC_SESSION_DURATION_LABEL}. Small-group options may also be available for selected schedules or programme fits.`,
  },
  {
    question: 'Can families outside India join public speaking classes?',
    answer:
      'Yes. Tiny Steps supports families in India and worldwide, including NRI families and families in the UAE, United States, United Kingdom, Australia, Singapore, and other locations, subject to compatible teacher timings and learning fit.',
  },
  {
    question: 'How can parents see speaking progress?',
    answer:
      'Compare fresh speaking tasks over time. Look for longer and clearer responses, better idea organisation, stronger storytelling or presentation structure, less prompting, more confident delivery, and the ability to transfer the same skill to a new speaking task.',
  },
  {
    question: 'Can parents see a Tiny Steps class sample before enrolling?',
    answer:
      'Yes. The class samples page shows how Tiny Steps live classes are structured and how teachers guide children through speaking, reading, grammar, and other learning tasks. A sample helps parents understand the teaching style, while the free 1:1 assessment is used to understand the individual child.',
  },
];

const speakingPathwayCards = [
  {
    name: 'Ideas and listening',
    description: 'Build attention, idea recall, listening, and guided response readiness before speaking.',
  },
  {
    name: 'Complete spoken responses',
    description: 'Help children expand short answers into complete, relevant responses for the task.',
  },
  {
    name: 'Structured answers',
    description: 'Organise ideas clearly so answers have a beginning, useful detail, and a clear ending.',
  },
  {
    name: 'Storytelling',
    description: 'Develop sequencing, relevant detail, expressive delivery, and a natural story flow.',
  },
  {
    name: 'Clear communication',
    description: 'Improve vocabulary choice, explanation clarity, listening-and-response skills, and purposeful delivery.',
  },
  {
    name: 'Presentation confidence',
    description: 'Build readiness for show-and-tell, classroom discussions, presentations, and audience-facing speaking.',
  },
];


const publicSpeakingLevelArchitecture = [
  {
    name: 'Public Speaking Foundations',
    path: speakingFacts.levels.beginner.canonicalCoursePath,
    description: `${speakingFacts.levels.beginner.ageRange.label} • ${speakingFacts.levels.beginner.lessonCount} lessons • organised responses, picture talk, show-and-tell, storytelling foundations, and short presentation readiness.`,
  },
  {
    name: 'Public Speaking Excellence',
    path: speakingFacts.levels.advanced.canonicalCoursePath,
    description: `${speakingFacts.levels.advanced.ageRange.label} • ${speakingFacts.levels.advanced.lessonCount} lessons • longer structured talks, storytelling, presentations, impromptu speaking, guided debate, and stronger delivery.`,
  },
];

const speakingSpecialistPathways = [
  {
    name: 'Spoken English',
    path: '/spoken-english-classes-for-kids-online',
    description: 'Use when everyday conversation, fuller responses, vocabulary in use, or conversational fluency is the main goal.',
  },
  {
    name: 'Confidence Building',
    path: '/confidence-building-program-kids',
    description: 'Use when speaking comfort, participation, hesitation, or dependence on prompting is the primary barrier.',
  },
];

export default function SpeakingPage() {
  const canonicalPath = '/speaking';
  const canonicalUrl = `${PUBLIC_FACTS.primaryWebsite}${canonicalPath}`;

  useEffect(() => {
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
        { '@type': 'ListItem', position: 2, name: 'Curriculum', item: 'https://tinystepslearning.com/curriculum' },
        { '@type': 'ListItem', position: 3, name: 'Public Speaking Classes for Kids', item: canonicalUrl },
      ],
    };

    const webpageSchema = {
      ...createWebPageSchema({
        name: 'Public Speaking & Communication Classes for Kids',
        description: seoDescription,
        url: canonicalUrl,
      }),
      '@id': `${canonicalUrl}#webpage`,
      about: [
        { '@type': 'Thing', name: 'Public speaking classes for kids' },
        { '@type': 'Thing', name: 'Communication skills for kids' },
        { '@type': 'Thing', name: 'Structured spoken answers' },
        { '@type': 'Thing', name: 'Storytelling' },
        { '@type': 'Thing', name: 'Presentations and audience awareness' },
      ],
      speakable: buildSpeakableSpecification([
        '.ts-speaking-answer-title',
        '.ts-speaking-answer-summary',
      ]),
    };

    const pathwayItemListSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Tiny Steps speaking and communication pathway',
      url: canonicalUrl,
      numberOfItems: speakingPathwayCards.length,
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      itemListElement: speakingPathwayCards.map((card, index) => ({
        '@type': 'ListItem',
        position: index + 1,
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

    const publicSpeakingLevelsSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': `${canonicalUrl}#public-speaking-levels`,
      name: 'Tiny Steps Public Speaking levels',
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      numberOfItems: publicSpeakingLevelArchitecture.length,
      itemListElement: publicSpeakingLevelArchitecture.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'WebPage',
          name: item.name,
          url: `${PUBLIC_FACTS.primaryWebsite}${item.path}`,
          description: item.description,
        },
      })),
    };

    const speakingSpecialistPathwaysSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': `${canonicalUrl}#speaking-specialist-pathways`,
      name: 'Tiny Steps adjacent speaking specialist pathways',
      itemListOrder: 'https://schema.org/ItemListUnordered',
      numberOfItems: speakingSpecialistPathways.length,
      itemListElement: speakingSpecialistPathways.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'WebPage',
          name: item.name,
          url: `${PUBLIC_FACTS.primaryWebsite}${item.path}`,
          description: item.description,
        },
      })),
    };

    const speakingEvidenceSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': `${canonicalUrl}#evidence-sources`,
      name: 'Tiny Steps Speaking evidence sources',
      itemListOrder: 'https://schema.org/ItemListOrderUnordered',
      numberOfItems: SPEAKING_EVIDENCE_SURFACES.length,
      itemListElement: SPEAKING_EVIDENCE_SURFACES.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'WebPage',
          name: item.title,
          url: `${PUBLIC_FACTS.primaryWebsite}${item.sourcePath}`,
          description: `${item.summary} Evidence boundary: ${item.doesNotProve[0]}.`,
        },
      })),
    };

    applySeo({
      title: seoTitle,
      description: seoDescription,
      canonicalPath,
      robots: 'index,follow',
      ogType: 'website',
      keywords: SPEAKING_SEO_KEYWORDS,
      jsonLd: [breadcrumbSchema, webpageSchema, pathwayItemListSchema, publicSpeakingLevelsSchema, speakingSpecialistPathwaysSchema, speakingEvidenceSchema, faqSchema],
    });
  }, [canonicalPath, canonicalUrl]);

  return (
    <div className="bg-[#fbfbfd] pb-12">
      <section className="relative overflow-hidden px-4 pb-8 pt-7 sm:px-5 md:pb-10 md:pt-9 lg:px-8 lg:pb-12">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#faf7ff_0%,#fff_70%,#fbfbfd_100%)]" />
        <div className="pointer-events-none absolute left-[-8%] top-[-30%] h-[560px] w-[560px] rounded-full bg-violet-200/35 blur-[120px]" />
        <div className="pointer-events-none absolute right-[-4%] top-[-22%] h-[520px] w-[520px] rounded-full bg-orange-100/70 blur-[120px]" />

        <div className="relative mx-auto max-w-7xl">
          <nav aria-label="Breadcrumb" className="mb-4 text-xs text-slate-600 sm:text-sm">
            <ol className="flex flex-wrap items-center gap-2">
              <li><Link to="/" className="hover:text-slate-900 hover:underline">Home</Link></li>
              <li aria-hidden="true">›</li>
              <li><Link to="/curriculum" className="hover:text-slate-900 hover:underline">Curriculum</Link></li>
              <li aria-hidden="true">›</li>
              <li className="font-medium text-slate-900">Public Speaking Classes for Kids</li>
            </ol>
          </nav>

          <div className="grid gap-7 lg:grid-cols-[1.06fr_0.94fr] lg:items-center lg:gap-10">
            <div>
              <p className="inline-flex rounded-full border border-violet-200/80 bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-800 shadow-[0_8px_22px_rgba(124,58,237,0.08)] backdrop-blur">
                Structured speaking for children
              </p>
              <h1 className="mt-5 max-w-[790px] text-[clamp(2.65rem,8vw,4.65rem)] font-black leading-[0.95] tracking-[-0.055em] text-[#172033]">
                Public Speaking & Communication Classes for Kids
              </h1>
              <p className="mt-5 max-w-[700px] text-base font-medium leading-7 text-slate-700 md:text-[1.08rem] md:leading-8">
                Live 1:1 public speaking and communication classes for kids in India and worldwide, building structured answers, storytelling, show-and-tell, presentations, audience awareness, and clearer communication.
              </p>
              <p className="mt-3 max-w-[680px] text-sm leading-6 text-slate-600 md:text-[15px] md:leading-7">
                Standard live 1:1 classes are {PUBLIC_SESSION_DURATION_LABEL}. Assessment separates public-speaking structure from everyday spoken-English, grammar, or confidence-only needs before placement.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link to="/book-demo" className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#182338] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(23,32,51,0.18)] transition hover:bg-[#111b2d]">
                  Book Free {demoMinutes}-Minute Demo
                </Link>
                <Link to="/curriculum?tab=speaking" className="inline-flex min-h-[46px] items-center justify-center rounded-full border border-slate-300/80 bg-white/85 px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-white">
                  View Full Curriculum Roadmap
                </Link>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {['Structured answers', 'Storytelling & presentations', `${PUBLIC_SESSION_DURATION_LABEL} live 1:1`, 'India + worldwide'].map((chip) => (
                  <span key={chip} className="rounded-full border border-slate-200/80 bg-white/75 px-3 py-1.5 text-xs font-medium text-slate-600 backdrop-blur sm:px-3.5 sm:text-sm">
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            <ProgrammeHeroSnapshot
              variant="speaking"
              eyebrow="Speaking programme focus"
              title="What this programme builds"
              summary="This pathway develops structured and audience-facing communication rather than ordinary conversational fluency alone."
              items={[
                'Structured answers',
                'Storytelling',
                'Show-and-tell',
                'Presentations',
                'Audience awareness',
                'Clear communication',
              ]}
              footer={
                <>
                  Everyday conversation belongs to{' '}
                  <Link to="/spoken-english-classes-for-kids-online" className="font-semibold text-slate-900 underline underline-offset-2">
                    Spoken English
                  </Link>
                  ; confidence-only barriers belong to{' '}
                  <Link to="/confidence-building-program-kids" className="font-semibold text-slate-900 underline underline-offset-2">
                    Confidence Building
                  </Link>.
                </>
              }
            />
          </div>
        </div>
      </section>

      <section className="px-4 py-5 sm:px-5 md:py-7 lg:px-6">
        <div className="mx-auto grid max-w-6xl gap-4 border-y border-slate-200/80 py-5 md:grid-cols-[0.28fr_0.72fr] md:items-start md:gap-8 md:py-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-700">Parent clarity</p>
          <div>
            <h2 className="ts-speaking-answer-title text-xl font-semibold tracking-[-0.025em] text-slate-950 md:text-2xl">
              Quick Answer: What do public speaking classes for kids include?
            </h2>
            <p className="ts-speaking-answer-summary mt-2 max-w-[930px] text-sm leading-6 text-slate-600 md:text-[15px] md:leading-7">
              Public Speaking & Communication is for children who can already communicate at a basic level and need stronger structured answers, idea organisation, storytelling, show-and-tell, presentations, audience awareness, and audience-facing communication practice. Everyday conversational fluency belongs to Spoken English; if the main difficulty is one-word everyday answers or sentence formation itself, Spoken English or Grammar may be the better starting point. Confidence-only barriers belong to Confidence Building. The free {demoMinutes}-minute 1:1 assessment helps separate these needs before placement.
            </p>
          </div>
        </div>
      </section>

      {speakingAiVisibility ? <ProgrammeIntentBoundary config={speakingAiVisibility} /> : null}

      <section className="px-4 py-7 sm:px-5 md:py-9 lg:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 md:grid-cols-[0.72fr_1.28fr] md:gap-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Start with the real difficulty</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">What is your child struggling with?</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Similar-looking speaking problems can need different support. Use these signs as a starting point, then let the free 1:1 assessment confirm the best pathway.
              </p>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              <Link to="/spoken-english-classes-for-kids-online" className="rounded-[18px] border border-emerald-100 bg-emerald-50/60 px-4 py-3.5 transition hover:-translate-y-0.5">
                <h3 className="text-sm font-semibold text-slate-950">Mostly one-word or very short everyday answers</h3>
                <p className="mt-1 text-sm leading-5 text-slate-600">Everyday conversation, fuller responses, and response fluency may be the first priority.</p>
                <span className="mt-2 inline-block text-xs font-semibold text-emerald-800">Check Spoken English ↗</span>
              </Link>

              <Link to="/grammar" className="rounded-[18px] border border-violet-100 bg-violet-50/60 px-4 py-3.5 transition hover:-translate-y-0.5">
                <h3 className="text-sm font-semibold text-slate-950">Sentence formation is inaccurate or incomplete</h3>
                <p className="mt-1 text-sm leading-5 text-slate-600">Tense, word order, articles, prepositions, or sentence control may need Grammar support.</p>
                <span className="mt-2 inline-block text-xs font-semibold text-violet-800">Check Grammar support ↗</span>
              </Link>

              <Link to="/confidence-building-program-kids" className="rounded-[18px] border border-amber-100 bg-amber-50/65 px-4 py-3.5 transition hover:-translate-y-0.5">
                <h3 className="text-sm font-semibold text-slate-950">Speaks well one-to-one but hesitates in class or groups</h3>
                <p className="mt-1 text-sm leading-5 text-slate-600">If language is adequate and hesitation itself is the barrier, specialist confidence support may fit better.</p>
                <span className="mt-2 inline-block text-xs font-semibold text-amber-800">Check Confidence Building ↗</span>
              </Link>

              <div className="rounded-[18px] border border-sky-100 bg-sky-50/65 px-4 py-3.5">
                <h3 className="text-sm font-semibold text-slate-950">Has ideas but cannot organise a clear answer</h3>
                <p className="mt-1 text-sm leading-5 text-slate-600">Complete responses, idea organisation, storytelling, and audience-facing communication are core Speaking territory.</p>
                <p className="mt-2 text-xs font-semibold text-sky-800">Best fit: this Speaking programme</p>
                <Link to="/courses/public-speaking-excellence" className="mt-2 inline-block text-xs font-semibold text-slate-700 underline underline-offset-2">
                  View Advanced level
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-7 sm:px-5 md:py-9 lg:px-6">
        <div className="mx-auto max-w-6xl border-y border-slate-200/80 py-6 md:py-8">
          <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:gap-10">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-700">Speaking pathway</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">Build from complete responses to audience-facing speaking</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Tiny Steps uses assessment-first placement so the child starts at the useful stage instead of repeating skills that are already secure.
              </p>

              <div className="mt-5 rounded-[18px] border border-slate-200 bg-white p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Supporting foundations — only when the assessment shows they are needed</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link to="/grammar" className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-slate-800">Grammar & sentence formation</Link>
                  <Link to="/spoken-english-classes-for-kids-online" className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-slate-800">Everyday conversation & fluency</Link>
                </div>
              </div>
            </div>

            <div className="grid gap-x-7 gap-y-4 md:grid-cols-2">
              {speakingPathwayCards.map((card, index) => (
                <article key={card.name} className="border-l border-slate-200 pl-4">
                  <span className="text-[10px] font-bold tracking-[0.16em] text-violet-600">0{index + 1}</span>
                  <h3 className="mt-1.5 text-sm font-semibold text-slate-950">{card.name}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{card.description}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-3">
            <article className="rounded-[20px] border border-amber-100 bg-white p-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-800">{speakingFacts.levels.beginner.ageRange.label}</span>
              <h3 className="mt-2 font-semibold text-slate-950">{speakingFacts.levels.beginner.label}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">{speakingFacts.levels.beginner.lessonCount} lessons for structured responses, picture talk, show-and-tell, storytelling foundations, and short presentation readiness.</p>
              <Link to={speakingFacts.levels.beginner.canonicalCoursePath} className="mt-2 inline-block text-xs font-semibold underline underline-offset-2">View Foundations details</Link>
            </article>

            <article className="rounded-[20px] border border-sky-100 bg-white p-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-sky-800">{speakingFacts.levels.advanced.ageRange.label}</span>
              <h3 className="mt-2 font-semibold text-slate-950">{speakingFacts.levels.advanced.label}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">{speakingFacts.levels.advanced.lessonCount} lessons for longer structured talks, storytelling, presentations, opinions, audience awareness, and stronger delivery.</p>
              <Link to={speakingFacts.levels.advanced.canonicalCoursePath} className="mt-2 inline-block text-xs font-semibold underline underline-offset-2">View Excellence details</Link>
            </article>

            <article className="rounded-[20px] border border-indigo-100 bg-white p-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-800">Assessment-led placement</span>
              <h3 className="mt-2 font-semibold text-slate-950">Age 7 sits in both ranges</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">Placement considers response length, organisation, storytelling, presentation readiness, confidence, and prompting—not age alone.</p>
              <Link to="/book-demo" className="mt-2 inline-block text-xs font-semibold underline underline-offset-2">Check the right speaking level</Link>
            </article>
          </div>
        </div>
      </section>

      <ResponsiveTeachingSection
        appearance="premium"
        id="teacher-delivery"
        program="Public Speaking & Communication"
        introduction="Teachers provide a predictable speaking routine: model a clear response, offer guided prompts, listen to the child’s attempt and help them retry. Prompts are reduced gradually so confidence grows alongside independent expression."
        steps={[
          { title: 'Model and organise', detail: 'The teacher shows how to form a complete answer, add relevant detail and organise ideas for the task.' },
          { title: 'Prompt and retry', detail: 'The child speaks in short, age-appropriate turns with encouraging, specific feedback and guided retries.' },
          { title: 'Reduce support', detail: 'Topics, examples, wait time and prompts adjust to readiness, then fade as the child speaks more independently.' },
        ]}
        observation="sentence completeness, idea organisation, clarity, response to feedback and how much prompting the child needs before speaking independently."
      />
      <div className="mx-auto -mt-2 flex max-w-6xl flex-wrap gap-x-4 gap-y-2 px-4 pb-3 text-sm sm:px-5 lg:px-6">
        <Link to="/class-samples" className="font-semibold text-slate-900 underline underline-offset-2">View real class samples</Link>
        <Link to="/book-demo" className="font-semibold text-slate-700 underline underline-offset-2">Book the free assessment</Link>
      </div>

      <section className="px-4 py-7 sm:px-5 md:py-9 lg:px-6">
        <div className="mx-auto max-w-6xl rounded-[26px] border border-violet-100 bg-violet-50/45 p-5 md:p-7">
          <div className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr] lg:gap-9">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-700">Progress evidence</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">How parents see speaking progress</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Tiny Steps tracks a speaking profile rather than one total score. Parents can look for less prompting, better idea organisation, clearer storytelling and presentations, and transfer to a fresh speaking task.
              </p>
              <Link to={SPEAKING_PROGRESS_FRAMEWORK_PATH} className="mt-4 inline-block text-sm font-semibold text-slate-900 underline underline-offset-2">
                Explore the Speaking Progress Framework
              </Link>
            </div>

            <div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {SPEAKING_PROGRESS_DIMENSIONS.slice(0, 6).map((dimension) => (
                  <div key={dimension.id} className="rounded-[16px] border border-white/80 bg-white/75 px-3 py-3 text-xs font-semibold leading-5 text-slate-700">
                    {dimension.label}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-500">
                Observation moves through {SPEAKING_PROGRESS_OBSERVATION_BANDS.length} support-to-independence bands and is checked again on fresh tasks.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section data-speaking-evidence-layer className="px-4 py-7 sm:px-5 md:py-9 lg:px-6">
        <div className="mx-auto max-w-6xl border-y border-slate-200/80 py-6 md:py-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Evidence before enrolment</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">What you can verify — and what each source does not prove</h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
            Tiny Steps separates observable teaching evidence, progress methodology, academic ownership, programme architecture, and first-party parent experience. No single source is treated as proof that every child will achieve the same outcome.
          </p>

          <div className="mt-5 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {SPEAKING_EVIDENCE_SURFACES.map((item) => (
              <details
                key={item.id}
                data-speaking-evidence-kind={item.kind}
                className="group rounded-[16px] border border-slate-200 bg-white"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{item.sourceLabel}</p>
                    <h3 className="mt-1 text-sm font-semibold text-slate-950">{item.title}</h3>
                  </div>
                  <span aria-hidden="true" className="text-lg text-slate-400 transition group-open:rotate-45">+</span>
                </summary>
                <div className="border-t border-slate-100 px-4 pb-4 pt-3">
                  <p className="text-xs leading-5 text-slate-600">{item.summary}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-500"><strong className="text-slate-700">Does not prove:</strong> {item.doesNotProve[0]}.</p>
                  <Link to={item.path} className="mt-3 inline-block text-xs font-semibold text-slate-900 underline underline-offset-2">Open evidence source</Link>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-7 sm:px-5 md:py-9 lg:px-6">
        <div className="mx-auto max-w-6xl rounded-[26px] border border-slate-200 bg-white p-5 md:p-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Decision support</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">What parents should compare before choosing speaking classes</h2>
          <div className="mt-5 grid gap-x-5 gap-y-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ['Structured live practice', 'Does the child speak, receive feedback, and retry?'],
              ['Assessment-led placement', 'Is the main need Public Speaking, Spoken English, Grammar, or confidence?'],
              ['Fresh-task progress', 'Can the child use the skill on a new prompt with less support?'],
              ['Clear programme boundaries', 'Does the provider avoid treating every hesitation as a public-speaking problem?'],
            ].map(([title, question], index) => (
              <article key={title} className="border-l border-slate-200 pl-4">
                <span className="text-[10px] font-bold tracking-[0.16em] text-violet-600">0{index + 1}</span>
                <h3 className="mt-1.5 text-sm font-semibold text-slate-950">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{question}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-7 sm:px-5 md:py-9 lg:px-6">
        <div className="mx-auto max-w-6xl rounded-[26px] bg-slate-950 p-5 text-white shadow-[0_24px_60px_rgba(15,23,42,0.12)] md:p-7">
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300">Free 1:1 starting check</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">What happens in the free speaking assessment?</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300 md:text-[15px]">
                The teacher may check how your child answers questions, organises ideas, tells a short story, responds to prompts, handles show-and-tell or presentation-style tasks, and speaks with confidence. Based on this, Tiny Steps recommends the right speaking, communication, spoken-English, grammar, or specialist confidence path.
              </p>
              <Link to="/book-demo" className="mt-5 inline-flex min-h-[46px] items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
                Book Free {demoMinutes}-Minute Demo
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-sm">
              {['Response structure', 'Idea organisation', 'Storytelling', 'Presentation readiness', 'Prompt independence', 'Speaking confidence'].map((item) => (
                <div key={item} className="rounded-[16px] border border-white/10 bg-white/5 px-3 py-3 text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-7 sm:px-5 md:py-9 lg:px-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">Parent evidence</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">What speaking parents noticed first</h2>
          <div className="mt-5">
            <TestimonialSnippets courseTag="speaking" title="Parent feedback from speaking families" />
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            These are curated first-party comments from individual families, not a promise that another child will have the same result. Review them together with <Link to="/class-samples" className="font-semibold underline underline-offset-2">class samples</Link>, the <Link to="/curriculum" className="font-semibold underline underline-offset-2">curriculum</Link>, the <Link to={SPEAKING_PROGRESS_FRAMEWORK_PATH} className="font-semibold underline underline-offset-2">Speaking Progress Framework</Link>, and your child&apos;s own assessment.
          </p>
        </div>
      </section>

      <section id="faq" className="px-4 py-7 sm:px-5 md:py-9 lg:px-6">
        <div className="mx-auto max-w-6xl py-2">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">Frequently asked questions</h2>
          <ProgrammeFaqAccordion items={faqItems} accent="violet" />
        </div>
      </section>

      <section className="px-4 pb-9 pt-6 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#f5f3ff_0%,#ffffff_52%,#fff7ed_100%)] p-6 text-center sm:p-8 md:p-9">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950 md:text-3xl">Not sure why your child hesitates while speaking?</h2>
          <p className="mx-auto mt-3 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
            Book one free {demoMinutes}-minute 1:1 online demo assessment class and let Tiny Steps identify whether the best next step is public speaking and communication, everyday spoken English, grammar support, or specialist confidence-building support.
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

      <ClusterSeoNav cluster="speaking" />
    </div>
  );
}
