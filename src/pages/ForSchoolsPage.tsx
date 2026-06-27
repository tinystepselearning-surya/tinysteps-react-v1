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
const schoolsWhatsAppUrl =
  'https://wa.me/919618398383?text=Hi%20Tiny%20Steps!%20I%20want%20to%20explore%20a%20school%20partnership.';

const faqItems = [
  {
    question: 'What kind of schools or learning centres can partner with Tiny Steps?',
    answer:
      'Tiny Steps supports IB, CBSE, ICSE, and international schools or learning centres that want stronger phonics, grammar, reading, and speaking outcomes.',
  },
  {
    question: 'Does Tiny Steps offer 1:1 or group formats for schools?',
    answer:
      'Yes. Schools can explore 1:1 interventions, small-group support, after-school clubs, or focused pilot cohorts depending on timetable and learning goals.',
  },
  {
    question: 'How does a school partnership usually begin?',
    answer:
      'Most partnerships begin with a short discovery call, a small pilot, and clear observations before deciding how and where to scale.',
  },
  {
    question: 'What reporting do school leaders receive?',
    answer:
      'School leaders receive practical progress reporting, attendance visibility, and parent-communication support so the partnership stays easy to explain internally.',
  },
];

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
    { '@type': 'ListItem', position: 2, name: 'For Schools', item: canonicalUrl },
  ],
};

const pageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': `${canonicalUrl}#webpage`,
  name: 'English Program for Schools | Tiny Steps Learning',
  description:
    'School partnership overview for phonics, grammar, reading, and public speaking support through Tiny Steps.',
  url: canonicalUrl,
  inLanguage: 'en-IN',
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': `${canonicalUrl}#faq`,
  mainEntity: faqItems.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
};

const partnershipCards = [
  {
    title: 'Pilot-first rollout',
    detail: 'Start with a selected cohort, gather teacher observations, and scale only after the model proves useful in your context.',
  },
  {
    title: 'School-friendly scheduling',
    detail: 'Partnerships can fit inside English periods, lab blocks, after-school clubs, or exam-bridge schedules.',
  },
  {
    title: 'Dashboards and reporting',
    detail: 'Leadership gets clear visibility into attendance, progress, and parent-facing communication needs.',
  },
  {
    title: 'Premium parent trust',
    detail: 'Families already know Tiny Steps through structured pathways, teacher kindness, and progress-led communication.',
  },
];

const pilotModel = [
  {
    step: '1. Discovery call',
    detail: 'We align on board, grade range, English goals, parent expectations, and timetable constraints.',
  },
  {
    step: '2. Cohort selection',
    detail: 'Choose a grade, intervention group, or after-school cohort where stronger English outcomes are most urgent.',
  },
  {
    step: '3. Pilot launch',
    detail: 'Run a 4-8 week pilot with phonics, grammar, reading, or speaking pathways matched to the school need.',
  },
  {
    step: '4. Review and scale',
    detail: 'Leadership reviews reporting, parent response, and classroom outcomes before expanding to more students.',
  },
];

const solutionCards = [
  {
    title: 'Foundational reading support',
    detail: 'Phonics pathways for children who need stronger decoding, blending, reading confidence, or spelling support.',
    link: '/courses/phonics-foundation',
    label: 'Phonics Foundation',
  },
  {
    title: 'Grammar and writing improvement',
    detail: 'Structured grammar support for cleaner sentence work, better writing accuracy, and stronger school answers.',
    link: '/courses/grammar',
    label: 'Beginner Grammar',
  },
  {
    title: 'Speaking and presentation confidence',
    detail: 'Communication pathways for students who need longer answers, more confidence, and clearer oral expression.',
    link: '/courses/public-speaking-foundations',
    label: 'Speaking Foundations',
  },
];

const leadershipStats = [
  { label: 'Students served', value: '5000+', helper: 'Across phonics, grammar, reading, and speaking pathways' },
  { label: 'Countries reached', value: '15+', helper: 'Useful for schools serving global or mobile families' },
  { label: 'Model options', value: '1:1 + groups', helper: 'Flexible for intervention and enrichment use cases' },
  { label: 'Partnership style', value: 'Pilot first', helper: 'School leaders can validate fit before wider rollout' },
];

