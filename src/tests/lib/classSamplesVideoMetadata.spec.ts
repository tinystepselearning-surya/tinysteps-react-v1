import { describe, expect, it } from 'vitest';
import {
  buildClassSampleVideoObject,
  normalizeYouTubeUploadDate,
  toClassSampleItem,
} from '../../lib/classSamples';

const VIDEO_ID = 'AaBbCcDdE12';

function sample(data: Record<string, unknown> = {}) {
  return toClassSampleItem('approved-sample', {
    title: 'Teacher-guided communication practice',
    description: 'Child explains an idea and answers a follow-up question.',
    category: 'communication',
    youtubeUrl: `https://www.youtube.com/watch?v=${VIDEO_ID}`,
    youtubeVideoId: VIDEO_ID,
    youtubeUploadDate: '2025-12-01',
    active: true,
    sortOrder: 1,
    ...data,
  });
}

describe('existing class sample metadata and VideoObject safety', () => {
  it('accepts real calendar dates but not invalid or invented dates', () => {
    expect(normalizeYouTubeUploadDate('2024-02-29')).toBe('2024-02-29');
    expect(normalizeYouTubeUploadDate('2024-02-30')).toBe('');
    expect(normalizeYouTubeUploadDate('2025-13-01')).toBe('');
    expect(normalizeYouTubeUploadDate('2025-12-01T00:00:00Z')).toBe('');
    expect(normalizeYouTubeUploadDate('')).toBe('');
    expect(normalizeYouTubeUploadDate(undefined)).toBe('');
  });

  it('reuses the existing approved title, description, YouTube URL and thumbnail', () => {
    const video = sample();
    expect(buildClassSampleVideoObject(video, 'https://tinystepslearning.com/class-samples'))
      .toEqual({
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        '@id': 'https://tinystepslearning.com/class-samples#video-approved-sample',
        name: 'Teacher-guided communication practice',
        description: 'Child explains an idea and answers a follow-up question.',
        uploadDate: '2025-12-01',
        embedUrl: `https://www.youtube-nocookie.com/embed/${VIDEO_ID}?rel=0&modestbranding=1`,
        url: `https://www.youtube.com/watch?v=${VIDEO_ID}`,
        thumbnailUrl: `https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`,
      });
  });

  it('never substitutes the Firestore creation date for YouTube upload date', () => {
    const video = sample({
      youtubeUploadDate: undefined,
      createdAt: { seconds: 1770000000 },
      updatedAt: { seconds: 1770000001 },
    });
    expect(video.youtubeUploadDate).toBe('');
    expect(buildClassSampleVideoObject(video, 'https://tinystepslearning.com/class-samples'))
      .toBeNull();
    // Missing metadata must not hide the existing video from normal gallery playback.
    expect(video.active).toBe(true);
    expect(video.youtubeVideoId).toBe(VIDEO_ID);
  });

  it('keeps the player, direct URL and thumbnail synchronized for legacy mismatches', () => {
    const video = sample({ youtubeVideoId: 'PpQqRrSsT34' });
    expect(video.youtubeVideoId).toBe(VIDEO_ID);
    expect(video.youtubeUrl).toBe(`https://www.youtube.com/watch?v=${VIDEO_ID}`);
    const schema = buildClassSampleVideoObject(video, 'https://tinystepslearning.com/class-samples');
    expect(schema?.url).toBe(video.youtubeUrl);
    expect(schema?.embedUrl).toContain(`/embed/${VIDEO_ID}`);
  });

  it('does not publish VideoObject for hidden clips or invalid/incomplete metadata', () => {
    const page = 'https://tinystepslearning.com/class-samples';
    expect(buildClassSampleVideoObject(sample({ active: false }), page)).toBeNull();
    expect(buildClassSampleVideoObject(sample({ youtubeUploadDate: '2025-02-30' }), page)).toBeNull();
    expect(buildClassSampleVideoObject(sample({ title: '' }), page)).toBeNull();
    expect(buildClassSampleVideoObject(sample({ description: '' }), page)).toBeNull();
    expect(buildClassSampleVideoObject(sample({ youtubeUrl: '', youtubeVideoId: 'invalid' }), page))
      .toBeNull();
  });
});
