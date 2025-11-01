import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { SPELLBEE_GRADE1 } from "../../data/spellbee-grade1";
import type { SpellbeeEntry } from "../../data/spellbee-grade1";

type Phase = "hub" | "learn" | "practice" | "assessment" | "summary";

type AssessmentQuestion = {
  id: string;
  promptType: "meaning" | "word" | "ipa";
  prompt: string;
  helper: string;
  choices: string[];
  correctAnswer: string;
  word: SpellbeeEntry;
  round: 1 | 2;
};

type RawAssessmentQuestion = Omit<AssessmentQuestion, "round">;

type AssessmentResult = {
  questionId: string;
  wordId: string;
  selected: string;
  isCorrect: boolean;
};

const SESSION_WORDS = 12;
const SESSION_GROUPS = 3;
const QUIZ_ROUNDS = 2;
const QUESTIONS_PER_ROUND = 4;
const QUIZ_QUESTIONS = QUIZ_ROUNDS * QUESTIONS_PER_ROUND;
const STORAGE_VERSION = 3;
const SPEECH_WORD_RATE = 0.85;
const SPEECH_MEANING_RATE = 0.81;
const SPEECH_WORD_PITCH = 1.05;
const SPEECH_MEANING_PITCH = 1;

type PersistedQuestion = {
  id: string;
  promptType: AssessmentQuestion["promptType"];
  prompt: string;
  helper: string;
  choices: string[];
  correctAnswer: string;
  wordId: string;
  round: AssessmentQuestion["round"];
};

type PersistedState = {
  version: number;
  timestamp: number;
  wordIds: string[];
  phase: Phase;
  learnIndex: number;
  learnedIds: string[];
  practiceQueueIds: string[];
  practiceReveal: boolean;
  practiceAttempts: number;
  masteredIds: string[];
  needsReviewIds: string[];
  assessmentIndex: number;
  assessmentResults: AssessmentResult[];
  assessmentQuestions: PersistedQuestion[];
};

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function uniquePush(list: string[], id: string) {
  return list.includes(id) ? list : [...list, id];
}

function removeId(list: string[], id: string) {
  return list.filter((item) => item !== id);
}

function sampleEntries(source: SpellbeeEntry[], count: number, excludeIds: Set<string>) {
  return shuffle(source.filter((entry) => !excludeIds.has(entry.id))).slice(0, count);
}

function createSessionWords(): SpellbeeEntry[] {
  const grouped = SPELLBEE_GRADE1.reduce<Map<string, SpellbeeEntry[]>>((acc, entry) => {
    const letter = entry.word.charAt(0).toUpperCase();
    if (!acc.has(letter)) {
      acc.set(letter, []);
    }
    acc.get(letter)!.push(entry);
    return acc;
  }, new Map());

  const availableLetters = Array.from(grouped.keys()).sort();
  if (!availableLetters.length) {
    return shuffle(SPELLBEE_GRADE1).slice(0, SESSION_WORDS);
  }

  const groupCount = Math.min(SESSION_GROUPS, availableLetters.length);
  const startIndex = Math.floor(Math.random() * availableLetters.length);
  const selectedLetters: string[] = [];
  for (let offset = 0; offset < groupCount; offset += 1) {
    const letter = availableLetters[(startIndex + offset) % availableLetters.length];
    selectedLetters.push(letter);
  }

  const basePerGroup = Math.floor(SESSION_WORDS / groupCount);
  let remainder = SESSION_WORDS % groupCount;
  const chosen: SpellbeeEntry[] = [];
  const usedIds = new Set<string>();

  selectedLetters.forEach((letter) => {
    const bucket = grouped.get(letter);
    if (!bucket || !bucket.length) {
      return;
    }
    const takeCount = basePerGroup + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;
    const picks = shuffle(bucket).filter((entry) => !usedIds.has(entry.id)).slice(0, takeCount);
    picks.forEach((entry) => usedIds.add(entry.id));
    chosen.push(...picks);
  });

  if (chosen.length < SESSION_WORDS) {
    const filler = SPELLBEE_GRADE1.filter((entry) => !usedIds.has(entry.id));
    chosen.push(...filler.slice(0, SESSION_WORDS - chosen.length));
  }

  return chosen.slice(0, SESSION_WORDS);
}

function tryBuildMeaningQuestion(word: SpellbeeEntry): RawAssessmentQuestion | null {
  const exclude = new Set<string>([word.id]);
  const distractors = sampleEntries(SPELLBEE_GRADE1, 3, exclude)
    .map((entry) => entry.meaning)
    .filter((meaning) => meaning && meaning !== word.meaning);
  if (distractors.length < 3 || !word.meaning) return null;
  const choices = shuffle([word.meaning, ...distractors]);
  return {
    id: `${word.id}-meaning`,
    promptType: "meaning",
    prompt: word.word,
    helper: "Choose the meaning of the word.",
    choices,
    correctAnswer: word.meaning,
    word,
  };
}

function tryBuildIPAQuestion(word: SpellbeeEntry): RawAssessmentQuestion | null {
  if (!word.ipa) return null;
  const exclude = new Set<string>([word.id]);
  const distractors = sampleEntries(SPELLBEE_GRADE1, 3, exclude)
    .map((entry) => entry.ipa)
    .filter((ipa) => ipa && ipa !== word.ipa);
  if (distractors.length < 3) return null;
  const choices = shuffle([word.ipa, ...distractors]);
  return {
    id: `${word.id}-ipa`,
    promptType: "ipa",
    prompt: word.word,
    helper: "Pick the matching pronunciation (IPA).",
    choices,
    correctAnswer: word.ipa,
    word,
  };
}

