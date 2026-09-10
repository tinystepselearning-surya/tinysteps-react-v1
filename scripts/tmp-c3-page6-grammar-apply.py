from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise SystemExit(f'Expected pattern not found: {label}')
    return text.replace(old, new, 1)

branch_files = {
    'grammar': Path('src/pages/grammar.tsx'),
    'registry': Path('src/lib/routeSeoRegistry.js'),
    'vite': Path('vite.config.js'),
}

# ---------------- Grammar page ----------------
path = branch_files['grammar']
text = path.read_text()

text = replace_once(
    text,
    """import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import ClusterSeoNav from '../components/programs/ClusterSeoNav';
import TestimonialSnippets from '../components/common/TestimonialSnippets';
import { applySeo } from '../lib/seo';
import { createCourseSchema, createFAQPageSchema, PUBLIC_FACTS } from '../lib/schemas';
import ResponsiveTeachingSection from '../components/programs/ResponsiveTeachingSection';

const faqItems = [""",
    """import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import TestimonialSnippets from '../components/common/TestimonialSnippets';
import { PUBLIC_SESSION_DURATION_LABEL, PUBLIC_SITE_FACTS } from '../config/publicFacts';
import { SEMANTIC_FACTS } from '../config/semanticFacts';
import { applySeo } from '../lib/seo';
import { createCourseSchema, createFAQPageSchema, createWebPageSchema, PUBLIC_FACTS } from '../lib/schemas';
import ResponsiveTeachingSection from '../components/programs/ResponsiveTeachingSection';

const grammarFacts = SEMANTIC_FACTS.programmes.grammar;
const demoMinutes = PUBLIC_SITE_FACTS.standardOffer.demoDurationMinutes;

const GRAMMAR_SEO_KEYWORDS = [
  'online grammar classes for kids',
  'grammar classes for kids',
  'grammar classes for kids India',
  'English grammar classes for kids',
  '1 to 1 grammar classes online',
  'online grammar tutor for kids',
  'sentence formation classes for kids',
  'grammar classes for sentence formation',
  'grammar classes to improve school answers',
  'grammar correction classes for kids',
  'online grammar classes in India',
  'online grammar classes for kids worldwide',
];

const faqItems = [""",
    'imports and keyword contract',
)

text = replace_once(
    text,
    """  {
    question: 'How does Tiny Steps show grammar progress to parents?',
    answer:
      'Parents receive practical progress visibility: what was practised, common errors, improvement points, and next-step goals across grammar clarity, sentence formation, writing clarity, and school-answer confidence.',
  },
];""",
    """  {
    question: 'How does Tiny Steps show grammar progress to parents?',
    answer:
      'Parents receive practical progress visibility: what was practised, common errors, improvement points, and next-step goals across grammar clarity, sentence formation, writing clarity, and school-answer confidence.',
  },
  {
    question: 'What ages are Tiny Steps grammar classes for?',
    answer:
      'Beginner Grammar is designed for ages 5–10 and Advanced Grammar for ages 8–12. The age ranges overlap intentionally because placement depends on the child’s current grammar control and readiness, not age alone.',
  },
  {
    question: 'Are Tiny Steps grammar classes live and 1:1?',
    answer:
      `Yes. Standard Tiny Steps grammar classes are live 1:1 online classes and run for ${PUBLIC_SESSION_DURATION_LABEL}.`,
  },
  {
    question: 'Can children outside India join Tiny Steps grammar classes?',
    answer:
      'Yes. Tiny Steps grammar classes are available to families in India and worldwide, including NRI families, subject to a compatible teacher schedule and the child’s learning fit.',
  },
  {
    question: 'What is the difference between grammar classes and writing classes?',
    answer:
      'Grammar classes focus on sentence structure, parts of speech, tenses, punctuation, correction and accurate language use. Writing classes go further into idea development, paragraph structure, creative writing, editing and longer written responses. A child may need one or both depending on the assessment.',
  },
];""",
    'expanded grammar FAQs',
)

