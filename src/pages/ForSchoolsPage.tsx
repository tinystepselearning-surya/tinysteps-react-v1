import React from 'react';
import { Link } from 'react-router-dom';
import Meta from '../components/common/Meta';
import {
  CourseCTAGroup,
  FinalLeadCTA,
  LeadCard,
  LeadHero,
  LeadPageShell,
  LeadSection,
  LeadSectionHeading,
} from '../components/marketing/LeadPageSections';
import { buildPublicWhatsAppUrl, PUBLIC_CONTACT_EMAIL } from '../constants/publicContact';
import { trackCoursePageCtaClick } from '../lib/conversionTracking';
import { ORGANIZATION_ID, PUBLIC_FACTS } from '../lib/schemas';

const canonicalUrl = 'https://tinystepslearning.com/for-schools';
const ncfUrl = 'https://ncert.nic.in/pdf/NCF_for_Foundational_Stage_20_October_2022.pdf';
const cbseHpcUrl = 'https://cbseacademic.nic.in/hpc-resources.html';
const dfePhonicsUrl =
  'https://www.gov.uk/government/publications/phonics-teaching-materials-core-criteria-and-self-assessment/validation-of-systematic-synthetic-phonics-programmes-supporting-documentation';

const generalSchoolProposalUrl = buildPublicWhatsAppUrl(
  'Hello Tiny Steps, I would like to request a school phonics partnership proposal.',
);
const pilotProposalUrl = buildPublicWhatsAppUrl(
  'Hello Tiny Steps, I would like to request a phonics pilot proposal for our school.',
);

const pageTitle = 'Systematic Phonics Program for CBSE & Schools in India | Tiny Steps';
const pageDescription =
  'Turn CBSE/NCF foundational-literacy expectations into systematic phonics teaching with a sequenced curriculum, blending, decoding, spelling patterns, teacher training, assessment, and year-long implementation support.';

const implementationPathway = [
  {
    step: '01',
    title: 'Hear the sound system',
    detail: 'Build phonological and phonemic awareness through rhyme, syllables, oral blending, segmenting, and sound-position work.',
    tone: 'from-orange-50 to-amber-50 border-orange-200',
    badge: 'bg-orange-500 text-white',
  },
  {
    step: '02',
    title: 'Connect sounds to print',
    detail: 'Establish accurate letter–sound and grapheme–phoneme relationships with clear modelling and cumulative recall.',
    tone: 'from-sky-50 to-cyan-50 border-sky-200',
    badge: 'bg-sky-500 text-white',
  },
  {
    step: '03',
    title: 'Blend into real words',
    detail: 'Move from oral blending to printed CVC words and increasingly complex sound–spelling combinations.',
    tone: 'from-violet-50 to-indigo-50 border-violet-200',
    badge: 'bg-violet-500 text-white',
  },
  {
    step: '04',
    title: 'Segment for spelling',
    detail: 'Teach children to hear the phonemes in spoken words and map them back to letters and spelling patterns.',
    tone: 'from-emerald-50 to-teal-50 border-emerald-200',
    badge: 'bg-emerald-500 text-white',
  },
  {
    step: '05',
    title: 'Master core phonics patterns',
    detail: 'Progress through digraphs, consonant patterns, long-vowel patterns, vowel teams, r-controlled patterns, and high-utility conventions.',
    tone: 'from-rose-50 to-pink-50 border-rose-200',
    badge: 'bg-rose-500 text-white',
  },
  {
    step: '06',
    title: 'Build spelling-rule knowledge',
    detail: 'Connect decoding with encoding so children understand why many English words are read and spelled the way they are.',
    tone: 'from-amber-50 to-yellow-50 border-amber-200',
    badge: 'bg-amber-500 text-slate-950',
  },
  {
    step: '07',
    title: 'Tackle advanced word structures',
    detail: 'Extend into syllables, multisyllabic words, advanced vowel patterns, silent-letter patterns, schwa, and word analysis.',
    tone: 'from-indigo-50 to-blue-50 border-indigo-200',
    badge: 'bg-indigo-600 text-white',
  },
  {
    step: '08',
    title: 'Read cumulatively',
    detail: 'Apply only-known and newly taught patterns in words, sentences, passages, dictation, and connected reading.',
    tone: 'from-teal-50 to-emerald-50 border-teal-200',
    badge: 'bg-teal-600 text-white',
  },
  {
    step: '09',
    title: 'Check transfer, not memory',
    detail: 'Assess whether children can decode unfamiliar words, segment for spelling, read connected text, and explain or apply patterns independently.',
    tone: 'from-fuchsia-50 to-violet-50 border-fuchsia-200',
    badge: 'bg-fuchsia-600 text-white',
  },
  {
    step: '10',
    title: 'Build fluent, independent readers',
    detail: 'Use secure decoding and spelling foundations to strengthen accuracy, fluency, comprehension, writing, and reading confidence.',
    tone: 'from-slate-50 to-sky-50 border-slate-200',
    badge: 'bg-slate-950 text-white',
  },
];

const schoolNeedsVsTinySteps = [
  {
    need: 'NCF/CBSE expectation',
    whatItMeans: 'Children should develop phonological awareness, blending, segmenting, decoding, reading fluency, and literacy capability.',
    tinySteps: 'A protected, grade-wise phonics scope and sequence that converts broad expectations into teachable daily steps.',
  },
  {
    need: 'Letter combinations in English',
    whatItMeans: 'NCF explicitly notes that English phonics involves attention to specific letter combinations that represent sounds.',
    tinySteps: 'A cumulative progression across major phonics and spelling patterns rather than alphabet-only or isolated-rule teaching.',
  },
  {
    need: 'Explicit decoding instruction',
    whatItMeans: 'NCF calls for explicit letter–sound instruction, word decoding, spelling, segmenting, and blending.',
    tinySteps: 'Teacher scripts, modelling routines, guided practice, correction methods, review cycles, and classroom-ready resources.',
  },
  {
    need: 'Visible learning outcomes',
    whatItMeans: 'A framework describes competencies and learning outcomes, but schools still need implementation choices and sequencing.',
    tinySteps: 'Baseline checks, checkpoints, reteaching decisions, classroom coaching, and leadership reviews across the academic year.',
  },
];

