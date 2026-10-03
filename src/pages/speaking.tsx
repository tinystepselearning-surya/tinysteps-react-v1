import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import ClusterSeoNav from '../components/programs/ClusterSeoNav';
import TestimonialSnippets from '../components/common/TestimonialSnippets';
import { PUBLIC_LEARNER_REACH_LABEL, PUBLIC_SESSION_DURATION_LABEL, PUBLIC_SITE_FACTS, formatPublicInr } from '../config/publicFacts';
import { SEMANTIC_FACTS } from '../config/semanticFacts';
import { applySeo } from '../lib/seo';
import { buildSpeakableSpecification } from '../lib/breadcrumbAeoGeoRegistry.js';
import { createFAQPageSchema, createWebPageSchema, PUBLIC_FACTS } from '../lib/schemas';
import ResponsiveTeachingSection from '../components/programs/ResponsiveTeachingSection';
import ProgrammeIntentBoundary from '../components/programs/ProgrammeIntentBoundary';
import ProgrammeFaqAccordion from '../components/programs/ProgrammeFaqAccordion';
import { getProgrammeAiVisibility } from '../lib/programmeAiVisibility';
import {
  SPEAKING_PROGRESS_DIMENSIONS,
  SPEAKING_PROGRESS_FRAMEWORK_PATH,
  SPEAKING_PROGRESS_OBSERVATION_BANDS,
} from '../lib/speakingProgressFramework';
import {
  SPEAKING_EVIDENCE_SURFACES,
} from '../lib/speakingEvidenceLayer';

const speakingFacts = SEMANTIC_FACTS.programmes.speaking;
const demoMinutes = PUBLIC_SITE_FACTS.standardOffer.demoDurationMinutes;
const speakingAiVisibility = getProgrammeAiVisibility('/speaking');
const speakingAgeRangeLabel = `Ages ${speakingFacts.levels.beginner.ageRange.min}–${speakingFacts.levels.advanced.ageRange.max}`;
const speakingClassPriceLabel = `₹${formatPublicInr(PUBLIC_SITE_FACTS.standardOffer.oneToOnePerClassInr)}/class`;
const seoTitle = 'Online Public Speaking Classes for Kids | Live 1:1 | Tiny Steps';
const seoDescription =
  'Live 1:1 online public speaking & communication classes for kids ages 4–12. Structured answers, storytelling and presentations. ₹400/class; free assessment.';

const SPEAKING_SEO_KEYWORDS = [
  'public speaking classes for kids online',
  'public speaking classes for kids',
  'public speaking course for kids',
  'public speaking for kids',
  'online speaking classes for kids',
  'communication skills classes for kids online',
  'communication classes for kids',
  '1 to 1 public speaking classes for kids',
  'online public speaking classes for kids India',
  'public speaking classes for kids in India',
  'online communication classes for kids',
  'storytelling classes for kids online',
  'presentation skills classes for kids',
  'show and tell practice for kids',
  'public speaking classes for kids worldwide',
];

const speakingPositioningProof = [
  {
    title: 'Trusted by parents in India and internationally',
    detail: `${PUBLIC_LEARNER_REACH_LABEL} with live online delivery for families in India and globally.`,
  },
  {
    title: 'Live 1:1 speaking practice',
    detail: 'Each child gets repeated speaking turns, teacher feedback, guided retries, and pacing that can adjust to the learner.',
  },
  {
    title: 'Structured communication, not memorised speeches',
    detail: 'The pathway develops organised answers, storytelling, show-and-tell, presentations, audience awareness, and transfer to fresh speaking tasks.',
  },
  {
    title: 'Assessment-first placement',
    detail: 'The assessment separates Public Speaking needs from Spoken English, Grammar, or confidence-only barriers before a level is recommended.',
  },
  {
    title: 'Parent-visible progress',
    detail: 'Families can track prompting, idea organisation, storytelling, presentation structure, delivery, and transfer to new tasks.',
  },
  {
    title: 'Evidence parents can inspect',
    detail: 'Curriculum, class samples, the Speaking Progress Framework, parent feedback, pricing, and the free assessment are available before enrolment.',
  },
];

const faqItems = [
  {
    question: 'What do public speaking and communication classes for kids teach?',
    answer:
      'Tiny Steps teaches children to organise ideas and communicate them clearly for a listener or audience. In practice, the programme develops structured answers, storytelling, show-and-tell, presentation skills, audience awareness, listening and response, idea organisation, and increasingly independent speaking through guided live practice.',
  },
  {
    question: 'Are Tiny Steps public speaking classes live and 1:1?',
    answer:
      `Yes. Standard Tiny Steps 1:1 classes are live online and run for ${PUBLIC_SESSION_DURATION_LABEL}. Small-group options may also be available for selected schedules or programme fits.`,
  },
  {
    question: 'How much do Tiny Steps public speaking classes cost?',
    answer:
      `The standard live 1:1 price is ${speakingClassPriceLabel} for a ${PUBLIC_SESSION_DURATION_LABEL} class. Tiny Steps starts with one free ${demoMinutes}-minute 1:1 assessment before enrolment. The Pricing page remains the canonical source for current fees and any other available formats.`,
  },
  {
    question: 'What ages are the Tiny Steps Public Speaking levels for?',
    answer:
      `Public Speaking Foundations is designed for ${speakingFacts.levels.beginner.ageRange.label} and has ${speakingFacts.levels.beginner.lessonCount} lessons. Public Speaking Excellence is designed for ${speakingFacts.levels.advanced.ageRange.label} and has ${speakingFacts.levels.advanced.lessonCount} lessons. The ranges overlap at age 7, so placement also considers speaking readiness and current skill level.`,
  },
  {
    question: 'Is age 4 too young to start public speaking classes?',
    answer:
      'No—age four is not too young when public speaking is taught as communication foundations rather than adult-style speech performance. At this age, appropriate work includes short connected answers, description, storytelling, show-and-tell, listening, turn-taking, and simple questions. Tiny Steps does not expect four-year-olds to deliver formal speeches or debate; the task and support change with age and readiness.',
  },
  {
    question: 'Can parents see a Tiny Steps class sample before enrolling?',
    answer:
      'Yes. The class samples page shows how Tiny Steps live classes are structured and how teachers guide children through speaking, reading, grammar, and other learning tasks. A sample helps parents understand the teaching style, while the free 1:1 assessment is used to understand the individual child.',
  },
  {
    question: 'What is the difference between spoken English and public speaking classes?',
    answer:
      'They solve different problems. Spoken English focuses on everyday conversation, fuller responses, vocabulary in use, and conversational fluency. Public Speaking & Communication focuses on organising ideas for a listener or audience through structured answers, storytelling, presentations, show-and-tell, discussion, and audience awareness. If the main difficulty is everyday fluency, the dedicated Spoken English programme is the stronger first fit.',
  },
  {
    question: 'Are communication-skills classes included in the Tiny Steps Speaking programme?',
    answer:
      'Yes. Communication skills are part of the Tiny Steps Speaking & Communication pathway, not an add-on. Children practise organising ideas, answering clearly, listening and responding, storytelling, classroom participation, questioning, presentations, and adapting what they say for a listener or audience.',
  },
  {
    question: 'When is the confidence-building programme a better fit?',
    answer:
      'Confidence Building is the stronger fit when the child can already form and organise language adequately but participation comfort, hesitation, or dependence on reassurance is the main barrier. Public Speaking is the stronger fit when the child needs better organisation, storytelling, presentation structure, audience awareness, or longer speaking turns. The free assessment confirms which pattern is actually present.',
  },
  {
    question: 'How can parents see speaking progress?',
    answer:
      'Speaking progress should be visible in what the child can do with less help. Compare fresh tasks over time for clearer and more relevant responses, stronger idea organisation, better storytelling or presentation structure, less prompting, more purposeful delivery, and transfer of the same skill to a new topic or audience.',
  },
  {
    question: 'Why do parents choose Tiny Steps for public speaking and communication?',
    answer:
      'Tiny Steps is a trusted choice for parents in India and internationally who want live 1:1 speaking practice, assessment-first placement, structured communication tasks, specific teacher feedback, and parent-visible progress. Families can inspect the curriculum, class samples, Speaking Progress Framework, parent feedback, pricing, and the free assessment before deciding.',
  },
  {
    question: 'What should parents look for in an online public speaking course for kids?',
    answer:
      'Look for substantial child speaking time, age-appropriate tasks, clear progression, specific teacher feedback, guided retries, audience-aware communication, and a way to see whether the child can transfer the skill to a fresh task. Tiny Steps makes the curriculum, class samples, progress framework, pricing, and free assessment available so parents can inspect those points before enrolling.',
  },
  {
    question: 'Can families outside India join public speaking classes?',
    answer:
      'Yes. Tiny Steps supports families in India and worldwide, including NRI families and families in the UAE, United States, United Kingdom, Australia, Singapore, and other locations, subject to compatible teacher timings and learning fit.',
  },
  {
    question: 'Is Public Speaking the same as personality development for kids?',
    answer:
      'No. Public Speaking & Communication has a narrower educational focus: organising ideas, storytelling, presentations, discussion, questioning, audience awareness, listening and response. “Personality development” can include much broader areas such as behaviour, grooming, leadership, or social development, so Tiny Steps does not use it as a substitute label for the Speaking programme.',
  },
  {
    question: 'Why do communication skills matter in an AI-enabled world?',
    answer:
      'Yes—communication remains important in an AI-enabled world because generating information is not the same as judging, organising, explaining, questioning, listening, or responding. Tiny Steps develops those human communication habits through age-appropriate speaking practice. The programme is not positioned as an AI or prompt-engineering course.',
  },
  {
    question: 'Does Tiny Steps teach children prompt engineering in Public Speaking classes?',
    answer:
      'No. The Speaking programme remains a public-speaking and communication programme. Asking clearer questions is taught as a transferable communication and thinking skill, alongside listening, organising ideas, explanation, presentations, discussion, and audience awareness.',
  },
];

