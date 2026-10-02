import { describe, expect, it } from 'vitest';
import { normalizedParentWhatsAppPhone } from '../../lib/attendanceValidationParentScope';

describe('Parent Month Close WhatsApp number', () => {
  it('uses a normalized international number from the exact parent record', () => {
    expect(normalizedParentWhatsAppPhone({ phoneNormalized: '+447700900123', phone: '07700900123' })).toBe('+447700900123');
  });

  it('refuses local and malformed numbers instead of guessing a country code', () => {
    expect(normalizedParentWhatsAppPhone({ phone: '9876543210', phoneLocal: '9876543210' })).toBe('');
    expect(normalizedParentWhatsAppPhone({ phoneNormalized: '9876543210', whatsappNumber: '+009876543210' })).toBe('');
  });
});
