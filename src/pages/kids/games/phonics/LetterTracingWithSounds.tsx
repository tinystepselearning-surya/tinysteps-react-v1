// src/pages/kids/games/phonics/LetterTracingWithSounds.tsx
// ✅ SAME engine + UI as old LetterTracingGame (single-stroke-at-a-time + lift between strokes)
// ✅ Uses /tracing.mp3 while tracing (loop)
// ✅ Uses /star.png for start/guide/end markers
// ✅ Level 0 = pretrace, Level 1 = ALL letters A–Z (Capital → Small)
// ✅ Dropdown jump + Next button like old game
// ✅ Adds a Sound button to play letter sound (expects /public/games/phonics/a.mp3 ... z.mp3)
// ✅ On letter completion → auto plays letter sound + shows a reward image (best-effort from /public paths)
// ✅ Uses browser-local progress/resume for this game (same-device persistence)

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

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

import { applyKidAndMissionContext, buildMissionReturnHref } from "./missionNavigation";

const BASE_ROUTE = "/kids/games/phonics/letter-tracing-sounds";
const TRACING_SOUNDS_GAME_ID = "letter-tracing-sounds";
const TRACING_SOUNDS_PROGRESS_DOC_ID = "phonics_letter_tracing_sounds";
const PUBLIC_ANON_STORAGE_KEY = "__public_letter_tracing_with_sounds__";

type Mode = "levels" | "play";
type CaseStep = 0 | 1; // 0=Upper, 1=Lower
type Pt = { x: number; y: number; t: number; len: number };

type LevelPairView = { upper?: LetterId; lower?: LetterId };
type TraceLevelView = { levelId: number; title: string; subtitle?: string; pairs?: LevelPairView[] };

/** -------- Resume position helpers (stored in SAME progress doc) -------- */
type LastPos = { level: 0 | 1; pair: number; step: CaseStep };

type ProgressState = {
  status: "idle" | "loading" | "ready";
  mastered: Set<string>;
  lastPos?: LastPos | null;
  updatedAtMs?: number;
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

const STROKE_COLORS = [
  "#2563EB",
  "#EC4899",
  "#22C55E",
  "#F59E0B",
  "#8B5CF6",
  "#14B8A6",
  "#F97316",
  "#06B6D4",
  "#EF4444",
  "#10B981",
  "#A855F7",
  "#F43F5E",
] as const;

const QUICK_COLORS = [
  "#2563EB", // blue
  "#EC4899", // pink
  "#22C55E", // green
  "#F59E0B", // orange
  "#8B5CF6", // purple
] as const;
const RAINBOW_COLORS = ["#EF4444", "#F59E0B", "#EAB308", "#22C55E", "#3B82F6", "#8B5CF6"] as const;
const RAINBOW_MODE = "__rainbow__";

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

function deriveProgressStatus(levelsCompleted: number, totalLevels: number) {
  if (levelsCompleted <= 0) return "getting_started";
  if (totalLevels > 0 && levelsCompleted >= totalLevels) return "completed";
  if (totalLevels > 0 && levelsCompleted / totalLevels >= 0.5) return "progressing";
  return "in_progress";
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

/* --------------------
   Color helpers + modal picker (NEW)
-------------------- */

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = String(hex || "").replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  if (full.length !== 6) return null;
  const n = parseInt(full, 16);
  if (!Number.isFinite(n)) return null;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r: number, g: number, b: number) {
  const rr = clamp(Math.round(r), 0, 255).toString(16).padStart(2, "0");
  const gg = clamp(Math.round(g), 0, 255).toString(16).padStart(2, "0");
  const bb = clamp(Math.round(b), 0, 255).toString(16).padStart(2, "0");
  return `#${rr}${gg}${bb}`.toUpperCase();
}

// HSV: h [0..360), s [0..1], v [0..1]
function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  const rr = clamp(r / 255, 0, 1);
  const gg = clamp(g / 255, 0, 1);
  const bb = clamp(b / 255, 0, 1);

  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === rr) h = ((gg - bb) / d) % 6;
    else if (max === gg) h = (bb - rr) / d + 2;
    else h = (rr - gg) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  const s = max === 0 ? 0 : d / max;
  const v = max;

  return { h, s, v };
}

function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const hh = ((h % 360) + 360) % 360;
  const ss = clamp(s, 0, 1);
  const vv = clamp(v, 0, 1);

  const c = vv * ss;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = vv - c;

  let rp = 0, gp = 0, bp = 0;
  if (hh < 60) [rp, gp, bp] = [c, x, 0];
  else if (hh < 120) [rp, gp, bp] = [x, c, 0];
  else if (hh < 180) [rp, gp, bp] = [0, c, x];
  else if (hh < 240) [rp, gp, bp] = [0, x, c];
  else if (hh < 300) [rp, gp, bp] = [x, 0, c];
  else [rp, gp, bp] = [c, 0, x];

  return {
    r: Math.round((rp + m) * 255),
    g: Math.round((gp + m) * 255),
    b: Math.round((bp + m) * 255),
  };
}

// A bigger kid-friendly palette (used in the modal)
const PALETTE_COLORS = [
  "#2563EB", "#3B82F6", "#60A5FA", "#0EA5E9", "#06B6D4", "#14B8A6", "#10B981", "#22C55E",
  "#84CC16", "#A3E635", "#FDE047", "#FBBF24", "#F59E0B", "#F97316", "#FB7185", "#F43F5E",
  "#EC4899", "#D946EF", "#A855F7", "#8B5CF6", "#6366F1", "#EF4444", "#DC2626", "#7F1D1D",
  "#111827", "#334155", "#64748B", "#94A3B8", "#CBD5E1", "#E2E8F0",
] as const;

type ColorPickerModalProps = {
  open: boolean;
  initialValue: string | null;     // current selectedColor
  onClose: () => void;             // dismiss without applying
  onDone: (color: string) => void; // apply chosen color
};

