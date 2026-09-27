import type { FC } from 'react';
import { Link, useParams } from 'react-router-dom';
import Meta from '../components/common/Meta';
import KnowledgeBreadcrumbs from '../components/common/KnowledgeBreadcrumbs';
import NotFoundPage from './NotFoundPage';
import { buildBreadcrumbListSchema, buildSpeakableSpecification, getBreadcrumbTrail } from '../lib/breadcrumbAeoGeoRegistry.js';
import {
  VOCABULARY_AUTHORITY_PAGES,
  getVocabularyAuthorityPageBySlug,
} from '../lib/vocabularyAuthorityRegistry.js';
import { VOCABULARY_LEXICAL_ENTRIES_BY_ID } from '../lib/vocabularyLexicalModel';
import {
  ORGANIZATION_ID,
  SITE_ORIGIN,
  WEBSITE_ID,
  organizationSchema,
  websiteSchema,
} from '../lib/schemas';

const fallbackLabel = (path: string) =>
  path.split('/').filter(Boolean).pop()?.replace(/-/g, ' ').replace(/\b\w/g, (value) => value.toUpperCase()) || 'Related resource';

const relatedLabel = (path: string) => {
  const page = VOCABULARY_AUTHORITY_PAGES.find((entry) => entry.path === path);
  return page?.cardTitle ?? fallbackLabel(path);
};

