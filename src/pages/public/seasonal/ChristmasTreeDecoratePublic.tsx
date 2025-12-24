// src/pages/seasonal/ChristmasTreeDecoratePublic.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * ✅ Uses your real Canva assets:
 * /seasonal/christmas/1.PNG ... 16.PNG
 *
 * IMPORTANT (Firebase Hosting is case-sensitive):
 * - If your files are named 1.PNG (uppercase) keep this code as-is.
 * - If you rename to 1.png (lowercase), this code still works (it has a fallback).
 *
 * ✅ Background music:
 * /seasonal/christmas/jinglebells.mp3
 */

type Decoration = {
  id: string;
  label: string;
  src: string;
  srcFallback?: string;
  preferredAnchor?: number;
  anchorId: number | null;
  homeIndex: number;
};

type DragState = {
  id: string;
  pointerId: number; // pointerId OR touch.identifier
  fromAnchor: number | null;
  startedOnTray: boolean;
  startX: number;
  startY: number;
  x: number;
  y: number;
  moved: boolean;
  input: "pointer" | "touch";
};

type Layout = {
  stageW: number;
  stageH: number;
  treeLeft: number;
  treeTop: number;
  treeW: number;
  treeH: number;
};

type Burst = {
  id: string;
  createdAt: number;
  flakes: Array<{
    id: string;
    leftPct: number;
    size: number;
    opacity: number;
    durMs: number;
    delayMs: number;
    driftPx: number;
    glow: number;
  }>;
};

type Twinkle = {
  id: string;
  leftPct: number;
  topPct: number;
  size: number;
  durMs: number;
  delayMs: number;
};

type ConfettiPiece = {
  id: string;
  leftPct: number;
  size: number;
  rot: number;
  durMs: number;
  delayMs: number;
  driftPx: number;
  opacity: number;
  color: string;
};

// ✅ 16 anchors (so all 16 items can be placed)
const TREE_ANCHORS: Array<{ x: number; y: number }> = [
  { x: 0.5, y: 0.055 }, // 0 top (star)
  { x: 0.42, y: 0.16 },
  { x: 0.58, y: 0.16 },
  { x: 0.5, y: 0.22 },
  { x: 0.36, y: 0.3 },
  { x: 0.5, y: 0.32 },
  { x: 0.64, y: 0.3 },
  { x: 0.44, y: 0.38 },
  { x: 0.34, y: 0.49 },
  { x: 0.5, y: 0.51 },
  { x: 0.66, y: 0.49 },
  { x: 0.4, y: 0.58 },
  { x: 0.42, y: 0.7 },
  { x: 0.58, y: 0.72 },
  { x: 0.5, y: 0.78 },
  { x: 0.64, y: 0.66 },
];

const DEFAULT_DECORATIONS: Decoration[] = Array.from({ length: 16 }).map((_, i) => {
  const n = i + 1;
  return {
    id: `d${n}`,
    label: `Decoration ${n}`,
    src: `/seasonal/christmas/${n}.PNG`,
    srcFallback: `/seasonal/christmas/${n}.png`,
    preferredAnchor: n === 1 ? 0 : undefined,
    anchorId: null,
    homeIndex: i,
  };
});

function isFullscreenNow() {
  const d: any = document;
  return !!(document.fullscreenElement || d.webkitFullscreenElement);
}

async function requestFullscreenSafe() {
  try {
    const el: any = document.documentElement;
    if (el?.requestFullscreen) await el.requestFullscreen();
    else if (el?.webkitRequestFullscreen) await el.webkitRequestFullscreen();
  } catch {
    // ignore
  }
}

async function exitFullscreenSafe() {
  try {
    const d: any = document;
    if (document.exitFullscreen) await document.exitFullscreen();
    else if (d?.webkitExitFullscreen) await d.webkitExitFullscreen();
  } catch {
    // ignore
  }
}

async function lockLandscapeSafe() {
  try {
    const o: any = (screen as any).orientation;
    if (o?.lock) await o.lock("landscape");
  } catch {
    // ignore
  }
}

