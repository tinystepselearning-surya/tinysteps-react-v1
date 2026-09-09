import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  PHONICS_EXPECTED_AUDIO_FILES,
  PHONICS_SOUND_CATEGORIES,
  PHONICS_SOUND_REGISTRY,
  getPhonicsSound,
} from '../../lib/phonicsSoundRegistry.js';
import {
  PHONICS_WORD_UTILITY_RECORDS,
  getPhonicsWordSoundCategories,
  getPhonicsWordUtility,
  searchPhonicsWordUtilities,
} from '../../lib/phonicsWordUtilityRegistry.js';
import { PHONICS_PUBLISHED_RESOURCE_PAGES } from '../../lib/phonicsPublicationRegistry.js';

const root = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');

describe('Resources R13 sound and word utility engine', () => {
  it('preserves the eight supplied sound families as a canonical registry', () => {
    expect(PHONICS_SOUND_CATEGORIES).toEqual([
      'Schwa',
      'Consonant',
      'Short Vowel',
      'Digraph',
      'Long Vowel',
      'Vowels and r',
      'Soft and Silent Consonant(s)',
      'Other Vowel Teams',
    ]);
    expect(PHONICS_SOUND_REGISTRY).toHaveLength(56);
    expect(new Set(PHONICS_SOUND_REGISTRY.map((sound) => sound.id)).size).toBe(56);
    expect(new Set(PHONICS_EXPECTED_AUDIO_FILES).size).toBe(56);
  });

  it('maps the supplied filenames to semantic sound identities rather than treating filenames as phonics facts', () => {
    expect(getPhonicsSound('soft-c')?.audioFile).toBe('s-cent-cirus-cycle.mp3');
    expect(getPhonicsSound('soft-g')?.audioFile).toBe('j-gem-giant-gym.mp3');
    expect(getPhonicsSound('z-spelled-s')?.audioFile).toBe('s-his.mp3');
    expect(getPhonicsSound('th-unvoiced')?.audioFile).toBe('th-thin.mp3');
    expect(getPhonicsSound('th-voiced')?.audioFile).toBe('th-the.mp3');
    expect(getPhonicsSound('oo-short')?.audioFile).toBe('oo-book-bush.mp3');
    expect(getPhonicsSound('oo-long')?.audioFile).toBe('oo-boot-new.mp3');
    expect(getPhonicsSound('schwa')?.audioFile).toBe('Schwa-What.mp3');
  });

  it('keeps every starter word explicitly segmented and pending human review', () => {
    expect(PHONICS_WORD_UTILITY_RECORDS.length).toBeGreaterThanOrEqual(70);
    expect(new Set(PHONICS_WORD_UTILITY_RECORDS.map((record) => record.word)).size).toBe(PHONICS_WORD_UTILITY_RECORDS.length);
    for (const record of PHONICS_WORD_UTILITY_RECORDS) {
      expect(record.segments.map((segment) => segment.grapheme).join('')).toBe(record.word);
      expect(record.humanReviewState).toBe('pending');
      expect(record.utilityState).toBe('starter-curated');
      expect(record.meaning.trim().split(/\s+/).length).toBeGreaterThanOrEqual(2);
      expect(record.exampleSentence.length).toBeGreaterThan(10);
      expect(record.trickyPart.length).toBeGreaterThan(10);
      for (const segment of record.segments) expect(getPhonicsSound(segment.soundId)).toBeTruthy();
    }
  });

  it('covers all eight sound families with the starter word bank', () => {
    const used = new Set(PHONICS_WORD_UTILITY_RECORDS.flatMap((record) => getPhonicsWordSoundCategories(record)));
    expect(used).toEqual(new Set(PHONICS_SOUND_CATEGORIES));
  });

  it('stores ambiguous spellings explicitly instead of guessing from letters', () => {
    const cow = getPhonicsWordUtility('cow');
    const snow = getPhonicsWordUtility('snow');
    expect(cow?.segments.find((segment) => segment.grapheme === 'ow')?.soundId).toBe('ou-ow');
    expect(snow?.segments.find((segment) => segment.grapheme === 'ow')?.soundId).toBe('long-o');
    expect(getPhonicsWordUtility('elephant')).toBeNull();
    expect(searchPhonicsWordUtilities('elephant')).toEqual([]);
  });

  it('keeps phoneme count distinct from spelling-chunk count when a chunk represents multiple phonemes', () => {
    expect(getPhonicsWordUtility('ship')).toMatchObject({ soundChunkCount: 3, phonemeCount: 3 });
    expect(getPhonicsWordUtility('quest')).toMatchObject({ soundChunkCount: 4, phonemeCount: 5 });
    expect(getPhonicsWordUtility('box')).toMatchObject({ soundChunkCount: 3, phonemeCount: 4 });
  });

  it('links utility words only to concepts already governed by the 31-page R12 publication registry', () => {
    expect(PHONICS_PUBLISHED_RESOURCE_PAGES).toHaveLength(31);
    const publishedConceptIds = new Set(PHONICS_PUBLISHED_RESOURCE_PAGES.map((page) => page.conceptId));
    for (const record of PHONICS_WORD_UTILITY_RECORDS) {
      for (const conceptId of record.conceptIds) expect(publishedConceptIds.has(conceptId)).toBe(true);
    }
  });

  it('embeds the utility inside the existing phonics hub without creating mass word URLs', () => {
    const grid = read('src/components/resources/PhonicsPilotGuideGrid.tsx');
    const utility = read('src/components/resources/PhonicsWordSoundUtility.tsx');
    const manifest = read('src/lib/publicRouteManifest.js');
    expect(grid).toContain("import PhonicsWordSoundUtility from './PhonicsWordSoundUtility'");
    expect(grid).toContain('<PhonicsWordSoundUtility />');
    expect(utility).toContain('The tool never guesses an unknown word from spelling.');
    expect(utility).toContain('no automatic word-page publishing');
    expect(manifest).not.toContain('/resources/phonics/word/');
    expect(manifest).not.toContain('/resources/phonics/words/');
  });

  it('keeps whole-word blending audio separate from isolated sound-cue playback', () => {
    const utility = read('src/components/resources/PhonicsWordSoundUtility.tsx');
    expect(utility).toContain('does not join isolated clips and label that result as natural whole-word blending');
    expect(utility).not.toContain('new SpeechSynthesisUtterance');
  });
});
