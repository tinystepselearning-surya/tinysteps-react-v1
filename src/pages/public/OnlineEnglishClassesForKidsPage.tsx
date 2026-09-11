import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PUBLIC_LEARNER_REACH_LABEL, PUBLIC_SESSION_DURATION_LABEL, PUBLIC_SITE_FACTS } from '../../config/publicFacts';
import { ONE_TO_ONE_MONTHLY_PACKAGES, PER_CLASS_PRICE, formatINR } from '../../config/pricing';
import { applySeo } from '../../lib/seo';
import { createCourseSchema, createFAQPageSchema, createWebPageSchema, PUBLIC_FACTS } from '../../lib/schemas';
import {
  CourseCTAGroup,
  FAQSection,
  FinalLeadCTA,
  LeadCard,
  LeadHero,
  LeadPageShell,
  LeadSection,
  LeadSectionHeading,
} from '../../components/marketing/LeadPageSections';

const canonicalPath = '/online-english-classes-for-kids';
const canonicalUrl = `${PUBLIC_FACTS.primaryWebsite}${canonicalPath}`;
const demoMinutes = PUBLIC_SITE_FACTS.standardOffer.demoDurationMinutes;
const starterPackage = ONE_TO_ONE_MONTHLY_PACKAGES.find((pkg) => pkg.id === 'starter');
const starterPackageFee = starterPackage?.monthlyFee ?? PER_CLASS_PRICE * 12;
const seoTitle = 'Online English Classes for Kids | Live 1:1 | Tiny Steps';
const seoDescription =
  'Live online English classes and 1:1 English tutoring for kids ages 3–12 in India and worldwide. Find the right phonics, reading, grammar, writing or speaking path after a free assessment.';

const ONLINE_ENGLISH_SEO_KEYWORDS = [
  'online English classes for kids',
  'online English classes for children',
  'live online English classes for kids',
  '1 to 1 English classes for kids online',
  'online English tutor for kids',
  '1 to 1 English tutor for kids online',
  'online English classes for kids ages 3 to 12',
  'online English classes for kids India',
  'online English classes for NRI kids',
  'online English classes for kids in UAE',
  'online English classes for kids in USA',
  'online English classes for kids in UK',
  'online English classes for kids in Australia',
  'online English classes for kids in Singapore',
  'online English classes for kids worldwide',
];

const trustChips = [
  { label: PUBLIC_LEARNER_REACH_LABEL, tone: 'warm' as const },
  { label: 'India + worldwide online access', tone: 'cool' as const },
  { label: 'Live 1:1 and small-group options', tone: 'neutral' as const },
  { label: 'Parent-visible progress updates', tone: 'mint' as const },
];

const heroStats = [
  { label: 'Pricing', value: formatINR(PER_CLASS_PRICE), helper: 'per standard 1:1 class' },
  { label: '12-class package', value: formatINR(starterPackageFee), helper: 'standard 1:1 pricing' },
  { label: 'Standard 1:1', value: PUBLIC_SESSION_DURATION_LABEL, helper: 'live teacher-guided class' },
  { label: 'Assessment first', value: 'Free', helper: `one ${demoMinutes}-minute 1:1 demo` },
];

const programmeTracks = [
  {
    title: 'Phonics',
    description: 'For children who need letter-sound knowledge, blending, decoding, spelling patterns, or an early reading pathway.',
    href: '/phonics',
    accent: 'from-[#fff6e9] to-[#ffffff]',
  },
  {
    title: 'Reading',
    description: 'For broader reading support across accuracy, connected reading, vocabulary, comprehension, and reading confidence.',
    href: '/reading-classes-for-kids',
    accent: 'from-[#eef8ff] to-[#ffffff]',
  },
  {
    title: 'Grammar',
    description: 'For sentence formation, parts of speech, tense control, articles, prepositions, punctuation, and grammar accuracy.',
    href: '/grammar',
    accent: 'from-[#f6f4ff] to-[#ffffff]',
  },
  {
    title: 'Writing',
    description: 'For idea development, paragraph organisation, creative writing, school answers, editing, and independent written expression.',
    href: '/writing-classes-for-kids',
    accent: 'from-[#fff8ef] to-[#ffffff]',
  },
  {
    title: 'Spoken English',
    description: 'For everyday conversation, fuller spoken responses, vocabulary in use, and conversational English fluency.',
    href: '/spoken-english-classes-for-kids-online',
    accent: 'from-[#ecfdf5] to-[#ffffff]',
  },
  {
    title: 'Public Speaking & Communication',
    description: 'For structured answers, storytelling, show-and-tell, classroom communication, presentations, and audience awareness.',
    href: '/speaking',
    accent: 'from-[#fff0f3] to-[#ffffff]',
  },
];

