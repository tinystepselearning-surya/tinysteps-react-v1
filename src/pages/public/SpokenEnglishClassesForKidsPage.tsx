import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PUBLIC_SESSION_DURATION_LABEL, PUBLIC_SITE_FACTS } from '../../config/publicFacts';
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

const canonicalPath = '/spoken-english-classes-for-kids-online';
const canonicalUrl = `${PUBLIC_FACTS.primaryWebsite}${canonicalPath}`;
const demoMinutes = PUBLIC_SITE_FACTS.standardOffer.demoDurationMinutes;
const starterPackage = ONE_TO_ONE_MONTHLY_PACKAGES[0];
const seoTitle = 'Spoken English Classes for Kids Online | Live 1:1 | Tiny Steps';
const seoDescription =
  'Live 1:1 spoken English classes for kids in India and worldwide. Build fuller sentences, conversational fluency, grammar in use and speaking confidence in 35-minute classes.';

const SPOKEN_ENGLISH_SEO_KEYWORDS = [
  'spoken English classes for kids online',
  'English speaking classes for kids',
  'online spoken English classes for kids',
  '1 to 1 spoken English classes for kids',
  'English fluency classes for kids',
  'conversational English classes for kids',
  'English conversation classes for kids online',
  'online English speaking practice for kids',
  'spoken English classes for NRI kids',
  'online English speaking tutor for kids',
  'online spoken English classes for kids worldwide',
];

const painPoints = [
  'Child gives one-word answers',
  'Child understands English but does not speak confidently',
  'Child needs sentence expansion',
  'Child hesitates in everyday conversation',
];

