import type { FC } from 'react';
import { Link, useParams } from 'react-router-dom';
import Meta from '../components/common/Meta';
import NotFoundPage from './NotFoundPage';
import {
  GRAMMAR_PROGRAMMATIC_SEQUENCE,
  getGrammarProgrammaticPageBySlug,
} from '../lib/grammarProgrammaticRegistry.js';
import { SITE_ORIGIN } from '../lib/schemas';
import { getCommercialC7R3Handoff } from '../lib/commercialC7ContextualHandoffImplementation';

const GrammarKnowledgePage: FC = () => {
  const { slug = '' } = useParams();
  const page = getGrammarProgrammaticPageBySlug(slug);

  if (!page) return <NotFoundPage />;

  const c7Handoff = getCommercialC7R3Handoff(page.path);
  const canonicalUrl = `${SITE_ORIGIN}${page.path}`;
  const sequenceIndex = GRAMMAR_PROGRAMMATIC_SEQUENCE.findIndex((entry) => entry.id === page.id);
  const previous = sequenceIndex > 0 ? GRAMMAR_PROGRAMMATIC_SEQUENCE[sequenceIndex - 1] : null;
  const next = sequenceIndex >= 0 && sequenceIndex < GRAMMAR_PROGRAMMATIC_SEQUENCE.length - 1
    ? GRAMMAR_PROGRAMMATIC_SEQUENCE[sequenceIndex + 1]
    : null;

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${canonicalUrl}#webpage`,
    url: canonicalUrl,
    name: page.seoTitle,
    description: page.seoDescription,
    inLanguage: 'en-IN',
    about: {
      '@type': 'DefinedTerm',
      name: page.cardTitle,
      description: page.quickAnswer,
    },
    isPartOf: {
      '@id': `${SITE_ORIGIN}/resources/grammar#webpage`,
    },
    breadcrumb: {
      '@id': `${canonicalUrl}#breadcrumb`,
    },
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.ts-answer-title', '.ts-answer-summary'],
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${canonicalUrl}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
      { '@type': 'ListItem', position: 2, name: 'Resources', item: `${SITE_ORIGIN}/resources` },
      { '@type': 'ListItem', position: 3, name: 'Grammar & Writing', item: `${SITE_ORIGIN}/resources/grammar` },
      { '@type': 'ListItem', position: 4, name: page.cardTitle, item: canonicalUrl },
    ],
  };

  const positionLabel = `Step ${page.order} of ${GRAMMAR_PROGRAMMATIC_SEQUENCE.length}`;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7faf9_0%,#ffffff_42%,#f8fafc_100%)] text-slate-950">
      <Meta
        title={page.seoTitle}
        description={page.seoDescription}
        canonical={canonicalUrl}
        jsonLd={[webPageSchema, breadcrumbSchema]}
      />

      <section className="border-b border-emerald-100 bg-[radial-gradient(circle_at_10%_10%,rgba(16,185,129,0.10),transparent_26%),linear-gradient(180deg,#f3fbf8_0%,#ffffff_100%)]">
        <div className="mx-auto max-w-5xl px-6 py-10 sm:py-14">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
            <Link to="/resources" className="hover:text-slate-900">Resources</Link>
            <span aria-hidden="true" className="px-2">/</span>
            <Link to="/resources/grammar" className="hover:text-slate-900">Grammar & Writing</Link>
            <span aria-hidden="true" className="px-2">/</span>
            <span className="text-slate-700">{page.cardTitle}</span>
          </nav>

          <p className="mt-7 text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
            Grammar learning sequence · {positionLabel}
          </p>
          <h1 className="ts-answer-title mt-3 text-4xl font-black tracking-[-0.035em] text-slate-950 sm:text-5xl">
            {page.cardTitle}
          </h1>
          <p className="ts-answer-summary mt-5 max-w-4xl text-lg leading-8 text-slate-700">
            {page.quickAnswer}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl space-y-10 px-6 py-10 sm:py-14">
        <article className="rounded-[1.7rem] border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.05)] sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Understand the idea</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">What this grammar skill means</h2>
          <p className="mt-4 text-base leading-8 text-slate-700">{page.concept}</p>
        </article>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-black text-slate-950">Examples</h2>
            <ul className="mt-4 space-y-3">
              {page.examples.map((example) => (
                <li key={example} className="rounded-xl bg-emerald-50/70 px-4 py-3 text-sm leading-6 text-slate-800">
                  {example}
                </li>
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

        <section className="rounded-[1.6rem] border border-emerald-200 bg-emerald-50/60 p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Try it</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">Short practice prompts</h2>
          <ol className="mt-5 space-y-3">
            {page.practicePrompts.map((prompt, index) => (
              <li key={prompt} className="flex gap-3 rounded-xl bg-white/85 px-4 py-3 text-sm leading-6 text-slate-800">
                <span className="font-black text-emerald-700">{index + 1}.</span>
                <span>{prompt}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-black text-slate-950">Continue the grammar pathway</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {previous ? (
              <Link to={previous.path} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 hover:bg-white">
                ← Previous: {'cardTitle' in previous ? previous.cardTitle : previous.label}
              </Link>
            ) : <span />}
            {next ? (
              <Link to={next.path} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 hover:bg-white sm:text-right">
                Next: {'cardTitle' in next ? next.cardTitle : next.label} →
              </Link>
            ) : null}
          </div>

          <div className="mt-5 flex flex-wrap gap-2.5">
            {page.relatedPaths.map((path) => (
              <Link key={path} to={path} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                Related guide
              </Link>
            ))}
          </div>
        </section>

        {c7Handoff ? (
          <section
            className="rounded-[1.7rem] bg-slate-950 p-6 text-white sm:p-8"
            data-c7-contextual-handoff={c7Handoff.ruleClass}
          >
            <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-300">
                  Your next learning step
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.025em]">{c7Handoff.heading}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{c7Handoff.intro}</p>
              </div>
              <div className="flex flex-col gap-2 sm:min-w-56">
                <Link
                  to={c7Handoff.primary.to}
                  className="rounded-full bg-white px-5 py-3 text-center text-sm font-black text-slate-950 transition hover:bg-emerald-50"
                >
                  {c7Handoff.primary.label}
                </Link>
                {c7Handoff.secondary ? (
                  <Link
                    to={c7Handoff.secondary.to}
                    className="rounded-full border border-white/40 px-5 py-3 text-center text-sm font-black text-white transition hover:border-white/70"
                  >
                    {c7Handoff.secondary.label}
                  </Link>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-6">
          <Link to="/resources/grammar" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white">
            All Grammar & Writing Resources
          </Link>
          <Link to="/resources" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800">
            All Resources
          </Link>
        </div>
      </section>
    </main>
  );
};

export default GrammarKnowledgePage;
