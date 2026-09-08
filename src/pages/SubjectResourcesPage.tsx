import type { FC } from 'react';
import { Link } from 'react-router-dom';
import Meta from '../components/common/Meta';
import { getRouteConfig } from '../lib/seo';
import { ORGANIZATION_ID, SITE_ORIGIN, WEBSITE_ID, organizationSchema, websiteSchema } from '../lib/schemas';

export type ResourceSubject = 'phonics' | 'grammar' | 'speaking';

type ResourceLink = {
  title: string;
  description: string;
  to: string;
  label: string;
};

type ResourceSection = {
  eyebrow: string;
  title: string;
  description: string;
  links: ResourceLink[];
};

type SubjectConfig = {
  title: string;
  eyebrow: string;
  intro: string;
  canonicalPath: string;
  allGuidesTo: string;
  allGuidesLabel: string;
  programmeTo: string;
  programmeLabel: string;
  accent: string;
  sections: ResourceSection[];
};

const SUBJECTS: Record<ResourceSubject, SubjectConfig> = {
  phonics: {
    title: 'Phonics & Reading Resources',
    eyebrow: 'Reading foundations',
    intro:
      'Use the existing Tiny Steps phonics and reading library by learning stage, practice need, or the problem you are seeing. These routes organise our established guides and games; they do not replace the live phonics programme or any article’s search intent.',
    canonicalPath: '/resources/phonics',
    allGuidesTo: '/blog?topic=Phonics',
    allGuidesLabel: 'Browse all phonics guides',
    programmeTo: '/phonics',
    programmeLabel: 'Explore live phonics support',
    accent: 'from-sky-500/18 via-blue-500/8 to-transparent',
    sections: [
      {
        eyebrow: 'Learn the pathway',
        title: 'Move from sounds into independent reading',
        description: 'Start with the concept or stage you need instead of reading the library in publication order.',
        links: [
          { title: 'What is phonics for kids?', description: 'Understand the role of sounds, print, blending and decoding.', to: '/blog/what-is-phonics-for-kids', label: 'Start with phonics' },
          { title: 'SATPIN phonics guide', description: 'See why early sound sets are useful and what should come next.', to: '/blog/satpin-phonics-guide', label: 'Explore SATPIN' },
          { title: 'How kids learn blending', description: 'Follow the progression from separate sounds into smooth word reading.', to: '/blog/how-kids-learn-blending', label: 'Understand blending' },
          { title: 'CVC words explained', description: 'Connect blending to the first transferable decoding milestone.', to: '/blog/cvc-words-explained-for-parents', label: 'Explore CVC words' },
        ],
      },
      {
        eyebrow: 'Practise the skill',
        title: 'Use focused practice after the explanation',
        description: 'Interactive practice stays inside the existing Tiny Steps games ecosystem.',
        links: [
          { title: 'Letter-sound games', description: 'Practise hearing and recognising individual letter sounds.', to: '/free-letter-sound-games-for-kids', label: 'Practise letter sounds' },
          { title: 'Word-building games', description: 'Move from sound knowledge into blending and word construction.', to: '/free-word-building-games-for-kids', label: 'Build words' },
          { title: 'Reading games', description: 'Practise reading and fluency without creating another content silo.', to: '/free-reading-games-for-kids', label: 'Practise reading' },
        ],
      },
      {
        eyebrow: 'Solve a problem',
        title: 'Start from the reading difficulty you can actually see',
        description: 'Diagnostic pages remain the intent owners; this hub only helps parents reach the right one.',
        links: [
          { title: 'Knows ABC but cannot read words', description: 'Check whether letter names are masking a decoding gap.', to: '/blog/child-knows-abc-but-cannot-read', label: 'Check this reading gap' },
          { title: 'Knows sounds but cannot read words', description: 'Separate sound knowledge from blending and decoding transfer.', to: '/blog/why-child-knows-letter-sounds-but-cannot-read-words', label: 'Check the blending gap' },
          { title: 'Reading is slow or effortful', description: 'Look at accuracy, phrasing and meaning before pushing speed.', to: '/blog/how-to-improve-reading-fluency-in-children', label: 'Explore fluency help' },
        ],
      },
    ],
  },
  grammar: {
    title: 'Grammar & Writing Resources',
    eyebrow: 'Clearer sentences',
    intro:
      'Use the existing Tiny Steps grammar and writing resources to understand progression, practise sentence skills, or diagnose the gap you are seeing. The hub organises established content rather than competing with the live grammar programme.',
    canonicalPath: '/resources/grammar',
    allGuidesTo: '/blog?topic=Grammar',
    allGuidesLabel: 'Browse all grammar guides',
    programmeTo: '/grammar',
    programmeLabel: 'Explore live grammar support',
    accent: 'from-emerald-500/18 via-teal-500/8 to-transparent',
    sections: [
      {
        eyebrow: 'Learn the pathway',
        title: 'Build from grammar knowledge into better writing',
        description: 'Use the existing progression guides instead of treating grammar rules as isolated worksheets.',
        links: [
          { title: 'Grammar: nouns to paragraphs', description: 'See the broader progression from sentence foundations into connected writing.', to: '/blog/grammar-nouns-to-paragraphs', label: 'See the grammar roadmap' },
          { title: 'Improve sentence formation', description: 'Understand how children move from fragments or basic sentences into stronger structures.', to: '/blog/how-to-improve-sentence-formation-in-kids', label: 'Build better sentences' },
          { title: 'Grammar rules but still mistakes', description: 'Understand why knowing a rule does not guarantee independent use.', to: '/blog/child-knows-grammar-but-makes-mistakes', label: 'Understand transfer' },
        ],
      },
      {
        eyebrow: 'Practise the skill',
        title: 'Move from explanation into sentence-level practice',
        description: 'Use the existing games hub for short, focused practice after a concept is understood.',
        links: [
          { title: 'Grammar games', description: 'Practise grammar choices and correction in the dedicated free collection.', to: '/free-grammar-games-for-kids', label: 'Open grammar games' },
          { title: 'Sentence-building games', description: 'Practise word order, sentence choices and expansion.', to: '/free-sentence-building-games-for-kids', label: 'Build sentences' },
          { title: 'Grammar practice game', description: 'Use a focused activity when the child needs repetition rather than another explanation.', to: '/free-grammar-practice-game-for-kids', label: 'Practise grammar' },
        ],
      },
      {
        eyebrow: 'Solve a problem',
        title: 'Find the closest sentence or grammar bottleneck',
        description: 'Problem pages retain their own search intent and diagnostic role.',
        links: [
          { title: 'My child knows grammar but makes mistakes', description: 'Check whether the issue is recall, transfer, editing or spontaneous use.', to: '/blog/child-knows-grammar-but-makes-mistakes', label: 'Check this grammar gap' },
          { title: 'Sentence formation is weak', description: 'Identify the difference between vocabulary, structure and sentence expansion problems.', to: '/blog/how-to-improve-sentence-formation-in-kids', label: 'Check sentence formation' },
          { title: 'Need writing-specific support?', description: 'Use the existing writing programme page when writing—not rule knowledge—is the primary need.', to: '/writing-classes-for-kids', label: 'Explore writing support' },
        ],
      },
    ],
  },
  speaking: {
    title: 'Speaking & Communication Resources',
    eyebrow: 'Confident expression',
    intro:
      'Use the existing Tiny Steps speaking and communication resources to build fuller answers, organise ideas, practise speaking, or diagnose confidence and language gaps. The live speaking programme remains a separate commercial route.',
    canonicalPath: '/resources/speaking',
    allGuidesTo: '/blog?topic=Speaking%20%26%20Communication',
    allGuidesLabel: 'Browse all speaking guides',
    programmeTo: '/speaking',
    programmeLabel: 'Explore live speaking support',
    accent: 'from-amber-500/18 via-orange-500/8 to-transparent',
    sections: [
      {
        eyebrow: 'Learn the pathway',
        title: 'Build from short responses into organised communication',
        description: 'Start with the communication stage rather than treating confidence as the only explanation.',
        links: [
          { title: 'Speaking confidence progression', description: 'Understand how confidence grows through repeated, structured speaking opportunities.', to: '/blog/speaking-confidence-seeds', label: 'Build speaking confidence' },
          { title: 'Child gives one-word answers', description: 'See how to move from minimal responses into fuller spoken sentences.', to: '/blog/child-gives-one-word-answers', label: 'Expand spoken answers' },
          { title: 'Understands English but does not speak', description: 'Separate language knowledge, retrieval and confidence before choosing the next step.', to: '/blog/child-understands-english-but-does-not-speak', label: 'Understand the speaking gap' },
        ],
      },
      {
        eyebrow: 'Practise the skill',
        title: 'Use speaking practice that requires active expression',
        description: 'Practice routes remain part of the existing games ecosystem, not a second speaking product.',
        links: [
          { title: 'Speaking games', description: 'Use the free speaking collection for guided expression and response practice.', to: '/free-speaking-games-for-kids', label: 'Open speaking games' },
          { title: 'Speaking practice game', description: 'Use a focused activity for short, repeatable communication practice.', to: '/free-speaking-practice-game-for-kids', label: 'Practise speaking' },
        ],
      },
      {
        eyebrow: 'Solve a problem',
        title: 'Start from the communication difficulty you are seeing',
        description: 'The diagnostic route remains the intent owner; the hub simply makes it easier to find.',
        links: [
          { title: 'Very shy or reluctant to speak', description: 'Look at confidence, participation and low-pressure practice before forcing performance.', to: '/shy-child-speaking-confidence', label: 'Explore confidence help' },
          { title: 'Only one-word answers', description: 'Check sentence generation, vocabulary access and response habits.', to: '/blog/child-gives-one-word-answers', label: 'Check one-word answers' },
          { title: 'Understands but does not speak', description: 'Check whether the gap is confidence, retrieval or independent language production.', to: '/blog/child-understands-english-but-does-not-speak', label: 'Check this speaking gap' },
        ],
      },
    ],
  },
};

