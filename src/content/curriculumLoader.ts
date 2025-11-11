// @ts-nocheck
// Optional runtime override loader for Master Curriculum v2.1
// Drop a JSON at /public/curriculum-v2.1.json with shape:
// {
//   "courses": {
//     "phonics-foundation": { "weeks": [ {"title":"Week 1 ...", "learns":[...], ...}, ... ] },
//     "grammar-essentials": { "weeks": [...] }
//   }
// }

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

let cache: CurriculumOverride | null = null;

export async function loadCurriculumOverrides(): Promise<CurriculumOverride | null> {
  if (cache) return cache;
  try {
    const res = await fetch('/curriculum-v2.1.json', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    cache = data;
    return data;
  } catch {
    return null;
  }
}

export async function getCourseWeeksOverride(slug: string): Promise<WeekOverride[] | null> {
  const data = await loadCurriculumOverrides();
  return data?.courses?.[slug]?.weeks ?? null;
}

