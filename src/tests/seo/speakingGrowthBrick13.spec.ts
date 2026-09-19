import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  classifyLeadAcquisition,
  resolveStoredLeadAcquisition,
} from '../../lib/leadAcquisition';
import { buildLeadAttributionDisplay } from '../../lib/leadAttributionDisplay';
import {
  buildSpeakingAttributionProjection,
  getSpeakingLeadFirstTouch,
  isSpeakingInterestLead,
  isSpeakingLeadAdmitted,
  isSpeakingOriginLead,
  SPEAKING_ATTRIBUTION_MEASUREMENT,
  SPEAKING_ATTRIBUTION_ORIGIN_PATHS,
  SPEAKING_ATTRIBUTION_REVISION,
} from '../../lib/speakingAttribution';

const root = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');

const serverEnrichmentSource = read('functions/src/enrichPublicLeadAttribution.ts');
const lifecycleSource = read('functions/src/leadLifecycle.ts');
const publicLeadFormSource = read('src/lib/publicLeadForm.ts');
const leadSourceAnalysisSource = read('src/pages/admin/LeadSourceAnalysis.tsx');
const routesSource = read('src/app/routes.tsx');
const routeManifestSource = read('src/lib/publicRouteManifest.js');

describe('Speaking growth Brick 13 search-to-lead-to-admission attribution', () => {
  it('freezes a bounded Speaking attribution territory without generic decision pages', () => {
    expect(SPEAKING_ATTRIBUTION_REVISION).toBe('2026-09-19-b13-v1');
    expect(SPEAKING_ATTRIBUTION_ORIGIN_PATHS).toHaveLength(22);
    expect(new Set(SPEAKING_ATTRIBUTION_ORIGIN_PATHS).size).toBe(22);

    for (const path of [
      '/speaking',
      '/spoken-english-classes-for-kids-online',
      '/confidence-building-program-kids',
      '/courses/public-speaking-foundations',
      '/courses/public-speaking-excellence',
      '/speaking-progress-framework',
      '/resources/speaking',
      '/shy-child-speaking-confidence',
      '/blog/child-gives-one-word-answers',
      '/blog/speaking-structure',
      '/blog/public-speaking-delivery-for-kids',
    ]) {
      expect(SPEAKING_ATTRIBUTION_ORIGIN_PATHS).toContain(path);
    }

    expect(SPEAKING_ATTRIBUTION_ORIGIN_PATHS).not.toContain('/book-demo');
    expect(SPEAKING_ATTRIBUTION_ORIGIN_PATHS).not.toContain('/pricing');
    expect(SPEAKING_ATTRIBUTION_ORIGIN_PATHS).not.toContain('/class-samples');
    expect(SPEAKING_ATTRIBUTION_ORIGIN_PATHS).not.toContain('/team');
  });

  it('recognizes current ChatGPT referral UTMs and historical other-channel rows', () => {
    expect(
      classifyLeadAcquisition({ utmSource: 'chatgpt.com' }),
    ).toMatchObject({
      channel: 'chatgpt',
      label: 'ChatGPT / OpenAI',
    });

    expect(
      resolveStoredLeadAcquisition({
        acquisitionChannel: 'other',
        acquisitionSource: 'chatgpt.com',
        utmSource: 'chatgpt.com',
      }),
    ).toMatchObject({
      channel: 'chatgpt',
      label: 'ChatGPT / OpenAI',
    });

    expect(
      buildLeadAttributionDisplay({
        acquisitionChannel: 'other',
        acquisitionSource: 'chatgpt.com',
        attribution: { utm_source: 'chatgpt.com' },
      }).acquisitionLabel,
    ).toBe('ChatGPT / OpenAI');
  });

  it('keeps paid click identifiers stronger than AI/source labels', () => {
    expect(
      classifyLeadAcquisition({
        utmSource: 'chatgpt.com',
        gclid: 'test-google-click',
      }),
    ).toMatchObject({
      channel: 'google_ads',
      label: 'Google Ads',
    });

    expect(
      resolveStoredLeadAcquisition({
        acquisitionChannel: 'chatgpt',
        acquisitionSource: 'chatgpt.com',
        utmSource: 'chatgpt.com',
        gclid: 'test-google-click',
      }),
    ).toMatchObject({
      channel: 'google_ads',
      label: 'Google Ads',
    });

    expect(
      buildSpeakingAttributionProjection({
        landingPage: '/speaking',
        attribution: {
          utm_source: 'chatgpt.com',
          gclid: 'test-google-click',
        },
      }).businessChannel,
    ).toBe('paid');
  });

  it('maps a ChatGPT-origin Speaking admission without mixing it into organic search', () => {
    const projection = buildSpeakingAttributionProjection({
      status: 'admitted_confirmed',
      programInterest: 'Speaking',
      interestTrack: 'public_speaking',
      landingPage: '/speaking',
      acquisitionChannel: 'other',
      acquisitionSource: 'chatgpt.com',
      attribution: {
        landingPage: '/speaking',
        conversionPage: '/book-demo',
        utm_source: 'chatgpt.com',
      },
    });

    expect(projection).toMatchObject({
      landingPage: '/speaking',
      conversionPage: '/book-demo',
      businessChannel: 'organic_ai',
      speakingOrigin: true,
      speakingInterest: true,
      reachedDemo: true,
      admitted: true,
      attributionEvidence: 'stored_first_touch',
    });
    expect(projection.diagnosticAcquisition.channel).toBe('chatgpt');
  });

  it('keeps Speaking origin and Speaking interest as separate cohorts', () => {
    const originOnly = {
      landingPage: '/blog/speaking-structure',
      programInterest: 'Grammar',
      interestTrack: 'grammar',
    };
    expect(isSpeakingOriginLead(originOnly)).toBe(true);
    expect(isSpeakingInterestLead(originOnly)).toBe(false);

    const interestOnly = {
      landingPage: '/',
      programInterest: 'Speaking',
      interestTrack: 'public_speaking',
    };
    expect(isSpeakingOriginLead(interestOnly)).toBe(false);
    expect(isSpeakingInterestLead(interestOnly)).toBe(true);

    const genericDecisionPage = {
      landingPage: '/book-demo',
      programInterest: 'Speaking',
    };
    expect(isSpeakingOriginLead(genericDecisionPage)).toBe(false);
    expect(isSpeakingInterestLead(genericDecisionPage)).toBe(true);
  });

  it('uses admitted_confirmed as the admission truth and does not promote earlier stages', () => {
    expect(isSpeakingLeadAdmitted({ status: 'admitted_confirmed' })).toBe(true);
    for (const status of [
      'new',
      'qualified',
      'demo_pending_schedule',
      'demo_booked',
      'demo_completed',
      'admission_follow_up',
    ]) {
      expect(isSpeakingLeadAdmitted({ status })).toBe(false);
    }

    expect(lifecycleSource).toContain(
      "if (conversion === 'enrolled') return 'admitted_confirmed';",
    );
  });

  it('normalizes the real stored snake-case first-touch fields for the C0 business classifier', () => {
    const firstTouch = getSpeakingLeadFirstTouch({
      landingPage: '/speaking?utm_source=google',
      attribution: {
        firstSeenAt: '2026-09-19T10:00:00.000Z',
        referrerDomain: 'www.google.co.in',
        utm_source: 'google',
        utm_medium: 'organic',
        utm_campaign: 'speaking',
      },
    });

    expect(firstTouch).toEqual({
      landingPage: '/speaking',
      firstSeenAt: '2026-09-19T10:00:00.000Z',
      referrer: null,
      referrerDomain: 'www.google.co.in',
      utmSource: 'google',
      utmMedium: 'organic',
      utmCampaign: 'speaking',
      utmTerm: null,
      utmContent: null,
      gclid: null,
      fbclid: null,
      msclkid: null,
    });

    expect(
      buildSpeakingAttributionProjection({
        landingPage: '/speaking',
        attribution: {
          referrerDomain: 'www.google.co.in',
          utm_source: 'google',
          utm_medium: 'organic',
        },
      }).businessChannel,
    ).toBe('organic_search');
  });

  it('does not guess missing historical attribution as organic', () => {
    expect(
      buildSpeakingAttributionProjection({
        status: 'admitted_confirmed',
        programInterest: 'Speaking',
      }),
    ).toMatchObject({
      businessChannel: 'direct_or_unknown',
      speakingOrigin: false,
      speakingInterest: true,
      admitted: true,
      attributionEvidence: 'missing',
    });
  });

  it('falls back to a stored normalized first-touch channel when raw legacy fields are incomplete', () => {
    expect(
      buildSpeakingAttributionProjection({
        status: 'admitted_confirmed',
        acquisitionChannel: 'chatgpt',
        acquisitionSource: 'chatgpt.com',
        programInterest: 'Speaking',
      }),
    ).toMatchObject({
      businessChannel: 'organic_ai',
      admitted: true,
      attributionEvidence: 'stored_first_touch',
    });

    expect(
      buildSpeakingAttributionProjection({
        acquisitionChannel: 'google_organic',
        acquisitionSource: 'google.co.in',
      }),
    ).toMatchObject({
      businessChannel: 'organic_search',
      attributionEvidence: 'stored_first_touch',
    });

    expect(
      buildSpeakingAttributionProjection({
        acquisitionChannel: 'instagram',
        acquisitionSource: 'instagram.com',
      }),
    ).toMatchObject({
      businessChannel: 'referral',
      attributionEvidence: 'stored_first_touch',
    });
  });

  it('prohibits query-level admission claims and keeps cohort maturity explicit', () => {
    expect(SPEAKING_ATTRIBUTION_MEASUREMENT.causalityPolicy).toMatchObject({
      queryToLeadJoinAvailable: false,
      queryToAdmissionJoinAllowed: false,
      landingPageToLeadJoinAvailable: true,
      landingPageToAdmissionJoinAvailable: true,
    });
    expect(SPEAKING_ATTRIBUTION_MEASUREMENT.cohortPolicy).toMatchObject({
      originAndInterestMustStaySeparate: true,
      firstTouchOnly: true,
      admissionCohortMaturityDays: 28,
    });
    expect(SPEAKING_ATTRIBUTION_MEASUREMENT.channelPolicy).toMatchObject({
      organicSearch: 'organic_search',
      organicAi: 'organic_ai',
      aiReportedSeparatelyFromSearch: true,
      paidOverridesOrganic: true,
      unattributedBackfilledAsOrganic: false,
    });
  });

  it('persists AI channels server-side instead of collapsing them into other', () => {
    for (const channel of [
      "'chatgpt'",
      "'google_gemini'",
      "'perplexity'",
      "'microsoft_copilot'",
      "'claude'",
    ]) {
      expect(serverEnrichmentSource).toContain(channel);
    }

    for (const source of [
      "'chatgpt.com'",
      "'gemini.google.com'",
      "'perplexity.ai'",
      "'copilot.microsoft.com'",
      "'claude.ai'",
    ]) {
      expect(serverEnrichmentSource).toContain(source);
    }

    expect(serverEnrichmentSource).toContain(
      "return { channel: 'chatgpt', source: source || referrerDomain || 'chatgpt' };",
    );
  });

  it('keeps first-touch capture and server enrichment on the canonical lead record', () => {
    expect(publicLeadFormSource).toContain("source: 'website'");
    expect(publicLeadFormSource).toContain(
      'Full first-touch attribution is written server-side after the lead is created.',
    );
    expect(serverEnrichmentSource).toContain('acquisitionChannel: acquisition.channel');
    expect(serverEnrichmentSource).toContain('landingPage: attribution.landingPage');
    expect(serverEnrichmentSource).toContain('conversionPage: attribution.conversionPage');
    expect(serverEnrichmentSource).toContain('attributionEnrichedAt');
  });

  it('adds Speaking attribution cohorts to the existing admin read path without a new analytics collection', () => {
    expect(leadSourceAnalysisSource).toContain("type AttributionCohort = 'all' | 'speaking_origin' | 'speaking_interest'");
    expect(leadSourceAnalysisSource).toContain("label: 'Speaking origin'");
    expect(leadSourceAnalysisSource).toContain("label: 'Speaking interest'");
    expect(leadSourceAnalysisSource).toContain('isSpeakingOriginLead(lead)');
    expect(leadSourceAnalysisSource).toContain('isSpeakingInterestLead(lead)');
    expect(leadSourceAnalysisSource).toContain('buildSpeakingAttributionProjection(lead).businessChannel');
    expect(leadSourceAnalysisSource).toContain('Organic AI');
    expect(leadSourceAnalysisSource).toContain(
      'GSC query visibility is reviewed separately',
    );
    expect(leadSourceAnalysisSource).toContain("collection(db, 'leads')");
    expect(leadSourceAnalysisSource).not.toContain("collection(db, 'analytics')");
    expect(leadSourceAnalysisSource).not.toContain("collection(db, 'blogAnalytics')");
  });

  it('creates no new public attribution, search or AI route', () => {
    for (const forbidden of [
      'speaking-attribution',
      'search-to-admission',
      'speaking-conversions',
      'chatgpt-leads',
      'google-leads',
    ]) {
      expect(routesSource).not.toContain(forbidden);
      expect(routeManifestSource).not.toContain(forbidden);
    }
  });
});
