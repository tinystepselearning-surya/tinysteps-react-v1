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
  youtubeUploadDate: string;
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

/**
 * Use only the date when the YouTube video first became public, verified by the publisher.
 * Firestore createdAt/updatedAt are NOT the video's first-publication date.
 * The empty string represents unknown or invalid metadata.
 */
export function normalizeYouTubeUploadDate(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return '';
  const parsed = new Date(`${trimmed}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === trimmed
    ? trimmed
    : '';
}

/**
 * Emit eligible VideoObject data only for an active video with independently
 * confirmed YouTube first-publication date. The title/description remain the approved
 * Tiny Steps gallery text; the thumbnail is the video's standard YouTube image.
 * This does not imply that an unlisted video is approved for public indexing.
 */
export function buildClassSampleVideoObject(video: ClassSampleItem, canonicalUrl: string) {
  const uploadDate = normalizeYouTubeUploadDate(video.youtubeUploadDate);
  if (!video.active || !isValidYouTubeVideoId(video.youtubeVideoId)
    || !video.title.trim() || !video.description.trim() || !uploadDate) {
    return null;
  }
  const youtubeUrl = `https://www.youtube.com/watch?v=${video.youtubeVideoId}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    '@id': `${canonicalUrl}#video-${video.id}`,
    name: video.title,
    description: video.description,
    uploadDate,
    embedUrl: `https://www.youtube-nocookie.com/embed/${video.youtubeVideoId}?rel=0&modestbranding=1`,
    url: youtubeUrl,
    thumbnailUrl: `https://i.ytimg.com/vi/${video.youtubeVideoId}/hqdefault.jpg`,
  };
}

export function toClassSampleItem(id: string, data: any): ClassSampleItem {
  // Prefer the canonical URL's ID if legacy stored fields disagree: the
  // thumbnail, player and watch URL must all describe the same video.
  const urlVideoId = extractYouTubeVideoId(String(data?.youtubeUrl || '')) || '';
  const storedVideoId = String(data?.youtubeVideoId || '').trim();
  const youtubeVideoId = urlVideoId
    || (isValidYouTubeVideoId(storedVideoId) ? storedVideoId : '');
  const youtubeUrl = youtubeVideoId
    ? `https://www.youtube.com/watch?v=${youtubeVideoId}`
    : '';
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
    youtubeUploadDate: normalizeYouTubeUploadDate(data?.youtubeUploadDate),
    featured: Boolean(data?.featured),
    active: Boolean(data?.active),
    sortOrder: Number.isFinite(nextSortOrder) ? nextSortOrder : 0,
    createdAt: data?.createdAt,
    updatedAt: data?.updatedAt,
    createdBy: typeof data?.createdBy === 'string' ? data.createdBy : null,
    updatedBy: typeof data?.updatedBy === 'string' ? data.updatedBy : null,
  };
}
