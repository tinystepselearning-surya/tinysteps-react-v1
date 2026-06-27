import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import ClusterSeoNav from '../../components/programs/ClusterSeoNav';
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
import { trackCoursePageCtaClick } from '../../lib/conversionTracking';
import { applySeo, getRouteConfig } from '../../lib/seo';
import { PUBLIC_FACTS } from '../../lib/schemas';

const faqItems = [
  {
    question: 'My child knows letters but cannot read words. Is this the right page?',
    answer:
      'Yes. This page is designed for the bridge from letter familiarity to blending, CVC decoding, and first-sentence reading confidence.',
  },
  {
    question: 'How is this different from the main phonics page?',
    answer:
      'The main phonics page covers the full pathway. This page stays focused on parents specifically looking for online phonics and reading classes that solve early decoding gaps.',
  },
  {
    question: 'How is this different from general reading classes?',
    answer:
      'General reading support often works on fluency and comprehension. This landing page focuses first on the mechanics of reading: sound mapping, blending, decodable words, and early sentence flow.',
  },
  {
    question: 'What age is best to start phonics and early reading support?',
    answer:
      'Many children can start around ages 3 to 4 with playful sound work. Older beginners also benefit when classes are level-matched and taught with live correction.',
  },
  {
    question: 'How many classes per week are usually effective?',
    answer:
      'Two to three live sessions per week plus a short home review routine is a practical rhythm for many families. Consistency matters more than long homework sessions.',
  },
  {
    question: 'Do you use methods similar to Jolly Phonics?',
    answer:
      'Tiny Steps uses a structured synthetic phonics approach with sound-letter mapping, blending routines, decodable reading, and parent-visible progress rather than random worksheets.',
  },
];

const trustStats = [
  { label: 'Students guided', value: '5000+', helper: 'Across early reading, phonics, grammar, and speaking pathways' },
  { label: 'Countries reached', value: '15+', helper: 'Families join from India and international school communities' },
  { label: 'Price point', value: '₹400/class', helper: 'Clear premium 1:1 pricing for parents comparing providers' },
  { label: 'Starter pack', value: '₹4,800', helper: '12 classes for assessment-led foundations when the fit is right' },
];

const outcomes = [
  {
    title: 'Letter sounds that stay clear',
    detail: 'Children move from naming letters to hearing and producing the right sounds consistently.',
  },
  {
    title: 'Blending that becomes automatic',
    detail: 'We teach children how to join sounds into short words instead of guessing from memory.',
  },
  {
    title: 'CVC reading confidence',
    detail: 'Short-vowel words become smoother, less hesitant, and more accurate through live guided correction.',
  },
  {
    title: 'First sentence reading flow',
    detail: 'Children read short decodable lines with more confidence, less freezing, and better rhythm.',
  },
];

const parentSignals = [
  'Your child knows letters but cannot reliably read short words.',
  'Reading attempts depend on guessing instead of sound-by-sound decoding.',
  'Blending feels slow, effortful, or frustrating at home.',
  'You want structured online reading support, not scattered worksheets.',
];

const pathwayCards = [
  {
    title: 'Assessment-first placement',
    detail: 'We start with a free assessment to see what your child can already decode and where the gap begins.',
  },
  {
    title: 'Live 1:1 correction',
    detail: 'Teachers correct sound confusion, blending, pace, and decoding habits in real time.',
  },
  {
    title: 'Small-step reading path',
    detail: 'Lessons move from letter sounds to blending, CVC words, early sentences, and stronger reading confidence.',
  },
  {
    title: 'Parent-visible progress',
    detail: 'Families get a clear next-step plan instead of generic reassurance after class.',
  },
];

const internalLinks = [
  { label: 'Explore the full phonics pathway', to: '/phonics' },
  { label: 'See the phonics foundation course detail', to: '/courses/phonics-foundation' },
  { label: 'Read the parent phonics mission', to: '/parents/phonics-mission' },
  { label: 'Learn what phonics means for kids', to: '/blog/what-is-phonics-for-kids' },
];