text = replace_once(
    text,
    """  {
    name: 'Writing clarity',
    description: 'Improve answer structure, correction skills, and paragraph-level clarity.',
    href: '/reading-classes-for-kids',
    anchor: 'reading classes for kids',
    url: `${PUBLIC_FACTS.primaryWebsite}/reading-classes-for-kids`,
  },
  {
    name: 'Confident school answers',
    description: 'Apply grammar for clear expression in written and oral school responses.',
    href: '/speaking',
    anchor: 'public speaking and communication classes',
    url: `${PUBLIC_FACTS.primaryWebsite}/speaking`,
  },""",
    """  {
    name: 'Writing clarity',
    description: 'Apply grammar accurately in written answers; use the dedicated writing programme for paragraph and creative-writing development.',
    href: '/writing-classes-for-kids',
    anchor: 'writing classes for kids',
    url: `${PUBLIC_FACTS.primaryWebsite}/writing-classes-for-kids`,
  },
  {
    name: 'Confident school answers',
    description: 'Apply grammar accurately when building complete, clear school responses.',
    href: '/grammar',
    anchor: 'grammar classes for school-answer clarity',
    url: `${PUBLIC_FACTS.primaryWebsite}/grammar`,
  },""",
    'grammar pathway owner links',
)

text = replace_once(
    text,
    """export default function GrammarPage() {
  const canonicalPath = '/grammar';
  const canonicalUrl = `${PUBLIC_FACTS.primaryWebsite}${canonicalPath}`;

  useEffect(() => {""",
    """export default function GrammarPage() {
  const canonicalPath = '/grammar';
  const canonicalUrl = `${PUBLIC_FACTS.primaryWebsite}${canonicalPath}`;
  const seoTitle = 'Online Grammar Classes for Kids | Live 1:1 | Tiny Steps';
  const seoDescription =
    'Live 1:1 online grammar classes for kids in India and worldwide. Build sentence formation, tenses, punctuation, grammar accuracy and clearer school answers with assessment-first placement.';

  useEffect(() => {""",
    'runtime SEO constants',
)

text = replace_once(
    text,
    """    const pathwayItemListSchema = {""",
    """    const webpageSchema = {
      ...createWebPageSchema({
        name: 'Online Grammar Classes for Kids',
        description: seoDescription,
        url: canonicalUrl,
      }),
      '@id': `${canonicalUrl}#webpage`,
    };

    const pathwayItemListSchema = {""",
    'webpage schema',
)

text = replace_once(
    text,
    """        item: {
          '@type': 'Course',
          name: card.name,
          description: card.description,
          areaServed: 'India',
        },""",
    """        item: {
          '@type': 'Thing',
          name: card.name,
          description: card.description,
        },""",
    'pathway topic schema type',
)

text = replace_once(
    text,
    """    const courseSchema = createCourseSchema({
      name: 'Grammar Classes for Kids',
      description:
        'Live online grammar classes for kids in India focused on sentence formation, tenses, punctuation, writing clarity, and confident school answers.',
      url: canonicalUrl,
      educationalLevel: 'Primary and middle-school grammar support',
      teaches: ['grammar', 'sentence formation', 'tenses', 'punctuation', 'writing clarity'],
      areaServed: 'India',
    });

    applySeo({
      title: 'Grammar Classes for Kids in India | Tiny Steps',
      description:
        'Live online grammar classes for kids in India. Build sentence formation, tenses, punctuation, writing clarity and school-answer confidence. Book one free 35-minute 1:1 online demo assessment class.',
      canonicalPath,
      robots: 'index,follow',
      ogType: 'website',
      jsonLd: [breadcrumbSchema, courseSchema, pathwayItemListSchema, faqSchema],
    });""",
    """    const courseSchema = createCourseSchema({
      name: 'Online Grammar Classes for Kids',
      description:
        'Live 1:1 online grammar classes for kids focused on sentence formation, parts of speech, tenses, punctuation, grammar correction and clearer school answers.',
      url: canonicalUrl,
      educationalLevel: 'Beginner Grammar ages 5–10; Advanced Grammar ages 8–12',
      teaches: ['grammar', 'sentence formation', 'parts of speech', 'tenses', 'punctuation', 'grammar correction', 'school-answer clarity'],
      areaServed: ['India', 'Worldwide'],
    });

    applySeo({
      title: seoTitle,
      description: seoDescription,
      canonicalPath,
      robots: 'index,follow',
      ogType: 'website',
      keywords: GRAMMAR_SEO_KEYWORDS,
      jsonLd: [breadcrumbSchema, webpageSchema, courseSchema, pathwayItemListSchema, faqSchema],
    });""",
    'course schema and SEO application',
)

text = replace_once(
    text,
    '                Grammar Classes for Kids in India',
    '                Online Grammar Classes for Kids',
    'H1',
)

