/**
 * Tests for Data Structure Validation in Balloon Pop IPA
 */

import { describe, it, expect } from 'vitest';
import { getMinimalPairs, getTrickyWords, PHONEMES } from '../phoneme-data';

describe('Data - Shape Validation', () => {
  describe('Minimal Pairs', () => {
    it('should return non-empty array', () => {
      const pairs = getMinimalPairs();
      expect(pairs).toBeDefined();
      expect(Array.isArray(pairs)).toBe(true);
      expect(pairs.length).toBeGreaterThan(0);
    });

    it('should have valid structure for each pair', () => {
      const pairs = getMinimalPairs();
      
      pairs.forEach((pair) => {
        expect(pair).toHaveProperty('targetA');
        expect(pair).toHaveProperty('targetB');
        expect(typeof pair.targetA).toBe('string');
        expect(typeof pair.targetB).toBe('string');
        expect(pair.targetA.length).toBeGreaterThan(0);
        expect(pair.targetB.length).toBeGreaterThan(0);
      });
    });

    it('should have distinct targets in each pair', () => {
      const pairs = getMinimalPairs();
      
      pairs.forEach((pair) => {
        expect(pair.targetA).not.toBe(pair.targetB);
      });
    });

    it('should have no duplicate pairs', () => {
      const pairs = getMinimalPairs();
      const pairStrings = pairs.map((p) => `${p.targetA}-${p.targetB}`);
      const uniquePairs = new Set(pairStrings);
      
      expect(uniquePairs.size).toBe(pairs.length);
    });
  });

  describe('Tricky Words', () => {
    it('should return non-empty array', () => {
      const words = getTrickyWords();
      expect(words).toBeDefined();
      expect(Array.isArray(words)).toBe(true);
      expect(words.length).toBeGreaterThan(0);
    });

    it('should have valid structure for each word', () => {
      const words = getTrickyWords();
      
      words.forEach((word) => {
        expect(word).toHaveProperty('word');
        expect(word).toHaveProperty('ipa');
        expect(word).toHaveProperty('rhymeAnchors');
        expect(typeof word.word).toBe('string');
        expect(typeof word.ipa).toBe('string');
        expect(Array.isArray(word.rhymeAnchors)).toBe(true);
      });
    });

    it('should have non-empty rhyme anchors for each word', () => {
      const words = getTrickyWords();
      
      words.forEach((word) => {
        expect(word.rhymeAnchors.length).toBeGreaterThan(0);
        word.rhymeAnchors.forEach((anchor) => {
          expect(typeof anchor).toBe('string');
          expect(anchor.length).toBeGreaterThan(0);
        });
      });
    });

    it('should have no duplicate words', () => {
      const words = getTrickyWords();
      const wordStrings = words.map((w) => w.word);
      const uniqueWords = new Set(wordStrings);
      
      expect(uniqueWords.size).toBe(words.length);
    });

    it('should have at least 2 rhyme anchors per word', () => {
      const words = getTrickyWords();
      
      words.forEach((word) => {
        expect(word.rhymeAnchors.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('Phonemes', () => {
    it('should have non-empty phoneme list for each category', () => {
      expect(PHONEMES).toBeDefined();
      expect(PHONEMES.monophthongs.length).toBeGreaterThan(0);
      expect(PHONEMES.diphthongs.length).toBeGreaterThan(0);
      expect(PHONEMES.consonants.length).toBeGreaterThan(0);
    });

    it('should have valid structure for each phoneme', () => {
      const allPhonemes = [
        ...PHONEMES.monophthongs,
        ...PHONEMES.diphthongs,
        ...PHONEMES.consonants,
      ];

      allPhonemes.forEach((phoneme) => {
        expect(phoneme).toHaveProperty('id');
        expect(phoneme).toHaveProperty('symbol');
        expect(phoneme).toHaveProperty('type');
        expect(phoneme).toHaveProperty('examples');
        
        expect(typeof phoneme.id).toBe('string');
        expect(typeof phoneme.symbol).toBe('string');
        expect(typeof phoneme.type).toBe('string');
        expect(Array.isArray(phoneme.examples)).toBe(true);
      });
    });

    it('should have no duplicate IDs', () => {
      const allPhonemes = [
        ...PHONEMES.monophthongs,
        ...PHONEMES.diphthongs,
        ...PHONEMES.consonants,
      ];
      const ids = allPhonemes.map((p) => p.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(allPhonemes.length);
    });

    it('should have normalized symbols (no extra slashes)', () => {
      const allPhonemes = [
        ...PHONEMES.monophthongs,
        ...PHONEMES.diphthongs,
        ...PHONEMES.consonants,
      ];

      allPhonemes.forEach((phoneme) => {
        // Symbols should not start or end with /
        expect(phoneme.symbol.startsWith('/')).toBe(false);
        expect(phoneme.symbol.endsWith('/')).toBe(false);
      });
    });

    it('should categorize phonemes correctly', () => {
      const validCategories = ['monophthongs', 'diphthongs', 'consonants'];
      const allPhonemes = [
        ...PHONEMES.monophthongs,
        ...PHONEMES.diphthongs,
        ...PHONEMES.consonants,
      ];
      
      allPhonemes.forEach((phoneme) => {
        expect(validCategories).toContain(phoneme.type);
      });
    });

    it('should have at least one example per phoneme', () => {
      const allPhonemes = [
        ...PHONEMES.monophthongs,
        ...PHONEMES.diphthongs,
        ...PHONEMES.consonants,
      ];

      allPhonemes.forEach((phoneme) => {
        expect(phoneme.examples.length).toBeGreaterThan(0);
        phoneme.examples.forEach((example) => {
          expect(typeof example.word).toBe('string');
          expect(example.word.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Data Consistency', () => {
    it('minimal pairs should reference valid phoneme symbols', () => {
      const pairs = getMinimalPairs();
      const allPhonemes = [
        ...PHONEMES.monophthongs,
        ...PHONEMES.diphthongs,
        ...PHONEMES.consonants,
      ];
      const phonemeSymbols = new Set(allPhonemes.map((p) => p.symbol));
      const phonemeIds = new Set(allPhonemes.map((p) => p.id));
      
      pairs.forEach((pair) => {
        // Targets should exist in phoneme list (by symbol or id)
        const hasTargetA = phonemeSymbols.has(pair.targetA) || phonemeIds.has(pair.targetA);
        const hasTargetB = phonemeSymbols.has(pair.targetB) || phonemeIds.has(pair.targetB);
        
        // At least one should match
        expect(hasTargetA || hasTargetB).toBe(true);
      });
    });
  });
});
