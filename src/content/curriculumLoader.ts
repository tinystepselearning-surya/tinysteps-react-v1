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

// Removed module-level cache on purpose to avoid stale data during dev.

export async function loadCurriculumOverrides(): Promise<CurriculumOverride | null> {
  try {
    const res = await fetch(`/curriculum-v2.1.json?ts=${Date.now()}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data as CurriculumOverride;
  } catch (err) {
    console.warn('[curriculumLoader] Failed to load overrides', err);
    return null;
  }
}

export async function getCourseWeeksOverride(slug: string): Promise<WeekOverride[] | null> {
  const data = await loadCurriculumOverrides();
  return data?.courses?.[slug]?.weeks ?? null;
}

