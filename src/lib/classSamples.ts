export const CLASS_SAMPLE_CATEGORIES = [
  'phonics',
  'reading',
  'grammar',
  'communication',
  'confidence',
] as const;

export type ClassSampleCategory = (typeof CLASS_SAMPLE_CATEGORIES)[number];

export type ClassSampleItem = {
  id: string;
  title: string;
  description: string;
  category: ClassSampleCategory;
  ageBand: string;
  durationLabel: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  featured: boolean;
  active: boolean;
  sortOrder: number;
  createdAt?: unknown;
  updatedAt?: unknown;
  createdBy?: string | null;
  updatedBy?: string | null;
};

const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;

export const CLASS_SAMPLE_CATEGORY_LABELS: Record<ClassSampleCategory, string> = {
  phonics: 'Phonics',
  reading: 'Reading',
  grammar: 'Grammar',
  communication: 'Communication',
  confidence: 'Confidence',
};

export function isValidYouTubeVideoId(value: string): boolean {
  return YOUTUBE_ID_RE.test(String(value || '').trim());
}

export function extractYouTubeVideoId(value: string): string | null {
  const trimmed = String(value || '').trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');
  let candidate = '';

  if (host === 'youtu.be') {
    candidate = parsed.pathname.split('/').filter(Boolean)[0] || '';
  } else if (host === 'youtube.com' || host === 'music.youtube.com') {
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts[0] === 'watch') {
      candidate = parsed.searchParams.get('v') || '';
    } else if (parts[0] === 'embed' || parts[0] === 'shorts' || parts[0] === 'live') {
      candidate = parts[1] || '';
    }
  }

  return isValidYouTubeVideoId(candidate) ? candidate : null;
}

export function normalizeYouTubeUrl(value: string): string | null {
  const videoId = extractYouTubeVideoId(value);
  if (!videoId) return null;
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function toClassSampleItem(id: string, data: any): ClassSampleItem {
  const fallbackVideoId = extractYouTubeVideoId(String(data?.youtubeUrl || '')) || '';
  const youtubeVideoId = isValidYouTubeVideoId(String(data?.youtubeVideoId || '').trim())
    ? String(data.youtubeVideoId).trim()
    : fallbackVideoId;
  const youtubeUrl = normalizeYouTubeUrl(String(data?.youtubeUrl || '').trim()) || '';
  const rawCategory = String(data?.category || '').trim().toLowerCase();
  const category = CLASS_SAMPLE_CATEGORIES.includes(rawCategory as ClassSampleCategory)
    ? (rawCategory as ClassSampleCategory)
    : 'phonics';
  const nextSortOrder = Number(data?.sortOrder);

  return {
    id,
    title: String(data?.title || '').trim(),
    description: String(data?.description || '').trim(),
    category,
    ageBand: String(data?.ageBand || '').trim(),
    durationLabel: String(data?.durationLabel || '').trim(),
    youtubeUrl,
    youtubeVideoId,
    featured: Boolean(data?.featured),
    active: Boolean(data?.active),
    sortOrder: Number.isFinite(nextSortOrder) ? nextSortOrder : 0,
    createdAt: data?.createdAt,
    updatedAt: data?.updatedAt,
    createdBy: typeof data?.createdBy === 'string' ? data.createdBy : null,
    updatedBy: typeof data?.updatedBy === 'string' ? data.updatedBy : null,
  };
}
