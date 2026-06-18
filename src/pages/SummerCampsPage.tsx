import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../lib/seo';
import { createEventSchema } from '../lib/schemas';
import { buildLeadAttributionPayload, trackGenerateLead, trackLeadFormStart, trackLeadFormSubmit } from '../lib/conversionTracking';

type SummerCampLeadFormState = {
  name: string;
  email: string;
  phone: string;
  childAge: string;
  track: string;
  note: string;
  honeypot: string;
};

const SUMMER_CAMP_ENROLLMENT_PRICE = 2400;
const SUMMER_CAMP_FULL_PRICE = 5000;
const SUMMER_CAMP_BATCH_CAP = 8;
const SUMMER_CAMP_PLANNED_CLASS_COUNT = 24;
const SUMMER_CAMP_SEASON_START_LABEL = '27 April 2026';
const SUMMER_CAMP_SEASON_END_LABEL = '13 June 2026';
const SUMMER_CAMP_SEASON_DATE_RANGE_LABEL = `${SUMMER_CAMP_SEASON_START_LABEL} to ${SUMMER_CAMP_SEASON_END_LABEL}`;
const SUMMER_CAMP_SEASON_DATE_RANGE_SHORT = '27 Apr–13 Jun 2026';
const SUMMER_CAMP_BATCH_DURATION_LABEL = '4 weeks';
const SUMMER_CAMP_VALUE_LABEL = `${SUMMER_CAMP_PLANNED_CLASS_COUNT} live classes in ${SUMMER_CAMP_BATCH_DURATION_LABEL}`;
const SUMMER_CAMP_SCHEDULE_LABEL = 'Monday to Saturday batches';
const SUMMER_CAMP_HOLIDAY_LABEL = 'Sunday holiday';
const SUMMER_CAMP_BATCH_START_OPTIONS = [
  '27 April 2026',
  '4 May 2026',
  '11 May 2026',
  '18 May 2026',
];
const SUMMER_CAMP_BATCH_START_OPTIONS_LABEL = '27 April, 4 May, 11 May and 18 May 2026';
const SUMMER_CAMP_BATCH_START_OPTIONS_SHORT = '27 Apr • 4 May • 11 May • 18 May';
const SUMMER_CAMP_FINAL_BATCH_START_LABEL = '18 May 2026';
const SUMMER_CAMP_FINAL_BATCH_CLOSE_LABEL = '13 June 2026';
const SUMMER_CAMP_SCHOOL_REOPEN_NOTE = 'Final batch closes before schools reopen on 15 June 2026.';
const SUMMER_CAMP_EFFECTIVE_PER_CLASS_PRICE = Math.round(
  SUMMER_CAMP_ENROLLMENT_PRICE / SUMMER_CAMP_PLANNED_CLASS_COUNT
);
const SUMMER_CAMP_FAST_TRACK_TEXT =
  "Hi, I'm looking for Tiny Steps Summer Camp 2026. Please share the available batch start dates and tracks.";
const SUMMER_CAMP_CHILD_AGE_OPTIONS = ['4-5 years', '6-7 years', '8-10 years', '10-12 years', 'Not sure yet'];
const SUMMER_CAMP_TRACK_OPTIONS = [
  'Phonics Fast Track',
  'Grammar Fast Track',
  'Speaking Fast Track',
  'Not sure yet',
];
const SUMMER_CAMP_LEAD_INITIAL_STATE: SummerCampLeadFormState = {
  name: '',
  email: '',
  phone: '',
  childAge: SUMMER_CAMP_CHILD_AGE_OPTIONS[0],
  track: SUMMER_CAMP_TRACK_OPTIONS[SUMMER_CAMP_TRACK_OPTIONS.length - 1],
  note: '',
  honeypot: '',
};

function getWhatsAppUrl(message: string) {
  return `https://wa.me/919618398383?text=${encodeURIComponent(message)}`;
}

function getProgramEnrollText(programTitle: string) {
  return `Hi, I'm looking to enroll for Summer Camp ${programTitle}.`;
}

function getBatchEnrollText(batchLabel: string) {
  return `Hi, I'm looking to enroll for Summer Camp ${batchLabel} batch.`;
}

const SUMMER_CAMP_WHATSAPP_URL = getWhatsAppUrl(SUMMER_CAMP_FAST_TRACK_TEXT);

