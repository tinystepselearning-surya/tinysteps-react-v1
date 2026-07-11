import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  PUBLIC_VOCABULARY_LEVELS,
  PUBLIC_VOCABULARY_WORDS,
  PUBLIC_VOCABULARY_WORDS_BY_ID,
  normalizeVocabularyAnswer,
  type PublicVocabularyChallenge,
} from "../../../../lib/publicVocabularyContent";

type Screen = "intro" | "play" | "complete";

type RuntimeChallenge = {
  runtimeId: string;
  challenge: PublicVocabularyChallenge;
  review: boolean;
};

type PersistedState = {
  levelIndex: number;
  completedLevelIndices: number[];
};

const STORAGE_KEY = "ts_word_meaning_flashcards_v2";

function createRuntimeQueue(levelIndex: number): RuntimeChallenge[] {
  const level = PUBLIC_VOCABULARY_LEVELS[levelIndex];
  return level.challenges.map((challenge) => ({
    runtimeId: `${level.id}-${challenge.id}`,
    challenge,
    review: false,
  }));
}

function getHubPath(pathname: string) {
  return pathname.startsWith("/kids/") ? "/kids/games/english-excellence" : "/free-games-for-kids";
}

function getWord(wordId: string) {
  return PUBLIC_VOCABULARY_WORDS_BY_ID[wordId];
}

function readPersisted(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { levelIndex: 0, completedLevelIndices: [] };
    const parsed = JSON.parse(raw);
    return {
      levelIndex: typeof parsed.levelIndex === "number" ? parsed.levelIndex : 0,
      completedLevelIndices: Array.isArray(parsed.completedLevelIndices) ? parsed.completedLevelIndices : [],
    };
  } catch {
    return { levelIndex: 0, completedLevelIndices: [] };
  }
}

function writePersisted(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage may fail in private mode or restricted environments.
  }
}

