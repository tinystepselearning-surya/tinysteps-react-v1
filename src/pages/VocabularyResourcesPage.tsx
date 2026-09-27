import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpenText, Brain, MessageCircleMore, PenLine, Sparkles } from 'lucide-react';
import Meta from '../components/common/Meta';
import KnowledgeBreadcrumbs from '../components/common/KnowledgeBreadcrumbs';
import { VOCABULARY_AUTHORITY_ROUTE_MANIFEST, VOCABULARY_HUB_SEO } from '../lib/vocabularyAuthoritySeoManifest.js';
import { VOCABULARY_KNOWLEDGE_STAGES } from '../lib/grammarVocabularyAuthorityRequirements.js';
import { buildBreadcrumbListSchema, buildSpeakableSpecification } from '../lib/breadcrumbAeoGeoRegistry.js';
import { SITE_ORIGIN } from '../lib/schemas';

const LIVE_TOPIC_IDS = new Set(VOCABULARY_AUTHORITY_ROUTE_MANIFEST.map((entry) => entry.id));

const stageCards = VOCABULARY_KNOWLEDGE_STAGES.map((stage) => ({
  ...stage,
  liveCount: stage.topicIds.filter((id) => LIVE_TOPIC_IDS.has(id)).length,
})).filter((stage) => stage.liveCount > 0);

