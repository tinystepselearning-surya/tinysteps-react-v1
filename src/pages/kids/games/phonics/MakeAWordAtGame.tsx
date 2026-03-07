import React, { useEffect, useRef, useState } from "react";
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

// Emoji fallback if images are missing
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

function makeTiles(family: FamilyConfig): Tile[] {
  const stamp = Date.now();
  return family.tiles.map((ch, i) => ({ id: `t-${stamp}-${i}-${ch}`, ch }));
}

function makeConfettiPieces(count: number, durMsBase: number): ConfettiPiece[] {
  const colors = ["#ffffff", "#ffe28a", "#b7f5ff", "#c8ffb6", "#ffd0e6", "#d9c8ff"];
  const out: ConfettiPiece[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      id: `c-${Date.now()}-${i}`,
      leftPct: Math.random() * 100,
      delayMs: Math.floor(Math.random() * 200),
      durMs: durMsBase + Math.floor(Math.random() * 800),
      rot: Math.floor(Math.random() * 360),
      size: 7 + Math.floor(Math.random() * 10),
      bg: colors[Math.floor(Math.random() * colors.length)],
    });
  }
  return out;
}

type Screen = "levels" | "play" | "complete";

const LETTER_PHONEME: Record<string, string> = {
  a: "a",
  b: "buh",
  c: "kuh",
  d: "duh",
  e: "eh",
  f: "ffff",
  g: "guh",
  h: "huh",
  i: "ih",
  j: "juh",
  k: "kuh",
  l: "lll",
  m: "mmm",
  n: "nnn",
  o: "oh",
  p: "puh",
  q: "kuh",
  r: "rrr",
  s: "sss",
  t: "tuh",
  u: "uh",
  v: "vvv",
  w: "wuh",
  x: "ks",
  y: "yuh",
  z: "zzz",
};

