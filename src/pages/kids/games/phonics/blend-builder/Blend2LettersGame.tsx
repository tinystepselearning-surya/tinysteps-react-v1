import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

// ✅ IMPORTANT: adjust this import if your project path differs.
import { recordLevelResult } from "../../../../../games/engine/recordLevelResult";

// ========================================
// MY FIRST WORDS (replaces Blend Builder)
// ========================================
export type Item = { left: string; right: string; word: string };

type LevelId = "slide_join" | "tap_word";
type VowelGroupId = "short_a" | "short_e" | "short_i" | "short_o" | "short_u";

type VowelGroup = {
  id: VowelGroupId;
  title: string;
  hint?: string;
  // These are the "families" you asked for, but we treat them as VC mini-words to build + hear
  words: string[];
};

export const MY_FIRST_WORDS_META = {
  title: "My First Words",
  tagline: "Level 1: Slide & Join • Level 2: Tap the Word",
} as const;

const GAME_ID = "my_first_words_v1";
const PROGRESS_DOC_ID = "phonics_my_first_words";

const ASSET_BASE = "/games/phonics/blend2letters";
const BUBBLE_LEFT = `${ASSET_BASE}/bubble-left.png`;
const BUBBLE_RIGHT = `${ASSET_BASE}/bubble-right.png`;
const BUBBLE_MERGED = `${ASSET_BASE}/bubble-merged.png`;

// ✅ Your audio files
const SND_CONFETTI = `${ASSET_BASE}/confetti.mp3`;

// Convention already in your code:
const SND_A_TAP = `${ASSET_BASE}/at-initial.mp3`;
const SND_A_DRAG = `${ASSET_BASE}/long-a-sound.mp3`;
const mergeSoundUrl = (word: string) => `${ASSET_BASE}/${word}-sound.mp3`;

const tapSoundUrl = (left: string) => {
  if (left === "a") return SND_A_TAP;
  return `${ASSET_BASE}/${left}-initial.mp3`; // future convention
};
const dragSoundUrl = (left: string) => {
  if (left === "a") return SND_A_DRAG;
  return `${ASSET_BASE}/long-${left}-sound.mp3`; // future convention
};

const VOWEL_GROUPS: VowelGroup[] = [
  {
    id: "short_a",
    title: "Short a families",
    hint: "only families",
    words: ["at", "an", "ap", "ad", "am", "ag"],
  },
  {
    id: "short_e",
    title: "Short e families",
    hint: "only families",
    words: ["et", "en", "ed", "eg"],
  },
  {
    id: "short_i",
    title: "Short i families",
    hint: "only families",
    words: ["it", "in", "ip", "ig"],
  },
  {
    id: "short_o",
    title: "Short o families",
    hint: "only families",
    words: ["ot", "op", "og", "ox"],
  },
  {
    id: "short_u",
    title: "Short u families",
    hint: "only families",
    words: ["ug", "un", "up", "ut"],
  },
] as const;

const LEVELS: { id: LevelId; title: string; subtitle: string }[] = [
  { id: "slide_join", title: "1) Make the Word (Slide & Join)", subtitle: "Slide the sounds together to make a word." },
  { id: "tap_word", title: "2) Tap the Word", subtitle: "Listen and tap the word you hear." },
];

const MAGNET_THRESHOLD = 0.8; // 80%

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function splitVC(word: string): Item {
  return { left: word.slice(0, 1), right: word.slice(1), word };
}

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeTapOptions(target: string, pool: string[]) {
  const others = pool.filter((w) => w !== target);
  const picks = shuffle(others).slice(0, 2);
  return shuffle([target, ...picks]);
}

