import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PUBLIC_LEARNER_REACH_LABEL,
  PUBLIC_SESSION_DURATION_LABEL,
  PUBLIC_SITE_FACTS,
} from '../../config/publicFacts';
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

const canonicalPath = '/confidence-building-program-kids';
const canonicalUrl = `${PUBLIC_FACTS.primaryWebsite}${canonicalPath}`;
const demoMinutes = PUBLIC_SITE_FACTS.standardOffer.demoDurationMinutes;
const starterPackage = ONE_TO_ONE_MONTHLY_PACKAGES[0];
const seoTitle = 'Confidence Building Classes for Kids | Live 1:1 | Tiny Steps';
const seoDescription =
  'Live 1:1 confidence building classes for kids in India and worldwide. Build speaking comfort, participation confidence, response initiation and independent expression in 35-minute classes.';

const CONFIDENCE_SEO_KEYWORDS = [
  'confidence building classes for kids',
  'confidence building program for kids',
  'online confidence building classes for kids',
  '1 to 1 confidence building classes for kids',
  'speaking confidence classes for kids',
  'confidence classes for shy children',
  'live confidence building classes for kids',
  'online confidence program for kids',
  'confidence building classes for children',
  'confidence building classes for kids worldwide',
];

const fitSignals = [
  'Knows what to say but waits for repeated prompting',
  'Speaks more freely at home than in class-style situations',
  'Avoids volunteering or unfamiliar speaking turns',
  'Stops quickly after a mistake or uncertain answer',
];

const progressSignals = [
  {
    title: 'Starts more readily',
    detail: 'The child begins a response with less waiting, reassurance, or repeated adult prompting.',
  },
  {
    title: 'Needs fewer prompts',
    detail: 'The teacher can reduce sentence starters, choices, and repeated cues while the child keeps participating.',
  },
  {
    title: 'Recovers after mistakes',
    detail: 'A small error or uncertain answer is less likely to stop the interaction; the child can retry and continue.',
  },
  {
    title: 'Stays in the exchange',
    detail: 'The child sustains more than one speaking turn instead of withdrawing after the first answer.',
  },
  {
    title: 'Transfers to fresh tasks',
    detail: 'The same participation confidence appears on a new question, topic, listener, or speaking situation.',
  },
];

const confidenceSteps = [
  {
    number: '01',
    title: 'Make the first speaking turn feel manageable',
    text: 'The teacher begins with predictable, age-appropriate prompts and enough wait time for the child to enter the interaction without being rushed.',
  },
  {
    number: '02',
    title: 'Build successful response initiation',
    text: 'The child practises starting an answer, choosing words, and completing a short response before the adult supplies the language.',
  },
  {
    number: '03',
    title: 'Reduce support without removing safety',
    text: 'Prompts, sentence starters, choices, and reassurance are faded gradually so the child does more of the communication independently.',
  },
  {
    number: '04',
    title: 'Practise recovery, not perfection',
    text: 'Children learn that a pause, correction, or imperfect answer does not end the task. They retry, clarify, and continue.',
  },
  {
    number: '05',
    title: 'Check confidence on a fresh task',
    text: 'Progress is checked on unfamiliar questions, topics, or classroom-style speaking situations rather than only on rehearsed answers.',
  },
];

const programmeChoices = [
  {
    label: 'Confidence Building',
    tone: 'border-orange-200 bg-orange-50/70',
    fit: 'Choose this when hesitation, participation comfort, response initiation, or dependence on prompting is the primary barrier.',
    href: canonicalPath,
    linkLabel: 'You are on this pathway',
  },
  {
    label: 'Public Speaking & Communication',
    tone: 'border-sky-200 bg-sky-50/70',
    fit: 'Choose this when the child needs broader communication: listening, questioning, explanation, reasoning, dialogue, storytelling, audience awareness, or presentations.',
    href: '/speaking',
    linkLabel: 'Explore Speaking & Communication',
  },
  {
    label: 'Spoken English',
    tone: 'border-emerald-200 bg-emerald-50/70',
    fit: 'Choose this when everyday conversation, fuller English responses, vocabulary in use, or conversational fluency is the main goal.',
    href: '/spoken-english-classes-for-kids-online',
    linkLabel: 'Explore Spoken English',
  },
  {
    label: 'Grammar',
    tone: 'border-violet-200 bg-violet-50/70',
    fit: 'Choose this when the child is willing to speak but sentence structure, tense control, articles, prepositions, or grammar accuracy are the stronger problem.',
    href: '/grammar',
    linkLabel: 'Explore Grammar',
  },
];

