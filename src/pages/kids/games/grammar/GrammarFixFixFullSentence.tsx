import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BBS_STAGE_1D, loadBbsProgress } from './buildBetterSentencesProgress';
import {
  applyGrammarFixStage2CResult,
  canAccessGrammarFixStage2C,
  GF_STAGE_2A,
  GF_STAGE_2B,
  GF_STAGE_2C,
  GF_STAGE_2D,
  canAccessGrammarFixStage2D,
  loadGrammarFixProgress,
} from './grammarFixProgress';

type FixFullSentenceItem = {
  itemId: string;
  incorrectSentence: string;
  options: [string, string, string];
  answerIndex: 0 | 1 | 2;
  skillFocus: string;
  hint2: string;
};

const STAGE_ITEMS: FixFullSentenceItem[] = [
  {
    itemId: 'gpf-2c-001',
    incorrectSentence: 'She go to school every day.',
    options: [
      'She go to school every day.',
      'She goes to school every day.',
      'She going to school every day.',
    ],
    answerIndex: 1,
    skillFocus: 'subject-verb-agreement',
    hint2: 'Check the action word after "She".',
  },
  {
    itemId: 'gpf-2c-002',
    incorrectSentence: 'I saw a elephant at the zoo.',
    options: [
      'I saw the elephant at zoo.',
      'I saw an elephant at the zoo.',
      'I saw a elephant at the zoo.',
    ],
    answerIndex: 1,
    skillFocus: 'article-use',
    hint2: 'Look at the article before "elephant".',
  },
  {
    itemId: 'gpf-2c-003',
    incorrectSentence: 'Riya and Sam are friends. She play together.',
    options: [
      'Riya and Sam are friends. They play together.',
      'Riya and Sam are friends. She play together.',
      'Riya and Sam are friends. He plays together.',
    ],
    answerIndex: 0,
    skillFocus: 'pronoun-choice',
    hint2: 'The subject refers to two children.',
  },
  {
    itemId: 'gpf-2c-004',
    incorrectSentence: 'The book is in the table.',
    options: [
      'The book is on the table.',
      'The book is in the table.',
      'The book is at the table on.',
    ],
    answerIndex: 0,
    skillFocus: 'preposition-choice',
    hint2: 'Focus on the place word before "the table".',
  },
  {
    itemId: 'gpf-2c-005',
    incorrectSentence: 'We are drink milk now.',
    options: [
      'We are drinking milk now.',
      'We are drink milk now.',
      'We drinking are milk now.',
    ],
    answerIndex: 0,
    skillFocus: 'verb-form',
    hint2: 'Look at the verb after "are".',
  },
  {
    itemId: 'gpf-2c-006',
    incorrectSentence: 'We played in the.',
    options: [
      'We played in the.',
      'We played in the park.',
      'We played are in the.',
    ],
    answerIndex: 1,
    skillFocus: 'sentence-completeness',
    hint2: 'Choose the option that completes the place phrase.',
  },
];

const isMissionReturnPath = (path: string) => path.startsWith('/kids/games/english-excellence');

export default function GrammarFixFixFullSentence() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const kidId = searchParams.get('kidId') || '';
  const bbsProgress = loadBbsProgress(kidId);
  const grammarFixReady = bbsProgress.gameCompleted && bbsProgress[BBS_STAGE_1D]?.mastered;

  const [itemIndex, setItemIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [hintStep, setHintStep] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [feedback, setFeedback] = useState('Pick the full sentence that is correct.');
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
  const stage2CUnlocked = gfProgress[GF_STAGE_2C].unlocked || canAccessGrammarFixStage2C(kidId);
  const stage2DUnlocked = gfProgress[GF_STAGE_2D].unlocked || canAccessGrammarFixStage2D(kidId);

  useEffect(() => {
    if (grammarFixReady && stage2CUnlocked) return;
    setLockedReason('Stage 2C unlocks after mastering Stage 2B (80%+ accuracy and max 2 hints).');
  }, [grammarFixReady, stage2CUnlocked]);

  useEffect(() => {
    if (!stageDone || stageResultRecorded) return;
    const next = applyGrammarFixStage2CResult(kidId, {
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
      setFeedback('Stage complete. Great full-sentence fixes.');
      return;
    }
    setItemIndex(next);
    setSelectedOptionIndex(null);
    setHintStep(0);
    setFeedback('Good. Fix the next sentence.');
  };

  const onHint = () => {
    if (stageDone || !grammarFixReady || !stage2CUnlocked) return;
    if (hintStep === 0) {
      setHintStep(1);
      setHintsUsed((n) => n + 1);
      setFeedback('Hint: Choose the sentence that sounds correct.');
      return;
    }
    if (hintStep === 1) {
      setHintStep(2);
      setHintsUsed((n) => n + 1);
      setFeedback(`Hint: ${item.hint2}`);
      return;
    }
    setFeedback('Read each option slowly and compare grammar.');
  };

  const onOptionTap = (optionIndex: 0 | 1 | 2) => {
    if (stageDone || !grammarFixReady || !stage2CUnlocked) return;
    setSelectedOptionIndex(optionIndex);
    setSubmissions((n) => n + 1);

    if (optionIndex !== item.answerIndex) {
      setRetryCount((n) => n + 1);
      setFeedback('Nice try. Pick the fully correct sentence.');
      return;
    }

    setCorrectSubmissions((n) => n + 1);
    setCompletedItemIds((prev) => (prev.includes(item.itemId) ? prev : [...prev, item.itemId]));
    setFeedback('Correct. That full sentence is right.');
    window.setTimeout(advanceToNext, 450);
  };

  const resetStage = () => {
    setItemIndex(0);
    setSelectedOptionIndex(null);
    setHintStep(0);
    setHintsUsed(0);
    setFeedback('Pick the full sentence that is correct.');
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
            <h1 className="text-xl font-black md:text-2xl">Grammar Fix • Stage 2C</h1>
            <p className="text-sm text-slate-600">Fix Full Sentence</p>
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
            <p className="text-slate-600">{gfProgress[GF_STAGE_2C].mastered ? 'Mastered' : stage2CUnlocked ? 'Ready' : 'Locked'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <p className="font-bold text-slate-700">2D Timed Correction</p>
            <p className="text-slate-600">{stage2DUnlocked ? 'Ready' : 'Locked'}</p>
          </div>
        </div>

        {!grammarFixReady || !stage2CUnlocked ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <h2 className="text-lg font-black text-amber-900">Stage 2C Locked</h2>
            <p className="mt-2 text-sm text-amber-900">{lockedReason}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigate('/kids/games/grammar/grammar-fix/fix-one-error')}
                className="rounded-xl border border-indigo-600 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Play Stage 2B
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
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Incorrect sentence</p>
              <p className="mt-2 text-lg font-bold text-rose-700">{item.incorrectSentence}</p>
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
              {mastered ? 'Mastery reached for Stage 2C. Stage 2D is unlocked.' : 'Stage done. Replay 2C to unlock Stage 2D (80%+, max 2 hints).'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {stage2DUnlocked ? (
                <button
                  type="button"
                  onClick={() => navigate('/kids/games/grammar/grammar-fix/timed-correction')}
                  className="rounded-xl border border-indigo-600 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Continue to 2D
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
                onClick={() => navigate('/kids/games/grammar/grammar-fix/fix-one-error')}
                className="rounded-xl border border-indigo-600 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Play Stage 2B
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