function resolveTraceColor(selected: string, strokeIdx: number): string {
  if (selected === RAINBOW_MODE) {
    const safeIndex = Number.isFinite(strokeIdx) ? Math.max(0, Math.floor(strokeIdx)) : 0;
    return RAINBOW_COLORS[safeIndex % RAINBOW_COLORS.length];
  }
  return selected;
}

function ColorPickerModal({ open, initialValue, onClose, onDone }: ColorPickerModalProps) {
  const [tab, setTab] = useState<"palette" | "advanced">("palette");
  const [tempColor, setTempColor] = useState<string>(initialValue ?? PALETTE_COLORS[0]);
  const [chosen, setChosen] = useState<boolean>(!!initialValue);

  const svRef = useRef<HTMLDivElement | null>(null);
  const [hsv, setHsv] = useState<{ h: number; s: number; v: number }>(() => {
    const rgb = initialValue ? hexToRgb(initialValue) : hexToRgb(PALETTE_COLORS[0]);
    if (!rgb) return { h: 210, s: 0.7, v: 0.9 };
    return rgbToHsv(rgb.r, rgb.g, rgb.b);
  });

  // Reset each time modal opens
  useEffect(() => {
    if (!open) return;
    setTab("palette");

    const base = initialValue ?? PALETTE_COLORS[0];
    setTempColor(base);
    setChosen(!!initialValue);

    const rgb = hexToRgb(base);
    if (rgb) setHsv(rgbToHsv(rgb.r, rgb.g, rgb.b));
  }, [open, initialValue]);

  // Keep tempColor in sync when HSV changes (advanced tab)
  useEffect(() => {
    if (!open) return;
    if (tab !== "advanced") return;
    const { r, g, b } = hsvToRgb(hsv.h, hsv.s, hsv.v);
    const next = rgbToHex(r, g, b);
    setTempColor(next);
    setChosen(true);
  }, [hsv.h, hsv.s, hsv.v, open, tab]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const rgb = hexToRgb(tempColor) ?? { r: 0, g: 0, b: 0 };

  const setFromRgb = (r: number, g: number, b: number) => {
    const hex = rgbToHex(r, g, b);
    setTempColor(hex);
    setChosen(true);
    setHsv(rgbToHsv(r, g, b));
  };

  const pickFromPalette = (c: string) => {
    setTempColor(c);
    setChosen(true);
    const rr = hexToRgb(c);
    if (rr) setHsv(rgbToHsv(rr.r, rr.g, rr.b));
  };

  const handleSVPointer = (clientX: number, clientY: number) => {
    const el = svRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clamp((clientX - rect.left) / Math.max(1, rect.width), 0, 1);
    const y = clamp((clientY - rect.top) / Math.max(1, rect.height), 0, 1);
    setHsv((p) => ({ ...p, s: x, v: 1 - y }));
  };

  const satX = hsv.s * 100;
  const valY = (1 - hsv.v) * 100;

  return (
    <div className="fixed inset-0 z-[10050] flex items-center justify-center">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close color picker"
        className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-[min(760px,92vw)] rounded-[24px] border bg-white shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="text-sm font-extrabold text-slate-900">Pick a color</div>

          <div className="flex items-center gap-2">
            {tab === "advanced" && (
              <button
                type="button"
                onClick={() => setTab("palette")}
                className="rounded-full border bg-white px-4 py-2 text-xs font-bold hover:bg-slate-50"
              >
                ← Back
              </button>
            )}

            <button
              type="button"
              onClick={() => chosen && onDone(tempColor)}
              disabled={!chosen}
              className={[
                "rounded-full px-4 py-2 text-xs font-extrabold",
                chosen ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-slate-200 text-slate-500 cursor-not-allowed",
              ].join(" ")}
            >
              Done
            </button>
          </div>
        </div>

        <div className="px-5 pb-5">
          {/* Selected row */}
          <div className="mb-4 flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-full border shadow-sm"
              style={{
                backgroundColor: chosen ? tempColor : "#E2E8F0",
                borderColor: "rgba(0,0,0,0.12)",
              }}
            />
            <div className="text-xs font-semibold text-slate-700">
              {chosen ? "Selected" : "Pick a color to start"}
              <div className="text-[11px] font-mono text-slate-500">{chosen ? tempColor : ""}</div>
            </div>
          </div>

          {tab === "palette" ? (
            <>
              {/* Palette grid */}
              <div className="grid grid-cols-8 gap-3 sm:grid-cols-10 md:grid-cols-12">
                {PALETTE_COLORS.map((c) => {
                  const active = chosen && tempColor.toUpperCase() === c.toUpperCase();
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => pickFromPalette(c)}
                      className={[
                        "h-9 w-9 rounded-full border shadow-sm transition active:scale-95",
                        active ? "ring-2 ring-slate-900/20" : "hover:scale-[1.04]",
                      ].join(" ")}
                      style={{
                        backgroundColor: c,
                        borderColor: active ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.12)",
                      }}
                      aria-label={`Select ${c}`}
                      title={c}
                    />
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-[11px] font-semibold text-slate-500">Tip: Kids can pick a fun color each letter ✨</div>

                <button
                  type="button"
                  onClick={() => setTab("advanced")}
                  className="rounded-full border bg-white px-4 py-2 text-xs font-extrabold hover:bg-slate-50"
                >
                  More colors
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Advanced adjustments (Hue + SV + RGB) */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px]">
                <div>
                  {/* SV square */}
                  <div
                    ref={svRef}
                    className="relative h-[220px] w-full rounded-2xl border overflow-hidden touch-none select-none"
                    style={{
                      background: `linear-gradient(to right, #fff, hsl(${hsv.h} 100% 50%))`,
                    }}
                    onPointerDown={(e) => {
                      (e.currentTarget as any).setPointerCapture?.(e.pointerId);
                      handleSVPointer(e.clientX, e.clientY);
                    }}
                    onPointerMove={(e) => {
                      if (e.buttons !== 1) return;
                      handleSVPointer(e.clientX, e.clientY);
                    }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(to top, #000, transparent)" }}
                    />
                    <div
                      className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
                      style={{
                        left: `${satX}%`,
                        top: `${valY}%`,
                        backgroundColor: "transparent",
                      }}
                    />
                  </div>

                  {/* Hue slider */}
                  <div className="mt-4">
                    <div className="mb-2 text-[11px] font-extrabold text-slate-600">Hue</div>
                    <input
                      type="range"
                      min={0}
                      max={360}
                      value={Math.round(hsv.h)}
                      onChange={(e) => setHsv((p) => ({ ...p, h: Number(e.target.value) }))}
                      className="w-full"
                      style={{
                        background:
                          "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
                        borderRadius: 9999,
                        height: 10,
                        appearance: "none",
                      } as any}
                    />
                  </div>
                </div>

                {/* Right side: preview + RGB */}
                <div className="rounded-2xl border bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-12 w-12 rounded-full border shadow-sm"
                      style={{ backgroundColor: tempColor, borderColor: "rgba(0,0,0,0.12)" }}
                    />
                    <div>
                      <div className="text-xs font-extrabold text-slate-900">Custom</div>
                      <div className="text-[11px] font-mono text-slate-600">{tempColor}</div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {(["R", "G", "B"] as const).map((k) => {
                      const v = k === "R" ? rgb.r : k === "G" ? rgb.g : rgb.b;
                      return (
                        <div key={k}>
                          <div className="mb-1 text-[10px] font-extrabold text-slate-600">{k}</div>
                          <input
                            type="number"
                            min={0}
                            max={255}
                            value={v}
                            onChange={(e) => {
                              const n = clamp(Number(e.target.value), 0, 255);
                              const rr = k === "R" ? n : rgb.r;
                              const gg = k === "G" ? n : rgb.g;
                              const bb = k === "B" ? n : rgb.b;
                              setFromRgb(rr, gg, bb);
                            }}
                            className="w-full rounded-xl border bg-white px-2 py-2 text-sm font-bold text-slate-800"
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3">
                    <div className="mb-1 text-[10px] font-extrabold text-slate-600">HEX</div>
                    <input
                      value={tempColor}
                      onChange={(e) => {
                        const v = e.target.value.trim();
                        if (!/^#?[0-9a-fA-F]{0,6}$/.test(v)) return;
                        const withHash = v.startsWith("#") ? v : `#${v}`;
                        setTempColor(withHash.toUpperCase());
                        const rr = hexToRgb(withHash);
                        if (rr && withHash.length === 7) {
                          setChosen(true);
                          setHsv(rgbToHsv(rr.r, rr.g, rr.b));
                        }
                      }}
                      className="w-full rounded-xl border bg-white px-3 py-2 text-sm font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 text-[11px] font-semibold text-slate-500">
                Adjust the square + hue to fine-tune the color.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
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

type TracingLocalState = {
  masteredItems?: string[];
  lastPos?: LastPos | null;
  updatedAtMs?: number;
};

function localStateKey(kidId: string) {
  return `ts_letter_tracing_sounds_state_v1:${kidId}`;
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

function readLocalState(kidId: string): TracingLocalState | null {
  try {
    const raw = localStorage.getItem(localStateKey(kidId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    const updatedAtRaw = Number((parsed as any).updatedAtMs);
    return {
      masteredItems: uniqStrings((parsed as any).masteredItems),
      lastPos: coerceLastPos((parsed as any).lastPos),
      updatedAtMs: Number.isFinite(updatedAtRaw) ? updatedAtRaw : undefined,
    };
  } catch {
    return null;
  }
}

function writeLocalState(kidId: string, data: TracingLocalState) {
  try {
    localStorage.setItem(localStateKey(kidId), JSON.stringify(data));
  } catch {}
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

  for (let lin = 0; lin < startLinear; lin++) {
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
  const start = lastPos?.level === 0 ? lastPos.pair : 0;
  const cappedStart = clamp(start, 0, Math.max(0, PRETRACE_LEVEL.items.length - 1));
  for (let i = cappedStart; i < PRETRACE_LEVEL.items.length; i++) {
    if (!mastered.has(String(PRETRACE_LEVEL.items[i]))) return { pair: i, step: 0 as const };
  }
  for (let i = 0; i < cappedStart; i++) {
    if (!mastered.has(String(PRETRACE_LEVEL.items[i]))) return { pair: i, step: 0 as const };
  }
  return { pair: cappedStart, step: 0 as const };
}

function getResumeStartLevel1(mastered: Set<string>, lastPos: LastPos | null) {
  if (lastPos?.level === 1) {
    return firstIncompleteLetterPos(mastered, lastPos.pair, lastPos.step);
  }
  return firstIncompleteLetterPos(mastered, 0, 0);
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
      const CENTER_COUNT = 120;
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

    const LEFT_RATE = 22;
    const RIGHT_RATE = 22;
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
type LetterTracingWithSoundsProps = {
  baseRoute?: string;
  missionReturnHrefOverride?: string;
  showMissionBackButton?: boolean;
  showProgressControls?: boolean;
  forceAnonymousMode?: boolean;
  anonymousProgressStorageKey?: string;
};

export default function LetterTracingWithSounds({
  baseRoute,
  missionReturnHrefOverride,
  showMissionBackButton = true,
  showProgressControls = true,
  forceAnonymousMode = false,
  anonymousProgressStorageKey = PUBLIC_ANON_STORAGE_KEY,
}: LetterTracingWithSoundsProps = {}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const fsRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  

  const resolvedBaseRoute = baseRoute || BASE_ROUTE;
  const kidId = forceAnonymousMode
    ? ""
    : searchParams.get("kidId") || localStorage.getItem("ts_active_kid_v1") || "";
  const localProgressKey = kidId || (forceAnonymousMode ? anonymousProgressStorageKey : "");
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

  const loadLocalProgress = useCallback(() => {
    if (!localProgressKey) {
      setProgress({ status: "idle", mastered: new Set<string>(), lastPos: null });
      return;
    }

    setProgress((p) => ({ ...p, status: "loading" }));
    const local = readLocalState(localProgressKey);
    const localMastered = uniqStrings(local?.masteredItems);
    setProgress({
      status: "ready",
      mastered: new Set(localMastered),
      lastPos: local?.lastPos ?? null,
      updatedAtMs: local?.updatedAtMs,
    });
  }, [localProgressKey]);

  useEffect(() => {
    if (!localProgressKey) return;
    loadLocalProgress();
  }, [localProgressKey, loadLocalProgress]);

  const persistLocalProgress = useCallback(
    (next: { masteredItems?: string[]; lastPos?: LastPos | null; updatedAtMs?: number }) => {
      if (!localProgressKey) return;
      const prev = readLocalState(localProgressKey) ?? {};
      const mergedMastered = uniqStrings([...(prev.masteredItems ?? []), ...(next.masteredItems ?? [])]);
      const merged: TracingLocalState = {
        masteredItems: mergedMastered,
        lastPos: next.lastPos ?? prev.lastPos ?? null,
        updatedAtMs: next.updatedAtMs ?? prev.updatedAtMs ?? Date.now(),
      };
      writeLocalState(localProgressKey, merged);
      setProgress((curr) => ({
        ...curr,
        status: "ready",
        mastered: new Set(mergedMastered),
        lastPos: merged.lastPos ?? null,
        updatedAtMs: merged.updatedAtMs,
      }));
    },
    [localProgressKey]
  );

  const persistLocalLastPos = useCallback(
    (pos: LastPos) => {
      persistLocalProgress({ lastPos: pos, updatedAtMs: Date.now() });
    },
    [persistLocalProgress]
  );

  useEffect(() => {
    if (mode !== "play") return;
    const levelForPos: 0 | 1 = isPretrace ? 0 : 1;
    persistLocalLastPos({ level: levelForPos, pair: safePairIndex, step });
  }, [mode, isPretrace, safePairIndex, step, persistLocalLastPos]);

  const resetLocalProgress = useCallback(() => {
    if (!localProgressKey) return;
    const ok = window.confirm("Reset Letter Tracing (With Sounds) progress for this child on this device?");
    if (!ok) return;

    try {
      localStorage.removeItem(localStateKey(localProgressKey));
    } catch {
      // ignore localStorage errors
    }

    setProgress({
      status: "ready",
      mastered: new Set<string>(),
      lastPos: null,
      updatedAtMs: Date.now(),
    });
  }, [localProgressKey]);

  type ProgressCounts = {
    preDone: number;
    preTotal: number;
    upperDone: number;
    upperTotal: number;
    lowerDone: number;
    lowerTotal: number;
    resume0: { pair: number; step: 0 };
    resume1: { pair: number; step: CaseStep };
  };

  const progressCounts = useMemo((): ProgressCounts => {
    const mastered = progress.mastered;
    const lastPos = progress.lastPos ?? null;

    const resume0 = getResumeStartLevel0(mastered, lastPos);
    const resume1 = getResumeStartLevel1(mastered, lastPos);

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
      resume1,
    };
  }, [progress.mastered, progress.lastPos, allLetterPairs]);

  const playSessionStartedAtRef = useRef<number | null>(null);

  const syncParentProgress = useCallback(
    (sessionDurationMs = 0) => {
      if (!kidId) return;

      const levelsCompleted = progressCounts.preDone + progressCounts.upperDone + progressCounts.lowerDone;
      const totalLevels = progressCounts.preTotal + progressCounts.upperTotal + progressCounts.lowerTotal;
      const progressStatus = deriveProgressStatus(levelsCompleted, totalLevels);
      const durationMs = Math.max(0, Math.floor(sessionDurationMs));

      void (async () => {
        try {
          const { doc, getFirestore, increment, serverTimestamp, setDoc } = await import("firebase/firestore");
          const db = getFirestore();
          const ref = doc(db, "kids", kidId, "gameProgress", TRACING_SOUNDS_PROGRESS_DOC_ID);
          const payload: Record<string, unknown> = {
            gameId: TRACING_SOUNDS_GAME_ID,
            title: "Letter Tracing + Sounds",
            areaPractised: "Letter formation with sound support",
            expertiseArea: "phonics",
            started: true,
            levelsCompleted,
            totalLevels,
            progressStatus,
            lastPlayedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          if (durationMs > 0) payload.totalTimeSpentMs = increment(durationMs);
          await setDoc(ref, payload, { merge: true });
        } catch {
          // Non-blocking parent summary sync
        }
      })();
    },
    [
      kidId,
      progressCounts.lowerDone,
      progressCounts.lowerTotal,
      progressCounts.preDone,
      progressCounts.preTotal,
      progressCounts.upperDone,
      progressCounts.upperTotal,
    ]
  );

  useEffect(() => {
    if (mode === "play") {
      if (playSessionStartedAtRef.current === null) playSessionStartedAtRef.current = Date.now();
      return;
    }
    if (playSessionStartedAtRef.current === null) return;
    const elapsed = Date.now() - playSessionStartedAtRef.current;
    playSessionStartedAtRef.current = null;
    syncParentProgress(elapsed);
  }, [mode, syncParentProgress]);

  useEffect(() => {
    return () => {
      if (playSessionStartedAtRef.current === null) return;
      const elapsed = Date.now() - playSessionStartedAtRef.current;
      playSessionStartedAtRef.current = null;
      syncParentProgress(elapsed);
    };
  }, [syncParentProgress]);

  /* --------------------
     Engine state
  -------------------- */
  const [strokeIndex, setStrokeIndex] = useState(0);

  // ✅ Auto-select a kid-safe default so tracing never feels "blocked"
  const DEFAULT_TRACE_COLOR = QUICK_COLORS[0];
  const [selectedColor, setSelectedColor] = useState<string>(DEFAULT_TRACE_COLOR);
  const [colorModalOpen, setColorModalOpen] = useState(false);
  const [showLevel1Preview, setShowLevel1Preview] = useState(true);

  const effectiveColor = resolveTraceColor(selectedColor, strokeIndex); // always available
  const canTrace = true; // kept for minimal diffs; always true now

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

  type ScaffoldLevel = 0 | 1 | 2 | 3;

  // Miss tracking (per-stroke)
  const [startMisses, setStartMisses] = useState(0);
  const startMissesRef = useRef(0);

  const [offPathNudges, setOffPathNudges] = useState(0);
  const offPathNudgesRef = useRef(0);

  const [startNudgeToken, setStartNudgeToken] = useState(0);

  // Scaffold (max used during this letter)
  const [scaffoldLevel, setScaffoldLevel] = useState<ScaffoldLevel>(0);
  const scaffoldMaxRef = useRef<ScaffoldLevel>(0);

  const lastOffPathNudgeAtRef = useRef(0);
  const wideTolUntilRef = useRef(0);

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

  const bumpScaffold = useCallback((lvl: ScaffoldLevel) => {
    setScaffoldLevel((prev) => (Math.max(prev, lvl) as ScaffoldLevel));
    scaffoldMaxRef.current = Math.max(scaffoldMaxRef.current, lvl) as ScaffoldLevel;
  }, []);

  const nudgeStart = useCallback(() => {
    setStartNudgeToken((n) => n + 1);
    try {
      // Optional micro-haptic on supported devices (won't crash if unavailable)
      (navigator as any)?.vibrate?.(10);
    } catch {}
  }, []);

  const triggerConfetti = useCallback(() => {
    setConfetti(true);
    void playConfettiSound();
    timersRef.current.confettiOff = window.setTimeout(() => setConfetti(false), 2200);
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

  const currentColor = effectiveColor;
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

    setStartMisses(0);
    startMissesRef.current = 0;

    setOffPathNudges(0);
    offPathNudgesRef.current = 0;

    setStartNudgeToken(0);

    setScaffoldLevel(0);
    scaffoldMaxRef.current = 0;

    wideTolUntilRef.current = 0;
    lastOffPathNudgeAtRef.current = 0;
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

    setStartMisses(0);
    startMissesRef.current = 0;

    setOffPathNudges(0);
    offPathNudgesRef.current = 0;

    setStartNudgeToken(0);

    setScaffoldLevel(0);
    scaffoldMaxRef.current = 0;

    wideTolUntilRef.current = 0;
    lastOffPathNudgeAtRef.current = 0;
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
  }, [currentStroke, currentStroke?.pathD, currentStroke?.kind, strokeStartT, strokeEndT]);

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
  }, [letterDone, currentStroke, currentStroke?.id, currentStroke?.kind, currentStroke?.pathD, samples.length, started, lastIndex]);

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
    const url = query ? `${resolvedBaseRoute}?${query}` : resolvedBaseRoute;
    navigate(url, { replace });
  }

  const missionReturnHref = missionReturnHrefOverride ?? buildMissionReturnHref(searchParams, kidId);

  function goGamesPortal() {
    navigate(missionReturnHref, { replace: true });
  }

  // ✅ Preserve immersive if already ON
  function navigatePlay(levelNum: number, pairIdx: number, stepNum: CaseStep, replace = false) {
    const sp = new URLSearchParams();
    applyKidAndMissionContext(sp, searchParams, kidId);

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
    applyKidAndMissionContext(sp, searchParams, kidId);

    const level = levelNum === 0 ? 0 : 1;
    const maxPair = level === 0 ? Math.max(0, PRETRACE_LEVEL.items.length - 1) : Math.max(0, allLetterPairs.length - 1);
    const safePair = clamp(Number(pairIdx) || 0, 0, maxPair);
    const safeStep: CaseStep = stepNum === 1 ? 1 : 0;

    sp.set("level", String(level));
    sp.set("pair", String(safePair));
    sp.set("step", String(safeStep));

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
    applyKidAndMissionContext(sp, searchParams, kidId);

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
      const masteredItem = isPretrace ? pretraceId ?? "" : currentLetterId ?? "";
      const completedAtMs = Date.now();

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

      persistLocalProgress({
        masteredItems: masteredItem ? [masteredItem] : [],
        lastPos: nextPos,
        updatedAtMs: completedAtMs,
      });
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
    pretraceId,
    currentLetterId,
    step,
    safePairIndex,
    enabledPairs.length,
    persistLocalProgress,
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

    // Start becomes easier after misses (prevents "nothing happens" frustration)
    const baseStartRadius = 16;
    const baseResumeRadius = 22;

    const hasProgress = lastIndexRef.current > 0 && samples.length > 0;
    const resumePt = hasProgress ? samples[clamp(lastIndexRef.current, 0, samples.length - 1)] : startPt;

    // escalate radius after misses
    const sm = startMissesRef.current;
    const radiusBoost = sm >= 2 ? 12 : sm === 1 ? 6 : 0;
    const allowedR = (hasProgress ? baseResumeRadius : baseStartRadius) + radiusBoost;

    if (dist(p, resumePt) > allowedR) {
      // count start miss + nudge
      const next = startMissesRef.current + 1;
      startMissesRef.current = next;
      setStartMisses(next);

      // scaffold ladder: 1=highlight, 2=widen (already), 3=ghost demo
      if (next === 2) bumpScaffold(2);
      if (next >= 3) bumpScaffold(3);

      nudgeStart();
      return;
    }

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

    const now = performance.now();

    // widen tolerance temporarily if we've nudged recently
    const baseTol = 12;
    const extraTol =
      now < wideTolUntilRef.current ? 10 :
      offPathNudgesRef.current >= 2 ? 6 :
      offPathNudgesRef.current === 1 ? 3 : 0;

    const tolerance = baseTol + extraTol;

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

    if (bestD > tolerance) {
      // throttle nudges so we don't spam every move event
      if (now - lastOffPathNudgeAtRef.current > 450) {
        lastOffPathNudgeAtRef.current = now;

        const next = offPathNudgesRef.current + 1;
        offPathNudgesRef.current = next;
        setOffPathNudges(next);

        if (next === 1) bumpScaffold(1);
        if (next >= 2) bumpScaffold(2);
        if (next >= 3) {
          bumpScaffold(3);
          // widen for 1.5s to help recover
          wideTolUntilRef.current = now + 1500;
        }
      }
      return;
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
    // ✅ Show ONLY Level 1 (A–Z) here (Level 0 is rendered separately)
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
      .slice(0, 4);

    const preTotal = progressCounts.preTotal;
    const preDone = progressCounts.preDone;
    const upperTotal = progressCounts.upperTotal;
    const upperDone = progressCounts.upperDone;
    const lowerTotal = progressCounts.lowerTotal;
    const lowerDone = progressCounts.lowerDone;
    const letterTotal = upperTotal + lowerTotal;
    const letterDoneCount = upperDone + lowerDone;
    const letterPct = letterTotal > 0 ? Math.round((letterDoneCount / letterTotal) * 100) : 0;
    const warmupPct = preTotal > 0 ? Math.round((preDone / preTotal) * 100) : 0;

    const updatedLabel =
      progress.updatedAtMs && Number.isFinite(progress.updatedAtMs)
        ? new Date(progress.updatedAtMs).toLocaleString()
        : undefined;

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
      <div className="mx-auto w-full max-w-6xl px-3 py-3 lg:h-[calc(100dvh-1.5rem)] lg:overflow-hidden">
        <div className="relative overflow-hidden rounded-[24px] border bg-white/60 p-4 shadow-sm backdrop-blur lg:h-full">
          <div className="pointer-events-none absolute -top-24 left-[-8%] h-64 w-64 rounded-full bg-sky-200/45 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-[-8%] h-64 w-64 rounded-full bg-pink-200/45 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.22),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(244,114,182,0.18),transparent_45%),radial-gradient(circle_at_45%_85%,rgba(34,197,94,0.10),transparent_45%)]" />

          <div className="relative flex h-full flex-col">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                  Letter Tracing Adventure (With Sounds)
                </h1>

                <p className="mt-1 max-w-2xl text-sm text-slate-700">
                  Start with warm-up shapes → then trace <span className="font-semibold">Capital</span> and{" "}
                  <span className="font-semibold">Small</span> letters with sound feedback.
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/75 px-3 py-1 text-xs font-extrabold text-slate-800 ring-1 ring-white/60">
                    🎯 Letters: {letterDoneCount}/{letterTotal} ({letterPct}%)
                  </span>
                  <span className="rounded-full bg-white/75 px-3 py-1 text-xs font-extrabold text-slate-800 ring-1 ring-white/60">
                    🔠 Capital: {upperDone}/{upperTotal}
                  </span>
                  <span className="rounded-full bg-white/75 px-3 py-1 text-xs font-extrabold text-slate-800 ring-1 ring-white/60">
                    🔡 Small: {lowerDone}/{lowerTotal}
                  </span>
                  <span className="rounded-full bg-white/75 px-3 py-1 text-xs font-extrabold text-slate-800 ring-1 ring-white/60">
                    ✍️ Warm-up: {preDone}/{preTotal} ({warmupPct}%)
                  </span>
                  <span className="rounded-full bg-white/75 px-3 py-1 text-xs font-extrabold text-slate-800 ring-1 ring-white/60">
                    🔊 Sounds enabled
                  </span>
                  {updatedLabel && (
                    <span className="rounded-full bg-white/75 px-3 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-white/60">
                      Updated: {updatedLabel}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center flex-wrap gap-2">
                {showMissionBackButton ? (
                  <button
                    onClick={goGamesPortal}
                    className="rounded-full border bg-white/80 px-4 py-2 text-sm font-semibold shadow-sm hover:shadow-md"
                  >
                    ← Back to Mission
                  </button>
                ) : null}

                {showProgressControls ? (
                  <>
                    <button
                      onClick={() => void loadLocalProgress()}
                      disabled={!localProgressKey || progress.status === "loading"}
                      className={[
                        "rounded-full border bg-white/80 px-4 py-2 text-sm font-semibold shadow-sm hover:shadow-md",
                        !localProgressKey || progress.status === "loading" ? "opacity-60 cursor-not-allowed" : "",
                      ].join(" ")}
                    >
                      {progress.status === "loading" ? "Refreshing…" : "Refresh progress"}
                    </button>

                    <button
                      onClick={resetLocalProgress}
                      disabled={!localProgressKey}
                      className={[
                        "rounded-full border border-rose-200 bg-rose-50/90 px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm hover:shadow-md",
                        !localProgressKey ? "opacity-60 cursor-not-allowed" : "",
                      ].join(" ")}
                    >
                      Reset Progress
                    </button>
                  </>
                ) : null}
              </div>
            </div>

            <div className="mt-3 grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-3">
              <div className="min-h-0 lg:col-span-2">
                <div className="rounded-2xl border border-white/60 bg-white/65 p-3 shadow-sm backdrop-blur lg:h-full lg:overflow-auto">
                  <div className="space-y-3">
                    {/* Level 0 */}
                    <button
                      onClick={() =>
                        void handlePlayButtonClick(0, progressCounts.resume0.pair, progressCounts.resume0.step)
                      }
                      className={[
                        "group w-full rounded-2xl border border-white/60 bg-gradient-to-r from-white/85 to-sky-50/60 p-3 text-left shadow-sm transition",
                        "hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-base font-extrabold text-slate-900">🚀 {PRETRACE_LEVEL.title}</div>
                          <div className="mt-0.5 text-xs font-semibold text-slate-600">{PRETRACE_LEVEL.subtitle}</div>
                        </div>

                        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-700 ring-1 ring-emerald-100">
                          Ready • {preDone}/{preTotal}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {pretraceChips.map((c, i) => {
                          const done = mastered.has(String(c.id));
                          return (
                            <span
                              key={`${c.label}-${i}`}
                              className={[
                                "rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1",
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
                        <span className="rounded-full bg-slate-900/90 px-2.5 py-1 text-[11px] font-semibold text-white">
                          {PRETRACE_LEVEL.items.length} activities
                        </span>
                      </div>

                      <div className="mt-2">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/60">
                          <div
                            className="h-full rounded-full bg-emerald-500/70"
                            style={{ width: `${preTotal > 0 ? Math.round((preDone / preTotal) * 100) : 0}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <div className="text-xs font-semibold text-slate-600">Start here to warm up hand control ✨</div>
                        <div className="text-sm font-black text-slate-900/50 transition group-hover:translate-x-1">Start →</div>
                      </div>
                    </button>

                    {/* Level 1 */}
                    {LEVELS.map((lv) => {
                      const ready = true;
                      const lp = levelProgress(lv);

                      const upperLetters = (lv.pairs ?? [])
                        .map((p) => (p?.upper ? String(p.upper) : null))
                        .filter(Boolean) as string[];

                      const lowerLetters = (lv.pairs ?? [])
                        .map((p) => (p?.lower ? String(p.lower) : null))
                        .filter(Boolean) as string[];

                      const upperDoneLv = upperLetters.filter((ch) => mastered.has(ch)).length;
                      const lowerDoneLv = lowerLetters.filter((ch) => mastered.has(ch)).length;

                      return (
                        <div
                          key={lv.levelId}
                          className={[
                            "group w-full rounded-2xl border p-3 text-left shadow-sm transition backdrop-blur",
                            ready
                              ? "border-white/60 bg-gradient-to-r from-white/85 to-pink-50/60 hover:-translate-y-0.5 hover:shadow-lg"
                              : "border-white/40 bg-white/50 opacity-60",
                          ].join(" ")}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-base font-extrabold text-slate-900">
                                {ready ? "⭐" : "🔒"} {lv.title}
                              </div>
                              {lv.subtitle && (
                                <div className="mt-0.5 text-xs font-semibold text-slate-600">{lv.subtitle}</div>
                              )}
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-700 ring-1 ring-emerald-100">
                                Ready • {lp.done}/{lp.total}
                              </span>

                              <button
                                type="button"
                                disabled={!ready}
                                onClick={() =>
                                  void handlePlayButtonClick(lv.levelId, progressCounts.resume1.pair, progressCounts.resume1.step)
                                }
                                className={[
                                  "rounded-full px-5 py-2.5 text-sm font-extrabold shadow-sm transition",
                                  ready
                                    ? "bg-slate-900 text-white hover:bg-slate-800"
                                    : "cursor-not-allowed bg-slate-400 text-white",
                                ].join(" ")}
                              >
                                Start →
                              </button>
                            </div>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-white/70">
                              🔠 Capital {upperDoneLv}/{upperLetters.length}
                            </span>
                            <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-white/70">
                              🔡 Small {lowerDoneLv}/{lowerLetters.length}
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowLevel1Preview((v) => !v)}
                              className="rounded-full border bg-white/80 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm hover:bg-white"
                            >
                              {showLevel1Preview ? "Hide letters preview" : "Preview letters"}
                            </button>
                          </div>

                          {lp.total > 0 && (
                            <div className="mt-2">
                              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/60">
                                <div className="h-full rounded-full bg-emerald-500/70" style={{ width: `${lp.pct}%` }} />
                              </div>
                            </div>
                          )}

                          {showLevel1Preview && (
                            <div className="mt-2 space-y-2 rounded-xl border border-white/60 bg-white/60 p-2.5">
                              <div className="text-[11px] font-semibold text-slate-600">
                                Tap any letter to practice directly
                              </div>
                              <div>
                                <div className="text-[11px] font-extrabold text-slate-600">🔠 Capital letters</div>
                                <div
                                  className="mt-1 grid gap-1.5"
                                  style={{ gridTemplateColumns: "repeat(auto-fit, minmax(26px, 1fr))" }}
                                >
                                  {upperLetters.map((ch, pairIdx) => {
                                    const done = mastered.has(ch);
                                    return (
                                      <button
                                        key={`U-${ch}`}
                                        type="button"
                                        onClick={() => navigatePlay(1, pairIdx, 0, false)}
                                        title={`Trace capital ${ch}`}
                                        className={[
                                          "relative flex h-8 items-center justify-center rounded-lg text-xs font-extrabold ring-1 transition",
                                          "cursor-pointer hover:-translate-y-0.5 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300",
                                          done
                                            ? "bg-gradient-to-b from-emerald-300 to-emerald-400 text-emerald-950 ring-emerald-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]"
                                            : "bg-white/80 text-slate-700 ring-white/70",
                                        ].join(" ")}
                                      >
                                        {ch}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              <div>
                                <div className="text-[11px] font-extrabold text-slate-600">🔡 Small letters</div>
                                <div
                                  className="mt-1 grid gap-1.5"
                                  style={{ gridTemplateColumns: "repeat(auto-fit, minmax(26px, 1fr))" }}
                                >
                                  {lowerLetters.map((ch, pairIdx) => {
                                    const done = mastered.has(ch);
                                    return (
                                      <button
                                        key={`L-${ch}`}
                                        type="button"
                                        onClick={() => navigatePlay(1, pairIdx, 1, false)}
                                        title={`Trace small ${ch}`}
                                        className={[
                                          "relative flex h-8 items-center justify-center rounded-lg text-xs font-extrabold ring-1 transition",
                                          "cursor-pointer hover:-translate-y-0.5 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300",
                                          done
                                            ? "bg-gradient-to-b from-emerald-300 to-emerald-400 text-emerald-950 ring-emerald-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]"
                                            : "bg-white/80 text-slate-700 ring-white/70",
                                        ].join(" ")}
                                      >
                                        {ch}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="mt-2 text-xs font-semibold text-slate-600">
                            Capital then small letter, one pair at a time.
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="h-full rounded-2xl border border-white/60 bg-white/65 p-4 shadow-sm backdrop-blur">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-extrabold text-slate-900">How to play</div>
                    <div className="text-xs font-semibold text-slate-600">Quick tips</div>
                  </div>

                  <ol className="mt-3 space-y-2.5 text-sm text-slate-700">
                    <li className="flex gap-3">
                      <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-sky-700 font-extrabold">
                        1
                      </span>
                      <div>
                        <div className="font-bold text-slate-900">Warm-up first</div>
                        <div className="text-slate-600">Lines & curves make handwriting easy.</div>
                      </div>
                    </li>

                    <li className="flex gap-3">
                      <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-pink-100 text-pink-700 font-extrabold">
                        2
                      </span>
                      <div>
                        <div className="font-bold text-slate-900">Capital → Small</div>
                        <div className="text-slate-600">Trace big letter, then small letter.</div>
                      </div>
                    </li>

                    <li className="flex gap-3">
                      <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-extrabold">
                        3
                      </span>
                      <div>
                        <div className="font-bold text-slate-900">Listen and repeat</div>
                        <div className="text-slate-600">Letter sound plays on completion (and via 🔊).</div>
                      </div>
                    </li>
                  </ol>

                  <div className="mt-3 rounded-2xl bg-slate-900/90 p-3 text-white">
                    <div className="text-sm font-extrabold">Pro tip</div>
                    <p className="mt-1 text-sm text-white/80">
                      Start at the ⭐ star and lift your finger between strokes for cleaner letters.
                    </p>
                  </div>
                </div>
              </div>
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

      <ColorPickerModal
        open={colorModalOpen}
        initialValue={selectedColor}
        onClose={() => setColorModalOpen(false)}
        onDone={(c) => {
          setSelectedColor(c);
          setColorModalOpen(false);
        }}
      />

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

            {/* 🎨 Color picker (5 quick + More) */}
            <div className="flex items-center gap-2 rounded-full border bg-white px-3 py-2">
              <span className="text-xs sm:text-sm font-semibold text-slate-700">
                Color
              </span>

              <div className="flex items-center gap-1.5 flex-wrap max-w-[260px]">
                {QUICK_COLORS.map((c) => {
                  const active = selectedColor === c;
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

                {(() => {
                  const active = selectedColor === RAINBOW_MODE;
                  return (
                    <button
                      type="button"
                      onClick={() => setSelectedColor(RAINBOW_MODE)}
                      className={[
                        "h-7 w-7 rounded-full border",
                        "shadow-sm transition active:scale-95",
                        active ? "ring-2 ring-slate-900/20" : "hover:scale-[1.04]",
                      ].join(" ")}
                      style={{
                        background: "linear-gradient(135deg,#ef4444,#f59e0b,#eab308,#22c55e,#3b82f6,#8b5cf6)",
                        borderColor: active ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.12)",
                      }}
                      aria-label="Select rainbow color"
                      title="Rainbow"
                    />
                  );
                })()}

                {/* More (opens center modal) */}
                <button
                  type="button"
                  onClick={() => setColorModalOpen(true)}
                  className={[
                    "h-7 rounded-full border px-3 text-xs font-bold",
                    "bg-white shadow-sm transition active:scale-95 hover:bg-slate-50",
                    selectedColor && !(QUICK_COLORS as readonly string[]).includes(selectedColor)
                      ? "ring-2 ring-slate-900/20"
                      : "",
                  ].join(" ")}
                  title="More colors"
                >
                  More
                </button>
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

            <button
              onClick={() => void goLevels()}
              className="rounded-full border bg-white px-4 py-2 text-xs sm:text-sm font-semibold"
            >
              Exit
            </button>

            <button
              onClick={() => void setFs(!fs)}
              className="rounded-full border bg-white px-4 py-2 text-xs sm:text-sm font-semibold"
            >
              {fs ? "Windowed" : "Fullscreen"}
            </button>

            <button
              onClick={() => void goLevels()}
              className="rounded-full border bg-white px-4 py-2 text-xs sm:text-sm font-semibold"
            >
              Levels
            </button>
          </div>
        </div>

        {/* Main board */}
        <div
          className={`relative overflow-hidden rounded-2xl border shadow-sm flex flex-col ${fs ? "flex-1 min-h-0" : ""}`}
          style={{
            background: `radial-gradient(circle at 50% 50%, ${hexToRgba(effectiveColor, 0.08)}, transparent 60%), radial-gradient(circle at 20% 20%, rgba(56,189,248,0.18), transparent 55%), radial-gradient(circle at 80% 30%, rgba(244,114,182,0.16), transparent 55%), radial-gradient(circle at 45% 85%, rgba(34,197,94,0.10), transparent 55%), linear-gradient(135deg, #f8fbff 0%, #fff7fb 45%, #fffdf7 100%)`,
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
                    stroke={hexToRgba(c, 0.14)}
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
                  return (
                    <circle
                      key={`done-tap-${s.id ?? i}`}
                      cx={p.x}
                      cy={p.y}
                      r={7}
                      fill={hexToRgba(currentColor, 0.75)}
                      pointerEvents="none"
                    />
                  );
                }
                const d = (s.pathD ?? "").trim();
                if (!d) return null;
                return (
                  <path
                    key={`done-${s.id ?? i}`}
                    d={d}
                    fill="none"
                    stroke={hexToRgba(currentColor, 0.78)}
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