const VocabularyResourcesPage: FC = () => {
  const canonicalUrl = `${SITE_ORIGIN}/resources/vocabulary`;
  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Resources', path: '/resources' },
    { name: 'Vocabulary', path: '/resources/vocabulary' },
  ];

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${canonicalUrl}#webpage`,
    url: canonicalUrl,
    name: VOCABULARY_HUB_SEO.title,
    description: VOCABULARY_HUB_SEO.description,
    inLanguage: 'en-IN',
    isPartOf: { '@id': `${SITE_ORIGIN}/resources#webpage` },
    breadcrumb: { '@id': `${canonicalUrl}#breadcrumb` },
    speakable: buildSpeakableSpecification(),
    hasPart: VOCABULARY_AUTHORITY_ROUTE_MANIFEST.map((entry) => ({
      '@type': 'WebPage',
      name: entry.cardTitle,
      url: `${SITE_ORIGIN}${entry.path}`,
    })),
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_46%,#fafafa_100%)] text-slate-950">
      <Meta
        title={VOCABULARY_HUB_SEO.title}
        description={VOCABULARY_HUB_SEO.description}
        canonical={canonicalUrl}
        jsonLd={[
          webPageSchema,
          buildBreadcrumbListSchema(breadcrumbs, SITE_ORIGIN),
        ]}
      />

      <section className="border-b border-violet-100 bg-[radial-gradient(circle_at_12%_15%,rgba(139,92,246,0.12),transparent_27%),radial-gradient(circle_at_85%_18%,rgba(14,165,233,0.08),transparent_24%),linear-gradient(180deg,#faf7ff_0%,#ffffff_100%)]">
        <div className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
          <KnowledgeBreadcrumbs items={breadcrumbs} />
          <p className="mt-7 text-xs font-black uppercase tracking-[0.22em] text-violet-700">Vocabulary knowledge library</p>
          <h1 className="ts-answer-title mt-3 max-w-4xl text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl">
            Vocabulary resources for kids
          </h1>
          <p className="ts-answer-summary mt-5 max-w-4xl text-lg leading-8 text-slate-700">
            Build vocabulary from clear meaning into word relationships, context, word families and independent use. Start with a focused guide, then practise retrieval in Vocabulary Adventure and transfer new words into reading, speaking and writing.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/free-games/word-meaning-flashcards" className="inline-flex items-center gap-2 rounded-full bg-violet-700 px-5 py-3 text-sm font-black text-white transition hover:bg-violet-800">
              Practise vocabulary free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/resources" className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-800 transition hover:border-slate-400">
              All learning resources
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: BookOpenText, title: 'Understand meaning', body: 'Use child-friendly explanations and varied examples so a word is more than a memorised label.' },
            { icon: Brain, title: 'Connect the word', body: 'Compare synonyms, antonyms, contexts and word families so vocabulary becomes an organised network.' },
            { icon: Sparkles, title: 'Use it independently', body: 'Move from recognition into retrieval, speaking and writing so receptive words become expressive vocabulary.' },
          ].map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-700"><Icon className="h-5 w-5" /></span>
              <h2 className="mt-4 text-lg font-black text-slate-950">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
            </article>
          ))}
        </div>

        <section className="mt-12" aria-labelledby="vocabulary-guides">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-700">First authority collection</p>
            <h2 id="vocabulary-guides" className="mt-2 text-3xl font-black tracking-[-0.03em] text-slate-950">Six focused guides to start with</h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              These are the first published guides from the broader Tiny Steps Vocabulary architecture. Each one teaches a distinct lexical skill and links back to focused practice rather than creating thin pages for individual words.
            </p>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {VOCABULARY_AUTHORITY_ROUTE_MANIFEST.map((entry) => (
              <Link key={entry.path} to={entry.path} className="group flex min-h-[220px] flex-col rounded-[1.55rem] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.045)] transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-violet-700">Guide {entry.order} of 6</p>
                <h3 className="mt-2 text-xl font-black leading-6 text-slate-950 group-hover:text-violet-800">{entry.cardTitle}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{entry.description}</p>
                <span className="mt-auto pt-5 text-sm font-black text-violet-700">Open vocabulary guide →</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-[1.8rem] border border-violet-100 bg-violet-50/45 p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-700">Learning architecture</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">How the wider Vocabulary pathway grows</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {stageCards.map((stage) => (
              <div key={stage.id} className="rounded-2xl border border-violet-100 bg-white p-4">
                <p className="text-xs font-black text-violet-700">Stage {stage.order}</p>
                <h3 className="mt-1 font-black text-slate-950">{stage.label}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-600">{stage.purpose}</p>
                <p className="mt-3 text-xs font-bold text-slate-500">{stage.liveCount} guide{stage.liveCount === 1 ? '' : 's'} live in this batch</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm leading-7 text-slate-600">
            Tiny Steps progression bands are internal instructional bands, not claimed CEFR equivalence. British Council vocabulary collections are used as breadth benchmarks while Tiny Steps keeps its own child-focused sequence, explanations and practice design.
          </p>
        </section>

        <section className="mt-12 grid gap-5 lg:grid-cols-2">
          <article className="rounded-[1.7rem] border border-slate-200 bg-white p-6 sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Practice layer</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Learn the word here. Retrieve it in Vocabulary Adventure.</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Vocabulary Adventure remains the practice surface for word meanings, context clues, synonyms, antonyms and recall. The knowledge guides explain the concepts; the game gives children repeated retrieval without becoming a competing knowledge owner.
            </p>
            <Link to="/free-games/word-meaning-flashcards" className="mt-5 inline-flex items-center gap-2 text-sm font-black text-violet-700">
              Open Vocabulary Adventure <ArrowRight className="h-4 w-4" />
            </Link>
          </article>

          <article className="rounded-[1.7rem] border border-slate-200 bg-white p-6 sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Transfer across English</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Vocabulary supports comprehension, speaking and writing</h2>
            <div className="mt-4 grid gap-2">
              <Link to="/reading-classes-for-kids" className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 hover:bg-violet-50"><BookOpenText className="h-4 w-4 text-violet-600" /> Reading support</Link>
              <Link to="/spoken-english-classes-for-kids-online" className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 hover:bg-violet-50"><MessageCircleMore className="h-4 w-4 text-violet-600" /> Spoken English support</Link>
              <Link to="/writing-classes-for-kids" className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 hover:bg-violet-50"><PenLine className="h-4 w-4 text-violet-600" /> Writing support</Link>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
};

export default VocabularyResourcesPage;
