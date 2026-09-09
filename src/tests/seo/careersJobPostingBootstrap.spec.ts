import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(__dirname, '../../..');
const indexHtml = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');

describe('careers JobPosting bootstrap', () => {
  it('guarantees a Google Jobs schema bootstrap for /careers before React hydration', () => {
    expect(indexHtml).toContain("if (pathname !== '/careers') return;");
    expect(indexHtml).toContain("'@type': 'JobPosting'");
    expect(indexHtml).toContain("'@id': 'https://tinystepslearning.com/careers#online-english-teacher'");
    expect(indexHtml).toContain("title: 'Online English Teacher - Phonics, Grammar & Public Speaking'");
    expect(indexHtml).toContain("datePosted: '2026-08-20'");
    expect(indexHtml).toContain("validThrough: '2026-12-31T23:59:59+05:30'");
    expect(indexHtml).toContain("employmentType: 'PART_TIME'");
    expect(indexHtml).toContain('directApply: true');
    expect(indexHtml).toContain("jobLocationType: 'TELECOMMUTE'");
    expect(indexHtml).toContain("name: 'India'");
    expect(indexHtml).toContain("schemaElement.id = 'ts-jsonld'");
    expect(indexHtml).toContain("schemaElement.type = 'application/ld+json'");
    expect(indexHtml).toContain("schemaElement.setAttribute('data-ts-seo', '1')");
    expect(indexHtml).toContain("schemaElement.dataset.path = '/careers'");
    expect(indexHtml).toContain("url: 'https://tinystepslearning.com/careers'");
  });

  it('guards the bootstrap to the careers route before creating the schema', () => {
    const pathGuard = indexHtml.indexOf("if (pathname !== '/careers') return;");
    const schemaCreation = indexHtml.indexOf('const jobPosting = {');

    expect(pathGuard).toBeGreaterThan(-1);
    expect(schemaCreation).toBeGreaterThan(pathGuard);
  });
});