function buildAssessmentQuestions(words: SpellbeeEntry[], emphasiseIds: string[]): AssessmentQuestion[] {
  if (!words.length) return [];
  const emphasised = emphasiseIds
    .map((id) => words.find((entry) => entry.id === id))
    .filter(Boolean) as SpellbeeEntry[];

  const remainder = shuffle(words.filter((entry) => !emphasiseIds.includes(entry.id)));
  const ordered: SpellbeeEntry[] = [];
  const seen = new Set<string>();

  [...emphasised, ...remainder].forEach((entry) => {
    if (!entry || seen.has(entry.id)) return;
    seen.add(entry.id);
    ordered.push(entry);
  });

  while (ordered.length < QUESTIONS_PER_ROUND) {
    const need = QUESTIONS_PER_ROUND - ordered.length;
    const extras = sampleEntries(SPELLBEE_GRADE1, need, seen);
    if (!extras.length) break;
    extras.forEach((entry) => {
      seen.add(entry.id);
      ordered.push(entry);
    });
  }

  if (!ordered.length) {
    const extras = sampleEntries(SPELLBEE_GRADE1, QUESTIONS_PER_ROUND, new Set());
    ordered.push(...extras);
  }

  const preferredWords = ordered.slice(0, Math.min(QUESTIONS_PER_ROUND, ordered.length));
  const fallbackPool = SPELLBEE_GRADE1.filter((entry) => !seen.has(entry.id));

  const collectRoundQuestions = (
    candidates: SpellbeeEntry[],
    builder: (word: SpellbeeEntry) => RawAssessmentQuestion | null,
    round: 1 | 2,
    targetCount: number,
  ) => {
    const questions: AssessmentQuestion[] = [];
    const wordsUsed: SpellbeeEntry[] = [];
    const tried = new Set<string>();
    const pool = [...candidates, ...shuffle(fallbackPool)];

    for (const word of pool) {
      if (questions.length >= targetCount) break;
      if (!word || tried.has(word.id)) continue;
      tried.add(word.id);
      const built = builder(word);
      if (!built) continue;
      questions.push({
        ...built,
        round,
        helper:
          round === 1
            ? "Round 1 · Match the phonetic (IPA) sound."
            : "Round 2 · Choose the correct meaning.",
      });
      wordsUsed.push(word);
    }

    return { questions, wordsUsed };
  };

  const ipaTarget = Math.max(1, Math.min(QUESTIONS_PER_ROUND, preferredWords.length || QUESTIONS_PER_ROUND));
  const { questions: ipaQuestions, wordsUsed: ipaWords } = collectRoundQuestions(
    preferredWords,
    tryBuildIPAQuestion,
    1,
    ipaTarget,
  );

  const meaningTarget = Math.max(1, ipaQuestions.length || Math.min(QUESTIONS_PER_ROUND, preferredWords.length));
  const meaningCandidates = ipaWords.length ? ipaWords : preferredWords;
  const { questions: meaningQuestions } = collectRoundQuestions(meaningCandidates, tryBuildMeaningQuestion, 2, meaningTarget);

  if (meaningQuestions.length < meaningTarget) {
    const additionalPool = [...preferredWords, ...shuffle(fallbackPool)].filter(
      (entry) => !meaningCandidates.some((used) => used.id === entry.id),
    );
    const extraResult = collectRoundQuestions(
      additionalPool,
      tryBuildMeaningQuestion,
      2,
      meaningTarget - meaningQuestions.length,
    );
    meaningQuestions.push(...extraResult.questions);
  }

  const allQuestions = [...ipaQuestions, ...meaningQuestions].slice(0, QUIZ_QUESTIONS);

  if (!allQuestions.length && SPELLBEE_GRADE1.length) {
    const fallbackWord = SPELLBEE_GRADE1[0];
    const fallback = tryBuildMeaningQuestion(fallbackWord);
    if (fallback) {
      allQuestions.push({
        ...fallback,
        round: 2,
        helper: "Round 2 · Choose the correct meaning.",
      });
    }
  }

  return allQuestions;
}

function launchConfetti() {
  if (typeof window === "undefined") return;
  const colors = ["#fda4af", "#fbcfe8", "#c4f1f9", "#fde68a", "#dde8ff", "#a5f3fc"];
  const pieces = 32;

  for (let i = 0; i < pieces; i += 1) {
    const piece = document.createElement("span");
    const size = 6 + Math.random() * 8;
    const startX = Math.random() * window.innerWidth;
    piece.style.position = "fixed";
    piece.style.top = "-20px";
    piece.style.left = `${startX}px`;
    piece.style.width = `${size}px`;
    piece.style.height = `${size * (0.6 + Math.random() * 0.6)}px`;
    piece.style.background = colors[i % colors.length];
    piece.style.borderRadius = "999px";
    piece.style.opacity = "0.85";
    piece.style.pointerEvents = "none";
    piece.style.zIndex = "9999";
    document.body.appendChild(piece);

    const translateX = (Math.random() - 0.5) * 160;
    const translateY = window.innerHeight + 200;
    const duration = 1200 + Math.random() * 900;
    const rotation = (Math.random() - 0.5) * 720;

    piece.animate(
      [
        { transform: "translate3d(0, 0, 0) rotate(0deg)", opacity: 0.9 },
        {
          transform: `translate3d(${translateX}px, ${translateY}px, 0) rotate(${rotation}deg)`,
          opacity: 0.2,
        },
      ],
      {
        duration,
        easing: "cubic-bezier(0.33, 0, 0.67, 1)",
      },
    ).finished.finally(() => {
      piece.remove();
    });
  }
}

