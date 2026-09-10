from pathlib import Path

PAGE = Path('src/pages/public/OnlineEnglishClassesForKidsPage.tsx')
REGISTRY = Path('src/lib/routeSeoRegistry.js')


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise SystemExit(f'Missing expected Page 11 pattern: {label}')
    return text.replace(old, new, 1)


text = PAGE.read_text()

text = replace_once(
    text,
    "import { applySeo } from '../../lib/seo';\nimport { createCourseSchema, createFAQPageSchema, PUBLIC_FACTS } from '../../lib/schemas';",
    "import { PUBLIC_LEARNER_REACH_LABEL, PUBLIC_SESSION_DURATION_LABEL, PUBLIC_SITE_FACTS } from '../../config/publicFacts';\nimport { ONE_TO_ONE_MONTHLY_PACKAGES, PER_CLASS_PRICE, formatINR } from '../../config/pricing';\nimport { applySeo } from '../../lib/seo';\nimport { createCourseSchema, createFAQPageSchema, createWebPageSchema, PUBLIC_FACTS } from '../../lib/schemas';",
    'imports',
)

text = replace_once(
    text,
    "const canonicalPath = '/online-english-classes-for-kids';\nconst canonicalUrl = `${PUBLIC_FACTS.primaryWebsite}${canonicalPath}`;",
    "const canonicalPath = '/online-english-classes-for-kids';\nconst canonicalUrl = `${PUBLIC_FACTS.primaryWebsite}${canonicalPath}`;\nconst demoMinutes = PUBLIC_SITE_FACTS.standardOffer.demoDurationMinutes;\nconst starterPackage = ONE_TO_ONE_MONTHLY_PACKAGES.find((pkg) => pkg.id === 'starter');\nconst starterPackageFee = starterPackage?.monthlyFee ?? PER_CLASS_PRICE * 12;\nconst seoTitle = 'Online English Classes for Kids | Live 1:1 | Tiny Steps';\nconst seoDescription =\n  'Live online English classes and 1:1 English tutoring for kids ages 3–12 in India and worldwide. Find the right phonics, reading, grammar, writing or speaking path after a free assessment.';",
    'canonical constants',
)

old_keywords = """const ONLINE_ENGLISH_SEO_KEYWORDS = [
  'online English classes for kids',
  '1 to 1 English classes for kids online',
  'online English tutor for kids',
  'English tutor for NRI kids',
  'online English classes for NRI kids',
  'online English classes for kids in UAE',
  'online English classes for kids in USA',
  'online English classes for kids in UK',
  'online English classes for kids in Australia',
  'online English classes for kids in Singapore',
];"""
new_keywords = """const ONLINE_ENGLISH_SEO_KEYWORDS = [
  'online English classes for kids',
  'online English classes for children',
  'live online English classes for kids',
  '1 to 1 English classes for kids online',
  'online English tutor for kids',
  'online English classes for kids ages 3 to 12',
  'online English classes for kids India',
  'online English classes for NRI kids',
  'online English classes for kids in UAE',
  'online English classes for kids in USA',
  'online English classes for kids in UK',
  'online English classes for kids in Australia',
  'online English classes for kids in Singapore',
  'online English classes for kids worldwide',
];"""
text = replace_once(text, old_keywords, new_keywords, 'keyword set')

text = replace_once(
    text,
    "  { label: '5000+ students served', tone: 'warm' as const },\n  { label: 'Families in 15+ countries', tone: 'cool' as const },\n  { label: 'Live 1:1 and small-group options', tone: 'neutral' as const },\n  { label: 'Weekly parent updates', tone: 'mint' as const },",
    "  { label: PUBLIC_LEARNER_REACH_LABEL, tone: 'warm' as const },\n  { label: 'India + worldwide online access', tone: 'cool' as const },\n  { label: 'Live 1:1 and small-group options', tone: 'neutral' as const },\n  { label: 'Parent-visible progress updates', tone: 'mint' as const },",
    'trust chips',
)

text = replace_once(
    text,
    "const heroStats = [\n  { label: 'Pricing', value: '₹400', helper: 'per standard 1:1 class' },\n  { label: 'Parent pack', value: '₹4,800', helper: 'for 12 classes' },\n  { label: 'Standard 1:1', value: '35 min', helper: 'live teacher-guided class' },\n  { label: 'Assessment first', value: 'Free', helper: 'before enrolment' },\n];",
    "const heroStats = [\n  { label: 'Pricing', value: formatINR(PER_CLASS_PRICE), helper: 'per standard 1:1 class' },\n  { label: '12-class package', value: formatINR(starterPackageFee), helper: 'standard 1:1 pricing' },\n  { label: 'Standard 1:1', value: PUBLIC_SESSION_DURATION_LABEL, helper: 'live teacher-guided class' },\n  { label: 'Assessment first', value: 'Free', helper: `one ${demoMinutes}-minute 1:1 demo` },\n];",
    'hero stats',
)

