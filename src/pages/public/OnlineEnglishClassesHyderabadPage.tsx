import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { ORGANIZATION_ID, createFAQPageSchema, createServiceSchema } from '../../lib/schemas';
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
const canonicalUrl = `https://tinystepslearning.com${canonicalPath}`;

const faqItems = [
  {
    question: 'Does Tiny Steps offer online English classes for kids in Hyderabad?',
    answer:
      'Yes. Tiny Steps offers live online English classes for children in Hyderabad, covering phonics, reading, grammar, sentence formation, and public speaking confidence.',
  },
  {
    question: 'Are the classes online or offline in Hyderabad?',
    answer:
      'Tiny Steps classes are conducted online through live teacher-guided sessions, so children can learn from home without travel.',
  },
  {
    question: 'Which course should my child start with?',
    answer:
      'The right course depends on the child’s current level. Children with reading difficulty may need phonics or reading support, while children with sentence mistakes may need grammar. Children who are shy or give short answers may benefit from public speaking practice.',
  },
  {
    question: 'Do you offer phonics classes for kids in Hyderabad?',
    answer:
      'Yes. Tiny Steps offers online phonics classes for Hyderabad children who need help with letter sounds, blending, decoding, reading fluency, and confidence.',
  },
  {
    question: 'Is there a free assessment before joining?',
    answer:
      'Yes. Parents can book a free assessment to understand the child’s current level and receive a suitable course recommendation before enrollment.',
  },
];

const programCards = [
  {
    title: 'Phonics classes',
    body: 'Best for children who know letters but cannot read words confidently, guess words, or struggle with blending.',
    href: '/phonics',
  },
  {
    title: 'Reading classes',
    body: 'Best for children who read slowly, avoid passages, forget words, or need stronger fluency and comprehension.',
    href: '/reading-classes-for-kids',
  },
  {
    title: 'Grammar classes',
    body: 'Best for children who make sentence mistakes, struggle with tenses, punctuation, articles, prepositions, or writing clear sentences.',
    href: '/grammar',
  },
  {
    title: 'Speaking classes',
    body: 'Best for children who give one-word answers, feel shy, speak unclearly, or need confidence while expressing ideas.',
    href: '/speaking',
  },
];

