import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PHONICS_PUBLISHED_RESOURCE_PAGES } from '../../lib/phonicsPublicationRegistry.js';
import {
  PHONICS_RESOURCE_DIFFERENTIATION,
  getPhonicsResourceDifferentiation,
} from '../../lib/phonicsResourceDifferentiation';

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

describe('Brick 3B phonics content differentiation', () => {
  it('covers every published phonics resource with one curated differentiation record', () => {
    const publishedIds = PHONICS_PUBLISHED_RESOURCE_PAGES.map((page) => page.conceptId).sort();
    const differentiationIds = Object.keys(PHONICS_RESOURCE_DIFFERENTIATION).sort();

    expect(differentiationIds).toEqual(publishedIds);
    expect(differentiationIds).toHaveLength(31);
  });

  it('keeps outcomes and boundaries substantive and concept-specific', () => {
    const outcomes = new Set<string>();
    const boundaries = new Set<string>();

    for (const page of PHONICS_PUBLISHED_RESOURCE_PAGES) {
      const record = getPhonicsResourceDifferentiation(page.conceptId);
      expect(record, page.conceptId).not.toBeNull();
      expect(record!.learningOutcome.trim().length, page.conceptId).toBeGreaterThanOrEqual(60);
      expect(record!.boundarySummary.trim().length, page.conceptId).toBeGreaterThanOrEqual(60);
      expect(record!.readingUse?.trim().length ?? 0, page.conceptId).toBeGreaterThanOrEqual(50);
      if (record!.spellingUse) expect(record!.spellingUse.trim().length, page.conceptId).toBeGreaterThanOrEqual(50);
      outcomes.add(record!.learningOutcome);
      boundaries.add(record!.boundarySummary);
    }

    expect(outcomes.size).toBe(PHONICS_PUBLISHED_RESOURCE_PAGES.length);
    expect(boundaries.size).toBe(PHONICS_PUBLISHED_RESOURCE_PAGES.length);
  });

  it('renders the five Brick 3B framework sections without changing route or canonical ownership', () => {
    const source = read('src/pages/PhonicsKnowledgePage.tsx');

    expect(source).toContain('Where this fits in the phonics journey');
    expect(source).toContain('What the child should be able to do');
    expect(source).toContain('Reading use');
    expect(source).toContain('Spelling use');
    expect(source).toContain('When this pattern does not apply');
    expect(source).toContain('Tiny Steps curriculum connection');
    expect(source).toContain('concept.curriculumRefs.map');
    expect(source).toContain('data-brick3b-differentiation');
    expect(source).toContain('canonical={canonicalUrl}');
    expect(source).toContain('getPublishedPhonicsResourcePageBySlug');
  });

  it('keeps the frozen R8 dataset contract untouched and stores 3B copy downstream', () => {
    const schema = read('src/content/phonicsKnowledge/schema.js');
    const declaration = read('src/content/phonicsKnowledge/index.d.ts');
    const registry = read('src/lib/phonicsResourceDifferentiation.ts');

    expect(schema).not.toContain('learningOutcome:');
    expect(declaration).not.toContain('learningOutcome:');
    expect(registry).toContain('learningOutcome:');
    expect(registry).toContain('boundarySummary:');
  });
});
