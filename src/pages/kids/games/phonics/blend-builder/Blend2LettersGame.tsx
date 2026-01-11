import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

// ✅ IMPORTANT: adjust this import if your project path differs.
import { recordLevelResult } from "../../../../../games/engine/recordLevelResult";

// ========================================
// BLEND BUILDER MVP CONFIG
// ========================================
export type Item = { left: string; right: string; word: string };

export const BLEND_BUILDER_META = {
  title: "Make the Word: Blend Builder",
  tagline: "Push sounds together to make a word.",
} as const;

export type BlendBuilderTabId = "tab_2letter" | "tab_3letter" | "tab_4letter";

export type SplitRule =
  | { mode: "firstChar" }
  | { mode: "leftLen"; leftLen: number }
  | { mode: "customPairs"; pairs: Record<string, { left: string; right: string }> };

export type BlendGroup = {
  id: string;
  title: string;
  hint?: string;
  words: string[];
  split?: SplitRule;
};

export type BlendTab = {
  id: BlendBuilderTabId;
  title: string;
  subtitle?: string;
  groups: BlendGroup[];
};

const GAME_ID = "blend_builder_mvp";
const PROGRESS_DOC_ID = "phonics_blend_builder";

const ASSET_BASE = "/games/phonics/blend2letters";
const BG_URL = `${ASSET_BASE}/blend-bg.jpg`;
const BUBBLE_LEFT = `${ASSET_BASE}/bubble-left.png`;
const BUBBLE_RIGHT = `${ASSET_BASE}/bubble-right.png`;
const BUBBLE_MERGED = `${ASSET_BASE}/bubble-merged.png`;

// ✅ Your audio files
const SND_CONFETTI = `${ASSET_BASE}/confetti.mp3`;

// For A-family now (naming you requested)
const SND_A_TAP = `${ASSET_BASE}/at-initial.mp3`;
const SND_A_DRAG = `${ASSET_BASE}/long-a-sound.mp3`;
const mergeSoundUrl = (word: string) => `${ASSET_BASE}/${word}-sound.mp3`;

// If later you add i/e/o/u families, we’ll follow this convention:
const tapSoundUrl = (left: string) => {
  if (left === "a") return SND_A_TAP;
  return `${ASSET_BASE}/${left}-initial.mp3`; // future convention
};
const dragSoundUrl = (left: string) => {
  if (left === "a") return SND_A_DRAG;
  return `${ASSET_BASE}/long-${left}-sound.mp3`; // future convention
};

