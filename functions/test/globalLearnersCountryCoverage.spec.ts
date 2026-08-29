import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  resolveCountryFromParentDoc,
  resolveCountryName,
} from '../src/helpers/parentCountryCoverage';

describe('global learner country coverage', () => {
  it('uses canonical ISO countryCode before any phone inference', () => {
    expect(resolveCountryFromParentDoc({
      countryCode: 'CA',
      phoneCountryCode: '+1',
      phoneLocal: '2125550100',
    })).toMatchObject({ countryCode: 'CA', source: 'iso' });
  });

  it('distinguishes Canada from the US inside the +1 numbering plan', () => {
    expect(resolveCountryFromParentDoc({
      phoneCountryCode: '+1',
      phoneLocal: '4165550100',
    })).toMatchObject({ countryCode: 'CA', source: 'phone-country-code' });

    expect(resolveCountryFromParentDoc({
      phoneCountryCode: '+1',
      phoneLocal: '2125550100',
    })).toMatchObject({ countryCode: 'US', source: 'phone-country-code' });
  });

  it('preserves other NANP territories instead of collapsing all +1 numbers to the US', () => {
    expect(resolveCountryFromParentDoc({
      phoneCountryCode: '+1',
      phoneLocal: '2425550100',
    })).toMatchObject({ countryCode: 'BS', source: 'phone-country-code' });
  });

  it('supports countries beyond the original ten-code allowlist', () => {
    expect(resolveCountryFromParentDoc({
      phoneCountryCode: '+974',
      phoneLocal: '55550100',
    })).toMatchObject({ countryCode: 'QA', source: 'phone-country-code' });
    expect(resolveCountryName('QA')).toBe('Qatar');
  });

  it('can infer legacy E.164 phone values when structured calling-code fields are missing', () => {
    expect(resolveCountryFromParentDoc({ phone: '+14165550100' }))
      .toMatchObject({ countryCode: 'CA', source: 'full-phone' });
    expect(resolveCountryFromParentDoc({ phone: '+919876543210' }))
      .toMatchObject({ countryCode: 'IN', source: 'full-phone' });
  });

  it('keeps archived parents in historical coverage while still excluding deleted records', () => {
    const source = readFileSync(
      join(process.cwd(), 'functions/src/scheduled/globalLearnersRollup.ts'),
      'utf8',
    );

    expect(source).toContain("const EXCLUDED_PARENT_STATUSES = new Set(['deleted', 'disabled'])");
    expect(source).toContain("normalizeStatus(data.status) === 'archived'");
    expect(source).toContain('archivedFamiliesIncluded += 1');
    expect(source).toContain("coverageDefinition: 'active_archived_and_completed_parent_families_excluding_deleted_test_and_system_records'");
  });
});
