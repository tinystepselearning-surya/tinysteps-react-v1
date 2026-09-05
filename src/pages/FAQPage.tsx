// @ts-nocheck
import { startTransition, useDeferredValue, useMemo, useState } from 'react';
import type { FC } from 'react';
import { Link } from 'react-router-dom';
import FAQAccordion, { FAQItem } from '../components/FAQ/FAQAccordion';
import Meta from '../components/common/Meta';
import { FREE_DEMO_FULL_DESCRIPTION, STANDARD_PRICING_SUMMARY } from '../config/publicOffer';
import { GROUP_MONTHLY_FEES, ONE_TO_ONE_MONTHLY_PACKAGES } from '../config/pricing';
import { getRouteConfig } from '../lib/seo';
import { trackEvent } from '../lib/analytics';
import { useAuthStore } from '../store/useAuthStore';

const PAGE_PATH = '/faq';
const FAQ_CANONICAL_URL = 'https://tinystepslearning.com/faq';
const faqSeo = getRouteConfig(PAGE_PATH);
const metaTitle = faqSeo?.title ?? 'Parent FAQ: Classes, Fees & English Learning | Tiny Steps';
const metaDescription =
  faqSeo?.description ??
  'Answers for parents about Tiny Steps online English classes for kids: fees, class duration, teachers, progress, scheduling, policies and the free assessment.';

const oneToOnePackageCounts = ONE_TO_ONE_MONTHLY_PACKAGES.map((pkg) => pkg.classes).join(', ');
const groupRows = GROUP_MONTHLY_FEES.filter((row) => row.ratio !== '1:1');
const groupDurationMin = Math.min(...groupRows.map((row) => row.durationMinutes));
const groupDurationMax = Math.max(...groupRows.map((row) => row.durationMinutes));
const groupSizeMin = groupRows[0]?.ratio ?? '1:2';
const groupSizeMax = groupRows[groupRows.length - 1]?.ratio ?? '1:6';

const categories = [
  { id: 'all', label: 'All questions' },
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'classes', label: 'Classes & Teachers' },
  { id: 'phonics', label: 'Phonics & Reading' },
  { id: 'grammar', label: 'Grammar & Writing' },
  { id: 'speaking', label: 'Speaking Confidence' },
  { id: 'pricing', label: 'Fees & Packages' },
  { id: 'progress', label: 'Progress & Parent Support' },
  { id: 'scheduling', label: 'Scheduling & Policies' },
] as const;

const categoryLabels = Object.fromEntries(categories.map((category) => [category.id, category.label]));

