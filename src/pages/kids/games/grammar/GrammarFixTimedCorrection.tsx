import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BBS_STAGE_1D, loadBbsProgress } from './buildBetterSentencesProgress';
import {
  applyGrammarFixStage2DResult,
  canAccessGrammarFixStage2D,
  GF_STAGE_2A,
  GF_STAGE_2B,
  GF_STAGE_2C,
  GF_STAGE_2D,
  loadGrammarFixProgress,
} from './grammarFixProgress';

type SpotItem = {
  itemId: string;
  interactionType: 'spot';
  sentenceTokens: string[];
  answerIndex: number;
  hint2: string;
};

type FixItem = {
  itemId: string;
  interactionType: 'fix';
  sentenceTokens: string[];
  wrongIndex: number;
  options: [string, string, string];
  answerIndex: 0 | 1 | 2;
  hint2: string;
};

type ChooseItem = {
  itemId: string;
  interactionType: 'choose';
  incorrectSentence: string;
  options: [string, string, string];
  answerIndex: 0 | 1 | 2;
  hint2: string;
};

type TimedItem = SpotItem | FixItem | ChooseItem;

const ROUND_SECONDS = 60;

const STAGE_ITEMS: TimedItem[] = [
  {
    itemId: 'gpf-2d-001',
    interactionType: 'spot',
    sentenceTokens: ['She', 'go', 'to', 'school', 'every', 'day.'],
    answerIndex: 1,
    hint2: 'Look near the action word after "She".',
  },
  {
    itemId: 'gpf-2d-002',
    interactionType: 'fix',
    sentenceTokens: ['I', 'saw', 'a', 'elephant', 'at', 'the', 'zoo.'],
    wrongIndex: 2,
    options: ['a', 'an', 'the'],
    answerIndex: 1,
    hint2: 'Check the article before "elephant".',
  },
  {
    itemId: 'gpf-2d-003',
    interactionType: 'choose',
    incorrectSentence: 'Riya and Sam are friends. She play together.',
    options: [
      'Riya and Sam are friends. She play together.',
      'Riya and Sam are friends. They play together.',
      'Riya and Sam are friends. He plays together.',
    ],
    answerIndex: 1,
    hint2: 'The subject is two people.',
  },
  {
    itemId: 'gpf-2d-004',
    interactionType: 'spot',
    sentenceTokens: ['The', 'book', 'is', 'in', 'the', 'table.'],
    answerIndex: 3,
    hint2: 'Check the place word before "the table".',
  },
  {
    itemId: 'gpf-2d-005',
    interactionType: 'fix',
    sentenceTokens: ['We', 'are', 'drink', 'milk', 'now.'],
    wrongIndex: 2,
    options: ['drink', 'drinks', 'drinking'],
    answerIndex: 2,
    hint2: 'Look at the word after "are".',
  },
  {
    itemId: 'gpf-2d-006',
    interactionType: 'choose',
    incorrectSentence: 'We played in the.',
    options: ['We played in the.', 'We played in the park.', 'We played are in the.'],
    answerIndex: 1,
    hint2: 'Choose the sentence that feels complete.',
  },
];

const isMissionReturnPath = (path: string) => path.startsWith('/kids/games/english-excellence');

