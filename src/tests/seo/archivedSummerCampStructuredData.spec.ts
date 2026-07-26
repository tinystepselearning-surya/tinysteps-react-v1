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

  beforeAll(async () => {
    const filePath = path.resolve(
      __dirname,
      '../../pages/SummerCampsPage.tsx'
    );
    pageContent = fs.readFileSync(filePath, 'utf-8');
  });

  it('does not publish Event schema for archived 2026 season', () => {
    // After the ternary fix, Event schemas are only included when NOT archived
    // The page should have:
    // ...(SUMMER_CAMP_2026_CONFIG.status !== 'archived'
    //   ? [phonicsEventSchema, grammarEventSchema, speakingEventSchema]
    //   : [])
    
    const eventSchemaPattern = /createEventSchema\s*\(\s*\{[\s\S]*?eventStatus:/g;
    const matches = Array.from(pageContent.matchAll(eventSchemaPattern));
    
    // Should have exactly 3 Event schema definitions
    expect(matches.length).toBe(3);
    
    // All 3 should have eventStatus from getEventStatusType (which returns appropriate status for archived)
    // But they should NOT be conditionally included with Offer properties
    const phoneticEventBlock = pageContent.match(
      /const phonicsEventSchema[\s\S]*?}\);/
    )?.[0] || '';
    
    // Should NOT contain price/availability/validFrom in Event schema
    expect(phoneticEventBlock).not.toContain('price: SUMMER_CAMP_ENROLLMENT_PRICE');
    expect(phoneticEventBlock).not.toContain('availability: ');
    expect(phoneticEventBlock).not.toContain('validFrom:');
  });

  it('does not publish InStock or OutOfStock in archived season', () => {
    // For archived season, the Offer properties should be completely absent
    // not substituted with OutOfStock
    
    const courseListBlock = pageContent.match(
      /const courseListSchema[\s\S]*?\n    \};/
    )?.[0] || '';
    
    // Should conditionally include offers only when NOT archived
    expect(courseListBlock).toContain('shouldPublishInStock(SUMMER_CAMP_2026_CONFIG)');
    expect(courseListBlock).toContain('offers:');
    
    // Should NOT always include OutOfStock
    expect(courseListBlock).not.toMatch(
      /availability:.*OutOfStock/
    );
  });

  it('does not publish Offer schema in Service for archived season', () => {
    const serviceBlock = pageContent.match(
      /const serviceSchema[\s\S]*?\n    \};/
    )?.[0] || '';
    
    // Should conditionally include offers only when NOT archived
    expect(serviceBlock).toContain('shouldPublishInStock(SUMMER_CAMP_2026_CONFIG)');
    
    // Should NOT always publish Offer with OutOfStock
    expect(serviceBlock).not.toMatch(
      /offers:\s*\{\s*'@type':\s*'Offer'[\s\S]*?availability:.*OutOfStock/
    );
  });

  it('does not publish active price for archived season', () => {
    const pageBlock = pageContent;
    
    // Check that offers block is wrapped in conditional guard for courseListSchema
    const courseListBlock = pageBlock.match(
      /const courseListSchema[\s\S]*?\n    \};/
    )?.[0] || '';
    
    // Should have conditional guard
    expect(courseListBlock).toContain('shouldPublishInStock(SUMMER_CAMP_2026_CONFIG)');
    expect(courseListBlock).toContain('offers:');
    
    // Check that serviceSchema also has conditional guard
    const serviceBlock = pageBlock.match(
      /const serviceSchema[\s\S]*?\n    \};/
    )?.[0] || '';
    
    expect(serviceBlock).toContain('shouldPublishInStock(SUMMER_CAMP_2026_CONFIG)');
    
    // The key point: offers should be inside the conditional spread operator
    // not unconditionally in the object
    expect(courseListBlock).toMatch(
      /\.\.\.\(shouldPublishInStock\(SUMMER_CAMP_2026_CONFIG\)\s*&&\s*\{[\s\S]*?offers:/
    );
    expect(serviceBlock).toMatch(
      /\.\.\.\(shouldPublishInStock\(SUMMER_CAMP_2026_CONFIG\)\s*&&\s*\{[\s\S]*?offers:/
    );
  });

  it('conditionally includes offers only when season is active', () => {
    // All Offer properties should be wrapped in:
    // ...(shouldPublishInStock(SUMMER_CAMP_2026_CONFIG) && { offers: {...} })
    
    expect(pageContent).toContain('shouldPublishInStock(SUMMER_CAMP_2026_CONFIG)');
    
    // Count how many times shouldPublishInStock is used to guard offers
    const offerGuardMatches = Array.from(
      pageContent.matchAll(
        /\.\.\.\(shouldPublishInStock\(SUMMER_CAMP_2026_CONFIG\)\s*&&\s*\{[\s\S]*?offers:/g
      )
    );
    
    // Should have at least 2 (courseListSchema and serviceSchema)
    expect(offerGuardMatches.length).toBeGreaterThanOrEqual(2);
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