const SubjectResourcesPage: FC<{ subject: ResourceSubject }> = ({ subject }) => {
  const config = SUBJECTS[subject];
  const seo = getRouteConfig(config.canonicalPath);
  const canonicalUrl = `${SITE_ORIGIN}${config.canonicalPath}`;
  const title = seo?.title ?? config.title;
  const description = seo?.description ?? config.intro;
  const allLinks = config.sections.flatMap((section) => section.links);

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
      { '@type': 'ListItem', position: 2, name: 'Resources', item: `${SITE_ORIGIN}/resources` },
      { '@type': 'ListItem', position: 3, name: config.title, item: canonicalUrl },
    ],
  };

  const listId = `${canonicalUrl}#curated-resources`;
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': listId,
    name: `${config.title} — curated Tiny Steps resources`,
    numberOfItems: allLinks.length,
    itemListElement: allLinks.map((link, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: link.title,
      url: new URL(link.to, SITE_ORIGIN).toString(),
    })),
  };

  const collectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${canonicalUrl}#webpage`,
    url: canonicalUrl,
    name: title,
    description,
    inLanguage: 'en-IN',
    isPartOf: { '@id': WEBSITE_ID },
    publisher: { '@id': ORGANIZATION_ID },
    mainEntity: { '@id': listId },
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_42%,#f8fafc_100%)] text-slate-950">
      <Meta
        title={title}
        description={description}
        canonical={canonicalUrl}
        jsonLd={[organizationSchema, websiteSchema, collectionPageSchema, breadcrumbSchema, itemListSchema]}
      />

      <section className="relative overflow-hidden border-b border-slate-800 bg-slate-950 text-white">
        <div className={`absolute inset-0 bg-gradient-to-br ${config.accent}`} />
        <div className="relative mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:py-24">
          <nav aria-label="Breadcrumb" className="text-sm font-semibold text-slate-300">
            <Link to="/resources" className="hover:text-white">Resources</Link>
            <span aria-hidden="true" className="mx-2">/</span>
            <span className="text-white">{config.title}</span>
          </nav>
          <div className="mt-7 max-w-4xl">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-200">{config.eyebrow}</p>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.035em] text-white sm:text-5xl lg:text-6xl">{config.title}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">{config.intro}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#resource-sections" className="rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-100">Choose a starting point</a>
              <Link to={config.allGuidesTo} className="rounded-full border border-white/20 bg-white/8 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/14">{config.allGuidesLabel}</Link>
            </div>
          </div>
        </div>
      </section>

      <section id="resource-sections" className="mx-auto max-w-7xl space-y-14 px-6 py-14 sm:py-16 lg:py-20">
        {config.sections.map((section) => (
          <section key={section.eyebrow} aria-labelledby={`${subject}-${section.eyebrow.replaceAll(' ', '-').toLowerCase()}`}>
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">{section.eyebrow}</p>
              <h2 id={`${subject}-${section.eyebrow.replaceAll(' ', '-').toLowerCase()}`} className="mt-3 text-3xl font-black tracking-[-0.025em] text-slate-950 sm:text-4xl">{section.title}</h2>
              <p className="mt-4 text-base leading-8 text-slate-600">{section.description}</p>
            </div>
            <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {section.links.map((link) => (
                <Link key={`${section.eyebrow}-${link.to}`} to={link.to} className="group flex min-h-[230px] flex-col rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_22px_55px_rgba(15,23,42,0.09)]">
                  <h3 className="text-xl font-black tracking-[-0.015em] text-slate-950">{link.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{link.description}</p>
                  <span className="mt-auto pt-6 text-sm font-black text-slate-900">{link.label} <span aria-hidden="true" className="inline-block transition group-hover:translate-x-1">→</span></span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-12 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Need structured support?</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Keep resource discovery separate from programme decisions.</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">If you have finished exploring the guides and want teacher-led support, use the existing programme route. If the right starting point is still unclear, a free assessment is available as a secondary next step.</p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link to={config.programmeTo} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800">{config.programmeLabel}</Link>
            <Link to="/book-demo" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-50">Check My Child’s Level</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 sm:py-14">
        <div className="flex flex-wrap items-center gap-3 text-sm font-bold">
          <Link to="/resources" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-800 hover:bg-slate-50">All Resources</Link>
          <Link to="/blog" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-800 hover:bg-slate-50">All Guides</Link>
          {(['phonics', 'grammar', 'speaking'] as const).filter((key) => key !== subject).map((key) => (
            <Link key={key} to={SUBJECTS[key].canonicalPath} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-800 hover:bg-slate-50">{SUBJECTS[key].title}</Link>
          ))}
        </div>
      </section>
    </main>
  );
};

export default SubjectResourcesPage;
