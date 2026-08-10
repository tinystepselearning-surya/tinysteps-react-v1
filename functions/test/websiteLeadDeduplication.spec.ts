import { describe, expect, it } from 'vitest';
import {
  buildWebsiteLeadIdentityKey,
  normalizeWebsiteLeadChildName,
  normalizeWebsiteLeadPhone,
} from '../src/websiteLeadDeduplication';

describe('website lead deduplication identity', () => {
  it('normalizes Indian +91 and local mobile formats to the same phone identity', () => {
    expect(normalizeWebsiteLeadPhone('+91 87221 06429')).toBe('8722106429');
    expect(normalizeWebsiteLeadPhone('8722106429')).toBe('8722106429');

    expect(
      buildWebsiteLeadIdentityKey('+91 87221 06429', 'RITHANYAA'),
    ).toBe(
      buildWebsiteLeadIdentityKey('8722106429', 'Rithanyaa'),
    );
  });

  it('normalizes child-name case, whitespace, punctuation, and diacritics', () => {
    expect(normalizeWebsiteLeadChildName('  Déepthi Magizhini ')).toBe('deepthimagizhini');
    expect(normalizeWebsiteLeadChildName('Deepthi-Magizhini')).toBe('deepthimagizhini');
  });

  it('keeps different children on the same parent phone as distinct leads', () => {
    const first = buildWebsiteLeadIdentityKey('9876543210', 'Aarav');
    const second = buildWebsiteLeadIdentityKey('9876543210', 'Anaya');

    expect(first).not.toBe(second);
  });

  it('refuses to create an identity from incomplete data', () => {
    expect(buildWebsiteLeadIdentityKey('', 'Rithanyaa')).toBeNull();
    expect(buildWebsiteLeadIdentityKey('123', 'Rithanyaa')).toBeNull();
    expect(buildWebsiteLeadIdentityKey('9876543210', '')).toBeNull();
  });

  it('uses a stable non-PII document key', () => {
    const key = buildWebsiteLeadIdentityKey('9876543210', 'Rithanyaa');
    expect(key).toMatch(/^[a-f0-9]{64}$/);
    expect(key).not.toContain('9876543210');
    expect(key).not.toContain('rithanyaa');
  });
});
