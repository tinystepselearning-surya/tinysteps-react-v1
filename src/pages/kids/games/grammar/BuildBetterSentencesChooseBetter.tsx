import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  applyStage1CResult,
  BBS_STAGE_1A,
  BBS_STAGE_1B,
  BBS_STAGE_1C,
  BBS_STAGE_1D,
  canAccessStage1C,
  canAccessStage1D,
  loadBbsProgress,
} from './buildBetterSentencesProgress';

type ChooseBestItem = {
  itemId: string;
  prompt: string;
  options: [string, string];
  answerIndex: 0 | 1;
  hint1: string;
  hint2: string;
};

const STAGE_ITEMS: ChooseBestItem[] = [
  {
    itemId: 'bbs-1c-001',
    prompt: 'Choose the better sentence.',
    options: ['She go to school every day.', 'She goes to school every day.'],
    answerIndex: 1,
    hint1: 'Check if the action word matches "She".',
    hint2: 'Look at the word "go/goes".',
  },
  {
    itemId: 'bbs-1c-002',
    prompt: 'Choose the better sentence.',
    options: ['I saw a elephant at the zoo.', 'I saw an elephant at the zoo.'],
    answerIndex: 1,
    hint1: 'Check the article before "elephant".',
    hint2: 'Focus on "a/an".',
  },
  {
    itemId: 'bbs-1c-003',
    prompt: 'Choose the better sentence.',
    options: ['Riya and Sam are friends. They play together.', 'Riya and Sam are friends. She play together.'],
    answerIndex: 0,
    hint1: 'Two people need a plural pronoun.',
    hint2: 'Focus on "They/She".',
  },
  {
    itemId: 'bbs-1c-004',
    prompt: 'Choose the better sentence.',
    options: ['The book is on the table.', 'The book is in the table.'],
    answerIndex: 0,
    hint1: 'Pick the preposition that fits location naturally.',
    hint2: 'Focus on "on/in".',
  },
  {
    itemId: 'bbs-1c-005',
    prompt: 'Choose the better sentence.',
    options: ['We are playing in the park.', 'We are playing in the.'],
    answerIndex: 0,
    hint1: 'One sentence should feel complete.',
    hint2: 'Check if all needed words are present.',
  },
  {
    itemId: 'bbs-1c-006',
    prompt: 'Choose the better sentence.',
    options: ['He quickly finished his homework.', 'He finished quickly his homework.'],
    answerIndex: 0,
    hint1: 'Pick the sentence that sounds clearer and natural.',
    hint2: 'Compare word order around "quickly".',
  },
];

const isMissionReturnPath = (path: string) => path.startsWith('/kids/games/english-excellence');

