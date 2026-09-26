import type { FC } from 'react';
import { Link, useParams } from 'react-router-dom';
import Meta from '../components/common/Meta';
import KnowledgeBreadcrumbs from '../components/common/KnowledgeBreadcrumbs';
import { GRAMMAR_COURSES } from '../content/grammarCurriculum';
import {
  getPublishedGrammarResourcePageById,
  getPublishedGrammarResourcePageBySlug,
  type GrammarCurriculumRef,
  type GrammarPublishedResourcePage,
} from '../lib/grammarPublicationRegistry.js';
import {
  buildBreadcrumbListSchema,
  buildSpeakableSpecification,
  getBreadcrumbTrail,
} from '../lib/breadcrumbAeoGeoRegistry.js';
import {
  ORGANIZATION_ID,
  SITE_ORIGIN,
  WEBSITE_ID,
  organizationSchema,
  websiteSchema,
} from '../lib/schemas';
import NotFoundPage from './NotFoundPage';

const LEVEL_LABELS = {
  beginner: 'Beginner Grammar',
  advanced: 'Advanced Grammar',
} as const;

const STAGE_LABELS = {
  beginner: {
    1: 'Word Foundations',
    2: 'Grammar Basics',
    3: 'Sentence Building',
    4: 'Conjunctions & Adverbs',
    5: 'Tenses Basics',
    6: 'Sentence Writing & Revision',
  },
  advanced: {
    1: 'Sentence Foundations',
    2: 'Tense Control',
    3: 'Grammar Accuracy',
    4: 'Connecting Ideas',
    5: 'Advanced Sentence Craft',
    6: 'Speaking & Writing Mastery',
  },
} as const;

const RELATED_LABELS: Record<string, string> = {
  '/blog/grammar-nouns-to-paragraphs': 'Grammar roadmap: nouns to paragraphs',
  '/blog/punctuation-and-capital-letters-for-kids': 'Punctuation and capital letters',
  '/blog/how-to-improve-sentence-formation-in-kids': 'How to improve sentence formation',
  '/blog/grammar-subject-verb': 'Subject–verb agreement',
  '/blog/grammar-tenses': 'English tenses for kids',
  '/blog/grammar-conjunctions': 'Conjunctions for kids',
  '/blog/grammar-editing-camp': 'Grammar editing practice',
  '/blog/how-to-teach-paragraph-writing-to-kids': 'How to teach paragraph writing',
  '/blog/grammar-creative-writing': 'Creative writing scaffolds',
  '/blog/how-to-teach-storytelling-to-kids': 'Storytelling for kids',
  '/writing-classes-for-kids': 'Writing support for kids',
};

function curriculumLesson(ref: GrammarCurriculumRef) {
  const course = GRAMMAR_COURSES[ref.courseId];
  const lesson = course.lessons.find((candidate) => candidate.lessonNumber === ref.lessonNumber);
  return {
    courseLabel: course.label,
    lessonNumber: ref.lessonNumber,
    lessonTitle: lesson?.label ?? `Lesson ${ref.lessonNumber}`,
  };
}

function learningLink(id: string) {
  const target = getPublishedGrammarResourcePageById(id);
  return target ? { id, label: target.cardTitle, to: target.path } : null;
}

function relatedLabel(path: string) {
  if (RELATED_LABELS[path]) return RELATED_LABELS[path];
  const segment = path.split('/').filter(Boolean).pop() || 'related resource';
  return segment
    .split('-')
    .map((part) => part ? part[0].toUpperCase() + part.slice(1) : part)
    .join(' ');
}