export default function SpellbeeGrade1Game() {
  const [phase, setPhase] = useState<Phase>("hub");
  const [sessionWords, setSessionWords] = useState<SpellbeeEntry[]>(() => createSessionWords());
  const sessionInitRef = useRef(false);
  const [sessionVersion, setSessionVersion] = useState(0);
  const [storageKey, setStorageKey] = useState<string | null>(null);

  const [learnIndex, setLearnIndex] = useState(0);
  const [learnedIds, setLearnedIds] = useState<string[]>([]);

  const [practiceQueue, setPracticeQueue] = useState<SpellbeeEntry[]>([]);
  const [practiceReveal, setPracticeReveal] = useState(false);
  const [practiceAttempts, setPracticeAttempts] = useState(0);
  const [masteredIds, setMasteredIds] = useState<string[]>([]);
  const [needsReviewIds, setNeedsReviewIds] = useState<string[]>([]);

  const [assessmentQuestions, setAssessmentQuestions] = useState<AssessmentQuestion[]>([]);
  const [assessmentIndex, setAssessmentIndex] = useState(0);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([]);
  const [assessmentFeedback, setAssessmentFeedback] = useState<{
    selected: string;
    isCorrect: boolean;
    correctAnswer: string;
    helper: string;
  } | null>(null);
  const [speechReady, setSpeechReady] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const wordLookup = useMemo(() => {
    return new Map<string, SpellbeeEntry>(SPELLBEE_GRADE1.map((entry) => [entry.id, entry]));
  }, []);

  const sessionGroupSummary = useMemo(() => {
    const groups = new Map<string, number>();
    sessionWords.forEach((entry) => {
      const letter = entry.word.charAt(0).toUpperCase();
      if (!letter) return;
      groups.set(letter, (groups.get(letter) ?? 0) + 1);
    });
    return Array.from(groups.entries())
      .map(([letter, count]) => ({ letter, count }))
      .sort((a, b) => a.letter.localeCompare(b.letter));
  }, [sessionWords]);

  const assessmentRoundCounts = useMemo(() => {
    return assessmentQuestions.reduce<Record<number, number>>(
      (acc, question) => {
        acc[question.round] = (acc[question.round] ?? 0) + 1;
        return acc;
      },
      { 1: 0, 2: 0 },
    );
  }, [assessmentQuestions]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const childId =
      window.localStorage.getItem("tinysteps-active-child") ??
      window.sessionStorage.getItem("tinysteps-active-child") ??
      window.sessionStorage.getItem("tinysteps-role") ??
      "guest";
    setStorageKey(`tinysteps_spellbee_${childId}`);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return () => undefined;
    if ("speechSynthesis" in window) {
      setSpeechReady(true);
    }
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stopSpeaking = useCallback(() => {
    if (!speechReady || typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    speechUtteranceRef.current = null;
    setIsSpeaking(false);
  }, [speechReady]);

  const handleSpeak = useCallback(
    (text: string, options?: { rate?: number; pitch?: number }) => {
      if (!speechReady || typeof window === "undefined") return;
      const trimmed = text.trim();
      if (!trimmed) return;
      stopSpeaking();
      const utter = new SpeechSynthesisUtterance(trimmed);
      utter.rate = options?.rate ?? SPEECH_WORD_RATE;
      utter.pitch = options?.pitch ?? SPEECH_WORD_PITCH;
      utter.lang = "en-US";
      utter.onstart = () => setIsSpeaking(true);
      const clearStatus = () => {
        setIsSpeaking(false);
        speechUtteranceRef.current = null;
      };
      utter.onend = clearStatus;
      utter.onerror = clearStatus;
      speechUtteranceRef.current = utter;
      window.speechSynthesis.speak(utter);
    },
    [speechReady, stopSpeaking],
  );

  const speakClue = useCallback(
    (question: AssessmentQuestion | null | undefined) => {
      if (!question) return;
      const { promptType, correctAnswer, word, prompt } = question;
      const isMeaning = promptType === "meaning";
      const text =
        isMeaning || promptType === "word"
          ? correctAnswer
          : promptType === "ipa"
            ? correctAnswer || word.ipa || word.word
            : correctAnswer || prompt;
      const rate = isMeaning ? SPEECH_MEANING_RATE : SPEECH_WORD_RATE;
      const pitch = isMeaning ? SPEECH_MEANING_PITCH : SPEECH_WORD_PITCH;
      handleSpeak(text, { rate, pitch });
    },
    [handleSpeak],
  );

  useEffect(() => {
    if (
      !storageKey ||
      typeof window === "undefined" ||
      !sessionWords.length ||
      !sessionWords.every((word) => Boolean(word?.id))
    ) {
      return;
    }
    try {
      const payload: PersistedState = {
        version: STORAGE_VERSION,
        timestamp: Date.now(),
        wordIds: sessionWords.map((entry) => entry.id),
        phase,
        learnIndex,
        learnedIds,
        practiceQueueIds: practiceQueue.map((entry) => entry.id),
        practiceReveal,
        practiceAttempts,
        masteredIds,
        needsReviewIds,
        assessmentIndex,
        assessmentResults,
        assessmentQuestions: assessmentQuestions.map((question) => ({
          id: question.id,
          promptType: question.promptType,
          prompt: question.prompt,
          helper: question.helper,
          choices: question.choices,
          correctAnswer: question.correctAnswer,
          wordId: question.word.id,
          round: question.round,
        })),
      };
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (error) {
      console.warn("Spellbee save failed:", error);
    }
  }, [
    assessmentIndex,
    assessmentQuestions,
    assessmentResults,
    learnIndex,
    learnedIds,
    masteredIds,
    needsReviewIds,
    practiceAttempts,
    practiceQueue,
    practiceReveal,
    phase,
    sessionWords,
    storageKey,
  ]);

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PersistedState | null;
      if (!parsed || parsed.version !== STORAGE_VERSION) return;

      const resumedWords = (parsed.wordIds || [])
        .map((id) => wordLookup.get(id))
        .filter((entry): entry is SpellbeeEntry => Boolean(entry));
      if (!resumedWords.length) return;

      const clampIndex = (value: number, max: number) => {
        if (Number.isNaN(value)) return 0;
        if (max < 0) return 0;
        return Math.min(Math.max(value, 0), max);
      };

      const dedupe = (ids: string[]) => Array.from(new Set(ids.filter((id) => wordLookup.has(id))));

      const safeLearned = dedupe(parsed.learnedIds || []);
      const safeMastered = dedupe(parsed.masteredIds || []);
      const safeNeedsReview = dedupe(parsed.needsReviewIds || []);
      const practiceQueueEntries = (parsed.practiceQueueIds || [])
        .map((id) => wordLookup.get(id))
        .filter((entry): entry is SpellbeeEntry => Boolean(entry));

      const storedQuestions = (parsed.assessmentQuestions || [])
        .map((item) => {
          const word = wordLookup.get(item.wordId);
          if (!word) return null;
          return {
            id: item.id,
            promptType: item.promptType,
            prompt: item.prompt,
            helper: item.helper,
            choices: item.choices,
            correctAnswer: item.correctAnswer,
            word,
            round: item.round ?? (item.promptType === "ipa" ? 1 : 2),
          } as AssessmentQuestion;
        })
        .filter(Boolean) as AssessmentQuestion[];

      const validQuestionIds = new Set(storedQuestions.map((question) => question.id));
      const safeAssessmentResults = (parsed.assessmentResults || []).filter(
        (result) => wordLookup.has(result.wordId) && validQuestionIds.has(result.questionId),
      );

      const allowablePhases: Phase[] = ["hub", "learn", "practice", "assessment", "summary"];
      const storedPhase = allowablePhases.includes(parsed.phase) ? parsed.phase : "hub";
      const derivedPhase =
        storedPhase === "assessment" && storedQuestions.length === 0 ? "practice" : storedPhase;

      sessionInitRef.current = true;
      setSessionWords(resumedWords);
      setPhase(derivedPhase);
      setLearnIndex(clampIndex(parsed.learnIndex ?? 0, resumedWords.length - 1));
      setLearnedIds(safeLearned);
      setPracticeQueue(practiceQueueEntries.length ? practiceQueueEntries : resumedWords.slice());
      setPracticeReveal(Boolean(parsed.practiceReveal));
      setPracticeAttempts(parsed.practiceAttempts ?? 0);
      setMasteredIds(safeMastered);
      setNeedsReviewIds(safeNeedsReview);

      if (storedQuestions.length) {
        setAssessmentQuestions(storedQuestions);
        setAssessmentIndex(
          clampIndex(parsed.assessmentIndex ?? 0, storedQuestions.length - 1),
        );
        setAssessmentResults(safeAssessmentResults);
      } else {
        const refreshedQuestions = buildAssessmentQuestions(resumedWords, safeNeedsReview);
        setAssessmentQuestions(refreshedQuestions);
        setAssessmentIndex(0);
        setAssessmentResults([]);
      }
      setAssessmentFeedback(null);
    } catch (error) {
      console.warn("Spellbee resume failed:", error);
    }
  }, [storageKey, wordLookup]);

  useEffect(() => {
    if (!sessionWords.length) return;
    if (sessionInitRef.current) {
      sessionInitRef.current = false;
      return;
    }
    setPhase("hub");
    setLearnIndex(0);
    setLearnedIds([]);
    setPracticeQueue(sessionWords.slice());
    setPracticeReveal(false);
    setPracticeAttempts(0);
    setMasteredIds([]);
    setNeedsReviewIds([]);
    setAssessmentQuestions(buildAssessmentQuestions(sessionWords, []));
    setAssessmentIndex(0);
    setAssessmentResults([]);
    setAssessmentFeedback(null);
  }, [sessionWords, sessionVersion]);

  const currentLearnWord = sessionWords[learnIndex];
  const currentPracticeWord = practiceQueue[0];
  const currentQuestion = assessmentQuestions[assessmentIndex];

  const learnProgress = sessionWords.length ? Math.round((learnedIds.length / sessionWords.length) * 100) : 0;
  const practiceProgress = sessionWords.length ? Math.round((masteredIds.length / sessionWords.length) * 100) : 0;
  const quizScore = assessmentResults.filter((result) => result.isCorrect).length;
  const quizAccuracy = assessmentResults.length
    ? Math.round((quizScore / assessmentResults.length) * 100)
    : 0;

  const canStartAssessment =
    masteredIds.length >= Math.max(3, Math.ceil(sessionWords.length * 0.5)) || practiceQueue.length === 0;
  const practiceCompleted = practiceQueue.length === 0 && masteredIds.length > 0;
  const practiceCompletedCount = Math.max(0, sessionWords.length - practiceQueue.length);

  const handlePhaseChange = useCallback(
    (next: Phase) => {
      stopSpeaking();
      if (next === "assessment" && canStartAssessment) {
        setAssessmentQuestions(buildAssessmentQuestions(sessionWords, needsReviewIds));
        setAssessmentIndex(0);
        setAssessmentResults([]);
        setAssessmentFeedback(null);
      }
      setPhase(next);
    },
    [canStartAssessment, needsReviewIds, sessionWords, stopSpeaking],
  );

  const handleRestartSession = useCallback(() => {
    stopSpeaking();
    setAssessmentFeedback(null);
    setAssessmentResults([]);
    setSessionVersion((prev) => prev + 1);
    setSessionWords(createSessionWords());
  }, [stopSpeaking]);

  const handleMarkTricky = useCallback(() => {
    if (!currentLearnWord) return;
    setNeedsReviewIds((prev) => uniquePush(prev, currentLearnWord.id));
  }, [currentLearnWord]);

  const handleLearnNext = (direction: "prev" | "next") => {
    if (!sessionWords.length) return;
    stopSpeaking();
    setLearnIndex((prev) => {
      const nextIndex =
        direction === "next"
          ? Math.min(prev + 1, sessionWords.length - 1)
          : Math.max(prev - 1, 0);
      return nextIndex;
    });
  };

  useEffect(() => {
    const word = sessionWords[learnIndex];
    if (!word) return;
    setLearnedIds((prev) => uniquePush(prev, word.id));
  }, [learnIndex, sessionWords]);

  const resetPractice = useCallback(
    (mode: "all" | "review") => {
      if (mode === "review" && needsReviewIds.length) {
        const reviewWords = sessionWords.filter((entry) => needsReviewIds.includes(entry.id));
        if (reviewWords.length) {
          setPracticeQueue(reviewWords);
          setPracticeReveal(false);
          return;
        }
      }
      setPracticeQueue(sessionWords.slice());
      setPracticeReveal(false);
    },
    [needsReviewIds, sessionWords],
  );

  const markPractice = (result: "mastered" | "retry") => {
    const current = currentPracticeWord;
    if (!current) return;
    setPracticeAttempts((prev) => prev + 1);
    setPracticeQueue((queue) => {
      const [, ...rest] = queue;
      if (result === "retry") {
        return [...rest, current];
      }
      return rest;
    });
    if (result === "mastered") {
      setMasteredIds((prev) => uniquePush(prev, current.id));
      setNeedsReviewIds((prev) => removeId(prev, current.id));
      launchConfetti();
    } else {
      setNeedsReviewIds((prev) => uniquePush(prev, current.id));
      setMasteredIds((prev) => removeId(prev, current.id));
    }
    setPracticeReveal(false);
  };

  const handleAssessmentAnswer = (choice: string) => {
    if (!currentQuestion || assessmentFeedback) return;
    stopSpeaking();
    const isCorrect = choice === currentQuestion.correctAnswer;
    setAssessmentResults((prev) => [
      ...prev,
      { questionId: currentQuestion.id, wordId: currentQuestion.word.id, selected: choice, isCorrect },
    ]);
    if (isCorrect) {
      launchConfetti();
      setNeedsReviewIds((prev) => removeId(prev, currentQuestion.word.id));
    } else {
      setNeedsReviewIds((prev) => uniquePush(prev, currentQuestion.word.id));
    }
    setAssessmentFeedback({
      selected: choice,
      isCorrect,
      correctAnswer: currentQuestion.correctAnswer,
      helper: currentQuestion.helper,
    });
  };

  const handleAssessmentNext = () => {
    if (!assessmentFeedback) return;
    stopSpeaking();
    const nextIndex = assessmentIndex + 1;
    setAssessmentFeedback(null);
    if (nextIndex >= assessmentQuestions.length) {
      setPhase("summary");
      return;
    }
    setAssessmentIndex(nextIndex);
  };

  const reviewWords = useMemo(() => {
    const ids = new Set<string>([
      ...needsReviewIds,
      ...assessmentResults.filter((result) => !result.isCorrect).map((result) => result.wordId),
    ]);
    return sessionWords.filter((entry) => ids.has(entry.id));
  }, [assessmentResults, needsReviewIds, sessionWords]);

  const phaseButtons = [
    { key: "learn" as const, label: "Learn" },
    {
      key: "practice" as const,
      label: "Practice",
      badge: `${masteredIds.length}/${sessionWords.length || 1}`,
    },
  {
    key: "assessment" as const,
    label: "Quick quiz",
    badge: `${quizScore}/${assessmentQuestions.length || QUIZ_QUESTIONS}`,
    disabled: !canStartAssessment,
  },
];

  const renderHubPhase = () => {
    type WordStatus = "mastered" | "review" | "learned" | "new";
    const masteredSet = new Set(masteredIds);
    const reviewSet = new Set(needsReviewIds);
    const learnedSet = new Set(learnedIds);
    const wordItems = sessionWords.map((word) => {
      let status: WordStatus;
      if (masteredSet.has(word.id)) status = "mastered";
      else if (reviewSet.has(word.id)) status = "review";
      else if (learnedSet.has(word.id)) status = "learned";
      else status = "new";
      return { word, status };
    });

    const masteredCount = wordItems.filter((item) => item.status === "mastered").length;
    const reviewCount = wordItems.filter((item) => item.status === "review").length;
    const inProgressCount = wordItems.filter((item) => item.status === "learned").length;
    const newCount = wordItems.filter((item) => item.status === "new").length;

    const activityCards = [
      {
        id: "spellbee",
        title: "Spell Galaxy",
        description: "Explore, practise, and quiz today’s Grade 1 words with IPA and meanings.",
        badge: practiceCompleted ? "Continue" : "Featured",
        footer: `${sessionWords.length} words · ${sessionGroupSummary.map((group) => group.letter).join(", ") || "No groups yet"}`,
        actionLabel: practiceCompleted ? "Resume session" : "Start mission",
        onAction: () => handlePhaseChange(practiceCompleted ? "practice" : "learn"),
        disabled: false,
      },
      {
        id: "flash-cards",
        title: "Flash Cards",
        description: "Flip through your deck in rapid-fire mode to boost recall.",
        badge: "Coming soon",
        footer: "Timed practice · streak tracker",
        actionLabel: "Coming soon",
        onAction: null,
        disabled: true,
      },
      {
        id: "letter-word",
        title: "Letter → Word Match",
        description: "Match starting letters to word cards to sharpen phonics.",
        badge: "Coming soon",
        footer: "Alphabet sorting · speed play",
        actionLabel: "Coming soon",
        onAction: null,
        disabled: true,
      },
      {
        id: "letter-image",
        title: "Letter → Image Match",
        description: "Link letters to illustrations for instant visual cues.",
        badge: "Coming soon",
        footer: "Visual memory · phonics link",
        actionLabel: "Coming soon",
        onAction: null,
        disabled: true,
      },
      {
        id: "word-meaning",
        title: "Word → Meaning Match",
        description: "Pair words with their meanings in a quick-fire challenge.",
        badge: "Coming soon",
        footer: "Vocabulary race · accuracy bonus",
        actionLabel: "Coming soon",
        onAction: null,
        disabled: true,
      },
      {
        id: "future-games",
        title: "Galaxy Labs",
        description: "Peek at prototype games and vote on what should launch next.",
        badge: "Future drop",
        footer: "Community picks · beta invites",
        actionLabel: "Coming soon",
        onAction: null,
        disabled: true,
      },
    ];

    const statusStyles: Record<WordStatus, string> = {
      mastered: "border-emerald-300/40 bg-emerald-400/10 text-emerald-100",
      review: "border-rose-300/40 bg-rose-400/10 text-rose-100",
      learned: "border-sky-300/40 bg-sky-400/10 text-sky-100",
      new: "border-white/15 bg-white/[0.05] text-slate-200",
    };

    const statusLabels: Record<WordStatus, string> = {
      mastered: "Mastered",
      review: "Needs review",
      learned: "In progress",
      new: "New today",
    };

    return (
      <div className="flex h-full flex-col gap-5">
        <div className="rounded-3xl border border-white/15 bg-white/[0.04] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-200/70">Spell Galaxy Hub</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Choose your training mission</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-200">
                Track what you’ve learned so far, review tricky words, and launch into the next activity. Your deck
                refreshes every session, so keep the streak glowing!
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-200">
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
                Total words {sessionWords.length}
              </span>
              <span className="rounded-full border border-emerald-300/40 bg-emerald-400/10 px-3 py-1 text-emerald-100">
                Mastered {masteredCount}
              </span>
              <span className="rounded-full border border-rose-300/40 bg-rose-400/10 px-3 py-1 text-rose-100">
                Review {reviewCount}
              </span>
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {activityCards.map((card) => (
              <div
                key={card.id}
                className="flex h-full flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4 shadow-lg shadow-slate-950/30"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold text-white">{card.title}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        card.badge === "Featured"
                          ? "bg-gradient-to-r from-sky-400 via-violet-400 to-rose-400 text-slate-900"
                          : "bg-white/10 text-slate-200"
                      }`}
                    >
                      {card.badge}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-200">{card.description}</p>
                </div>
                <div className="mt-auto space-y-3">
                  <p className="text-xs text-slate-300">{card.footer}</p>
                  <button
                    type="button"
                    onClick={card.onAction ?? undefined}
                    disabled={card.disabled}
                    className={`w-full rounded-full px-4 py-2 text-sm font-semibold transition ${
                      card.disabled
                        ? "border border-white/10 bg-white/[0.02] text-slate-400"
                        : "bg-gradient-to-r from-sky-400 via-violet-400 to-rose-400 text-slate-900 shadow-lg shadow-slate-900/40 hover:scale-[1.01]"
                    }`}
                  >
                    {card.actionLabel}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid flex-1 gap-5 lg:grid-cols-[2fr,1fr]">
          <div className="flex h-full flex-col rounded-3xl border border-white/12 bg-white/[0.04] p-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-sm text-slate-200">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-200/70">Mastered</p>
                <p className="mt-2 text-xl font-semibold text-white">{masteredCount}</p>
                <p>Confident words</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-sm text-slate-200">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-200/70">Needs review</p>
                <p className="mt-2 text-xl font-semibold text-white">{reviewCount}</p>
                <p>Flagged for extra practise</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-sm text-slate-200">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-200/70">In progress</p>
                <p className="mt-2 text-xl font-semibold text-white">{inProgressCount}</p>
                <p>Still learning</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-sm text-slate-200">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-200/70">New today</p>
                <p className="mt-2 text-xl font-semibold text-white">{newCount}</p>
                <p>Fresh cards waiting</p>
              </div>
            </div>
            <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
              {wordItems.length ? (
                <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {wordItems.map(({ word, status }) => (
                    <li
                      key={word.id}
                      className={`rounded-2xl border px-4 py-3 text-sm transition ${statusStyles[status]}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-base font-semibold text-white">{word.word}</span>
                        <span className="rounded-full px-2 py-0.5 text-xs font-semibold">{statusLabels[status]}</span>
                      </div>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-300">{word.ipa}</p>
                      <p className="mt-2 text-sm text-slate-100">{word.meaning}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-200">
                  Your deck is forming now. Tap <strong>Start mission</strong> to begin exploring today’s words.
                </p>
              )}
            </div>
          </div>
          <aside className="flex h-full flex-col gap-4 rounded-3xl border border-white/12 bg-white/[0.04] p-5 text-sm text-slate-200">
            <div>
              <h3 className="text-base font-semibold text-white">Deck overview</h3>
              {sessionGroupSummary.length ? (
                <ul className="mt-3 space-y-2 text-sm">
                  {sessionGroupSummary.map((group) => (
                    <li key={group.letter} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
                      <span className="font-semibold text-white">Group {group.letter}</span>
                      <span className="text-xs text-slate-300">{group.count} words</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-300">Letter groups will appear when the deck is ready.</p>
              )}
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Recent quiz streak</h3>
              <p className="mt-2 text-sm text-slate-200">
                Best score: <strong>{quizScore}</strong> · Accuracy: <strong>{quizAccuracy}%</strong>
              </p>
              <p className="mt-1 text-xs text-slate-300">
                Phonics questions answered: <strong>{assessmentRoundCounts[1] ?? 0}</strong> · Meanings tackled:{" "}
                <strong>{assessmentRoundCounts[2] ?? 0}</strong>
              </p>
            </div>
            <div className="mt-auto text-xs text-slate-400">
              Tip: Bookmark tricky words from the learn tab so the quiz focusses on what needs a boost.
            </div>
          </aside>
        </div>
      </div>
    );
  };

  const renderLearnPhase = () => {
    if (!currentLearnWord) {
      return <p className="text-sm text-slate-200">Generating your word pack…</p>;
    }
    const learnGroupLabel = currentLearnWord.word.charAt(0).toUpperCase();
    return (
      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-200/80">
                {learnGroupLabel ? `Group ${learnGroupLabel} · Word card` : "Word card"}
              </p>
              <h2 className="text-3xl font-semibold text-white">{currentLearnWord.word}</h2>
              <p className="mt-2 text-base text-slate-200">{currentLearnWord.meaning}</p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-200">
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 font-semibold">
                  {currentLearnWord.ipa}
                </span>
                {currentLearnWord.tags.length > 0 && (
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">
                    {currentLearnWord.tags.join(", ")}
                  </span>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-100">
                <button
                  type="button"
                  onClick={() => handleSpeak(currentLearnWord.word, { rate: SPEECH_WORD_RATE, pitch: SPEECH_WORD_PITCH })}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 font-semibold transition hover:bg-white/20 disabled:opacity-50"
                  disabled={!speechReady}
                >
                  <span aria-hidden>🔊</span>
                  Hear word
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleSpeak(currentLearnWord.meaning, { rate: SPEECH_MEANING_RATE, pitch: SPEECH_MEANING_PITCH })
                  }
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 font-semibold transition hover:bg-white/20 disabled:opacity-50"
                  disabled={!speechReady}
                >
                  <span aria-hidden>🗣️</span>
                  Hear meaning
                </button>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-200/70">Word family</p>
              <p className="mt-2 font-semibold">
                {currentLearnWord.forms.length ? currentLearnWord.forms.join(", ") : "No alternate forms yet"}
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => handleLearnNext("prev")}
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-40"
              disabled={learnIndex === 0}
            >
              ← Previous
            </button>
            <button
              type="button"
              onClick={() => handleLearnNext("next")}
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-40"
              disabled={learnIndex === sessionWords.length - 1}
            >
              Next →
            </button>
            <button
              type="button"
              onClick={handleMarkTricky}
              className="inline-flex items-center justify-center rounded-full border border-amber-300/40 bg-amber-400/20 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-400/30"
            >
              Mark as tricky
            </button>
          </div>
        </div>

        <aside className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-200">
          <h3 className="font-semibold text-white">Tip</h3>
          <p className="mt-2">
            Say the word aloud, clap the syllables, then trace the spelling in the air. Add every tricky word to practice
            so our quiz focuses on what needs attention.
          </p>
        </aside>
      </div>
    );
  };

  const renderPracticePhase = () => {
    if (!currentPracticeWord) {
      return (
        <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
          <div className="rounded-3xl border border-emerald-300/30 bg-emerald-400/10 p-5 text-emerald-50">
            <h2 className="text-xl font-semibold text-white">Nice! You mastered every card.</h2>
            <p className="mt-2">
              Jump into the quick quiz to lock those spellings, or reload a smaller practice stack if you want another
              warm-up.
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <button
                type="button"
                onClick={() => resetPractice("review")}
                className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-4 py-2 font-semibold text-white transition hover:bg-white/20"
                disabled={needsReviewIds.length === 0}
              >
                Review tricky words
              </button>
              <button
                type="button"
                onClick={() => resetPractice("all")}
                className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-4 py-2 font-semibold text-white transition hover:bg-white/20"
              >
                Practice full deck
              </button>
              <button
                type="button"
                onClick={() => handlePhaseChange("assessment")}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-400 via-violet-400 to-rose-400 px-5 py-2 font-semibold text-slate-900 shadow-lg shadow-slate-900/40 transition hover:scale-[1.01]"
              >
                Start quick quiz
              </button>
            </div>
          </div>
          <aside className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-200">
            <h3 className="font-semibold text-white">Practice summary</h3>
            <p className="mt-2">
              Attempts made: <strong>{practiceAttempts}</strong>. Words flagged for extra review:{" "}
              <strong>{needsReviewIds.length}</strong>.
            </p>
          </aside>
        </div>
      );
    }

    const isTricky = needsReviewIds.includes(currentPracticeWord.id);
    const practiceGroupLabel = currentPracticeWord.word.charAt(0).toUpperCase();

    return (
      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-200/80">
                {practiceGroupLabel ? `Group ${practiceGroupLabel} · ` : ""}
                Box {isTricky ? "review" : "mastery"} · Card {practiceCompletedCount + 1} of {sessionWords.length}
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-white">{currentPracticeWord.word}</h2>
              <p className="mt-2 text-sm text-slate-200">Cover the meaning, spell aloud, then tap reveal to check.</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-100">
                <button
                  type="button"
                  onClick={() =>
                    handleSpeak(currentPracticeWord.word, { rate: SPEECH_WORD_RATE, pitch: SPEECH_WORD_PITCH })
                  }
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 font-semibold transition hover:bg-white/20 disabled:opacity-50"
                  disabled={!speechReady}
                >
                  <span aria-hidden>🔊</span>
                  Hear word
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleSpeak(currentPracticeWord.meaning, { rate: SPEECH_MEANING_RATE, pitch: SPEECH_MEANING_PITCH })
                  }
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 font-semibold transition hover:bg-white/20 disabled:opacity-50"
                  disabled={!speechReady}
                >
                  <span aria-hidden>🗣️</span>
                  Hear meaning
                </button>
              </div>
            </div>
            {isTricky && (
              <span className="rounded-full border border-rose-300/40 bg-rose-400/20 px-3 py-1 text-xs font-semibold text-rose-50">
                Marked for review
              </span>
            )}
          </div>
          <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-center">
            {practiceReveal ? (
              <div className="space-y-3">
                <p className="text-lg font-semibold text-white">{currentPracticeWord.meaning}</p>
                <p className="text-sm text-slate-200">{currentPracticeWord.forms.join(", ") || "No alternate forms"}</p>
              </div>
            ) : (
              <p className="text-lg font-semibold text-slate-200">Tap reveal to check the meaning & forms.</p>
            )}
            <button
              type="button"
              onClick={() => {
                stopSpeaking();
                setPracticeReveal((prev) => !prev);
              }}
              className="mt-4 inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              {practiceReveal ? "Hide meaning" : "Reveal meaning"}
            </button>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                stopSpeaking();
                markPractice("mastered");
              }}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-violet-400 px-5 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-slate-900/40 transition hover:scale-[1.01]"
            >
              I spelled it right
            </button>
            <button
              type="button"
              onClick={() => {
                stopSpeaking();
                markPractice("retry");
              }}
              className="inline-flex items-center justify-center rounded-full border border-rose-300/40 bg-rose-400/20 px-5 py-2 text-sm font-semibold text-rose-50 transition hover:bg-rose-400/30"
            >
              Needs more practice
            </button>
            <span className="text-xs text-slate-300">
              Attempt {practiceAttempts + 1} · mastered {masteredIds.length}/{sessionWords.length}
            </span>
          </div>
        </div>
        <aside className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-200">
          <h3 className="font-semibold text-white">Tip</h3>
          <p className="mt-2">
            Try writing the word without looking, or spell it backwards for an extra brain stretch. Mark any slips as
            “Needs more practice” so the quiz adapts for you.
          </p>
        </aside>
      </div>
    );
  };

  const renderAssessmentPhase = () => {
    if (!currentQuestion) {
      return (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm text-slate-200">
          Preparing your quiz set…
        </div>
      );
    }

    const roundTotal = assessmentRoundCounts[currentQuestion.round] ?? 0;
    const roundPosition =
      assessmentQuestions
        .slice(0, assessmentIndex)
        .filter((question) => question.round === currentQuestion.round).length + 1;

    return (
      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-200/80">
                Round {currentQuestion.round} of {QUIZ_ROUNDS} · Question {roundPosition} of {roundTotal}
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-white">{currentQuestion.prompt}</h2>
              <p className="mt-2 text-sm text-slate-200">{currentQuestion.helper}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-100">
                <button
                  type="button"
                  onClick={() =>
                    handleSpeak(currentQuestion.word.word, { rate: SPEECH_WORD_RATE, pitch: SPEECH_WORD_PITCH })
                  }
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 font-semibold transition hover:bg-white/20 disabled:opacity-50"
                  disabled={!speechReady}
                >
                  <span aria-hidden>🔊</span>
                  Hear word
                </button>
                <button
                  type="button"
                  onClick={() => speakClue(currentQuestion)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 font-semibold transition hover:bg-white/20 disabled:opacity-50"
                  disabled={!speechReady}
                >
                  <span aria-hidden>🗣️</span>
                  Hear clue
                </button>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-200/70">Score</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {quizScore}/{assessmentQuestions.length}
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {currentQuestion.choices.map((choice) => {
              const isSelected = assessmentFeedback?.selected === choice;
              const isCorrectChoice = assessmentFeedback ? choice === currentQuestion.correctAnswer : false;
              const baseClasses =
                "rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-sky-300";
              const stateClasses = !assessmentFeedback
                ? "border-white/20 bg-white/10 text-white hover:bg-white/20"
                : isCorrectChoice
                  ? "border-emerald-300/60 bg-emerald-400/15 text-emerald-50"
                  : isSelected
                    ? "border-rose-300/60 bg-rose-400/15 text-rose-100"
                    : "border-white/15 bg-white/[0.04] text-slate-200";
              return (
                <button
                  key={choice}
                  type="button"
                  onClick={() => handleAssessmentAnswer(choice)}
                  className={`${baseClasses} ${stateClasses}`}
                  disabled={Boolean(assessmentFeedback)}
                >
                  {choice}
                </button>
              );
            })}
          </div>
          {assessmentFeedback && (
            <div
              className={`mt-5 rounded-2xl border p-5 text-sm ${
                assessmentFeedback.isCorrect
                  ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-50"
                  : "border-rose-300/30 bg-rose-400/10 text-rose-50"
              }`}
            >
              <p className="text-base font-semibold">
                {assessmentFeedback.isCorrect ? "Stellar spelling!" : "Good try — let's note this one."}
              </p>
              {!assessmentFeedback.isCorrect && (
                <p className="mt-2">
                  Correct answer: <strong>{assessmentFeedback.correctAnswer}</strong>
                </p>
              )}
              <button
                type="button"
                onClick={handleAssessmentNext}
                className="mt-4 inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
              >
                Next question →
              </button>
            </div>
          )}
        </div>
        <aside className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-200">
          <h3 className="font-semibold text-white">Quiz tips</h3>
          <p className="mt-2">
            Accuracy so far: <strong>{quizAccuracy}%</strong>. The quiz prioritises words you flagged during practice.
            Keep your streak going to unlock the golden badge!
          </p>
        </aside>
      </div>
    );
  };

  const renderSummaryPhase = () => {
    const totalQuestions = assessmentQuestions.length || QUIZ_QUESTIONS;
    const accuracy = totalQuestions ? Math.round((quizScore / totalQuestions) * 100) : 0;

    return (
      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur">
          <h2 className="text-3xl font-semibold text-white">Mission accomplished!</h2>
          <p className="mt-2 text-sm text-slate-200">
            You explored {sessionWords.length} words, mastered {masteredIds.length} in practice, and scored {quizScore} out
            of {totalQuestions} in the quick quiz.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-200">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-200/70">Learn progress</p>
              <p className="mt-2 text-xl font-semibold text-white">{learnProgress}%</p>
              <p>{learnedIds.length} cards explored</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-200">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-200/70">Practice mastery</p>
              <p className="mt-2 text-xl font-semibold text-white">{practiceProgress}%</p>
              <p>{masteredIds.length} words confident</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-200">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-200/70">Quiz score</p>
              <p className="mt-2 text-xl font-semibold text-white">{accuracy}% accuracy</p>
              <p>{quizScore} / {totalQuestions} correct</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleRestartSession}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-400 via-violet-400 to-rose-400 px-6 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-slate-900/40 transition hover:scale-[1.01]"
            >
              Play a new set
            </button>
            <button
              type="button"
              onClick={() => handlePhaseChange("practice")}
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Revisit practice
            </button>
            <Link
              to="/kids"
              className="inline-flex items-center justify-center rounded-full border border-sky-300/40 bg-sky-400/15 px-5 py-2 text-sm font-semibold text-sky-100 transition hover:bg-sky-400/25"
            >
              Back to Kids Zone
            </Link>
          </div>
        </div>

        <aside className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-200">
          <h3 className="font-semibold text-white">Words to keep glowing</h3>
          {reviewWords.length === 0 ? (
            <p className="mt-2">
              Every word shone bright today! Come back tomorrow for a fresh Spellbee challenge to keep the streak alive.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {reviewWords.map((word) => (
                <li
                  key={word.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-slate-200"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-base font-semibold text-white">{word.word}</span>
                    <span className="text-xs uppercase tracking-[0.22em] text-slate-400">{word.ipa}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-200">{word.meaning}</p>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(91,170,255,0.25),transparent_55%),radial-gradient(circle_at_80%_10%,rgba(202,103,184,0.2),transparent_45%),radial-gradient(circle_at_50%_80%,rgba(255,188,137,0.18),transparent_50%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/kids"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
          >
            ← Back to Kids Zone
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            {phase !== "hub" && (
              <button
                type="button"
                onClick={() => handlePhaseChange("hub")}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
              >
                Browse activities
              </button>
            )}
            <button
              type="button"
              onClick={handleRestartSession}
              className="inline-flex items-center gap-2 rounded-full border border-sky-300/40 bg-sky-400/10 px-4 py-2 text-sm font-semibold text-sky-200 transition hover:bg-sky-400/20"
            >
              Restart with new words
            </button>
          </div>
        </div>

        <header className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-200/70">Adaptive Spellbee · Grade 1</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Tiny Steps Spell Galaxy</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-200 sm:text-base">
            Discover, practice, and quiz Grade 1 spelling words with IPA, forms, and adaptive checkpoints. Each correct
            answer celebrates with confetti — keep the streak going to level up your constellation!
          </p>
        </header>

        <section className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
          {phase !== "hub" && (
            <>
              <div className="flex flex-wrap items-center gap-3">
                {phaseButtons.map((button) => {
                  const isActive = phase === button.key || (button.key === "assessment" && phase === "summary");
                  return (
                    <button
                      key={button.key}
                      type="button"
                      onClick={() => handlePhaseChange(button.key)}
                      disabled={button.disabled}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                        isActive
                          ? "bg-gradient-to-r from-sky-400 via-violet-400 to-rose-400 text-slate-900 shadow-lg shadow-slate-900/40"
                          : "border border-white/20 bg-white/10 text-white hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
                      }`}
                      title={
                        button.disabled ? "Master at least half of the deck in practice to unlock the quiz." : undefined
                      }
                    >
                      {button.label}
                      {button.badge && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            isActive ? "bg-white/40 text-slate-900" : "bg-white/15 text-white"
                          }`}
                        >
                          {button.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
                {phase === "summary" && (
                  <span className="inline-flex items-center rounded-full border border-emerald-300/40 bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-100">
                    Summary
                  </span>
                )}
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-200/70">Learn</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{learnProgress}%</p>
                  <p className="text-sm text-slate-200">{learnedIds.length} of {sessionWords.length} cards visited</p>
                  {sessionGroupSummary.length > 0 && (
                    <p className="mt-2 text-xs text-slate-300">
                      Groups:{" "}
                      {sessionGroupSummary.map((group, index) => (
                        <span key={group.letter}>
                          {group.letter} ({group.count})
                          {index < sessionGroupSummary.length - 1 ? " · " : ""}
                        </span>
                      ))}
                    </p>
                  )}
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-200/70">Practice</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{practiceProgress}%</p>
                  <p className="text-sm text-slate-200">
                    {masteredIds.length} confident · {practiceCompleted ? "Deck clear" : `${practiceQueue.length} left`}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-200/70">Quick quiz</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{quizScore}/{assessmentQuestions.length || QUIZ_QUESTIONS}</p>
                  <p className="text-sm text-slate-200">{quizAccuracy}% accuracy so far</p>
                  <p className="mt-2 text-xs text-slate-300">
                    Phonics: {assessmentRoundCounts[1] ?? 0} · Meaning: {assessmentRoundCounts[2] ?? 0}
                  </p>
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-300">
                {speechReady
                  ? isSpeaking
                    ? "Audio playing… wait for the clip to finish before answering."
                    : "Audio ready — tap the speaker buttons to hear each word or clue."
                  : "Audio playback is not available in this browser."}
              </p>
            </>
          )}

          <div className={`${phase === "hub" ? "" : "mt-5"} flex-1 overflow-hidden`}>
            <div className="h-full overflow-y-auto pr-1">
              {phase === "hub" && renderHubPhase()}
              {phase === "learn" && renderLearnPhase()}
              {phase === "practice" && renderPracticePhase()}
              {phase === "assessment" && renderAssessmentPhase()}
              {phase === "summary" && renderSummaryPhase()}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