text = replace_once(
    text,
    '                Help your child build grammar clarity, sentence formation, writing clarity, and stronger school answers through structured live online grammar classes for kids in India.',
    '                Tiny Steps provides live 1:1 online grammar classes for children in India and worldwide. Build sentence formation, grammar accuracy, tenses, punctuation, correction skills, and clearer school answers through level-matched teaching.',
    'hero primary paragraph',
)

text = replace_once(
    text,
    """                Tiny Steps follows an assessment-first grammar path to understand whether your child needs help with sentence formation, tenses, punctuation, writing clarity, or grammar use in school answers. Ready to move forward? <Link to="/book-demo" className="font-semibold text-slate-900 underline underline-offset-2 hover:text-sky-700">book one free 35-minute 1:1 online demo assessment class</Link>.""",
    """                Tiny Steps follows an assessment-first grammar path to understand whether your child needs Beginner Grammar, Advanced Grammar, or focused support with sentence formation, tenses, punctuation, correction, or grammar use in school answers. Ready to move forward? <Link to="/book-demo" className="font-semibold text-slate-900 underline underline-offset-2 hover:text-sky-700">book one free {demoMinutes}-minute 1:1 online demo assessment class</Link>.""",
    'hero assessment paragraph',
)

text = replace_once(
    text,
    """                <p className="mt-3 text-sm text-slate-600 md:text-[15px]">Takes 20-30 seconds • No commitment</p>""",
    """                <p className="mt-3 text-sm text-slate-600 md:text-[15px]">One free {demoMinutes}-minute 1:1 assessment before enrolment</p>""",
    'remove unsupported booking-time claim',
)

text = replace_once(
    text,
    """                {['Grammar clarity', 'Sentence formation', 'Parent progress visibility'].map((chip) => (""",
    """                {[grammarFacts.levels.beginner.ageRange.label + ' Beginner', grammarFacts.levels.advanced.ageRange.label + ' Advanced', `${PUBLIC_SESSION_DURATION_LABEL} live 1:1`, 'India + worldwide'].map((chip) => (""",
    'hero fact chips',
)

# Fix grammar gap route ownership.
text = text.replace(
    """                href: '/online-english-classes-for-kids',
                anchor: 'online English classes for kids in India',""",
    """                href: '/grammar',
                anchor: 'online grammar classes for kids',""",
    1,
)
text = text.replace(
    """                href: '/reading-classes-for-kids',
                anchor: 'reading classes for kids',""",
    """                href: '/grammar',
                anchor: 'grammar classes for kids',""",
    1,
)
text = replace_once(
    text,
    """                href: '/grammar',
                anchor: 'grammar classes for kids',
              },
              {
                pill: 'Grammar usage and clear expression',""",
    """                href: '/writing-classes-for-kids',
                anchor: 'writing classes for kids',
              },
              {
                pill: 'Grammar usage and clear expression',""",
    'writing-gap owner handoff',
)
text = replace_once(
    text,
    """                href: '/speaking',
                anchor: 'public speaking and communication classes',""",
    """                href: '/spoken-english-classes-for-kids-online',
                anchor: 'spoken English classes for kids online',""",
    'spoken grammar owner handoff',
)

text = replace_once(
    text,
    '          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Online grammar classes for kids across India</h2>',
    '          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Online grammar classes for kids in India and worldwide</h2>',
    'international section heading',
)
text = replace_once(
    text,
    """            Tiny Steps supports children across India through live online grammar classes. Parents from Hyderabad, Bangalore, Chennai, Mumbai, Delhi, Pune, Kolkata, and other locations can <Link to="/book-demo" className="font-semibold text-slate-900 underline underline-offset-2">book one free 35-minute 1:1 online demo assessment class</Link> and receive a level-based grammar and sentence formation path.""",
    """            Tiny Steps supports families across India and internationally through the same live online grammar programme. Children in India and NRI/international families can <Link to="/book-demo" className="font-semibold text-slate-900 underline underline-offset-2">book one free {demoMinutes}-minute 1:1 online demo assessment class</Link>; suitable class timings and the correct grammar level are confirmed before enrolment.""",
    'international section copy',
)