const partnershipDeliverables = [
  {
    number: '01',
    title: 'Foundation-to-advanced phonics progression',
    detail: 'A systematic, cumulative pathway covering phonological awareness, grapheme–phoneme relationships, blending, segmenting, decoding, spelling patterns, fluency, and early writing.',
  },
  {
    number: '02',
    title: 'Classroom-ready digital and print content',
    detail: 'Teacher-led lesson decks, interactive practice, word work, handwriting, reading, spelling, revision cycles, worksheets, and quick checks.',
  },
  {
    number: '03',
    title: 'Live teacher capability building',
    detail: 'Progressive teacher training and rehearsal labs led by Tiny Steps trainers, with practical modelling, correction routines, and delivery practice.',
  },
  {
    number: '04',
    title: 'Assessment and reteaching guidance',
    detail: 'Baseline, checkpoint, and end-of-cycle guidance across sound knowledge, blending, segmenting, decoding, spelling, and fluency.',
  },
  {
    number: '05',
    title: 'Dedicated learning partner',
    detail: 'One Tiny Steps partner coordinates teacher readiness, delivery check-ins, content clarifications, school-recorded progress reviews, and leadership updates.',
  },
  {
    number: '06',
    title: 'Leadership and parent communication',
    detail: 'Implementation plans, progress-review templates, parent orientation guidance, and clearer language for explaining visible reading development.',
  },
];

const internationalBenchmarks = [
  'A clearly defined, incremental progression',
  'Simple-to-complex phonics knowledge taught cumulatively',
  'Blending through the whole printed word',
  'Segmenting as the reverse process for spelling',
  'Practice in words, sentences, reading, and dictation',
  'Frequent assessment and extra support for children falling behind',
  'High-quality training for the people delivering phonics',
];

const schoolImplementationValue = [
  {
    title: 'Parent communication',
    detail: 'Shared learning goals help schools explain what children are practising, what is secure, and what needs reinforcement.',
  },
  {
    title: 'Implementation consistency',
    detail: 'A common sequence, lesson resources, correction routines, and review points help classrooms use the same teaching model.',
  },
  {
    title: 'Teacher readiness',
    detail: 'Training, rehearsal, guidance, and follow-up support prepare teachers to apply the agreed routines and progression.',
  },
  {
    title: 'Leadership visibility',
    detail: 'Baseline checks, checkpoints, and implementation reviews show leaders what is being taught and where support is needed.',
  },
];

const pricingPlans = [
  {
    name: 'Focused Launch Licence',
    price: '₹59,000',
    qualifier: '+ GST • one campus • one academic year',
    description: 'Start with one school stage or one selected phonics pathway.',
    whatsAppMessage:
      'Hello Tiny Steps, I am interested in the Focused Launch Licence for our school. Please share the proposal and next steps.',
    items: [
      'One selected phonics pathway',
      'Up to 5 teachers and 150 learners',
      'Progressive teacher training and rehearsal labs led by Tiny Steps trainers',
      'Classroom content and print licence',
      'Dedicated learning partner and monthly office hour',
      'Year-long quarterly progress reviews with school leadership',
    ],
  },
  {
    name: 'Whole-School Partnership',
    price: '₹1.49 lakh',
    qualifier: '+ GST • one campus • one academic year',
    description: 'Build one consistent phonics approach across Early Years, Pre-Primary, and Lower Primary.',
    whatsAppMessage:
      'Hello Tiny Steps, I am interested in the Whole-School Partnership for our school. Please share the proposal and next steps.',
    featured: true,
    items: [
      'Complete foundation-to-advanced pathway',
      'Up to 12 teachers and 400 learners',
      'Progressive teacher training and rehearsal labs led by Tiny Steps trainers',
      'All teaching, practice, and assessment resources',
      'Dedicated learning partner and monthly coaching',
      'Year-long quarterly progress reviews with school leadership',
    ],
  },
  {
    name: 'Multi-Campus Partnership',
    price: '₹2.99 lakh',
    qualifier: '+ GST • up to 3 campuses • one academic year',
    description: 'Coordinate training and implementation across an agreed school network.',
    whatsAppMessage:
      'Hello Tiny Steps, I am interested in the Multi-Campus Partnership. Please share the proposal and next steps.',
    items: [
      'Scope for up to 3 campuses',
      'Up to 25 teachers and 900 learners',
      'Progressive teacher training and rehearsal labs led by Tiny Steps trainers',
      'Central coordinator enablement with a shared rollout and reporting framework',
      'Dedicated learning partner and campus reviews',
      'Year-long quarterly progress reviews with school leadership',
    ],
  },
];

const authorityArticles = [
  {
    title: 'Does CBSE Include Phonics? What NCF Actually Says',
    to: '/blog/does-cbse-include-phonics-ncf-foundational-literacy',
    detail: 'A source-led explanation of phonological awareness, decoding, blending, segmenting, and English letter combinations in NCF-FS.',
  },
  {
    title: 'CBSE Phonics Curriculum vs a Systematic Phonics Programme',
    to: '/blog/cbse-phonics-curriculum-vs-systematic-phonics-programme',
    detail: 'Why learning outcomes and a complete instructional scope-and-sequence are related—but not the same thing.',
  },
  {
    title: 'Phonics Scope and Sequence for CBSE Schools',
    to: '/blog/phonics-scope-and-sequence-for-cbse-schools',
    detail: 'A school-leadership guide to the progression children need from sound awareness to independent decoding.',
  },
  {
    title: 'International Phonics Benchmarks for Indian Schools',
    to: '/blog/international-phonics-benchmarks-for-indian-schools',
    detail: 'What complete systematic phonics frameworks internationally expect from sequencing, practice, assessment, and training.',
  },
];

