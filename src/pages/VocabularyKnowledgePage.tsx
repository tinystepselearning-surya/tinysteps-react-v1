import type { FC } from 'react';
import { Link, useParams } from 'react-router-dom';
import Meta from '../components/common/Meta';
import NotFoundPage from './NotFoundPage';
import {
  VOCABULARY_AUTHORITY_PAGES,
  getVocabularyAuthorityPageBySlug,
} from '../lib/vocabularyAuthorityRegistry.js';
import { VOCABULARY_AUTHORITY_ROUTE_MANIFEST } from '../lib/vocabularyAuthoritySeoManifest.js';
import { SITE_ORIGIN } from '../lib/schemas';

const fallbackLabel = (path: string) => {
  const leaf = path.split('/').filter(Boolean).pop() || 'Related resource';
  return leaf
    .split('-')
    .filter(Boolean)
    .map((word) => word.length <= 3 ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const relatedLabel = (path: string) => {
  const vocabulary = VOCABULARY_AUTHORITY_ROUTE_MANIFEST.find((entry) => entry.path === path);
  if (vocabulary) return vocabulary.cardTitle;
  if (path === '/free-games/word-meaning-flashcards') return 'Vocabulary Adventure';
  if (path === '/reading-classes-for-kids') return 'Reading Classes for Kids';
  if (path === '/spoken-english-classes-for-kids-online') return 'Spoken English Classes for Kids';
  if (path === '/writing-classes-for-kids') return 'Writing Classes for Kids';
  if (path === '/free-spelling-game-for-kids') return 'Free Spelling Game';
  if (path === '/blog/how-vocabulary-supports-reading-comprehension') return 'How Vocabulary Supports Reading Comprehension';
  return fallbackLabel(path);
};

const VocabularyKnowledgePage: FC = () => {
  const { slug = '' } = useParams();
  const page = getVocabularyAuthorityPageBySlug(slug);

  if (!page) return <NotFoundPage />;

  const canonicalUrl = `${SITE_ORIGIN}${page.path}`;
  const pageIndex = VOCABULARY_AUTHORITY_PAGES.findIndex((entry) => entry.id === page.id);
  const previous = pageIndex > 0 ? VOCABULARY_AUTHORITY_PAGES[pageIndex - 1] : null;
  const next = pageIndex >= 0 && pageIndex < VOCABULARY_AUTHORITY_PAGES.length - 1
    ? VOCABULARY_AUTHORITY_PAGES[pageIndex + 1]
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
      '@id': `${SITE_ORIGIN}/resources/vocabulary#webpage`,
    },
    breadcrumb: {
      '@id': `${canonicalUrl}#breadcrumb`,
    },
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.ts-answer-title', '.ts-answer-summary'],
    },
    citation: page.sources.map((source) => source.url),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${canonicalUrl}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
      { '@type': 'ListItem', position: 2, name: 'Resources', item: `${SITE_ORIGIN}/resources` },
      { '@type': 'ListItem', position: 3, name: 'Vocabulary', item: `${SITE_ORIGIN}/resources/vocabulary` },
      { '@type': 'ListItem', position: 4, name: page.cardTitle, item: canonicalUrl },
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${canonicalUrl}#faq`,
    mainEntity: page.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#faf8ff_0%,#ffffff_42%,#f8fafc_100%)] text-slate-950">
      <Meta
        title={page.seoTitle}
        description={page.seoDescription}
        canonical={canonicalUrl}
        jsonLd={[webPageSchema, breadcrumbSchema, faqSchema]}
      />

      <section className="border-b border-violet-100 bg-[radial-gradient(circle_at_10%_10%,rgba(139,92,246,0.11),transparent_26%),linear-gradient(180deg,#faf7ff_0%,#ffffff_100%)]">
        <div className="mx-auto max-w-5xl px-6 py-10 sm:py-14">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
            <Link to="/resources" className="hover:text-slate-900">Resources</Link>
            <span aria-hidden="true" className="px-2">/</span>
            <Link to="/resources/vocabulary" className="hover:text-slate-900">Vocabulary</Link>
            <span aria-hidden="true" className="px-2">/</span>
            <span className="text-slate-700">{page.cardTitle}</span>
          </nav>

          <p className="mt-7 text-xs font-black uppercase tracking-[0.22em] text-violet-700">
            Vocabulary authority guide · Guide {page.order} of {VOCABULARY_AUTHORITY_PAGES.length}
          </p>
          <h1 className="ts-answer-title mt-3 text-4xl font-black tracking-[-0.035em] text-slate-950 sm:text-5xl">
            {page.cardTitle}
          </h1>
          <p className="ts-answer-summary mt-5 max-w-4xl text-lg leading-8 text-slate-700">
            {page.quickAnswer}
          </p>
          <p className="mt-4 max-w-4xl text-sm font-bold leading-6 text-violet-800">
            Parent question: {page.parentQuestion}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl space-y-10 px-6 py-10 sm:py-14">
        <article className="rounded-[1.7rem] border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.05)] sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Understand the vocabulary skill</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">What this vocabulary skill means</h2>
          <p className="mt-4 text-base leading-8 text-slate-700">{page.concept}</p>

          <div className="mt-6 rounded-2xl border border-violet-100 bg-violet-50/55 p-5">
            <h3 className="text-base font-black text-slate-950">Why this skill matters</h3>
            <p className="mt-2 text-sm leading-7 text-slate-700">{page.whyItMatters}</p>
          </div>

          <div className="mt-7 border-t border-slate-100 pt-6">
            <h3 className="text-lg font-black text-slate-950">Core teaching points</h3>
            <ul className="mt-4 space-y-4">
              {page.teachingPoints.map((point) => (
                <li key={point} className="flex gap-3 text-sm leading-7 text-slate-700">
                  <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </article>

        <section className="rounded-[1.6rem] border border-slate-200 bg-white p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Organise the vocabulary</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">Useful word groups</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {page.wordGroups.map((group) => (
              <article key={group.label} className="rounded-2xl border border-violet-100 bg-violet-50/45 p-5">
                <h3 className="font-black text-slate-950">{group.label}</h3>
                <p className="mt-2 text-sm font-bold leading-6 text-violet-800">{group.words.join(' · ')}</p>
                <p className="mt-3 text-xs leading-5 text-slate-600">{group.note}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[1.6rem] border border-slate-200 bg-white p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">See the idea in context</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">Worked examples</h2>
          <div className="mt-5 grid gap-4">
            {page.workedExamples.map((item) => (
              <div key={item.example} className="rounded-2xl border border-violet-100 bg-violet-50/45 p-5">
                <p className="font-black leading-7 text-slate-950">{item.example}</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{item.explanation}</p>
              </div>
            ))}
          </div>
        </section>

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
              {page.trickyCases.map((item) => (
                <li key={item} className="text-sm leading-7 text-slate-700">{item}</li>
              ))}
            </ul>
          </div>

          <aside className="rounded-[1.5rem] border border-sky-200 bg-sky-50/60 p-6 sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-800">For parents and teachers</p>
            <h2 className="mt-2 text-xl font-black text-slate-950">How to teach it</h2>
            <p className="mt-4 text-sm leading-7 text-slate-700">{page.teachingNote}</p>
          </aside>
        </section>

        <section className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50/55 p-6 sm:p-7">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800">Guided practice</p>
          <h2 className="mt-2 text-xl font-black text-slate-950">Try these next</h2>
          <ol className="mt-4 space-y-3">
            {page.practicePrompts.map((prompt, index) => (
              <li key={prompt} className="flex gap-3 text-sm leading-7 text-slate-700">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-xs font-black text-emerald-800">{index + 1}</span>
                <span>{prompt}</span>
              </li>
            ))}
          </ol>
          <Link to={page.practicePath} className="mt-6 inline-flex rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800">
            Practise in Vocabulary Adventure
          </Link>
        </section>

        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-black text-slate-950">Frequently asked questions</h2>
          <div className="mt-5 space-y-5">
            {page.faqs.map((faq) => (
              <article key={faq.question} className="border-t border-slate-100 pt-5 first:border-t-0 first:pt-0">
                <h3 className="font-black leading-6 text-slate-950">{faq.question}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-700">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 sm:p-7">
          <h2 className="text-xl font-black text-slate-950">References and further reading</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            These references support definitions, usage distinctions and teaching principles. Tiny Steps explanations, examples and practice design are written for children and families rather than copied from the source materials.
          </p>
          <ul className="mt-4 space-y-3">
            {page.sources.map((source) => (
              <li key={source.id}>
                <a href={source.url} target="_blank" rel="noreferrer" className="font-bold text-violet-700 underline decoration-violet-200 underline-offset-4 hover:text-violet-900">
                  {source.publisher}: {source.title}
                </a>
                <p className="mt-1 text-xs leading-5 text-slate-500">{source.note}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-[1.6rem] border border-slate-200 bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Related learning</p>
              <h2 className="mt-2 text-xl font-black text-slate-950">Keep the word inside a bigger language pathway</h2>
            </div>
            <Link to="/resources/vocabulary" className="text-sm font-black text-violet-700">Browse all Vocabulary resources →</Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {page.relatedPaths.map((path) => (
              <Link key={path} to={path} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-700 transition hover:border-violet-200 hover:bg-violet-50/50 hover:text-violet-900">
                {relatedLabel(path)}
                <span className="mt-1 block break-words text-xs font-medium text-slate-400">{path}</span>
              </Link>
            ))}
          </div>
        </section>

        <nav aria-label="Vocabulary authority navigation" className="grid gap-3 sm:grid-cols-2">
          {previous ? (
            <Link to={previous.path} className="rounded-[1.4rem] border border-slate-200 bg-white p-5 transition hover:border-violet-200">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Previous guide</span>
              <span className="mt-2 block font-black text-slate-950">← {previous.cardTitle}</span>
            </Link>
          ) : <div />}
          {next ? (
            <Link to={next.path} className="rounded-[1.4rem] border border-slate-200 bg-white p-5 text-right transition hover:border-violet-200">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Next guide</span>
              <span className="mt-2 block font-black text-slate-950">{next.cardTitle} →</span>
            </Link>
          ) : null}
        </nav>
      </section>
    </main>
  );
};

export default VocabularyKnowledgePage;
