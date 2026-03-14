import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  applyStage1BResult,
  BBS_STAGE_1A,
  BBS_STAGE_1B,
  BBS_STAGE_1C,
  BBS_STAGE_1D,
  canAccessStage1B,
  canAccessStage1C,
  loadBbsProgress,
} from './buildBetterSentencesProgress';

type FillBlankItem = {
  itemId: string;
  sentence: string;
  options: Array<{
    value: string;
    grammarTag: string;
  }>;
  answer: string;
  skillFocus: string;
  hint1: string;
};

const STAGE_ITEMS: FillBlankItem[] = [
  {
    itemId: 'bbs-1b-001',
    sentence: 'The boy ___ to school every day.',
    options: [
      { value: 'go', grammarTag: 'Verb (base form)' },
      { value: 'goes', grammarTag: 'Verb (present tense)' },
      { value: 'going', grammarTag: 'Verb (continuous form)' },
    ],
    answer: 'goes',
    skillFocus: 'subject-verb-agreement',
    hint1: 'We need the action word that matches one boy.',
  },
  {
    itemId: 'bbs-1b-002',
    sentence: 'I saw ___ elephant at the zoo.',
    options: [
      { value: 'a', grammarTag: 'Article' },
      { value: 'an', grammarTag: 'Article' },
      { value: 'the', grammarTag: 'Article (definite)' },
    ],
    answer: 'an',
    skillFocus: 'article-use',
    hint1: 'Use the article sound that fits before "elephant".',
  },
  {
    itemId: 'bbs-1b-003',
    sentence: 'She is sitting ___ the chair.',
    options: [
      { value: 'on', grammarTag: 'Preposition' },
      { value: 'in', grammarTag: 'Preposition' },
      { value: 'at', grammarTag: 'Preposition' },
    ],
    answer: 'on',
    skillFocus: 'prepositions',
    hint1: 'Choose the word that shows position on top of something.',
  },
  {
    itemId: 'bbs-1b-004',
    sentence: 'Riya and Sam are playing. ___ are happy.',
    options: [
      { value: 'He', grammarTag: 'Pronoun (subjective, singular)' },
      { value: 'She', grammarTag: 'Pronoun (subjective, singular)' },
      { value: 'They', grammarTag: 'Pronoun (subjective, plural)' },
    ],
    answer: 'They',
    skillFocus: 'pronouns',
    hint1: 'Two people together need a plural pronoun.',
  },
  {
    itemId: 'bbs-1b-005',
    sentence: 'The rabbit is very ___.',
    options: [
      { value: 'soft', grammarTag: 'Adjective' },
      { value: 'softly', grammarTag: 'Adverb' },
      { value: 'softer', grammarTag: 'Comparative adjective' },
    ],
    answer: 'soft',
    skillFocus: 'adjective-choice',
    hint1: 'Pick a describing word for the rabbit.',
  },
  {
    itemId: 'bbs-1b-006',
    sentence: 'We ___ milk in the morning.',
    options: [
      { value: 'drink', grammarTag: 'Verb (base form)' },
      { value: 'drinks', grammarTag: 'Verb (present tense singular)' },
      { value: 'drinking', grammarTag: 'Verb (continuous form)' },
    ],
    answer: 'drink',
    skillFocus: 'verb-form',
    hint1: 'With "we", use the base action word.',
  },
];

const isMissionReturnPath = (path: string) => path.startsWith('/kids/games/english-excellence');

