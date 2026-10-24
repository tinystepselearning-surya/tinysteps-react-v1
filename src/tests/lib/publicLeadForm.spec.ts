import { describe, expect, it } from 'vitest';
import {
  buildLeadAttributionEnrichment,
  buildPublicLeadPayload,
  buildPublicWhatsappMessage,
  PUBLIC_MAIN_CONCERN_OPTIONS,
  validatePublicAssessmentForm,
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
  const validAssessment = {
    parentName: 'Priya',
    childName: 'Aarav',
    whatsapp: '+919999999999',
    childAge: '7',
    mainConcern: 'Blending sounds to read words',
    urgency: '',
  } as const;

  it.each([
    ['+919999999999', 'international with plus'],
    ['919999999999', 'international without plus'],
    ['9999999999', 'national number'],
    ['+91 (99999) 99999', 'international formatting'],
    ['(212) 555-0123', 'parentheses and hyphen'],
  ])('accepts a valid %s WhatsApp number (%s)', (whatsapp) => {
    expect(validatePublicAssessmentForm({ ...validAssessment, whatsapp })).toEqual({});
  });

  it.each([
    ['abc123456789', 'letters'],
    ['1234567', 'too few digits'],
    ['1234567890123456', 'more than 15 digits'],
    ['1234567890123         -   -   -', 'raw input longer than 24 characters'],
    ['++919999999999', 'repeated plus'],
    ['91+9999999999', 'plus in the middle'],
    ['9999999999#', 'other punctuation'],
    ['( ) - .', 'punctuation without digits'],
  ])('rejects %s as a WhatsApp number (%s)', (whatsapp) => {
    expect(validatePublicAssessmentForm({ ...validAssessment, whatsapp }).whatsapp).toBeTruthy();
  });

  it('validates the same name lengths, age range and allowed concerns as Firestore', () => {
    expect(validatePublicAssessmentForm({ ...validAssessment, parentName: 'P' }).parentName).toBeTruthy();
    expect(validatePublicAssessmentForm({ ...validAssessment, parentName: 'P'.repeat(81) }).parentName).toBeTruthy();
    expect(validatePublicAssessmentForm({ ...validAssessment, parentName: 'Pr' }).parentName).toBeUndefined();
    expect(validatePublicAssessmentForm({ ...validAssessment, parentName: 'P'.repeat(80) }).parentName).toBeUndefined();
    expect(validatePublicAssessmentForm({ ...validAssessment, childName: 'A'.repeat(81) }).childName).toBeTruthy();
    expect(validatePublicAssessmentForm({ ...validAssessment, childName: 'A' }).childName).toBeUndefined();
    expect(validatePublicAssessmentForm({ ...validAssessment, childAge: '2' }).childAge).toBeTruthy();
    expect(validatePublicAssessmentForm({ ...validAssessment, childAge: '13' }).childAge).toBeTruthy();
    expect(validatePublicAssessmentForm({ ...validAssessment, childAge: '7.5' }).childAge).toBeTruthy();
    expect(validatePublicAssessmentForm({ ...validAssessment, childAge: '3' }).childAge).toBeUndefined();
    expect(validatePublicAssessmentForm({ ...validAssessment, childAge: '12' }).childAge).toBeUndefined();
    expect(validatePublicAssessmentForm({ ...validAssessment, mainConcern: 'Other' as any }).mainConcern).toBeTruthy();
  });

  it('produces a Firestore-compatible normalized number without changing the submitted phone', () => {
    const input = { ...validAssessment, whatsapp: '+91 (99999) 99999' };
    expect(validatePublicAssessmentForm(input)).toEqual({});
    const payload = buildPublicLeadPayload(input, {
      attribution: { sourcePath: '/book-demo' },
    });
    expect(payload.whatsappNumber).toBe('+91 (99999) 99999');
    expect(payload.primaryPhone).toBe('+91 (99999) 99999');
    expect(payload.phoneNormalized).toBe('+919999999999');
  });

});
