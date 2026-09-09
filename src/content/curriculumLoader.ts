// @ts-nocheck
// Runtime loader for Master Curriculum v2.1

export type WeekOverride = {
  title: string;
  focus?: string;
  learns?: string[];
  activities?: string[];
  homework?: string[];
  mastery?: string;
};

export type CurriculumOverride = {
  courses: Record<string, { weeks?: WeekOverride[] }>;
};

const AUTHORITATIVE_SOURCE_OVERRIDE_KEYS = new Set([
  'phonics-foundation',
  'phonics-foundations',
  'phonics-early',
  'phonics-brush-up',
  'early-phonics',
  'phonics-advanced',
  'advanced-phonics',
  'grammar-mastery',
  'advanced-grammar',
]);

const withoutSourceOwnedOverrides = (
  value: CurriculumOverride | null,
): CurriculumOverride | null => {
  if (!value?.courses) return value;

  const courses = Object.fromEntries(
    Object.entries(value.courses).filter(([slug]) => !AUTHORITATIVE_SOURCE_OVERRIDE_KEYS.has(slug)),
  );

  return { ...value, courses };
};

// Removed module-level cache on purpose to avoid stale data during dev.

export async function loadCurriculumOverrides(): Promise<CurriculumOverride | null> {
  try {
    const res = await fetch(`/curriculum-v2.1.json?ts=${Date.now()}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as CurriculumOverride;

    // Phonics and Advanced Grammar are maintained in source curriculum modules.
    // Ignore legacy runtime JSON for these routes so older six-stage payloads cannot
    // overwrite approved lesson sequences, stage goals, outcomes, or public-page structure.
    return withoutSourceOwnedOverrides(data);
  } catch (err) {
    console.warn('[curriculumLoader] Failed to load overrides', err);
    return null;
  }
}

export async function getCourseWeeksOverride(slug: string): Promise<WeekOverride[] | null> {
  const data = await loadCurriculumOverrides();
  return data?.courses?.[slug]?.weeks ?? null;
}
