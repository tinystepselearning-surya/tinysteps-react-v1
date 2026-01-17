import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

/**
 * Tiny Steps — Game 3: CVC Word Reader (Level 1)
 * Updates requested:
 * ✅ Do NOT allow wrong letter to be placed in a slot (reject drop + shake slot)
 * ✅ Each slot has a tap 🔊 button to hear the correct sound for that slot
 * ✅ Add buttons: Back to Levels, Reset
 */

type SlotKey = "first" | "middle" | "last";

type CVCItem = {
  id: string;
  word: string; // "cat"
  phonemes: [string, string, string]; // ["c","a","t"]
  imageUrl: string;
  audioSlowUrl: string; // "c...a...t...cat"
  // Optional per-slot audio files (recommended). If missing, we fallback to TTS.
  phonemeAudioUrls?: Partial<Record<SlotKey, string>>;
  distractors?: string[];
};

const GAME_ID = "cvc_word_reader_v1";
const PROGRESS_DOC_ID = "phonics_cvc_word_reader";

// Demo Level 1 (replace assets later)
const DEMO_LEVEL_1: CVCItem[] = [
  {
    id: "cat",
    word: "cat",
    phonemes: ["c", "a", "t"],
    imageUrl: "/games/phonics/cvc/images/cat.png",
    audioSlowUrl: "/games/phonics/cvc/audio/cat-slow.mp3",
    phonemeAudioUrls: {
      first: "/games/phonics/cvc/audio/c.mp3",
      middle: "/games/phonics/cvc/audio/a.mp3",
      last: "/games/phonics/cvc/audio/t.mp3",
    },
    distractors: ["m", "s"],
  },
];

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function ConfettiBurst({ fire }: { fire: boolean }) {
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
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.8) * 12,
      g: 0.22 + Math.random() * 0.22,
      r: 2 + Math.random() * 3,
      a: 1,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      hue: Math.floor(Math.random() * 360),
    }));

    const start = performance.now();
    const dur = 1100;

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
  }, [fire]);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" style={{ width: "100%", height: "100%" }} />;
}

