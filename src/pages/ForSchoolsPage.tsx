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

const canonicalUrl = 'https://tinystepslearning.com/for-schools';
const generalSchoolProposalUrl = buildPublicWhatsAppUrl(
  'Hello Tiny Steps, I would like to request a school phonics partnership proposal.',
);
const pilotProposalUrl = buildPublicWhatsAppUrl(
  'Hello Tiny Steps, I would like to request a phonics pilot proposal for our school.',
);

const pageTitle = 'Phonics Program for Schools in India | Tiny Steps';
const pageDescription =
  'Research-aligned phonics curriculum, digital classroom content, teacher training, a dedicated learning partner, and year-long implementation support for schools in India.';

const faqItems = [
  {
    question: 'What is the Tiny Steps phonics programme for schools?',
    answer:
      'It is an annual, campus-based partnership that gives a school a structured phonics scope and sequence, classroom-ready teaching content, printable practice, assessment tools, live teacher training, and a dedicated learning partner who supports implementation throughout the academic year.',
  },
  {
    question: 'Who teaches the children: Tiny Steps or our school teachers?',
    answer:
      'Your existing teachers teach the children. Tiny Steps trains and equips them, while a dedicated learning partner coordinates implementation check-ins, classroom guidance, progress reviews, and leadership updates across the academic year.',
  },
  {
    question: 'Which ages and stages does the programme support?',
    answer:
      'The pathway is designed for Early Years, Pre-Primary and Lower Primary learners aged 3–10, from early sound awareness and letter-sound knowledge through blending, spelling patterns, reading fluency, and early writing. The exact starting stage is selected after a school discovery and baseline review.',
  },
  {
    question: 'Does the programme replace our English curriculum?',
    answer:
      'No. It can sit inside the existing English timetable as the school’s structured phonics and foundational reading strand. We map the implementation to the school calendar, grade expectations, and available teaching periods.',
  },
  {
    question: 'Is the programme suitable for State Board, CBSE, ICSE, Cambridge, or IB schools?',
    answer:
      'Yes. The phonics progression is board-agnostic and can complement CBSE, ICSE, Cambridge, IB, and other international curricula. Tiny Steps does not claim affiliation with or endorsement by these boards.',
  },
  {
    question: 'Why do some children struggle to read and spell even after years of English classes?',
    answer:
      'Knowing letter names, memorising weekly spellings, or completing mixed worksheets is not the same as learning how the English alphabetic code works. Children need an explicit sequence, accurate sound teaching, regular blending and segmenting, cumulative review, guided reading and spelling practice, and prompt correction when misconceptions appear.',
  },
  {
    question: 'Do classroom teachers need specialist phonics training?',
    answer:
      'Yes. Fluent English and general teaching experience are valuable, but effective phonics delivery also requires specialised knowledge of phonemes, graphemes, blending, segmenting, decoding, encoding, spelling patterns, error diagnosis, and cumulative lesson design. Tiny Steps develops this capability through training, rehearsal, observation, and coaching.',
  },
  {
    question: 'What makes the Tiny Steps pedagogy research-aligned?',
    answer:
      'The pathway uses systematic and cumulative instruction, explicit modelling, phonemic awareness linked to print, regular decoding and encoding practice, connected reading and writing, progress checks, and assessment-informed reteaching. Tiny Steps describes the curriculum as research-aligned; it does not claim that the proprietary programme has independently proven outcomes.',
  },
  {
    question: 'How are digital games and activities used?',
    answer:
      'Teacher-led digital lesson content introduces and models each skill. Listening games, letter-sound matching, tracing, blending, word building, spelling challenges, picture sorts, and quick-response activities then provide purposeful practice. Games reinforce explicit teaching; they do not replace teacher explanation, correction, reading, or writing.',
  },
  {
    question: 'What teacher training is included?',
    answer:
      'Progressive teacher training and rehearsal labs cover phonemic awareness, sound-to-symbol teaching, blending and segmenting, correction routines, lesson delivery, assessment, and classroom practice. The scope and cadence are confirmed in the school’s written proposal.',
  },
  {
    question: 'What does the dedicated learning partner do?',
    answer:
      'The learning partner coordinates onboarding, teacher preparation, delivery check-ins, content clarifications, observation feedback, school-recorded progress reviews, and leadership updates. Their role is to help the agreed rollout stay on track throughout the academic year—not to replace the school’s teachers.',
  },
  {
    question: 'How is student progress measured?',
    answer:
      'Schools receive baseline, checkpoint, and end-of-cycle assessment guidance across sound knowledge, blending, segmenting, decoding, spelling, and fluency. Leadership reviews focus on cohort patterns and practical next steps rather than marks alone.',
  },
  {
    question: 'How can visible reading progress support enrolment and reputation?',
    answer:
      'Schools can strengthen parent confidence by making learner progress easier to understand. In Early Years, Pre-Primary and Lower Primary, observable development in reading, blending, spelling and writing gives families clearer evidence of classroom learning. A structured phonics programme, supported by teacher training and regular academic review, can support continued enrolment and contribute to a strong school reputation and credible parent recommendations.',
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
      'Yes. Training and support can be delivered online across time zones. International proposals are quoted in the school’s preferred billing currency after the timetable, teacher count, and campus scope are confirmed.',
  },
];

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
    { '@type': 'ListItem', position: 2, name: 'Phonics Program for Schools', item: canonicalUrl },
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
  speakable: {
    '@type': 'SpeakableSpecification',
    cssSelector: ['h1', '.school-answer'],
  },
  audience: {
    '@type': 'EducationalAudience',
    educationalRole: ['school principal', 'academic coordinator', 'English head', 'school founder'],
  },
};

