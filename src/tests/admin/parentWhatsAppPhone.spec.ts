import { describe, expect, it } from 'vitest';
import { normalizedParentWhatsAppPhone } from '../../lib/attendanceValidationParentScope';

describe('Parent Month Close WhatsApp number', () => {
  it('uses a normalized international number from the exact parent record', () => {
    expect(normalizedParentWhatsAppPhone({ phoneNormalized: '+447700900123', phone: '07700900123' })).toBe('+447700900123');
  });

  it('accepts the canonical stored phone field when it already contains an international number', () => {
    expect(normalizedParentWhatsAppPhone({ phone: '+919876543210' })).toBe('+919876543210');
  });

  it('builds the WhatsApp number from canonical country-code and local-phone parts', () => {
    expect(normalizedParentWhatsAppPhone({
      phoneCountryCode: '+91',
      phoneLocal: '98765 43210',
      phone: '9876543210',
    })).toBe('+919876543210');
  });

  it('accepts explicit WhatsApp E.164 fields', () => {
    expect(normalizedParentWhatsAppPhone({ whatsappE164: '+6591234567' })).toBe('+6591234567');
    expect(normalizedParentWhatsAppPhone({ whatsappPhone: '+971501234567' })).toBe('+971501234567');
  });

  it('refuses local and malformed numbers instead of guessing a country code', () => {
    expect(normalizedParentWhatsAppPhone({ phone: '9876543210', phoneLocal: '9876543210' })).toBe('');
    expect(normalizedParentWhatsAppPhone({ phoneNormalized: '9876543210', whatsappNumber: '+009876543210' })).toBe('');
  });
});
