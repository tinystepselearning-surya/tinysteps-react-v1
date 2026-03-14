import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  applyStage1AResult,
  BBS_STAGE_1A,
  BBS_STAGE_1B,
  BBS_STAGE_1C,
  BBS_STAGE_1D,
  loadBbsProgress,
} from './buildBetterSentencesProgress';

type ReorderItem = {
  itemId: string;
  prompt: string[];
  answer: string[];
  finalSentence: string;
};

const STAGE_ITEMS: ReorderItem[] = [
  {
    itemId: 'bbs-1a-001',
    prompt: ['is', 'The cat', 'sleeping'],
    answer: ['The cat', 'is', 'sleeping'],
    finalSentence: 'The cat is sleeping.',
  },
  {
    itemId: 'bbs-1a-002',
    prompt: ['to school', 'Riya', 'walks'],
    answer: ['Riya', 'walks', 'to school'],
    finalSentence: 'Riya walks to school.',
  },
  {
    itemId: 'bbs-1a-003',
    prompt: ['the park', 'They', 'in', 'play'],
    answer: ['They', 'play', 'in', 'the park'],
    finalSentence: 'They play in the park.',
  },
  {
    itemId: 'bbs-1a-004',
    prompt: ['reads', 'Aman', 'every night'],
    answer: ['Aman', 'reads', 'every night'],
    finalSentence: 'Aman reads every night.',
  },
  {
    itemId: 'bbs-1a-005',
    prompt: ['beautifully', 'sings', 'She'],
    answer: ['She', 'sings', 'beautifully'],
    finalSentence: 'She sings beautifully.',
  },
];

const isMissionReturnPath = (path: string) => path.startsWith('/kids/games/english-excellence');

