// src/pages/kids/games/phonics/LetterTracingWithSounds.tsx
// ✅ SAME engine + UI as old LetterTracingGame (single-stroke-at-a-time + lift between strokes)
// ✅ Uses /tracing.mp3 while tracing (loop)
// ✅ Uses /star.png for start/guide/end markers
// ✅ Level 0 = pretrace, Level 1 = ALL letters A–Z (Capital → Small)
// ✅ Dropdown jump + Next button like old game
// ✅ Adds a Sound button to play letter sound (expects /public/games/phonics/a.mp3 ... z.mp3)
// ✅ On letter completion → auto plays letter sound + shows a reward image (best-effort from /public paths)
// ✅ Saves progress via recordLevelResult + stores resume point (lastPos)

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { doc, getDoc, getDocFromServer, getFirestore } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

import {
  TRACE_LETTERS,
  PRETRACE_ITEMS,
  PRETRACE_LEVEL,
  type LetterId,
  type PreTraceId,
  type TraceLetter,
  type TraceStroke,
  type TracePair,
} from "./tracing/traceLetters";

import { recordLevelResult } from "../../../../games/engine/recordLevelResult";

const BASE_ROUTE = "/kids/games/phonics/letter-tracing-sounds";
const GAME_ID = "letter-tracing";
const PROGRESS_DOC_ID = "phonics_letter_tracing";

type Mode = "levels" | "play";
type CaseStep = 0 | 1; // 0=Upper, 1=Lower
type Pt = { x: number; y: number; t: number; len: number };

type LevelPairView = { upper?: LetterId; lower?: LetterId };
type TraceLevelView = { levelId: number; title: string; subtitle?: string; pairs?: LevelPairView[] };

/** -------- Resume position helpers (stored in SAME progress doc) -------- */
type LastPos = { level: 0 | 1; pair: number; step: CaseStep };

type ProgressState = {
  status: "idle" | "loading" | "ready" | "error";
  mastered: Set<string>;
  lastPos?: LastPos | null;
  sourcePath?: string;
  updatedAtMs?: number;
  error?: string;
};

// ⭐ asset in /public/star.png
const STAR_SRC = "/star.png";
// 🔊 tracing sound in /public/tracing.mp3
const TRACE_AUDIO_SRC = "/tracing.mp3";
// 🔊 confetti sound in /public/confetti.mp3
const CONFETTI_AUDIO_SRC = "/confetti.mp3";
// ▶️ next arrow asset
const NEXT_ARROW_SRC = "/games/phonics/sound-detective/nextarrow.png";

// 🖼️ reward image best-effort — prefer the sound-detective folder used by existing assets
const SOUND_DETECTIVE_DIR = "/games/phonics/sound-detective";

const STROKE_COLORS = ["#2563EB", "#EC4899", "#22C55E", "#F59E0B", "#8B5CF6"] as const;

// ⭐ sizes
const STAR_START_SIZE = 18;
const STAR_GUIDE_SIZE = 16;
const STAR_END_SIZE = 14;
// viewBox padding
const VIEWBOX_PAD = 10;

// Reserve space for the bottom instruction bar so SVG doesn't get covered
const INSTRUCTION_BAR_H = 56;