const speakingPathwayCards = [
  {
    name: 'Ideas and listening',
    description: 'Build attention, idea recall, listening, and guided response readiness before speaking.',
  },
  {
    name: 'Complete spoken responses',
    description: 'Help children expand short answers into complete, relevant responses for the task.',
  },
  {
    name: 'Structured answers',
    description: 'Organise ideas clearly so answers have a beginning, useful detail, and a clear ending.',
  },
  {
    name: 'Storytelling',
    description: 'Develop sequencing, relevant detail, expressive delivery, and a natural story flow.',
  },
  {
    name: 'Clear communication',
    description: 'Improve vocabulary choice, explanation clarity, listening-and-response skills, and purposeful delivery.',
  },
  {
    name: 'Presentation confidence',
    description: 'Build readiness for show-and-tell, classroom discussions, presentations, and audience-facing speaking.',
  },
];


const publicSpeakingLevelArchitecture = [
  {
    name: 'Public Speaking Foundations',
    path: speakingFacts.levels.beginner.canonicalCoursePath,
    description: `${speakingFacts.levels.beginner.ageRange.label} • ${speakingFacts.levels.beginner.lessonCount} lessons • organised responses, picture talk, show-and-tell, storytelling foundations, and short presentation readiness.`,
  },
  {
    name: 'Public Speaking Excellence',
    path: speakingFacts.levels.advanced.canonicalCoursePath,
    description: `${speakingFacts.levels.advanced.ageRange.label} • ${speakingFacts.levels.advanced.lessonCount} lessons • longer structured talks, storytelling, presentations, impromptu speaking, guided debate, and stronger delivery.`,
  },
];

const speakingSpecialistPathways = [
  {
    name: 'Spoken English',
    path: '/spoken-english-classes-for-kids-online',
    description: 'Use when everyday conversation, fuller responses, vocabulary in use, or conversational fluency is the main goal.',
  },
  {
    name: 'Confidence Building',
    path: '/confidence-building-program-kids',
    description: 'Use when speaking comfort, participation, hesitation, or dependence on prompting is the primary barrier.',
  },
];

const speakingDevelopmentalStages = [
  {
    ageLabel: 'Ages 4–5',
    title: 'Communication Foundations',
    lead: 'At this age, public speaking begins with communication—not podium speeches.',
    skills: [
      'Answer familiar questions in connected ideas',
      'Describe pictures, people, experiences, and choices',
      'Retell simple stories with a clear sequence',
      'Use show-and-tell and role play with prompts',
      'Listen, take turns, and ask simple questions',
    ],
    boundary:
      'Keep speaking turns playful, short, and heavily supported. Formal speeches, debate, and sustained presentation performance are not the goal.',
  },
  {
    ageLabel: 'Ages 6–8',
    title: 'Public Speaking Foundations',
    lead: 'Children can begin organising ideas for a listener and speaking for a clear purpose.',
    skills: [
      'Build complete, structured answers',
      'Use beginning–middle–end storytelling',
      'Give short prepared presentations',
      'State opinions and support them with reasons',
      'Practise question-and-answer, pace, clarity, and audience awareness',
    ],
    boundary:
      'Tasks stay concrete and age-appropriate, with modelling and guided retries before longer or more formal speaking is expected.',
  },
  {
    ageLabel: 'Ages 9–12',
    title: 'Advanced Communication & Public Speaking',
    lead: 'Older primary learners can work with more formal, persuasive, and audience-aware speaking tasks.',
    skills: [
      'Plan and deliver structured presentations',
      'Practise impromptu and extempore speaking',
      'Develop persuasive speaking and guided debate',
      'Use reasons, examples, and evidence to justify a viewpoint',
      'Adapt language to audience and respond thoughtfully to questions',
    ],
    boundary:
      'Advanced work should increase independence, reasoning, audience adaptation, and discussion skills without turning every lesson into a memorised speech.',
  },
] as const;