function formatINR(value: number) {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

const PROGRAMS = [
  {
    id: 'phonics-fast-track',
    title: 'Phonics Fast Track',
    ages: 'Ages 4–8',
    duration: SUMMER_CAMP_VALUE_LABEL,
    subjects: ['Phonics'],
    focus: 'Focused 4-week track to refresh letter sounds, blending, and reading confidence',
    outcomes: [
      'Refresh core sounds + common blends',
      'Read short words and phrases with better accuracy',
      'Build stronger reading confidence before the next school term',
    ],
  },
  {
    id: 'grammar-fast-track',
    title: 'Grammar Fast Track',
    ages: 'Ages 6–12',
    duration: SUMMER_CAMP_VALUE_LABEL,
    subjects: ['Grammar'],
    focus: 'Focused 4-week track to strengthen sentence structure, punctuation, and writing clarity',
    outcomes: [
      'Fix common grammar mistakes in daily writing',
      'Use tense, punctuation, and sentence order correctly',
      'Write cleaner paragraphs with stronger flow',
    ],
  },
  {
    id: 'speaking-fast-track',
    title: 'Speaking Fast Track',
    ages: 'Ages 6–12',
    duration: SUMMER_CAMP_VALUE_LABEL,
    subjects: ['Speaking'],
    focus: 'Focused 4-week track for confident communication, presentation flow, and clearer pronunciation',
    outcomes: [
      'Speak confidently in short structured talks',
      'Use intro-body-close format naturally',
      'Improve clarity, pace, and voice control',
    ],
  },
];

const BATCHES = [
  {
    id: 'summer-camp-batch-start-27-apr-2026',
    label: 'Batch start: 27 April 2026',
    dates: `Season: ${SUMMER_CAMP_SEASON_DATE_RANGE_SHORT}`,
    duration: SUMMER_CAMP_VALUE_LABEL,
    mode: `${SUMMER_CAMP_SCHEDULE_LABEL} • ${SUMMER_CAMP_HOLIDAY_LABEL}`,
    capacity: `Capped at ${SUMMER_CAMP_BATCH_CAP} students`,
    note: 'Available for phonics, grammar, and speaking tracks.',
  },
  {
    id: 'summer-camp-batch-start-4-may-2026',
    label: 'Batch start: 4 May 2026',
    dates: `Season: ${SUMMER_CAMP_SEASON_DATE_RANGE_SHORT}`,
    duration: SUMMER_CAMP_VALUE_LABEL,
    mode: `${SUMMER_CAMP_SCHEDULE_LABEL} • ${SUMMER_CAMP_HOLIDAY_LABEL}`,
    capacity: `Capped at ${SUMMER_CAMP_BATCH_CAP} students`,
    note: 'Available for phonics, grammar, and speaking tracks.',
  },
  {
    id: 'summer-camp-batch-start-11-may-2026',
    label: 'Batch start: 11 May 2026',
    dates: `Season: ${SUMMER_CAMP_SEASON_DATE_RANGE_SHORT}`,
    duration: SUMMER_CAMP_VALUE_LABEL,
    mode: `${SUMMER_CAMP_SCHEDULE_LABEL} • ${SUMMER_CAMP_HOLIDAY_LABEL}`,
    capacity: `Capped at ${SUMMER_CAMP_BATCH_CAP} students`,
    note: 'Available for phonics, grammar, and speaking tracks.',
  },
  {
    id: 'summer-camp-batch-start-18-may-2026',
    label: 'Batch start: 18 May 2026',
    dates: `Season: ${SUMMER_CAMP_SEASON_DATE_RANGE_SHORT}`,
    duration: SUMMER_CAMP_VALUE_LABEL,
    mode: `${SUMMER_CAMP_SCHEDULE_LABEL} • ${SUMMER_CAMP_HOLIDAY_LABEL}`,
    capacity: `Capped at ${SUMMER_CAMP_BATCH_CAP} students`,
    note: SUMMER_CAMP_SCHOOL_REOPEN_NOTE,
  },
];
const STRETCH_CARDS = [
  {
    id: 'group',
    title: 'Limited Batch Size',
    desc: `Only ${SUMMER_CAMP_BATCH_CAP} students per batch for real attention and active participation.`,
    cta: 'See why it works',
    href: '/summer-camps#difference',
    surfaceClass: 'from-[#fff4df] via-[#fffaf2] to-[#ffe8c8]',
    borderClass: 'border-amber-200/80',
    ctaClass: 'text-amber-700',
    glowClass: 'bg-amber-300/30',
  },
  {
    id: 'curriculum',
    title: 'Premium Curriculum',
    desc: 'Same Tiny Steps learning framework in a focused summer format.',
    cta: 'View curriculum',
    href: '/curriculum',
    surfaceClass: 'from-[#e8f8ff] via-[#f4fcff] to-[#e9fff7]',
    borderClass: 'border-sky-200/80',
    ctaClass: 'text-sky-700',
    glowClass: 'bg-sky-300/30',
  },
  {
    id: 'results',
    title: 'Outcome-Focused Plan',
    desc: 'Clear 4-week batch structure inside a premium summer season designed for measurable improvement.',
    cta: 'See learning path',
    href: '/summer-camps#programs',
    surfaceClass: 'from-[#efe9ff] via-[#f7f4ff] to-[#e8f2ff]',
    borderClass: 'border-violet-200/80',
    ctaClass: 'text-violet-700',
    glowClass: 'bg-violet-300/30',
  },
  {
    id: 'price',
    title: 'Simple Enrollment',
    desc: `Fast Track Pack list fee: ₹${formatINR(SUMMER_CAMP_FULL_PRICE)}. Effective price: ₹${formatINR(SUMMER_CAMP_ENROLLMENT_PRICE)}.`,
    cta: 'Enroll now',
    href: '/summer-camps#programs',
    surfaceClass: 'from-[#e9fff4] via-[#f6fffb] to-[#e7f7ff]',
    borderClass: 'border-emerald-200/80',
    ctaClass: 'text-emerald-700',
    glowClass: 'bg-emerald-300/30',
  },
];

const FAQS = [
  {
    question: `Why is Tiny Steps Summer Camp limited to ${SUMMER_CAMP_BATCH_CAP} students?`,
    answer:
      `Tiny Steps limits each batch to ${SUMMER_CAMP_BATCH_CAP} students so every child gets enough speaking time, reading turns, and teacher attention during class.`,
  },
  {
    question: 'How is Tiny Steps different from regular summer camps?',
    answer:
      `Many summer camps are designed for larger groups and broader reach. Tiny Steps takes a different approach with limited batch sizes, live teacher-led interaction, and a stronger focus on real learning outcomes.`,
  },
  {
    question: 'Is Tiny Steps Summer Camp only fun or also academic?',
    answer:
      'It is both. Children learn through engaging activities, and the program is also designed to improve phonics, grammar, reading, speaking, and confidence.',
  },
  {
    question: 'Will my child get personal attention in a group class?',
    answer:
      `Yes. Since each batch is capped at ${SUMMER_CAMP_BATCH_CAP} students, the teacher can observe participation, correct mistakes live, and guide each child more effectively than in larger groups.`,
  },
  {
    question: 'What does my child improve in this summer camp?',
    answer:
      'Depending on the selected track, children improve in reading fluency, phonics accuracy, grammar usage, sentence formation, speaking confidence, pronunciation, and classroom participation.',
  },
  {
    question: 'What is included in Tiny Steps Summer Camp 2026?',
    answer:
      `The program runs as a summer camp season from ${SUMMER_CAMP_SEASON_START_LABEL} to ${SUMMER_CAMP_SEASON_END_LABEL}. Each child joins one ${SUMMER_CAMP_VALUE_LABEL.toLowerCase()} batch with ${SUMMER_CAMP_SCHEDULE_LABEL.toLowerCase()}, ${SUMMER_CAMP_HOLIDAY_LABEL.toLowerCase()}, live teacher-led online classes, worksheets, class recordings, and a quick level check before placement. Families choose one separate track-specific batch: Phonics Fast Track, Grammar Fast Track, or Speaking Fast Track.`,
  },
  {
    question: 'When does Tiny Steps Summer Camp 2026 start?',
    answer:
      `The Summer Camp season runs from ${SUMMER_CAMP_SEASON_START_LABEL} to ${SUMMER_CAMP_SEASON_END_LABEL}. Available batch start dates are ${SUMMER_CAMP_BATCH_START_OPTIONS_LABEL}.`,
  },
  {
    question: 'How many classes are included in the summer camp?',
    answer:
      `Each child gets ${SUMMER_CAMP_VALUE_LABEL} in a structured small-group format.`,
  },
  {
    question: 'Is the camp held every day?',
    answer:
      `Classes run ${SUMMER_CAMP_SCHEDULE_LABEL.toLowerCase()}. This gives children a steady routine during the summer break without making the program feel overwhelming.`,
  },
  {
    question: 'Are classes held on Sundays?',
    answer:
      'No. Sunday is kept as a holiday for rest and family time.',
  },
  {
    question: 'What is included in the ₹2,400 Fast Track Pack fee?',
    answer:
      `The summer camp list fee is ₹${formatINR(SUMMER_CAMP_FULL_PRICE)} per child. Effective price: ₹${formatINR(SUMMER_CAMP_ENROLLMENT_PRICE)} per child. This covers one ${SUMMER_CAMP_VALUE_LABEL.toLowerCase()} batch inside the ${SUMMER_CAMP_SEASON_DATE_RANGE_SHORT} season, with ${SUMMER_CAMP_SCHEDULE_LABEL.toLowerCase()}, ${SUMMER_CAMP_HOLIDAY_LABEL.toLowerCase()}, 50–60 minute live online classes, worksheets, and class recordings. This works out to about ₹${formatINR(SUMMER_CAMP_EFFECTIVE_PER_CLASS_PRICE)} per class.`,
  },
  {
    question: 'Are the classes live or recorded?',
    answer:
      'Classes are live teacher-led sessions with active participation, correction, and guided practice. Recordings are shared for revision support, but this is not a self-paced recorded course.',
  },
  {
    question: 'What is the class duration and support material?',
    answer:
      'Each session is typically 50–60 minutes. Children also receive effective worksheets and class recordings to revise and continue learning at home.',
  },
  {
    question: 'What device or materials are needed for the online summer camp?',
    answer:
      'A laptop or tablet with stable internet is ideal. Keep a notebook, pencil, and basic printed worksheet support ready. Headphones are optional but can help children focus better during live sessions.',
  },
  {
    question: 'How do parents track progress during this group camp?',
    answer:
      'Since this is a group camp, we follow a clear 4-week learning path with outcome goals instead of individual weekly dashboards for every child.',
  },
  {
    question: 'Is this summer camp group-only or 1:1?',
    answer:
      `This page is for premium small-group summer camp enrollment only. It is intentionally capped at ${SUMMER_CAMP_BATCH_CAP} students per batch.`,
  },
  {
    question: 'Who is this camp best for?',
    answer:
      'These camps are for ages 4–12, grouped by level after a quick assessment. Families can choose Phonics Fast Track, Grammar Fast Track, or Speaking Fast Track based on immediate need.',
  },
  {
    question: 'What happens if we miss a class due to travel or vacation?',
    answer:
      'Class recordings and worksheets support revision, so children can catch up and continue smoothly after a missed session.',
  },
  {
    question: 'How quickly can we enroll and confirm a seat?',
    answer:
      'Enrollment is quick. Click Enroll or WhatsApp on this page and send your request; our team will share the limited batch start dates and help reserve your child’s seat.',
  },
  {
    question: 'Do you offer morning, evening, or weekend batch options?',
    answer:
      `Batch timing depends on current demand and seat availability. The program runs ${SUMMER_CAMP_SCHEDULE_LABEL.toLowerCase()} with ${SUMMER_CAMP_HOLIDAY_LABEL.toLowerCase()}. Share your preferred time on WhatsApp or through the inquiry form and we will guide you to the closest fit from the limited start dates: ${SUMMER_CAMP_BATCH_START_OPTIONS_LABEL}.`,
  },
  {
    question: 'Can we choose a specific focus track?',
    answer:
      'Yes. Parents can choose Phonics Fast Track, Grammar Fast Track, or Speaking Fast Track. All tracks follow Tiny Steps core curriculum with track-specific emphasis.',
  },
  {
    question: 'Is this summer camp suitable for beginners?',
    answer:
      'Yes. Beginners can join. We do a quick level check before placement and group children by readiness so they are not overwhelmed.',
  },
  {
    question: 'How are phonics, grammar, and speaking levels decided?',
    answer:
      'Level placement happens through a quick pre-enrollment check. We review your child’s current ability and assign the right fast-track level for better participation and outcomes.',
  },
  {
    question: 'Do you offer a trial class before enrollment?',
    answer:
      'We start with a quick level check and counselor guidance. If you want a preview of how classes run, message us on WhatsApp and we will share the current onboarding options.',
  },
  {
    question: 'What is the teacher-to-student ratio in this camp?',
    answer:
      `Each batch is limited to ${SUMMER_CAMP_BATCH_CAP} students, which keeps the teacher-to-student ratio focused and allows active speaking, reading turns, and in-class correction.`,
  },
  {
    question: 'Can parents outside India enroll in this summer camp?',
    answer:
      'Yes. Classes are online, so global families can join based on available batch windows and time-zone fit.',
  },
  {
    question: 'Is there a completion certificate or final summary?',
    answer:
      'Parents receive a clear summary of track completion and next-step recommendations at the end of the camp. Ask the team during enrollment for the latest certificate policy.',
  },
  {
    question: 'What is the free level assessment?',
    answer:
      'Before enrollment, children complete a brief 10-15 minute assessment to check current phonics, grammar, or speaking ability. This helps place them in the right level group for better participation and learning outcomes. No cost, no obligation.',
  },
  {
    question: 'How does this summer camp help with school readiness?',
    answer:
      'These camps act as summer bridge programs—strengthening foundational skills (reading, grammar, speaking) before the new school term. Children return more confident and better prepared for classroom participation.',
  },
  {
    question: 'Are there multiple batch start dates?',
    answer:
      `Yes. Limited batch start dates are ${SUMMER_CAMP_BATCH_START_OPTIONS_LABEL}. Each child joins one 4-week batch.`,
  },
  {
    question: 'What is the last batch start date?',
    answer:
      `The last batch starts on ${SUMMER_CAMP_FINAL_BATCH_START_LABEL}.`,
  },
  {
    question: 'Will the camp finish before school reopens?',
    answer:
      `Yes. The final batch is designed to close by ${SUMMER_CAMP_FINAL_BATCH_CLOSE_LABEL}, before schools reopen on 15 June 2026.`,
  },
  {
    question: 'Is this good for summer catch-up or skill gaps?',
    answer:
      'Yes. The focused 4-week format is designed specifically for catch-up support. Whether your child needs stronger phonics, clearer grammar, or speaking confidence, the structured path addresses gaps systematically.',
  },
  {
    question: 'How is this different from regular Tiny Steps classes?',
    answer:
      'Same premium curriculum and teaching quality, but condensed into a focused 4-week summer format with group batches instead of individualized pacing. Perfect for families wanting structured summer learning with clear outcomes.',
  },
];

const SUMMER_CAMP_SEO_KEYWORDS = [
  'summer camp for kids',
  'online summer camp for kids',
  'summer classes for kids online',
  'online summer camp India',
  'summer camp for kids India',
  'best online summer camp for kids in India',
  'small-group online summer camp',
  'small group summer camp for kids',
  'phonics summer camp',
  'phonics summer camp for kids',
  'grammar summer camp for kids',
  'public speaking summer camp for kids',
  'english summer camp for kids',
  'communication summer camp for kids',
  'summer camp with limited batch size',
  'online summer camp with live classes',
  'best summer camp for phonics and reading',
  'interactive summer camp for kids',
  'summer camp fees for kids',
  'summer camp fees india',
  'summer camp near me online',
  'class recordings for kids online classes',
  'worksheets for kids summer camp',
  'summer catch-up program for kids',
  'summer bridge program english',
  'school readiness summer camp',
  'online phonics summer camp mumbai',
  'grammar summer classes for kids delhi ncr',
  'public speaking summer camp bengaluru',
  'summer english classes hyderabad for kids',
  'best online summer camp for 8 year olds',
  'how do online summer camps work',
  'live online summer camp with recordings',
  'free level assessment for kids summer camp',
];

const INDIA_PARENT_SEARCH_INTENTS = [
  {
    query: 'Best online summer camp for kids in India',
    answer:
      `If you want a serious summer program without crowd-style teaching, this is it. We keep each batch capped at ${SUMMER_CAMP_BATCH_CAP} students with ${SUMMER_CAMP_VALUE_LABEL.toLowerCase()}, ${SUMMER_CAMP_SCHEDULE_LABEL.toLowerCase()}, and limited batch start dates: ${SUMMER_CAMP_BATCH_START_OPTIONS_LABEL}.`,
    cta: 'View group batches',
    href: '/summer-camps#batches',
    cardClass: 'from-[#e9f8ff] via-[#f5fcff] to-[#e8fff7] border-sky-200/70',
    buttonClass: 'from-sky-600 to-cyan-500 hover:from-sky-700 hover:to-cyan-600',
  },
  {
    query: 'Online phonics summer camp in Mumbai',
    answer:
      'Phonics Fast Track refreshes sounds, blends, and reading confidence so your child returns to school with stronger fluency and fewer reading pauses.',
    cta: 'See phonics fast track',
    href: '/summer-camps/phonics-fast-track',
    cardClass: 'from-[#fff6e7] via-[#fffaf2] to-[#fff2de] border-amber-200/70',
    buttonClass: 'from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600',
  },
  {
    query: 'Grammar summer classes for kids in Delhi NCR',
    answer:
      'Grammar Fast Track helps children clean up sentence structure, punctuation, and tense with live guidance and practical writing correction.',
    cta: 'See grammar fast track',
    href: '/summer-camps/grammar-fast-track',
    cardClass: 'from-[#efe9ff] via-[#f7f3ff] to-[#edefff] border-violet-200/70',
    buttonClass: 'from-violet-600 to-indigo-500 hover:from-violet-700 hover:to-indigo-600',
  },
  {
    query: 'Public speaking summer camp in Bengaluru',
    answer:
      'Speaking Fast Track builds clarity, confidence, and structured speaking so children can respond, present, and communicate with ease.',
    cta: 'See speaking fast track',
    href: '/summer-camps/speaking-fast-track',
    cardClass: 'from-[#ffeef4] via-[#fff5f8] to-[#ffe8ef] border-rose-200/70',
    buttonClass: 'from-rose-600 to-pink-500 hover:from-rose-700 hover:to-pink-600',
  },
  {
    query: 'Summer camp fees for kids in India',
    answer:
      `Fast Track Pack list fee is ₹${formatINR(SUMMER_CAMP_FULL_PRICE)} per child. Effective price: ₹${formatINR(SUMMER_CAMP_ENROLLMENT_PRICE)} per child. Planned ${SUMMER_CAMP_PLANNED_CLASS_COUNT} live sessions means about ₹${formatINR(SUMMER_CAMP_EFFECTIVE_PER_CLASS_PRICE)} per class.`,
    cta: 'Check fee and enroll',
    href: '/summer-camps#enrollment',
    cardClass: 'from-[#eefcf2] via-[#f7fff9] to-[#e8fbff] border-emerald-200/70',
    buttonClass: 'from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600',
  },
  {
    query: 'Online summer camp near me for kids',
    answer:
      'Completely online. Families across Hyderabad, Mumbai, Delhi NCR, Bengaluru, Pune, Kolkata, and other Indian cities can join from home and still get live teacher-led sessions with real interaction and correction.',
    cta: 'Chat on WhatsApp',
    href: '/summer-camps#whatsapp-enroll',
    cardClass: 'from-[#edf3ff] via-[#f6f9ff] to-[#eaf0ff] border-indigo-200/70',
    buttonClass: 'from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600',
  },
];

const INDIA_CITY_COVERAGE = [
  'Hyderabad',
  'Bengaluru',
  'Chennai',
  'Mumbai',
  'Delhi NCR',
  'Pune',
  'Kolkata',
  'Ahmedabad',
  'Gurugram',
  'Noida',
  'Jaipur',
  'Coimbatore',
];

const SUMMER_CAMP_VOICE_SEARCH_QUERIES = [
  'best online summer camp for 7 year olds',
  'online phonics summer camp near me',
  'summer grammar classes for kids in delhi',
  'public speaking classes for kids this summer',
  'online summer camp with live classes and recordings',
  'small group summer camp for kids india',
];

const PARENT_ENROLLMENT_CHECKLIST = [
  {
    title: `Only ${SUMMER_CAMP_BATCH_CAP} Students per Batch`,
    detail: 'No crowd learning. Every child gets active turns, teacher attention, and live correction.',
    cardClass: 'from-[#ebf7ff] via-white to-[#e8fff6] border-sky-200/70',
    badgeClass: 'bg-sky-100 text-sky-700',
  },
  {
    title: '50–60 Minute Live Classes',
    detail: 'Longer classes for deeper guided practice in reading, grammar, and speaking.',
    cardClass: 'from-[#fff7e7] via-white to-[#fff1df] border-amber-200/70',
    badgeClass: 'bg-amber-100 text-amber-700',
  },
  {
    title: 'Premium Curriculum',
    detail: 'Phonics, grammar, and speaking fast-track tracks aligned to the regular Tiny Steps curriculum.',
    cardClass: 'from-[#f1ecff] via-white to-[#ecefff] border-violet-200/70',
    badgeClass: 'bg-violet-100 text-violet-700',
  },
  {
    title: '24 Live Classes in 4 Weeks',
    detail: `Each child joins one 4-week batch inside the season from ${SUMMER_CAMP_SEASON_START_LABEL} to ${SUMMER_CAMP_SEASON_END_LABEL}.`,
    cardClass: 'from-[#e8fff4] via-white to-[#e9fbff] border-emerald-200/70',
    badgeClass: 'bg-emerald-100 text-emerald-700',
  },
  {
    title: 'Worksheets + Class Recordings',
    detail: 'Effective worksheets and class recordings support continuity and home revision.',
    cardClass: 'from-[#ffeef5] via-white to-[#fff4f8] border-rose-200/70',
    badgeClass: 'bg-rose-100 text-rose-700',
  },
  {
    title: 'Fast Admission Support',
    detail: `One-click WhatsApp enrollment with limited batch start dates: ${SUMMER_CAMP_BATCH_START_OPTIONS_LABEL}.`,
    cardClass: 'from-[#edf2ff] via-white to-[#eff7ff] border-indigo-200/70',
    badgeClass: 'bg-indigo-100 text-indigo-700',
  },
];

const DIFFERENCE_ROWS = [
  {
    conventional: 'Often larger groups',
    premium: `Only ${SUMMER_CAMP_BATCH_CAP} students per batch`,
    rowClass: 'from-amber-50/60 to-orange-50/50',
  },
  {
    conventional: 'General delivery',
    premium: 'Focused skill-based teaching',
    rowClass: 'from-sky-50/60 to-cyan-50/50',
  },
  {
    conventional: 'Limited child participation',
    premium: 'Every child gets active turns',
    rowClass: 'from-violet-50/60 to-indigo-50/50',
  },
  {
    conventional: 'Less room for live correction',
    premium: 'Better teacher observation and feedback',
    rowClass: 'from-emerald-50/60 to-teal-50/50',
  },
  {
    conventional: 'Often broad activity-style engagement',
    premium: 'Structured learning in phonics, grammar, reading, and speaking',
    rowClass: 'from-rose-50/60 to-pink-50/50',
  },
  {
    conventional: 'Harder to notice progress gaps',
    premium: 'Easier to guide improvement in class',
    rowClass: 'from-indigo-50/60 to-blue-50/50',
  },
  {
    conventional: 'Can feel crowded',
    premium: 'Feels guided, warm, and interactive',
    rowClass: 'from-emerald-50/60 to-lime-50/50',
  },
];

function StretchCardsRow() {
  const [activeId, setActiveId] = useState<string>(STRETCH_CARDS[0].id);

  return (
    <div className="flex flex-col gap-3 sm:gap-4 md:flex-row">
      {STRETCH_CARDS.map((card) => {
        const isActive = activeId === card.id;
        return (
          <Link
            key={card.id}
            to={card.href}
            onMouseEnter={() => setActiveId(card.id)}
            onFocus={() => setActiveId(card.id)}
            onClick={(event) => {
              if (typeof window !== 'undefined') {
                const prefersTap = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
                if (prefersTap && !isActive) {
                  event.preventDefault();
                  setActiveId(card.id);
                }
              }
            }}
            className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-4 shadow-sm transition-all duration-300 motion-reduce:transition-none sm:p-5 lg:p-6 ${card.surfaceClass} ${card.borderClass} ${isActive ? 'md:flex-[2_1_0%] md:-translate-y-1 md:shadow-xl' : 'md:flex-[1_1_0%] opacity-95 hover:opacity-100 hover:-translate-y-1 hover:shadow-lg'}`}
          >
            <div className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl ${card.glowClass}`} />
            <div className="flex h-full flex-col gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{card.title}</h3>
                <p className="mt-2 text-sm text-slate-700">{card.desc}</p>
              </div>
              <div className={`mt-auto text-sm font-semibold transition-transform duration-300 group-hover:translate-x-1 ${card.ctaClass}`}>
                {card.cta} →
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function SummerCampLeadForm() {
  const [form, setForm] = useState<SummerCampLeadFormState>(SUMMER_CAMP_LEAD_INITIAL_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const hasTrackedFormStartRef = useRef(false);

  const trackFormStartOnce = () => {
    if (hasTrackedFormStartRef.current) return;
    hasTrackedFormStartRef.current = true;
    trackLeadFormStart({
      form_name: 'summer_camp_lead_form',
      program: 'summer_camp',
      source_context: 'summer_camps_page',
    });
  };

  const updateField = <K extends keyof SummerCampLeadFormState>(field: K, value: SummerCampLeadFormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSubmitted(false);

    if (form.honeypot.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const message = [
        `Child age: ${form.childAge}`,
        `Track interest: ${form.track}`,
        form.note.trim() ? `Parent note: ${form.note.trim()}` : '',
        'Requested from: Summer Camp page',
      ]
        .filter(Boolean)
        .join('\n');

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          message,
          topic: 'Summer camp inquiry',
          pagePath: typeof window !== 'undefined' ? window.location.pathname : '/summer-camps',
          submittedAt: new Date().toISOString(),
          ...buildLeadAttributionPayload('/summer-camps'),
        }),
      });

      if (!response.ok) {
        throw new Error('Unable to submit inquiry');
      }

      const result = await response.json().catch(() => null);

      trackLeadFormSubmit({
        form_name: 'summer_camp_lead_form',
        program: 'summer_camp',
        source_context: 'summer_camps_page',
      });
      trackGenerateLead({
        form_name: 'summer_camp_lead_form',
        program: 'summer_camp',
        source_context: 'summer_camps_page',
        lead_channel: 'summer_camp_form',
        lead_type: 'parent_inquiry',
        submission_id: typeof result?.submissionId === 'string' ? result.submissionId : undefined,
      });
      setSubmitted(true);
      setForm(SUMMER_CAMP_LEAD_INITIAL_STATE);
    } catch {
      setError('We could not send your request right now. Please use WhatsApp and we will share the next batch options.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} onFocusCapture={trackFormStartOnce} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="text"
          value={form.name}
          onChange={(event) => updateField('name', event.target.value)}
          placeholder="Parent name"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
          required
        />
        <input
          type="email"
          value={form.email}
          onChange={(event) => updateField('email', event.target.value)}
          placeholder="Email address"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
          required
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="tel"
          value={form.phone}
          onChange={(event) => updateField('phone', event.target.value)}
          placeholder="Phone or WhatsApp number"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
          required
        />
        <select
          value={form.childAge}
          onChange={(event) => updateField('childAge', event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
        >
          {SUMMER_CAMP_CHILD_AGE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <select
        value={form.track}
        onChange={(event) => updateField('track', event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
      >
        {SUMMER_CAMP_TRACK_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <textarea
        value={form.note}
        onChange={(event) => updateField('note', event.target.value)}
        placeholder="Anything we should know? For example: weekday evenings only, confidence issues, reading catch-up, or want brochure first."
        rows={4}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
      />

      <div className="hidden" aria-hidden="true">
        <label htmlFor="summer-camp-company">Company</label>
        <input
          id="summer-camp-company"
          type="text"
          value={form.honeypot}
          onChange={(event) => updateField('honeypot', event.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex min-h-[46px] w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? 'Sending inquiry...' : 'Request batch recommendation'}
      </button>

      <p className="text-xs text-slate-500">
        Use this if you want the brochure, best-fit track, or the next available batch before paying.
      </p>

      {submitted ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status" aria-live="polite">
          Thank you. We received your inquiry and will follow up with the next batch options.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
          {error}
        </div>
      ) : null}
    </form>
  );
}

export default function SummerCampsPage() {
  useEffect(() => {
    const pageDescription =
      `Join Tiny Steps Summer Camp 2026, an online summer English camp for kids in India. Choose one focused track: phonics, grammar, or speaking. Each child joins one track-specific ${SUMMER_CAMP_VALUE_LABEL.toLowerCase()} batch with ${SUMMER_CAMP_SCHEDULE_LABEL.toLowerCase()}, ${SUMMER_CAMP_HOLIDAY_LABEL.toLowerCase()}, and limited batch start dates: ${SUMMER_CAMP_BATCH_START_OPTIONS_LABEL}.`;

    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': 'https://tinystepslearning.com/summer-camps#faq',
      mainEntity: FAQS.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    };

    const courseListSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': 'https://tinystepslearning.com/summer-camps#courses',
      name: 'Tiny Steps Summer Camp Fast Track Courses',
      itemListElement: PROGRAMS.map((program, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Course',
            '@id': `https://tinystepslearning.com/summer-camps/${program.id}`,
            name: program.title,
            description: `${program.focus}. Summer Camp Season: ${SUMMER_CAMP_SEASON_DATE_RANGE_LABEL}. Each child joins one ${SUMMER_CAMP_VALUE_LABEL.toLowerCase()} batch with ${SUMMER_CAMP_SCHEDULE_LABEL.toLowerCase()}, ${SUMMER_CAMP_HOLIDAY_LABEL.toLowerCase()}, capped at ${SUMMER_CAMP_BATCH_CAP} students.`,
            inLanguage: 'en-IN',
            courseMode: 'Online',
            educationalLevel: program.ages,
          teaches: program.subjects,
          offers: {
            '@type': 'Offer',
            priceCurrency: 'INR',
            price: SUMMER_CAMP_ENROLLMENT_PRICE,
            availability: 'https://schema.org/InStock',
            eligibleRegion: 'IN',
            url: `https://tinystepslearning.com/summer-camps/${program.id}`,
          },
          provider: {
            '@type': 'Organization',
            name: 'Tiny Steps Learning',
            url: 'https://tinystepslearning.com',
          },
        },
      })),
    };

    const webPageSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': 'https://tinystepslearning.com/summer-camps#webpage',
      url: 'https://tinystepslearning.com/summer-camps',
      name: 'Online Summer English Camp for Kids in India | Tiny Steps Summer Camp 2026',
      description: pageDescription,
      inLanguage: 'en-IN',
      audience: {
        '@type': 'PeopleAudience',
        suggestedMinAge: 4,
        suggestedMaxAge: 12,
      },
      about: [
        { '@type': 'Thing', name: 'Online summer camp for kids in India' },
        { '@type': 'Thing', name: 'Phonics classes for kids online' },
        { '@type': 'Thing', name: 'Grammar classes for kids online' },
        { '@type': 'Thing', name: 'Public speaking classes for kids online' },
      ],
    };

    const serviceSchema = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      '@id': 'https://tinystepslearning.com/summer-camps#service',
      name: 'Tiny Steps Summer Camp Fast Track Pack',
      serviceType: 'Online summer camp for kids',
      description: `Summer Camp Season: ${SUMMER_CAMP_SEASON_DATE_RANGE_LABEL}. Each child joins one track-specific ${SUMMER_CAMP_VALUE_LABEL.toLowerCase()} batch with ${SUMMER_CAMP_SCHEDULE_LABEL.toLowerCase()}, ${SUMMER_CAMP_HOLIDAY_LABEL.toLowerCase()}, capped at ${SUMMER_CAMP_BATCH_CAP} students. Choose Phonics Fast Track, Grammar Fast Track, or Speaking Fast Track. Limited batch start dates: ${SUMMER_CAMP_BATCH_START_OPTIONS_LABEL}.`,
      areaServed: [
        {
          '@type': 'Country',
          name: 'India',
        },
        ...INDIA_CITY_COVERAGE.map((city) => ({
          '@type': city === 'Delhi NCR' ? 'AdministrativeArea' : 'City',
          name: city,
        })),
      ],
      provider: {
        '@type': 'EducationalOrganization',
        name: 'Tiny Steps Learning',
        url: 'https://tinystepslearning.com',
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          telephone: '+91-9618398383',
          url: 'https://tinystepslearning.com/contact',
          availableLanguage: ['en-IN', 'en'],
        },
      },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'INR',
        price: SUMMER_CAMP_ENROLLMENT_PRICE,
        category: 'Summer Camp Fast Track Pack',
        availability: 'https://schema.org/InStock',
        eligibleRegion: 'IN',
        url: 'https://tinystepslearning.com/summer-camps',
      },
      availableChannel: {
        '@type': 'ServiceChannel',
        serviceUrl: 'https://tinystepslearning.com/summer-camps',
        availableLanguage: ['en-IN', 'en'],
      },
    };

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://tinystepslearning.com/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Summer Camps',
          item: 'https://tinystepslearning.com/summer-camps',
        },
      ],
    };

    // Event schemas for summer camp programs
    const phonicsEventSchema = createEventSchema({
      name: 'Phonics Fast Track Summer Camp 2026',
      description: `Focused 4-week phonics program inside the Tiny Steps Summer Camp 2026 season (${SUMMER_CAMP_SEASON_DATE_RANGE_LABEL}) with ${SUMMER_CAMP_VALUE_LABEL.toLowerCase()}, ${SUMMER_CAMP_SCHEDULE_LABEL.toLowerCase()}, ${SUMMER_CAMP_HOLIDAY_LABEL.toLowerCase()}, and limited batch start dates: ${SUMMER_CAMP_BATCH_START_OPTIONS_LABEL}.`,
      startDate: '2026-04-27',
      endDate: '2026-06-13',
      url: 'https://tinystepslearning.com/summer-camps/phonics-fast-track',
      price: SUMMER_CAMP_ENROLLMENT_PRICE,
      eventAttendanceMode: 'OnlineEventAttendanceMode'
    });

    const grammarEventSchema = createEventSchema({
      name: 'Grammar Fast Track Summer Camp 2026',
      description: `Focused 4-week grammar program inside the Tiny Steps Summer Camp 2026 season (${SUMMER_CAMP_SEASON_DATE_RANGE_LABEL}) with ${SUMMER_CAMP_VALUE_LABEL.toLowerCase()}, ${SUMMER_CAMP_SCHEDULE_LABEL.toLowerCase()}, ${SUMMER_CAMP_HOLIDAY_LABEL.toLowerCase()}, and limited batch start dates: ${SUMMER_CAMP_BATCH_START_OPTIONS_LABEL}.`,
      startDate: '2026-04-27',
      endDate: '2026-06-13',
      url: 'https://tinystepslearning.com/summer-camps/grammar-fast-track',
      price: SUMMER_CAMP_ENROLLMENT_PRICE,
      eventAttendanceMode: 'OnlineEventAttendanceMode'
    });

    const speakingEventSchema = createEventSchema({
      name: 'Speaking Fast Track Summer Camp 2026',
      description: `Focused 4-week communication program inside the Tiny Steps Summer Camp 2026 season (${SUMMER_CAMP_SEASON_DATE_RANGE_LABEL}) with ${SUMMER_CAMP_VALUE_LABEL.toLowerCase()}, ${SUMMER_CAMP_SCHEDULE_LABEL.toLowerCase()}, ${SUMMER_CAMP_HOLIDAY_LABEL.toLowerCase()}, and limited batch start dates: ${SUMMER_CAMP_BATCH_START_OPTIONS_LABEL}.`,
      startDate: '2026-04-27',
      endDate: '2026-06-13',
      url: 'https://tinystepslearning.com/summer-camps/speaking-fast-track',
      price: SUMMER_CAMP_ENROLLMENT_PRICE,
      eventAttendanceMode: 'OnlineEventAttendanceMode'
    });

    applySeo({
      title: 'Online Summer English Camp for Kids in India | Tiny Steps Summer Camp 2026',
      description: pageDescription,
      keywords: SUMMER_CAMP_SEO_KEYWORDS,
      canonicalPath: '/summer-camps',
      robots: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
      ogType: 'website',
      jsonLd: [
        breadcrumbSchema, 
        webPageSchema, 
        serviceSchema, 
        courseListSchema, 
        faqSchema,
        phonicsEventSchema,
        grammarEventSchema,
        speakingEventSchema
      ],
    });
  }, []);

  return (
    <>
      <div className="bg-white pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <section className="relative isolate overflow-hidden bg-[radial-gradient(120%_120%_at_0%_0%,#ffd8a2_0%,rgba(255,216,162,0)_46%),radial-gradient(95%_95%_at_100%_0%,#a8ecff_0%,rgba(168,236,255,0)_50%),radial-gradient(90%_90%_at_50%_100%,#b8f4df_0%,rgba(184,244,223,0)_52%),linear-gradient(135deg,#fff8ed_0%,#f8fcff_46%,#eefdf6_100%)]">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.3)_0%,rgba(255,255,255,0)_55%)]" />
          <div className="pointer-events-none absolute -left-20 top-4 h-72 w-72 rounded-full bg-[#ffad45]/25 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-[#2dc7ff]/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-[#14c48f]/20 blur-3xl" />
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
            <div className="grid items-end gap-6 sm:gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <nav aria-label="Breadcrumb" className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <ol className="flex flex-wrap items-center gap-2">
                    <li>
                      <Link to="/" className="hover:text-emerald-700">Home</Link>
                    </li>
                    <li aria-hidden="true">/</li>
                    <li className="text-emerald-700">Summer Camps</li>
                  </ol>
                </nav>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
                  Tiny Steps Summer Camp 2026
                </p>
                <h1 className="mt-3 text-3xl font-black leading-tight text-slate-900 sm:text-4xl md:text-5xl">
                  Online Summer English Camp 2026 for Kids in India
                </h1>
                <p className="mt-4 max-w-3xl text-base text-slate-700 sm:text-lg">
                  A focused summer learning season for children ages 4–12. Summer Camp Season: {SUMMER_CAMP_SEASON_DATE_RANGE_LABEL}. Parents choose one focus track for each child: Phonics Fast Track, Grammar Fast Track, or Speaking Fast Track.
                </p>
                
                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm shadow-sm">
                  <span className="text-lg">⏰</span>
                  <span className="font-semibold text-amber-900">Season: {SUMMER_CAMP_SEASON_DATE_RANGE_SHORT}</span>
                  <span className="text-amber-700">• Final batch starts {SUMMER_CAMP_FINAL_BATCH_START_LABEL}</span>
                </div>
                
                <p className="mt-3 text-sm text-slate-600">
                  Limited batch start dates available: {SUMMER_CAMP_BATCH_START_OPTIONS_LABEL} • {SUMMER_CAMP_VALUE_LABEL} • {SUMMER_CAMP_HOLIDAY_LABEL} • {SUMMER_CAMP_SCHOOL_REOPEN_NOTE}
                </p>
                <div className="mt-5 flex flex-wrap gap-3 text-sm">
                  <span className="rounded-full bg-white px-4 py-1 text-slate-700 shadow-sm">Ages 4–12</span>
                  <span className="rounded-full bg-white px-4 py-1 text-slate-700 shadow-sm">{SUMMER_CAMP_VALUE_LABEL}</span>
                  <span className="rounded-full bg-white px-4 py-1 text-slate-700 shadow-sm">{SUMMER_CAMP_SCHEDULE_LABEL}</span>
                  <span className="rounded-full bg-white px-4 py-1 text-slate-700 shadow-sm">{SUMMER_CAMP_HOLIDAY_LABEL}</span>
                  <span className="rounded-full bg-white px-4 py-1 text-slate-700 shadow-sm">Batch starts: {SUMMER_CAMP_BATCH_START_OPTIONS_SHORT}</span>
                  <span className="rounded-full bg-emerald-100 px-4 py-1 font-semibold text-emerald-800">
                    Capped at {SUMMER_CAMP_BATCH_CAP} students per batch
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-600">
                  Age ranges are guidelines; final grouping is based on level after a quick assessment.
                </p>
              </div>
              <div
                id="enrollment"
                className="scroll-mt-24 rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-white/95 via-white to-emerald-50/70 p-5 shadow-[0_14px_40px_rgba(16,185,129,0.12)] backdrop-blur-sm sm:p-6 sm:shadow-[0_18px_55px_rgba(16,185,129,0.16)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
                  Summer Camp Enrollment
                </p>
                <p className="mt-2 text-4xl font-black text-slate-900 sm:text-5xl">₹{formatINR(SUMMER_CAMP_ENROLLMENT_PRICE)}</p>
                <p className="mt-1 text-xs font-semibold text-emerald-700">
                  <span className="text-slate-500 line-through">₹{formatINR(SUMMER_CAMP_FULL_PRICE)}</span>{' '}
                  <span>Effective price: ₹{formatINR(SUMMER_CAMP_ENROLLMENT_PRICE)}</span>
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  Fast Track Pack fee per child. Includes free level assessment and support choosing the right batch start date.
                </p>
                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <p>Capped at {SUMMER_CAMP_BATCH_CAP} students per batch</p>
                  <p>Live online group batches across India</p>
                  <p>Summer Camp Season: {SUMMER_CAMP_SEASON_DATE_RANGE_LABEL}</p>
                  <p>Batch start dates: {SUMMER_CAMP_BATCH_START_OPTIONS_LABEL}</p>
                  <p>{SUMMER_CAMP_VALUE_LABEL}</p>
                  <p>{SUMMER_CAMP_SCHEDULE_LABEL}</p>
                  <p>{SUMMER_CAMP_HOLIDAY_LABEL}</p>
                  <p>50–60 minute live classes</p>
                  <p>Choose one focus track: phonics, grammar, or speaking</p>
                  <p>Effective worksheets + class recordings</p>
                </div>
                <div id="whatsapp-enroll" className="mt-5 flex scroll-mt-24 flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <a
                    href={SUMMER_CAMP_WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  className="inline-flex min-h-[46px] items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-emerald-700 hover:to-teal-600 hover:shadow-lg"
                >
                    Reserve a Summer Camp Seat
                  </a>
                  <a
                    href={SUMMER_CAMP_WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[46px] items-center justify-center rounded-full border border-emerald-500 bg-white/90 px-4 py-2 text-sm font-semibold text-emerald-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-600 hover:bg-emerald-50"
                  >
                    Ask About Batches on WhatsApp
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href={SUMMER_CAMP_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
              className="inline-flex min-h-[46px] w-full items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-emerald-700 hover:to-teal-600 hover:shadow-lg sm:w-auto"
            >
                Reserve a Summer Camp Seat
              </a>
              <a
                href={SUMMER_CAMP_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[46px] w-full items-center justify-center rounded-full border border-emerald-500 bg-white/90 px-5 py-2.5 text-sm font-semibold text-emerald-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-600 hover:bg-emerald-50 sm:w-auto"
              >
                Ask About Batches on WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* Camp Facts - Fast-Scan Info Block */}
        <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-sky-50/30 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="border-b border-slate-200/60 bg-white/60 px-6 py-4 backdrop-blur-sm">
              <h2 className="text-xl font-bold text-slate-900">Summer Camp at a Glance</h2>
              <p className="mt-1 text-sm text-slate-600">Everything parents need to know</p>
            </div>

            <div className="grid gap-px bg-slate-200/40 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white px-6 py-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-lg">🚀</div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Season Dates</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{SUMMER_CAMP_SEASON_DATE_RANGE_LABEL}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white px-6 py-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-lg">🏁</div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Batch Duration</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{SUMMER_CAMP_BATCH_DURATION_LABEL}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white px-6 py-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-lg">📅</div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Class Count</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{SUMMER_CAMP_VALUE_LABEL}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white px-6 py-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-lg">⏱️</div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Weekly Schedule</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{SUMMER_CAMP_SCHEDULE_LABEL}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white px-6 py-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-lg">🗓️</div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start-Date Options</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{SUMMER_CAMP_BATCH_START_OPTIONS_SHORT}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white px-6 py-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg">🌿</div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sunday</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{SUMMER_CAMP_HOLIDAY_LABEL}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Best For</p>
              <ul className="mt-3 space-y-2">
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="mt-0.5 text-emerald-600">✓</span>
                  <span>Summer bridge to strengthen phonics, grammar, or speaking skills</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="mt-0.5 text-emerald-600">✓</span>
                  <span>Catch-up or confidence boost before new school term</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="mt-0.5 text-emerald-600">✓</span>
                  <span>Structured summer learning with clear outcomes (not just entertainment)</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="mt-0.5 text-emerald-600">✓</span>
                  <span>Small-group environment with live teacher attention and correction</span>
                </li>
              </ul>
            </div>

            <div className="border-t border-slate-200/60 bg-white px-6 py-5 text-center">
              <a
                href={SUMMER_CAMP_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Enroll for ₹{formatINR(SUMMER_CAMP_ENROLLMENT_PRICE)}
              </a>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 sm:pt-10">
          <div className="rounded-2xl border border-emerald-100 bg-white p-4 text-sm leading-relaxed text-gray-700">
            Quick jumps:{' '}
            <Link to="/summer-camps#programs" className="font-semibold text-emerald-700 hover:text-emerald-800">
              Choose a program
            </Link>{' '}
            •{' '}
            <Link to="/summer-camps#india-parent-searches" className="font-semibold text-emerald-700 hover:text-emerald-800">
              Parent enrollment guide
            </Link>{' '}
            •{' '}
            <Link to="/summer-camps#batches" className="font-semibold text-emerald-700 hover:text-emerald-800">
              View group batches
            </Link>{' '}
            •{' '}
            <Link to="/summer-camps#quick-inquiry" className="font-semibold text-emerald-700 hover:text-emerald-800">
              Ask for a callback
            </Link>{' '}
            •{' '}
            <Link to="/summer-camps#fee-breakdown" className="font-semibold text-emerald-700 hover:text-emerald-800">
              Fee breakdown
            </Link>{' '}
            •{' '}
            <Link to="/summer-camps#faqs" className="font-semibold text-emerald-700 hover:text-emerald-800">
              Read FAQs
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-6 sm:pb-12 sm:pt-10">
          <div className="mb-6 flex flex-col gap-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">Quick Highlights</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Why families choose these camps</h2>
            <p className="text-sm text-gray-600">
              Tap a card to expand on mobile, or hover on desktop.
            </p>
          </div>
          <StretchCardsRow />
        </section>

        <section id="difference" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-10 sm:px-6 sm:pb-12">
          <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-[#f9fcff] to-[#eefbf4] p-5 shadow-sm sm:p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
              Why Tiny Steps Is Different
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
              Premium outcomes, small group, real attention
            </h2>
            <p className="mt-3 text-sm text-slate-700">
              Many camps optimize for volume. Tiny Steps is designed for visible progress with tighter batches, live correction, and real participation in every class.
            </p>

            <div className="mt-6 hidden md:block">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-sm">
                <table className="min-w-full text-sm">
                  <thead className="bg-gradient-to-r from-slate-100 via-white to-emerald-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Conventional Summer Camps</th>
                      <th className="px-4 py-3 text-left font-semibold text-emerald-800">Tiny Steps Premium Summer Camp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DIFFERENCE_ROWS.map((row) => (
                      <tr
                        key={row.conventional}
                        className={`bg-gradient-to-r ${row.rowClass} transition-all duration-300 hover:scale-[1.01] hover:shadow-inner`}
                      >
                        <td className="border-t border-white/70 px-4 py-3.5 text-slate-700">{row.conventional}</td>
                        <td className="border-t border-white/70 px-4 py-3.5 font-medium text-slate-900">{row.premium}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:hidden">
              {DIFFERENCE_ROWS.map((row) => (
                <div
                  key={row.conventional}
                  className={`rounded-2xl border border-slate-200 bg-gradient-to-br ${row.rowClass} p-4 shadow-sm transition-transform duration-300 active:scale-[0.99]`}
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">Conventional</div>
                  <p className="mt-1 text-sm text-slate-700">{row.conventional}</p>
                  <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-emerald-700">Tiny Steps</div>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{row.premium}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-[#e8fff6] via-white to-[#eaf8ff] p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-emerald-800">What your child gets</h3>
                <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                  <li>More speaking and reading turns in every class</li>
                  <li>More teacher attention and direct correction</li>
                  <li>More confidence in a focused, safe group</li>
                  <li>More skill growth, not passive listening</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-violet-200/70 bg-gradient-to-br from-[#f1ebff] via-white to-[#e8f0ff] p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">Positioning line</h3>
                <p className="mt-2 text-sm font-medium text-slate-800">
                  In every capped batch of {SUMMER_CAMP_BATCH_CAP}, your child is seen, coached, corrected, and improved.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="india-parent-searches" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-10 sm:px-6 sm:pb-12">
          <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-[#fff8eb] via-[#ffffff] to-[#ebf8ff] p-5 shadow-sm sm:p-6 md:p-8">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
                Parent Enrollment Guide
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">
                Questions parents usually ask us before enrolling
              </h2>
              <p className="mt-3 text-sm text-gray-700">
                These are the real questions families ask on calls and WhatsApp. We answered them clearly so you can decide faster, without guesswork.
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {INDIA_PARENT_SEARCH_INTENTS.map((intent) => (
                <div
                  key={intent.query}
                  className={`group rounded-2xl border bg-gradient-to-br p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-5 ${intent.cardClass}`}
                >
                  <h3 className="text-base font-semibold text-gray-900">{intent.query}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{intent.answer}</p>
                  <Link
                    to={intent.href}
                    className={`mt-4 inline-flex min-h-[42px] w-full items-center justify-center rounded-full bg-gradient-to-r px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-300 group-hover:shadow-md sm:w-auto ${intent.buttonClass}`}
                  >
                    {intent.cta}
                  </Link>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-amber-100 pt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-600">
                Cities We Commonly Serve Online
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {INDIA_CITY_COVERAGE.map((city) => (
                  <span key={city} className="rounded-full border border-slate-200/80 bg-gradient-to-r from-white to-slate-50 px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm">
                    {city}
                  </span>
                ))}
              </div>
              <p className="mt-3 max-w-3xl text-sm text-slate-600">
                Many parents still search with a city name or even &quot;near me&quot; before choosing an online camp. We keep the program online-first, but write this page to answer the same city-led questions families use across India.
              </p>
            </div>

            <div className="mt-6 grid gap-4 border-t border-amber-100 pt-5 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Voice-Style Parent Searches
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {SUMMER_CAMP_VOICE_SEARCH_QUERIES.map((query) => (
                    <span
                      key={query}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                    >
                      {query}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-[#ecfff5] via-white to-[#edf8ff] p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                  Why this matters
                </p>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  <li>Parents often search by age, city, and exact skill gap instead of browsing generic camp listings.</li>
                  <li>Direct answers on the page help families compare faster on mobile, especially when they are shortlisting after work hours.</li>
                  <li>Live classes, capped batches, recordings, and the free level assessment are the details that usually move parents from search to inquiry.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 sm:pb-12">
          <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-[#f8fbff] via-white to-[#f3fff9] p-5 shadow-sm sm:p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
              Parent Enrollment Checklist
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
              What Indian parents compare before choosing a summer camp
            </h2>
            <p className="mt-3 text-sm text-slate-700">
              This is the practical checklist most parents ask us to clarify before they pay.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {PARENT_ENROLLMENT_CHECKLIST.map((item, idx) => (
                <div
                  key={item.title}
                  className={`rounded-2xl border bg-gradient-to-br p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${item.cardClass}`}
                >
                  <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-bold ${item.badgeClass}`}>
                    {idx + 1}
                  </span>
                  <h3 className="mt-2 text-sm font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-700">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="fee-breakdown" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-10 sm:px-6 sm:pb-12">
          <div className="rounded-3xl border border-emerald-200/70 bg-gradient-to-br from-[#ebfff7] via-white to-[#edf8ff] p-5 shadow-sm sm:p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
              Transparent Pricing
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
              Clear fee breakdown for the summer fast-track pack
            </h2>
            <p className="mt-3 text-sm text-slate-700">
              No confusing package math. We show the list fee and the effective fee clearly so parents can decide quickly.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">List fee</p>
                <p className="mt-2 text-2xl font-black text-slate-900 line-through">₹{formatINR(SUMMER_CAMP_FULL_PRICE)}</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Effective price</p>
                <p className="mt-2 text-2xl font-black text-emerald-800">₹{formatINR(SUMMER_CAMP_ENROLLMENT_PRICE)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Planned sessions</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{SUMMER_CAMP_PLANNED_CLASS_COUNT}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Effective per class</p>
                <p className="mt-2 text-2xl font-black text-slate-900">₹{formatINR(SUMMER_CAMP_EFFECTIVE_PER_CLASS_PRICE)}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-600">
              Each enrollment covers one {SUMMER_CAMP_VALUE_LABEL.toLowerCase()} batch inside the Summer Camp Season {SUMMER_CAMP_SEASON_DATE_RANGE_SHORT}, with limited batch start dates on {SUMMER_CAMP_BATCH_START_OPTIONS_LABEL}.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 sm:pb-12">
          <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-[#fff9ef] via-white to-[#eef8ff] p-5 shadow-sm sm:p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
              Parent Decision Guide
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
              How to choose the best online summer camp for kids in India
            </h2>
            <p className="mt-3 text-sm text-slate-700">
              Before you enroll in any small-group online summer camp, compare class size, teaching quality, and outcome clarity.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">Check interaction, not just marketing</h3>
                <p className="mt-2 text-sm text-slate-700">
                  Ask how much real speaking and reading time each child gets during a live class.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">Check the learning path</h3>
                <p className="mt-2 text-sm text-slate-700">
                  Prefer camps with a structured 4-week skill plan instead of random activities.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">Check revision support</h3>
                <p className="mt-2 text-sm text-slate-700">
                  Worksheets and recordings help children revise after class and maintain continuity.
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/best-online-phonics-classes-india"
                className="inline-flex min-h-[42px] items-center justify-center rounded-full border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
              >
                Compare online phonics options
              </Link>
              <Link
                to="/blog"
                className="inline-flex min-h-[42px] items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Read parent guides
              </Link>
              <Link
                to="/summer-reading-program-kids"
                className="inline-flex min-h-[42px] items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Explore summer reading program
              </Link>
              <Link
                to="/summer-speaking-camp-kids"
                className="inline-flex min-h-[42px] items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Explore summer speaking camp
              </Link>
              <Link
                to="/summer-camp-for-kids-india"
                className="inline-flex min-h-[42px] items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Parent planning guide for India
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900">What is this camp?</h2>
              <p className="mt-2 text-sm text-gray-700">
                Tiny Steps Summer Camp is a premium small-group online program, capped at {SUMMER_CAMP_BATCH_CAP} students per batch. The summer season runs from {SUMMER_CAMP_SEASON_START_LABEL} to {SUMMER_CAMP_SEASON_END_LABEL}, and each child joins one clear 4-week track-specific batch in phonics, grammar, or speaking.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900">What will my child achieve?</h2>
              <p className="mt-2 text-sm text-gray-700">
                Children finish with stronger reading fluency, better grammar accuracy, and higher speaking confidence through active participation, guided correction, and outcome-focused teaching.
              </p>
            </div>
          </div>
        </section>

        <section id="programs" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-10 sm:px-6 sm:pb-12">
          <h2 className="text-2xl font-semibold text-gray-900">Choose a program</h2>
          <p className="mt-2 text-sm text-gray-600">
            Pick the focus track that matches your child’s current level and goal. All tracks follow the full curriculum.
            Need a deeper look first? Explore our{' '}
            <Link to="/phonics" className="font-semibold text-emerald-700 hover:text-emerald-800">
              phonics classes
            </Link>
            ,{' '}
            <Link to="/grammar" className="font-semibold text-emerald-700 hover:text-emerald-800">
              grammar classes
            </Link>
            , and{' '}
            <Link to="/speaking" className="font-semibold text-emerald-700 hover:text-emerald-800">
              speaking classes
            </Link>
            .
          </p>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {PROGRAMS.map((program) => (
              <div key={program.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <h3 className="text-lg font-semibold text-gray-900">{program.title}</h3>
                <p className="text-xs text-gray-500">{program.ages} • {program.duration} • Capped at {SUMMER_CAMP_BATCH_CAP}</p>
                <p className="mt-1 text-xs text-gray-500">50–60 min live classes • Worksheets + recordings</p>
                <p className="mt-2 text-sm text-gray-700">{program.focus}</p>
                <ul className="mt-3 list-disc pl-5 text-sm text-gray-700">
                  {program.outcomes.map((outcome) => (
                    <li key={outcome}>{outcome}</li>
                  ))}
                </ul>
                <div className="mt-4">
                  <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <span className="mr-1 text-slate-500 line-through">₹{formatINR(SUMMER_CAMP_FULL_PRICE)}</span>
                    <span>
                      Effective price: ₹{formatINR(SUMMER_CAMP_ENROLLMENT_PRICE)}
                    </span>
                  </span>
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  <a
                    href={getWhatsAppUrl(getProgramEnrollText(program.title))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Enroll now
                  </a>
                  <Link
                    to={`/summer-camps/${program.id}`}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    View program details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="batches" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-10 sm:px-6 sm:pb-12">
          <h2 className="text-2xl font-semibold text-gray-900">Limited batch start dates</h2>
          <p className="mt-2 text-sm text-gray-600">
            The Summer Camp season runs from {SUMMER_CAMP_SEASON_START_LABEL} to {SUMMER_CAMP_SEASON_END_LABEL}. Each child joins one 4-week batch from the start dates below, and the final batch closes before schools reopen.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {BATCHES.map((batch) => (
              <a
                key={batch.id}
                href={getWhatsAppUrl(getBatchEnrollText(batch.label))}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-emerald-200 sm:p-5"
              >
                <div className="text-sm font-semibold text-gray-900">{batch.label}</div>
                <div className="mt-2 text-xs text-gray-600">
                  {batch.dates} • {batch.duration} • {batch.mode} • {batch.capacity}
                </div>
                <div className="mt-2 text-sm text-slate-600">{batch.note}</div>
                <div className="mt-3 text-sm font-semibold text-emerald-700">Enroll on WhatsApp →</div>
              </a>
            ))}
          </div>
        </section>

        <section id="quick-inquiry" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-10 sm:px-6 sm:pb-12">
          <div className="grid gap-6 rounded-3xl border border-slate-200/80 bg-gradient-to-br from-[#fffaf0] via-white to-[#eef9ff] p-5 shadow-sm sm:p-6 md:grid-cols-[0.95fr_1.05fr] md:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
                Quick Inquiry
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
                Need the right batch, brochure, or a parent callback first?
              </h2>
              <p className="mt-3 text-sm text-slate-700">
                Some parents want a recommendation before they enroll. Share your child&apos;s age, preferred track, and timing needs. We&apos;ll guide you to the closest-fit batch from the limited start dates on {SUMMER_CAMP_BATCH_START_OPTIONS_LABEL}.
              </p>

              <div className="mt-5 rounded-2xl border border-emerald-200/70 bg-white/90 p-4 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">What we usually reply with</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  <li>Best-fit track: phonics, grammar, or speaking</li>
                  <li>Best-fit batch start date from {SUMMER_CAMP_BATCH_START_OPTIONS_LABEL}</li>
                  <li>Free level assessment guidance before seat confirmation</li>
                  <li>Fee clarity and what is included in the camp pack</li>
                </ul>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href={SUMMER_CAMP_WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Prefer WhatsApp instead
                </a>
                <Link
                  to="/contact"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Open full contact page
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-4 shadow-sm sm:p-5">
              <SummerCampLeadForm />
            </div>
          </div>
        </section>

        {/* Parent Reassurance */}
        <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div className="overflow-hidden rounded-3xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-white to-sky-50/40 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="px-6 py-5 sm:px-8">
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Quick & Easy Enrollment</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">How Summer Camp Enrollment Works</h2>
                <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
                  Simple process with clear batch dates and no complicated forms
                </p>
              </div>

              <div className="mt-8 grid gap-6 sm:grid-cols-3">
                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
                    <span className="text-2xl">📱</span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-slate-900">1. Message on WhatsApp</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Click "Enroll" or WhatsApp us with your child's age, track preference, and preferred batch start date
                  </p>
                </div>

                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
                    <span className="text-2xl">📋</span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-slate-900">2. Quick Level Check</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    We conduct a brief 10–15 minute assessment to place your child in the right level group (ensures better participation)
                  </p>
                </div>

                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
                    <span className="text-2xl">🎉</span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-slate-900">3. Seat Confirmed</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    After payment (₹{formatINR(SUMMER_CAMP_ENROLLMENT_PRICE)}), we confirm your child's batch start date and share joining details
                  </p>
                </div>
              </div>

              <div className="mt-8 rounded-2xl border border-sky-200/60 bg-sky-50/50 px-6 py-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-lg">💡</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">What Happens Next?</p>
                    <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 text-emerald-600">•</span>
                        <span>Chosen batch start date with schedule details</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 text-emerald-600">•</span>
                        <span>Access to class recordings and worksheets</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 text-emerald-600">•</span>
                        <span>{SUMMER_CAMP_VALUE_LABEL} with clear milestones</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 text-emerald-600">•</span>
                        <span>Completion summary and next-step recommendations</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <a
                  href={SUMMER_CAMP_WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Start Enrollment on WhatsApp
                </a>
                <p className="mt-3 text-xs text-slate-500">Quick response • {SUMMER_CAMP_SCHEDULE_LABEL} • Limited to {SUMMER_CAMP_BATCH_CAP} students per batch</p>
              </div>
            </div>
          </div>
        </section>

        <section id="faqs" className="mx-auto max-w-5xl scroll-mt-24 px-4 pb-10 sm:px-6 sm:pb-16">
          <h2 className="text-2xl font-semibold text-gray-900">FAQs</h2>
          <div className="mt-4 space-y-4">
            {FAQS.map((faq) => (
              <div key={faq.question} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-gray-900">{faq.question}</h3>
                <p className="mt-2 text-sm text-gray-700">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="fixed inset-x-0 bottom-0 z-40 md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="mx-auto max-w-6xl px-3 pb-2">
            <div className="flex items-center justify-between gap-2 rounded-[20px] border border-emerald-100/80 bg-white/95 p-2 shadow-[0_-6px_30px_rgba(15,23,42,0.22)] backdrop-blur-md">
              <a
                href={SUMMER_CAMP_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-full bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white"
              >
                Enroll ₹{formatINR(SUMMER_CAMP_ENROLLMENT_PRICE)}
              </a>
              <a
                href={SUMMER_CAMP_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-full border border-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-emerald-700"
              >
                Open WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