old_tracks = """const programmeTracks = [
  {
    title: 'Phonics',
    description: 'For children who know letters but need blending, decoding, and an early reading system that actually sticks.',
    href: '/phonics',
    accent: 'from-[#fff6e9] to-[#ffffff]',
  },
  {
    title: 'Reading',
    description: 'For children who read slowly, forget words, or need fluency, comprehension, and reading-aloud confidence.',
    href: '/reading-classes-for-kids',
    accent: 'from-[#eef8ff] to-[#ffffff]',
  },
  {
    title: 'Grammar & writing',
    description: 'For sentence structure, tense clarity, school-answer confidence, paragraph writing, and clearer written expression.',
    href: '/grammar',
    accent: 'from-[#f6f4ff] to-[#ffffff]',
  },
  {
    title: 'Spoken English & public speaking',
    description: 'For sentence expansion, English fluency, confident responses, clearer expression, storytelling, and presentations.',
    href: '/speaking',
    accent: 'from-[#fff0f3] to-[#ffffff]',
  },
];"""
new_tracks = """const programmeTracks = [
  {
    title: 'Phonics',
    description: 'For children who need letter-sound knowledge, blending, decoding, spelling patterns, or an early reading pathway.',
    href: '/phonics',
    accent: 'from-[#fff6e9] to-[#ffffff]',
  },
  {
    title: 'Reading',
    description: 'For broader reading support across accuracy, connected reading, vocabulary, comprehension, and reading confidence.',
    href: '/reading-classes-for-kids',
    accent: 'from-[#eef8ff] to-[#ffffff]',
  },
  {
    title: 'Grammar',
    description: 'For sentence formation, parts of speech, tense control, articles, prepositions, punctuation, and grammar accuracy.',
    href: '/grammar',
    accent: 'from-[#f6f4ff] to-[#ffffff]',
  },
  {
    title: 'Writing',
    description: 'For idea development, paragraph organisation, creative writing, school answers, editing, and independent written expression.',
    href: '/writing-classes-for-kids',
    accent: 'from-[#fff8ef] to-[#ffffff]',
  },
  {
    title: 'Spoken English',
    description: 'For everyday conversation, fuller spoken responses, vocabulary in use, and conversational English fluency.',
    href: '/spoken-english-classes-for-kids-online',
    accent: 'from-[#ecfdf5] to-[#ffffff]',
  },
  {
    title: 'Public Speaking & Communication',
    description: 'For structured answers, storytelling, show-and-tell, classroom communication, presentations, and audience awareness.',
    href: '/speaking',
    accent: 'from-[#fff0f3] to-[#ffffff]',
  },
];"""
text = replace_once(text, old_tracks, new_tracks, 'programme chooser')

text = replace_once(
    text,
    "      'Tiny Steps starts with a free 35-minute 1:1 online demo assessment class to check whether the main gap is phonics, reading, grammar, writing, sentence formation, or spoken English confidence.',",
    "      `Tiny Steps starts with one free ${demoMinutes}-minute 1:1 online demo assessment class to identify whether the main need is phonics, reading, grammar, writing, spoken English, public speaking and communication, or specialist confidence-building support.`,",
    'FAQ assessment',
)
text = replace_once(
    text,
    "      'Yes. Tiny Steps offers live 1:1 online English learning and may also offer small-group options. The standard 1:1 class is 35 minutes, with the learning path chosen after assessment.',",
    "      `Yes. Tiny Steps offers live 1:1 online English learning and may also offer small-group options. Standard 1:1 classes are ${PUBLIC_SESSION_DURATION_LABEL}; small-group duration varies with group size. The learning path is chosen after assessment.`,",
    'FAQ tutor',
)
text = replace_once(
    text,
    "      'Yes. Children who understand English but do not speak confidently often need guided sentence expansion, structured speaking turns, and low-pressure confidence building.',",
    "      'Sometimes. If everyday English conversation or fluency is the main need, Spoken English is the clearer programme. If confidence itself is the primary barrier despite adequate language for the task, the specialist Confidence Building programme may fit better. The assessment helps separate these needs.',",
    'FAQ confidence',
)
text = replace_once(
    text,
    "      'The current standard 1:1 price is ₹400 per class and ₹4,800 for 12 classes. Parents can review the full pricing page after the free assessment confirms the right starting path.',",
    "      `The current standard 1:1 price is ${formatINR(PER_CLASS_PRICE)} per class and ${formatINR(starterPackageFee)} for 12 classes. Parents can review the full pricing page after the free assessment confirms the right starting path.`,",
    'FAQ pricing',
)