const VocabularyKnowledgePage: FC = () => {
  const { slug = '' } = useParams();
  const page = getVocabularyAuthorityPageBySlug(slug);
  if (!page) return <NotFoundPage />;

  const canonicalUrl = `${SITE_ORIGIN}${page.path}`;
  const index = VOCABULARY_AUTHORITY_PAGES.findIndex((entry) => entry.id === page.id);
  const previous = index > 0 ? VOCABULARY_AUTHORITY_PAGES[index - 1] : null;
  const next = index >= 0 && index < VOCABULARY_AUTHORITY_PAGES.length - 1
    ? VOCABULARY_AUTHORITY_PAGES[index + 1]
    : null;

  const featuredWords = page.featuredWordIds
    .map((id) => VOCABULARY_LEXICAL_ENTRIES_BY_ID[id])
    .filter(Boolean);

  const breadcrumbItems = getBreadcrumbTrail({ pathname: page.path, title: page.cardTitle });
  const breadcrumbSchema = buildBreadcrumbListSchema(breadcrumbItems, SITE_ORIGIN);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${canonicalUrl}#article`,
    headline: page.cardTitle,
    description: page.seoDescription,
    url: canonicalUrl,
    inLanguage: 'en-IN',
    isPartOf: { '@id': WEBSITE_ID },
    publisher: { '@id': ORGANIZATION_ID },
    speakable: buildSpeakableSpecification(['.ts-answer-title', '.ts-answer-summary']),
    citation: page.sources.map((source) => source.url),
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${canonicalUrl}#faq`,
    mainEntity: page.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fbfaf8_0%,#ffffff_42%,#f7fafc_100%)] text-slate-950">
      <Meta
        title={page.seoTitle}
        description={page.seoDescription}
        canonical={canonicalUrl}
        jsonLd={[organizationSchema, websiteSchema, articleSchema, faqSchema, breadcrumbSchema]}
      />

      <section className="mx-auto max-w-5xl px-6 pb-12 pt-6 sm:pb-16">
        <KnowledgeBreadcrumbs items={breadcrumbItems} className="mb-5 text-xs" />

        <div className="rounded-[2rem] border border-slate-200 bg-slate-950 px-6 py-9 text-white shadow-[0_24px_70px_rgba(15,23,42,0.14)] sm:px-9 sm:py-11">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-300">
            Vocabulary authority guide · Guide {page.order} of {VOCABULARY_AUTHORITY_PAGES.length}
          </p>
          <h1 className="ts-answer-title mt-3 text-4xl font-black tracking-[-0.035em] sm:text-5xl">{page.cardTitle}</h1>
          <p className="ts-answer-summary mt-5 max-w-3xl text-base leading-8 text-slate-300">{page.quickAnswer}</p>
        </div>

        <div className="mt-8 grid gap-5">
          <section className="rounded-[1.6rem] border border-slate-200 bg-white p-6 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-700">Understand the idea</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">What this vocabulary skill means</h2>
            <p className="mt-4 text-base leading-8 text-slate-700">{page.concept}</p>
            <p className="mt-4 text-base leading-8 text-slate-700">{page.whyItMatters}</p>
          </section>

          <section className="rounded-[1.6rem] border border-slate-200 bg-white p-6 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Core teaching ideas</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Build meaning before memorisation</h2>
            <div className="mt-5 grid gap-4">
              {page.coreIdeas.map((idea, index) => (
                <div key={idea} className="rounded-2xl border border-violet-100 bg-violet-50/55 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-700">Idea {index + 1}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-700">{idea}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[1.6rem] border border-slate-200 bg-white p-6 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Worked examples</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">See the vocabulary skill in context</h2>
            <div className="mt-5 grid gap-4">
              {page.workedExamples.map((item) => (
                <div key={item.example} className="rounded-2xl border border-emerald-100 bg-emerald-50/55 p-5">
                  <p className="font-black leading-7 text-slate-950">{item.example}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-700">{item.explanation}</p>
                </div>
              ))}
            </div>
          </section>

          {featuredWords.length ? (
            <section className="rounded-[1.6rem] border border-slate-200 bg-white p-6 sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">From the Tiny Steps practice dataset</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">Words you can practise now</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {featuredWords.map((word) => (
                  <div key={word.id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="font-black text-slate-950">{word.headword}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{word.childFriendlyMeaning}</p>
                    <p className="mt-2 text-sm italic leading-6 text-slate-700">{word.exampleSentence}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-black text-slate-950">More examples</h2>
              <ul className="mt-4 space-y-3">
                {page.examples.map((example) => (
                  <li key={example} className="rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800">{example}</li>
                ))}
              </ul>
            </section>

            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-black text-slate-950">Common mistakes to watch</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                {page.commonMistakes.map((mistake) => (
                  <li key={mistake} className="flex gap-3">
                    <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                    <span>{mistake}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/55 p-6 sm:p-7">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-800">Watch for these</p>
              <h2 className="mt-2 text-xl font-black text-slate-950">Tricky cases and useful distinctions</h2>
              <ul className="mt-4 space-y-4">
                {page.trickyCases.map((item) => <li key={item} className="text-sm leading-7 text-slate-700">{item}</li>)}
              </ul>
            </div>

            <aside className="rounded-[1.5rem] border border-sky-200 bg-sky-50/60 p-6 sm:p-7">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-800">For parents and teachers</p>
              <h2 className="mt-2 text-xl font-black text-slate-950">How to teach it</h2>
              <p className="mt-4 text-sm leading-7 text-slate-700">{page.teachingNote}</p>
            </aside>
          </section>

          <section className="rounded-[1.6rem] border border-violet-200 bg-violet-50/60 p-6 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-700">Try it</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Short practice prompts</h2>
            <ol className="mt-5 space-y-3">
              {page.practicePrompts.map((prompt, index) => (
                <li key={prompt} className="flex gap-3 rounded-xl bg-white/85 px-4 py-3 text-sm leading-6 text-slate-800">
                  <span className="font-black text-violet-700">{index + 1}.</span>
                  <span>{prompt}</span>
                </li>
              ))}
            </ol>
            <Link
              to={page.practicePath}
              className="mt-5 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white"
            >
              Practise in Vocabulary Adventure
            </Link>
          </section>

          <section className="rounded-[1.6rem] border border-slate-200 bg-white p-6 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Questions parents often ask</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Quick clarifications</h2>
            <div className="mt-5 divide-y divide-slate-100">
              {page.faqs.map((faq) => (
                <article key={faq.question} className="py-5 first:pt-0 last:pb-0">
                  <h3 className="font-black leading-7 text-slate-950">{faq.question}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-700">{faq.answer}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-black text-slate-950">Continue the vocabulary pathway</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {previous ? (
                <Link to={previous.path} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 hover:bg-white">
                  ← Previous: {previous.cardTitle}
                </Link>
              ) : <span />}
              {next ? (
                <Link to={next.path} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 hover:bg-white sm:text-right">
                  Next: {next.cardTitle} →
                </Link>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap gap-2.5">
              {page.relatedPaths.map((path) => (
                <Link key={path} to={path} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                  {relatedLabel(path)}
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-slate-200 bg-slate-50/75 p-6 sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">References and further reading</p>
            <h2 className="mt-2 text-xl font-black text-slate-950">Sources used to check this vocabulary explanation</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Tiny Steps writes the teaching explanation and examples independently. These references support vocabulary-learning principles, usage and further reading.
            </p>
            <ul className="mt-5 grid gap-3">
              {page.sources.map((source) => (
                <li key={source.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-black text-slate-950 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-700"
                  >
                    {source.title}
                  </a>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{source.publisher}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{source.note}</p>
                </li>
              ))}
            </ul>
          </section>

          <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-6">
            <Link to="/resources/vocabulary" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white">
              All Vocabulary Resources
            </Link>
            <Link to="/resources" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800">
              All Resources
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default VocabularyKnowledgePage;
