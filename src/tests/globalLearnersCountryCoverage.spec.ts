import { describe, expect, it } from 'vitest';
import {
  COUNTRY_COVERAGE_METADATA,
  getCountryCoverageMetadata,
  getCountryMapPoint,
} from '../lib/countryCoverage';

describe('global learner map country metadata', () => {
  it('supports a broad ISO country set rather than a ten-country allowlist', () => {
    expect(COUNTRY_COVERAGE_METADATA.length).toBeGreaterThan(200);
    expect(getCountryCoverageMetadata('CA')?.name).toBe('Canada');
    expect(getCountryCoverageMetadata('QA')?.name).toBe('Qatar');
    expect(getCountryCoverageMetadata('NZ')?.name).toBe('New Zealand');
  });

  it('can place Canada and arbitrary supported countries on the world map', () => {
    const canada = getCountryMapPoint('CA');
    const qatar = getCountryMapPoint('QA');

    expect(canada).not.toBeNull();
    expect(qatar).not.toBeNull();
    expect(canada!.x).toBeGreaterThan(2);
    expect(canada!.x).toBeLessThan(98);
    expect(qatar!.y).toBeGreaterThan(6);
    expect(qatar!.y).toBeLessThan(94);
  });
});