/* --------------------
   Small helpers
-------------------- */
function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function hexToRgba(hex: string, alpha: number) {
  const h = String(hex || "").replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  if (!Number.isFinite(n) || full.length !== 6) return `rgba(0,0,0,${clamp(alpha, 0, 1)})`;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${clamp(alpha, 0, 1)})`;
}

function expandViewBox(vb: string, pad: number) {
  const parts = String(vb || "0 0 100 100")
    .trim()
    .split(/[ ,]+/)
    .map((x) => Number(x));
  const [x, y, w, h] = parts.length >= 4 ? parts : [0, 0, 100, 100];
  const p = Number.isFinite(pad) ? pad : 0;
  return `${x - p} ${y - p} ${w + p * 2} ${h + p * 2}`;
}

function parseTapPoint(pathD: string): { x: number; y: number } | null {
  // Accepts strings like: "M 50 50" or "M50 50" etc.
  const s = String(pathD || "").trim();
  const m = s.match(/M\s*([-0-9.]+)[ ,]+([-0-9.]+)/i);
  if (!m) return null;
  const x = Number(m[1]);
  const y = Number(m[2]);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y };
}

function parseLine(pathD: string): { a: { x: number; y: number }; b: { x: number; y: number } } | null {
  const s = String(pathD || "").trim();
  const m = s.match(/M\s*([-0-9.]+)[ ,]+([-0-9.]+)\s*L\s*([-0-9.]+)[ ,]+([-0-9.]+)/i);
  if (!m) return null;
  const ax = Number(m[1]);
  const ay = Number(m[2]);
  const bx = Number(m[3]);
  const by = Number(m[4]);
  if (![ax, ay, bx, by].every((v) => Number.isFinite(v))) return null;
  return { a: { x: ax, y: ay }, b: { x: bx, y: by } };
}



/** Convert clientX/clientY into SVG coordinates */
function useSvgPoint(svgRef: React.RefObject<SVGSVGElement | null>) {
  return useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const pt = (svg as any).createSVGPoint ? (svg as any).createSVGPoint() : null;
      if (pt) {
        pt.x = clientX;
        pt.y = clientY;
        const ctm = svg.getScreenCTM?.();
        if (!ctm) return { x: 0, y: 0 };
        const inv = ctm.inverse();
        const p = pt.matrixTransform(inv);
        return { x: p.x, y: p.y };
      }

      // Fallback (rare)
      const rect = svg.getBoundingClientRect();
      const x = ((clientX - rect.left) / Math.max(1, rect.width)) * 100;
      const y = ((clientY - rect.top) / Math.max(1, rect.height)) * 100;
      return { x, y };
    },
    [svgRef]
  );
}

/** Pull mastered items from different possible Firestore shapes */
function extractMasteredItems(data: any): string[] {
  const out: string[] = [];

  const pushArr = (arr: any) => {
    if (!Array.isArray(arr)) return;
    for (const v of arr) {
      const s = String(v ?? "").trim();
      if (s) out.push(s);
    }
  };

  // Common shapes
  pushArr(data?.masteredItems);
  pushArr(data?.summary?.masteredItems);
  pushArr(data?.stats?.masteredItems);

  // Per-level map (levels)
  const levels = data?.levels ?? data?.byLevel ?? data?.progressByLevel ?? data?.levelProgress;
  if (levels && typeof levels === "object") {
    for (const k of Object.keys(levels)) {
      const lv = (levels as any)[k];
      pushArr(lv?.masteredItems);
      pushArr(lv?.stats?.masteredItems);
      pushArr(lv?.summary?.masteredItems);
    }
  }

  // Sometimes stored as arrays of objects
  const levelArr = data?.levelsArr ?? data?.levelsArray;
  if (Array.isArray(levelArr)) {
    for (const lv of levelArr) pushArr(lv?.masteredItems);
  }

  return Array.from(new Set(out)).filter(Boolean);
}

/** Best-effort updatedAt extraction */
function extractUpdatedAtMs(data: any): number | undefined {
  const candidates = [
    data?.updatedAtMs,
    data?.updatedAt,
    data?.lastUpdatedAt,
    data?.summary?.updatedAtMs,
    data?.summary?.updatedAt,
    data?.stats?.updatedAtMs,
    data?.stats?.updatedAt,
    data?.lastPosUpdatedAt,
  ];

  for (const v of candidates) {
    if (!v) continue;
    // Firestore Timestamp
    if (typeof v?.toMillis === "function") {
      const ms = v.toMillis();
      if (Number.isFinite(ms)) return ms;
    }
    // number ms
    if (typeof v === "number" && Number.isFinite(v)) return v;
    // Date
    if (v instanceof Date) return v.getTime();
  }

  return undefined;
}

// --------- Auth + Outbox helpers (survive hard-refresh) ---------
function waitForAuthInit(timeoutMs = 5000) {
  const auth = getAuth();
  if (auth.currentUser) return Promise.resolve();

  return new Promise<void>((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      try {
        unsub();
      } catch {}
      resolve();
    };

    const timer = window.setTimeout(finish, Math.max(500, timeoutMs));

    const unsub = onAuthStateChanged(
      auth,
      () => {
        window.clearTimeout(timer);
        finish();
      },
      () => {
        window.clearTimeout(timer);
        finish();
      }
    );
  });
}

function outboxKey(kidId: string) {
  return `ts_progress_outbox_v2:${kidId}:${PROGRESS_DOC_ID}`;
}

type Outbox = {
  // ✅ SHADOW progress (UI must survive refresh until scheduler updates Firestore progress doc)
  shadowMasteredItems?: string[]; // e.g., ["A","a","line"]
  shadowLastPos?: LastPos;
  shadowUpdatedAtMs?: number;

  // ✅ Retry only (if recordLevelResult fails)
  pendingPayload?: any;

  // Optional: throttle replay attempts
  lastReplayAtMs?: number;
  replayCount?: number;
};

function readOutbox(kidId: string): Outbox | null {
  try {
    const raw = localStorage.getItem(outboxKey(kidId));
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== "object") return null;
    return obj as Outbox;
  } catch {
    return null;
  }
}

function writeOutbox(kidId: string, data: Outbox) {
  try {
    localStorage.setItem(outboxKey(kidId), JSON.stringify(data));
  } catch {}
}

function clearOutbox(kidId: string) {
  try {
    localStorage.removeItem(outboxKey(kidId));
  } catch {}
}

function uniqStrings(arr: any): string[] {
  if (!Array.isArray(arr)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const v of arr) {
    const s = String(v ?? "").trim();
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

function coerceLastPos(v: any): LastPos | null {
  if (!v || typeof v !== "object") return null;

  const lvlRaw = Number(v.level ?? v.levelId ?? v.lvl ?? v.levelNum);
  const pairRaw = Number(v.pair ?? v.pairIndex ?? v.index ?? v.i);
  const stepRaw = Number(v.step ?? v.caseStep ?? v.case ?? v.s);

  const level: 0 | 1 = lvlRaw === 0 ? 0 : 1;
  const pair = Number.isFinite(pairRaw) ? Math.max(0, Math.floor(pairRaw)) : 0;
  const step: CaseStep = stepRaw === 1 ? 1 : 0;

  return { level, pair, step };
}

function extractLastPos(data: any): LastPos | null {
  const candidates = [
    data?.lastPos,
    data?.resumePos,
    data?.resume,
    data?.lastPosition,
    data?.summary?.lastPos,
    data?.stats?.lastPos,
  ];
  for (const c of candidates) {
    const lp = coerceLastPos(c);
    if (lp) return lp;
  }
  return null;
}

function firstIncompletePretraceIndex(mastered: Set<string>) {
  for (let i = 0; i < PRETRACE_LEVEL.items.length; i++) {
    const id = String(PRETRACE_LEVEL.items[i]);
    if (!mastered.has(id)) return i;
  }
  return 0;
}

// Order: A(upper), a(lower), B(upper), b(lower), ...
function firstIncompleteLetterPos(
  mastered: Set<string>,
  startPair = 0,
  startStep: CaseStep = 0
): { pair: number; step: CaseStep } {
  const totalPairs = 26;
  const startLinear = clamp(startPair, 0, totalPairs - 1) * 2 + (startStep === 1 ? 1 : 0);

  for (let lin = startLinear; lin < totalPairs * 2; lin++) {
    const pair = Math.floor(lin / 2);
    const step = (lin % 2) as CaseStep;
    const upper = String.fromCharCode(65 + pair);
    const lower = String.fromCharCode(97 + pair);
    const id = step === 0 ? upper : lower;
    if (!mastered.has(id)) return { pair, step };
  }

  return { pair: clamp(startPair, 0, totalPairs - 1), step: startStep };
}

function getResumeStartLevel0(mastered: Set<string>, lastPos: LastPos | null) {
  if (lastPos?.level === 0) {
    return { pair: clamp(lastPos.pair, 0, PRETRACE_LEVEL.items.length - 1), step: 0 as const };
  }
  return { pair: firstIncompletePretraceIndex(mastered), step: 0 as const };
}

function getResumeStartLevel1(mastered: Set<string>, lastPos: LastPos | null) {
  if (lastPos?.level === 1) {
    return firstIncompleteLetterPos(mastered, lastPos.pair, lastPos.step);
  }
  return firstIncompleteLetterPos(mastered, 0, 0);
}

function labelForLevel1Pos(pos: { pair: number; step: CaseStep }) {
  const ch = pos.step === 0 ? String.fromCharCode(65 + pos.pair) : String.fromCharCode(97 + pos.pair);
  return `${ch} (${pos.step === 0 ? "Capital" : "Small"})`;
}

/** -------- Skill tag helpers (fixes upper/lower progress rollup) -------- */
function normalizeLetterTagFromId(letterId: string | null | undefined): string | null {
  if (!letterId) return null;
  const ch = String(letterId).trim().charAt(0);
  if (!/^[A-Za-z]$/.test(ch)) return null;
  return `letter:${ch.toLowerCase()}`; // ✅ always a-z
}

function caseTagFromStep(step: CaseStep): "case:upper" | "case:lower" {
  return step === 0 ? "case:upper" : "case:lower";
}

function stripLetterAndCaseTags(tags: string[]) {
  return (Array.isArray(tags) ? tags : []).filter((t) => {
    const s = String(t).toLowerCase();
    if (s.startsWith("letter:")) return false;
    if (s.startsWith("case:")) return false;
    return true;
  });
}

function uniqTags(tags: Array<string | null | undefined>) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const t of tags) {
    const v = (t ?? "").trim();
    if (!v) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function buildLetterTracingSkillTags(args: {
  baseTags: string[];
  isPretrace: boolean;
  levelForTracking: number;
  step: CaseStep;
  currentLetterId: LetterId | null;
}) {
  const cleanedBase = stripLetterAndCaseTags(args.baseTags);

  const letterTag = args.isPretrace ? null : normalizeLetterTagFromId(args.currentLetterId);
  const caseTag = args.isPretrace ? null : caseTagFromStep(args.step);
  const subtopicTag = args.isPretrace ? "subtopic:pretracing" : `subtopic:tracing_level_${args.levelForTracking}`;

  return uniqTags([...cleanedBase, letterTag, caseTag, subtopicTag]);
}

// 🔊 letter sound expected in /public/games/phonics/a.mp3 ... z.mp3
function getLetterSoundCandidates(letterId: LetterId | null): string[] {
  if (!letterId) return [];
  const ch = String(letterId).trim().charAt(0).toLowerCase();
  if (!/^[a-z]$/.test(ch)) return [];
  return [
    `/games/phonics/${ch}.mp3`,
    `/phonics/${ch}.mp3`,
    `/sounds/phonics/${ch}.mp3`,
    `/${ch}.mp3`,
  ];
}

const LETTER_IMAGE_FILE: Record<string, string> = {
  a: "apple",
  b: "ball",
  c: "cat",
  d: "dog",
  e: "elephant",
  f: "fish",
  g: "grape",
  h: "hat",
  i: "igloo",
  j: "juice",
  k: "kangaroo",
  l: "lion",
  m: "monkey",
  n: "nose",
  o: "octopus",
  p: "pig",
  q: "queen",
  r: "ring",
  s: "sun",
  t: "tiger",
  u: "umbrella",
  v: "van",
  w: "watch",
  x: "box",
  y: "yoyo",
  z: "zoo",
};

const LETTER_REWARD: Record<string, { word: string; emoji: string }> = {
  a: { word: "Apple", emoji: "🍎" },
  b: { word: "Ball", emoji: "🏀" },
  c: { word: "Cat", emoji: "🐱" },
  d: { word: "Dog", emoji: "🐶" },
  e: { word: "Elephant", emoji: "🐘" },
  f: { word: "Fish", emoji: "🐟" },
  g: { word: "Grapes", emoji: "🍇" },
  h: { word: "Hat", emoji: "🧢" },
  i: { word: "Igloo", emoji: "🧊" },
  j: { word: "Juice", emoji: "🧃" },
  k: { word: "Kangaroo", emoji: "🦘" },
  l: { word: "Lion", emoji: "🦁" },
  m: { word: "Monkey", emoji: "🐵" },
  n: { word: "Nose", emoji: "👃" },
  o: { word: "Octopus", emoji: "🐙" },
  p: { word: "Pig", emoji: "🐷" },
  q: { word: "Queen", emoji: "👑" },
  r: { word: "ring", emoji: "💍" },
  s: { word: "Sun", emoji: "🌞" },
  t: { word: "Tiger", emoji: "🐯" },
  u: { word: "Umbrella", emoji: "☂️" },
  v: { word: "Van", emoji: "🚐" },
  w: { word: "Watch", emoji: "⌚" },
  x: { word: "Box", emoji: "📦" },
  y: { word: "Yoyo", emoji: "🪀" },
  z: { word: "Zoo", emoji: "🦓" },
};

function getLetterImageCandidates(letterId: LetterId | null): string[] {
  if (!letterId) return [];
  const ch = String(letterId).trim().charAt(0).toLowerCase();
  if (!/^[a-z]$/.test(ch)) return [];

  const exts = ["png", "webp", "jpg"];
  const fileBase = LETTER_IMAGE_FILE[ch] ?? ch;

  const rewardSlug =
    (LETTER_REWARD[ch]?.word ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "") || "";

  const names = [fileBase, rewardSlug, ch].filter(Boolean);

  const out: string[] = [];
  for (const name of names) {
    for (const ext of exts) {
      out.push(`${SOUND_DETECTIVE_DIR}/${name}.${ext}`);
    }
  }
  return out;
}

/* --------------------
   Confetti
-------------------- */
function ConfettiBurst({ fire }: { fire: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevFireRef = useRef(false);
  const [burstId, setBurstId] = useState(0);

  useEffect(() => {
    const was = prevFireRef.current;
    if (fire && !was) setBurstId((n) => n + 1);
    prevFireRef.current = fire;
  }, [fire]);

  useEffect(() => {
    if (fire) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [fire]);

  useEffect(() => {
    if (!burstId) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let W = 0;
    let H = 0;

    const resize = () => {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const w = Math.max(1, canvas.clientWidth);
      const h = Math.max(1, canvas.clientHeight);
      W = w;
      H = h;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const rnd = (a: number, b: number) => a + Math.random() * (b - a);

    resize();

    const dur = 4000;

    type Piece = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      g: number;
      w: number;
      h: number;
      rot: number;
      vr: number;
      hue: number;
      born: number;
      life: number;
    };

    let pieces: Piece[] = [];

    const spawnRect = (p: Omit<Piece, "born" | "life">, now: number, life: number) => {
      pieces.push({ ...p, born: now, life });
    };

    const spawnCenterBurst = (now: number) => {
      const CENTER_COUNT = 220;
      for (let k = 0; k < CENTER_COUNT; k++) {
        const isStreamer = Math.random() < 0.35;
        const size = isStreamer ? 6 + Math.random() * 10 : 3 + Math.random() * 6;

        spawnRect(
          {
            x: W * (0.45 + Math.random() * 0.1),
            y: H * (0.4 + Math.random() * 0.1),
            vx: (Math.random() - 0.5) * (10 + Math.random() * 6),
            vy: -(7 + Math.random() * 10),
            g: 0.22 + Math.random() * 0.2,
            w: isStreamer ? size * 1.8 : size,
            h: isStreamer ? size * 0.55 : size,
            rot: Math.random() * Math.PI,
            vr: (Math.random() - 0.5) * 0.35,
            hue: Math.floor(Math.random() * 360),
          },
          now,
          2200 + Math.random() * 900
        );
      }
    };

    const spawnShower = (side: "left" | "right", count: number, now: number) => {
      for (let k = 0; k < count; k++) {
        const isStreamer = Math.random() < 0.25;
        const size = isStreamer ? 6 + Math.random() * 9 : 3 + Math.random() * 6;
        const x = side === "left" ? W * rnd(0.05, 0.22) : W * rnd(0.78, 0.95);
        spawnRect(
          {
            x,
            y: rnd(-50, -10),
            vx: side === "left" ? rnd(0.6, 2.4) : rnd(-2.4, -0.6),
            vy: rnd(1.2, 3.8),
            g: 0.12 + Math.random() * 0.1,
            w: isStreamer ? size * 1.9 : size,
            h: isStreamer ? size * 0.55 : size,
            rot: Math.random() * Math.PI,
            vr: (Math.random() - 0.5) * 0.25,
            hue: Math.floor(Math.random() * 360),
          },
          now,
          2400 + Math.random() * 900
        );
      }
    };

    const start = performance.now();
    spawnCenterBurst(start);

    const LEFT_RATE = 40;
    const RIGHT_RATE = 40;
    let leftAcc = 0;
    let rightAcc = 0;
    let prevNow = start;

    const tick = (now: number) => {
      const t = now - start;
      const dtMs = Math.max(0, now - prevNow);
      prevNow = now;
      const dtF = clamp(dtMs / 16.67, 0.5, 2.0);

      if (t < dur) {
        leftAcc += (LEFT_RATE * dtMs) / 1000;
        rightAcc += (RIGHT_RATE * dtMs) / 1000;
        const l = Math.floor(leftAcc);
        const r = Math.floor(rightAcc);
        if (l > 0) {
          leftAcc -= l;
          spawnShower("left", l, now);
        }
        if (r > 0) {
          rightAcc -= r;
          spawnShower("right", r, now);
        }
      }

      const globalFade = 1 - clamp((t - dur * 0.7) / (dur * 0.3), 0, 1);
      ctx.clearRect(0, 0, W, H);

      for (const p of pieces) {
        p.x += p.vx * dtF;
        p.y += p.vy * dtF;
        p.vy += p.g * dtF;
        p.rot += p.vr * dtF;
        p.vx *= 0.992;
        p.vy *= 0.996;

        const age = now - p.born;
        const lifeFade = 1 - clamp(age / p.life, 0, 1);
        const a = globalFade * lifeFade;
        if (a <= 0) continue;
        if (p.y > H + 120) continue;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = `hsla(${p.hue}, 92%, 58%, ${0.95 * a})`;
        ctx.strokeStyle = `hsla(${p.hue}, 92%, 40%, ${0.35 * a})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.rect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      pieces = pieces.filter((p) => {
        const age = now - p.born;
        if (age >= p.life) return false;
        if (p.y > H + 200) return false;
        return true;
      });

      if (pieces.length > 900) pieces = pieces.slice(pieces.length - 900);

      if (t < dur) {
        raf = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, W, H);
      }
    };

    raf = requestAnimationFrame(tick);
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, W, H);
    };
  }, [burstId]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0"
      style={{ width: "100%", height: "100%" }}
    />
  );
}

