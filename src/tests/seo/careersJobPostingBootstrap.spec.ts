import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(__dirname, '../../..');
const indexHtml = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');

function renderShell(url: string) {
  return new JSDOM(indexHtml, {
    url,
    runScripts: 'dangerously',
  });
}

describe('careers JobPosting bootstrap', () => {
  it('guarantees a Google Jobs schema before React hydration on /careers', () => {
    const dom = renderShell('https://tinystepslearning.com/careers');
    const schemaElement = dom.window.document.querySelector<HTMLScriptElement>(
      'script#ts-jsonld[type="application/ld+json"][data-ts-seo="1"][data-path="/careers"]',
    );

    expect(schemaElement).not.toBeNull();
    const schema = JSON.parse(schemaElement?.textContent || '{}');

    expect(schema).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      '@id': 'https://tinystepslearning.com/careers#online-english-teacher',
      title: 'Online English Teacher - Phonics, Grammar & Public Speaking',
      datePosted: '2026-08-20',
      validThrough: '2026-12-31T23:59:59+05:30',
      employmentType: 'PART_TIME',
      directApply: true,
      jobLocationType: 'TELECOMMUTE',
      applicantLocationRequirements: {
        '@type': 'Country',
        name: 'India',
      },
      hiringOrganization: {
        '@type': 'Organization',
        name: 'Tiny Steps Learning',
      },
      url: 'https://tinystepslearning.com/careers',
    });
    expect(schema.description.length).toBeGreaterThan(500);
    expect(schema.responsibilities).toBeTruthy();
    expect(schema.qualifications).toBeTruthy();
    expect(schema.skills).toBeTruthy();
    expect(schema.workHours).toBeTruthy();
  });

  it('does not leak JobPosting markup onto non-careers routes', () => {
    const dom = renderShell('https://tinystepslearning.com/phonics');
    expect(dom.window.document.querySelector('script#ts-jsonld')).toBeNull();
  });
});