const faqItems = [
  {
    question: 'Does CBSE include phonics in the foundational curriculum?',
    answer:
      'Yes. NCERT’s National Curriculum Framework for the Foundational Stage includes phonological awareness, blending, segmenting, decoding, letter–sound relationships, reading fluency, and explicit attention to letter combinations in English. Tiny Steps therefore does not position phonics as absent from CBSE; we focus on the implementation pathway schools need to teach these competencies systematically.',
  },
  {
    question: 'What does NCF say about blending and decoding?',
    answer:
      'NCF-FS defines decoding as sounding out written words by connecting symbols with sounds, including individual letters and letter combinations, and blending those sounds to read the whole word. It also calls for explicit decoding and spelling instruction using segmenting and blending.',
  },
  {
    question: 'Does CBSE prescribe every phonics rule and the exact order teachers should teach them?',
    answer:
      'The foundational framework sets competencies, principles, and illustrative learning outcomes, but it is not an exhaustive lesson-by-lesson phonics programme listing every English grapheme, spelling pattern, rule, practice routine, and assessment checkpoint in a single mandated sequence. Schools therefore still need to make detailed implementation and sequencing choices.',
  },
  {
    question: 'If CBSE already includes phonics, why would a CBSE school need Tiny Steps?',
    answer:
      'Because defining the desired learning outcome is different from having a complete delivery system. Tiny Steps supplies a protected phonics scope and sequence, classroom methodology, teacher training, digital and print resources, assessments, reteaching guidance, and year-long implementation support.',
  },
  {
    question: 'Why are alphabet sounds alone not enough to teach children to read?',
    answer:
      'Knowing individual letter sounds is an important foundation, but reading also requires children to blend sounds through words, recognise increasingly complex letter combinations, decode unfamiliar words, segment words for spelling, and apply the same knowledge in connected text.',
  },
  {
    question: 'What is the difference between memorising a word and decoding a word?',
    answer:
      'Memorisation helps a child recognise a word they have encountered before. Decoding helps the child use sound–spelling relationships to work through an unfamiliar printed word. A strong phonics system aims to build transferable decoding skill, not dependence on remembering whole word shapes.',
  },
  {
    question: 'What does systematic phonics mean?',
    answer:
      'Systematic phonics teaches sound–spelling relationships in a planned order so that new learning builds on previously taught knowledge. Children are not exposed to rules randomly; the sequence is designed to move from simpler knowledge to more complex patterns.',
  },
  {
    question: 'What does cumulative phonics instruction mean?',
    answer:
      'Cumulative instruction keeps previously taught sounds and patterns active while new concepts are introduced. Children repeatedly retrieve, combine, read, spell, and apply earlier knowledge instead of treating every new rule as an isolated lesson.',
  },
  {
    question: 'Does Tiny Steps replace the school’s CBSE or English curriculum?',
    answer:
      'No. Tiny Steps sits alongside the existing English curriculum as a structured phonics and foundational-reading implementation system. The school keeps its board, textbooks, timetable, and teachers; Tiny Steps strengthens the methodology behind early reading and spelling instruction.',
  },
  {
    question: 'Is Tiny Steps an officially CBSE-endorsed or government-approved phonics programme?',
    answer:
      'No. Tiny Steps is an independent education provider. We reference official curriculum expectations and design our programme to complement school curricula, but compatibility does not mean CBSE, NCERT, government, Cambridge, IB, or publisher endorsement.',
  },
  {
    question: 'What does internationally benchmarked mean on this page?',
    answer:
      'It means Tiny Steps compares its design principles with recognised international expectations for complete systematic phonics programmes—such as clearly defined progression, cumulative complexity, blending, segmenting, spelling practice, assessment, and teacher training. It does not mean Tiny Steps has been validated or certified by the UK Department for Education.',
  },
  {
    question: 'What makes the Tiny Steps phonics pathway comprehensive?',
    answer:
      'The pathway moves from phonological awareness and sound–symbol knowledge into blending, segmenting, CVC structures, major letter combinations, spelling conventions, long-vowel and vowel-team patterns, advanced word structures, syllables, fluency, and connected reading and writing. The exact school rollout is matched to baseline needs and available timetable.',
  },
  {
    question: 'How can a school tell whether children are decoding rather than memorising?',
    answer:
      'Ask children to read carefully selected unfamiliar words and apply previously taught sound–spelling patterns. Assessment should also check phoneme awareness, blending, segmenting, spelling, connected-text reading, and transfer—not only recognition of words already practised in class.',
  },
  {
    question: 'Do classroom teachers need specialist phonics training?',
    answer:
      'Yes. Strong English and general teaching experience are valuable, but effective phonics delivery also requires knowledge of phonemes, graphemes, blending, segmenting, decoding, encoding, spelling patterns, error diagnosis, correction routines, and cumulative lesson design.',
  },
  {
    question: 'What teacher training is included?',
    answer:
      'Progressive teacher training and rehearsal labs cover phonemic awareness, sound-to-symbol teaching, blending and segmenting, correction routines, lesson delivery, assessment, and classroom practice. The scope and cadence are confirmed in the school’s written proposal.',
  },
  {
    question: 'How is student progress measured?',
    answer:
      'Schools receive baseline, checkpoint, and end-of-cycle assessment guidance across sound knowledge, blending, segmenting, decoding, spelling, and fluency. Leadership reviews focus on cohort patterns, transfer of learning, and practical next steps rather than marks alone.',
  },
  {
    question: 'How can schools communicate reading progress clearly to families?',
    answer:
      'Schools can make phonics progress easier for families to understand by reporting the skills being practised, what is becoming secure, what needs reinforcement, and the next teaching focus. Baseline checks, checkpoints, and consistent teacher language make those conversations concrete without promising enrolment or reputation outcomes.',
  },
  {
    question: 'How much does the school phonics partnership cost?',
    answer:
      'Annual school partnership pricing starts at ₹59,000 plus GST per campus for a focused launch licence. The complete whole-school partnership is ₹1.49 lakh plus GST per campus. The multi-campus partnership is ₹2.99 lakh plus GST for the base scope of up to three campuses.',
  },
  {
    question: 'Can we test the approach before an annual partnership?',
    answer:
      'Yes. An eight-week school pilot is available at ₹24,900 plus GST for one selected grade, up to four teachers, and up to 60 learners. If the school upgrades within 30 days of the pilot review, the pilot fee is credited toward the annual partnership.',
  },
  {
    question: 'Can international schools outside India partner with Tiny Steps?',
    answer:
      'Yes. Training and support can be delivered online across time zones. International proposals are quoted after the timetable, teacher count, campus scope, and implementation needs are confirmed.',
  },
];

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
    { '@type': 'ListItem', position: 2, name: 'Systematic Phonics Program for Schools', item: canonicalUrl },
  ],
};

const pageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': `${canonicalUrl}#webpage`,
  name: pageTitle,
  description: pageDescription,
  url: canonicalUrl,
  inLanguage: 'en-IN',
  dateModified: '2026-08-29',
  citation: [ncfUrl, cbseHpcUrl, dfePhonicsUrl],
  speakable: {
    '@type': 'SpeakableSpecification',
    cssSelector: ['h1', '.school-answer', '#cbse-phonics-answer'],
  },
  audience: {
    '@type': 'EducationalAudience',
    educationalRole: ['school principal', 'academic coordinator', 'English head', 'school founder'],
  },
  about: [
    { '@type': 'Thing', name: 'Systematic phonics' },
    { '@type': 'Thing', name: 'Foundational literacy' },
    { '@type': 'Thing', name: 'CBSE schools' },
    { '@type': 'Thing', name: 'National Curriculum Framework for Foundational Stage' },
  ],
};

const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': `${canonicalUrl}#service`,
  name: 'Tiny Steps Systematic Phonics Program for Schools',
  serviceType:
    'Systematic phonics curriculum, digital classroom content, teacher training, assessment guidance, dedicated learning partner, and implementation support',
  description: pageDescription,
  provider: {
    '@type': 'EducationalOrganization',
    '@id': ORGANIZATION_ID,
    name: PUBLIC_FACTS.organizationName,
    url: 'https://tinystepslearning.com/',
  },
  areaServed: [{ '@type': 'Country', name: 'India' }, { '@type': 'Place', name: 'Worldwide' }],
  audience: {
    '@type': 'EducationalAudience',
    educationalRole: 'school and early-years education provider',
  },
};

const definedTermsSchema = {
  '@context': 'https://schema.org',
  '@type': 'DefinedTermSet',
  '@id': `${canonicalUrl}#phonics-terms`,
  name: 'Systematic phonics terms for schools',
  hasDefinedTerm: [
    {
      '@type': 'DefinedTerm',
      name: 'Decoding',
      description:
        'Using learned sound–spelling relationships to work through printed words, including unfamiliar words.',
    },
    {
      '@type': 'DefinedTerm',
      name: 'Blending',
      description: 'Combining individual phonemes or sound units to read a whole spoken or printed word.',
    },
    {
      '@type': 'DefinedTerm',
      name: 'Segmenting',
      description: 'Breaking a spoken word into phonemes so the child can map those sounds to spelling choices.',
    },
    {
      '@type': 'DefinedTerm',
      name: 'Systematic phonics',
      description:
        'Teaching sound–spelling relationships in a planned progression that moves from simpler to more complex knowledge.',
    },
    {
      '@type': 'DefinedTerm',
      name: 'Cumulative phonics instruction',
      description:
        'Keeping previously taught phonics knowledge active while new patterns are introduced and applied.',
    },
  ],
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': `${canonicalUrl}#faq`,
  mainEntity: faqItems.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: item.answer },
  })),
};

