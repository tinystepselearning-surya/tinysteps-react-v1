import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BBS_STAGE_1D, loadBbsProgress } from './buildBetterSentencesProgress';
import {
  applyGrammarFixStage2BResult,
  canAccessGrammarFixStage2B,
  GF_STAGE_2A,
  GF_STAGE_2B,
  GF_STAGE_2C,
  GF_STAGE_2D,
  canAccessGrammarFixStage2C,
  canAccessGrammarFixStage2D,
  loadGrammarFixProgress,
} from './grammarFixProgress';

type FixOneErrorItem = {
  itemId: string;
  sentenceTokens: string[];
  wrongIndex: number;
  options: [string, string, string];
  answerIndex: 0 | 1 | 2;
  skillFocus: string;
  hint2: string;
};

const STAGE_ITEMS: FixOneErrorItem[] = [
  {
    itemId: 'gpf-2b-001',
    sentenceTokens: ['She', 'go', 'to', 'school', 'every', 'day.'],
    wrongIndex: 1,
    options: ['go', 'goes', 'going'],
    answerIndex: 1,
    skillFocus: 'subject-verb-agreement',
    hint2: 'Look at the action word after "She".',
  },
  {
    itemId: 'gpf-2b-002',
    sentenceTokens: ['I', 'saw', 'a', 'elephant', 'at', 'the', 'zoo.'],
    wrongIndex: 2,
    options: ['a', 'an', 'the'],
    answerIndex: 1,
    skillFocus: 'article-use',
    hint2: 'Check the article before "elephant".',
  },
  {
    itemId: 'gpf-2b-003',
    sentenceTokens: ['Riya', 'and', 'Sam', 'are', 'friends.', 'She', 'play', 'together.'],
    wrongIndex: 5,
    options: ['She', 'They', 'He'],
    answerIndex: 1,
    skillFocus: 'pronoun-choice',
    hint2: 'The subject has two children.',
  },
  {
    itemId: 'gpf-2b-004',
    sentenceTokens: ['The', 'book', 'is', 'in', 'the', 'table.'],
    wrongIndex: 3,
    options: ['in', 'on', 'at'],
    answerIndex: 1,
    skillFocus: 'preposition-choice',
    hint2: 'Choose the place word that fits with "table".',
  },
  {
    itemId: 'gpf-2b-005',
    sentenceTokens: ['We', 'are', 'drink', 'milk', 'now.'],
    wrongIndex: 2,
    options: ['drink', 'drinks', 'drinking'],
    answerIndex: 2,
    skillFocus: 'verb-form',
    hint2: 'Look at the word right after "are".',
  },
  {
    itemId: 'gpf-2b-006',
    sentenceTokens: ['We', 'played', 'in', 'the.'],
    wrongIndex: 3,
    options: ['the', 'park', 'are'],
    answerIndex: 1,
    skillFocus: 'sentence-completeness',
    hint2: 'Choose the word that completes the place phrase.',
  },
];

const isMissionReturnPath = (path: string) => path.startsWith('/kids/games/english-excellence');

