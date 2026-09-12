import { describe, expect, it } from 'vitest';
import {
  PHONE_COUNTRY_OPTIONS,
  findPhoneCountryOptionByCallingCode,
  searchPhoneCountryOptions,
} from './phoneCountryOptions';

describe('phoneCountryOptions', () => {
  it('contains broad international calling-code coverage including Poland', () => {
    expect(PHONE_COUNTRY_OPTIONS.length).toBeGreaterThan(200);
    expect(PHONE_COUNTRY_OPTIONS.find((option) => option.id === 'PL')).toMatchObject({
      code: '+48',
      name: 'Poland',
    });
  });

  it('searches by country name, common alias, ISO code, and calling code', () => {
    expect(searchPhoneCountryOptions('India')[0]).toMatchObject({ id: 'IN', code: '+91' });
    expect(searchPhoneCountryOptions('USA').some((option) => option.id === 'US')).toBe(true);
    expect(searchPhoneCountryOptions('United States').some((option) => option.id === 'US')).toBe(true);
    expect(searchPhoneCountryOptions('+48').some((option) => option.id === 'PL')).toBe(true);
    expect(searchPhoneCountryOptions('PL').some((option) => option.id === 'PL')).toBe(true);
  });

  it('prefers an explicit country when multiple countries share a calling code', () => {
    expect(findPhoneCountryOptionByCallingCode('+1', 'CA')).toMatchObject({ id: 'CA', code: '+1' });
    expect(findPhoneCountryOptionByCallingCode('+1', 'US')).toMatchObject({ id: 'US', code: '+1' });
  });

  it('stores calling codes as plus-prefixed digits only', () => {
    for (const option of PHONE_COUNTRY_OPTIONS) {
      expect(option.code).toMatch(/^\+\d+$/);
    }
  });
});