export const BLEND_BUILDER_TABS: BlendTab[] = [
  {
    id: "tab_2letter",
    title: "2-Letter",
    subtitle: "VC mini-words",
    groups: [
      { id: "2_at", title: "at", hint: "short a", words: ["at"] },
      { id: "2_in", title: "in", hint: "short i", words: ["in"] },
      { id: "2_it", title: "it", hint: "short i", words: ["it"] },
      { id: "2_an", title: "an", hint: "short a", words: ["an"] },
      { id: "2_as", title: "as", hint: "short a", words: ["as"] },
      { id: "2_is", title: "is", hint: "short i", words: ["is"] },
      {
        id: "2_mix",
        title: "Mix (Review)",
        hint: "mix",
        words: ["at", "in", "it", "an", "as", "is"],
      },
    ],
  },
  {
    id: "tab_3letter",
    title: "3-Letter",
    subtitle: "CVC word families",
    groups: [
      { id: "3_at", title: "-at family", hint: "short a", words: ["sat", "pat"] },
      { id: "3_an", title: "-an family", hint: "short a", words: ["tan", "pan", "ant"] },
      { id: "3_ap", title: "-ap family", hint: "short a", words: ["tap", "nap", "sap"] },
      { id: "3_in", title: "-in family", hint: "short i", words: ["pin", "tin"] },
      { id: "3_it", title: "-it family", hint: "short i", words: ["sit", "pit"] },
      { id: "3_ip", title: "-ip family", hint: "short i", words: ["sip", "tip", "nip", "pip"] },
      {
        id: "3_mix",
        title: "Mix (Review)",
        hint: "mix",
        words: ["sat", "pat", "tan", "pan", "ant", "tap", "nap", "sap", "pin", "tin", "sit", "pit", "sip", "tip", "nip", "pip"],
      },
    ],
  },
  {
    id: "tab_4letter",
    title: "4-Letter",
    subtitle: "CVCC + CCVC",
    groups: [
      { id: "4_pant", title: "pant", hint: "CVCC", words: ["pant"] },
      { id: "4_pint", title: "pint", hint: "CVCC", words: ["pint"] },
      { id: "4_past", title: "past", hint: "CVCC", words: ["past"] },
      {
        id: "4_spin",
        title: "spin",
        hint: "CCVC",
        words: ["spin"],
        split: { mode: "leftLen", leftLen: 2 },
      },
      {
        id: "4_span",
        title: "span",
        hint: "CCVC",
        words: ["span"],
        split: { mode: "leftLen", leftLen: 2 },
      },
      {
        id: "4_snap",
        title: "snap",
        hint: "CCVC",
        words: ["snap"],
        split: { mode: "leftLen", leftLen: 2 },
      },
      {
        id: "4_mix",
        title: "Mix (Review)",
        hint: "mix",
        words: ["pant", "pint", "past", "spin", "span", "snap"],
        split: {
          mode: "customPairs",
          pairs: {
            pant: { left: "p", right: "ant" },
            pint: { left: "p", right: "int" },
            past: { left: "p", right: "ast" },
            spin: { left: "sp", right: "in" },
            span: { left: "sp", right: "an" },
            snap: { left: "sn", right: "ap" },
          },
        },
      },
    ],
  },
] as const;

function splitWord(word: string, rule?: SplitRule): { left: string; right: string } {
  const r = rule ?? { mode: "firstChar" as const };
  if (r.mode === "firstChar") return { left: word.slice(0, 1), right: word.slice(1) };
  if (r.mode === "leftLen") {
    const n = Math.max(1, Math.min(word.length - 1, r.leftLen));
    return { left: word.slice(0, n), right: word.slice(n) };
  }
  const hit = r.pairs[word];
  if (hit) return hit;
  return { left: word.slice(0, 1), right: word.slice(1) };
}

export function itemsForGroup(group: BlendGroup): Item[] {
  return group.words.map((w) => {
    const { left, right } = splitWord(w, group.split);
    return { left, right, word: w };
  });
}

export function findGroup(tabId: BlendBuilderTabId, groupId: string): BlendGroup | undefined {
  const tab = BLEND_BUILDER_TABS.find((t) => t.id === tabId);
  return tab?.groups.find((g) => g.id === groupId);
}