/* --------------------
   Main component
-------------------- */
export default function LetterTracingWithSounds() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const fsRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  

  const kidId = searchParams.get("kidId") || localStorage.getItem("ts_active_kid_v1") || "";
  const fs = searchParams.get("fs") === "1";

  // ✅ Route params / derived mode (must be declared before hooks that reference `mode`)
  const levelParam = searchParams.get("level");
  const pairParam = searchParams.get("pair");
  const stepParam = searchParams.get("step");
  const mode: Mode = levelParam === null ? "levels" : "play";
  const levelIdRaw = levelParam === null ? null : Number(levelParam);
  const levelId = levelIdRaw === null || Number.isNaN(levelIdRaw) ? null : levelIdRaw;
  const pairIndexRaw = pairParam ? Number(pairParam) : 0;
  const pairIndex = Number.isNaN(pairIndexRaw) ? 0 : pairIndexRaw;
  const stepNumRaw = stepParam ? Number(stepParam) : 0;
  const step: CaseStep = stepNumRaw === 1 ? 1 : 0;

  // -------- iPad / iOS detection (Safari fullscreen is flaky) --------
  const isIOS = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || "";
    const iOS = /iPad|iPhone|iPod/.test(ua);
    // iPadOS 13+ reports as MacIntel but has touch points
    const iPadOS = (navigator as any).platform === "MacIntel" && (navigator as any).maxTouchPoints > 1;
    return iOS || iPadOS;
  }, []);

  

  // -------- iPad viewport fix: use visualViewport height so the game fits 100% --------
  useEffect(() => {
    if (!fs) return;

    const setVh = () => {
      const vv = window.visualViewport;
      const h = Math.round(vv?.height ?? window.innerHeight);
      document.documentElement.style.setProperty("--ts-vh", `${h}px`);
    };

    setVh();
    window.addEventListener("resize", setVh);
    window.visualViewport?.addEventListener("resize", setVh);
    window.visualViewport?.addEventListener("scroll", setVh);

    return () => {
      window.removeEventListener("resize", setVh);
      window.visualViewport?.removeEventListener("resize", setVh);
      window.visualViewport?.removeEventListener("scroll", setVh);
    };
  }, [fs]);

  // -------- block pinch/zoom/scroll gestures while fullscreen playing (iOS Safari) --------
  useEffect(() => {
    if (mode !== "play" || !fs) return;

    const prevent = (e: Event) => {
      e.preventDefault();
    };
    const opts = { passive: false } as any;

    document.addEventListener("touchmove", prevent, opts);
    document.addEventListener("gesturestart" as any, prevent, opts);
    document.addEventListener("gesturechange" as any, prevent, opts);
    document.addEventListener("gestureend" as any, prevent, opts);

    return () => {
      document.removeEventListener("touchmove", prevent as any, opts);
      document.removeEventListener("gesturestart" as any, prevent as any, opts);
      document.removeEventListener("gesturechange" as any, prevent as any, opts);
      document.removeEventListener("gestureend" as any, prevent as any, opts);
    };
  }, [mode, fs]);

  useEffect(() => {
    if (kidId) {
      try {
        localStorage.setItem("ts_active_kid_v1", kidId);
      } catch {}
    }
  }, [kidId]);

  

  // ✅ only two levels
  const normalizedLevelId = mode === "play" ? (levelId === 0 ? 0 : 1) : null;
  const isPretrace = mode === "play" && normalizedLevelId === 0;

  // ✅ Build A–Z pairs once (A+a, B+b, ... Z+z)
  const allLetterPairs: TracePair[] = useMemo(() => {
    const out: TracePair[] = [];
    for (let i = 0; i < 26; i++) {
      const upper = String.fromCharCode(65 + i) as unknown as LetterId;
      const lower = String.fromCharCode(97 + i) as unknown as LetterId;
      out.push({ upper, lower } as TracePair);
    }
    return out;
  }, []);

  const enabledPairs: TracePair[] = useMemo(() => {
    if (mode !== "play" || isPretrace) return [];
    return allLetterPairs; // Level 1 = all letters
  }, [mode, isPretrace, allLetterPairs]);

  const safePairIndex = useMemo(() => {
    if (isPretrace) return clamp(pairIndex, 0, PRETRACE_LEVEL.items.length - 1);
    const len = enabledPairs.length || 1;
    return clamp(pairIndex, 0, len - 1);
  }, [isPretrace, pairIndex, enabledPairs.length]);

  const currentPair = !isPretrace && mode === "play" ? enabledPairs[safePairIndex] ?? null : null;

  const currentLetterId: LetterId | null =
    !isPretrace && mode === "play" && currentPair?.upper
      ? step === 0
        ? currentPair.upper
        : currentPair.lower ?? null
      : null;

  const pretraceId: PreTraceId | null = isPretrace ? PRETRACE_LEVEL.items[safePairIndex] : null;

  const letterData: TraceLetter | null = isPretrace
    ? pretraceId
      ? PRETRACE_ITEMS[pretraceId]
      : null
    : currentLetterId
      ? (TRACE_LETTERS[currentLetterId] as TraceLetter | undefined) ?? null
      : null;

  /* --------------------
     Progress (no polling)
  -------------------- */
  const [progress, setProgress] = useState<ProgressState>({
    status: "idle",
    mastered: new Set<string>(),
    lastPos: null,
  });

  const fetchProgress = useCallback(
    async (opts?: { forceServer?: boolean }) => {
      if (!kidId) {
        setProgress({ status: "idle", mastered: new Set<string>(), lastPos: null });
        return;
      }

      setProgress((p) => ({ ...p, status: "loading", error: undefined }));

      await waitForAuthInit(5000);
      const db = getFirestore();

      const candidates: Array<{ path: string[]; label: string }> = [
        { path: ["kids", kidId, "progress", PROGRESS_DOC_ID], label: "kids/{kidId}/progress/{docId}" },
        { path: ["kids", kidId, "gamesProgress", PROGRESS_DOC_ID], label: "kids/{kidId}/gamesProgress/{docId}" },
        { path: ["kids", kidId, "progress", GAME_ID], label: "kids/{kidId}/progress/{gameId}" },
        { path: ["kids", kidId, "gamesProgress", GAME_ID], label: "kids/{kidId}/gamesProgress/{gameId}" },
        { path: ["kids", kidId, "gameSummaries", GAME_ID], label: "kids/{kidId}/gameSummaries/{gameId}" },
        { path: ["students", kidId, "progress", PROGRESS_DOC_ID], label: "students/{kidId}/progress/{docId}" },
        { path: ["students", kidId, "gamesProgress", PROGRESS_DOC_ID], label: "students/{kidId}/gamesProgress/{docId}" },
        { path: ["students", kidId, "progress", GAME_ID], label: "students/{kidId}/progress/{gameId}" },
        { path: ["students", kidId, "gamesProgress", GAME_ID], label: "students/{kidId}/gamesProgress/{gameId}" },
      ];

      const ob = readOutbox(kidId);
      const shadowItems = uniqStrings(ob?.shadowMasteredItems);
      const shadowLastPos = ob?.shadowLastPos ? coerceLastPos(ob.shadowLastPos) : null;
      const shadowUpdatedAtMs = typeof ob?.shadowUpdatedAtMs === "number" ? ob.shadowUpdatedAtMs : undefined;

      let lastErr: any = null;

      for (const c of candidates) {
        try {
          const ref = doc(db, ...(c.path as [string, ...string[]]));
          const snap = opts?.forceServer ? await getDocFromServer(ref) : await getDoc(ref);
          if (!snap.exists()) continue;

          const data = snap.data();

          let items = extractMasteredItems(data);
          let updatedAtMs = extractUpdatedAtMs(data);
          let lastPos = extractLastPos(data);

          // ✅ MERGE SHADOW into UI (so refresh never "loses" progress)
          const serverSet = new Set(items);
          if (shadowItems.length) {
            for (const s of shadowItems) {
              if (!serverSet.has(s)) items.push(s);
            }
          }

          // ✅ Prefer shadow lastPos (because it represents latest local resume point)
          if (shadowLastPos) lastPos = shadowLastPos;

          // ✅ updatedAtMs best-effort
          if (shadowUpdatedAtMs && (!updatedAtMs || shadowUpdatedAtMs > updatedAtMs)) {
            updatedAtMs = shadowUpdatedAtMs;
          }

          // ✅ PRUNE SHADOW when server progress doc finally contains it
          if (ob) {
            const remainingShadow = shadowItems.filter((s) => !serverSet.has(s));
            const nextOb: Outbox = { ...ob, shadowMasteredItems: remainingShadow };

            // if server caught up fully, we can drop shadowUpdatedAtMs too
            if (remainingShadow.length === 0) {
              delete nextOb.shadowMasteredItems;
              delete nextOb.shadowUpdatedAtMs;
              // keep shadowLastPos only if you want, but usually safe to drop once caught up
              delete nextOb.shadowLastPos;
            }

            const hasAnything =
              (nextOb.shadowMasteredItems && nextOb.shadowMasteredItems.length > 0) ||
              !!nextOb.pendingPayload;

            if (hasAnything) writeOutbox(kidId, nextOb);
            else clearOutbox(kidId);
          }

          setProgress({
            status: "ready",
            mastered: new Set(items),
            lastPos,
            sourcePath: c.label,
            updatedAtMs,
          });
          return;
        } catch (err: any) {
          lastErr = err;
        }
      }

      // Not found anywhere → show SHADOW (still survives hard refresh)
      const shadowItemsFallback = uniqStrings(ob?.shadowMasteredItems);
      const shadowLastPosFallback = ob?.shadowLastPos ? coerceLastPos(ob.shadowLastPos) : null;
      const shadowUpdatedAtMsFallback = typeof ob?.shadowUpdatedAtMs === "number" ? ob.shadowUpdatedAtMs : undefined;

      const merged = new Set<string>();
      let lastPos: LastPos | null = null;
      let updatedAtMs: number | undefined = undefined;

      for (const s of shadowItemsFallback) merged.add(s);
      if (shadowLastPosFallback) lastPos = shadowLastPosFallback;
      if (shadowUpdatedAtMsFallback) updatedAtMs = shadowUpdatedAtMsFallback;

      setProgress({
        status: "ready",
        mastered: merged,
        lastPos,
        sourcePath: "not-found",
        updatedAtMs,
        error: lastErr ? String(lastErr?.code || lastErr?.message || lastErr) : undefined,
      });
    },
    [kidId]
  );

  useEffect(() => {
    if (!kidId) return;
    void fetchProgress();
  }, [kidId, fetchProgress]);

  // Replay pending payload (retry only) with throttling
  const flushOutboxIfNeeded = useCallback(async () => {
    if (!kidId) return;
    await waitForAuthInit(5000);

    const ob = readOutbox(kidId);
    const payload = ob?.pendingPayload;
    if (!payload) return;

    // throttle retries (avoid spam on repeated reloads)
    const now = Date.now();
    const last = typeof ob?.lastReplayAtMs === "number" ? ob.lastReplayAtMs : 0;
    if (now - last < 20_000) return; // 20s throttle

    const masteredItem = String(payload?.masteredItems?.[0] ?? "").trim();

    // If server already has it, drop pending retry
    try {
      const db = getFirestore();
      const ref = doc(db, "kids", kidId, "progress", PROGRESS_DOC_ID);
      const snap = await getDocFromServer(ref);
      if (snap.exists() && masteredItem) {
        const serverItems = new Set(extractMasteredItems(snap.data()));
        if (serverItems.has(masteredItem)) {
          const next: Outbox = { ...(ob as Outbox) };
          delete next.pendingPayload;
          next.lastReplayAtMs = now;
          writeOutbox(kidId, next);
          return;
        }
      }
    } catch {
      // ignore
    }

    // Attempt replay once
    try {
      const next: Outbox = { ...(ob as Outbox), lastReplayAtMs: now, replayCount: (ob?.replayCount ?? 0) + 1 };
      writeOutbox(kidId, next);

      await recordLevelResult(payload);

      const cur = readOutbox(kidId);
      if (!cur) return;
      const after: Outbox = { ...cur };
      delete after.pendingPayload;

      const hasAnything =
        (after.shadowMasteredItems && after.shadowMasteredItems.length > 0) ||
        !!after.pendingPayload;

      if (hasAnything) writeOutbox(kidId, after);
      else clearOutbox(kidId);
    } catch {
      // keep pendingPayload
    }
  }, [kidId]);

  useEffect(() => {
    if (!kidId) return;
    void flushOutboxIfNeeded();
  }, [kidId, flushOutboxIfNeeded]);

  type ProgressCounts = {
    preDone: number;
    preTotal: number;
    upperDone: number;
    upperTotal: number;
    lowerDone: number;
    lowerTotal: number;

    resume0: { pair: number; step: 0 };
    resume0Label: string;

    resume1: { pair: number; step: CaseStep };
    resume1Label: string;
  };

  const progressCounts = useMemo((): ProgressCounts => {
    const mastered = progress.mastered;
    const lastPos = progress.lastPos ?? null;

    const resume0 = getResumeStartLevel0(mastered, lastPos);
    const resume0Id = PRETRACE_LEVEL.items[clamp(resume0.pair, 0, PRETRACE_LEVEL.items.length - 1)];
    const resume0Label = PRETRACE_ITEMS[resume0Id]?.label ?? String(resume0Id);

    const resume1 = getResumeStartLevel1(mastered, lastPos);
    const resume1Label = labelForLevel1Pos(resume1);

    const preTotal = PRETRACE_LEVEL.items.length;
    const preDone = PRETRACE_LEVEL.items.reduce((acc, id) => acc + (mastered.has(String(id)) ? 1 : 0), 0);

    let upperDone = 0;
    let lowerDone = 0;
    for (const p of allLetterPairs) {
      if (p.upper && mastered.has(String(p.upper))) upperDone++;
      if (p.lower && mastered.has(String(p.lower))) lowerDone++;
    }

    return {
      preDone,
      preTotal,
      upperDone,
      upperTotal: 26,
      lowerDone,
      lowerTotal: 26,
      resume0,
      resume0Label,
      resume1,
      resume1Label,
    };
  }, [progress.mastered, progress.lastPos, allLetterPairs]);

  /* --------------------
     Engine state
  -------------------- */
  const [strokeIndex, setStrokeIndex] = useState(0);

  const [selectedColor, setSelectedColor] =
    useState<(typeof STROKE_COLORS)[number]>(STROKE_COLORS[0]);

  const [samples, setSamples] = useState<Pt[]>([]);
  const [rawLen, setRawLen] = useState(0);
  const [trimStartLen, setTrimStartLen] = useState(0);

  const [started, setStarted] = useState(false);
  const [lastIndex, setLastIndex] = useState(0);
  const lastIndexRef = useRef(0);

  const [letterDone, setLetterDone] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [timeStart, setTimeStart] = useState<number | null>(null);
  const [showNextArrow, setShowNextArrow] = useState(false);
  const [letterSoundPlaying, setLetterSoundPlaying] = useState(false);

  const startedRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const ignoreMovesRef = useRef(false);
  const strokePendingRef = useRef(false); // lock between strokes

  const timersRef = useRef<{ strokeAdvance?: number; confettiOff?: number }>({});
  const celebrateTokenRef = useRef(0);

  // measure the instruction bar's real height (handles iPad safe-area / font scaling)
  const instructionBarRef = useRef<HTMLDivElement | null>(null);
  const [instructionBarH, setInstructionBarH] = useState(INSTRUCTION_BAR_H);

  useLayoutEffect(() => {
    const el = instructionBarRef.current;
    if (!el) return;

    const update = () => {
      const h = el.getBoundingClientRect().height;
      setInstructionBarH(h > 0 ? Math.ceil(h) : INSTRUCTION_BAR_H);
    };

    update();

    let ro: ResizeObserver | null = null;
    try {
      ro = new ResizeObserver(() => update());
      ro.observe(el);
    } catch {
      // ResizeObserver not available → fall back to resize only
    }

    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      ro?.disconnect();
    };
  }, [fs, isPretrace, currentLetterId, strokeIndex, letterDone]);

  const clearTimers = useCallback(() => {
    celebrateTokenRef.current += 1;
    if (timersRef.current.strokeAdvance) {
      window.clearTimeout(timersRef.current.strokeAdvance);
      timersRef.current.strokeAdvance = undefined;
    }
    if (timersRef.current.confettiOff) {
      window.clearTimeout(timersRef.current.confettiOff);
      timersRef.current.confettiOff = undefined;
    }
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const [hintIndex, setHintIndex] = useState(0);
  const hintIndexRef = useRef(0);

  const traceAudioRef = useRef<HTMLAudioElement | null>(null);
  const traceAudioPlayingRef = useRef(false);

  const startTraceAudio = useCallback(async () => {
    const a = traceAudioRef.current;
    if (!a) return;
    if (traceAudioPlayingRef.current) return;
    try {
      a.loop = true;
      a.volume = 0.7;
      a.currentTime = 0;
      await a.play();
      traceAudioPlayingRef.current = true;
    } catch {
      // ignore autoplay restrictions
    }
  }, []);

  const stopTraceAudio = useCallback(() => {
    const a = traceAudioRef.current;
    if (!a) return;
    try {
      a.pause();
      a.currentTime = 0;
    } catch {}
    traceAudioPlayingRef.current = false;
  }, []);

  const letterSoundAudioRef = useRef<HTMLAudioElement | null>(null);

  const stopLetterSound = useCallback(() => {
    const a = letterSoundAudioRef.current;
    try {
      if (a) {
        a.pause();
        a.currentTime = 0;
      }
    } catch {}
    try {
      setLetterSoundPlaying(false);
    } catch {}
  }, []);

  const playLetterSound = useCallback(async (): Promise<boolean> => {
    if (!currentLetterId || isPretrace) return false;

    const a = letterSoundAudioRef.current;
    if (!a) return false;

    const candidates = getLetterSoundCandidates(currentLetterId);
    if (!candidates.length) return false;

    try {
      a.pause();
      a.currentTime = 0;
    } catch {}

    for (const src of candidates) {
      try {
        a.src = src;
        a.load();
        a.volume = 1;
        a.currentTime = 0;
        await a.play();

        try {
          setLetterSoundPlaying(true);
        } catch {}

        const onDone = () => {
          try {
            setLetterSoundPlaying(false);
          } catch {}
        };
        a.addEventListener("ended", onDone, { once: true });
        a.addEventListener("error", onDone, { once: true });

        return true;
      } catch {
        // try next candidate
      }
    }

    return false;
  }, [currentLetterId, isPretrace]);

  const waitForAudioEnd = useCallback((a: HTMLAudioElement, maxMs = 15000) => {
    return new Promise<void>((resolve) => {
      let done = false;

      const onDone = () => {
        if (done) return;
        done = true;
        cleanup();
        resolve();
      };

      const cleanup = () => {
        try {
          a.removeEventListener("ended", onDone);
          a.removeEventListener("error", onDone);
        } catch {}
        if (timer) window.clearTimeout(timer);
      };

      a.addEventListener("ended", onDone, { once: true });
      a.addEventListener("error", onDone, { once: true });

      let timer: number | undefined;
      try {
        const remainingMs =
          isFinite(a.duration) && a.duration > 0 ? Math.max(0, (a.duration - a.currentTime) * 1000) : undefined;
        timer = window.setTimeout(onDone, Math.min(maxMs, remainingMs ?? maxMs));
      } catch {
        timer = window.setTimeout(onDone, maxMs);
      }
    });
  }, []);

  const confettiAudioRef = useRef<HTMLAudioElement | null>(null);
  const playConfettiSound = useCallback(async () => {
    const a = confettiAudioRef.current;
    if (!a) return;
    try {
      a.volume = 1;
      a.currentTime = 0;
      await a.play();
    } catch {}
  }, []);

  const triggerConfetti = useCallback(() => {
    setConfetti(true);
    void playConfettiSound();
    timersRef.current.confettiOff = window.setTimeout(() => setConfetti(false), 4000);
  }, [playConfettiSound]);

  const currentStroke: TraceStroke | null = useMemo(() => {
    if (!letterData) return null;
    return letterData.strokes[strokeIndex] ?? null;
  }, [letterData, strokeIndex]);

  const renderViewBox = useMemo(() => {
    const vb = (letterData?.viewBox ?? "0 0 100 100").trim();
    return expandViewBox(vb, VIEWBOX_PAD);
  }, [letterData?.viewBox]);

  const strokeStartT = useMemo(() => {
    return currentStroke && currentStroke.kind === "trace" ? currentStroke.startT : undefined;
  }, [currentStroke]);

  const strokeEndT = useMemo(() => {
    return currentStroke && currentStroke.kind === "trace" ? currentStroke.endT : undefined;
  }, [currentStroke]);

  const toSvg = useSvgPoint(svgRef);

  const currentColor = selectedColor;
  const colorInk = (hex: string) => hexToRgba(hex, 0.72);
  const colorGuide = (hex: string) => hexToRgba(hex, 0.22);

  // Prevent scrolling + iOS bounce while playing (especially in fullscreen)
  useEffect(() => {
    if (mode !== "play") return;

    const body = document.body;
    const html = document.documentElement;

    const prev = {
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyRight: body.style.right,
      bodyWidth: body.style.width,
      htmlOverflow: html.style.overflow,
      touchAction: (body.style as any).touchAction,
      webkitUserSelect: (body.style as any).webkitUserSelect,
      userSelect: (body.style as any).userSelect,
      webkitTouchCallout: (body.style as any).webkitTouchCallout,
      overscrollBehavior: (body.style as any).overscrollBehavior,
    };

    const scrollY = window.scrollY || 0;

    body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    (body.style as any).touchAction = "none";
    (body.style as any).webkitUserSelect = "none";
    (body.style as any).userSelect = "none";
    (body.style as any).webkitTouchCallout = "none";
    (body.style as any).overscrollBehavior = "none";

    // ✅ iOS Safari: prevents rubber-band + URL bar resizing from breaking layout
    if (fs) {
      body.style.position = "fixed";
      body.style.top = `-${scrollY}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
    }

    return () => {
      let restoreY = 0;
      if (fs) {
        restoreY = Math.abs(parseInt(body.style.top || "0", 10)) || 0;
      }

      body.style.overflow = prev.bodyOverflow;
      html.style.overflow = prev.htmlOverflow;
      body.style.position = prev.bodyPosition;
      body.style.top = prev.bodyTop;
      body.style.left = prev.bodyLeft;
      body.style.right = prev.bodyRight;
      body.style.width = prev.bodyWidth;
      (body.style as any).touchAction = prev.touchAction;
      (body.style as any).webkitUserSelect = prev.webkitUserSelect;
      (body.style as any).userSelect = prev.userSelect;
      (body.style as any).webkitTouchCallout = prev.webkitTouchCallout;
      (body.style as any).overscrollBehavior = prev.overscrollBehavior;

      if (fs) window.scrollTo(0, restoreY);
    };
  }, [mode, fs]);

  // Reset state on item change
  useEffect(() => {
    clearTimers();
    stopTraceAudio();
    stopLetterSound();

    setStrokeIndex(0);
    setStarted(false);
    setLastIndex(0);
    lastIndexRef.current = 0;
    startedRef.current = false;
    activePointerIdRef.current = null;
    ignoreMovesRef.current = false;
    strokePendingRef.current = false;

    setLetterDone(false);
    setConfetti(false);
    setTimeStart(null);
    setShowNextArrow(false);

    setHintIndex(0);
    hintIndexRef.current = 0;
  }, [currentLetterId, pretraceId, clearTimers, stopTraceAudio, stopLetterSound]);

  // Reset on stroke change
  useEffect(() => {
    setStarted(false);
    setLastIndex(0);
    lastIndexRef.current = 0;
    startedRef.current = false;
    activePointerIdRef.current = null;

    ignoreMovesRef.current = false;
    strokePendingRef.current = false;

    setHintIndex(0);
    hintIndexRef.current = 0;
  }, [strokeIndex]);

  // Sampling for current stroke
  useLayoutEffect(() => {
    if (!currentStroke || currentStroke.kind === "tap") {
      setSamples([]);
      setRawLen(0);
      setTrimStartLen(0);
      return;
    }

    const d = (currentStroke.pathD ?? "").trim();
    if (!d) {
      setSamples([]);
      setRawLen(0);
      setTrimStartLen(0);
      return;
    }

    const startT0 = typeof strokeStartT === "number" ? strokeStartT : 0;
    const endT0 = typeof strokeEndT === "number" ? strokeEndT : 1;
    const startT = clamp(startT0, 0, 0.999);
    const endT = clamp(endT0, startT + 0.001, 1);

    const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathEl.setAttribute("d", d);

    let len = 0;
    try {
      len = pathEl.getTotalLength();
    } catch {
      len = 0;
    }

    // straight-line fallback
    if (!len || len <= 0) {
      const line = parseLine(d);
      if (!line) {
        setSamples([]);
        setRawLen(0);
        setTrimStartLen(0);
        return;
      }

      const dx = line.b.x - line.a.x;
      const dy = line.b.y - line.a.y;
      const realLen = Math.max(0.0001, Math.sqrt(dx * dx + dy * dy));

      const sLen = realLen * startT;
      const eLen = realLen * endT;
      const wLen = Math.max(0.0001, eLen - sLen);

      const count = 220;
      const pts: Pt[] = [];
      for (let i = 0; i <= count; i++) {
        const t = i / count;
        const l = sLen + wLen * t;
        const along = l / realLen;
        const x = line.a.x + dx * along;
        const y = line.a.y + dy * along;
        pts.push({ x, y, t, len: l - sLen });
      }

      setRawLen(realLen);
      setTrimStartLen(sLen);
      setSamples(pts);

      setLastIndex(0);
      lastIndexRef.current = 0;
      return;
    }

    const sLen = len * startT;
    const eLen = len * endT;
    const wLen = Math.max(0.0001, eLen - sLen);

    const count = 220;
    const pts: Pt[] = [];
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      const l = sLen + wLen * t;
      const p = pathEl.getPointAtLength(l);
      pts.push({ x: p.x, y: p.y, t, len: l - sLen });
    }

    setRawLen(len);
    setTrimStartLen(sLen);
    setSamples(pts);

    setLastIndex(0);
    lastIndexRef.current = 0;
  }, [currentStroke?.pathD, currentStroke?.kind, strokeStartT, strokeEndT]);

  const isTap = currentStroke?.kind === "tap";

  const startPt = useMemo(() => {
    if (!currentStroke) return { x: 0, y: 0 };
    if (currentStroke.kind === "tap") return parseTapPoint(currentStroke.pathD) ?? { x: 0, y: 0 };
    return samples[0] ? { x: samples[0].x, y: samples[0].y } : { x: 0, y: 0 };
  }, [currentStroke, samples]);

  const endPt = useMemo(() => {
    if (!currentStroke) return { x: 0, y: 0 };
    if (currentStroke.kind === "tap") return startPt;
    const last = samples[samples.length - 1];
    return last ? { x: last.x, y: last.y } : { x: 0, y: 0 };
  }, [currentStroke, samples, startPt]);

  // idle hint animation
  useEffect(() => {
    if (letterDone) return;
    if (!currentStroke || currentStroke.kind === "tap") return;
    if (!samples.length) return;
    if (started || lastIndex > 0) return;

    let raf = 0;
    const durMs = 7600;
    const t0 = performance.now();

    const tick = (now: number) => {
      const frac = ((now - t0) % durMs) / durMs;
      const idx = Math.floor(frac * (samples.length - 1));
      if (idx !== hintIndexRef.current) {
        hintIndexRef.current = idx;
        setHintIndex(idx);
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [letterDone, currentStroke?.id, currentStroke?.kind, currentStroke?.pathD, samples.length, started, lastIndex]);

  const guideIndex = useMemo(() => {
    if (!samples.length) return 0;
    return started || lastIndex > 0 ? clamp(lastIndex, 0, samples.length - 1) : clamp(hintIndex, 0, samples.length - 1);
  }, [samples.length, started, lastIndex, hintIndex]);

  const guidePt = useMemo(() => {
    if (!currentStroke) return startPt;
    if (currentStroke.kind === "tap") return startPt;
    if (!samples.length) return startPt;
    const i = guideIndex;
    return { x: samples[i].x, y: samples[i].y };
  }, [currentStroke, samples, guideIndex, startPt]);

  const progressLen = useMemo(() => {
    if (!currentStroke || currentStroke.kind === "tap") return 0;
    if (!samples.length) return 0;
    const i = clamp(lastIndex, 0, samples.length - 1);
    return samples[i].len;
  }, [currentStroke, samples, lastIndex]);

  const guideArrows = useMemo(() => {
    if (!currentStroke || currentStroke.kind === "tap") return [];
    if (!samples.length || samples.length < 3) return [];

    const count = 10; // fewer + cleaner
    const out: { x: number; y: number; angle: number; key: number }[] = [];

    // skip start + end so arrows don't clash with stars
    for (let i = 1; i < count - 1; i++) {
      const ii = Math.floor((i / (count - 1)) * (samples.length - 1));
      const p = samples[ii];

      const prev = samples[Math.max(0, ii - 1)];
      const next = samples[Math.min(samples.length - 1, ii + 1)];

      const dx = next.x - prev.x;
      const dy = next.y - prev.y;

      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      out.push({ x: p.x, y: p.y, angle, key: ii });
    }

    return out;
  }, [currentStroke, samples]);

  const totalStrokes = letterData?.strokes?.length ?? 0;
  const completedCount = letterDone ? totalStrokes : Math.min(totalStrokes, strokeIndex);

  const completedStrokes = useMemo(() => {
    if (!letterData) return [];
    return (letterData.strokes ?? []).slice(0, Math.max(0, Math.min(completedCount, letterData.strokes.length)));
  }, [letterData, completedCount]);

  const allTraceStrokes = useMemo(() => {
    if (!letterData) return [];
    return (letterData.strokes ?? []).filter((s) => s.kind === "trace" && (s.pathD ?? "").trim().length > 0);
  }, [letterData]);

  const showProgress = !letterDone && !isTap && lastIndex > 0 && rawLen > 0;
  const dashArray = rawLen > 0 ? `${progressLen} ${rawLen}` : undefined;
  const dashOffset = rawLen > 0 ? `${-trimStartLen}` : undefined;

  // Jump dropdown (letters only)
  const jumpOptions = useMemo(() => {
    if (mode !== "play" || isPretrace) return [];
    return enabledPairs.flatMap((p, idx) => {
      const opts: { value: string; label: string }[] = [];
      if (p.upper) opts.push({ value: `${idx}|0`, label: `${p.upper} (Capital)` });
      if (p.lower) opts.push({ value: `${idx}|1`, label: `${p.lower} (Small)` });
      return opts;
    });
  }, [mode, isPretrace, enabledPairs]);

  // Reward image: choose first existing candidate
  const [rewardImgSrc, setRewardImgSrc] = useState<string | null>(null);

  useEffect(() => {
    setRewardImgSrc(null);
    if (!currentLetterId || isPretrace) return;

    const candidates = getLetterImageCandidates(currentLetterId);
    if (!candidates.length) return;

    let cancelled = false;

    const tryOne = (src: string) =>
      new Promise<boolean>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = src;
      });

    (async () => {
      for (const src of candidates) {
        const ok = await tryOne(src);
        if (cancelled) return;
        if (ok) {
          setRewardImgSrc(src);
          return;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentLetterId, isPretrace]);

  const rewardMeta = useMemo(() => {
    if (!currentLetterId || isPretrace) return null;
    const ch = String(currentLetterId).trim().charAt(0).toLowerCase();
    if (!/^[a-z]$/.test(ch)) return null;
    return { ch, ...(LETTER_REWARD[ch] ?? { word: "Nice!", emoji: "⭐" }) };
  }, [currentLetterId, isPretrace]);

  // Shift only while reward visible AND sound is playing
  const showReward = letterDone && !isPretrace && !!rewardImgSrc;
  const shiftRightForSound = showReward && letterSoundPlaying;

  
  /* --------------------
     Navigation helpers (IMMERSIVE ONLY — no native fullscreen)
  -------------------- */
  function navigateTo(sp: URLSearchParams, replace: boolean) {
    const query = sp.toString();
    const url = query ? `${BASE_ROUTE}?${query}` : BASE_ROUTE;
    navigate(url, { replace });
  }

  function goGamesPortal() {
    const sp = new URLSearchParams();
    if (kidId) sp.set("kidId", kidId);
    const url = sp.toString() ? `/kids/games/phonics?${sp.toString()}` : "/kids/games/phonics";
    navigate(url, { replace: true });
  }

  // ✅ Preserve immersive if already ON
  function navigatePlay(levelNum: number, pairIdx: number, stepNum: CaseStep, replace = false) {
    const sp = new URLSearchParams();
    if (kidId) sp.set("kidId", kidId);

    const lvl = levelNum === 0 ? 0 : 1;
    sp.set("level", String(lvl));
    sp.set("pair", String(pairIdx));
    sp.set("step", String(stepNum));

    if (fs) sp.set("fs", "1"); // ✅ immersive stays on during Next/Jump
    navigateTo(sp, replace);
  }

  // ✅ Play always starts in Immersive (best for kids)
  function handlePlayButtonClick(levelNum: number, pairIdx: number, stepNum: CaseStep) {
    clearTimers();

    const sp = new URLSearchParams();
    if (kidId) sp.set("kidId", kidId);

    sp.set("level", String(levelNum === 0 ? 0 : 1));
    sp.set("pair", String(pairIdx));
    sp.set("step", String(stepNum));

    sp.set("fs", "1"); // ✅ always immersive (NO native fullscreen)
    navigateTo(sp, false);
  }

  // ✅ Toggle immersive by URL param only (NO native fullscreen)
  function setFs(on: boolean) {
    clearTimers();
    const sp = new URLSearchParams(searchParams);
    if (on) sp.set("fs", "1");
    else sp.delete("fs");
    setSearchParams(sp, { replace: true });
  }

  // ✅ Back to levels always exits immersive
  function goLevels() {
    clearTimers();

    const sp = new URLSearchParams();
    if (kidId) sp.set("kidId", kidId);

    // ✅ no level/pair/step, and no fs
    navigateTo(sp, true);
  }

  // Next item navigation (skip)
  function goNextItem() {
    clearTimers();
    stopTraceAudio();
    stopLetterSound();

    if (mode !== "play") return;

    if (isPretrace) {
      const nextIdx = safePairIndex + 1;
      if (nextIdx < PRETRACE_LEVEL.items.length) {
        navigatePlay(0, nextIdx, 0, false);
        return;
      }
      navigatePlay(1, 0, 0, false);
      return;
    }

    if (step === 0) {
      navigatePlay(1, safePairIndex, 1, false);
      return;
    }

    const nextPair = safePairIndex + 1;
    if (nextPair < enabledPairs.length) {
      navigatePlay(1, nextPair, 0, false);
      return;
    }

    void goLevels();
  }

  function replay() {
    clearTimers();
    stopTraceAudio();
    stopLetterSound();

    setStrokeIndex(0);
    setStarted(false);
    setLastIndex(0);
    lastIndexRef.current = 0;

    startedRef.current = false;
    activePointerIdRef.current = null;
    ignoreMovesRef.current = false;
    strokePendingRef.current = false;

    setLetterDone(false);
    setConfetti(false);
    setTimeStart(null);
    setHintIndex(0);
    hintIndexRef.current = 0;
    setShowNextArrow(false);
  }

  /* --------------------
     Finish stroke / letter
  -------------------- */
  const finishStroke = useCallback(() => {
    if (letterDone) return;
    if (mode !== "play") return;
    if (!letterData) return;

    clearTimers();
    stopTraceAudio();

    // lock moves until lift + next stroke advances
    ignoreMovesRef.current = true;
    strokePendingRef.current = true;

    startedRef.current = false;
    setStarted(false);

    setLastIndex(0);
    lastIndexRef.current = 0;

    const nextStroke = strokeIndex + 1;

    // advance to next stroke
    if (nextStroke < letterData.strokes.length) {
      timersRef.current.strokeAdvance = window.setTimeout(() => {
        setStrokeIndex(nextStroke);
        strokePendingRef.current = false;

        // if finger already lifted, unlock now
        if (activePointerIdRef.current === null) {
          ignoreMovesRef.current = false;
        }
      }, 220);

      return;
    }

    // LETTER COMPLETE
    strokePendingRef.current = false;
    ignoreMovesRef.current = false;

    setLetterDone(true);
    setShowNextArrow(false);

    const token = ++celebrateTokenRef.current;

    void (async () => {
      if (!isPretrace) {
        const audioEl = letterSoundAudioRef.current;
        const played = await playLetterSound();

        if (token !== celebrateTokenRef.current) return;

        if (played && audioEl) {
          try {
            setLetterSoundPlaying(true);
          } catch {}
          await waitForAudioEnd(audioEl, 15000);
          try {
            setLetterSoundPlaying(false);
          } catch {}
        }
      }

      if (token !== celebrateTokenRef.current) return;

      setShowNextArrow(true);
      triggerConfetti();
    })();

    // Save progress
    if (!kidId) return;

    try {
      const spentMs = timeStart ? Math.max(0, Math.round(performance.now() - timeStart)) : 0;
      const levelForTracking = isPretrace ? 0 : 1;
      const masteredItem = isPretrace ? pretraceId ?? "" : currentLetterId ?? "";

      const baseTags = Array.isArray(letterData?.skillTags) ? letterData!.skillTags : [];
      const skillTags = buildLetterTracingSkillTags({
        baseTags,
        isPretrace,
        levelForTracking,
        step,
        currentLetterId,
      });

      const tagDeltas: Record<string, { attempts: number; correct: number; wrong: number }> =
        Object.fromEntries(skillTags.map((tag) => [tag, { attempts: 1, correct: 1, wrong: 0 }]));

      // ✅ resume point
      const nextPos: LastPos = (() => {
        if (isPretrace) {
          const nextIdx = safePairIndex + 1;
          if (nextIdx < PRETRACE_LEVEL.items.length) return { level: 0, pair: nextIdx, step: 0 };
          return { level: 1, pair: 0, step: 0 };
        }

        if (step === 0) return { level: 1, pair: safePairIndex, step: 1 };

        const nextPair = safePairIndex + 1;
        if (nextPair < enabledPairs.length) return { level: 1, pair: nextPair, step: 0 };

        return { level: 1, pair: 0, step: 0 };
      })();

      // Persist SHADOW progress first (so hard-refresh never loses UI progress)
      try {
        const payload = {
          gameId: GAME_ID,
          progressDocId: PROGRESS_DOC_ID,
          kidId,
          levelId: levelForTracking,
          completed: true,
          accuracyPct: 100,
          durationSec: Math.round(spentMs / 1000),
          score: 100,
          skillTags,
          tagDeltas,
          masteredItems: [masteredItem].filter(Boolean),
          completedAt: Date.now(),
          lastPos: nextPos,
          lastPosUpdatedAt: Date.now(),
        } as any;

        const prev = readOutbox(kidId) ?? {};
        const prevShadow = uniqStrings((prev as Outbox).shadowMasteredItems);
        const nextShadow = Array.from(new Set([...prevShadow, String(masteredItem || "")].filter(Boolean)));

        // ✅ keep SHADOW always, and only use pendingPayload for retry
        writeOutbox(kidId, {
          ...(prev as Outbox),
          shadowMasteredItems: nextShadow,
          shadowLastPos: nextPos,
          shadowUpdatedAtMs: Date.now(),
          pendingPayload: payload,
        });

        recordLevelResult(payload)
          .then(() => {
            // ✅ DO NOT clear shadow here — server progress doc may update only 3×/day
            const cur = readOutbox(kidId);
            if (!cur) return;

            // remove pending retry only
            const next: Outbox = { ...cur };
            delete next.pendingPayload;

            const hasAnything =
              (next.shadowMasteredItems && next.shadowMasteredItems.length > 0) ||
              !!next.pendingPayload;

            if (hasAnything) writeOutbox(kidId, next);
            else clearOutbox(kidId);
          })
          .catch(() => {
            // keep pendingPayload so we can retry later
          });
      } catch {}

      if (masteredItem) {
        setProgress((prev) => {
          const next = new Set(prev.mastered);
          next.add(String(masteredItem));
          return {
            ...prev,
            status: prev.status === "idle" ? "ready" : prev.status,
            mastered: next,
            lastPos: nextPos,
            updatedAtMs: Date.now(),
          };
        });
      }
    } catch {
      // never block gameplay
    }
  }, [
    letterDone,
    mode,
    letterData,
    clearTimers,
    stopTraceAudio,
    strokeIndex,
    isPretrace,
    playLetterSound,
    waitForAudioEnd,
    triggerConfetti,
    kidId,
    timeStart,
    pretraceId,
    currentLetterId,
    step,
    safePairIndex,
    enabledPairs.length,
  ]);

  /* --------------------
     Pointer handling
  -------------------- */
  function handlePointerDown(e: React.PointerEvent) {
    if (letterDone) return;
    if (!currentStroke) return;
    if (ignoreMovesRef.current) return;

    e.preventDefault();

    if (timeStart === null) setTimeStart(performance.now());

    const p = toSvg(e.clientX, e.clientY);

    if (currentStroke.kind === "tap") {
      const target = parseTapPoint(currentStroke.pathD);
      if (!target) return;
      if (dist(p, target) <= 10) finishStroke();
      return;
    }

    const startRadius = 14;
    const resumeRadius = 18;

    const hasProgress = lastIndexRef.current > 0 && samples.length > 0;
    const resumePt = hasProgress ? samples[clamp(lastIndexRef.current, 0, samples.length - 1)] : startPt;
    const allowedR = hasProgress ? resumeRadius : startRadius;

    if (dist(p, resumePt) > allowedR) return;

    void startTraceAudio();

    startedRef.current = true;
    activePointerIdRef.current = e.pointerId;
    setStarted(true);

    if (!hasProgress) {
      setLastIndex(0);
      lastIndexRef.current = 0;
    }

    (e.currentTarget as any).setPointerCapture?.(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (letterDone) return;
    if (!currentStroke || currentStroke.kind === "tap") return;

    if (ignoreMovesRef.current) return;
    if (!startedRef.current) return;
    if (activePointerIdRef.current !== e.pointerId) return;
    if (!samples.length) return;

    e.preventDefault();

    const p = toSvg(e.clientX, e.clientY);

    const tolerance = 12;
    const i0 = clamp(lastIndexRef.current, 0, samples.length - 1);
    const lookahead = 34;

    let bestI = i0;
    let bestD = Infinity;

    const endI = clamp(i0 + lookahead, 0, samples.length - 1);
    for (let i = i0; i <= endI; i++) {
      const d = dist(p, samples[i]);
      if (d < bestD) {
        bestD = d;
        bestI = i;
      }
    }

    if (bestD <= tolerance) {
      lastIndexRef.current = bestI;
      setLastIndex(bestI);

      if (bestI >= samples.length - 2) finishStroke();
    }
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (activePointerIdRef.current === e.pointerId) {
      stopTraceAudio();
      try {
        (e.currentTarget as any).releasePointerCapture?.(e.pointerId);
      } catch {}

      activePointerIdRef.current = null;
      startedRef.current = false;
      setStarted(false);

      // unlock only if we're not waiting to advance stroke
      if (!strokePendingRef.current) {
        ignoreMovesRef.current = false;
      }
    }
  }

  /* --------------------
     LEVELS screen
  -------------------- */
  if (mode === "levels") {
    const LEVELS: TraceLevelView[] = [
      {
        levelId: 1,
        title: "Level 1 — A to Z Letters",
        subtitle: "Capital & Small",
        pairs: allLetterPairs.map((p) => ({ upper: p.upper, lower: p.lower })),
      },
    ];

    const mastered = progress.mastered;

    const pretraceChips = (PRETRACE_LEVEL.items ?? [])
      .map((id) => ({ id, label: PRETRACE_ITEMS[id]?.label ?? String(id) }))
      .filter((x) => Boolean(x.label))
      .slice(0, 6);

    const preTotal = PRETRACE_LEVEL.items.length;
    const preDone = PRETRACE_LEVEL.items.filter((id) => mastered.has(String(id))).length;

    const upperTotal = 26;
    const lowerTotal = 26;
    const upperDone = progressCounts.upperDone;
    const lowerDone = progressCounts.lowerDone;

    const letterTotal = upperTotal + lowerTotal;
    const letterDoneCount = upperDone + lowerDone;
    const letterPct = letterTotal > 0 ? Math.round((letterDoneCount / letterTotal) * 100) : 0;

    const updatedLabel =
      progress.updatedAtMs && Number.isFinite(progress.updatedAtMs) ? new Date(progress.updatedAtMs).toLocaleString() : undefined;

    const levelProgress = (lv: TraceLevelView) => {
      const ids: string[] = [];
      for (const p of lv.pairs ?? []) {
        if (p.upper) ids.push(String(p.upper));
        if (p.lower) ids.push(String(p.lower));
      }
      const unique = Array.from(new Set(ids));
      const done = unique.filter((id) => mastered.has(id)).length;
      const total = unique.length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      return { done, total, pct };
    };

    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="relative overflow-hidden rounded-[28px] border bg-white/60 p-6 shadow-sm backdrop-blur">
          <div className="pointer-events-none absolute -top-24 left-[-10%] h-72 w-72 rounded-full bg-sky-200/50 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-[-10%] h-72 w-72 rounded-full bg-pink-200/50 blur-3xl" />

          <div className="relative">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
                  Letter Tracing Adventure (With Sounds)
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-700">
                  Start with warm-up shapes → then trace <span className="font-semibold">Capital</span> and{" "}
                  <span className="font-semibold">Small</span> letters.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-extrabold text-slate-800 ring-1 ring-white/60">
                    🎯 Letters: {letterDoneCount}/{letterTotal} ({letterPct}%)
                  </span>
                  <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-extrabold text-slate-800 ring-1 ring-white/60">
                    🔠 Capital: {upperDone}/{upperTotal}
                  </span>
                  <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-extrabold text-slate-800 ring-1 ring-white/60">
                    🔡 Small: {lowerDone}/{lowerTotal}
                  </span>
                  <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-extrabold text-slate-800 ring-1 ring-white/60">
                    ✍️ Warm-up: {preDone}/{preTotal}
                  </span>
                  {updatedLabel && (
                    <span className="rounded-full bg-white/70 px-3 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-white/60">
                      Last synced: {updatedLabel}
                    </span>
                  )}
                </div>

                <div className="mt-3 w-full max-w-xl">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/60">
                    <div className="h-full rounded-full bg-emerald-500/70" style={{ width: `${letterPct}%` }} />
                  </div>
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-2">
                <button
                  onClick={goGamesPortal}
                  className="rounded-full border bg-white/80 px-4 py-2 text-sm font-semibold shadow-sm hover:shadow-md"
                >
                  ← Back to Games
                </button>

                <button
                  onClick={() => void fetchProgress({ forceServer: true })}
                  disabled={!kidId || progress.status === "loading"}
                  className={[
                    "rounded-full border bg-white/80 px-4 py-2 text-sm font-semibold shadow-sm hover:shadow-md",
                    !kidId || progress.status === "loading" ? "opacity-60 cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  {progress.status === "loading" ? "Refreshing…" : "Refresh progress"}
                </button>

                <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-white/60">
                  ⭐ Start at the star
                </span>
                <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-white/60">
                  ✋ Lift between strokes
                </span>
                <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-white/60">
                  🔊 Sound plays on completion
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="relative rounded-3xl border border-white/60 bg-white/65 p-4 shadow-sm backdrop-blur">
                  <div className="pointer-events-none absolute left-7 top-6 bottom-6 w-[3px] rounded-full bg-gradient-to-b from-sky-300 via-fuchsia-300 to-emerald-300 opacity-60" />

                  <div className="space-y-4 pl-12">
                    {/* Level 0 */}
                    <button
                      onClick={() => handlePlayButtonClick(0, progressCounts.resume0.pair, 0)}
                      className={[
                        "group relative w-full rounded-3xl border border-white/60 bg-gradient-to-r from-white/85 to-sky-50/60 p-4 text-left shadow-sm transition",
                        "hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0",
                      ].join(" ")}
                    >
                      <div className="absolute -left-[52px] top-1/2 -translate-y-1/2">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow ring-4 ring-sky-100">
                          <span className="text-lg">🚀</span>
                        </div>
                      </div>

                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-lg font-extrabold text-slate-900">{PRETRACE_LEVEL.title}</div>
                          <div className="mt-0.5 text-sm font-semibold text-slate-600">{PRETRACE_LEVEL.subtitle}</div>
                          <div className="mt-1 text-xs font-semibold text-slate-600">
                            Resume: {progressCounts.resume0Label}
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700 ring-1 ring-emerald-100">
                          <span className="animate-pulse">●</span> Ready
                          <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-extrabold text-slate-800 ring-1 ring-white/60">
                            {preDone}/{preTotal}
                          </span>
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {pretraceChips.map((c, i) => {
                          const done = mastered.has(String(c.id));
                          return (
                            <span
                              key={`${c.label}-${i}`}
                              className={[
                                "rounded-full px-3 py-1 text-xs font-semibold ring-1",
                                done
                                  ? "bg-emerald-50 text-emerald-800 ring-emerald-100"
                                  : "bg-white/80 text-slate-700 ring-white/70",
                              ].join(" ")}
                            >
                              {c.label}
                              {done ? " ✓" : ""}
                            </span>
                          );
                        })}
                        <span className="rounded-full bg-slate-900/90 px-3 py-1 text-xs font-semibold text-white">
                          {PRETRACE_LEVEL.items.length} activities
                        </span>
                      </div>

                      <div className="mt-3">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/60">
                          <div
                            className="h-full rounded-full bg-emerald-500/70"
                            style={{ width: `${preTotal > 0 ? Math.round((preDone / preTotal) * 100) : 0}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-xs font-semibold text-slate-600">Start here to make hands ready ✨</div>
                        <div className="text-sm font-black text-slate-900/50 transition group-hover:translate-x-1">→</div>
                      </div>
                    </button>

                    {/* Level 1 */}
                    {LEVELS.map((lv) => {
                      const lp = levelProgress(lv);

                      // ✅ show Upper and Lower separately
                      const upperBadges = (lv.pairs ?? [])
                        .map((p) => {
                          const label = p?.upper ? String(p.upper) : "";
                          if (!label) return null;
                          const done = mastered.has(label);
                          return { label, done };
                        })
                        .filter(Boolean) as Array<{ label: string; done: boolean }>;

                      const lowerBadges = (lv.pairs ?? [])
                        .map((p) => {
                          const label = p?.lower ? String(p.lower) : "";
                          if (!label) return null;
                          const done = mastered.has(label);
                          return { label, done };
                        })
                        .filter(Boolean) as Array<{ label: string; done: boolean }>;

                      const upperDone = upperBadges.filter((b) => b.done).length;
                      const lowerDone = lowerBadges.filter((b) => b.done).length;

                      return (
                        <button
                          key={lv.levelId}
                          onClick={() => handlePlayButtonClick(lv.levelId, progressCounts.resume1.pair, progressCounts.resume1.step)}
                          className={[
                            "group relative w-full rounded-3xl border p-4 text-left shadow-sm transition backdrop-blur",
                            "border-white/60 bg-gradient-to-r from-white/85 to-pink-50/60 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0",
                          ].join(" ")}
                        >
                          <div className="absolute -left-[52px] top-1/2 -translate-y-1/2">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow ring-4 ring-fuchsia-100">
                              <span className="text-lg">⭐</span>
                            </div>
                          </div>

                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-lg font-extrabold text-slate-900">{lv.title}</div>
                              {lv.subtitle && <div className="mt-0.5 text-sm font-semibold text-slate-600">{lv.subtitle}</div>}
                              <div className="mt-1 text-xs font-semibold text-slate-600">
                                Resume: {progressCounts.resume1Label}
                              </div>
                            </div>

                            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700 ring-1 ring-emerald-100">
                              <span className="animate-pulse">●</span> Ready
                              <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-extrabold text-slate-800 ring-1 ring-white/60">
                                {lp.done}/{lp.total}
                              </span>
                            </span>
                          </div>

                          {/* ✅ Letters (no scroll) — show all at once */}
                          <div className="mt-3 space-y-3">
                            {/* Capital */}
                            <div>
                              <div className="flex items-center justify-between">
                                <div className="text-[11px] font-extrabold text-slate-600">🔠 Capital</div>
                                <div className="text-[11px] font-semibold text-slate-500">{upperDone}/26</div>
                              </div>

                              {/* Desktop: exactly 13 columns → 2 rows */}
                              <div className="mt-2 hidden md:grid gap-2" style={{ gridTemplateColumns: "repeat(13, minmax(0, 1fr))" }}>
                                {upperBadges.map((t) => (
                                  <div
                                    key={`U-${t.label}`}
                                    className={[
                                      "relative flex h-10 items-center justify-center rounded-xl text-sm font-extrabold ring-1",
                                      t.done ? "bg-emerald-50 text-emerald-800 ring-emerald-100" : "bg-white/80 text-slate-700 ring-white/70",
                                    ].join(" ")}
                                  >
                                    {t.label}
                                    {t.done && (
                                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-[12px] font-black shadow">
                                        ✓
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>

                              {/* Mobile: auto-fit (no horizontal scroll) */}
                              <div
                                className="mt-2 grid md:hidden gap-2"
                                style={{ gridTemplateColumns: "repeat(auto-fit, minmax(34px, 1fr))" }}
                              >
                                {upperBadges.map((t) => (
                                  <div
                                    key={`U-m-${t.label}`}
                                    className={[
                                      "relative flex h-10 items-center justify-center rounded-xl text-sm font-extrabold ring-1",
                                      t.done ? "bg-emerald-50 text-emerald-800 ring-emerald-100" : "bg-white/80 text-slate-700 ring-white/70",
                                    ].join(" ")}
                                  >
                                    {t.label}
                                    {t.done && (
                                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-[12px] font-black shadow">
                                        ✓
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Small */}
                            <div>
                              <div className="flex items-center justify-between">
                                <div className="text-[11px] font-extrabold text-slate-600">🔡 Small</div>
                                <div className="text-[11px] font-semibold text-slate-500">{lowerDone}/26</div>
                              </div>

                              {/* Desktop: exactly 13 columns → 2 rows */}
                              <div className="mt-2 hidden md:grid gap-2" style={{ gridTemplateColumns: "repeat(13, minmax(0, 1fr))" }}>
                                {lowerBadges.map((t) => (
                                  <div
                                    key={`L-${t.label}`}
                                    className={[
                                      "relative flex h-10 items-center justify-center rounded-xl text-sm font-extrabold ring-1",
                                      t.done ? "bg-emerald-50 text-emerald-800 ring-emerald-100" : "bg-white/80 text-slate-700 ring-white/70",
                                    ].join(" ")}
                                  >
                                    {t.label}
                                    {t.done && (
                                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-[12px] font-black shadow">
                                        ✓
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>

                              {/* Mobile: auto-fit (no horizontal scroll) */}
                              <div
                                className="mt-2 grid md:hidden gap-2"
                                style={{ gridTemplateColumns: "repeat(auto-fit, minmax(34px, 1fr))" }}
                              >
                                {lowerBadges.map((t) => (
                                  <div
                                    key={`L-m-${t.label}`}
                                    className={[
                                      "relative flex h-10 items-center justify-center rounded-xl text-sm font-extrabold ring-1",
                                      t.done ? "bg-emerald-50 text-emerald-800 ring-emerald-100" : "bg-white/80 text-slate-700 ring-white/70",
                                    ].join(" ")}
                                  >
                                    {t.label}
                                    {t.done && (
                                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-[12px] font-black shadow">
                                        ✓
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {lp.total > 0 && (
                            <div className="mt-3">
                              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/60">
                                <div className="h-full rounded-full bg-emerald-500/70" style={{ width: `${lp.pct}%` }} />
                              </div>
                            </div>
                          )}

                          <div className="mt-3 flex items-center justify-between">
                            <div className="text-xs font-semibold text-slate-600">Tap to begin this level</div>
                            <div className="text-sm font-black text-slate-900/50 transition group-hover:translate-x-1">→</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="rounded-3xl border border-white/60 bg-white/65 p-5 shadow-sm backdrop-blur">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-extrabold text-slate-900">How to play</div>
                    <div className="text-xs font-semibold text-slate-600">Quick tips</div>
                  </div>

                  <ol className="mt-4 space-y-3 text-sm text-slate-700">
                    <li className="flex gap-3">
                      <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-700 font-extrabold">
                        1
                      </span>
                      <div>
                        <div className="font-bold text-slate-900">Warm-up first</div>
                        <div className="text-slate-600">Lines & curves make handwriting easy.</div>
                      </div>
                    </li>

                    <li className="flex gap-3">
                      <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-pink-100 text-pink-700 font-extrabold">
                        2
                      </span>
                      <div>
                        <div className="font-bold text-slate-900">Capital → Small</div>
                        <div className="text-slate-600">Trace big letter, then small letter.</div>
                      </div>
                    </li>

                    <li className="flex gap-3">
                      <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-extrabold">
                        3
                      </span>
                      <div>
                        <div className="font-bold text-slate-900">Sound</div>
                        <div className="text-slate-600">Plays on completion (and via 🔊 button).</div>
                      </div>
                    </li>
                  </ol>

                  <div className="mt-5 rounded-2xl bg-slate-900/90 p-4 text-white">
                    <div className="text-sm font-extrabold">Pro tip</div>
                    <p className="mt-1 text-sm text-white/80">
                      Use <span className="font-semibold text-white">Fullscreen</span> (or immersive mode) for the best tracing experience.
                    </p>
                  </div>

                  {progress.status === "ready" && progress.sourcePath && progress.sourcePath !== "not-found" && (
                    <div className="mt-3 text-[11px] font-semibold text-slate-400">Progress source: {progress.sourcePath}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 text-center text-xs font-semibold text-slate-600">
              Tip: Start from Level 0 even if the child knows letters — it improves pencil control ✍️
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* --------------------
     Play guards
  -------------------- */
  if (!letterData || !currentStroke) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="rounded-xl border bg-white p-6">
          <div className="text-lg font-semibold text-slate-900">This item isn't ready yet.</div>
          <button onClick={goLevels} className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-white">
            Back to Levels
          </button>
        </div>
      </div>
    );
  }

  const strokeNo = strokeIndex + 1;

  const headerLabel = isPretrace
    ? `Level 0 • ${letterData.label} • Stroke ${strokeNo}/${totalStrokes}`
    : `Level 1 • ${step === 0 ? "Capital" : "Small"} • Letter: ${currentLetterId ?? ""} • Stroke ${strokeNo}/${totalStrokes}`;

  const wrapperClass = fs ? "fixed inset-0 z-[9999] bg-slate-50" : "mx-auto w-full max-w-6xl px-4 py-6";

  return (
    <div
      ref={fsRef}
      className={wrapperClass}
      style={
        fs
          ? {
              // ✅ iPad stable height using visualViewport
              height: "var(--ts-vh)" as any,
              minHeight: "100svh",
              width: "100vw",
              overflow: "hidden",
              paddingTop: "calc(16px + env(safe-area-inset-top))",
              paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
              paddingLeft: "calc(16px + env(safe-area-inset-left))",
              paddingRight: "calc(16px + env(safe-area-inset-right))",
              touchAction: "none",
              WebkitUserSelect: "none",
              userSelect: "none",
              WebkitTapHighlightColor: "transparent",
            }
          : {
              touchAction: "none",
              WebkitUserSelect: "none",
              userSelect: "none",
              WebkitTapHighlightColor: "transparent",
            }
      }
      onContextMenu={(e) => e.preventDefault()}
    >
      <audio ref={traceAudioRef} src={TRACE_AUDIO_SRC} preload="auto" />
      <audio ref={confettiAudioRef} src={CONFETTI_AUDIO_SRC} preload="auto" />
      <audio ref={letterSoundAudioRef} preload="auto" />

      <style>{`
@keyframes tsRewardPop {
  0%   { transform: scale(0.15) translateY(-12px) rotate(-8deg); opacity: 0; }
  45%  { transform: scale(1.18) translateY(0) rotate(2deg); opacity: 1; }
  70%  { transform: scale(0.96) rotate(-1deg); }
  100% { transform: scale(1) rotate(0); }
}
@keyframes tsRewardBoomRing {
  0%   { transform: scale(0.35); opacity: 0; }
  18%  { opacity: 0.55; }
  100% { transform: scale(2.0); opacity: 0; }
}
@keyframes tsNextPulse {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.10); }
  100% { transform: scale(1); }
}
@keyframes tsNextHalo {
  0%   { transform: scale(0.85); opacity: .45; }
  50%  { transform: scale(1.05); opacity: .22; }
  100% { transform: scale(0.85); opacity: .45; }
}
@keyframes tsNextNudge {
  0%,100% { transform: translateX(0); }
  50%     { transform: translateX(8px); }
}

.tsRewardRing {
  position: absolute;
  inset: -28px;
  border-radius: 9999px;
  background: radial-gradient(circle, rgba(16,185,129,.26), rgba(59,130,246,.18), transparent 60%);
  animation: tsRewardBoomRing 900ms ease-out both;
}
.tsRewardPop {
  animation: tsRewardPop 650ms cubic-bezier(.2,.9,.2,1) both;
}
.tsNextPulse { animation: tsNextPulse 1.1s ease-in-out infinite; }
.tsNextHalo  { animation: tsNextHalo  1.1s ease-in-out infinite; }
.tsNextNudge { animation: tsNextNudge 1.1s ease-in-out infinite; }
@keyframes tsTickPop {
  0%   { transform: translateY(-10px) scale(0.6); opacity: 0; }
  55%  { transform: translateY(0px) scale(1.08); opacity: 1; }
  100% { transform: translateY(0px) scale(1); opacity: 1; }
}
.tsTickPop {
  animation: tsTickPop 420ms cubic-bezier(.2,.9,.2,1) both;
}
`}</style>

      <div className={fs ? "flex h-full w-full flex-col gap-3" : ""}>
        {/* Header */}
        <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-2">
          <div className="rounded-full border bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-slate-800">
            {headerLabel}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800">
              🔠 {progressCounts.upperDone}/{progressCounts.upperTotal}
            </span>
            <span className="rounded-full border bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800">
              🔡 {progressCounts.lowerDone}/{progressCounts.lowerTotal}
            </span>
            <span className="rounded-full border bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800">
              ✍️ {progressCounts.preDone}/{progressCounts.preTotal}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isPretrace && jumpOptions.length > 0 && (
              <select
                value={`${safePairIndex}|${step}`}
                onChange={(e) => {
                  const [pi, st] = e.target.value.split("|").map((x) => Number(x));
                  navigatePlay(1, Number.isFinite(pi) ? pi : 0, st === 1 ? 1 : 0, false);
                }}
                className="rounded-full border bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800"
              >
                {jumpOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            )}

            {/* 🎨 Color picker */}
            <div className="flex items-center gap-2 rounded-full border bg-white px-3 py-2">
              <span className="text-xs sm:text-sm font-semibold text-slate-700">Color</span>

              <div className="flex items-center gap-2">
                {STROKE_COLORS.map((c) => {
                  const active = c === selectedColor;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={[
                        "h-7 w-7 rounded-full border",
                        "shadow-sm transition active:scale-95",
                        active ? "ring-2 ring-slate-900/20" : "hover:scale-[1.04]",
                      ].join(" ")}
                      style={{
                        backgroundColor: c,
                        borderColor: active ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.12)",
                      }}
                      aria-label={`Select color ${c}`}
                      title="Change tracing color"
                    />
                  );
                })}
              </div>
            </div>

            {!isPretrace && (
              <button
                onClick={playLetterSound}
                className="rounded-full border bg-white px-4 py-2 text-xs sm:text-sm font-semibold"
                title="Play letter sound"
              >
                🔊 Sound
              </button>
            )}

            <button onClick={replay} className="rounded-full border bg-white px-4 py-2 text-xs sm:text-sm font-semibold">
              Replay
            </button>

            <button onClick={goNextItem} className="rounded-full border bg-white px-4 py-2 text-xs sm:text-sm font-semibold">
              Next
            </button>

            {fs ? (
              <button
                onClick={() => void goLevels()}
                className="rounded-full border bg-white px-4 py-2 text-xs sm:text-sm font-semibold"
              >
                Exit
              </button>
            ) : (
              <button
                onClick={() => void setFs(true)}
                className="rounded-full border bg-white px-4 py-2 text-xs sm:text-sm font-semibold"
              >
                Immersive
              </button>
            )}

            <button onClick={goLevels} className="rounded-full border bg-white px-4 py-2 text-xs sm:text-sm font-semibold">
              Levels
            </button>
          </div>
        </div>

        {/* Main board */}
        <div
          className={`relative overflow-hidden rounded-2xl border shadow-sm flex flex-col ${fs ? "flex-1 min-h-0" : ""}`}
          style={{
            background:
              "radial-gradient(circle at 20% 20%, rgba(56,189,248,0.18), transparent 55%), radial-gradient(circle at 80% 30%, rgba(244,114,182,0.16), transparent 55%), radial-gradient(circle at 45% 85%, rgba(34,197,94,0.10), transparent 55%), linear-gradient(135deg, #f8fbff 0%, #fff7fb 45%, #fffdf7 100%)",
          }}
        >
          <ConfettiBurst fire={confetti} />

          {/* ✅ Green tick on completion */}
          {letterDone && (
            <div className="pointer-events-none absolute left-1/2 top-5 z-[10025] -translate-x-1/2">
              <div className="tsTickPop flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-white shadow-lg">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-lg font-black leading-none">
                  ✓
                </span>
                <span className="text-sm font-extrabold">Done!</span>
              </div>
            </div>
          )}

          {/* Reward image */}
          {letterDone && !isPretrace && rewardImgSrc && (
            <div
              className="pointer-events-none absolute z-[10020]"
              style={{ left: "24%", top: "52%", transform: "translate(-50%, -50%)" }}
            >
              <div className="tsRewardPop relative">
                <div className="tsRewardRing absolute inset-[-40px] rounded-full" />
                <img
                  src={rewardImgSrc}
                  alt="reward"
                  draggable={false}
                  className="h-[220px] w-[220px] sm:h-[280px] sm:w-[280px] lg:h-[340px] lg:w-[340px] object-contain drop-shadow-2xl"
                />
                {rewardMeta?.word ? (
                  <div className="mt-2 text-center text-lg font-extrabold text-slate-900 drop-shadow">
                    {rewardMeta.emoji} {rewardMeta.word}
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* Stage (IMPORTANT: no h-full when using aspectRatio in non-fs) */}
          <div
            className={fs ? "relative flex-1 min-h-0 w-full" : "relative w-full"}
            style={
              fs
                ? { minHeight: 0 }
                : { aspectRatio: "16 / 9", minHeight: "55vh" }
            }
          >
            <svg
              ref={svgRef}
              viewBox={renderViewBox}
              preserveAspectRatio="xMidYMid meet"
              width="100%"
              height="100%"
              className="absolute inset-0 w-full h-full touch-none select-none"
              style={{
                touchAction: "none",
                WebkitUserSelect: "none",
                userSelect: "none",
                WebkitTouchCallout: "none",

                // reserve exactly the instruction bar's REAL height
                bottom: instructionBarH,

                transform: shiftRightForSound
                  ? "translateX(clamp(12px, 3vw, 56px))"
                  : "translateX(0px)",
                transition: "transform 220ms ease",
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onContextMenu={(e) => e.preventDefault()}
            >
              {/* Full letter outline */}
              {allTraceStrokes.map((s, i) => {
                const c = STROKE_COLORS[i % STROKE_COLORS.length];
                return (
                  <path
                    key={`outline-${s.id ?? i}`}
                    d={(s.pathD ?? "").trim()}
                    fill="none"
                    stroke={hexToRgba(c, 0.1)}
                    strokeWidth={10}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pointerEvents="none"
                  />
                );
              })}

              {/* Completed strokes */}
              {completedStrokes.map((s, i) => {
                if (s.kind === "tap") {
                  const p = parseTapPoint(s.pathD);
                  if (!p) return null;
                  const c = STROKE_COLORS[i % STROKE_COLORS.length];
                  return (
                    <circle
                      key={`done-tap-${s.id ?? i}`}
                      cx={p.x}
                      cy={p.y}
                      r={7}
                      fill={hexToRgba(c, 0.75)}
                      pointerEvents="none"
                    />
                  );
                }
                const d = (s.pathD ?? "").trim();
                if (!d) return null;
                const c = STROKE_COLORS[i % STROKE_COLORS.length];
                return (
                  <path
                    key={`done-${s.id ?? i}`}
                    d={d}
                    fill="none"
                    stroke={hexToRgba(c, 0.78)}
                    strokeWidth={12}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pointerEvents="none"
                  />
                );
              })}

              {/* Current stroke guides */}
              {!letterDone && !isTap && (
                <>
                  <path
                    d={(currentStroke?.pathD ?? "").trim()}
                    fill="none"
                    stroke={colorGuide(currentColor)}
                    strokeWidth={10}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pointerEvents="none"
                  />

                  {guideArrows.map((d) => (
                    <g
                      key={d.key}
                      transform={`translate(${d.x}, ${d.y}) rotate(${d.angle}) scale(0.70)`}
                      pointerEvents="none"
                      opacity={0.45}
                    >
                      <path
                        // small shaft + chevron head (points RIGHT before rotation)
                        d="M -6 0 L 3 0 M 3 0 L 0 -2.8 M 3 0 L 0 2.8"
                        fill="none"
                        stroke={hexToRgba(currentColor, 0.30)}
                        strokeWidth={1.8}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                  ))}

                  {showProgress && (
                    <path
                      d={(currentStroke?.pathD ?? "").trim()}
                      fill="none"
                      stroke={colorInk(currentColor)}
                      strokeWidth={10}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray={dashArray}
                      strokeDashoffset={dashOffset}
                      pointerEvents="none"
                    />
                  )}
                </>
              )}

              {/* Start + guide + end markers */}
              {!letterDone && (
                <>
                  {isTap ? (
                    <>
                      <circle cx={startPt.x} cy={startPt.y} r={10} fill={hexToRgba(currentColor, 0.18)} pointerEvents="none" />
                      <circle cx={startPt.x} cy={startPt.y} r={6.5} fill={hexToRgba(currentColor, 0.9)} pointerEvents="none" />
                    </>
                  ) : (
                    <>
                      {/* START */}
                      <g transform={`translate(${startPt.x}, ${startPt.y})`} pointerEvents="none">
                        <image
                          href={STAR_SRC}
                          xlinkHref={STAR_SRC}
                          x={-STAR_START_SIZE / 2}
                          y={-STAR_START_SIZE / 2}
                          width={STAR_START_SIZE}
                          height={STAR_START_SIZE}
                          preserveAspectRatio="xMidYMid meet"
                        />
                      </g>

                      {/* MOVING GUIDE STAR */}
                      <g transform={`translate(${guidePt.x}, ${guidePt.y})`} pointerEvents="none">
                        <g>
                          <animateTransform attributeName="transform" type="scale" values="1;1.12;1" dur="0.9s" repeatCount="indefinite" />
                          <image
                            href={STAR_SRC}
                            xlinkHref={STAR_SRC}
                            x={-STAR_GUIDE_SIZE / 2}
                            y={-STAR_GUIDE_SIZE / 2}
                            width={STAR_GUIDE_SIZE}
                            height={STAR_GUIDE_SIZE}
                            preserveAspectRatio="xMidYMid meet"
                          />
                        </g>
                      </g>

                      {/* END */}
                      <g transform={`translate(${endPt.x}, ${endPt.y})`} pointerEvents="none">
                        <image
                          href={STAR_SRC}
                          xlinkHref={STAR_SRC}
                          x={-STAR_END_SIZE / 2}
                          y={-STAR_END_SIZE / 2}
                          width={STAR_END_SIZE}
                          height={STAR_END_SIZE}
                          preserveAspectRatio="xMidYMid meet"
                          opacity={0.85}
                        />
                      </g>
                    </>
                  )}
                </>
              )}
            </svg>

            {/* Instruction bar (let it auto-size; we measure it) */}
            <div
              ref={instructionBarRef}
              className="absolute bottom-0 left-0 right-0 bg-white/55 px-4 py-3 text-center text-sm font-semibold text-slate-700 backdrop-blur"
            >
              {isTap ? "Tap the glowing dot." : "Start at the star. Follow the star and trace the line."}
            </div>
          </div>

          {/* Completion: big next arrow */}
          {letterDone && showNextArrow && (
            <div className="absolute inset-0 pointer-events-none z-[10030]">
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-auto">
                <button
                  onClick={goNextItem}
                  aria-label="Next"
                  title="Next"
                  className={[
                    "tsNextPulse relative",
                    "h-[112px] w-[112px] sm:h-[136px] sm:w-[136px] lg:h-[156px] lg:w-[156px]",
                    "rounded-full bg-white/85 backdrop-blur-md",
                    "shadow-[0_18px_50px_rgba(0,0,0,0.22)]",
                    "ring-4 ring-emerald-200/70",
                    "active:scale-95 transition",
                    "flex items-center justify-center",
                  ].join(" ")}
                >
                  <span
                    className="tsNextHalo absolute inset-[-22px] rounded-full"
                    style={{
                      background:
                        "radial-gradient(circle, rgba(34,197,94,0.28), rgba(59,130,246,0.18), transparent 62%)",
                    }}
                  />
                  <img
                    src={NEXT_ARROW_SRC}
                    alt="Next"
                    draggable={false}
                    className="tsNextNudge relative h-[62%] w-[62%] object-contain"
                  />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer small info */}
        <div className="mt-2 text-center text-xs font-semibold text-slate-600">
          {isPretrace ? "Warm-up builds control for writing." : "Capital → Small. Lift between strokes."}
        </div>
      </div>
    </div>
  );
}