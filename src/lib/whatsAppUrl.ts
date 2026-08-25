export const sanitizeWhatsAppPhone = (phone: string): string => {
  return String(phone || '').replace(/\D/g, '');
};

export const sanitizeWhatsAppMessage = (message: string): string => {
  return String(message || '')
    .replace(/\uFFFD/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

export const buildWhatsAppUrl = (phone: string, message: string): string => {
  const sanitizedPhone = sanitizeWhatsAppPhone(phone);
  const sanitizedMessage = sanitizeWhatsAppMessage(message);

  if (!sanitizedPhone || !sanitizedMessage) return '';

  return `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(sanitizedMessage)}`;
};