export default function OnlinePhonicsReadingClassesPage() {
  const routeConfig = getRouteConfig('/online-phonics-reading-classes');
  const canonicalPath = routeConfig?.canonicalPath ?? '/online-phonics-reading-classes';
  const canonicalUrl = `${PUBLIC_FACTS.primaryWebsite}${canonicalPath}`;
  const seoTitle = routeConfig?.title ?? 'Online Phonics and Reading Classes for Kids | Tiny Steps Learning';
  const seoDescription =
    routeConfig?.description ??
    'Premium online phonics and reading classes for kids focused on letter sounds, blending, CVC decoding, and first-sentence reading confidence with live 1:1 support.';

  useEffect(() => {
    applySeo({
      title: seoTitle,
      description: seoDescription,
      canonicalPath,
      ogType: routeConfig?.ogType ?? 'website',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'Course',
          '@id': `${canonicalUrl}#course`,
          name: 'Online Phonics and Reading Classes',
          description:
            'Live online phonics and early reading classes focused on structured synthetic phonics, blending, CVC decoding, and first-sentence reading confidence.',
          provider: {
            '@type': 'Organization',
            '@id': 'https://tinystepslearning.com/#organization',
            name: 'Tiny Steps Learning',
            url: 'https://tinystepslearning.com',
          },
          url: canonicalUrl,
          hasCourseInstance: {
            '@type': 'CourseInstance',
            courseMode: 'OnlineCourse',
          },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
            { '@type': 'ListItem', position: 2, name: 'Phonics', item: 'https://tinystepslearning.com/phonics' },
            { '@type': 'ListItem', position: 3, name: 'Online Phonics and Reading Classes', item: canonicalUrl },
          ],
        },
        {
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
        },
      ],
    });
  }, [canonicalPath, canonicalUrl, routeConfig?.ogType, seoDescription, seoTitle]);

  const ctaItems = [
    {
      label: 'Book Free Assessment',
      to: '/book-demo',
      variant: 'primary' as const,
      onClick: () =>
        trackCoursePageCtaClick({
          page_path: canonicalPath,
          cta_label: 'Book Free Assessment',
          cta_location: 'hero',
          destination_path: '/book-demo',
          program: 'phonics',
        }),
    },
    {
      label: 'WhatsApp Academic Advisor',
      href: 'https://wa.me/919618398383?text=Hi%20Tiny%20Steps!%20I%20want%20help%20choosing%20the%20right%20online%20phonics%20and%20reading%20classes%20for%20my%20child.',
      variant: 'secondary' as const,
      onClick: () =>
        trackCoursePageCtaClick({
          page_path: canonicalPath,
          cta_label: 'WhatsApp Academic Advisor',
          cta_location: 'hero',
          destination_path: '/contact',
          program: 'phonics',
        }),
    },
  ];

  return (
    <LeadPageShell>
      <LeadHero
        eyebrow="Tiny Steps • Phonics Reading Track"
        title="Online Phonics and Reading Classes for Kids"
        description={
          <>
            A premium long-tail landing page for parents who need a clear answer: how to help a child move
            from letter familiarity to confident word reading. Tiny Steps uses live 1:1 phonics support,
            structured blending practice, and parent-visible progress to build first-reading confidence
            without guesswork.
          </>
        }
        trustChips={[
          { label: 'Ages 3–8', tone: 'warm' },
          { label: 'Live 1:1 online classes', tone: 'cool' },
          { label: 'Free phonics assessment', tone: 'neutral' },
          { label: 'Parent progress updates', tone: 'mint' },
        ]}
        supportingText={
          <>
            This page keeps a narrower intent than the main <Link to="/phonics" className="font-semibold text-slate-900 underline underline-offset-4">phonics page</Link>:
            parents searching specifically for online phonics and reading classes that solve blending,
            CVC decoding, and first-sentence reading gaps.
          </>
        }
        stats={trustStats}
        actions={
          <CourseCTAGroup
            items={ctaItems}
            renderLink={(item, className) =>
              item.to ? (
                <Link key={item.label} to={item.to} onClick={item.onClick} className={className}>
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={item.onClick}
                  className={className}
                >
                  {item.label}
                </a>
              )
            }
          />
        }
        aside={
          <LeadCard className="bg-[linear-gradient(150deg,rgba(255,255,255,0.98),rgba(248,251,255,0.94),rgba(255,250,244,0.92))]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">What parents usually want fixed</p>
            <ul className="mt-4 space-y-3 text-sm font-medium text-slate-800">
              {parentSignals.map((signal) => (
                <li key={signal} className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3">
                  {signal}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-6 text-slate-700">
              If that sounds familiar, the next right move is usually a free assessment followed by a level-based
              plan, not more random reading worksheets.
            </p>
          </LeadCard>
        }
      />

      <LeadSection>
        <LeadCard className="bg-gradient-to-br from-white via-orange-50/40 to-sky-50/40">
          <LeadSectionHeading
            eyebrow="Quick answer for parents"
            title="What children actually learn in these online phonics and reading classes"
            description="We stay focused on the early reading bridge: sound -> blend -> read -> repeat with confidence."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {outcomes.map((item) => (
              <LeadCard key={item.title} className="border-slate-100 bg-white">
                <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-700">{item.detail}</p>
              </LeadCard>
            ))}
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection>
        <div className="grid gap-5 lg:grid-cols-2">
          <LeadCard>
            <LeadSectionHeading
              eyebrow="Why Tiny Steps"
              title="What makes this early-reading pathway feel premium to parents"
              description="Strong trust is not only about visual polish. It is also about calm structure, clear pricing, and obvious next steps."
            />
            <div className="mt-5 space-y-4">
              {pathwayCards.map((item) => (
                <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50/85 px-4 py-4">
                  <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-700">{item.detail}</p>
                </div>
              ))}
            </div>
          </LeadCard>

          <LeadCard className="bg-slate-900 text-white">
            <LeadSectionHeading
              eyebrow="Internal next steps"
              title="Parents usually compare these pages next"
              description={
                <span className="text-slate-200">
                  These links keep search intent connected without redirecting this long-tail page away or weakening its self-canonical role.
                </span>
              }
            />
            <div className="mt-5 space-y-3">
              {internalLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </LeadCard>
        </div>
      </LeadSection>

      <LeadSection id="faq">
        <LeadCard>
          <LeadSectionHeading
            eyebrow="FAQs"
            title="Questions parents ask before booking phonics support"
            description="These answers stay specific to the online phonics + reading intent of this page."
          />
          <div className="mt-6">
            <FAQSection items={faqItems} />
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection className="pb-4">
        <FinalLeadCTA
          title="Ready to move from letter familiarity to real reading confidence?"
          description={
            <>
              Book a free phonics assessment for a clear starting plan, or message our academic advisor if you want
              help choosing between the full <Link to="/phonics" className="font-semibold text-white underline underline-offset-4">phonics pathway</Link>,
              the <Link to="/courses/phonics-foundation" className="font-semibold text-white underline underline-offset-4">phonics foundation course</Link>,
              or your next parent guide.
            </>
          }
          actions={
            <CourseCTAGroup
              items={[
                ...ctaItems,
                { label: 'See Pricing', to: '/pricing', variant: 'ghost' as const },
              ]}
              renderLink={(item, className) =>
                item.to ? (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={item.onClick}
                    className={`${className} ${item.variant === 'ghost' ? 'border-white/30 bg-transparent text-white hover:bg-white/10' : ''}`}
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

      <LeadSection className="pt-2">
        <ClusterSeoNav cluster="phonics" />
      </LeadSection>
    </LeadPageShell>
  );
}
