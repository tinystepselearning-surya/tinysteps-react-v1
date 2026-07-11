import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { buildMissionReturnHref } from "../missionNavigation";
import { recordLevelResult } from "../../../../../games/engine/recordLevelResult";
import {
  PUBLIC_SPELLING_LEVELS,
  normalizePublicSpellingAnswer,
  type PublicSpellingChallenge,
} from "../../../../../lib/publicSpellingContent";

type Item = {
  onset: string; // c
  rime: string; // at
  word: string; // cat
  img: string; // /games/maw/at/cat.png
};

type FamilyConfig = {
  id: string; // "at"
  rime: string; // "at"
  tiles: string[]; // ["c","b","h","r","m"]
  items: Item[];
};

type Tile = { id: string; ch: string };

type ConfettiPiece = {
  id: string;
  leftPct: number;
  delayMs: number;
  durMs: number;
  rot: number;
  size: number;
  bg: string;
};

type Screen = "levels" | "play" | "complete";
type PlayPhase = "cue" | "act" | "feedback";

type QueueEntry = {
  id: string;
  item: Item;
  dueIn: number; // rounds remaining until eligible
  origin: "new" | "review";
  repeats: number; // how many times this word has been reinserted
};

const FAMILY_ORDER = [
  "at",
  "an",
  "ap",
  "am",
  "ad",
  "ag",
  "et",
  "en",
  "ed",
  "in",
  "ip",
  "ig",
  "og",
  "op",
  "ot",
  "ug",
  "un",
  "ut",
] as const;

const VOWEL_GROUPS: Array<{ title: string; ids: string[] }> = [
  { title: "Short a", ids: ["at", "an", "ap", "am", "ad", "ag"] },
  { title: "Short e", ids: ["et", "en", "ed"] },
  { title: "Short i", ids: ["in", "ip", "ig"] },
  { title: "Short o", ids: ["og", "op", "ot"] },
  { title: "Short u", ids: ["ug", "un", "ut"] },
];

const CANONICAL_GAME_ID = "cvc-word-builder";
const CANONICAL_PROGRESS_DOC_ID = "phonics_cvc_word_builder";

const FAMILIES: Record<string, FamilyConfig> = {
  at: {
    id: "at",
    rime: "at",
    tiles: ["c", "b", "h", "r", "m"],
    items: [
      { onset: "c", rime: "at", word: "cat", img: "/games/maw/at/cat.png" },
      { onset: "b", rime: "at", word: "bat", img: "/games/maw/at/bat.png" },
      { onset: "h", rime: "at", word: "hat", img: "/games/maw/at/hat.png" },
      { onset: "r", rime: "at", word: "rat", img: "/games/maw/at/rat.png" },
      { onset: "m", rime: "at", word: "mat", img: "/games/maw/at/mat.png" },
    ],
  },
  an: {
    id: "an",
    rime: "an",
    tiles: ["c", "m", "p", "f", "v"],
    items: [
      { onset: "c", rime: "an", word: "can", img: "/games/maw/an/can.png" },
      { onset: "m", rime: "an", word: "man", img: "/games/maw/an/man.png" },
      { onset: "p", rime: "an", word: "pan", img: "/games/maw/an/pan.png" },
      { onset: "f", rime: "an", word: "fan", img: "/games/maw/an/fan.png" },
      { onset: "v", rime: "an", word: "van", img: "/games/maw/an/van.png" },
    ],
  },
  ap: {
    id: "ap",
    rime: "ap",
    tiles: ["c", "m", "t", "n"],
    items: [
      { onset: "c", rime: "ap", word: "cap", img: "/games/maw/ap/cap.png" },
      { onset: "m", rime: "ap", word: "map", img: "/games/maw/ap/map.png" },
      { onset: "t", rime: "ap", word: "tap", img: "/games/maw/ap/tap.png" },
      { onset: "n", rime: "ap", word: "nap", img: "/games/maw/ap/nap.png" },
    ],
  },
  am: {
    id: "am",
    rime: "am",
    tiles: ["j", "h", "y"],
    items: [
      { onset: "j", rime: "am", word: "jam", img: "/games/maw/am/jam.png" },
      { onset: "h", rime: "am", word: "ham", img: "/games/maw/am/ham.png" },
      { onset: "y", rime: "am", word: "yam", img: "/games/maw/am/yam.png" },
    ],
  },
  ad: {
    id: "ad",
    rime: "ad",
    tiles: ["d", "s", "m", "p"],
    items: [
      { onset: "d", rime: "ad", word: "dad", img: "/games/maw/ad/dad.png" },
      { onset: "s", rime: "ad", word: "sad", img: "/games/maw/ad/sad.png" },
      { onset: "m", rime: "ad", word: "mad", img: "/games/maw/ad/mad.png" },
      { onset: "p", rime: "ad", word: "pad", img: "/games/maw/ad/pad.png" },
    ],
  },
  ag: {
    id: "ag",
    rime: "ag",
    tiles: ["b", "t", "r"],
    items: [
      { onset: "b", rime: "ag", word: "bag", img: "/games/maw/ag/bag.png" },
      { onset: "t", rime: "ag", word: "tag", img: "/games/maw/ag/tag.png" },
      { onset: "r", rime: "ag", word: "rag", img: "/games/maw/ag/rag.png" },
    ],
  },
  et: {
    id: "et",
    rime: "et",
    tiles: ["p", "n", "j", "w", "v"],
    items: [
      { onset: "p", rime: "et", word: "pet", img: "/games/maw/et/pet.png" },
      { onset: "n", rime: "et", word: "net", img: "/games/maw/et/net.png" },
      { onset: "j", rime: "et", word: "jet", img: "/games/maw/et/jet.png" },
      { onset: "w", rime: "et", word: "wet", img: "/games/maw/et/wet.png" },
      { onset: "v", rime: "et", word: "vet", img: "/games/maw/et/vet.png" },
    ],
  },
  en: {
    id: "en",
    rime: "en",
    tiles: ["p", "h", "d", "t"],
    items: [
      { onset: "p", rime: "en", word: "pen", img: "/games/maw/en/pen.png" },
      { onset: "h", rime: "en", word: "hen", img: "/games/maw/en/hen.png" },
      { onset: "d", rime: "en", word: "den", img: "/games/maw/en/den.png" },
      { onset: "t", rime: "en", word: "ten", img: "/games/maw/en/ten.png" },
    ],
  },
  ed: {
    id: "ed",
    rime: "ed",
    tiles: ["b", "r", "f"],
    items: [
      { onset: "b", rime: "ed", word: "bed", img: "/games/maw/ed/bed.png" },
      { onset: "r", rime: "ed", word: "red", img: "/games/maw/ed/red.png" },
      { onset: "f", rime: "ed", word: "fed", img: "/games/maw/ed/fed.png" },
    ],
  },
  in: {
    id: "in",
    rime: "in",
    tiles: ["p", "b", "f", "w", "t"],
    items: [
      { onset: "p", rime: "in", word: "pin", img: "/games/maw/in/pin.png" },
      { onset: "b", rime: "in", word: "bin", img: "/games/maw/in/bin.png" },
      { onset: "f", rime: "in", word: "fin", img: "/games/maw/in/fin.png" },
      { onset: "w", rime: "in", word: "win", img: "/games/maw/in/win.png" },
      { onset: "t", rime: "in", word: "tin", img: "/games/maw/in/tin.png" },
    ],
  },
  ip: {
    id: "ip",
    rime: "ip",
    tiles: ["l", "s", "t", "z", "d"],
    items: [
      { onset: "l", rime: "ip", word: "lip", img: "/games/maw/ip/lip.png" },
      { onset: "s", rime: "ip", word: "sip", img: "/games/maw/ip/sip.png" },
      { onset: "t", rime: "ip", word: "tip", img: "/games/maw/ip/tip.png" },
      { onset: "z", rime: "ip", word: "zip", img: "/games/maw/ip/zip.png" },
      { onset: "d", rime: "ip", word: "dip", img: "/games/maw/ip/dip.png" },
    ],
  },
  ig: {
    id: "ig",
    rime: "ig",
    tiles: ["p", "d", "f", "w"],
    items: [
      { onset: "p", rime: "ig", word: "pig", img: "/games/maw/ig/pig.png" },
      { onset: "d", rime: "ig", word: "dig", img: "/games/maw/ig/dig.png" },
      { onset: "f", rime: "ig", word: "fig", img: "/games/maw/ig/fig.png" },
      { onset: "w", rime: "ig", word: "wig", img: "/games/maw/ig/wig.png" },
    ],
  },
  og: {
    id: "og",
    rime: "og",
    tiles: ["d", "l", "f"],
    items: [
      { onset: "d", rime: "og", word: "dog", img: "/games/maw/og/dog.png" },
      { onset: "l", rime: "og", word: "log", img: "/games/maw/og/log.png" },
      { onset: "f", rime: "og", word: "fog", img: "/games/maw/og/fog.png" },
    ],
  },
  op: {
    id: "op",
    rime: "op",
    tiles: ["h", "t", "m", "p"],
    items: [
      { onset: "h", rime: "op", word: "hop", img: "/games/maw/op/hop.png" },
      { onset: "t", rime: "op", word: "top", img: "/games/maw/op/top.png" },
      { onset: "m", rime: "op", word: "mop", img: "/games/maw/op/mop.png" },
      { onset: "p", rime: "op", word: "pop", img: "/games/maw/op/pop.png" },
    ],
  },
  ot: {
    id: "ot",
    rime: "ot",
    tiles: ["p", "d", "c", "h"],
    items: [
      { onset: "p", rime: "ot", word: "pot", img: "/games/maw/ot/pot.png" },
      { onset: "d", rime: "ot", word: "dot", img: "/games/maw/ot/dot.png" },
      { onset: "c", rime: "ot", word: "cot", img: "/games/maw/ot/cot.png" },
      { onset: "h", rime: "ot", word: "hot", img: "/games/maw/ot/hot.png" },
    ],
  },
  ug: {
    id: "ug",
    rime: "ug",
    tiles: ["b", "m", "r", "j", "h"],
    items: [
      { onset: "b", rime: "ug", word: "bug", img: "/games/maw/ug/bug.png" },
      { onset: "m", rime: "ug", word: "mug", img: "/games/maw/ug/mug.png" },
      { onset: "r", rime: "ug", word: "rug", img: "/games/maw/ug/rug.png" },
      { onset: "j", rime: "ug", word: "jug", img: "/games/maw/ug/jug.png" },
      { onset: "h", rime: "ug", word: "hug", img: "/games/maw/ug/hug.png" },
    ],
  },
  un: {
    id: "un",
    rime: "un",
    tiles: ["s", "b", "r"],
    items: [
      { onset: "s", rime: "un", word: "sun", img: "/games/maw/un/sun.png" },
      { onset: "b", rime: "un", word: "bun", img: "/games/maw/un/bun.png" },
      { onset: "r", rime: "un", word: "run", img: "/games/maw/un/run.png" },
    ],
  },
  ut: {
    id: "ut",
    rime: "ut",
    tiles: ["n", "c", "h"],
    items: [
      { onset: "n", rime: "ut", word: "nut", img: "/games/maw/ut/nut.png" },
      { onset: "c", rime: "ut", word: "cut", img: "/games/maw/ut/cut.png" },
      { onset: "h", rime: "ut", word: "hut", img: "/games/maw/ut/hut.png" },
    ],
  },
};

