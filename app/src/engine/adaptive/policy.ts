import type { Item, Phase } from "../types";

export interface AdaptiveContext {
  phase: Phase;
  ageYears: number;
  recent: { itemId: string; correct: boolean; firstTry: boolean; timeMs: number }[];
  weakestSkillIds: string[];   // from summary hook
  pool: Item[];
}

export function phaseSpeedCapMs(phase: Phase, age: number) {
  // conservative caps: younger + earlier phases = slower
  const base = phase <= 2 ? 2000 : phase <= 4 ? 1600 : 1200;
  const ageAdj = age <= 5 ? +400 : age <= 7 ? +200 : 0;
  return base + ageAdj; // min time before respawn/next
}

export function optionsPerRound(phase: Phase) {
  return phase <= 2 ? 3 : phase <= 4 ? 4 : 5;
}

export function selectNextItem(ctx: AdaptiveContext): Item | null {
  const tried = new Set(ctx.recent.slice(-6).map(r => r.itemId));
  // 1) prioritize weakest skills present in the pool
  const weak = ctx.pool.filter(i => ctx.weakestSkillIds.includes(i.skillId) && !tried.has(i.id));
  if (weak.length) return weak[Math.floor(Math.random() * weak.length)];
  // 2) avoid immediate repeats; prefer items not served recently
  const fresh = ctx.pool.filter(i => !tried.has(i.id));
  if (fresh.length) return fresh[Math.floor(Math.random() * fresh.length)];
  // 3) fallback
  return ctx.pool[Math.floor(Math.random() * ctx.pool.length)] ?? null;
}
