import { describe, expect, it } from 'vitest';
import { COMMERCIAL_C0_MEASUREMENT } from '../../lib/commercialC0Foundation';
import { COMMERCIAL_C2_OWNERSHIP_CLUSTERS } from '../../lib/commercialC2KeywordOwnership';
import {
  COMMERCIAL_C3_OWNER_PAGE_AUDITS,
  COMMERCIAL_C3_UNIQUE_OWNER_PATHS,
} from '../../lib/commercialC3OwnerPageAudit';
import {
  COMMERCIAL_C5_MEASUREMENT,
  COMMERCIAL_C5_OWNER_FLOWS,
  COMMERCIAL_C5_POLICY,
  COMMERCIAL_C5_REVISION,
  COMMERCIAL_C5_STATUS,
  getCommercialC5OwnerFlow,
  isCommercialC5OwnerPath,
  normalizeCommercialC5Path,
  resolveCommercialC5Decision,
} from '../../lib/commercialC5ConversionFlow';

describe('Commercial C5 conversion decision flow', () => {
  it('ships the C5 R1 decision-flow implementation', () => {
    expect(COMMERCIAL_C5_REVISION).toBe('2026-09-11-c5-r1');
    expect(COMMERCIAL_C5_STATUS).toBe('decision-flow-implemented');
    expect(COMMERCIAL_C5_POLICY.expectedUniqueOwnerPages).toBe(14);
    expect(COMMERCIAL_C5_POLICY.directAssessmentEntryPages).toBe(13);
    expect(COMMERCIAL_C5_POLICY.singleConversionOwner).toBe('/book-demo');
  });

  it('covers exactly the 14 unique C3 commercial owners', () => {
    const c5Paths = COMMERCIAL_C5_OWNER_FLOWS.map((entry) => entry.ownerPath).sort();
    const c3Paths = [...COMMERCIAL_C3_UNIQUE_OWNER_PATHS].sort();

    expect(COMMERCIAL_C5_OWNER_FLOWS).toHaveLength(14);
    expect(new Set(c5Paths).size).toBe(14);
    expect(c5Paths).toEqual(c3Paths);
  });

  it('accounts for every C2 ownership cluster without creating another owner', () => {
    const c5Paths = new Set(COMMERCIAL_C5_OWNER_FLOWS.map((entry) => entry.ownerPath));
    for (const cluster of COMMERCIAL_C2_OWNERSHIP_CLUSTERS) {
      expect(c5Paths.has(cluster.canonicalOwnerPath)).toBe(true);
    }
  });

  it('inherits the exact C3 source file for each owner path', () => {
    for (const flow of COMMERCIAL_C5_OWNER_FLOWS) {
      const sourcePaths = Array.from(
        new Set(
          COMMERCIAL_C3_OWNER_PAGE_AUDITS
            .filter((entry) => entry.ownerPath === flow.ownerPath)
            .map((entry) => entry.sourcePath),
        ),
      );
      expect(sourcePaths).toEqual([flow.sourcePath]);
    }
  });

  it('keeps all 13 pre-conversion owners one click away from /book-demo', () => {
    const preConversion = COMMERCIAL_C5_OWNER_FLOWS.filter(
      (entry) => entry.ownerPath !== '/book-demo',
    );

    expect(preConversion).toHaveLength(13);
    for (const entry of preConversion) {
      expect(entry.directAssessmentPathRequired).toBe(true);
      expect(entry.primaryAction.kind).toBe('book-assessment');
      expect(entry.primaryAction.destinationPath).toBe('/book-demo');
    }
  });

  it('keeps /book-demo as the one assessment submission owner', () => {
    const flow = getCommercialC5OwnerFlow('/book-demo');
    expect(flow?.stage).toBe('conversion');
    expect(flow?.directAssessmentPathRequired).toBe(false);
    expect(flow?.primaryAction).toEqual({
      kind: 'submit-assessment',
      labelIntent: 'Submit free assessment request',
      destinationPath: null,
    });
  });

  it('allows only owner-to-owner secondary commercial handoffs and no self loops', () => {
    const c5Paths = new Set(COMMERCIAL_C5_OWNER_FLOWS.map((entry) => entry.ownerPath));
    for (const entry of COMMERCIAL_C5_OWNER_FLOWS) {
      expect(entry.secondaryDestinations).not.toContain(entry.ownerPath);
      for (const destination of entry.secondaryDestinations) {
        expect(c5Paths.has(destination)).toBe(true);
      }
    }
  });

  it('uses C0 qualified organic leads as the business KPI while keeping C5 events diagnostic', () => {
    expect(COMMERCIAL_C5_MEASUREMENT.primaryKpi).toBe(COMMERCIAL_C0_MEASUREMENT.primaryKpi);
    expect(COMMERCIAL_C5_MEASUREMENT.primaryKpi).toBe('qualified_organic_leads_per_day');
    expect(COMMERCIAL_C5_MEASUREMENT.diagnosticEvents.ownerView).toBe('commercial_owner_view');
    expect(COMMERCIAL_C5_MEASUREMENT.diagnosticEvents.decisionClick).toBe('commercial_decision_click');
    expect(COMMERCIAL_C5_MEASUREMENT.rule).toContain('diagnostic funnel signals');
    expect(COMMERCIAL_C5_MEASUREMENT.rule).toContain('canonical lead status');
  });

  it('protects C2, C3 and the active C4 metadata control window', () => {
    expect(COMMERCIAL_C5_POLICY.newCommercialUrlsAllowed).toBe(false);
    expect(COMMERCIAL_C5_POLICY.c2OwnershipMutationAllowed).toBe(false);
    expect(COMMERCIAL_C5_POLICY.c3CommercialFactDriftAllowed).toBe(false);
    expect(COMMERCIAL_C5_POLICY.c4MetadataMutationAllowed).toBe(false);
    expect(COMMERCIAL_C5_POLICY.bodyCopyChurnDuringC4ControlWindow).toBe(false);
    expect(COMMERCIAL_C5_POLICY.directPaymentFromCommercialOwnerAllowed).toBe(false);
  });

  it('normalizes owner paths without treating query strings as different owners', () => {
    expect(normalizeCommercialC5Path('/PHONICS/?utm_source=google#hero')).toBe('/phonics');
    expect(isCommercialC5OwnerPath('/phonics/')).toBe(true);
    expect(isCommercialC5OwnerPath('/not-a-commercial-owner')).toBe(false);
  });

  it('classifies the primary assessment decision correctly', () => {
    expect(
      resolveCommercialC5Decision({
        fromPath: '/phonics',
        destinationPath: '/book-demo?source=phonics',
        label: 'Book Free 35-Minute Demo',
        ctaLocation: 'hero',
      }),
    ).toEqual({
      kind: 'assessment',
      alignment: 'primary',
      fromPath: '/phonics',
      destinationPath: '/book-demo',
    });
  });

  it('classifies secondary comparison, pricing and programme handoffs', () => {
    expect(
      resolveCommercialC5Decision({
        fromPath: '/phonics',
        destinationPath: '/best-online-phonics-classes-for-kids-in-india',
        label: 'Compare phonics classes',
        ctaLocation: 'card',
      }),
    ).toMatchObject({ kind: 'comparison-handoff', alignment: 'secondary' });

    expect(
      resolveCommercialC5Decision({
        fromPath: '/phonics',
        destinationPath: '/pricing',
        label: 'View pricing',
        ctaLocation: 'card',
      }),
    ).toMatchObject({ kind: 'pricing', alignment: 'secondary' });

    expect(
      resolveCommercialC5Decision({
        fromPath: '/pricing',
        destinationPath: '/grammar',
        label: 'Explore grammar',
        ctaLocation: 'card',
      }),
    ).toMatchObject({ kind: 'programme-handoff', alignment: 'secondary' });
  });

  it('tracks contact as a supporting decision instead of pretending it is a qualified lead', () => {
    expect(
      resolveCommercialC5Decision({
        fromPath: '/grammar',
        href: 'https://wa.me/919618398383',
        label: 'Chat on WhatsApp',
        ctaLocation: 'card',
      }),
    ).toEqual({
      kind: 'contact',
      alignment: 'supporting-contact',
      fromPath: '/grammar',
      destinationPath: null,
    });
  });

  it('classifies the /book-demo form CTA as a submit attempt while leaving actual success to form events', () => {
    expect(
      resolveCommercialC5Decision({
        fromPath: '/book-demo',
        label: 'Book Free 35-Minute Demo on WhatsApp',
        ctaLocation: 'form',
      }),
    ).toEqual({
      kind: 'assessment-submit-attempt',
      alignment: 'primary',
      fromPath: '/book-demo',
      destinationPath: null,
    });
  });

  it('does not turn ordinary educational navigation into a CRO decision event', () => {
    expect(
      resolveCommercialC5Decision({
        fromPath: '/phonics',
        destinationPath: '/curriculum?tab=phonics',
        label: 'Full Curriculum Roadmap',
        ctaLocation: 'hero',
      }),
    ).toBeNull();
  });
});