const items: FAQItem[] = [
  {
    id: 'age-range',
    category: 'getting-started',
    question: 'What age group does Tiny Steps teach?',
    shortAnswer: 'Ages 3–12',
    answer:
      'Tiny Steps offers live online phonics, reading, grammar, writing and public speaking support for children ages 3–12. Age helps narrow the options, but the child’s current skill level is more important when deciding the starting point.',
    searchTerms: ['age', 'years', 'preschool', 'child', '3 12', 'eligibility'],
    links: [
      { to: '/courses', label: 'Compare English courses', emphasis: 'primary' },
      { to: '/curriculum', label: 'See the learning roadmap', emphasis: 'secondary' },
    ],
  },
  {
    id: 'choose-course',
    category: 'getting-started',
    question: 'How do I choose between phonics, reading, grammar, writing and speaking?',
    shortAnswer: 'Start with the strongest current gap',
    answer:
      'Start with the skill the child cannot yet do independently. Difficulty decoding unfamiliar words points toward phonics; accurate but effortful reading may need fluency; repeated sentence errors may need grammar and writing; short or hesitant answers may need sentence formation and speaking confidence. If the gap is unclear, begin with the free assessment before choosing a course.',
    searchTerms: ['which course', 'program', 'programme', 'reading', 'writing', 'public speaking', 'recommendation'],
    links: [
      { to: '/parents/choosing-course', label: 'Use the parent course-choice guide', emphasis: 'primary' },
      { to: '/book-demo', label: 'Book the free assessment', emphasis: 'secondary' },
    ],
  },
  {
    id: 'starting-level',
    category: 'getting-started',
    question: 'How is my child’s starting level decided?',
    shortAnswer: 'Assessment-first placement',
    answer:
      'Tiny Steps uses a free 35-minute 1:1 online demo assessment class before enrolment. The teacher checks the child’s current strengths and gaps in the relevant skills and recommends an appropriate learning path and starting point instead of placing every child only by age.',
    searchTerms: ['level', 'placement', 'assessment', 'test', 'starting point', 'baseline'],
    links: [
      { to: '/book-demo', label: 'Book the free 35-minute assessment', emphasis: 'primary' },
      { to: '/parents/getting-started', label: 'See how getting started works', emphasis: 'secondary' },
    ],
  },
  {
    id: 'free-assessment',
    category: 'getting-started',
    question: 'What happens in the free demo assessment class?',
    shortAnswer: '35-minute live 1:1 assessment',
    answer: `${FREE_DEMO_FULL_DESCRIPTION} The focus is the child’s actual learning need, so the teacher may check phonics, reading, grammar, sentence formation or speaking depending on the concern shared by the parent.`,
    searchTerms: ['demo', 'trial', 'assessment', 'free class', '35 minutes', 'what happens'],
    links: [{ to: '/book-demo', label: 'Book the free assessment', emphasis: 'primary' }],
  },
  {
    id: 'locations',
    category: 'getting-started',
    question: 'Are Tiny Steps classes available in Hyderabad, across India and outside India?',
    shortAnswer: 'Yes — classes are online',
    answer:
      'Yes. Tiny Steps classes are online, so families can join from Hyderabad, other parts of India and international locations when a suitable teacher slot is available. Time-zone and teacher availability should be checked before fixing a regular schedule.',
    searchTerms: ['Hyderabad', 'India', 'international', 'country', 'abroad', 'location', 'timezone'],
    links: [{ to: '/contact', label: 'Ask about current teacher availability', emphasis: 'primary' }],
  },
  {
    id: 'class-duration',
    category: 'classes',
    question: 'How long is each Tiny Steps class?',
    shortAnswer: `1:1 is 35 minutes`,
    answer: `Standard 1:1 classes are 35 minutes. Standard small-group classes are longer because more children need individual response time: current group formats run from ${groupDurationMin} to ${groupDurationMax} minutes depending on group size.`,
    searchTerms: ['duration', 'minutes', 'how long', '35', '40', '60', 'session length'],
    links: [{ to: '/pricing', label: 'See class formats and current pricing', emphasis: 'primary' }],
  },
  {
    id: 'class-format',
    category: 'classes',
    question: 'Are Tiny Steps classes 1:1 or group classes?',
    shortAnswer: `Both — 1:1 and ${groupSizeMin} to ${groupSizeMax}`,
    answer: `Tiny Steps offers standard 1:1 classes as well as small-group formats from ${groupSizeMin} to ${groupSizeMax}. One-to-one classes allow close observation and personalised pacing; groups add peer interaction and turn-taking. The better format depends on the child’s goal, confidence and need for individual correction.`,
    searchTerms: ['one to one', '1:1', 'group', 'batch size', 'children', 'ratio', 'private class'],
    links: [
      { to: '/pricing', label: 'Compare 1:1 and group pricing', emphasis: 'primary' },
      { to: '/blog/online-english-classes-for-kids-india', label: 'Read the parent comparison guide', emphasis: 'secondary' },
    ],
  },
  {
    id: 'class-platform',
    category: 'classes',
    question: 'Which platform does Tiny Steps use for live online classes?',
    shortAnswer: 'Microsoft Teams',
    answer:
      'Tiny Steps conducts live online classes through Microsoft Teams. Families receive class access through the scheduled class flow, and enrolled parents can use the Tiny Steps parent portal to reach the class-joining option.',
    searchTerms: ['Microsoft Teams', 'Teams', 'Zoom', 'Google Meet', 'meeting link', 'online platform'],
    links: [{ to: '/class-samples', label: 'See real Tiny Steps class samples', emphasis: 'secondary' }],
  },
  {
    id: 'teacher-standards',
    category: 'classes',
    question: 'What does Tiny Steps look for when selecting teachers?',
    shortAnswer: 'English clarity + relevant teaching ability',
    answer:
      'Tiny Steps recruitment criteria prioritise strong spoken and written English, clear pronunciation, confident communication and the ability to teach children in a structured way. Graduation is preferred, and relevant experience in English, phonics, grammar, communication or public speaking is valued. The academic fit for the child still matters after enrolment.',
    searchTerms: ['teacher', 'qualification', 'experience', 'profile', 'degree', 'pronunciation', 'training'],
    links: [
      { to: '/team', label: 'Meet the Tiny Steps team', emphasis: 'primary' },
      { to: '/class-samples', label: 'Watch class samples', emphasis: 'secondary' },
    ],
  },
  {
    id: 'class-samples',
    category: 'classes',
    question: 'Can I see what a Tiny Steps class looks like before enrolling?',
    shortAnswer: 'Yes — class samples are available',
    answer:
      'Yes. The class-samples page shows real teaching moments across Tiny Steps programmes. Samples help parents understand the teaching style, while the free 1:1 assessment remains the better way to judge the correct starting level for an individual child.',
    searchTerms: ['sample', 'video', 'class example', 'before enroll', 'teaching style'],
    links: [
      { to: '/class-samples', label: 'Watch real class samples', emphasis: 'primary' },
      { to: '/book-demo', label: 'Book the child’s free assessment', emphasis: 'secondary' },
    ],
  },
  {
    id: 'teacher-change',
    category: 'classes',
    question: 'What if the assigned teacher is not the right fit for my child?',
    shortAnswer: 'A mentor change can be requested',
    answer:
      'Mentor fit matters. If a parent is unhappy with the assigned teacher, Tiny Steps will first offer a replacement mentor where possible so learning can continue with minimal disruption. If a suitable reassignment cannot be arranged, the refund and unused-class policy explains the available next steps.',
    searchTerms: ['change teacher', 'different teacher', 'mentor', 'teacher fit', 'replacement'],
    links: [{ to: '/refund-guarantee', label: 'Read the teacher-fit and refund policy', emphasis: 'secondary' }],
  },
  {
    id: 'parent-in-class',
    category: 'classes',
    question: 'Do parents need to sit with the child during an online class?',
    shortAnswer: 'It depends on age and independence',
    answer:
      'Younger children may need initial help with the device, materials or settling into the routine. Older children can often participate more independently. The teacher can advise after seeing the child’s attention, comfort and ability to follow online instructions during the assessment.',
    searchTerms: ['parent sit', 'mother', 'father', 'with child', 'independent', 'device help'],
    links: [{ to: '/book-demo', label: 'Use the assessment to check readiness', emphasis: 'secondary' }],
  },
  {
    id: 'course-duration',
    category: 'classes',
    question: 'How long will my child need classes before completing a course?',
    shortAnswer: 'There is no guaranteed universal timeline',
    answer:
      'There is no responsible fixed completion timeline for every child. Progress depends on the starting level, attendance, practice, engagement and the skill being taught. Package size should not be treated as a guarantee that a child will master a course within that exact number of sessions; the teacher should use progress evidence to guide the next stage.',
    searchTerms: ['course duration', 'how many months', 'completion', 'finish', 'how long', 'timeline', 'sessions'],
    links: [
      { to: '/curriculum', label: 'See the learning progression', emphasis: 'primary' },
      { to: '/parents/tracking-progress', label: 'See how to judge real progress', emphasis: 'secondary' },
    ],
  },
  {
    id: 'pricing',
    category: 'pricing',
    question: 'How much do Tiny Steps classes cost?',
    shortAnswer: STANDARD_PRICING_SUMMARY,
    answer: `${STANDARD_PRICING_SUMMARY}. Prices and package options can change, so the pricing page is the source of truth to check before enrolment. Premium teacher options, when offered, may use different pricing.`,
    searchTerms: ['fees', 'fee', 'cost', 'price', 'pricing', 'rupees', '400', 'affordable'],
    links: [{ to: '/pricing', label: 'See current class fees and packages', emphasis: 'primary' }],
  },
  {
    id: 'packages',
    category: 'pricing',
    question: 'What class packages and frequencies are available?',
    shortAnswer: `Current 1:1 monthly options: ${oneToOnePackageCounts} classes`,
    answer: `Current standard 1:1 monthly packages contain ${oneToOnePackageCounts} classes. Standard small-group plans currently use 12 classes. The exact weekly pattern should be agreed around the child’s learning need, family schedule and teacher availability rather than assuming one frequency is right for every child.`,
    searchTerms: ['classes per week', 'frequency', '12 classes', '16 classes', '24 classes', 'package', 'monthly'],
    links: [{ to: '/pricing', label: 'Compare current package options', emphasis: 'primary' }],
  },
  {
    id: 'demo-cost',
    category: 'pricing',
    question: 'Is the demo assessment really free, and do I have to enrol afterwards?',
    shortAnswer: '₹0 • no credit card • no obligation',
    answer:
      'Yes. Tiny Steps provides one free 35-minute 1:1 online demo assessment class per child before enrolment. It costs ₹0, requires no credit card and does not create an obligation to enrol. The purpose is to understand the child’s level before a parent makes a paid-class decision.',
    searchTerms: ['free demo', 'trial cost', 'credit card', 'obligation', 'enrol', 'enroll'],
    links: [{ to: '/book-demo', label: 'Book the free 35-minute assessment', emphasis: 'primary' }],
  },
  {
    id: 'refunds',
    category: 'pricing',
    question: 'What is the refund policy after enrolment?',
    shortAnswer: 'A defined early refund window applies',
    answer:
      'The current policy allows a family to request a full refund within the first 7 days of payment or before completing the first two paid classes, whichever comes first. For later monthly-plan withdrawal, the unused portion may be refunded after deducting classes already delivered. The written refund policy is the source of truth for conditions and processing.',
    searchTerms: ['refund', 'money back', 'cancel enrollment', 'withdraw', 'unused classes', '7 days'],
    links: [{ to: '/refund-guarantee', label: 'Read the full refund and guarantee policy', emphasis: 'primary' }],
  },
  {
    id: 'compare-value',
    category: 'pricing',
    question: 'How should parents compare the value of different English programmes?',
    shortAnswer: 'Compare fit and progress evidence, not price alone',
    answer:
      'Compare the starting assessment, teaching format, curriculum sequence, teacher feedback, home-practice expectation, progress evidence, class frequency and total price. A cheaper package is not automatically better if it does not match the child’s actual learning need, and a higher price is not proof of better teaching by itself.',
    searchTerms: ['compare', 'best value', 'worth', 'cheaper', 'quality', 'programme'],
    links: [
      { to: '/pricing', label: 'Compare Tiny Steps class formats', emphasis: 'primary' },
      { to: '/blog/online-english-classes-for-kids-india', label: 'Use the parent comparison checklist', emphasis: 'secondary' },
    ],
  },
  {
    id: 'progress-evidence',
    category: 'progress',
    question: 'How do I know whether my child is actually progressing online?',
    shortAnswer: 'Look for independent, observable improvement',
    answer:
      'Look for evidence of what the child can now read, write, explain or say with less help. Compare similar fresh tasks over time instead of relying only on attendance, chapters completed or familiar worksheets. Enrolled families can use parent updates and the portal alongside teacher feedback to follow progress.',
    searchTerms: ['progress', 'dashboard', 'improvement', 'report', 'tracking', 'evidence', 'results'],
    links: [{ to: '/parents/tracking-progress', label: 'Use the parent progress-tracking guide', emphasis: 'primary' }],
  },
  {
    id: 'recordings',
    category: 'progress',
    question: 'Are class recordings available to parents?',
    shortAnswer: 'Available through the parent class resources when assigned',
    answer:
      'Tiny Steps may provide class recordings as part of parent support. Where a recording folder has been assigned to the family, available recordings can be opened from the Classes area of the parent dashboard. Recordings depend on processing and upload, so they should not be expected to appear immediately when a class ends.',
    searchTerms: ['recording', 'class video', 'replay', 'watch class', 'parent dashboard', 'processed'],
    links: [{ to: '/contact', label: 'Ask the team about a missing recording', emphasis: 'secondary' }],
  },
  {
    id: 'worksheets',
    category: 'progress',
    question: 'Do children receive worksheets or home-practice resources?',
    shortAnswer: 'They may be provided according to the programme',
    answer:
      'Tiny Steps may provide worksheets, practice resources and parent guidance as part of the learning service. The useful practice depends on what the child has actually been taught, so parents should follow the teacher’s current recommendation rather than adding large amounts of unrelated worksheet work. Whether a particular task needs teacher review depends on the lesson and activity.',
    searchTerms: ['worksheet', 'homework', 'practice', 'correction', 'checked', 'materials', 'pdf'],
    links: [{ to: '/parents', label: 'Explore parent learning support', emphasis: 'secondary' }],
  },
  {
    id: 'progress-guarantee',
    category: 'progress',
    question: 'Does Tiny Steps guarantee a specific result or improvement timeline?',
    shortAnswer: 'No fixed outcome can be guaranteed for every child',
    answer:
      'No responsible programme can guarantee the same result or timeline for every learner. Progress depends on factors such as the child’s starting level, attendance, practice, engagement and parental support. Tiny Steps should be judged by the quality of teaching, the clarity of the learning path and observable progress over time rather than a fixed-speed promise.',
    searchTerms: ['guarantee', '10 days', 'fast result', 'improve', 'outcome', 'promise', 'timeline'],
    links: [
      { to: '/parents/tracking-progress', label: 'Learn how to measure useful progress', emphasis: 'primary' },
      { to: '/why-tiny-steps', label: 'See the Tiny Steps learning approach', emphasis: 'secondary' },
    ],
  },
  {
    id: 'parent-support',
    category: 'progress',
    question: 'What can parents do at home without over-teaching the child?',
    shortAnswer: 'Short, targeted practice is usually more useful',
    answer:
      'Use the same skill currently being taught, keep practice short and stop before frustration rises. Ask the child to do the task independently first, then give only the minimum prompt needed. Consistency and accurate practice are more useful than adding many new rules or worksheets ahead of the child’s current lesson sequence.',
    searchTerms: ['home practice', 'parent help', 'daily practice', 'homework', 'support child'],
    links: [{ to: '/parents', label: 'Explore practical parent guides', emphasis: 'primary' }],
  },
  {
    id: 'weekend-timezone',
    category: 'scheduling',
    question: 'Do you offer weekend or different time-zone slots?',
    shortAnswer: 'Subject to current teacher availability',
    answer:
      'Availability changes, so parents should check current teacher slots before planning around a specific weekend, weekday or international time zone. Use the contact or demo-booking flow to share the preferred timing and the team can confirm what is currently possible.',
    searchTerms: ['weekend', 'Saturday', 'Sunday', 'timezone', 'timing', 'slot', 'availability'],
    links: [{ to: '/contact', label: 'Check current slot availability', emphasis: 'primary' }],
  },
  {
    id: 'reschedule',
    category: 'scheduling',
    question: 'Can I reschedule a class if my child cannot attend?',
    shortAnswer: 'Give at least 24 hours’ notice',
    answer:
      'Parents should give at least 24 hours’ notice when they need to cancel or reschedule a class. With that notice, Tiny Steps will make reasonable efforts to offer a replacement class or alternate slot, subject to teacher availability and scheduling constraints.',
    searchTerms: ['reschedule', 'cancel class', 'makeup', 'make-up', 'change class', '24 hours'],
    links: [{ to: '/refund-guarantee', label: 'Read the cancellation and rescheduling policy', emphasis: 'secondary' }],
  },
  {
    id: 'no-show',
    category: 'scheduling',
    question: 'What happens if my child misses a class without notice?',
    shortAnswer: 'The session may be forfeited',
    answer:
      'A class missed without prior notice may be treated as forfeited because the teacher’s time was reserved for the child. The current policy does not provide a refund for no-show sessions or classes missed without the required notice. Repeated late cancellations may also reduce scheduling flexibility.',
    searchTerms: ['miss class', 'absent', 'no show', 'no-show', 'late cancellation', 'forfeit'],
    links: [{ to: '/refund-guarantee', label: 'Read the missed-class policy', emphasis: 'secondary' }],
  },
  {
    id: 'change-slot',
    category: 'scheduling',
    question: 'Can we change our regular class timing after enrolment?',
    shortAnswer: 'Possible when an alternate teacher slot is available',
    answer:
      'Regular classes are scheduled at mutually agreed times based on teacher availability and the family’s selected slot. If the family later needs a different regular timing, contact the team so an alternate slot can be checked. A specific replacement time cannot be guaranteed until availability is confirmed.',
    searchTerms: ['change time', 'regular slot', 'new timing', 'schedule', 'teacher availability'],
    links: [{ to: '/contact', label: 'Request a schedule change', emphasis: 'primary' }],
  },
  {
    id: 'join-class',
    category: 'scheduling',
    question: 'How does an enrolled parent join the scheduled class?',
    shortAnswer: 'Use the Join Class option in the parent portal',
    answer:
      'Enrolled parents can log in to the Tiny Steps parent portal and use the Join Class option for the scheduled session. Tiny Steps uses Microsoft Teams for live classes, so the portal class action opens the relevant online meeting flow without parents needing a new manually shared link for every session.',
    searchTerms: ['join class', 'class link', 'portal', 'login', 'Teams link', 'meeting'],
    links: [{ to: '/contact', label: 'Get help with class access', emphasis: 'secondary' }],
  },
  {
    id: 'phonics-home',
    category: 'phonics',
    question: 'How should I start phonics at home?',
    shortAnswer: 'Start small and build toward blending',
    answer:
      'Start with a small set of letter sounds, then practise oral blending, printed-word blending and one short decodable line. Keep the routine short and repeat the same taught pattern before adding more content. The goal is accurate transfer, not racing through the alphabet.',
    searchTerms: ['phonics at home', 'letter sounds', 'start phonics', 'beginner', 'practice'],
    links: [
      { to: '/blog/phonics-for-parents-guide', label: 'Read the phonics parent guide', emphasis: 'primary' },
      { to: '/phonics', label: 'Explore online phonics classes', emphasis: 'secondary' },
    ],
  },
  {
    id: 'blending-gap',
    category: 'phonics',
    question: 'Why can my child say letter sounds but still not blend words?',
    shortAnswer: 'Sound recall and blending are different skills',
    answer:
      'Knowing isolated sounds does not automatically teach a child to join those sounds into a word. Practise a short sequence such as /c/ /a/ /t/ orally first, then use printed CVC words. If the child guesses, slow the task down and check oral blending before adding harder spelling patterns.',
    searchTerms: ['blend', 'blending', 'CVC', 'letter sounds', 'cannot read', 'guessing'],
    links: [
      { to: '/blog/cvc-words-explained-for-parents', label: 'Understand the CVC reading milestone', emphasis: 'primary' },
      { to: '/phonics', label: 'See the phonics learning path', emphasis: 'secondary' },
    ],
  },
  {
    id: 'phonics-vs-sight-words',
    category: 'phonics',
    question: 'What is the difference between phonics and sight-word learning?',
    shortAnswer: 'Phonics teaches decoding rather than whole-word visual memorisation',
    answer:
      'Phonics teaches children to use sound-spelling relationships to decode words. Some high-frequency words contain parts that are unusual or not yet taught, so those parts need extra attention. The goal is to decode what can be decoded instead of asking the child to memorise every whole word as a visual shape.',
    searchTerms: ['sight words', 'tricky words', 'high frequency', 'memorize', 'memorise', 'decode'],
    links: [{ to: '/blog/digraphs-and-tricky-words', label: 'Read the tricky-words parent guide', emphasis: 'primary' }],
  },
  {
    id: 'older-child-phonics',
    category: 'phonics',
    question: 'Is a 7-year-old or older child too old to start or restart phonics?',
    shortAnswer: 'No — start from the actual decoding gap',
    answer:
      'No. Older children can still benefit from explicit phonics when a decoding gap remains. The starting point should be based on the child’s current sound knowledge, blending, word reading, spelling and fluency rather than assuming age alone tells you what they can read.',
    searchTerms: ['7 year old', 'older child', 'late phonics', 'restart', 'struggling reader'],
    links: [
      { to: '/blog/how-phonics-classes-help-kids-read', label: 'See how phonics supports reading', emphasis: 'primary' },
      { to: '/book-demo', label: 'Assess the current decoding level', emphasis: 'secondary' },
    ],
  },
  {
    id: 'reading-comprehension',
    category: 'phonics',
    question: 'My child can read words but does not understand the story. Is that still a phonics problem?',
    shortAnswer: 'Not always',
    answer:
      'Not always. If decoding is accurate enough, the next need may be fluency, vocabulary, oral language, background knowledge or comprehension. Check whether the child can explain what happened, answer simple questions and retell the text without relying on the exact wording.',
    searchTerms: ['comprehension', 'understand story', 'reads but does not understand', 'fluency', 'reading'],
    links: [{ to: '/reading-classes-for-kids', label: 'Explore reading and fluency support', emphasis: 'primary' }],
  },
  {
    id: 'choose-phonics-class',
    category: 'phonics',
    question: 'What should I look for in an online phonics class?',
    shortAnswer: 'Placement, sequence, active decoding and progress evidence',
    answer:
      'Look for clear placement, a systematic teaching sequence, active child participation, explicit blending and decoding, immediate correction, level-appropriate reading, spelling transfer and progress evidence using unfamiliar examples. A class should show what the child can do, not only which lesson number has been completed.',
    searchTerms: ['best phonics class', 'choose phonics', 'quality', 'online phonics', 'teacher'],
    links: [
      { to: '/blog/online-phonics-classes-vs-school', label: 'Use the online-phonics comparison guide', emphasis: 'primary' },
      { to: '/phonics', label: 'See Tiny Steps phonics classes', emphasis: 'secondary' },
    ],
  },
  {
    id: 'grammar-without-memorising',
    category: 'grammar',
    question: 'How can grammar be taught without turning it into rule memorisation?',
    shortAnswer: 'Teach the rule, then make the child use it',
    answer:
      'Teach one concept briefly, then use it in speaking, sentence building, editing and fresh writing. A child understands grammar more deeply when they can produce and correct their own sentences rather than only identify answers on a worksheet.',
    searchTerms: ['grammar rules', 'memorisation', 'memorization', 'worksheet', 'sentence building'],
    links: [
      { to: '/grammar', label: 'Explore grammar classes', emphasis: 'primary' },
      { to: '/blog/grammar-nouns-to-paragraphs', label: 'See grammar move into real writing', emphasis: 'secondary' },
    ],
  },
  {
    id: 'grammar-transfer',
    category: 'grammar',
    question: 'Why does my child know grammar rules but still make mistakes while writing?',
    shortAnswer: 'Knowing a rule and applying it are different skills',
    answer:
      'Knowing a rule and applying it while generating ideas are different demands. Use short write-edit-rewrite cycles and focus on one repeated error pattern at a time so the rule transfers into independent writing instead of remaining only worksheet knowledge.',
    searchTerms: ['grammar mistake', 'writing mistakes', 'knows rules', 'transfer', 'editing'],
    links: [
      { to: '/blog/child-knows-grammar-but-makes-mistakes', label: 'Read why grammar errors continue', emphasis: 'primary' },
      { to: '/writing-classes-for-kids', label: 'Explore writing support', emphasis: 'secondary' },
    ],
  },
  {
    id: 'tenses',
    category: 'grammar',
    question: 'When should children start learning tenses?',
    shortAnswer: 'When they can use simple sentences meaningfully',
    answer:
      'Introduce tense language when the child can understand and produce simple sentences about now, before and later. The exact age matters less than language readiness. Start with clear everyday contrasts before moving into more complex tense forms.',
    searchTerms: ['tense', 'tenses', 'past present future', 'grammar age'],
    links: [{ to: '/grammar', label: 'See the grammar learning pathway', emphasis: 'primary' }],
  },
  {
    id: 'spoken-to-written-sentences',
    category: 'grammar',
    question: 'My child speaks well but cannot write complete sentences. What should we practise?',
    shortAnswer: 'Use a speak-first, write-second routine',
    answer:
      'Let the child say one complete idea, write it independently, then check capitals, punctuation, word order, tense and clarity. Gradually move from one sentence to connected sentences and paragraphs. This reduces the load of thinking about ideas and writing rules at the same time.',
    searchTerms: ['sentence formation', 'cannot write', 'complete sentence', 'writing', 'speaks well'],
    links: [
      { to: '/blog/how-to-improve-sentence-formation-in-kids', label: 'Use the sentence-formation parent guide', emphasis: 'primary' },
      { to: '/writing-classes-for-kids', label: 'Explore writing classes', emphasis: 'secondary' },
    ],
  },
  {
    id: 'shy-speaker',
    category: 'speaking',
    question: 'How can I help a shy child speak more confidently?',
    shortAnswer: 'Use low-pressure speaking with gradual expansion',
    answer:
      'Use familiar, low-pressure prompts, allow thinking time, model only when needed and praise the attempt before correcting one small detail. Build from one complete sentence to connected ideas and unfamiliar settings gradually rather than forcing long speeches too early.',
    searchTerms: ['shy', 'confidence', 'public speaking', 'hesitant', 'nervous', 'speak'],
    links: [
      { to: '/parents/speech-confidence', label: 'Use the parent speaking-confidence guide', emphasis: 'primary' },
      { to: '/speaking', label: 'Explore speaking classes', emphasis: 'secondary' },
    ],
  },
  {
    id: 'correct-speaking-errors',
    category: 'speaking',
    question: 'Should I correct every grammar mistake while my child is speaking?',
    shortAnswer: 'No — protect the message first',
    answer:
      'No. Let the child finish the idea first. Then choose one useful correction and ask for a smooth retry. Constant interruption can make it harder for the child to organise and express the message and may reduce willingness to speak.',
    searchTerms: ['correct speaking', 'grammar speaking', 'interrupt', 'mistakes', 'fluency'],
    links: [{ to: '/parents/speech-confidence', label: 'See calmer correction routines', emphasis: 'primary' }],
  },
  {
    id: 'one-word-answers',
    category: 'speaking',
    question: 'My child gives only one-word answers. How do I extend them?',
    shortAnswer: 'Add a sentence starter and one follow-up',
    answer:
      'Use a sentence starter and one follow-up question. Build from “dog” to “I like dogs” to “I like dogs because they are playful.” Reduce the prompt as the child becomes more independent so longer answers become the child’s own language rather than a memorised script.',
    searchTerms: ['one word answer', 'short answers', 'full sentence', 'sentence starter', 'speaking'],
    links: [
      { to: '/blog/child-gives-one-word-answers', label: 'Read the one-word-answer parent guide', emphasis: 'primary' },
      { to: '/speaking', label: 'Explore speaking support', emphasis: 'secondary' },
    ],
  },
  {
    id: 'mumbling-fast-speech',
    category: 'speaking',
    question: 'My child mumbles or speaks too quickly. What should I work on first?',
    shortAnswer: 'Separate clarity, volume and pace',
    answer:
      'Separate clarity, volume and pace instead of correcting everything at once. Practise one short sentence in a comfortable conversation voice, then add a deliberate pause between ideas. If speech clarity is persistently difficult or affects everyday communication, seek individual guidance from an appropriately qualified professional.',
    searchTerms: ['mumble', 'fast speech', 'clarity', 'volume', 'pace', 'pronunciation'],
    links: [{ to: '/parents/speech-confidence', label: 'Use the speaking-confidence parent guide', emphasis: 'primary' }],
  },
];

