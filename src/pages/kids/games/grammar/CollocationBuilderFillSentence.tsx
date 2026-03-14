import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BBS_STAGE_1D, loadBbsProgress } from './buildBetterSentencesProgress';
import { GF_STAGE_2D, loadGrammarFixProgress } from './grammarFixProgress';
import {
  applyCollocationStage3CResult,
  canAccessCollocationStage3C,
  CB_STAGE_3A,
  CB_STAGE_3B,
  CB_STAGE_3C,
  loadCollocationBuilderProgress,
} from './collocationBuilderProgress';

type FillSentenceItem = {
  itemId: string;
  sentence: string;
  options: [string, string, string];
  answerIndex: 0 | 1 | 2;
  skillFocus: string;
  hint2: string;
};

const STAGE_ITEMS: FillSentenceItem[] = [
  {
    itemId: 'gpc-3c-001',
    sentence: 'I always ___ my homework after school.',
    options: ['do', 'make', 'take'],
    answerIndex: 0,
    skillFocus: 'do-homework',
    hint2: 'Pick the verb used with homework.',
  },
  {
    itemId: 'gpc-3c-002',
    sentence: 'Dad will ___ a cake for the party.',
    options: ['do', 'make', 'tell'],
    answerIndex: 1,
    skillFocus: 'make-a-cake',
    hint2: 'Pick the verb for creating food.',
  },
  {
    itemId: 'gpc-3c-003',
    sentence: 'She wants to ___ a photo in the park.',
    options: ['have', 'take', 'brush'],
    answerIndex: 1,
    skillFocus: 'take-a-photo',
    hint2: 'Pick the camera action verb.',
  },
  {
    itemId: 'gpc-3c-004',
    sentence: 'We ___ breakfast at 8 o’clock.',
    options: ['have', 'do', 'tell'],
    answerIndex: 0,
    skillFocus: 'have-breakfast',
    hint2: 'Pick the meal collocation.',
  },
  {
    itemId: 'gpc-3c-005',
    sentence: 'Please ___ your teeth before bed.',
    options: ['take', 'brush', 'make'],
    answerIndex: 1,
    skillFocus: 'brush-teeth',
    hint2: 'Pick the hygiene verb.',
  },
  {
    itemId: 'gpc-3c-006',
    sentence: 'Grandma can ___ a story at night.',
    options: ['tell', 'do', 'have'],
    answerIndex: 0,
    skillFocus: 'tell-a-story',
    hint2: 'Pick the verb for speaking a story.',
  },
];

const isMissionReturnPath = (path: string) => path.startsWith('/kids/games/english-excellence');

