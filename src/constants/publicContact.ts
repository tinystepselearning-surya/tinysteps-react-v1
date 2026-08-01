export const PUBLIC_CONTACT_EMAIL = 'Priya@tinystepslearning.com';
export const PUBLIC_CONTACT_MAILTO = `mailto:${PUBLIC_CONTACT_EMAIL}`;
export const PUBLIC_WHATSAPP_NUMBER = '919618398383';

export const buildPublicWhatsAppUrl = (message: string) =>
  `https://wa.me/${PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
