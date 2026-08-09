import { describe, expect, it } from 'vitest';
import { classifyLeadAcquisition, deriveReferrerDomain } from '../../lib/leadAcquisition';

describe('leadAcquisition', () => {
  it('classifies organic Google from the referrer', () => {
    expect(
      classifyLeadAcquisition({ referrer: 'https://www.google.com/search?q=online+phonics+classes' }),
    ).toMatchObject({ channel: 'google_organic' });
  });

  it('classifies Google Ads from a gclid even when the landing UTM is missing', () => {
    expect(classifyLeadAcquisition({ gclid: 'abc123' })).toEqual({
      channel: 'google_ads',
      source: 'google',
      label: 'Google Ads',
    });
  });

  it('classifies social and referral sources', () => {
    expect(classifyLeadAcquisition({ utmSource: 'instagram', utmMedium: 'social' }).channel).toBe('instagram');
    expect(classifyLeadAcquisition({ referrerDomain: 'example-parent-blog.com' })).toMatchObject({
      channel: 'referral',
      source: 'example-parent-blog.com',
    });
  });

  it('keeps no-signal traffic as direct rather than pretending it is organic', () => {
    expect(classifyLeadAcquisition({})).toMatchObject({ channel: 'direct' });
  });

  it('normalizes referrer domains', () => {
    expect(deriveReferrerDomain('https://www.Google.com/search?q=phonics')).toBe('google.com');
  });
});
