import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
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
import AboutAuthor from '../../components/AboutAuthor';
import parentsMeta from '../../content/parentsMeta';
import { createFAQPageSchema } from '../../lib/schemas';
import { trackParentCourseInterest } from '../../lib/conversionTracking';
import { applySeo } from '../../lib/seo';
import { formatINR, ONE_TO_ONE_MONTHLY_PACKAGES } from '../../config/pricing';

const WHATSAPP_CHOOSER_URL = `https://wa.me/919618398383?text=${encodeURIComponent(
  'Hi Tiny Steps! I need help choosing the right course for my child.',
)}`;

const faqItems = [
  {
    question: 'How do I know which Tiny Steps course is right for my child?',
    answer:
      'Start with your child’s current learning gap, not only age. Tiny Steps uses a structured assessment to identify whether phonics, reading, grammar, writing, or communication should come first.',
  },
  {
    question: 'Should my child start with phonics, reading, grammar, or communication?',
    answer:
      'If reading basics are weak, phonics or reading support usually comes first. If reading is stable but sentence or writing accuracy is weak, grammar and writing support is often the better first step. If ideas are clear but spoken responses are hesitant, communication confidence support is usually the right start.',
  },
  {
    question: 'What if my child reads but still makes grammar mistakes?',
    answer:
      'That usually means grammar transfer is weak. The child may know rules in isolation but need applied sentence practice in writing and speaking.',
  },
  {
    question: 'What if my child understands English but gives short answers?',
    answer:
      'Short answers often point to confidence or sentence-formation gaps. A guided communication pathway usually helps more than general reading practice alone.',
  },
  {
    question: 'Can Tiny Steps suggest a course after assessing my child?',
    answer:
      'Yes. Parents receive a clear first-step recommendation with the most useful starting pathway and the next stage after that.',
  },
  {
    question: 'Is it better to book an assessment before choosing a course?',
    answer:
      'Yes. A free assessment reduces guesswork, avoids wrong placement, and helps families choose with more confidence.',
  },
];

const decisionCards = [
  {
    title: 'Start with phonics',
    destination: '/courses/phonics-foundation',
    ctaLabel: 'Explore phonics foundation',
    ctaLocation: 'decision_ladder',
    helper: 'Best when reading basics are not stable yet.',
    bullets: [
      'Child knows letters but cannot decode words confidently.',
      'Blending is slow, shaky, or depends on guessing.',
      'Reading attempts feel effortful even with simple words.',
    ],
    program: 'phonics' as const,
  },
  {
    title: 'Start with reading support',
    destination: '/reading-classes-for-kids',
    ctaLabel: 'Explore reading support',
    ctaLocation: 'decision_ladder',
    helper: 'Best when decoding exists but fluency is weak.',
    bullets: [
      'Child reads accurately but too slowly.',
      'Longer text causes hesitation or loss of meaning.',
      'Reading confidence drops as passage length increases.',
    ],
  },
  {
    title: 'Start with grammar',
    destination: '/courses/grammar',
    ctaLabel: 'Explore beginner grammar',
    ctaLocation: 'decision_ladder',
    helper: 'Best when correctness drops in writing and answers.',
    bullets: [
      'Tense, punctuation, or sentence errors repeat often.',
      'Grammar rules are known but not applied in real work.',
      'Written answers feel unclear despite decent comprehension.',
    ],
    program: 'grammar' as const,
  },
  {
    title: 'Start with communication confidence',
    destination: '/courses/public-speaking-foundations',
    ctaLabel: 'Explore speaking foundations',
    ctaLocation: 'decision_ladder',
    helper: 'Best when the child understands but hesitates to express.',
    bullets: [
      'Responses stay too short in class or at home.',
      'The child avoids oral answers despite understanding the question.',
      'Confidence drops during speaking tasks or presentations.',
    ],
    program: 'speaking' as const,
  },
];

