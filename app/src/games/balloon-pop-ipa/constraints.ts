/**
 * Balloon Pop Phoneme - Speed and Difficulty Constraints
 * Centralizes phase caps and per-phoneme speed limits
 */

export type Speed = "slow" | "med" | "fast";

export const SPEED_NUM = { slow: 0, med: 1, fast: 2 } as const;

export const SPEED_TABLE = {
  slow: { spawnMs: 1600, riseMs: 7000 },
  med:  { spawnMs: 1200, riseMs: 5500 },
  fast: { spawnMs:  900, riseMs: 4500 },
} as const;

// Per-phoneme maximum speed allowed (independent of phase)
// Digraphs that kids commonly confuse → cap at "med"
export const PHONEME_SPEED_CAP: Record<string, Speed> = {
  // Challenging digraphs - cap at medium speed
  "th-voiceless": "med",
  "th-voiced":   "med",
  "ng":          "med",
  "wh":          "med",
  
  // Allow fast for these in higher phases
  "sh":          "fast",
  "ch":          "fast",
  "ck":          "fast",
  "ph":          "fast",
  
  // Phase-2 single letters default to fast (phase caps still apply)
  "s": "fast",
  "a": "fast",
  "t": "fast",
  "p": "fast",
  "i": "fast",
  "n": "fast",
};

/**
 * Phase caps (applied before phoneme caps)
 * @param phase - Current curriculum phase (2-5)
 * @param requestedN - Requested balloon count
 * @param requestedSpeed - Requested speed
 * @param streak - Current session streak (for P4 fast unlock)
 */
export function clampByPhase(
  phase: number,
  requestedN: number,
  requestedSpeed: Speed,
  streak: number
): { n: number; speed: Speed } {
  let nMax = 4;
  let speedMax: Speed = "med";
  
  if (phase >= 5) {
    nMax = 6;
    speedMax = "fast";
  } else if (phase >= 4) {
    nMax = 6;
    speedMax = (streak >= 4) ? "fast" : "med";
  } else if (phase >= 3) {
    nMax = 5;
    speedMax = "med";
  }
  // Phase 2: nMax = 4, speedMax = "med" (defaults above)
  
  const n = Math.min(requestedN, nMax);
  const speed = SPEED_NUM[requestedSpeed] > SPEED_NUM[speedMax] ? speedMax : requestedSpeed;
  
  return { n, speed };
}

/**
 * Combine phase and per-phoneme caps
 * First applies phase constraints, then applies phoneme-specific limits
 */
export function clampByPhaseAndPhoneme(opts: {
  phase: number;
  targetPhoneme: string;
  requestedSpeed: Speed;
  requestedN: number;
  streak: number;
}): { n: number; speed: Speed } {
  // Apply phase caps first
  const phaseClamped = clampByPhase(
    opts.phase,
    opts.requestedN,
    opts.requestedSpeed,
    opts.streak
  );
  
  // Then apply phoneme-specific cap (defaults to "fast" if not defined)
  const phonemeCap = PHONEME_SPEED_CAP[opts.targetPhoneme] ?? "fast";
  const finalSpeed = (SPEED_NUM[phaseClamped.speed] > SPEED_NUM[phonemeCap])
    ? phonemeCap
    : phaseClamped.speed;
  
  return { n: phaseClamped.n, speed: finalSpeed };
}
