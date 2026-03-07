import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { applyKidAndMissionContext, buildMissionReturnHref } from "../missionNavigation";

/**
 * Tiny Steps — Game 3: CVC Word Reader
 *
 * Fixes included:
 * ✅ Prevent double-advance (word 1 -> word 3 skip) by removing click+drag double fire
 * ✅ Fix stale searchParams causing level to revert (level 1 repeats instead of next level)
 * ✅ Fullscreen exit reliability + auto-exit on leaving play/unmount
 *
 * Pedagogy upgrades included (Tiny Steps standards):
 * ✅ Listen-first gate (reduces guessing)
 * ✅ Step-based choices (only current slot letters, capped)
 * ✅ Tap-to-place accessibility fallback (drag not required)
 * ✅ Error ladder: 1 shake+replay, 2 highlight, 3 guided place, 4 reteach + reduce to 2
 * ✅ Auto-hint on freeze (3.5s)
 * ✅ Short success ritual (≈2.5s) + clear closure
 * ✅ Micro spaced review: struggled words reappear ~5 turns later
 */

type SlotKey = "first" | "middle" | "last";
type InputMethod = "drag" | "tap";

type FamilyItem = { onset: string; rime: string; word: string; img: string };
type FamilyConfig = {
  id: string;
  rime: string;
  tiles: string[];
  items: FamilyItem[];
};

type CVCItem = {
  id: string;
  word: string;
  phonemes: [string, string, string];
  imageUrl?: string;
  emoji?: string;
  audioSlowUrl?: string;
  phonemeAudioUrls?: Partial<Record<SlotKey, string>>;
  distractorsBySlot: Record<SlotKey, string[]>;
};

const GAME_ID = "cvc_word_reader_v1";
const PROGRESS_DOC_ID = "phonics_cvc_word_reader";

// Tuning for ages 3–6
const MAX_WORDS_PER_LEVEL = 12;
const AUTO_HINT_MS = 3500;
const SUCCESS_PAUSE_MS = 2500;
const CONFETTI_MS = 1600;

// Input tuning
const DRAG_START_PX = 10;

// --------------------
// Level Groups (5 levels)
// --------------------
const VOWEL_GROUPS: Array<{ key: "a" | "e" | "i" | "o" | "u"; title: string; ids: string[] }> = [
  { key: "a", title: "Short a", ids: ["at", "an", "ap", "am", "ad", "ag"] },
  { key: "e", title: "Short e", ids: ["et", "en", "ed"] },
  { key: "i", title: "Short i", ids: ["in", "ip", "ig"] },
  { key: "o", title: "Short o", ids: ["og", "op", "ot"] },
  { key: "u", title: "Short u", ids: ["ug", "un", "ut"] },
];

// --------------------
// Families
// --------------------
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
};

// --------------------
// Helpers
// --------------------
function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function stableShuffle<T>(arr: T[], seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    const j = Math.abs(h) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function ConfettiBurst({ fire, durationMs }: { fire: boolean; durationMs: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!fire) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const W = (canvas.width = canvas.offsetWidth);
    const H = (canvas.height = canvas.offsetHeight);

    const pieces = Array.from({ length: 120 }).map(() => ({
      x: W / 2,
      y: H / 2,
      vx: (Math.random() - 0.5) * 9,
      vy: (Math.random() - 0.8) * 10,
      g: 0.22 + Math.random() * 0.2,
      r: 2 + Math.random() * 3,
      a: 1,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.28,
      hue: Math.floor(Math.random() * 360),
    }));

    const start = performance.now();
    const dur = Math.max(300, durationMs);

    const tick = (now: number) => {
      const t = now - start;
      const fade = 1 - clamp(t / dur, 0, 1);
      ctx.clearRect(0, 0, W, H);

      for (const p of pieces) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.g;
        p.rot += p.vr;
        p.a = fade;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = `hsla(${p.hue}, 90%, 60%, ${p.a})`;
        ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
        ctx.restore();
      }

      if (t < dur) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fire, durationMs]);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" style={{ width: "100%", height: "100%" }} />;
}