export default function WordMeaningFlashcards() {
  const location = useLocation();
  const hubPath = getHubPath(location.pathname);
  const isAuthenticatedRoute = location.pathname.startsWith("/kids/");

  const [screen, setScreen] = useState<Screen>("intro");
  const [levelIndex, setLevelIndex] = useState(0);
  const [completedLevelIndices, setCompletedLevelIndices] = useState<number[]>([]);
  const [queue, setQueue] = useState<RuntimeChallenge[]>([]);
  const [cursor, setCursor] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [feedback, setFeedback] = useState<"idle" | "correct" | "wrong">("idle");
  const [reviewMessage, setReviewMessage] = useState("");
  const [wrongAttemptsByRuntimeId, setWrongAttemptsByRuntimeId] = useState<Record<string, number>>({});
  const [reviewScheduledBySourceId, setReviewScheduledBySourceId] = useState<Record<string, boolean>>({});
  const [completedBaseCount, setCompletedBaseCount] = useState(0);
  const [firstTryCorrectCount, setFirstTryCorrectCount] = useState(0);

  // Restore persisted state on mount (authenticated routes only)
  useEffect(() => {
    if (isAuthenticatedRoute) {
      const persisted = readPersisted();
      setLevelIndex(persisted.levelIndex);
      setCompletedLevelIndices(persisted.completedLevelIndices);
    }
  }, [isAuthenticatedRoute]);

  const totalBaseChallenges = PUBLIC_VOCABULARY_LEVELS[levelIndex]?.challenges.length ?? 1;
  const accuracy = Math.round((firstTryCorrectCount / Math.max(1, totalBaseChallenges)) * 100);

  const currentRuntime = queue[cursor] ?? null;
  const current = currentRuntime?.challenge ?? null;

  const completedTurns = useMemo(() => queue.filter((_, index) => index < cursor).length, [queue, cursor]);
  const progressPercent = queue.length > 0 ? ((completedTurns + (feedback === "correct" ? 1 : 0)) / queue.length) * 100 : 0;

  const resetRound = (nextLevelIndex: number) => {
    setLevelIndex(nextLevelIndex);
    setQueue(createRuntimeQueue(nextLevelIndex));
    setCursor(0);
    setSelectedOption(null);
    setTypedAnswer("");
    setFeedback("idle");
    setReviewMessage("");
    setWrongAttemptsByRuntimeId({});
    setReviewScheduledBySourceId({});
    setCompletedBaseCount(0);
    setFirstTryCorrectCount(0);
    setScreen("play");
    if (isAuthenticatedRoute) {
      writePersisted({ levelIndex: nextLevelIndex, completedLevelIndices });
    }
  };

  const goToNext = () => {
    setSelectedOption(null);
    setTypedAnswer("");
    setFeedback("idle");
    setReviewMessage("");

    const nextCursor = cursor + 1;
    if (nextCursor >= queue.length) {
      setScreen("complete");
      return;
    }
    setCursor(nextCursor);
  };

  const handleWrongAttempt = () => {
    if (!currentRuntime || !current) return;

    setFeedback("wrong");
    setWrongAttemptsByRuntimeId((prev) => ({
      ...prev,
      [currentRuntime.runtimeId]: (prev[currentRuntime.runtimeId] ?? 0) + 1,
    }));

    if (!currentRuntime.review && !reviewScheduledBySourceId[current.id]) {
      const reviewRuntime: RuntimeChallenge = {
        runtimeId: `${currentRuntime.runtimeId}-review`,
        challenge: current,
        review: true,
      };
      setQueue((prev) => [...prev, reviewRuntime]);
      setReviewScheduledBySourceId((prev) => ({ ...prev, [current.id]: true }));
      setReviewMessage("Review round added.");
    }
  };

  const handleCorrectAttempt = () => {
    if (!currentRuntime || !current) return;

    const wrongAttempts = wrongAttemptsByRuntimeId[currentRuntime.runtimeId] ?? 0;
    if (!currentRuntime.review) {
      setCompletedBaseCount((prev) => prev + 1);
      if (wrongAttempts === 0) {
        setFirstTryCorrectCount((prev) => prev + 1);
      }
    }

    setFeedback("correct");
    window.setTimeout(() => {
      goToNext();
    }, 450);
  };

  const checkChoice = (choice: string) => {
    if (!current) return;
    setSelectedOption(choice);

    if (current.mode === "synonym" || current.mode === "antonym") {
      if (normalizeVocabularyAnswer(choice) === normalizeVocabularyAnswer(current.correctChoice)) {
        handleCorrectAttempt();
      } else {
        handleWrongAttempt();
      }
      return;
    }

    if (current.mode === "match-it") {
      const correctMeaning = getWord(current.correctWordId)?.meaning ?? "";
      if (choice === correctMeaning) {
        handleCorrectAttempt();
      } else {
        handleWrongAttempt();
      }
      return;
    }

    if (current.mode === "find-word" || current.mode === "context-clues") {
      const correctWord = getWord(current.correctWordId)?.word ?? "";
      if (normalizeVocabularyAnswer(choice) === normalizeVocabularyAnswer(correctWord)) {
        handleCorrectAttempt();
      } else {
        handleWrongAttempt();
      }
    }
  };

  const checkTyped = () => {
    if (!current || current.mode !== "word-detective") return;
    const answers = [current.answerWord, ...(current.acceptableAnswers ?? [])].map((value) =>
      normalizeVocabularyAnswer(value),
    );
    if (answers.includes(normalizeVocabularyAnswer(typedAnswer))) {
      handleCorrectAttempt();
      return;
    }
    handleWrongAttempt();
  };

  const currentLevel = PUBLIC_VOCABULARY_LEVELS[levelIndex];

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-emerald-50 px-3 py-4 text-slate-900 sm:px-5 sm:py-6"
      data-testid="vocabulary-adventure"
    >
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="rounded-full border border-indigo-200 bg-white/80 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-indigo-700 sm:text-sm">
            {isAuthenticatedRoute ? "Your Progress Saved" : "Guest Mode"} • Vocabulary Adventure
          </div>
          <Link
            to={hubPath}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-700"
          >
            Back
          </Link>
        </div>

        {screen === "intro" && (
          <section className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur sm:p-7">
            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Vocabulary Adventure</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              Build meaning confidence through matching, context clues, synonyms, antonyms, and word recall.
              No audio, no login, no child profile.
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              {PUBLIC_VOCABULARY_WORDS.length} reusable words from Tiny Steps vocabulary sets
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PUBLIC_VOCABULARY_LEVELS.map((level, index) => {
                const isCompleted = completedLevelIndices.includes(index);
                return (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => resetRound(index)}
                    className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 text-left transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-200"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-700">Activity {index + 1}</p>
                        <h2 className="mt-1 text-xl font-black text-slate-950">{level.title}</h2>
                      </div>
                      {isCompleted && isAuthenticatedRoute ? (
                        <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-700">
                          ✓
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{level.instruction}</p>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {screen === "play" && current && (
          <main className="rounded-3xl border border-white/70 bg-white/90 p-4 shadow-sm backdrop-blur sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">
                  Activity {levelIndex + 1} of {PUBLIC_VOCABULARY_LEVELS.length}
                </p>
                <h2 className="text-3xl font-black text-slate-950">{currentLevel.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setScreen("intro")}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-700"
              >
                Change Activity
              </button>
            </div>

            <div className="mt-4 h-3 rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${Math.max(3, progressPercent)}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs font-bold text-slate-500">
              <span>
                Challenge {Math.min(cursor + 1, queue.length)} of {queue.length}
              </span>
              <span>First-try accuracy: {accuracy}%</span>
            </div>

            <section className="mt-4 rounded-3xl border border-indigo-200 bg-indigo-50/40 p-4 sm:p-6">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-indigo-700">{currentLevel.instruction}</p>
              <p className="mt-2 text-base font-semibold text-slate-700">{current.clue}</p>
              {currentRuntime?.review ? (
                <span className="mt-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-amber-800">
                  Review
                </span>
              ) : null}

              {(current.mode === "match-it" || current.mode === "find-word" || current.mode === "context-clues") && (
                <>
                  {current.mode === "match-it" ? (
                    <div className="mt-4 rounded-2xl bg-white p-4 text-center text-3xl font-black text-slate-950">
                      {getWord(current.wordId)?.word}
                    </div>
                  ) : null}
                  {current.mode === "find-word" ? (
                    <div className="mt-4 rounded-2xl bg-white p-4 text-center text-base font-semibold leading-7 text-slate-800">
                      {getWord(current.meaningWordId)?.meaning}
                    </div>
                  ) : null}
                  {current.mode === "context-clues" ? (
                    <div className="mt-4 rounded-2xl bg-white p-4 text-center text-base font-semibold leading-7 text-slate-800">
                      {current.sentence}
                    </div>
                  ) : null}

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {(current.mode === "match-it"
                      ? current.choiceWordIds.map((wordId) => getWord(wordId)?.meaning ?? "")
                      : current.choiceWordIds.map((wordId) => getWord(wordId)?.word ?? "")
                    ).map((choice) => (
                      <button
                        key={choice}
                        type="button"
                        onClick={() => checkChoice(choice)}
                        className="min-h-12 rounded-2xl border-2 border-sky-300 bg-white px-4 py-3 text-left text-sm font-bold text-slate-800 transition hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-sky-200"
                      >
                        {choice}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {(current.mode === "synonym" || current.mode === "antonym") && (
                <>
                  <div className="mt-4 rounded-2xl bg-white p-4 text-center">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Target Word</p>
                    <p className="mt-1 text-3xl font-black text-slate-950">{current.targetWord}</p>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {current.choices.map((choice) => (
                      <button
                        key={choice}
                        type="button"
                        onClick={() => checkChoice(choice)}
                        className="min-h-12 rounded-2xl border-2 border-sky-300 bg-white px-4 py-3 text-left text-sm font-bold text-slate-800 transition hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-sky-200"
                      >
                        {choice}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {current.mode === "word-detective" && (
                <form
                  className="mt-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    checkTyped();
                  }}
                >
                  <label htmlFor="word-detective-answer" className="text-sm font-black text-slate-700">
                    Type the mystery word
                  </label>
                  <input
                    id="word-detective-answer"
                    type="text"
                    value={typedAnswer}
                    onChange={(event) => setTypedAnswer(event.target.value)}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    className="mt-2 min-h-12 w-full rounded-2xl border-2 border-sky-300 bg-white px-4 py-3 text-lg font-black text-slate-900 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-200"
                  />
                  <button
                    type="submit"
                    className="mt-3 min-h-12 w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-slate-800"
                  >
                    Check Answer
                  </button>
                </form>
              )}

              <div className="mt-4 min-h-[34px] text-sm font-black">
                {feedback === "correct" ? <span className="text-emerald-700">Correct! Great job.</span> : null}
                {feedback === "wrong" ? <span className="text-rose-700">Not yet. Try again.</span> : null}
                {feedback === "idle" ? <span className="text-slate-500">Take your time and think carefully.</span> : null}
              </div>
              {reviewMessage ? <p className="text-xs font-semibold text-amber-700">{reviewMessage}</p> : null}
            </section>
          </main>
        )}

        {screen === "complete" && (
          <section className="rounded-3xl border border-white/70 bg-white/90 p-6 text-center shadow-sm backdrop-blur sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-600">Vocabulary Adventure Complete</p>
            <h2 className="mt-2 text-4xl font-black text-slate-950">Amazing effort!</h2>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">
              You finished {currentLevel.title}. First-try accuracy: {accuracy}% • Base challenges solved: {completedBaseCount}
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => {
                  if (isAuthenticatedRoute && !completedLevelIndices.includes(levelIndex)) {
                    const nextCompleted = [...completedLevelIndices, levelIndex];
                    setCompletedLevelIndices(nextCompleted);
                    writePersisted({ levelIndex, completedLevelIndices: nextCompleted });
                  }
                  resetRound(levelIndex);
                }}
                className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white hover:bg-slate-800"
              >
                Replay Activity
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isAuthenticatedRoute && !completedLevelIndices.includes(levelIndex)) {
                    const nextCompleted = [...completedLevelIndices, levelIndex];
                    setCompletedLevelIndices(nextCompleted);
                    writePersisted({ levelIndex, completedLevelIndices: nextCompleted });
                  }
                  setScreen("intro");
                }}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700"
              >
                Change Activity
              </button>
              <Link
                to={hubPath}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700"
              >
                Back
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
