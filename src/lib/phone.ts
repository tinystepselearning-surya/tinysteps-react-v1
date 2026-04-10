export const DEFAULT_PHONE_COUNTRY_CODE = '';

const digitsOnly = (value: string): string => value.replace(/\D/g, '');

export const normalizeCountryCode = (value: string): string => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  const digits = digitsOnly(trimmed);
  return digits ? `+${digits}` : '';
};

export const normalizePhoneLocal = (value: string): string => digitsOnly(String(value || ''));

export const buildPhoneFromParts = (countryCode: string, phoneLocal: string): string => {
  const code = normalizeCountryCode(countryCode);
  const local = normalizePhoneLocal(phoneLocal);
  if (!code || !local) return '';
  return `${code}${local}`;
};

export const splitPhoneForForm = (
  rawPhone: string | null | undefined,
): { countryCode: string; phoneLocal: string } => {
  const raw = String(rawPhone || '').trim();
  if (!raw) {
    return {
      countryCode: DEFAULT_PHONE_COUNTRY_CODE,
      phoneLocal: '',
    };
  }

  const normalized = raw.replace(/\s+/g, '');
  if (normalized.startsWith('+')) {
    const explicitMatch = normalized.match(/^\+(\d{1,4})(.*)$/);
    if (explicitMatch) {
      const countryCodeDigits = normalizePhoneLocal(explicitMatch[1] || '');
      const localDigitsFromRest = normalizePhoneLocal(explicitMatch[2] || '');
      if (countryCodeDigits) {
        return {
          countryCode: countryCodeDigits,
          phoneLocal: localDigitsFromRest,
        };
      }
    }

    const digits = normalizePhoneLocal(normalized);
    if (digits.length > 10) {
      return {
        countryCode: digits.slice(0, digits.length - 10),
        phoneLocal: digits.slice(-10),
      };
    }

    return {
      countryCode: '',
      phoneLocal: digits,
    };
  }

  return {
    countryCode: DEFAULT_PHONE_COUNTRY_CODE,
    phoneLocal: normalizePhoneLocal(raw),
  };
};