text = replace_once(
    text,
    """            Tiny Steps connects grammar with real usage so children do not only memorise rules; they learn to apply them in speaking and writing. Families can also connect grammar progress with <Link to="/reading-classes-for-kids" className="font-semibold underline underline-offset-2">reading classes for kids</Link> where comprehension support is needed.""",
    """            Tiny Steps connects grammar with real usage so children do not only memorise rules; they learn to apply grammar accurately in speaking and writing. For paragraph structure, creative writing, editing, and longer written responses, use the dedicated <Link to="/writing-classes-for-kids" className="font-semibold underline underline-offset-2">Writing Classes for Kids</Link>. For grammar use during spoken responses, see <Link to="/spoken-english-classes-for-kids-online" className="font-semibold underline underline-offset-2">Spoken English Classes for Kids</Link>.""",
    'grammar writing spoken boundary',
)

text = replace_once(
    text,
    '          <h2 className="mb-5 text-2xl font-bold text-slate-900 sm:text-3xl">Age-wise grammar outcomes</h2>',
    '          <h2 className="mb-5 text-2xl font-bold text-slate-900 sm:text-3xl">Grammar levels and age guidance</h2>',
    'level section heading',
)
text = replace_once(
    text,
    '<span className="inline-flex w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">Ages 5-7</span>',
    '<span className="inline-flex w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">{grammarFacts.levels.beginner.label} · {grammarFacts.levels.beginner.ageRange.label}</span>',
    'beginner level label',
)
text = replace_once(
    text,
    '                Naming words, action words, describing words, simple sentences, basic punctuation, and oral sentence practice.',
    '                {grammarFacts.levels.beginner.lessonCount} lessons build core grammar, sentence formation, punctuation, tense foundations, and accurate use in meaningful sentences.',
    'beginner level description',
)
text = replace_once(
    text,
    """              <Link to="/grammar" className="mt-4 inline-block text-sm font-semibold underline underline-offset-2">
                Start with grammar foundation
              </Link>""",
    """              <Link to="/curriculum?tab=grammar" className="mt-4 inline-block text-sm font-semibold underline underline-offset-2">
                See Beginner Grammar curriculum
              </Link>""",
    'beginner curriculum link',
)
text = replace_once(
    text,
    '<span className="inline-flex w-fit rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-800">Ages 8-10</span>',
    '<span className="inline-flex w-fit rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-800">{grammarFacts.levels.advanced.label} · {grammarFacts.levels.advanced.ageRange.label}</span>',
    'advanced level label',
)
text = replace_once(
    text,
    '                Tenses, articles, prepositions, conjunctions, sentence correction, paragraph clarity, and school answers.',
    '                {grammarFacts.levels.advanced.lessonCount} lessons develop stronger tense control, sentence complexity, correction, grammar in context, and accurate written and spoken expression.',
    'advanced level description',
)
text = replace_once(
    text,
    """              <Link to="/book-demo" className="mt-4 inline-block text-sm font-semibold underline underline-offset-2">
                Build grammar and sentence clarity
              </Link>""",
    """              <Link to="/curriculum?tab=grammar" className="mt-4 inline-block text-sm font-semibold underline underline-offset-2">
                See Advanced Grammar curriculum
              </Link>""",
    'advanced curriculum link',
)
text = replace_once(
    text,
    '<span className="inline-flex w-fit rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-800">Ages 11-12</span>',
    '<span className="inline-flex w-fit rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-800">Placement by readiness</span>',
    'placement label',
)
text = replace_once(
    text,
    '                Children need stronger grammar accuracy, paragraph-quality answers, editing skills, explanation clarity, and confident written and oral expression.',
    '                The age ranges overlap intentionally. Assessment considers current grammar accuracy, sentence control, correction skill, and readiness so the child starts in the appropriate track rather than being placed by age alone.',
    'placement description',
)
text = replace_once(
    text,
    '                Book one free 35-minute 1:1 online demo assessment class',
    '                Check the right grammar level',
    'placement CTA label',
)

# Replace the first footer programme-link row with owner-aware links.
text = replace_once(
    text,
    """            <Link to="/reading-classes-for-kids" className="font-semibold underline underline-offset-2 hover:text-white">reading classes for kids</Link>
            <span className="hidden sm:inline text-slate-400">•</span>
            <Link to="/phonics" className="font-semibold underline underline-offset-2 hover:text-white">online phonics classes for kids</Link>
            <span className="hidden sm:inline text-slate-400">•</span>
            <Link to="/pricing" className="font-semibold underline underline-offset-2 hover:text-white">class pricing</Link>""",
    """            <Link to="/writing-classes-for-kids" className="font-semibold underline underline-offset-2 hover:text-white">writing classes for kids</Link>
            <span className="hidden sm:inline text-slate-400">•</span>
            <Link to="/spoken-english-classes-for-kids-online" className="font-semibold underline underline-offset-2 hover:text-white">spoken English classes for kids</Link>
            <span className="hidden sm:inline text-slate-400">•</span>
            <Link to="/pricing" className="font-semibold underline underline-offset-2 hover:text-white">class pricing</Link>""",
    'footer owner-aware links',
)

