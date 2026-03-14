import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BBS_STAGE_1D, loadBbsProgress } from './buildBetterSentencesProgress';
import { GF_STAGE_2D, loadGrammarFixProgress } from './grammarFixProgress';
import {
  applyCollocationStage3AResult,
  CB_STAGE_3A,
  CB_STAGE_3B,
  canAccessCollocationStage3B,
  loadCollocationBuilderProgress,
} from './collocationBuilderProgress';

type MatchPairsItem = {
  itemId: string;
  lead: string;
  options: [string, string, string];
  answerIndex: 0 | 1 | 2;
  skillFocus: string;
  hint2: string;
};

const STAGE_ITEMS: MatchPairsItem[] = [
  {
    itemId: 'gpc-3a-001',
    lead: 'do',
    options: ['homework', 'a cake', 'a photo'],
    answerIndex: 0,
    skillFocus: 'verb-noun-collocations',
    hint2: 'Choose the partner used for school tasks.',
  },
  {
    itemId: 'gpc-3a-002',
    lead: 'make',
    options: ['homework', 'a cake', 'a photo'],
    answerIndex: 1,
    skillFocus: 'verb-noun-collocations',
    hint2: 'Pick the partner used for creating food.',
  },
  {
    itemId: 'gpc-3a-003',
    lead: 'take',
    options: ['a photo', 'breakfast', 'teeth'],
    answerIndex: 0,
    skillFocus: 'verb-noun-collocations',
    hint2: 'Pick the partner used with a camera action.',
  },
  {
    itemId: 'gpc-3a-004',
    lead: 'have',
    options: ['teeth', 'breakfast', 'a story'],
    answerIndex: 1,
    skillFocus: 'verb-noun-collocations',
    hint2: 'Choose the meal partner.',
  },
  {
    itemId: 'gpc-3a-005',
    lead: 'brush',
    options: ['teeth', 'breakfast', 'homework'],
    answerIndex: 0,
    skillFocus: 'verb-noun-collocations',
    hint2: 'Pick the partner from daily hygiene.',
  },
  {
    itemId: 'gpc-3a-006',
    lead: 'tell',
    options: ['a story', 'a cake', 'a photo'],
    answerIndex: 0,
    skillFocus: 'verb-noun-collocations',
    hint2: 'Choose the partner used in speaking.',
  },
];

const isMissionReturnPath = (path: string) => path.startsWith('/kids/games/english-excellence');

export default function CollocationBuilderMatchPairs() {
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
  const [feedback, setFeedback] = useState('Pick the word that sounds natural with the lead word.');
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
  const stage3BUnlocked = progress[CB_STAGE_3B].unlocked || canAccessCollocationStage3B(kidId);

  useEffect(() => {
    if (collocationReady) return;
    setLockedReason('Collocation Builder unlocks after Grammar Fix is completed and Stage 2D is mastered.');
  }, [collocationReady]);

  useEffect(() => {
    if (!stageDone || stageResultRecorded) return;
    const next = applyCollocationStage3AResult(kidId, {
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
      setFeedback('Stage complete. Nice matching.');
      return;
    }
    setItemIndex(next);
    setSelectedOptionIndex(null);
    setHintStep(0);
    setFeedback('Good match. Pick the next natural pair.');
  };

  const onHint = () => {
    if (stageDone || !collocationReady) return;
    if (hintStep === 0) {
      setHintStep(1);
      setHintsUsed((n) => n + 1);
      setFeedback('Hint: The two words should sound natural together.');
      return;
    }
    if (hintStep === 1) {
      setHintStep(2);
      setHintsUsed((n) => n + 1);
      setFeedback(`Hint: ${item.hint2}`);
      return;
    }
    setFeedback('Read each pair slowly and pick the one you hear most naturally.');
  };

  const onOptionTap = (optionIndex: 0 | 1 | 2) => {
    if (stageDone || !collocationReady) return;
    setSelectedOptionIndex(optionIndex);
    setSubmissions((n) => n + 1);

    if (optionIndex !== item.answerIndex) {
      setRetryCount((n) => n + 1);
      setFeedback('Good try. Choose the more natural partner.');
      return;
    }

    setCorrectSubmissions((n) => n + 1);
    setCompletedItemIds((prev) => (prev.includes(item.itemId) ? prev : [...prev, item.itemId]));
    setFeedback('Correct. That collocation sounds natural.');
    window.setTimeout(advanceToNext, 450);
  };

  const resetStage = () => {
    setItemIndex(0);
    setSelectedOptionIndex(null);
    setHintStep(0);
    setHintsUsed(0);
    setFeedback('Pick the word that sounds natural with the lead word.');
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
            <h1 className="text-xl font-black md:text-2xl">Collocation Builder • Stage 3A</h1>
            <p className="text-sm text-slate-600">Match Pairs</p>
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
            <p className="text-slate-600">{progress[CB_STAGE_3A].mastered ? 'Mastered' : collocationReady ? 'Ready' : 'Locked'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <p className="font-bold text-slate-700">3B Choose Natural Pair</p>
            <p className="text-slate-600">{progress[CB_STAGE_3B].mastered ? 'Mastered' : stage3BUnlocked ? 'Ready' : 'Locked'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <p className="font-bold text-slate-700">3C Fill Sentence</p>
            <p className="text-slate-600">Locked</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <p className="font-bold text-slate-700">3D Confusion Practice</p>
            <p className="text-slate-600">Locked</p>
          </div>
        </div>

        {!collocationReady ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <h2 className="text-lg font-black text-amber-900">Collocation Builder Locked</h2>
            <p className="mt-2 text-sm text-amber-900">{lockedReason}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigate('/kids/games/grammar/grammar-fix/spot-one-error')}
                className="rounded-xl border border-indigo-600 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Play Grammar Fix
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
              <p className="font-semibold text-slate-700">
                Item {itemIndex + 1} / {STAGE_ITEMS.length}
              </p>
              <p className="font-semibold text-slate-700">Hints used: {hintsUsed}</p>
            </div>

            <div className="mb-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
              <p className="text-sm font-semibold text-indigo-800">Match the natural pair</p>
              <p className="mt-2 text-2xl font-black tracking-wide text-indigo-900">{item.lead} + ___</p>
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
                    {item.lead} {option}
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
            <h2 className="text-xl font-black text-indigo-900">Stage 3A Summary</h2>
            <div className="mt-3 grid gap-2 text-sm text-indigo-900 sm:grid-cols-2">
              <p><span className="font-bold">Accuracy:</span> {accuracyPct}%</p>
              <p><span className="font-bold">Hints used:</span> {hintsUsed}</p>
              <p><span className="font-bold">Completed items:</span> {completedItemIds.length}/{STAGE_ITEMS.length}</p>
              <p><span className="font-bold">Retry count:</span> {retryCount}</p>
            </div>
            <p className="mt-3 text-sm text-indigo-900">
              {mastered ? 'Mastery reached for Stage 3A.' : 'Stage done. Replay to hit mastery target (80%+, max 2 hints).'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {stage3BUnlocked && (
                <button
                  type="button"
                  onClick={() => navigate('/kids/games/grammar/collocation-builder/choose-natural-pair')}
                  className="rounded-xl border border-indigo-600 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Continue to 3B
                </button>
              )}
              <button
                type="button"
                onClick={resetStage}
                className="rounded-xl border border-indigo-300 bg-white px-4 py-2 text-sm font-semibold text-indigo-900 hover:bg-indigo-100"
              >
                Replay Stage 3A
              </button>
              <button
                type="button"
                onClick={() => navigate(buildMissionReturnHref(false))}
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