export default function MyFirstWordsGame() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const kidId =
    searchParams.get("kidId") ||
    localStorage.getItem("ts_active_kid_v1") ||
    "";

  const [activeLevelId, setActiveLevelId] = useState<LevelId>("slide_join");
  const [activeGroupId, setActiveGroupId] = useState<VowelGroupId | null>(null);
  const [isInGameplay, setIsInGameplay] = useState(false);

  const activeLevel = useMemo(() => LEVELS.find((l) => l.id === activeLevelId) ?? LEVELS[0], [activeLevelId]);

  const activeGroup = useMemo(() => {
    if (!activeGroupId) return null;
    return VOWEL_GROUPS.find((g) => g.id === activeGroupId) ?? null;
  }, [activeGroupId]);

  // ----- shared index (slide_join uses it as "item index"; tap_word uses it as "question index")
  const [idx, setIdx] = useState(0);

  // ===== Level 1 (Slide & Join) items =====
  const ITEMS = useMemo(() => {
    if (!activeGroup) return [];
    return activeGroup.words.map((w) => splitVC(w));
  }, [activeGroup]);

  const hasItems = ITEMS.length > 0;
  const isLast = idx >= ITEMS.length - 1;

  const item =
    ITEMS[clamp(idx, 0, Math.max(0, ITEMS.length - 1))] ??
    { left: "a", right: "t", word: "at" };

  // ===== Level 2 (Tap the Word) state =====
  const [tapOrder, setTapOrder] = useState<string[]>([]);
  const tapTarget = useMemo(() => {
    if (!activeGroup) return "at";
    const order = tapOrder.length ? tapOrder : activeGroup.words;
    return order[clamp(idx, 0, order.length - 1)] ?? activeGroup.words[0] ?? "at";
  }, [activeGroup, tapOrder, idx]);

  const [tapOptions, setTapOptions] = useState<string[]>([]);
  const [tapLocked, setTapLocked] = useState(false);
  const [tapPicked, setTapPicked] = useState<string | null>(null);

  // ===== UI refs =====
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const arenaRef = useRef<HTMLDivElement | null>(null);

  const [started, setStarted] = useState(false);

  // Slide/join engine state
  const [merged, setMerged] = useState(false);
  const mergedRef = useRef(false);

  const [merging, setMerging] = useState(false);
  const mergingRef = useRef(false);

  // Progress (0..1) - used by slide/join
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);

  const [isDragging, setIsDragging] = useState(false);

  const [travelPx, setTravelPx] = useState(220);

  const [showBurst, setShowBurst] = useState(false);

  // confetti
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);

  // tracking
  const [attempts, setAttempts] = useState(0);
  const [startTs, setStartTs] = useState<number | null>(null);

  // Tap pop triggers
  const [leftPopKey, setLeftPopKey] = useState(0);
  const [rightPopKey, setRightPopKey] = useState(0);
  const [mergedPopKey, setMergedPopKey] = useState(0);

  // ✅ After-merge swipe (drag merged word to RIGHT to go next)
  const [mergedDragX, setMergedDragX] = useState(0);
  const [isSwipingMerged, setIsSwipingMerged] = useState(false);

  const mergedSwipeRef = useRef<{
    active: boolean;
    startX: number;
  }>({ active: false, startX: 0 });

  // Drag session (window listeners)
  const dragSessionRef = useRef<{ active: boolean; startX: number; moved: boolean }>({
    active: false,
    startX: 0,
    moved: false,
  });
  const suppressClickRef = useRef(false);

  // ===== Audio system =====
  const audioUnlockedRef = useRef(false);

  const tapRef = useRef<HTMLAudioElement | null>(null);
  const dragRefAudio = useRef<HTMLAudioElement | null>(null);
  const mergeWordRef = useRef<string>("");
  const mergeRefAudio = useRef<HTMLAudioElement | null>(null);
  const confettiRef = useRef<HTMLAudioElement | null>(null);

  const tapSrcRef = useRef<string>("");
  const dragSrcRef = useRef<string>("");

  function ensureTapDragAudio(leftLetter: string) {
    const tapSrc = tapSoundUrl(leftLetter);
    const dragSrc = dragSoundUrl(leftLetter);

    if (!tapRef.current || tapSrcRef.current !== tapSrc) {
      tapSrcRef.current = tapSrc;
      tapRef.current = new Audio(tapSrc);
      tapRef.current.preload = "auto";
    }

    if (!dragRefAudio.current || dragSrcRef.current !== dragSrc) {
      dragSrcRef.current = dragSrc;
      dragRefAudio.current = new Audio(dragSrc);
      dragRefAudio.current.preload = "auto";
      dragRefAudio.current.loop = true;
    }

    if (!confettiRef.current) {
      confettiRef.current = new Audio(SND_CONFETTI);
      confettiRef.current.preload = "auto";
      confettiRef.current.loop = false;
      confettiRef.current.volume = 0.35;
    }
  }

  function ensureMergeAudio(word: string) {
    if (mergeWordRef.current === word && mergeRefAudio.current) return;
    mergeWordRef.current = word;
    mergeRefAudio.current = new Audio(mergeSoundUrl(word));
    mergeRefAudio.current.preload = "auto";
    mergeRefAudio.current.loop = false;
  }

  async function unlockAudio() {
    try {
      ensureTapDragAudio(item.left);
      ensureMergeAudio(item.word);

      if (audioUnlockedRef.current) return;

      const list = [tapRef.current, dragRefAudio.current, mergeRefAudio.current, confettiRef.current]
        .filter(Boolean) as HTMLAudioElement[];

      for (const a of list) {
        try {
          a.pause();
          a.currentTime = 0;
          const prevVol = a.volume;
          a.volume = 0;
          const p = a.play();
          if (p && typeof (p as any).then === "function") await p;
          a.pause();
          a.currentTime = 0;
          a.volume = prevVol;
        } catch {}
      }

      audioUnlockedRef.current = true;
    } catch {}
  }

  function stopDragLoop() {
    try {
      const a = dragRefAudio.current;
      if (!a) return;
      a.pause();
      a.currentTime = 0;
    } catch {}
  }

  function startDragLoop() {
    try {
      ensureTapDragAudio(item.left);
      if (!audioUnlockedRef.current) return;

      try {
        tapRef.current?.pause();
        mergeRefAudio.current?.pause();
      } catch {}

      const a = dragRefAudio.current;
      if (!a) return;
      a.loop = true;
      a.currentTime = 0;

      const p = a.play();
      if (p && typeof (p as any).catch === "function") p.catch(() => {});
    } catch {}
  }

  function pauseAllAudio() {
    try {
      stopDragLoop();
      tapRef.current?.pause();
      mergeRefAudio.current?.pause();
      confettiRef.current?.pause();

      if (tapRef.current) tapRef.current.currentTime = 0;
      if (mergeRefAudio.current) mergeRefAudio.current.currentTime = 0;
      if (confettiRef.current) confettiRef.current.currentTime = 0;
    } catch {}
  }

  async function playTap() {
    try {
      ensureTapDragAudio(item.left);
      if (!audioUnlockedRef.current) return;

      stopDragLoop();

      const a = tapRef.current;
      if (!a) return;
      a.pause();
      a.currentTime = 0;

      const p = a.play();
      if (p && typeof (p as any).catch === "function") await p.catch(() => {});
    } catch {}
  }

  async function playWord(word: string) {
    try {
      ensureMergeAudio(word);
      if (!audioUnlockedRef.current) return;

      stopDragLoop();

      const a = mergeRefAudio.current;
      if (!a) return;
      a.pause();
      a.currentTime = 0;

      const p = a.play();
      if (p && typeof (p as any).catch === "function") await p.catch(() => {});
    } catch {}
  }

  async function playConfetti() {
    try {
      ensureTapDragAudio(item.left);
      if (!audioUnlockedRef.current) return;

      const a = confettiRef.current;
      if (!a) return;
      a.pause();
      a.currentTime = 0;

      const p = a.play();
      if (p && typeof (p as any).catch === "function") await p.catch(() => {});
    } catch {}
  }

  function popLeft() { setLeftPopKey((k) => k + 1); }
  function popRight() { setRightPopKey((k) => k + 1); }
  function popMerged() { setMergedPopKey((k) => k + 1); }

  async function requestRealFullscreen() {
    try {
      const el = wrapperRef.current as any;
      if (!el) return;
      if (document.fullscreenElement) return;
      await el.requestFullscreen?.();
    } catch {}
  }

  function exitFullscreenIfAny() {
    try {
      if (document.fullscreenElement) document.exitFullscreen?.();
    } catch {}
  }

  // ===== Instruction text =====
  const instruction = useMemo(() => {
    if (!started) return "Tap Start to play.";

    if (activeLevelId === "tap_word") {
      if (tapLocked && tapPicked === tapTarget) return `Yes! You tapped “${tapTarget}”.`;
      if (tapLocked && tapPicked && tapPicked !== tapTarget) return "Try again.";
      return "Tap 🔊 Listen, then tap the word you hear.";
    }

    // slide_join
    if (merged) return `Nice! You made “${item.word}”.`;
    if (merging) return "Merging...";
    return `Drag “${item.left}” to “${item.right}” to make “${item.word}”.`;
  }, [started, activeLevelId, merged, merging, item, tapLocked, tapPicked, tapTarget]);

  useEffect(() => { mergedRef.current = merged; }, [merged]);
  useEffect(() => { mergingRef.current = merging; }, [merging]);

  // Keep travel distance correct on every screen size
  useEffect(() => {
    const el = arenaRef.current;
    if (!el) return;

    const update = () => {
      const r = el.getBoundingClientRect();
      setTravelPx(Math.max(140, r.width * 0.18)); // 32% -> 50%
    };

    update();

    let ro: ResizeObserver | null = null;
    try {
      ro = new ResizeObserver(() => update());
      ro.observe(el);
    } catch {
      const onResize = () => update();
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }

    return () => ro?.disconnect();
  }, []);

  // preload audio when item changes (slide_join) and when tap target changes (tap_word)
  useEffect(() => {
    ensureTapDragAudio(item.left);
    ensureMergeAudio(item.word);
    pauseAllAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.left, item.word]);

  useEffect(() => {
    if (activeLevelId !== "tap_word") return;
    if (!tapTarget) return;
    ensureMergeAudio(tapTarget);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLevelId, tapTarget]);

  // Reset when switching group or level or entering gameplay
  useEffect(() => {
    setStarted(false);

    // slide_join reset
    setMerged(false);
    setMerging(false);
    setProgress(0);
    progressRef.current = 0;
    setIsDragging(false);
    setShowBurst(false);
    setShowConfetti(false);

    // merged swipe reset
    setMergedDragX(0);
    setIsSwipingMerged(false);
    mergedSwipeRef.current = { active: false, startX: 0 };

    // tap_word reset
    setTapLocked(false);
    setTapPicked(null);
    setTapOptions([]);
    setTapOrder([]);

    setAttempts(0);
    setStartTs(null);

    dragSessionRef.current = { active: false, startX: 0, moved: false };
    suppressClickRef.current = false;

    pauseAllAudio();

    // When tap_word starts, create a fresh shuffled order + first options
    if (isInGameplay && activeLevelId === "tap_word" && activeGroup) {
      const order = shuffle(activeGroup.words);
      setTapOrder(order);
      setIdx(0);
      const target = order[0] ?? activeGroup.words[0];
      setTapOptions(makeTapOptions(target, activeGroup.words));
    }

    // When slide_join starts, reset index
    if (isInGameplay && activeLevelId === "slide_join") {
      setIdx(0);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGroupId, activeLevelId, isInGameplay]);

  useEffect(() => {
    return () => pauseAllAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cleanupDragListeners() {
    window.removeEventListener("mousemove", onWinMouseMove as any);
    window.removeEventListener("mouseup", onWinMouseUp as any);
    window.removeEventListener("touchmove", onWinTouchMove as any);
    window.removeEventListener("touchend", onWinTouchEnd as any);
    window.removeEventListener("touchcancel", onWinTouchEnd as any);
  }

  function goBack() {
    cleanupDragListeners();
    pauseAllAudio();
    exitFullscreenIfAny();
    navigate(`/kids/games/phonics${kidId ? `?kidId=${encodeURIComponent(kidId)}&phase=blend_builder` : "?phase=blend_builder"}`);
  }

  function reset() {
    cleanupDragListeners();
    pauseAllAudio();

    setStarted(false);

    // slide_join
    setMerged(false);
    setMerging(false);
    setProgress(0);
    progressRef.current = 0;
    setIsDragging(false);
    setShowBurst(false);
    setShowConfetti(false);

    // tap_word
    setTapLocked(false);
    setTapPicked(null);

    setAttempts(0);
    setStartTs(null);

    dragSessionRef.current = { active: false, startX: 0, moved: false };
    suppressClickRef.current = false;

    // rebuild tap options for current question
    if (activeLevelId === "tap_word" && activeGroup) {
      setTapOptions(makeTapOptions(tapTarget, activeGroup.words));
    }
  }

  function next() {
    if (!activeGroup) return;

    if (activeLevelId === "slide_join") {
      if (!hasItems) return;
      setIdx((p) => clamp(p + 1, 0, ITEMS.length - 1));
      return;
    }

    // tap_word
    const order = tapOrder.length ? tapOrder : activeGroup.words;
    const last = order.length - 1;
    setTapLocked(false);
    setTapPicked(null);
    setIdx((p) => clamp(p + 1, 0, last));
  }

  function prev() {
    if (!activeGroup) return;

    if (activeLevelId === "slide_join") {
      if (!hasItems) return;
      setIdx((p) => clamp(p - 1, 0, ITEMS.length - 1));
      return;
    }

    // tap_word
    const order = tapOrder.length ? tapOrder : activeGroup.words;
    const last = order.length - 1;
    setTapLocked(false);
    setTapPicked(null);
    setIdx((p) => clamp(p - 1, 0, last));
  }

  async function onStart() {
    setStarted(true);
    if (startTs === null) setStartTs(performance.now());
    await unlockAudio();
    await requestRealFullscreen();

    if (activeLevelId === "tap_word") {
      // auto-generate options for current target
      if (activeGroup) setTapOptions(makeTapOptions(tapTarget, activeGroup.words));
    }
  }

  function fireSuccessFX() {
    setShowBurst(true);
    window.setTimeout(() => setShowBurst(false), 600);

    setConfettiKey((k) => k + 1);
    setShowConfetti(true);
    window.setTimeout(() => setShowConfetti(false), 1100);

    playConfetti();
  }

  function recordProgress(masteredWord: string) {
    if (!kidId) return;

    try {
      const spentMs = startTs ? Math.max(0, Math.round(performance.now() - startTs)) : 0;

      recordLevelResult({
        gameId: GAME_ID,
        progressDocId: PROGRESS_DOC_ID,
        kidId,
        levelId: idx + 1,
        timeSpentMs: spentMs,
        attempts: Math.max(1, attempts),
        masteredItems: [masteredWord],
        skillTags: [
          "area:phonics",
          "subtopic:my_first_words",
          `mode:${activeLevelId}`,
          `group:${activeGroupId ?? "unknown"}`,
          `word:${masteredWord}`,
        ],
        completedAt: Date.now(),
      } as any);
    } catch (err) {
      console.error("recordLevelResult failed:", err);
    }
  }

  // ===== Slide & Join merge flow =====
  function finishMerge() {
    setMerging(false);
    setMerged(true);

    fireSuccessFX();
    popMerged();

    playWord(item.word);
    recordProgress(item.word);
  }

  function setProgressFromDx(dx: number) {
    const p = clamp(dx / travelPx, 0, 1);

    if (p < MAGNET_THRESHOLD) {
      setProgress(p);
      progressRef.current = p;
      return;
    }

    if (!mergedRef.current && !mergingRef.current) {
      stopDragLoop();
      cleanupDragListeners();
      dragSessionRef.current.active = false;
      setIsDragging(false);

      setProgress(1);
      progressRef.current = 1;

      setMerging(true);
      window.setTimeout(() => finishMerge(), 260);
    }
  }

  function endDragTapOrSnap() {
    const moved = dragSessionRef.current.moved;
    dragSessionRef.current.active = false;
    cleanupDragListeners();

    stopDragLoop();

    // tap (not drag)
    if (!moved && !mergedRef.current && !mergingRef.current) {
      popLeft();
      playTap();
      setAttempts((a) => a + 1);
    }

    // dragged but not merged => snap back
    if (moved && progressRef.current < MAGNET_THRESHOLD && !mergedRef.current && !mergingRef.current) {
      setProgress(0);
      progressRef.current = 0;
    }

    setIsDragging(false);

    suppressClickRef.current = true;
    window.setTimeout(() => (suppressClickRef.current = false), 0);
  }

  // ===== Merged bubble swipe-to-next handlers =====
  function cleanupMergedSwipeListeners() {
    window.removeEventListener("mousemove", onMergedWinMouseMove as any);
    window.removeEventListener("mouseup", onMergedWinMouseUp as any);
    window.removeEventListener("touchmove", onMergedWinTouchMove as any);
    window.removeEventListener("touchend", onMergedWinTouchEnd as any);
    window.removeEventListener("touchcancel", onMergedWinTouchEnd as any);
  }

  function advanceAfterMerge() {
    // Move to next word (keep started=true, seamless flow)
    setMerged(false);
    setMerging(false);

    setMergedDragX(0);
    setIsSwipingMerged(false);

    setProgress(0);
    progressRef.current = 0;

    setAttempts(0);
    setStartTs(performance.now()); // restart timer for next item

    setIdx((p) => {
      const max = Math.max(0, ITEMS.length - 1);
      return clamp(p + 1, 0, max);
    });
  }

  function beginMergedSwipe(clientX: number) {
    if (!started) return;
    if (!mergedRef.current) return;
    if (mergingRef.current) return;
    if (isLast) return; // nothing to go to

    mergedSwipeRef.current = { active: true, startX: clientX };
    setIsSwipingMerged(true);

    cleanupMergedSwipeListeners();
    window.addEventListener("mousemove", onMergedWinMouseMove as any);
    window.addEventListener("mouseup", onMergedWinMouseUp as any);
    window.addEventListener("touchmove", onMergedWinTouchMove as any, { passive: false });
    window.addEventListener("touchend", onMergedWinTouchEnd as any);
    window.addEventListener("touchcancel", onMergedWinTouchEnd as any);
  }

  function onMergedWinMouseMove(e: MouseEvent) {
    if (!mergedSwipeRef.current.active) return;

    const dx = e.clientX - mergedSwipeRef.current.startX;
    const swipeMax = Math.max(180, travelPx * 0.9);
    const x = clamp(dx, 0, swipeMax); // only RIGHT
    setMergedDragX(x);
  }

  function onMergedWinMouseUp() {
    if (!mergedSwipeRef.current.active) return;
    endMergedSwipe();
  }

  function onMergedWinTouchMove(e: TouchEvent) {
    if (!mergedSwipeRef.current.active) return;
    e.preventDefault();

    const t = e.touches[0];
    if (!t) return;

    const dx = t.clientX - mergedSwipeRef.current.startX;
    const swipeMax = Math.max(180, travelPx * 0.9);
    const x = clamp(dx, 0, swipeMax);
    setMergedDragX(x);
  }

  function onMergedWinTouchEnd() {
    if (!mergedSwipeRef.current.active) return;
    endMergedSwipe();
  }

  function endMergedSwipe() {
    mergedSwipeRef.current.active = false;
    cleanupMergedSwipeListeners();

    const swipeMax = Math.max(180, travelPx * 0.9);
    const threshold = swipeMax * 0.6;

    if (mergedDragX >= threshold) {
      // animate out to right then advance
      setMergedDragX(swipeMax);
      window.setTimeout(() => {
        advanceAfterMerge();
      }, 140);
    } else {
      // snap back
      setMergedDragX(0);
    }

    window.setTimeout(() => setIsSwipingMerged(false), 0);
  }

  function onWinMouseMove(e: MouseEvent) {
    if (!dragSessionRef.current.active) return;
    if (mergedRef.current || mergingRef.current) return;

    const dx = e.clientX - dragSessionRef.current.startX;

    if (!dragSessionRef.current.moved) {
      if (Math.abs(dx) >= 6) {
        dragSessionRef.current.moved = true;
        setIsDragging(true);
        startDragLoop();
      } else return;
    }

    setProgressFromDx(dx);
  }

  function onWinMouseUp() {
    if (!dragSessionRef.current.active) return;
    endDragTapOrSnap();
  }

  function onWinTouchMove(e: TouchEvent) {
    if (!dragSessionRef.current.active) return;
    if (mergedRef.current || mergingRef.current) return;

    e.preventDefault();

    const t = e.touches[0];
    if (!t) return;

    const dx = t.clientX - dragSessionRef.current.startX;

    if (!dragSessionRef.current.moved) {
      if (Math.abs(dx) >= 6) {
        dragSessionRef.current.moved = true;
        setIsDragging(true);
        startDragLoop();
      } else return;
    }

    setProgressFromDx(dx);
  }

  function onWinTouchEnd() {
    if (!dragSessionRef.current.active) return;
    endDragTapOrSnap();
  }

  function beginDragAt(clientX: number) {
    if (!started) return;
    if (mergedRef.current || mergingRef.current) return;

    dragSessionRef.current = { active: true, startX: clientX, moved: false };
    setIsDragging(false);

    cleanupDragListeners();
    window.addEventListener("mousemove", onWinMouseMove as any);
    window.addEventListener("mouseup", onWinMouseUp as any);
    window.addEventListener("touchmove", onWinTouchMove as any, { passive: false });
    window.addEventListener("touchend", onWinTouchEnd as any);
    window.addEventListener("touchcancel", onWinTouchEnd as any);
  }

  function onLeftMouseDown(e: React.MouseEvent) {
    if (!started) return;
    e.preventDefault();
    e.stopPropagation();
    beginDragAt(e.clientX);
  }

  function onLeftTouchStart(e: React.TouchEvent) {
    if (!started) return;
    const t = e.touches[0];
    if (!t) return;
    e.preventDefault();
    e.stopPropagation();
    beginDragAt(t.clientX);
  }

  // ✅ IMPORTANT FIX: BOTH move towards center at same pace
  const leftX = progress * travelPx;
  const rightX = -progress * travelPx;

  const dotTransition = merging
    ? "transform 260ms cubic-bezier(0.2, 1, 0.2, 1)"
    : isDragging
      ? "transform 0ms"
      : "transform 240ms ease-out";

  const showHint = started && activeLevelId === "slide_join" && !merged && !merging && !isDragging && progress < 0.02;

  // sizes
  const bubbleSize = "clamp(140px, 16vw, 190px)";
  const mergedSize = "clamp(240px, 30vw, 360px)";

  const confettiPieces = useMemo(() => {
    const count = 28;
    return Array.from({ length: count }).map((_, i) => ({
      id: `${confettiKey}-${i}`,
      left: Math.random() * 100,
      delay: Math.random() * 0.15,
      dur: 0.9 + Math.random() * 0.6,
      rot: Math.random() * 360,
      drift: (Math.random() * 2 - 1) * 40,
      size: 8 + Math.random() * 10,
    }));
  }, [confettiKey]);

  // build tap options whenever idx changes (tap_word)
  useEffect(() => {
    if (!activeGroup) return;
    if (activeLevelId !== "tap_word") return;
    setTapOptions(makeTapOptions(tapTarget, activeGroup.words));
    setTapLocked(false);
    setTapPicked(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, activeLevelId, activeGroupId, tapTarget]);

  function onTapPick(word: string) {
    if (!started) return;
    if (!activeGroup) return;

    setAttempts((a) => a + 1);
    setTapPicked(word);

    if (word === tapTarget) {
      setTapLocked(true);

      // success fx
      fireSuccessFX();
      playWord(tapTarget);
      recordProgress(tapTarget);
    } else {
      // wrong: lock briefly so they see feedback, then unlock
      setTapLocked(true);
      window.setTimeout(() => setTapLocked(false), 450);
    }
  }

  const isTapLast = useMemo(() => {
    if (!activeGroup) return true;
    const order = tapOrder.length ? tapOrder : activeGroup.words;
    return idx >= order.length - 1;
  }, [activeGroup, tapOrder, idx]);

  return (
    <div
      ref={wrapperRef}
      className="fixed inset-0 z-[999] flex flex-col"
      style={{
        background: "linear-gradient(180deg, #050510 0%, #150a2b 35%, #0b2a5e 100%)",
        boxShadow: "inset 0 0 160px rgba(0,0,0,0.75)",
      }}
    >
      <div className="absolute inset-0 blend-stars" aria-hidden />

      <style>
        {`
          .blend-stars::before, .blend-stars::after {
            content: '';
            position: absolute;
            inset: 0;
            pointer-events: none;
            background-image:
              radial-gradient(circle at 10% 15%, white 1px, transparent 1.1px),
              radial-gradient(circle at 80% 20%, white 0.8px, transparent 0.9px),
              radial-gradient(circle at 30% 70%, white 1px, transparent 1.1px),
              radial-gradient(circle at 65% 60%, white 0.9px, transparent 1px);
            background-size: 110px 110px;
          }
          .blend-stars::before { animation: slowDrift 120s linear infinite, twinkle 6s ease-in-out infinite; }
          .blend-stars::after { background-size: 160px 160px; animation: slowDrift 160s linear infinite, twinkle 8s ease-in-out infinite 2s; }

          @keyframes twinkle { 0%,100%{opacity:0.35}50%{opacity:1} }
          @keyframes slowDrift { 0%{transform:translate(0,0)}100%{transform:translate(20px,-20px)} }
          @keyframes tsTapPop { 0%{transform:scale(1)}40%{transform:scale(1.10)}100%{transform:scale(1)} }
          @keyframes tsBubbleGlow {
            0%, 100% { filter: drop-shadow(0 14px 26px rgba(0,0,0,0.20)) drop-shadow(0 0 0 rgba(255,255,255,0)); }
            50% { filter: drop-shadow(0 18px 34px rgba(0,0,0,0.24)) drop-shadow(0 0 18px rgba(255,255,255,0.58)); }
          }
          @keyframes tsBurst { 0%{transform:translate(-50%,-50%) scale(0.3);opacity:0}20%{opacity:.9}100%{transform:translate(-50%,-50%) scale(1.8);opacity:0} }
          @keyframes tsPopIn { 0%{transform:translate(-50%,-50%) scale(.85);opacity:0}100%{transform:translate(-50%,-50%) scale(1);opacity:1} }
          @keyframes tsMergedPulse { 0%,100%{transform:scale(1)}50%{transform:scale(1.03)} }
          @keyframes tsChevronWave { 0%{transform:translateX(-10px);opacity:.15}35%{opacity:.85}50%{transform:translateX(0);opacity:1}100%{transform:translateX(10px);opacity:.15} }
          @keyframes tsArrowPulse { 0%,100%{transform:translateY(-50%) scale(1)}50%{transform:translateY(-50%) scale(1.06)} }
          @keyframes tsConfettiFall {
            0%{transform:translate3d(var(--dx),-15vh,0) rotate(var(--rot));opacity:0}
            12%{opacity:1}
            100%{transform:translate3d(var(--dx2),110vh,0) rotate(calc(var(--rot) + 320deg));opacity:0}
          }

          .ts-hint-wrap{
            pointer-events:none;
            display:flex;align-items:center;justify-content:center;
            padding:10px 14px;border-radius:999px;
            background:rgba(255,255,255,0.28);
            backdrop-filter:blur(8px);
            border:1px solid rgba(255,255,255,0.42);
            box-shadow:0 10px 24px rgba(0,0,0,0.08);
          }
          .ts-chevrons{display:flex;gap:10px;align-items:center;justify-content:center;}
          .ts-chevron{
            width:12px;height:12px;
            border-right:4px solid rgba(20,20,20,0.55);
            border-top:4px solid rgba(20,20,20,0.55);
            transform:rotate(45deg);
            animation:tsChevronWave 1100ms ease-in-out infinite;
          }
          .ts-chevron:nth-child(2){animation-delay:120ms;}
          .ts-chevron:nth-child(3){animation-delay:240ms;}

          .ts-bubble-inner{
            width:100%;height:100%;
            position:relative;display:grid;place-items:center;
            animation:tsBubbleGlow 1600ms ease-in-out infinite;
          }

          .ts-side-btn{
            position:absolute;top:50%;
            transform:translateY(-50%);
            z-index:60;
            width:56px;height:56px;border-radius:999px;
            background:rgba(255,255,255,0.82);
            backdrop-filter:blur(10px);
            border:1px solid rgba(0,0,0,0.10);
            box-shadow:0 14px 34px rgba(0,0,0,0.14);
            display:grid;place-items:center;
            font-size:22px;font-weight:900;
            color:rgba(15,23,42,0.92);
          }

          .ts-confetti-piece{
            position:absolute;top:0;border-radius:2px;opacity:0;
            animation:tsConfettiFall var(--dur) ease-in forwards;
            animation-delay:var(--delay);
            will-change:transform,opacity;
          }
          .ts-confetti-piece:nth-child(6n+1){background:rgba(59,130,246,0.75);}
          .ts-confetti-piece:nth-child(6n+2){background:rgba(16,185,129,0.75);}
          .ts-confetti-piece:nth-child(6n+3){background:rgba(249,115,22,0.75);}
          .ts-confetti-piece:nth-child(6n+4){background:rgba(168,85,247,0.75);}
          .ts-confetti-piece:nth-child(6n+5){background:rgba(236,72,153,0.70);}
          .ts-confetti-piece:nth-child(6n+6){background:rgba(245,158,11,0.75);}
        `}
      </style>

      {/* Gameplay top-right back */}
      {isInGameplay && (
        <div className="absolute top-6 right-6 z-50">
          <button
            onClick={() => {
              setIsInGameplay(false);
              setActiveGroupId(null);
              reset();
            }}
            className="px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold rounded-full shadow-lg hover:bg-white/20 hover:scale-105 transition-all duration-200"
          >
            ← Back to Groups
          </button>
        </div>
      )}

      {/* Gameplay view */}
      {isInGameplay ? (
        <div className="flex-1 min-h-0 relative">
          <div ref={arenaRef} className="relative h-full w-full" style={{ touchAction: "none" }}>
            <div className="absolute inset-0 bg-black/10" />

            {/* instructions */}
            {started && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-6 py-3 bg-white/80 backdrop-blur-md rounded-xl shadow-lg">
                <div className="text-center">
                  <div className="text-sm font-semibold text-slate-900">{instruction}</div>
                  {activeLevelId === "slide_join" && !merged && !merging && (
                    <div className="mt-1 text-xs text-slate-700">Tip: drag the left bubble → to join the right.</div>
                  )}
                </div>
              </div>
            )}

            {/* burst */}
            {showBurst && (
              <div
                className="absolute left-1/2 top-1/2 h-[180px] w-[180px] rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, rgba(16,185,129,0.55) 0%, rgba(16,185,129,0.12) 45%, rgba(16,185,129,0) 70%)",
                  animation: "tsBurst 600ms ease-out forwards",
                }}
              />
            )}

            {/* confetti */}
            {showConfetti && (
              <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden">
                {confettiPieces.map((p) => (
                  <span
                    key={p.id}
                    className="ts-confetti-piece"
                    style={{
                      left: `${p.left}%`,
                      width: `${p.size}px`,
                      height: `${Math.max(5, Math.round(p.size * 0.45))}px`,
                      ["--delay" as any]: `${p.delay}s`,
                      ["--dur" as any]: `${p.dur}s`,
                      ["--rot" as any]: `${p.rot}deg`,
                      ["--dx" as any]: `${p.drift}px`,
                      ["--dx2" as any]: `${p.drift * 0.6}px`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* ===== Level 1: Slide & Join ===== */}
            {activeLevelId === "slide_join" && (
              <>
                {/* Side arrows centered */}
                <button
                  className="ts-side-btn"
                  style={{ left: 16 }}
                  onClick={prev}
                  disabled={!started || idx === 0}
                  aria-label="Previous"
                >
                  <span style={{ opacity: !started || idx === 0 ? 0.35 : 1 }}>‹</span>
                </button>

                <button
                  className="ts-side-btn"
                  style={{
                    right: 16,
                    animation: started && merged && !isLast ? "tsArrowPulse 900ms ease-in-out infinite" : undefined,
                  }}
                  onClick={() => {
                    // only allow next after merge (keeps it pedagogical)
                    if (!merged || !started) return;
                    next();
                  }}
                  disabled={!started || isLast}
                  aria-label="Next"
                >
                  <span style={{ opacity: !started || isLast ? 0.35 : 1 }}>›</span>
                </button>

                {/* center line */}
                <div className="absolute left-1/2 top-1/2 h-[6px] w-[56%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10" />

                {/* hint */}
                {showHint && (
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10" aria-hidden="true">
                    <div className="ts-hint-wrap">
                      <div className="ts-chevrons">
                        <span className="ts-chevron" />
                        <span className="ts-chevron" />
                        <span className="ts-chevron" />
                      </div>
                    </div>
                  </div>
                )}

                {/* dots */}
                {!merged && (
                  <>
                    {/* right bubble */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!started || merging) return;
                        popRight();
                        setAttempts((a) => a + 1);
                      }}
                      className="absolute bg-transparent border-0 p-0 select-none"
                      style={{
                        width: bubbleSize,
                        height: bubbleSize,
                        left: "68%",
                        top: "50%",
                        transform: `translate(calc(-50% + ${rightX}px), -50%)`,
                        transition: dotTransition,
                        willChange: "transform",
                        zIndex: 5,
                        cursor: "pointer",
                      }}
                    >
                      <div key={rightPopKey} className="ts-bubble-inner" style={{ animation: "tsTapPop 220ms ease-out" }}>
                        <img src={BUBBLE_RIGHT} alt="" draggable={false} className="absolute inset-0 h-full w-full" style={{ pointerEvents: "none" }} />
                        <span className="relative z-10 font-extrabold text-[64px] md:text-[72px] leading-none text-white" style={{ textShadow: "0 6px 14px rgba(0,0,0,0.35)" }}>
                          {item.right}
                        </span>
                      </div>
                    </button>

                    {/* left bubble */}
                    <button
                      type="button"
                      onMouseDown={onLeftMouseDown}
                      onTouchStart={onLeftTouchStart}
                      onClick={() => {
                        if (!started) return;
                        if (suppressClickRef.current) return;
                        if (!merging) {
                          popLeft();
                          playTap();
                          setAttempts((a) => a + 1);
                        }
                      }}
                      className="absolute bg-transparent border-0 p-0 select-none"
                      style={{
                        width: bubbleSize,
                        height: bubbleSize,
                        left: "32%",
                        top: "50%",
                        transform: `translate(calc(-50% + ${leftX}px), -50%)`,
                        transition: dotTransition,
                        touchAction: "none",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                        cursor: "grab",
                        willChange: "transform",
                        zIndex: 5,
                      }}
                    >
                      <div key={leftPopKey} className="ts-bubble-inner" style={{ animation: "tsTapPop 220ms ease-out" }}>
                        <img src={BUBBLE_LEFT} alt="" draggable={false} className="absolute inset-0 h-full w-full" style={{ pointerEvents: "none" }} />
                        <span className="relative z-10 font-extrabold text-[64px] md:text-[72px] leading-none text-white" style={{ textShadow: "0 6px 14px rgba(0,0,0,0.35)" }}>
                          {item.left}
                        </span>
                      </div>
                    </button>
                  </>
                )}

                {/* merged bubble */}
                {merged && (
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      // start swipe-to-next
                      e.preventDefault();
                      e.stopPropagation();
                      beginMergedSwipe(e.clientX);
                    }}
                    onTouchStart={(e) => {
                      const t = e.touches[0];
                      if (!t) return;
                      e.preventDefault();
                      e.stopPropagation();
                      beginMergedSwipe(t.clientX);
                    }}
                    onClick={() => {
                      // still allow tap to replay word sound
                      popMerged();
                      playWord(item.word);
                    }}
                    className="absolute bg-transparent border-0 p-0"
                    style={{
                      left: "50%",
                      top: "50%",
                      width: mergedSize,
                      height: mergedSize,
                      transform: `translate(-50%, -50%) translateX(${mergedDragX}px)`,
                      transition: isSwipingMerged ? "transform 0ms" : "transform 200ms ease-out",
                      animation: "tsPopIn 220ms ease-out forwards",
                      cursor: isLast ? "default" : "grab",
                      touchAction: "none",
                      userSelect: "none",
                      WebkitUserSelect: "none",
                    }}
                  >
                    <div
                      key={mergedPopKey}
                      className="relative h-full w-full grid place-items-center"
                      style={{ animation: "tsMergedPulse 1500ms ease-in-out infinite 220ms" }}
                    >
                      <img src={BUBBLE_MERGED} alt="" draggable={false} className="absolute inset-0 h-full w-full" style={{ pointerEvents: "none" }} />
                      <span className="relative z-10 font-extrabold text-[84px] md:text-[96px] leading-none text-white" style={{ textShadow: "0 8px 18px rgba(0,0,0,0.35)" }}>
                        {item.word}
                      </span>

                      {!isLast && (
                        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-white/90 font-bold text-sm drop-shadow-lg">
                          Drag right → next
                        </div>
                      )}
                    </div>
                  </button>
                )}

                {/* next guidance after merge - only show for last item */}
                {started && merged && isLast && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
                    <div className="rounded-2xl bg-white/85 backdrop-blur px-5 py-3 shadow-lg border border-black/5 text-center">
                      <div className="text-sm font-extrabold text-slate-900">All done! 🎉</div>
                      <button
                        onClick={() => setIdx(0)}
                        className="mt-2 rounded-xl bg-slate-900 px-5 py-2 text-white font-bold"
                      >
                        Play again
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ===== Level 2: Tap the Word ===== */}
            {activeLevelId === "tap_word" && (
              <div className="absolute inset-0 flex items-center justify-center px-4">
                <div className="w-full max-w-3xl rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl p-6">
                  <div className="text-center">
                    <div className="text-white text-2xl font-extrabold drop-shadow">{activeGroup?.title ?? "Tap the Word"}</div>
                    <div className="mt-1 text-white/80 text-sm">{activeLevel.subtitle}</div>
                  </div>

                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={() => playWord(tapTarget)}
                      className="rounded-2xl bg-white px-6 py-3 font-extrabold text-slate-900 shadow-lg hover:scale-105 transition"
                      disabled={!started}
                    >
                      🔊 Listen
                    </button>
                  </div>

                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {tapOptions.map((w) => {
                      const picked = tapPicked === w;
                      const correct = tapPicked && w === tapTarget;
                      const wrongPicked = tapPicked === w && w !== tapTarget;

                      return (
                        <button
                          key={w}
                          onClick={() => onTapPick(w)}
                          className={[
                            "rounded-2xl p-5 text-center font-extrabold text-3xl shadow-xl transition border",
                            "bg-white/90 text-slate-900",
                            picked ? "scale-[1.02]" : "hover:scale-[1.02]",
                            correct ? "border-emerald-500" : wrongPicked ? "border-rose-500" : "border-white/30",
                          ].join(" ")}
                          disabled={!started || (tapLocked && tapPicked === tapTarget)} // lock only after correct
                        >
                          {w}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next button appears only after correct */}
                  {tapPicked === tapTarget && (
                    <div className="mt-6 text-center">
                      {!isTapLast ? (
                        <button
                          onClick={next}
                          className="rounded-2xl bg-slate-900 px-8 py-3 text-white font-extrabold shadow-lg hover:scale-105 transition"
                        >
                          Next →
                        </button>
                      ) : (
                        <button
                          onClick={() => setIdx(0)}
                          className="rounded-2xl bg-slate-900 px-8 py-3 text-white font-extrabold shadow-lg hover:scale-105 transition"
                        >
                          Play again
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Start overlay */}
            {!started && activeGroup && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="w-full max-w-xl rounded-2xl bg-white px-6 py-6 shadow-xl">
                  <div className="text-center">
                    <div className="text-xl font-extrabold text-slate-900">{activeLevel.title}</div>
                    <div className="mt-2 text-sm text-slate-600">{activeGroup.title}</div>
                    <div className="mt-2 text-xs text-slate-500">
                      Families: {activeGroup.words.map((w) => `-${w}`).join("  ")}
                    </div>
                  </div>

                  <button
                    className="mt-5 w-full rounded-2xl bg-slate-900 px-4 py-3 text-white font-bold text-lg"
                    onClick={onStart}
                  >
                    Start (Fullscreen)
                  </button>

                  <div className="mt-3 text-xs text-slate-500 text-center">
                    Note: audio + fullscreen needs one tap.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom controls */}
          <div
            className="shrink-0 px-4 py-3 flex flex-wrap gap-3 bg-white/80 backdrop-blur"
            style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
          >
            <button onClick={reset} className="rounded-xl border bg-white px-4 py-2 font-semibold">
              Reset
            </button>

            {activeLevelId === "slide_join" ? (
              <button
                onClick={() => {
                  if (!started || merged || merging) return;
                  popLeft();
                  playTap();
                  setAttempts((a) => a + 1);
                }}
                className="rounded-xl bg-white/90 px-4 py-2 font-semibold border"
                disabled={!started}
              >
                🔊 Sound "{item.left}"
              </button>
            ) : (
              <button
                onClick={() => playWord(tapTarget)}
                className="rounded-xl bg-white/90 px-4 py-2 font-semibold border"
                disabled={!started}
              >
                🔊 Listen
              </button>
            )}
          </div>
        </div>
      ) : (
        // ===== Menu view (Level + Groups) =====
        <div className="flex-1 min-h-0 relative overflow-auto flex flex-col items-center justify-start py-12 px-4">
          <button
            onClick={goBack}
            className="absolute top-6 right-6 px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold rounded-full shadow-lg hover:bg-white/20 hover:scale-105 transition-all duration-200 z-10"
          >
            ← Back to Phonics Library
          </button>

          <div className="w-full max-w-6xl mx-auto text-center mb-8 relative z-10">
            <h1 className="text-5xl md:text-6xl font-bold text-white drop-shadow-2xl">{MY_FIRST_WORDS_META.title}</h1>
            <p className="text-lg text-purple-300 mt-2 drop-shadow-lg">{MY_FIRST_WORDS_META.tagline}</p>

            {/* Level pills */}
            <div className="mt-8 inline-block">
              <div className="text-xs font-semibold text-white/70 mb-3 tracking-wider uppercase">Choose Level</div>
              <div className="flex flex-wrap justify-center gap-3 px-6 py-4 rounded-2xl bg-black/30 border border-white/10 backdrop-blur-md shadow-2xl">
                {LEVELS.map((l) => {
                  const active = activeLevelId === l.id;
                  return (
                    <button
                      key={l.id}
                      onClick={() => {
                        setActiveLevelId(l.id);
                        setActiveGroupId(null);
                      }}
                      className={`px-6 py-3 rounded-full font-bold text-base md:text-lg transition-all whitespace-nowrap ${
                        active
                          ? "bg-white/25 text-white border-2 border-white/60 ring-2 ring-white/30 shadow-xl scale-105"
                          : "bg-white/5 text-white/70 border-2 border-white/20 hover:bg-white/12 hover:border-white/40 hover:text-white/90"
                      }`}
                    >
                      {l.title}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 text-sm text-white/70">{activeLevel.subtitle}</div>
            </div>
          </div>

          {/* Group cards */}
          <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            {VOWEL_GROUPS.map((group, i) => {
              const preview = group.words.map((w) => `-${w}`).join(", ");
              const gradients = [
                "bg-gradient-to-br from-pink-400/20 to-purple-400/20",
                "bg-gradient-to-br from-blue-400/20 to-cyan-400/20",
                "bg-gradient-to-br from-green-400/20 to-emerald-400/20",
                "bg-gradient-to-br from-yellow-400/20 to-orange-400/20",
                "bg-gradient-to-br from-violet-400/20 to-indigo-400/20",
              ];
              const bgGradient = gradients[i % gradients.length];

              return (
                <button
                  key={group.id}
                  onClick={() => {
                    setActiveGroupId(group.id);
                    setIsInGameplay(true);
                    setIdx(0);
                    reset();
                  }}
                  className={`${bgGradient} p-6 rounded-2xl border border-white/20 backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-2xl cursor-pointer text-left`}
                >
                  <div className="flex items-start justify-between">
                    <h3 className="text-2xl font-bold text-white drop-shadow-lg">{group.title}</h3>
                    {group.hint && (
                      <span className="ml-2 px-2 py-1 text-xs font-semibold bg-white/30 text-white rounded-full backdrop-blur-sm">
                        {group.hint}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-white/90 mt-3 drop-shadow">
                    {preview}
                  </p>

                  <div className="mt-5 flex items-center justify-between">
                    <div className="text-yellow-300 font-semibold drop-shadow">Play</div>
                    <div className="text-sm text-white/80 drop-shadow">
                      {group.words.length} families
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
