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
  'Child gives one-word or very short answers',
  'Child understands English but struggles to respond',
  'Child needs fuller everyday sentences',
  'Child finds it hard to continue a conversation',
];

const faqItems = [
  {
    question: 'What if my child understands English but does not speak much?',
    answer:
      'That usually means the child needs guided speaking turns, sentence expansion, and low-pressure response practice, not just more listening exposure.',
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
  {
    question: 'Are Spoken English classes in Hyderabad a separate Tiny Steps course?',
    answer:
      'No. Hyderabad families who specifically need everyday Spoken English use this same live online Spoken English programme. The separate Hyderabad English page is a broad local chooser for families who are not yet sure whether the child needs phonics, reading, grammar, writing, Spoken English, or Public Speaking.',
  },
  {
    question: 'How should correction work while a child is speaking?',
    answer:
      'The child should have a chance to complete the idea. The teacher can then focus on one useful current target, give a short cue or model, allow a retry, and check the same skill again in a fresh speaking turn instead of interrupting every possible mistake.',
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
        'Live spoken English classes for kids online focused on everyday conversation, fuller spoken responses, vocabulary in use, grammar in use, and conversational fluency.',
      url: canonicalUrl,
      educationalLevel: 'Children’s spoken English support; placement based on current speaking ability and learning fit',
      teaches: ['spoken English', 'conversational English', 'fuller spoken responses', 'grammar in use', 'vocabulary in use', 'English fluency'],
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
              Tiny Steps helps children move beyond one-word or very short answers, build fuller everyday responses, continue conversations, and use English more comfortably through structured live spoken-English classes for kids online.
            </p>
            <p className="mt-3">
              Live 1:1 support is available to families in India and worldwide, including NRI families looking for teacher-led English speaking practice across compatible time zones.
            </p>
          </>
        }
        trustChips={[
          { label: PUBLIC_SITE_FACTS.learnerReach.learnersLabel, tone: 'warm' as const },
          { label: PUBLIC_SITE_FACTS.learnerReach.countriesLabel, tone: 'cool' as const },
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
              The child may understand English but still answer briefly, need too much prompting, or struggle to keep an everyday conversation going without guided sentence and fluency practice.
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
                'Uses everyday conversation, follow-up questions, and answer routines to improve fluency and clarity.',
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
        <LeadCard className="bg-[linear-gradient(150deg,#f0fdf4_0%,#ffffff_52%,#eff6ff_100%)]">
          <LeadSectionHeading
            eyebrow="Everyday conversation pathway"
            title="What children practise in Spoken English"
            description="This is a practice flow, not a separate set of invented levels. The teacher starts from the child’s current speaking ability and increases independence step by step."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {[
              ['1', 'Give a fuller response', 'Move beyond a one-word or fragment answer when the child has more to say.'],
              ['2', 'Build a useful sentence', 'Use a complete spoken sentence with the vocabulary and grammar needed for the meaning.'],
              ['3', 'Add one relevant detail', 'Extend the answer naturally instead of stopping after the first sentence.'],
              ['4', 'Continue the exchange', 'Listen to a follow-up question and respond without needing the whole answer supplied.'],
              ['5', 'Use it in a fresh situation', 'Apply the same speaking skill to a new everyday question or context with less prompting.'],
            ].map(([step, title, detail]) => (
              <article key={title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">{step}</span>
                <h3 className="mt-3 text-base font-semibold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{detail}</p>
              </article>
            ))}
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection>
        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <LeadCard>
            <LeadSectionHeading
              eyebrow="Live teacher correction"
              title="Correction should help the child keep speaking"
              description="Tiny Steps uses the same responsive teaching principle across live classes: let the child attempt the idea, focus on a useful current target, guide a retry, and then check whether the child can use the skill again."
            />
            <ol className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
              <li><strong className="text-slate-900">1. Child attempts:</strong> the teacher first hears how the child naturally answers the question.</li>
              <li><strong className="text-slate-900">2. One useful cue or model:</strong> feedback targets the sentence, vocabulary, or speaking behaviour that matters for the current goal instead of interrupting every possible mistake.</li>
              <li><strong className="text-slate-900">3. Retry:</strong> the child says the idea again with the correction applied.</li>
              <li><strong className="text-slate-900">4. Fresh use:</strong> another question checks whether the child can use the same skill with less help.</li>
            </ol>
          </LeadCard>

          <LeadCard className="bg-[linear-gradient(150deg,#fff7ed_0%,#ffffff_50%,#f8fafc_100%)]">
            <LeadSectionHeading
              eyebrow="See how live teaching works"
              title="Inspect the teaching style before enrolment"
              description="Class samples show the broader Tiny Steps live-teaching pattern: active child practice, teacher support in real time, gentle correction, and encouragement to try again."
            />
            <div className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
              <p>Use class samples to understand teaching style and participation.</p>
              <p>Use the free 1:1 assessment to understand your own child’s speaking starting point and programme fit.</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/class-samples" className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
                View class samples
              </Link>
              <Link to="/book-demo" className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">
                Book the free assessment
              </Link>
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
          <LeadCard className="bg-[linear-gradient(145deg,#eff6ff_0%,#ffffff_55%,#f0fdf4_100%)]">
            <LeadSectionHeading
              eyebrow="One Spoken English programme"
              title="Spoken English for Hyderabad, India, and families worldwide"
              description="Tiny Steps uses this same canonical Spoken English programme for subject-specific conversational-English needs rather than creating separate city versions."
            />
            <div className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
              <p>
                If a Hyderabad family is specifically looking for Spoken English classes for a child, this is the subject programme to use. Classes remain live and online.
              </p>
              <p>
                If the family is still deciding between phonics, reading, grammar, writing, Spoken English, or Public Speaking, the{' '}
                <Link to="/online-english-classes-hyderabad" className="font-semibold underline underline-offset-4">
                  broad Hyderabad English page
                </Link>{' '}
                remains the local programme chooser.
              </p>
              <p>
                Families elsewhere in India and internationally use this same Spoken English owner, subject to compatible teacher timings and learning fit.
              </p>
            </div>
          </LeadCard>

          <LeadCard>
            <LeadSectionHeading
              eyebrow="Visible progress"
              title="What parents can look for over time"
              description="Spoken-English progress should show in fresh conversation, not only in a rehearsed sentence."
            />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                'Longer, relevant everyday responses',
                'Less prompting to begin or continue an answer',
                'More useful vocabulary in spontaneous speech',
                'Better grammar transfer while speaking',
                'Ability to answer a follow-up question',
                'Use of the same skill in a fresh conversation',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm leading-6 text-slate-700">
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
              <p>• {PUBLIC_LEARNER_REACH_LABEL}</p>
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
              If your child gives very short everyday answers, struggles to continue a conversation, or needs stronger English fluency, start with one free {demoMinutes}-minute 1:1 assessment.
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
