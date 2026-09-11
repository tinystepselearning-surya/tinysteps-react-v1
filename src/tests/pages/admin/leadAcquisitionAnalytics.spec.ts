import { describe, expect, it } from 'vitest';
import {
  acquisitionGroupLabel,
  attributionDetail,
  detectAnswerEngine,
  percentagePointDelta,
  resolveAcquisitionAnalytics,
} from '../../../pages/admin/leadAcquisitionAnalytics';

describe('lead acquisition analytics', () => {
  it('recognizes answer engines only from explicit source/referrer evidence', () => {
    expect(detectAnswerEngine({
      id: 'chatgpt',
      attribution: { referrerDomain: 'chatgpt.com' },
    })).toEqual({ key: 'chatgpt', label: 'ChatGPT' });

    expect(detectAnswerEngine({
      id: 'perplexity',
      attribution: { referrer: 'https://www.perplexity.ai/search/example' },
    })).toEqual({ key: 'perplexity', label: 'Perplexity' });

    expect(detectAnswerEngine({
      id: 'gemini',
      attribution: { referrerDomain: 'gemini.google.com' },
    })).toEqual({ key: 'gemini', label: 'Gemini' });

    expect(detectAnswerEngine({
      id: 'google',
      attribution: { referrerDomain: 'google.com' },
    })).toBeNull();

    expect(detectAnswerEngine({
      id: 'openai-root',
      attribution: { referrerDomain: 'openai.com' },
    })).toBeNull();
  });

  it('normalizes answer-engine reporting while retaining raw first-touch source', () => {
    const resolved = resolveAcquisitionAnalytics({
      id: 'lead-1',
      acquisitionChannel: 'referral',
      acquisitionSource: 'chatgpt.com',
      attribution: {
        referrerDomain: 'chatgpt.com',
        utm_campaign: 'phonics_answer_engine',
      },
    });

    expect(resolved).toMatchObject({
      key: 'ai:chatgpt',
      label: 'ChatGPT',
      group: 'ai_answer_engines',
      rawSource: 'chatgpt.com',
    });
  });

  it('keeps Other campaign grouped but makes its raw UTM values inspectable', () => {
    const lead = {
      id: 'lead-2',
      acquisitionChannel: 'other' as const,
      acquisitionSource: 'newsletter_partner',
      landingPage: '/phonics',
      attribution: {
        utm_source: 'newsletter_partner',
        utm_medium: 'email',
        utm_campaign: 'sep_launch',
        referrerDomain: 'partner.example',
      },
    };

    expect(resolveAcquisitionAnalytics(lead)).toMatchObject({
      key: 'other_campaign',
      label: 'Other campaign',
      group: 'other_campaign',
    });
    expect(attributionDetail(lead)).toEqual({
      rawSource: 'newsletter_partner',
      utmSource: 'newsletter_partner',
      utmMedium: 'email',
      utmCampaign: 'sep_launch',
      referrerDomain: 'partner.example',
      landingPage: '/phonics',
    });
  });

  it('separates organic, paid, social, direct, referral and legacy groups', () => {
    expect(resolveAcquisitionAnalytics({ id: 'organic', acquisitionChannel: 'google_organic' }).group).toBe('organic_search');
    expect(resolveAcquisitionAnalytics({ id: 'paid', acquisitionChannel: 'google_ads' }).group).toBe('paid');
    expect(resolveAcquisitionAnalytics({ id: 'social', acquisitionChannel: 'instagram' }).group).toBe('social');
    expect(resolveAcquisitionAnalytics({ id: 'direct', acquisitionChannel: 'direct' }).group).toBe('direct');
    expect(resolveAcquisitionAnalytics({ id: 'referral', acquisitionChannel: 'referral', acquisitionSource: 'example.com' }).group).toBe('referral');
    expect(resolveAcquisitionAnalytics({ id: 'legacy', source: 'whatsapp' }).group).toBe('legacy_unattributed');
    expect(acquisitionGroupLabel('ai_answer_engines')).toBe('AI / Answer Engines');
  });

  it('benchmarks source conversion in percentage points', () => {
    expect(percentagePointDelta(2, 20, 5, 100)).toBeCloseTo(5);
    expect(percentagePointDelta(0, 0, 5, 100)).toBe(0);
  });
});
