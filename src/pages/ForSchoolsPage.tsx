import React from 'react';
import { Link } from 'react-router-dom';
import Meta from '../components/common/Meta';
import {
  CourseCTAGroup,
  FAQSection,
  FinalLeadCTA,
  LeadCard,
  LeadHero,
  LeadPageShell,
  LeadSection,
  LeadSectionHeading,
} from '../components/marketing/LeadPageSections';
import { PUBLIC_CONTACT_EMAIL, PUBLIC_CONTACT_MAILTO } from '../constants/publicContact';
import { trackCoursePageCtaClick } from '../lib/conversionTracking';

const canonicalUrl = 'https://tinystepslearning.com/for-schools';
const proposalMailto = `${PUBLIC_CONTACT_MAILTO}?subject=School%20Phonics%20Partnership%20Proposal`;
const schoolsWhatsAppUrl =
  'https://wa.me/919618398383?text=Hi%20Tiny%20Steps!%20I%20would%20like%20a%20proposal%20for%20the%20school%20phonics%20partnership.';

const pageTitle = 'Phonics Program for Schools in India | Tiny Steps';
const pageDescription =
  'Research-aligned phonics curriculum, digital classroom content, teacher training, and year-long implementation support for schools in India.';

const faqItems = [
  {
    question: 'What is the Tiny Steps phonics program for schools?',
    answer:
      'It is an annual, campus-based partnership that gives a school a structured phonics scope and sequence, classroom-ready teaching content, printable practice, assessment tools, live teacher training, and implementation support throughout the academic year.',
  },
  {
    question: 'Who teaches the children: Tiny Steps or our school teachers?',
    answer:
      'Your existing teachers teach the children. Tiny Steps trains them, provides the teaching system and resources, observes implementation at agreed checkpoints, and supports the team for the year.',
  },
  {
    question: 'Which ages and grades does the program support?',
    answer:
      'The pathway is designed mainly for ages 3–10, from early sound awareness and letter-sound knowledge through blending, spelling patterns, reading fluency, and early writing. The exact starting stage is selected after a school discovery and baseline review.',
  },
  {
    question: 'Does the program replace our English curriculum?',
    answer:
      'No. It can sit inside the existing English timetable as the school’s structured phonics and foundational reading strand. We map the implementation to the school calendar, grade expectations, and available teaching periods.',
  },
  {
    question: 'Is the program suitable for CBSE, ICSE, Cambridge, or IB schools?',
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
      'The pathway uses systematic and cumulative instruction, explicit modelling, phonemic awareness linked to print, regular decoding and encoding practice, connected reading and writing, progress checks, and assessment-informed reteaching. Tiny Steps describes the curriculum as research-aligned; it does not claim that the proprietary program has independently proven outcomes.',
  },
  {
    question: 'How are digital games and activities used?',
    answer:
      'Teacher-led digital lesson content introduces and models each skill. Listening games, letter-sound matching, tracing, blending, word building, spelling challenges, picture sorts, and quick-response activities then provide purposeful practice. Games reinforce explicit teaching; they do not replace teacher explanation, correction, reading, or writing.',
  },
  {
    question: 'What teacher training is included?',
    answer:
      'Training covers phonemic awareness, sound-to-symbol teaching, blending and segmenting, correction routines, lesson delivery, assessment, and classroom practice. The number of live training labs and coaching sessions depends on the partnership plan.',
  },
  {
    question: 'How is student progress measured?',
    answer:
      'Schools receive baseline, checkpoint, and end-of-cycle assessment guidance across sound knowledge, blending, segmenting, decoding, spelling, and fluency. Leadership reviews focus on cohort patterns and practical next steps rather than marks alone.',
  },
  {
    question: 'How much does the school phonics partnership cost?',
    answer:
      'Founding-school pricing starts at ₹59,000 plus GST per campus for an annual focused-stage licence. The complete whole-school partnership is ₹99,000 plus GST per campus. Multi-campus partnerships start from ₹1.75 lakh plus GST and are scoped to the school network.',
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
  serviceType: 'Research-aligned school phonics curriculum, digital classroom content, teacher training, and implementation support',
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
        name: 'Focused Stage Licence',
        price: '59000',
        priceCurrency: 'INR',
        description: 'Annual single-campus phonics licence for one pathway, up to 5 teachers and 150 learners. GST extra.',
        url: `${canonicalUrl}#pricing`,
      },
      {
        '@type': 'Offer',
        name: 'Whole-School Phonics Partnership',
        price: '99000',
        priceCurrency: 'INR',
        description: 'Annual single-campus complete phonics pathway for up to 12 teachers and 400 learners. GST extra.',
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
    title: 'Year-long implementation support',
    detail: 'Scheduled coaching, office hours, observation feedback, term reviews, content clarifications, and an academic partnership contact.',
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
  { stage: 'Start', title: 'Hear and notice sounds', detail: 'Rhymes, syllables, phonemic awareness, and beginning, middle, and ending sounds.' },
  { stage: 'Build', title: 'Connect sounds to print', detail: 'Letter-sound knowledge, formation, recall, and precise sound production.' },
  { stage: 'Read', title: 'Blend and decode', detail: 'Oral blending, CVC words, digraphs, vowel teams, and increasingly complex words.' },
  { stage: 'Spell', title: 'Segment and encode', detail: 'Sound counting, spelling choices, dictation, common patterns, and rule application.' },
  { stage: 'Apply', title: 'Read and write with confidence', detail: 'Fluency, sentence reading, comprehension, spelling in context, and early writing.' },
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
    detail: 'Monthly support, term reviews, teacher refreshers, and leadership checkpoints help the approach stay consistent.',
  },
];

