import type { FC } from 'react';
import { Link } from 'react-router-dom';
import {
  GRAMMAR_PUBLISHED_RESOURCE_PAGES,
  type GrammarPublishedResourcePage,
  type GrammarResourceLevel,
} from '../../lib/grammarPublicationRegistry.js';

const LEVELS: readonly {
  id: GrammarResourceLevel;
  eyebrow: string;
  title: string;
  description: string;
}[] = [
  {
    id: 'beginner',
    eyebrow: 'Beginner Grammar',
    title: 'Build words into clear sentences',
    description: 'Move from word classes and basic grammar into sentence building, tense foundations and early paragraph preparation.',
  },
  {
    id: 'advanced',
    eyebrow: 'Advanced Grammar',
    title: 'Control tense, clauses, connections and writing',
    description: 'Move from accurate sentence control into tense choices, connected ideas, advanced sentence craft and coherent writing.',
  },
];

const STAGE_COPY: Record<GrammarResourceLevel, Record<number, { title: string; goal: string }>> = {
  beginner: {
    1: { title: 'Word Foundations', goal: 'Identify the main word types and understand the jobs they do.' },
    2: { title: 'Grammar Basics', goal: 'Use core forms such as plurals, articles and prepositions accurately.' },
    3: { title: 'Sentence Building', goal: 'Build complete sentences and apply sentence boundaries.' },
    4: { title: 'Connecting & Expanding', goal: 'Add useful detail and connect ideas more clearly.' },
    5: { title: 'Tenses Basics', goal: 'Control simple present, past and future meaning.' },
    6: { title: 'Sentence Writing', goal: 'Apply grammar in word order, description and paragraph preparation.' },
  },
  advanced: {
    1: { title: 'Sentence Foundations', goal: 'Understand sentence roles and expand complete ideas accurately.' },
    2: { title: 'Tense Control', goal: 'Choose tense forms from meaning rather than isolated clue words.' },
    3: { title: 'Grammar Accuracy', goal: 'Control questions, negatives, modals, quantity and pronoun reference.' },
    4: { title: 'Connecting Ideas', goal: 'Express reason, sequence, conditions and contrast precisely.' },
    5: { title: 'Advanced Sentence Craft', goal: 'Work with clauses, sentence variety, editing, speech and voice.' },
    6: { title: 'Writing Mastery', goal: 'Build cohesive paragraphs and apply grammar across extended writing.' },
  },
};

const ESTABLISHED_GUIDES: Record<string, readonly { title: string; to: string; note: string }[]> = {
  'beginner-3': [
    { title: 'Punctuation & capital letters', to: '/blog/punctuation-and-capital-letters-for-kids', note: 'Established guide for sentence boundaries and punctuation.' },
    { title: 'Sentence formation', to: '/blog/how-to-improve-sentence-formation-in-kids', note: 'Established guide for building complete and stronger sentences.' },
  ],
  'beginner-4': [
    { title: 'Conjunctions', to: '/blog/grammar-conjunctions', note: 'Established guide for connecting related ideas.' },
  ],
  'beginner-5': [
    { title: 'English tenses', to: '/blog/grammar-tenses', note: 'Established broad guide to the tense system.' },
    { title: 'Subject–verb agreement', to: '/blog/grammar-subject-verb', note: 'Established guide for matching subjects and verb forms.' },
  ],
  'beginner-6': [
    { title: 'Paragraph writing', to: '/blog/how-to-teach-paragraph-writing-to-kids', note: 'Established guide for moving from sentences into one coherent paragraph.' },
  ],
  'advanced-6': [
    { title: 'Creative writing', to: '/blog/grammar-creative-writing', note: 'Established guide for longer, supported composition.' },
    { title: 'Grammar editing', to: '/blog/grammar-editing-camp', note: 'Established guide for finding and fixing errors in connected writing.' },
    { title: 'Grammar assessment', to: '/blog/grammar-assessment', note: 'Established parent guide for checking grammar patterns and transfer.' },
  ],
};

function pagesFor(level: GrammarResourceLevel, stageOrder: number): readonly GrammarPublishedResourcePage[] {
  return GRAMMAR_PUBLISHED_RESOURCE_PAGES.filter(
    (page) => page.level === level && page.stageOrder === stageOrder,
  );
}

const GrammarResourceTimeline: FC = () => (
  <section
    data-grammar-resource-timeline
    aria-labelledby="grammar-resource-timeline-heading"
    className="border-y border-slate-200 bg-[linear-gradient(180deg,#f7fbf9_0%,#ffffff_55%,#f8fafc_100%)]"
  >
    <div className="mx-auto max-w-7xl px-6 py-14 sm:py-16">
      <div className="max-w-4xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Grammar knowledge path</p>
        <h2 id="grammar-resource-timeline-heading" className="mt-3 text-3xl font-black tracking-[-0.03em] text-slate-950 sm:text-4xl">
          Learn key grammar concepts in curriculum order
        </h2>
        <p className="mt-4 text-base leading-8 text-slate-600">
          Start with the earliest skill that is not yet secure. Each focused guide explains one concept, shows where it appears in the Tiny Steps curriculum, and links forward to the next useful step without replacing the established broader guides.
        </p>
      </div>

      <div className="mt-10 space-y-12">
        {LEVELS.map((level) => (
          <section key={level.id} aria-labelledby={`grammar-level-${level.id}`}>
            <div className="max-w-3xl">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">{level.eyebrow}</p>
              <h3 id={`grammar-level-${level.id}`} className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                {level.title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{level.description}</p>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {[1, 2, 3, 4, 5, 6].map((stageOrder) => {
                const stage = STAGE_COPY[level.id][stageOrder];
                const pages = pagesFor(level.id, stageOrder);
                const established = ESTABLISHED_GUIDES[`${level.id}-${stageOrder}`] ?? [];

                return (
                  <section
                    key={`${level.id}-${stageOrder}`}
                    data-grammar-stage={`${level.id}-${stageOrder}`}
                    className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-[0_12px_34px_rgba(15,23,42,0.045)] sm:p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">Stage {stageOrder}</p>
                        <h4 className="mt-1 text-xl font-black tracking-tight text-slate-950">{stage.title}</h4>
                      </div>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-black text-slate-500">
                        {pages.length + established.length} resources
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{stage.goal}</p>

                    <div className="mt-5 space-y-2.5">
                      {pages.map((page) => (
                        <Link
                          key={page.id}
                          to={page.path}
                          className="group block rounded-2xl border border-emerald-100 bg-emerald-50/35 px-4 py-3.5 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-sm"
                        >
                          <span className="block text-sm font-black text-slate-950 group-hover:text-emerald-800">{page.cardTitle}</span>
                          <span className="mt-1 block line-clamp-2 text-xs leading-5 text-slate-600">{page.quickAnswer}</span>
                        </Link>
                      ))}

                      {established.map((guide) => (
                        <Link
                          key={guide.to}
                          to={guide.to}
                          className="group block rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3.5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-sm"
                        >
                          <span className="block text-sm font-black text-slate-950">{guide.title}</span>
                          <span className="mt-1 block text-xs leading-5 text-slate-600">{guide.note}</span>
                        </Link>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  </section>
);

export default GrammarResourceTimeline;
