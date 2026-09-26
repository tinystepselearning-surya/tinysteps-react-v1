import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');

describe('Resources public copy and return-path UX', () => {
  it('keeps internal SEO and AI architecture jargon out of visible Resources copy', () => {
    const gateway = read('src/pages/ResourcesPage.tsx');
    const directory = read('src/components/resources/AiAnswerLayerDirectory.tsx');
    const subjectHub = read('src/pages/SubjectResourcesPage.tsx');

    for (const phrase of [
      'Central resource system',
      'established page URLs stay unchanged',
    ]) {
      expect(gateway).not.toContain(phrase);
    }

    for (const phrase of [
      'Answer architecture',
      'canonical owner',
      'search engines',
      'AI retrieval systems',
    ]) {
      expect(directory).not.toContain(phrase);
    }

    for (const phrase of [
      'commercial route',
      'existing games ecosystem',
      'intent owner',
      'search intent',
      'Keep resource discovery separate from programme decisions',
    ]) {
      expect(subjectHub).not.toContain(phrase);
    }

    expect(directory).toContain('Find the right next step');
    expect(directory).toContain('Question → explanation → practice');
  });

  it('keeps the six gateway pathways and adds clear return links from the three external hubs', () => {
    const gateway = read('src/pages/ResourcesPage.tsx');
    for (const destination of [
      '/resources/phonics',
      '/resources/grammar',
      '/resources/speaking',
      '/parents',
      '/free-english-games-for-kids',
      '/for-schools',
    ]) {
      expect(gateway).toContain(destination);
    }

    for (const source of [
      'src/pages/parents/ParentsHubPage.tsx',
      'src/pages/public/FreeEnglishGamesHubPage.tsx',
      'src/pages/ForSchoolsPage.tsx',
    ]) {
      const text = read(source);
      expect(text, source).toContain('to="/resources"');
      expect(text, source).toContain('All Tiny Steps Resources');
    }
  });

  it('leaves the Free Learning Activities pathway wording and destination intact', () => {
    const gateway = read('src/pages/ResourcesPage.tsx');
    expect(gateway).toContain("title: 'Free Learning Activities'");
    expect(gateway).toContain("to: '/free-english-games-for-kids'");
    expect(gateway).toContain('speaking through focused learning games');
  });
});