const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': `${canonicalUrl}#service`,
  name: 'Tiny Steps Phonics Program for Schools',
  serviceType: 'Research-aligned school phonics curriculum, digital classroom content, teacher training, dedicated learning partner, and implementation support',
  description: pageDescription,
  provider: {
    '@type': 'EducationalOrganization',
    '@id': 'https://tinystepslearning.com/#organization',
    name: 'Tiny Steps Learning',
    url: 'https://tinystepslearning.com/',
  },
  areaServed: [
    { '@type': 'Country', name: 'India' },
    { '@type': 'Place', name: 'Worldwide' },
  ],
  audience: {
    '@type': 'EducationalAudience',
    educationalRole: 'school and early-years education provider',
  },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'School partnership plans',
    itemListElement: [
      {
        '@type': 'Offer',
        name: 'Focused Launch Licence',
        price: '59000',
        priceCurrency: 'INR',
        description: 'Annual single-campus phonics licence for one pathway, up to 5 teachers and 150 learners. GST extra.',
        url: `${canonicalUrl}#pricing`,
      },
      {
        '@type': 'Offer',
        name: 'Whole-School Phonics Partnership',
        price: '149000',
        priceCurrency: 'INR',
        description: 'Annual single-campus complete phonics pathway for up to 12 teachers and 400 learners, including a dedicated learning partner. GST extra.',
        url: `${canonicalUrl}#pricing`,
      },
      {
        '@type': 'Offer',
        name: 'Multi-Campus Partnership',
        price: '299000',
        priceCurrency: 'INR',
        description: 'Annual partnership for up to 3 campuses, 25 teachers and 900 learners, including a dedicated learning partner. GST extra.',
        url: `${canonicalUrl}#pricing`,
      },
      {
        '@type': 'Offer',
        name: 'Eight-Week School Pilot',
        price: '24900',
        priceCurrency: 'INR',
        description: 'One selected grade, up to 4 teachers and 60 learners. GST extra.',
        url: `${canonicalUrl}#pricing`,
      },
    ],
  },
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

const partnershipDeliverables = [
  {
    number: '01',
    title: 'A sequenced phonics curriculum',
    detail: 'A systematic, cumulative foundation-to-advanced pathway covering phonemic awareness, sound-symbol links, blending, segmenting, decoding, spelling patterns, fluency, and early writing.',
  },
  {
    number: '02',
    title: 'Classroom-ready teaching content',
    detail: 'Teacher-led digital lesson decks, interactive games, routines, word lists, printable worksheets, practice tasks, revision cycles, and clear lesson outcomes.',
  },
  {
    number: '03',
    title: 'Live teacher capability building',
    detail: 'Practical training, lesson rehearsal, correction techniques, model delivery, and coaching that helps existing teachers teach with consistency.',
  },
  {
    number: '04',
    title: 'Assessment and intervention guidance',
    detail: 'Baseline checks, skill checkpoints, cohort trackers, reteaching guidance, and next-step recommendations for children who need more support.',
  },
  {
    number: '05',
    title: 'A dedicated learning partner',
    detail: 'One Tiny Steps partner coordinates teacher preparation, delivery check-ins, content clarifications, observation feedback, school-recorded progress reviews, and leadership updates throughout the academic year.',
  },
  {
    number: '06',
    title: 'Leadership and parent communication',
    detail: 'A clear rollout plan, progress-review templates, parent orientation guidance, and language schools can use to explain the phonics journey.',
  },
];

const phonicsGapCards = [
  {
    title: 'A curriculum without a protected sequence',
    detail:
      'Phonics appears as isolated alphabet work, textbook pages, or downloaded activities instead of one agreed sound-to-spelling progression that builds across grades.',
  },
  {
    title: 'Teaching without specialist phonics knowledge',
    detail:
      'Fluent English and general classroom experience do not automatically prepare a teacher to model pure sounds, diagnose blending errors, explain spelling choices, or decide what to reteach.',
  },
  {
    title: 'Practice without diagnosis and correction',
    detail:
      'Children can repeatedly copy words, memorise spellings, or guess from pictures while gaps in phonemic awareness, decoding, and encoding remain hidden.',
  },
];

const pedagogyCycle = [
  {
    label: 'Teach',
    title: 'Explicitly model the skill',
    detail: 'The teacher demonstrates the sound, spelling pattern, blending routine, or spelling decision in a clear, planned sequence.',
  },
  {
    label: 'Play',
    title: 'Practise with purpose',
    detail: 'Listening, matching, tracing, sorting, blending, and word-building games give children active, high-response practice.',
  },
  {
    label: 'Apply',
    title: 'Move into reading and writing',
    detail: 'Children use the same pattern in words, sentences, dictation, connected text, comprehension, and early writing.',
  },
  {
    label: 'Check',
    title: 'Notice, correct, and reteach',
    detail: 'Quick checks reveal whether a child can recall, blend, segment, spell, and transfer the skill independently.',
  },
];