text = replace_once(text, "\n      <ClusterSeoNav cluster=\"phonics\" />", '', 'remove incorrect phonics footer')

path.write_text(text)

# ---------------- Prerender SEO registry ----------------
path = branch_files['registry']
text = path.read_text()
text = replace_once(
    text,
    """  '/grammar': {
    title: 'Grammar Classes for Kids in India | Tiny Steps',
    description:
      'Live online grammar classes for kids in India. Build sentence formation, tenses, punctuation, writing clarity and school-answer confidence. Book one free 35-minute 1:1 demo assessment class.',
    canonicalPath: '/grammar',
    ogType: 'website',
  },""",
    """  '/grammar': {
    title: 'Online Grammar Classes for Kids | Live 1:1 | Tiny Steps',
    description:
      'Live 1:1 online grammar classes for kids in India and worldwide. Build sentence formation, tenses, punctuation, grammar accuracy and clearer school answers with assessment-first placement.',
    canonicalPath: '/grammar',
    ogType: 'website',
    keywords:
      'online grammar classes for kids,grammar classes for kids,grammar classes for kids India,English grammar classes for kids,1 to 1 grammar classes online,online grammar tutor for kids,sentence formation classes for kids,grammar classes for sentence formation,grammar classes to improve school answers,grammar correction classes for kids,online grammar classes in India,online grammar classes for kids worldwide',
  },""",
    'grammar prerender metadata',
)
path.write_text(text)

# ---------------- Remove hidden grammar-only Vite normalization ----------------
path = branch_files['vite']
text = path.read_text()
text = replace_once(
    text,
    """      // C3: grammar and speaking already serve international families; normalize
      // only their structured-data geography while preserving their proven copy.
      if (id.includes('/src/pages/grammar.tsx') || id.includes('/src/pages/speaking.tsx')) {
        transformed = transformed.replace("areaServed: 'India'", "areaServed: ['India', 'Worldwide']");
      }""",
    """      // C3: speaking still has a source-level geography migration pending its
      // dedicated owner-page pass. Grammar now carries canonical geography directly.
      if (id.includes('/src/pages/speaking.tsx')) {
        transformed = transformed.replace("areaServed: 'India'", "areaServed: ['India', 'Worldwide']");
      }""",
    'remove grammar Vite geography dependency',
)
path.write_text(text)

# Focused sanity checks only; full CI is intentionally deferred until page 15.
grammar = branch_files['grammar'].read_text()
registry = branch_files['registry'].read_text()
vite = branch_files['vite'].read_text()

required = [
    'Online Grammar Classes for Kids',
    "areaServed: ['India', 'Worldwide']",
    "href: '/writing-classes-for-kids'",
    "href: '/spoken-english-classes-for-kids-online'",
    'Beginner Grammar',
    'Advanced Grammar',
    "keywords: GRAMMAR_SEO_KEYWORDS",
    'createWebPageSchema',
]
for token in required:
    if token not in grammar:
        raise SystemExit(f'Grammar reconciliation missing {token!r}')

for forbidden in [
    "import ClusterSeoNav",
    '<ClusterSeoNav cluster="phonics" />',
    "href: '/reading-classes-for-kids',\n    anchor: 'reading classes for kids'",
    'Takes 20-30 seconds',
    '>Grammar Classes for Kids in India<',
]:
    if forbidden in grammar:
        raise SystemExit(f'Grammar reconciliation still contains forbidden {forbidden!r}')

if "title: 'Online Grammar Classes for Kids | Live 1:1 | Tiny Steps'" not in registry:
    raise SystemExit('Grammar prerender title not aligned')
if "id.includes('/src/pages/grammar.tsx') || id.includes('/src/pages/speaking.tsx')" in vite:
    raise SystemExit('Grammar still depends on Vite geography normalization')

print('Page 6 grammar reconciliation applied successfully.')
