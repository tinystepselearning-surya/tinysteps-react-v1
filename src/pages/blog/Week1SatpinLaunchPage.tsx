import { useEffect, useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { formatBlogDate } from '../../lib/date';
import useRevealAnimations from '../../hooks/useRevealAnimations';
import AboutAuthor from '../../components/AboutAuthor';
import ResearchArticleHero from '../../components/blog/ResearchArticleHero';

const ARTICLE_SLUG = 'week-1-phonics-satpin-launch';
const ARTICLE_PATH = `/blog/${ARTICLE_SLUG}`;
const ARTICLE_TITLE = 'SATPIN for Parents: A Research-Backed Week 1 Launch Plan for Confident Readers';
const ARTICLE_DESCRIPTION =
  'A premium Tiny Steps SATPIN guide for parents who want to teach the first six phonics sounds at home, begin blending calmly, and build early reading confidence with a research-backed week 1 plan.';
const ARTICLE_DATE = '2026-04-03';
const ARTICLE_READ_TIME = '11 min read';
const ARTICLE_HERO = '/blog/hero-research.jpg';
const ARTICLE_KEYWORDS = [
  'satpin phonics',
  'satpin launch plan',
  'how to teach satpin',
  'week 1 phonics plan',
  'phonics sounds s a t p i n',
  'how to teach phonics at home',
  'satpin activities for parents',
  'blending cvc words for beginners',
];

const HERO_POINTS = [
  {
    label: 'What to teach first',
    value: 'Six useful sounds, not 26 letters at once',
    detail: 'SATPIN works because it unlocks many simple words quickly while keeping working memory load low.',
  },
  {
    label: 'What matters most',
    value: 'Pure sounds and short daily repetition',
    detail: 'Children need crisp sounds, oral blending, and spaced review more than worksheets or marathon sessions.',
  },
  {
    label: 'What success looks like',
    value: 'One small win a day',
    detail: 'By the end of the week, most children should know the six sounds and blend a few simple words with support.',
  },
];

const SEARCH_PAIN_POINTS = [
  'My child sings the ABC song but still cannot read sat or pin.',
  'We keep practising, but blending still feels confusing.',
  'I do not want week 1 phonics to feel like school homework.',
  'I need a simple SATPIN routine that actually fits home life.',
];

const TOC = [
  { id: 'why-satpin', label: 'Why SATPIN is a strong first set' },
  { id: 'sound-vs-name', label: 'Letter sounds vs letter names' },
  { id: 'week-plan', label: 'The seven-session plan' },
  { id: 'practice-bank', label: 'Games, words, and decodable lines' },
  { id: 'multilingual-homes', label: 'SATPIN in multilingual homes' },
  { id: 'troubleshooting', label: 'Troubleshooting and coaching' },
  { id: 'quality-checklist', label: 'What to look for in teaching' },
  { id: 'faq', label: 'FAQ' },
  { id: 'sources', label: 'Sources' },
];

const STARTER_SET = [
  {
    title: 'It unlocks words quickly',
    detail: 'With s, a, t, p, i, and n, children can begin reading and spelling words like sat, pin, tap, tin, pan, and nip very early.',
  },
  {
    title: 'It is systematic, not random',
    detail: 'A small, defined set of correspondences gives children a stable pattern to practise instead of a scatter of unrelated letters.',
  },
  {
    title: 'It leads straight into blending',
    detail: 'Good phonics teaching moves quickly from isolated sounds into left-to-right blending through real words.',
  },
  {
    title: 'It fits how children learn',
    detail: 'Short daily practice, retrieval, and cumulative review are easier for children to sustain and easier for parents to repeat.',
  },
];

const WHAT_TO_PRIORITISE = [
  'Teach the sound children need for reading, not only the alphabet name.',
  'Use lowercase letters most of the time because that is what children meet in real books.',
  'Keep consonants clean: /p/ not “puh”, /t/ not “tuh”, /n/ not “nuh”.',
  'Model oral blending first, then move to printed words as soon as the child is ready.',
];

const WEEK_PLAN = [
  {
    day: 'Session A',
    title: 'Introduce /s/ and /a/',
    focus: 'Show the letters, say the sound clearly, and have your child repeat. End with a tiny oral blend: /s/ /a/ -> “sa.”',
    success: 'Your child can say /s/ and /a/ when you point to the cards.',
  },
  {
    day: 'Session B',
    title: 'Add /t/ with fast review',
    focus: 'Review /s/ and /a/ first, then teach /t/ as a crisp sound. Model /s/ /a/ /t/ -> sat without inserting extra sounds.',
    success: 'Your child attempts one oral blend with support.',
  },
  {
    day: 'Session C',
    title: 'Add /p/ and build first words',
    focus: 'Keep review fast, then teach /p/ without “puh”. Build sat, tap, and pat with cards or objects.',
    success: 'Your child can hear each sound in one simple CVC word.',
  },
  {
    day: 'Session D',
    title: 'Add /i/ as the short vowel in “it”',
    focus: 'Blend sit, pit, and tip slowly from left to right. Keep the pace calm and repeat the same small set.',
    success: 'Your child blends one or two /i/ words after modelling.',
  },
  {
    day: 'Session E',
    title: 'Add /n/ and review the full set',
    focus: 'Teach /n/, then try pin, tin, tan, pan, and nip. If print feels hard, return briefly to oral-only blending.',
    success: 'Your child recalls most SATPIN sounds quickly and blends a few words with help.',
  },
  {
    day: 'Session F',
    title: 'Read one tiny decodable line',
    focus: 'Use a short line matched to taught letters only, such as “Pat sat.” Keep non-decodable words very limited.',
    success: 'Your child tracks each word and decodes at least part of the line.',
  },
  {
    day: 'Session G',
    title: 'Segment for spelling and celebrate',
    focus: 'Say a word like sat, ask for the sounds, and write one letter for each sound. Stop early and end positively.',
    success: 'Your child segments at least one word into sounds for spelling.',
  },
];

const GAME_BANK = [
  'Sound hop: say a sound and have your child hop to the matching card.',
  'Blend basket: pull three SATPIN cards and blend the word out loud.',
  'I spy sounds: “I spy something that starts with /t/.”',
  'Sound clap: clap once for each sound you hear in sat, pin, or tap.',
  'Finger trace plus say: trace the letter once while saying its sound cleanly.',
];

const EXAMPLE_BANK = [
  'Word set A: sat, tap, pat',
  'Word set B: pin, tin, nip',
  'Word set C: pan, tan, nap',
  'Strict decodable line: “Pat sat.”',
  'Parent prompt: “Say each sound. Now blend it.”',
];

const MULTILINGUAL_POINTS = [
  {
    title: 'Decoding is not accent training',
    detail: 'The goal is to map speech sounds to print clearly enough to read words, not to copy a foreign accent.',
  },
  {
    title: 'Pair phonics with oral language',
    detail: 'A multilingual child may decode short SATPIN words well while still needing oral language and vocabulary support for comprehension.',
  },
  {
    title: 'India-specific reassurance',
    detail: 'Children across India often learn English in widely varied conditions. Strong reading can still begin with clear, low-pressure sound work and short daily routines.',
  },
];

const TROUBLESHOOTING = [
  {
    title: 'If your child forgets sounds the next day',
    detail: 'Start every session with a 60-90 second retrieval review. Quick recall practice is part of learning, not a sign of failure.',
  },
  {
    title: 'If blending is not happening yet',
    detail: 'Go back to oral-only blending with your voice or a toy marker, then immediately model the whole word again.',
  },
  {
    title: 'If your child starts guessing from pictures',
    detail: 'Gently redirect to print: “Let us read all the sounds.” SATPIN week is about building decoding as the trusted strategy.',
  },
  {
    title: 'If you hear “puh” or “tuh”',
    detail: 'Shorten the consonant back to a clean sound. Extra vowel sounds after consonants make blending harder.',
  },
  {
    title: 'If letters reverse later',
    detail: 'Do not panic. Reversals alone are common early on. Keep explicit sound-to-letter teaching steady before assuming a deeper problem.',
  },
];

const COACHING_SCRIPT = [
  'Let us do it slowly.',
  'Say each sound.',
  'Now blend it.',
  'Good. Read it again.',
];

const WEEK_WINS = [
  'Your child can usually give the sounds for s, a, t, p, i, and n when shown.',
  'Your child can blend a few simple SATPIN words with your support.',
  'Your child can attempt one simple spelling by saying sounds and writing letters.',
  'Practice feels predictable instead of turning into a daily fight.',
];

const CHECKLIST = [
  'Teaching starts with a small, defined set of correspondences instead of random letters.',
  'The adult models pure sounds and avoids adding “uh” after consonants.',
  'Blending for reading and segmenting for spelling both appear in week 1.',
  'Text practice is decodable and tightly matched to what has been taught.',
  'Sessions stay short, cumulative, and repeatable for real families.',
  'In multilingual homes, decoding is taught alongside oral language and meaning.',
];

const FAQS = [
  {
    question: 'What is SATPIN in phonics?',
    answer: 'SATPIN is a common starter set of six letter-sound correspondences: s, a, t, p, i, and n. It is used early because it allows children to build many simple words quickly.',
  },
  {
    question: 'Should I teach letter names or sounds first?',
    answer: 'For decoding, the sound matters first. Letter names can be taught lightly, but reading simple words depends on the speech sounds children blend together.',
  },
  {
    question: 'How long should a SATPIN session be at home?',
    answer: 'Around 10 minutes is enough for most families. Short daily repetition works better than one long, stressful session.',
  },
  {
    question: 'What if my child knows the letters but cannot blend?',
    answer: 'That usually means the sounds are not secure enough yet or the child needs more oral blending before reading from print. Slow it down and model the whole word again.',
  },
  {
    question: 'Can SATPIN work in multilingual homes?',
    answer: 'Yes. Decoding can begin in English while comprehension continues to grow through oral language and discussion in any language spoken at home.',
  },
  {
    question: 'When should I seek extra help?',
    answer: 'If your child has had steady, well-matched practice and still cannot retain basic sounds or attempt simple blends, ask a teacher or literacy specialist for a closer look.',
  },
];

const SOURCES = [
  {
    title: 'Education Endowment Foundation - Phonics',
    url: 'https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/phonics',
  },
  {
    title: 'IES Practice Guide - Foundational Skills to Support Reading',
    url: 'https://ies.ed.gov/ncee/wwc/Docs/practiceguide/wwc_foundationalreading_040717.pdf',
  },
  {
    title: 'GOV.UK - Validation of Systematic Synthetic Phonics Programmes',
    url: 'https://dera.ioe.ac.uk/id/eprint/39132/1/Validation%20of%20systematic%20synthetic%20phonics%20programmes%20supporting%20documentation%20-%20GOV.UK.pdf',
  },
  {
    title: 'Reading Rockets - Phonics and Decoding',
    url: 'https://www.readingrockets.org/reading-101/reading-and-writing-basics/phonics-and-decoding',
  },
  {
    title: 'Reading Rockets - Sight Words and Orthographic Mapping',
    url: 'https://www.readingrockets.org/reading-101/reading-and-writing-basics/sight-words-and-orthographic-mapping',
  },
  {
    title: 'Reading Rockets - Are Letter Reversals a Sign of Dyslexia?',
    url: 'https://www.readingrockets.org/resources/expert-qa/are-letter-and-number-reversals-sign-dyslexia-how-are-speechlanguage',
  },
  {
    title: 'NCERT - Teaching of English Position Paper',
    url: 'https://ncert.nic.in/pdf/focus-group/english.pdf',
  },
  {
    title: 'NIPUN Bharat - Foundational Literacy and Numeracy',
    url: 'https://static.pib.gov.in/WriteReadData/specificdocs/documents/2021/jul/doc20217531.pdf',
  },
  {
    title: 'The Simple View of Second Language Reading',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3422459/',
  },
  {
    title: 'Parents Under Pressure - The Current State of Parental Stress & Well-Being',
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK606662/',
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
              className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900"
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

export default function Week1SatpinLaunchPage() {
  useRevealAnimations();

  const jsonLd = useMemo(
    () => [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://tinystepslearning.com/blog' },
          { '@type': 'ListItem', position: 3, name: ARTICLE_TITLE, item: `https://tinystepslearning.com${ARTICLE_PATH}` },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: ARTICLE_TITLE,
        description: ARTICLE_DESCRIPTION,
        datePublished: ARTICLE_DATE,
        dateModified: ARTICLE_DATE,
        articleSection: 'Phonics',
        keywords: ARTICLE_KEYWORDS,
        image: `https://tinystepslearning.com${ARTICLE_HERO}`,
        author: {
          '@type': 'Organization',
          name: 'Tiny Steps Learning',
        },
        publisher: {
          '@type': 'Organization',
          name: 'Tiny Steps Learning',
          logo: {
            '@type': 'ImageObject',
            url: 'https://tinystepslearning.com/logo-square-1024.png',
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `https://tinystepslearning.com${ARTICLE_PATH}`,
        },
        citation: SOURCES.map((source) => source.url),
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
    <article className="bg-[linear-gradient(180deg,#fffaf3_0%,#f7fbff_28%,#ffffff_52%,#f8fbff_100%)]">
      <ResearchArticleHero
        eyebrowPrimary="Week 1 Roadmap"
        eyebrowSecondary="SATPIN Launch"
        title={ARTICLE_TITLE}
        description="A premium Tiny Steps SATPIN guide for parents whose child knows the alphabet song but still cannot read simple words. This page shows what to teach first, how to keep sounds clean, how to blend without pressure, and how to run a realistic week 1 plan at home."
        dateLabel={formatBlogDate(ARTICLE_DATE)}
        readTimeLabel={ARTICLE_READ_TIME}
        actions={[
          { label: 'Book a free reading assessment', to: '/?book=1' },
          { label: 'Read the full phonics parent guide', to: '/blog/phonics-for-parents-guide', variant: 'secondary' },
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
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Start small, stay systematic, and blend early</h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
              SATPIN is a strong week 1 phonics launch because it gives children a small set of useful
              sound-letter links they can actually use. Teach clean sounds, review them daily, move into
              oral blending quickly, and keep the whole routine short enough that it still feels doable tomorrow.
            </p>
          </section>

          <SectionShell
            id="why-satpin"
            eyebrow="Starter Set"
            title="Why SATPIN is a strong first set"
            intro="SATPIN is not magic. It is simply a practical first cluster that helps parents and teachers move children from isolated sounds to real early reading with less overload."
            sources={['Letters and Sounds', 'EEF', 'IES']}
          >
            <div className="grid gap-4 md:grid-cols-2">
              {STARTER_SET.map((item) => (
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
            id="sound-vs-name"
            eyebrow="First Principle"
            title="Letter sounds matter before letter names for decoding"
            intro="Children can know the alphabet song and still be completely new to reading. Week 1 is about how print maps to speech sounds, not how well a child can recite names."
            sources={['Reading Rockets', 'Letters and Sounds']}
          >
            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6">
                <h3 className="text-xl font-semibold text-slate-900">What to prioritise this week</h3>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                  {WHAT_TO_PRIORITISE.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-2 w-2 rounded-full bg-primary-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[28px] border border-amber-200 bg-amber-50/80 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-800">Pronunciation note</p>
                <p className="mt-4 text-lg font-semibold text-slate-900">Clean sounds help blending</p>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  If you teach /p/ as “puh” or /t/ as “tuh”, children have to unlearn that extra vowel
                  every time they blend. Week 1 gets easier when consonants stay short and crisp.
                </p>
              </div>
            </div>
          </SectionShell>

          <SectionShell
            id="week-plan"
            eyebrow="Seven Sessions"
            title="The SATPIN week 1 plan"
            intro="Think of this as seven very small launches, not one big campaign. Each session should feel predictable: quick review, one focus move, one small win, and stop."
            sources={['DfE criteria', 'Spacing effect', 'Cognitive load']}
          >
            <div className="space-y-4">
              {WEEK_PLAN.map((session) => (
                <div
                  key={session.day}
                  className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">{session.day}</p>
                      <h3 className="mt-2 text-xl font-semibold text-slate-900">{session.title}</h3>
                    </div>
                    <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
                      8-10 min
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{session.focus}</p>
                  <p className="mt-3 text-sm font-medium text-slate-900">Success marker: {session.success}</p>
                </div>
              ))}
            </div>
          </SectionShell>

          <SectionShell
            id="practice-bank"
            eyebrow="Ready to Use"
            title="Games, words, and decodable lines parents can use tonight"
            intro="Week 1 does not need more materials. It needs the right repetition. Use one or two quick games, a tiny word set, and one short matched line."
            sources={['Matched decodable practice']}
          >
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6">
                <h3 className="text-xl font-semibold text-slate-900">Five low-prep SATPIN games</h3>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                  {GAME_BANK.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-2 w-2 rounded-full bg-[#ff8a3d]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-50 to-sky-50 p-6">
                <h3 className="text-xl font-semibold text-slate-900">Example bank</h3>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                  {EXAMPLE_BANK.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-2 w-2 rounded-full bg-sky-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </SectionShell>

          <SectionShell
            id="multilingual-homes"
            eyebrow="India Context"
            title="SATPIN in multilingual homes"
            intro="Many Indian families are helping children learn English while living across two or more languages. That is normal, and it changes how parents should interpret week 1 progress."
            sources={['NCERT', 'NIPUN Bharat', 'Simple View']}
          >
            <div className="grid gap-4 md:grid-cols-3">
              {MULTILINGUAL_POINTS.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[28px] border border-slate-200 bg-white p-5"
                >
                  <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.detail}</p>
                </div>
              ))}
            </div>
          </SectionShell>

          <SectionShell
            id="troubleshooting"
            eyebrow="Troubleshooting"
            title="What to do when week 1 gets wobbly"
            intro="Most SATPIN problems in week 1 are not signs of failure. They are signals to simplify, review, and coach more clearly."
            sources={['Retrieval practice', 'Reading Rockets']}
          >
            <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
              <div className="space-y-4">
                {TROUBLESHOOTING.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[28px] border border-slate-200 bg-white p-5"
                  >
                    <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{item.detail}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-6 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">Parent coaching script</p>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-100">
                  {COACHING_SCRIPT.map((line) => (
                    <li key={line} className="border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </SectionShell>

          <SectionShell
            id="quality-checklist"
            eyebrow="Week 1 Review"
            title="What to look for in good SATPIN teaching"
            intro="Whether you are doing this yourself or checking a class, the markers below help you distinguish a clean phonics launch from noisy activity."
            sources={['Systematic synthetic phonics']}
          >
            <div className="grid gap-5 lg:grid-cols-[1fr_0.95fr]">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6">
                <h3 className="text-xl font-semibold text-slate-900">Quality checklist</h3>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                  {CHECKLIST.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-2 w-2 rounded-full bg-emerald-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[28px] border border-emerald-200 bg-emerald-50/70 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-800">End-of-week checklist</p>
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
            title="SATPIN week 1 FAQ"
            intro="These are the questions most parents ask when they start phonics at home."
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
            title="Sources behind this SATPIN launch plan"
            intro="This page combines the SATPIN launch-plan PDF with the same research backbone used in the newer Tiny Steps phonics parent guide."
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
            <h2 className="mt-3 text-3xl font-black tracking-tight">Use this week to build calm decoding habits, not pressure</h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-200">
              If SATPIN week feels harder than it should, that is usually a signal to simplify the routine, not
              to push harder. If you want a clearer plan for your child’s starting point, use the assessment route.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/?book=1"
                className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                Book a free assessment
              </Link>
              <Link
                to="/phonics"
                className="inline-flex items-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Explore Tiny Steps phonics classes
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

            <div className="mt-6 rounded-[24px] border border-amber-200 bg-amber-50/70 p-4">
              <p className="text-sm font-semibold text-slate-900">Related guide</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                For the broader parent research article on phonics, use the full Tiny Steps guide.
              </p>
              <Link to="/blog/phonics-for-parents-guide" className="mt-3 inline-flex text-sm font-semibold text-primary-700">
                Open the phonics parent guide
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </article>
  );
}
