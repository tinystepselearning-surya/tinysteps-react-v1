import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PUBLIC_LEARNER_REACH_LABEL,
  PUBLIC_SESSION_DURATION_LABEL,
  PUBLIC_SITE_FACTS,
} from '../../config/publicFacts';
import { ONE_TO_ONE_MONTHLY_PACKAGES, PER_CLASS_PRICE, formatINR } from '../../config/pricing';
import { applySeo } from '../../lib/seo';
import { createFAQPageSchema, createServiceSchema, createWebPageSchema, PUBLIC_FACTS } from '../../lib/schemas';
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

const canonicalPath = '/online-english-classes-hyderabad';
const canonicalUrl = `${PUBLIC_FACTS.primaryWebsite}${canonicalPath}`;
const demoMinutes = PUBLIC_SITE_FACTS.standardOffer.demoDurationMinutes;
const starterPackage = ONE_TO_ONE_MONTHLY_PACKAGES.find((pkg) => pkg.id === 'starter');
const starterPackageFee = starterPackage?.monthlyFee ?? PER_CLASS_PRICE * 12;

const seoTitle = 'Online English Classes for Kids in Hyderabad | Tiny Steps';
const seoDescription =
  `Live online English classes for kids ages 3–12 in Hyderabad. Start with a free ${demoMinutes}-minute 1:1 assessment, then choose the right phonics, reading, grammar, writing or speaking path.`;

const HYDERABAD_ENGLISH_KEYWORDS = [
  'online English classes for kids in Hyderabad',
  'online English classes Hyderabad kids',
  'English classes for kids Hyderabad',
  'English classes for children in Hyderabad',
  'live online English classes for kids Hyderabad',
  '1 to 1 English classes for kids Hyderabad',
  'online English learning for kids Hyderabad',
];

const programmeCards = [
  {
    title: 'Phonics',
    body: 'For letter sounds, blending, decoding, spelling patterns and early reading development.',
    href: '/phonics',
  },
  {
    title: 'Reading',
    body: 'For broader reading support across accuracy, connected reading, vocabulary, comprehension and reading confidence.',
    href: '/reading-classes-for-kids',
  },
  {
    title: 'Grammar',
    body: 'For sentence formation, tenses, parts of speech, articles, prepositions, punctuation and grammar accuracy.',
    href: '/grammar',
  },
  {
    title: 'Writing',
    body: 'For ideas, paragraph organisation, creative writing, school answers, editing and independent written expression.',
    href: '/writing-classes-for-kids',
  },
  {
    title: 'Spoken English',
    body: 'For everyday conversation, fuller spoken responses, vocabulary in use and conversational English fluency.',
    href: '/spoken-english-classes-for-kids-online',
  },
  {
    title: 'Public Speaking & Communication',
    body: 'For structured answers, storytelling, show-and-tell, classroom communication, presentations and audience awareness.',
    href: '/speaking',
  },
];

const faqItems = [
  {
    question: 'Does Tiny Steps offer online English classes for kids in Hyderabad?',
    answer:
      `Yes. Tiny Steps offers live online English classes for children ages ${PUBLIC_SITE_FACTS.audience.ageMin}–${PUBLIC_SITE_FACTS.audience.ageMax} in Hyderabad. The free assessment helps identify whether the child should begin with phonics, reading, grammar, writing, spoken English, or public speaking and communication.`,
  },
  {
    question: 'Are Tiny Steps English classes online or offline in Hyderabad?',
    answer:
      'Tiny Steps classes are online and teacher-led. Hyderabad families join live classes from home; this page does not represent a separate physical tuition centre in Hyderabad.',
  },
  {
    question: 'How long is a standard 1:1 English class?',
    answer:
      `A standard Tiny Steps live 1:1 class is ${PUBLIC_SESSION_DURATION_LABEL}. Small-group duration varies with group size.`,
  },
  {
    question: 'How much is a standard 1:1 class for Hyderabad families?',
    answer:
      `The current standard 1:1 rate is ${formatINR(PER_CLASS_PRICE)} per class. A 12-class standard 1:1 package is ${formatINR(starterPackageFee)}. The main pricing page remains the source for current cross-programme pricing and available formats.`,
  },
  {
    question: 'Which English programme should my child start with?',
    answer:
      'The right starting point depends on the child’s current need. Decoding difficulty may point to Phonics, broader reading difficulty to Reading, sentence accuracy to Grammar, written expression to Writing, everyday conversational fluency to Spoken English, and presentation or communication goals to Public Speaking & Communication.',
  },
  {
    question: `Is there a free ${demoMinutes}-minute 1:1 assessment before joining?`,
    answer:
      `Yes. Tiny Steps offers one free ${demoMinutes}-minute live 1:1 online demo assessment class before enrolment so the first programme recommendation can be based on the child’s current level and learning need.`,
  },
  {
    question: 'What if confidence itself is the main barrier?',
    answer:
      'If the child has enough language for the task but hesitation, participation comfort or dependence on prompting is the main barrier, the specialist Confidence Building programme may be a better fit than a broad English or general speaking programme.',
  },
];