export default function BuildBetterSentencesChooseBetter() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const kidId = searchParams.get('kidId') || '';

  const [itemIndex, setItemIndex] = useState(0);
  const [hintStep, setHintStep] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [feedback, setFeedback] = useState('Choose the better sentence.');
  const [submissions, setSubmissions] = useState(0);
  const [correctSubmissions, setCorrectSubmissions] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [completedItemIds, setCompletedItemIds] = useState<string[]>([]);
  const [stageDone, setStageDone] = useState(false);
  const [stageResultRecorded, setStageResultRecorded] = useState(false);
  const [lastChoiceIndex, setLastChoiceIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(() => loadBbsProgress(kidId));
  const [lockedReason, setLockedReason] = useState('');

  const item = STAGE_ITEMS[itemIndex];
  const accuracyPct = submissions > 0 ? Math.round((correctSubmissions / submissions) * 100) : 0;
  const mastered = stageDone && accuracyPct >= 80 && hintsUsed <= 2;
  const missionTileId = searchParams.get('eemTile') || 'eem-g15-better-sentences';
  const stage1CUnlocked = progress[BBS_STAGE_1C].unlocked || canAccessStage1C(kidId);
  const stage1DUnlocked = progress[BBS_STAGE_1D].unlocked || canAccessStage1D(kidId);

  useEffect(() => {
    if (stage1CUnlocked) return;
    setLockedReason('Stage 1C is locked. Master Stage 1B (80%+ accuracy and max 2 hints) to unlock.');
  }, [stage1CUnlocked]);

  useEffect(() => {
    if (!stageDone || stageResultRecorded) return;
    const next = applyStage1CResult(kidId, {
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
    const spKidId = searchParams.get('kidId');
    if (spKidId && !url.searchParams.has('kidId')) {
      url.searchParams.set('kidId', spKidId);
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

  const advanceToNext = () => {
    const next = itemIndex + 1;
    if (next >= STAGE_ITEMS.length) {
      setStageDone(true);
      setFeedback('Stage complete. Great sentence judgment.');
      return;
    }
    setItemIndex(next);
    setHintStep(0);
    setLastChoiceIndex(null);
    setFeedback('Great. Next sentence pair.');
  };

  const onHint = () => {
    if (stageDone || !stage1CUnlocked) return;
    if (hintStep === 0) {
      setHintStep(1);
      setHintsUsed((n) => n + 1);
      setFeedback(`Hint: ${item.hint1}`);
      return;
    }
    if (hintStep === 1) {
      setHintStep(2);
      setHintsUsed((n) => n + 1);
      setFeedback(`Hint: ${item.hint2}`);
      return;
    }
    setFeedback('Read both options slowly and choose what sounds right.');
  };

  const onOptionTap = (optionIndex: 0 | 1) => {
    if (stageDone || !stage1CUnlocked) return;
    setLastChoiceIndex(optionIndex);
    setSubmissions((n) => n + 1);

    if (optionIndex !== item.answerIndex) {
      setRetryCount((n) => n + 1);
      setFeedback('Nice try. Compare both sentences again.');
      return;
    }

    setCorrectSubmissions((n) => n + 1);
    setCompletedItemIds((prev) => (prev.includes(item.itemId) ? prev : [...prev, item.itemId]));
    setFeedback('Correct. That is the better sentence.');
    window.setTimeout(advanceToNext, 450);
  };

  const openStage1D = () => {
    if (!stage1DUnlocked) {
      setFeedback('Stage 1D is locked. Master Stage 1C first.');
      return;
    }
    navigate('/kids/games/grammar/build-better-sentences/expand-sentence');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-indigo-50 px-4 py-6 text-slate-900">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Grammar Practice</p>
            <h1 className="text-xl font-black md:text-2xl">Build Better Sentences • Stage 1C</h1>
            <p className="text-sm text-slate-600">Choose Better Sentence</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/kids/games/grammar/build-better-sentences/fill-missing-word')}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Stage 1B
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
              {progress[BBS_STAGE_1B].mastered ? 'Mastered' : progress[BBS_STAGE_1B].unlocked ? 'Ready' : 'Locked'}
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
              {progress[BBS_STAGE_1D].mastered ? 'Mastered' : stage1DUnlocked ? 'Ready' : 'Locked'}
            </p>
          </div>
        </div>

        {!stage1CUnlocked ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <h2 className="text-lg font-black text-amber-900">Stage 1C Locked</h2>
            <p className="mt-2 text-sm text-amber-900">{lockedReason}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigate('/kids/games/grammar/build-better-sentences/fill-missing-word')}
                className="rounded-xl border border-indigo-600 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Play Stage 1B
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
              <span className="text-slate-500">Hints used: {hintsUsed}</span>
            </div>

            <div className="mb-5 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-4">
              <p className="text-sm font-semibold text-indigo-800">{item.prompt}</p>
            </div>

            <div className="mb-5 grid gap-3">
              {item.options.map((option, idx) => {
                const selected = lastChoiceIndex === idx;
                return (
                  <button
                    key={`${item.itemId}-${idx}`}
                    type="button"
                    onClick={() => onOptionTap(idx as 0 | 1)}
                    className={`rounded-2xl border px-4 py-4 text-left text-base font-bold transition ${
                      selected
                        ? 'border-indigo-400 bg-indigo-50 text-indigo-900'
                        : 'border-slate-300 bg-white text-slate-900 hover:border-indigo-300 hover:bg-indigo-50'
                    }`}
                  >
                    {option}
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
              {mastered ? 'Mastery reached for Stage 1C.' : 'Stage done. Retry once more to hit mastery target (80%+, max 2 hints).'}
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
                onClick={openStage1D}
                disabled={!stage1DUnlocked}
                className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                  stage1DUnlocked
                    ? 'border border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400'
                }`}
              >
                {stage1DUnlocked ? 'Continue to Stage 1D' : 'Stage 1D Locked'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/kids/games/grammar/build-better-sentences/fill-missing-word')}
                className="rounded-xl border border-indigo-600 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Play Stage 1B
              </button>
              <button
                type="button"
                onClick={() => {
                  setItemIndex(0);
                  setHintStep(0);
                  setHintsUsed(0);
                  setFeedback('Choose the better sentence.');
                  setSubmissions(0);
                  setCorrectSubmissions(0);
                  setRetryCount(0);
                  setCompletedItemIds([]);
                  setStageDone(false);
                  setLastChoiceIndex(null);
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
