import type { FC } from 'react';
import { Link } from 'react-router-dom';
import Meta from '../components/common/Meta';
import KnowledgeBreadcrumbs from '../components/common/KnowledgeBreadcrumbs';
import { buildBreadcrumbListSchema, buildSpeakableSpecification, getBreadcrumbTrail } from '../lib/breadcrumbAeoGeoRegistry.js';
import {
  VOCABULARY_AUTHORITY_REQUIREMENTS,
  VOCABULARY_KNOWLEDGE_STAGES,
} from '../lib/grammarVocabularyAuthorityRequirements.js';
import {
  VOCABULARY_AUTHORITY_ROUTE_MANIFEST,
  VOCABULARY_HUB_PATH,
} from '../lib/vocabularyAuthoritySeoManifest.js';
import { getRouteConfig } from '../lib/seo';
import {
  ORGANIZATION_ID,
  SITE_ORIGIN,
  WEBSITE_ID,
  organizationSchema,
  websiteSchema,
} from '../lib/schemas';

const publishedById = new Map(VOCABULARY_AUTHORITY_ROUTE_MANIFEST.map((entry) => [entry.id, entry]));
const requirementById = new Map(VOCABULARY_AUTHORITY_REQUIREMENTS.map((entry) => [entry.id, entry]));

const VocabularyHubPage: FC = () => {
  const seo = getRouteConfig(VOCABULARY_HUB_PATH);
  const title = seo?.title ?? 'Vocabulary Resources for Kids | Tiny Steps';
  const description = seo?.description ?? 'Build vocabulary through meaning, context, word relationships and independent use.';
  const canonicalUrl = `${SITE_ORIGIN}${VOCABULARY_HUB_PATH}`;

  const breadcrumbItems = getBreadcrumbTrail({ pathname: VOCABULARY_HUB_PATH, title: 'Vocabulary' });
  const breadcrumbSchema = buildBreadcrumbListSchema(breadcrumbItems, SITE_ORIGIN);

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${canonicalUrl}#webpage`,
    url: canonicalUrl,
    name: title,
    description,
    inLanguage: 'en-IN',
    isPartOf: { '@id': WEBSITE_ID },
    publisher: { '@id': ORGANIZATION_ID },
    breadcrumb: { '@id': breadcrumbSchema['@id'] },
    speakable: buildSpeakableSpecification(['.ts-answer-title', '.ts-answer-summary']),
    hasPart: VOCABULARY_AUTHORITY_ROUTE_MANIFEST.map((entry) => ({
      '@type': 'LearningResource',
      name: entry.cardTitle,
      url: `${SITE_ORIGIN}${entry.path}`,
    })),
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fbfaf8_0%,#ffffff_42%,#f7fafc_100%)] text-slate-950">
      <Meta
        title={title}
        description={description}
        canonical={canonicalUrl}
        jsonLd={[organizationSchema, websiteSchema, collectionSchema, breadcrumbSchema]}
      />

      <section className="mx-auto max-w-7xl px-6 pb-12 pt-6 sm:pb-16">
        <KnowledgeBreadcrumbs items={breadcrumbItems} className="mb-5 text-xs" />

        <div className="rounded-[2rem] border border-slate-200 bg-slate-950 px-6 py-9 text-white shadow-[0_24px_70px_rgba(15,23,42,0.14)] sm:px-9 sm:py-11">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-300">Vocabulary knowledge hub</p>
          <h1 className="ts-answer-title mt-3 max-w-4xl text-4xl font-black tracking-[-0.035em] sm:text-5xl">
            Build words children can understand, remember and actually use
          </h1>
          <p className="ts-answer-summary mt-5 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
            Tiny Steps vocabulary resources move from familiar everyday words into word relationships, morphology, context and independent speaking or writing. The goal is usable word knowledge—not memorising long disconnected lists.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/free-games/word-meaning-flashcards"
              className="rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950"
            >
              Practise in Vocabulary Adventure
            </Link>
            <Link
              to="/resources"
              className="rounded-full border border-white/30 px-5 py-3 text-sm font-black text-white"
            >
              All learning resources
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12 sm:py-14">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-700">Published authority guides</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-slate-950 sm:text-4xl">
              Explore all sixteen vocabulary authority guides
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              The full frozen Vocabulary architecture is now published: six GV4 guides, four GV5 natural-English and transfer guides, and six GV5B foundation-completion guides. Each page connects explanation to context and practice, while Vocabulary Adventure remains the practice surface.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {VOCABULARY_AUTHORITY_ROUTE_MANIFEST.map((entry, index) => (
              <Link
                key={entry.path}
                to={entry.path}
                className="group flex min-h-[210px] flex-col rounded-[1.5rem] border border-slate-200 bg-slate-50/65 p-5 transition hover:-translate-y-0.5 hover:border-violet-200 hover:bg-white hover:shadow-[0_18px_42px_rgba(15,23,42,0.08)]"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-violet-200 bg-violet-50 text-xs font-black text-violet-800">
                    V{index + 1}
                  </span>
                  <h3 className="text-lg font-black leading-6 text-slate-950 group-hover:text-violet-800">{entry.cardTitle}</h3>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-600">{entry.description}</p>
                <span className="mt-auto pt-5 text-sm font-black text-violet-800">Open vocabulary guide →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 sm:py-16">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Vocabulary progression</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-slate-950 sm:text-4xl">Six stages, one connected system</h2>
          <p className="mt-4 text-base leading-8 text-slate-600">
            All sixteen frozen authority topics are now published and linked through the six-stage progression. The stage view remains the canonical learning map for future discovery and practice integration.
          </p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {VOCABULARY_KNOWLEDGE_STAGES.map((stage) => {
            const published = stage.topicIds
              .map((id) => publishedById.get(id))
              .filter(Boolean);
            const total = stage.topicIds.length;

            return (
              <article key={stage.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-6">
                <div className="flex items-start gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-950 text-sm font-black text-white">
                    {stage.order}
                  </span>
                  <div>
                    <h3 className="text-xl font-black text-slate-950">{stage.label}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{stage.purpose}</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {stage.topicIds.map((topicId) => {
                    const publishedEntry = publishedById.get(topicId);
                    const requirement = requirementById.get(topicId);
                    if (publishedEntry) {
                      return (
                        <Link
                          key={topicId}
                          to={publishedEntry.path}
                          className="rounded-full border border-violet-200 bg-violet-50 px-3.5 py-2 text-xs font-black text-violet-900"
                        >
                          {publishedEntry.cardTitle}
                        </Link>
                      );
                    }

                    return (
                      <span
                        key={topicId}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-500"
                        title="Planned authority topic; not published yet"
                      >
                        {requirement?.label ?? topicId} · planned
                      </span>
                    );
                  })}
                </div>

                <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  {published.length} of {total} authority topics published
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-10 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-300">Practice what you learn</p>
            <h2 className="mt-2 text-2xl font-black">Use Vocabulary Adventure after the explanation</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              The game practises meanings, context clues, synonyms, antonyms and word recall. It stays the practice layer while this hub owns the vocabulary knowledge architecture.
            </p>
          </div>
          <Link to="/free-games/word-meaning-flashcards" className="rounded-full bg-white px-5 py-3 text-center text-sm font-black text-slate-950">
            Play Vocabulary Adventure
          </Link>
        </div>
      </section>
    </main>
  );
};

export default VocabularyHubPage;
