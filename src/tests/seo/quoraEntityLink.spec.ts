import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { QUORA_PROFILE, QUORA_PROFILE_URL } from '../../lib/quoraProfile';

const repoRoot = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

describe('Quora entity-link guardrails', () => {
  it('keeps one clean canonical Tiny Steps Quora profile URL', () => {
    expect(QUORA_PROFILE.platform).toBe('Quora');
    expect(QUORA_PROFILE_URL).toBe('https://www.quora.com/profile/Tiny-Steps-Learning');
    expect(QUORA_PROFILE_URL).not.toMatch(/[?&](?:utm_|fbclid|gclid)/i);
  });

  it('exposes Quora on the Team authority section without adding it to the footer', () => {
    const profileSection = read('src/components/entity/OfficialProfilesSection.tsx');
    const footer = read('src/components/common/Footer.tsx');

    expect(profileSection).toContain("import { QUORA_PROFILE } from '../../lib/quoraProfile';");
    expect(profileSection).toContain('PINTEREST_PROFILE, QUORA_PROFILE');
    expect(profileSection).toContain('href={profile.url}');
    expect(footer).not.toContain('QUORA_PROFILE');
    expect(footer).not.toContain('quora.com/profile/Tiny-Steps-Learning');
  });

  it('adds Quora to published Organization sameAs JSON-LD on public pages', () => {
    const meta = read('src/components/common/Meta.tsx');

    expect(meta).toContain("import { QUORA_PROFILE_URL } from '../../lib/quoraProfile';");
    expect(meta).toContain('function withQuoraSameAs');
    expect(meta).toContain('sameAs: Array.from(new Set([...currentSameAs, QUORA_PROFILE_URL]))');
    expect(meta).toContain('withQuoraSameAs(organizationSchema)');
  });
});
