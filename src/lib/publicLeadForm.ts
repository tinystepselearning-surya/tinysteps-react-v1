import { captureLeadAttribution } from './leadAttribution';

export type InterestOption = 'Phonics' | 'Reading' | 'Grammar' | 'Speaking';
export type MainConcernOption =
  | 'Starting to read words after learning ABC/sounds'
  | 'Blending sounds to read words'
  | 'Reading speed and word accuracy'
  | 'Spelling while reading and writing'
  | 'Understanding what they read'
  | 'Grammar while speaking or writing'
  | 'Answering in full sentences'
  | 'Speaking English with confidence'
  | 'Confidence for speaking / presentations'
  | 'Not sure where to start';

export type PublicAssessmentFormState = {
  parentName: string;
  childName: string;
  whatsapp: string;
  childAge: string;
  mainConcern: MainConcernOption | '';
  urgency: '' | 'Today' | 'This week' | 'This month' | 'Just exploring';
};

export type PublicLeadAttribution = {
  sourcePath: string;
  landingPage?: string;
  submittedFromPath?: string;
  submittedFromUrl?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  gclid?: string;
  fbclid?: string;
};

const INTEREST_TRACK_BY_OPTION: Partial<Record<InterestOption, 'phonics' | 'grammar' | 'public_speaking'>> = {
  Phonics: 'phonics',
  Grammar: 'grammar',
  Speaking: 'public_speaking',
};

function deriveInterestFromConcern(mainConcern: MainConcernOption | ''): InterestOption | null {
  switch (mainConcern) {
    case 'Starting to read words after learning ABC/sounds':
    case 'Blending sounds to read words':
      return 'Phonics';
    case 'Reading speed and word accuracy':
    case 'Spelling while reading and writing':
    case 'Understanding what they read':
    case 'Not sure where to start':
      return 'Reading';
    case 'Grammar while speaking or writing':
      return 'Grammar';
    case 'Answering in full sentences':
    case 'Speaking English with confidence':
    case 'Confidence for speaking / presentations':
      return 'Speaking';
    default:
      return null;
  }
}

export function getPublicLeadAttribution(): PublicLeadAttribution {
  const attribution = captureLeadAttribution();
  return {
    sourcePath: attribution.submittedFromPath || '/',
    landingPage: attribution.landingPage,
    submittedFromPath: attribution.submittedFromPath,
    submittedFromUrl: attribution.submittedFromUrl,
    referrer: attribution.referrer,
    utm_source: attribution.utmSource,
    utm_medium: attribution.utmMedium,
    utm_campaign: attribution.utmCampaign,
    utm_content: attribution.utmContent,
    utm_term: attribution.utmTerm,
    gclid: attribution.gclid,
    fbclid: attribution.fbclid,
  };
}

export function buildPublicLeadPayload(
  form: PublicAssessmentFormState,
  opts: {
    source?: string;
    attribution?: PublicLeadAttribution;
    timezone?: string;
  } = {},
) {
  const parsedChildAge = Number(form.childAge);
  const attribution = opts.attribution || getPublicLeadAttribution();
  const normalizedWhatsapp = form.whatsapp.trim();
  const derivedInterest = deriveInterestFromConcern(form.mainConcern);

  return {
    parentName: form.parentName.trim(),
    whatsappNumber: normalizedWhatsapp,
    primaryPhone: normalizedWhatsapp,
    phoneNormalized: normalizedWhatsapp.replace(/[^\d+]/g, ''),
    childName: form.childName.trim(),
    childAge: Number.isFinite(parsedChildAge) ? parsedChildAge : null,
    interestTrack: derivedInterest ? INTEREST_TRACK_BY_OPTION[derivedInterest] ?? null : null,
    programInterest: derivedInterest,
    source: 'website',
    sourceDetail: opts.source || 'public_assessment_form',
    urgency: form.urgency || null,
    initialMessageSnippet: null,
    mainConcern: form.mainConcern,
    timezone: opts.timezone || null,
    sourcePath: attribution.sourcePath,
    // Firestore rules currently allow only the UTM subset inside `attribution`.
    attribution: {
      utm_source: attribution.utm_source || null,
      utm_medium: attribution.utm_medium || null,
      utm_campaign: attribution.utm_campaign || null,
      utm_content: attribution.utm_content || null,
      utm_term: attribution.utm_term || null,
    },
  };
}

export function buildPublicWhatsappMessage(form: PublicAssessmentFormState) {
  const lines = [
    'Hello Tiny Steps,',
    '',
    'I would like to book a free assessment class.',
    '',
    `Parent name: ${form.parentName || '-'}`,
    `Child name: ${form.childName || '-'}`,
    `WhatsApp number: ${form.whatsapp || '-'}`,
    `Child age: ${form.childAge || '-'}`,
    `Support area: ${form.mainConcern || '-'}`,
    '',
  ];

  if (form.urgency) {
    lines.push(`When do you want to start: ${form.urgency}`, '');
  }

  lines.push('Please share available slots. Thank you.');

  return lines.join('\n');
}
