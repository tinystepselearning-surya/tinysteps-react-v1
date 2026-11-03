// Isolated emulator integration: never connect to a live Firebase project.
import * as admin from 'firebase-admin';
import { afterEach, describe, expect, it } from 'vitest';
import { enrichPublicLeadAttribution } from '../src/enrichPublicLeadAttribution';

const project = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || '';
if (!process.env.FIRESTORE_EMULATOR_HOST || !project.startsWith('demo-')) {
  throw new Error('SEO attribution integration requires a demo- Firestore emulator project.');
}

const db = admin.firestore();
const leadIds = new Set<string>();

async function seedWebsiteEnquiry(id: string, programInterest: string) {
  const ref = db.collection('leads').doc(id);
  leadIds.add(id);
  await ref.set({
    source: 'website',
    sourcePath: '/book-demo',
    sourceDetail: 'book_demo_page',
    parentName: 'Synthetic Test Parent',
    childName: 'Synthetic Test Child',
    programInterest,
    mainConcern: programInterest === 'Reading' ? 'Reading speed and word accuracy' : 'Grammar while speaking or writing',
    createdAt: admin.firestore.Timestamp.now(),
  });
  return ref;
}

function enrich(id: string, landingPage: string) {
  return enrichPublicLeadAttribution.run({
    data: {
      leadId: id,
      attribution: {
        landingPage,
        conversionPage: '/book-demo',
        referrer: 'https://www.google.co.in/search?q=online+classes+for+kids',
        referrerDomain: 'google.co.in',
        utm_source: 'google',
        utm_medium: 'organic',
        utm_campaign: 'synthetic-emulator-verification',
      },
    },
  } as never);
}

afterEach(async () => {
  for (const leadId of leadIds) {
    await db.recursiveDelete(db.collection('leads').doc(leadId));
  }
  leadIds.clear();
});

describe('Reading/Grammar search-to-enquiry server enrichment (demo Firestore emulator)', () => {
  it.each([
    { id: 'AAAAAAAAAAAAAAAAAAAA', landingPage: '/reading-classes-for-kids', programInterest: 'Reading' },
    { id: 'BBBBBBBBBBBBBBBBBBBB', landingPage: '/grammar', programInterest: 'Grammar' },
  ])('persists $landingPage first touch separately from the booking conversion', async ({
    id, landingPage, programInterest,
  }) => {
    const ref = await seedWebsiteEnquiry(id, programInterest);
    const result = await enrich(id, landingPage);
    expect(result).toMatchObject({
      ok: true,
      alreadyEnriched: false,
      acquisitionChannel: 'google_organic',
      canonicalLeadId: id,
    });

    const saved = (await ref.get()).data();
    expect(saved).toMatchObject({
      source: 'website',
      sourcePath: '/book-demo',
      programInterest,
      landingPage,
      conversionPage: '/book-demo',
      acquisitionChannel: 'google_organic',
      attribution: {
        landingPage,
        conversionPage: '/book-demo',
        referrerDomain: 'google.co.in',
        utm_source: 'google',
        utm_medium: 'organic',
      },
    });
    expect(saved?.attributionEnrichedAt).toBeInstanceOf(admin.firestore.Timestamp);

    const inquiry = (await ref.collection('inquiries').doc(id).get()).data();
    expect(inquiry).toMatchObject({
      sourceLeadId: id,
      landingPage,
      conversionPage: '/book-demo',
      acquisitionChannel: 'google_organic',
    });

    // A repeat call must not replace the original first-touch attribution.
    const again = await enrich(id, '/unrelated-page');
    expect(again).toMatchObject({ ok: true, alreadyEnriched: true });
    expect((await ref.get()).data()?.landingPage).toBe(landingPage);
  });

  it.each([
    { id: 'DDDDDDDDDDDDDDDDDDDD', label: 'gclid with CPC UTM', gclid: 'synthetic-click' },
    { id: 'EEEEEEEEEEEEEEEEEEEE', label: 'CPC UTM only', gclid: undefined },
  ])('preserves paid Grammar attribution in Firestore: $label', async ({ id, gclid }) => {
    const ref = await seedWebsiteEnquiry(id, 'Grammar');
    const result = await enrichPublicLeadAttribution.run({
      data: {
        leadId: id,
        attribution: {
          landingPage: '/grammar',
          conversionPage: '/book-demo',
          utm_source: 'google',
          utm_medium: 'cpc',
          utm_campaign: 'ts_grammar_search_pilot_202611',
          ...(gclid ? { gclid } : {}),
        },
      },
    } as never);
    expect(result).toMatchObject({
      ok: true,
      acquisitionChannel: 'google_ads',
      canonicalLeadId: id,
    });

    const saved = (await ref.get()).data();
    expect(saved).toMatchObject({
      sourcePath: '/book-demo',
      landingPage: '/grammar',
      conversionPage: '/book-demo',
      acquisitionChannel: 'google_ads',
      attribution: {
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'ts_grammar_search_pilot_202611',
      },
    });
    expect(saved?.attribution?.gclid ?? null).toBe(gclid ?? null);
    expect((await ref.collection('inquiries').doc(id).get()).data()).toMatchObject({
      sourceLeadId: id,
      landingPage: '/grammar',
      conversionPage: '/book-demo',
      acquisitionChannel: 'google_ads',
    });
  });

  it('refuses to enrich non-website leads', async () => {
    const id = 'CCCCCCCCCCCCCCCCCCCC';
    const ref = await seedWebsiteEnquiry(id, 'Reading');
    await ref.update({ source: 'staff_entry' });

    await expect(enrich(id, '/reading-classes-for-kids')).rejects.toThrow();
    const saved = (await ref.get()).data();
    expect(saved?.landingPage).toBeUndefined();
    expect(saved?.attributionEnrichedAt).toBeUndefined();
  });
});