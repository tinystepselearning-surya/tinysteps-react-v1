export type MasteryKey = 'not_started' | 'emerging' | 'developing' | 'proficient' | 'mastered';

const MASTERY_LEVELS: { key: MasteryKey; pct: number }[] = [
  { key: 'not_started', pct: 0 },
  { key: 'emerging', pct: 25 },
  { key: 'developing', pct: 50 },
  { key: 'proficient', pct: 75 },
  { key: 'mastered', pct: 100 },
];

const MASTERY_KEYS = new Set(MASTERY_LEVELS.map((l) => l.key));

export const masteryKeyFromValue = (value: any): MasteryKey => {
  const raw = String(value ?? '').trim().toLowerCase().replace(/\s+/g, '_');
  if (MASTERY_KEYS.has(raw as MasteryKey)) return raw as MasteryKey;
  if (raw === 'not started') return 'not_started';

  const num =
    typeof value === 'number' && Number.isFinite(value)
      ? value
      : Number.isFinite(Number(raw))
        ? Number(raw)
        : null;
  if (num == null) return 'not_started';

  let best = MASTERY_LEVELS[0];
  let bestDiff = Math.abs(num - best.pct);
  for (const level of MASTERY_LEVELS) {
    const diff = Math.abs(num - level.pct);
    if (diff < bestDiff) {
      best = level;
      bestDiff = diff;
    }
  }
  return best.key;
};

export const masteryLabel = (value: any): string => {
  const key = masteryKeyFromValue(value);
  if (key === 'not_started') return 'Getting started';
  return key.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
};

export const masteryPctFromKey = (value: any): number => {
  const key = masteryKeyFromValue(value);
  const level = MASTERY_LEVELS.find((l) => l.key === key);
  return level ? level.pct : 0;
};