const speakingDevelopmentalReferences = [
  {
    label: 'ASHA communication milestones: ages 4–5',
    href: 'https://www.asha.org/public/developmental-milestones/communication-milestones-4-to-5-years/',
    note: 'Supports longer, more complex sentences, connected storytelling, directions, description, and conversational participation at this stage.',
  },
  {
    label: 'NAEYC: Developmentally Appropriate Practice',
    href: 'https://www.naeyc.org/node/3807',
    note: 'Supports strengths-based, play-based teaching that is appropriate to each child’s developmental, cultural, linguistic, and ability profile.',
  },
  {
    label: 'England National Curriculum: Spoken language, Years 1–6',
    href: 'https://www.gov.uk/government/publications/national-curriculum-in-england-english-programmes-of-study/national-curriculum-in-england-english-programmes-of-study',
    note: 'Includes relevant questioning, structured explanations, presentations, discussion, debate, audience awareness, and adapting communication to context.',
  },
  {
    label: 'Australian Curriculum v9: English',
    href: 'https://www.australiancurriculum.edu.au/curriculum-information/understand-this-learning-area/english',
    note: 'Progresses listening, interacting, speaking, audience awareness, and spoken presentations across the primary years.',
  },
] as const;

const speakingParentFitScenarios = [
  {
    signal: 'Mostly one-word or very short everyday answers',
    observe: 'The child may know some English but struggles to sustain everyday back-and-forth conversation or expand a response.',
    routeName: 'Spoken English',
    routePath: '/spoken-english-classes-for-kids-online',
    fit: 'Likely first check: conversational fluency',
    cta: 'Check Spoken English',
  },
  {
    signal: 'Ideas are present, but sentence formation is often inaccurate or incomplete',
    observe: 'Word order, tense, articles, prepositions, or sentence control may be limiting how clearly the child can express an idea.',
    routeName: 'Grammar',
    routePath: '/grammar',
    fit: 'Likely support: sentence formation and accuracy',
    cta: 'Check Grammar support',
  },
  {
    signal: 'Speaks comfortably one-to-one but avoids class, group, or unfamiliar speaking situations',
    observe: 'If language and idea structure are already adequate, participation comfort or hesitation may be the more important barrier.',
    routeName: 'Confidence Building',
    routePath: '/confidence-building-program-kids',
    fit: 'Likely first check: speaking comfort and participation',
    cta: 'Check Confidence Building',
  },
  {
    signal: 'Has ideas but answers wander, jump around, or end without a clear point',
    observe: 'The child may need help organising ideas into complete, relevant, listener-friendly responses.',
    routeName: 'Speaking & Communication',
    routePath: '/book-demo',
    fit: 'Best fit: this Speaking programme',
    cta: 'Check the right speaking level',
  },
  {
    signal: 'Can answer questions but struggles with storytelling, show-and-tell, or short presentations',
    observe: 'The next step may be structured speaking practice: sequencing, relevant detail, delivery, and awareness of the listener.',
    routeName: 'Public Speaking Foundations',
    routePath: speakingFacts.levels.beginner.canonicalCoursePath,
    fit: 'Likely fit: foundational public speaking',
    cta: 'View Foundations details',
  },
  {
    signal: 'Ready for longer talks, opinions, impromptu speaking, persuasion, or guided debate',
    observe: 'The child may be ready for greater independence, stronger reasoning, audience adaptation, and more demanding speaking tasks.',
    routeName: 'Public Speaking Excellence',
    routePath: speakingFacts.levels.advanced.canonicalCoursePath,
    fit: 'Likely fit: advanced public speaking',
    cta: 'View Excellence details',
  },
] as const;

const speakingFitReferences = [
  {
    label: 'Oracy Cambridge — Oracy Skills Framework',
    href: 'https://oracycambridge.org/wp-content/uploads/2020/06/The-Oracy-Skills-Framework-and-Glossary.pdf',
    note: 'Frames spoken communication across physical, linguistic, cognitive, and social/emotional dimensions; it is designed for targets and formative feedback, not as a diagnostic assessment.',
  },
  {
    label: 'ASHA — Communication Milestones',
    href: 'https://www.asha.org/public/developmental-milestones/communication-milestones/',
    note: 'States that children develop uniquely and that milestone information is not a screening or diagnostic tool; broader speech, language, or hearing concerns need qualified professional assessment.',
  },
] as const;

const speakingAiEraCapabilities = [
  {
    step: 'ASK',
    title: 'Ask useful questions',
    detail: 'Clarify the task, identify what is missing, and ask follow-up questions instead of accepting the first answer.',
  },
  {
    step: 'THINK',
    title: 'Think before accepting',
    detail: 'Compare ideas, notice assumptions, decide what needs checking, and separate a plausible answer from a well-supported one.',
  },
  {
    step: 'ORGANISE',
    title: 'Organise ideas',
    detail: 'Put information into a logical order so another person can follow the reasoning, story, explanation, or argument.',
  },
  {
    step: 'EXPLAIN',
    title: 'Explain clearly',
    detail: 'Use the child’s own words, examples, reasons, and audience-appropriate language to make thinking understandable.',
  },
  {
    step: 'LISTEN',
    title: 'Listen and understand',
    detail: 'Pay attention to another viewpoint, identify what was actually said, and ask for clarification when needed.',
  },
  {
    step: 'RESPOND',
    title: 'Respond thoughtfully',
    detail: 'Adapt the next answer to new information, feedback, evidence, the audience, and the purpose of the conversation.',
  },
] as const;

const speakingAiEraReferences = [
  {
    label: 'UNESCO — AI Competency Framework for Students',
    href: 'https://www.unesco.org/en/articles/ai-competency-framework-students',
    note: 'Emphasises a human-centred mindset, responsible and creative participation, and critical judgement of AI solutions. Tiny Steps uses this as future-facing education context, not as a public-speaking curriculum standard.',
  },
  {
    label: 'OECD — Learning Compass 2030',
    href: 'https://www.oecd.org/en/data/tools/oecd-learning-compass-2030.html',
    note: 'Frames student agency and the ability to navigate unfamiliar contexts as important future competencies. It is globally informed and intended to be locally contextualised.',
  },
  {
    label: 'UNICEF Innocenti — Skills for an AI World',
    href: 'https://www.unicef.org/innocenti/reports/skills-ai-world',
    note: 'Its 2026 child-centred work highlights critical thinking, information literacy, autonomy, moderation in AI use, and the importance of human relationships. The consultation sample was ages 9–17, so it is not used as a preschool-development standard.',
  },
  {
    label: 'World Economic Forum — Future of Jobs Report 2025',
    href: 'https://www.weforum.org/publications/the-future-of-jobs-report-2025/in-full/3-skills-outlook/',
    note: 'Employer research identifies analytical thinking as a leading core skill and also highlights technological literacy, empathy and active listening, curiosity, and creative thinking. This is labour-market context, not a child-development benchmark.',
  },
] as const;