const comparisonCards = [
  {
    title: 'Phonics Foundation',
    path: '/courses/phonics-foundation',
    helper: 'For ages 3–7 and beginners who need sound-to-word reading support.',
    points: ['Letter sounds', 'Blending', 'CVC words', 'Early reading confidence'],
  },
  {
    title: 'Reading Support',
    path: '/reading-classes-for-kids',
    helper: 'For children who read but need better pace, expression, and meaning.',
    points: ['Reading fluency', 'Passage confidence', 'Comprehension support', 'Smoother reading rhythm'],
  },
  {
    title: 'Beginner Grammar',
    path: '/courses/grammar',
    helper: 'For children whose writing and answers stay error-prone.',
    points: ['Sentence formation', 'Grammar basics', 'Punctuation', 'Writing clarity'],
  },
  {
    title: 'Speaking Foundations',
    path: '/courses/public-speaking-foundations',
    helper: 'For children who need stronger spoken response confidence.',
    points: ['Longer answers', 'Guided speaking', 'Confidence routines', 'Clearer expression'],
  },
];

const quickGuides = [
  { label: 'Child not reading properly', to: '/child-not-reading-properly' },
  { label: 'Slow reader support', to: '/slow-reader-child-help' },
  { label: 'Shy child speaking confidence', to: '/shy-child-speaking-confidence' },
  { label: 'Parent phonics mission', to: '/parents/phonics-mission' },
];

const starterPlan = ONE_TO_ONE_MONTHLY_PACKAGES[0];

