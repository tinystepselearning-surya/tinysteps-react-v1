import { useEffect, useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { formatBlogDate } from '../../lib/date';
import { ORGANIZATION_ID, PUBLIC_FACTS, SITE_ORIGIN } from '../../lib/schemas';
import useRevealAnimations from '../../hooks/useRevealAnimations';
import AboutAuthor from '../../components/AboutAuthor';
import ResearchArticleHero from '../../components/blog/ResearchArticleHero';

const ARTICLE_SLUG = 'week-12-speaking-confidence-seeds';
const ARTICLE_PATH = `/blog/${ARTICLE_SLUG}`;
const ARTICLE_TITLE = 'Speaking Confidence Roadmap: A 7-Day Calm Plan for Kids (Ages 3-10)';
const ARTICLE_DESCRIPTION =
  'A research-backed Tiny Steps speaking confidence guide for ages 3-10: 10-minute routines, bravery-ladder practice, multilingual home support, and when to seek extra help.';
const ARTICLE_DATE = '2026-04-04';
const ARTICLE_READ_TIME = '12 min read';
const ARTICLE_HERO = '/blog/hero-research.jpg';
const BLOG_URL = `${SITE_ORIGIN}/blog`;
const ARTICLE_URL = `${SITE_ORIGIN}${ARTICLE_PATH}`;
const ARTICLE_KEYWORDS = [
  'speaking confidence for kids',
  'communication confidence for children',
  'shy child will not speak',
  'speaking activities for kids at home',
  'oral language development',
  'public speaking for kids beginner',
  'English speaking for kids in India',
  'my child understands English but will not speak',
  'how to help a shy child speak up',
  'speaking confidence roadmap',
];

const HERO_POINTS = [
  {
    label: 'What confidence really is',
    value: 'Safety plus repetition',
    detail: 'Children speak more when the task feels predictable, low-risk, and short enough to repeat tomorrow.',
  },
  {
    label: 'What the evidence supports',
    value: 'Structured oral language practice',
    detail: 'Purposeful talk, retell, feedback, and small-group rehearsal are better supported than performative speaking drills.',
  },
  {
    label: 'What multilingual homes need',
    value: 'Clarity without accent pressure',
    detail: 'Children can plan ideas in a home language and still build English speaking confidence without shame.',
  },
];

const SEARCH_PAIN_POINTS = [
  'My child talks at home but freezes in class or with relatives.',
  'My child understands English but will not speak it.',
  'Speaking practice turns into pressure too quickly.',
  'I need a calm plan for confidence, not a forced performance.',
];

const TOC = [
  { id: 'why-freeze', label: 'Why children freeze' },
  { id: 'what-confidence-is', label: 'What speaking confidence really is' },
  { id: 'age-expectations', label: 'Age-wise expectations' },
  { id: 'week-plan', label: 'The 7-day routine' },
  { id: 'scripts', label: 'Parent scripts' },
  { id: 'multilingual-homes', label: 'Multilingual homes' },
  { id: 'troubleshooting', label: 'Troubleshooting and support' },
  { id: 'quality-checklist', label: 'What good practice looks like' },
  { id: 'faq', label: 'FAQ' },
  { id: 'sources', label: 'Sources' },
];

const DEFINITIONS = [
  {
    term: 'Oral language',
    meaning: 'Speaking and listening skills that support communication and help children prepare for reading and writing.',
  },
  {
    term: 'Speaking confidence',
    meaning: 'The ability to share an idea clearly and calmly in a given setting through repeated, supportive practice.',
  },
  {
    term: 'Retell',
    meaning: 'Explaining what happened in a story or event using your own words.',
  },
  {
    term: 'Bravery ladder',
    meaning: 'A graded sequence of speaking tasks that moves from very easy to more demanding steps.',
  },
  {
    term: 'Home-language bridge',
    meaning: 'Planning ideas in a familiar language first, then shaping one English sentence for speaking practice.',
  },
];

const FREEZE_REASONS = [
  {
    title: 'The situation feels risky',
    detail: 'Some children stay silent because being wrong, being laughed at, or being watched feels bigger than the reward of answering.',
  },
  {
    title: 'They do not have a plan yet',
    detail: 'A child may know the idea but still need help turning it into one clear sentence or a short sequence like first, then, finally.',
  },
  {
    title: 'Language load is high',
    detail: 'In multilingual homes, ideas may be strong while English sentence control is still developing. That gap often looks like shyness from the outside.',
  },
  {
    title: 'Correction arrives too early',
    detail: 'If every attempt is interrupted for grammar, pronunciation, or volume, children often learn that silence feels safer than trying.',
  },
];

const CONFIDENCE_MARKERS = [
  'Say something clear, even if it is short.',
  'Stay with the idea for a moment instead of stopping after one word.',
  'Recover from a mistake without shutting down.',
  'Use age-appropriate voice tools such as volume, pace, and eye contact.',
];

const AGE_EXPECTATIONS = [
  {
    band: 'Ages 3-4',
    aim: 'Answer simple who, what, where, and why questions and talk briefly about daily activities.',
    support: 'One-object show-and-tell for 10 to 15 seconds and short turn-taking questions with a trusted adult.',
  },
  {
    band: 'Ages 4-5',
    aim: 'Stay with a short story, describe a picture, and use fuller sentences with more detail.',
    support: 'First, then, finally prompts and calm modelling when the story jumps around.',
  },
  {
    band: 'Ages 5-7',
    aim: 'Speak in small-group routines, role-play, and short classroom-style responses with support.',
    support: 'Bravery ladder levels one to three, plus picture retells and simple explanations.',
  },
  {
    band: 'Ages 7-10',
    aim: 'Explain ideas more clearly, join discussions, and attempt short planned presentations.',
    support: 'Bravery ladder levels three to five, voice-tool coaching, and basic audience awareness.',
  },
];

const BRAVERY_LADDER = [
  {
    level: 'Level 1',
    title: 'One word in the spotlight',
    detail: 'Name an object, answer one easy question, or say one feeling word.',
  },
  {
    level: 'Level 2',
    title: 'One full sentence',
    detail: 'Say one complete thought such as "I liked the story" or "I saw a kite."',
  },
  {
    level: 'Level 3',
    title: 'Two linked sentences',
    detail: 'Give a mini story or short explanation using two connected lines.',
  },
  {
    level: 'Level 4',
    title: 'Read or retell to one trusted person',
    detail: 'Read a short paragraph aloud or retell a familiar event to one calm listener.',
  },
  {
    level: 'Level 5',
    title: '30 to 60 seconds for a small audience',
    detail: 'Record a voice note, speak to a small group, or share with relatives after rehearsal.',
  },
];

const DAILY_STRUCTURE = [
  '2 minutes of a playful warm-up',
  '6 to 8 minutes of spotlight speaking',
  '2 minutes of one voice-tool game',
  '2 minutes of praise plus one gentle retry',
];

const WEEK_PLAN = [
  {
    day: 'Day 1',
    title: 'Safety and routine',
    focus: 'Choose one fixed spotlight moment and do 15 seconds on an easy topic. Whispering still counts as participation.',
    success: 'Your child completes the moment instead of avoiding it.',
  },
  {
    day: 'Day 2',
    title: 'One-sentence retell',
    focus: 'Read a tiny story or recall a real event, then ask for one complete sentence about what happened.',
    success: 'Your child retells one full sentence.',
  },
  {
    day: 'Day 3',
    title: 'Picture talk',
    focus: 'Show one picture, gather three details together, then use one detail in the spotlight.',
    success: 'Your child adds detail without freezing.',
  },
  {
    day: 'Day 4',
    title: 'Repeat the same step twice',
    focus: 'Keep the task short and do two attempts so the second try feels a little smoother than the first.',
    success: 'The second attempt is easier or faster.',
  },
  {
    day: 'Day 5',
    title: 'Voice tool day',
    focus: 'Play a volume ladder or pace game, then do the spotlight using the chosen voice tool.',
    success: 'Your child controls one voice tool for one line.',
  },
  {
    day: 'Day 6',
    title: 'Speaking game day',
    focus: 'Use a speaking game that feels playful rather than performative, such as picture talk or story prompts.',
    success: 'You hear more words, more ease, or a quicker start.',
  },
  {
    day: 'Day 7',
    title: 'Share and celebrate',
    focus: 'Replay the best attempt or repeat the strongest topic, then celebrate one visible improvement.',
    success: 'Your child feels proud and is willing to repeat next week.',
  },
];

const VOICE_TOOLS = [
  {
    title: 'Volume',
    detail: 'Library voice, normal voice, and party voice help children feel control instead of being told to "speak louder" all the time.',
  },
  {
    title: 'Pace',
    detail: 'A slower first sentence usually lowers pressure and makes the next sentence easier.',
  },
  {
    title: 'Eyes',
    detail: 'Three friendly looks are enough. Eye contact does not need to mean staring.',
  },
];

const SCRIPT_BLOCKS = [
  {
    title: 'Before the spotlight',
    lines: [
      'Just 15 seconds. One sentence is enough.',
      'I am on your team.',
    ],
  },
  {
    title: 'If your child gets stuck',
    lines: [
      'Start with: One thing I liked today...',
      'Try first, then, finally.',
    ],
  },
  {
    title: 'After the attempt',
    lines: [
      'I liked how you started.',
      'Let us try it once more, slower.',
    ],
  },
];

const MULTILINGUAL_POINTS = [
  {
    title: 'Do not erase the home language',
    detail: 'Home languages carry meaning, comfort, and fast thinking. They are part of the support system, not an obstacle.',
  },
  {
    title: 'Plan first, then speak in English',
    detail: 'Let the child explain the idea in a familiar language, then co-build one English sentence and repeat it in the spotlight.',
  },
  {
    title: 'Skip accent pressure',
    detail: 'For young children, clarity and willingness matter much more than sounding foreign or perfectly polished.',
  },
];

const TROUBLESHOOTING = [
  {
    title: 'If your child whispers',
    detail: 'Treat whispering as progress. Use the volume ladder as a game rather than a command to get louder.',
  },
  {
    title: 'If your child answers in one word',
    detail: 'Offer two choices such as fun or tricky so the child has an easy path into a longer sentence.',
  },
  {
    title: 'If your child avoids camera or online speaking',
    detail: 'Start with audio-only voice notes, then add a still photo, then short video. Graded steps hold better than forced exposure.',
  },
  {
    title: 'If correction causes tears',
    detail: 'Do not interrupt mid-sentence. Praise first, fix one tiny thing after the attempt, then offer a retry.',
  },
];

const SUPPORT_SIGNS = [
  'You are concerned about broader speech, language, or comprehension delay.',
  'Stuttering has lasted 3 to 6 months, includes struggle behaviours, or there is a family history.',
  'Your child speaks normally at home but not at school or in other settings for a long stretch.',
  'Sentence use stays very limited or speech remains unclear beyond what seems age-expected.',
];

const QUALITY_CHECKLIST = [
  'Practice is structured, short, and repeated at the same time each day.',
  'Children rehearse with one trusted adult before larger sharing.',
  'Feedback comes after the attempt, not during it.',
  'Story retell, picture talk, and discussion are treated as speaking practice, not only formal speeches.',
  'Home languages are used as a planning bridge instead of being treated as a problem.',
  'Speaking confidence is built in steps instead of by forcing sudden performance.',
];

const WEEK_WINS = [
  'Your child starts speaking faster than they did on day one.',
  'Your child can use one complete sentence in the spotlight more reliably.',
  'One voice tool, such as volume or pace, becomes easier to control.',
  'The child is more willing to repeat the routine next week.',
];

const FAQS = [
  {
    question: 'What is speaking confidence for children?',
    answer: 'It is a child\'s ability to share ideas clearly and calmly in a given setting through repeated, low-pressure speaking and listening practice.',
  },
  {
    question: 'How can I help my shy child speak up?',
    answer: 'Use graded micro-steps, predictable routines, and kind feedback after the attempt rather than during it.',
  },
  {
    question: 'My child understands English but will not speak. What should I do?',
    answer: 'Treat it first as a confidence and practice problem. Plan in the home language, co-build one English sentence, and repeat it briefly every day.',
  },
  {
    question: 'How long should daily speaking practice be?',
    answer: '10 to 15 minutes is enough when it is consistent, structured, and ends positively.',
  },
  {
    question: 'Does speaking practice help reading and writing?',
    answer: 'Yes. Spoken language underpins reading and writing, so stronger oral language usually supports literacy too.',
  },
  {
    question: 'What are good speaking activities at home?',
    answer: 'Short retells, picture description, pretend play, read-aloud discussion, and one-topic spotlights work well for most families.',
  },
  {
    question: 'Is it okay if my child mixes languages while speaking?',
    answer: 'Yes. Multilingual children often think across languages. You can use that strength and gradually shape one English sentence from the idea.',
  },
  {
    question: 'Should I correct grammar and pronunciation when my child speaks?',
    answer: 'Correct little and late. Praise first, then give one gentle fix, then retry. Constant interruption usually raises pressure.',
  },
  {
    question: 'What if my child whispers or refuses to speak?',
    answer: 'Lower the step. One word or a whisper still counts as progress. The goal is approach, not forced performance.',
  },
  {
    question: 'When should I worry about stuttering?',
    answer: 'Seek evaluation if stuttering lasts 3 to 6 months, includes struggle behaviours, or there is a family history.',
  },
  {
    question: 'What is selective mutism?',
    answer: 'It is a persistent pattern where a child speaks in some settings but not others. If suspected, get professional guidance and make sure language proficiency is considered carefully.',
  },
  {
    question: 'Is public speaking training the same as oral language development?',
    answer: 'Not exactly. Formal presenting is one outcome, but the deeper foundation is oral language: vocabulary, discussion, retell, and sentence planning.',
  },
];

const SOURCES = [
  {
    title: 'EEF - Oral language interventions',
    url: 'https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/oral-language-interventions',
  },
  {
    title: 'EEF - What does the evidence base tell us about effective oral language practice',
    url: 'https://educationendowmentfoundation.org.uk/news/what-does-the-evidence-base-tell-us-about-effective-oral-language-practice',
  },
  {
    title: 'Department for Education - Primary national curriculum: English',
    url: 'https://assets.publishing.service.gov.uk/media/5a7de93840f0b62305b7f8ee/PRIMARY_national_curriculum_-_English_220714.pdf',
  },
  {
    title: 'NCERT Source Book for Assessment - Language (English)',
    url: 'https://ncert.nic.in/desm/pdf/ChapterIVLanguage%28English%29.pdf',
  },
  {
    title: 'NCERT - Teaching of English at Primary Level in Government Schools',
    url: 'https://ncert.nic.in/del/pdf/English_Primary_level.pdf',
  },
  {
    title: 'NIPUN Bharat government-hosted foundational language guidance',
    url: 'https://static.pib.gov.in/WriteReadData/specificdocs/documents/2021/jul/doc20217531.pdf',
  },
  {
    title: 'IES/WWC - Teaching Academic Content and Literacy to English Learners',
    url: 'https://ies.ed.gov/ncee/wwc/Docs/practiceguide/english_learners_pg_040114.pdf',
  },
  {
    title: 'Reading Rockets - Basics: Oral Language',
    url: 'https://www.readingrockets.org/reading-101/reading-and-writing-basics/oral-language',
  },
  {
    title: 'Reading Rockets - Oral Language Comprehension Activities for Families',
    url: 'https://www.readingrockets.org/literacy-home/reading-101-guide-parents/your-pre-kindergarten-child/oral-language-comprehension',
  },
  {
    title: 'NIDCD - Speech and Language Developmental Milestones',
    url: 'https://www.nidcd.nih.gov/health/speech-and-language',
  },
  {
    title: 'NIDCD - What Is Stuttering? Diagnosis and Treatment',
    url: 'https://www.nidcd.nih.gov/health/stuttering',
  },
  {
    title: 'PMC - Selective Mutism review',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2861522/',
  },
  {
    title: 'PMC - Behavioural inhibition and risk for social anxiety',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3611590/',
  },
  {
    title: 'PMC - Optimising exposure for children and adolescents with anxiety',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8131290/',
  },
];

function SectionShell({
  id,
  eyebrow,
  title,
  intro,
  sources,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  intro: string;
  sources?: string[];
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      data-animate="fade-up"
      className="scroll-mt-28 border-t border-slate-200/80 py-12 first:border-t-0 first:pt-0"
    >
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary-600">{eyebrow}</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
        <p className="mt-4 text-base leading-8 text-slate-600 sm:text-lg">{intro}</p>
      </div>

      {sources?.length ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {sources.map((source) => (
            <span
              key={source}
              className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-900"
            >
              {source}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-8">{children}</div>
    </section>
  );
}

export default function Week12SpeakingConfidenceSeedsPage() {
  useRevealAnimations();

  const jsonLd = useMemo(
    () => [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: BLOG_URL },
          { '@type': 'ListItem', position: 3, name: ARTICLE_TITLE, item: ARTICLE_URL },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: ARTICLE_TITLE,
        description: ARTICLE_DESCRIPTION,
        datePublished: ARTICLE_DATE,
        dateModified: ARTICLE_DATE,
        articleSection: 'Public Speaking',
        keywords: ARTICLE_KEYWORDS,
        image: `${SITE_ORIGIN}${ARTICLE_HERO}`,
        author: {
          '@type': 'Organization',
          '@id': ORGANIZATION_ID,
          name: PUBLIC_FACTS.brandName,
        },
        publisher: {
          '@id': ORGANIZATION_ID,
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': ARTICLE_URL,
        },
        citation: SOURCES.map((source) => source.url),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: '7-day speaking confidence routine for children',
        description: 'A 7-day home routine that builds speaking confidence through graded speaking steps, voice tools, and calm feedback.',
        totalTime: 'P7D',
        step: WEEK_PLAN.map((item, index) => ({
          '@type': 'HowToStep',
          position: index + 1,
          name: item.title,
          text: `${item.focus} Success marker: ${item.success}`,
        })),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQS.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
    ],
    [],
  );

  useEffect(() => {
    applySeo({
      title: `${ARTICLE_TITLE} | Tiny Steps Blog`,
      description: ARTICLE_DESCRIPTION,
      keywords: ARTICLE_KEYWORDS,
      canonicalPath: ARTICLE_PATH,
      robots: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
      ogType: 'article',
      jsonLd,
    });
  }, [jsonLd]);

  return (
    <article className="bg-[linear-gradient(180deg,#fffaf3_0%,#f5f9ff_28%,#ffffff_56%,#f7fcff_100%)]">
      <ResearchArticleHero
        eyebrowPrimary="Week 12 Roadmap"
        eyebrowSecondary="Speaking Confidence"
        title={ARTICLE_TITLE}
        description="A premium Tiny Steps speaking guide for parents whose child talks freely in some places and goes quiet in others. This roadmap shows how to build speaking confidence through tiny wins, not forced performance."
        dateLabel={formatBlogDate(ARTICLE_DATE)}
        readTimeLabel={ARTICLE_READ_TIME}
        actions={[
          { label: 'Explore Tiny Steps speaking classes', to: '/speaking' },
          { label: 'Book a free speaking assessment', to: '/?book=1', variant: 'secondary' },
        ]}
        searchPainPoints={SEARCH_PAIN_POINTS}
        heroPoints={HERO_POINTS}
      />

      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-12 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-12">
          <section
            data-animate="fade-up"
            className="rounded-[32px] border border-slate-200/80 bg-white/90 p-7 shadow-[0_24px_60px_rgba(15,23,42,0.06)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary-700">Quick answer</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Build speaking confidence through safe repetition</h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
              Speaking confidence is usually not about personality. It is about repeated chances to
              speak in a setting that feels safe, structured, and short enough to handle. The fastest
              route is often a calm daily routine with one clear speaking step, one voice tool, and one
              kind retry.
            </p>
          </section>

          <SectionShell
            id="why-freeze"
            eyebrow="Why It Happens"
            title="Why children freeze even when they know the answer"
            intro="A child can understand a question and still go quiet. Silence is often a protection strategy, not proof that the child has nothing to say."
            sources={['EEF', 'Behavioural inhibition research', 'FLN guidance']}
          >
            <div className="grid gap-4 md:grid-cols-2">
              {FREEZE_REASONS.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5"
                >
                  <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.detail}</p>
                </div>
              ))}
            </div>
          </SectionShell>

          <SectionShell
            id="what-confidence-is"
            eyebrow="Core Idea"
            title="What speaking confidence really is"
            intro="Confidence does not mean talking nonstop. It means a child can express an idea with a little more calm, structure, and recovery each week."
            sources={['UK curriculum', 'EEF oral language']}
          >
            <div className="grid gap-5 lg:grid-cols-[1fr_0.95fr]">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6">
                <h3 className="text-xl font-semibold text-slate-900">Markers of real confidence</h3>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                  {CONFIDENCE_MARKERS.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-2 w-2 rounded-full bg-sky-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[28px] border border-amber-200 bg-amber-50/80 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-800">Literacy link</p>
                <p className="mt-4 text-lg font-semibold text-slate-900">Speaking practice is also literacy practice</p>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  Spoken language underpins reading and writing. When children practise retell,
                  discussion, and clearer sentence building aloud, they are also strengthening later
                  writing and comprehension.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-xl font-semibold text-slate-900">Featured-snippet definitions</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {DEFINITIONS.map((item) => (
                  <div key={item.term} className="rounded-[24px] border border-white bg-white p-4">
                    <p className="text-sm font-semibold text-slate-900">{item.term}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{item.meaning}</p>
                  </div>
                ))}
              </div>
            </div>
          </SectionShell>

          <SectionShell
            id="age-expectations"
            eyebrow="Age Guide"
            title="Age-wise expectations for speaking growth"
            intro="Use this guide to calibrate the next step, not to label the child. The goal is steady approach, not comparison with louder children."
            sources={['NIDCD', 'NCERT', 'UK speaking progression']}
          >
            <div className="grid gap-4 md:grid-cols-2">
              {AGE_EXPECTATIONS.map((item) => (
                <div key={item.band} className="rounded-[28px] border border-slate-200 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">{item.band}</p>
                  <p className="mt-3 text-base font-semibold text-slate-900">What on-track can look like</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{item.aim}</p>
                  <p className="mt-4 text-base font-semibold text-slate-900">What to practise gently</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{item.support}</p>
                </div>
              ))}
            </div>
          </SectionShell>

          <SectionShell
            id="week-plan"
            eyebrow="Seven Days"
            title="The 7-day speaking confidence routine"
            intro="This routine is short on purpose. Speaking confidence grows from many low-risk repetitions, not one big performance session."
            sources={['EEF', 'IES/WWC', 'Graded exposure']}
          >
            <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
              <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-50 to-sky-50 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-800">Daily structure</p>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                  {DAILY_STRUCTURE.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-2 w-2 rounded-full bg-sky-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-6 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">Bravery ladder</p>
                <div className="mt-4 space-y-4">
                  {BRAVERY_LADDER.map((item) => (
                    <div key={item.level} className="border-b border-white/10 pb-4 last:border-b-0 last:pb-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-200">{item.level}</p>
                      <p className="mt-2 text-sm font-semibold text-white">{item.title}</p>
                      <p className="mt-2 text-sm leading-7 text-slate-100">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {WEEK_PLAN.map((item) => (
                <div
                  key={item.day}
                  className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">{item.day}</p>
                      <h3 className="mt-2 text-xl font-semibold text-slate-900">{item.title}</h3>
                    </div>
                    <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
                      10-15 min
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{item.focus}</p>
                  <p className="mt-3 text-sm font-medium text-slate-900">Success marker: {item.success}</p>
                </div>
              ))}
            </div>
          </SectionShell>

          <SectionShell
            id="scripts"
            eyebrow="Connection First"
            title="Parent scripts that keep speaking practice calm"
            intro="Children usually speak more when the adult sounds predictable and safe. Use the same short scripts again and again."
            sources={['Practice plus feedback', 'Reading Rockets']}
          >
            <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
              <div className="space-y-4">
                {SCRIPT_BLOCKS.map((block) => (
                  <div key={block.title} className="rounded-[28px] border border-slate-200 bg-white p-6">
                    <h3 className="text-xl font-semibold text-slate-900">{block.title}</h3>
                    <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                      {block.lines.map((line) => (
                        <li key={line} className="flex gap-3">
                          <span className="mt-2 h-2 w-2 rounded-full bg-[#fb923c]" />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Voice tools</p>
                <div className="mt-4 space-y-4">
                  {VOICE_TOOLS.map((item) => (
                    <div key={item.title} className="border-b border-slate-200 pb-4 last:border-b-0 last:pb-0">
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionShell>

          <SectionShell
            id="multilingual-homes"
            eyebrow="India Context"
            title="How to use this routine in multilingual homes"
            intro="The goal is not to replace the home language. It is to use the home language as a support while the child builds English speaking confidence."
            sources={['NCERT', 'NIPUN Bharat', 'Reading Rockets']}
          >
            <div className="grid gap-4 md:grid-cols-3">
              {MULTILINGUAL_POINTS.map((item) => (
                <div key={item.title} className="rounded-[28px] border border-slate-200 bg-white p-5">
                  <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.detail}</p>
                </div>
              ))}
            </div>
          </SectionShell>

          <SectionShell
            id="troubleshooting"
            eyebrow="Troubleshooting"
            title="What to do when speaking practice gets stuck"
            intro="Most week 12 issues are signs that the step is too big or the feedback arrived too early. Lower the demand before you increase pressure."
            sources={['NIDCD', 'Selective mutism guidance', 'EEF']}
          >
            <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
              <div className="space-y-4">
                {TROUBLESHOOTING.map((item) => (
                  <div key={item.title} className="rounded-[28px] border border-slate-200 bg-white p-5">
                    <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{item.detail}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-[28px] border border-rose-200 bg-rose-50/80 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-800">When to seek extra help</p>
                <p className="mt-4 text-sm leading-7 text-slate-700">
                  Ask for professional guidance if any of these red flags stay present over time:
                </p>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                  {SUPPORT_SIGNS.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-2 w-2 rounded-full bg-rose-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </SectionShell>

          <SectionShell
            id="quality-checklist"
            eyebrow="What Works"
            title="What good speaking-confidence practice looks like"
            intro="Use this checklist when you are practising at home or evaluating a speaking class. The point is calm growth, not adult-style performance."
            sources={['EEF', 'IES/WWC', 'NCERT']}
          >
            <div className="grid gap-5 lg:grid-cols-[1fr_0.95fr]">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6">
                <h3 className="text-xl font-semibold text-slate-900">Quality checklist</h3>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                  {QUALITY_CHECKLIST.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-2 w-2 rounded-full bg-emerald-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[28px] border border-emerald-200 bg-emerald-50/70 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-800">End-of-week wins</p>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                  {WEEK_WINS.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-2 w-2 rounded-full bg-emerald-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </SectionShell>

          <SectionShell
            id="faq"
            eyebrow="Parents Also Ask"
            title="Week 12 speaking confidence FAQ"
            intro="These are the high-intent questions parents usually ask when children understand more than they say."
          >
            <div className="space-y-4">
              {FAQS.map((faq) => (
                <div key={faq.question} className="rounded-[28px] border border-slate-200 bg-white p-6">
                  <h3 className="text-lg font-semibold text-slate-900">{faq.question}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </SectionShell>

          <SectionShell
            id="sources"
            eyebrow="Research Trail"
            title="Sources behind this speaking roadmap"
            intro="This page is rebuilt from the speaking-confidence research brief and the same premium editorial framework used for the upgraded phonics and grammar roadmaps."
          >
            <div className="grid gap-3">
              {SOURCES.map((source) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group rounded-[24px] border border-slate-200 bg-white px-5 py-4 transition hover:border-slate-300 hover:shadow-sm"
                >
                  <span className="text-sm font-semibold text-slate-900 group-hover:text-primary-700">{source.title}</span>
                </a>
              ))}
            </div>
          </SectionShell>

          <AboutAuthor variant="research" />

          <section
            data-animate="fade-up"
            className="rounded-[32px] border border-slate-200/80 bg-slate-950 px-7 py-8 text-white shadow-[0_24px_60px_rgba(15,23,42,0.14)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">Next step</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">Keep the step small enough that the child says yes again tomorrow</h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-200">
              Week 12 is not about making a child sound like a stage speaker. It is about helping
              them move from silence or whispering toward clearer, calmer sharing in the settings that
              matter most.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/speaking"
                className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                Explore Tiny Steps speaking classes
              </Link>
              <Link
                to="/speaking"
                className="inline-flex items-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Communication classes for kids
              </Link>
              <Link
                to="/shy-child-speaking-confidence"
                className="inline-flex items-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Shy child speaking confidence help
              </Link>
              <Link
                to="/blog/week-7-grammar-nouns-to-paragraphs"
                className="inline-flex items-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Read the grammar roadmap
              </Link>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">On this page</p>
            <nav className="mt-4">
              <ul className="space-y-2">
                {TOC.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="block rounded-2xl px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </aside>
      </section>
    </article>
  );
}
