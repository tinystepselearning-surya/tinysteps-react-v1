import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { SEMANTIC_FACTS } from '../../config/semanticFacts';
import { KNOWLEDGE_BASE_FINAL_STATUS } from '../../lib/knowledgeBaseFinalClosure.js';
import {
  COMMERCIAL_C0_EVENT_CONTRACT,
  COMMERCIAL_C0_FACTS,
  COMMERCIAL_C0_GUARDRAILS,
  COMMERCIAL_C0_MEASUREMENT,
  COMMERCIAL_C0_QUALIFYING_STATUSES,
  COMMERCIAL_C0_REVISION,
  COMMERCIAL_C0_SOURCES,
  COMMERCIAL_C0_STATUS,
  COMMERCIAL_C0_TERMINAL_NON_QUALIFIED_STATUSES,
  classifyCommercialAcquisitionChannel,
  getCommercialC0Snapshot,
  isCommercialQualifiedLeadStatus,
  isQualifiedAiReferralLead,
  isQualifiedOrganicLead,
} from '../../lib/commercialC0Foundation';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('Commercial C0 revenue measurement and commercial facts', () => {
  it('starts only after the knowledge base is fully frozen', () => {
    expect(KNOWLEDGE_BASE_FINAL_STATUS).toBe('frozen');
    expect(COMMERCIAL_C0_REVISION).toBe('2026-09-10-c0');
    expect(COMMERCIAL_C0_STATUS).toBe('frozen');
    expect(COMMERCIAL_C0_GUARDRAILS.knowledgeBaseMustRemainFrozen).toBe(true);
    expect(COMMERCIAL_C0_GUARDRAILS.commercialKeywordResearchBeginsAt).toBe('C1');
    expect(COMMERCIAL_C0_GUARDRAILS.canonicalCommercialOwnershipBeginsAt).toBe('C2');
  });

  it('projects commercial facts from the semantic facts source of truth', () => {
    expect(COMMERCIAL_C0_SOURCES.commercialFacts).toBe('src/config/semanticFacts.ts');
    expect(COMMERCIAL_C0_FACTS.audience.coreAgeMin).toBe(SEMANTIC_FACTS.audience.coreAgeMin);
    expect(COMMERCIAL_C0_FACTS.audience.coreAgeMax).toBe(SEMANTIC_FACTS.audience.coreAgeMax);
    expect(COMMERCIAL_C0_FACTS.delivery.oneToOneDurationMinutes).toBe(
      SEMANTIC_FACTS.delivery.standardOneToOne.durationMinutes,
    );
    expect(COMMERCIAL_C0_FACTS.delivery.assessmentDurationMinutes).toBe(
      SEMANTIC_FACTS.delivery.assessment.durationMinutes,
    );
    expect(COMMERCIAL_C0_FACTS.delivery.assessmentPriceInr).toBe(0);
    expect(COMMERCIAL_C0_FACTS.pricing.standardOneToOnePerClassInr).toBe(
      SEMANTIC_FACTS.pricing.standardOneToOnePerClassInr,
    );
    expect(COMMERCIAL_C0_FACTS.programmes.phonics.commercialPath).toBe('/phonics');
    expect(COMMERCIAL_C0_FACTS.programmes.grammar.commercialPath).toBe('/grammar');
    expect(COMMERCIAL_C0_FACTS.programmes.speaking.commercialPath).toBe('/speaking');
  });

  it('defines qualified lead status at the canonical lifecycle layer, not at the click/event layer', () => {
    expect(COMMERCIAL_C0_QUALIFYING_STATUSES).toEqual([
      'qualified',
      'demo_pending_schedule',
      'demo_booked',
      'demo_completed',
      'admission_follow_up',
      'admitted_confirmed',
    ]);
    expect(COMMERCIAL_C0_TERMINAL_NON_QUALIFIED_STATUSES).toEqual([
      'not_interested',
      'wrong_fit',
      'no_response',
      'lost',
    ]);
    expect(isCommercialQualifiedLeadStatus('qualified')).toBe(true);
    expect(isCommercialQualifiedLeadStatus('demo_booked')).toBe(true);
    expect(isCommercialQualifiedLeadStatus('contacted')).toBe(false);
    expect(isCommercialQualifiedLeadStatus('wrong_fit')).toBe(false);

    expect(COMMERCIAL_C0_EVENT_CONTRACT.submission).toContain('lead_form_submit');
    expect(COMMERCIAL_C0_EVENT_CONTRACT.submission).toContain('generate_lead');
    expect(COMMERCIAL_C0_EVENT_CONTRACT.rule).toContain('must never be reported as qualified leads');
  });

  it('classifies organic search, AI referral, paid, referral and unknown deterministically', () => {
    expect(classifyCommercialAcquisitionChannel({ referrerDomain: 'www.google.com' })).toBe('organic_search');
    expect(classifyCommercialAcquisitionChannel({ referrerDomain: 'www.bing.com' })).toBe('organic_search');
    expect(classifyCommercialAcquisitionChannel({ utmMedium: 'organic', utmSource: 'google' })).toBe('organic_search');
    expect(classifyCommercialAcquisitionChannel({ referrerDomain: 'chatgpt.com' })).toBe('organic_ai');
    expect(classifyCommercialAcquisitionChannel({ utmSource: 'perplexity', utmMedium: 'referral' })).toBe('organic_ai');
    expect(classifyCommercialAcquisitionChannel({ gclid: 'abc', referrerDomain: 'www.google.com' })).toBe('paid');
    expect(classifyCommercialAcquisitionChannel({ utmMedium: 'cpc', utmSource: 'bing' })).toBe('paid');
    expect(classifyCommercialAcquisitionChannel({ referrerDomain: 'example.com' })).toBe('referral');
    expect(classifyCommercialAcquisitionChannel({})).toBe('direct_or_unknown');
  });

  it('counts only qualified organic-search records in the primary KPI and keeps AI separate', () => {
    expect(
      isQualifiedOrganicLead({
        status: 'qualified',
        attribution: { referrerDomain: 'google.co.in' },
      }),
    ).toBe(true);
    expect(
      isQualifiedOrganicLead({
        status: 'contacted',
        attribution: { referrerDomain: 'google.co.in' },
      }),
    ).toBe(false);
    expect(
      isQualifiedOrganicLead({
        status: 'demo_booked',
        attribution: { gclid: 'paid-click', referrerDomain: 'google.com' },
      }),
    ).toBe(false);
    expect(
      isQualifiedAiReferralLead({
        status: 'demo_pending_schedule',
        attribution: { referrerDomain: 'chatgpt.com' },
      }),
    ).toBe(true);
    expect(COMMERCIAL_C0_MEASUREMENT.reporting.aiReferralPolicy).toBe('report-separately');
  });

  it('locks the declared baseline, sustained target and reporting windows', () => {
    expect(COMMERCIAL_C0_MEASUREMENT.primaryKpi).toBe('qualified_organic_leads_per_day');
    expect(COMMERCIAL_C0_MEASUREMENT.countingUnit).toBe('distinct canonical lead record');
    expect(COMMERCIAL_C0_MEASUREMENT.timezone).toBe('Asia/Kolkata');
    expect(COMMERCIAL_C0_MEASUREMENT.baseline).toMatchObject({
      minPerDay: 6,
      maxPerDay: 7,
      kind: 'declared planning baseline',
    });
    expect(COMMERCIAL_C0_MEASUREMENT.target).toMatchObject({
      minPerDay: 11,
      maxPerDay: 12,
      requirement: 'sustained',
    });
    expect(COMMERCIAL_C0_MEASUREMENT.reporting.monitoringWindowDays).toBe(7);
    expect(COMMERCIAL_C0_MEASUREMENT.reporting.decisionWindowDays).toBe(28);
    expect(COMMERCIAL_C0_MEASUREMENT.reporting.unattributedPolicy).toBe('do-not-backfill-as-organic');
  });

  it('verifies that the existing runtime actually captures the attribution and funnel fields C0 depends on', () => {
    const conversionTracking = read('src/lib/conversionTracking.ts');
    const analytics = read('src/lib/analytics.ts');
    const leadLifecycle = read('functions/src/leadLifecycle.ts');

    for (const token of [
      'LEAD_ATTRIBUTION_STORAGE_KEY',
      'landingPage',
      'firstSeenAt',
      'referrerDomain',
      'utmSource',
      'utmMedium',
      'utmCampaign',
      'gclid',
      'fbclid',
      'msclkid',
      'buildLeadAttributionPayload',
      "trackEvent('lead_form_submit'",
      "trackEvent('generate_lead'",
      "trackEvent('book_demo_click'",
      "trackEvent('whatsapp_click'",
    ]) {
      expect(conversionTracking, token).toContain(token);
    }

    expect(analytics).toContain("location.hostname !== 'tinystepslearning.com'");
    expect(analytics).toContain('isPublicAnalyticsPath(location.pathname)');

    for (const status of [
      "| 'qualified'",
      "| 'demo_pending_schedule'",
      "| 'demo_booked'",
      "| 'demo_completed'",
      "| 'admission_follow_up'",
      "| 'admitted_confirmed'",
      "| 'wrong_fit'",
      "| 'no_response'",
      "| 'lost'",
    ]) {
      expect(leadLifecycle, status).toContain(status);
    }
  });

  it('keeps C0 measurement-only with no commercial page or keyword implementation', () => {
    expect(COMMERCIAL_C0_GUARDRAILS.pageOptimizationAllowed).toBe(false);
    expect(COMMERCIAL_C0_GUARDRAILS.newCommercialUrlsAllowed).toBe(false);
    expect(COMMERCIAL_C0_GUARDRAILS.newInformationalUrlsAllowed).toBe(false);

    const source = read('src/lib/commercialC0Foundation.ts');
    expect(source).not.toContain('primaryKeyword');
    expect(source).not.toContain('secondaryKeyword');
    expect(source).not.toContain('titleRewrite');
    expect(source).not.toContain('h1Rewrite');
  });

  it('exposes an immutable C0 snapshot for downstream C1/C2 work', () => {
    const snapshot = getCommercialC0Snapshot();
    expect(snapshot.revision).toBe(COMMERCIAL_C0_REVISION);
    expect(snapshot.status).toBe('frozen');
    expect(snapshot.sources).toBe(COMMERCIAL_C0_SOURCES);
    expect(snapshot.facts).toBe(COMMERCIAL_C0_FACTS);
    expect(snapshot.measurement).toBe(COMMERCIAL_C0_MEASUREMENT);
    expect(snapshot.guardrails).toBe(COMMERCIAL_C0_GUARDRAILS);
    expect(Object.isFrozen(snapshot)).toBe(true);
  });
});