const tutorDecisionPoints = [
  {
    title: 'Individual teacher attention',
    detail: 'A live 1:1 class gives one child the teacher’s attention for the session, so pacing, prompts and guided practice can respond to the child in real time.',
  },
  {
    title: 'Assessment-led starting point',
    detail: 'The first recommendation follows the child’s current English need instead of assuming every learner should begin with the same topic or level.',
  },
  {
    title: 'Live correction and guided retries',
    detail: 'The teacher can notice errors while the child is reading, speaking, building sentences or writing and guide another attempt during the class.',
  },
  {
    title: 'Parent-visible progress',
    detail: 'Parents can follow the recommended programme and progress updates rather than relying only on completed worksheets or app activity.',
  },
];

const outcomeStages = [
  {
    stage: 'Ages 3 to 5',
    points: ['Sound and listening foundations', 'Early letter-sound awareness and blending readiness', 'Simple spoken responses'],
  },
  {
    stage: 'Ages 6 to 8',
    points: ['Stronger word and sentence reading', 'Grammar in complete sentences', 'Longer classroom answers'],
  },
  {
    stage: 'Ages 9 to 12',
    points: ['Reading comprehension', 'Writing structure and editing', 'Confident speaking and presentation readiness'],
  },
];

const internationalMarkets = [
  ['UAE', 'Live online English support with suitable Gulf-timezone slots when available.'],
  ['United States', '1:1 online English tutoring across phonics, reading, grammar and speaking goals.'],
  ['United Kingdom', 'Structured English support for families looking for live teacher-led learning from home.'],
  ['Australia', 'Online classes with timing confirmed around family and teacher availability.'],
  ['Singapore', 'Live support across reading, grammar, writing and communication goals.'],
  ['NRI families', 'India-based online English teaching with programme and timing fit confirmed before enrolment.'],
];

const faqItems = [
  {
    question: 'How do I know which English class my child needs first?',
    answer:
      `Tiny Steps starts with one free ${demoMinutes}-minute 1:1 online demo assessment class to identify whether the main need is phonics, reading, grammar, writing, spoken English, public speaking and communication, or specialist confidence-building support.`,
  },
  {
    question: 'Do you offer one-on-one English classes or an online English tutor for kids?',
    answer:
      `Yes. Tiny Steps offers live 1:1 online English learning and may also offer small-group options. In a 1:1 class, one child works live with the teacher, who can focus the session on the child’s assessed starting point and current skill goal. Standard 1:1 classes are ${PUBLIC_SESSION_DURATION_LABEL}; small-group duration varies with group size.`,
  },
  {
    question: 'What is the difference between an online English tutor and an online English class at Tiny Steps?',
    answer:
      'On this page, “online English tutor” describes the live 1:1 teaching format, while the programme describes what the child needs to learn. The assessment identifies whether the best starting path is phonics, reading, grammar, writing, spoken English, or public speaking and communication.',
  },
  {
    question: 'Should I choose a general English tutor or a subject-specific English programme?',
    answer:
      'Choose the broad English starting point when you want individual English support but the main gap is not yet clear. If you already know the child specifically needs phonics, reading, grammar, writing, spoken English, or speaking and communication support, use that specialist programme so the learning goal stays clear.',
  },
  {
    question: 'Can online English classes help if my child is shy or gives short answers?',
    answer:
      'Sometimes. If everyday English conversation or fluency is the main need, Spoken English is the clearer programme. If confidence itself is the primary barrier despite adequate language for the task, the specialist Confidence Building programme may fit better. The assessment helps separate these needs.',
  },
  {
    question: 'What is the pricing preview for parents?',
    answer:
      `The current standard 1:1 price is ${formatINR(PER_CLASS_PRICE)} per class and ${formatINR(starterPackageFee)} for 12 classes. Parents can review the full pricing page after the free assessment confirms the right starting path.`,
  },
  {
    question: 'Do you support NRI families and children outside India?',
    answer:
      'Yes. Tiny Steps teaches families in India and worldwide. Parents in the UAE, United States, United Kingdom, Australia, Singapore and other countries can enquire for compatible live class timings, subject to teacher and slot availability.',
  },
  {
    question: 'Do you create separate courses for each country?',
    answer:
      'No country-specific course is required simply because a family lives abroad. Tiny Steps first identifies the child’s English learning need, then confirms programme level and a suitable live schedule for the family.',
  },
];

