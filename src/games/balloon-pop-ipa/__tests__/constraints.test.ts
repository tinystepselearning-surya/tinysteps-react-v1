/**
 * Tests for balloon pop constraints (phase and phoneme caps)
 */

import { describe, it, expect } from 'vitest';
import {
  clampByPhase,
  clampByPhaseAndPhoneme,
  PHONEME_SPEED_CAP,
  SPEED_NUM,
} from '../constraints';

describe('clampByPhase', () => {
  it('should clamp Phase 2 to n≤4 and speed≤med', () => {
    const result = clampByPhase(2, 6, 'fast', 0);
    expect(result.n).toBe(4);
    expect(result.speed).toBe('med');
  });

  it('should allow Phase 2 slow and med speeds', () => {
    const slow = clampByPhase(2, 3, 'slow', 0);
    expect(slow.speed).toBe('slow');

    const med = clampByPhase(2, 3, 'med', 0);
    expect(med.speed).toBe('med');
  });

  it('should clamp Phase 3 to n≤5 and speed≤med', () => {
    const result = clampByPhase(3, 6, 'fast', 0);
    expect(result.n).toBe(5);
    expect(result.speed).toBe('med');
  });

  it('should allow Phase 4 fast only with streak≥4', () => {
    const lowStreak = clampByPhase(4, 6, 'fast', 3);
    expect(lowStreak.speed).toBe('med');

    const highStreak = clampByPhase(4, 6, 'fast', 4);
    expect(highStreak.speed).toBe('fast');
  });

  it('should allow Phase 4 n=6', () => {
    const result = clampByPhase(4, 6, 'slow', 0);
    expect(result.n).toBe(6);
  });

  it('should allow Phase 5 fast unconditionally', () => {
    const result = clampByPhase(5, 6, 'fast', 0);
    expect(result.n).toBe(6);
    expect(result.speed).toBe('fast');
  });
});

describe('clampByPhaseAndPhoneme', () => {
  it('should apply both phase and phoneme caps', () => {
    // Phase 5 allows fast, but th-voiceless caps at med
    const result = clampByPhaseAndPhoneme({
      phase: 5,
      targetPhoneme: 'th-voiceless',
      requestedSpeed: 'fast',
      requestedN: 6,
      streak: 10,
    });

    expect(result.n).toBe(6);
    expect(result.speed).toBe('med'); // Phoneme cap wins
  });

  it('should use phase cap when stricter than phoneme cap', () => {
    // Phase 2 caps at med, sh allows fast
    const result = clampByPhaseAndPhoneme({
      phase: 2,
      targetPhoneme: 'sh',
      requestedSpeed: 'fast',
      requestedN: 5,
      streak: 10,
    });

    expect(result.n).toBe(4); // Phase 2 cap
    expect(result.speed).toBe('med'); // Phase 2 cap (stricter than phoneme)
  });

  it('should allow fast when both phase and phoneme permit', () => {
    // Phase 5 + sh (both allow fast)
    const result = clampByPhaseAndPhoneme({
      phase: 5,
      targetPhoneme: 'sh',
      requestedSpeed: 'fast',
      requestedN: 6,
      streak: 10,
    });

    expect(result.n).toBe(6);
    expect(result.speed).toBe('fast');
  });

  it('should handle unknown phonemes gracefully (default to fast)', () => {
    const result = clampByPhaseAndPhoneme({
      phase: 5,
      targetPhoneme: 'unknown-grapheme',
      requestedSpeed: 'fast',
      requestedN: 6,
      streak: 10,
    });

    expect(result.speed).toBe('fast'); // Defaults to fast for unknown
  });
});

describe('PHONEME_SPEED_CAP', () => {
  it('should cap challenging digraphs at med', () => {
    expect(PHONEME_SPEED_CAP['th-voiceless']).toBe('med');
    expect(PHONEME_SPEED_CAP['th-voiced']).toBe('med');
    expect(PHONEME_SPEED_CAP['ng']).toBe('med');
    expect(PHONEME_SPEED_CAP['wh']).toBe('med');
  });

  it('should allow fast for easier digraphs', () => {
    expect(PHONEME_SPEED_CAP['sh']).toBe('fast');
    expect(PHONEME_SPEED_CAP['ch']).toBe('fast');
    expect(PHONEME_SPEED_CAP['ck']).toBe('fast');
    expect(PHONEME_SPEED_CAP['ph']).toBe('fast');
  });

  it('should allow fast for single letters', () => {
    expect(PHONEME_SPEED_CAP['s']).toBe('fast');
    expect(PHONEME_SPEED_CAP['a']).toBe('fast');
    expect(PHONEME_SPEED_CAP['t']).toBe('fast');
  });
});

describe('SPEED_NUM mapping', () => {
  it('should have correct numeric ordering', () => {
    expect(SPEED_NUM.slow).toBe(0);
    expect(SPEED_NUM.med).toBe(1);
    expect(SPEED_NUM.fast).toBe(2);
  });
});