const EMOJI: Record<string, string> = {
  cat: "🐱",
  bat: "🦇",
  hat: "🎩",
  rat: "🐭",
  mat: "🧺",
  can: "🥫",
  man: "👨",
  pan: "🍳",
  fan: "🪭",
  van: "🚐",
  cap: "🧢",
  map: "🗺️",
  tap: "🚰",
  nap: "😴",
  jam: "🍓",
  ham: "🍖",
  yam: "🍠",
  dad: "👨‍👧",
  sad: "😢",
  mad: "😠",
  pad: "📝",
  bag: "🎒",
  tag: "🏷️",
  rag: "🧽",
  pet: "🐶",
  net: "🥅",
  jet: "✈️",
  wet: "💧",
  vet: "🩺",
  pen: "🖊️",
  hen: "🐔",
  den: "🏠",
  ten: "🔟",
  bed: "🛏️",
  red: "🔴",
  fed: "🍽️",
  pin: "📌",
  bin: "🗑️",
  fin: "🐟",
  win: "🏆",
  tin: "🥫",
  lip: "👄",
  sip: "🥤",
  tip: "💡",
  zip: "🤐",
  dip: "🥣",
  pig: "🐷",
  dig: "⛏️",
  fig: "🍈",
  wig: "🧑‍🦱",
  dog: "🐶",
  log: "🪵",
  fog: "🌫️",
  hop: "🐇",
  top: "🔝",
  mop: "🧹",
  pop: "🍿",
  pot: "🍲",
  dot: "⚫",
  cot: "🛏️",
  hot: "🔥",
  bug: "🐞",
  mug: "☕",
  rug: "🧶",
  jug: "🏺",
  hug: "🤗",
  sun: "☀️",
  bun: "🥯",
  run: "🏃",
  nut: "🥜",
  cut: "✂️",
  hut: "🛖",
  elephant: "🐘",
  fish: "🐟",
  tiger: "🐯",
  queen: "👑",
};

// NOTE: TTS consonant sounds are imperfect. Replace with recorded phoneme audio when available.
const LETTER_PHONEME: Record<string, string> = {
  b: "buh",
  c: "kuh",
  d: "duh",
  f: "fuh",
  g: "guh",
  h: "huh",
  j: "juh",
  k: "kuh",
  l: "luh",
  m: "muh",
  n: "nuh",
  p: "puh",
  r: "ruh",
  s: "sss",
  t: "tuh",
  v: "vuh",
  w: "wuh",
  y: "yuh",
  z: "zuh",
};

const CONFETTI_COLORS = [
  "#ff6f91",
  "#ff9671",
  "#ffc75f",
  "#f9f871",
  "#6efacc",
  "#72ddf7",
  "#c3aed6",
  "#ff6bd6",
];

const CHEERS = ["YAY! 🎉", "GREAT JOB! 🌟", "WOOHOO! 🥳", "SUPER! ⭐", "NICE! 😄"];

function safeRequestFullscreen(el: HTMLElement) {
  const anyEl = el as any;
  const fn =
    el.requestFullscreen ||
    anyEl.webkitRequestFullscreen ||
    anyEl.mozRequestFullScreen ||
    anyEl.msRequestFullscreen;

  if (fn) {
    try {
      fn.call(el);
    } catch {
      // ignore
    }
  }
}

function safeExitFullscreen() {
  const d: any = document as any;
  const isFs =
    !!document.fullscreenElement ||
    !!d.webkitFullscreenElement ||
    !!d.mozFullScreenElement ||
    !!d.msFullscreenElement;
  if (!isFs) return;

  const isActive =
    document.visibilityState !== "hidden" &&
    (typeof document.hasFocus !== "function" || document.hasFocus());
  if (!isActive) return;

  const fn =
    document.exitFullscreen ||
    d.webkitExitFullscreen ||
    d.mozCancelFullScreen ||
    d.msExitFullscreen;

  if (!fn) return;

  try {
    const maybePromise = fn.call(document);
    if (maybePromise && typeof maybePromise.catch === "function") {
      maybePromise.catch(() => {});
    }
  } catch {
    // ignore
  }
}

const makeTiles = (family: FamilyConfig): Tile[] =>
  family.tiles.map((ch, index) => ({ id: `${family.id}-${ch}-${index}`, ch }));

const makeConfettiPieces = (count: number, baseDur: number): ConfettiPiece[] => {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    id: `${now}-${i}`,
    leftPct: Math.random() * 100,
    delayMs: Math.random() * 220,
    durMs: baseDur + Math.random() * 550,
    rot: Math.random() * 360,
    size: 6 + Math.random() * 9,
    bg: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  }));
};

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

type MakeAWordRimeGameProps = {
  forceAnonymousMode?: boolean;
  missionReturnHrefOverride?: string;
  missionBackLabel?: string;
  forcedFamilyId?: string;
  activityContextLabelOverride?: string;
  disableAudio?: boolean;
  publicSpellingAdventure?: boolean;
};

type PublicSpellingAdventureProps = {
  missionReturnHref: string;
  missionBackLabel: string;
  activityContextLabel?: string;
};