const speakingDecisionEvidence = [
  {
    step: '01',
    title: 'Inspect the curriculum',
    detail: 'See the speaking roadmap and the existing Foundations and Excellence pathways before deciding.',
    path: '/curriculum?tab=speaking',
    cta: 'View curriculum',
  },
  {
    step: '02',
    title: 'Watch a real class',
    detail: 'Use class samples to inspect the teaching style, prompting, child participation, correction, and retry process.',
    path: '/class-samples',
    cta: 'Watch class samples',
  },
  {
    step: '03',
    title: 'See how progress is measured',
    detail: 'Review the Speaking Progress Framework, including support-to-independence bands and fresh-task transfer.',
    path: SPEAKING_PROGRESS_FRAMEWORK_PATH,
    cta: 'View progress framework',
  },
  {
    step: '04',
    title: 'Read parent evidence',
    detail: 'Read bounded first-party feedback as one decision signal alongside the curriculum, class evidence, and your child’s own assessment.',
    path: '/testimonials',
    cta: 'Read parent feedback',
  },
  {
    step: '05',
    title: 'Check the price',
    detail: `Standard live 1:1 classes are ${speakingClassPriceLabel}. The free ${demoMinutes}-minute 1:1 assessment comes before enrolment.`,
    path: '/pricing',
    cta: 'See full pricing',
  },
] as const;