text = replace_once(
    text,
    "    const courseSchema = createCourseSchema({",
    "    const webpageSchema = {\n      ...createWebPageSchema({\n        name: 'Online English Classes for Kids',\n        description: seoDescription,\n        url: canonicalUrl,\n      }),\n      '@id': `${canonicalUrl}#webpage`,\n    };\n\n    const courseSchema = createCourseSchema({",
    'WebPage schema',
)
text = replace_once(
    text,
    "        'Live online English classes and 1:1 English tutoring for kids in India and worldwide covering phonics, reading, grammar, writing, spoken English, and public speaking confidence.',",
    "        'Live online English classes and 1:1 English tutoring for children ages 3–12 in India and worldwide, with assessment-led placement into phonics, reading, grammar, writing, spoken English, or public speaking and communication.',",
    'Course description',
)
text = replace_once(
    text,
    "        'public speaking confidence',",
    "        'public speaking',\n        'communication skills',",
    'Course teaches',
)
text = replace_once(
    text,
    "      title: 'Online English Classes for Kids in India and Worldwide | Tiny Steps',\n      description:\n        'Live online English classes and 1:1 English tutoring for kids ages 3–12. Phonics, reading, grammar, writing and speaking support for India, NRI and worldwide families.',",
    "      title: seoTitle,\n      description: seoDescription,",
    'runtime SEO',
)
text = replace_once(
    text,
    "      jsonLd: [breadcrumbSchema, courseSchema, faqSchema],",
    "      robots: 'index,follow',\n      jsonLd: [breadcrumbSchema, webpageSchema, courseSchema, faqSchema],",
    'SEO schema list',
)

text = replace_once(
    text,
    "        title=\"Online English Classes for Kids: Live 1:1 and Small-Group Support\"",
    "        title=\"Online English Classes for Kids\"",
    'hero H1',
)
text = replace_once(
    text,
    "              Tiny Steps offers live online English classes for kids who need a clear path across phonics, reading, grammar, writing, spoken English, and presentation confidence.",
    "              Tiny Steps offers live online English classes for children ages 3–12 in India and worldwide, with live 1:1 teaching and selected small-group options across phonics, reading, grammar, writing, spoken English, and public speaking and communication.",
    'hero intro',
)
text = replace_once(
    text,
    "              Parents looking for a live 1:1 English tutor can begin with one free 35-minute assessment, then review the recommended programme, transparent pricing, class samples, and compatible timings before enrolment.",
    "              Parents who are not yet sure which English programme fits can begin with one free {demoMinutes}-minute 1:1 assessment, then review the recommended owner programme, transparent pricing, class samples, and compatible timings before enrolment.",
    'hero second paragraph',
)
text = text.replace("{ to: '/book-demo', label: 'Book Free 35-Minute Demo', variant: 'primary' }", "{ to: '/book-demo', label: `Book Free ${demoMinutes}-Minute Demo`, variant: 'primary' }")
text = replace_once(
    text,
    "                'One free 35-minute 1:1 demo assessment before recommending the first class plan',",
    "                `One free ${demoMinutes}-minute 1:1 demo assessment before recommending the first class plan`,",
    'hero trust panel assessment',
)
text = replace_once(
    text,
    "                'Weekly parent updates after classes begin',",
    "                'Parent-visible progress updates after classes begin',",
    'trust cadence',
)

text = replace_once(
    text,
    "          <div className=\"mt-6 grid gap-4 md:grid-cols-2\">\n          {programmeTracks.map((track) => (",
    "          <div className=\"mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3\">\n          {programmeTracks.map((track) => (",
    'programme grid',
)
text = replace_once(
    text,
    "          </div>\n        </LeadSection>\n\n      <LeadSection>\n        <div className=\"grid gap-5 lg:grid-cols-[1.1fr_0.9fr]\">",
    "          </div>\n          <p className=\"mt-5 text-sm leading-7 text-slate-600\">\n            If the child&apos;s main barrier is willingness to participate or speaking comfort rather than an English-skill gap, review the{' '}\n            <Link to=\"/confidence-building-program-kids\" className=\"font-semibold underline underline-offset-4\">\n              specialist Confidence Building programme\n            </Link>.\n          </p>\n        </LeadSection>\n\n      <LeadSection>\n        <div className=\"grid gap-5 lg:grid-cols-[1.1fr_0.9fr]\">",
    'confidence specialist handoff',
)