const ForSchoolsPage: React.FC = () => {
  const trackSchoolCta = (label: string, location: string, destination: string) =>
    trackCoursePageCtaClick({
      page_path: '/for-schools',
      cta_label: label,
      cta_location: location,
      destination_path: destination,
    });

  const primaryCtas = [
    {
      label: 'Request a School Partnership Proposal',
      href: generalSchoolProposalUrl,
      variant: 'primary' as const,
      onClick: () => trackSchoolCta('Request a School Partnership Proposal', 'hero', generalSchoolProposalUrl),
    },
    {
      label: 'Discuss Your School’s Reading Goals',
      href: generalSchoolProposalUrl,
      variant: 'secondary' as const,
      onClick: () => trackSchoolCta('Discuss Your School’s Reading Goals', 'hero', generalSchoolProposalUrl),
    },
  ];

  return (
    <LeadPageShell>
      <Meta
        title={pageTitle}
        description={pageDescription}
        keywords="systematic phonics program for CBSE schools, phonics curriculum for schools India, CBSE phonics curriculum, NCF foundational literacy phonics, phonics teacher training for schools, systematic synthetic phonics India, school phonics scope and sequence, decoding blending segmenting program"
        canonical={canonicalUrl}
        robots="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
        jsonLd={[breadcrumbSchema, pageSchema, serviceSchema, definedTermsSchema, faqSchema]}
      />

      <LeadHero
        alignDesktopTop
        compactTopSpacing
        eyebrow="For CBSE, ICSE, State Board & International Schools • Ages 3–10"
        eyebrowClassName="border-orange-300 bg-gradient-to-r from-orange-50 via-amber-50 to-indigo-50 text-orange-900 shadow-[0_8px_24px_rgba(79,70,229,0.10)]"
        showLeftDecoration={false}
        title={
          <>
            CBSE defines the literacy goal.{' '}
            <span className="bg-gradient-to-r from-orange-600 via-rose-500 to-indigo-600 bg-clip-text text-transparent">
              Tiny Steps builds the implementation pathway.
            </span>
          </>
        }
        description={
          <div className="school-answer space-y-3">
            <p>
              Bring a systematic, cumulative phonics pathway into your existing timetable—complete with teacher
              training, classroom content, blending and decoding routines, spelling progression, assessment, and a
              dedicated learning partner.
            </p>
            <p className="font-semibold text-slate-800">
              Your teachers deliver it. Tiny Steps gives them the sequence, methodology, resources, and year-long
              support behind it.
            </p>
          </div>
        }
        trustChips={[
          { label: 'CBSE/NCF-aware implementation', tone: 'warm' },
          { label: 'Systematic & cumulative', tone: 'cool' },
          { label: 'Foundation → Advanced', tone: 'mint' },
          { label: 'Teacher-led in your school', tone: 'neutral' },
          { label: 'Research-informed', tone: 'neutral' },
        ]}
        supportingText={
          <>
            Designed for principals, founders, academic leaders, English heads, and school networks that want
            transferable decoding ability—not isolated phonics activities.
          </>
        }
        stats={[
          { label: 'Wider Tiny Steps reach', value: '5000+', helper: 'Children across broader English-learning programmes' },
          { label: 'Wider global experience', value: '15+ countries', helper: 'Diverse learner and family contexts' },
          { label: 'Delivery model', value: 'Your teachers', helper: 'Tiny Steps trains, equips, and supports them' },
          { label: 'Implementation', value: 'Full year', helper: 'Not a one-time workshop or resource handover' },
        ]}
        actions={
          <CourseCTAGroup
            items={primaryCtas}
            renderLink={(item, className) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={item.onClick}
                className={`${className} active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900`}
              >
                {item.label}
              </a>
            )}
          />
        }
        aside={
          <LeadCard className="relative overflow-hidden border-white/80 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 p-6 text-white shadow-[0_28px_70px_rgba(15,23,42,0.22)]">
            <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-orange-400/20 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-sky-400/20 blur-2xl" />
            <div className="relative">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">The core difference</p>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
                From “we taught phonics” to “our children can use phonics to read”
              </h2>
              <div className="mt-6 grid gap-3">
                {[
                  ['Curriculum expectation', 'What children should eventually be able to do'],
                  ['Implementation pathway', 'What teachers teach first, next, and how they connect it'],
                  ['Transfer check', 'Can the child decode a word they have never practised before?'],
                ].map(([title, detail], index) => (
                  <div
                    key={title}
                    className={`rounded-2xl border p-4 ${
                      index === 0
                        ? 'border-orange-300/35 bg-orange-300/10'
                        : index === 1
                          ? 'border-sky-300/35 bg-sky-300/10'
                          : 'border-emerald-300/35 bg-emerald-300/10'
                    }`}
                  >
                    <p className="text-sm font-black text-white">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-300">{detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </LeadCard>
        }
      />

      <LeadSection id="cbse-ncf">
        <LeadCard className="overflow-hidden border-indigo-100 bg-gradient-to-br from-white via-orange-50/50 to-indigo-50/70">
          <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-700">CBSE / NCF clarity</p>
              <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 md:text-4xl">
                Does CBSE include phonics? <span className="text-emerald-700">Yes.</span>
                <br />
                The challenge is consistent implementation.
              </h2>
              <div
                id="cbse-phonics-answer"
                className="school-answer mt-6 rounded-3xl border border-orange-200 bg-white/90 p-5 shadow-sm"
              >
                <p className="text-base leading-8 text-slate-800">
                  NCERT’s National Curriculum Framework for the Foundational Stage explicitly includes phonological
                  awareness, blending and segmenting, letter–sound relationships, decoding, and reading fluency. It
                  defines decoding as connecting sounds with individual letters and letter combinations and blending
                  those sounds to read the whole word.
                </p>
                <p className="mt-4 text-base leading-8 text-slate-800">
                  It also says that, in English, phonics instruction means paying attention to specific letter
                  combinations that represent sounds—not simply introducing the alphabet sequentially.
                </p>
              </div>
              <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold">
                <a
                  href={ncfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-slate-950 px-4 py-2 text-white transition hover:bg-slate-800"
                >
                  Read official NCF-FS 2022
                </a>
                <a
                  href={cbseHpcUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-indigo-900 transition hover:bg-indigo-100"
                >
                  CBSE Foundational Stage resources
                </a>
              </div>
              <p className="mt-4 max-w-2xl text-xs leading-5 text-slate-600">
                Tiny Steps Learning is an independent education provider. Referencing NCF, CBSE, or international
                phonics criteria explains the evidence and implementation context; it does not imply endorsement,
                approval, certification or affiliation.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5 text-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">The important distinction</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-orange-300/25 bg-orange-300/10 p-5">
                    <p className="text-sm font-black uppercase tracking-[0.12em] text-orange-200">Framework</p>
                    <p className="mt-2 text-xl font-black text-white">Defines the destination</p>
                    <p className="mt-2 text-sm leading-7 text-slate-300">
                      Competencies, principles, and learning outcomes children should develop.
                    </p>
                  </div>
                  <div className="rounded-3xl border border-sky-300/25 bg-sky-300/10 p-5">
                    <p className="text-sm font-black uppercase tracking-[0.12em] text-sky-200">Implementation system</p>
                    <p className="mt-2 text-xl font-black text-white">Builds the route</p>
                    <p className="mt-2 text-sm leading-7 text-slate-300">
                      Sequence, lessons, modelling, practice, assessment, reteaching, and teacher capability.
                    </p>
                  </div>
                </div>
                <p className="mt-5 border-t border-white/10 pt-5 text-lg font-black leading-8 text-emerald-200">
                  Tiny Steps does not replace CBSE or NCERT. We help schools translate foundational-literacy
                  expectations into consistent classroom practice.
                </p>
              </div>
            </div>
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection id="academic-design">
        <LeadCard className="overflow-hidden border-emerald-100 bg-gradient-to-br from-white via-emerald-50/45 to-sky-50/55">
          <LeadSectionHeading
            eyebrow="How academic design becomes classroom practice"
            title="A protected teaching method, with room to respond to the learner"
            description="The partnership is more than content or worksheets. Curriculum progression, lesson plans, teacher preparation, classroom observation and review work as one implementation system."
          />

          <div className="mt-8 grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Academic design inputs</p>
              <div className="mt-5 space-y-4 text-sm leading-7 text-slate-700">
                <p>
                  Tiny Steps planning draws on child development, learning science, early-literacy pedagogy, language
                  development and recurring learner difficulties identified through teaching and assessment.
                </p>
                <p>
                  Those inputs become prerequisite maps, a structured progression, lesson objectives, examples,
                  modelling, guided practice, correction routines, cumulative review and checkpoints.
                </p>
              </div>
              <div className="mt-6 rounded-2xl bg-slate-950 p-5 text-white">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-300">Shared teaching principle</p>
                <p className="mt-2 text-lg font-black">Model → guided practice → observe → correct → retry → reduce support</p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50/70 p-6">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Structured curriculum. Responsive teaching.</p>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Consistency does not mean forcing every child through the same pace.</h3>
              <p className="mt-4 text-sm leading-7 text-slate-700">
                Teachers retain the agreed learning objective and progression while adjusting modelling, prompts,
                examples, repetition and practice time in response to learner accuracy, independence and recurring errors.
              </p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  'Short, age-appropriate tasks',
                  'Predictable teaching routines',
                  'Guided retries before moving on',
                  'Specific, encouraging feedback',
                  'Prerequisite practice when required',
                  'Support reduced as independence grows',
                ].map((item) => (
                  <li key={item} className="rounded-2xl border border-emerald-200 bg-white/85 p-4 text-sm font-bold leading-6 text-slate-800">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mt-6 text-xs leading-5 text-slate-600">
            These are evidence-informed instructional and implementation principles. They are not clinical psychology,
            learner-type labels, or a guarantee that children progress at a fixed or accelerated rate.
          </p>
        </LeadCard>
      </LeadSection>

      <LeadSection id="implementation-pathway">
        <LeadCard className="overflow-hidden bg-gradient-to-br from-white via-sky-50/35 to-orange-50/50">
          <LeadSectionHeading
            eyebrow="The Tiny Steps implementation pathway"
            title="One connected journey from sound awareness to independent reading"
            description="The sequence is protected. Each stage builds on what children have already learned, and previously taught knowledge keeps returning in new reading and spelling contexts."
          />

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {implementationPathway.map((item, index) => (
              <article
                key={item.step}
                className={`group relative overflow-hidden rounded-3xl border bg-gradient-to-br p-5 transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_45px_rgba(15,23,42,0.12)] ${item.tone}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-black shadow-sm ${item.badge}`}>
                    {item.step}
                  </span>
                  {index < implementationPathway.length - 1 ? (
                    <span aria-hidden="true" className="text-xl font-black text-slate-300">→</span>
                  ) : (
                    <span aria-hidden="true" className="text-xl">★</span>
                  )}
                </div>
                <h3 className="mt-4 text-lg font-black leading-6 text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-700">{item.detail}</p>
              </article>
            ))}
          </div>

          <div className="mt-7 grid gap-4 rounded-[2rem] border border-indigo-200 bg-gradient-to-r from-indigo-950 via-slate-950 to-orange-950 p-6 text-white lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">The transfer question</p>
              <p className="mt-2 text-2xl font-black leading-tight">
                Can the child decode a word they have never seen before?
              </p>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300">
                That question helps distinguish transferable decoding knowledge from simple familiarity with
                practised textbook words or weekly spelling lists.
              </p>
            </div>
            <Link
              to="/blog/how-schools-can-assess-decoding-not-memorisation"
              className="inline-flex h-11 items-center justify-center rounded-full bg-orange-400 px-5 text-sm font-black text-slate-950 transition hover:bg-orange-300"
            >
              See the decoding check
            </Link>
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection id="curriculum-vs-methodology">
        <LeadCard className="overflow-hidden border-slate-950 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
          <LeadSectionHeading
            eyebrow="Curriculum ≠ methodology"
            title="A learning outcome is not yet a classroom system"
            description="Schools can have the right curriculum direction and still experience inconsistent delivery when the teaching sequence, specialist knowledge, practice routines, and assessment process are not protected."
            tone="dark"
          />

          <div className="mt-7 overflow-x-auto rounded-3xl border border-white/10">
            <table className="min-w-[920px] w-full border-collapse text-left text-sm">
              <thead className="bg-white/10 text-white">
                <tr>
                  <th className="px-4 py-4 font-black">What the framework expects</th>
                  <th className="px-4 py-4 font-black">What schools still have to operationalise</th>
                  <th className="bg-orange-400 px-4 py-4 font-black text-slate-950">How Tiny Steps supports implementation</th>
                </tr>
              </thead>
              <tbody>
                {schoolNeedsVsTinySteps.map((row) => (
                  <tr key={row.need} className="border-t border-white/10 align-top">
                    <td className="px-4 py-4">
                      <p className="font-black text-orange-200">{row.need}</p>
                      <p className="mt-2 leading-7 text-slate-300">{row.whatItMeans}</p>
                    </td>
                    <td className="px-4 py-4 leading-7 text-slate-200">
                      Decide the scope, progression, classroom routines, teacher preparation, practice density,
                      correction method, and evidence of mastery.
                    </td>
                    <td className="bg-orange-300/10 px-4 py-4 leading-7 text-orange-50">{row.tinySteps}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="school-answer mt-6 rounded-3xl border border-emerald-300/25 bg-emerald-300/10 p-5">
            <p className="text-xl font-black text-emerald-100">
              The problem we solve is the implementation gap—not the existence of the curriculum.
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-200">
              When phonics is reduced to alphabet sounds, isolated rules, familiar word lists, mixed worksheets, or
              one-off workshops, children can appear successful while still depending heavily on memory. A
              systematic pathway aims for independent transfer.
            </p>
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection id="what-schools-receive">
        <LeadCard className="overflow-hidden bg-gradient-to-br from-white via-orange-50/45 to-sky-50/60">
          <LeadSectionHeading
            eyebrow="What your school receives"
            title="More than content: a complete implementation system"
            description="Curriculum, teacher capability, classroom routines, assessment, and ongoing help work together so the school’s own teachers can deliver phonics consistently."
          />
          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {partnershipDeliverables.map((item, index) => (
              <article
                key={item.number}
                className={`rounded-3xl border p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)] ${
                  index % 3 === 0
                    ? 'border-orange-200 bg-orange-50/70'
                    : index % 3 === 1
                      ? 'border-sky-200 bg-sky-50/70'
                      : 'border-violet-200 bg-violet-50/70'
                }`}
              >
                <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{item.number}</span>
                <h3 className="mt-3 text-lg font-black text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-700">{item.detail}</p>
              </article>
            ))}
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection id="international-benchmark">
        <LeadCard className="overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-orange-50">
          <div className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-700">International benchmark</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                Research-informed. Internationally benchmarked principles. Built for school implementation.
              </h2>
              <p className="school-answer mt-5 text-base leading-8 text-slate-700">
                England’s Department for Education criteria for complete systematic synthetic phonics programmes
                provide a useful external benchmark: a clearly defined incremental sequence, progression from simple
                to more complex phonics knowledge, blending, segmenting, spelling practice, ongoing assessment, and
                high-quality teacher training.
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Tiny Steps uses these kinds of recognised principles as a benchmark for programme quality. We do not
                claim UK DfE validation, certification, or endorsement.
              </p>
              <a
                href={dfePhonicsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex rounded-full bg-indigo-700 px-4 py-2 text-sm font-black text-white transition hover:bg-indigo-600"
              >
                Review the DfE criteria
              </a>
            </div>

            <div className="rounded-[2rem] border border-indigo-200 bg-white p-5 shadow-[0_20px_50px_rgba(79,70,229,0.10)] md:p-6">
              <p className="text-sm font-black text-slate-950">A complete systematic programme should make these visible:</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {internationalBenchmarks.map((item, index) => (
                  <div
                    key={item}
                    className={`flex gap-3 rounded-2xl border p-4 ${
                      index % 2 === 0 ? 'border-orange-200 bg-orange-50' : 'border-indigo-200 bg-indigo-50'
                    }`}
                  >
                    <span className="font-black text-emerald-600" aria-hidden="true">✓</span>
                    <span className="text-sm font-semibold leading-6 text-slate-800">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection id="business-case">
        <LeadCard className="relative overflow-hidden border-orange-200/80 bg-gradient-to-br from-white via-orange-50/70 to-violet-50/60 p-0">
          <div className="relative grid gap-8 p-6 md:p-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-10 lg:p-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-700">Implementation visibility</p>
              <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 md:text-4xl">
                Make phonics progress easier for families and leaders to understand
              </h2>
              <div className="school-answer mt-5 space-y-4 text-sm leading-7 text-slate-700 md:text-base">
                <p>
                  In Early Years, Pre-Primary and Lower Primary, families often need clear language for understanding
                  what children are practising in reading, blending, spelling and writing. Skill-specific reporting can
                  make classroom learning easier to discuss than a broad score alone.
                </p>
                <p>
                  A shared implementation sequence, baseline checks, checkpoints and consistent teacher language give
                  schools a clearer way to explain what is secure, what needs reinforcement and what comes next.
                </p>
              </div>
              <div className="mt-6 rounded-3xl border border-orange-200 bg-white/85 p-5 text-lg font-bold leading-8 text-slate-950 shadow-[0_16px_36px_rgba(249,115,22,0.12)]">
                Strong early literacy is an academic priority. Clear evidence and communication help families and
                school leaders understand the work being done.
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/90 bg-slate-950 p-5 text-white shadow-[0_24px_54px_rgba(15,23,42,0.2)] md:p-6">
              <h3 className="text-xl font-black tracking-tight text-white">How structured implementation supports school leadership</h3>
              <ul className="mt-5 space-y-3">
                {schoolImplementationValue.map((outcome, index) => (
                  <li
                    key={outcome.title}
                    className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5 text-sm leading-6 text-slate-100"
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-300 to-rose-300 text-xs font-black text-slate-950"
                    >
                      {index + 1}
                    </span>
                    <span>
                      <strong className="block text-white">{outcome.title}</strong>
                      <span className="mt-0.5 block text-slate-300">{outcome.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection id="authority-library">
        <LeadCard className="overflow-hidden bg-gradient-to-br from-white via-sky-50/35 to-violet-50/40">
          <LeadSectionHeading
            eyebrow="Evidence & school leadership library"
            title="Go deeper on CBSE, NCF, systematic phonics, and implementation"
            description="These guides answer the questions academic heads, principals, teachers, and AI/search systems are most likely to ask about the foundational-literacy implementation gap."
          />
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {authorityArticles.map((article, index) => (
              <Link
                key={article.to}
                to={article.to}
                className={`group rounded-3xl border p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)] ${
                  index % 2 === 0 ? 'border-orange-200 bg-orange-50/65' : 'border-indigo-200 bg-indigo-50/65'
                }`}
              >
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Research guide</p>
                <h3 className="mt-3 text-lg font-black text-slate-950 group-hover:text-indigo-700">{article.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-700">{article.detail}</p>
                <span className="mt-4 inline-flex text-sm font-black text-indigo-700">Read guide →</span>
              </Link>
            ))}
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection id="pricing">
        <LeadCard className="bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
          <LeadSectionHeading
            eyebrow="School partnership pricing"
            title="Clear annual options for every stage of rollout"
            description="Choose a focused launch, a complete whole-school pathway, or a coordinated multi-campus rollout. Every annual option includes the agreed licence, teacher enablement, implementation reviews, and a dedicated learning partner."
            tone="dark"
          />

          <div className="mt-7 grid gap-5 xl:grid-cols-3">
            {pricingPlans.map((plan) => (
              <article
                key={plan.name}
                className={`flex rounded-3xl border p-5 transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_54px_rgba(0,0,0,0.24)] ${
                  plan.featured
                    ? 'border-orange-300 bg-gradient-to-br from-white to-orange-50 text-slate-950 shadow-[0_20px_50px_rgba(251,146,60,0.2)]'
                    : 'border-white/15 bg-white/5 text-white'
                }`}
              >
                <div className="flex w-full flex-col">
                  {plan.featured ? (
                    <span className="self-start rounded-full bg-orange-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-orange-800">
                      Best for full rollout
                    </span>
                  ) : null}
                  <h3 className="mt-4 text-xl font-bold">{plan.name}</h3>
                  <p className={`mt-2 text-sm leading-6 ${plan.featured ? 'text-slate-600' : 'text-slate-300'}`}>
                    {plan.description}
                  </p>
                  <p className="mt-5 text-3xl font-black tracking-tight">{plan.price}</p>
                  <p className={`mt-1 text-xs font-semibold ${plan.featured ? 'text-slate-500' : 'text-slate-400'}`}>
                    {plan.qualifier}
                  </p>
                  <div className={`my-5 h-px ${plan.featured ? 'bg-orange-200' : 'bg-white/10'}`} />
                  <ul className={`space-y-2.5 text-sm ${plan.featured ? 'text-slate-700' : 'text-slate-200'}`}>
                    {plan.items.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className={plan.featured ? 'text-orange-600' : 'text-orange-300'} aria-hidden="true">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href={buildPublicWhatsAppUrl(plan.whatsAppMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      trackSchoolCta(
                        `Request ${plan.name}`,
                        'pricing',
                        buildPublicWhatsAppUrl(plan.whatsAppMessage),
                      )
                    }
                    className={`mt-6 inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-bold transition active:translate-y-px ${
                      plan.featured
                        ? 'bg-slate-950 text-white hover:bg-slate-800'
                        : 'border border-white/20 bg-white/10 text-white hover:bg-white/15'
                    }`}
                  >
                    Request this plan
                  </a>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-6 grid gap-4 rounded-3xl border border-orange-300/30 bg-gradient-to-r from-orange-400/15 to-rose-400/10 p-5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-sm font-bold text-orange-200">Prefer to validate the model first?</p>
              <p className="mt-1 text-sm leading-6 text-slate-200">
                Eight-week pilot • one selected grade • up to four teachers • up to 60 learners • ₹24,900 + GST.
                Confirm an annual partnership within 30 days of the review and the pilot fee is credited in full.
              </p>
            </div>
            <a
              href={pilotProposalUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackSchoolCta('Request pilot proposal', 'pricing', pilotProposalUrl)}
              className="inline-flex h-11 items-center justify-center rounded-full bg-orange-400 px-5 text-sm font-bold text-slate-950 transition hover:bg-orange-300"
            >
              Request pilot proposal
            </a>
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection id="sources">
        <LeadCard className="overflow-hidden border-slate-200 bg-slate-50">
          <LeadSectionHeading
            eyebrow="Primary sources"
            title="Curriculum and benchmark references used on this page"
            description="We separate official curriculum statements from Tiny Steps programme design claims so school leaders can verify the underlying evidence."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <a
              href={ncfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-3xl border border-orange-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-md"
            >
              <p className="text-xs font-black uppercase tracking-[0.15em] text-orange-700">NCERT</p>
              <h3 className="mt-2 font-black text-slate-950">National Curriculum Framework for Foundational Stage 2022</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">See language/literacy competencies and decoding instruction, including pages 62, 114, and 115 in the PDF edition.</p>
            </a>
            <a
              href={cbseHpcUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-3xl border border-sky-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-md"
            >
              <p className="text-xs font-black uppercase tracking-[0.15em] text-sky-700">CBSE</p>
              <h3 className="mt-2 font-black text-slate-950">Foundational Stage & Holistic Progress Card resources</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">CBSE’s current resource hub links schools to NCFFS 2022 and Foundational Stage implementation material.</p>
            </a>
            <a
              href={dfePhonicsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-3xl border border-indigo-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-md"
            >
              <p className="text-xs font-black uppercase tracking-[0.15em] text-indigo-700">International benchmark</p>
              <h3 className="mt-2 font-black text-slate-950">UK DfE systematic synthetic phonics criteria</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">Used only as an external benchmark for programme completeness; Tiny Steps does not claim DfE validation.</p>
            </a>
          </div>
          <p className="mt-5 text-xs leading-6 text-slate-500">Curriculum references reviewed: 10 August 2026.</p>
        </LeadCard>
      </LeadSection>

      <LeadSection id="faq">
        <LeadCard className="bg-gradient-to-br from-white via-sky-50/35 to-violet-50/35">
          <LeadSectionHeading
            eyebrow="School partnership FAQs"
            title="Direct answers for principals, academic teams, search engines, and AI assistants"
            description="Each answer starts with the conclusion and then adds the implementation context school leaders need."
          />
          <div className="school-answer mt-6 grid gap-3 lg:grid-cols-2">
            {faqItems.map((item, index) => (
              <details
                key={item.question}
                className={`group rounded-2xl border bg-white/90 p-4 transition duration-300 open:shadow-[0_16px_36px_rgba(15,23,42,0.1)] ${
                  index % 4 === 0
                    ? 'border-orange-200'
                    : index % 4 === 1
                      ? 'border-sky-200'
                      : index % 4 === 2
                        ? 'border-emerald-200'
                        : 'border-violet-200'
                }`}
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 rounded-lg font-bold text-slate-950 marker:content-none">
                  <span>{item.question}</span>
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-600 transition group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <div className="mt-3 border-t border-slate-100 pt-3 text-sm leading-7 text-slate-700">{item.answer}</div>
              </details>
            ))}
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection className="pb-4">
        <FinalLeadCTA
          title="Build the implementation pathway inside your own school"
          description={
            <>
              Tell us your board, grades, teacher count, learner count, current phonics approach, and preferred launch
              month. We will recommend the most practical pilot or annual partnership and send a written proposal.
              Email <span className="font-semibold text-white">{PUBLIC_CONTACT_EMAIL}</span> or speak with the partnership team.
            </>
          }
          statement={
            <>
              <p className="text-base font-bold leading-7 text-white">
                Curriculum direction matters. Consistent implementation is what children experience every day.
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-200">
                Tiny Steps brings the scope, sequence, teacher capability, practice system, assessment, and continued
                academic support together so schools can build stronger early readers with their own teachers.
              </p>
              <p className="mt-4 border-t border-white/10 pt-4 text-sm font-semibold text-orange-200">
                CBSE defines foundational-literacy outcomes. Tiny Steps builds the implementation pathway.
              </p>
            </>
          }
          actions={
            <CourseCTAGroup
              items={[
                ...primaryCtas.map((item) => ({
                  ...item,
                  onClick: () => trackSchoolCta(item.label, 'final cta', generalSchoolProposalUrl),
                })),
                {
                  label: 'Explore Our Phonics Expertise',
                  to: '/phonics',
                  variant: 'ghost' as const,
                  onClick: () => trackSchoolCta('Explore Our Phonics Expertise', 'final cta', '/phonics'),
                },
              ]}
              renderLink={(item, className) =>
                item.to ? (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={item.onClick}
                    className={`${className} !border-white/30 !bg-transparent !text-white hover:!bg-white/10`}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={item.onClick}
                    className={`${className} ${
                      item.variant === 'primary'
                        ? '!bg-orange-400 !text-slate-950 hover:!bg-orange-300'
                        : item.variant === 'secondary'
                          ? '!border-emerald-300 !bg-emerald-50 !text-emerald-900 hover:!bg-emerald-100'
                          : ''
                    }`}
                  >
                    {item.label}
                  </a>
                )
              }
            />
          }
        />
      </LeadSection>
    </LeadPageShell>
  );
};

export default ForSchoolsPage;