export default function SpeakingPage() {
  const canonicalPath = '/speaking';
  const canonicalUrl = `${PUBLIC_FACTS.primaryWebsite}${canonicalPath}`;

  useEffect(() => {
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
        { '@type': 'ListItem', position: 2, name: 'Curriculum', item: 'https://tinystepslearning.com/curriculum' },
        { '@type': 'ListItem', position: 3, name: 'Public Speaking Classes for Kids', item: canonicalUrl },
      ],
    };

    const webpageSchema = {
      ...createWebPageSchema({
        name: 'Online Public Speaking Classes for Kids',
        description: seoDescription,
        url: canonicalUrl,
      }),
      '@id': `${canonicalUrl}#webpage`,
      about: [
        { '@type': 'Thing', name: 'Public speaking classes for kids' },
        { '@type': 'Thing', name: 'Communication skills for kids' },
        { '@type': 'Thing', name: 'Structured spoken answers' },
        { '@type': 'Thing', name: 'Storytelling' },
        { '@type': 'Thing', name: 'Presentations and audience awareness' },
      ],
      speakable: buildSpeakableSpecification([
        '.ts-speaking-answer-title',
        '.ts-speaking-answer-summary',
      ]),
    };

    const speakingPositioningSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': `${canonicalUrl}#tiny-steps-positioning`,
      name: 'Why families shortlist Tiny Steps for public speaking and communication',
      itemListOrder: 'https://schema.org/ItemListOrderUnordered',
      numberOfItems: speakingPositioningProof.length,
      itemListElement: speakingPositioningProof.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Thing',
          name: item.title,
          description: item.detail,
        },
      })),
    };

    const pathwayItemListSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Tiny Steps speaking and communication pathway',
      url: canonicalUrl,
      numberOfItems: speakingPathwayCards.length,
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      itemListElement: speakingPathwayCards.map((card, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Thing',
          name: card.name,
          description: card.description,
        },
      })),
    };

    const faqSchema = {
      ...createFAQPageSchema(faqItems),
      '@id': `${canonicalUrl}#faq`,
    };

    const publicSpeakingLevelsSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': `${canonicalUrl}#public-speaking-levels`,
      name: 'Tiny Steps Public Speaking levels',
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      numberOfItems: publicSpeakingLevelArchitecture.length,
      itemListElement: publicSpeakingLevelArchitecture.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'WebPage',
          name: item.name,
          url: `${PUBLIC_FACTS.primaryWebsite}${item.path}`,
          description: item.description,
        },
      })),
    };

    const speakingSpecialistPathwaysSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': `${canonicalUrl}#speaking-specialist-pathways`,
      name: 'Tiny Steps adjacent speaking specialist pathways',
      itemListOrder: 'https://schema.org/ItemListUnordered',
      numberOfItems: speakingSpecialistPathways.length,
      itemListElement: speakingSpecialistPathways.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'WebPage',
          name: item.name,
          url: `${PUBLIC_FACTS.primaryWebsite}${item.path}`,
          description: item.description,
        },
      })),
    };

    const speakingDecisionEvidenceSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': `${canonicalUrl}#parent-decision-evidence`,
      name: 'What parents can inspect before enrolling in Tiny Steps Speaking',
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      numberOfItems: speakingDecisionEvidence.length,
      itemListElement: speakingDecisionEvidence.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'WebPage',
          name: item.title,
          url: item.path.startsWith('http') ? item.path : `${PUBLIC_FACTS.primaryWebsite}${item.path.split('?')[0]}`,
          description: item.detail,
        },
      })),
    };

    const speakingAiEraCapabilitiesSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': `${canonicalUrl}#communication-for-ai-era`,
      name: 'Tiny Steps communication capabilities for an AI-enabled world',
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      numberOfItems: speakingAiEraCapabilities.length,
      itemListElement: speakingAiEraCapabilities.map((capability, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Thing',
          name: `${capability.step}: ${capability.title}`,
          description: capability.detail,
        },
      })),
    };

    const speakingParentFitSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': `${canonicalUrl}#parent-programme-fit`,
      name: 'Tiny Steps parent speaking-needs routing guide',
      itemListOrder: 'https://schema.org/ItemListOrderUnordered',
      numberOfItems: speakingParentFitScenarios.length,
      itemListElement: speakingParentFitScenarios.map((scenario, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Thing',
          name: scenario.signal,
          description: `${scenario.observe} Suggested Tiny Steps pathway to inspect: ${scenario.routeName}. Final placement is assessment-led.`,
        },
      })),
    };

    const speakingDevelopmentalStagesSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': `${canonicalUrl}#developmental-speaking-stages`,
      name: 'Tiny Steps age-appropriate public speaking and communication progression',
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      numberOfItems: speakingDevelopmentalStages.length,
      itemListElement: speakingDevelopmentalStages.map((stage, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Thing',
          name: `${stage.ageLabel}: ${stage.title}`,
          description: `${stage.lead} ${stage.boundary}`,
        },
      })),
    };

    const speakingEvidenceSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': `${canonicalUrl}#evidence-sources`,
      name: 'Tiny Steps Speaking evidence sources',
      itemListOrder: 'https://schema.org/ItemListOrderUnordered',
      numberOfItems: SPEAKING_EVIDENCE_SURFACES.length,
      itemListElement: SPEAKING_EVIDENCE_SURFACES.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'WebPage',
          name: item.title,
          url: `${PUBLIC_FACTS.primaryWebsite}${item.sourcePath}`,
          description: `${item.summary} Evidence boundary: ${item.doesNotProve[0]}.`,
        },
      })),
    };

    applySeo({
      title: seoTitle,
      description: seoDescription,
      canonicalPath,
      robots: 'index,follow',
      ogType: 'website',
      keywords: SPEAKING_SEO_KEYWORDS,
      jsonLd: [breadcrumbSchema, webpageSchema, speakingPositioningSchema, pathwayItemListSchema, speakingDecisionEvidenceSchema, speakingAiEraCapabilitiesSchema, speakingParentFitSchema, speakingDevelopmentalStagesSchema, publicSpeakingLevelsSchema, speakingSpecialistPathwaysSchema, speakingEvidenceSchema, faqSchema],
    });
  }, [canonicalPath, canonicalUrl]);

  return (
    <div className="bg-[#fbfbfd] pb-12">
      <section className="relative overflow-hidden px-4 pb-8 pt-7 sm:px-5 md:pb-10 md:pt-9 lg:px-8 lg:pb-12">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 82% 32%, rgba(244, 226, 212, 0.66) 0%, rgba(244, 226, 212, 0.34) 24%, transparent 46%), radial-gradient(circle at 72% 48%, rgba(218, 231, 215, 0.32) 0%, rgba(218, 231, 215, 0.16) 20%, transparent 42%), radial-gradient(circle at 12% 18%, rgba(229, 220, 255, 0.46) 0%, rgba(229, 220, 255, 0.18) 28%, transparent 52%), linear-gradient(180deg, #faf7ff 0%, #fffaf7 56%, #fbfbfd 100%)',
          }}
        />
        <div className="pointer-events-none absolute left-[-10%] top-[-34%] h-[560px] w-[560px] rounded-full bg-violet-200/24 blur-[128px]" />
        <div className="pointer-events-none absolute right-[-7%] top-[-24%] h-[560px] w-[560px] rounded-full bg-[#f1ddd0]/45 blur-[130px]" />

        <div className="relative mx-auto max-w-7xl">
          <nav aria-label="Breadcrumb" className="mb-4 text-xs text-slate-600 sm:text-sm">
            <ol className="flex flex-wrap items-center gap-2">
              <li><Link to="/" className="hover:text-slate-900 hover:underline">Home</Link></li>
              <li aria-hidden="true">›</li>
              <li><Link to="/curriculum" className="hover:text-slate-900 hover:underline">Curriculum</Link></li>
              <li aria-hidden="true">›</li>
              <li className="font-medium text-slate-900">Public Speaking Classes for Kids</li>
            </ol>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(380px,1fr)] lg:items-center lg:gap-10 xl:gap-12">
            <div className="max-w-[820px]">
              <p className="inline-flex rounded-full border border-violet-200/80 bg-white/78 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-800 shadow-[0_8px_22px_rgba(124,58,237,0.07)] backdrop-blur">
                Live 1:1 Public Speaking & Communication
              </p>

              <h1 className="mt-5 text-[clamp(2.55rem,6vw,4.2rem)] font-black leading-[0.97] tracking-[-0.052em] text-[#172033]">
                Online Public Speaking Classes for Kids
              </h1>

              <p className="mt-5 max-w-[760px] text-base font-medium leading-7 text-slate-700 md:text-[1.05rem] md:leading-8">
                Structured speaking practice for {speakingAgeRangeLabel}: clear answers, storytelling, presentations, audience awareness, and confident communication.
              </p>

              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600 md:text-[15px]">
                {PUBLIC_SESSION_DURATION_LABEL} • {speakingClassPriceLabel} • Free {demoMinutes}-min assessment
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link to="/book-demo" className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#182338] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(23,32,51,0.16)] transition hover:bg-[#111b2d]">
                  Book Free Assessment
                </Link>
                <Link to="/class-samples" className="inline-flex min-h-[46px] items-center justify-center rounded-full border border-slate-300/80 bg-white/82 px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-white">
                  Watch a Real Class
                </Link>
                <Link to="/curriculum?tab=speaking" className="inline-flex min-h-[46px] items-center justify-center px-2 py-2.5 text-sm font-semibold text-violet-800 underline decoration-violet-300 underline-offset-4 transition hover:text-violet-950">
                  View Curriculum
                </Link>
              </div>

              <p className="mt-5 text-xs font-semibold tracking-[0.01em] text-slate-500 sm:text-sm">
                {PUBLIC_LEARNER_REACH_LABEL} • Parent progress updates
              </p>
            </div>

            <div className="relative lg:-mr-3 xl:-mr-7">
              <div className="pointer-events-none absolute -inset-14 bg-[radial-gradient(ellipse_at_center,rgba(249,235,224,0.46)_0%,rgba(239,229,255,0.18)_48%,transparent_78%)] blur-[34px]" />
              <div className="relative h-[300px] w-full sm:h-[350px] lg:h-[405px] xl:h-[440px]">
                <img
                  src="/blog/hero-families/Tiny_Steps_Speaking.webp"
                  alt="Child practising public speaking online at home"
                  className="h-full w-full object-cover object-[61%_center]"
                  style={{
                    WebkitMaskImage:
                      'radial-gradient(ellipse 78% 76% at 54% 52%, #000 0%, #000 58%, rgba(0,0,0,0.98) 68%, rgba(0,0,0,0.82) 78%, rgba(0,0,0,0.48) 88%, rgba(0,0,0,0.16) 96%, transparent 100%)',
                    maskImage:
                      'radial-gradient(ellipse 78% 76% at 54% 52%, #000 0%, #000 58%, rgba(0,0,0,0.98) 68%, rgba(0,0,0,0.82) 78%, rgba(0,0,0,0.48) 88%, rgba(0,0,0,0.16) 96%, transparent 100%)',
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                  }}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  onError={(event) => {
                    const image = event.currentTarget;
                    if (!image.src.endsWith('/presenting-with-confidence.webp')) {
                      image.src = '/blog/hero-families/presenting-with-confidence.webp';
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-5 sm:px-5 md:py-7 lg:px-6">
        <div className="mx-auto grid max-w-6xl gap-4 border-y border-slate-200/80 py-5 md:grid-cols-[0.28fr_0.72fr] md:items-start md:gap-8 md:py-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-700">Parent clarity</p>
          <div>
            <h2 className="ts-speaking-answer-title text-xl font-semibold tracking-[-0.025em] text-slate-950 md:text-2xl">
              Quick Answer: What do public speaking classes for kids include?
            </h2>
            <p className="ts-speaking-answer-summary mt-2 max-w-[930px] text-sm leading-6 text-slate-600 md:text-[15px] md:leading-7">
              Public Speaking & Communication is for children who can already communicate at a basic level and need stronger idea organisation, storytelling, presentations, audience awareness, and audience-facing speaking. If the main need is everyday fluency, sentence formation, or confidence-only support, the free {demoMinutes}-minute assessment helps route the child to Spoken English, Grammar, or Confidence Building instead.
            </p>
          </div>
        </div>
      </section>

      <section id="parent-programme-fit" className="px-4 py-7 sm:px-5 md:py-9 lg:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-5 lg:grid-cols-[0.68fr_1.32fr] lg:items-start lg:gap-10">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Start with the real difficulty</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">What is your child struggling with?</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base md:leading-7">
                The right programme depends on the actual speaking problem, not on a generic “confidence” label. Tiny Steps separates everyday conversation, sentence control, participation comfort, idea organisation, presentation structure, and advanced speaking, then uses the free 1:1 assessment to confirm the pathway.
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Everyday conversational fluency belongs to Spoken English. Confidence-only barriers belong to Confidence Building. The Speaking programme builds audience-facing communication; it does not replace support for one-word everyday answers or sentence formation itself.
              </p>
              <div className="mt-4 rounded-[18px] border border-violet-100 bg-violet-50/55 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-800">Core Speaking fit</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Public Speaking & Communication is the strongest fit for children who can already communicate at a basic level but need to organise ideas, tell stories, present, explain opinions, adapt to a listener, or speak with less prompting.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {speakingParentFitScenarios.map((scenario) => (
                <article key={scenario.signal} className="flex h-full flex-col rounded-[20px] border border-slate-200 bg-white p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">What parents may notice</p>
                  <h3 className="mt-1.5 text-sm font-semibold leading-5 text-slate-950">{scenario.signal}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{scenario.observe}</p>
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <p className="text-xs font-semibold text-violet-800">{scenario.fit}</p>
                    <p className="mt-1 text-xs text-slate-500">Pathway to inspect: {scenario.routeName}</p>
                    <Link to={scenario.routePath} className="mt-2 inline-flex min-h-[40px] items-center text-xs font-semibold text-slate-900 underline underline-offset-3">
                      {scenario.cta} ↗
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <details className="group mt-5 rounded-[18px] border border-slate-200 bg-slate-50/70">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 text-sm font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
              <span>Why Tiny Steps separates these needs — evidence & assessment boundary</span>
              <span aria-hidden="true" className="text-lg text-slate-400 transition group-open:rotate-45">+</span>
            </summary>
            <div className="border-t border-slate-200 px-4 pb-4 pt-3">
              <p className="text-sm leading-6 text-slate-600">
                Spoken communication is multidimensional. The Oracy Skills Framework describes physical, linguistic, cognitive, and social/emotional dimensions. These are programme-fit cues, not diagnoses. Tiny Steps uses the free assessment for educational programme fit; it is not a clinical diagnosis.
              </p>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {speakingFitReferences.map((source) => (
                  <a key={source.href} href={source.href} target="_blank" rel="noreferrer" className="rounded-[14px] border border-slate-200 bg-white px-3.5 py-3 transition hover:border-violet-200">
                    <span className="text-xs font-semibold text-slate-900">{source.label} ↗</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">{source.note}</span>
                  </a>
                ))}
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Broader speech, language, hearing, or communication-development concerns should be assessed by an appropriately qualified speech-language or hearing professional.
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Final placement is assessment-led. The free assessment checks observable performance before recommending a programme.
              </p>
            </div>
          </details>
        </div>
      </section>

      {speakingAiVisibility ? <ProgrammeIntentBoundary config={speakingAiVisibility} /> : null}

      <section id="tiny-steps-positioning" className="px-4 py-7 sm:px-5 md:py-9 lg:px-6">
        <div className="mx-auto max-w-6xl rounded-[26px] border border-violet-100 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)] md:p-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-700">Why Tiny Steps stands out</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
            Why families shortlist Tiny Steps for public speaking and communication
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600 md:text-base">
            Tiny Steps is a trusted choice for parents in India and internationally who want personalised, teacher-led speaking practice with clear programme boundaries, assessment-first placement, structured communication tasks, and progress parents can inspect.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {speakingPositioningProof.map((item) => (
              <article key={item.title} className="rounded-[18px] border border-slate-200 bg-[#fcfbff] p-4">
                <h3 className="text-sm font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-7 sm:px-5 md:py-9 lg:px-6">
        <div className="mx-auto max-w-6xl border-y border-slate-200/80 py-6 md:py-8">
          <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:gap-10">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-700">Speaking pathway</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">Build from complete responses to audience-facing speaking</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Tiny Steps uses assessment-first placement so the child starts at the useful stage instead of repeating skills that are already secure.
              </p>

              <div className="mt-5 rounded-[18px] border border-slate-200 bg-white p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Supporting foundations — only when the assessment shows they are needed</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link to="/grammar" className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-slate-800">Grammar & sentence formation</Link>
                  <Link to="/spoken-english-classes-for-kids-online" className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-slate-800">Everyday conversation & fluency</Link>
                </div>
              </div>
            </div>

            <div className="grid gap-x-7 gap-y-4 md:grid-cols-2">
              {speakingPathwayCards.map((card, index) => (
                <article key={card.name} className="border-l border-slate-200 pl-4">
                  <span className="text-[10px] font-bold tracking-[0.16em] text-violet-600">0{index + 1}</span>
                  <h3 className="mt-1.5 text-sm font-semibold text-slate-950">{card.name}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{card.description}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-3">
            <article className="rounded-[20px] border border-amber-100 bg-white p-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-800">{speakingFacts.levels.beginner.ageRange.label}</span>
              <h3 className="mt-2 font-semibold text-slate-950">Public Speaking Foundations</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">{speakingFacts.levels.beginner.lessonCount} lessons for structured responses, picture talk, show-and-tell, storytelling foundations, and short presentation readiness.</p>
              <Link to={speakingFacts.levels.beginner.canonicalCoursePath} className="mt-2 inline-block text-xs font-semibold underline underline-offset-2">View Foundations details</Link>
            </article>

            <article className="rounded-[20px] border border-sky-100 bg-white p-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-sky-800">{speakingFacts.levels.advanced.ageRange.label}</span>
              <h3 className="mt-2 font-semibold text-slate-950">Public Speaking Excellence</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">{speakingFacts.levels.advanced.lessonCount} lessons for longer structured talks, storytelling, presentations, opinions, audience awareness, and stronger delivery.</p>
              <Link to={speakingFacts.levels.advanced.canonicalCoursePath} className="mt-2 inline-block text-xs font-semibold underline underline-offset-2">View Excellence details</Link>
            </article>

            <article className="rounded-[20px] border border-indigo-100 bg-white p-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-800">Assessment-led placement</span>
              <h3 className="mt-2 font-semibold text-slate-950">Age 7 sits in both ranges</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">Placement considers response length, organisation, storytelling, presentation readiness, confidence, and prompting—not age alone.</p>
              <Link to="/book-demo" className="mt-2 inline-block text-xs font-semibold underline underline-offset-2">Check the right speaking level</Link>
            </article>
          </div>
        </div>
      </section>

      <ResponsiveTeachingSection
        appearance="premium"
        id="teacher-delivery"
        program="Public Speaking & Communication"
        introduction="Teachers provide a predictable speaking routine: model a clear response, offer guided prompts, listen to the child’s attempt and help them retry. Prompts are reduced gradually so confidence grows alongside independent expression."
        steps={[
          { title: 'Model and organise', detail: 'The teacher shows how to form a complete answer, add relevant detail and organise ideas for the task.' },
          { title: 'Prompt and retry', detail: 'The child speaks in short, age-appropriate turns with encouraging, specific feedback and guided retries.' },
          { title: 'Reduce support', detail: 'Topics, examples, wait time and prompts adjust to readiness, then fade as the child speaks more independently.' },
        ]}
        observation="sentence completeness, idea organisation, clarity, response to feedback and how much prompting the child needs before speaking independently."
      />
      <div className="mx-auto -mt-2 flex max-w-6xl flex-wrap gap-x-4 gap-y-2 px-4 pb-3 text-sm sm:px-5 lg:px-6">
        <Link to="/class-samples" className="font-semibold text-slate-900 underline underline-offset-2">View real class samples</Link>
        <Link to="/book-demo" className="font-semibold text-slate-700 underline underline-offset-2">Book the free assessment</Link>
      </div>

      <section className="px-4 py-7 sm:px-5 md:py-9 lg:px-6">
        <div className="mx-auto max-w-6xl rounded-[26px] border border-violet-100 bg-violet-50/45 p-5 md:p-7">
          <div className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr] lg:gap-9">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-700">Progress evidence</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">How parents see speaking progress</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Tiny Steps tracks a speaking profile rather than one total score. Parents can look for less prompting, better idea organisation, clearer storytelling and presentations, and transfer to a fresh speaking task.
              </p>
              <Link to={SPEAKING_PROGRESS_FRAMEWORK_PATH} className="mt-4 inline-block text-sm font-semibold text-slate-900 underline underline-offset-2">
                Explore the Speaking Progress Framework
              </Link>
            </div>

            <div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {SPEAKING_PROGRESS_DIMENSIONS.slice(0, 6).map((dimension) => (
                  <div key={dimension.id} className="rounded-[16px] border border-white/80 bg-white/75 px-3 py-3 text-xs font-semibold leading-5 text-slate-700">
                    {dimension.label}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-500">
                Observation moves through {SPEAKING_PROGRESS_OBSERVATION_BANDS.length} support-to-independence bands and is checked again on fresh tasks.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-7 sm:px-5 md:py-9 lg:px-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">Parent evidence</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">What speaking parents noticed first</h2>
          <div className="mt-5">
            <TestimonialSnippets courseTag="speaking" title="Parent feedback from speaking families" />
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            These are curated first-party comments from individual families, not a promise that another child will have the same result. Review them together with <Link to="/class-samples" className="font-semibold underline underline-offset-2">class samples</Link>, the <Link to="/curriculum" className="font-semibold underline underline-offset-2">curriculum</Link>, the <Link to={SPEAKING_PROGRESS_FRAMEWORK_PATH} className="font-semibold underline underline-offset-2">Speaking Progress Framework</Link>, and your child&apos;s own assessment.
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Some families may notice greater confidence as speaking structure improves. Confidence-only barriers remain owned by the dedicated <Link to="/confidence-building-program-kids" className="font-semibold underline underline-offset-2">Confidence Building programme</Link>; this page stays focused on structured and audience-facing communication.
          </p>
        </div>
      </section>

      <section id="before-enrolment" className="px-4 py-7 sm:px-5 md:py-9 lg:px-6">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.04)] sm:p-6 md:p-8">
          <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr] lg:items-start lg:gap-10">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-700">Before you enrol</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
                Five things parents can verify before choosing Tiny Steps Speaking
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base md:leading-7">
                You do not need to decide from marketing copy alone. Inspect the curriculum, teaching approach, progress method, first-party parent feedback, and current pricing—then use the free assessment to decide whether the programme and level fit your child.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link to="/book-demo" className="inline-flex min-h-[46px] items-center justify-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
                  Book Free Assessment
                </Link>
                <Link to="/pricing" className="inline-flex min-h-[46px] items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">
                  {speakingClassPriceLabel} • See Pricing
                </Link>
              </div>
            </div>

            <div className="grid gap-2.5">
              {speakingDecisionEvidence.map((item) => (
                <Link
                  key={item.step}
                  to={item.path}
                  className="grid gap-2 rounded-[18px] border border-slate-200 bg-slate-50/55 p-4 transition hover:-translate-y-0.5 hover:border-violet-200 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-4"
                >
                  <span className="text-[10px] font-bold tracking-[0.16em] text-violet-700">{item.step}</span>
                  <span>
                    <span className="block text-sm font-semibold text-slate-950">{item.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">{item.detail}</span>
                  </span>
                  <span className="text-xs font-semibold text-slate-800 underline underline-offset-3">{item.cta} ↗</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing-and-assessment" className="px-4 py-7 sm:px-5 md:py-9 lg:px-6">
        <div className="mx-auto max-w-6xl rounded-[26px] bg-slate-950 p-5 text-white shadow-[0_24px_60px_rgba(15,23,42,0.12)] md:p-7">
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300">Transparent starting point</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
                {speakingClassPriceLabel} for standard live 1:1 classes. Start with a free assessment.
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300 md:text-[15px]">
                Standard Tiny Steps 1:1 classes run for {PUBLIC_SESSION_DURATION_LABEL}. Before enrolment, the free {demoMinutes}-minute 1:1 assessment checks how your child answers questions, organises ideas, tells a story, responds to prompts, handles presentation-style tasks, and how much support is needed.
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-white">
                Not sure which speaking path fits your child? The assessment helps confirm the programme and level before enrolment.
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                The assessment is used for programme and level fit; it is not a clinical diagnosis and does not guarantee a fixed improvement timeline.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link to="/book-demo" className="inline-flex min-h-[46px] items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
                  Book Free Assessment
                </Link>
                <Link to="/pricing" className="inline-flex min-h-[46px] items-center justify-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                  View Full Pricing
                </Link>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">What the assessment may observe</p>
              <div className="mt-3 grid grid-cols-2 gap-2.5 text-sm">
                {['Response structure', 'Idea organisation', 'Storytelling', 'Presentation readiness', 'Prompt independence', 'Speaking confidence'].map((item) => (
                  <div key={item} className="rounded-[16px] border border-white/10 bg-white/5 px-3 py-3 text-slate-200">
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs">
                <Link to="/class-samples" className="font-semibold text-slate-200 underline underline-offset-3">Watch class samples</Link>
                <Link to={SPEAKING_PROGRESS_FRAMEWORK_PATH} className="font-semibold text-slate-200 underline underline-offset-3">See progress method</Link>
                <Link to="/testimonials" className="font-semibold text-slate-200 underline underline-offset-3">Read parent feedback</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="age-appropriate-speaking" className="px-4 py-7 sm:px-5 md:py-9 lg:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr] lg:items-start lg:gap-10">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-700">Age-appropriate progression</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
                What public speaking should look like at different ages
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base md:leading-7">
                Children can begin public-speaking development as early as age four when the work is communication-focused and developmentally appropriate. Tiny Steps starts younger children with description, storytelling, show-and-tell, listening, turn-taking, and short connected responses—not adult-style speeches. There is no single global starting-age rule, so recognised developmental communication evidence and primary-school spoken-language frameworks are used as reference points while the task is adjusted to the child.
              </p>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-800">
                Tiny Steps position: age four is a valid starting point for communication foundations when the work is age-appropriate—but not for adult-style speeches. There is no single global rule that says children should begin public speaking at one exact age.
              </p>
            </div>

            <div className="grid gap-3">
              {speakingDevelopmentalStages.map((stage) => (
                <article key={stage.ageLabel} className="rounded-[20px] border border-slate-200 bg-white p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-800">{stage.ageLabel}</span>
                    <h3 className="text-base font-semibold text-slate-950">{stage.title}</h3>
                  </div>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{stage.lead}</p>
                  <ul className="mt-3 grid gap-x-5 gap-y-1.5 text-sm leading-6 text-slate-600 sm:grid-cols-2">
                    {stage.skills.map((skill) => (
                      <li key={skill} className="flex gap-2">
                        <span aria-hidden="true" className="mt-[9px] h-1.5 w-1.5 flex-none rounded-full bg-violet-400" />
                        <span>{skill}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500">
                    <strong className="text-slate-700">Developmental boundary:</strong> {stage.boundary}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <details className="group mt-5 rounded-[18px] border border-slate-200 bg-slate-50/70">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 text-sm font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
              <span>View developmental evidence & international curriculum references</span>
              <span aria-hidden="true" className="text-lg text-slate-400 transition group-open:rotate-45">+</span>
            </summary>
            <div className="border-t border-slate-200 px-4 pb-4 pt-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Evidence & international curriculum references</p>
            <p className="mt-2 max-w-4xl text-xs leading-5 text-slate-500">
              These references guide the progression; they do not create a universal public-speaking starting age. Tiny Steps still uses individual assessment and readiness for placement.
            </p>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {speakingDevelopmentalReferences.map((source) => (
                <a
                  key={source.href}
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-[14px] border border-slate-200 bg-white px-3.5 py-3 transition hover:border-violet-200"
                >
                  <span className="text-xs font-semibold text-slate-900">{source.label} ↗</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">{source.note}</span>
                </a>
              ))}
            </div>
            </div>
          </details>

          <div className="mt-4 rounded-[18px] border border-amber-100 bg-amber-50/55 px-4 py-3 text-sm leading-6 text-slate-700">
            <strong className="text-slate-950">Programme note:</strong> these three age bands are a developmental guide, not three new Tiny Steps course products. The existing Public Speaking Foundations and Public Speaking Excellence tracks remain the actual course architecture, and assessment determines the appropriate level.
          </div>
        </div>
      </section>

      <section id="communication-for-ai-era" className="px-4 py-7 sm:px-5 md:py-9 lg:px-6">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#f8f7ff_0%,#ffffff_50%,#f5fbff_100%)] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.04)] sm:p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr] lg:gap-10">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-700">Communication for a changing world</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
                Communication skills matter even more when information is easy to generate
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base md:leading-7">
                Communication remains a core human skill in an AI-enabled world. AI tools can help generate information quickly, but children still need to decide what question matters, what needs checking, how ideas fit together, how to explain their reasoning, how to listen to another person, and how to respond responsibly.
              </p>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-800">
                Tiny Steps develops those habits through speaking practice and treats better questioning as part of better communication—not as a prompt-engineering course.
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                This does not mean young children need to use AI tools. The same habits can be practised through ordinary, age-appropriate conversation, storytelling, explanation, discussion, and questioning.
              </p>
              <Link
                to="/blog/why-public-speaking-is-important-for-kids"
                className="mt-4 inline-flex text-sm font-semibold text-violet-800 underline decoration-violet-300 underline-offset-4"
              >
                Read the full guide: why public speaking and communication matter for kids ↗
              </Link>
              <div className="mt-5 rounded-[18px] border border-violet-100 bg-white/80 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-800">The communication loop</p>
                <p className="mt-2 text-base font-semibold tracking-[-0.02em] text-slate-950">
                  ASK → THINK → ORGANISE → EXPLAIN → LISTEN → RESPOND
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  The sequence is a Tiny Steps teaching framework. The external sources below support the broader importance of human agency, critical judgement, information literacy, analytical thinking, listening, curiosity, and responsible participation in an AI-influenced world.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {speakingAiEraCapabilities.map((capability) => (
                <article key={capability.step} className="rounded-[18px] border border-white/90 bg-white/85 p-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex min-w-[74px] justify-center rounded-full bg-slate-950 px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-white">
                      {capability.step}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-950">{capability.title}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{capability.detail}</p>
                </article>
              ))}
            </div>
          </div>

          <details className="group mt-6 border-t border-slate-200/80 pt-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
              <span>View international and future-skills references</span>
              <span aria-hidden="true" className="text-lg text-slate-400 transition group-open:rotate-45">+</span>
            </summary>
            <div className="mt-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">International and future-skills references</p>
                <p className="mt-1 max-w-4xl text-xs leading-5 text-slate-500">
                  These sources provide context for future-ready education. They do not claim that public-speaking lessons alone produce AI competence, future job success, or any guaranteed outcome.
                </p>
              </div>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {speakingAiEraReferences.map((source) => (
                <a
                  key={source.href}
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-[14px] border border-slate-200 bg-white px-3.5 py-3 transition hover:border-violet-200"
                >
                  <span className="text-xs font-semibold text-slate-900">{source.label} ↗</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">{source.note}</span>
                </a>
              ))}
            </div>
            </div>
          </details>
        </div>
      </section>

      <section data-speaking-evidence-layer className="px-4 py-7 sm:px-5 md:py-9 lg:px-6">
        <div className="mx-auto max-w-6xl border-y border-slate-200/80 py-6 md:py-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Evidence before enrolment</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">What you can verify — and what each source does not prove</h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
            Tiny Steps separates observable teaching evidence, progress methodology, academic ownership, programme architecture, and first-party parent experience. No single source is treated as proof that every child will achieve the same outcome.
          </p>

          <div className="mt-5 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {SPEAKING_EVIDENCE_SURFACES.map((item) => (
              <details
                key={item.id}
                data-speaking-evidence-kind={item.kind}
                className="group rounded-[16px] border border-slate-200 bg-white"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{item.sourceLabel}</p>
                    <h3 className="mt-1 text-sm font-semibold text-slate-950">{item.title}</h3>
                  </div>
                  <span aria-hidden="true" className="text-lg text-slate-400 transition group-open:rotate-45">+</span>
                </summary>
                <div className="border-t border-slate-100 px-4 pb-4 pt-3">
                  <p className="text-xs leading-5 text-slate-600">{item.summary}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-500"><strong className="text-slate-700">Does not prove:</strong> {item.doesNotProve[0]}.</p>
                  <Link to={item.path} className="mt-3 inline-block text-xs font-semibold text-slate-900 underline underline-offset-2">Open evidence source</Link>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="px-4 py-7 sm:px-5 md:py-9 lg:px-6">
        <div className="mx-auto max-w-6xl py-2">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">Frequently asked questions</h2>
          <ProgrammeFaqAccordion items={faqItems} accent="violet" />
        </div>
      </section>

      <section className="px-4 pb-9 pt-6 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#f5f3ff_0%,#ffffff_52%,#fff7ed_100%)] p-6 text-center sm:p-8 md:p-9">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950 md:text-3xl">Ready to check the right speaking path for your child?</h2>
          <p className="mx-auto mt-3 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
            Start with the free {demoMinutes}-minute 1:1 assessment. If Speaking is the right fit, standard live 1:1 classes are {PUBLIC_SESSION_DURATION_LABEL} at {speakingClassPriceLabel}; if another pathway fits better, the assessment should identify that before enrolment.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/book-demo" className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-slate-950 px-7 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              Book Free Assessment
            </Link>
            <Link to="/class-samples" className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-slate-300 bg-white px-7 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">
              Watch a Real Class
            </Link>
          </div>
        </div>
      </section>

      <ClusterSeoNav cluster="speaking" />
    </div>
  );
}
