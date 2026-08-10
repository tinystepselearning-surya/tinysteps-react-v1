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

  it('classifies Microsoft Ads from an msclkid', () => {
    expect(classifyLeadAcquisition({ msclkid: 'ms-123' })).toMatchObject({
      channel: 'microsoft_ads',
      label: 'Microsoft Ads',
    });
  });

  it('classifies social and referral sources', () => {
    expect(classifyLeadAcquisition({ utmSource: 'instagram', utmMedium: 'social' }).channel).toBe('instagram');
    expect(classifyLeadAcquisition({ utmSource: 'ig', utmMedium: 'social' }).channel).toBe('instagram');
    expect(classifyLeadAcquisition({ referrerDomain: 'l.instagram.com' }).channel).toBe('instagram');
    expect(classifyLeadAcquisition({ utmSource: 'fb', utmMedium: 'social' }).channel).toBe('facebook');
    expect(classifyLeadAcquisition({ utmSource: 'meta', utmMedium: 'social' }).channel).toBe('facebook');
    expect(classifyLeadAcquisition({ referrerDomain: 'l.facebook.com' }).channel).toBe('facebook');
    expect(classifyLeadAcquisition({ fbclid: 'fb-123' }).channel).toBe('facebook');
    expect(classifyLeadAcquisition({ referrerDomain: 'example-parent-blog.com' })).toMatchObject({
      channel: 'referral',
      source: 'example-parent-blog.com',
    });
  });

  it('does not treat short social aliases as arbitrary substrings', () => {
    expect(classifyLeadAcquisition({ utmSource: 'bigpartner' }).channel).toBe('other');
    expect(classifyLeadAcquisition({ referrerDomain: 'offers-fbtest.example' }).channel).toBe('referral');
    expect(classifyLeadAcquisition({ referrerDomain: 'indigostudio.example' }).channel).toBe('referral');
    expect(classifyLeadAcquisition({ referrerDomain: 'metacritic.com' }).channel).toBe('referral');
  });

  it('keeps no-signal traffic as direct rather than pretending it is organic', () => {
    expect(classifyLeadAcquisition({})).toMatchObject({ channel: 'direct' });
  });

  it('normalizes referrer domains', () => {
    expect(deriveReferrerDomain('https://www.Google.com/search?q=phonics')).toBe('google.com');
  });
});