export default function CvcWordReaderGame() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const kidId = searchParams.get("kidId") || localStorage.getItem("ts_active_kid_v1") || "";

  // Simple game mode
  type Mode = "levels" | "play";
  const [mode, setMode] = useState<Mode>("play"); // you can set default "levels" if you want

  // Level content
  const [index, setIndex] = useState(0);
  const item = DEMO_LEVEL_1[clamp(index, 0, DEMO_LEVEL_1.length - 1)];

  // Slots
  const [slots, setSlots] = useState<{ first: string | null; middle: string | null; last: string | null }>({
    first: null,
    middle: null,
    last: null,
  });

  const [prompt, setPrompt] = useState<string>("Tap the speaker to listen.");
  const [phase, setPhase] = useState<SlotKey | "ready" | "success">("first");

  // Feedback
  const [shake, setShake] = useState<{ first: boolean; middle: boolean; last: boolean }>({
    first: false,
    middle: false,
    last: false,
  });
  const [confetti, setConfetti] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  // Audio
  const audioSlowRef = useRef<HTMLAudioElement | null>(null);
  const audioPhonemeRef = useRef<HTMLAudioElement | null>(null);

  // Dragging
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const dragOffsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  const bubbles = useMemo(() => {
    const correct = Array.from(new Set(item.phonemes));
    const distractors = item.distractors ?? [];
    return [...correct, ...distractors].slice(0, 6);
  }, [item]);

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

  function resetRound() {
    setSlots({ first: null, middle: null, last: null });
    setShake({ first: false, middle: false, last: false });
    setConfetti(false);
    setCelebrate(false);
    setPhase("first");
    setPrompt("Tap the speaker to listen.");
    setDraggingId(null);
    setDragPos(null);
  }

  useEffect(() => {
    resetRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  function goBackToHub() {
    navigate("/kids/games/phonics" + (kidId ? `?kidId=${encodeURIComponent(kidId)}` : ""));
  }

  async function playSlowAudio() {
    const el = audioSlowRef.current;
    if (el) {
      try {
        el.currentTime = 0;
        await el.play();
      } catch {
        speak(`${item.phonemes[0]}... ${item.phonemes[1]}... ${item.phonemes[2]}... ${item.word}`);
      }
    } else {
      speak(`${item.phonemes[0]}... ${item.phonemes[1]}... ${item.phonemes[2]}... ${item.word}`);
    }

    setPhase("first");
    setPrompt("Find the first sound.");
  }

  function expectedFor(slotKey: SlotKey): string {
    if (slotKey === "first") return item.phonemes[0];
    if (slotKey === "middle") return item.phonemes[1];
    return item.phonemes[2];
  }

  function nextExpectedSlot(): SlotKey {
    if (!slots.first) return "first";
    if (!slots.middle) return "middle";
    return "last";
  }

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

  async function playPhoneme(slotKey: SlotKey) {
    const url = item.phonemeAudioUrls?.[slotKey];

    if (url) {
      try {
        if (!audioPhonemeRef.current) audioPhonemeRef.current = new Audio(url);
        else audioPhonemeRef.current.src = url;

        audioPhonemeRef.current.currentTime = 0;
        await audioPhonemeRef.current.play();
        return;
      } catch {
        // fallback to TTS below
      }
    }

    // TTS fallback
    const ph = expectedFor(slotKey);
    speak(`/${ph}/`);
  }

  function dropToSlot(slotKey: SlotKey, letter: string) {
    // Enforce order: must drop into the active/expected slot only
    const expectedSlot = nextExpectedSlot();
    if (slotKey !== expectedSlot) {
      setPrompt(
        expectedSlot === "first" ? "First sound first." : expectedSlot === "middle" ? "Now the middle sound." : "Now the last sound."
      );
      fireShake([slotKey]);
      return;
    }

    // ✅ Reject wrong letter: do NOT place it
    const correctLetter = expectedFor(slotKey);
    if (letter !== correctLetter) {
      fireShake([slotKey]);
      setPrompt(`Oops! Try again. Tap 🔊 in box ${slotKey === "first" ? "1" : slotKey === "middle" ? "2" : "3"} to listen.`);
      // Optional: auto-play correct sound to guide
      playPhoneme(slotKey);
      return;
    }

    // Place correct letter
    setSlots((prev) => ({ ...prev, [slotKey]: letter }));

    // Advance prompt/phase
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

    // last placed
    setPhase("ready");
    setPrompt("Great! Tap Check.");
  }

  function onCheck() {
    // With wrong letters blocked, check is basically a confirm.
    if (!(slots.first && slots.middle && slots.last)) {
      setPrompt("Fill all 3 boxes first.");
      return;
    }

    setPhase("success");
    setCelebrate(true);
    setConfetti(true);
    setPrompt(`Yay! First /${item.phonemes[0]}/, middle /${item.phonemes[1]}/, last /${item.phonemes[2]}/!`);
    setTimeout(() => setConfetti(false), 1100);

    // TODO: recordLevelResult like other games later
    // recordLevelResult({ gameId: GAME_ID, progressDocId: PROGRESS_DOC_ID, kidId, levelId: 1, ... })

    setTimeout(() => {
      setCelebrate(false);
      if (index < DEMO_LEVEL_1.length - 1) setIndex((i) => i + 1);
      else setIndex(0);
    }, 1400);
  }

  function onPointerDownBubble(e: React.PointerEvent, id: string) {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    dragOffsetRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
    setDraggingId(id);
    setDragPos({ x: rect.left, y: rect.top });
    (e.currentTarget as any).setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!draggingId || !dragPos) return;
    e.preventDefault();
    const { dx, dy } = dragOffsetRef.current;
    setDragPos({ x: e.clientX - dx, y: e.clientY - dy });
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!draggingId) return;
    e.preventDefault();

    const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    const slot = el?.closest?.("[data-slot]") as HTMLElement | null;
    const slotKey = (slot?.getAttribute("data-slot") as SlotKey | null) ?? null;

    const letter = draggingId;

    setDraggingId(null);
    setDragPos(null);

    if (slotKey) dropToSlot(slotKey, letter);
  }

  const slotBadge = (n: number, color: string) => (
    <div className="absolute -top-3 -left-3 h-9 w-9 rounded-full grid place-items-center text-white font-extrabold shadow" style={{ background: color }}>
      {n}
    </div>
  );

  const slotClass = (key: SlotKey) => {
    const base = "relative flex items-center justify-center rounded-2xl border-2 border-dashed bg-white/70 shadow-sm h-[110px] md:h-[140px]";
    const shakeClass = shake[key] ? "ts-shake" : "";
    const highlight = phase === key ? "ring-4 ring-blue-300 border-blue-300 bg-white" : "border-amber-200";
    return `${base} ${highlight} ${shakeClass}`;
  };

  const bubbleStyle =
    "select-none cursor-grab active:cursor-grabbing rounded-full shadow-md border-2 border-white grid place-items-center text-white font-extrabold text-3xl w-[88px] h-[88px] md:w-[96px] md:h-[96px]";

  const bubbleBg = (letter: string) => {
    const map: Record<string, string> = {
      a: "bg-red-500",
      c: "bg-orange-500",
      t: "bg-blue-500",
      m: "bg-emerald-500",
      s: "bg-purple-500",
      i: "bg-yellow-500",
      p: "bg-pink-500",
      n: "bg-slate-500",
    };
    return map[letter] ?? "bg-sky-500";
  };

  // --------------------
  // Levels Screen (minimal)
  // --------------------
  if (mode === "levels") {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="flex items-center justify-between">
          <div className="text-xl font-semibold text-slate-900">3. CVC Word Reader</div>
          <button onClick={goBackToHub} className="rounded-full border bg-white px-4 py-2 text-sm font-semibold">
            ← Back to Games Hub
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <button
            onClick={() => {
              setIndex(0);
              resetRound();
              setMode("play");
            }}
            className="rounded-xl border bg-white p-5 text-left shadow-sm transition hover:shadow-md hover:border-slate-300"
          >
            <div className="text-lg font-semibold text-slate-900">Level 1 — First/Middle/Last</div>
            <div className="mt-1 text-sm text-slate-600">Listen and build a CVC word using 3 sounds.</div>
            <div className="mt-4 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Play</div>
          </button>
        </div>
      </div>
    );
  }

  // --------------------
  // Play Screen
  // --------------------
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <style>{`
        @keyframes tsShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .ts-shake { animation: tsShake 0.36s ease-in-out; }
      `}</style>

      <div className="flex items-center justify-between">
        <div className="text-lg font-bold text-white/90">3. CVC Word Reader</div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode("levels")}
            className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
          >
            ← Back to Levels
          </button>

          <button
            onClick={resetRound}
            className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
          >
            ↻ Reset
          </button>

          <button
            onClick={goBackToHub}
            className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
          >
            ↩ Games Hub
          </button>
        </div>
      </div>

      <div className="relative mt-4 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-sky-100 to-emerald-100 shadow-xl">
        <ConfettiBurst fire={confetti} />

        <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.85),rgba(255,255,255,0.35))]" />

          {/* Top-left picture + speaker */}
          <div className="absolute left-6 top-6 flex items-center gap-4">
            <div className="relative h-[140px] w-[180px] overflow-hidden rounded-2xl bg-white shadow-lg border">
              <img
                src={item.imageUrl}
                alt={item.word}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
              <div className="absolute inset-0 grid place-items-center text-6xl">{celebrate ? "😺" : "🐱"}</div>
            </div>

            <button
              onClick={playSlowAudio}
              className="h-[72px] w-[72px] rounded-full bg-blue-600 text-white shadow-lg grid place-items-center hover:bg-blue-700 active:scale-[0.98]"
              aria-label="Play word audio"
              title="Listen to word"
            >
              <span className="text-3xl">🔊</span>
            </button>

            <audio ref={audioSlowRef} src={item.audioSlowUrl} preload="auto" />
          </div>

          {/* Prompt */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 rounded-full bg-white/80 px-5 py-2 text-sm font-semibold text-slate-800 shadow">
            {prompt}
          </div>

          {/* Slots */}
          <div className="absolute left-1/2 top-[44%] -translate-x-1/2 w-[92%] max-w-4xl">
            <div className="grid grid-cols-3 gap-4">
              {/* FIRST */}
              <div className={slotClass("first")} data-slot="first">
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

              {/* MIDDLE */}
              <div className={slotClass("middle")} data-slot="middle">
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

              {/* LAST */}
              <div className={slotClass("last")} data-slot="last">
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
          </div>

          {/* Bubbles */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 items-center justify-center">
            {bubbles.map((ch) => (
              <div
                key={ch}
                onPointerDown={(e) => onPointerDownBubble(e, ch)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                className={`${bubbleStyle} ${bubbleBg(ch)}`}
                style={{ touchAction: "none" }}
              >
                {ch}
              </div>
            ))}
          </div>

          {/* Drag ghost */}
          {draggingId && dragPos && (
            <div
              className={`pointer-events-none fixed z-[9999] ${bubbleStyle} ${bubbleBg(draggingId)}`}
              style={{ left: dragPos.x, top: dragPos.y }}
            >
              {draggingId}
            </div>
          )}

          {/* Check button */}
          <div className="absolute right-6 bottom-6">
            <button
              onClick={onCheck}
              disabled={!(slots.first && slots.middle && slots.last)}
              className={[
                "rounded-2xl px-6 py-3 text-lg font-extrabold shadow-lg",
                slots.first && slots.middle && slots.last ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-slate-300 text-slate-600 cursor-not-allowed",
              ].join(" ")}
            >
              🍽️ Check
            </button>
          </div>

          {phase === "success" && (
            <div className="absolute left-1/2 bottom-[120px] -translate-x-1/2 rounded-2xl bg-white/85 px-5 py-3 shadow text-slate-800 font-bold">
              Nice! 😺✨
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 text-xs text-white/70">
        Dev: GAME_ID={GAME_ID} • PROGRESS_DOC_ID={PROGRESS_DOC_ID} • kidId={kidId || "—"}
      </div>
    </div>
  );
}
