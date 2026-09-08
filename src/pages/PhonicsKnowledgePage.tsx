import type { FC } from 'react';
import { Link, useParams } from 'react-router-dom';
import Meta from '../components/common/Meta';
import KnowledgeBreadcrumbs from '../components/common/KnowledgeBreadcrumbs';
import NotFoundPage from './NotFoundPage';
import {
  getPhonicsKnowledgeConcept,
  type PhonicsKnowledgeConcept,
} from '../content/phonicsKnowledge';
import {
  getPhonicsProgrammaticPilotPageByConceptId,
  getPhonicsProgrammaticPilotPageBySlug,
} from '../lib/phonicsProgrammaticPilot.js';
import { getCanonicalTopicOwnerPath } from '../lib/canonicalTopicOwnershipRegistry.js';
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

type LearningLink = {
  id: string;
  label: string;
  to: string;
};

function learningLink(conceptId: string): LearningLink | null {
  const published = getPhonicsProgrammaticPilotPageByConceptId(conceptId);
  if (published) return { id: conceptId, label: published.cardTitle, to: published.path };

  const concept = getPhonicsKnowledgeConcept(conceptId);
  if (!concept) return null;
  if (concept.canonicalOwnerTopicId) {
    return { id: conceptId, label: concept.label, to: getCanonicalTopicOwnerPath(concept.canonicalOwnerTopicId) };
  }
  const support = concept.supportingPaths[0];
  return support ? { id: conceptId, label: concept.label, to: support } : null;
}

