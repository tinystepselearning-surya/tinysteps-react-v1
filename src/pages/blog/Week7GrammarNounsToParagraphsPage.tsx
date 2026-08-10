import { useEffect, useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { formatBlogDate } from '../../lib/date';
import { ORGANIZATION_ID, PUBLIC_FACTS, SITE_ORIGIN } from '../../lib/schemas';
import useRevealAnimations from '../../hooks/useRevealAnimations';
import AboutAuthor from '../../components/AboutAuthor';
import ResearchArticleHero from '../../components/blog/ResearchArticleHero';

const ARTICLE_SLUG = 'week-7-grammar-nouns-to-paragraphs';
const ARTICLE_PATH = `/blog/${ARTICLE_SLUG}`;
const ARTICLE_TITLE = 'Grammar Basics Roadmap: Nouns to Paragraphs in 7 Days (Ages 3-10)';
const ARTICLE_DESCRIPTION =
  'A parent-friendly Tiny Steps grammar roadmap for ages 3-10: nouns, verbs, sentence boundaries, sentence combining, and short paragraph writing in 10 calm minutes a day.';
const ARTICLE_DATE = '2026-04-03';
const ARTICLE_READ_TIME = '12 min read';
const ARTICLE_HERO = '/blog/hero-research.jpg';
const BLOG_URL = `${SITE_ORIGIN}/blog`;
const ARTICLE_URL = `${SITE_ORIGIN}${ARTICLE_PATH}`;
const ARTICLE_KEYWORDS = [
  'grammar basics for kids',
  'grammar for kids',
  'nouns and verbs for kids',
  'sentence writing for kids',
  'paragraph writing for kids',
  'sentence combining for kids',
  'grammar practice at home',
  'grammar for multilingual children',
  'my child can speak but cannot write',
  'how to teach grammar at home',
];

const HERO_POINTS = [
  {
    label: 'What this week teaches',
    value: 'Word -> sentence -> paragraph',
    detail: 'Children do better when grammar is a visible ladder instead of a pile of disconnected rules.',
  },
  {
    label: 'What the evidence supports',
    value: 'Talk first, write second',
    detail: 'Oral rehearsal, sentence construction, and light feedback reduce overload and make writing more transferable.',
  },
  {
    label: 'What parents actually need',
    value: '10 to 15 calm minutes',
    detail: 'Short, repeatable sessions beat long grammar drills and protect confidence in multilingual homes.',
  },
];

const SEARCH_PAIN_POINTS = [
  'My child can talk about a picture but freezes when asked to write.',
  'We keep doing grammar rules, but sentence writing is still weak.',
  'My child writes one short line and stops.',
  'I need a home grammar routine that fits real family life.',
];

const TOC = [
  { id: 'why-grammar', label: 'Why grammar should feel like meaning' },
  { id: 'what-matters', label: 'What matters most this week' },
  { id: 'age-expectations', label: 'Age-wise expectations' },
  { id: 'week-plan', label: 'The 7-day plan' },
  { id: 'scripts', label: 'Parent scripts' },
  { id: 'multilingual-homes', label: 'Multilingual homes' },
  { id: 'troubleshooting', label: 'Troubleshooting and support' },
  { id: 'quality-checklist', label: 'What good grammar teaching looks like' },
  { id: 'faq', label: 'FAQ' },
  { id: 'sources', label: 'Sources' },
];

const DEFINITIONS = [
  {
    term: 'Grammar',
    meaning: 'The patterns that help words fit together so sentences are clear and meaningful.',
  },
  {
    term: 'Noun',
    meaning: 'A naming word for a person, place, thing, or idea.',
  },
  {
    term: 'Verb',
    meaning: 'A word that shows what happened, what is happening, or a state of being.',
  },
  {
    term: 'Sentence',
    meaning: 'One complete idea in writing, usually starting with a capital letter and ending with punctuation.',
  },
  {
    term: 'Paragraph',
    meaning: 'A small group of linked sentences that stay on one topic.',
  },
];

const GRAMMAR_LADDER = [
  {
    title: 'Pick the naming word',
    detail: 'Start with who or what the sentence is about so the child has a clear anchor.',
  },
  {
    title: 'Add the action',
    detail: 'Build a simple who + did what sentence before worrying about fancy details.',
  },
  {
    title: 'Add one detail',
    detail: 'Ask where, when, or how, but only one question at a time so the sentence stays manageable.',
  },
  {
    title: 'Join ideas carefully',
    detail: 'Use and, because, or so to make writing less choppy once simple sentences feel secure.',
  },
  {
    title: 'Group sentences into a paragraph',
    detail: 'Use a short frame: topic sentence, two details, and a closer.',
  },
];

const WHAT_MATTERS = [
  {
    title: 'Nouns and pronouns',
    detail: 'Teach children to choose the clearest naming word first, then switch to he, she, it, or they when repetition gets heavy.',
  },
  {
    title: 'Verbs that do real work',
    detail: 'Strong action words make sentence building easier because they give children a reliable "did what" slot.',
  },
  {
    title: 'Sentence boundaries',
    detail: 'Young children often speak in long streams. Writing needs visible stops, so capitals and full stops matter early.',
  },
  {
    title: 'Sentence expansion',
    detail: 'Better writing grows one detail at a time, not through five prompts fired at once.',
  },
];

const AGE_EXPECTATIONS = [
  {
    band: 'Ages 3-4',
    aim: 'Strong who/what vocabulary, short spoken sentences about pictures, and playful sound-word talk.',
    support: 'Adults still do most of the writing, sentence boundaries, and pencil control.',
  },
  {
    band: 'Ages 5-6',
    aim: 'Simple who + did what sentences with help, early capitals and full stops, and one detail added verbally.',
    support: 'Children often need help turning many ideas into one clear sentence without a run-on.',
  },
  {
    band: 'Ages 7-8',
    aim: 'Several linked sentences on one topic, plus early use of and, because, or so for smoother writing.',
    support: 'Cohesion, punctuation consistency, and over-repetition still need modelling.',
  },
  {
    band: 'Ages 9-10',
    aim: 'A short paragraph with a topic sentence, useful details, and clearer pronoun use for flow.',
    support: 'Editing for clarity, tone, and sentence variety still needs guided review.',
  },
];

const WEEK_PLAN = [
  {
    day: 'Day 1',
    title: 'Noun and verb spotting',
    focus: 'Play noun hunt, then verb charades, then write one simple sentence together.',
    success: 'Your child can say five naming words and five action words from daily life.',
  },
  {
    day: 'Day 2',
    title: 'Who + did what',
    focus: 'Use a picture or family photo to build three spoken sentences and write one of them.',
    success: 'Your child produces at least two complete spoken sentences.',
  },
  {
    day: 'Day 3',
    title: 'Add one detail',
    focus: 'Take one clear sentence and expand it with where, when, or how.',
    success: 'Your child adds one detail without turning the sentence into a run-on.',
  },
  {
    day: 'Day 4',
    title: 'Sentence combining',
    focus: 'Join two short sentences with and, because, or so so writing feels less choppy.',
    success: 'Your child combines one pair with support.',
  },
  {
    day: 'Day 5',
    title: 'Build the paragraph frame',
    focus: 'Use topic sentence, detail, detail, closer. Scribe some lines if needed and keep one topic only.',
    success: 'The paragraph stays on one clear topic.',
  },
  {
    day: 'Day 6',
    title: 'Draw, label, write',
    focus: 'Draw first, label nouns, then write two to four sentences with the frame nearby.',
    success: 'Your child writes at least two sentences independently.',
  },
  {
    day: 'Day 7',
    title: 'Share and light edit',
    focus: 'Read the writing aloud, fix one thing only, then celebrate the finish.',
    success: 'Your child reads the paragraph proudly and improves one sentence.',
  },
];

const DAILY_STRUCTURE = [
  '2 minutes of talk-game with nouns or verbs',
  '7 minutes of sentence building or sentence combining',
  '3 to 6 minutes of writing and reading aloud',
];

const SCRIPT_LINES = [
  'Tell me your sentence first.',
  'Good. I will write it once and you read it with your finger.',
  'Now you copy it or write the next sentence.',
  'We will fix only one thing in this sentence.',
];

const GENTLE_FIXES = [
  'Capital letter at the start',
  'Full stop at the end',
  'One stronger verb',
];

const MULTILINGUAL_POINTS = [
  {
    title: 'Planning in the home language is allowed',
    detail: 'Children can think fast and richly in the language they know best, then shape the same idea into English with support.',
  },
  {
    title: 'Multilingualism is a resource, not a delay',
    detail: 'Using Hindi, Telugu, Tamil, Marathi, Kannada, Bengali, Urdu, or another home language does not block grammar growth.',
  },
  {
    title: 'Reduce cognitive load',
    detail: 'If a child has to invent ideas, build English sentences, and spell all at once, writing can stall. Split those jobs.',
  },
];

const TROUBLESHOOTING = [
  {
    title: 'If your child writes only one line',
    detail: 'Accept the line and add one more detail tomorrow. Growth usually comes from repeated short sessions, not pressure for length.',
  },
  {
    title: 'If the same words keep repeating',
    detail: 'Offer three replacement options instead of saying "think of another word". Choice is easier than open-ended searching.',
  },
  {
    title: 'If spelling or handwriting blocks ideas',
    detail: 'Protect composition first. Let the child use best spelling during drafting and keep correct spellings on a small side card.',
  },
  {
    title: 'If your child refuses to write',
    detail: 'Switch modes. Do oral storytelling while you scribe, then ask the child to copy one sentence or write the next short line.',
  },
];

const SUPPORT_SIGNS = [
  'Frequent grammar errors in speech far beyond peers over time',
  'Very limited sentence structures in both speech and writing',
  'Difficulty following language-heavy instructions',
  'Disorganised storytelling and writing that does not improve with practice',
];

const QUALITY_CHECKLIST = [
  'Grammar is taught through sentence construction and real writing, not parts-of-speech drilling alone.',
  'Children say sentences aloud before being asked to write them.',
  'Sentence boundaries are corrected clearly but lightly, one fix at a time.',
  'Sentence combining is used to smooth choppy writing instead of adding more worksheets.',
  'Multilingual children are allowed to plan ideas in a familiar language before writing in English.',
  'Sessions stay short enough that tomorrow still feels doable.',
];

const WEEK_WINS = [
  'Your child can build a clear who + did what sentence without heavy prompting.',
  'Your child can add one useful detail to a simple sentence.',
  'Your child can combine at least one pair of short sentences with support.',
  'Your child can produce a short paragraph that stays on one topic.',
];

const FAQS = [
  {
    question: 'What is grammar for kids in simple words?',
    answer: 'Grammar is the set of patterns that helps words fit together so sentences are clear and make sense.',
  },
  {
    question: 'What is the difference between grammar and writing?',
    answer: 'Writing is the whole task of communicating ideas on paper. Grammar is one part of writing: how sentences are built so readers understand them.',
  },
  {
    question: 'At what age should children learn nouns and verbs?',
    answer: 'Children use nouns and verbs in speech very early, but they usually start applying them to writing once they begin forming and writing complete sentences, often around ages five to seven with wide variation.',
  },
  {
    question: 'My child can speak well but cannot write. Why?',
    answer: 'Writing adds extra demands such as spelling, handwriting, and holding sentence structure in mind. Starting with talk and moving gradually into writing reduces that overload.',
  },
  {
    question: 'How can I teach grammar at home without worksheets?',
    answer: 'Use sentence frames, add one detail, and practise sentence combining inside real sentences. That teaches grammar through meaning instead of drill.',
  },
  {
    question: 'What is sentence combining?',
    answer: 'Sentence combining means turning two short sentences into one stronger sentence to make writing smoother and more connected.',
  },
  {
    question: 'Does sentence combining actually help writing?',
    answer: 'Yes. Writing guidance and research syntheses repeatedly point to sentence-level instruction and sentence combining as useful ways to improve writing quality.',
  },
  {
    question: 'How long should daily grammar practice be?',
    answer: 'For home practice, 10 to 15 minutes is enough if it is consistent and focused on real sentence work.',
  },
  {
    question: 'Is grammar important for reading too?',
    answer: 'Yes. Reading comprehension depends partly on vocabulary and grammar, so stronger sentence knowledge also supports understanding.',
  },
  {
    question: 'We are a multilingual family. Should we practise grammar only in English?',
    answer: 'No. Children can plan ideas in a home language first, then shape those ideas into English sentences. That often makes writing easier, not harder.',
  },
  {
    question: 'Can learning two languages cause grammar problems?',
    answer: 'No. Multilingualism does not cause developmental language disorder. If concerns exist, they should be checked directly rather than blamed on bilingualism.',
  },
  {
    question: 'When should I worry about grammar mistakes?',
    answer: 'Occasional mistakes are normal. Seek guidance when sentence difficulties are persistent across time and settings and affect understanding, storytelling, or writing organisation.',
  },
];

const SOURCES = [
  {
    title: 'National Education Policy 2020',
    url: 'https://www.education.gov.in/sites/upload_files/mhrd/files/NEP_Final_English_0.pdf',
  },
  {
    title: 'NCERT Source Book for Assessment - Language (English)',
    url: 'https://ncert.nic.in/desm/pdf/ChapterIVLanguage%28English%29.pdf',
  },
  {
    title: 'NIPUN Bharat Mission foundational literacy guidance',
    url: 'https://static.pib.gov.in/WriteReadData/specificdocs/documents/2021/jul/doc20217531.pdf',
  },
  {
    title: 'Department for Education - National curriculum in England: English programmes of study',
    url: 'https://www.gov.uk/government/publications/national-curriculum-in-england-english-programmes-of-study/national-curriculum-in-england-english-programmes-of-study',
  },
  {
    title: 'Primary national curriculum - English',
    url: 'https://assets.publishing.service.gov.uk/media/5a7de93840f0b62305b7f8ee/PRIMARY_national_curriculum_-_English_220714.pdf',
  },
  {
    title: 'EEF - Grammar for Writing',
    url: 'https://educationendowmentfoundation.org.uk/projects-and-evaluation/projects/grammar-for-writing',
  },
  {
    title: 'EEF - Improving Literacy in Key Stage 2',
    url: 'https://files.eric.ed.gov/fulltext/ED612216.pdf',
  },
  {
    title: 'IES/WWC - Teaching Elementary Students to Be Effective Writers',
    url: 'https://files.eric.ed.gov/fulltext/ED533112.pdf',
  },
  {
    title: 'Reading Rockets - Sentence Combining',
    url: 'https://www.readingrockets.org/classroom/classroom-strategies/sentence-combining',
  },
  {
    title: 'Kim et al. - Primary grade writing instruction meta-analysis',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9390887/',
  },
  {
    title: 'NIDCD - Developmental Language Disorder',
    url: 'https://www.nidcd.nih.gov/health/developmental-language-disorder',
  },
  {
    title: 'NCBI Bookshelf - Screening and referral framing for speech/language difficulties',
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK599723/',
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
              className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-900"
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

export default function Week7GrammarNounsToParagraphsPage() {
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
        articleSection: 'Grammar',
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
        name: '7-day grammar basics roadmap for children',
        description: 'A 7-day home routine that helps children move from nouns and verbs to clear sentences and a short paragraph.',
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
    <article className="bg-[linear-gradient(180deg,#fffaf2_0%,#f5fbff_28%,#ffffff_56%,#f7fcf8_100%)]">
      <ResearchArticleHero
        eyebrowPrimary="Week 7 Roadmap"
        eyebrowSecondary="Grammar Basics"
        title={ARTICLE_TITLE}
        description="A premium Tiny Steps grammar guide for parents whose child can talk about a picture but struggles to turn those ideas into clear sentences. This roadmap shows how to move from naming words to a short paragraph without heavy worksheets or pressure."
        dateLabel={formatBlogDate(ARTICLE_DATE)}
        readTimeLabel={ARTICLE_READ_TIME}
        actions={[
          { label: 'Explore Tiny Steps grammar classes', to: '/grammar' },
          { label: 'Book a free writing assessment', to: '/book-demo', variant: 'secondary' },
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
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Start with meaning, not rule memorising</h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
              Children usually do not struggle with grammar because they failed to memorise terms.
              They struggle because writing asks them to juggle ideas, sentence structure, spelling,
              and handwriting all at once. Short sentence-building routines, oral rehearsal, and one
              gentle fix at a time work better than long grammar drills.
            </p>
          </section>

          <SectionShell
            id="why-grammar"
            eyebrow="Meaning First"
            title="Why grammar should feel like meaning, not memorising rules"
            intro="This week is designed to help children say what they mean clearly and then write it. That is a more reliable bridge into grammar than worksheet-heavy rule coverage."
            sources={['NCERT', 'UK curriculum', 'IES/WWC']}
          >
            <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6">
                <h3 className="text-xl font-semibold text-slate-900">The grammar ladder that transfers</h3>
                <div className="mt-5 space-y-4">
                  {GRAMMAR_LADDER.map((item, index) => (
                    <div key={item.title} className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-slate-900">{item.title}</h4>
                        <p className="mt-1 text-sm leading-7 text-slate-600">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-amber-200 bg-amber-50/80 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-800">Why this works</p>
                <p className="mt-4 text-lg font-semibold text-slate-900">Talk removes pressure before writing begins</p>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  Spoken language underpins writing. When children say the sentence first, they can
                  focus on meaning before managing handwriting and spelling. That is especially useful
                  for children who can tell rich stories aloud but stall on a blank page.
                </p>
              </div>
            </div>
          </SectionShell>

          <SectionShell
            id="what-matters"
            eyebrow="Small Set"
            title="What your child actually needs this week"
            intro="This is a minimum effective dose week. It covers only the sentence-building pieces that are most likely to show up in real writing quickly."
            sources={['Sentence construction', 'Sentence combining']}
          >
            <div className="grid gap-4 md:grid-cols-2">
              {WHAT_MATTERS.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5"
                >
                  <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.detail}</p>
                </div>
              ))}
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
            title="Age-wise expectations for sentence and paragraph growth"
            intro="Use these as guidance, not as a test. The goal is clarity and confidence for the child in front of you, not racing through grammar milestones."
            sources={['FLN guidance', 'UK writing progression']}
          >
            <div className="grid gap-4 md:grid-cols-2">
              {AGE_EXPECTATIONS.map((item) => (
                <div key={item.band} className="rounded-[28px] border border-slate-200 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">{item.band}</p>
                  <p className="mt-3 text-base font-semibold text-slate-900">Realistic aim</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{item.aim}</p>
                  <p className="mt-4 text-base font-semibold text-slate-900">Adult support still needed</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{item.support}</p>
                </div>
              ))}
            </div>
          </SectionShell>

          <SectionShell
            id="week-plan"
            eyebrow="Seven Days"
            title="The 7-day grammar roadmap"
            intro="Each day has one job only. Keep the sequence predictable and stop while energy is still good."
            sources={['Short daily practice', 'Sentence-level instruction']}
          >
            <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-50 to-emerald-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-800">Daily structure</p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                {DAILY_STRUCTURE.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-2 w-2 rounded-full bg-emerald-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
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
            eyebrow="Parent Scripts"
            title="Keep grammar practice calm with repeatable scripts"
            intro="Children usually need fewer explanations and more stable prompts. Use the same short language each day so the routine feels safe."
            sources={['Oral rehearsal', 'Focused feedback']}
          >
            <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6">
                <h3 className="text-xl font-semibold text-slate-900">Say it first script</h3>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                  {SCRIPT_LINES.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-2 w-2 rounded-full bg-[#fb923c]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-6 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">One gentle fix rule</p>
                <p className="mt-4 text-sm leading-7 text-slate-100">
                  Correct one thing only in each sentence. Too many corrections at once usually turns grammar into avoidance.
                </p>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-100">
                  {GENTLE_FIXES.map((item) => (
                    <li key={item} className="border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </SectionShell>

          <SectionShell
            id="multilingual-homes"
            eyebrow="India Context"
            title="How this works in multilingual homes"
            intro="Many Tiny Steps families think in one language and write in another. That is common and workable when the routine is designed for it."
            sources={['NCERT', 'NIPUN Bharat', 'NIDCD']}
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
            title="What to do when writing gets stuck"
            intro="Most week 7 problems are signals to reduce load, not to push harder. The goal is to keep the child moving up the ladder from sentence to paragraph."
            sources={['Transcription and composition', 'DLD referral framing']}
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
                  Ask for school support, an educational assessment, or a speech-language review if you keep seeing these signs despite repeated practice:
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
            title="What good grammar teaching looks like at home or in class"
            intro="Use this checklist if you are running the routine yourself or checking whether a class is likely to help your child transfer grammar into writing."
            sources={['EEF', 'IES/WWC', 'Reading Rockets']}
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
            title="Week 7 grammar FAQ"
            intro="These are the high-intent questions parents usually ask when children can speak more easily than they can write."
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
            title="Sources behind this grammar roadmap"
            intro="This page is rebuilt from the replacement week 7 research brief and the same premium Tiny Steps editorial framework used on the upgraded phonics and SATPIN guides."
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
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200">Next step</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">Build sentence confidence before chasing perfect grammar</h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-200">
              The fastest path through week 7 is usually shorter and kinder than parents expect.
              Keep practice focused on clear sentences, real meaning, and one visible win a day.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/grammar"
                className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                Explore Tiny Steps grammar classes
              </Link>
              <Link
                to="/blog/phonics-for-parents-guide"
                className="inline-flex items-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Read the phonics parent guide
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
