import { SEMANTIC_FACTS } from '../config/semanticFacts';

export const PUBLIC_CONTACT_EMAIL = SEMANTIC_FACTS.contact.email;
export const PUBLIC_CONTACT_MAILTO = `mailto:${PUBLIC_CONTACT_EMAIL}`;
export const PUBLIC_WHATSAPP_NUMBER = SEMANTIC_FACTS.contact.whatsappNumber;
export const PUBLIC_CONTACT_TELEPHONE = SEMANTIC_FACTS.contact.telephoneDisplay;

export const buildPublicWhatsAppUrl = (message: string) =>
  `https://wa.me/${PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