const featuredQuestionIds = [
  'pricing',
  'class-duration',
  'class-format',
  'free-assessment',
  'starting-level',
  'class-platform',
];

const featuredQuestions = featuredQuestionIds
  .map((id) => items.find((item) => item.id === id))
  .filter(Boolean) as FAQItem[];

const quickRoutes = [
  {
    title: 'Pricing & class formats',
    detail: 'Compare current 1:1 and small-group fees, durations and package options.',
    to: '/pricing',
  },
  {
    title: 'Watch real class samples',
    detail: 'See how Tiny Steps teaches phonics, reading, grammar and communication online.',
    to: '/class-samples',
  },
  {
    title: 'Choose the right course',
    detail: 'Match the child’s strongest current gap to the most useful learning path.',
    to: '/parents/choosing-course',
  },
  {
    title: 'Book the free assessment',
    detail: 'Use a 35-minute 1:1 session to identify the starting level before enrolment.',
    to: '/book-demo',
  },
];

const routesByCategory: Record<string, typeof quickRoutes> = {
  'getting-started': [quickRoutes[2], quickRoutes[3], quickRoutes[0]],
  classes: [quickRoutes[1], quickRoutes[0], quickRoutes[3]],
  phonics: [
    { title: 'Phonics for parents', detail: 'Understand blending, decoding and useful practice order.', to: '/blog/phonics-for-parents-guide' },
    { title: 'Online phonics classes', detail: 'See the Tiny Steps phonics pathway and assessment-first placement.', to: '/phonics' },
    quickRoutes[3],
  ],
  grammar: [
    { title: 'Grammar classes', detail: 'Build sentence formation, grammar transfer and writing clarity.', to: '/grammar' },
    { title: 'Writing classes', detail: 'Move from spoken ideas to complete written sentences and paragraphs.', to: '/writing-classes-for-kids' },
    quickRoutes[3],
  ],
  speaking: [
    { title: 'Speaking confidence guide', detail: 'Use low-pressure routines and observable confidence markers.', to: '/parents/speech-confidence' },
    { title: 'Speaking classes', detail: 'Explore sentence formation, storytelling and communication support.', to: '/speaking' },
    quickRoutes[3],
  ],
  pricing: [quickRoutes[0], quickRoutes[3], { title: 'Refund & guarantee policy', detail: 'Review the current refund, mentor-fit and unused-class rules.', to: '/refund-guarantee' }],
  progress: [
    { title: 'Track real progress', detail: 'Use baselines and independent evidence instead of vague progress labels.', to: '/parents/tracking-progress' },
    { title: 'Parents Hub', detail: 'Find practical routines for home support without over-teaching.', to: '/parents' },
    quickRoutes[3],
  ],
  scheduling: [
    { title: 'Contact Tiny Steps', detail: 'Check current teacher availability or request a schedule change.', to: '/contact' },
    { title: 'Refund & guarantee policy', detail: 'Read the current cancellation, no-show and rescheduling terms.', to: '/refund-guarantee' },
    quickRoutes[3],
  ],
};

