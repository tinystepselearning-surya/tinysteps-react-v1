import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  PUBLIC_SPEAKING_VIDEO_EVIDENCE,
  createPublicSpeakingVideoObject,
  publicSpeakingVideoUrls,
} from '../../lib/publicSpeakingVideoEvidence';

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

describe('Issue 804 approved Public Speaking video evidence', () => {
  it('uses the exact public video mapped to existing Tiny Steps Communication sample', () => {
    expect(PUBLIC_SPEAKING_VIDEO_EVIDENCE.title).toBe('Instant Storytelling Activity');
    expect(PUBLIC_SPEAKING_VIDEO_EVIDENCE.videoId).toBe('H-xTpL6tKWU');
    expect(PUBLIC_SPEAKING_VIDEO_EVIDENCE.publicationDate).toBe('2026-04-09');
    expect(PUBLIC_SPEAKING_VIDEO_EVIDENCE.duration).toBe('PT1M45S');
    expect(PUBLIC_SPEAKING_VIDEO_EVIDENCE.description).toContain('created and presented a story');
  });

  it('builds accurate VideoObject properties only from the approved static source', () => {
    const canonical = 'https://tinystepslearning.com/speaking';
    const schema = createPublicSpeakingVideoObject(canonical);
    const urls = publicSpeakingVideoUrls();
    expect(schema).toEqual({
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      '@id': canonical + '#real-class-sample-video',
      name: PUBLIC_SPEAKING_VIDEO_EVIDENCE.title,
      description: PUBLIC_SPEAKING_VIDEO_EVIDENCE.description,
      thumbnailUrl: urls.thumbnail,
      uploadDate: '2026-04-09',
      duration: 'PT1M45S',
      embedUrl: urls.embed,
      url: urls.watch,
    });
    expect(urls.embed).toContain('youtube-nocookie.com/embed/');
    expect(urls.thumbnail).toContain('i.ytimg.com/vi/');
  });

  it('refuses invalid dates or missing video descriptions, not fabricated replacements', () => {
    const a = PUBLIC_SPEAKING_VIDEO_EVIDENCE;
    expect(createPublicSpeakingVideoObject('https://tinystepslearning.com/speaking', {
      ...a, publicationDate: '2026-02-30',
    })).toBeNull();
    expect(createPublicSpeakingVideoObject('https://tinystepslearning.com/speaking', {
      ...a, description: '',
    })).toBeNull();
    expect(createPublicSpeakingVideoObject('https://tinystepslearning.com/speaking', {
      ...a, videoId: 'invalid',
    })).toBeNull();
  });

  it('keeps video content on the existing Speaking owner with a gallery link and no new routes', () => {
    const speaking = read('src/pages/speaking.tsx');
    const gallery = read('src/pages/ClassSamplesPage.tsx');
    const routes = read('src/app/routes.tsx');
    expect(speaking).toContain('id="real-class-sample"');
    expect(speaking).toContain('createPublicSpeakingVideoObject(canonicalUrl)');
    expect(speaking).toContain('src={publicSpeakingVideoUrls().embed}');
    expect(gallery).toContain('data-static-speaking-video-link');
    expect(gallery).toContain('to="/speaking#real-class-sample"');
    expect(routes).not.toContain("path: 'speaking-class-video'");
  });
});
