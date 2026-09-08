import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ORGANIZATION_SAME_AS_URLS,
  SEMANTIC_FACTS,
} from '../../config/semanticFacts';
import { QUORA_PROFILE, QUORA_PROFILE_URL } from '../../lib/quoraProfile';
import { organizationSchema } from '../../lib/schemas';

const repoRoot = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

describe('Quora entity-link guardrails', () => {
  it('keeps one clean canonical Tiny Steps Quora profile URL in semantic facts', () => {
    const semanticQuora = SEMANTIC_FACTS.organizationProfiles.find(
      (profile) => profile.platform === 'Quora',
    );

    expect(semanticQuora).toBeDefined();
    expect(QUORA_PROFILE).toEqual(semanticQuora);
    expect(QUORA_PROFILE_URL).toBe('https://www.quora.com/profile/Tiny-Steps-Learning');
    expect(QUORA_PROFILE_URL).not.toMatch(/[?&](?:utm_|fbclid|gclid)/i);
    expect(semanticQuora?.includeInOrganizationSameAs).toBe(true);
  });

  it('exposes Quora through the shared official-profile registry without footer duplication', () => {
    const profileSection = read('src/components/entity/OfficialProfilesSection.tsx');
    const footer = read('src/components/common/Footer.tsx');

    expect(profileSection).toContain('OFFICIAL_PUBLIC_PROFILES.map');
    expect(profileSection).not.toContain('QUORA_PROFILE');
    expect(footer).toContain("profile.platform !== 'Quora'");
    expect(footer).not.toContain('quora.com/profile/Tiny-Steps-Learning');
  });

  it('publishes Quora through the canonical Organization sameAs contract', () => {
    const meta = read('src/components/common/Meta.tsx');

    expect(ORGANIZATION_SAME_AS_URLS).toContain(QUORA_PROFILE_URL);
    expect(organizationSchema.sameAs).toEqual(ORGANIZATION_SAME_AS_URLS);
    expect(meta).toContain('ORGANIZATION_SAME_AS_URLS');
    expect(meta).toContain('function withCanonicalOrganizationSameAs');
    expect(meta).not.toContain('QUORA_PROFILE_URL');
    expect(meta).not.toContain('withQuoraSameAs');
  });
});