const pricingPlans = [
  {
    name: 'Focused Stage Licence',
    price: '₹59,000',
    qualifier: '+ GST / campus / academic year',
    description: 'For a school beginning with one age band or phonics pathway.',
    items: [
      'One phonics pathway',
      'Up to 5 teachers and 150 learners',
      'Two live teacher-training labs',
      'Classroom content and print licence',
      'Monthly implementation office hour',
      'Two progress-review cycles',
    ],
  },
  {
    name: 'Whole-School Partnership',
    price: '₹99,000',
    qualifier: '+ GST / campus / academic year',
    description: 'For consistent phonics teaching across early years and primary grades.',
    featured: true,
    items: [
      'Complete foundation-to-advanced pathway',
      'Up to 12 teachers and 400 learners',
      'Four live training and rehearsal labs',
      'All teaching, practice, and assessment resources',
      'Monthly coaching and priority support',
      'Three observation and leadership reviews',
    ],
  },
  {
    name: 'Multi-Campus Partnership',
    price: 'From ₹1.75 lakh',
    qualifier: '+ GST / academic year',
    description: 'For school groups that need central training and campus-level implementation.',
    items: [
      'Scope for up to 3 campuses',
      'Up to 25 teachers and 900 learners',
      'Central coordinator enablement',
      'Shared rollout and reporting framework',
      'Campus implementation reviews',
      'Custom expansion and renewal plan',
    ],
  },
];

const comparisonRows = [
  { feature: 'Sequenced classroom curriculum', downloads: 'Partial', workshop: 'No', partnership: 'Included' },
  { feature: 'Live teacher training and rehearsal', downloads: 'No', workshop: 'One time', partnership: 'Included' },
  { feature: 'Ready lesson and practice resources', downloads: 'Mixed', workshop: 'Usually separate', partnership: 'Included' },
  { feature: 'Assessment and reteaching guidance', downloads: 'Limited', workshop: 'Limited', partnership: 'Included' },
  { feature: 'Support across the academic year', downloads: 'No', workshop: 'No', partnership: 'Included' },
];