export default function OnlineEnglishClassesForKidsPage() {
  useEffect(() => {
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
        { '@type': 'ListItem', position: 2, name: 'Courses', item: 'https://tinystepslearning.com/courses' },
        { '@type': 'ListItem', position: 3, name: 'Online English Classes for Kids', item: canonicalUrl },
      ],
    };

    const webpageSchema = {
      ...createWebPageSchema({
        name: 'Online English Classes for Kids',
        description: seoDescription,
        url: canonicalUrl,
      }),
      '@id': `${canonicalUrl}#webpage`,
    };

    const courseSchema = createCourseSchema({
      name: 'Online English Classes for Kids',
      description:
        'Live online English classes and 1:1 English tutoring for children ages 3–12 in India and worldwide, with assessment-led placement into phonics, reading, grammar, writing, spoken English, or public speaking and communication.',
      url: canonicalUrl,
      educationalLevel: 'English support for children ages 3–12',
      teaches: [
        'phonics',
        'reading',
        'grammar',
        'writing',
        'sentence formation',
        'spoken English',
        'public speaking',
        'communication skills',
      ],
      areaServed: ['India', 'Worldwide'],
    });

    const faqSchema = {
      ...createFAQPageSchema(faqItems),
      '@id': `${canonicalUrl}#faq`,
    };

    applySeo({
      title: seoTitle,
      description: seoDescription,
      canonicalPath,
      ogType: 'website',
      keywords: ONLINE_ENGLISH_SEO_KEYWORDS,
      robots: 'index,follow',
      jsonLd: [breadcrumbSchema, webpageSchema, courseSchema, faqSchema],
    });
  }, []);

  return (
    <LeadPageShell>
      <LeadHero
        eyebrow="Ages 3–12 • India, NRI and worldwide"
        title="Online English Classes for Kids"
        description={
          <>
            <p>
              Tiny Steps offers live online English classes for children ages 3–12 in India and worldwide, with live 1:1 teaching and selected small-group options across phonics, reading, grammar, writing, spoken English, and public speaking and communication.
            </p>
            <p className="mt-3">
              Parents who are not yet sure which English programme fits can begin with one free {demoMinutes}-minute 1:1 assessment, then review the recommended owner programme, transparent pricing, class samples, and compatible timings before enrolment.
            </p>
          </>
        }
        trustChips={trustChips}
        stats={heroStats}
        supportingText={
          <>
            Looking specifically for local Hyderabad context? Visit{' '}
            <Link to="/online-english-classes-hyderabad" className="font-semibold underline underline-offset-4">
              online English classes for kids in Hyderabad
            </Link>
            .
          </>
        }
        actions={
          <CourseCTAGroup
            items={[
              { to: '/book-demo', label: `Book Free ${demoMinutes}-Minute Demo`, variant: 'primary' },
              { to: '/pricing', label: 'See Pricing', variant: 'ghost' },
              { to: '/class-samples', label: 'See Class Samples', variant: 'secondary' },
            ]}
            renderLink={(item, className) => (
              <Link key={item.label} to={item.to || '/'} className={className}>
                {item.label}
              </Link>
            )}
          />
        }
        aside={
          <LeadCard className="overflow-hidden bg-[linear-gradient(145deg,#0f172a_0%,#172554_48%,#1d3557_100%)] text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Why parents choose Tiny Steps</p>
            <div className="mt-4 grid gap-3">
              {[
                'Structured pathways instead of broad tuition coverage',
                `One free ${demoMinutes}-minute 1:1 demo assessment before recommending the first class plan`,
                'Live 1:1 teaching with small-group options for selected fits',
                'Class samples, pricing clarity, and parent-visible progress',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm leading-7 text-slate-100">
                  {item}
                </div>
              ))}
            </div>
          </LeadCard>
        }
      />

      <LeadSection>
        <LeadCard>
          <LeadSectionHeading
            eyebrow="Who this is for"
            title="Parents comparing structured English support, not generic tuition"
            description="This is the canonical broad English page for online English classes, live 1:1 English tutoring, and worldwide/NRI family searches."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              'Parents looking for online English classes for children instead of broad after-school tuition.',
              'Children who need phonics, reading, grammar, writing, spoken-English, or public-speaking and communication support inside one structured learning system.',
              'Families comparing live 1:1 English tutoring and small-group options before deciding.',
              'Parents in India or abroad who want visible progress, transparent pricing, and a clear next step.',
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm leading-7 text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection>
        <LeadCard className="bg-[linear-gradient(150deg,#eef8ff_0%,#ffffff_48%,#fff8ef_100%)]">
          <LeadSectionHeading
            eyebrow="Live 1:1 English tutoring"
            title="What parents get from an online English tutor for kids"
            description="For parents using tutor-style searches, Tiny Steps treats tutoring as live 1:1 teacher-led support inside the same assessment-first English programme system."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {tutorDecisionPoints.map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-700">{item.detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white/90 p-5">
            <h3 className="text-lg font-semibold text-slate-900">General English tutor or subject-specific support?</h3>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              Use this broad English page when you want a live 1:1 English tutor but are not yet sure whether the main gap is phonics, reading, grammar, writing, spoken English, or public speaking and communication. If the need is already clear, the subject programme should remain the primary page rather than competing with this generic tutor owner.
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-slate-900">
              <Link to="/phonics" className="underline underline-offset-4">Phonics support</Link>
              <Link to="/reading-classes-for-kids" className="underline underline-offset-4">Reading support</Link>
              <Link to="/grammar" className="underline underline-offset-4">Grammar support</Link>
              <Link to="/writing-classes-for-kids" className="underline underline-offset-4">Writing support</Link>
              <Link to="/spoken-english-classes-for-kids-online" className="underline underline-offset-4">Spoken English support</Link>
              <Link to="/speaking" className="underline underline-offset-4">Speaking & communication</Link>
            </div>
          </div>
          <p className="mt-5 text-sm leading-7 text-slate-600">
            A 1:1 format is especially useful when a child needs more individual speaking time, immediate correction, a pace matched to their current level, or a clearer starting recommendation. Small-group classes remain an option for selected fits.
          </p>
        </LeadCard>
      </LeadSection>

      <LeadSection>
        <LeadSectionHeading
          eyebrow="Programme tracks"
          title="Choose the right starting path"
          description="Tiny Steps uses one system across the main learning needs parents usually search for first."
        />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {programmeTracks.map((track) => (
            <LeadCard key={track.title} className={`bg-gradient-to-br ${track.accent}`}>
              <h3 className="text-xl font-semibold text-slate-900">{track.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-700">{track.description}</p>
              <Link to={track.href} className="mt-4 inline-flex text-sm font-semibold text-slate-900 underline underline-offset-4">
                Explore {track.title}
              </Link>
            </LeadCard>
          ))}
        </div>
      </LeadSection>

      <LeadSection>
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <LeadCard>
            <LeadSectionHeading
              eyebrow="Outcomes by age and stage"
              title="English goals change across ages 3–12"
              description="These are broad examples of how goals may change with age, not fixed programme levels. Assessment still determines the correct subject and starting point."
            />
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {outcomeStages.map((item) => (
                <div key={item.stage} className="rounded-2xl border border-slate-200 bg-slate-50/75 p-5">
                  <h3 className="text-lg font-semibold text-slate-900">{item.stage}</h3>
                  <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-700">
                    {item.points.map((point) => (
                      <li key={point}>• {point}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </LeadCard>

          <LeadCard className="bg-[linear-gradient(160deg,#fff8ef_0%,#ffffff_45%,#eef8ff_100%)]">
            <LeadSectionHeading
              eyebrow="Trust proof"
              title="What parents want to know before booking"
              description="This page is built for families looking for one broad India-and-worldwide online English entry point, not a duplicated country or city landing page."
            />
            <div className="mt-5 space-y-3">
              {[
                PUBLIC_LEARNER_REACH_LABEL,
                'India + worldwide online access',
                'Live teacher-led learning',
                'Class samples available before parents decide',
                'Parent-visible progress updates after classes begin',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white bg-white/90 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                  {item}
                </div>
              ))}
            </div>
          </LeadCard>
        </div>
      </LeadSection>

      <LeadSection>
        <LeadCard>
          <LeadSectionHeading
            eyebrow="International access"
            title="Online English classes for NRI and worldwide families"
            description="We use one global programme owner rather than creating thin country pages. The child’s need and a workable live schedule matter more than a duplicated country landing page."
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {internationalMarkets.map(([market, detail]) => (
              <div key={market} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <h3 className="font-semibold text-slate-900">{market}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-700">{detail}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm leading-7 text-slate-600">
            Timing availability varies. Parents can share their country/time zone during the enquiry and our team will confirm suitable available slots.
          </p>
        </LeadCard>
      </LeadSection>

      <LeadSection>
        <div className="grid gap-5 lg:grid-cols-2">
          <LeadCard>
            <LeadSectionHeading
              eyebrow="How it works"
              title={`How the free ${demoMinutes}-minute 1:1 online demo assessment works`}
              description="Parents get a recommendation before they spend time or money."
            />
            <ol className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
              <li>1. Parents share the child’s age, current concerns, country/time zone, and goals.</li>
              <li>2. Tiny Steps checks the relevant phonics, reading, grammar, writing, spoken-English, public-speaking, communication, or confidence need.</li>
              <li>3. Families receive a recommended starting path with next-step guidance.</li>
              <li>4. Parents then review pricing and available schedule fit with context.</li>
            </ol>
          </LeadCard>

          <LeadCard className="bg-[linear-gradient(150deg,#ecfdf5_0%,#ffffff_50%,#fff8ef_100%)]">
            <LeadSectionHeading
              eyebrow="Pricing preview"
              title="Transparent standard 1:1 pricing before enrolment"
              description="Simple pricing helps parents compare options without hidden course language."
            />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Per class</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{formatINR(PER_CLASS_PRICE)}</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">12 classes</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{formatINR(starterPackageFee)}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-700">
              Standard 1:1 classes are {PUBLIC_SESSION_DURATION_LABEL}. Small-group duration varies with group size. Review all available formats and packages on the{' '}
              <Link to="/pricing" className="font-semibold underline underline-offset-4">
                pricing page
              </Link>.
            </p>
          </LeadCard>
        </div>
      </LeadSection>

      <LeadSection>
        <LeadCard>
          <LeadSectionHeading
            eyebrow="Explore the exact programme"
            title="Move from the broad English page to the right specialist owner"
            description="These links keep broad English, subject-specific classes, local Hyderabad intent, pricing and demo intent clearly separated."
          />
          <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold text-slate-900">
            {[
              ['/phonics', 'Online phonics classes'],
              ['/reading-classes-for-kids', 'Reading classes for kids'],
              ['/grammar', 'Grammar classes for kids'],
              ['/writing-classes-for-kids', 'Writing classes for kids'],
              ['/spoken-english-classes-for-kids-online', 'Spoken English classes'],
              ['/speaking', 'Public speaking & communication'],
              ['/confidence-building-program-kids', 'Confidence building'],
              ['/pricing', 'Pricing'],
              ['/online-english-classes-hyderabad', 'Hyderabad page'],
            ].map(([href, label]) => (
              <Link key={href} to={href} className="rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm hover:border-slate-300">
                {label}
              </Link>
            ))}
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection>
        <LeadCard>
          <LeadSectionHeading eyebrow="Parents also ask" title="Frequently asked questions" />
          <div className="mt-6">
            <FAQSection
              items={faqItems.map((item) => ({
                question: item.question,
                answer: item.answer,
              }))}
            />
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection>
        <FinalLeadCTA
          title="Ready to choose the right English starting point for your child?"
          description={
            <>
              Start with one free {demoMinutes}-minute 1:1 online demo assessment, then review pricing and the recommended path for phonics, reading, grammar, writing, spoken English, public speaking and communication, or specialist confidence support.
            </>
          }
          actions={
            <CourseCTAGroup
              items={[
                { to: '/book-demo', label: `Book Free ${demoMinutes}-Minute Demo`, variant: 'primary' },
                { to: '/pricing', label: 'See Pricing', variant: 'ghost' },
              ]}
              renderLink={(item, className) => (
                <Link key={item.label} to={item.to || '/'} className={className}>
                  {item.label}
                </Link>
              )}
            />
          }
        />
      </LeadSection>
    </LeadPageShell>
  );
}