export default function GrammarFixFixOneError() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const kidId = searchParams.get('kidId') || '';
  const bbsProgress = loadBbsProgress(kidId);
  const grammarFixReady = bbsProgress.gameCompleted && bbsProgress[BBS_STAGE_1D]?.mastered;

  const [itemIndex, setItemIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [hintStep, setHintStep] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [feedback, setFeedback] = useState('Pick the best replacement word.');
  const [submissions, setSubmissions] = useState(0);
  const [correctSubmissions, setCorrectSubmissions] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [completedItemIds, setCompletedItemIds] = useState<string[]>([]);
  const [stageDone, setStageDone] = useState(false);
  const [stageResultRecorded, setStageResultRecorded] = useState(false);
  const [lockedReason, setLockedReason] = useState('');
  const [gfProgress, setGfProgress] = useState(() => loadGrammarFixProgress(kidId));

  const item = STAGE_ITEMS[itemIndex];
  const accuracyPct = submissions > 0 ? Math.round((correctSubmissions / submissions) * 100) : 0;
  const mastered = stageDone && accuracyPct >= 80 && hintsUsed <= 2;
  const missionTileId = searchParams.get('eemTile') || 'eem-g14-grammar-fix';
  const stage2BUnlocked = gfProgress[GF_STAGE_2B].unlocked || canAccessGrammarFixStage2B(kidId);
  const stage2CUnlocked = gfProgress[GF_STAGE_2C].unlocked || canAccessGrammarFixStage2C(kidId);
  const stage2DUnlocked = gfProgress[GF_STAGE_2D].unlocked || canAccessGrammarFixStage2D(kidId);

  useEffect(() => {
    if (grammarFixReady && stage2BUnlocked) return;
    setLockedReason('Stage 2B unlocks after mastering Stage 2A (80%+ accuracy and max 2 hints).');
  }, [grammarFixReady, stage2BUnlocked]);

  useEffect(() => {
    if (!stageDone || stageResultRecorded) return;
    const next = applyGrammarFixStage2BResult(kidId, {
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
      setFeedback('Stage complete. Nice correction work.');
      return;
    }
    setItemIndex(next);
    setSelectedOptionIndex(null);
    setHintStep(0);
    setFeedback('Good. Fix the next sentence.');
  };

  const onHint = () => {
    if (stageDone || !grammarFixReady || !stage2BUnlocked) return;
    if (hintStep === 0) {
      setHintStep(1);
      setHintsUsed((n) => n + 1);
      setFeedback('Hint: Choose the word that makes the sentence correct.');
      return;
    }
    if (hintStep === 1) {
      setHintStep(2);
      setHintsUsed((n) => n + 1);
      setFeedback(`Hint: ${item.hint2}`);
      return;
    }
    setFeedback('Read the sentence and replacement options slowly.');
  };

  const onOptionTap = (optionIndex: 0 | 1 | 2) => {
    if (stageDone || !grammarFixReady || !stage2BUnlocked) return;
    setSelectedOptionIndex(optionIndex);
    setSubmissions((n) => n + 1);

    if (optionIndex !== item.answerIndex) {
      setRetryCount((n) => n + 1);
      setFeedback('Nice try. Pick the replacement that fixes the sentence.');
      return;
    }

    setCorrectSubmissions((n) => n + 1);
    setCompletedItemIds((prev) => (prev.includes(item.itemId) ? prev : [...prev, item.itemId]));
    setFeedback('Correct. That replacement fixes the error.');
    window.setTimeout(advanceToNext, 450);
  };

  const resetStage = () => {
    setItemIndex(0);
    setSelectedOptionIndex(null);
    setHintStep(0);
    setHintsUsed(0);
    setFeedback('Pick the best replacement word.');
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
            <h1 className="text-xl font-black md:text-2xl">Grammar Fix • Stage 2B</h1>
            <p className="text-sm text-slate-600">Fix One Error</p>
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
            <p className="text-slate-600">{gfProgress[GF_STAGE_2B].mastered ? 'Mastered' : stage2BUnlocked ? 'Ready' : 'Locked'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <p className="font-bold text-slate-700">2C Fix Full Sentence</p>
            <p className="text-slate-600">{stage2CUnlocked ? 'Ready' : 'Locked'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <p className="font-bold text-slate-700">2D Timed Correction</p>
            <p className="text-slate-600">{stage2DUnlocked ? 'Ready' : 'Locked'}</p>
          </div>
        </div>

        {!grammarFixReady || !stage2BUnlocked ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <h2 className="text-lg font-black text-amber-900">Stage 2B Locked</h2>
            <p className="mt-2 text-sm text-amber-900">{lockedReason}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigate('/kids/games/grammar/grammar-fix/spot-one-error')}
                className="rounded-xl border border-indigo-600 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Play Stage 2A
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

            <div className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sentence</p>
              <p className="mt-2 text-lg font-bold text-slate-900">
                {item.sentenceTokens.map((token, idx) => (
                  <span
                    key={`${item.itemId}-sentence-${idx}`}
                    className={idx === item.wrongIndex ? 'rounded-md bg-rose-100 px-1 text-rose-700' : ''}
                  >
                    {token}
                    {idx < item.sentenceTokens.length - 1 ? ' ' : ''}
                  </span>
                ))}
              </p>
              <p className="mt-2 text-xs text-slate-600">Replace the highlighted part.</p>
            </div>

            <div className="mb-5 grid gap-3">
              {item.options.map((option, idx) => {
                const selected = selectedOptionIndex === idx;
                return (
                  <button
                    key={`${item.itemId}-option-${idx}`}
                    type="button"
                    onClick={() => onOptionTap(idx as 0 | 1 | 2)}
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
                onClick={resetStage}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Reset Stage
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
              {mastered ? 'Mastery reached for Stage 2B. Stage 2C is unlocked.' : 'Stage done. Replay 2B to unlock Stage 2C (80%+, max 2 hints).'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {stage2CUnlocked ? (
                <button
                  type="button"
                  onClick={() => navigate('/kids/games/grammar/grammar-fix/fix-full-sentence')}
                  className="rounded-xl border border-indigo-600 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Continue to 2C
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => navigate(buildMissionReturnHref(mastered))}
                className="rounded-xl border border-emerald-700 bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                Back to Mission
              </button>
              <button
                type="button"
                onClick={() => navigate('/kids/games/grammar/grammar-fix/spot-one-error')}
                className="rounded-xl border border-indigo-600 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Play Stage 2A
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