export default function OnlineEnglishClassesHyderabadPage() {
  useEffect(() => {
    const faqSchema = {
      ...createFAQPageSchema(faqItems),
      '@id': `${canonicalUrl}#faq`,
    };

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
        { '@type': 'ListItem', position: 2, name: 'Hyderabad Online English Classes', item: canonicalUrl },
      ],
    };

    const serviceSchema = createServiceSchema({
      name: 'Online English Classes for Kids in Hyderabad',
      description:
        'Live online English classes for children in Hyderabad aged 3–12, covering phonics, reading, grammar, sentence formation, and public speaking confidence.',
      serviceType: 'Online English classes for kids',
      areaServed: 'Hyderabad, Telangana, India',
      audienceType: 'Children',
      url: canonicalUrl,
    });

    const hyderabadEducationalOrganizationSchema = {
      '@context': 'https://schema.org',
      '@type': 'EducationalOrganization',
      '@id': `${canonicalUrl}#educational-organization`,
      name: 'Tiny Steps Learning',
      url: canonicalUrl,
      parentOrganization: {
        '@id': ORGANIZATION_ID,
      },
      areaServed: 'Hyderabad, Telangana, India',
      description:
        'Tiny Steps offers live online English classes for children in Hyderabad with support in phonics, reading, grammar, sentence formation, and speaking confidence.',
    };

    applySeo({
      title: 'Online English Classes for Kids in Hyderabad | Tiny Steps Learning',
      description:
        'Live online English classes for kids in Hyderabad covering phonics, reading, grammar, sentence formation, and communication confidence. Book a free assessment.',
      canonicalPath,
      ogType: 'website',
      jsonLd: [breadcrumbSchema, hyderabadEducationalOrganizationSchema, serviceSchema, faqSchema],
    });
  }, []);

  return (
    <LeadPageShell>
      <LeadHero
        eyebrow="Hyderabad parents"
        title="Online English Classes for Kids in Hyderabad"
        description={
          <>
            <p>
              Tiny Steps offers live online English classes for Hyderabad children who need a stronger path in phonics, reading, grammar, sentence formation, or speaking confidence.
            </p>
            <p className="mt-3">
              This page stays local: it is built for families comparing online English classes in Hyderabad, phonics classes for kids in Hyderabad, and online grammar classes for kids in Hyderabad.
            </p>
          </>
        }
        trustChips={[
          { label: '5000+ students served', tone: 'warm' as const },
          { label: 'Families in 15+ countries', tone: 'cool' as const },
          { label: 'Live online classes from home', tone: 'neutral' as const },
          { label: 'Free assessment before enrollment', tone: 'mint' as const },
        ]}
        stats={[
          { label: 'Per class', value: '₹400', helper: 'current approved pricing' },
          { label: '12 classes', value: '₹4,800', helper: 'pricing preview' },
          { label: 'Format', value: 'Live', helper: '1:1 and small-group options' },
          { label: 'Location fit', value: 'Hyderabad', helper: 'online from home, no travel needed' },
        ]}
        actions={
          <CourseCTAGroup
            items={[
              { to: '/book-demo', label: 'Book Free Assessment', variant: 'primary' },
              { to: '/courses', label: 'Explore Courses', variant: 'ghost' },
              { to: '/online-english-classes-for-kids', label: 'See India and Worldwide Page', variant: 'secondary' },
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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Why online works well for Hyderabad families</p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-200">
              <p>It avoids travel across city traffic.</p>
              <p>Children learn from home in a familiar environment.</p>
              <p>Parents can compare weekday and weekend timing options after the free assessment.</p>
              <p>Live teacher guidance gives correction instead of only recorded exposure.</p>
            </div>
          </LeadCard>
        }
      />

      <LeadSection>
        <LeadCard>
          <LeadSectionHeading
            eyebrow="Program chooser"
            title="Which Tiny Steps class is right for your child?"
            description="The local page stays distinct, but it still helps Hyderabad parents move quickly to the exact subject page they need."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {programCards.map((card) => (
              <LeadCard key={card.title} className="bg-slate-50/85">
                <h3 className="text-lg font-semibold text-slate-900">{card.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-700">{card.body}</p>
                <Link to={card.href} className="mt-4 inline-flex text-sm font-semibold text-slate-900 underline underline-offset-4">
                  Explore {card.title}
                </Link>
              </LeadCard>
            ))}
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection>
        <div className="grid gap-5 lg:grid-cols-2">
          <LeadCard>
            <LeadSectionHeading
              eyebrow="Local parent context"
              title="Why Hyderabad parents often choose online classes first"
              description="This page stays local in positioning instead of duplicating the broader national page."
            />
            <div className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
              <p>Families often want strong English support without adding another city commute.</p>
              <p>Online classes make it easier to fit after-school, evening, and weekend routines around real family schedules.</p>
              <p>Parents can start with a free assessment, compare pricing, and decide only after they understand the child’s current gap.</p>
            </div>
            <p className="mt-5 text-sm leading-7 text-slate-700">
              Need the broader India and worldwide page instead? Visit{' '}
              <Link to="/online-english-classes-for-kids" className="font-semibold underline underline-offset-4">
                online English classes for kids
              </Link>
              .
            </p>
          </LeadCard>

          <LeadCard className="bg-[linear-gradient(150deg,#ecfdf5_0%,#ffffff_45%,#fff8ef_100%)]">
            <LeadSectionHeading
              eyebrow="Pricing preview"
              title="Simple pricing before parents decide"
              description="Pricing stays the same; the local difference is the Hyderabad search intent and context."
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
            <div className="mt-4 space-y-2 text-sm leading-7 text-slate-700">
              <p>• 5000+ students served</p>
              <p>• Families in 15+ countries</p>
              <p>• Founder and teacher-led learning</p>
              <p>• Free assessment before course recommendation</p>
            </div>
          </LeadCard>
        </div>
      </LeadSection>

      <LeadSection>
        <LeadCard>
          <LeadSectionHeading
            eyebrow="Assessment flow"
            title="How the free assessment works"
            description="Parents get guidance before enrollment, not after."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              ['1. Child profile and concerns', 'We understand the child’s age, school level, and parent concern.'],
              ['2. Skill-level check', 'We check phonics, reading, grammar, sentence formation, or speaking needs.'],
              ['3. Path recommendation', 'We recommend the right path: phonics, reading, grammar, speaking, or combined support.'],
              ['4. Next-step guidance', 'Parents receive clear next-step guidance and can then review pricing or class samples.'],
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
          <LeadSectionHeading eyebrow="Parents also ask" title="FAQs" />
          <div className="mt-6">
            <FAQSection items={faqItems.map((item) => ({ question: item.question, answer: item.answer }))} />
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection>
        <FinalLeadCTA
          title="Not sure which English class your child needs?"
          description={
            <>
              Start with a free assessment. Tiny Steps will check the child’s current level and recommend the right starting point for phonics, reading, grammar, sentence formation, or speaking confidence.
            </>
          }
          actions={
            <CourseCTAGroup
              items={[{ to: '/book-demo', label: 'Book Free Assessment', variant: 'primary' }]}
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