export default function GrammarFixTimedCorrection() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const kidId = searchParams.get('kidId') || '';
  const bbsProgress = loadBbsProgress(kidId);
  const grammarFixReady = bbsProgress.gameCompleted && bbsProgress[BBS_STAGE_1D]?.mastered;

  const [itemIndex, setItemIndex] = useState(0);
  const [selectedTokenIndex, setSelectedTokenIndex] = useState<number | null>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [hintStep, setHintStep] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [feedback, setFeedback] = useState('Timed round started. Stay calm and choose carefully.');
  const [submissions, setSubmissions] = useState(0);
  const [correctSubmissions, setCorrectSubmissions] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [completedItemIds, setCompletedItemIds] = useState<string[]>([]);
  const [stageDone, setStageDone] = useState(false);
  const [stageResultRecorded, setStageResultRecorded] = useState(false);
  const [lockedReason, setLockedReason] = useState('');
  const [gfProgress, setGfProgress] = useState(() => loadGrammarFixProgress(kidId));
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);

  const item = STAGE_ITEMS[itemIndex];
  const accuracyPct = submissions > 0 ? Math.round((correctSubmissions / submissions) * 100) : 0;
  const mastered = stageDone && accuracyPct >= 80 && hintsUsed <= 2;
  const missionTileId = searchParams.get('eemTile') || 'eem-g14-grammar-fix';
  const stage2DUnlocked = gfProgress[GF_STAGE_2D].unlocked || canAccessGrammarFixStage2D(kidId);
  const timeUsed = ROUND_SECONDS - secondsLeft;
  const timerLabel = useMemo(() => `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`, [secondsLeft]);

  useEffect(() => {
    if (grammarFixReady && stage2DUnlocked) return;
    setLockedReason('Stage 2D unlocks after mastering Stage 2C (80%+ accuracy and max 2 hints).');
  }, [grammarFixReady, stage2DUnlocked]);

  useEffect(() => {
    if (!grammarFixReady || !stage2DUnlocked || stageDone) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          setStageDone(true);
          setFeedback('Time complete. Nice effort in timed correction.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [grammarFixReady, stage2DUnlocked, stageDone]);

  useEffect(() => {
    if (!stageDone || stageResultRecorded) return;
    const next = applyGrammarFixStage2DResult(kidId, {
      accuracyPct,
      hintCount: hintsUsed,
      retryCount,
    });
    setGfProgress(next);
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
      setFeedback('Round complete. Great timed focus.');
      return;
    }
    setItemIndex(next);
    setSelectedTokenIndex(null);
    setSelectedOptionIndex(null);
    setHintStep(0);
    setFeedback('Next item. Keep going.');
  };

  const onHint = () => {
    if (stageDone || !grammarFixReady || !stage2DUnlocked) return;
    if (hintStep === 0) {
      setHintStep(1);
      setHintsUsed((n) => n + 1);
      setFeedback('Hint: Choose the answer that makes the sentence correct.');
      return;
    }
    if (hintStep === 1) {
      setHintStep(2);
      setHintsUsed((n) => n + 1);
      setFeedback(`Hint: ${item.hint2}`);
      return;
    }
    setFeedback('Read slowly once, then choose quickly.');
  };

  const onCorrect = () => {
    setCorrectSubmissions((n) => n + 1);
    setCompletedItemIds((prev) => (prev.includes(item.itemId) ? prev : [...prev, item.itemId]));
    setFeedback('Correct.');
    window.setTimeout(advanceToNext, 350);
  };

  const onWrong = () => {
    setRetryCount((n) => n + 1);
    setFeedback('Try once more.');
  };

  const onSpotTap = (index: number) => {
    if (stageDone || !grammarFixReady || !stage2DUnlocked || item.interactionType !== 'spot') return;
    setSelectedTokenIndex(index);
    setSubmissions((n) => n + 1);
    if (index === item.answerIndex) onCorrect();
    else onWrong();
  };

  const onOptionTap = (index: 0 | 1 | 2) => {
    if (stageDone || !grammarFixReady || !stage2DUnlocked || item.interactionType === 'spot') return;
    setSelectedOptionIndex(index);
    setSubmissions((n) => n + 1);
    if (index === item.answerIndex) onCorrect();
    else onWrong();
  };

  const resetStage = () => {
    setItemIndex(0);
    setSelectedTokenIndex(null);
    setSelectedOptionIndex(null);
    setHintStep(0);
    setHintsUsed(0);
    setFeedback('Timed round started. Stay calm and choose carefully.');
    setSubmissions(0);
    setCorrectSubmissions(0);
    setRetryCount(0);
    setCompletedItemIds([]);
    setStageDone(false);
    setStageResultRecorded(false);
    setSecondsLeft(ROUND_SECONDS);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-indigo-50 px-4 py-6 text-slate-900">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Grammar Practice</p>
            <h1 className="text-xl font-black md:text-2xl">Grammar Fix • Stage 2D</h1>
            <p className="text-sm text-slate-600">Timed Correction</p>
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
            <p className="font-bold text-slate-700">2A Spot One Error</p>
            <p className="text-slate-600">{gfProgress[GF_STAGE_2A].mastered ? 'Mastered' : 'Ready'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <p className="font-bold text-slate-700">2B Fix One Error</p>
            <p className="text-slate-600">{gfProgress[GF_STAGE_2B].mastered ? 'Mastered' : 'Ready'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <p className="font-bold text-slate-700">2C Fix Full Sentence</p>
            <p className="text-slate-600">{gfProgress[GF_STAGE_2C].mastered ? 'Mastered' : 'Ready'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <p className="font-bold text-slate-700">2D Timed Correction</p>
            <p className="text-slate-600">{gfProgress[GF_STAGE_2D].mastered ? 'Mastered' : stage2DUnlocked ? 'Ready' : 'Locked'}</p>
          </div>
        </div>

        {!grammarFixReady || !stage2DUnlocked ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <h2 className="text-lg font-black text-amber-900">Stage 2D Locked</h2>
            <p className="mt-2 text-sm text-amber-900">{lockedReason}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigate('/kids/games/grammar/grammar-fix/fix-full-sentence')}
                className="rounded-xl border border-indigo-600 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Play Stage 2C
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
              <span className="rounded-full border border-sky-300 bg-sky-50 px-3 py-1 font-bold text-sky-800">Time: {timerLabel}</span>
            </div>

            {item.interactionType === 'spot' ? (
              <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Spot One Error</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.sentenceTokens.map((token, idx) => (
                    <button
                      key={`${item.itemId}-${idx}`}
                      type="button"
                      onClick={() => onSpotTap(idx)}
                      className={`rounded-xl border px-4 py-3 text-base font-bold transition ${
                        selectedTokenIndex === idx
                          ? 'border-indigo-400 bg-indigo-50 text-indigo-900'
                          : 'border-slate-300 bg-white text-slate-900 hover:border-indigo-300 hover:bg-indigo-50'
                      }`}
                    >
                      {token}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {item.interactionType === 'fix' ? (
              <>
                <div className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fix One Error</p>
                  <p className="mt-2 text-lg font-bold text-slate-900">
                    {item.sentenceTokens.map((token, idx) => (
                      <span key={`${item.itemId}-sentence-${idx}`} className={idx === item.wrongIndex ? 'rounded-md bg-rose-100 px-1 text-rose-700' : ''}>
                        {token}
                        {idx < item.sentenceTokens.length - 1 ? ' ' : ''}
                      </span>
                    ))}
                  </p>
                </div>
                <div className="mb-5 grid gap-3">
                  {item.options.map((option, idx) => (
                    <button
                      key={`${item.itemId}-opt-${idx}`}
                      type="button"
                      onClick={() => onOptionTap(idx as 0 | 1 | 2)}
                      className={`rounded-2xl border px-4 py-4 text-left text-base font-bold transition ${
                        selectedOptionIndex === idx
                          ? 'border-indigo-400 bg-indigo-50 text-indigo-900'
                          : 'border-slate-300 bg-white text-slate-900 hover:border-indigo-300 hover:bg-indigo-50'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            {item.interactionType === 'choose' ? (
              <>
                <div className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fix Full Sentence</p>
                  <p className="mt-2 text-lg font-bold text-rose-700">{item.incorrectSentence}</p>
                </div>
                <div className="mb-5 grid gap-3">
                  {item.options.map((option, idx) => (
                    <button
                      key={`${item.itemId}-choice-${idx}`}
                      type="button"
                      onClick={() => onOptionTap(idx as 0 | 1 | 2)}
                      className={`rounded-2xl border px-4 py-4 text-left text-base font-bold transition ${
                        selectedOptionIndex === idx
                          ? 'border-indigo-400 bg-indigo-50 text-indigo-900'
                          : 'border-slate-300 bg-white text-slate-900 hover:border-indigo-300 hover:bg-indigo-50'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </>
            ) : null}

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
                onClick={resetStage}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Restart Round
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
            <p className="mt-1 text-sm text-emerald-800">Time used: <strong>{timeUsed}s</strong></p>
            <p className="mt-2 text-sm font-semibold text-emerald-900">
              {mastered ? 'Mastery reached for Stage 2D. Grammar Fix is complete.' : 'Timed round done. Replay once to hit mastery (80%+, max 2 hints).'}
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
                onClick={resetStage}
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