const faqItems = [
  {
    question: 'What are confidence building classes for kids?',
    answer:
      'Confidence building classes give children repeated, guided opportunities to start responses, participate, explain simple ideas, recover from mistakes, and speak with gradually less prompting. The goal is stronger speaking comfort and more independent participation, not performance pressure.',
  },
  {
    question: 'Who is the Confidence Building programme for?',
    answer:
      'It is designed for children whose main barrier is confidence itself: they may know what they want to say but hesitate to begin, avoid participating, depend heavily on prompts, or become much quieter in speaking situations.',
  },
  {
    question: 'Is this the same as Public Speaking & Communication classes?',
    answer:
      'No. Public Speaking & Communication is broader. It develops listening, questioning, clarification, explanation, reasoning, dialogue, storytelling, audience communication and presentations. Confidence Building is the specialist pathway when participation comfort and independence are the primary barrier.',
  },
  {
    question: 'Is this the same as Spoken English classes?',
    answer:
      'No. Spoken English is the clearer owner when the main goal is everyday conversation, sentence expansion, vocabulary in use, or conversational fluency. Confidence Building is for children who can often form ideas but hesitate, withdraw, or depend heavily on prompting.',
  },
  {
    question: 'What if grammar or sentence accuracy is the real problem?',
    answer:
      'If the child is willing to speak but repeatedly struggles with tense control, sentence structure, articles, prepositions, or grammatical accuracy, the Grammar programme is usually the clearer starting point. The free assessment helps separate confidence from language-skill gaps.',
  },
  {
    question: 'Are Tiny Steps confidence building classes live and 1:1?',
    answer:
      `Yes. Standard Tiny Steps 1:1 classes are live online and run for ${PUBLIC_SESSION_DURATION_LABEL}. The format gives the child direct speaking time, teacher wait time, guided retries, and individual pacing.`,
  },
  {
    question: 'Can families outside India join?',
    answer:
      'Yes. Tiny Steps supports families in India and worldwide, subject to compatible teacher timings and learning fit.',
  },
  {
    question: 'How do parents know whether confidence is improving?',
    answer:
      'Look for observable changes across fresh speaking situations: the child starts responses more readily, needs fewer prompts, participates more consistently, recovers from mistakes more comfortably, stays in the interaction longer, and transfers those gains to new tasks.',
  },
  {
    question: 'Will teachers force eye contact, loud speaking, or a particular accent?',
    answer:
      'No. The programme focuses on participation, intelligibility, listener awareness, comfortable attention, and growing independence. Accent conformity, forced eye contact, loudness, or extroversion are not treated as confidence goals.',
  },
  {
    question: 'Is this programme a treatment for anxiety or a speech or language disorder?',
    answer:
      'No. Tiny Steps provides educational English and communication support, not clinical diagnosis or treatment. If a child has persistent anxiety, speech, language, hearing, or developmental concerns, parents should also seek guidance from an appropriately qualified professional.',
  },
];