export default function BuildBetterSentencesReorder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const kidId = searchParams.get('kidId') || '';

  const [itemIndex, setItemIndex] = useState(0);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [hintStep, setHintStep] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [feedback, setFeedback] = useState<string>('Tap words to build the sentence.');
  const [submissions, setSubmissions] = useState(0);
  const [correctSubmissions, setCorrectSubmissions] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [completedItemIds, setCompletedItemIds] = useState<string[]>([]);
  const [stageDone, setStageDone] = useState(false);
  const [stageResultRecorded, setStageResultRecorded] = useState(false);
  const [progress, setProgress] = useState(() => loadBbsProgress(kidId));

  const item = STAGE_ITEMS[itemIndex];
  const selectedWords = selectedIndices.map((idx) => item.prompt[idx]);

  const firstWordInPromptIndex = useMemo(() => {
    const first = item.answer[0];
    return item.prompt.findIndex((w) => w === first);
  }, [item]);

  const firstWordLocked = hintStep >= 2 && selectedIndices[0] === firstWordInPromptIndex;

  const accuracyPct = submissions > 0 ? Math.round((correctSubmissions / submissions) * 100) : 0;
  const mastered = stageDone && accuracyPct >= 80 && hintsUsed <= 2;
  const stage1BUnlocked = progress[BBS_STAGE_1B].unlocked;

  const missionTileId = searchParams.get('eemTile') || 'eem-g15-better-sentences';

  useEffect(() => {
    if (!stageDone || stageResultRecorded) return;
    const next = applyStage1AResult(kidId, {
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

  const advanceToNext = () => {
    const next = itemIndex + 1;
    if (next >= STAGE_ITEMS.length) {
      setStageDone(true);
      setFeedback('Stage complete. Nice sentence building.');
      return;
    }

    setItemIndex(next);
    setSelectedIndices([]);
    setHintStep(0);
    setFeedback('Great. Next sentence.');
  };

  const onWordTap = (idx: number) => {
    if (stageDone) return;
    if (selectedIndices.includes(idx)) return;

    if (firstWordLocked && idx === firstWordInPromptIndex) {
      return;
    }

    setSelectedIndices((prev) => [...prev, idx]);
  };

  const onUndo = () => {
    if (stageDone || selectedIndices.length === 0) return;

    if (firstWordLocked && selectedIndices.length === 1) {
      return;
    }

    setSelectedIndices((prev) => prev.slice(0, -1));
  };

  const onReset = () => {
    if (stageDone) return;
    if (firstWordLocked) {
      setSelectedIndices([firstWordInPromptIndex]);
      return;
    }
    setSelectedIndices([]);
  };

  const onHint = () => {
    if (stageDone) return;

    if (hintStep === 0) {
      setHintStep(1);
      setHintsUsed((n) => n + 1);
      setFeedback('Hint: Start with the highlighted word.');
      return;
    }

    if (hintStep === 1) {
      setHintStep(2);
      setHintsUsed((n) => n + 1);
      setSelectedIndices([firstWordInPromptIndex]);
      setFeedback('Hint: First word is locked in place.');
      return;
    }

    setFeedback('Keep going. You are close.');
  };

  const onSubmit = () => {
    if (stageDone) return;
    if (selectedWords.length !== item.answer.length) {
      setFeedback('Finish arranging all words before submitting.');
      return;
    }

    setSubmissions((n) => n + 1);

    const correct = item.answer.every((w, i) => selectedWords[i] === w);

    if (!correct) {
      setRetryCount((n) => n + 1);
      setFeedback('Nice try. Check the order and try again.');
      return;
    }

    setCorrectSubmissions((n) => n + 1);
    setCompletedItemIds((prev) => (prev.includes(item.itemId) ? prev : [...prev, item.itemId]));
    setFeedback(`Correct: ${item.finalSentence}`);
    window.setTimeout(advanceToNext, 500);
  };

  const openStage1B = () => {
    if (!stage1BUnlocked) {
      setFeedback('Stage 1B is locked. Master Stage 1A first.');
      return;
    }
    navigate('/kids/games/grammar/build-better-sentences/fill-missing-word');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-indigo-50 px-4 py-6 text-slate-900">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Grammar Practice</p>
            <h1 className="text-xl font-black md:text-2xl">Build Better Sentences • Stage 1A</h1>
            <p className="text-sm text-slate-600">Reorder Words</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openStage1B}
              className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                stage1BUnlocked
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
              }`}
            >
              Stage 1B {stage1BUnlocked ? 'Ready' : 'Locked'}
            </button>
            <button
              type="button"
              onClick={() => navigate(buildMissionReturnHref(false))}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back
            </button>
          </div>
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
              {progress[BBS_STAGE_1C].mastered ? 'Mastered' : progress[BBS_STAGE_1C].unlocked ? 'Ready' : 'Locked'}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <p className="font-bold text-slate-700">1D Expand Sentence</p>
            <p className="text-slate-600">
              {progress[BBS_STAGE_1D].mastered ? 'Mastered' : progress[BBS_STAGE_1D].unlocked ? 'Ready' : 'Locked'}
            </p>
          </div>
        </div>

        {!stageDone ? (
          <>
            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-700">Item {itemIndex + 1} / {STAGE_ITEMS.length}</span>
              <span className="text-slate-500">Hints used: {hintsUsed}</span>
            </div>

            <div className="mb-5 min-h-16 rounded-2xl border border-indigo-200 bg-indigo-50 px-3 py-3">
              <p className="text-sm font-semibold text-indigo-800">Your sentence</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{selectedWords.join(' ') || '...'} </p>
            </div>

            <div className="mb-5 flex flex-wrap gap-3">
              {item.prompt.map((word, idx) => {
                const isSelected = selectedIndices.includes(idx);
                const isHinted = hintStep >= 1 && idx === firstWordInPromptIndex;
                return (
                  <button
                    key={`${item.itemId}-${idx}`}
                    type="button"
                    onClick={() => onWordTap(idx)}
                    disabled={isSelected}
                    className={`rounded-2xl border px-4 py-3 text-base font-bold transition ${
                      isSelected
                        ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                        : isHinted
                          ? 'border-amber-300 bg-amber-50 text-amber-900'
                          : 'border-slate-300 bg-white text-slate-900 hover:border-indigo-300 hover:bg-indigo-50'
                    }`}
                  >
                    {word}
                  </button>
                );
              })}
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              <button type="button" onClick={onUndo} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50">Undo</button>
              <button type="button" onClick={onReset} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50">Reset</button>
              <button type="button" onClick={onHint} className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100">Hint</button>
              <button type="button" onClick={onSubmit} className="rounded-xl border border-indigo-600 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Submit</button>
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
              {mastered ? 'Mastery reached for Stage 1A.' : 'Stage done. Retry once more to hit mastery target (80%+, max 2 hints).'}
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
                onClick={openStage1B}
                disabled={!stage1BUnlocked}
                className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                  stage1BUnlocked
                    ? 'border border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400'
                }`}
              >
                {stage1BUnlocked ? 'Continue to Stage 1B' : 'Stage 1B Locked'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setItemIndex(0);
                  setSelectedIndices([]);
                  setHintStep(0);
                  setHintsUsed(0);
                  setFeedback('Tap words to build the sentence.');
                  setSubmissions(0);
                  setCorrectSubmissions(0);
                  setRetryCount(0);
                  setCompletedItemIds([]);
                  setStageDone(false);
                  setStageResultRecorded(false);
                }}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
              >
                Replay 1A
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-500">Retries in this run: {retryCount}</p>
          </div>
        )}
      </div>
    </div>
  );
}
