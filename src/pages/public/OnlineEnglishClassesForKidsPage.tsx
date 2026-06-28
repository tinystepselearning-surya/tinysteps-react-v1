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

const trustChips = [
  { label: '5000+ students served', tone: 'warm' as const },
  { label: 'Families in 15+ countries', tone: 'cool' as const },
  { label: '1:1 and small-group options', tone: 'neutral' as const },
  { label: 'Weekly parent updates', tone: 'mint' as const },
];

const heroStats = [
  { label: 'Pricing', value: '₹400', helper: 'per class' },
  { label: 'Parent pack', value: '₹4,800', helper: 'for 12 classes' },
  { label: 'Assessment first', value: 'Free', helper: 'before enrollment' },
  { label: 'Delivery', value: 'Live', helper: '1:1 and small-group classes' },
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
    title: 'Grammar',
    description: 'For sentence structure, tense clarity, school-answer confidence, and writing that feels more organized.',
    href: '/grammar',
    accent: 'from-[#f6f4ff] to-[#ffffff]',
  },
  {
    title: 'Spoken English and public speaking',
    description: 'For sentence expansion, confident responses, clearer expression, and children who stay too quiet in class.',
    href: '/speaking',
    accent: 'from-[#fff0f3] to-[#ffffff]',
  },
];

const outcomeStages = [
  {
    stage: 'Ages 4 to 6',
    points: ['Letter-sound awareness', 'Early blending and word reading', 'Simple spoken responses'],
  },
  {
    stage: 'Ages 6 to 9',
    points: ['Stronger reading fluency', 'Grammar in complete sentences', 'Longer classroom answers'],
  },
  {
    stage: 'Ages 9 to 13',
    points: ['Reading comprehension', 'Writing structure', 'Confident speaking and presentation readiness'],
  },
];

const faqItems = [
  {
    question: 'How do I know which English class my child needs first?',
    answer:
      'Tiny Steps starts with a free assessment to check whether the main gap is phonics, reading, grammar, sentence formation, or spoken English confidence.',
  },
  {
    question: 'Do you offer one-on-one English classes for kids?',
    answer:
      'Yes. Tiny Steps offers both 1:1 and small-group live online classes, depending on the child’s needs and the parent’s preference.',
  },
  {
    question: 'Can online English classes help if my child is shy or gives short answers?',
    answer:
      'Yes. Children who understand English but do not speak confidently often need guided sentence expansion, structured speaking turns, and low-pressure confidence building.',
  },
  {
    question: 'What is the pricing preview for parents?',
    answer:
      'The current approved pricing preview is ₹400 per class and ₹4,800 for 12 classes. Parents can review pricing after the free assessment confirms the right starting path.',
  },
  {
    question: 'Do you support families outside India?',
    answer:
      'Yes. Tiny Steps teaches families in India and worldwide through live online English classes.',
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
        'Live online English classes for kids in India and worldwide covering phonics, reading, grammar, spoken English, and public speaking confidence.',
      url: canonicalUrl,
      educationalLevel: 'Beginner to advanced school-age English support',
      teaches: [
        'phonics',
        'reading fluency',
        'grammar',
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
        'Live online English classes for kids with phonics, reading, grammar, spoken English, and confidence-building support. Book a free assessment and review transparent pricing.',
      canonicalPath,
      ogType: 'website',
      jsonLd: [breadcrumbSchema, courseSchema, faqSchema],
    });
  }, []);

  return (
    <LeadPageShell>
      <LeadHero
        eyebrow="India and worldwide"
        title="Online English Classes for Kids That Build Reading, Grammar and Speaking Confidence"
        description={
          <>
            <p>
              Tiny Steps offers live 1:1 and small-group online English classes for kids who need a clear path across phonics, reading, grammar, spoken English, and presentation confidence.
            </p>
            <p className="mt-3">
              Parents start with a free assessment, see transparent pricing, review class samples, and get visible progress through weekly updates instead of generic tuition promises.
            </p>
          </>
        }
        trustChips={trustChips}
        stats={heroStats}
        supportingText={
          <>
            Looking for a Hyderabad-focused page instead? Visit{' '}
            <Link to="/online-english-classes-hyderabad" className="font-semibold underline underline-offset-4">
              online English classes for kids in Hyderabad
            </Link>
            .
          </>
        }
        actions={
          <CourseCTAGroup
            items={[
              { to: '/book-demo', label: 'Book Free Assessment', variant: 'primary' },
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
                'Free assessment before recommending the first class plan',
                'Founder and teacher-led learning quality',
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
            title="Parents comparing English help, not generic tuition"
            description="This page is designed for parents looking for online English classes for children, one-on-one English classes for kids, or a stronger English tutor experience online."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              'Parents looking for online English classes for children instead of broad after-school tuition.',
              'Children who need phonics, reading, grammar, or spoken-English support inside one structured learning system.',
              'Families comparing one-on-one English classes for kids and small-group options before deciding.',
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
              title="The learning goal changes as the child grows"
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
                'Founder and teacher-led learning approach',
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
        <div className="grid gap-5 lg:grid-cols-2">
          <LeadCard>
            <LeadSectionHeading
              eyebrow="How it works"
              title="How the free assessment works"
              description="Parents get a recommendation before they spend time or money."
            />
            <ol className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
              <li>1. Parents share the child’s age, current concerns, and goals.</li>
              <li>2. Tiny Steps checks reading, grammar, sentence formation, and speaking readiness.</li>
              <li>3. Families receive a practical recommended starting path with next-step guidance.</li>
              <li>4. Parents then review pricing, class samples, and schedule fit with context.</li>
            </ol>
          </LeadCard>

          <LeadCard className="bg-[linear-gradient(150deg,#ecfdf5_0%,#ffffff_50%,#fff8ef_100%)]">
            <LeadSectionHeading
              eyebrow="Pricing preview"
              title="Transparent pricing before enrollment"
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
              Parents can review the full{' '}
              <Link to="/pricing" className="font-semibold underline underline-offset-4">
                pricing page
              </Link>{' '}
              and open{' '}
              <Link to="/class-samples" className="font-semibold underline underline-offset-4">
                class samples
              </Link>{' '}
              after the assessment confirms the right fit.
            </p>
          </LeadCard>
        </div>
      </LeadSection>

      <LeadSection>
        <LeadCard>
          <LeadSectionHeading
            eyebrow="Internal links"
            title="Explore the most relevant next pages"
            description="These links keep the national page distinct while still helping parents reach the exact subject or city page they need."
          />
          <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold text-slate-900">
            {[
              ['/phonics', 'Online phonics classes'],
              ['/grammar', 'Grammar classes for kids'],
              ['/speaking', 'Speaking and confidence classes'],
              ['/reading-classes-for-kids', 'Reading classes for kids'],
              ['/pricing', 'Pricing'],
              ['/class-samples', 'Class samples'],
              ['/contact', 'Contact Tiny Steps'],
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
          <LeadSectionHeading eyebrow="Parents also ask" title="FAQs" />
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
              Start with a free assessment, then review pricing, class samples, and the recommended path for phonics, reading, grammar, or speaking confidence.
            </>
          }
          actions={
            <CourseCTAGroup
              items={[
                { to: '/book-demo', label: 'Book Free Assessment', variant: 'primary' },
                { to: '/class-samples', label: 'See Class Samples', variant: 'ghost' },
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
