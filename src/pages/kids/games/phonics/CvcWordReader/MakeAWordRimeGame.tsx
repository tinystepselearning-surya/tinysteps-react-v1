import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

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
  const fn =
    document.exitFullscreen ||
    d.webkitExitFullscreen ||
    d.mozCancelFullScreen ||
    d.msExitFullscreen;

  if (fn) {
    try {
      fn.call(document);
    } catch {
      // ignore
    }
  }
}

const makeTiles = (family: FamilyConfig): Tile[] =>
  family.tiles.map((ch, index) => ({ id: `${family.id}-${ch}-${index}`, ch }));

const makeConfettiPieces = (count: number, baseDur: number): ConfettiPiece[] => {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    id: `${now}-${i}`,
    leftPct: Math.random() * 100,
    delayMs: Math.random() * 350,
    durMs: baseDur + Math.random() * 900,
    rot: Math.random() * 360,
    size: 6 + Math.random() * 10,
    bg: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  }));
};

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export default function MakeAWordRimeGame() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const kidId = sp.get("kidId") ?? "";

  const CONFETTI_MS = 4000;

  const [screen, setScreen] = useState<Screen>("levels");
  const [familyId, setFamilyId] = useState<string>("at");
  const family = FAMILIES[familyId] ?? FAMILIES.at;

  const [tiles, setTiles] = useState<Tile[]>(() => makeTiles(family));

  const [idx, setIdx] = useState(0);
  const current = family.items[idx] ?? family.items[0];

  const [placed, setPlaced] = useState<string | null>(null);
  const [flash, setFlash] = useState<"none" | "green" | "wrong">("none");
  const [showBuiltWord, setShowBuiltWord] = useState(false);
  const [imgOk, setImgOk] = useState(true);

  // celebration UI
  const [cheer, setCheer] = useState<string | null>(null);
  const [isCelebrating, setIsCelebrating] = useState(false);

  // confetti
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const confettiClearRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // layout refs
  const rootRef = useRef<HTMLDivElement | null>(null);
  const blankRef = useRef<HTMLDivElement | null>(null);

  // smooth drag state (pointer drag)
  const dragRef = useRef<{
    tileId: string;
    ch: string;
    pointerId: number;
    startX: number;
    startY: number;
    baseCenter: { x: number; y: number };
    dx: number;
    dy: number;
  } | null>(null);

  const rafRef = useRef<number | null>(null);
  const latestMoveRef = useRef<{ dx: number; dy: number } | null>(null);

  const [dragState, setDragState] = useState<{ tileId: string; dx: number; dy: number } | null>(
    null
  );
  const [nearState, setNearState] = useState<{
    isNear: boolean;
    isCorrectNear: boolean;
  }>({ isNear: false, isCorrectNear: false });

  const isComplete = placed === current.onset;

  // ALWAYS show Levels first (hard)
  useEffect(() => {
    setScreen("levels");
  }, []);

  // no scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // audio
  useEffect(() => {
    try {
      audioRef.current = new Audio("/confetti.mp3");
      audioRef.current.volume = 0.9;
    } catch {
      audioRef.current = null;
    }
  }, []);

  // reset when family changes
  useEffect(() => {
    setTiles(makeTiles(family));
    setIdx(0);
    setPlaced(null);
    setFlash("none");
    setShowBuiltWord(false);
    setImgOk(true);
    setCheer(null);
    setIsCelebrating(false);
    setNearState({ isNear: false, isCorrectNear: false });
    setDragState(null);
    dragRef.current = null;
  }, [familyId]); // eslint-disable-line react-hooks/exhaustive-deps

  // reset when word changes
  useEffect(() => {
    setPlaced(null);
    setFlash("none");
    setShowBuiltWord(false);
    setImgOk(true);
    setCheer(null);
    setIsCelebrating(false);
    setNearState({ isNear: false, isCorrectNear: false });
    setDragState(null);
    dragRef.current = null;
  }, [idx]);

  // leave fullscreen when returning to levels
  useEffect(() => {
    if (screen === "levels") safeExitFullscreen();
    // also clear confetti if needed
    if (screen !== "play") setConfetti([]);
  }, [screen]);

  const goBackToLibrary = () => {
    safeExitFullscreen();
    navigate(`/kids/games/phonics?kidId=${encodeURIComponent(kidId)}&phase=cvc_word_reader`);
  };

  const speak = (text: string) => {
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
  };

  const speakTargetLetterSound = () => {
    const ch = current.onset.toLowerCase();
    speak(LETTER_PHONEME[ch] ?? ch);
  };

  const speakWord = () => speak(current.word);

  const burstConfetti = (big: boolean) => {
    if (confettiClearRef.current) window.clearTimeout(confettiClearRef.current);
    setConfetti(makeConfettiPieces(big ? 180 : 150, 4200));

    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    } catch {
      // ignore
    }

    confettiClearRef.current = window.setTimeout(() => setConfetti([]), CONFETTI_MS);
  };

  const goToFamily = (id: string) => {
    const fam = FAMILIES[id] ?? FAMILIES.at;

    setIdx(0);
    setTiles(makeTiles(fam));
    setPlaced(null);
    setFlash("none");
    setShowBuiltWord(false);
    setImgOk(true);
    setCheer(null);
    setIsCelebrating(false);

    setNearState({ isNear: false, isCorrectNear: false });
    setDragState(null);
    dragRef.current = null;

    if (confettiClearRef.current) window.clearTimeout(confettiClearRef.current);
    setConfetti([]);

    setFamilyId(fam.id);
    setScreen("play");
  };

  const pickFamily = (id: string) => {
    // fullscreen must start on a user tap
    if (rootRef.current) safeRequestFullscreen(rootRef.current);
    goToFamily(id);
  };

  const advance = () => {
    if (idx >= family.items.length - 1) {
      setScreen("complete");
      return;
    }
    setIdx((v) => v + 1);
  };

  const showCheer = () => {
    const msg = CHEERS[Math.floor(Math.random() * CHEERS.length)];
    setCheer(msg);
    window.setTimeout(() => setCheer(null), 900);
  };

  const correctPlace = (ch: string) => {
    if (isCelebrating) return;

    const isLast = idx >= family.items.length - 1;

    setIsCelebrating(true);
    setPlaced(ch);
    setFlash("green");
    setShowBuiltWord(false);

    showCheer();
    burstConfetti(isLast);

    window.setTimeout(() => setShowBuiltWord(true), 220);

    // move to next after confetti duration
    window.setTimeout(() => {
      setIsCelebrating(false);
      setFlash("none");
      advance();
    }, CONFETTI_MS);
  };

  const wrongPlace = () => {
    if (isCelebrating) return;
    setFlash("wrong");
    window.setTimeout(() => setFlash("none"), 320);
  };

  // difficulty: magnet radius shrinks as the player progresses
  const magnetRadius = useMemo(() => {
    // start easy, then tighter
    const base = 150;
    const step = 12; // difficulty increases each word
    return Math.max(80, base - idx * step);
  }, [idx]);

  const getBlankCenter = () => {
    const r = blankRef.current?.getBoundingClientRect();
    if (!r) return null;
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };

  const startDrag = (e: React.PointerEvent<HTMLDivElement>, tile: Tile) => {
    if (isCelebrating || screen !== "play") return;

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
    if (!d || isCelebrating) return;
    if (e.pointerId !== d.pointerId) return;

    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;

    d.dx = dx;
    d.dy = dy;
    latestMoveRef.current = { dx, dy };
    scheduleRafUpdate();

    const blankC = getBlankCenter();
    if (!blankC) return;

    const tileC = { x: d.baseCenter.x + dx, y: d.baseCenter.y + dy };
    const distance = dist(tileC, blankC);

    const isNear = distance <= magnetRadius;
    const isCorrectNear = isNear && d.ch === current.onset;

    // glow feedback
    setNearState({ isNear, isCorrectNear });

    // ✅ AUTO-FORM when close enough and correct (no exact drop needed)
    if (isCorrectNear && !isComplete && !isCelebrating) {
      // stop drag and accept
      dragRef.current = null;
      setDragState(null);
      setNearState({ isNear: false, isCorrectNear: false });
      correctPlace(d.ch);
    }
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || isCelebrating) return;
    if (e.pointerId !== d.pointerId) return;

    const { isNear, isCorrectNear } = nearState;

    // If near but wrong, mark wrong on release.
    if (isNear && !isCorrectNear && d.ch !== current.onset && !isComplete) {
      wrongPlace();
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

  const nextFamily = () => {
    const i = FAMILY_ORDER.indexOf(familyId as any);
    const next = FAMILY_ORDER[(i + 1) % FAMILY_ORDER.length];
    goToFamily(next);
  };

  const repeatLevel = () => {
    goToFamily(familyId);
  };

  const wordCardBg = flash === "green" ? "bg-green-200" : "bg-sky-200";
  const blankGlow =
    nearState.isNear && !isCelebrating
      ? nearState.isCorrectNear
        ? "ring-8 ring-green-300/70"
        : "ring-8 ring-red-300/70"
      : "";

  // used to re-trigger animations per word
  const animKey = `${familyId}-${idx}`;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: "radial-gradient(circle at 50% 40%, #ff88b5 0%, #ff5fa2 55%, #ff4b96 100%)",
      }}
    >
      {/* Debug badge: if you don't see this, wrong file is running */}
      <div className="absolute top-4 left-4 z-[10000] px-3 py-1 rounded-full bg-black/35 text-white text-xs font-extrabold border border-white/20">
        MAW v3 — MAGNET DRAG + YAY
      </div>

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
                opacity: 0.95,
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
          onClick={goBackToLibrary}
        >
          ← Back to Phonics Library
        </button>
      </div>

      {/* LEVELS SCREEN */}
      {screen === "levels" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-[28px] p-7 shadow-2xl w-[min(1120px,95vw)] max-h-[86vh] overflow-auto border border-slate-200">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="text-3xl font-extrabold text-slate-900">Choose a Level</div>
              <button
                onClick={goBackToLibrary}
                className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold transition active:scale-[0.98]"
              >
                ← Back to Phonics Library
              </button>
            </div>

            <div className="text-slate-600 mb-6">
              Pick a word family (like <b>-at</b>, <b>-ig</b>). Then <b>drag the first letter near the box</b> — it snaps
              when close enough.
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
                        className={[
                          "h-16 px-5 rounded-2xl border-2 font-extrabold text-2xl leading-none",
                          "bg-white hover:bg-sky-50 border-sky-200 text-slate-900",
                          "shadow-sm hover:shadow-md transition active:scale-[0.98]",
                          "whitespace-nowrap min-w-[90px]",
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
              <div className="text-xs text-slate-500">
                Tip: The snap zone gets smaller as kids progress (automatic difficulty).
              </div>
              <div className="text-xs text-slate-500">
                Best on iPad/Touch: smooth “drag + snap”.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETE SCREEN */}
      {screen === "complete" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/45">
          <div className="bg-white rounded-[28px] p-7 shadow-2xl w-[min(620px,92vw)] text-center border border-slate-200">
            <div className="text-4xl font-extrabold text-slate-900 mb-2 animate-[popIn_260ms_ease-out]">
              Level Complete! 🎉
            </div>
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
                onClick={goBackToLibrary}
                className="text-sm font-bold text-slate-600 hover:text-slate-900 underline underline-offset-4"
              >
                ← Back to Phonics Library
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
              <span className="ml-3 text-white/80 text-sm font-bold">
                (magnet: {magnetRadius}px)
              </span>
            </div>

            <button
              onClick={speakTargetLetterSound}
              disabled={isCelebrating}
              className={[
                "px-4 py-2 rounded-full bg-white/15 text-white border border-white/30 font-extrabold",
                "hover:bg-white/20 transition active:scale-[0.98]",
                isCelebrating ? "opacity-60 cursor-not-allowed" : "",
              ].join(" ")}
              title="Play first sound"
            >
              🔊 First Sound
            </button>
          </div>

          {/* letters row */}
          <div className="mt-8 w-full flex justify-center">
            <div className="flex flex-wrap justify-center gap-4">
              {tiles.map((tile) => {
                const isDragging = dragState?.tileId === tile.id;
                const dx = isDragging ? dragState!.dx : 0;
                const dy = isDragging ? dragState!.dy : 0;

                return (
                  <div
                    key={tile.id}
                    onPointerDown={(e) => startDrag(e, tile)}
                    onPointerMove={moveDrag}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                    className={[
                      "w-24 h-24 rounded-2xl bg-sky-200 shadow-lg border-4 border-sky-300",
                      "flex items-center justify-center select-none",
                      "text-6xl font-black text-black",
                      "touch-none", // IMPORTANT: smooth drag on touch devices
                      isCelebrating ? "opacity-60 cursor-not-allowed" : "cursor-grab",
                      isDragging ? "z-50" : "",
                    ].join(" ")}
                    style={{
                      transform: isDragging ? `translate3d(${dx}px, ${dy}px, 0)` : "translate3d(0,0,0)",
                      transition: isDragging ? "none" : "transform 220ms ease",
                    }}
                    aria-label={`Letter ${tile.ch}`}
                    title="Drag down near the box"
                  >
                    {tile.ch}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3 text-white/85 font-semibold text-center">
            Drag the correct first letter near the box 👇
            <div className="text-white/70 text-sm">
              (It snaps when close enough — and gets harder as you go!)
            </div>
          </div>

          {/* CENTER: word formation */}
          <div className="flex-1 w-full flex flex-col items-center justify-center">
            {/* WORD CARD (keep inside as-is) */}
            <div
              className={[
                "relative w-[min(820px,94vw)] h-[190px] rounded-2xl shadow-xl border-4 border-sky-300",
                wordCardBg,
                flash === "wrong" ? "animate-[shake_0.35s_ease-in-out]" : "",
              ].join(" ")}
              style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.25)" }}
            >
              {/* BIG CHEER */}
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
                      isCelebrating ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
                    ].join(" ")}
                    aria-label="Target box"
                    title="Bring the correct letter near me!"
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
                {idx + 1} / {family.items.length}
              </div>

              {isCelebrating && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="px-8 py-4 rounded-full bg-white/70 text-slate-900 text-4xl font-black shadow-lg animate-[pop_0.35s_ease-out]">
                    YAY! 🎉
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* BOTTOM ROW: image */}
          <div className="w-full flex items-center justify-center pb-8">
            <div
              className="w-44 h-44 md:w-56 md:h-56 flex items-center justify-center"
              onClick={speakWord}
              style={{ cursor: isCelebrating ? "default" : "pointer" }}
              title="Tap picture to hear the word"
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
            100% { transform: translateY(110vh) rotate(720deg); opacity: 0.15; }
          }
        `}
      </style>
    </div>
  );
}