export default function CvcWordReaderGame() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Keep a fresh ref to avoid stale closures overwriting params (critical for level progression + fullscreen)
  const searchParamsRef = useRef(searchParams);
  useEffect(() => {
    searchParamsRef.current = searchParams;
  }, [searchParams]);

  const kidId = searchParams.get("kidId") || localStorage.getItem("ts_active_kid_v1") || "";
  const missionReturnHref = buildMissionReturnHref(searchParams, kidId);

  // URL param: level = a|e|i|o|u
  const levelKeyParam = (searchParams.get("level") as any) as "a" | "e" | "i" | "o" | "u" | null;
  const inPlayMode = !!levelKeyParam;

  // Keep fs param as "state hint" only (not the trigger)
  const fsParam = searchParams.get("fs") === "1";
  const [isFullscreen, setIsFullscreen] = useState<boolean>(!!document.fullscreenElement);

  const levelConfig = useMemo(() => {
    const found = VOWEL_GROUPS.find((g) => g.key === levelKeyParam);
    return found ?? null;
  }, [levelKeyParam]);

  // Build items for the selected level
  const LEVEL_ITEMS: CVCItem[] = useMemo(() => {
    if (!levelConfig) return [];

    const lastLettersSet = new Set<string>();
    const consonantPoolSet = new Set<string>();

    for (const famId of levelConfig.ids) {
      const fam = FAMILIES[famId];
      if (!fam) continue;
      lastLettersSet.add(fam.rime[1]);
      fam.tiles.forEach((t) => consonantPoolSet.add(t));
      fam.items.forEach((it) => consonantPoolSet.add(it.onset));
    }

    const levelLastLetters = Array.from(lastLettersSet);
    const levelConsonants = Array.from(consonantPoolSet);

    const list: CVCItem[] = [];
    for (const famId of levelConfig.ids) {
      const fam = FAMILIES[famId];
      if (!fam) continue;

      const v = fam.rime[0];
      const last = fam.rime[1];

      for (const it of fam.items) {
        const onset = it.onset;

        const firstDistractors = stableShuffle(
          fam.tiles.filter((t) => t !== onset),
          `${levelConfig.key}:${famId}:${it.word}:first`
        ).slice(0, 2);

        // Middle distractors: consonants (not vowels). Keeps focus on blending without mixing vowel rules.
        const middleDistractors = stableShuffle(
          levelConsonants.filter((c) => !["a", "e", "i", "o", "u"].includes(c) && c !== v),
          `${levelConfig.key}:${famId}:${it.word}:middle`
        ).slice(0, 2);

        // Last distractors: other last letters used in this vowel level
        const lastDistractors = stableShuffle(
          levelLastLetters.filter((l) => l !== last),
          `${levelConfig.key}:${famId}:${it.word}:last`
        ).slice(0, 2);

        list.push({
          id: `${levelConfig.key}:${famId}:${it.word}`,
          word: it.word,
          phonemes: [onset, v, last],
          imageUrl: it.img,
          emoji: EMOJI[it.word] ?? "✨",
          distractorsBySlot: {
            first: firstDistractors,
            middle: middleDistractors,
            last: lastDistractors,
          },
        });
      }
    }
    return list;
  }, [levelConfig]);

  // --------------------
  // Play order (caps level length + supports micro spaced review)
  // --------------------
  const [playOrder, setPlayOrder] = useState<number[]>([]);
  const [pos, setPos] = useState(0);
  const posRef = useRef(0);
  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  useEffect(() => {
    if (!inPlayMode) return;
    if (!levelConfig) return;
    if (!LEVEL_ITEMS.length) return;

    const indices = LEVEL_ITEMS.map((_, i) => i);
    const shuffled = stableShuffle(indices, `${kidId || "anon"}:${levelConfig.key}:${GAME_ID}`);
    const trimmed = shuffled.slice(0, Math.min(MAX_WORDS_PER_LEVEL, shuffled.length));

    setPlayOrder(trimmed);
    setPos(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inPlayMode, levelConfig?.key, LEVEL_ITEMS.length, kidId]);

  const currentIdx = playOrder[clamp(pos, 0, Math.max(0, playOrder.length - 1))] ?? 0;
  const item = LEVEL_ITEMS[currentIdx];

  // --------------------
  // State
  // --------------------
  const [slots, setSlots] = useState<{ first: string | null; middle: string | null; last: string | null }>({
    first: null,
    middle: null,
    last: null,
  });

  const [prompt, setPrompt] = useState("Tap the speaker to listen.");
  const [phase, setPhase] = useState<SlotKey | "success">("first");
  const [shake, setShake] = useState<{ first: boolean; middle: boolean; last: boolean }>({
    first: false,
    middle: false,
    last: false,
  });

  const [confetti, setConfetti] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);

  // Pedagogy supports
  const [hasListened, setHasListened] = useState(false);
  const [hasActed, setHasActed] = useState(false);
  const roundStartMsRef = useRef<number>(0);
  const [hintLetter, setHintLetter] = useState<string | null>(null);
  const [reteachMode, setReteachMode] = useState(false);
  const [wrongBySlot, setWrongBySlot] = useState<Record<SlotKey, number>>({ first: 0, middle: 0, last: 0 });
  const reviewScheduledRef = useRef(false);

  // Prevent any double-completion / double-advance per word (fixes word skipping)
  const successLockRef = useRef(false);

  const slotRefs = useRef<Record<SlotKey, HTMLDivElement | null>>({
    first: null,
    middle: null,
    last: null,
  });

  // Fullscreen wrapper ref (IMPORTANT: requestFullscreen happens on this element)
  const fsWrapperRef = useRef<HTMLDivElement | null>(null);

  // --------------------
  // Drag engine (smooth)
  // --------------------
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [snapTarget, setSnapTarget] = useState<SlotKey | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);

  // Pointer pipeline for choices (tap vs drag is decided here; no onClick used)
  const choicePointerRef = useRef<{
    pointerId: number;
    letter: string;
    startX: number;
    startY: number;
    bubbleLeft: number;
    bubbleTop: number;
    dx: number;
    dy: number;
    dragging: boolean;
  } | null>(null);

  const dragRef = useRef<{
    id: string;
    dx: number;
    dy: number;
    x: number;
    y: number;
    raf: number | null;
    pointerId: number;
    absorbing: boolean;
  } | null>(null);

  const lastSnapRef = useRef<SlotKey | null>(null);

  const audioSlowRef = useRef<HTMLAudioElement | null>(null);
  const audioPhonemeRef = useRef<HTMLAudioElement | null>(null);

  // --------------------
  // Telemetry stub (wire to Firebase later)
  // --------------------
  function logEvent(name: string, payload: Record<string, any> = {}) {
    const logPayload = {
      gameId: GAME_ID,
      progressDocId: PROGRESS_DOC_ID,
      level: levelKeyParam,
      kidId: kidId || null,
      pos: posRef.current,
      ...payload,
      name,
      ts: Date.now(),
    };
    const anyWin = window as any;
    if (typeof anyWin.__TS_LOG__ === "function") {
      anyWin.__TS_LOG__(name, logPayload);
      return;
    }
    if (import.meta.env.DEV && anyWin.__TS_DEBUG_GAME_EVENTS__ === true) {
      console.debug("[TS_GAME_EVENT]", logPayload);
    }
  }

  // --------------------
  // Fullscreen helpers (cross-browser)
  // --------------------
  function safeExitFullscreen() {
    const d: any = document;
    const isFs = !!document.fullscreenElement || !!d.webkitFullscreenElement || !!d.msFullscreenElement;
    if (!isFs) return;
    const isActive =
      document.visibilityState !== "hidden" &&
      (typeof document.hasFocus !== "function" || document.hasFocus());
    if (!isActive) return;

    const exit = document.exitFullscreen || d.webkitExitFullscreen || d.msExitFullscreen;
    try {
      const r = exit?.call(document);
      // Some browsers return a promise, some don't
      if (r && typeof (r as Promise<void>).catch === "function") (r as Promise<void>).catch(() => {});
    } catch {
      // ignore
    }
  }

  async function safeRequestFullscreen(el: HTMLElement) {
    const anyEl: any = el;
    const req = el.requestFullscreen || anyEl.webkitRequestFullscreen || anyEl.msRequestFullscreen;
    if (!req) return;
    try {
      const r = req.call(el, { navigationUI: "hide" });
      if (r && typeof (r as Promise<void>).then === "function") await (r as Promise<void>);
    } catch {
      // ignore
    }
  }

  // Auto exit fullscreen when leaving play mode (fixes fullscreen “sticking”)
  useEffect(() => {
    if (inPlayMode) return;
    safeExitFullscreen();
  }, [inPlayMode]);

  // Exit fullscreen on unmount too (extra safety)
  useEffect(() => {
    return () => {
      safeExitFullscreen();
    };
  }, []);

  // --------------------
  // Hard guard: NEVER keep fs=1 on Levels screen
  // --------------------
  useEffect(() => {
    if (inPlayMode) return;
    if (!fsParam) return;
    const sp = new URLSearchParams(searchParamsRef.current);
    sp.delete("fs");
    setSearchParams(sp, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inPlayMode]);

  // --------------------
  // Fullscreen exit cleanup + isFullscreen state
  // --------------------
  useEffect(() => {
    const onFsChange = () => {
      const d: any = document;
      const nowFs = !!document.fullscreenElement || !!d.webkitFullscreenElement || !!d.msFullscreenElement;
      setIsFullscreen(nowFs);

      if (!nowFs) {
        const sp = new URLSearchParams(searchParamsRef.current);
        if (sp.get("fs") === "1") {
          sp.delete("fs");
          setSearchParams(sp, { replace: true });
        }
      }
    };
    document.addEventListener("fullscreenchange", onFsChange);
    // iOS Safari / older webkit sometimes uses webkitfullscreenchange
    document.addEventListener("webkitfullscreenchange" as any, onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange" as any, onFsChange);
    };
  }, [setSearchParams]);

  // Lock scroll when in Play + fullscreen param
  useEffect(() => {
    if (!inPlayMode) return;
    const d: any = document;
    const shouldLock = !!document.fullscreenElement || !!d.webkitFullscreenElement || fsParam;
    if (!shouldLock) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [inPlayMode, fsParam]);

  // --------------------
  // Navigation helpers
  // --------------------
  function goPhonicsLibraryCvcTab() {
    safeExitFullscreen();
    navigate(missionReturnHref, { replace: true });
  }

  function goLevels() {
    safeExitFullscreen();

    const sp = new URLSearchParams(searchParamsRef.current);
    sp.delete("level");
    sp.delete("fs");
    setSearchParams(sp, { replace: true });

    setLevelComplete(false);
    setPlayOrder([]);
    setPos(0);
    resetRound();
  }

  async function enterFullscreenOnPlayWrapperAndMarkFsParam(baseParams?: URLSearchParams) {
    const wrapper = fsWrapperRef.current;
    if (!wrapper) return;

    await safeRequestFullscreen(wrapper);

    // IMPORTANT: use provided params (fresh) or ref (fresh) to avoid reverting level
    const sp = new URLSearchParams(baseParams ?? searchParamsRef.current);
    sp.set("fs", "1");
    setSearchParams(sp, { replace: true });
  }

  async function startLevel(key: "a" | "e" | "i" | "o" | "u") {
    // Build params from ref (fresh)
    const sp = new URLSearchParams(searchParamsRef.current);
    applyKidAndMissionContext(sp, searchParamsRef.current, kidId);
    sp.set("level", key);
    sp.delete("fs");

    setSearchParams(sp, { replace: false });

    setLevelComplete(false);
    setPos(0);
    resetRound();

    // Wait two frames so the wrapper exists in DOM
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    await enterFullscreenOnPlayWrapperAndMarkFsParam(sp);

    logEvent("level_start", { level: key });
  }

  function goNextLevel() {
    const idx = VOWEL_GROUPS.findIndex((g) => g.key === levelKeyParam);
    const next = VOWEL_GROUPS[idx + 1]?.key ?? null;
    if (!next) {
      goLevels();
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    startLevel(next);
  }

  // --------------------
  // Audio (phoneme-friendly fallback)
  // --------------------
  const phonemeSpeakMap: Record<string, string> = {
    a: "aaa",
    e: "eh",
    i: "ih",
    o: "aw",
    u: "uh",
    b: "buh",
    c: "kuh",
    d: "duh",
    f: "fff",
    g: "guh",
    h: "huh",
    j: "juh",
    l: "lll",
    m: "mmm",
    n: "nnn",
    p: "puh",
    r: "rrr",
    s: "sss",
    t: "tuh",
    v: "vvv",
    w: "wuh",
    y: "yuh",
    z: "zzz",
  };

  function speak(text: string) {
    try {
      if (!("speechSynthesis" in window)) return;
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.9;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {
      // ignore
    }
  }

  function expectedFor(slotKey: SlotKey): string {
    if (!item) return "";
    if (slotKey === "first") return item.phonemes[0];
    if (slotKey === "middle") return item.phonemes[1];
    return item.phonemes[2];
  }

  function nextExpectedSlot(): SlotKey {
    if (!slots.first) return "first";
    if (!slots.middle) return "middle";
    return "last";
  }

  function resetRound() {
    setSlots({ first: null, middle: null, last: null });
    setShake({ first: false, middle: false, last: false });
    setConfetti(false);
    setCelebrate(false);
    setPhase("first");
    setPrompt("Tap the speaker to listen.");
    setDraggingId(null);
    setSnapTarget(null);
    lastSnapRef.current = null;

    // Pedagogy supports
    setHasListened(false);
    setHasActed(false);
    setHintLetter(null);
    setReteachMode(false);
    setWrongBySlot({ first: 0, middle: 0, last: 0 });
    reviewScheduledRef.current = false;
    roundStartMsRef.current = 0;

    // Locks / pointer cleanup
    successLockRef.current = false;
    choicePointerRef.current = null;

    // stop any active drag raf
    const d = dragRef.current;
    if (d?.raf) cancelAnimationFrame(d.raf);
    dragRef.current = null;

    // reset ghost
    if (ghostRef.current) {
      ghostRef.current.style.transition = "none";
      ghostRef.current.style.transform = "translate3d(-9999px,-9999px,0)";
    }
  }

  useEffect(() => {
    resetRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  function clearShakeLater(keys: SlotKey[]) {
    setTimeout(() => {
      setShake((p) => {
        const next = { ...p };
        for (const k of keys) next[k] = false;
        return next;
      });
    }, 420);
  }

  function fireShake(keys: SlotKey[]) {
    setShake((p) => {
      const next = { ...p };
      for (const k of keys) next[k] = true;
      return next;
    });
    clearShakeLater(keys);
  }

  function scheduleReviewIfNeeded(reason: "guided" | "reteach") {
    if (!item) return;
    if (reviewScheduledRef.current) return;
    reviewScheduledRef.current = true;

    const delay = 5; // micro spacing target
    setPlayOrder((prev) => {
      const cur = prev[posRef.current];
      if (cur == null) return prev;
      const copy = [...prev];
      const insertAt = Math.min(posRef.current + delay, copy.length);
      copy.splice(insertAt, 0, cur);
      return copy;
    });

    logEvent("review_scheduled", { reason, word: item.word });
  }

  async function playSlowAudio() {
    if (!item) return;

    // Listen-first gate unlock
    setHasListened(true);
    setHasActed(false);
    setHintLetter(null);
    setReteachMode(false);
    roundStartMsRef.current = performance.now();

    logEvent("listen_tap", { word: item.word });

    const el = audioSlowRef.current;
    if (el && el.src) {
      try {
        el.currentTime = 0;
        await el.play();
      } catch {
        const a = phonemeSpeakMap[item.phonemes[0]] ?? item.phonemes[0];
        const b = phonemeSpeakMap[item.phonemes[1]] ?? item.phonemes[1];
        const c = phonemeSpeakMap[item.phonemes[2]] ?? item.phonemes[2];
        speak(`${a}... ${b}... ${c}... ${item.word}`);
      }
    } else {
      const a = phonemeSpeakMap[item.phonemes[0]] ?? item.phonemes[0];
      const b = phonemeSpeakMap[item.phonemes[1]] ?? item.phonemes[1];
      const c = phonemeSpeakMap[item.phonemes[2]] ?? item.phonemes[2];
      speak(`${a}... ${b}... ${c}... ${item.word}`);
    }

    setPhase("first");
    setPrompt("Find the first sound.");
  }

  async function playPhoneme(slotKey: SlotKey) {
    if (!item) return;
    const url = item.phonemeAudioUrls?.[slotKey];

    if (url) {
      try {
        if (!audioPhonemeRef.current) audioPhonemeRef.current = new Audio(url);
        else audioPhonemeRef.current.src = url;
        audioPhonemeRef.current.currentTime = 0;
        await audioPhonemeRef.current.play();
        return;
      } catch {
        // fallback below
      }
    }

    const ph = expectedFor(slotKey);
    speak(phonemeSpeakMap[ph] ?? ph);
  }

  // Auto-hint if child freezes after listening
  useEffect(() => {
    if (!item) return;
    if (levelComplete) return;
    if (!hasListened) return;
    if (hasActed) return;
    if (phase === "success") return;

    const expected = nextExpectedSlot();
    const correct = expectedFor(expected);

    const t = window.setTimeout(() => {
      setHintLetter(correct);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      playPhoneme(expected);
      setPrompt("Try this one.");
      logEvent("auto_hint", { slot: expected, correct });
    }, AUTO_HINT_MS);

    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id, hasListened, hasActed, phase, levelComplete, slots.first, slots.middle, slots.last]);

  function finishLevelPopup() {
    setLevelComplete(true);
    setPrompt("Level complete! 🎉");
    logEvent("level_complete", { level: levelKeyParam, wordsPlayed: playOrder.length });
  }

  function placeCorrectIntoSlot(slotKey: SlotKey) {
    if (!item) return;
    if (levelComplete) return;

    const correctLetter = expectedFor(slotKey);

    setSlots((prev) => ({ ...prev, [slotKey]: correctLetter }));
    logEvent("guided_place", { slot: slotKey, letter: correctLetter, word: item.word });

    if (slotKey === "first") {
      setPhase("middle");
      setPrompt("Now the middle sound.");
      return;
    }
    if (slotKey === "middle") {
      setPhase("last");
      setPrompt("Now the last sound.");
      return;
    }

    celebrateThenAdvance();
  }

  function celebrateThenAdvance() {
    if (!item) return;
    if (successLockRef.current) return; // hard stop: prevents double completion
    successLockRef.current = true;

    setPhase("success");
    setCelebrate(true);
    setConfetti(true);

    // Replay blended word (simple)
    speak(item.word);

    setPrompt("You read it!");

    window.setTimeout(() => setConfetti(false), CONFETTI_MS);

    window.setTimeout(() => {
      setCelebrate(false);

      const nextPos = posRef.current + 1;
      if (nextPos >= playOrder.length) {
        finishLevelPopup();
        return;
      }
      setPos(nextPos);
    }, SUCCESS_PAUSE_MS);

    logEvent("word_success", { word: item.word });
  }

  function recordFirstActionIfNeeded(method: InputMethod) {
    if (hasActed) return;
    setHasActed(true);
    const t0 = roundStartMsRef.current || performance.now();
    const ms = Math.max(0, performance.now() - t0);
    logEvent("time_to_first_action", { ms: Math.round(ms), method, word: item?.word });
  }

  function applyWrongLadder(slotKey: SlotKey, correctLetter: string, wrongLetter: string | null, method: InputMethod) {
    setWrongBySlot((prev) => {
      const next = { ...prev };
      const attempts = (next[slotKey] ?? 0) + 1;
      next[slotKey] = attempts;

      logEvent("wrong_attempt", { slot: slotKey, attempts, correctLetter, wrongLetter, method, word: item?.word });

      if (attempts === 1) {
        setPrompt("Listen… try again.");
        setHintLetter(null);
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        playPhoneme(slotKey);
        fireShake([slotKey]);
      } else if (attempts === 2) {
        setPrompt("This one is the right sound.");
        setHintLetter(correctLetter);
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        playPhoneme(slotKey);
        fireShake([slotKey]);
      } else if (attempts === 3) {
        setPrompt("I’ll help with this one.");
        setHintLetter(correctLetter);
        scheduleReviewIfNeeded("guided");
        // Guided placement (guaranteed success)
        window.setTimeout(() => placeCorrectIntoSlot(slotKey), 250);
      } else {
        setPrompt("Let’s listen again.");
        setHintLetter(correctLetter);
        setReteachMode(true);
        scheduleReviewIfNeeded("reteach");
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        playSlowAudio();
      }

      return next;
    });
  }

  function tryPlace(slotKey: SlotKey, letter: string, method: InputMethod) {
    if (!item) return;
    if (levelComplete) return;
    if (successLockRef.current) return; // prevents any late extra input from completing again

    // Listen-first gate
    if (!hasListened) {
      setPrompt("Tap the speaker first.");
      fireShake([nextExpectedSlot()]);
      logEvent("blocked_no_listen", { method });
      return;
    }

    recordFirstActionIfNeeded(method);

    // Enforce order
    const expectedSlot = nextExpectedSlot();
    if (slotKey !== expectedSlot) {
      setPrompt(expectedSlot === "first" ? "First sound first." : expectedSlot === "middle" ? "Now the middle sound." : "Now the last sound.");
      fireShake([slotKey]);
      logEvent("wrong_slot", { tried: slotKey, expected: expectedSlot, method, letter });
      return;
    }

    // Reject wrong letter
    const correctLetter = expectedFor(slotKey);
    if (letter !== correctLetter) {
      applyWrongLadder(slotKey, correctLetter, letter, method);
      return;
    }

    // Correct placement
    setHintLetter(null);
    setReteachMode(false);
    setSlots((prev) => ({ ...prev, [slotKey]: letter }));
    logEvent("correct_place", { slot: slotKey, letter, method, word: item.word });

    if (slotKey === "first") {
      setPhase("middle");
      setPrompt("Now the middle sound.");
      return;
    }
    if (slotKey === "middle") {
      setPhase("last");
      setPrompt("Now the last sound.");
      return;
    }

    celebrateThenAdvance();
  }

  // --------------------
  // Choices shown (only for the current slot, capped)
  // --------------------
  const expectedSlotNow = nextExpectedSlot();
  const choices = useMemo(() => {
    if (!item) return [];
    if (levelComplete) return [];

    const correct = expectedFor(expectedSlotNow);
    const ds = item.distractorsBySlot?.[expectedSlotNow] ?? [];
    const base = Array.from(new Set([correct, ...ds].filter(Boolean)));

    // Choice cap: default 4, reduce to 3 when hinting, reduce to 2 in reteach.
    const n = reteachMode ? 2 : hintLetter ? 3 : 4;

    const shuffled = stableShuffle(base, `${item.id}:${expectedSlotNow}:${n}`);
    if (!shuffled.includes(correct)) shuffled.unshift(correct);

    return shuffled.slice(0, Math.min(n, shuffled.length));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id, expectedSlotNow, reteachMode, hintLetter, levelComplete]);

  // --------------------
  // Drag helpers (ghost + magnet)
  // --------------------
  function setGhostTransform(x: number, y: number, scale = 1) {
    const g = ghostRef.current;
    if (!g) return;
    g.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0) scale(${scale})`;
  }

  function computeSnapTargetForGhost(x: number, y: number): SlotKey | null {
    const targetSlot = nextExpectedSlot();
    const slotEl = slotRefs.current[targetSlot];
    if (!slotEl) return null;

    const r = slotEl.getBoundingClientRect();
    const slotCx = r.left + r.width / 2;
    const slotCy = r.top + r.height / 2;

    // bubble size 88 → half 44
    const bubbleCx = x + 44;
    const bubbleCy = y + 44;

    const dist = Math.hypot(slotCx - bubbleCx, slotCy - bubbleCy);
    const THRESH = 92; // kid-friendly

    return dist <= THRESH ? targetSlot : null;
  }

  function scheduleGhostUpdate() {
    const d = dragRef.current;
    if (!d || d.absorbing) return;
    if (d.raf) return;

    d.raf = requestAnimationFrame(() => {
      const dd = dragRef.current;
      if (!dd) return;
      dd.raf = null;

      setGhostTransform(dd.x, dd.y, 1);

      const nextSnap = computeSnapTargetForGhost(dd.x, dd.y);
      if (lastSnapRef.current !== nextSnap) {
        lastSnapRef.current = nextSnap;
        setSnapTarget(nextSnap);
      }
    });
  }

  function absorbIntoSlot(slotKey: SlotKey, letter: string) {
    const d = dragRef.current;
    const g = ghostRef.current;
    const slotEl = slotRefs.current[slotKey];
    if (!d || !g || !slotEl) {
      tryPlace(slotKey, letter, "drag");
      return;
    }

    d.absorbing = true;

    const r = slotEl.getBoundingClientRect();
    const targetX = r.left + r.width / 2 - 44;
    const targetY = r.top + r.height / 2 - 44;

    g.style.transition = "transform 160ms ease-out";
    setGhostTransform(targetX, targetY, 0.2);

    setTimeout(() => {
      setDraggingId(null);
      setSnapTarget(null);
      lastSnapRef.current = null;
      dragRef.current = null;

      if (ghostRef.current) {
        ghostRef.current.style.transition = "none";
        setGhostTransform(-9999, -9999, 1);
      }

      tryPlace(slotKey, letter, "drag");
    }, 170);
  }

  function finishDragDrop(clientX: number, clientY: number, letter: string) {
    const d = dragRef.current;
    if (!d) return;

    const near = computeSnapTargetForGhost(d.x, d.y);

    if (d.raf) cancelAnimationFrame(d.raf);

    if (near) {
      absorbIntoSlot(near, letter);
      return;
    }

    const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    const slot = el?.closest?.("[data-slot]") as HTMLElement | null;
    const slotKey = (slot?.getAttribute("data-slot") as SlotKey | null) ?? null;

    setDraggingId(null);
    setSnapTarget(null);
    lastSnapRef.current = null;
    dragRef.current = null;

    if (ghostRef.current) {
      ghostRef.current.style.transition = "none";
      setGhostTransform(-9999, -9999, 1);
    }

    if (slotKey) tryPlace(slotKey, letter, "drag");
  }

  // --------------------
  // Unified pointer pipeline for choice bubbles (tap OR drag; never both)
  // --------------------
  function onChoicePointerDown(e: React.PointerEvent, letter: string) {
    if (levelComplete) return;

    // Listen-first gate: block both tap and drag before listening
    if (!hasListened) {
      e.preventDefault();
      setPrompt("Tap the speaker first.");
      return;
    }

    e.preventDefault();

    const bubbleRect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const dx = e.clientX - bubbleRect.left;
    const dy = e.clientY - bubbleRect.top;

    choicePointerRef.current = {
      pointerId: e.pointerId,
      letter,
      startX: e.clientX,
      startY: e.clientY,
      bubbleLeft: bubbleRect.left,
      bubbleTop: bubbleRect.top,
      dx,
      dy,
      dragging: false,
    };

    // capture pointer so we always get up/move
    (e.currentTarget as any).setPointerCapture?.(e.pointerId);
  }

  function onChoicePointerMove(e: React.PointerEvent) {
    const st = choicePointerRef.current;
    if (!st) return;
    if (st.pointerId !== e.pointerId) return;

    e.preventDefault();

    const dist = Math.hypot(e.clientX - st.startX, e.clientY - st.startY);

    // Start drag only after threshold movement
    if (!st.dragging && dist >= DRAG_START_PX) {
      st.dragging = true;

      setDraggingId(st.letter);
      setSnapTarget(null);
      lastSnapRef.current = null;

      dragRef.current = {
        id: st.letter,
        dx: st.dx,
        dy: st.dy,
        x: st.bubbleLeft,
        y: st.bubbleTop,
        raf: null,
        pointerId: st.pointerId,
        absorbing: false,
      };

      const g = ghostRef.current;
      if (g) {
        g.style.transition = "none";
        setGhostTransform(st.bubbleLeft, st.bubbleTop, 1);
      }
    }

    // If dragging, update drag position
    if (st.dragging && dragRef.current) {
      const d = dragRef.current;
      d.x = e.clientX - d.dx;
      d.y = e.clientY - d.dy;
      scheduleGhostUpdate();
    }
  }

  function onChoicePointerUp(e: React.PointerEvent) {
    const st = choicePointerRef.current;
    if (!st) return;
    if (st.pointerId !== e.pointerId) return;

    e.preventDefault();

    choicePointerRef.current = null;

    // TAP case (never started drag)
    if (!st.dragging) {
      tryPlace(nextExpectedSlot(), st.letter, "tap");
      return;
    }

    // DRAG case
    finishDragDrop(e.clientX, e.clientY, st.letter);
  }

  function onChoicePointerCancel(e: React.PointerEvent) {
    const st = choicePointerRef.current;
    if (!st) return;
    if (st.pointerId !== e.pointerId) return;

    choicePointerRef.current = null;

    setDraggingId(null);
    setSnapTarget(null);
    lastSnapRef.current = null;

    if (dragRef.current?.raf) cancelAnimationFrame(dragRef.current.raf);
    dragRef.current = null;

    if (ghostRef.current) {
      ghostRef.current.style.transition = "none";
      setGhostTransform(-9999, -9999, 1);
    }
  }

  async function enterFullscreenManual() {
    await enterFullscreenOnPlayWrapperAndMarkFsParam(new URLSearchParams(searchParamsRef.current));
  }

  function exitFullscreenManual() {
    safeExitFullscreen();
    const sp = new URLSearchParams(searchParamsRef.current);
    sp.delete("fs");
    setSearchParams(sp, { replace: true });
  }

  // --------------------
  // UI bits
  // --------------------
  const slotBadge = (n: number, color: string) => (
    <div className="absolute -top-3 -left-3 h-9 w-9 rounded-full grid place-items-center text-white font-extrabold shadow" style={{ background: color }}>
      {n}
    </div>
  );

  const slotClass = (key: SlotKey) => {
    const base = "relative flex items-center justify-center rounded-2xl border-2 border-dashed bg-white/70 shadow-sm h-[110px] md:h-[140px]";
    const shakeClass = shake[key] ? "ts-shake" : "";
    const highlight = phase === key ? "ring-4 ring-blue-300 border-blue-300 bg-white" : "border-amber-200";
    const magnet = snapTarget === key ? "ring-4 ring-emerald-300 border-emerald-300" : "";
    return `${base} ${highlight} ${magnet} ${shakeClass}`;
  };

  const bubbleStyle =
    "select-none rounded-full shadow-md border-2 border-white grid place-items-center text-white font-extrabold text-3xl w-[88px] h-[88px] md:w-[96px] md:h-[96px]";

  const bubbleBg = (letter: string) => {
    const map: Record<string, string> = {
      a: "bg-red-500",
      c: "bg-orange-500",
      t: "bg-blue-500",
      m: "bg-emerald-500",
      i: "bg-yellow-500",
      p: "bg-pink-500",
      n: "bg-slate-500",
      b: "bg-indigo-500",
      h: "bg-lime-500",
      r: "bg-rose-500",
      d: "bg-teal-500",
      f: "bg-cyan-600",
      v: "bg-violet-600",
      j: "bg-amber-600",
      y: "bg-fuchsia-600",
      w: "bg-sky-600",
      l: "bg-emerald-700",
      z: "bg-purple-700",
      g: "bg-green-700",
      o: "bg-orange-600",
      u: "bg-teal-600",
      s: "bg-purple-500",
      e: "bg-red-600",
    };
    return map[letter] ?? "bg-sky-500";
  };

  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const g of VOWEL_GROUPS) {
      let c = 0;
      for (const famId of g.ids) c += FAMILIES[famId]?.items?.length ?? 0;
      counts[g.key] = c;
    }
    return counts;
  }, []);

  // --------------------
  // LEVELS SCREEN
  // --------------------
  if (!inPlayMode) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="flex items-center justify-between">
          <div className="text-xl font-semibold text-slate-900">3. CVC Word Reader</div>
          <button onClick={goPhonicsLibraryCvcTab} className="rounded-full border bg-white px-4 py-2 text-sm font-semibold">
            ← Back to Mission
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {VOWEL_GROUPS.map((g, i) => (
            <button
              key={g.key}
              onClick={() => {
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                startLevel(g.key);
              }}
              className="rounded-xl border bg-white p-5 text-left shadow-sm transition hover:shadow-md hover:border-slate-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold text-slate-900">
                    Level {i + 1} — {g.title}
                  </div>
                  <div className="text-sm text-slate-600">
                    Build CVC words ({levelCounts[g.key]} total • plays {MAX_WORDS_PER_LEVEL} per session)
                  </div>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">Play</span>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 text-xs text-slate-500">Dev: GAME_ID={GAME_ID} • PROGRESS_DOC_ID={PROGRESS_DOC_ID}</div>
      </div>
    );
  }

  // Guard if someone enters /play without items
  if (!levelConfig || !LEVEL_ITEMS.length || !item || !playOrder.length) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="rounded-xl border bg-white p-6">
          <div className="text-lg font-semibold text-slate-900">This level isn’t ready yet.</div>
          <button onClick={goLevels} className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-white">
            Back to Levels
          </button>
        </div>
      </div>
    );
  }

  const builtWord = `${slots.first ?? ""}${slots.middle ?? ""}${slots.last ?? ""}`;

  // --------------------
  // PLAY SCREEN (FULL OVERLAY)
  // --------------------
  return (
    <div ref={fsWrapperRef} className="fixed inset-0 z-[9999] bg-slate-50">
      <style>{`
        @keyframes tsShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .ts-shake { animation: tsShake 0.36s ease-in-out; }

        .ts-ghost {
          position: fixed;
          left: 0;
          top: 0;
          will-change: transform;
          pointer-events: none;
          z-index: 100000;
          transform: translate3d(-9999px,-9999px,0);
        }

        @keyframes tsPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        .ts-hint { animation: tsPulse 0.9s ease-in-out infinite; box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.25); }
      `}</style>

      <div className="mx-auto h-full w-full max-w-6xl px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="rounded-full border bg-white px-4 py-2 text-sm font-semibold text-slate-800">
            3. CVC Word Reader • {levelConfig.title} • Word {pos + 1}/{playOrder.length}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={goLevels} className="rounded-full border bg-white px-4 py-2 text-sm font-semibold">
              ← Back to Levels
            </button>

            <button onClick={resetRound} className="rounded-full border bg-white px-4 py-2 text-sm font-semibold">
              ↻ Reset
            </button>

            <button onClick={goPhonicsLibraryCvcTab} className="rounded-full border bg-white px-4 py-2 text-sm font-semibold">
              ↩ Back to Mission
            </button>

            <button onClick={enterFullscreenManual} className="rounded-full border bg-white px-4 py-2 text-sm font-semibold">
              ⛶ Fullscreen
            </button>

            {(isFullscreen || fsParam) && (
              <button onClick={exitFullscreenManual} className="rounded-full border bg-white px-4 py-2 text-sm font-semibold">
                Exit Fullscreen
              </button>
            )}
          </div>
        </div>

        {/* Stage */}
        <div className="relative mt-4 h-[calc(100%-64px)] overflow-hidden rounded-3xl border bg-gradient-to-b from-sky-100 to-emerald-100 shadow-xl">
          <ConfettiBurst fire={confetti} durationMs={CONFETTI_MS} />

          <div className="relative h-full w-full" style={{ aspectRatio: "16 / 9" }}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.85),rgba(255,255,255,0.35))]" />

            {/* Prompt */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 rounded-full bg-white/80 px-5 py-2 text-sm font-semibold text-slate-800 shadow">
              {prompt}
            </div>

            {/* TOP — LETTER CHOICES (pointer pipeline: tap OR drag) */}
            <div className="absolute left-1/2 top-[64px] -translate-x-1/2 flex gap-4 items-center justify-center">
              {choices.map((ch) => {
                const isDraggingThis = draggingId === ch;
                const disabled = levelComplete || phase === "success" || !hasListened || successLockRef.current;
                const isHint = hintLetter === ch;

                return (
                  <div
                    key={ch}
                    onPointerDown={(e) => !disabled && onChoicePointerDown(e, ch)}
                    onPointerMove={(e) => !disabled && onChoicePointerMove(e)}
                    onPointerUp={(e) => !disabled && onChoicePointerUp(e)}
                    onPointerCancel={(e) => !disabled && onChoicePointerCancel(e)}
                    className={`${bubbleStyle} ${bubbleBg(ch)} ${isHint ? "ts-hint" : ""}`}
                    style={{
                      touchAction: "none",
                      cursor: disabled ? "not-allowed" : "grab",
                      opacity: disabled ? 0.35 : isDraggingThis ? 0.15 : 1,
                    }}
                    role="button"
                    aria-label={`Letter ${ch}`}
                  >
                    {ch}
                  </div>
                );
              })}
            </div>

            {/* MIDDLE — SLOTS */}
            <div className="absolute left-1/2 top-[42%] -translate-x-1/2 w-[92%] max-w-4xl">
              <div className="grid grid-cols-3 gap-4">
                <div
                  ref={(el) => {
                    slotRefs.current.first = el;
                  }}
                  className={slotClass("first")}
                  data-slot="first"
                >
                  {slotBadge(1, "#f59e0b")}
                  <button
                    type="button"
                    onClick={() => playPhoneme("first")}
                    className="absolute right-3 top-3 rounded-full bg-slate-900/10 px-3 py-1 text-sm font-bold text-slate-700 hover:bg-slate-900/15"
                    title="Tap to hear correct sound"
                  >
                    🔊
                  </button>
                  <div className="text-5xl font-extrabold text-slate-700">{slots.first ?? ""}</div>
                </div>

                <div
                  ref={(el) => {
                    slotRefs.current.middle = el;
                  }}
                  className={slotClass("middle")}
                  data-slot="middle"
                >
                  {slotBadge(2, "#22c55e")}
                  <button
                    type="button"
                    onClick={() => playPhoneme("middle")}
                    className="absolute right-3 top-3 rounded-full bg-slate-900/10 px-3 py-1 text-sm font-bold text-slate-700 hover:bg-slate-900/15"
                    title="Tap to hear correct sound"
                  >
                    🔊
                  </button>
                  <div className="text-5xl font-extrabold text-slate-700">{slots.middle ?? ""}</div>
                </div>

                <div
                  ref={(el) => {
                    slotRefs.current.last = el;
                  }}
                  className={slotClass("last")}
                  data-slot="last"
                >
                  {slotBadge(3, "#3b82f6")}
                  <button
                    type="button"
                    onClick={() => playPhoneme("last")}
                    className="absolute right-3 top-3 rounded-full bg-slate-900/10 px-3 py-1 text-sm font-bold text-slate-700 hover:bg-slate-900/15"
                    title="Tap to hear correct sound"
                  >
                    🔊
                  </button>
                  <div className="text-5xl font-extrabold text-slate-700">{slots.last ?? ""}</div>
                </div>
              </div>

              {/* Built word clarity */}
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 shadow-sm border">
                  <span className="text-sm font-semibold text-slate-700">Word:</span>
                  <span className="text-2xl font-extrabold text-slate-900 tracking-wide">{builtWord || "—"}</span>
                  {phase === "success" && <span className="text-xl">✅</span>}
                </div>
              </div>
            </div>

            {/* BOTTOM — IMAGE + BIG SPEAKER */}
            <div className="absolute left-1/2 bottom-8 -translate-x-1/2 w-[92%] max-w-4xl flex items-center justify-center gap-6">
              <div className="relative h-[150px] w-[220px] overflow-hidden rounded-2xl bg-white shadow-lg border">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.word}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : null}

                <div className="absolute inset-0 grid place-items-center text-6xl">{celebrate ? "✨" : item.emoji ?? "✨"}</div>
              </div>

              <button
                onClick={playSlowAudio}
                className={`h-[78px] w-[78px] rounded-full text-white shadow-lg grid place-items-center active:scale-[0.98] ${
                  hasListened ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-700 animate-pulse"
                }`}
                aria-label="Play word audio"
                title="Tap to listen"
              >
                <span className="text-3xl">🔊</span>
              </button>

              <audio ref={audioSlowRef} src={item.audioSlowUrl ?? ""} preload="auto" />
            </div>

            {/* Drag ghost */}
            <div
              ref={ghostRef}
              className={`ts-ghost ${bubbleStyle} ${draggingId ? bubbleBg(draggingId) : "bg-sky-500"}`}
              style={{
                opacity: draggingId ? 1 : 0,
              }}
            >
              {draggingId ?? ""}
            </div>

            {/* Level Complete Popup */}
            {levelComplete && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="w-[92%] max-w-xl rounded-2xl bg-white p-6 shadow-xl">
                  <div className="text-xl font-semibold text-slate-900">Level complete! 🎉</div>
                  <p className="mt-1 text-slate-600">What next?</p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      onClick={() => {
                        setLevelComplete(false);
                        setPos(0);
                        resetRound();
                      }}
                      className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white"
                    >
                      Replay
                    </button>

                    <button onClick={goLevels} className="rounded-lg border bg-white px-4 py-2 font-semibold">
                      Back to Levels
                    </button>

                    <button onClick={goNextLevel} className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white">
                      Next Level
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 text-xs text-slate-500">
          Dev: GAME_ID={GAME_ID} • PROGRESS_DOC_ID={PROGRESS_DOC_ID} • kidId={kidId || "—"}
        </div>
      </div>
    </div>
  );
}