function DecoImg({
  src,
  fallback,
  alt,
  className,
  style,
}: {
  src: string;
  fallback?: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [cur, setCur] = useState(src);
  useEffect(() => setCur(src), [src]);
  return (
    <img
      src={cur}
      alt={alt}
      draggable={false}
      className={className}
      style={style}
      onError={() => {
        if (fallback && cur !== fallback) setCur(fallback);
      }}
    />
  );
}

function VolumeOnIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M11 5.5 7.6 8H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2.6L11 18.5a1 1 0 0 0 1.6-.8V6.3a1 1 0 0 0-1.6-.8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M16 8.5c1.3 1.3 1.3 5.7 0 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18.5 6c2.6 2.6 2.6 9.4 0 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function VolumeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M11 5.5 7.6 8H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2.6L11 18.5a1 1 0 0 0 1.6-.8V6.3a1 1 0 0 0-1.6-.8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M16 9l5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M21 9l-5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function ChristmasTreeDecoratePublic() {
  const navigate = useNavigate();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const treeRef = useRef<HTMLImageElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // ✅ Background music (HTMLAudioElement)
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const [bgMuted, setBgMuted] = useState(false);
  const [bgPlaying, setBgPlaying] = useState(false);

  const [decorations, setDecorations] = useState<Decoration[]>(DEFAULT_DECORATIONS);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // Refs for stable event handlers (iOS friendly)
  const dragRef = useRef<DragState | null>(null);
  const decorationsRef = useRef<Decoration[]>(DEFAULT_DECORATIONS);
  const layoutRef = useRef<Layout | null>(null);

  useEffect(() => {
    dragRef.current = drag;
  }, [drag]);
  useEffect(() => {
    decorationsRef.current = decorations;
  }, [decorations]);
  useEffect(() => {
    layoutRef.current = layout;
  }, [layout]);

  // Effects
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [twinkles, setTwinkles] = useState<Twinkle[]>([]);
  const [poppedId, setPoppedId] = useState<string | null>(null);

  // Completion wow
  const [showWin, setShowWin] = useState(false);
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  // Start + Landscape helpers
  const [started, setStarted] = useState(false);
  const [needLandscape, setNeedLandscape] = useState(false);

  const computeNeedLandscape = useCallback(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const phoneLike = Math.min(w, h) < 520; // phones only; iPad won't be blocked
    const portrait = h > w;
    setNeedLandscape(phoneLike && portrait);
  }, []);

  useEffect(() => {
    computeNeedLandscape();
    window.addEventListener("resize", computeNeedLandscape);
    window.addEventListener("orientationchange", computeNeedLandscape);
    return () => {
      window.removeEventListener("resize", computeNeedLandscape);
      window.removeEventListener("orientationchange", computeNeedLandscape);
    };
  }, [computeNeedLandscape]);

  // Ambient snow
  const ambientSnow = useMemo(() => {
    return Array.from({ length: 56 }).map((_, i) => {
      const leftPct = Math.random() * 100;
      const size = 2.5 + Math.random() * 5.5;
      const opacity = 0.28 + Math.random() * 0.42;
      const durMs = 11000 + Math.random() * 12000;
      const delayMs = Math.random() * 7000;
      const driftPx = (Math.random() * 70 - 35) * (Math.random() > 0.5 ? 1 : -1);
      const glow = 14 + Math.random() * 22;
      return { id: `a-${i}`, leftPct, size, opacity, durMs, delayMs, driftPx, glow };
    });
  }, []);

  const stopBgMusic = useCallback(() => {
    const a = bgAudioRef.current;
    if (!a) return;
    try {
      a.pause();
      a.currentTime = 0;
    } catch {}
    setBgPlaying(false);
  }, []);

  const tryStartBgMusic = useCallback(async (): Promise<boolean> => {
    const a = bgAudioRef.current;
    if (!a) return false;
    try {
      a.muted = bgMuted;
      // iOS: must be called from user gesture (we ensure with Start overlay + retry listeners)
      await a.play();
      setBgPlaying(true);
      return true;
    } catch {
      setBgPlaying(false);
      return false;
    }
  }, [bgMuted]);

  // ✅ Initialize bg music once
  useEffect(() => {
    const a = new Audio("/seasonal/christmas/jinglebells.mp3");
    a.loop = true;
    a.preload = "auto";
    a.volume = 0.35;
    a.muted = bgMuted;
    try {
      a.load();
    } catch {}
    bgAudioRef.current = a;

    return () => {
      try {
        a.pause();
        a.currentTime = 0;
      } catch {}
      bgAudioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // once

  // Keep muted in sync
  useEffect(() => {
    if (bgAudioRef.current) bgAudioRef.current.muted = bgMuted;
  }, [bgMuted]);

  // ✅ Critical fix: keep retrying on ANY user gesture UNTIL it succeeds (don’t remove after a failed attempt)
  useEffect(() => {
    if (bgPlaying) return;

    const kick = async () => {
      // only attempt if we have audio and not playing
      const ok = await tryStartBgMusic();
      if (ok) {
        window.removeEventListener("pointerdown", kick, true);
        window.removeEventListener("touchstart", kick, true);
        window.removeEventListener("keydown", kick, true);
      }
    };

    window.addEventListener("pointerdown", kick, true);
    window.addEventListener("touchstart", kick, true);
    window.addEventListener("keydown", kick, true);

    return () => {
      window.removeEventListener("pointerdown", kick, true);
      window.removeEventListener("touchstart", kick, true);
      window.removeEventListener("keydown", kick, true);
    };
  }, [bgPlaying, tryStartBgMusic]);

  const measure = useCallback(() => {
    const stage = stageRef.current;
    const tree = treeRef.current;
    if (!stage || !tree) return;

    const s = stage.getBoundingClientRect();
    const t = tree.getBoundingClientRect();

    const treeLeft = t.left - s.left;
    const treeTop = t.top - s.top;

    if (s.width <= 0 || s.height <= 0 || t.width <= 0 || t.height <= 0) return;

    setLayout({
      stageW: s.width,
      stageH: s.height,
      treeLeft,
      treeTop,
      treeW: t.width,
      treeH: t.height,
    });
  }, []);

  // Layout measuring
  useEffect(() => {
    measure();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);

    const stage = stageRef.current;
    const tree = treeRef.current;
    const ro = (window as any).ResizeObserver ? new ResizeObserver(() => measure()) : null;

    if (ro && stage) ro.observe(stage);
    if (ro && tree) ro.observe(tree);

    return () => {
      window.removeEventListener("resize", onResize);
      try {
        ro?.disconnect?.();
      } catch {}
    };
  }, [measure]);

  // Completion check
  useEffect(() => {
    setIsComplete(decorations.every((d) => d.anchorId !== null));
  }, [decorations]);

  // Twinkles
  useEffect(() => {
    const t = window.setInterval(() => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const leftPct = 12 + Math.random() * 80;
      const topPct = 8 + Math.random() * 56;
      const size = 14 + Math.random() * 22;
      const durMs = 950 + Math.random() * 900;
      const delayMs = Math.random() * 120;

      setTwinkles((prev) => [...prev, { id, leftPct, topPct, size, durMs, delayMs }]);
      window.setTimeout(() => {
        setTwinkles((prev) => prev.filter((x) => x.id !== id));
      }, durMs + 800);
    }, 1050);

    return () => window.clearInterval(t);
  }, []);

  // Chime (uses AudioContext; iOS needs resume)
  const playChime = useCallback((kind: "place" | "complete") => {
    try {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as any;
      if (!Ctx) return;

      const ctx: AudioContext = audioCtxRef.current ?? (audioCtxRef.current = new Ctx());
      if (ctx.state === "suspended") ctx.resume?.().catch?.(() => {});

      const now = ctx.currentTime;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(kind === "complete" ? 0.22 : 0.13, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === "complete" ? 0.7 : 0.3));
      gain.connect(ctx.destination);

      const o1 = ctx.createOscillator();
      o1.type = "sine";
      o1.frequency.setValueAtTime(kind === "complete" ? 784 : 660, now);
      o1.frequency.exponentialRampToValueAtTime(kind === "complete" ? 1318 : 880, now + 0.2);
      o1.connect(gain);
      o1.start(now);
      o1.stop(now + (kind === "complete" ? 0.75 : 0.34));
    } catch {}
  }, []);

  const spawnSnowBurst = useCallback(() => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const flakes = Array.from({ length: 38 }).map((_, i) => {
      const leftPct = 10 + Math.random() * 80;
      const size = 3 + Math.random() * 9;
      const opacity = 0.55 + Math.random() * 0.35;
      const durMs = 1800 + Math.random() * 1400;
      const delayMs = Math.random() * 140;
      const driftPx = (Math.random() * 90 - 45) * (Math.random() > 0.5 ? 1 : -1);
      const glow = 16 + Math.random() * 22;
      return { id: `${id}-${i}`, leftPct, size, opacity, durMs, delayMs, driftPx, glow };
    });

    setBursts((prev) => [...prev, { id, createdAt: Date.now(), flakes }]);
    window.setTimeout(() => setBursts((prev) => prev.filter((b) => b.id !== id)), 3600);
  }, []);

  const resetAll = useCallback(() => {
    setDecorations(DEFAULT_DECORATIONS.map((d) => ({ ...d, anchorId: null })));
    setBursts([]);
    setPoppedId(null);
    setIsComplete(false);
    setShowWin(false);
    setConfetti([]);
  }, []);

  const placeDecoration = useCallback(
    (id: string, anchorId: number | null) => {
      setDecorations((prev) => prev.map((d) => (d.id === id ? { ...d, anchorId } : d)));
      if (anchorId !== null) {
        setPoppedId(id);
        window.setTimeout(() => setPoppedId((cur) => (cur === id ? null : cur)), 280);
        spawnSnowBurst();
        playChime("place");
      }
    },
    [playChime, spawnSnowBurst]
  );

  // Helpers for drop logic using latest state (via refs)
  const nextFreeAnchorNow = useCallback(() => {
    const decos = decorationsRef.current;
    for (let i = 0; i < TREE_ANCHORS.length; i += 1) {
      const occupied = decos.some((d) => d.anchorId === i);
      if (!occupied) return i;
    }
    return null;
  }, []);

  const findNearestAnchorNow = useCallback((tx: number, ty: number, fromAnchor: number | null) => {
    const decos = decorationsRef.current;
    let best: { idx: number; dist: number } | null = null;
    const threshold = 0.16;

    for (let i = 0; i < TREE_ANCHORS.length; i += 1) {
      const occupied = decos.some((d) => d.anchorId === i);
      const allowed = !occupied || i === fromAnchor;
      if (!allowed) continue;

      const a = TREE_ANCHORS[i];
      const dx = a.x - tx;
      const dy = a.y - ty;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < threshold && (!best || dist < best.dist)) best = { idx: i, dist };
    }
    return best ? best.idx : null;
  }, []);

  const stagePointerToTreeNorm = useCallback((clientX: number, clientY: number) => {
    const lay = layoutRef.current;
    const stage = stageRef.current;
    if (!lay || !stage) return null;
    const stageRect = stage.getBoundingClientRect();
    const x = clientX - stageRect.left;
    const y = clientY - stageRect.top;
    const tx = (x - lay.treeLeft) / lay.treeW;
    const ty = (y - lay.treeTop) / lay.treeH;
    return { x, y, tx, ty, stageRect };
  }, []);

  const startDrag = useCallback(
    (id: string, pointerId: number, clientX: number, clientY: number, input: "pointer" | "touch") => {
      const d = decorationsRef.current.find((x) => x.id === id);
      if (!d) return;

      // unlock audio context + bg music on first real interaction
      tryStartBgMusic();

      const fromAnchor = d.anchorId;
      if (fromAnchor !== null) placeDecoration(id, null);

      setDrag({
        id,
        pointerId,
        fromAnchor,
        startedOnTray: fromAnchor === null,
        startX: clientX,
        startY: clientY,
        x: clientX,
        y: clientY,
        moved: false,
        input,
      });
    },
    [placeDecoration, tryStartBgMusic]
  );

  // Pointer down (desktop + modern mobile)
  const handlePointerDown = useCallback(
    (e: React.PointerEvent, id: string) => {
      if (!started) return;
      e.preventDefault();
      e.stopPropagation();
      try {
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      } catch {}
      startDrag(id, e.pointerId, e.clientX, e.clientY, "pointer");
    },
    [startDrag, started]
  );

  // Touch fallback (iOS-safe)
  const handleTouchStart = useCallback(
    (e: React.TouchEvent, id: string) => {
      if (!started) return;
      const t = e.changedTouches?.[0];
      if (!t) return;
      e.preventDefault();
      e.stopPropagation();
      startDrag(id, t.identifier, t.clientX, t.clientY, "touch");
    },
    [startDrag, started]
  );

  const endDragAt = useCallback(
    (clientX: number, clientY: number) => {
      const dstate = dragRef.current;
      if (!dstate) return;

      const decos = decorationsRef.current;
      const d = decos.find((x) => x.id === dstate.id);
      if (!d) {
        setDrag(null);
        return;
      }

      const current = stagePointerToTreeNorm(clientX, clientY);
      const lay = layoutRef.current;

      // Tap placed item -> remove to tray
      if (!dstate.moved && !dstate.startedOnTray) {
        placeDecoration(d.id, null);
        setDrag(null);
        return;
      }

      // Tap tray item -> auto-place
      if (!dstate.moved && dstate.startedOnTray) {
        const preferred =
          typeof d.preferredAnchor === "number" && !decos.some((x) => x.anchorId === d.preferredAnchor)
            ? d.preferredAnchor
            : null;
        const free = preferred ?? nextFreeAnchorNow();
        if (free !== null) placeDecoration(d.id, free);
        setDrag(null);
        return;
      }

      if (current && lay) {
        const { x, tx, ty, stageRect } = current;

        // Drop in left tray zone => remove
        const localX = stageRect ? clientX - stageRect.left : x;
        const trayZoneRight = Math.max(210, lay.stageW * 0.3);
        if (localX < trayZoneRight) {
          placeDecoration(d.id, null);
          setDrag(null);
          return;
        }

        // Outside tree => revert or tray
        const insideTree = tx >= 0 && tx <= 1 && ty >= 0 && ty <= 1;
        if (!insideTree) {
          if (dstate.fromAnchor !== null) placeDecoration(d.id, dstate.fromAnchor);
          else placeDecoration(d.id, null);
          setDrag(null);
          return;
        }

        const nearest = findNearestAnchorNow(tx, ty, dstate.fromAnchor);
        if (nearest !== null) placeDecoration(d.id, nearest);
        else {
          if (dstate.fromAnchor !== null) placeDecoration(d.id, dstate.fromAnchor);
          else placeDecoration(d.id, null);
        }

        setDrag(null);
        return;
      }

      // fallback revert
      if (dstate.fromAnchor !== null) placeDecoration(d.id, dstate.fromAnchor);
      setDrag(null);
    },
    [findNearestAnchorNow, nextFreeAnchorNow, placeDecoration, stagePointerToTreeNorm]
  );

  // ✅ Global listeners ONCE (stable) + iOS scroll prevention
  useEffect(() => {
    const onPointerMove = (ev: PointerEvent) => {
      const d = dragRef.current;
      if (!d || d.input !== "pointer") return;
      if (ev.pointerId !== d.pointerId) return;
      ev.preventDefault?.();
      const dx = ev.clientX - d.startX;
      const dy = ev.clientY - d.startY;
      const moved = d.moved || Math.hypot(dx, dy) > 6;
      setDrag((prev) => (prev ? { ...prev, x: ev.clientX, y: ev.clientY, moved } : prev));
    };

    const onPointerUp = (ev: PointerEvent) => {
      const d = dragRef.current;
      if (!d || d.input !== "pointer") return;
      if (ev.pointerId !== d.pointerId) return;
      ev.preventDefault?.();
      endDragAt(ev.clientX, ev.clientY);
    };

    const onPointerCancel = (ev: PointerEvent) => {
      const d = dragRef.current;
      if (!d || d.input !== "pointer") return;
      if (ev.pointerId !== d.pointerId) return;
      // revert safely
      endDragAt(d.x, d.y);
    };

    const onTouchMove = (ev: TouchEvent) => {
      const d = dragRef.current;
      if (!d || d.input !== "touch") return;

      const t = Array.from(ev.changedTouches).find((x) => x.identifier === d.pointerId);
      if (!t) return;

      // ✅ iOS: MUST be passive:false + preventDefault to stop scrolling/bounce
      ev.preventDefault();

      const dx = t.clientX - d.startX;
      const dy = t.clientY - d.startY;
      const moved = d.moved || Math.hypot(dx, dy) > 6;
      setDrag((prev) => (prev ? { ...prev, x: t.clientX, y: t.clientY, moved } : prev));
    };

    const onTouchEnd = (ev: TouchEvent) => {
      const d = dragRef.current;
      if (!d || d.input !== "touch") return;

      const t = Array.from(ev.changedTouches).find((x) => x.identifier === d.pointerId);
      if (!t) return;

      ev.preventDefault();
      endDragAt(t.clientX, t.clientY);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp, { passive: false });
    window.addEventListener("pointercancel", onPointerCancel, { passive: false });

    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: false });
    window.addEventListener("touchcancel", onTouchEnd, { passive: false });

    return () => {
      window.removeEventListener("pointermove", onPointerMove as any);
      window.removeEventListener("pointerup", onPointerUp as any);
      window.removeEventListener("pointercancel", onPointerCancel as any);

      window.removeEventListener("touchmove", onTouchMove as any);
      window.removeEventListener("touchend", onTouchEnd as any);
      window.removeEventListener("touchcancel", onTouchEnd as any);
    };
  }, [endDragAt]);

  // Completion -> wow
  useEffect(() => {
    if (!isComplete) return;
    playChime("complete");
    setShowWin(true);

    const colors = ["#ff4d6d", "#ffd166", "#06d6a0", "#4dabf7", "#b197fc", "#ff9f1c", "#ffffff"];
    const pieces: ConfettiPiece[] = Array.from({ length: 80 }).map((_, i) => {
      const leftPct = Math.random() * 100;
      const size = 6 + Math.random() * 10;
      const opacity = 0.75 + Math.random() * 0.25;
      const durMs = 2200 + Math.random() * 1600;
      const delayMs = Math.random() * 250;
      const driftPx = (Math.random() * 220 - 110) * (Math.random() > 0.5 ? 1 : -1);
      const rot = Math.random() * 360;
      const color = colors[Math.floor(Math.random() * colors.length)];
      return { id: `c-${Date.now()}-${i}`, leftPct, size, opacity, durMs, delayMs, driftPx, rot, color };
    });
    setConfetti(pieces);
  }, [isComplete, playChime]);

  const ui = useMemo(() => {
    const stageRect = stageRef.current?.getBoundingClientRect();
    if (!layout || !stageRect) return null;

    const isMobile = layout.stageW < 640;
    const cols = 2;
    const rows = 8;

    const panelLeft = isMobile ? 10 : 14;
    const panelTop = isMobile ? 62 : 76;
    const panelPadding = isMobile ? 10 : 12;

    const maxH = Math.max(340, layout.stageH - panelTop - 18);
    const desiredCell = isMobile ? 64 : 70;
    const maxCellByHeight = Math.floor((maxH - panelPadding * 2 - (rows - 1) * 10) / rows);
    const trayCell = Math.max(54, Math.min(desiredCell, maxCellByHeight));

    const colGap = isMobile ? 10 : 12;
    const rowGap = Math.max(
      8,
      Math.min(12, Math.floor((maxH - panelPadding * 2 - rows * trayCell) / Math.max(1, rows - 1)))
    );

    const panelW = panelPadding * 2 + cols * trayCell + (cols - 1) * colGap;
    const panelH = panelPadding * 2 + rows * trayCell + (rows - 1) * rowGap;

    const sizeById = (id: string, onTree: boolean) => {
      const n = Number(id.replace("d", ""));
      if (!onTree) return trayCell;
      if (isMobile) return n === 1 ? 86 : 78;
      return n === 1 ? 100 : 86;
    };

    const getPosForDecoration = (d: Decoration) => {
      // dragging follows pointer
      const dstate = dragRef.current;
      if (dstate?.id === d.id) {
        const x = dstate.x - stageRect.left;
        const y = dstate.y - stageRect.top;
        return { left: x, top: y, z: 90 };
      }

      // placed on tree
      if (d.anchorId !== null) {
        const a = TREE_ANCHORS[d.anchorId];
        const left = layout.treeLeft + a.x * layout.treeW;
        const top = layout.treeTop + a.y * layout.treeH;
        return { left, top, z: 60 };
      }

      // tray
      const idx = d.homeIndex;
      const col = idx < 8 ? 0 : 1;
      const row = idx % 8;

      const left = panelLeft + panelPadding + col * (trayCell + colGap) + trayCell / 2;
      const top = panelTop + panelPadding + row * (trayCell + rowGap) + trayCell / 2;
      return { left, top, z: 55 };
    };

    const trayZoneRight = panelLeft + panelW + 10;

    return {
      isMobile,
      panelLeft,
      panelTop,
      panelW,
      panelH,
      panelPadding,
      trayCell,
      colGap,
      trayZoneRight,
      sizeById,
      getPosForDecoration,
    };
  }, [layout]);

  // Win popup beside tree (desktop), center on small
  const winStyle = useMemo<React.CSSProperties>(() => {
    if (!layout) return { left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: 420 };

    const isSmall = layout.stageW < 900;
    const cardW = isSmall ? 340 : 460;
    const cardH = isSmall ? 260 : 280;
    if (isSmall) return { left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: cardW };

    const margin = 18;
    const rightSpace = layout.stageW - (layout.treeLeft + layout.treeW) - margin;
    const leftSpace = layout.treeLeft - margin;

    let left = layout.treeLeft + layout.treeW + margin;
    if (rightSpace < cardW + 10 && leftSpace >= cardW + 10) left = layout.treeLeft - cardW - margin;
    left = Math.max(12, Math.min(left, layout.stageW - cardW - 12));

    const preferredTop = layout.treeTop + layout.treeH * 0.32;
    const top = Math.max(72, Math.min(preferredTop, layout.stageH - cardH - 16));

    return { left, top, transform: "translate(0,0)", width: cardW };
  }, [layout]);

  const startGame = useCallback(async () => {
    setStarted(true);

    // Best-effort: fullscreen + landscape (Android works; iOS may ignore)
    await requestFullscreenSafe();
    await lockLandscapeSafe();

    // Must be inside user gesture -> this is called from Start button
    await tryStartBgMusic();

    // iOS AudioContext resume for chimes (safe)
    try {
      if (audioCtxRef.current?.state === "suspended") {
        await audioCtxRef.current.resume();
      }
    } catch {}
  }, [tryStartBgMusic]);

  return (
    <div className="fixed inset-0 z-[99999] bg-black text-white">
      <style>
        {`
          .ts-snow-layer { position:absolute; inset:0; overflow:hidden; pointer-events:none; }

          .ts-snowflake {
            position:absolute; top:-12%;
            border-radius:9999px;
            background: rgba(255,255,255,0.98);
            filter: drop-shadow(0 0 var(--glow, 18px) rgba(255,255,255,0.70));
            animation:
              tsSnowFall var(--dur, 14000ms) linear var(--delay, 0ms) infinite,
              tsSnowDrift 3200ms ease-in-out var(--delay, 0ms) infinite alternate;
            will-change: top, transform, opacity;
          }
          @keyframes tsSnowFall { from { top:-12%; } to { top:112%; } }
          @keyframes tsSnowDrift { from { transform: translateX(0); } to { transform: translateX(var(--drift, 18px)); } }

          .ts-burstflake {
            position:absolute; top:-10%;
            border-radius:9999px;
            background: rgba(255,255,255,0.98);
            filter: drop-shadow(0 0 var(--glow, 22px) rgba(255,255,255,0.80));
            animation:
              tsBurstFall var(--dur, 2500ms) linear var(--delay, 0ms) forwards,
              tsBurstDrift 1500ms ease-in-out var(--delay, 0ms) infinite alternate;
          }
          @keyframes tsBurstFall { from { top:-10%; opacity: 0.0; } 10% { opacity: 1; } to { top:115%; opacity: 0.0; } }
          @keyframes tsBurstDrift { from { transform: translateX(0); } to { transform: translateX(var(--drift, 26px)); } }

          .ts-twinkle {
            position:absolute;
            width: var(--sz, 18px);
            height: var(--sz, 18px);
            border-radius: 9999px;
            background: radial-gradient(circle, rgba(255,255,230,1) 0%, rgba(255,255,255,0.85) 30%, rgba(255,255,255,0.0) 72%);
            filter: drop-shadow(0 0 30px rgba(255,255,255,0.75));
            mix-blend-mode: screen;
            animation: tsTwinkle var(--dur, 1100ms) ease-in-out var(--delay, 0ms) forwards;
          }
          .ts-twinkle::after{
            content:"";
            position:absolute;
            inset:-30px;
            border-radius: 9999px;
            background: radial-gradient(circle, rgba(255,245,180,0.55) 0%, rgba(255,255,255,0.0) 70%);
            transform: scale(0.35);
            animation: tsBoom var(--dur, 1100ms) ease-out var(--delay, 0ms) forwards;
          }
          @keyframes tsTwinkle {
            0% { transform: scale(0.55); opacity: 0; }
            22% { transform: scale(1.05); opacity: 1; }
            55% { transform: scale(0.95); opacity: 0.95; }
            100% { transform: scale(0.65); opacity: 0; }
          }
          @keyframes tsBoom {
            0% { opacity: 0; transform: scale(0.25); }
            25% { opacity: 1; transform: scale(1.05); }
            100% { opacity: 0; transform: scale(1.55); }
          }

          .ts-pop { animation: tsPop 260ms ease-out; }
          @keyframes tsPop {
            0% { transform: translate(-50%, -50%) scale(0.88); }
            70% { transform: translate(-50%, -50%) scale(1.10); }
            100% { transform: translate(-50%, -50%) scale(1.0); }
          }

          .ts-deco-on-tree {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            outline: none !important;
            padding: 0 !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
          }

          .ts-confetti {
            position:absolute;
            top:-12%;
            border-radius: 4px;
            animation:
              tsConfettiFall var(--dur, 2600ms) ease-in var(--delay, 0ms) forwards,
              tsConfettiDrift 900ms ease-in-out var(--delay, 0ms) infinite alternate;
            will-change: transform, top, opacity;
          }
          @keyframes tsConfettiFall {
            0% { top:-12%; opacity: 0; transform: translateX(0) rotate(var(--rot, 0deg)); }
            10% { opacity: var(--op, 1); }
            100% { top:112%; opacity: 0; transform: translateX(var(--drift, 60px)) rotate(calc(var(--rot, 0deg) + 360deg)); }
          }
          @keyframes tsConfettiDrift {
            from { transform: translateX(0) rotate(var(--rot, 0deg)); }
            to { transform: translateX(calc(var(--drift, 60px) * 0.2)) rotate(calc(var(--rot, 0deg) + 40deg)); }
          }

          .ts-win-pop {
            animation: tsWinIn 420ms cubic-bezier(.2,1.2,.2,1) both;
          }
          @keyframes tsWinIn {
            0% { transform: scale(0.75); opacity: 0; }
            60% { transform: scale(1.05); opacity: 1; }
            100% { transform: scale(1.0); opacity: 1; }
          }
        `}
      </style>

      <div
        ref={stageRef}
        className="relative h-full w-full overflow-hidden"
        style={{
          touchAction: "none",
          WebkitUserSelect: "none",
          userSelect: "none",
          WebkitTouchCallout: "none",
        }}
      >
        {/* Background */}
        <img
          src="/seasonal/christmas/gamebg.jpeg"
          alt="Christmas background"
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover pointer-events-none select-none"
          onLoad={measure}
        />

        {/* Vignette */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/10 via-transparent to-black/45" />
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.22),rgba(255,255,255,0.0)_55%)]" />
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_70%_30%,rgba(255,240,180,0.16),rgba(255,255,255,0.0)_55%)]" />

        {/* Ambient snow */}
        <div className="ts-snow-layer z-10">
          {ambientSnow.map((f) => (
            <div
              key={f.id}
              className="ts-snowflake"
              style={{
                left: `${f.leftPct}%`,
                width: `${f.size}px`,
                height: `${f.size}px`,
                opacity: f.opacity,
                ["--dur" as any]: `${f.durMs}ms`,
                ["--delay" as any]: `${f.delayMs}ms`,
                ["--drift" as any]: `${f.driftPx}px`,
                ["--glow" as any]: `${f.glow}px`,
              }}
            />
          ))}
        </div>

        {/* Placement burst */}
        <div className="ts-snow-layer z-20">
          {bursts.map((b) =>
            b.flakes.map((f) => (
              <div
                key={f.id}
                className="ts-burstflake"
                style={{
                  left: `${f.leftPct}%`,
                  width: `${f.size}px`,
                  height: `${f.size}px`,
                  opacity: f.opacity,
                  ["--dur" as any]: `${f.durMs}ms`,
                  ["--delay" as any]: `${f.delayMs}ms`,
                  ["--drift" as any]: `${f.driftPx}px`,
                  ["--glow" as any]: `${f.glow}px`,
                }}
              />
            ))
          )}
        </div>

        {/* Twinkles */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          {twinkles.map((t) => (
            <div
              key={t.id}
              className="ts-twinkle"
              style={{
                left: `${t.leftPct}%`,
                top: `${t.topPct}%`,
                ["--sz" as any]: `${t.size}px`,
                ["--dur" as any]: `${t.durMs}ms`,
                ["--delay" as any]: `${t.delayMs}ms`,
              }}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="absolute top-4 left-4 z-60 flex items-center gap-2">
          <button
            className="rounded-full bg-white/90 text-slate-900 px-3 py-1.5 text-sm font-semibold shadow-sm hover:bg-white"
            onClick={() => resetAll()}
          >
            Reset
          </button>
        </div>

        <div className="absolute top-4 right-4 z-60 flex items-center gap-2">
          {/* Volume */}
          <button
            className="rounded-full bg-white/90 text-slate-900 h-9 w-9 grid place-items-center shadow-sm hover:bg-white"
            aria-label={bgMuted ? "Unmute music" : "Mute music"}
            title={bgMuted ? "Unmute music" : "Mute music"}
            onClick={() => {
              setBgMuted((m) => {
                const next = !m;
                // if unmuting, try play again immediately
                if (!next) setTimeout(() => void tryStartBgMusic(), 0);
                return next;
              });
            }}
          >
            {bgMuted ? <VolumeOffIcon className="h-5 w-5" /> : <VolumeOnIcon className="h-5 w-5" />}
          </button>

          <button
            className="rounded-full bg-white/90 text-slate-900 px-3 py-1.5 text-sm font-semibold shadow-sm hover:bg-white"
            onClick={async () => {
              stopBgMusic();
              await exitFullscreenSafe();
              navigate("/");
            }}
          >
            Exit
          </button>
        </div>

        {/* ✅ Start overlay (fixes iOS audio + sets best landscape/fullscreen) */}
        {!started && (
          <div className="absolute inset-0 z-[999] flex items-center justify-center bg-black/55">
            <div className="rounded-3xl bg-black/55 p-6 text-center shadow-2xl border border-white/15 backdrop-blur max-w-[520px] mx-4">
              <div className="text-2xl font-extrabold">🎄 Christmas Tree Decorator</div>
              <div className="mt-2 text-sm text-white/85">
                Tap Start to enable music and touch controls. On phones, rotate to landscape for the best experience.
              </div>

              <button
                className="mt-5 inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-white/95"
                onClick={async () => {
                  await startGame();
                }}
              >
                Start Game
              </button>

              <div className="mt-3 text-[11px] text-white/70">
                If your device doesn’t enter landscape automatically, just rotate your phone.
              </div>
            </div>
          </div>
        )}

        {/* ✅ Landscape overlay (phones in portrait) */}
        {started && needLandscape && (
          <div className="absolute inset-0 z-[998] flex items-center justify-center bg-black/70">
            <div className="rounded-3xl bg-black/60 p-6 text-center shadow-2xl border border-white/15 backdrop-blur max-w-[520px] mx-4">
              <div className="text-xl font-bold">Rotate to Landscape 📱➡️</div>
              <div className="mt-2 text-sm text-white/85">
                This game works best in landscape mode. Please rotate your phone.
              </div>
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 hover:bg-white/95"
                  onClick={async () => {
                    await requestFullscreenSafe();
                    await lockLandscapeSafe();
                    computeNeedLandscape();
                  }}
                >
                  Try Auto-Landscape
                </button>
                <button
                  className="rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white border border-white/20"
                  onClick={() => setNeedLandscape(false)}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tray panel */}
        {ui && (
          <div
            className="absolute z-30 rounded-3xl border border-white/12 bg-white/10 backdrop-blur"
            style={{
              left: ui.panelLeft,
              top: ui.panelTop,
              width: ui.panelW,
              height: ui.panelH,
              padding: ui.panelPadding,
              boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
            }}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-semibold text-white/95">Decorations</div>
              <div className="text-[10px] text-white/70">drag or tap</div>
            </div>

            <div
              className="absolute top-11 bottom-3 w-px bg-white/10"
              style={{ left: ui.panelPadding + ui.trayCell + ui.colGap / 2 }}
            />
          </div>
        )}

        {/* Tree */}
        <img
          ref={treeRef}
          src="/seasonal/christmas/tree.png"
          alt="Christmas tree"
          draggable={false}
          onLoad={measure}
          className="absolute left-1/2 bottom-0 -translate-x-1/2 h-[86%] md:h-[92%] w-auto object-contain drop-shadow-2xl select-none pointer-events-none"
        />

        {/* Tree lights */}
        {layout &&
          TREE_ANCHORS.slice(1).map((a, i) => {
            const left = layout.treeLeft + a.x * layout.treeW;
            const top = layout.treeTop + a.y * layout.treeH;
            const colors = [
              "rgba(255,214,74,0.95)",
              "rgba(59,130,246,0.90)",
              "rgba(16,185,129,0.90)",
              "rgba(255,107,107,0.90)",
            ];
            const c = colors[i % colors.length];
            const delay = `${(i * 190) % 1100}ms`;
            return (
              <div key={`light-${i}`} className="absolute z-25 pointer-events-none" style={{ left, top, transform: "translate(-50%, -50%)" }}>
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    background: c,
                    boxShadow: `0 0 20px ${c}, 0 0 40px rgba(255,255,255,0.18)`,
                    animation: `tsTwinkle 1350ms ease-in-out ${delay} infinite`,
                    opacity: 0.82,
                  }}
                />
              </div>
            );
          })}

        {/* Decorations */}
        {ui &&
          decorations.map((d) => {
            const pos = ui.getPosForDecoration(d);
            const onTree = d.anchorId !== null;
            const size = ui.sizeById(d.id, onTree);
            const isDragging = drag?.id === d.id;
            const pop = poppedId === d.id && onTree;

            const trayBg = "rgba(255,255,255,0.10)";
            const trayBorder = "rgba(255,255,255,0.16)";

            return (
              <div
                key={d.id}
                className="absolute"
                style={{
                  left: pos.left,
                  top: pos.top,
                  zIndex: isDragging ? 90 : pos.z,
                  transform: "translate(-50%, -50%)",
                  touchAction: "none",
                  userSelect: "none",
                  WebkitUserSelect: "none",
                }}
              >
                <button
                  type="button"
                  aria-label={d.label}
                  onPointerDown={(e) => handlePointerDown(e, d.id)}
                  onTouchStart={(e) => handleTouchStart(e, d.id)}
                  onContextMenu={(e) => e.preventDefault()}
                  className={[
                    "transition-transform",
                    isDragging ? "scale-[1.06]" : "",
                    pop ? "ts-pop" : "",
                    onTree ? "ts-deco-on-tree" : "",
                  ].join(" ")}
                  style={{
                    width: size,
                    height: size,
                    cursor: "grab",
                    WebkitTapHighlightColor: "transparent",

                    background: onTree ? "transparent" : trayBg,
                    border: onTree ? "none" : `1px solid ${trayBorder}`,
                    borderRadius: onTree ? 0 : 18,
                    padding: onTree ? 0 : 4,

                    backdropFilter: "none",
                    WebkitBackdropFilter: "none",
                    boxShadow: onTree ? "none" : "0 10px 18px rgba(0,0,0,0.22)",
                  }}
                >
                  <DecoImg
                    src={d.src}
                    fallback={d.srcFallback}
                    alt={d.label}
                    className="h-full w-full object-contain select-none pointer-events-none"
                    style={{
                      filter: onTree ? "drop-shadow(0 10px 16px rgba(0,0,0,0.28))" : "none",
                    }}
                  />
                </button>
              </div>
            );
          })}

        {/* Win popup */}
        {showWin && isComplete && (
          <div className="absolute inset-0 z-80">
            <div className="absolute inset-0 pointer-events-none">
              {confetti.map((p) => (
                <div
                  key={p.id}
                  className="ts-confetti"
                  style={{
                    left: `${p.leftPct}%`,
                    width: `${p.size}px`,
                    height: `${Math.max(10, p.size * 1.8)}px`,
                    opacity: p.opacity,
                    background: p.color,
                    ["--dur" as any]: `${p.durMs}ms`,
                    ["--delay" as any]: `${p.delayMs}ms`,
                    ["--drift" as any]: `${p.driftPx}px`,
                    ["--rot" as any]: `${p.rot}deg`,
                    ["--op" as any]: `${p.opacity}`,
                    boxShadow: "0 0 18px rgba(255,255,255,0.25)",
                  }}
                />
              ))}
            </div>

            <div className="absolute inset-0 bg-black/30" />

            <div className="absolute ts-win-pop pointer-events-auto" style={winStyle}>
              <div
                className="rounded-[32px] p-[2px] shadow-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,77,109,0.95), rgba(255,209,102,0.95), rgba(6,214,160,0.95), rgba(77,171,247,0.95))",
                }}
              >
                <div
                  className="rounded-[30px] px-7 py-6 text-center"
                  style={{
                    background:
                      "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35), rgba(255,255,255,0.08) 40%, rgba(0,0,0,0.15) 100%)",
                    border: "1px solid rgba(255,255,255,0.22)",
                  }}
                >
                  <div className="text-4xl font-extrabold" style={{ textShadow: "0 8px 22px rgba(0,0,0,0.25)" }}>
                    🎄 Merry Christmas! 🎁
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white/95">WOW! Your tree looks super magical ✨</div>
                  <div className="mt-1 text-sm text-white/85">You placed all the decorations perfectly!</div>

                  <div className="mt-6 flex items-center justify-center gap-3">
                    <button
                      className="rounded-full px-6 py-2 text-sm font-semibold text-slate-900"
                      style={{ background: "rgba(255,255,255,0.92)", boxShadow: "0 14px 28px rgba(0,0,0,0.28)" }}
                      onClick={() => resetAll()}
                    >
                      Play Again
                    </button>
                    <button
                      className="rounded-full px-6 py-2 text-sm font-semibold text-white"
                      style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.25)" }}
                      onClick={async () => {
                        stopBgMusic();
                        await exitFullscreenSafe();
                        navigate("/");
                      }}
                    >
                      Done
                    </button>
                  </div>

                  <div className="mt-4 text-[11px] text-white/75">Tip: Tap any tree decoration to send it back to the tray.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* hidden debug */}
        <div className="hidden">
          bgPlaying:{String(bgPlaying)} muted:{String(bgMuted)} fullscreen:{String(isFullscreenNow())}
        </div>
      </div>
    </div>
  );
}
