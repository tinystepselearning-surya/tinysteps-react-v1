import { describe, expect, it } from 'vitest';

import { toSchoolRecord } from '../../services/schoolService';

describe('schoolService school mapping', () => {
  it('maps nested school fields and Learning Partner identity', () => {
    const school = toSchoolRecord('school-a', {
      schoolCode: 'TS-SCHOOLA',
      name: 'School A',
      status: 'paused',
      contact: {
        name: 'Principal A',
        designation: 'Principal',
        email: 'principal@example.com',
        phone: '+91 99999 99999',
      },
      location: {
        city: 'Hyderabad',
        state: 'Telangana',
      },
      learningPartnerId: 'lp-1',
      learningPartnerName: 'Learning Partner One',
      learningPartnerEmail: 'lp@example.com',
    });

    expect(school.contact).toEqual({
      name: 'Principal A',
      designation: 'Principal',
      email: 'principal@example.com',
      phone: '+91 99999 99999',
    });
    expect(school.location).toEqual({
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
    });
    expect(school.learningPartnerId).toBe('lp-1');
    expect(school.learningPartnerName).toBe('Learning Partner One');
    expect(school.learningPartnerEmail).toBe('lp@example.com');
  });

  it('defaults unknown status to active and country to India', () => {
    const school = toSchoolRecord('school-b', {
      name: 'School B',
      status: 'unexpected',
      contact: { name: 'Contact' },
      location: {},
    });

    expect(school.status).toBe('active');
    expect(school.location.country).toBe('India');
  });
});
