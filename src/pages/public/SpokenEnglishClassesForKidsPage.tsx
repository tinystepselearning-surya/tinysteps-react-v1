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

const canonicalPath = '/spoken-english-classes-for-kids-online';
const canonicalUrl = `${PUBLIC_FACTS.primaryWebsite}${canonicalPath}`;

const painPoints = [
  'Child gives one-word answers',
  'Child understands English but does not speak confidently',
  'Child needs sentence expansion',
  'Child is shy in class',
];

const faqItems = [
  {
    question: 'What if my child understands English but does not speak much?',
    answer:
      'That usually means the child needs guided speaking turns, sentence expansion, and confidence practice, not just more listening exposure.',
  },
  {
    question: 'Can these classes help a shy child?',
    answer:
      'Yes. Tiny Steps uses low-pressure live speaking practice so shy children can move from short answers to fuller, clearer responses over time.',
  },
  {
    question: 'Why do some children give only one-word answers?',
    answer:
      'Children often need sentence-building support, more response structure, and guided follow-up questions to move beyond one-word answers.',
  },
  {
    question: 'Do spoken English classes connect with grammar?',
    answer:
      'Yes. Better spoken English depends on grammar in use, sentence formation, and practice applying words clearly in real responses.',
  },
];

export default function SpokenEnglishClassesForKidsPage() {
  useEffect(() => {
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
        { '@type': 'ListItem', position: 2, name: 'Courses', item: 'https://tinystepslearning.com/courses' },
        { '@type': 'ListItem', position: 3, name: 'Spoken English Classes for Kids Online', item: canonicalUrl },
      ],
    };

    const courseSchema = createCourseSchema({
      name: 'Spoken English Classes for Kids Online',
      description:
        'Live spoken English classes for kids online focused on sentence expansion, confident responses, grammar in use, and speaking confidence.',
      url: canonicalUrl,
      educationalLevel: 'School-age spoken English support',
      teaches: ['spoken English', 'sentence expansion', 'grammar in use', 'response confidence', 'public speaking readiness'],
      areaServed: ['India', 'Worldwide'],
    });

    const faqSchema = {
      ...createFAQPageSchema(faqItems),
      '@id': `${canonicalUrl}#faq`,
    };

    applySeo({
      title: 'Spoken English Classes for Kids Online | Tiny Steps Learning',
      description:
        'Live spoken English classes for kids online. Help children move past one-word answers, build sentence confidence, and speak clearly with grammar-linked support.',
      canonicalPath,
      ogType: 'website',
      jsonLd: [breadcrumbSchema, courseSchema, faqSchema],
    });
  }, []);

  return (
    <LeadPageShell>
      <LeadHero
        eyebrow="Speaking confidence support"
        title="Spoken English Classes for Kids Online"
        description={
          <>
            <p>
              Tiny Steps helps children speak in fuller sentences, answer more confidently, and express ideas clearly through structured live spoken-English classes for kids online.
            </p>
            <p className="mt-3">
              This page is built for parents searching for spoken English classes for children, shy child speaking help, or stronger English speaking confidence for kids.
            </p>
          </>
        }
        trustChips={[
          { label: '5000+ students served', tone: 'warm' as const },
          { label: 'Families in 15+ countries', tone: 'cool' as const },
          { label: 'Grammar-linked speaking support', tone: 'neutral' as const },
          { label: 'Free speaking assessment', tone: 'mint' as const },
        ]}
        stats={[
          { label: 'Per class', value: '₹400', helper: 'current approved pricing' },
          { label: '12 classes', value: '₹4,800', helper: 'pricing preview for parents' },
          { label: 'Class style', value: 'Live', helper: '1:1 and small-group formats' },
          { label: 'Parent visibility', value: 'Weekly', helper: 'updates and next-step guidance' },
        ]}
        actions={
          <CourseCTAGroup
            items={[
              { to: '/book-demo', label: 'Book a Free Speaking Confidence Assessment', variant: 'primary' },
              { to: '/class-samples', label: 'See Class Samples', variant: 'secondary' },
              { to: '/pricing', label: 'See Pricing', variant: 'ghost' },
            ]}
            renderLink={(item, className) => (
              <Link key={item.label} to={item.to || '/'} className={className}>
                {item.label}
              </Link>
            )}
          />
        }
        aside={
          <LeadCard className="bg-[linear-gradient(160deg,#fff8ef_0%,#ffffff_48%,#fff0f3_100%)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">When parents land on this page</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {painPoints.map((item) => (
                <span key={item} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                  {item}
                </span>
              ))}
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-700">
              The child may understand English, but still freeze, shorten answers, or avoid speaking in class without structured support.
            </p>
          </LeadCard>
        }
      />

      <LeadSection>
        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <LeadCard className="bg-[linear-gradient(145deg,#0f172a_0%,#1e293b_100%)] text-white">
            <LeadSectionHeading
              eyebrow="Why children struggle to speak"
              title="Understanding is not the same as speaking confidence"
              description="Many children know the words, but they do not yet know how to expand ideas into clear spoken answers."
            />
            <div className="mt-5 space-y-3 text-sm leading-7 text-slate-200">
              <p>Some children hesitate because they are unsure of sentence structure.</p>
              <p>Some stay brief because one-word answers feel safer than trying a full response.</p>
              <p>Some are shy in class and need low-pressure speaking turns before they start participating more naturally.</p>
            </div>
          </LeadCard>

          <LeadCard>
            <LeadSectionHeading
              eyebrow="How Tiny Steps helps"
              title="Speaking confidence grows through structure"
              description="Tiny Steps connects spoken English practice with grammar, sentence formation, and real-time guided speaking turns."
            />
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                'Builds response length through sentence starters and follow-up prompts.',
                'Links speaking with grammar in use so children can apply better sentence structure while speaking.',
                'Uses storytelling, show-and-tell, and answer routines to improve clarity and confidence.',
                'Gives parents visibility into what improved and what needs more practice next.',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm leading-7 text-slate-700">
                  {item}
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm leading-7 text-slate-700">
              Parents often pair this page with{' '}
              <Link to="/grammar" className="font-semibold underline underline-offset-4">
                grammar
              </Link>{' '}
              and{' '}
              <Link to="/speaking" className="font-semibold underline underline-offset-4">
                speaking
              </Link>{' '}
              because fuller answers usually depend on both confidence and sentence structure.
            </p>
          </LeadCard>
        </div>
      </LeadSection>

      <LeadSection>
        <div className="grid gap-5 lg:grid-cols-2">
          <LeadCard>
            <LeadSectionHeading
              eyebrow="Assessment path"
              title="How the speaking confidence assessment works"
              description="The goal is to identify why the child is getting stuck while speaking, not just whether they are shy."
            />
            <ol className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
              <li>1. Tiny Steps checks response length, clarity, sentence formation, and comfort while speaking.</li>
              <li>2. We identify whether the next step is spoken-English practice, grammar-linked sentence work, or broader speaking-confidence support.</li>
              <li>3. Parents receive a practical recommendation before enrollment.</li>
            </ol>
          </LeadCard>

          <LeadCard className="bg-[linear-gradient(150deg,#ecfdf5_0%,#ffffff_45%,#fff8ef_100%)]">
            <LeadSectionHeading
              eyebrow="Pricing and trust proof"
              title="Clear pricing, real trust signals"
              description="Parents should be able to compare value before they decide."
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
              <p>• Founder and teacher-led live learning</p>
              <p>• Class samples and assessment before parents decide</p>
            </div>
          </LeadCard>
        </div>
      </LeadSection>

      <LeadSection>
        <LeadCard>
          <LeadSectionHeading
            eyebrow="Parents also ask"
            title="FAQs"
            description="Answer-first wording helps parents compare whether this page matches their child’s current challenge."
          />
          <div className="mt-6">
            <FAQSection items={faqItems.map((item) => ({ question: item.question, answer: item.answer }))} />
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection>
        <FinalLeadCTA
          title="Ready to help your child speak more confidently?"
          description={
            <>
              If your child gives one-word answers, hesitates in class, or needs sentence expansion support, start with a free speaking confidence assessment.
            </>
          }
          actions={
            <CourseCTAGroup
              items={[
                { to: '/book-demo', label: 'Book a Free Speaking Confidence Assessment', variant: 'primary' },
                { to: '/contact', label: 'Contact Tiny Steps', variant: 'ghost' },
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