const leadershipStats = [
  { label: 'Children reached', value: '5000+', helper: 'Across structured English learning pathways' },
  { label: 'Global experience', value: '15+ countries', helper: 'Built through diverse learner and family contexts' },
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
      label: 'Request a School Proposal',
      href: proposalMailto,
      variant: 'primary' as const,
      onClick: () => trackSchoolCta('Request a School Proposal', 'hero', '/contact'),
    },
    {
      label: 'WhatsApp Partnership Team',
      href: schoolsWhatsAppUrl,
      variant: 'secondary' as const,
      onClick: () => trackSchoolCta('WhatsApp Partnership Team', 'hero', '/contact'),
    },
  ];

  return (
    <LeadPageShell>
      <Meta
        title={pageTitle}
        description={pageDescription}
        keywords="phonics program for schools, research aligned phonics curriculum India, phonics teacher training for schools, digital phonics content for schools, synthetic phonics program India"
        canonical={canonicalUrl}
        jsonLd={[breadcrumbSchema, pageSchema, serviceSchema, faqSchema]}
      />

      <LeadHero
        eyebrow="For Indian & International Schools • Ages 3–10"
        title="A Research-Aligned Phonics Program for Schools in India"
        description={
          <p className="school-answer">
            Tiny Steps brings a systematic phonics curriculum, teacher-led digital classroom content, playful
            practice, assessment, and specialist training into your school—then supports your teachers throughout
            the academic year so children learn to decode, spell, read, and write with growing independence.
          </p>
        }
        trustChips={[
          { label: 'Your teachers deliver', tone: 'warm' },
          { label: 'Research-aligned sequence', tone: 'cool' },
          { label: 'Year-long academic support', tone: 'mint' },
          { label: 'India-first, globally available', tone: 'neutral' },
        ]}
        supportingText={
          <>
            Built for principals, founders, English heads, early-years coordinators, and school networks looking
            for a sustainable teaching system—not an outsourced class or a one-day workshop.
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
                className={className}
              >
                {item.label}
              </a>
            )}
          />
        }
        aside={
          <LeadCard className="overflow-hidden border-orange-200/70 bg-white">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">The partnership model</p>
            <div className="mt-5 space-y-3">
              {[
                ['Tiny Steps', 'Curriculum • training • coaching • assessment'],
                ['Your teachers', 'Teach the program inside the normal school timetable'],
                ['Your children', 'Practise reading, spelling, writing, and fluency consistently'],
              ].map(([title, detail], index) => (
                <div key={title}>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5">
                    <p className="font-semibold text-slate-950">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{detail}</p>
                  </div>
                  {index < 2 ? <div className="mx-auto h-5 w-px bg-orange-300" aria-hidden="true" /> : null}
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
              One system. One teaching language. A full year of support.
            </div>
          </LeadCard>
        }
      />

      <LeadSection id="why-now">
        <LeadCard className="border-slate-950 bg-slate-950 text-white">
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">
                The foundational reading gap
              </p>
              <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
                Children are not failing. Essential reading skills are being left to chance.
              </h2>
              <p className="school-answer mt-5 text-base leading-8 text-slate-200">
                Most schools have an English curriculum. What many do not have is a protected, systematic, and
                cumulative phonics strand taught consistently across classrooms. A textbook chapter, alphabet
                activity, weekly spelling list, or one-day workshop cannot replace a shared teaching sequence,
                accurate correction routines, and ongoing progress checks.
              </p>
              <div className="mt-6 rounded-3xl border border-orange-300/30 bg-orange-400/10 p-5">
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
                  className="mt-3 inline-flex text-sm font-semibold text-orange-300 underline decoration-orange-300/50 underline-offset-4"
                >
                  Read the ASER 2024 national findings
                </a>
              </div>
            </div>

            <div>
              <div className="grid gap-4">
                {phonicsGapCards.map((item, index) => (
                  <article key={item.title} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <div className="flex gap-4">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-400 text-sm font-black text-slate-950">
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
              <div className="school-answer mt-5 rounded-3xl border border-sky-300/25 bg-sky-300/10 p-5">
                <p className="text-xl font-black text-white">
                  Phonics proficiency is specialist teaching knowledge—not simply “knowing the alphabet.”
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-200">
                  Research describes phonological-awareness and phonics teaching as requiring specialised content
                  and pedagogical knowledge. A review of teacher-training studies found the strongest knowledge
                  growth when teachers applied new learning under expert guidance. That is why Tiny Steps combines
                  training with rehearsal, observation, feedback, and year-long coaching.
                </p>
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <a
                    href="https://eric.ed.gov/?id=EJ1349379"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-sky-200 underline decoration-sky-200/50 underline-offset-4"
                  >
                    Specialist phonics knowledge
                  </a>
                  <a
                    href="https://eric.ed.gov/?id=EJ1298044"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-sky-200 underline decoration-sky-200/50 underline-offset-4"
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
        <LeadCard className="overflow-hidden bg-gradient-to-br from-white via-sky-50/45 to-orange-50/60">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-start">
            <div>
              <LeadSectionHeading
                eyebrow="The Tiny Steps pedagogy"
                title="Research-aligned instruction. Joyful practice. Real application."
                description="Children need explicit teaching and many successful opportunities to respond. Our lessons move deliberately from teacher modelling to playful practice, then into independent reading, spelling, and writing."
              />
              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                {pedagogyCycle.map((item) => (
                  <article key={item.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <span className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">
                      {item.label}
                    </span>
                    <h3 className="mt-2 text-lg font-bold text-slate-950">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-700">{item.detail}</p>
                  </article>
                ))}
              </div>
              <p className="school-answer mt-5 text-sm leading-7 text-slate-700">
                The evidence base supports developing sound awareness linked to letters, teaching children to
                decode and write words, and giving daily opportunities to read connected text. Games make practice
                active and memorable; they reinforce the teaching rather than replacing it.
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

            <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5 text-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">
                    Digital classroom content
                  </p>
                  <h3 className="mt-1 text-2xl font-black text-white">Every lesson gives children something to do</h3>
                </div>
                <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-200">
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
                    className={`rounded-2xl border p-4 ${
                      index % 3 === 0
                        ? 'border-orange-300/30 bg-orange-300/10'
                        : index % 3 === 1
                          ? 'border-sky-300/30 bg-sky-300/10'
                          : 'border-emerald-300/30 bg-emerald-300/10'
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
                  Interactive lesson decks, phonics games, movement, oral response, handwriting, worksheets, and
                  quick checks work together inside one sequenced lesson.
                </p>
              </div>
              <Link
                to="/free-phonics-games-for-kids"
                onClick={() => trackSchoolCta('Preview phonics games', 'pedagogy', '/free-phonics-games-for-kids')}
                className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-orange-400 px-5 text-sm font-bold text-slate-950 transition hover:bg-orange-300"
              >
                Preview Tiny Steps phonics games
              </Link>
            </div>
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection>
        <LeadCard className="bg-gradient-to-br from-white via-orange-50/35 to-sky-50/50">
          <LeadSectionHeading
            eyebrow="What your school receives"
            title="More than content: a complete implementation system"
            description="The value is not a folder of worksheets. It is the curriculum, teacher capability, classroom routines, assessment, and ongoing help required to deliver phonics consistently."
          />
          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {partnershipDeliverables.map((item) => (
              <article key={item.number} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <span className="text-sm font-black text-orange-600">{item.number}</span>
                <h3 className="mt-3 text-lg font-bold text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-700">{item.detail}</p>
              </article>
            ))}
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection>
        <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
          <LeadCard>
            <LeadSectionHeading
              eyebrow="Student learning pathway"
              title="From hearing sounds to reading and writing with confidence"
              description="A cumulative sequence helps teachers revisit prior learning while introducing the next skill in manageable steps."
            />
            <ol className="mt-6 space-y-3">
              {learningSequence.map((item, index) => (
                <li key={item.title} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:grid-cols-[72px_1fr]">
                  <div className="flex items-center gap-2 sm:block">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">{item.stage}</span>
                    <span className="ml-2 text-xs font-bold text-slate-400 sm:ml-0 sm:mt-1 sm:block">0{index + 1}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-950">{item.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-700">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </LeadCard>

          <LeadCard className="bg-slate-950 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">India-relevant foundations</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">Phonics inside a broader literacy journey</h2>
            <p className="school-answer mt-4 text-sm leading-7 text-slate-200">
              India’s National Curriculum Framework for the Foundational Stage identifies phonological awareness,
              sound-symbol association, decoding, comprehension, and writing as connected foundational literacy
              skills. Tiny Steps turns those skill areas into a practical English phonics teaching sequence for
              school classrooms.
            </p>
            <a
              href="https://ncert.nic.in/pdf/NCF_for_Foundational_Stage_20_October_2022.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex text-sm font-semibold text-orange-300 underline decoration-orange-300/50 underline-offset-4"
            >
              Read the official NCERT framework
            </a>
            <div className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-200">
              <strong className="text-white">Important:</strong> Tiny Steps is an independent education provider.
              Curriculum compatibility does not mean government, school-board, IB, Cambridge, or publisher
              endorsement.
            </div>
          </LeadCard>
        </div>
      </LeadSection>

      <LeadSection>
        <LeadCard>
          <LeadSectionHeading
            eyebrow="Implementation roadmap"
            title="Training is the beginning—not the handover"
            description="The partnership is designed to help a school move from decision to consistent classroom practice, then keep improving across the academic year."
          />
          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {implementationTimeline.map((item, index) => (
              <article key={item.label} className="relative rounded-3xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-800">{item.label}</span>
                  <span className="text-sm font-black text-slate-300">0{index + 1}</span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-700">{item.detail}</p>
              </article>
            ))}
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection>
        <LeadCard className="overflow-hidden">
          <LeadSectionHeading
            eyebrow="Why a partnership"
            title="Close the gap between having resources and teaching consistently"
            description="Schools often have plenty of activities but no single progression, shared teaching routine, or ongoing coaching layer."
          />
          <div className="mt-7 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-[720px] w-full border-collapse text-left text-sm">
              <thead className="bg-slate-950 text-white">
                <tr>
                  <th className="px-4 py-4 font-semibold">What the school needs</th>
                  <th className="px-4 py-4 font-semibold">Resource downloads</th>
                  <th className="px-4 py-4 font-semibold">One-time workshop</th>
                  <th className="bg-orange-600 px-4 py-4 font-semibold">Tiny Steps partnership</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.feature} className="border-t border-slate-200 odd:bg-white even:bg-slate-50/70">
                    <th className="px-4 py-4 font-semibold text-slate-950">{row.feature}</th>
                    <td className="px-4 py-4 text-slate-600">{row.downloads}</td>
                    <td className="px-4 py-4 text-slate-600">{row.workshop}</td>
                    <td className="bg-orange-50/70 px-4 py-4 font-semibold text-orange-900">{row.partnership}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection id="pricing">
        <LeadCard className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
          <LeadSectionHeading
            eyebrow="Founding-school pricing"
            title="Transparent annual partnership options"
            description="Select a focused launch, a whole-school pathway, or a network rollout. Final scope is confirmed in the written proposal."
            tone="dark"
          />

          <div className="mt-7 grid gap-5 xl:grid-cols-3">
            {pricingPlans.map((plan) => (
              <article
                key={plan.name}
                className={`rounded-3xl border p-5 ${
                  plan.featured
                    ? 'border-orange-300 bg-white text-slate-950 shadow-[0_20px_50px_rgba(251,146,60,0.2)]'
                    : 'border-white/15 bg-white/5 text-white'
                }`}
              >
                {plan.featured ? (
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-orange-800">Best for full rollout</span>
                ) : null}
                <h3 className="mt-4 text-xl font-bold">{plan.name}</h3>
                <p className={`mt-2 text-sm leading-6 ${plan.featured ? 'text-slate-600' : 'text-slate-300'}`}>{plan.description}</p>
                <p className="mt-5 text-3xl font-black tracking-tight">{plan.price}</p>
                <p className={`mt-1 text-xs ${plan.featured ? 'text-slate-500' : 'text-slate-400'}`}>{plan.qualifier}</p>
                <ul className={`mt-5 space-y-2.5 text-sm ${plan.featured ? 'text-slate-700' : 'text-slate-200'}`}>
                  {plan.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className={plan.featured ? 'text-orange-600' : 'text-orange-300'} aria-hidden="true">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="mt-6 grid gap-4 rounded-3xl border border-orange-300/30 bg-orange-400/10 p-5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-sm font-bold text-orange-200">Prefer to validate the model first?</p>
              <p className="mt-1 text-sm leading-6 text-slate-200">
                Run an eight-week pilot for one grade, up to four teachers, and up to 60 learners for ₹24,900 + GST.
                Upgrade within 30 days of the review and we credit the pilot fee toward the annual plan.
              </p>
            </div>
            <a
              href={proposalMailto}
              onClick={() => trackSchoolCta('Request pilot proposal', 'pricing', '/contact')}
              className="inline-flex h-11 items-center justify-center rounded-full bg-orange-400 px-5 text-sm font-bold text-slate-950 transition hover:bg-orange-300"
            >
              Request pilot proposal
            </a>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-400">
            Pricing covers an annual, non-transferable licence for the agreed campus, teacher count, learner count,
            and content scope. It does not transfer ownership or permit resale, public sharing, or use by unlicensed campuses.
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
        <LeadCard>
          <LeadSectionHeading
            eyebrow="School partnership FAQs"
            title="Direct answers for principals and academic teams"
            description="Share this section internally when your leadership or procurement team is evaluating the program."
          />
          <div className="school-answer mt-6">
            <FAQSection items={faqItems} />
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
          actions={
            <CourseCTAGroup
              items={[
                ...primaryCtas.map((item) => ({
                  ...item,
                  onClick: () => trackSchoolCta(item.label, 'final cta', '/contact'),
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
                    className={`${className} border-white/30 bg-transparent text-white hover:bg-white/10`}
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
                    className={className}
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