export default function BuildBetterSentencesFillBlank() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const kidId = searchParams.get('kidId') || '';

  const [itemIndex, setItemIndex] = useState(0);
  const [hintStep, setHintStep] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [feedback, setFeedback] = useState('Choose the best word for the blank.');
  const [submissions, setSubmissions] = useState(0);
  const [correctSubmissions, setCorrectSubmissions] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [completedItemIds, setCompletedItemIds] = useState<string[]>([]);
  const [stageDone, setStageDone] = useState(false);
  const [lastChoice, setLastChoice] = useState<string | null>(null);
  const [stageResultRecorded, setStageResultRecorded] = useState(false);
  const [progress, setProgress] = useState(() => loadBbsProgress(kidId));
  const [lockedReason, setLockedReason] = useState('');

  const item = STAGE_ITEMS[itemIndex];
  const hiddenWrongOption = useMemo(() => {
    if (hintStep < 2) return null;
    return item.options.find((option) => option.value !== item.answer)?.value || null;
  }, [hintStep, item]);

  const accuracyPct = submissions > 0 ? Math.round((correctSubmissions / submissions) * 100) : 0;
  const mastered = stageDone && accuracyPct >= 80 && hintsUsed <= 2;
  const missionTileId = searchParams.get('eemTile') || 'eem-g15-better-sentences';
  const stage1BUnlocked = progress[BBS_STAGE_1B].unlocked || canAccessStage1B(kidId);
  const stage1CUnlocked = progress[BBS_STAGE_1C].unlocked || canAccessStage1C(kidId);

  useEffect(() => {
    if (stage1BUnlocked) return;
    setLockedReason('Stage 1B is locked. Master Stage 1A (80%+ accuracy and max 2 hints) to unlock.');
  }, [stage1BUnlocked]);

  useEffect(() => {
    if (!stageDone || stageResultRecorded) return;
    const next = applyStage1BResult(kidId, {
      accuracyPct,
      hintCount: hintsUsed,
      retryCount,
    });
    setProgress(next);
    setStageResultRecorded(true);
  }, [accuracyPct, hintsUsed, kidId, retryCount, stageDone, stageResultRecorded]);

  const buildMissionReturnHref = (markComplete: boolean) => {
    const rawReturn = searchParams.get('eemReturn') || '/kids/games/english-excellence';
    const safeReturn = rawReturn.startsWith('/') && isMissionReturnPath(rawReturn)
      ? rawReturn
      : '/kids/games/english-excellence';

    const url = new URL(safeReturn, window.location.origin);

    const kidId = searchParams.get('kidId');
    if (kidId && !url.searchParams.has('kidId')) {
      url.searchParams.set('kidId', kidId);
    }

    const eemStage = searchParams.get('eemStage');
    if (eemStage && !url.searchParams.has('eemStage')) {
      url.searchParams.set('eemStage', eemStage);
    }

    if (markComplete) {
      url.searchParams.set('eemDone', missionTileId);
    }

    return `${url.pathname}${url.search}${url.hash}`;
  };

  const buildStageHref = (path: string) => {
    const url = new URL(path, window.location.origin);
    const carryKeys = ['kidId', 'eemTile', 'eemStage', 'eemReturn'] as const;
    for (const key of carryKeys) {
      const value = searchParams.get(key);
      if (value && !url.searchParams.has(key)) {
        url.searchParams.set(key, value);
      }
    }
    return `${url.pathname}${url.search}${url.hash}`;
  };

  const advanceToNext = () => {
    const next = itemIndex + 1;
    if (next >= STAGE_ITEMS.length) {
      setStageDone(true);
      setFeedback('Stage complete. Nice sentence choices.');
      return;
    }

    setItemIndex(next);
    setHintStep(0);
    setLastChoice(null);
    setFeedback('Great. Next sentence.');
  };

  const onHint = () => {
    if (stageDone || !stage1BUnlocked) return;

    if (hintStep === 0) {
      setHintStep(1);
      setHintsUsed((n) => n + 1);
      setFeedback(`Hint: ${item.hint1}`);
      return;
    }

    if (hintStep === 1) {
      setHintStep(2);
      setHintsUsed((n) => n + 1);
      setFeedback('Hint: One wrong option is removed.');
      return;
    }

    setFeedback('Read the full sentence and choose what sounds right.');
  };

  const onOptionTap = (option: string) => {
    if (stageDone || !stage1BUnlocked) return;
    if (hiddenWrongOption && option === hiddenWrongOption) return;

    setLastChoice(option);
    setSubmissions((n) => n + 1);

    if (option !== item.answer) {
      setRetryCount((n) => n + 1);
      setFeedback('Nice try. Read the sentence again and pick the best fit.');
      return;
    }

    setCorrectSubmissions((n) => n + 1);
    setCompletedItemIds((prev) => (prev.includes(item.itemId) ? prev : [...prev, item.itemId]));
    setFeedback('Correct. Great sentence choice.');
    window.setTimeout(advanceToNext, 450);
  };

  const openStage1C = () => {
    if (!stage1CUnlocked) {
      setFeedback('Stage 1C is locked. Master Stage 1B first.');
      return;
    }
    navigate(buildStageHref('/kids/games/grammar/build-better-sentences/choose-better-sentence'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-indigo-50 px-4 py-6 text-slate-900">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Grammar Practice</p>
            <h1 className="text-xl font-black md:text-2xl">Build Better Sentences • Stage 1B</h1>
            <p className="text-sm text-slate-600">Fill Missing Word</p>
          </div>
          <button
            type="button"
            onClick={() => navigate(buildStageHref('/kids/games/grammar/build-better-sentences'))}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Stage 1A
          </button>
        </div>

        <div className="mb-4 grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <p className="font-bold text-slate-700">1A Reorder Words</p>
            <p className="text-slate-600">
              {progress[BBS_STAGE_1A].mastered ? 'Mastered' : progress[BBS_STAGE_1A].completed ? 'In Progress' : 'Ready'}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <p className="font-bold text-slate-700">1B Fill Missing Word</p>
            <p className="text-slate-600">
              {progress[BBS_STAGE_1B].mastered ? 'Mastered' : stage1BUnlocked ? 'Ready' : 'Locked'}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <p className="font-bold text-slate-700">1C Choose Better</p>
            <p className="text-slate-600">
              {progress[BBS_STAGE_1C].mastered ? 'Mastered' : stage1CUnlocked ? 'Ready' : 'Locked'}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <p className="font-bold text-slate-700">1D Expand Sentence</p>
            <p className="text-slate-600">
              {progress[BBS_STAGE_1D].mastered ? 'Mastered' : progress[BBS_STAGE_1D].unlocked ? 'Ready' : 'Locked'}
            </p>
          </div>
        </div>

        {!stage1BUnlocked ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <h2 className="text-lg font-black text-amber-900">Stage 1B Locked</h2>
            <p className="mt-2 text-sm text-amber-900">{lockedReason}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigate(buildStageHref('/kids/games/grammar/build-better-sentences'))}
                className="rounded-xl border border-indigo-600 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Play Stage 1A
              </button>
              <button
                type="button"
                onClick={() => navigate(buildMissionReturnHref(false))}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Back to Mission
              </button>
            </div>
          </div>
        ) : !stageDone ? (
          <>
            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-700">Item {itemIndex + 1} / {STAGE_ITEMS.length}</span>
              <span className="text-slate-500">Accuracy: {accuracyPct}% • Hints used: {hintsUsed}</span>
            </div>

            <div className="mb-5 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-4">
              <p className="text-sm font-semibold text-indigo-800">Pick the best word for the blank</p>
              <p className="mt-2 text-xl font-black text-slate-900">{item.sentence}</p>
            </div>

            <div className="mb-5 grid gap-3 sm:grid-cols-2">
              {item.options.map((option) => {
                const hidden = hiddenWrongOption === option.value;
                const selected = lastChoice === option.value;
                return (
                  <button
                    key={`${item.itemId}-${option.value}`}
                    type="button"
                    onClick={() => onOptionTap(option.value)}
                    disabled={hidden}
                    className={`rounded-2xl border px-4 py-4 text-base font-bold transition ${
                      hidden
                        ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300'
                        : selected
                          ? 'border-indigo-400 bg-indigo-50 text-indigo-900'
                          : 'border-slate-300 bg-white text-slate-900 hover:border-indigo-300 hover:bg-indigo-50'
                    }`}
                  >
                    {hidden ? (
                      '—'
                    ) : (
                      <>
                        <span className="block">{option.value}</span>
                        <span className="mt-1 block text-xs font-semibold text-slate-500">{option.grammarTag}</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onHint}
                className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100"
              >
                Hint
              </button>
              <button
                type="button"
                onClick={() => navigate(buildMissionReturnHref(false))}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Back to Mission
              </button>
            </div>

            <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{feedback}</p>
          </>
        ) : (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <h2 className="text-xl font-black text-emerald-900">Stage Summary</h2>
            <p className="mt-2 text-sm text-emerald-800">
              Accuracy: <strong>{accuracyPct}%</strong> | Hints: <strong>{hintsUsed}</strong> | Completed items: <strong>{completedItemIds.length}</strong>
            </p>
            <p className="mt-1 text-sm text-emerald-800">Completed: {completedItemIds.join(', ')}</p>
            <p className="mt-2 text-sm font-semibold text-emerald-900">
              {mastered ? 'Mastery reached for Stage 1B.' : 'Stage done. Retry once more to hit mastery target (80%+, max 2 hints).'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigate(buildMissionReturnHref(mastered))}
                className="rounded-xl border border-emerald-700 bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                Back to Mission
              </button>
              <button
                type="button"
                onClick={openStage1C}
                disabled={!stage1CUnlocked}
                className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                  stage1CUnlocked
                    ? 'border border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400'
                }`}
              >
                {stage1CUnlocked ? 'Continue to Stage 1C' : 'Stage 1C Locked'}
              </button>
              <button
                type="button"
                onClick={() => navigate(buildStageHref('/kids/games/grammar/build-better-sentences'))}
                className="rounded-xl border border-indigo-600 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Play Stage 1A
              </button>
              <button
                type="button"
                onClick={() => {
                  setItemIndex(0);
                  setHintStep(0);
                  setHintsUsed(0);
                  setFeedback('Choose the best word for the blank.');
                  setSubmissions(0);
                  setCorrectSubmissions(0);
                  setRetryCount(0);
                  setCompletedItemIds([]);
                  setStageDone(false);
                  setLastChoice(null);
                  setStageResultRecorded(false);
                }}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
              >
                Play Again
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-500">Retries in this run: {retryCount}</p>
          </div>
        )}
      </div>
    </div>
  );
}