const MiniLinkList: FC<{ title: string; items: readonly LearningLink[] }> = ({ title, items }) => {
  if (!items.length) return null;
  return (
    <div>
      <h3 className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <Link
            key={`${title}-${item.id}-${item.to}`}
            to={item.to}
            className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-bold text-slate-700 transition hover:border-sky-300 hover:text-sky-800"
          >
            {item.label} <span aria-hidden="true">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

const BulletPanel: FC<{ title: string; items: readonly string[]; tone?: 'plain' | 'warning' | 'practice' }> = ({ title, items, tone = 'plain' }) => {
  const toneClass = tone === 'warning'
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

function uniqueRelatedPaths(concept: PhonicsKnowledgeConcept) {
  return Array.from(new Set(concept.supportingPaths)).slice(0, 3);
}

export default function PhonicsKnowledgePage() {
  const { slug = '' } = useParams();
  const page = getPhonicsProgrammaticPilotPageBySlug(slug);
  if (!page) return <NotFoundPage />;

  const { concept } = page;
  const canonicalUrl = `${SITE_ORIGIN}${page.path}`;
  const breadcrumbItems = getBreadcrumbTrail({ pathname: page.path, title: page.cardTitle });
  const breadcrumbSchema = buildBreadcrumbListSchema(breadcrumbItems, SITE_ORIGIN);
  const prerequisiteLinks = concept.prerequisiteIds.map(learningLink).filter((item): item is LearningLink => Boolean(item));
  const nextLinks = concept.nextIds.map(learningLink).filter((item): item is LearningLink => Boolean(item));
  const relatedPaths = uniqueRelatedPaths(concept);

  const definedTermId = `${canonicalUrl}#phonics-concept`;
  const definedTermSchema = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    '@id': definedTermId,
    name: concept.label,
    description: concept.quickAnswer,
    url: canonicalUrl,
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      '@id': `${SITE_ORIGIN}/resources/phonics#phonics-knowledge`,
      name: 'Tiny Steps Phonics & Reading Resources',
      url: `${SITE_ORIGIN}/resources/phonics`,
    },
  };

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${canonicalUrl}#webpage`,
    url: canonicalUrl,
    name: page.seoTitle,
    description: page.seoDescription,
    abstract: concept.quickAnswer,
    inLanguage: 'en-IN',
    isPartOf: { '@id': WEBSITE_ID },
    publisher: { '@id': ORGANIZATION_ID },
    breadcrumb: { '@id': breadcrumbSchema['@id'] },
    mainEntity: { '@id': definedTermId },
    about: {
      '@type': 'Thing',
      name: 'Phonics and reading for children',
      url: `${SITE_ORIGIN}/resources/phonics`,
    },
    speakable: buildSpeakableSpecification(['.ts-answer-title', '.ts-answer-summary']),
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_8%_4%,rgba(14,165,233,0.09),transparent_24%),radial-gradient(circle_at_92%_8%,rgba(251,146,60,0.08),transparent_22%),linear-gradient(180deg,#fbfaf7_0%,#ffffff_52%,#f8fafc_100%)] text-slate-950">
      <Meta
        title={page.seoTitle}
        description={page.seoDescription}
        canonical={canonicalUrl}
        robots="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
        jsonLd={[organizationSchema, websiteSchema, webPageSchema, definedTermSchema, breadcrumbSchema]}
      />

      <article className="mx-auto max-w-5xl px-6 pb-16 pt-7 sm:pt-9 lg:pb-20">
        <KnowledgeBreadcrumbs items={breadcrumbItems} />

        <header className="mt-7 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.18em]">
            <span className="rounded-full bg-sky-100 px-3 py-1.5 text-sky-800">Focused phonics guide</span>
            <span className="text-slate-400">{page.group}</span>
          </div>
          <h1 className="ts-answer-title mt-4 text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl sm:leading-[1.05]">
            {concept.parentQuestion}
          </h1>
          <div className="mt-6 rounded-[1.7rem] border border-sky-100 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-7">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-sky-700">Quick answer</p>
            <p className="ts-answer-summary mt-3 text-lg font-semibold leading-8 text-slate-800 sm:text-xl">
              {concept.quickAnswer}
            </p>
          </div>
        </header>

        <section className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(16rem,0.75fr)]">
          <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 sm:p-7">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Pattern to notice</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.025em] text-slate-950">{concept.label}</h2>
            {concept.standardTerm ? <p className="mt-2 text-sm leading-6 text-slate-500">Standard term: {concept.standardTerm}</p> : null}
            {concept.phonemeDescription ? <p className="mt-4 text-[15px] leading-7 text-slate-700">{concept.phonemeDescription}</p> : null}
            {concept.graphemes.length ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {concept.graphemes.map((grapheme) => (
                  <span key={grapheme} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-base font-black text-slate-800">{grapheme}</span>
                ))}
              </div>
            ) : null}
          </div>

          <aside className="rounded-[1.7rem] border border-violet-100 bg-violet-50/55 p-5 sm:p-7">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-violet-700">Example words</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {concept.exampleWords.map((word) => (
                <span key={word} className="rounded-full bg-white px-3 py-2 text-sm font-bold text-slate-800 shadow-sm">{word}</span>
              ))}
            </div>
            <p className="mt-5 text-xs leading-5 text-slate-500">
              Use examples only when the child already knows the other sound-spelling patterns in the word. These are teaching illustrations, not a fixed first-reading list.
            </p>
          </aside>
        </section>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <BulletPanel title="How to teach this pattern" items={concept.teachingNotes} />
          <BulletPanel title="Common confusions to watch for" items={concept.commonConfusions} tone="warning" />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.72fr)]">
          <BulletPanel title="Simple practice ideas" items={concept.practiceIdeas} tone="practice" />
          <section className="rounded-[1.6rem] border border-slate-200 bg-slate-950 p-5 text-white sm:p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-300">Learning sequence</p>
            <div className="mt-5 space-y-6">
              <MiniLinkList title="Helpful first" items={prerequisiteLinks} />
              <MiniLinkList title="What can come next" items={nextLinks} />
            </div>
          </section>
        </div>

        {concept.contrastWords.length ? (
          <section className="mt-5 rounded-[1.6rem] border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="text-xl font-black tracking-[-0.02em] text-slate-950">Useful contrasts</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Use contrasts after the main pattern is secure. They help children see where a useful phonics generalisation stops applying.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {concept.contrastWords.map((word) => <span key={word} className="rounded-full border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700">{word}</span>)}
            </div>
          </section>
        ) : null}

        <section className="mt-8 rounded-[1.8rem] border border-slate-200 bg-white p-5 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Related Tiny Steps resources</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.025em] text-slate-950">Keep the pattern inside the bigger reading pathway</h2>
            </div>
            <Link to="/resources/phonics" className="text-sm font-black text-sky-700 hover:text-sky-900">Back to Phonics & Reading →</Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {relatedPaths.map((to) => (
              <Link key={to} to={to} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-700 transition hover:border-sky-200 hover:bg-sky-50/50 hover:text-sky-900">
                {to.startsWith('/blog/') ? 'Read the related guide' : to.includes('game') ? 'Use focused practice' : 'Open the related resource'}
                <span className="mt-1 block break-words text-xs font-medium text-slate-400">{to}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[1.8rem] bg-slate-950 p-6 text-white sm:p-8">
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-300">Need help finding the actual gap?</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.025em]">Use an assessment when practice alone is not showing what is stuck.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">The focused guide explains one pattern. A broader assessment can separate sound knowledge, blending, decoding, spelling and fluency needs.</p>
            </div>
            <Link to="/book-demo" className="rounded-full bg-white px-5 py-3 text-center text-sm font-black text-slate-950 transition hover:bg-sky-50">Book free assessment</Link>
          </div>
        </section>
      </article>
    </main>
  );
}
