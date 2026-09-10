import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { createCourseSchema, createFAQPageSchema, PUBLIC_FACTS } from '../../lib/schemas';
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

const ONLINE_ENGLISH_SEO_KEYWORDS = [
  'online English classes for kids',
  '1 to 1 English classes for kids online',
  'online English tutor for kids',
  'English tutor for NRI kids',
  'online English classes for NRI kids',
  'online English classes for kids in UAE',
  'online English classes for kids in USA',
  'online English classes for kids in UK',
  'online English classes for kids in Australia',
  'online English classes for kids in Singapore',
];

const trustChips = [
  { label: '5000+ students served', tone: 'warm' as const },
  { label: 'Families in 15+ countries', tone: 'cool' as const },
  { label: 'Live 1:1 and small-group options', tone: 'neutral' as const },
  { label: 'Weekly parent updates', tone: 'mint' as const },
];

const heroStats = [
  { label: 'Pricing', value: '₹400', helper: 'per standard 1:1 class' },
  { label: 'Parent pack', value: '₹4,800', helper: 'for 12 classes' },
  { label: 'Standard 1:1', value: '35 min', helper: 'live teacher-guided class' },
  { label: 'Assessment first', value: 'Free', helper: 'before enrolment' },
];

const programmeTracks = [
  {
    title: 'Phonics',
    description: 'For children who know letters but need blending, decoding, and an early reading system that actually sticks.',
    href: '/phonics',
    accent: 'from-[#fff6e9] to-[#ffffff]',
  },
  {
    title: 'Reading',
    description: 'For children who read slowly, forget words, or need fluency, comprehension, and reading-aloud confidence.',
    href: '/reading-classes-for-kids',
    accent: 'from-[#eef8ff] to-[#ffffff]',
  },
  {
    title: 'Grammar & writing',
    description: 'For sentence structure, tense clarity, school-answer confidence, paragraph writing, and clearer written expression.',
    href: '/grammar',
    accent: 'from-[#f6f4ff] to-[#ffffff]',
  },
  {
    title: 'Spoken English & public speaking',
    description: 'For sentence expansion, English fluency, confident responses, clearer expression, storytelling, and presentations.',
    href: '/speaking',
    accent: 'from-[#fff0f3] to-[#ffffff]',
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
      'Tiny Steps starts with a free 35-minute 1:1 online demo assessment class to check whether the main gap is phonics, reading, grammar, writing, sentence formation, or spoken English confidence.',
  },
  {
    question: 'Do you offer one-on-one English classes or an online English tutor for kids?',
    answer:
      'Yes. Tiny Steps offers live 1:1 online English learning and may also offer small-group options. The standard 1:1 class is 35 minutes, with the learning path chosen after assessment.',
  },
  {
    question: 'Can online English classes help if my child is shy or gives short answers?',
    answer:
      'Yes. Children who understand English but do not speak confidently often need guided sentence expansion, structured speaking turns, and low-pressure confidence building.',
  },
  {
    question: 'What is the pricing preview for parents?',
    answer:
      'The current standard 1:1 price is ₹400 per class and ₹4,800 for 12 classes. Parents can review the full pricing page after the free assessment confirms the right starting path.',
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

    const courseSchema = createCourseSchema({
      name: 'Online English Classes for Kids',
      description:
        'Live online English classes and 1:1 English tutoring for kids in India and worldwide covering phonics, reading, grammar, writing, spoken English, and public speaking confidence.',
      url: canonicalUrl,
      educationalLevel: 'English support for children ages 3–12',
      teaches: [
        'phonics',
        'reading fluency',
        'grammar',
        'writing',
        'sentence formation',
        'spoken English',
        'public speaking confidence',
      ],
      areaServed: ['India', 'Worldwide'],
    });

    const faqSchema = {
      ...createFAQPageSchema(faqItems),
      '@id': `${canonicalUrl}#faq`,
    };

    applySeo({
      title: 'Online English Classes for Kids in India and Worldwide | Tiny Steps',
      description:
        'Live online English classes and 1:1 English tutoring for kids ages 3–12. Phonics, reading, grammar, writing and speaking support for India, NRI and worldwide families.',
      canonicalPath,
      ogType: 'website',
      keywords: ONLINE_ENGLISH_SEO_KEYWORDS,
      jsonLd: [breadcrumbSchema, courseSchema, faqSchema],
    });
  }, []);

  return (
    <LeadPageShell>
      <LeadHero
        eyebrow="Ages 3–12 • India, NRI and worldwide"
        title="Online English Classes for Kids: Live 1:1 and Small-Group Support"
        description={
          <>
            <p>
              Tiny Steps offers live online English classes for kids who need a clear path across phonics, reading, grammar, writing, spoken English, and presentation confidence.
            </p>
            <p className="mt-3">
              Parents looking for a live 1:1 English tutor can begin with one free 35-minute assessment, then review the recommended programme, transparent pricing, class samples, and compatible timings before enrolment.
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
              { to: '/book-demo', label: 'Book Free 35-Minute Demo', variant: 'primary' },
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
                'One free 35-minute 1:1 demo assessment before recommending the first class plan',
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
              'Children who need phonics, reading, grammar, writing, or spoken-English support inside one structured learning system.',
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
              description="Tiny Steps does not use the same classroom expectations for every age band."
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
              description="This page is built for families looking for a national or global online English solution, not only a local city page."
            />
            <div className="mt-5 space-y-3">
              {[
                '5000+ students served',
                'Families in 15+ countries',
                'Live teacher-led learning',
                'Class samples available before parents decide',
                'Weekly parent updates after classes begin',
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
              title="How the free 35-minute 1:1 online demo assessment works"
              description="Parents get a recommendation before they spend time or money."
            />
            <ol className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
              <li>1. Parents share the child’s age, current concerns, country/time zone, and goals.</li>
              <li>2. Tiny Steps checks the relevant phonics, reading, grammar, writing, sentence-formation, or speaking skills.</li>
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
                <p className="mt-2 text-3xl font-bold text-slate-900">₹400</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">12 classes</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">₹4,800</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-700">
              The standard 1:1 class is 35 minutes. Review all available formats and packages on the{' '}
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
              Start with a free 35-minute 1:1 online demo assessment, then review pricing and the recommended path for phonics, reading, grammar, writing, spoken English, or communication.
            </>
          }
          actions={
            <CourseCTAGroup
              items={[
                { to: '/book-demo', label: 'Book Free 35-Minute Demo', variant: 'primary' },
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
