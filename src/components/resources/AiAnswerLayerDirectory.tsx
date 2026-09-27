import type { FC } from 'react';
import { ArrowUpRight, BookOpenText, Dumbbell, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AI_ANSWER_LAYER_1_PARENT_PROBLEMS,
  AI_ANSWER_LAYER_2_LEARNING_CONCEPTS,
  AI_ANSWER_LAYER_3_PRACTICE_ACTIONS,
  getAiAnswerLayerSubjectItems,
} from '../../lib/aiAnswerLayerRegistry.js';

export type AiAnswerSubject = 'phonics-reading' | 'grammar-writing' | 'speaking-communication';

type AnswerItem = {
  id: string;
  layer: number;
  subject: AiAnswerSubject;
  query: string;
  answer?: string | null;
  canonicalPath: string;
};

type LayerConfig = {
  layer: 1 | 2 | 3;
  eyebrow: string;
  title: string;
  description: string;
  icon: typeof Search;
  items: readonly AnswerItem[];
};

const SUBJECTS: readonly AiAnswerSubject[] = [
  'phonics-reading',
  'grammar-writing',
  'speaking-communication',
];

const SUBJECT_LABELS: Record<AiAnswerSubject, string> = {
  'phonics-reading': 'Phonics & Reading',
  'grammar-writing': 'Grammar & Writing',
  'speaking-communication': 'Speaking & Communication',
};

function balancedItems(items: readonly AnswerItem[], perSubject: number) {
  return SUBJECTS.flatMap((subject) => items.filter((item) => item.subject === subject).slice(0, perSubject));
}

function layerItems(layer: 1 | 2 | 3, subject?: AiAnswerSubject) {
  if (subject) return getAiAnswerLayerSubjectItems(layer, subject) as readonly AnswerItem[];
  const all =
    layer === 1
      ? AI_ANSWER_LAYER_1_PARENT_PROBLEMS
      : layer === 2
        ? AI_ANSWER_LAYER_2_LEARNING_CONCEPTS
        : AI_ANSWER_LAYER_3_PRACTICE_ACTIONS;
  return balancedItems(all as readonly AnswerItem[], 2);
}

const AiAnswerLayerDirectory: FC<{ subject?: AiAnswerSubject; compact?: boolean }> = ({
  subject,
  compact = false,
}) => {
  const configs: LayerConfig[] = [
    {
      layer: 1,
      eyebrow: 'Layer 1 · Parent problem',
      title: 'Start with what you are seeing',
      description: 'Start with the concern you are seeing and open the explanation that matches it most closely.',
      icon: Search,
      items: layerItems(1, subject),
    },
    {
      layer: 2,
      eyebrow: 'Layer 2 · Learning concept',
      title: 'Understand the skill or idea',
      description: 'Understand what the skill means, where it fits, and what children usually need before or after it.',
      icon: BookOpenText,
      items: layerItems(2, subject),
    },
    {
      layer: 3,
      eyebrow: 'Layer 3 · Practice',
      title: 'Choose the next focused action',
      description: 'Choose a short activity that directly practises the skill you have just identified.',
      icon: Dumbbell,
      items: layerItems(3, subject),
    },
  ];

  return (
    <section
      data-ai-answer-layer-directory
      data-ai-answer-subject={subject ?? 'all'}
      aria-labelledby={subject ? `ai-answer-layers-${subject}` : 'ai-answer-layers'}
      className={compact ? 'mt-7' : 'mx-auto mt-7 w-full max-w-[1240px]'}
    >
      <div className={compact ? '' : 'rounded-[1.6rem] border border-slate-200/90 bg-white/75 p-4 shadow-[0_10px_28px_rgba(15,23,42,0.045)] sm:p-5'}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.23em] text-slate-500">
              Find the right answer
            </p>
            <h2
              id={subject ? `ai-answer-layers-${subject}` : 'ai-answer-layers'}
              className="mt-1 text-xl font-black tracking-[-0.025em] text-slate-950 sm:text-2xl"
            >
              {subject ? `${SUBJECT_LABELS[subject]}: question → explanation → practice` : 'Start with a question → understand the skill → choose practice'}
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            Start with the concern or skill you recognise, open the clearest explanation, then move to a focused next step or practice activity.
          </p>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {configs.map((config) => {
            const Icon = config.icon;
            return (
              <article
                key={config.layer}
                data-ai-answer-layer={config.layer}
                className="rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-[0_7px_22px_rgba(15,23,42,0.035)]"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
                    <Icon aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.19em] text-slate-500">{config.eyebrow}</p>
                    <h3 className="mt-1 text-base font-black leading-5 text-slate-950">{config.title}</h3>
                  </div>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-600">{config.description}</p>

                <div className="mt-3 space-y-2">
                  {config.items.slice(0, subject ? 4 : 6).map((entry) => (
                    <Link
                      key={entry.id}
                      to={entry.canonicalPath}
                      data-ai-query={entry.query}
                      data-ai-answer-path={entry.canonicalPath}
                      className="group flex items-start justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-2.5 transition hover:border-slate-300 hover:bg-white"
                    >
                      <span className="min-w-0">
                        <span className="block text-[13px] font-bold leading-5 text-slate-800">{entry.query}</span>
                        {entry.answer ? (
                          <span className="mt-0.5 line-clamp-2 block text-[11px] leading-4 text-slate-500">{entry.answer}</span>
                        ) : null}
                      </span>
                      <ArrowUpRight aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </Link>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AiAnswerLayerDirectory;