const learningSequence = [
  { title: 'Hear and distinguish sounds', detail: 'Build phonemic awareness through rhyme, syllables, and sounds within spoken words.' },
  { title: 'Connect sounds with letters', detail: 'Develop accurate letter–sound knowledge, recall, formation, and sound production.' },
  { title: 'Blend and decode words', detail: 'Move from oral blending into CVC words, digraphs, vowel teams, and more complex words.' },
  { title: 'Read with growing fluency', detail: 'Build accuracy, phrasing, pace, and confidence through cumulative reading practice.' },
  { title: 'Spell and write with confidence', detail: 'Apply segmenting, spelling choices, dictation, patterns, and rules in meaningful writing.' },
  { title: 'Build comprehension and independent reading', detail: 'Use secure decoding and fluency to understand connected text and read more independently.' },
];

const implementationTimeline = [
  {
    label: 'Before launch',
    title: 'Discover and map',
    detail: 'Confirm grades, learner needs, timetable, teacher count, current materials, and the best starting pathway.',
  },
  {
    label: 'Weeks 1–2',
    title: 'Train and rehearse',
    detail: 'Teachers learn the methodology, practise the lesson routines, and prepare the first implementation block.',
  },
  {
    label: 'First 90 days',
    title: 'Launch and calibrate',
    detail: 'Tiny Steps supports baseline use, classroom delivery, observation feedback, and early reteaching decisions.',
  },
  {
    label: 'Months 4–12',
    title: 'Coach and strengthen',
    detail: 'The dedicated learning partner coordinates monthly support, term reviews, teacher refreshers, and leadership checkpoints so delivery stays consistent.',
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
    description: 'Build one consistent phonics approach across Early Years, Pre-Primary and Lower Primary.',
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

const comparisonRows = [
  { feature: 'Sequenced classroom curriculum', downloads: 'Partial', workshop: 'No', partnership: 'Included' },
  { feature: 'Live teacher training and rehearsal', downloads: 'No', workshop: 'One time', partnership: 'Included' },
  { feature: 'Ready lesson and practice resources', downloads: 'Mixed', workshop: 'Usually separate', partnership: 'Included' },
  { feature: 'Assessment and reteaching guidance', downloads: 'Limited', workshop: 'Limited', partnership: 'Included' },
  { feature: 'Dedicated support across the academic year', downloads: 'No', workshop: 'No', partnership: 'Named learning partner' },
];

const enrollmentBusinessOutcomes = [
  {
    title: 'Parent confidence',
    detail: 'Clear, observable progress helps families understand the value being created in the classroom.',
  },
  {
    title: 'Continued enrolment',
    detail: 'When parents can see their child becoming a more confident reader, they have stronger reasons to continue their relationship with the school.',
  },
  {
    title: 'Reputation and referrals',
    detail: 'Consistent literacy development contributes to a stronger academic reputation and more credible parent-to-parent advocacy.',
  },
  {
    title: 'Leadership visibility',
    detail: 'A structured review process gives school leaders clearer insight into programme delivery, teacher readiness and learner progression.',
  },
];

const leadershipStats = [
  { label: 'Wider Tiny Steps reach', value: '5000+', helper: 'Children across our broader English-learning programmes' },
  { label: 'Wider global experience', value: '15+ countries', helper: 'Diverse learner and family contexts' },
  { label: 'Delivery model', value: 'Your teachers', helper: 'Tiny Steps trains, equips, and supports them' },
  { label: 'Implementation', value: 'Full year', helper: 'Not a one-time workshop or content handover' },
];

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
        keywords="phonics program for schools, research aligned phonics curriculum India, phonics teacher training for schools, digital phonics content for schools, synthetic phonics program India"
        canonical={canonicalUrl}
        robots="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
        jsonLd={[breadcrumbSchema, pageSchema, serviceSchema, faqSchema]}
      />

      <LeadHero
        alignDesktopTop
        compactTopSpacing
        eyebrow="For Indian & International Schools • Early Years to Lower Primary"
        eyebrowClassName="border-orange-300 bg-gradient-to-r from-orange-50 via-rose-50 to-fuchsia-50 text-orange-800 shadow-[0_8px_24px_rgba(225,29,72,0.12)]"
        showLeftDecoration={false}
        title={
          <>
            Build confident readers with a{' '}
            <span className="bg-gradient-to-r from-orange-600 via-rose-500 to-violet-600 bg-clip-text text-transparent">
              complete phonics system
            </span>
          </>
        }
        description={
          <p className="school-answer">
            Bring a research-aligned curriculum, joyful digital practice, specialist teacher training, and a
            dedicated learning partner into your existing timetable. Your teachers deliver it; Tiny Steps stays
            alongside them throughout the academic year.
          </p>
        }
        trustChips={[
          { label: 'Teacher-led in your school', tone: 'warm' },
          { label: 'Systematic learning pathway', tone: 'cool' },
          { label: 'Ages 3–10', tone: 'mint' },
          { label: 'Dedicated learning partner', tone: 'neutral' },
          { label: 'India-first • globally available', tone: 'neutral' },
        ]}
        supportingText={
          <>
            For principals, founders, English heads, early-years coordinators, and school networks—not outsourced
            classes and not a one-day content handover.
          </>
        }
        stats={leadershipStats}
        actions={
          <CourseCTAGroup
            items={primaryCtas}
            renderLink={(item, className) => (
              <a
                key={item.label}
                href={item.href}
                target={item.href?.startsWith('http') ? '_blank' : undefined}
                rel={item.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                onClick={item.onClick}
                className={`${className} active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900`}
              >
                {item.label}
              </a>
            )}
          />
        }
        aside={
          <LeadCard className="relative overflow-hidden border-white/80 bg-gradient-to-br from-white via-orange-50/75 to-sky-50/80 p-6 shadow-[0_28px_70px_rgba(15,23,42,0.14)]">
            <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-violet-200/35 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-orange-200/45 blur-2xl" />
            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-700">The partnership model</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                    One school. One shared teaching system.
                  </h2>
                </div>
                <div className="flex -space-x-2" aria-hidden="true">
                  {['a', 'sh', 'ai'].map((sound, index) => (
                    <span
                      key={sound}
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-white text-sm font-black shadow-md ${
                        index === 0
                          ? 'rotate-[-8deg] bg-orange-400 text-slate-950'
                          : index === 1
                            ? 'rotate-[5deg] bg-sky-400 text-slate-950'
                            : 'rotate-[-2deg] bg-violet-400 text-white'
                      }`}
                    >
                      {sound}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-6 space-y-3">
                {[
                  ['01', 'Tiny Steps equips', 'Curriculum • training • coaching • assessment'],
                  ['02', 'Your teachers deliver', 'Inside the school’s normal English timetable'],
                  ['03', 'Children practise and progress', 'Reading • spelling • writing • fluency'],
                ].map(([number, title, detail], index) => (
                  <div
                    key={title}
                    className={`group flex items-center gap-4 rounded-2xl border p-4 transition duration-300 hover:translate-x-1 hover:shadow-md ${
                      index === 0
                        ? 'border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50'
                        : index === 1
                          ? 'border-sky-200 bg-gradient-to-r from-sky-50 to-cyan-50'
                          : 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50'
                    }`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-black text-slate-900 shadow-sm">
                      {number}
                    </span>
                    <div>
                      <p className="font-bold text-slate-950">{title}</p>
                      <p className="mt-0.5 text-sm leading-6 text-slate-600">{detail}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-violet-950 px-4 py-3 text-center text-sm font-bold text-white shadow-lg">
                Curriculum + capable teachers + continuous support
              </div>
            </div>
          </LeadCard>
        }
      />

      <LeadSection id="why-now">
        <LeadCard className="overflow-hidden border-slate-950 bg-gradient-to-br from-slate-950 via-slate-950 to-indigo-950 text-white">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-300">
                The foundational reading gap
              </p>
              <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
                Children are not failing. Essential reading skills are being left to chance.
              </h2>
              <div className="mt-6 inline-flex rounded-2xl border border-emerald-300/30 bg-emerald-300/10 px-5 py-3 text-xl font-black leading-tight text-emerald-100 shadow-[0_14px_30px_rgba(16,185,129,0.08)] md:text-2xl">
                This is a system gap—not a child failure.
              </div>
              <p className="school-answer mt-5 text-base leading-8 text-slate-200">
                Most schools already have an English curriculum. What may be missing is a protected, systematic
                phonics strand taught consistently across classrooms. Alphabet activities, weekly spelling lists,
                mixed worksheets, or a one-day workshop cannot replace an agreed sequence, accurate correction,
                and regular progress checks.
              </p>
              <div className="mt-6 rounded-3xl border border-orange-300/30 bg-gradient-to-br from-orange-400/15 to-rose-400/10 p-5">
                <p className="text-sm font-bold text-orange-200">Why this matters in India</p>
                <p className="mt-2 text-sm leading-7 text-slate-200">
                  ASER 2024 found that 23.4% of rural government-school Standard III children could read a
                  Standard II-level text. Among rural private-school Standard V children, the figure was 59.3%.
                  ASER is not an English-phonics assessment and does not identify a single cause, but it shows why
                  foundational reading cannot be assumed.
                </p>
                <a
                  href="https://asercentre.org/wp-content/uploads/2022/12/ASER-2024-National-findings.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex rounded-sm text-sm font-semibold text-orange-300 underline decoration-orange-300/50 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-300"
                >
                  Read the ASER 2024 national findings
                </a>
              </div>
            </div>

            <div>
              <div className="grid gap-4">
                {phonicsGapCards.map((item, index) => (
                  <article
                    key={item.title}
                    className={`group rounded-3xl border p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(0,0,0,0.22)] ${
                      index === 0
                        ? 'border-orange-300/25 bg-orange-300/10'
                        : index === 1
                          ? 'border-sky-300/25 bg-sky-300/10'
                          : 'border-violet-300/25 bg-violet-300/10'
                    }`}
                  >
                    <div className="flex gap-4">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-black text-slate-950 shadow-md ${
                          index === 0 ? 'bg-orange-400' : index === 1 ? 'bg-sky-400' : 'bg-violet-300'
                        }`}
                      >
                        0{index + 1}
                      </span>
                      <div>
                        <h3 className="text-lg font-bold text-white">{item.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-slate-300">{item.detail}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              <div className="school-answer mt-5 rounded-3xl border border-sky-300/30 bg-gradient-to-br from-sky-300/15 to-violet-300/10 p-5">
                <p className="text-xl font-black text-white">
                  Phonics proficiency is specialist teaching knowledge—not simply “knowing the alphabet.”
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-200">
                  Effective delivery requires knowledge of phonemes, graphemes, blending, segmenting, decoding,
                  encoding, error diagnosis, and cumulative lesson design. Tiny Steps builds this capability
                  through training and rehearsal, then a dedicated learning partner reinforces it through
                  observation, feedback, and year-long coaching.
                </p>
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <a
                    href="https://eric.ed.gov/?id=EJ1349379"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-sm font-semibold text-sky-200 underline decoration-sky-200/50 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-200"
                  >
                    Specialist phonics knowledge
                  </a>
                  <a
                    href="https://eric.ed.gov/?id=EJ1298044"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-sm font-semibold text-sky-200 underline decoration-sky-200/50 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-200"
                  >
                    Teacher training evidence review
                  </a>
                </div>
              </div>
            </div>
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection id="pedagogy">
        <LeadCard className="overflow-hidden bg-gradient-to-br from-white via-sky-50/55 to-orange-50/70">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-start">
            <div>
              <LeadSectionHeading
                eyebrow="The Tiny Steps pedagogy"
                title={
                  <>
                    Research-aligned instruction. Joyful
                    <br aria-hidden="true" className="hidden lg:block" />{' '}
                    practice. Real application.
                  </>
                }
                description="Children need explicit teaching and many successful opportunities to respond. Every lesson moves deliberately from teacher modelling to purposeful play, then into independent reading, spelling, and writing."
              />
              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                {pedagogyCycle.map((item, index) => (
                  <article
                    key={item.label}
                    className={`group rounded-3xl border p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(15,23,42,0.12)] ${
                      index === 0
                        ? 'border-orange-200 bg-gradient-to-br from-white to-orange-50'
                        : index === 1
                          ? 'border-sky-200 bg-gradient-to-br from-white to-sky-50'
                          : index === 2
                            ? 'border-emerald-200 bg-gradient-to-br from-white to-emerald-50'
                            : 'border-violet-200 bg-gradient-to-br from-white to-violet-50'
                    }`}
                  >
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${
                        index === 0
                          ? 'bg-orange-100 text-orange-700'
                          : index === 1
                            ? 'bg-sky-100 text-sky-700'
                            : index === 2
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-violet-100 text-violet-700'
                      }`}
                    >
                      {item.label}
                    </span>
                    <h3 className="mt-3 text-lg font-bold text-slate-950">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-700">{item.detail}</p>
                  </article>
                ))}
              </div>
              <p className="school-answer mt-5 text-sm leading-7 text-slate-700">
                The evidence base supports sound awareness linked to letters, explicit decoding and encoding, and
                daily opportunities to read connected text. Games make practice active and memorable; they
                reinforce teaching rather than replacing it.
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <a
                  href="https://ies.ed.gov/ncee/wwc/practiceguide/21"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-slate-900 underline decoration-orange-400 underline-offset-4"
                >
                  IES foundational reading guidance
                </a>
                <a
                  href="https://www.nichd.nih.gov/publications/pubs/nrp/findings"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-slate-900 underline decoration-orange-400 underline-offset-4"
                >
                  National Reading Panel findings
                </a>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 p-5 text-white shadow-[0_28px_70px_rgba(15,23,42,0.24)]">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-300">
                    Digital classroom content
                  </p>
                  <h3 className="mt-1 text-2xl font-black text-white">Every lesson gives children something to do</h3>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-200">
                  Teacher led
                </span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  ['Hear it', 'Sound listening and discrimination'],
                  ['Trace it', 'Letter formation with sound'],
                  ['Build it', 'Blending and word construction'],
                  ['Spell it', 'Segmenting and pattern challenges'],
                  ['Sort it', 'Pictures, sounds, and spelling choices'],
                  ['Read it', 'Words, sentences, and fluency rounds'],
                ].map(([title, detail], index) => (
                  <div
                    key={title}
                    className={`rounded-2xl border p-4 transition duration-300 hover:-translate-y-1 hover:bg-white/10 ${
                      index % 3 === 0
                        ? 'border-orange-300/35 bg-orange-300/10'
                        : index % 3 === 1
                          ? 'border-sky-300/35 bg-sky-300/10'
                          : 'border-emerald-300/35 bg-emerald-300/10'
                    }`}
                  >
                    <p className="font-bold text-white">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-300">{detail}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-2xl bg-white p-4 text-slate-900">
                <p className="text-sm font-bold">Digital engagement + printable reinforcement</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Lesson decks, games, movement, oral response, handwriting, worksheets, and quick checks work
                  together inside one sequenced lesson.
                </p>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to="/class-samples"
                  onClick={() => trackSchoolCta('View class samples', 'pedagogy', '/class-samples')}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-orange-400 px-5 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-orange-300 active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300 motion-reduce:transform-none"
                >
                  See Tiny Steps in action
                </Link>
                <Link
                  to="/free-phonics-games-for-kids"
                  onClick={() => trackSchoolCta('Preview phonics games', 'pedagogy', '/free-phonics-games-for-kids')}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-white/25 bg-white/10 px-5 text-sm font-bold text-white transition hover:bg-white/15 active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transform-none"
                >
                  Preview phonics games
                </Link>
              </div>
            </div>
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection>
        <LeadCard className="overflow-hidden bg-gradient-to-br from-white via-orange-50/45 to-sky-50/60">
          <LeadSectionHeading
            eyebrow="What your school receives"
            title="More than content: a complete implementation system"
            description="Curriculum, teacher capability, classroom routines, assessment, and ongoing help—six connected parts that make consistent phonics teaching possible."
          />
          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {partnershipDeliverables.map((item, index) => (
              <article
                key={item.number}
                className={`group relative overflow-hidden rounded-3xl border p-5 transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_48px_rgba(15,23,42,0.13)] ${
                  index === 0
                    ? 'border-orange-200 bg-gradient-to-br from-white to-orange-50'
                    : index === 1
                      ? 'border-sky-200 bg-gradient-to-br from-white to-sky-50'
                      : index === 2
                        ? 'border-violet-200 bg-gradient-to-br from-white to-violet-50'
                        : index === 3
                          ? 'border-emerald-200 bg-gradient-to-br from-white to-emerald-50'
                          : index === 4
                            ? 'border-rose-200 bg-gradient-to-br from-white to-rose-50'
                            : 'border-amber-200 bg-gradient-to-br from-white to-amber-50'
                }`}
              >
                <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/65 transition duration-300 group-hover:scale-125" />
                <span
                  className={`relative flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-black shadow-sm ${
                    index === 0
                      ? 'bg-orange-200 text-orange-900'
                      : index === 1
                        ? 'bg-sky-200 text-sky-900'
                        : index === 2
                          ? 'bg-violet-200 text-violet-900'
                          : index === 3
                            ? 'bg-emerald-200 text-emerald-900'
                            : index === 4
                              ? 'bg-rose-200 text-rose-900'
                              : 'bg-amber-200 text-amber-900'
                  }`}
                >
                  {item.number}
                </span>
                <h3 className="relative mt-4 text-lg font-bold text-slate-950">{item.title}</h3>
                <p className="relative mt-2 text-sm leading-7 text-slate-700">{item.detail}</p>
              </article>
            ))}
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection>
        <div className="grid gap-5">
          <LeadCard className="overflow-hidden bg-gradient-to-br from-white to-orange-50/45">
            <LeadSectionHeading
              eyebrow="Student learning journey"
              title="From hearing sounds to reading and writing with confidence"
              description="Each stage builds on the previous one, so children move forward without losing the foundations they still need."
            />
            <ol className="relative mt-8 grid gap-5 before:pointer-events-none before:absolute before:left-[8%] before:right-[8%] before:top-6 before:hidden before:h-1 before:rounded-full before:bg-gradient-to-r before:from-orange-300 before:via-violet-300 before:to-emerald-300 before:content-[''] lg:grid-cols-6 lg:gap-3 lg:before:block">
              {learningSequence.map((item, index) => (
                <li key={item.title} className="group relative grid grid-cols-[52px_1fr] gap-3 lg:block lg:text-center">
                  <div className="flex h-full flex-col items-center lg:h-auto">
                    <span
                      className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-4 border-white text-sm font-black shadow-md transition duration-300 group-hover:scale-105 motion-reduce:transform-none ${
                        index === 0
                          ? 'bg-orange-400 text-slate-950'
                          : index === 1
                            ? 'bg-sky-400 text-slate-950'
                            : index === 2
                              ? 'bg-violet-400 text-white'
                              : index === 3
                                ? 'bg-emerald-400 text-slate-950'
                                : index === 4
                                  ? 'bg-rose-400 text-white'
                                  : 'bg-amber-300 text-slate-950'
                      }`}
                    >
                      0{index + 1}
                    </span>
                    {index < learningSequence.length - 1 ? (
                      <span
                        className="my-1 min-h-8 w-1 flex-1 rounded-full bg-gradient-to-b from-orange-300 via-violet-300 to-emerald-300 lg:hidden"
                        aria-hidden="true"
                      />
                    ) : null}
                  </div>
                  <div className={`${index < learningSequence.length - 1 ? 'pb-6' : 'pb-1'} lg:pb-0 lg:pt-4`}>
                    <h3 className="text-base font-bold leading-6 text-slate-950">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </LeadCard>

          <LeadCard className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-400/15 blur-2xl" />
            <div className="relative grid gap-7 lg:grid-cols-[0.74fr_1.26fr] lg:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-300">India-relevant foundations</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-white">Board-aligned. Methodology-led.</h2>
                <p className="mt-4 text-lg font-bold leading-7 text-orange-200">
                  One structured reading pathway. Adaptable across curricula.
                </p>
              </div>
              <div className="school-answer rounded-3xl border border-white/10 bg-white/[0.06] p-5 md:p-6">
                <p className="text-sm leading-7 text-slate-200 md:text-base">
                  State Boards, CBSE, ICSE, Cambridge and IB may differ in curriculum structure, but schools share
                  one essential responsibility: ensuring that children learn how to decode, spell and read with
                  confidence. The challenge is often not the syllabus itself, but the absence of a consistent,
                  explicit and cumulative classroom methodology.
                </p>
                <p className="mt-4 text-sm leading-7 text-slate-200 md:text-base">
                  Tiny Steps provides a board-agnostic phonics framework that strengthens existing literacy
                  instruction and fits within the school timetable.
                </p>
                <div className="mt-5 border-t border-white/10 pt-4 text-xs leading-6 text-slate-300">
                  Tiny Steps is an independent education provider. Curriculum compatibility does not mean
                  government, school-board, IB, Cambridge, or publisher endorsement.
                </div>
              </div>
            </div>
          </LeadCard>
        </div>
      </LeadSection>

      <LeadSection>
        <LeadCard className="overflow-hidden bg-gradient-to-br from-white via-violet-50/35 to-sky-50/55">
          <LeadSectionHeading
            eyebrow="Implementation roadmap"
            title="Training is the beginning—not the handover"
            description="A clear four-stage rollout moves the school from planning to confident classroom delivery, then keeps improving practice across the academic year."
          />
          <div className="relative mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="pointer-events-none absolute left-[10%] right-[10%] top-6 hidden h-1 rounded-full bg-gradient-to-r from-orange-300 via-violet-300 to-emerald-300 xl:block" />
            {implementationTimeline.map((item, index) => (
              <article
                key={item.label}
                className={`group relative rounded-3xl border p-5 transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_48px_rgba(15,23,42,0.13)] ${
                  index === 0
                    ? 'border-orange-200 bg-gradient-to-br from-white to-orange-50'
                    : index === 1
                      ? 'border-sky-200 bg-gradient-to-br from-white to-sky-50'
                      : index === 2
                        ? 'border-violet-200 bg-gradient-to-br from-white to-violet-50'
                        : 'border-emerald-200 bg-gradient-to-br from-white to-emerald-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      index === 0
                        ? 'bg-orange-100 text-orange-800'
                        : index === 1
                          ? 'bg-sky-100 text-sky-800'
                          : index === 2
                            ? 'bg-violet-100 text-violet-800'
                            : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {item.label}
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-black text-slate-700 shadow-sm">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-700">{item.detail}</p>
              </article>
            ))}
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection>
        <LeadCard className="overflow-hidden">
          <LeadSectionHeading
            eyebrow="The implementation gap"
            title="Buying phonics content is not the same as implementing it well"
            description="Many school purchases stop at curriculum access or an initial workshop. The missing layer is ongoing guidance that turns good content into consistent classroom practice."
          />
          <p className="mt-6 text-xs font-semibold text-slate-500 sm:hidden">Swipe horizontally to compare all approaches →</p>
          <div
            className="mt-2 overflow-x-auto rounded-2xl border border-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-500 sm:mt-7"
            role="region"
            aria-label="Implementation approach comparison"
            tabIndex={0}
          >
            <table className="min-w-[720px] w-full border-collapse text-left text-sm">
              <thead className="bg-slate-950 text-white">
                <tr>
                  <th className="px-4 py-4 font-semibold">What the school needs</th>
                  <th className="px-4 py-4 font-semibold">Resource downloads</th>
                  <th className="px-4 py-4 font-semibold">One-time workshop</th>
                  <th className="border-x border-orange-300 bg-orange-600 px-4 py-4 font-bold">
                    <span className="block text-[10px] uppercase tracking-[0.16em] text-orange-100">Complete Partnership</span>
                    Tiny Steps partnership
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.feature} className="border-t border-slate-200 odd:bg-white even:bg-slate-50/70">
                    <th className="px-4 py-4 font-semibold text-slate-950">{row.feature}</th>
                    <td className="px-4 py-4 text-slate-600">{row.downloads}</td>
                    <td className="px-4 py-4 text-slate-600">{row.workshop}</td>
                    <td className="border-x border-orange-200 bg-orange-50 px-4 py-4 font-semibold text-orange-950">
                      <span aria-hidden="true" className="mr-2 text-orange-600">✓</span>
                      {row.partnership}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-r from-violet-50 via-sky-50 to-orange-50 p-5 md:p-6">
            <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
              <div>
                <span className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-violet-800">
                  Included with every annual partnership
                </span>
                <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                  Your dedicated Tiny Steps learning partner
                </h3>
              </div>
              <div>
                <p className="text-sm leading-7 text-slate-700">
                  Content access alone cannot ensure classroom delivery. Your learning partner stays connected
                  throughout the academic year to coordinate teacher preparation, answer content questions, review
                  agreed delivery checkpoints, discuss school-recorded learner progress, and keep leadership informed.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-700">
                  {['Teacher readiness', 'Delivery check-ins', 'Progress reviews', 'Leadership updates'].map((item) => (
                    <span key={item} className="rounded-full border border-white bg-white/85 px-3 py-1.5 shadow-sm">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection>
        <LeadCard className="relative overflow-hidden border-orange-200/80 bg-gradient-to-br from-white via-orange-50/70 to-violet-50/60 p-0">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-violet-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-orange-300/25 blur-3xl" />
          <div className="relative grid gap-8 p-6 md:p-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-10 lg:p-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-700">
                The enrolment business case
              </p>
              <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 md:text-4xl">
                Visible reading progress strengthens parent confidence
              </h2>
              <div className="school-answer mt-5 space-y-4 text-sm leading-7 text-slate-700 md:text-base">
                <p>
                  In the Early Years, Pre-Primary and Lower Primary stages, families often evaluate the quality of
                  schooling through the progress they can observe in their child’s reading, blending, spelling and
                  writing. Report-card scores are important, but visible literacy development gives parents clearer
                  evidence that classroom learning is translating into lasting capability.
                </p>
                <p>
                  Demonstrable reading progress can strengthen parent trust, support continued enrolment and
                  encourage positive recommendations within the school community.
                </p>
              </div>
              <div className="mt-6 rounded-3xl border border-orange-200 bg-white/85 p-5 text-lg font-bold leading-8 text-slate-950 shadow-[0_16px_36px_rgba(249,115,22,0.12)]">
                Strong early literacy is not only an academic priority. It is part of the trust a school builds with
                every family.
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/90 bg-slate-950 p-5 text-white shadow-[0_24px_54px_rgba(15,23,42,0.2)] md:p-6">
              <h3 className="text-xl font-black tracking-tight text-white">How visible progress supports school leadership</h3>
              <ul className="mt-5 space-y-3">
                {enrollmentBusinessOutcomes.map((outcome, index) => (
                  <li
                    key={outcome.title}
                    className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5 text-sm leading-6 text-slate-100 transition hover:border-orange-300/40 hover:bg-white/10"
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

      <LeadSection id="pricing">
        <LeadCard className="bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
          <LeadSectionHeading
            eyebrow="School partnership pricing"
            title="Clear annual options for every stage of rollout"
            description="Choose a focused launch, a complete whole-school pathway, or a coordinated multi-campus rollout. Every annual option includes the agreed licence, teacher enablement, implementation reviews, and a dedicated learning partner."
            tone="dark"
          />
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full border border-orange-300/30 bg-orange-300/10 px-3 py-1.5 text-orange-200">
              Annual licence
            </span>
            <span className="rounded-full border border-sky-300/30 bg-sky-300/10 px-3 py-1.5 text-sky-200">
              GST shown separately
            </span>
            <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1.5 text-emerald-200">
              No per-child fee within the listed limits
            </span>
            <span className="rounded-full border border-violet-300/30 bg-violet-300/10 px-3 py-1.5 text-violet-200">
              Dedicated learning partner
            </span>
          </div>

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
                  <p className={`text-xs font-bold uppercase tracking-[0.16em] ${plan.featured ? 'text-orange-700' : 'text-orange-300'}`}>
                    What is included
                  </p>
                  <ul className={`mt-3 space-y-2.5 text-sm ${plan.featured ? 'text-slate-700' : 'text-slate-200'}`}>
                    {plan.items.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className={plan.featured ? 'text-orange-600' : 'text-orange-300'} aria-hidden="true">
                          ✓
                        </span>
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
                    className={`mt-6 inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-bold transition active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transform-none ${
                      plan.featured
                        ? 'bg-slate-950 text-white hover:bg-slate-800 focus-visible:outline-slate-950'
                        : 'border border-white/20 bg-white/10 text-white hover:bg-white/15 focus-visible:outline-white'
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
              className="inline-flex h-11 items-center justify-center rounded-full bg-orange-400 px-5 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-orange-300 active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300 motion-reduce:transform-none"
            >
              Request pilot proposal
            </a>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-400">
            Final scope is confirmed in the written proposal. Pricing covers a non-transferable licence for the
            agreed campus, teacher count, learner count, academic year, and content scope. It does not transfer
            ownership or permit resale, public sharing, or use by unlicensed campuses.
          </p>
        </LeadCard>
      </LeadSection>

      <LeadSection>
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <LeadCard className="bg-orange-50/70">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">Good partnership fit</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Built for schools that want internal capability</h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
              {[
                'The school wants its own teachers—not visiting tutors—to own delivery.',
                'Phonics teaching currently varies by class, teacher, or downloaded resource.',
                'Leadership wants one shared progression and practical progress checkpoints.',
                'The team values coaching and classroom adoption more than a certificate alone.',
                'The school can nominate an academic coordinator to champion implementation.',
              ].map((item) => (
                <li key={item} className="flex gap-2 rounded-2xl border border-orange-200/70 bg-white p-3">
                  <span className="text-orange-600" aria-hidden="true">●</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </LeadCard>

          <LeadCard>
            <LeadSectionHeading
              eyebrow="Your proposal"
              title="What we confirm before recommending a plan"
              description="A useful school proposal begins with the operating context, not a generic brochure."
            />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                ['School profile', 'Board, campuses, city, calendar, and early-years structure'],
                ['Learner scope', 'Grades, class sizes, current reading needs, and language context'],
                ['Teacher readiness', 'Teacher count, coordinator, experience, and training availability'],
                ['Implementation time', 'English periods, phonics frequency, term dates, and launch window'],
                ['Current resources', 'Textbooks, worksheets, reading scheme, assessments, and digital access'],
                ['Success measures', 'What leadership wants to observe by the first and final review'],
              ].map(([title, detail]) => (
                <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="font-semibold text-slate-950">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{detail}</p>
                </div>
              ))}
            </div>
          </LeadCard>
        </div>
      </LeadSection>

      <LeadSection id="faq">
        <LeadCard className="bg-gradient-to-br from-white via-sky-50/35 to-violet-50/35">
          <LeadSectionHeading
            eyebrow="School partnership FAQs"
            title="Direct answers for principals and academic teams"
            description="Open only the questions your leadership or procurement team needs. The complete answers remain available for internal sharing."
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
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 rounded-lg font-bold text-slate-950 marker:content-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-500">
                  <span>{item.question}</span>
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-600 transition group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <div className="mt-3 border-t border-slate-100 pt-3 text-sm leading-7 text-slate-700">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection className="pb-4">
        <FinalLeadCTA
          title="Build confident phonics teaching inside your own school"
          description={
            <>
              Tell us your board, grades, number of teachers, learner count, and preferred launch month. We will
              recommend the most practical pilot or annual partnership and send a written proposal. Email{' '}
              <span className="font-semibold text-white">{PUBLIC_CONTACT_EMAIL}</span> or speak with the partnership team.
            </>
          }
          statement={
            <>
              <p className="text-base font-bold leading-7 text-white">
                A successful phonics programme is more than a collection of resources.
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-200">
                It requires a clear sequence, prepared teachers, consistent classroom routines and ongoing academic
                review. Tiny Steps helps schools bring these elements together across the academic year.
              </p>
              <p className="mt-4 border-t border-white/10 pt-4 text-sm font-semibold text-orange-200">
                Your teachers lead the classroom. Tiny Steps strengthens the system behind them.
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
                    className={`${className} !border-white/30 !bg-transparent !text-white hover:!bg-white/10 active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transform-none`}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.label}
                    href={item.href}
                    target={item.href?.startsWith('http') ? '_blank' : undefined}
                    rel={item.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                    onClick={item.onClick}
                    className={`${className} active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transform-none ${
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