const ChoosingCourse: React.FC = () => {
  useEffect(() => {
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
        { '@type': 'ListItem', position: 2, name: 'Parents Hub', item: 'https://tinystepslearning.com/parents' },
        { '@type': 'ListItem', position: 3, name: 'Choosing a Course', item: 'https://tinystepslearning.com/parents/choosing-course' },
      ],
    };

    const faqSchema = {
      ...createFAQPageSchema(faqItems),
      '@id': 'https://tinystepslearning.com/parents/choosing-course#faq',
    };

    applySeo({
      ...parentsMeta['/parents/choosing-course'],
      jsonLd: [parentsMeta['/parents/choosing-course'].jsonLd, breadcrumbSchema, faqSchema],
    });
  }, []);

  const ctaItems = [
    {
      label: 'Book Free Assessment',
      to: '/book-demo',
      variant: 'primary' as const,
      onClick: () =>
        trackParentCourseInterest({
          page_path: '/parents/choosing-course',
          cta_label: 'Book Free Assessment',
          cta_location: 'hero',
          destination_path: '/book-demo',
        }),
    },
    {
      label: 'Talk to Academic Advisor',
      href: WHATSAPP_CHOOSER_URL,
      variant: 'secondary' as const,
      onClick: () =>
        trackParentCourseInterest({
          page_path: '/parents/choosing-course',
          cta_label: 'Talk to Academic Advisor',
          cta_location: 'hero',
          destination_path: '/contact',
        }),
    },
  ];

  return (
    <LeadPageShell>
      <LeadHero
        eyebrow="Tiny Steps • Parent Decision Guide"
        title="How to Choose the Right Tiny Steps Course for Your Child"
        description={
          <>
            Choose the first course based on your child&apos;s real learning gap, not only age or what sounds
            popular. This page helps parents decide whether phonics, reading, grammar, writing, or speaking
            confidence should come first.
          </>
        }
        trustChips={[
          { label: 'Assessment-first placement', tone: 'warm' },
          { label: 'Parent-friendly course guidance', tone: 'cool' },
          { label: `${formatINR(400)}/class`, tone: 'neutral' },
          { label: `${formatINR(starterPlan.monthlyFee)} for 12 classes`, tone: 'mint' },
        ]}
        supportingText="Most families book a free assessment first, then choose one clear first focus instead of trying to fix everything at once."
        stats={[
          { label: 'Students guided', value: '5000+', helper: 'Structured pathways across phonics, grammar, reading, and speaking' },
          { label: 'Countries served', value: '15+', helper: 'Parents use Tiny Steps from India and global school communities' },
          { label: 'Decision style', value: 'Start here', helper: 'Pick the strongest gap, then layer the next goal later' },
          { label: 'Typical first step', value: 'Assessment', helper: 'A clear starting plan before enrollment or package choice' },
        ]}
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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Start here decision ladder</p>
            <div className="mt-4 space-y-3">
              {[
                'Reading basics weak -> start with phonics.',
                'Decoding okay but flow weak -> start with reading support.',
                'Writing full of errors -> start with grammar.',
                'Understanding okay but speaking hesitant -> start with communication support.',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800">
                  {item}
                </div>
              ))}
            </div>
          </LeadCard>
        }
      />

      <LeadSection>
        <LeadCard className="bg-gradient-to-br from-white via-orange-50/45 to-sky-50/45">
          <LeadSectionHeading
            eyebrow="Course comparison"
            title="A quick visual comparison of the most common starting pathways"
            description="This is not a complete catalog. It is the parent-first shortlist most families compare before booking."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {comparisonCards.map((item) => (
              <LeadCard key={item.title} className="border-slate-100 bg-white">
                <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{item.helper}</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-700">
                  {item.points.map((point) => (
                    <li key={point}>• {point}</li>
                  ))}
                </ul>
                <Link to={item.path} className="mt-5 inline-flex text-sm font-semibold text-slate-900 underline underline-offset-4">
                  Explore this pathway
                </Link>
              </LeadCard>
            ))}
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection id="decision-ladder">
        <LeadSectionHeading
          eyebrow="Parent decision guide"
          title="Pick the first course by the strongest gap"
          description="The right first course lowers frustration fast. The wrong first course often makes families feel like nothing is working."
        />
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {decisionCards.map((item) => (
            <LeadCard key={item.title}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{item.helper}</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">{item.title}</h3>
              <ul className="mt-4 space-y-2 text-sm leading-7 text-slate-700">
                {item.bullets.map((bullet) => (
                  <li key={bullet}>• {bullet}</li>
                ))}
              </ul>
              <Link
                to={item.destination}
                onClick={() =>
                  trackParentCourseInterest({
                    page_path: '/parents/choosing-course',
                    cta_label: item.ctaLabel,
                    cta_location: item.ctaLocation,
                    destination_path: item.destination,
                    program: item.program,
                  })
                }
                className="mt-5 inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {item.ctaLabel}
              </Link>
            </LeadCard>
          ))}
        </div>
      </LeadSection>

      <LeadSection>
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <LeadCard>
            <LeadSectionHeading
              eyebrow="Common confusion"
              title="What parents are usually trying to solve"
              description="These concerns usually point to one strongest first step, not five parallel programs."
            />
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {[
                'Child knows letters but cannot read words.',
                'Child reads too slowly despite practice.',
                'Child keeps making grammar mistakes.',
                'Child gives short answers and avoids speaking.',
                'Child writes incomplete or unclear sentences.',
                'Parent is unsure whether age or gap matters more.',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm font-medium text-slate-800">
                  {item}
                </div>
              ))}
            </div>
          </LeadCard>

          <LeadCard className="bg-slate-900 text-white">
            <LeadSectionHeading
              eyebrow="Useful next guides"
              title="Open the right parent guide next"
              description={<span className="text-slate-200">These supporting pages help parents validate the diagnosis before or after the assessment.</span>}
            />
            <div className="mt-5 space-y-3">
              {quickGuides.map((item) => (
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
            title="Parent questions before choosing a course"
            description="These answers preserve the page intent as a decision guide, not a generic catalog page."
          />
          <div className="mt-6">
            <FAQSection items={faqItems} />
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection className="pb-4">
        <FinalLeadCTA
          title="Need a clear first-step recommendation?"
          description="Book the free assessment for placement clarity, or message the academic advisor if you want help deciding between phonics, reading, grammar, or speaking support before you book."
          actions={
            <CourseCTAGroup
              items={[
                ...ctaItems,
                { label: 'Explore All Courses', to: '/courses', variant: 'ghost' as const },
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
        <AboutAuthor className="mx-auto max-w-5xl" />
      </LeadSection>
    </LeadPageShell>
  );
};

export default ChoosingCourse;
