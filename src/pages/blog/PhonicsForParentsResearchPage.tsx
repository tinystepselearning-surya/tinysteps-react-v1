import { useEffect, useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { formatBlogDate } from '../../lib/date';
import { ORGANIZATION_ID, PUBLIC_FACTS, SITE_ORIGIN } from '../../lib/schemas';
import useRevealAnimations from '../../hooks/useRevealAnimations';
import AboutAuthor from '../../components/AboutAuthor';
import ResearchArticleHero from '../../components/blog/ResearchArticleHero';

const ARTICLE_SLUG = 'phonics-for-parents-guide';
const ARTICLE_PATH = `/blog/${ARTICLE_SLUG}`;
const ARTICLE_TITLE = 'Phonics for Parents: What It Is, Why It Matters, and How to Teach It at Home';
const ARTICLE_DESCRIPTION =
  'A practical, evidence-backed Tiny Steps guide for parents searching what phonics is, why phonics is important, and how to teach phonics at home in 10 calm minutes a day, with clear structured synthetic phonics guidance inspired by methods such as Jolly Phonics.';
const ARTICLE_DATE = '2026-04-03';
const ARTICLE_READ_TIME = '12 min read';
const ARTICLE_HERO = '/blog/hero-research.jpg';
const BLOG_URL = `${SITE_ORIGIN}/blog`;
const ARTICLE_URL = `${SITE_ORIGIN}${ARTICLE_PATH}`;
const ARTICLE_KEYWORDS = [
  'phonics for parents',
  'what is phonics for kids',
  'synthetic phonics',
  'structured phonics',
  'Jolly Phonics',
  'phonics-based reading',
  'blending sounds into words',
  'why is phonics important',
  'how to teach phonics at home',
  'how to help my child read',
  'my child knows letters but cannot read',
  'phonics in multilingual homes',
  'teach blending sounds',
  'phonics guide for parents',
  'phonics for beginners',
];

const HERO_POINTS = [
  {
    label: 'What the evidence supports',
    value: 'Explicit, structured synthetic phonics',
    detail: 'Phonics works best when children learn the code in a clear sequence and use it in real reading and spelling, including techniques used in methods such as Jolly Phonics.',
  },
  {
    label: 'What most families need',
    value: '10 calm minutes a day',
    detail: 'Consistency beats intensity. Short routines are easier to sustain and kinder on parent-child relationships.',
  },
  {
    label: 'What multilingual homes need',
    value: 'Decoding plus oral language',
    detail: 'Children can learn to sound out English well while still needing vocabulary and listening support for comprehension.',
  },
];

const SEARCH_PAIN_POINTS = [
  'My child knows ABC but freezes on simple words.',
  'We can sound out words, but reading still feels stressful.',
  'I do not want phonics practice to turn into a fight.',
  'I need to know what a good phonics class actually looks like.',
];

const TOC = [
  { id: 'what-phonics-is', label: 'What phonics really is' },
  { id: 'why-phonics-works', label: 'Why phonics matters' },
  { id: 'why-children-struggle', label: 'Why children struggle' },
  { id: 'confidence-loop', label: 'How confidence gets built' },
  { id: 'multilingual-homes', label: 'Multilingual homes' },
  { id: 'ten-minute-routine', label: '10-minute home routine' },
  { id: 'myths-and-mistakes', label: 'Myths and mistakes' },
  { id: 'quality-checklist', label: 'What to look for in a programme' },
  { id: 'faq', label: 'FAQ' },
  { id: 'sources', label: 'Sources' },
];

const DEFINITIONS = [
  {
    term: 'Phonological awareness',
    meaning: 'Hearing and playing with sound structures in spoken language such as rhymes, syllables, and phonemes.',
  },
  {
    term: 'Phonemic awareness',
    meaning: 'The most fine-grained part of sound awareness: noticing, blending, deleting, and segmenting individual sounds in words.',
  },
  {
    term: 'Phonics',
    meaning: 'Learning how letters and letter groups in print represent sounds so children can decode new words.',
  },
  {
    term: 'Decoding',
    meaning: 'Using known letter-sound relationships to translate print into spoken words.',
  },
  {
    term: 'Fluency and comprehension',
    meaning: 'Fluency makes word reading smoother; comprehension depends on language, vocabulary, and background knowledge as well as decoding.',
  },
];

const PHONICS_CAN_DO = [
  'Help children decode unfamiliar words instead of relying on guessing.',
  'Support spelling by teaching children to segment spoken words into sounds.',
  'Build early reading accuracy and confidence with matched decodable practice.',
];

const PHONICS_CANNOT_DO = [
  'Replace oral language, vocabulary, and discussion.',
  'Guarantee comprehension on its own, especially for multilingual children.',
  'Act as accent training or a quick fix for every reading challenge.',
];

const READING_FLOW = [
  {
    title: 'Hear the sounds',
    detail: 'Children first notice and manipulate sounds in spoken words.',
  },
  {
    title: 'Map sound to print',
    detail: 'Phonics makes the alphabetic code explicit instead of leaving children to infer it.',
  },
  {
    title: 'Decode the word',
    detail: 'Blending turns separate sounds into a spoken word the child can recognise.',
  },
  {
    title: 'Store it faster next time',
    detail: 'Repeated successful decoding helps words become easier to recognise automatically.',
  },
  {
    title: 'Understand the sentence',
    detail: 'Vocabulary and listening comprehension carry meaning once the words can be read.',
  },
];

const STRUGGLE_GAPS = [
  {
    title: 'Weak sound awareness',
    detail: 'If a child cannot hear the sounds inside words, mapping sounds to letters becomes much harder.',
  },
  {
    title: 'Blending is not automatic yet',
    detail: 'Some children know letter sounds individually but cannot smoothly pull them together into one spoken word.',
  },
  {
    title: 'Too much cognitive load',
    detail: 'When routines are cluttered with too many rules, worksheets, or distractions, working memory gets overloaded.',
  },
  {
    title: 'Mixed strategies',
    detail: 'Switching between sounding out and guessing from pictures can confuse children about which reading strategy to trust.',
  },
  {
    title: 'Language comprehension gaps',
    detail: 'A child may decode adequately while still struggling to understand the sentence because oral language is still developing.',
  },
];

const SUPPORT_SIGNS = [
  'Your child is not making progress after a steady period of explicit practice.',
  'Reading regularly triggers distress, shutdown, or strong avoidance.',
  'Blending and segmenting short words still feel unusually hard after repeated teaching.',
  'You suspect hearing, speech, or broader language-processing difficulties are in the mix.',
];

const CONFIDENCE_LEVERS = [
  {
    title: 'Predictable routines',
    detail: 'Children practise better when they know exactly what will happen first, next, and last.',
  },
  {
    title: 'Decodable wins',
    detail: 'Texts matched to taught content let children succeed through phonics instead of guessing.',
  },
  {
    title: 'Low-pressure coaching',
    detail: 'Short prompts like “say each sound” and “blend it again” protect confidence better than over-correction.',
  },
  {
    title: 'Less parent guilt',
    detail: 'A sustainable routine matters more than perfect teaching. Calm repetition usually beats marathon practice.',
  },
];

const COACHING_SCRIPT = [
  'Let us do it slowly.',
  'Point and say each sound.',
  'Now blend it.',
  'Great. Read the whole word again.',
];

const MULTILINGUAL_POINTS = [
  {
    title: 'Decoding is not accent training',
    detail: 'Phonics connects the sounds your child already uses in speech to letters in print. The goal is accurate decoding, not a borrowed accent.',
  },
  {
    title: 'Use a two-track plan',
    detail: 'Build decoding and oral language together. A child can sound out a sentence and still need help understanding it.',
  },
  {
    title: 'India-specific reassurance',
    detail: 'Children learning across multiple scripts are not “behind”. Sound awareness develops differently across scripts, and that variation is normal.',
  },
];

const ROUTINE_STEPS = [
  {
    minute: '0-2 min',
    title: 'Sound warm-up',
    action: 'Play orally with sounds: “What word is /m/ /a/ /t/?” or “Say sun without /s/.”',
    why: 'This prepares the ears for phonics and spelling work.',
  },
  {
    minute: '2-5 min',
    title: 'One mini-skill plus review',
    action: 'Teach or revise one letter-sound link or one spelling pattern. Keep it cumulative and small.',
    why: 'Children need an incremental sequence, not random new content.',
  },
  {
    minute: '5-8 min',
    title: 'Read decodable text',
    action: 'Choose a short text where almost all words use patterns your child has already learned.',
    why: 'Matched text reinforces decoding as the trusted strategy.',
  },
  {
    minute: '8-10 min',
    title: 'Quick dictation',
    action: 'Say two or three words and one short sentence. Let your child segment and write them.',
    why: 'Spelling is decoding in reverse, so dictation deepens learning.',
  },
];

const AGE_EXPECTATIONS = [
  'Ages 3-4: focus mostly on oral language, rhymes, syllables, and listening games.',
  'Ages 4-6: build letter-sound links, begin blending and segmenting, and keep reading practice short.',
  'Ages 6-8: expand the code, add fluency, and connect decoding to meaning through discussion.',
  'Ages 8-10 and beyond: if foundations are shaky, fill the gaps explicitly instead of assuming it is too late.',
];

const MYTHS = [
  {
    myth: '“My child should memorise sight words first.”',
    reality: 'Automatic word reading grows from repeated, successful sound-letter mapping, not pure visual memorisation.',
  },
  {
    myth: '“Guessing from pictures is a reading strategy.”',
    reality: 'High-quality phonics teaches children to look at the print and decode the word, not bypass it.',
  },
  {
    myth: '“If phonics is working, comprehension will fix itself.”',
    reality: 'Comprehension still depends on oral language, vocabulary, sentence knowledge, and discussion.',
  },
  {
    myth: '“Fun means more games and more materials.”',
    reality: 'Children usually learn better from short, focused, interactive routines than from busy activities that dilute practice.',
  },
];

const CHECKLIST = [
  'A clearly defined sequence of sounds and spellings.',
  'Explicit blending for reading and segmenting for spelling.',
  'Decodable texts matched to what the child has already been taught.',
  'Small, explicit teaching of tricky words instead of giant memorisation lists.',
  'Regular dictation or writing, not reading alone.',
  'Predictable routines with lots of teacher-child interaction.',
  'In multilingual settings, attention to oral language and comprehension as well as decoding.',
];

const QUESTIONS_TO_ASK = [
  'What is the order in which you teach sounds and spellings?',
  'How do you teach blending and segmenting explicitly?',
  'What do children read during lessons: decodable text or mostly levelled books?',
  'How do you track whether a child is decoding accurately and understanding what they read?',
];

const FAQS = [
  {
    question: 'What is phonics for kids in simple words?',
    answer: 'Phonics teaches children how letters and letter groups represent sounds so they can decode printed words instead of guessing.',
  },
  {
    question: 'At what age should a child start phonics?',
    answer: 'Many children begin learning letter-sound links around reception or kindergarten age. Before that, oral language, rhyme, and sound play are useful preparation.',
  },
  {
    question: 'Can I teach phonics at home?',
    answer: 'Yes. A short, consistent routine built around blending, decodable reading, and gentle dictation can reinforce what your child is learning without recreating school at home.',
  },
  {
    question: 'What if my child knows letters but cannot read words?',
    answer: 'That usually means letter names are in place, but letter sounds or blending are not. The next step is explicit sound-to-print practice, not more alphabet recitation.',
  },
  {
    question: 'Is phonics useful in multilingual homes?',
    answer: 'Yes for decoding. Just remember that comprehension may still need extra oral language and vocabulary support, especially in English as an additional language.',
  },
  {
    question: 'Does phonics help with spelling?',
    answer: 'Yes. Strong phonics teaching includes segmenting spoken words into sounds and writing them down, which directly supports spelling.',
  },
  {
    question: 'How do I know if my child is struggling with phonics?',
    answer: 'Look for persistent difficulty with blending, segmenting, slow or inaccurate decoding after teaching, and a strong reliance on guessing. If these persist despite steady support, it is worth seeking a professional view.',
  },
  {
    question: 'Is phonics the only part of reading?',
    answer: 'No. Phonics supports word reading. Strong reading also depends on vocabulary, language comprehension, background knowledge, and reading practice.',
  },
];

const SOURCES = [
  {
    title: 'Education Endowment Foundation - Phonics',
    url: 'https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/phonics',
  },
  {
    title: 'NICHD - Report of the National Reading Panel',
    url: 'https://www.nichd.nih.gov/publications/pubs/nrp/findings',
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
    title: 'Reading Rockets - Phonological Awareness Guidelines',
    url: 'https://www.readingrockets.org/topics/phonological-and-phonemic-awareness/articles/phonological-awareness-instructional-and-assessment-guidelines',
  },
  {
    title: 'International Dyslexia Association - Structured Literacy',
    url: 'https://dyslexiaida.org/structured-literacy-effective-instruction-for-students-with-dyslexia-and-related-reading-difficulties/',
  },
  {
    title: 'International Dyslexia Association - Scarborough’s Reading Rope',
    url: 'https://dyslexiaida.org/scarboroughs-reading-rope-a-groundbreaking-infographic/',
  },
  {
    title: 'IES Practice Guide - Foundational Skills to Support Reading',
    url: 'https://education.ufl.edu/patterson/files/2019/04/IES-Practice-Guide-on-Foundational-Reading-Skills.pdf',
  },
  {
    title: 'GOV.UK - Validation of Systematic Synthetic Phonics Programmes',
    url: 'https://dera.ioe.ac.uk/id/eprint/39132/1/Validation%20of%20systematic%20synthetic%20phonics%20programmes%20supporting%20documentation%20-%20GOV.UK.pdf',
  },
  {
    title: 'NEP 2020 - Ministry of Education, India',
    url: 'https://www.education.gov.in/sites/upload_files/mhrd/files/NEP_Final_English_0.pdf',
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
    title: 'Phonological Awareness and Word Decoding in Early Kannada Readers',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11572428/',
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

export default function PhonicsForParentsResearchPage() {
  useRevealAnimations();

  const jsonLd = useMemo(
    () => [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: BLOG_URL },
          {
            '@type': 'ListItem',
            position: 3,
            name: ARTICLE_TITLE,
            item: ARTICLE_URL,
          },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: ARTICLE_TITLE,
        description: ARTICLE_DESCRIPTION,
        datePublished: ARTICLE_DATE,
        dateModified: ARTICLE_DATE,
        articleSection: 'Research',
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
    <article className="bg-[linear-gradient(180deg,#fff9f1_0%,#f8fbff_28%,#ffffff_52%,#f8fbff_100%)]">
      <ResearchArticleHero
        eyebrowPrimary="Research Guide"
        eyebrowSecondary="Parents Blog"
        title={ARTICLE_TITLE}
        description="A premium Tiny Steps phonics guide for parents who want clear answers on what phonics is, why phonics matters, how to teach it at home, and what to do when a child knows letters but still cannot read."
        dateLabel={formatBlogDate(ARTICLE_DATE)}
        readTimeLabel={ARTICLE_READ_TIME}
        actions={[
          { label: 'Book a free reading assessment', to: '/?book=1' },
          { label: 'Explore the Parents Hub', to: '/parents', variant: 'secondary' },
        ]}
        searchPainPoints={SEARCH_PAIN_POINTS}
        heroPoints={HERO_POINTS}
      />

      <div className="mx-auto max-w-7xl px-6 py-10 lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-14 lg:py-14">
        <aside className="hidden lg:block">
          <div className="sticky top-28 rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary-600">In this guide</p>
            <nav className="mt-5 space-y-3">
              {TOC.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block text-sm font-medium text-slate-600 transition hover:text-primary-600"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="mt-6 rounded-2xl bg-[linear-gradient(135deg,#fff4dd,#eef6ff)] p-4">
              <p className="text-sm font-semibold text-slate-900">TinySteps take</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Start small. Stay kind. Stay consistent. The goal is not perfect teaching. The goal is a
                routine your child can trust.
              </p>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="rounded-[2rem] border border-white/70 bg-white/88 px-6 py-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:px-8 lg:px-12">
            <SectionShell
              id="what-phonics-is"
              eyebrow="Foundations"
              title="What phonics really is - and what it is not"
              intro="Phonics is the part of reading where children learn that print is a code. Letters and letter groups represent sounds, and those sound-letter links help children read new words. That sounds simple, but it matters because many parents are given advice that mixes together sounds, letters, sight words, guessing, fluency, and comprehension."
              sources={['Reading Rockets', 'International Dyslexia Association', 'National Reading Panel']}
            >
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                <div className="space-y-5 text-base leading-8 text-slate-700">
                  <p>
                    A useful way to think about it: phonics helps a child read the words on the page.
                    Language helps the child understand what those words mean together. Good reading needs
                    both.
                  </p>
                  <p>
                    Phonics is not memorising the alphabet. It is not picture-guessing. It is not accent
                    training. And it is not the only ingredient of reading success. It is a powerful
                    foundation because it gives children a reliable strategy for unfamiliar words.
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[1.6rem] border border-emerald-100 bg-emerald-50/80 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                        Phonics can do
                      </p>
                      <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-700">
                        {PHONICS_CAN_DO.map((item) => (
                          <li key={item} className="flex gap-3">
                            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-[1.6rem] border border-amber-100 bg-amber-50/80 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
                        Phonics cannot do alone
                      </p>
                      <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-700">
                        {PHONICS_CANNOT_DO.map((item) => (
                          <li key={item} className="flex gap-3">
                            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-500" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.8rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Key terms parents should know</p>
                  <div className="mt-5 space-y-4">
                    {DEFINITIONS.map((item) => (
                      <div key={item.term} className="border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
                        <h3 className="text-lg font-semibold text-slate-900">{item.term}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{item.meaning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionShell>

            <SectionShell
              id="why-phonics-works"
              eyebrow="Evidence"
              title="Why phonics matters for early reading and spelling"
              intro="Research summaries consistently land in the same place: children do better when phonics is taught explicitly, systematically, and tied to actual reading and writing. Phonics is not a trend. It is a reliable route into decoding, spelling, and early reading confidence."
              sources={['EEF', 'NICHD / National Reading Panel', 'Scarborough’s Reading Rope']}
            >
              <div className="space-y-8">
                <div className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#fff8ea,#f5faff)] p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">The reading picture</p>
                  <div className="mt-6 grid gap-4 md:grid-cols-5">
                    {READING_FLOW.map((item, index) => (
                      <div key={item.title} className="relative rounded-[1.4rem] border border-white bg-white/90 p-4 shadow-sm">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">
                          Step {index + 1}
                        </span>
                        <h3 className="mt-2 text-lg font-semibold text-slate-900">{item.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-3">
                  <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5">
                    <h3 className="text-lg font-semibold text-slate-900">What strong phonics teaching improves</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Word reading, early spelling, and decoding accuracy tend to improve when children are
                      taught in a clear sequence with regular practice.
                    </p>
                  </div>
                  <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5">
                    <h3 className="text-lg font-semibold text-slate-900">Why explicit teaching matters</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Most children do not absorb reading the way they absorb speech. They benefit from
                      someone making the code visible and repeatable.
                    </p>
                  </div>
                  <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5">
                    <h3 className="text-lg font-semibold text-slate-900">Where the limits are</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Decoding opens the door. Vocabulary, oral language, and background knowledge shape
                      whether a child fully understands what they have read.
                    </p>
                  </div>
                </div>
              </div>
            </SectionShell>

            <SectionShell
              id="why-children-struggle"
              eyebrow="Support"
              title="Why some children struggle with phonics"
              intro="When a child struggles with phonics, it is usually not because they are lazy or careless. More often, one or two quieter skill gaps are sitting underneath the visible problem on the page. Parents do better when they can see those hidden moving parts."
              sources={['Reading Rockets', 'IES Practice Guide', 'Dyslexia definitions and support literature']}
            >
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
                <div className="grid gap-4 sm:grid-cols-2">
                  {STRUGGLE_GAPS.map((item) => (
                    <div key={item.title} className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                      <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-[1.8rem] border border-rose-100 bg-[linear-gradient(180deg,#fff9f8,#fff1ef)] p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-700">
                    When to seek extra support
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    Early support is information, not a label. If the same roadblock keeps appearing despite
                    calm, consistent teaching, it is reasonable to get another set of eyes on it.
                  </p>
                  <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
                    {SUPPORT_SIGNS.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-rose-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </SectionShell>

            <SectionShell
              id="confidence-loop"
              eyebrow="Psychology"
              title="How phonics becomes confident reading"
              intro="Children rarely become confident because someone tells them to be confident. Confidence is a by-product of repeated success, manageable cognitive load, and a relationship that feels safe enough to try again."
              sources={['Reading Rope framing', 'Parental stress and burnout research', 'Cognitive load guidance']}
            >
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                <div className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    {CONFIDENCE_LEVERS.map((item) => (
                      <div key={item.title} className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                        <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-[1.8rem] border border-slate-200 bg-[linear-gradient(135deg,#f8fbff,#fff6eb)] p-6">
                    <h3 className="text-xl font-semibold text-slate-900">The pressure paradox</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-700">
                      Many parents care so much that phonics starts to feel like a test of good parenting.
                      That usually backfires. The more pressure children feel, the more they protect
                      themselves from failure. Calm structure tends to outperform urgency.
                    </p>
                  </div>
                </div>

                <div className="rounded-[1.8rem] border border-slate-200 bg-slate-950 p-6 text-white">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-100">Coaching script</p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    Use this when your child gets stuck on a word. It keeps attention on the process rather
                    than on whether they are “good” at reading.
                  </p>
                  <div className="mt-5 space-y-3">
                    {COACHING_SCRIPT.map((line) => (
                      <div key={line} className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-medium">
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionShell>

            <SectionShell
              id="multilingual-homes"
              eyebrow="Context"
              title="Phonics in multilingual homes, especially in India"
              intro="In many TinySteps families, children are learning to read in English while also speaking, hearing, or studying in other languages. That is not a problem to erase. It is the context to design for."
              sources={['NCERT', 'NEP 2020', 'Second-language reading research', 'Kannada early reader study']}
            >
              <div className="grid gap-5 lg:grid-cols-3">
                {MULTILINGUAL_POINTS.map((item) => (
                  <div key={item.title} className="rounded-[1.7rem] border border-slate-200 bg-white p-5">
                    <h3 className="text-xl font-semibold text-slate-900">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{item.detail}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[1.8rem] border border-slate-200 bg-[linear-gradient(135deg,#eef7ff,#fff7ec)] p-6">
                <h3 className="text-xl font-semibold text-slate-900">TinySteps recommendation for multilingual homes</h3>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  Keep home language rich and warm. Add English oral language deliberately through stories,
                  explanation, comparison, and conversation. Phonics handles the code. Family talk builds
                  meaning.
                </p>
              </div>
            </SectionShell>

            <SectionShell
              id="ten-minute-routine"
              eyebrow="Routine"
              title="A practical 10-minute-a-day home routine"
              intro="If you are doing more than 10 minutes and everyone is miserable, do less. The best routine is the one that protects the relationship and still gets repeated often enough to build skill."
              sources={['GOV.UK phonics criteria', 'IES Practice Guide', 'Reading Rockets']}
            >
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
                <div className="grid gap-4 lg:grid-cols-4">
                  {ROUTINE_STEPS.map((step) => (
                    <div key={step.minute} className="rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f9fbff)] p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">{step.minute}</p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-900">{step.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-slate-700">{step.action}</p>
                      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">Why it matters</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{step.why}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="rounded-[1.8rem] border border-slate-200 bg-[linear-gradient(135deg,#fff7e8,#ffffff)] p-6">
                  <h3 className="text-xl font-semibold text-slate-900">Age-wise expectations, gently held</h3>
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                    {AGE_EXPECTATIONS.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#ff8a3d]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-[1.8rem] border border-slate-200 bg-slate-950 p-6 text-white">
                  <h3 className="text-xl font-semibold">One reminder worth keeping</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    Consistency beats intensity. Five steady days usually outperform one large catch-up
                    session at the weekend.
                  </p>
                  <div className="mt-5 flex flex-col gap-3">
                    <Link
                      to="/parents/reading-at-home"
                      className="rounded-full bg-white px-4 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                    >
                      See more parent routines
                    </Link>
                    <Link
                      to="/phonics"
                      className="rounded-full border border-white/15 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      Explore TinySteps phonics support
                    </Link>
                  </div>
                </div>
              </div>
            </SectionShell>

            <SectionShell
              id="myths-and-mistakes"
              eyebrow="Myths"
              title="Common phonics myths and mistakes"
              intro="Parents do not need more noise. They need a few myths removed so they can focus on what actually helps."
              sources={['Reading Rockets', 'GOV.UK criteria', 'Research-backed orthographic mapping explanations']}
            >
              <div className="grid gap-5 md:grid-cols-2">
                {MYTHS.map((item) => (
                  <div key={item.myth} className="rounded-[1.7rem] border border-slate-200 bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-600">Myth</p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900">{item.myth}</h3>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600">Reality</p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{item.reality}</p>
                  </div>
                ))}
              </div>
            </SectionShell>

            <SectionShell
              id="quality-checklist"
              eyebrow="Checklist"
              title="What to look for in a good phonics programme or class"
              intro="Parents do not need to become literacy researchers before enrolling. A few visible green flags tell you a lot about quality."
              sources={['GOV.UK phonics validation criteria', 'IES Practice Guide', 'Multilingual reading guidance']}
            >
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
                <div className="rounded-[1.8rem] border border-slate-200 bg-white p-6">
                  <h3 className="text-xl font-semibold text-slate-900">Quality green flags</h3>
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                    {CHECKLIST.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-[1.8rem] border border-slate-200 bg-[linear-gradient(135deg,#eef6ff,#fff8ef)] p-6">
                  <h3 className="text-xl font-semibold text-slate-900">Questions to ask before you enrol</h3>
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                    {QUESTIONS_TO_ASK.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#ff8a3d]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </SectionShell>

            <SectionShell
              id="faq"
              eyebrow="FAQ"
              title="Questions parents ask most often"
              intro="These are the practical questions behind most phonics searches: age, home teaching, multilingual families, and how to spot when support needs to go further."
              sources={['FAQ distilled from the research guide appendix']}
            >
              <div className="space-y-4">
                {FAQS.map((faq, index) => (
                  <details
                    key={faq.question}
                    open={index === 0}
                    className="group rounded-[1.6rem] border border-slate-200 bg-white px-5 py-4"
                  >
                    <summary className="cursor-pointer list-none pr-8 text-lg font-semibold text-slate-900">
                      {faq.question}
                    </summary>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </SectionShell>

            <SectionShell
              id="sources"
              eyebrow="Appendix"
              title="Sources and citation trail"
              intro="The page is based on the research guide you provided, which synthesises major reading-science evidence reviews, literacy organisations, government guidance, and India-relevant multilingual references."
            >
              <div className="grid gap-4 lg:grid-cols-2">
                {SOURCES.map((source) => (
                  <a
                    key={source.url}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-[1.5rem] border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-lg"
                  >
                    <p className="text-sm font-semibold text-slate-900">{source.title}</p>
                    <p className="mt-2 break-all text-xs leading-6 text-slate-500">{source.url}</p>
                  </a>
                ))}
              </div>
            </SectionShell>

            <AboutAuthor variant="research" />

            <section className="rounded-[32px] border border-slate-200/80 bg-slate-950 px-7 py-8 text-white shadow-[0_24px_60px_rgba(15,23,42,0.14)]">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-100">Closing note</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Start small. Stay kind. Stay consistent.</h2>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-200">
                Phonics is not magic, but it is powerful when taught clearly: small steps, explicit links,
                repeated practice, and reading materials that let children succeed. If your child is
                struggling, you do not need to panic, and you do not need to carry this alone.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/?book=1"
                  className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                >
                  Book a TinySteps assessment
                </Link>
                <Link
                  to="/reading-classes-for-kids"
                  className="inline-flex items-center rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Explore reading classes for kids
                </Link>
                <Link
                  to="/reading-fluency-program"
                  className="inline-flex items-center rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Explore reading fluency program
                </Link>
                <Link
                  to="/slow-reader-child-help"
                  className="inline-flex items-center rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Get slow reader child help
                </Link>
                <Link
                  to="/parents"
                  className="inline-flex items-center rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Return to the Parents Hub
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </article>
  );
}