const faqItems = [
  {
    question: 'What if my child understands English but does not speak much?',
    answer:
      'That usually means the child needs guided speaking turns, sentence expansion, and confidence practice, not just more listening exposure.',
  },
  {
    question: 'Can spoken English classes help a child who hesitates to speak?',
    answer:
      'Yes, when the hesitation is mainly linked to limited sentence-building, response practice, or conversational fluency. If confidence itself is the main difficulty across different situations, the dedicated Tiny Steps confidence-building programme may be a better fit.',
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
  {
    question: 'What is the difference between spoken English and public speaking classes?',
    answer:
      'Spoken English focuses on everyday sentence formation, fluency, response length, and comfortable conversation. Public speaking adds structured presentation, storytelling, show-and-tell, audience awareness, and broader communication skills. Parents looking mainly for public speaking should use the Tiny Steps Speaking program.',
  },
  {
    question: 'Are Tiny Steps spoken English classes live and 1:1?',
    answer:
      `Yes. Standard Tiny Steps spoken English classes are live 1:1 online classes and run for ${PUBLIC_SESSION_DURATION_LABEL}. Small-group options may also be available for selected schedules or programme fits.`,
  },
  {
    question: 'Can NRI families and children outside India join?',
    answer:
      'Yes. Tiny Steps supports families in India and worldwide. Families in the UAE, United States, United Kingdom, Australia, Singapore and other locations can enquire for suitable live online timings, subject to teacher and slot availability.',
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

    const webpageSchema = {
      ...createWebPageSchema({
        name: 'Spoken English Classes for Kids Online',
        description: seoDescription,
        url: canonicalUrl,
      }),
      '@id': `${canonicalUrl}#webpage`,
    };

    const courseSchema = createCourseSchema({
      name: 'Spoken English Classes for Kids Online',
      description:
        'Live spoken English classes for kids online focused on sentence expansion, confident responses, grammar in use, and speaking confidence.',
      url: canonicalUrl,
      educationalLevel: 'Children’s spoken English support; placement based on current speaking ability and learning fit',
      teaches: ['spoken English', 'conversational English', 'sentence expansion', 'grammar in use', 'English fluency', 'response confidence'],
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
      keywords: SPOKEN_ENGLISH_SEO_KEYWORDS,
      jsonLd: [breadcrumbSchema, webpageSchema, courseSchema, faqSchema],
    });
  }, []);

  return (
    <LeadPageShell>
      <LeadHero
        eyebrow="Live spoken English • India and worldwide"
        title="Spoken English Classes for Kids Online"
        description={
          <>
            <p>
              Tiny Steps helps children speak in fuller sentences, improve English fluency, answer more confidently, and express ideas clearly through structured live spoken-English classes for kids online.
            </p>
            <p className="mt-3">
              Live 1:1 support is available to families in India and worldwide, including NRI families looking for teacher-led English speaking practice across compatible time zones.
            </p>
          </>
        }
        trustChips={[
          { label: '5000+ students served', tone: 'warm' as const },
          { label: 'Families in 15+ countries', tone: 'cool' as const },
          { label: `Live 1:1 • ${PUBLIC_SESSION_DURATION_LABEL}`, tone: 'neutral' as const },
          { label: 'Free speaking assessment', tone: 'mint' as const },
        ]}
        stats={[
          { label: 'Per class', value: formatINR(PER_CLASS_PRICE), helper: 'current approved pricing' },
          { label: `${starterPackage.classes} classes`, value: formatINR(starterPackage.monthlyFee), helper: 'pricing preview for parents' },
          { label: 'Standard class', value: PUBLIC_SESSION_DURATION_LABEL, helper: 'live teacher-guided session' },
          { label: 'Delivery', value: 'Online', helper: 'India and worldwide' },
        ]}
        actions={
          <CourseCTAGroup
            items={[
              { to: '/book-demo', label: 'Book a Free Speaking Assessment', variant: 'primary' },
              { to: '/speaking', label: 'Compare Public Speaking Support', variant: 'secondary' },
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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">When spoken-English support is a good fit</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {painPoints.map((item) => (
                <span key={item} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                  {item}
                </span>
              ))}
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-700">
              The child may understand English, but still freeze, shorten answers, or avoid speaking in class without structured sentence and fluency practice.
            </p>
          </LeadCard>
        }
      />

      <LeadSection>
        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <LeadCard className="bg-[linear-gradient(145deg,#0f172a_0%,#1e293b_100%)] text-white">
            <LeadSectionHeading
              eyebrow="Why children struggle to speak"
              title="Understanding is not the same as speaking fluency"
              description="Many children know the words, but they do not yet know how to expand ideas into clear spoken answers."
            />
            <div className="mt-5 space-y-3 text-sm leading-7 text-slate-200">
              <p>Some children hesitate because they are unsure of sentence structure.</p>
              <p>Some stay brief because one-word answers feel safer than trying a full response.</p>
              <p>Some need repeated live conversation practice before spoken English becomes more automatic.</p>
            </div>
          </LeadCard>

          <LeadCard>
            <LeadSectionHeading
              eyebrow="How Tiny Steps helps"
              title="Spoken English improves through guided use"
              description="Tiny Steps connects speaking practice with grammar, sentence formation, vocabulary, and real-time guided speaking turns."
            />
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                'Builds response length through sentence starters and follow-up prompts.',
                'Links speaking with grammar in use so children apply better sentence structure while speaking.',
                'Uses conversation, storytelling, and answer routines to improve fluency and clarity.',
                'Gives parents visibility into what improved and what needs more practice next.',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm leading-7 text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </LeadCard>
        </div>
      </LeadSection>

      <LeadSection>
        <LeadCard className="bg-[linear-gradient(150deg,#eef8ff_0%,#ffffff_50%,#fff8ef_100%)]">
          <LeadSectionHeading
            eyebrow="Spoken English vs public speaking"
            title="Choose the page that matches the child’s main goal"
            description="Keeping these intents separate helps parents find the right starting point without duplicating programme ownership."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-sky-200 bg-white p-5 text-sm leading-7 text-slate-700">
              <strong className="text-slate-900">Choose spoken English</strong> when the main goal is fuller everyday answers, conversational fluency, sentence expansion, and comfortable English speaking.
            </div>
            <div className="rounded-2xl border border-orange-200 bg-white p-5 text-sm leading-7 text-slate-700">
              <strong className="text-slate-900">Choose public speaking & communication</strong> for storytelling, presentations, show-and-tell, audience awareness, and broader communication skills.{' '}
              <Link to="/speaking" className="font-semibold underline underline-offset-4">Explore Public Speaking & Communication</Link>.
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-violet-200 bg-white p-5 text-sm leading-7 text-slate-700">
              <strong className="text-slate-900">Choose grammar support</strong> when tense, sentence structure, articles, prepositions, punctuation, or correction accuracy is the main gap.{' '}
              <Link to="/grammar" className="font-semibold underline underline-offset-4">Explore Grammar Classes</Link>.
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-white p-5 text-sm leading-7 text-slate-700">
              <strong className="text-slate-900">Choose confidence-building support</strong> when hesitation or participation confidence is the primary need across situations rather than English fluency alone.{' '}
              <Link to="/confidence-building-program-kids" className="font-semibold underline underline-offset-4">Explore Confidence Building</Link>.
            </div>
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection>
        <div className="grid gap-5 lg:grid-cols-2">
          <LeadCard>
            <LeadSectionHeading
              eyebrow="Assessment path"
              title="How the spoken English assessment works"
              description="The goal is to identify why the child is getting stuck while speaking, not just whether they are shy."
            />
            <ol className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
              <li>1. Tiny Steps checks response length, clarity, sentence formation, vocabulary use, and comfort while speaking.</li>
              <li>2. We identify whether the next step is spoken-English practice, grammar support, broader public-speaking/communication work, or a confidence-building programme.</li>
              <li>3. Parents receive a practical recommendation before enrolment.</li>
            </ol>
          </LeadCard>

          <LeadCard className="bg-[linear-gradient(150deg,#ecfdf5_0%,#ffffff_45%,#fff8ef_100%)]">
            <LeadSectionHeading
              eyebrow="Pricing and international access"
              title="Clear pricing for live online support"
              description="Families can understand the standard offer before deciding."
            />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Per class</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{formatINR(PER_CLASS_PRICE)}</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Standard class</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{PUBLIC_SESSION_DURATION_LABEL}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm leading-7 text-slate-700">
              <p>• 5000+ students served</p>
              <p>• Families in 15+ countries</p>
              <p>• NRI and international families can enquire for compatible live timings</p>
              <p>• One free {demoMinutes}-minute 1:1 assessment before parents decide</p>
            </div>
          </LeadCard>
        </div>
      </LeadSection>

      <LeadSection>
        <LeadCard>
          <LeadSectionHeading
            eyebrow="Parents also ask"
            title="Frequently asked questions"
            description="Concise answers help parents decide whether spoken-English support matches the child’s current need."
          />
          <div className="mt-6">
            <FAQSection items={faqItems.map((item) => ({ question: item.question, answer: item.answer }))} />
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection>
        <FinalLeadCTA
          title="Ready to help your child speak in fuller English sentences?"
          description={
            <>
              If your child gives one-word answers, hesitates in everyday conversation, or needs stronger English fluency, start with one free {demoMinutes}-minute 1:1 assessment.
            </>
          }
          actions={
            <CourseCTAGroup
              items={[
                { to: '/book-demo', label: 'Book a Free Speaking Assessment', variant: 'primary' },
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
