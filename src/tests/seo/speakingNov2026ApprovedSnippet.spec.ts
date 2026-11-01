import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROUTE_SEO_REGISTRY } from '../../lib/routeSeoRegistry.js';
import { SPEAKING_META_DESCRIPTION_EXPERIMENT } from '../../lib/speakingMetaDescriptionExperiment.js';
import {
  COMMERCIAL_C4_ACTIVE_CONTROL_SNIPPETS,
  COMMERCIAL_C4_AUTHORIZED_OWNER_OVERRIDES,
} from '../../lib/commercialC4CtrOptimization';

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

describe('Approved age-neutral Speaking meta description, 2026-11-01', () => {
  it('preserves the exact previous Speaking description as an immutable comparison', () => {
    const previous = 'Live 1:1 online public speaking & communication classes for kids ages 4–12. Structured answers, storytelling and presentations. ₹400/class; free assessment.';
    expect(SPEAKING_META_DESCRIPTION_EXPERIMENT.controlDescription).toBe(previous);
    expect(COMMERCIAL_C4_AUTHORIZED_OWNER_OVERRIDES['/speaking'].description).toBe(previous);
    expect(COMMERCIAL_C4_ACTIVE_CONTROL_SNIPPETS['/speaking'].description).toBe('Live 1:1 public speaking and communication classes for kids in India and worldwide. Build structured answers, storytelling, presentations and communication confidence in 35-minute classes.');
  });

  it('publishes the approved description on the same canonical Speaking owner only', () => {
    const expected = 'Live 1:1 public speaking classes for kids. Practise clear answers, storytelling and presentations with teacher feedback. ₹400/class; free 35-min assessment.';
    expect(SPEAKING_META_DESCRIPTION_EXPERIMENT).toMatchObject({
      ownerPath: '/speaking',
      authorizedOn: '2026-11-01',
      status: 'approved-description-only',
      noCourseEligibilityChange: true,
      noOtherPageChange: true,
      candidateDescription: expected,
    });
    expect(expected).not.toMatch(/\bages?\s+\d/i);
    expect(ROUTE_SEO_REGISTRY['/speaking']).toMatchObject({
      canonicalPath: '/speaking',
      title: SPEAKING_META_DESCRIPTION_EXPERIMENT.titleFrozen,
      description: expected,
    });
  });

  it('uses that same approved text in the runtime meta-description update', () => {
    const speaking = read('src/pages/speaking.tsx');
    expect(speaking).toContain("import { SPEAKING_META_DESCRIPTION_EXPERIMENT } from '../lib/speakingMetaDescriptionExperiment.js';");
    expect(speaking).toContain('const seoDescription = SPEAKING_META_DESCRIPTION_EXPERIMENT.candidateDescription;');
    expect(speaking).toContain("const seoTitle = 'Online Public Speaking Classes for Kids | Live 1:1 | Tiny Steps';");
    expect(speaking).toContain('canonicalPath,');
    expect(speaking).toContain('description: seoDescription,');
    expect(speaking).toContain('to="/book-demo"');
  });

  it('does not change the Phonics control or Speaking programme levels and age eligibility', () => {
    expect(ROUTE_SEO_REGISTRY['/phonics']).toEqual(
      expect.objectContaining(COMMERCIAL_C4_ACTIVE_CONTROL_SNIPPETS['/phonics']),
    );
    const facts = read('src/config/semanticFacts.ts');
    expect(facts).toContain("ageRange: { min: 4, max: 7, label: 'Ages 4–7' }");
    expect(facts).toContain("ageRange: { min: 7, max: 12, label: 'Ages 7–12' }");
    expect(ROUTE_SEO_REGISTRY['/group-public-speaking-classes-for-kids'].canonicalPath).toBe('/group-public-speaking-classes-for-kids');
  });
});
