import { describe, expect, it } from 'vitest';

import {
  canonicalParentEligibilityIssue,
  expectedFieldsMatch,
} from '../src/schoolOS/identity/canonicalPrimaryWriter';

describe('Wave 1 R4 canonical-primary learner writer helpers', () => {
  it('accepts an active adult with an active global parent role', () => {
    expect(
      canonicalParentEligibilityIssue({
        parentId: 'parent-1',
        personData: {
          personId: 'parent-1',
          kind: 'adult',
          status: 'active',
        },
        roleData: {
          personId: 'parent-1',
          role: 'parent',
          scopeType: 'global',
          scopeId: null,
          status: 'active',
        },
      }),
    ).toBeNull();
  });

  it('fails closed when canonical parent identity is incomplete', () => {
    expect(
      canonicalParentEligibilityIssue({
        parentId: 'parent-1',
        personData: null,
        roleData: null,
      }),
    ).toBe('parent_canonical_person_missing');

    expect(
      canonicalParentEligibilityIssue({
        parentId: 'parent-1',
        personData: {
          personId: 'parent-1',
          kind: 'learner',
          status: 'active',
        },
        roleData: {
          personId: 'parent-1',
          role: 'parent',
          scopeType: 'global',
          scopeId: null,
          status: 'active',
        },
      }),
    ).toBe('parent_canonical_person_ineligible');

    expect(
      canonicalParentEligibilityIssue({
        parentId: 'parent-1',
        personData: {
          personId: 'parent-1',
          kind: 'adult',
          status: 'active',
        },
        roleData: null,
      }),
    ).toBe('parent_canonical_role_missing');

    expect(
      canonicalParentEligibilityIssue({
        parentId: 'parent-1',
        personData: {
          personId: 'parent-1',
          kind: 'adult',
          status: 'active',
        },
        roleData: {
          personId: 'parent-1',
          role: 'teacher',
          scopeType: 'global',
          scopeId: null,
          status: 'active',
        },
      }),
    ).toBe('parent_canonical_role_ineligible');
  });

  it('rejects inactive or organisation-scoped parent authority', () => {
    expect(
      canonicalParentEligibilityIssue({
        parentId: 'parent-1',
        personData: {
          personId: 'parent-1',
          kind: 'adult',
          status: 'archived',
        },
        roleData: {
          personId: 'parent-1',
          role: 'parent',
          scopeType: 'global',
          scopeId: null,
          status: 'active',
        },
      }),
    ).toBe('parent_canonical_person_ineligible');

    expect(
      canonicalParentEligibilityIssue({
        parentId: 'parent-1',
        personData: {
          personId: 'parent-1',
          kind: 'adult',
          status: 'active',
        },
        roleData: {
          personId: 'parent-1',
          role: 'parent',
          scopeType: 'organisation',
          scopeId: 'school-1',
          status: 'active',
        },
      }),
    ).toBe('parent_canonical_role_ineligible');
  });

  it('verifies expected canonical fields while allowing timestamp metadata', () => {
    expect(
      expectedFieldsMatch(
        {
          personId: 'kid-1',
          kind: 'learner',
          status: 'active',
          displayName: 'Learner One',
          canonicalAuthority: {
            authority: 'canonical-primary',
            command: 'learner_create',
            writeId: 'write-1',
          },
          createdAt: { seconds: 123 },
          updatedAt: { seconds: 123 },
        },
        {
          personId: 'kid-1',
          kind: 'learner',
          status: 'active',
          displayName: 'Learner One',
          canonicalAuthority: {
            authority: 'canonical-primary',
            command: 'learner_create',
            writeId: 'write-1',
          },
        },
      ),
    ).toBe(true);
  });

  it('detects canonical or compatibility parity drift', () => {
    expect(
      expectedFieldsMatch(
        {
          personId: 'kid-1',
          status: 'active',
          summary: {
            phonicsMastery: 0,
            grammarMastery: 0,
          },
        },
        {
          personId: 'kid-1',
          status: 'active',
          summary: {
            phonicsMastery: 0,
            grammarMastery: 1,
          },
        },
      ),
    ).toBe(false);

    expect(
      expectedFieldsMatch(
        null,
        {
          personId: 'kid-1',
        },
      ),
    ).toBe(false);
  });
});