const MAGNET_THRESHOLD = 0.8; // ✅ 80%

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function Blend2LettersGame() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const kidId =
    searchParams.get("kidId") ||
    localStorage.getItem("ts_active_kid_v1") ||
    "";

  // ✅ MVP state: activeTab, activeGroup, and gameplay mode
  const [activeTabId, setActiveTabId] = useState<BlendBuilderTabId>("tab_2letter");
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [isInGameplay, setIsInGameplay] = useState(false);

  const activeTab = useMemo(() => {
    return BLEND_BUILDER_TABS.find((t) => t.id === activeTabId) ?? BLEND_BUILDER_TABS[0];
  }, [activeTabId]);

  const activeGroup = useMemo(() => {
    if (!activeGroupId) return null;
    return activeTab.groups.find((g) => g.id === activeGroupId) ?? null;
  }, [activeTab, activeGroupId]);

  const ITEMS = useMemo(() => {
    if (!activeGroup) return [];
    return itemsForGroup(activeGroup);
  }, [activeGroup]);

  const [idx, setIdx] = useState(0);
  const item = ITEMS[clamp(idx, 0, Math.max(0, ITEMS.length - 1))] ?? { left: "a", right: "t", word: "at" };

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const arenaRef = useRef<HTMLDivElement | null>(null);

  const [started, setStarted] = useState(false);

  const [merged, setMerged] = useState(false);
  const mergedRef = useRef(false);

  const [merging, setMerging] = useState(false);
  const mergingRef = useRef(false);

  // ✅ Left bubble moves (0..1) towards center. At ~0.8 we trigger magnet merge.
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);

  const [isDragging, setIsDragging] = useState(false);

  // travelPx = distance from left bubble (32%) to center (50%) = 18% of width
  const [travelPx, setTravelPx] = useState(220);

  const [showBurst, setShowBurst] = useState(false);

  // ✅ confetti
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);

  // keep tracking (do NOT show in UI)
  const [attempts, setAttempts] = useState(0);
  const [startTs, setStartTs] = useState<number | null>(null);

  // Tap pop triggers
  const [leftPopKey, setLeftPopKey] = useState(0);
  const [rightPopKey, setRightPopKey] = useState(0);
  const [mergedPopKey, setMergedPopKey] = useState(0);

  // --- Drag session (window listeners) ---
  const dragRef = useRef<{ active: boolean; startX: number; moved: boolean }>({
    active: false,
    startX: 0,
    moved: false,
  });

  const suppressClickRef = useRef(false);

  // ------------------------
  // ✅ AUDIO (MP3) SYSTEM
  // ------------------------
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
      confettiRef.current.volume = 0.35; // subtle
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

      const list = [tapRef.current, dragRefAudio.current, mergeRefAudio.current, confettiRef.current].filter(Boolean) as HTMLAudioElement[];

      // attempt silent play/pause to unlock in iOS/Safari after user gesture
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
        } catch {
          // ignore
        }
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

      // stop others
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

  async function playMergeWord(word: string) {
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

  function popLeft() {
    setLeftPopKey((k) => k + 1);
  }
  function popRight() {
    setRightPopKey((k) => k + 1);
  }
  function popMerged() {
    setMergedPopKey((k) => k + 1);
  }

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

  const instruction = useMemo(() => {
    if (!started) return "Tap Start to play.";
    if (merged) return `Nice! You made “${item.word}”.`;
    if (merging) return "Merging...";
    return `Drag “${item.left}” to “${item.right}” to make “${item.word}”.`;
  }, [started, merged, merging, item]);

  useEffect(() => {
    mergedRef.current = merged;
  }, [merged]);

  useEffect(() => {
    mergingRef.current = merging;
  }, [merging]);

  // ✅ Keep travel distance correct on every screen size
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

  // preload audio when item changes
  useEffect(() => {
    ensureTapDragAudio(item.left);
    ensureMergeAudio(item.word);
    pauseAllAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.left, item.word]);

  // Reset when idx or selection changes
  useEffect(() => {
    setMerged(false);
    setMerging(false);
    setProgress(0);
    progressRef.current = 0;
    setIsDragging(false);
    setShowBurst(false);
    setShowConfetti(false);
    setAttempts(0);
    setStartTs(null);

    dragRef.current = { active: false, startX: 0, moved: false };
    suppressClickRef.current = false;

    pauseAllAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, activeGroupId]);

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
    navigate(`/kids/games/phonics${kidId ? `?kidId=${encodeURIComponent(kidId)}` : ""}`);
  }

  function reset() {
    cleanupDragListeners();
    pauseAllAudio();

    setMerged(false);
    setMerging(false);
    setProgress(0);
    progressRef.current = 0;
    setIsDragging(false);
    setShowBurst(false);
    setShowConfetti(false);

    dragRef.current = { active: false, startX: 0, moved: false };
    suppressClickRef.current = false;
  }

  const hasItems = ITEMS.length > 0;
  const isLast = idx >= ITEMS.length - 1;

  function next() {
    if (!hasItems) return;
    setIdx((p) => clamp(p + 1, 0, ITEMS.length - 1));
  }
  function prev() {
    if (!hasItems) return;
    setIdx((p) => clamp(p - 1, 0, ITEMS.length - 1));
  }

  async function onStart() {
    setStarted(true);
    await unlockAudio();
    await requestRealFullscreen();
  }

  function finishMerge() {
    setMerging(false);
    setMerged(true);

    // burst + confetti
    setShowBurst(true);
    window.setTimeout(() => setShowBurst(false), 600);

    setConfettiKey((k) => k + 1);
    setShowConfetti(true);
    window.setTimeout(() => setShowConfetti(false), 1100);

    popMerged();

    // ✅ play word merge + confetti sound
    playMergeWord(item.word);
    playConfetti();

    // record
    if (kidId) {
      try {
        const spentMs = startTs ? Math.max(0, Math.round(performance.now() - startTs)) : 0;
        recordLevelResult({
          gameId: GAME_ID,
          progressDocId: PROGRESS_DOC_ID,
          kidId,
          levelId: idx + 1,
          timeSpentMs: spentMs,
          attempts: Math.max(1, attempts),
          masteredItems: [item.word],
          skillTags: [
            "area:phonics",
            "subtopic:blend_builder",
            `tab:${activeTabId}`,
            `group:${activeGroupId ?? "unknown"}`,
            `word:${item.word}`,
            `letter:${item.left}`,
            `letter:${item.right}`,
          ],
          completedAt: Date.now(),
        } as any);
      } catch (err) {
        console.error("recordLevelResult failed:", err);
      }
    }
  }

  // ✅ Left-only progress during drag; magnet triggers at 80%
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
      dragRef.current.active = false;
      setIsDragging(false);

      setProgress(1);
      progressRef.current = 1;

      setMerging(true);
      window.setTimeout(() => finishMerge(), 260);
    }
  }

  function endDragTapOrSnap() {
    const moved = dragRef.current.moved;
    dragRef.current.active = false;
    cleanupDragListeners();

    stopDragLoop();

    // tap (not drag): play tap mp3 (at-initial.mp3 for a)
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

  function onWinMouseMove(e: MouseEvent) {
    if (!dragRef.current.active) return;
    if (mergedRef.current || mergingRef.current) return;

    const dx = e.clientX - dragRef.current.startX;

    if (!dragRef.current.moved) {
      if (Math.abs(dx) >= 6) {
        dragRef.current.moved = true;
        setIsDragging(true);
        startDragLoop(); // ✅ long-a loop while dragging
      } else return;
    }

    setProgressFromDx(dx);
  }

  function onWinMouseUp() {
    if (!dragRef.current.active) return;
    endDragTapOrSnap();
  }

  function onWinTouchMove(e: TouchEvent) {
    if (!dragRef.current.active) return;
    if (mergedRef.current || mergingRef.current) return;

    e.preventDefault();

    const t = e.touches[0];
    if (!t) return;

    const dx = t.clientX - dragRef.current.startX;

    if (!dragRef.current.moved) {
      if (Math.abs(dx) >= 6) {
        dragRef.current.moved = true;
        setIsDragging(true);
        startDragLoop();
      } else return;
    }

    setProgressFromDx(dx);
  }

  function onWinTouchEnd() {
    if (!dragRef.current.active) return;
    endDragTapOrSnap();
  }

  function beginDragAt(clientX: number) {
    if (!started) return;
    if (mergedRef.current || mergingRef.current) return;

    if (startTs === null) setStartTs(performance.now());

    dragRef.current = { active: true, startX: clientX, moved: false };
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

  // Positions:
  const leftX = progress * travelPx;
  const rightX = merging ? -travelPx : 0;

  const dotTransition = merging
    ? "transform 260ms cubic-bezier(0.2, 1, 0.2, 1)"
    : isDragging
      ? "transform 0ms"
      : "transform 240ms ease-out";

  const showHint =
    started && !merged && !merging && !isDragging && progress < 0.02;

  // Bigger bubbles
  const bubbleSize = "clamp(140px, 16vw, 190px)";
  const mergedSize = "clamp(240px, 30vw, 360px)";

  // confetti pieces regenerated per merge
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

  return (
    <div
      ref={wrapperRef}
      className="fixed inset-0 z-[999] flex flex-col"
      style={{
        backgroundImage: `url(${BG_URL})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <style>
        {`
          @keyframes tsTapPop {
            0% { transform: scale(1); }
            40% { transform: scale(1.10); }
            100% { transform: scale(1); }
          }

          @keyframes tsBubbleGlow {
            0%, 100% {
              filter:
                drop-shadow(0 14px 26px rgba(0,0,0,0.20))
                drop-shadow(0 0 0 rgba(255,255,255,0));
            }
            50% {
              filter:
                drop-shadow(0 18px 34px rgba(0,0,0,0.24))
                drop-shadow(0 0 18px rgba(255,255,255,0.58));
            }
          }

          @keyframes tsBurst {
            0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0.0; }
            20% { opacity: 0.9; }
            100% { transform: translate(-50%, -50%) scale(1.8); opacity: 0; }
          }

          @keyframes tsPopIn {
            0% { transform: translate(-50%, -50%) scale(0.85); opacity: 0; }
            100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          }

          @keyframes tsMergedPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.03); }
          }

          @keyframes tsChevronWave {
            0%   { transform: translateX(-10px); opacity: 0.15; }
            35%  { opacity: 0.85; }
            50%  { transform: translateX(0px); opacity: 1; }
            100% { transform: translateX(10px); opacity: 0.15; }
          }

          @keyframes tsArrowPulse {
            0%, 100% { transform: translateY(-50%) scale(1); }
            50% { transform: translateY(-50%) scale(1.06); }
          }

          @keyframes tsConfettiFall {
            0% {
              transform: translate3d(var(--dx), -15vh, 0) rotate(var(--rot));
              opacity: 0;
            }
            12% { opacity: 1; }
            100% {
              transform: translate3d(var(--dx2), 110vh, 0) rotate(calc(var(--rot) + 320deg));
              opacity: 0;
            }
          }

          .ts-hint-wrap{
            pointer-events: none;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 10px 14px;
            border-radius: 999px;
            background: rgba(255,255,255,0.28);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255,255,255,0.42);
            box-shadow: 0 10px 24px rgba(0,0,0,0.08);
          }

          .ts-chevrons{
            display: flex;
            gap: 10px;
            align-items: center;
            justify-content: center;
          }

          .ts-chevron{
            width: 12px;
            height: 12px;
            border-right: 4px solid rgba(20,20,20,0.55);
            border-top: 4px solid rgba(20,20,20,0.55);
            transform: rotate(45deg);
            animation: tsChevronWave 1100ms ease-in-out infinite;
          }
          .ts-chevron:nth-child(2){ animation-delay: 120ms; }
          .ts-chevron:nth-child(3){ animation-delay: 240ms; }

          .ts-bubble-inner{
            width: 100%;
            height: 100%;
            position: relative;
            display: grid;
            place-items: center;
            animation: tsBubbleGlow 1600ms ease-in-out infinite;
          }

          .ts-side-btn{
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            z-index: 60;
            width: 56px;
            height: 56px;
            border-radius: 999px;
            background: rgba(255,255,255,0.82);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(0,0,0,0.10);
            box-shadow: 0 14px 34px rgba(0,0,0,0.14);
            display: grid;
            place-items: center;
            font-size: 22px;
            font-weight: 900;
            color: rgba(15,23,42,0.92);
          }

          .ts-confetti-piece{
            position: absolute;
            top: 0;
            border-radius: 2px;
            opacity: 0;
            animation: tsConfettiFall var(--dur) ease-in forwards;
            animation-delay: var(--delay);
            will-change: transform, opacity;
          }

          .ts-confetti-piece:nth-child(6n+1){ background: rgba(59,130,246,0.75); }
          .ts-confetti-piece:nth-child(6n+2){ background: rgba(16,185,129,0.75); }
          .ts-confetti-piece:nth-child(6n+3){ background: rgba(249,115,22,0.75); }
          .ts-confetti-piece:nth-child(6n+4){ background: rgba(168,85,247,0.75); }
          .ts-confetti-piece:nth-child(6n+5){ background: rgba(236,72,153,0.70); }
          .ts-confetti-piece:nth-child(6n+6){ background: rgba(245,158,11,0.75); }
        `}
      </style>

      {/* Top bar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur">
        <button 
          onClick={() => {
            if (isInGameplay && activeGroupId) {
              setIsInGameplay(false);
              reset();
            } else {
              goBack();
            }
          }} 
          className="rounded-full border bg-white px-4 py-2 text-sm font-semibold"
        >
          ← {isInGameplay ? "Groups" : "Back"}
        </button>

        <div className="text-center">
          <div className="text-sm font-bold text-slate-800">{BLEND_BUILDER_META.title}</div>
          {isInGameplay && activeGroup && (
            <div className="text-xs text-slate-600 mt-0.5">{activeGroup.title}</div>
          )}
        </div>

        <div className="w-[88px]" />
      </div>

      {/* Main arena */}
      <div className="flex-1 min-h-0 relative">
        <div ref={arenaRef} className="relative h-full w-full" style={{ touchAction: "none" }}>
          <div className="absolute inset-0 bg-black/10" />

          {/* ✅ Side arrows centered */}
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
            onClick={next}
            disabled={!started || isLast}
            aria-label="Next"
          >
            <span style={{ opacity: !started || isLast ? 0.35 : 1 }}>›</span>
          </button>

          {/* instructions */}
          {started && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-6 py-3 bg-white/80 backdrop-blur-md rounded-xl shadow-lg">
              <div className="text-center">
                <div className="text-sm font-semibold text-slate-900">{instruction}</div>
                {!merged && !merging && (
                  <div className="mt-1 text-xs text-slate-700">Tip: drag the left bubble → to join the right.</div>
                )}
              </div>
            </div>
          )}

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

          {/* ✅ confetti drop */}
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

          {/* dots */}
          {!merged && (
            <>
              {/* right bubble */}
              <button
                type="button"
                onClick={() => {
                  if (!started || merging) return;
                  popRight();
                  // right letter still uses “tap to hear” later; for now keep minimal:
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

                <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 text-center pointer-events-none">
                  <div className="text-[28px] md:text-[32px] font-extrabold text-slate-900">sound 2</div>
                  <div className="mt-2 text-[36px] md:text-[40px] font-semibold italic text-slate-900">/{item.right}/</div>
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

                <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 text-center pointer-events-none">
                  <div className="text-[28px] md:text-[32px] font-extrabold text-slate-900">sound 1</div>
                  <div className="mt-2 text-[36px] md:text-[40px] font-semibold italic text-slate-900">/{item.left}/</div>
                </div>
              </button>
            </>
          )}

          {/* merged bubble */}
          {merged && (
            <button
              type="button"
              onClick={() => {
                popMerged();
                playMergeWord(item.word);
              }}
              className="absolute bg-transparent border-0 p-0"
              style={{
                left: "50%",
                top: "50%",
                width: mergedSize,
                height: mergedSize,
                transform: "translate(-50%, -50%)",
                animation: "tsPopIn 220ms ease-out forwards",
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
              </div>
            </button>
          )}

          {/* ✅ next guidance after merge */}
          {started && merged && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
              {!isLast ? (
                <div className="rounded-2xl bg-white/85 backdrop-blur px-5 py-3 shadow-lg border border-black/5 text-center">
                  <div className="text-sm font-extrabold text-slate-900">Great! Tap Next →</div>
                  <button
                    onClick={next}
                    className="mt-2 rounded-xl bg-slate-900 px-5 py-2 text-white font-bold"
                  >
                    Next
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl bg-white/85 backdrop-blur px-5 py-3 shadow-lg border border-black/5 text-center">
                  <div className="text-sm font-extrabold text-slate-900">All done! 🎉</div>
                  <button
                    onClick={() => setIdx(0)}
                    className="mt-2 rounded-xl bg-slate-900 px-5 py-2 text-white font-bold"
                  >
                    Play again
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Group selection overlay (show when not in gameplay) */}
          {!isInGameplay && (
            <div className="absolute inset-0 z-20 overflow-auto bg-black/60 backdrop-blur-sm">
              <div className="min-h-full flex items-center justify-center p-4">
                <div className="w-full max-w-4xl rounded-2xl bg-white px-6 py-6 shadow-xl my-8">
                  <div className="text-center">
                    <div className="text-2xl font-extrabold text-slate-900">{BLEND_BUILDER_META.title}</div>
                    <div className="mt-2 text-sm text-slate-600">{BLEND_BUILDER_META.tagline}</div>
                  </div>

                  {/* Tab pills */}
                  <div className="mt-6 flex flex-wrap gap-2 justify-center">
                    {BLEND_BUILDER_TABS.map((tab) => {
                      const active = activeTabId === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setActiveTabId(tab.id);
                            setActiveGroupId(null);
                          }}
                          className={[
                            "rounded-full px-5 py-2.5 text-sm font-bold border-2 transition-all",
                            active
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white text-slate-700 border-slate-300 hover:border-slate-400",
                          ].join(" ")}
                        >
                          {tab.title}
                        </button>
                      );
                    })}
                  </div>

                  {/* Group cards */}
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {activeTab.groups.map((group) => {
                      const sampleWords = group.words.slice(0, 3).join(", ");
                      const moreCount = Math.max(0, group.words.length - 3);
                      return (
                        <button
                          key={group.id}
                          onClick={() => {
                            setActiveGroupId(group.id);
                            setIsInGameplay(true);
                            setIdx(0);
                            reset();
                            // Will trigger onStart next
                          }}
                          className="group relative rounded-xl border-2 border-slate-200 bg-white p-4 text-left hover:border-slate-400 hover:shadow-lg transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div className="text-lg font-bold text-slate-900 group-hover:text-slate-950">
                              {group.title}
                            </div>
                            {group.hint && (
                              <span className="ml-2 text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                {group.hint}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 text-sm text-slate-600">
                            {sampleWords}
                            {moreCount > 0 && ` +${moreCount} more`}
                          </div>
                          <div className="mt-3 text-xs font-semibold text-blue-600 group-hover:text-blue-700">
                            {group.words.length} word{group.words.length !== 1 ? "s" : ""} →
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-6 text-center text-xs text-slate-500">
                    Select a word family above to start practicing
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Start overlay (show after group selected but before started) */}
          {isInGameplay && !started && activeGroup && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-xl rounded-2xl bg-white px-6 py-6 shadow-xl">
                <div className="text-center">
                  <div className="text-xl font-extrabold text-slate-900">{activeGroup.title}</div>
                  <div className="mt-2 text-sm text-slate-600">
                    {ITEMS.length} word{ITEMS.length !== 1 ? "s" : ""} to practice
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
      </div>

      {/* Bottom controls */}
      <div
        className="shrink-0 px-4 py-3 flex flex-wrap gap-3 bg-white/80 backdrop-blur"
        style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
      >
        <button onClick={reset} className="rounded-xl border bg-white px-4 py-2 font-semibold" disabled={!started}>
          Reset
        </button>

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

        {/* Keep right sound button for now (you can switch to MP3 later) */}
        <button
          onClick={() => {
            if (!started || merged || merging) return;
            popRight();
            setAttempts((a) => a + 1);
          }}
          className="rounded-xl bg-white/90 px-4 py-2 font-semibold border"
          disabled={!started}
        >
          🔊 Sound "{item.right}"
        </button>
      </div>
    </div>
  );
}