const ForSchoolsPage: React.FC = () => {
  const ctaItems = [
    {
      label: 'WhatsApp Partnership Desk',
      href: schoolsWhatsAppUrl,
      variant: 'secondary' as const,
      onClick: () =>
        trackCoursePageCtaClick({
          page_path: '/for-schools',
          cta_label: 'WhatsApp school partnership',
          cta_location: 'hero',
          destination_path: '/contact',
        }),
    },
    {
      label: 'Talk to Academic Partnerships',
      href: `${PUBLIC_CONTACT_MAILTO}?subject=School%20Partnership%20Inquiry`,
      variant: 'primary' as const,
      onClick: () =>
        trackCoursePageCtaClick({
          page_path: '/for-schools',
          cta_label: 'Talk to Academic Partnerships',
          cta_location: 'hero',
          destination_path: '/contact',
        }),
    },
  ];

  return (
    <LeadPageShell>
      <Meta
        title="Tiny Steps for Schools – Premium English Partnerships for Ages 3-12"
        description="Partner with Tiny Steps to bring phonics, grammar, reading, and speaking support to your school through pilot-first English programs, practical reporting, and parent-trust communication."
        canonical={canonicalUrl}
        jsonLd={[breadcrumbSchema, pageSchema, faqSchema]}
      />

      <LeadHero
        eyebrow="Tiny Steps • School Partnerships"
        title="English Program Partnerships for Schools and Learning Centres"
        description={
          <>
            A stronger English support model for school leaders who want measurable reading, writing, and
            communication gains without forcing a risky full-scale rollout on day one. Tiny Steps combines
            phonics, grammar, reading, and speaking pathways with pilot-first planning, reporting, and
            parent-friendly communication.
          </>
        }
        trustChips={[
          { label: 'IB, CBSE, ICSE, international', tone: 'warm' },
          { label: 'Pilot-first rollout', tone: 'cool' },
          { label: 'Dashboards and reporting', tone: 'neutral' },
          { label: 'Parent trust built in', tone: 'mint' },
        ]}
        supportingText="This page is written for principals, coordinators, HODs, and school founders who need a serious partnership page rather than a parent-facing public course pitch."
        stats={leadershipStats}
        actions={
          <CourseCTAGroup
            items={ctaItems}
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
          <LeadCard className="bg-[linear-gradient(150deg,rgba(255,255,255,0.98),rgba(248,251,255,0.94),rgba(255,250,244,0.92))]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Why school leaders reach out</p>
            <ul className="mt-4 space-y-3 text-sm font-medium text-slate-800">
              {[
                'Reading and speaking gaps show up clearly but internal capacity is stretched.',
                'Parents want visible English progress, not vague reassurance.',
                'The school wants a pilot that can be reviewed before scaling.',
                'Leadership needs reporting, not just external teaching.',
              ].map((item) => (
                <li key={item} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>
          </LeadCard>
        }
      />

      <LeadSection>
        <LeadCard className="bg-gradient-to-br from-white via-orange-50/40 to-sky-50/40">
          <LeadSectionHeading
            eyebrow="Partnership strengths"
            title="Why this partnership model feels safer for schools"
            description="The page is designed to help leadership understand the operating model, not just the curriculum promise."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {partnershipCards.map((item) => (
              <LeadCard key={item.title} className="border-slate-100 bg-white">
                <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-700">{item.detail}</p>
              </LeadCard>
            ))}
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection>
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <LeadCard>
            <LeadSectionHeading
              eyebrow="Pilot model"
              title="How a Tiny Steps school partnership typically runs"
              description="Start with a small, defensible pilot. Expand only after you have useful evidence."
            />
            <div className="mt-5 space-y-3">
              {pilotModel.map((item) => (
                <div key={item.step} className="rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-4">
                  <h3 className="text-base font-semibold text-slate-900">{item.step}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-700">{item.detail}</p>
                </div>
              ))}
            </div>
          </LeadCard>

          <LeadCard className="bg-slate-900 text-white">
            <LeadSectionHeading
              eyebrow="What leaders get"
              title="Reporting, coordination, and parent-facing clarity"
              description={<span className="text-slate-200">A school partnership only works if the operational side feels as clear as the teaching side.</span>}
            />
            <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-200">
              <li>• Attendance visibility and cohort-level progress reporting.</li>
              <li>• Support for leadership reviews and partnership check-ins.</li>
              <li>• Parent-trust messaging that is warm, practical, and easy to share.</li>
              <li>• A dedicated Tiny Steps partnership contact instead of fragmented communication.</li>
            </ul>
          </LeadCard>
        </div>
      </LeadSection>

      <LeadSection>
        <LeadCard>
          <LeadSectionHeading
            eyebrow="Program pathways"
            title="What schools can pilot first"
            description="Choose the pathway that matches the most visible English gap in the selected cohort."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {solutionCards.map((item) => (
              <LeadCard key={item.title} className="border-slate-100 bg-white">
                <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-700">{item.detail}</p>
                <Link to={item.link} className="mt-5 inline-flex text-sm font-semibold text-slate-900 underline underline-offset-4">
                  {item.label}
                </Link>
              </LeadCard>
            ))}
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection id="faq">
        <LeadCard>
          <LeadSectionHeading
            eyebrow="FAQs"
            title="Questions school leaders usually ask first"
            description="This keeps the page self-contained for B2B review while preserving its public SEO role."
          />
          <div className="mt-6">
            <FAQSection items={faqItems} />
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection className="pb-4">
        <FinalLeadCTA
          title="Ready to discuss a school partnership pilot?"
          description={
            <>
              Share your board, grade range, and main English goal. We will help you evaluate whether a pilot in
              phonics, grammar, reading, or speaking makes the most sense before you scale anything. For email-based
              coordination, write to <span className="font-semibold text-white">{PUBLIC_CONTACT_EMAIL}</span>.
            </>
          }
          actions={
            <CourseCTAGroup
              items={[
                ...ctaItems,
                {
                  label: 'Email Partnership Desk',
                  href: `${PUBLIC_CONTACT_MAILTO}?subject=School%20Partnership%20Inquiry`,
                  variant: 'ghost' as const,
                  onClick: () =>
                    trackCoursePageCtaClick({
                      page_path: '/for-schools',
                      cta_label: 'Email Partnership Desk',
                      cta_location: 'footer',
                      destination_path: '/contact',
                    }),
                },
              ]}
              renderLink={(item, className) => (
                <a
                  key={item.label}
                  href={item.href}
                  target={item.href?.startsWith('http') ? '_blank' : undefined}
                  rel={item.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                  onClick={item.onClick}
                  className={`${className} ${item.variant === 'ghost' ? 'border-white/30 bg-transparent text-white hover:bg-white/10' : ''}`}
                >
                  {item.label}
                </a>
              )}
            />
          }
        />
      </LeadSection>
    </LeadPageShell>
  );
};

export default ForSchoolsPage;