text = replace_once(
    text,
    "              description=\"Tiny Steps does not use the same classroom expectations for every age band.\"",
    "              description=\"These are broad examples of how goals may change with age, not fixed programme levels. Assessment still determines the correct subject and starting point.\"",
    'age guidance disclaimer',
)
text = replace_once(
    text,
    "              description=\"This page is built for families looking for a national or global online English solution, not only a local city page.\"",
    "              description=\"This page is built for families looking for one broad India-and-worldwide online English entry point, not a duplicated country or city landing page.\"",
    'trust proof description',
)
text = replace_once(
    text,
    "                '5000+ students served',\n                'Families in 15+ countries',\n                'Live teacher-led learning',\n                'Class samples available before parents decide',\n                'Weekly parent updates after classes begin',",
    "                PUBLIC_LEARNER_REACH_LABEL,\n                'India + worldwide online access',\n                'Live teacher-led learning',\n                'Class samples available before parents decide',\n                'Parent-visible progress updates after classes begin',",
    'trust proof list',
)

text = replace_once(
    text,
    "              title=\"How the free 35-minute 1:1 online demo assessment works\"",
    "              title={`How the free ${demoMinutes}-minute 1:1 online demo assessment works`}",
    'assessment heading',
)
text = replace_once(
    text,
    "                <p className=\"mt-2 text-3xl font-bold text-slate-900\">₹400</p>",
    "                <p className=\"mt-2 text-3xl font-bold text-slate-900\">{formatINR(PER_CLASS_PRICE)}</p>",
    'pricing per class',
)
text = replace_once(
    text,
    "                <p className=\"mt-2 text-3xl font-bold text-slate-900\">₹4,800</p>",
    "                <p className=\"mt-2 text-3xl font-bold text-slate-900\">{formatINR(starterPackageFee)}</p>",
    'pricing package',
)
text = replace_once(
    text,
    "              The standard 1:1 class is 35 minutes. Review all available formats and packages on the{' '}",
    "              Standard 1:1 classes are {PUBLIC_SESSION_DURATION_LABEL}. Small-group duration varies with group size. Review all available formats and packages on the{' '}",
    'pricing duration',
)
text = replace_once(
    text,
    "              Start with a free 35-minute 1:1 online demo assessment, then review pricing and the recommended path for phonics, reading, grammar, writing, spoken English, or communication.",
    "              Start with one free {demoMinutes}-minute 1:1 online demo assessment, then review pricing and the recommended path for phonics, reading, grammar, writing, spoken English, public speaking and communication, or specialist confidence support.",
    'final CTA description',
)

PAGE.write_text(text)

registry = REGISTRY.read_text()
old_block = """  '/online-english-classes-for-kids': {
    title: 'Online English Classes for Kids in India and Worldwide | Tiny Steps',
    description:
      'Live online English classes for kids in India and worldwide. Build reading, grammar, spoken English, and confidence through structured 1:1 and small-group classes.',
    canonicalPath: '/online-english-classes-for-kids',
    ogType: 'website',
  },"""
new_block = """  '/online-english-classes-for-kids': {
    title: 'Online English Classes for Kids | Live 1:1 | Tiny Steps',
    description:
      'Live online English classes and 1:1 English tutoring for kids ages 3–12 in India and worldwide. Find the right phonics, reading, grammar, writing or speaking path after a free assessment.',
    canonicalPath: '/online-english-classes-for-kids',
    ogType: 'website',
    keywords:
      'online English classes for kids,online English classes for children,live online English classes for kids,1 to 1 English classes for kids online,online English tutor for kids,online English classes for kids ages 3 to 12,online English classes for kids India,online English classes for NRI kids,online English classes for kids in UAE,online English classes for kids in USA,online English classes for kids in UK,online English classes for kids in Australia,online English classes for kids in Singapore,online English classes for kids worldwide',
  },"""
registry = replace_once(registry, old_block, new_block, 'route registry owner')
REGISTRY.write_text(registry)
