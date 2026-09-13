export const META_WHATSAPP_APP_ID = '1401105561770791';
export const META_WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID = '1054093100779716';
export const META_GRAPH_API_VERSION = 'v25.0';

export const META_EMBEDDED_SIGNUP_EVENT_TYPE = 'WA_EMBEDDED_SIGNUP';

export const buildWhatsAppCoexistenceLoginOptions = () => ({
  config_id: META_WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID,
  response_type: 'code',
  override_default_response_type: true,
  extras: {
    setup: {},
    featureType: 'whatsapp_business_app_onboarding',
    sessionInfoVersion: '3',
  },
});

export const isTrustedMetaEmbeddedSignupOrigin = (origin: string) =>
  origin === 'https://www.facebook.com' || origin === 'https://web.facebook.com';

export type WhatsAppEmbeddedSignupEvent = {
  event: string;
  wabaId: string | null;
  phoneNumberId: string | null;
  message: string | null;
};

const readString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

export const parseWhatsAppEmbeddedSignupEvent = (
  raw: unknown,
): WhatsAppEmbeddedSignupEvent | null => {
  let parsed: unknown = raw;

  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
  }

  if (!parsed || typeof parsed !== 'object') return null;

  const payload = parsed as Record<string, unknown>;
  if (payload.type !== META_EMBEDDED_SIGNUP_EVENT_TYPE) return null;

  const data =
    payload.data && typeof payload.data === 'object'
      ? (payload.data as Record<string, unknown>)
      : {};

  return {
    event: readString(payload.event) || 'UNKNOWN',
    wabaId: readString(data.waba_id),
    phoneNumberId: readString(data.phone_number_id),
    message:
      readString(data.error_message) ||
      readString(data.message) ||
      readString(payload.message),
  };
};