const BulletPanel: FC<{ title: string; items: readonly string[]; tone?: 'plain' | 'warning' | 'practice' }> = ({
  title,
  items,
  tone = 'plain',
}) => {
  const toneClass =
    tone === 'warning'
      ? 'border-amber-200 bg-amber-50/70'
      : tone === 'practice'
        ? 'border-emerald-200 bg-emerald-50/60'
        : 'border-slate-200 bg-white';

  return (
    <section className={`rounded-[1.6rem] border ${toneClass} p-5 sm:p-6`}>
      <h2 className="text-xl font-black tracking-[-0.02em] text-slate-950">{title}</h2>
      <ul className="mt-4 space-y-3 text-[15px] leading-7 text-slate-700">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <span aria-hidden="true" className="mt-[0.68rem] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};

const GrammarKnowledgePage: FC = () => {
  const { slug = '' } = useParams();
  const page = getPublishedGrammarResourcePageBySlug(slug) as GrammarPublishedResourcePage | null;
  if (!page) return <NotFoundPage />;

  const canonicalUrl = `${SITE_ORIGIN}${page.path}`;
  const breadcrumbItems = getBreadcrumbTrail({ pathname: page.path, title: page.cardTitle });
  const breadcrumbSchema = buildBreadcrumbListSchema(breadcrumbItems, SITE_ORIGIN);
  const stageLabel = STAGE_LABELS[page.level][page.stageOrder as keyof (typeof STAGE_LABELS)[typeof page.level]];
  const prerequisites = page.prerequisiteIds.map(learningLink).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const nextSteps = page.nextIds.map(learningLink).filter((item): item is NonNullable<typeof item> => Boolean(item));

  const definedTermId = `${canonicalUrl}#grammar-concept`;
  const definedTermSchema = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    '@id': definedTermId,
    name: page.label,
    description: page.quickAnswer,
    url: canonicalUrl,
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      '@id': `${SITE_ORIGIN}/resources/grammar#grammar-knowledge`,
      name: 'Tiny Steps Grammar & Writing Resources',
      url: `${SITE_ORIGIN}/resources/grammar`,
    },
  };

  const learningResourceSchema = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    '@id': `${canonicalUrl}#learning-resource`,
    name: page.cardTitle,
    url: canonicalUrl,
    description: page.quickAnswer,
    learningResourceType: 'Grammar guide',
    educationalLevel: page.level === 'beginner' ? 'Beginner grammar' : 'Advanced grammar',
    teaches: page.label,
    isAccessibleForFree: true,
    inLanguage: 'en-IN',
    publisher: { '@id': ORGANIZATION_ID },
  };

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${canonicalUrl}#webpage`,
    url: canonicalUrl,
    name: page.cardTitle,
    description: page.quickAnswer,
    abstract: page.quickAnswer,
    inLanguage: 'en-IN',
    isPartOf: { '@id': WEBSITE_ID },
    publisher: { '@id': ORGANIZATION_ID },
    breadcrumb: { '@id': breadcrumbSchema['@id'] },
    mainEntity: { '@id': definedTermId },
    about: { '@type': 'Thing', name: 'Grammar and writing for children', url: `${SITE_ORIGIN}/resources/grammar` },
    speakable: buildSpeakableSpecification(['.ts-answer-title', '.ts-answer-summary']),
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_9%_4%,rgba(16,185,129,0.08),transparent_25%),radial-gradient(circle_at_91%_7%,rgba(14,165,233,0.07),transparent_23%),linear-gradient(180deg,#fbfcfa_0%,#ffffff_52%,#f8fafc_100%)] text-slate-950">
      <Meta
        title={`${page.cardTitle} | Examples & Practice | Tiny Steps`}
        description={`Learn ${page.label.toLowerCase()} for kids with clear examples, common mistakes, curriculum placement and practical next steps from Tiny Steps.`}
        canonical={canonicalUrl}
        robots="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
        jsonLd={[organizationSchema, websiteSchema, webPageSchema, learningResourceSchema, definedTermSchema, breadcrumbSchema]}
      />

      <article className="mx-auto max-w-5xl px-6 pb-16 pt-7 sm:pt-9 lg:pb-20">
        <KnowledgeBreadcrumbs items={breadcrumbItems} />

        <header className="mt-7 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.18em]">
            <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-emerald-800">Grammar guide</span>
            <span className="text-slate-400">{LEVEL_LABELS[page.level]} · Stage {page.stageOrder}: {stageLabel}</span>
          </div>

          <h1 className="ts-answer-title mt-4 text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl sm:leading-[1.05]">
            {page.parentQuestion}
          </h1>

          <div className="mt-6 rounded-[1.7rem] border border-emerald-100 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-7">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700">Quick answer</p>
            <p className="ts-answer-summary mt-3 text-lg font-semibold leading-8 text-slate-800 sm:text-xl">{page.quickAnswer}</p>
          </div>
        </header>

        <section className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.12fr)_minmax(18rem,0.88fr)]">
          <section className="rounded-[1.7rem] border border-slate-200 bg-white p-5 sm:p-7">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">What to notice</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.025em] text-slate-950">{page.label}</h2>
            <p className="mt-4 text-[15px] leading-7 text-slate-700">{page.teachingBoundary}</p>
          </section>

          <aside className="rounded-[1.7rem] border border-teal-100 bg-teal-50/55 p-5 sm:p-7">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-teal-700">Examples</p>
            <div className="mt-4 space-y-2.5">
              {page.examples.map((example) => (
                <p key={example} className="rounded-xl border border-white/90 bg-white px-3.5 py-2.5 text-sm font-semibold leading-6 text-slate-800 shadow-sm">
                  {example}
                </p>
              ))}
            </div>
          </aside>
        </section>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <BulletPanel title="How to teach it" items={page.teachingSteps} />
          <BulletPanel title="Common mistakes to watch for" items={page.commonMistakes} tone="warning" />
        </div>

        <section className="mt-5 rounded-[1.7rem] border border-violet-100 bg-violet-50/45 p-5 sm:p-7">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-violet-700">Where this fits</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.025em] text-slate-950">
                {LEVEL_LABELS[page.level]} · Stage {page.stageOrder}: {stageLabel}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                The curriculum links below show where Tiny Steps explicitly teaches or revisits this concept. Children may need prerequisite review before moving forward.
              </p>
            </div>
            <div className="space-y-2">
              {page.curriculumRefs.map((ref) => {
                const resolved = curriculumLesson(ref);
                return (
                  <div key={`${ref.courseId}-${ref.lessonNumber}`} className="rounded-xl border border-violet-100 bg-white px-4 py-3 text-sm leading-6 text-slate-700">
                    <span className="font-black text-slate-950">{resolved.courseLabel}</span>
                    <span className="block">Lesson {resolved.lessonNumber}: {resolved.lessonTitle}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.75fr)]">
          <BulletPanel title="Simple practice ideas" items={page.practiceIdeas} tone="practice" />
          <section className="rounded-[1.6rem] bg-slate-950 p-5 text-white sm:p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-300">Learning sequence</p>
            {prerequisites.length ? (
              <div className="mt-5">
                <h3 className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Helpful first</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {prerequisites.map((item) => (
                    <Link key={item.id} to={item.to} className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm font-bold text-white hover:bg-white/15">
                      {item.label} →
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
            {nextSteps.length ? (
              <div className="mt-5">
                <h3 className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">What can come next</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {nextSteps.map((item) => (
                    <Link key={item.id} to={item.to} className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm font-bold text-white hover:bg-white/15">
                      {item.label} →
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        </div>

        {(page.relatedPaths.length || page.practicePaths.length) ? (
          <section className="mt-8 rounded-[1.8rem] border border-slate-200 bg-white p-5 sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Related Tiny Steps resources</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.025em] text-slate-950">Keep this skill connected to the wider grammar pathway</h2>
              </div>
              <Link to="/resources/grammar" className="text-sm font-black text-emerald-700 hover:text-emerald-900">
                Back to Grammar & Writing →
              </Link>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[...page.relatedPaths, ...page.practicePaths].map((to) => (
                <Link
                  key={to}
                  to={to}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50/40 hover:text-emerald-900"
                >
                  {relatedLabel(to)}
                  <span className="mt-1 block break-words text-xs font-medium text-slate-400">{to}</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-8 rounded-[1.8rem] bg-slate-950 p-6 text-white sm:p-8">
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-300">Need a clearer starting point?</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.025em]">Use the Grammar & Writing hub to move through the skills in curriculum order.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Start with the earliest insecure skill, practise it in fresh sentences, and move forward when the child can use it with less support.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:min-w-56">
              <Link to="/resources/grammar" className="rounded-full bg-white px-5 py-3 text-center text-sm font-black text-slate-950 transition hover:bg-emerald-50">
                Browse Grammar Resources
              </Link>
              <Link to="/grammar" className="rounded-full border border-white/35 px-5 py-3 text-center text-sm font-black text-white transition hover:border-white/60">
                Explore Live Grammar Support
              </Link>
            </div>
          </div>
        </section>
      </article>
    </main>
  );
};

export default GrammarKnowledgePage;
