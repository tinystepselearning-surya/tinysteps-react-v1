import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  applyStage1DResult,
  BBS_STAGE_1A,
  BBS_STAGE_1B,
  BBS_STAGE_1C,
  BBS_STAGE_1D,
  canAccessStage1D,
  loadBbsProgress,
} from './buildBetterSentencesProgress';

type ExpandSentenceItem = {
  itemId: string;
  prompt: string;
  baseSentence: string;
  options: [string, string];
  answerIndex: 0 | 1;
  grammarFocus: string;
  skillFocus: string;
};

const STAGE_ITEMS: ExpandSentenceItem[] = [
  {
    itemId: 'bbs-1d-001',
    prompt: 'Choose the better sentence.',
    baseSentence: 'The boy ran.',
    options: ['The boy ran.', 'The boy ran to school quickly.'],
    answerIndex: 1,
    grammarFocus: 'Sentence expansion (time/place/detail)',
    skillFocus: 'sentence-expansion',
  },
  {
    itemId: 'bbs-1d-002',
    prompt: 'Choose the better sentence.',
    baseSentence: 'The bird sang.',
    options: ['The little bird sang sweetly in the morning.', 'The bird sang.'],
    answerIndex: 0,
    grammarFocus: 'Adjective and adverb detail',
    skillFocus: 'descriptive-detail',
  },
  {
    itemId: 'bbs-1d-003',
    prompt: 'Choose the better sentence.',
    baseSentence: 'We played.',
    options: ['We played in the park after school.', 'We played.'],
    answerIndex: 0,
    grammarFocus: 'Prepositional phrase (place/time)',
    skillFocus: 'place-and-time-detail',
  },
  {
    itemId: 'bbs-1d-004',
    prompt: 'Choose the better sentence.',
    baseSentence: 'She read a book.',
    options: ['She read.', 'She read a storybook quietly before bedtime.'],
    answerIndex: 1,
    grammarFocus: 'Sentence completeness and clarity',
    skillFocus: 'clarity-and-detail',
  },
  {
    itemId: 'bbs-1d-005',
    prompt: 'Choose the better sentence.',
    baseSentence: 'The dog barked.',
    options: ['The dog barked loudly at the gate.', 'Dog barked.'],
    answerIndex: 0,
    grammarFocus: 'Noun phrase and adverb detail',
    skillFocus: 'sentence-completeness',
  },
  {
    itemId: 'bbs-1d-006',
    prompt: 'Choose the better sentence.',
    baseSentence: 'They ate lunch.',
    options: ['They ate lunch in the classroom.', 'They lunch.'],
    answerIndex: 0,
    grammarFocus: 'Verb form and sentence completeness',
    skillFocus: 'sentence-improvement',
  },
];

const isMissionReturnPath = (path: string) => path.startsWith('/kids/games/english-excellence');

export default function BuildBetterSentencesExpandSentence() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const kidId = searchParams.get('kidId') || '';

  const [itemIndex, setItemIndex] = useState(0);
  const [hintStep, setHintStep] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [feedback, setFeedback] = useState('Choose the better expanded sentence.');
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
  const stage1DUnlocked = progress[BBS_STAGE_1D].unlocked || canAccessStage1D(kidId);

  useEffect(() => {
    if (stage1DUnlocked) return;
    setLockedReason('Stage 1D is locked. Master Stage 1C (80%+ accuracy and max 2 hints) to unlock.');
  }, [stage1DUnlocked]);

  useEffect(() => {
    if (!stageDone || stageResultRecorded) return;
    const next = applyStage1DResult(kidId, {
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
      setFeedback('Stage complete. Great sentence expansion.');
      return;
    }
    setItemIndex(next);
    setHintStep(0);
    setLastChoiceIndex(null);
    setFeedback('Great. Next sentence pair.');
  };

  const onHint = () => {
    if (stageDone || !stage1DUnlocked) return;
    if (hintStep === 0) {
      setHintStep(1);
      setHintsUsed((n) => n + 1);
      setFeedback('Hint: Look for the sentence that gives more useful detail.');
      return;
    }
    if (hintStep === 1) {
      setHintStep(2);
      setHintsUsed((n) => n + 1);
      setFeedback('Hint: Choose the sentence that tells more clearly who, what, where, or how.');
      return;
    }
    setFeedback('Read both options and choose the one with clearer detail.');
  };

  const onOptionTap = (optionIndex: 0 | 1) => {
    if (stageDone || !stage1DUnlocked) return;
    setLastChoiceIndex(optionIndex);
    setSubmissions((n) => n + 1);

    if (optionIndex !== item.answerIndex) {
      setRetryCount((n) => n + 1);
      setFeedback('Nice try. Check which sentence adds useful detail.');
      return;
    }

    setCorrectSubmissions((n) => n + 1);
    setCompletedItemIds((prev) => (prev.includes(item.itemId) ? prev : [...prev, item.itemId]));
    setFeedback('Correct. That sentence is clearer and fuller.');
    window.setTimeout(advanceToNext, 450);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-indigo-50 px-4 py-6 text-slate-900">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Grammar Practice</p>
            <h1 className="text-xl font-black md:text-2xl">Build Better Sentences • Stage 1D</h1>
            <p className="text-sm text-slate-600">Expand Sentence</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/kids/games/grammar/build-better-sentences/choose-better-sentence')}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Stage 1C
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
              {progress[BBS_STAGE_1C].mastered ? 'Mastered' : progress[BBS_STAGE_1C].unlocked ? 'Ready' : 'Locked'}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <p className="font-bold text-slate-700">1D Expand Sentence</p>
            <p className="text-slate-600">
              {progress[BBS_STAGE_1D].mastered ? 'Mastered' : stage1DUnlocked ? 'Ready' : 'Locked'}
            </p>
          </div>
        </div>

        {!stage1DUnlocked ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <h2 className="text-lg font-black text-amber-900">Stage 1D Locked</h2>
            <p className="mt-2 text-sm text-amber-900">{lockedReason}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigate('/kids/games/grammar/build-better-sentences/choose-better-sentence')}
                className="rounded-xl border border-indigo-600 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Play Stage 1C
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
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Base sentence</p>
              <p className="text-lg font-bold text-slate-900">{item.baseSentence}</p>
            </div>

            <div className="mb-4 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3">
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
                    <span className="block">{option}</span>
                    <span className="mt-1 block text-xs font-semibold text-slate-500">
                      Grammar focus: {item.grammarFocus}
                    </span>
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
              {mastered ? 'Mastery reached for Stage 1D. Build Better Sentences is complete.' : 'Stage done. Retry once more to hit mastery target (80%+, max 2 hints).'}
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
                onClick={() => navigate('/kids/games/grammar/build-better-sentences/choose-better-sentence')}
                className="rounded-xl border border-indigo-600 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Play Stage 1C
              </button>
              <button
                type="button"
                onClick={() => {
                  setItemIndex(0);
                  setHintStep(0);
                  setHintsUsed(0);
                  setFeedback('Choose the better expanded sentence.');
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