export default function ConfidenceBuildingProgramKidsPage() {
  useEffect(() => {
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${PUBLIC_FACTS.primaryWebsite}/` },
        { '@type': 'ListItem', position: 2, name: 'Speaking & Communication', item: `${PUBLIC_FACTS.primaryWebsite}/speaking` },
        { '@type': 'ListItem', position: 3, name: 'Confidence Building Classes for Kids', item: canonicalUrl },
      ],
    };

    const webpageSchema = {
      ...createWebPageSchema({
        name: 'Confidence Building Classes for Kids',
        description: seoDescription,
        url: canonicalUrl,
      }),
      '@id': `${canonicalUrl}#webpage`,
    };

    const courseSchema = createCourseSchema({
      name: 'Confidence Building Classes for Kids',
      description:
        'Live 1:1 online confidence building classes for children whose primary barrier is speaking comfort, participation confidence, response initiation, or independent expression.',
      url: canonicalUrl,
      educationalLevel: 'School-age confidence support with assessment-led placement',
      teaches: [
        'speaking comfort',
        'participation confidence',
        'response initiation',
        'independent expression',
        'recovery after mistakes',
        'confidence transfer to fresh speaking tasks',
      ],
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
      robots: 'index,follow',
      ogType: 'website',
      keywords: CONFIDENCE_SEO_KEYWORDS,
      jsonLd: [breadcrumbSchema, webpageSchema, courseSchema, faqSchema],
    });
  }, []);

  return (
    <LeadPageShell>
      <LeadHero
        eyebrow="Specialist confidence pathway • live 1:1"
        title="Confidence Building Classes for Kids"
        description={
          <>
            <p>
              Tiny Steps supports children who have ideas to share but hesitate to begin, participate less than they can, or depend heavily on adult prompting when speaking.
            </p>
            <p className="mt-3">
              This is a narrow confidence-and-participation pathway. It is not a second general Public Speaking course: the goal is to help the child enter, stay in, and recover within real communication with gradually less support.
            </p>
          </>
        }
        trustChips={[
          { label: PUBLIC_LEARNER_REACH_LABEL, tone: 'warm' as const },
          { label: `Live 1:1 • ${PUBLIC_SESSION_DURATION_LABEL}`, tone: 'cool' as const },
          { label: 'Assessment-led placement', tone: 'neutral' as const },
          { label: 'India + worldwide', tone: 'mint' as const },
        ]}
        stats={[
          { label: 'Free assessment', value: `${demoMinutes} min`, helper: '1:1 programme-fit check' },
          { label: 'Standard class', value: PUBLIC_SESSION_DURATION_LABEL, helper: 'live teacher-guided session' },
          { label: 'Per class', value: formatINR(PER_CLASS_PRICE), helper: 'current approved reference price' },
          { label: `${starterPackage.classes} classes`, value: formatINR(starterPackage.monthlyFee), helper: 'starter-plan pricing preview' },
        ]}
        actions={
          <CourseCTAGroup
            items={[
              { to: '/book-demo', label: `Book Free ${demoMinutes}-Minute Assessment`, variant: 'primary' },
              { to: '/speaking', label: 'Compare Speaking & Communication', variant: 'secondary' },
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
          <LeadCard className="bg-[linear-gradient(155deg,#fff7ed_0%,#ffffff_48%,#f5f3ff_100%)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">This pathway is worth checking when</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {fitSignals.map((item) => (
                <span key={item} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                  {item}
                </span>
              ))}
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-700">
              The assessment checks whether confidence is truly the bottleneck, or whether the child would make better progress in Spoken English, Grammar, or the broader Speaking & Communication programme.
            </p>
          </LeadCard>
        }
      />

      <LeadSection>
        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <LeadCard className="bg-[linear-gradient(145deg,#0f172a_0%,#1e293b_100%)] text-white">
            <LeadSectionHeading
              eyebrow="Quick answer"
              title="Choose Confidence Building when confidence itself is the bottleneck"
              description="The child may know the answer, understand the topic, or have an idea to share—but participation drops because starting, continuing, or recovering feels difficult."
            />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                'Hesitates before ordinary speaking turns',
                'Needs repeated reassurance or prompting',
                'Becomes much quieter under speaking pressure',
                'Withdraws quickly after an error or uncertain answer',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </LeadCard>

          <LeadCard>
            <LeadSectionHeading
              eyebrow="Important boundary"
              title="Confidence is not the same as a language-skill gap"
              description="A quiet or hesitant child may actually need sentence-building, grammar, vocabulary, or broader communication support. Placement starts by separating those needs."
            />
            <div className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
              <p><strong className="text-slate-950">If the child cannot build the sentence:</strong> check Spoken English or Grammar.</p>
              <p><strong className="text-slate-950">If the child can speak but needs broader communication:</strong> check Speaking & Communication.</p>
              <p><strong className="text-slate-950">If the child can often do the task but hesitates to enter or stay in it:</strong> Confidence Building may be the better fit.</p>
            </div>
          </LeadCard>
        </div>
      </LeadSection>

      <LeadSection>
        <LeadCard className="bg-[linear-gradient(150deg,#fff7ed_0%,#ffffff_50%,#eff6ff_100%)]">
          <LeadSectionHeading
            eyebrow="Confidence pathway"
            title="How Tiny Steps builds participation without turning confidence into performance"
            description="There is no fixed personality target. The teacher creates manageable speaking turns, fades support, and checks whether the child can carry the skill into a fresh situation."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {confidenceSteps.map((step) => (
              <article key={step.number} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">{step.number}</span>
                <h3 className="mt-4 text-base font-semibold leading-6 text-slate-950">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{step.text}</p>
              </article>
            ))}
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection>
        <div className="grid gap-5 lg:grid-cols-2">
          <LeadCard>
            <LeadSectionHeading
              eyebrow="What the teacher does"
              title="Support is responsive, then deliberately reduced"
              description="The teacher should help enough for the child to participate—but not so much that the adult keeps building the answer."
            />
            <ol className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
              <li><strong className="text-slate-950">1. Wait:</strong> give the child time to process and begin.</li>
              <li><strong className="text-slate-950">2. Prompt lightly:</strong> use one cue, choice, or sentence start only when needed.</li>
              <li><strong className="text-slate-950">3. Let the child finish:</strong> avoid completing the whole response on the child&apos;s behalf.</li>
              <li><strong className="text-slate-950">4. Retry after feedback:</strong> a mistake becomes another attempt, not a failed performance.</li>
              <li><strong className="text-slate-950">5. Fade support:</strong> remove prompts as soon as the child can carry more of the turn independently.</li>
            </ol>
          </LeadCard>

          <LeadCard className="bg-[linear-gradient(145deg,#eff6ff_0%,#ffffff_52%,#f0fdf4_100%)]">
            <LeadSectionHeading
              eyebrow="What Tiny Steps does not optimise for"
              title="Confidence does not mean louder, more extroverted, or accent-neutral"
              description="The target is functional participation and growing independence—not a particular personality style."
            />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                'No forced eye contact',
                'No accent conformity goal',
                'No “speak louder = more confident” rule',
                'No pressure to perform before the child is ready',
                'No fixed extroversion target',
                'No confidence guarantee in a set number of classes',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold leading-6 text-slate-700">
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
            eyebrow="Programme fit"
            title="Choose the pathway that matches the child&apos;s primary barrier"
            description="These programmes can look similar from the outside, but they solve different problems. The assessment is used to identify which one should own the next step."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {programmeChoices.map((item) => (
              <article key={item.label} className={`rounded-2xl border p-5 ${item.tone}`}>
                <h3 className="text-lg font-semibold text-slate-950">{item.label}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-700">{item.fit}</p>
                {item.href === canonicalPath ? (
                  <span className="mt-4 inline-flex text-sm font-semibold text-slate-500">{item.linkLabel}</span>
                ) : (
                  <Link to={item.href} className="mt-4 inline-flex text-sm font-semibold text-slate-900 underline underline-offset-4">
                    {item.linkLabel}
                  </Link>
                )}
              </article>
            ))}
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection>
        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <LeadCard className="bg-[linear-gradient(145deg,#fff7ed_0%,#ffffff_55%,#f8fafc_100%)]">
            <LeadSectionHeading
              eyebrow="Free assessment"
              title="What we check before recommending Confidence Building"
              description="The free 1:1 assessment is used to identify the primary barrier before a programme is recommended."
            />
            <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
              <li>• How readily the child starts without repeated prompting.</li>
              <li>• Whether the child can answer once the language demand is made manageable.</li>
              <li>• How confidence changes between familiar, guided, and fresh tasks.</li>
              <li>• How the child responds to wait time, correction, retry, and teacher support.</li>
              <li>• Whether grammar, spoken-English fluency, or broader communication is actually the stronger need.</li>
            </ul>
            <Link
              to="/book-demo"
              className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Book the free assessment
            </Link>
          </LeadCard>

          <LeadCard>
            <LeadSectionHeading
              eyebrow="Before enrolment"
              title="Inspect the teaching style, not just the programme name"
              description="Class samples show the broader Tiny Steps teaching pattern: active child participation, teacher wait time, guided correction, retries, and gradual reduction of support."
            />
            <div className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
              <p>Use class samples to understand how teachers involve children rather than speaking for them.</p>
              <p>Use the assessment to decide whether your own child needs specialist confidence work or another programme.</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/class-samples"
                className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                View class samples
              </Link>
              <Link
                to="/shy-child-speaking-confidence"
                className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Read the parent guide
              </Link>
            </div>
          </LeadCard>
        </div>
      </LeadSection>

      <LeadSection>
        <LeadCard className="bg-[linear-gradient(150deg,#f0fdf4_0%,#ffffff_50%,#f5f3ff_100%)]">
          <LeadSectionHeading
            eyebrow="Progress evidence"
            title="Measure confidence through behaviour on fresh speaking tasks"
            description="Progress should be observable. We do not use a fixed-class promise because the starting point, context, and underlying language demands differ from child to child."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {progressSignals.map((signal) => (
              <article key={signal.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="font-semibold text-slate-950">{signal.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{signal.detail}</p>
              </article>
            ))}
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection>
        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <LeadCard>
            <LeadSectionHeading
              eyebrow="Parent diagnostic"
              title="Is your child shy, or is something else making speaking difficult?"
              description="If you are still trying to understand the problem rather than choose classes, start with the parent guide. It separates confidence, language skill, unfamiliarity, and situational hesitation."
            />
            <Link
              to="/shy-child-speaking-confidence"
              className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Read: Shy Child Speaking Confidence Help
            </Link>
          </LeadCard>

          <LeadCard className="bg-[linear-gradient(145deg,#fff7ed_0%,#ffffff_58%,#f8fafc_100%)]">
            <LeadSectionHeading
              eyebrow="Educational, not clinical"
              title="Confidence classes are not anxiety or speech-language treatment"
              description="Tiny Steps provides educational English and communication support. We do not diagnose or treat anxiety, speech, language, hearing, or developmental conditions."
            />
            <p className="mt-4 text-sm leading-7 text-slate-700">
              If concerns are persistent, severe, or extend beyond English-learning situations, parents should also seek guidance from an appropriately qualified professional.
            </p>
          </LeadCard>
        </div>
      </LeadSection>

      <LeadSection id="faq">
        <LeadCard>
          <LeadSectionHeading
            eyebrow="Questions parents ask"
            title="Confidence Building FAQs"
            description="Direct answers about fit, class format, progress, programme boundaries, and what this pathway is designed to do."
          />
          <div className="mt-6">
            <FAQSection items={faqItems} />
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection className="pb-4">
        <FinalLeadCTA
          title="Not sure whether confidence is the real barrier?"
          description={`Start with the free ${demoMinutes}-minute 1:1 assessment. We’ll check how your child starts, responds, retries, and communicates, then recommend Confidence Building only when it is the clearest fit.`}
          actions={
            <>
              <Link
                to="/book-demo"
                className="inline-flex items-center justify-center rounded-full border border-white bg-white px-5 py-3 text-sm font-bold text-slate-950 shadow-[0_12px_26px_rgba(0,0,0,0.18)] transition hover:bg-orange-50"
              >
                Book Free {demoMinutes}-Minute Assessment
              </Link>
              <Link
                to="/speaking"
                className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:border-white/70 hover:bg-white/20"
              >
                Compare Speaking & Communication
              </Link>
            </>
          }
        />
      </LeadSection>
    </LeadPageShell>
  );
}
