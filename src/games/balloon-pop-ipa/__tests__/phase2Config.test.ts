/**
 * Tests for Phase 2 configuration utilities
 */

import { describe, it, expect } from 'vitest';
import {
  parsePhase2Config,
  GRAPHEME_SETS,
  speedToMs,
  starsFromErrors,
} from '../phase2Config';

describe('parsePhase2Config', () => {
  it('should parse default config with no params', () => {
    const params = new URLSearchParams('');
    const config = parsePhase2Config(params);

    expect(config.set).toBe('sat');
    expect(config.n).toBe(3);
    expect(config.speed).toBe('slow');
    expect(config.adaptive).toBe(true);
    expect(config.levelId).toBe('p2-bp-01');
    expect(config.debug).toBe(false);
  });

  it('should parse all custom params', () => {
    const params = new URLSearchParams(
      'set=pin&n=5&speed=fast&adaptive=0&levelId=p2-bp-02&debug=1'
    );
    const config = parsePhase2Config(params);

    expect(config.set).toBe('pin');
    expect(config.n).toBe(5);
    expect(config.speed).toBe('fast');
    expect(config.adaptive).toBe(false);
    expect(config.levelId).toBe('p2-bp-02');
    expect(config.debug).toBe(true);
  });

  it('should clamp n to valid range (3-6)', () => {
    const tooLow = new URLSearchParams('n=2');
    expect(parsePhase2Config(tooLow).n).toBe(3);

    const tooHigh = new URLSearchParams('n=10');
    expect(parsePhase2Config(tooHigh).n).toBe(6);

    const valid = new URLSearchParams('n=4');
    expect(parsePhase2Config(valid).n).toBe(4);
  });

  it('should only accept valid grapheme sets', () => {
    const invalid = new URLSearchParams('set=invalid');
    expect(parsePhase2Config(invalid).set).toBe('sat'); // fallback

    const valid = new URLSearchParams('set=satpin');
    expect(parsePhase2Config(valid).set).toBe('satpin');
  });

  it('should only accept valid speeds', () => {
    const invalid = new URLSearchParams('speed=normal');
    expect(parsePhase2Config(invalid).speed).toBe('slow'); // fallback

    const valid = new URLSearchParams('speed=med');
    expect(parsePhase2Config(valid).speed).toBe('med');
  });
});

describe('GRAPHEME_SETS', () => {
  it('should have all expected sets', () => {
    expect(GRAPHEME_SETS.sat).toBeDefined();
    expect(GRAPHEME_SETS.pin).toBeDefined();
    expect(GRAPHEME_SETS.satpin).toBeDefined();
    expect(GRAPHEME_SETS.mixed).toBeDefined();
  });

  it('sat set should have correct graphemes', () => {
    expect(GRAPHEME_SETS.sat.graphemes).toEqual(['s', 'a', 't']);
  });

  it('pin set should have correct graphemes', () => {
    expect(GRAPHEME_SETS.pin.graphemes).toEqual(['p', 'i', 'n']);
  });

  it('satpin set should combine both', () => {
    expect(GRAPHEME_SETS.satpin.graphemes).toEqual(['s', 'a', 't', 'p', 'i', 'n']);
  });

  it('mixed set should have unique graphemes', () => {
    const mixed = GRAPHEME_SETS.mixed.graphemes;
    const unique = [...new Set(mixed)];
    expect(mixed.length).toBe(unique.length);
  });
});

describe('speedToMs', () => {
  it('should map speeds to correct milliseconds', () => {
    expect(speedToMs('slow')).toBe(8000);
    expect(speedToMs('med')).toBe(6000);
    expect(speedToMs('fast')).toBe(4000);
  });
});

describe('starsFromErrors', () => {
  it('should give 3 stars for 0-1 errors', () => {
    expect(starsFromErrors(0)).toBe(3);
    expect(starsFromErrors(1)).toBe(3);
  });

  it('should give 2 stars for 2-3 errors', () => {
    expect(starsFromErrors(2)).toBe(2);
    expect(starsFromErrors(3)).toBe(2);
  });

  it('should give 1 star for 4+ errors', () => {
    expect(starsFromErrors(4)).toBe(1);
    expect(starsFromErrors(10)).toBe(1);
    expect(starsFromErrors(100)).toBe(1);
  });
});
