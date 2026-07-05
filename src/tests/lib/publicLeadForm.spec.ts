import { describe, expect, it } from 'vitest';
import { buildPublicLeadPayload, buildPublicWhatsappMessage } from '../../lib/publicLeadForm';

describe('publicLeadForm helpers', () => {
  it('includes mainConcern and urgency in the saved lead payload', () => {
    const payload = buildPublicLeadPayload(
      {
        parentName: 'Priya',
        childName: 'Aarav',
        whatsapp: '+919999999999',
        childAge: '7',
        interest: 'Reading',
        mainConcern: 'Reads slowly',
        urgency: 'This week',
        details: 'Needs after-school timing',
      },
      {
        source: 'homepage_hero_assessment',
        attribution: {
          sourcePath: '/',
          utm_source: 'google',
          utm_medium: 'cpc',
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
      mainConcern: 'Reads slowly',
      urgency: 'This week',
      sourcePath: '/',
    });
    expect(payload).not.toHaveProperty('status');
    expect(payload).not.toHaveProperty('priority');
    expect(payload.attribution).toMatchObject({
      utm_source: 'google',
      utm_medium: 'cpc',
    });
  });

  it('includes mainConcern and urgency in the WhatsApp message', () => {
    const message = buildPublicWhatsappMessage({
      parentName: 'Priya',
      childName: 'Aarav',
      whatsapp: '+919999999999',
      childAge: '7',
      interest: 'Speaking',
      mainConcern: 'Gives one-word answers',
      urgency: 'Today',
      details: '',
    });

    expect(message).toContain('Main concern: Gives one-word answers');
    expect(message).toContain('When do you want to start: Today');
  });
});
