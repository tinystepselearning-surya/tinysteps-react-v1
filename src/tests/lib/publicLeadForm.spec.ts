import { describe, expect, it } from 'vitest';
import {
  buildLeadAttributionEnrichment,
  buildPublicLeadPayload,
  buildPublicWhatsappMessage,
  PUBLIC_MAIN_CONCERN_OPTIONS,
} from '../../lib/publicLeadForm';

describe('publicLeadForm helpers', () => {
  it('keeps the anonymous Firestore payload within the strict existing schema', () => {
    const payload = buildPublicLeadPayload(
      {
        parentName: 'Priya',
        childName: 'Aarav',
        whatsapp: '+919999999999',
        childAge: '7',
        mainConcern: 'Reading speed and word accuracy',
        urgency: 'This week',
      },
      {
        source: 'homepage_hero_assessment',
        attribution: {
          sourcePath: '/book-demo',
          landingPage: '/phonics',
          submittedFromPath: '/book-demo',
          referrerDomain: 'google.com',
          utm_source: 'google',
          utm_medium: 'cpc',
          gclid: 'test-gclid',
          acquisitionChannel: 'google_ads',
          acquisitionSource: 'google',
        },
        timezone: 'Asia/Kolkata',
      },
    );

    expect(payload).toMatchObject({
      parentName: 'Priya',
      whatsappNumber: '+919999999999',
      primaryPhone: '+919999999999',
      childName: 'Aarav',
      childAge: 7,
      programInterest: 'Reading',
      mainConcern: 'Reading speed and word accuracy',
      urgency: 'This week',
      initialMessageSnippet: null,
      sourcePath: '/book-demo',
    });
    expect(payload).not.toHaveProperty('status');
    expect(payload).not.toHaveProperty('priority');
    expect(payload).not.toHaveProperty('acquisitionChannel');
    expect(payload).not.toHaveProperty('landingPage');
    expect(payload.attribution).toEqual({
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: null,
      utm_content: null,
      utm_term: null,
    });
  });

  it('builds the complete server-side enrichment payload separately', () => {
    expect(
      buildLeadAttributionEnrichment({
        sourcePath: '/book-demo',
        landingPage: '/phonics',
        submittedFromPath: '/book-demo',
        submittedFromUrl: '/book-demo?book=1',
        firstSeenAt: '2026-08-10T00:00:00.000Z',
        referrer: 'https://www.google.com/search?q=phonics',
        referrerDomain: 'google.com',
        utm_source: 'google',
        utm_medium: 'organic',
        utm_campaign: 'phonics',
        gclid: undefined,
      }),
    ).toMatchObject({
      landingPage: '/phonics',
      conversionPage: '/book-demo',
      submittedFromUrl: '/book-demo?book=1',
      referrerDomain: 'google.com',
      utm_source: 'google',
      utm_medium: 'organic',
    });
  });

  it('includes support area and urgency in the WhatsApp message', () => {
    const message = buildPublicWhatsappMessage({
      parentName: 'Priya',
      childName: 'Aarav',
      whatsapp: '+919999999999',
      childAge: '7',
      mainConcern: 'Answering in full sentences',
      urgency: 'Today',
    });

    expect(message).toContain('Support area: Answering in full sentences');
    expect(message).toContain('When do you want to start: Today');
    expect(message).toContain('Parent name: Priya');
    expect(message).toContain('Child name: Aarav');
    expect(message).toContain('WhatsApp number: +919999999999');
    expect(message).toContain('Child age: 7');
    expect(message).not.toContain('Interest:');
  });

  it('exports the exact supported public mainConcern options', () => {
    expect(PUBLIC_MAIN_CONCERN_OPTIONS).toEqual([
      'Starting to read words after learning ABC/sounds',
      'Blending sounds to read words',
      'Reading speed and word accuracy',
      'Spelling while reading and writing',
      'Understanding what they read',
      'Grammar while speaking or writing',
      'Answering in full sentences',
      'Speaking English with confidence',
      'Confidence for speaking / presentations',
      'Not sure where to start',
    ]);
  });
});