export default function CollocationBuilderFillSentence() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const kidId = searchParams.get('kidId') || '';
  const bbsProgress = loadBbsProgress(kidId);
  const grammarFixProgress = loadGrammarFixProgress(kidId);
  const collocationReady =
    bbsProgress.gameCompleted &&
    bbsProgress[BBS_STAGE_1D]?.mastered &&
    grammarFixProgress.gameCompleted &&
    grammarFixProgress[GF_STAGE_2D]?.mastered;

  const [itemIndex, setItemIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [hintStep, setHintStep] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [feedback, setFeedback] = useState('Choose the word that sounds natural in the sentence.');
  const [submissions, setSubmissions] = useState(0);
  const [correctSubmissions, setCorrectSubmissions] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [completedItemIds, setCompletedItemIds] = useState<string[]>([]);
  const [stageDone, setStageDone] = useState(false);
  const [stageResultRecorded, setStageResultRecorded] = useState(false);
  const [lockedReason, setLockedReason] = useState('');
  const [progress, setProgress] = useState(() => loadCollocationBuilderProgress(kidId));

  const item = STAGE_ITEMS[itemIndex];
  const accuracyPct = submissions > 0 ? Math.round((correctSubmissions / submissions) * 100) : 0;
  const mastered = stageDone && accuracyPct >= 80 && hintsUsed <= 2;
  const missionTileId = searchParams.get('eemTile') || 'eem-g16-collocation-builder';
  const stage3CUnlocked = progress[CB_STAGE_3C].unlocked || canAccessCollocationStage3C(kidId);

  useEffect(() => {
    if (collocationReady && stage3CUnlocked) return;
    if (!collocationReady) {
      setLockedReason('Collocation Builder unlocks after Grammar Fix is completed and Stage 2D is mastered.');
      return;
    }
    setLockedReason('Stage 3C unlocks after mastering Stage 3B (80%+ accuracy and max 2 hints).');
  }, [collocationReady, stage3CUnlocked]);

  useEffect(() => {
    if (!stageDone || stageResultRecorded) return;
    const next = applyCollocationStage3CResult(kidId, {
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
      setFeedback('Stage complete. Nice sentence usage.');
      return;
    }
    setItemIndex(next);
    setSelectedOptionIndex(null);
    setHintStep(0);
    setFeedback('Great. Fill the next sentence.');
  };

  const onHint = () => {
    if (stageDone || !collocationReady || !stage3CUnlocked) return;
    if (hintStep === 0) {
      setHintStep(1);
      setHintsUsed((n) => n + 1);
      setFeedback('Hint: Choose the word that sounds natural in this sentence.');
      return;
    }
    if (hintStep === 1) {
      setHintStep(2);
      setHintsUsed((n) => n + 1);
      setFeedback(`Hint: ${item.hint2}`);
      return;
    }
    setFeedback('Read the full sentence and pick the option that sounds most natural.');
  };

  const onOptionTap = (optionIndex: 0 | 1 | 2) => {
    if (stageDone || !collocationReady || !stage3CUnlocked) return;
    setSelectedOptionIndex(optionIndex);
    setSubmissions((n) => n + 1);

    if (optionIndex !== item.answerIndex) {
      setRetryCount((n) => n + 1);
      setFeedback('Good try. Pick the option that fits naturally.');
      return;
    }

    setCorrectSubmissions((n) => n + 1);
    setCompletedItemIds((prev) => (prev.includes(item.itemId) ? prev : [...prev, item.itemId]));
    setFeedback('Correct. That collocation fits the sentence.');
    window.setTimeout(advanceToNext, 450);
  };

  const resetStage = () => {
    setItemIndex(0);
    setSelectedOptionIndex(null);
    setHintStep(0);
    setHintsUsed(0);
    setFeedback('Choose the word that sounds natural in the sentence.');
    setSubmissions(0);
    setCorrectSubmissions(0);
    setRetryCount(0);
    setCompletedItemIds([]);
    setStageDone(false);
    setStageResultRecorded(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-indigo-50 px-4 py-6 text-slate-900">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Grammar Practice</p>
            <h1 className="text-xl font-black md:text-2xl">Collocation Builder • Stage 3C</h1>
            <p className="text-sm text-slate-600">Fill Sentence</p>
          </div>
          <button
            type="button"
            onClick={() => navigate(buildMissionReturnHref(false))}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Mission
          </button>
        </div>

        <div className="mb-4 grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <p className="font-bold text-slate-700">3A Match Pairs</p>
            <p className="text-slate-600">{progress[CB_STAGE_3A].mastered ? 'Mastered' : 'Ready'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <p className="font-bold text-slate-700">3B Choose Natural Pair</p>
            <p className="text-slate-600">{progress[CB_STAGE_3B].mastered ? 'Mastered' : 'Ready'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <p className="font-bold text-slate-700">3C Fill Sentence</p>
            <p className="text-slate-600">{progress[CB_STAGE_3C].mastered ? 'Mastered' : stage3CUnlocked ? 'Ready' : 'Locked'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <p className="font-bold text-slate-700">3D Confusion Practice</p>
            <p className="text-slate-600">Locked</p>
          </div>
        </div>

        {!collocationReady || !stage3CUnlocked ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <h2 className="text-lg font-black text-amber-900">Stage 3C Locked</h2>
            <p className="mt-2 text-sm text-amber-900">{lockedReason}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigate('/kids/games/grammar/collocation-builder/choose-natural-pair')}
                className="rounded-xl border border-indigo-600 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Play Stage 3B
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
              <p className="font-semibold text-slate-700">Item {itemIndex + 1} / {STAGE_ITEMS.length}</p>
              <p className="font-semibold text-slate-700">Hints used: {hintsUsed}</p>
            </div>

            <div className="mb-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
              <p className="text-sm font-semibold text-indigo-800">Fill the sentence</p>
              <p className="mt-2 text-xl font-black text-indigo-900">{item.sentence}</p>
            </div>

            <div className="grid gap-3">
              {item.options.map((option, idx) => {
                const isSelected = idx === selectedOptionIndex;
                return (
                  <button
                    key={`${item.itemId}-${option}`}
                    type="button"
                    onClick={() => onOptionTap(idx as 0 | 1 | 2)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left text-lg font-bold transition ${
                      isSelected
                        ? 'border-indigo-400 bg-indigo-50 text-indigo-900'
                        : 'border-slate-200 bg-white text-slate-800 hover:border-indigo-300 hover:bg-indigo-50'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <p className="font-semibold">Skill focus: {item.skillFocus}</p>
              <p className="mt-1">{feedback}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onHint}
                className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100"
              >
                Hint
              </button>
              <button
                type="button"
                onClick={resetStage}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Reset
              </button>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
            <h2 className="text-xl font-black text-indigo-900">Stage 3C Summary</h2>
            <div className="mt-3 grid gap-2 text-sm text-indigo-900 sm:grid-cols-2">
              <p><span className="font-bold">Accuracy:</span> {accuracyPct}%</p>
              <p><span className="font-bold">Hints used:</span> {hintsUsed}</p>
              <p><span className="font-bold">Completed items:</span> {completedItemIds.length}/{STAGE_ITEMS.length}</p>
              <p><span className="font-bold">Retry count:</span> {retryCount}</p>
            </div>
            <p className="mt-3 text-sm text-indigo-900">
              {mastered ? 'Mastery reached for Stage 3C.' : 'Stage done. Replay to hit mastery target (80%+, max 2 hints).'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={resetStage}
                className="rounded-xl border border-indigo-300 bg-white px-4 py-2 text-sm font-semibold text-indigo-900 hover:bg-indigo-100"
              >
                Replay Stage 3C
              </button>
              <button
                type="button"
                onClick={() => navigate(buildMissionReturnHref(mastered))}
                className="rounded-xl border border-indigo-600 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Back to Mission
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
