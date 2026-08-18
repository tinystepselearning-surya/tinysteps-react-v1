import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Verify that archived Summer Camp 2026 structured data does NOT publish:
 * - Event schemas
 * - Offer schemas with pricing
 * - InStock or OutOfStock availability
 * - validFrom dates
 *
 * The evergreen /summer-camps page must not publish expired commercial markup.
 */
describe('SEO: Archived Summer Camp 2026 Structured Data', () => {
  let pageContent: string;
  let publicFactsContent: string;

  beforeAll(() => {
    const filePath = path.resolve(
      __dirname,
      '../../pages/SummerCampsPage.tsx'
    );
    pageContent = fs.readFileSync(filePath, 'utf-8');

    const publicFactsPath = path.resolve(
      __dirname,
      '../../config/publicFacts.ts'
    );
    publicFactsContent = fs.readFileSync(publicFactsPath, 'utf-8');
  });

  it('publishes FAQ guidance instead of Event or Service schema', () => {
    expect(pageContent).toContain('jsonLd: [createFAQPageSchema(faqItems)]');
    expect(pageContent).not.toMatch(/createEventSchema|['"]@type['"]:\s*['"]Event['"]/);
    expect(pageContent).not.toMatch(/['"]@type['"]:\s*['"]Service['"]/);
  });

  it('does not publish Offer, stock, price, or validFrom markup', () => {
    expect(pageContent).not.toMatch(/['"]@type['"]:\s*['"]Offer['"]/);
    expect(pageContent).not.toMatch(/InStock|OutOfStock|validFrom/);
    expect(pageContent).not.toMatch(/price(?:Currency)?\s*:/);
  });

  it('uses the canonical archive route and labels the season concluded', () => {
    expect(pageContent).toContain("canonicalPath: '/summer-camps'");
    expect(pageContent).toContain('SUMMER_CAMP_2026_ARCHIVE_LABEL');
    expect(pageContent).toContain('Seasonal archive');
    expect(publicFactsContent).toContain("status: 'concluded' as const");
    expect(publicFactsContent).toContain("endDateIso: '2026-06-13'");
    expect(publicFactsContent).toContain("endDateLabel: '13 June 2026'");
  });

  it('routes current commercial intent to the regular year-round offer', () => {
    expect(pageContent).toContain('Explore year-round courses');
    expect(pageContent).toContain("to=\"/book-demo\"");
    expect(pageContent).toContain('Book regular 35-minute assessment');
    expect(pageContent).not.toMatch(/enrol now|limited seats|batch starts/i);
  });
});

/**
 * Verify llms.txt contains /phonics but not the redirect alias
 */
describe('SEO: llms.txt content validation', () => {
  let llmsContent: string;

  beforeAll(async () => {
    const filePath = path.resolve(__dirname, '../../..', 'public/llms.txt');
    llmsContent = fs.readFileSync(filePath, 'utf-8');
  });

  it('contains the canonical /phonics page in Core Pages', () => {
    expect(llmsContent).toContain(
      'https://tinystepslearning.com/phonics'
    );
    
    // Should be in Core Pages section
    expect(llmsContent).toMatch(
      /## Core Pages[\s\S]*?\[Online Phonics Classes for Kids in India\][\s\S]*?tinystepslearning\.com\/phonics/
    );
  });

  it('does not contain the redirect alias /online-phonics-reading-classes', () => {
    expect(llmsContent).not.toContain('online-phonics-reading-classes');
  });
});