export default function MakeAWordRimeGame() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  const kidId = sp.get("kidId") ?? "";

  // NOTE: we intentionally ignore ?family= for the initial screen.
  // Requirement: ALWAYS show Levels first.
  const [screen, setScreen] = useState<Screen>("levels");

  const [familyId, setFamilyId] = useState<string>("at");
  const family = FAMILIES[familyId] ?? FAMILIES.at;

  // ✅ Tiles should NEVER shrink/disappear after correct → keep constant.
  const [tiles, setTiles] = useState<Tile[]>(() => makeTiles(family));

  const [idx, setIdx] = useState(0);
  const current = family.items[idx];

  const [placed, setPlaced] = useState<string | null>(null);
  const [flash, setFlash] = useState<"none" | "green" | "wrong">("none");
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [showBuiltWord, setShowBuiltWord] = useState(false);

  const [imgOk, setImgOk] = useState(true);

  // Confetti: solid ~4 seconds on each correct word
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const confettiClearRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const isComplete = placed === current.onset;

  // HARD GUARANTEE: if anything navigates here, show Levels first.
  useEffect(() => {
    setScreen("levels");
  }, []);

  // No scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Confetti audio (public/confetti.mp3)
  useEffect(() => {
    try {
      audioRef.current = new Audio("/confetti.mp3");
      audioRef.current.volume = 0.9;
    } catch {
      audioRef.current = null;
    }
  }, []);

  const burstConfetti = (big: boolean) => {
    if (confettiClearRef.current) window.clearTimeout(confettiClearRef.current);

    const baseDur = 4200; // ensure the pieces keep falling long enough
    setConfetti(makeConfettiPieces(big ? 170 : 140, baseDur));

    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    } catch {
      // ignore
    }

    confettiClearRef.current = window.setTimeout(() => setConfetti([]), 4000);
  };

  // Reset per word
  useEffect(() => {
    setPlaced(null);
    setSelectedTileId(null);
    setFlash("none");
    setShowBuiltWord(false);
    setImgOk(true);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
  }, [idx, familyId]);

  // When family changes, reset index + tiles for that family
  useEffect(() => {
    setTiles(makeTiles(family));
    setIdx(0);
    setPlaced(null);
    setSelectedTileId(null);
    setFlash("none");
    setShowBuiltWord(false);
    setImgOk(true);
  }, [familyId]);

  const goBackToLibrary = () => {
    safeExitFullscreen();
    navigate(`/kids/games/english-excellence?kidId=${encodeURIComponent(kidId)}`);
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

  // ✅ Plays the correct answer letter sound
  const speakTargetLetterSound = () => {
    const ch = current.onset.toLowerCase();
    speak(LETTER_PHONEME[ch] ?? ch);
  };

  const speakWord = () => speak(current.word);

  // LEVEL selection (must start fullscreen from this click)
  const pickFamily = (id: string) => {
    setFamilyId(id);

    // Fullscreen on user gesture
    if (rootRef.current) safeRequestFullscreen(rootRef.current);

    setScreen("play");
  };

  const advance = () => {
    if (idx >= family.items.length - 1) {
      burstConfetti(true);
      setScreen("complete");
      return;
    }
    setIdx((v) => v + 1);
  };

  const correctPlace = (ch: string) => {
    setPlaced(ch);

    setShowBuiltWord(false);
    setFlash("green");
    burstConfetti(false);

    window.setTimeout(() => setShowBuiltWord(true), 250);

    timeoutRef.current = window.setTimeout(() => {
      setFlash("none");
      advance();
    }, 950);
  };

  const wrongPlace = () => {
    setFlash("wrong");
    window.setTimeout(() => setFlash("none"), 350);
  };

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, tile: Tile) => {
    e.dataTransfer.setData("text/plain", tile.ch);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  const onDropBlank = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const ch = e.dataTransfer.getData("text/plain");
    if (!ch || isComplete) return;

    if (ch === current.onset) correctPlace(ch);
    else wrongPlace();
  };

  // Tap-to-place (for touch devices)
  const onBlankClick = () => {
    if (!selectedTileId || isComplete) return;
    const tile = tiles.find((t) => t.id === selectedTileId);
    if (!tile) return;

    if (tile.ch === current.onset) correctPlace(tile.ch);
    else wrongPlace();
  };

  const nextFamily = () => {
    const i = FAMILY_ORDER.indexOf(familyId as any);
    const next = FAMILY_ORDER[(i + 1) % FAMILY_ORDER.length];
    setFamilyId(next);
    setScreen("play");
  };

  const wordCardBg = flash === "green" ? "bg-green-200" : "bg-sky-200";

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: "radial-gradient(circle at 50% 40%, #ff88b5 0%, #ff5fa2 55%, #ff4b96 100%)",
      }}
    >
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
          className="px-4 py-2 rounded-full bg-white/15 text-white border border-white/30 hover:bg-white/20"
          onClick={() => {
            if (rootRef.current) safeRequestFullscreen(rootRef.current);
          }}
        >
          Fullscreen
        </button>

        <button
          className="px-4 py-2 rounded-full bg-white/15 text-white border border-white/30 hover:bg-white/20"
          onClick={() => setScreen("levels")}
        >
          Levels
        </button>

        <button
          className="px-4 py-2 rounded-full bg-white/15 text-white border border-white/30 hover:bg-white/20"
          onClick={goBackToLibrary}
        >
          ← Back to Mission
        </button>
      </div>

      {/* LEVELS SCREEN (A/E/I/O/U groups) */}
      {screen === "levels" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/35">
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-[min(980px,95vw)]">
            <div className="text-2xl font-extrabold text-slate-900 text-center mb-2">
              Choose a Level
            </div>
            <div className="text-slate-600 text-center mb-5">
              Pick a vowel group, then choose a word family (like -at, -ig).
              <br />
              The game starts fullscreen from your tap.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {VOWEL_GROUPS.map((g) => (
                <div key={g.title} className="rounded-2xl border border-slate-200 p-4">
                  <div className="font-extrabold text-slate-900 mb-3">{g.title}</div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {g.ids.map((id) => (
                      <button
                        key={id}
                        onClick={() => pickFamily(id)}
                        className={[
                          "rounded-2xl border-2 px-3 py-4 font-extrabold text-xl",
                          "bg-sky-50 hover:bg-sky-100 border-sky-200 text-slate-900",
                          familyId === id ? "ring-4 ring-sky-300" : "",
                        ].join(" ")}
                      >
                        -{id}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-xs text-slate-500 text-center mt-4">
              Tip: Letters are on the top. Kids drag DOWN into the box.
            </div>
          </div>
        </div>
      )}

      {/* COMPLETE SCREEN */}
      {screen === "complete" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/35">
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-[min(560px,92vw)] text-center">
            <div className="text-3xl font-extrabold text-slate-900 mb-2">Level Complete! 🎉</div>
            <div className="text-slate-700 mb-4">
              You finished the <b>-{family.rime}</b> family.
            </div>

            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={() => setScreen("levels")}
                className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                Back to Levels
              </button>

              <button
                onClick={nextFamily}
                className="px-6 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold"
              >
                Next Level →
              </button>

              <button
                onClick={() => {
                  setIdx(0);
                  setScreen("play");
                }}
                className="px-6 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold"
              >
                Repeat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN PLAY SCREEN (VERTICAL layout) */}
      {screen === "play" && (
        <div className="w-full max-w-5xl flex flex-col items-center gap-6 px-6">
          {/* Top row: Level + First sound button */}
          <div className="w-full flex items-center justify-between">
            <div className="text-white font-extrabold text-xl">
              Level: <span className="bg-white/15 px-3 py-1 rounded-full">-{family.rime}</span>
            </div>

            <button
              onClick={speakTargetLetterSound}
              className="px-4 py-2 rounded-full bg-white/15 text-white border border-white/30 hover:bg-white/20 font-bold"
              aria-label="Play first sound"
              title="Play first sound"
            >
              🔊 First Sound
            </button>
          </div>

          {/* TOP: letters row */}
          <div className="w-full flex justify-center">
            <div className="flex flex-wrap justify-center gap-4">
              {tiles.map((tile) => (
                <div
                  key={tile.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, tile)}
                  onClick={() => setSelectedTileId(tile.id)}
                  className={[
                    "w-24 h-24 rounded-2xl bg-sky-200 shadow-lg border-4 border-sky-300",
                    "flex items-center justify-center select-none",
                    "text-6xl font-black text-black",
                    selectedTileId === tile.id ? "ring-4 ring-white/80" : "",
                  ].join(" ")}
                  style={{ cursor: "grab" }}
                  aria-label={`Letter ${tile.ch}`}
                  title="Drag down"
                >
                  {tile.ch}
                </div>
              ))}
            </div>
          </div>

          <div className="text-white/85 font-semibold text-center">
            Drag a letter <span className="font-extrabold">DOWN</span> into the box
            <br />
            <span className="text-white/70">(or tap a tile, then tap the box)</span>
          </div>

          {/* CENTER: image */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-60 h-60 flex items-center justify-center"
              onClick={speakWord}
              style={{ cursor: "pointer" }}
              title="Tap picture to hear the word"
            >
              {imgOk ? (
                <img
                  src={current.img}
                  alt={current.word}
                  draggable={false}
                  className="w-60 h-60 object-contain"
                  onError={() => setImgOk(false)}
                />
              ) : (
                <div className="w-60 h-60 rounded-3xl bg-white/30 border border-white/40 flex flex-col items-center justify-center shadow-xl">
                  <div className="text-7xl">{EMOJI[current.word] ?? "✨"}</div>
                  <div className="mt-2 text-white font-extrabold text-xl">{current.word}</div>
                </div>
              )}
            </div>
          </div>

          {/* BOTTOM: word formation */}
          <div
            className={[
              "relative w-[560px] h-[160px] rounded-2xl shadow-xl border-4 border-sky-300",
              wordCardBg,
              flash === "wrong" ? "animate-[shake_0.35s_ease-in-out]" : "",
            ].join(" ")}
            style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.25)" }}
          >
            {!isComplete ? (
              <div className="h-full w-full flex items-center justify-center">
                <div
                  onDragOver={onDragOver}
                  onDrop={onDropBlank}
                  onClick={onBlankClick}
                  className="w-[115px] h-[115px] rounded-xl border-4 border-sky-300 bg-pink-200/40"
                  style={{ cursor: "pointer" }}
                  aria-label="Drop here"
                  title="Drop here"
                />
                <div className="ml-6 text-7xl font-black text-black">{family.rime}</div>
              </div>
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                {!showBuiltWord ? (
                  <div className="flex items-center gap-4">
                    <div className="text-7xl font-black text-slate-900">{placed}</div>
                    <div className="text-5xl font-black text-slate-600">+</div>
                    <div className="text-7xl font-black text-slate-900">{family.rime}</div>
                  </div>
                ) : (
                  <div className="text-7xl font-black text-green-700">{current.word}</div>
                )}
              </div>
            )}

            <div className="absolute bottom-3 right-4 text-xs font-bold text-slate-700 bg-white/55 px-3 py-1 rounded-full">
              {idx + 1} / {family.items.length}
            </div>
          </div>
        </div>
      )}

      {/* Keyframes */}
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

          @keyframes confettiFall {
            0%   { transform: translateY(-30px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(110vh) rotate(720deg); opacity: 0.15; }
          }
        `}
      </style>
    </div>
  );
}
