import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { COMMERCIAL_C2_OWNERSHIP_CLUSTERS } from '../../lib/commercialC2KeywordOwnership';
import {
  COMMERCIAL_C3_OWNER_PAGE_AUDITS,
  COMMERCIAL_C3_POLICY,
  COMMERCIAL_C3_UNIQUE_OWNER_PATHS,
} from '../../lib/commercialC3OwnerPageAudit';

const repoRoot = path.resolve(process.cwd());
const read = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

describe('Commercial C3 canonical owner page audit', () => {
  it('audits every C2 ownership cluster exactly once across 14 unique pages', () => {
    expect(COMMERCIAL_C3_OWNER_PAGE_AUDITS).toHaveLength(15);
    expect(COMMERCIAL_C3_UNIQUE_OWNER_PATHS).toHaveLength(14);
    expect(new Set(COMMERCIAL_C3_OWNER_PAGE_AUDITS.map((entry) => entry.clusterId)).size).toBe(15);
    expect(COMMERCIAL_C3_OWNER_PAGE_AUDITS.filter((entry) => entry.ownerPath === '/speaking')).toHaveLength(2);

    for (const cluster of COMMERCIAL_C2_OWNERSHIP_CLUSTERS) {
      expect(COMMERCIAL_C3_OWNER_PAGE_AUDITS.filter((entry) => entry.clusterId === cluster.id), cluster.id).toHaveLength(1);
    }
  });

  it('points every audited owner to a real source file', () => {
    for (const entry of COMMERCIAL_C3_OWNER_PAGE_AUDITS) {
      expect(fs.existsSync(path.join(repoRoot, entry.sourcePath)), `${entry.ownerPath} -> ${entry.sourcePath}`).toBe(true);
    }
  });

  it('keeps country and AI prompt page creation at zero', () => {
    expect(COMMERCIAL_C3_POLICY.countryPagesCreated).toBe(0);
    expect(COMMERCIAL_C3_POLICY.aiPromptPagesCreated).toBe(0);
  });

  it('strengthens the writing owner for creative-writing/provider intent', () => {
    const source = read('src/pages/public/WritingClassesForKidsPage.tsx');
    expect(source).toContain('creative writing classes for kids online');
    expect(source).toContain('Creative & English Writing Classes for Kids Online');
    expect(source).toContain('createCourseSchema');
    expect(source).toContain("areaServed: ['India', 'Worldwide']");
    expect(source).toContain('standard class is 35 minutes');
    expect(source).toContain('How is a writing class different from a grammar class?');
  });

  it('keeps reading fluency a narrow specialist owner with stronger programme facts', () => {
    const source = read('src/pages/public/ReadingFluencyProgramPage.tsx');
    expect(source).toContain('reading fluency classes for kids online');
    expect(source).toContain('createCourseSchema');
    expect(source).toContain('createWebPageSchema');
    expect(source).toContain("areaServed: ['India', 'Worldwide']");
    expect(source).toContain('The standard class is 35 minutes');
    expect(source).toContain('broader reading-class searches belong to our');
    expect(source).toContain('to="/reading-classes-for-kids"');
  });

  it('keeps confidence-building specialist intent separate from broad communication', () => {
    const source = read('src/pages/public/ConfidenceBuildingProgramKidsPage.tsx');
    expect(source).toContain('confidence building classes for kids');
    expect(source).toContain('createCourseSchema');
    expect(source).toContain('createWebPageSchema');
    expect(source).toContain('general public speaking or communication classes');
    expect(source).toContain('to="/speaking"');
    expect(source).toContain('standard class is 35 minutes');
  });

  it('strengthens spoken English without stealing the /speaking owner', () => {
    const source = read('src/pages/public/SpokenEnglishClassesForKidsPage.tsx');
    expect(source).toContain('spoken English classes for NRI kids');
    expect(source).toContain('1 to 1 spoken English classes for kids');
    expect(source).toContain('What is the difference between spoken English and public speaking classes?');
    expect(source).toContain('Parents looking mainly for public speaking should use the Tiny Steps Speaking program.');
    expect(source).toContain('35 minutes');
  });

  it('strengthens the broad English owner for tutor, NRI and six-market international intent', () => {
    const source = read('src/pages/public/OnlineEnglishClassesForKidsPage.tsx');
    for (const token of ['online English tutor for kids', 'NRI families', 'UAE', 'United States', 'United Kingdom', 'Australia', 'Singapore']) {
      expect(source, token).toContain(token);
    }
    expect(source).toContain('Ages 3 to 5');
    expect(source).toContain('Ages 6 to 8');
    expect(source).toContain('Ages 9 to 12');
    expect(source).not.toContain('Ages 9 to 13');
  });

  it('normalizes Tiny Steps phonics-fee duration to the canonical 35-minute standard 1:1 fact', () => {
    const vite = read('vite.config.js');
    expect(vite).toContain(".replace('<div>35–40 min</div>', '<div>35 min</div>')");
    expect(vite).toContain("₹4,800 for 12 classes · 35 min · 1 child : 1 teacher");
    expect(vite).toContain('Standard 1:1 classes are 35 minutes');
  });

  it('protects high-performing owner canonicals instead of creating alternates', () => {
    const protectedPaths = ['/phonics', '/best-online-phonics-classes-for-kids-in-india', '/reading-classes-for-kids', '/grammar', '/speaking', '/online-english-classes-hyderabad', '/pricing', '/book-demo'];
    for (const ownerPath of protectedPaths) {
      expect(COMMERCIAL_C3_OWNER_PAGE_AUDITS.some((entry) => entry.ownerPath === ownerPath && entry.action === 'PROTECT'), ownerPath).toBe(true);
    }
  });
});