export default function OnlineEnglishClassesHyderabadPage() {
  useEffect(() => {
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${PUBLIC_FACTS.primaryWebsite}/` },
        { '@type': 'ListItem', position: 2, name: 'Online English Classes for Kids', item: `${PUBLIC_FACTS.primaryWebsite}/online-english-classes-for-kids` },
        { '@type': 'ListItem', position: 3, name: 'Online English Classes for Kids in Hyderabad', item: canonicalUrl },
      ],
    };

    const webpageSchema = {
      ...createWebPageSchema({
        name: 'Online English Classes for Kids in Hyderabad',
        description: seoDescription,
        url: canonicalUrl,
      }),
      '@id': `${canonicalUrl}#webpage`,
    };

    const serviceSchema = {
      ...createServiceSchema({
        name: 'Online English Classes for Kids in Hyderabad',
        description:
          `Live online English classes for children ages ${PUBLIC_SITE_FACTS.audience.ageMin}–${PUBLIC_SITE_FACTS.audience.ageMax} in Hyderabad, with assessment-led placement into the appropriate English programme.`,
        serviceType: 'Live online English classes for kids',
        areaServed: 'Hyderabad, Telangana, India',
        audienceType: `Children ages ${PUBLIC_SITE_FACTS.audience.ageMin}–${PUBLIC_SITE_FACTS.audience.ageMax}`,
        url: canonicalUrl,
      }),
      '@id': `${canonicalUrl}#service`,
      availableChannel: {
        '@type': 'ServiceChannel',
        serviceUrl: canonicalUrl,
        name: 'Live online classes',
      },
    };

    const faqSchema = {
      ...createFAQPageSchema(faqItems),
      '@id': `${canonicalUrl}#faq`,
    };

    applySeo({
      title: seoTitle,
      description: seoDescription,
      canonicalPath,
      ogType: 'website',
      keywords: HYDERABAD_ENGLISH_KEYWORDS,
      robots: 'index,follow',
      jsonLd: [breadcrumbSchema, webpageSchema, serviceSchema, faqSchema],
    });
  }, []);

  return (
    <LeadPageShell>
      <LeadHero
        eyebrow={`Hyderabad • Ages ${PUBLIC_SITE_FACTS.audience.ageMin}–${PUBLIC_SITE_FACTS.audience.ageMax}`}
        title="Online English Classes for Kids in Hyderabad"
        description={
          <>
            <p>
              Tiny Steps provides live online English classes for Hyderabad children ages {PUBLIC_SITE_FACTS.audience.ageMin}–{PUBLIC_SITE_FACTS.audience.ageMax}, with standard 1:1 classes of {PUBLIC_SESSION_DURATION_LABEL} and selected small-group options.
            </p>
            <p className="mt-3">
              Start with one free {demoMinutes}-minute 1:1 assessment. We identify the child’s main English-learning need first, then guide the family to the appropriate phonics, reading, grammar, writing, spoken-English, or public-speaking and communication programme.
            </p>
          </>
        }
        trustChips={[
          { label: PUBLIC_LEARNER_REACH_LABEL, tone: 'warm' as const },
          { label: 'Live online classes from home', tone: 'cool' as const },
          { label: `Standard 1:1: ${PUBLIC_SESSION_DURATION_LABEL}`, tone: 'neutral' as const },
          { label: `Free ${demoMinutes}-minute 1:1 assessment`, tone: 'mint' as const },
        ]}
        stats={[
          { label: 'Per class', value: formatINR(PER_CLASS_PRICE), helper: 'standard live 1:1 rate' },
          { label: '12 classes', value: formatINR(starterPackageFee), helper: 'standard 1:1 package' },
          { label: 'Delivery', value: 'Online', helper: 'live teacher-guided learning' },
          { label: 'Service area', value: 'Hyderabad', helper: 'join from home' },
        ]}
        actions={
          <CourseCTAGroup
            items={[
              { to: '/book-demo', label: `Book Free ${demoMinutes}-Minute Demo`, variant: 'primary' },
              { to: '/pricing', label: 'See Pricing', variant: 'ghost' },
              { to: '/online-english-classes-for-kids', label: 'See Broad English Page', variant: 'secondary' },
            ]}
            renderLink={(item, className) => (
              <Link key={item.label} to={item.to || '/'} className={className}>
                {item.label}
              </Link>
            )}
          />
        }
        aside={
          <LeadCard className="bg-[linear-gradient(145deg,#0f172a_0%,#172554_100%)] text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Built for Hyderabad families who prefer online learning</p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-200">
              <p>No travel to a separate tuition centre is required.</p>
              <p>Children join live teacher-led classes from home.</p>
              <p>Parents can discuss compatible weekday or weekend availability after the assessment; slots depend on teacher availability.</p>
              <p>The local page helps Hyderabad families find Tiny Steps, while the actual subject programmes remain the same structured Tiny Steps programmes.</p>
            </div>
          </LeadCard>
        }
      />

      <LeadSection>
        <LeadCard>
          <LeadSectionHeading
            eyebrow="Hyderabad service page"
            title="Local search intent, one consistent Tiny Steps learning system"
            description="This page is specifically for Hyderabad families looking for online English classes. It does not create separate Hyderabad versions of every subject programme."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              'Use this page when the broad need is online English classes for a child in Hyderabad.',
              'Use the specialist programme pages when the main need is already clearly phonics, reading, grammar, writing, spoken English, or public speaking and communication.',
              'Classes remain live and online; Hyderabad is the service area, not a separate offline classroom location.',
              'Assessment, pricing clarity and programme fit come before enrolment.',
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
          eyebrow="Programme chooser"
          title="Choose the right English path after assessment"
          description="Hyderabad families use the same canonical Tiny Steps subject programmes as families elsewhere."
        />
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {programmeCards.map((card) => (
            <LeadCard key={card.title} className="bg-slate-50/85">
              <h3 className="text-lg font-semibold text-slate-900">{card.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-700">{card.body}</p>
              <Link to={card.href} className="mt-4 inline-flex text-sm font-semibold text-slate-900 underline underline-offset-4">
                Explore {card.title}
              </Link>
            </LeadCard>
          ))}
        </div>
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-sm leading-7 text-slate-700">
          <strong className="text-slate-900">Confidence as the primary barrier?</strong>{' '}
          If the child has enough language for the task but participation comfort, hesitation or dependence on prompting is the main issue, see the{' '}
          <Link to="/confidence-building-program-kids" className="font-semibold underline underline-offset-4">
            Confidence Building programme
          </Link>.
        </div>
      </LeadSection>

      <LeadSection>
        <div className="grid gap-5 lg:grid-cols-2">
          <LeadCard>
            <LeadSectionHeading
              eyebrow="Why online"
              title="English support without adding another Hyderabad commute"
              description="Families can evaluate the child’s learning need and class fit from home before enrolling."
            />
            <div className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
              <p>Live online delivery removes the need to travel to a separate centre for each class.</p>
              <p>Standard 1:1 sessions give one child live teacher attention for {PUBLIC_SESSION_DURATION_LABEL}.</p>
              <p>Programme placement is based on the child’s current need rather than creating a separate curriculum simply because the family is in Hyderabad.</p>
            </div>
            <p className="mt-5 text-sm leading-7 text-slate-700">
              Need the broader India and worldwide entry point instead? Visit{' '}
              <Link to="/online-english-classes-for-kids" className="font-semibold underline underline-offset-4">
                online English classes for kids
              </Link>.
            </p>
          </LeadCard>

          <LeadCard className="bg-[linear-gradient(150deg,#ecfdf5_0%,#ffffff_45%,#fff8ef_100%)]">
            <LeadSectionHeading
              eyebrow="Pricing preview"
              title="Same transparent standard pricing for Hyderabad families"
              description="The local page owns Hyderabad search intent; cross-programme pricing remains centralised on the main pricing page."
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
            <div className="mt-4 space-y-2 text-sm leading-7 text-slate-700">
              <p>• {PUBLIC_LEARNER_REACH_LABEL}</p>
              <p>• Standard 1:1 classes are {PUBLIC_SESSION_DURATION_LABEL}</p>
              <p>• One free {demoMinutes}-minute 1:1 assessment before enrolment</p>
              <p>• Small-group duration and pricing vary by group size</p>
            </div>
            <Link to="/pricing" className="mt-5 inline-flex text-sm font-semibold text-slate-900 underline underline-offset-4">
              Review full pricing
            </Link>
          </LeadCard>
        </div>
      </LeadSection>

      <LeadSection>
        <LeadCard>
          <LeadSectionHeading
            eyebrow="Assessment flow"
            title={`How the free ${demoMinutes}-minute 1:1 online assessment works`}
            description="The first goal is to identify the right learning owner, not to sell every programme at once."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              ['1. Parent context', 'Share the child’s age, current concern, school context and preferred timing.'],
              ['2. Skill check', 'The teacher checks the relevant reading, language, writing or speaking behaviours for the concern shared.'],
              ['3. Programme fit', 'Tiny Steps recommends the clearest starting owner: Phonics, Reading, Grammar, Writing, Spoken English, Speaking & Communication, or specialist Confidence Building when appropriate.'],
              ['4. Next step', 'Parents can review the recommended programme, pricing and compatible available slots before deciding.'],
            ].map(([title, body]) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50/75 p-4">
                <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-700">{body}</p>
              </div>
            ))}
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection>
        <LeadCard>
          <LeadSectionHeading eyebrow="Hyderabad parent questions" title="Frequently asked questions" />
          <div className="mt-6">
            <FAQSection items={faqItems.map((item) => ({ question: item.question, answer: item.answer }))} />
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection>
        <FinalLeadCTA
          title="Not sure which English programme your child needs?"
          description={
            <>
              Start with one free {demoMinutes}-minute live 1:1 online assessment. We will identify the child’s current need and recommend the clearest starting programme before enrolment.
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
