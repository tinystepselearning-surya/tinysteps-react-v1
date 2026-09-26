import { describe, expect, it } from 'vitest';
import {
  PHONICS_PREPUBLICATION_QUALITY_REVISION,
  PHONICS_PREPUBLICATION_QUALITY_STATE,
  assertPhonicsPrepublicationQuality,
} from '../../lib/phonicsPrepublicationQuality.js';
import { PHONICS_PUBLISHED_RESOURCE_PAGES } from '../../lib/phonicsPublicationRegistry.js';

describe('Resources R9.1 pre-publication quality gate', () => {
  it('marks every governed published page as quality-passed before publication', () => {
    expect(PHONICS_PUBLISHED_RESOURCE_PAGES).toHaveLength(31);

    for (const page of PHONICS_PUBLISHED_RESOURCE_PAGES) {
      expect(page.prepublicationQualityState, page.conceptId).toBe(PHONICS_PREPUBLICATION_QUALITY_STATE);
      expect(page.prepublicationQualityRevision, page.conceptId).toBe(PHONICS_PREPUBLICATION_QUALITY_REVISION);
      expect(page.prepublicationQualityChecks.length, page.conceptId).toBeGreaterThanOrEqual(10);
    }
  });

  it('rejects a thin concept before publication', () => {
    expect(() => assertPhonicsPrepublicationQuality({
      id: 'thin-example',
      parentQuestion: 'Too short?',
      quickAnswer: 'Too short.',
      searchIntent: 'short',
      exampleWords: [],
      teachingNotes: [],
      practiceIdeas: [],
      commonConfusions: [],
      curriculumRefs: [],
      supportingPaths: [],
    }, {
      topicId: 'x',
      seoTitle: 'Short',
      seoDescription: 'Short',
      cardTitle: '',
      group: 'Unknown',
    })).toThrow(/pre-publication quality gate failed/);
  });

  it('accepts a sufficiently complete concept contract', () => {
    const result = assertPhonicsPrepublicationQuality({
      id: 'complete-example',
      parentQuestion: 'How should this complete phonics pattern be taught to children?',
      quickAnswer: 'This complete example contains enough explanatory detail to answer the parent question clearly before the page can be published.',
      searchIntent: 'teach complete example phonics pattern',
      exampleWords: ['map', 'mat', 'mad'],
      teachingNotes: ['Model the target pattern clearly.', 'Move from guided practice to independent application.'],
      practiceIdeas: ['Sort familiar examples by the target pattern.', 'Read and spell fresh examples after guided practice.'],
      commonConfusions: ['Do not overgeneralise the pattern to unrelated words.'],
      curriculumRefs: [{ lessonId: 'early-phonics__lesson-01' }],
      supportingPaths: ['/resources/phonics'],
    }, {
      topicId: 'r-test-complete-example',
      seoTitle: 'Complete Example Phonics Pattern for Kids | Tiny Steps',
      seoDescription: 'A complete example phonics guide with explicit teaching guidance, word examples, practice ideas, boundaries and curriculum alignment for children.',
      cardTitle: 'Complete example',
      group: 'Spelling rules',
    });

    expect(result.state).toBe(PHONICS_PREPUBLICATION_QUALITY_STATE);
    expect(result.revision).toBe(PHONICS_PREPUBLICATION_QUALITY_REVISION);
    expect(result.checks.length).toBeGreaterThanOrEqual(10);
  });
});