function PublicSpellingAdventure({
  missionReturnHref,
  missionBackLabel,
  activityContextLabel,
}: PublicSpellingAdventureProps) {
  const navigate = useNavigate();
  const [screen, setScreen] = useState<"intro" | "play" | "complete">("intro");
  const [levelIndex, setLevelIndex] = useState(0);
  const [queue, setQueue] = useState<PublicSpellingChallenge[]>([]);
  const [builtLetters, setBuiltLetters] = useState<string[]>([]);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [feedback, setFeedback] = useState<"idle" | "correct" | "wrong">("idle");
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [currentWrongCount, setCurrentWrongCount] = useState(0);
  const [imgOk, setImgOk] = useState(true);
  const [correctChallenges, setCorrectChallenges] = useState(0);
  const [scoredCoreChallenges, setScoredCoreChallenges] = useState(0);
  const [completedCoreChallenges, setCompletedCoreChallenges] = useState(0);
  const [completedChallenges, setCompletedChallenges] = useState(0);
  const advanceTimeoutRef = useRef<number | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);
  const typedSubmissionLockRef = useRef(false);

  const currentLevel = PUBLIC_SPELLING_LEVELS[levelIndex] ?? PUBLIC_SPELLING_LEVELS[0];
  const current = queue[0] ?? currentLevel.challenges[0];
  const totalChallenges = PUBLIC_SPELLING_LEVELS.reduce((sum, level) => sum + level.challenges.length, 0);
  const displayedProgress = Math.min(totalChallenges, completedCoreChallenges);
  const accuracy = scoredCoreChallenges > 0
    ? Math.round((correctChallenges / scoredCoreChallenges) * 100)
    : 100;

  useEffect(() => {
    setImgOk(true);
    setBuiltLetters([]);
    setTypedAnswer("");
    typedSubmissionLockRef.current = false;
    setFeedback("idle");
    setCurrentWrongCount(0);
  }, [current?.id]);

  useEffect(() => () => {
    if (advanceTimeoutRef.current !== null) window.clearTimeout(advanceTimeoutRef.current);
    if (feedbackTimeoutRef.current !== null) window.clearTimeout(feedbackTimeoutRef.current);
  }, []);

  const goBack = () => {
    navigate(missionReturnHref, { replace: true });
  };

  const startLevel = (index: number) => {
    if (advanceTimeoutRef.current !== null) window.clearTimeout(advanceTimeoutRef.current);
    if (feedbackTimeoutRef.current !== null) window.clearTimeout(feedbackTimeoutRef.current);
    advanceTimeoutRef.current = null;
    feedbackTimeoutRef.current = null;
    typedSubmissionLockRef.current = false;
    const safeIndex = Math.max(0, Math.min(index, PUBLIC_SPELLING_LEVELS.length - 1));
    const level = PUBLIC_SPELLING_LEVELS[safeIndex];
    setLevelIndex(safeIndex);
    setQueue(level.challenges);
    setBuiltLetters([]);
    setTypedAnswer("");
    setFeedback("idle");
    setIsAdvancing(false);
    setCurrentWrongCount(0);
    setScreen("play");
  };

  const startFreshAtLevel = (index: number) => {
    const safeIndex = Math.max(0, Math.min(index, PUBLIC_SPELLING_LEVELS.length - 1));
    const completedBefore = PUBLIC_SPELLING_LEVELS
      .slice(0, safeIndex)
      .reduce((sum, level) => sum + level.challenges.length, 0);
    setCorrectChallenges(0);
    setScoredCoreChallenges(0);
    setCompletedCoreChallenges(completedBefore);
    setCompletedChallenges(0);
    startLevel(safeIndex);
  };

  const startJourney = () => {
    startFreshAtLevel(0);
  };

  const replayJourney = () => {
    startFreshAtLevel(0);
  };

  const goToNextChallenge = (hadError: boolean) => {
    advanceTimeoutRef.current = window.setTimeout(() => {
      setQueue((prev) => {
        if (prev.length === 0) return prev;
        const [done, ...rest] = prev;
        let nextQueue = rest;
        if (hadError && !done.review && done.reviewEligible !== false) {
          const reviewChallenge = { ...done, id: `${done.id}-review`, review: true };
          const insertAt = Math.min(2, nextQueue.length);
          nextQueue = [
            ...nextQueue.slice(0, insertAt),
            reviewChallenge,
            ...nextQueue.slice(insertAt),
          ];
        }
        if (nextQueue.length > 0) return nextQueue;

        const nextLevelIndex = levelIndex + 1;
        if (nextLevelIndex < PUBLIC_SPELLING_LEVELS.length) {
          const nextLevel = PUBLIC_SPELLING_LEVELS[nextLevelIndex];
          setLevelIndex(nextLevelIndex);
          return nextLevel.challenges;
        }

        setScreen("complete");
        return [];
      });
      setBuiltLetters([]);
      setTypedAnswer("");
      setFeedback("idle");
      setIsAdvancing(false);
      setCurrentWrongCount(0);
      advanceTimeoutRef.current = null;
    }, 900);
  };

  const markCorrect = () => {
    if (isAdvancing) return;
    const hadError = currentWrongCount > 0;
    setCompletedChallenges((value) => value + 1);
    if (!current.review) {
      setScoredCoreChallenges((value) => value + 1);
      setCompletedCoreChallenges((value) => value + 1);
      if (!hadError) setCorrectChallenges((value) => value + 1);
    }
    setFeedback("correct");
    setIsAdvancing(true);
    goToNextChallenge(hadError);
  };

  const markWrong = () => {
    if (isAdvancing) return;
    setCurrentWrongCount((value) => value + 1);
    setFeedback("wrong");
    feedbackTimeoutRef.current = window.setTimeout(() => {
      typedSubmissionLockRef.current = false;
      setFeedback("idle");
      feedbackTimeoutRef.current = null;
    }, 520);
  };

  const handleBuildLetter = (letter: string) => {
    if (!current || current.mode !== "build" || isAdvancing) return;
    const expected = current.word[builtLetters.length];
    if (letter !== expected) {
      markWrong();
      return;
    }
    const nextLetters = [...builtLetters, letter];
    setBuiltLetters(nextLetters);
    if (nextLetters.join("") === current.word) {
      markCorrect();
    }
  };

  const handleOption = (value: string) => {
    if (!current || isAdvancing) return;
    const expected =
      current.mode === "choice"
        ? current.word
        : current.mode === "family" || current.mode === "missing"
          ? current.onset
          : "";
    if (value === expected) markCorrect();
    else markWrong();
  };

  const checkTypedAnswer = () => {
    if (
      !current ||
      (current.mode !== "fix" && current.mode !== "spell") ||
      isAdvancing ||
      typedSubmissionLockRef.current ||
      feedback !== "idle" ||
      normalizePublicSpellingAnswer(typedAnswer) === ""
    ) return;

    typedSubmissionLockRef.current = true;
    if (normalizePublicSpellingAnswer(typedAnswer) === normalizePublicSpellingAnswer(current.word)) {
      markCorrect();
    } else {
      markWrong();
    }
  };

  const handleTypedSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    checkTypedAnswer();
  };

  const renderPicture = (challenge: PublicSpellingChallenge) => (
    <div className="flex h-28 w-28 items-center justify-center rounded-3xl border border-white/35 bg-white/25 shadow-inner sm:h-36 sm:w-36">
      {challenge.img && imgOk ? (
        <img
          src={challenge.img}
          alt={challenge.word}
          draggable={false}
          className="h-24 w-24 object-contain sm:h-32 sm:w-32"
          onError={() => setImgOk(false)}
        />
      ) : (
        <div className="text-6xl sm:text-7xl" aria-label={challenge.word}>
          {challenge.emojiFallback ?? EMOJI[challenge.word] ?? "⭐"}
        </div>
      )}
    </div>
  );

  const renderBuildChallenge = (challenge: Extract<PublicSpellingChallenge, { mode: "build" }>) => {
    const letters = challenge.word.split("");
    return (
      <>
        <div className="flex justify-center gap-2" aria-label={`Build ${challenge.word}`}>
          {letters.map((letter, index) => (
            <div
              key={`${challenge.id}-slot-${index}`}
              className={[
                "flex h-12 w-12 items-center justify-center rounded-xl border-2 text-2xl font-black sm:h-16 sm:w-16 sm:rounded-2xl sm:text-3xl",
                builtLetters[index]
                  ? "border-emerald-300 bg-emerald-100 text-emerald-900"
                  : "border-sky-300 bg-white/85 text-slate-400",
              ].join(" ")}
            >
              {builtLetters[index] ?? ""}
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {(challenge.tiles ?? letters).map((letter, index) => (
            <button
              key={`${challenge.id}-tile-${letter}-${index}`}
              type="button"
              disabled={isAdvancing}
              onClick={() => handleBuildLetter(letter)}
              className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-sky-300 bg-sky-100 text-3xl font-black text-slate-950 shadow-sm transition hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-yellow-300 disabled:opacity-55 sm:h-16 sm:w-16 sm:text-4xl"
              aria-label={`Letter ${letter}`}
            >
              {letter}
            </button>
          ))}
        </div>
      </>
    );
  };

  const renderFamilyChallenge = (challenge: Extract<PublicSpellingChallenge, { mode: "family" }>) => (
    <>
      <div className="flex items-center justify-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-sky-300 bg-white/85 text-3xl font-black text-slate-400">
          ?
        </div>
        <div className="text-6xl font-black text-slate-950">{challenge.rime}</div>
      </div>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        {(challenge.tiles ?? []).map((letter) => (
          <button
            key={`${challenge.id}-${letter}`}
            type="button"
            disabled={isAdvancing}
            onClick={() => handleOption(letter)}
            className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-sky-300 bg-sky-100 text-4xl font-black text-slate-950 shadow-sm transition hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-yellow-300 disabled:opacity-55"
            aria-label={`Letter ${letter}`}
          >
            {letter}
          </button>
        ))}
      </div>
    </>
  );

  const renderMissingChallenge = (challenge: Extract<PublicSpellingChallenge, { mode: "missing" }>) => (
    <>
      <div className="text-center text-6xl font-black tracking-wide text-slate-950">
        {challenge.pattern}
      </div>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        {(challenge.tiles ?? []).map((letter) => (
          <button
            key={`${challenge.id}-${letter}`}
            type="button"
            disabled={isAdvancing}
            onClick={() => handleOption(letter)}
            className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-sky-300 bg-sky-100 text-4xl font-black text-slate-950 shadow-sm transition hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-yellow-300 disabled:opacity-55"
            aria-label={`Missing letter ${letter}`}
          >
            {letter}
          </button>
        ))}
      </div>
    </>
  );

  const renderChoiceChallenge = (challenge: Extract<PublicSpellingChallenge, { mode: "choice" }>) => (
    <div className="grid gap-3 sm:grid-cols-3">
      {(challenge.choices ?? []).map((choice) => (
        <button
          key={`${challenge.id}-${choice}`}
          type="button"
          disabled={isAdvancing}
          onClick={() => handleOption(choice)}
          className="rounded-2xl border-2 border-sky-300 bg-white px-4 py-4 text-2xl font-black text-slate-950 shadow-sm transition hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-yellow-300 disabled:opacity-55"
          aria-label={`Spelling ${choice}`}
        >
          {choice}
        </button>
      ))}
    </div>
  );

  const renderTypedChallenge = (
    challenge: Extract<PublicSpellingChallenge, { mode: "fix" | "spell" }>,
  ) => (
    <form onSubmit={handleTypedSubmit} className="mx-auto max-w-md text-left">
      {challenge.mode === "fix" ? (
        <div className="mb-5 text-center">
          <span className="sr-only">Incorrect spelling:</span>
          <span className="inline-block rounded-2xl border-2 border-rose-200 bg-rose-50 px-6 py-3 text-4xl font-black text-slate-950 line-through decoration-rose-500 decoration-4">
            {challenge.incorrectSpelling}
          </span>
        </div>
      ) : null}
      <label htmlFor={`spelling-answer-${challenge.id}`} className="block text-sm font-black text-slate-700">
        {challenge.mode === "fix" ? "Correct spelling" : "Your spelling"}
      </label>
      <input
        id={`spelling-answer-${challenge.id}`}
        type="text"
        value={typedAnswer}
        onChange={(event) => setTypedAnswer(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          checkTypedAnswer();
        }}
        disabled={isAdvancing}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        enterKeyHint="done"
        className="mt-2 min-h-14 w-full rounded-2xl border-2 border-sky-300 bg-white px-4 py-3 text-center text-3xl font-black text-slate-950 shadow-inner outline-none transition focus:border-sky-600 focus:ring-4 focus:ring-yellow-300 disabled:opacity-60"
        aria-describedby={`spelling-instruction-${challenge.id}`}
      />
      <span id={`spelling-instruction-${challenge.id}`} className="sr-only">
        Type the word, then press Enter or choose Check Answer.
      </span>
      <button
        type="submit"
        disabled={isAdvancing || feedback !== "idle" || normalizePublicSpellingAnswer(typedAnswer) === ""}
        className="mt-4 min-h-12 w-full rounded-full bg-slate-950 px-6 py-3 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Check Answer
      </button>
    </form>
  );

  const renderCurrentChallenge = () => {
    if (!current) return null;
    if (current.mode === "build") return renderBuildChallenge(current);
    if (current.mode === "family") return renderFamilyChallenge(current);
    if (current.mode === "missing") return renderMissingChallenge(current);
    if (current.mode === "choice") return renderChoiceChallenge(current);
    return renderTypedChallenge(current);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_30%,#8be8ff_0%,#64d2ff_32%,#ff6aa8_100%)] px-2 py-2 text-slate-950 sm:px-3 sm:py-3"
      data-testid="public-spelling-adventure"
    >
      <div className="absolute left-2 top-2 right-2 z-10 flex min-w-0 items-center justify-between gap-2 sm:left-5 sm:right-5 sm:top-5">
        <div className="min-w-0 truncate rounded-full border border-white/40 bg-white/25 px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-white shadow-sm sm:px-4 sm:text-xs sm:tracking-[0.14em]">
          {activityContextLabel ?? "Guest Play Mode • Spelling Adventure"}
        </div>
        <button
          type="button"
          onClick={goBack}
          className="shrink-0 rounded-full border border-white/45 bg-white/20 px-3 py-2 text-[10px] font-black text-white shadow-sm transition hover:bg-white/30 focus:outline-none focus:ring-4 focus:ring-yellow-200 sm:px-4 sm:text-xs"
        >
          {missionBackLabel}
        </button>
      </div>

      {screen === "intro" && (
        <section className="mt-12 max-h-[calc(100vh-4rem)] w-[min(980px,96vw)] overflow-y-auto rounded-[24px] border border-white/45 bg-white/90 p-4 shadow-2xl sm:rounded-[28px] sm:p-7">
          <div className="text-center">
            <h2 className="text-3xl font-black text-slate-950 sm:text-4xl">Spelling Adventure</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-600 sm:text-base">
              Build words, complete missing letters, fix mistakes, and spell whole words. No audio needed.
            </p>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PUBLIC_SPELLING_LEVELS.map((level, index) => (
              <button
                key={level.id}
                type="button"
                onClick={() => startFreshAtLevel(index)}
                aria-label={`Start at ${level.title}`}
                className="rounded-2xl border-2 border-sky-200 bg-sky-50 px-4 py-5 text-left shadow-sm transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-yellow-300"
              >
                <div className="text-xs font-black uppercase tracking-[0.14em] text-sky-700">
                  Step {index + 1}
                </div>
                <div className="mt-1 text-xl font-black text-slate-950">{level.title}</div>
                <div className="mt-2 text-sm font-semibold leading-5 text-slate-600">{level.instruction}</div>
              </button>
            ))}
          </div>
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={startJourney}
              className="rounded-full bg-slate-950 px-7 py-3 text-sm font-black uppercase tracking-[0.12em] text-white shadow-lg transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-yellow-300"
            >
              Start Spelling Adventure
            </button>
          </div>
        </section>
      )}

      {screen === "play" && current && (
        <main className="mt-12 flex h-[calc(100vh-3.5rem)] min-h-0 w-[min(1040px,98vw)] flex-col overflow-hidden rounded-[22px] border border-white/45 bg-white/92 p-3 shadow-2xl sm:mt-14 sm:h-[calc(100vh-4.5rem)] sm:w-[min(1040px,96vw)] sm:rounded-[28px] sm:p-5">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.16em] text-sky-700">
                Step {levelIndex + 1} of {PUBLIC_SPELLING_LEVELS.length}
              </div>
              <h2 className="text-2xl font-black text-slate-950 sm:text-3xl">{currentLevel.title}</h2>
            </div>
            <div className="flex max-w-full items-center gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Spelling adventure steps">
              {PUBLIC_SPELLING_LEVELS.map((level, index) => (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => startFreshAtLevel(index)}
                  className={[
                    "shrink-0 rounded-full px-3 py-2 text-xs font-black transition focus:outline-none focus:ring-4 focus:ring-yellow-300",
                    index === levelIndex
                      ? "bg-slate-950 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                  ].join(" ")}
                  aria-label={`Go to ${level.title}`}
                  role="tab"
                  aria-selected={index === levelIndex}
                >
                  {level.shortTitle}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${Math.max(4, (displayedProgress / totalChallenges) * 100)}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs font-bold text-slate-500">
            <span>{Math.min(queue.length, currentLevel.challenges.length)} left in this step</span>
            <span>{displayedProgress}/{totalChallenges} done</span>
          </div>

          <div className="grid min-h-0 flex-1 items-center gap-3 overflow-y-auto py-2 sm:gap-4 sm:py-3 lg:grid-cols-[0.42fr_0.58fr]">
            <section className="flex flex-col items-center justify-center rounded-3xl bg-sky-100/80 p-4 text-center">
              {current.mode === "spell" && !current.img ? (
                <div className="flex h-28 w-28 items-center justify-center rounded-3xl border border-white/35 bg-white/25 text-6xl shadow-inner sm:h-36 sm:w-36" aria-hidden="true">
                  💭
                </div>
              ) : renderPicture(current)}
              <p className="mt-4 text-lg font-black text-slate-950">{current.clue}</p>
              {current.review ? (
                <span className="mt-3 rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-amber-800">
                  Review
                </span>
              ) : null}
            </section>

            <section
              className={[
                "relative rounded-3xl border-2 p-4 text-center shadow-inner sm:p-6",
                feedback === "wrong"
                  ? "border-rose-300 bg-rose-50"
                  : feedback === "correct"
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-sky-200 bg-white",
              ].join(" ")}
            >
              <p className="mb-5 text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                {currentLevel.instruction}
              </p>
              {renderCurrentChallenge()}
              <div className="mt-5 min-h-[34px] text-lg font-black">
                {feedback === "wrong" ? (
                  <span className="text-rose-700">Try again.</span>
                ) : feedback === "correct" ? (
                  <span className="text-emerald-700">Correct: {current.word}</span>
                ) : (
                  <span className="text-slate-500">
                    {current.mode === "fix" || current.mode === "spell" ? "Type carefully." : "Choose carefully."}
                  </span>
                )}
              </div>
            </section>
          </div>
        </main>
      )}

      {screen === "complete" && (
        <section className="mt-12 w-[min(680px,94vw)] rounded-[28px] border border-white/45 bg-white/92 p-6 text-center shadow-2xl sm:p-8">
          <h2 className="text-4xl font-black text-slate-950">Spelling Journey Complete!</h2>
          <p className="mt-3 text-base font-semibold text-slate-600">
            You completed the spelling journey. First-try accuracy: {accuracy}% • Turns played: {completedChallenges}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={replayJourney}
              className="rounded-full bg-slate-950 px-6 py-3 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-yellow-300"
            >
              Replay
            </button>
            <button
              type="button"
              onClick={goBack}
              className="rounded-full bg-sky-100 px-6 py-3 text-sm font-black uppercase tracking-[0.12em] text-slate-950 transition hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-yellow-300"
            >
              {missionBackLabel}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export default function MakeAWordRimeGame(props: MakeAWordRimeGameProps = {}) {
  const {
    forceAnonymousMode = false,
    missionReturnHrefOverride,
    missionBackLabel = "← Back to Mission",
    activityContextLabelOverride,
    disableAudio = false,
    publicSpellingAdventure = false,
  } = props;
  const [sp] = useSearchParams();
  const kidId = forceAnonymousMode ? "" : sp.get("kidId") || localStorage.getItem("ts_active_kid_v1") || "";
  const missionReturnHref = missionReturnHrefOverride ?? buildMissionReturnHref(sp, kidId);

  if (forceAnonymousMode && disableAudio && publicSpellingAdventure) {
    return (
      <PublicSpellingAdventure
        missionReturnHref={missionReturnHref}
        missionBackLabel={missionBackLabel}
        activityContextLabel={activityContextLabelOverride}
      />
    );
  }

  return <MakeAWordRimeGameCore {...props} />;
}

function MakeAWordRimeGameCore({
  forceAnonymousMode = false,
  missionReturnHrefOverride,
  missionBackLabel = "← Back to Mission",
  forcedFamilyId,
  activityContextLabelOverride,
  disableAudio = false,
}: MakeAWordRimeGameProps = {}) {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const kidId = forceAnonymousMode ? "" : sp.get("kidId") || localStorage.getItem("ts_active_kid_v1") || "";
  const missionReturnHref = missionReturnHrefOverride ?? buildMissionReturnHref(sp, kidId);
  const publicNonAudioMode = forceAnonymousMode && disableAudio;
  const resolvedForcedFamilyId = forcedFamilyId && FAMILIES[forcedFamilyId] ? forcedFamilyId : null;

  // Celebration (shorter + calmer than before)
  const CONFETTI_MS = 2800;

  const [screen, setScreen] = useState<Screen>("levels");
  const [phase, setPhase] = useState<PlayPhase>("cue");

  const [familyId, setFamilyId] = useState<string>(resolvedForcedFamilyId ?? "at");
  const family = FAMILIES[familyId] ?? FAMILIES.at;

  const [tiles, setTiles] = useState<Tile[]>(() => makeTiles(family));

  // Practice queue (spaced review inside the level)
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const currentEntry = useMemo(() => queue.find((q) => q.dueIn <= 0) ?? null, [queue]);
  const current = currentEntry?.item ?? family.items[0];

  // Round learning state
  const [placed, setPlaced] = useState<string | null>(null);
  const [flash, setFlash] = useState<"none" | "green" | "wrong">("none");
  const [showBuiltWord, setShowBuiltWord] = useState(false);
  const [imgOk, setImgOk] = useState(true);

  const [wrongCount, setWrongCount] = useState(0);
  const [hintLevel, setHintLevel] = useState(0); // 0 none, 1 highlight correct, 2 guided soon, 3 reduce choices
  const [pulseCorrect, setPulseCorrect] = useState(false);

  // support-adaptive difficulty
  const [independentStreak, setIndependentStreak] = useState(0);

  // timing + telemetry
  const [actStartMs, setActStartMs] = useState<number>(0);
  const [hasActedThisRound, setHasActedThisRound] = useState(false);
  const [firstActionMs, setFirstActionMs] = useState<number | null>(null);

  // celebration UI
  const [cheer, setCheer] = useState<string | null>(null);
  const [isCelebrating, setIsCelebrating] = useState(false);

  // confetti
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const confettiClearRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const familyRunStartedAtRef = useRef<number>(Date.now());
  const completionRecordedRef = useRef(false);

  // layout refs
  const rootRef = useRef<HTMLDivElement | null>(null);
  const blankRef = useRef<HTMLDivElement | null>(null);

  // pointer drag state
  const dragRef = useRef<{
    tileId: string;
    ch: string;
    pointerId: number;
    startX: number;
    startY: number;
    baseCenter: { x: number; y: number };
    dx: number;
    dy: number;
    didDrag: boolean;
  } | null>(null);

  const rafRef = useRef<number | null>(null);
  const latestMoveRef = useRef<{ dx: number; dy: number } | null>(null);

  const [dragState, setDragState] = useState<{ tileId: string; dx: number; dy: number } | null>(
    null
  );
  const [nearState, setNearState] = useState<{ isNear: boolean; isCorrectNear: boolean }>({
    isNear: false,
    isCorrectNear: false,
  });

  const isComplete = placed === current.onset;

  // Debug key (re-triggers cue effects)
  const animKey = `${familyId}-${currentEntry?.id ?? "none"}`;

  // ---------- Telemetry ----------
  const logEvent = useCallback((name: string, data: Record<string, any>) => {
    const payload = { name, ts: Date.now(), kidId, familyId, ...data };
    // Hook for your app: window.__TS_LOG__(name, payload)
    const anyWin = window as any;
    if (typeof anyWin.__TS_LOG__ === "function") anyWin.__TS_LOG__(name, payload);
    else if (import.meta.env.DEV && anyWin.__TS_DEBUG_GAME_EVENTS__ === true) {
      console.debug("[MAW]", payload);
    }
  }, [kidId, familyId]);

  // ---------- Audio helpers ----------
  const onsetSoundText = useCallback((ch: string) => LETTER_PHONEME[ch.toLowerCase()] ?? ch, []);

  const cancelSpeech = () => {
    if (publicNonAudioMode) return;
    try {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  };

  /**
   * Safe speech: never allows the game to wait forever.
   * Resolves even if speech is blocked/hangs.
   */
  const speakAsyncSafe = (text: string, timeoutMs = 1400) =>
    new Promise<{ started: boolean }>((resolve) => {
      if (publicNonAudioMode) {
        resolve({ started: false });
        return;
      }
      let done = false;
      let started = false;

      const finish = () => {
        if (done) return;
        done = true;
        resolve({ started });
      };

      if (!("speechSynthesis" in window)) return finish();

      const synth = window.speechSynthesis;

      try {
        synth.cancel();
      } catch {
        // ignore
      }

      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.9;
      u.pitch = 1.0;

      const t = window.setTimeout(finish, timeoutMs);

      u.onstart = () => {
        started = true;
      };
      u.onend = () => {
        window.clearTimeout(t);
        finish();
      };
      u.onerror = () => {
        window.clearTimeout(t);
        finish();
      };

      try {
        synth.speak(u);
      } catch {
        window.clearTimeout(t);
        return finish();
      }

      // If blocked, onstart/onend may never fire.
      window.setTimeout(() => {
        const blocked = !synth.speaking && !synth.pending;
        if (blocked) {
          window.clearTimeout(t);
          finish();
        }
      }, 80);
    });

  const speak = useCallback((text: string) => {
    if (publicNonAudioMode) return;
    try {
      if (!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.9;
      u.pitch = 1.0;
      window.speechSynthesis.speak(u);
    } catch {
      // ignore
    }
  }, [publicNonAudioMode]);

  const playCueSequenceSafe = async () => {
    const onset = current.onset.toLowerCase();
    const cue = `${current.word}. First sound: ${onsetSoundText(onset)}.`;
    logEvent("round_cue", { word: current.word, onset, rime: current.rime, queueLen: queue.length });
    return speakAsyncSafe(cue, 1400);
  };

  const speakFirstSound = useCallback(() => {
    const ch = current.onset.toLowerCase();
    speak(`First sound: ${onsetSoundText(ch)}`);
  }, [current.onset, onsetSoundText, speak]);

  const speakWord = () => speak(current.word);

  const speakBlend = async () => {
    const onset = onsetSoundText(current.onset);
    // Longer timeout is okay here; it does not gate gameplay.
    await speakAsyncSafe(`${onset}. ${current.rime}. ${current.word}.`, 2500);
  };

  // ---------- Celebration ----------
  useEffect(() => {
    if (publicNonAudioMode) return;
    try {
      audioRef.current = new Audio("/confetti.mp3");
      audioRef.current.volume = 0.65;
    } catch {
      audioRef.current = null;
    }
  }, [publicNonAudioMode]);

  const burstConfetti = (big: boolean) => {
    if (confettiClearRef.current) window.clearTimeout(confettiClearRef.current);
    setConfetti(makeConfettiPieces(big ? 90 : 70, 2200));

    try {
      if (!publicNonAudioMode && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    } catch {
      // ignore
    }

    confettiClearRef.current = window.setTimeout(() => setConfetti([]), CONFETTI_MS);
  };

  const showCheer = () => {
    const msg = CHEERS[Math.floor(Math.random() * CHEERS.length)];
    setCheer(msg);
    window.setTimeout(() => setCheer(null), 850);
  };

  // ---------- Fullscreen + global setup ----------
  useEffect(() => {
    setScreen("levels");
  }, []);

  useEffect(() => {
    if (!resolvedForcedFamilyId) return;
    setFamilyId(resolvedForcedFamilyId);
  }, [resolvedForcedFamilyId]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (screen === "levels") safeExitFullscreen();
    if (screen !== "play") setConfetti([]);
    // don’t leave hanging speech when leaving play
    if (screen !== "play") cancelSpeech();
     
  }, [screen]);

  // ---------- Queue initialization / resets ----------
  const initQueueForFamily = (fam: FamilyConfig) => {
    const q: QueueEntry[] = fam.items.map((it) => ({
      id: uid(`q-${fam.id}-${it.word}`),
      item: it,
      dueIn: 0,
      origin: "new",
      repeats: 0,
    }));
    setQueue(q);
  };

  useEffect(() => {
    // Reset everything when family changes
    setTiles(makeTiles(family));
    initQueueForFamily(family);

    setPlaced(null);
    setFlash("none");
    setShowBuiltWord(false);
    setImgOk(true);

    setWrongCount(0);
    setHintLevel(0);
    setPulseCorrect(false);

    setCheer(null);
    setIsCelebrating(false);

    setNearState({ isNear: false, isCorrectNear: false });
    setDragState(null);
    dragRef.current = null;

    setIndependentStreak(0);

    setPhase("cue");
    setHasActedThisRound(false);
    setFirstActionMs(null);

    cancelSpeech();

    if (confettiClearRef.current) window.clearTimeout(confettiClearRef.current);
    setConfetti([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyId]);

  // Reset per new current item (when queue head changes)
  useEffect(() => {
    setPlaced(null);
    setFlash("none");
    setShowBuiltWord(false);
    setImgOk(true);

    setWrongCount(0);
    setHintLevel(0);
    setPulseCorrect(false);

    setCheer(null);
    setIsCelebrating(false);

    setNearState({ isNear: false, isCorrectNear: false });
    setDragState(null);
    dragRef.current = null;

    setPhase("cue");
    setHasActedThisRound(false);
    setFirstActionMs(null);

    cancelSpeech();
     
  }, [animKey]);

  // ✅ FIX #1: Auto cue gating with hard unlock timeout (never stuck on "Listen…")
  useEffect(() => {
    let alive = true;

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const run = async () => {
      if (screen !== "play") return;
      if (!currentEntry) return;

      if (publicNonAudioMode) {
        setPhase("act");
        const now = Date.now();
        setActStartMs(now);
        setHasActedThisRound(false);
        setFirstActionMs(null);
        logEvent("round_start", {
          word: current.word,
          onset: current.onset,
          rime: current.rime,
          origin: currentEntry.origin,
          dueIn: currentEntry.dueIn,
          repeats: currentEntry.repeats,
          audio_disabled: true,
        });
        return;
      }

      setPhase("cue");

      // small visual settle
      await sleep(120);

      const startedAt = Date.now();
      const res = await playCueSequenceSafe();

      if (!alive) return;

      // Hard cap: unlock in <=1200ms total (even if speech was blocked)
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, 1200 - elapsed);
      if (remaining > 0) await sleep(remaining);

      if (!alive) return;

      setPhase("act");
      const now = Date.now();
      setActStartMs(now);
      setHasActedThisRound(false);
      setFirstActionMs(null);

      logEvent("round_start", {
        word: current.word,
        onset: current.onset,
        rime: current.rime,
        origin: currentEntry.origin,
        dueIn: currentEntry.dueIn,
        repeats: currentEntry.repeats,
        speech_blocked: !res.started,
        cue_unlock_ms: Date.now() - startedAt,
      });
    };

    run();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, animKey]);

  // Idle hint: if no action after 3.5s in act phase, hint up
  useEffect(() => {
    if (screen !== "play") return;
    if (phase !== "act") return;
    if (isCelebrating) return;
    if (hasActedThisRound) return;

    const t = window.setTimeout(() => {
      if (screen !== "play") return;
      if (phase !== "act") return;
      if (isCelebrating) return;
      if (hasActedThisRound) return;

      setHintLevel((h) => Math.max(h, 1));
      setPulseCorrect(true);
      window.setTimeout(() => setPulseCorrect(false), 900);
      speakFirstSound();
      logEvent("hint_idle", { word: current.word, hintLevel: Math.max(hintLevel, 1) });
    }, 3500);

    return () => window.clearTimeout(t);
  }, [screen, phase, isCelebrating, hasActedThisRound, animKey, hintLevel, current.word, logEvent, speakFirstSound]);

  // ---------- Navigation ----------
  const goBackToMission = () => {
    safeExitFullscreen();
    cancelSpeech();
    navigate(missionReturnHref, { replace: true });
  };

  const goToFamily = (id: string) => {
    const fam = FAMILIES[id] ?? FAMILIES.at;

    if (confettiClearRef.current) window.clearTimeout(confettiClearRef.current);
    setConfetti([]);

    cancelSpeech();
    familyRunStartedAtRef.current = Date.now();
    completionRecordedRef.current = false;

    setFamilyId(fam.id);
    setTiles(makeTiles(fam));
    initQueueForFamily(fam);
    setPlaced(null);
    setFlash("none");
    setShowBuiltWord(false);
    setImgOk(true);
    setWrongCount(0);
    setHintLevel(0);
    setPulseCorrect(false);
    setCheer(null);
    setIsCelebrating(false);
    setNearState({ isNear: false, isCorrectNear: false });
    setDragState(null);
    dragRef.current = null;
    setIndependentStreak(0);
    setPhase("cue");
    setHasActedThisRound(false);
    setFirstActionMs(null);
    setScreen("play");
  };

  const pickFamily = (id: string) => {
    if (resolvedForcedFamilyId && id !== resolvedForcedFamilyId) return;
    if (rootRef.current) safeRequestFullscreen(rootRef.current);
    goToFamily(id);
  };

  const nextFamily = () => {
    if (resolvedForcedFamilyId) {
      repeatLevel();
      return;
    }
    const i = FAMILY_ORDER.indexOf(familyId as any);
    const next = FAMILY_ORDER[(i + 1) % FAMILY_ORDER.length];
    goToFamily(next);
  };

  const repeatLevel = () => {
    goToFamily(familyId);
  };

  // ---------- Difficulty: adaptive magnet + choices ----------
  const magnetRadius = useMemo(() => {
    const base = 165;
    const tighten = independentStreak * 10;
    const relax = hintLevel * 18 + (wrongCount > 0 ? 10 : 0);
    return clamp(base - tighten + relax, 85, 190);
  }, [independentStreak, hintLevel, wrongCount]);

  const visibleTiles = useMemo(() => {
    const all = tiles;
    const correct = current.onset;
    const correctTile = all.find((t) => t.ch === correct);

    let count = all.length;
    if (hintLevel >= 3) count = Math.min(2, all.length);
    else if (hintLevel === 2) count = Math.min(3, all.length);
    else if (hintLevel === 1) count = Math.min(4, all.length);

    if (!correctTile) return all.slice(0, count);

    const distractors = all.filter((t) => t.ch !== correct);
    const chosen: Tile[] = [correctTile, ...distractors.slice(0, Math.max(0, count - 1))];

    const order = new Map(all.map((t, i) => [t.id, i]));
    chosen.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    return chosen;
  }, [tiles, current.onset, hintLevel]);

  // ---------- Target box geometry ----------
  const getBlankCenter = () => {
    const r = blankRef.current?.getBoundingClientRect();
    if (!r) return null;
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };

  // ---------- Round completion + spaced review ----------
  const normalizeQueueAfterRound = (q: QueueEntry[]) => {
    const dec = q.map((e) => ({ ...e, dueIn: Math.max(0, e.dueIn - 1) }));
    const ready = dec.filter((e) => e.dueIn === 0);
    const blocked = dec.filter((e) => e.dueIn > 0);
    return [...ready, ...blocked];
  };

  const finishRoundAndAdvance = (options: {
    reinstateDelay?: number;
    reinstateReason?: "wrong" | "slow";
  }) => {
    const curId = currentEntry?.id;
    if (!curId) return;

    setQueue((prev) => {
      const cur = prev.find((x) => x.id === curId);
      let next = prev.filter((x) => x.id !== curId);

      if (cur && options.reinstateDelay && options.reinstateDelay > 0) {
        const capRepeats = 2;
        const newRepeats = Math.min(capRepeats, (cur.repeats ?? 0) + 1);

        if (newRepeats <= capRepeats) {
          const safeDelay = Math.min(options.reinstateDelay, Math.max(0, next.length));
          next.push({
            id: uid(`review-${familyId}-${cur.item.word}`),
            item: cur.item,
            dueIn: safeDelay,
            origin: "review",
            repeats: newRepeats,
          });
        }
      }

      next = normalizeQueueAfterRound(next);
      return next;
    });
  };

  useEffect(() => {
    if (screen !== "play") return;
    if (queue.length === 0) setScreen("complete");
  }, [queue.length, screen]);

  useEffect(() => {
    if (screen !== "complete") return;
    if (completionRecordedRef.current) return;
    completionRecordedRef.current = true;
    if (!kidId) return;

    const levelIndex = FAMILY_ORDER.indexOf(familyId as any);
    const levelId = levelIndex >= 0 ? levelIndex + 1 : 1;
    const timeSpentMs = Math.max(0, Date.now() - familyRunStartedAtRef.current);
    const masteredItems = family.items
      .map((item) => item.word)
      .filter((word) => Boolean(word));

    void recordLevelResult({
      kidId,
      gameId: CANONICAL_GAME_ID,
      progressDocId: CANONICAL_PROGRESS_DOC_ID,
      levelId,
      completed: true,
      timeSpentMs,
      attempts: Math.max(1, masteredItems.length),
      masteredItems,
      skillTags: [
        "area:phonics",
        "subtopic:cvc_word_builder",
        "mode:make_a_word_rime",
        `family:${familyId}`,
      ],
      completedAt: Date.now(),
    } as any).catch((err) => {
      console.error("[MakeAWordRimeGame] recordLevelResult failed:", err);
    });
  }, [screen, kidId, familyId, family.items]);

  // ---------- Feedback handlers ----------
  const correctPlace = async (
    ch: string,
    inputMode: "drag" | "tap",
    opts?: { bypassPhase?: boolean }
  ) => {
    if (isCelebrating) return;
    if (phase !== "act" && !opts?.bypassPhase) return;

    setPhase("feedback");
    setIsCelebrating(true);

    const tFirst = firstActionMs ?? (actStartMs ? Date.now() - actStartMs : null);

    const wasSlow = tFirst !== null && tFirst > 3200;
    const hadErrors = wrongCount > 0;
    const isIndependent = !hadErrors && hintLevel === 0 && !wasSlow;

    setIndependentStreak((s) => (isIndependent ? s + 1 : 0));

    let reinstateDelay = 0;
    let reinstateReason: "wrong" | "slow" | undefined = undefined;

    if (hadErrors) {
      reinstateDelay = 3;
      reinstateReason = "wrong";
    } else if (wasSlow) {
      reinstateDelay = 8;
      reinstateReason = "slow";
    }

    logEvent("attempt", {
      word: current.word,
      onset: current.onset,
      chosen: ch,
      correct: true,
      wrongCount,
      hintLevel,
      inputMode,
      timeToFirstActionMs: tFirst,
      wasSlow,
      reinstateDelay,
      reinstateReason,
      independentStreakBefore: independentStreak,
    });

    setPlaced(ch);
    setFlash("green");
    setShowBuiltWord(false);

    showCheer();
    burstConfetti(false);

    window.setTimeout(() => setShowBuiltWord(true), 220);

    // play blend, but never block UI
    window.setTimeout(() => {
      speakBlend().catch(() => {});
    }, 260);

    window.setTimeout(() => {
      setIsCelebrating(false);
      setFlash("none");
      setPlaced(null);
      setShowBuiltWord(false);
      setHintLevel(0);
      setWrongCount(0);
      setPulseCorrect(false);

      finishRoundAndAdvance({ reinstateDelay, reinstateReason });

      setPhase("cue");
    }, CONFETTI_MS);
  };

  // ✅ FIX #2: Wrong answers never await speech; always unlock quickly (no “minute freeze”)
  const registerWrong = (chosen: string, inputMode: "drag" | "tap") => {
    if (isCelebrating) return;
    if (phase !== "act") return;

    setPhase("feedback");
    setFlash("wrong");

    const tFirst = firstActionMs ?? (actStartMs ? Date.now() - actStartMs : null);
    const nextWrong = wrongCount + 1;
    setWrongCount(nextWrong);

    logEvent("attempt", {
      word: current.word,
      onset: current.onset,
      chosen,
      correct: false,
      wrongCount: nextWrong,
      hintLevel,
      inputMode,
      timeToFirstActionMs: tFirst,
    });

    window.setTimeout(() => setFlash("none"), 320);

    // stop any hanging cue speech
    cancelSpeech();

    const onsetTxt = onsetSoundText(current.onset);

    if (nextWrong === 1) {
      if (!publicNonAudioMode) speak(`Try again. First sound: ${onsetTxt}.`);
      window.setTimeout(() => setPhase("act"), 650);
      return;
    }

    if (nextWrong === 2) {
      setHintLevel((h) => Math.max(h, 1));
      setPulseCorrect(true);
      window.setTimeout(() => setPulseCorrect(false), 1100);
      if (!publicNonAudioMode) speak(`Listen. First sound: ${onsetTxt}.`);
      window.setTimeout(() => setPhase("act"), 800);
      return;
    }

    if (nextWrong === 3) {
      setHintLevel((h) => Math.max(h, 2));
      setPulseCorrect(true);
      window.setTimeout(() => setPulseCorrect(false), 1200);
      if (!publicNonAudioMode) speak(`Let's do it together. First sound: ${onsetTxt}.`);

      // guided success: don’t rely on phase state update timing
      window.setTimeout(() => {
        setPhase("act");
        correctPlace(current.onset, "tap", { bypassPhase: true });
      }, 650);
      return;
    }

    setHintLevel((h) => Math.max(h, 3));
    setPulseCorrect(true);
    window.setTimeout(() => setPulseCorrect(false), 1400);
    if (!publicNonAudioMode) speak(`${current.word}. First sound: ${onsetTxt}. Choose this one.`);
    window.setTimeout(() => setPhase("act"), 900);
  };

  // ---------- Input: drag + tap fallback ----------
  const markFirstActionIfNeeded = () => {
    if (!hasActedThisRound) {
      // ✅ FIX #3: cancel cue audio when child starts acting (no overlap)
      cancelSpeech();
      setHasActedThisRound(true);
      const t = actStartMs ? Date.now() - actStartMs : 0;
      setFirstActionMs(t);
    }
  };

  const getTileCenterFromDrag = (dx: number, dy: number) => {
    const d = dragRef.current;
    if (!d) return null;
    return { x: d.baseCenter.x + dx, y: d.baseCenter.y + dy };
  };

  const startDrag = (e: React.PointerEvent<HTMLDivElement>, tile: Tile) => {
    if (screen !== "play") return;
    if (phase !== "act") return;
    if (isCelebrating) return;
    if (isComplete) return;

    markFirstActionIfNeeded();

    const el = e.currentTarget;
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const rect = el.getBoundingClientRect();
    const baseCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };

    dragRef.current = {
      tileId: tile.id,
      ch: tile.ch,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      baseCenter,
      dx: 0,
      dy: 0,
      didDrag: false,
    };

    setDragState({ tileId: tile.id, dx: 0, dy: 0 });
    setNearState({ isNear: false, isCorrectNear: false });
  };

  const scheduleRafUpdate = () => {
    if (rafRef.current) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      const d = dragRef.current;
      const m = latestMoveRef.current;
      if (!d || !m) return;
      setDragState({ tileId: d.tileId, dx: m.dx, dy: m.dy });
    });
  };

  const moveDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    if (screen !== "play") return;
    if (phase !== "act") return;
    if (isCelebrating) return;
    if (e.pointerId !== d.pointerId) return;

    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;

    if (!d.didDrag && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) d.didDrag = true;

    d.dx = dx;
    d.dy = dy;
    latestMoveRef.current = { dx, dy };
    scheduleRafUpdate();

    const blankC = getBlankCenter();
    if (!blankC) return;

    const tileC = getTileCenterFromDrag(dx, dy);
    if (!tileC) return;

    const distance = dist(tileC, blankC);
    const isNear = distance <= magnetRadius;
    const isCorrectNear = isNear && d.ch === current.onset;

    setNearState({ isNear, isCorrectNear });

    if (isCorrectNear && !isComplete && !isCelebrating) {
      const chosen = d.ch;
      dragRef.current = null;
      setDragState(null);
      setNearState({ isNear: false, isCorrectNear: false });
      correctPlace(chosen, "drag");
    }
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    if (screen !== "play") return;
    if (phase !== "act") return;
    if (isCelebrating) return;
    if (e.pointerId !== d.pointerId) return;

    const { isNear, isCorrectNear } = nearState;

    if (isNear && !isCorrectNear && d.ch !== current.onset && !isComplete) {
      registerWrong(d.ch, "drag");
    }

    dragRef.current = null;
    setDragState(null);
    setNearState({ isNear: false, isCorrectNear: false });

    try {
      (e.currentTarget as any).releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  };

  const tapTile = (tile: Tile) => {
    if (screen !== "play") return;
    if (phase !== "act") return;
    if (isCelebrating) return;
    if (isComplete) return;

    const d = dragRef.current;
    if (d?.tileId === tile.id && d.didDrag) return;

    markFirstActionIfNeeded();

    if (tile.ch === current.onset) correctPlace(tile.ch, "tap");
    else registerWrong(tile.ch, "tap");
  };

  // ---------- Visual states ----------
  const wordCardBg = flash === "green" ? "bg-green-200" : "bg-sky-200";

  const blankGlow =
    nearState.isNear && !isCelebrating
      ? nearState.isCorrectNear
        ? "ring-8 ring-green-300/70"
        : "ring-8 ring-red-300/70"
      : "";

  const isInteractingDisabled = screen !== "play" || phase !== "act" || isCelebrating;

  // ---------- UI ----------
  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: "radial-gradient(circle at 50% 40%, #ff88b5 0%, #ff5fa2 55%, #ff4b96 100%)",
      }}
    >
      {/* Debug badge */}
      {!forceAnonymousMode ? (
        <div className="absolute top-4 left-4 z-[10000] px-3 py-1 rounded-full bg-black/35 text-white text-xs font-extrabold border border-white/20">
          MAW v4 — LISTEN GATE + TAP-PLACE + SPACED REVIEW (FIXED)
        </div>
      ) : null}

      {/* Confetti overlay */}
      {confetti.length > 0 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {confetti.map((c) => (
            <div
              key={c.id}
              className="absolute top-[-20px] rounded-sm"
              style={{
                left: `${c.leftPct}%`,
                width: c.size,
                height: c.size * 1.8,
                background: c.bg,
                transform: `rotate(${c.rot}deg)`,
                animation: `confettiFall ${c.durMs}ms linear forwards`,
                animationDelay: `${c.delayMs}ms`,
                opacity: 0.9,
              }}
            />
          ))}
        </div>
      )}

      {/* Top-right buttons */}
      <div className="absolute top-5 right-5 flex gap-3">
        <button
          className="px-4 py-2 rounded-full bg-white/15 text-white border border-white/30 hover:bg-white/20 active:scale-[0.98] transition"
          onClick={() => rootRef.current && safeRequestFullscreen(rootRef.current)}
        >
          Fullscreen
        </button>

        <button
          className="px-4 py-2 rounded-full bg-white/15 text-white border border-white/30 hover:bg-white/20 active:scale-[0.98] transition"
          onClick={() => setScreen("levels")}
        >
          Levels
        </button>

        <button
          className="px-4 py-2 rounded-full bg-white/15 text-white border border-white/30 hover:bg-white/20 active:scale-[0.98] transition"
          onClick={goBackToMission}
        >
          {missionBackLabel}
        </button>
      </div>

      {/* LEVELS SCREEN */}
      {screen === "levels" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-[28px] p-7 shadow-2xl w-[min(1120px,95vw)] max-h-[86vh] overflow-auto border border-slate-200">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                {activityContextLabelOverride ? (
                  <div className="mb-1 text-xs font-black uppercase tracking-[0.16em] text-sky-700">
                    {activityContextLabelOverride}
                  </div>
                ) : null}
                <div className="text-3xl font-extrabold text-slate-900">Choose a Level</div>
              </div>
              <button
                onClick={goBackToMission}
                className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold transition active:scale-[0.98]"
              >
                {missionBackLabel}
              </button>
            </div>

            <div className="text-slate-600 mb-6">
              {publicNonAudioMode ? (
                <>
                  Look at the picture and word family. Then <b>drag</b> or <b>tap</b> the missing first letter to make the word.
                </>
              ) : (
                <>
                  You’ll <b>listen first</b>, then <b>drag</b> or <b>tap</b> the first letter to make the word.
                  <div className="text-slate-500 text-sm mt-1">
                    If you don’t hear audio, the game will still start — tap 🔊 any time to replay.
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {VOWEL_GROUPS.map((g) => (
                <div
                  key={g.title}
                  className="rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="font-extrabold text-slate-900 text-lg">{g.title}</div>
                    <div className="text-xs font-bold text-slate-500">Word families</div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {g.ids.map((id) => (
                      <button
                        key={id}
                        onClick={() => pickFamily(id)}
                        disabled={Boolean(resolvedForcedFamilyId && id !== resolvedForcedFamilyId)}
                        className={[
                          "h-16 px-5 rounded-2xl border-2 font-extrabold text-2xl leading-none",
                          "bg-white hover:bg-sky-50 border-sky-200 text-slate-900",
                          "shadow-sm hover:shadow-md transition active:scale-[0.98]",
                          "whitespace-nowrap min-w-[90px]",
                          resolvedForcedFamilyId && id !== resolvedForcedFamilyId ? "opacity-35 cursor-not-allowed" : "",
                          familyId === id ? "ring-4 ring-sky-300" : "",
                        ].join(" ")}
                        title={`Play -${id}`}
                      >
                        -{id}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between gap-4 flex-wrap">
              <div className="text-xs text-slate-500">Tip: Wrong answers trigger helpful hints.</div>
              <div className="text-xs text-slate-500">Tap-to-place works for low motor control.</div>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETE SCREEN */}
      {screen === "complete" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/45">
          <div className="bg-white rounded-[28px] p-7 shadow-2xl w-[min(620px,92vw)] text-center border border-slate-200">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-2 animate-[popIn_260ms_ease-out]">
              Level Complete! 🎉
            </h2>
            <div className="text-slate-700 mb-6">
              You finished the <b>-{family.rime}</b> family.
            </div>

            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={() => setScreen("levels")}
                className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-md hover:shadow-lg transition active:scale-[0.98]"
              >
                🧩 Back to Levels
              </button>

              <button
                onClick={nextFamily}
                className="px-6 py-3 rounded-full bg-slate-900 hover:bg-black text-white font-extrabold shadow-md hover:shadow-lg transition active:scale-[0.98]"
              >
                Next Level →
              </button>

              <button
                onClick={repeatLevel}
                className="px-6 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-extrabold shadow-sm hover:shadow-md transition active:scale-[0.98]"
              >
                🔁 Repeat
              </button>
            </div>

            <div className="mt-5">
              <button
                onClick={goBackToMission}
                className="text-sm font-bold text-slate-600 hover:text-slate-900 underline underline-offset-4"
              >
                {missionBackLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PLAY SCREEN */}
      {screen === "play" && (
        <div className="w-full max-w-6xl h-[calc(100vh-90px)] flex flex-col items-center px-6">
          {/* top bar */}
          <div className="w-full flex items-center justify-between pt-3">
            <div className="text-white font-extrabold text-xl">
              Level:{" "}
              <span className="bg-white/15 px-3 py-1 rounded-full border border-white/25">
                -{family.rime}
              </span>
              {!forceAnonymousMode ? (
                <span className="ml-3 text-white/80 text-sm font-bold">(magnet: {magnetRadius}px)</span>
              ) : null}
            </div>

            {publicNonAudioMode ? (
              <div className="px-4 py-2 rounded-full bg-white/15 text-white border border-white/30 font-extrabold">
                Picture clue
              </div>
            ) : (
              <button
                onClick={speakFirstSound}
                disabled={isCelebrating}
                className={[
                  "px-4 py-2 rounded-full bg-white/15 text-white border border-white/30 font-extrabold",
                  "hover:bg-white/20 transition active:scale-[0.98]",
                  isCelebrating ? "opacity-60 cursor-not-allowed" : "",
                ].join(" ")}
                title="Replay first sound"
              >
                🔊 First Sound
              </button>
            )}
          </div>

          {/* letters row */}
          <div className="mt-8 w-full flex justify-center">
            <div className="flex flex-wrap justify-center gap-4">
              {visibleTiles.map((tile) => {
                const isDragging = dragState?.tileId === tile.id;
                const dx = isDragging ? dragState!.dx : 0;
                const dy = isDragging ? dragState!.dy : 0;

                const isCorrectTile = tile.ch === current.onset;
                const shouldPulse = pulseCorrect && isCorrectTile && phase === "act";

                return (
                  <div
                    key={tile.id}
                    onPointerDown={(e) => startDrag(e, tile)}
                    onPointerMove={moveDrag}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                    onClick={() => tapTile(tile)}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" && event.key !== " ") return;
                      event.preventDefault();
                      tapTile(tile);
                    }}
                    className={[
                      "w-24 h-24 rounded-2xl bg-sky-200 shadow-lg border-4 border-sky-300",
                      "flex items-center justify-center select-none",
                      "text-6xl font-black text-black",
                      "touch-none",
                      isInteractingDisabled ? "opacity-60 cursor-not-allowed" : "cursor-grab",
                      isDragging ? "z-50" : "",
                      shouldPulse ? "ring-8 ring-yellow-300/80 animate-[pop_0.35s_ease-out]" : "",
                    ].join(" ")}
                    style={{
                      transform: isDragging ? `translate3d(${dx}px, ${dy}px, 0)` : "translate3d(0,0,0)",
                      transition: isDragging ? "none" : "transform 220ms ease",
                    }}
                    role="button"
                    tabIndex={isInteractingDisabled ? -1 : 0}
                    aria-label={`Letter ${tile.ch}`}
                    title={publicNonAudioMode ? "Drag or tap" : isInteractingDisabled ? "Listen first…" : "Drag or tap"}
                  >
                    {tile.ch}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3 text-white/85 font-semibold text-center">
            {phase === "cue" && !publicNonAudioMode ? (
              <>
                Listening… <span className="text-white/70">(then choose)</span>
              </>
            ) : (
              <>
                Drag <b>or tap</b> the missing first letter 👇
                <div className="text-white/70 text-sm">(Use the picture clue and the -{family.rime} word family.)</div>
              </>
            )}
          </div>

          {/* CENTER: word formation */}
          <div className="flex-1 w-full flex flex-col items-center justify-center">
            <div
              className={[
                "relative w-[min(820px,94vw)] h-[190px] rounded-2xl shadow-xl border-4 border-sky-300",
                wordCardBg,
                flash === "wrong" ? "animate-[shake_0.35s_ease-in-out]" : "",
              ].join(" ")}
              style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.25)" }}
            >
              {cheer && (
                <div className="absolute -top-14 left-1/2 -translate-x-1/2 text-white font-extrabold text-4xl drop-shadow-xl animate-[cheerPop_900ms_ease-out] pointer-events-none">
                  {cheer}
                </div>
              )}

              {!isComplete ? (
                <div className="h-full w-full flex items-center justify-center">
                  <div
                    ref={blankRef}
                    className={[
                      "w-[125px] h-[125px] rounded-2xl border-4 border-sky-300 bg-pink-200/40",
                      "transition",
                      blankGlow,
                      phase === "act" && !isCelebrating ? "cursor-pointer" : "cursor-not-allowed opacity-70",
                      pulseCorrect && phase === "act" ? "ring-8 ring-yellow-300/60" : "",
                    ].join(" ")}
                    aria-label="Target box"
                    title={phase === "act" ? "Target box" : "Preparing…"}
                    onClick={() => {
                      if (publicNonAudioMode) return;
                      if (screen !== "play") return;
                      if (phase === "cue") return;
                      speak(`${current.word}. First sound: ${onsetSoundText(current.onset)}.`);
                      logEvent("box_tap_recue", { word: current.word });
                    }}
                  />
                  <div className="ml-6 text-7xl font-black text-black">{family.rime}</div>
                </div>
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  {!showBuiltWord ? (
                    <div className="flex items-center gap-4 animate-[popIn_200ms_ease-out]">
                      <div className="text-7xl font-black text-slate-900">{placed}</div>
                      <div className="text-5xl font-black text-slate-600">+</div>
                      <div className="text-7xl font-black text-slate-900">{family.rime}</div>
                    </div>
                  ) : (
                    <div className="text-7xl font-black text-green-700 animate-[popIn_220ms_ease-out]">
                      {current.word}
                    </div>
                  )}
                </div>
              )}

              <div className="absolute bottom-3 right-4 text-xs font-bold text-slate-700 bg-white/55 px-3 py-1 rounded-full">
                {queue.length > 0 ? `${Math.max(1, queue.length)} left` : "done"}
              </div>

              {isCelebrating && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="px-8 py-4 rounded-full bg-white/70 text-slate-900 text-4xl font-black shadow-lg animate-[pop_0.35s_ease-out]">
                    YAY! 🎉
                  </div>
                </div>
              )}

              {phase === "cue" && !publicNonAudioMode && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="px-7 py-3 rounded-full bg-white/70 text-slate-900 text-2xl font-black shadow-lg animate-[pop_0.35s_ease-out]">
                    👂 Listen…
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* BOTTOM ROW: image */}
          <div className="w-full flex items-center justify-center pb-8">
            <div
              className="w-44 h-44 md:w-56 md:h-56 flex items-center justify-center"
              onClick={() => {
                if (publicNonAudioMode) return;
                if (screen !== "play") return;
                speakWord();
                logEvent("image_tap_word", { word: current.word });
              }}
              style={{ cursor: screen === "play" ? "pointer" : "default" }}
              title={publicNonAudioMode ? "Picture clue" : "Tap picture to hear the word"}
            >
              {imgOk ? (
                <img
                  src={current.img}
                  alt={current.word}
                  draggable={false}
                  className="w-44 h-44 md:w-56 md:h-56 object-contain"
                  onError={() => setImgOk(false)}
                />
              ) : (
                <div className="w-44 h-44 md:w-56 md:h-56 rounded-3xl bg-white/30 border border-white/40 flex flex-col items-center justify-center shadow-xl">
                  <div className="text-6xl md:text-7xl">{EMOJI[current.word] ?? "✨"}</div>
                  <div className="mt-2 text-white font-extrabold text-lg md:text-xl">{current.word}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* keyframes */}
      <style>
        {`
          @keyframes shake {
            0% { transform: translateX(0); }
            20% { transform: translateX(-8px); }
            40% { transform: translateX(8px); }
            60% { transform: translateX(-6px); }
            80% { transform: translateX(6px); }
            100% { transform: translateX(0); }
          }

          @keyframes popIn {
            0% { transform: scale(0.96); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }

          @keyframes cheerPop {
            0% { transform: translate(-50%, 14px) scale(0.9); opacity: 0; }
            20% { transform: translate(-50%, 0px) scale(1.05); opacity: 1; }
            100% { transform: translate(-50%, -4px) scale(1); opacity: 0.98; }
          }

          @keyframes pop {
            0% { transform: scale(0.85); opacity: 0; }
            60% { transform: scale(1.06); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }

          @keyframes confettiFall {
            0%   { transform: translateY(-30px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(110vh) rotate(720deg); opacity: 0.12; }
          }
        `}
      </style>
    </div>
  );
}