const stripHtml = (value: string) => String(value || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': `${FAQ_CANONICAL_URL}#faq`,
  url: FAQ_CANONICAL_URL,
  name: metaTitle,
  description: metaDescription,
  inLanguage: 'en',
  mainEntity: items.map((item) => ({
    '@type': 'Question',
    '@id': `${FAQ_CANONICAL_URL}#faq-${item.id}`,
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: stripHtml(item.answer),
    },
  })),
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  '@id': `${FAQ_CANONICAL_URL}#breadcrumb`,
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
    { '@type': 'ListItem', position: 2, name: 'Parent FAQ', item: FAQ_CANONICAL_URL },
  ],
};

const FAQPage: FC = () => {
  const [selected, setSelected] = useState<string>('all');
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const { user } = useAuthStore();

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchCategory = selected === 'all' || item.category === selected;
      if (!matchCategory) return false;

      const term = deferredSearch;
      if (!term) return true;

      const searchText = [
        item.question,
        item.answer,
        item.shortAnswer || '',
        ...(item.searchTerms || []),
        categoryLabels[item.category] || item.category,
      ]
        .join(' ')
        .toLowerCase();

      return searchText.includes(term);
    });
  }, [deferredSearch, selected]);

  const selectedLabel = categoryLabels[selected] || 'All questions';
  const relevantRoutes = routesByCategory[selected] || quickRoutes;

  const selectCategory = (categoryId: string) => {
    setSelected(categoryId);
    trackEvent('faq_filter_select', {
      page_path: PAGE_PATH,
      category: categoryId,
    });
  };

  const showFeaturedQuestion = (item: FAQItem) => {
    trackEvent('faq_quick_question_click', {
      page_path: PAGE_PATH,
      question_id: item.id,
      category: item.category,
    });

    startTransition(() => {
      setSelected(item.category);
      setSearch(item.question);
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById('faq-library')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  };

  const resetQuestions = () => {
    startTransition(() => {
      setSelected('all');
      setSearch('');
    });
    trackEvent('faq_reset', { page_path: PAGE_PATH });
  };

  const trackSearchSubmit = () => {
    trackEvent('faq_search_submit', {
      page_path: PAGE_PATH,
      query_length: search.trim().length,
      result_count: filtered.length,
      category: selected,
    });
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6eee3_0%,#fbfaf7_18%,#ffffff_42%,#f4f8fc_100%)]">
      <Meta
        title={metaTitle}
        description={metaDescription}
        canonical={FAQ_CANONICAL_URL}
        robots={faqSeo?.robots ?? 'index, follow'}
        jsonLd={[breadcrumbSchema, faqSchema]}
      />

      <section className="relative overflow-hidden border-b border-slate-800 bg-[linear-gradient(135deg,#111827_0%,#18253d_48%,#22314b_100%)] px-6 pb-14 pt-24 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(239,187,106,0.16),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(112,160,230,0.18),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_390px] lg:items-end">
            <div className="max-w-4xl">
              <div className="inline-flex items-center rounded-full border border-white/14 bg-white/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-100 backdrop-blur">
                Tiny Steps Parent Help Centre
              </div>
              <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-[3.75rem] lg:leading-[1.04]">
                Tiny Steps parent FAQ: classes, fees and English learning
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-200">
                Get clear answers about class duration, 1:1 and group formats, teachers, fees, the free assessment, scheduling, progress, phonics, grammar, writing and speaking before deciding the next step for your child.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-200">
                <span className="rounded-full border border-white/12 bg-white/8 px-4 py-2 backdrop-blur">{items.length} clear parent answers</span>
                <span className="rounded-full border border-white/12 bg-white/8 px-4 py-2 backdrop-blur">Ages 3–12 • Live online</span>
                <span className="rounded-full border border-white/12 bg-white/8 px-4 py-2 backdrop-blur">Classes • Fees • Learning • Support</span>
              </div>
              <div className="mt-7 max-w-2xl">
                <label htmlFor="faq-search" className="sr-only">Search Tiny Steps parent questions</label>
                <div className="relative">
                  <input
                    id="faq-search"
                    type="search"
                    autoComplete="off"
                    aria-describedby="faq-search-help"
                    className="w-full rounded-full border border-white/16 bg-white/10 px-5 py-3 pr-24 text-sm text-white outline-none transition placeholder:text-slate-300 focus:border-white/30 focus:bg-white/14"
                    placeholder="Search fees, class duration, Teams, rescheduling, phonics..."
                    value={search}
                    onChange={(event) => {
                      const value = event.target.value;
                      startTransition(() => setSearch(value));
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') trackSearchSubmit();
                    }}
                  />
                  {search ? (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/12 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
                <p id="faq-search-help" className="mt-2 text-xs leading-5 text-slate-400">
                  Try everyday wording such as “fees”, “missed class”, “teacher”, “recording” or “my child cannot blend”.
                </p>
              </div>
            </div>

            <div className="rounded-[2.2rem] border border-white/10 bg-white/8 p-6 shadow-[0_30px_80px_rgba(2,6,23,0.32)] backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100">Useful before you decide</p>
              <div className="mt-5 divide-y divide-white/10">
                {quickRoutes.map((route) => (
                  <Link
                    key={route.title}
                    to={route.to}
                    onClick={() => trackEvent('faq_resource_click', { page_path: PAGE_PATH, destination: route.to, placement: 'hero' })}
                    className="group block py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-base font-semibold text-white transition group-hover:text-[#ffd8a8]">{route.title}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-300">{route.detail}</p>
                      </div>
                      <span className="mt-1 text-lg text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-white">→</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <section aria-labelledby="popular-faq-heading" className="mb-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">Most parents ask these first</p>
              <h2 id="popular-faq-heading" className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
                Quick answers before you book
              </h2>
            </div>
            <Link to="/book-demo" className="text-sm font-semibold text-primary-700 hover:text-primary-800">
              Book the free assessment →
            </Link>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {featuredQuestions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => showFeaturedQuestion(item)}
                className="group rounded-[1.6rem] border border-slate-200 bg-white p-5 text-left shadow-[0_14px_35px_rgba(15,23,42,0.045)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_20px_45px_rgba(15,23,42,0.08)]"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-700">{categoryLabels[item.category]}</p>
                <h3 className="mt-2 text-base font-bold leading-6 text-slate-950">{item.question}</h3>
                <p className="mt-3 text-sm font-semibold text-slate-600">{item.shortAnswer}</p>
                <span className="mt-4 inline-flex text-sm font-semibold text-slate-900 transition group-hover:text-primary-700">Read the full answer →</span>
              </button>
            ))}
          </div>
        </section>

        <section className="mb-8 rounded-[1.8rem] border border-emerald-100 bg-emerald-50 p-5 md:p-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Not sure which learning area should come first?</h2>
              <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-700 md:text-base">
                Identify the skill the child cannot yet do independently. Unfamiliar-word decoding points toward phonics. Accurate but effortful reading may need fluency. Repeated sentence errors point toward grammar and writing. Short hesitant responses point toward sentence formation and speaking confidence. If the gap is unclear, use the free assessment before choosing a course.
              </p>
            </div>
            <Link
              to="/parents/choosing-course"
              onClick={() => trackEvent('faq_resource_click', { page_path: PAGE_PATH, destination: '/parents/choosing-course', placement: 'diagnostic' })}
              className="inline-flex w-fit items-center rounded-full bg-emerald-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              Choose the right course
            </Link>
          </div>
        </section>

        <section id="faq-library" aria-labelledby="faq-library-heading" className="scroll-mt-24">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-[1.8rem] border border-slate-200/80 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">Browse by topic</p>
              <h2 id="faq-library-heading" className="sr-only">Complete Tiny Steps parent FAQ</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    aria-pressed={selected === category.id}
                    onClick={() => selectCategory(category.id)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      selected === category.id ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-slate-200 bg-[linear-gradient(135deg,#fff4e2,#eef6ff)] p-5" aria-live="polite">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Current view</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{selectedLabel}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Showing <span className="font-semibold text-slate-900">{filtered.length}</span> answer{filtered.length === 1 ? '' : 's'}
                {deferredSearch ? <> matching <span className="font-semibold text-slate-900">“{search.trim()}”</span></> : null}.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              {filtered.length > 0 ? (
                <FAQAccordion
                  items={filtered}
                  categoryLabels={categoryLabels}
                  onToggle={(item, isOpen) =>
                    trackEvent('faq_answer_toggle', {
                      page_path: PAGE_PATH,
                      question_id: item.id,
                      category: item.category,
                      opened: isOpen,
                    })
                  }
                />
              ) : (
                <div className="rounded-[1.8rem] border border-slate-200 bg-white p-7 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">No exact match</p>
                  <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Try a shorter search or ask us directly</h3>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                    Search for one key idea such as “fees”, “teacher”, “recording”, “reschedule” or “phonics”. If your question is specific to your child or current timetable, the Tiny Steps team can help.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={resetQuestions}
                      className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Show all questions
                    </button>
                    <Link to="/contact" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">
                      Contact Tiny Steps
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start" aria-label="Related parent resources">
              <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">Continue with the right page</p>
                <div className="mt-4 space-y-3">
                  {relevantRoutes.map((route) => (
                    <Link
                      key={`${selected}-${route.title}`}
                      to={route.to}
                      onClick={() => trackEvent('faq_resource_click', { page_path: PAGE_PATH, destination: route.to, placement: 'sidebar', category: selected })}
                      className="block rounded-[1.25rem] border border-slate-200 bg-slate-50/70 px-4 py-3 transition hover:border-slate-300 hover:bg-white"
                    >
                      <span className="block text-sm font-semibold text-slate-900">{route.title}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-600">{route.detail}</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">Still have questions?</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {!user ? (
                    <>
                      Message us on{' '}
                      <a
                        href="https://wa.me/919618398383"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackEvent('faq_whatsapp_click', { page_path: PAGE_PATH, placement: 'sidebar' })}
                        className="font-semibold text-primary-700"
                      >
                        WhatsApp
                      </a>{' '}
                      or use the <Link to="/contact" className="font-semibold text-primary-700">contact form</Link>. Share the child’s age, main concern and preferred timing so the team can answer more precisely.
                    </>
                  ) : (
                    <>
                      Use the <Link to="/contact" className="font-semibold text-primary-700">contact form</Link> and share the child’s current target or scheduling question so the team can route it correctly.
                    </>
                  )}
                </p>
              </div>
            </aside>
          </div>
        </section>

        <section className="mt-10 rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#101828,#1b2a46)] px-6 py-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100">Still unsure where your child should start?</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Turn the question into one clear learning target</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
                Book one free 35-minute 1:1 online demo assessment class. The teacher checks the child’s current level and recommends the most useful starting path before you decide whether to enrol.
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-400">₹0 • No credit card • One free assessment per child before enrolment</p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link
                to="/book-demo"
                onClick={() => trackEvent('faq_book_demo_click', { page_path: PAGE_PATH, placement: 'bottom_cta' })}
                className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                Book Free 35-Minute Assessment
              </Link>
              <a
                href="https://wa.me/919618398383"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent('faq_whatsapp_click', { page_path: PAGE_PATH, placement: 'bottom_cta' })}
                className="inline-flex items-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Ask on WhatsApp
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default FAQPage;
