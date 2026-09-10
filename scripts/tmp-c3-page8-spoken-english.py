from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise SystemExit(f'Missing expected pattern: {label}')
    return text.replace(old, new, 1)

page = Path('src/pages/public/SpokenEnglishClassesForKidsPage.tsx')
text = page.read_text()

text = replace_once(
    text,
    "import { applySeo } from '../../lib/seo';\nimport { createCourseSchema, createFAQPageSchema, PUBLIC_FACTS } from '../../lib/schemas';",
    "import { PUBLIC_SESSION_DURATION_LABEL, PUBLIC_SITE_FACTS } from '../../config/publicFacts';\nimport { ONE_TO_ONE_MONTHLY_PACKAGES, PER_CLASS_PRICE, formatINR } from '../../config/pricing';\nimport { applySeo } from '../../lib/seo';\nimport { createCourseSchema, createFAQPageSchema, createWebPageSchema, PUBLIC_FACTS } from '../../lib/schemas';",
    'imports',
)

text = replace_once(
    text,
    "const canonicalPath = '/spoken-english-classes-for-kids-online';\nconst canonicalUrl = `${PUBLIC_FACTS.primaryWebsite}${canonicalPath}`;",
    "const canonicalPath = '/spoken-english-classes-for-kids-online';\nconst canonicalUrl = `${PUBLIC_FACTS.primaryWebsite}${canonicalPath}`;\nconst demoMinutes = PUBLIC_SITE_FACTS.standardOffer.demoDurationMinutes;\nconst starterPackage = ONE_TO_ONE_MONTHLY_PACKAGES[0];\nconst seoTitle = 'Spoken English Classes for Kids Online | Live 1:1 | Tiny Steps';\nconst seoDescription =\n  'Live 1:1 spoken English classes for kids in India and worldwide. Build fuller sentences, conversational fluency, grammar in use and speaking confidence in 35-minute classes.';",
    'constants',
)

text = replace_once(
    text,
    "  'English fluency classes for kids',\n  'spoken English classes for NRI kids',\n  'online English speaking tutor for kids',",
    "  'English fluency classes for kids',\n  'conversational English classes for kids',\n  'English conversation classes for kids online',\n  'online English speaking practice for kids',\n  'spoken English classes for NRI kids',\n  'online English speaking tutor for kids',\n  'online spoken English classes for kids worldwide',",
    'keywords',
)

text = replace_once(
    text,
    "  'Child is shy in class',",
    "  'Child hesitates in everyday conversation',",
    'pain point',
)

text = replace_once(
    text,
    "    question: 'Can these classes help a shy child?',\n    answer:\n      'Yes. Tiny Steps uses low-pressure live speaking practice so shy children can move from short answers to fuller, clearer responses over time.',",
    "    question: 'Can spoken English classes help a child who hesitates to speak?',\n    answer:\n      'Yes, when the hesitation is mainly linked to limited sentence-building, response practice, or conversational fluency. If confidence itself is the main difficulty across different situations, the dedicated Tiny Steps confidence-building programme may be a better fit.',",
    'hesitation FAQ',
)

text = replace_once(
    text,
    "    question: 'Are Tiny Steps spoken English classes live and 1:1?',\n    answer:\n      'Yes. Tiny Steps offers live 1:1 online learning, with a standard class duration of 35 minutes. Small-group options may also be available for selected schedules or programme fits.',",
    "    question: 'Are Tiny Steps spoken English classes live and 1:1?',\n    answer:\n      `Yes. Standard Tiny Steps spoken English classes are live 1:1 online classes and run for ${PUBLIC_SESSION_DURATION_LABEL}. Small-group options may also be available for selected schedules or programme fits.`,",
    'duration FAQ',
)

text = replace_once(
    text,
    "    const courseSchema = createCourseSchema({",
    "    const webpageSchema = {\n      ...createWebPageSchema({\n        name: 'Spoken English Classes for Kids Online',\n        description: seoDescription,\n        url: canonicalUrl,\n      }),\n      '@id': `${canonicalUrl}#webpage`,\n    };\n\n    const courseSchema = createCourseSchema({",
    'webpage schema',
)

text = replace_once(
    text,
    "      educationalLevel: 'School-age spoken English support',\n      teaches: ['spoken English', 'sentence expansion', 'grammar in use', 'English fluency', 'response confidence'],",
    "      educationalLevel: 'Children’s spoken English support; placement based on current speaking ability and learning fit',\n      teaches: ['spoken English', 'conversational English', 'sentence expansion', 'grammar in use', 'English fluency', 'response confidence'],",
    'course schema detail',
)

text = replace_once(
    text,
    "      title: 'Spoken English Classes for Kids Online | Tiny Steps Learning',\n      description:\n        'Live 1:1 spoken English classes for kids online. Build fuller sentences, English fluency and speaking confidence with 35-minute teacher-led classes and a free assessment.',",
    "      title: seoTitle,\n      description: seoDescription,",
    'runtime metadata',
)

text = replace_once(
    text,
    "      jsonLd: [breadcrumbSchema, courseSchema, faqSchema],",
    "      jsonLd: [breadcrumbSchema, webpageSchema, courseSchema, faqSchema],",
    'jsonld',
)

text = replace_once(
    text,
    "          { label: 'Live 1:1 • 35 minutes', tone: 'neutral' as const },",
    "          { label: `Live 1:1 • ${PUBLIC_SESSION_DURATION_LABEL}`, tone: 'neutral' as const },",
    'trust duration',
)

text = replace_once(
    text,
    "          { label: 'Per class', value: '₹400', helper: 'current approved pricing' },\n          { label: '12 classes', value: '₹4,800', helper: 'pricing preview for parents' },\n          { label: 'Standard class', value: '35 min', helper: 'live teacher-guided session' },",
    "          { label: 'Per class', value: formatINR(PER_CLASS_PRICE), helper: 'current approved pricing' },\n          { label: `${starterPackage.classes} classes`, value: formatINR(starterPackage.monthlyFee), helper: 'pricing preview for parents' },\n          { label: 'Standard class', value: PUBLIC_SESSION_DURATION_LABEL, helper: 'live teacher-guided session' },",
    'hero stats',
)

text = replace_once(
    text,
    "          <div className=\"mt-6 grid gap-4 md:grid-cols-2\">\n            <div className=\"rounded-2xl border border-sky-200 bg-white p-5 text-sm leading-7 text-slate-700\">\n              <strong className=\"text-slate-900\">Choose spoken English</strong> when the main goal is fuller everyday answers, sentence formation, English fluency, and comfortable conversation.\n            </div>\n            <div className=\"rounded-2xl border border-orange-200 bg-white p-5 text-sm leading-7 text-slate-700\">\n              <strong className=\"text-slate-900\">Choose public speaking & communication</strong> for storytelling, presentation, show-and-tell, audience-facing confidence, and broader communication skills.{' '}\n              <Link to=\"/speaking\" className=\"font-semibold underline underline-offset-4\">Explore the Speaking program</Link>.\n            </div>\n          </div>",
    "          <div className=\"mt-6 grid gap-4 md:grid-cols-2\">\n            <div className=\"rounded-2xl border border-sky-200 bg-white p-5 text-sm leading-7 text-slate-700\">\n              <strong className=\"text-slate-900\">Choose spoken English</strong> when the main goal is fuller everyday answers, conversational fluency, sentence expansion, and comfortable English speaking.\n            </div>\n            <div className=\"rounded-2xl border border-orange-200 bg-white p-5 text-sm leading-7 text-slate-700\">\n              <strong className=\"text-slate-900\">Choose public speaking & communication</strong> for storytelling, presentations, show-and-tell, audience awareness, and broader communication skills.{' '}\n              <Link to=\"/speaking\" className=\"font-semibold underline underline-offset-4\">Explore Public Speaking & Communication</Link>.\n            </div>\n          </div>\n          <div className=\"mt-4 grid gap-4 md:grid-cols-2\">\n            <div className=\"rounded-2xl border border-violet-200 bg-white p-5 text-sm leading-7 text-slate-700\">\n              <strong className=\"text-slate-900\">Choose grammar support</strong> when tense, sentence structure, articles, prepositions, punctuation, or correction accuracy is the main gap.{' '}\n              <Link to=\"/grammar\" className=\"font-semibold underline underline-offset-4\">Explore Grammar Classes</Link>.\n            </div>\n            <div className=\"rounded-2xl border border-emerald-200 bg-white p-5 text-sm leading-7 text-slate-700\">\n              <strong className=\"text-slate-900\">Choose confidence-building support</strong> when hesitation or participation confidence is the primary need across situations rather than English fluency alone.{' '}\n              <Link to=\"/confidence-building-program-kids\" className=\"font-semibold underline underline-offset-4\">Explore Confidence Building</Link>.\n            </div>\n          </div>",
    'decision section',
)

text = replace_once(
    text,
    "              <li>2. We identify whether the next step is spoken-English practice, grammar-linked sentence work, or broader public-speaking support.</li>",
    "              <li>2. We identify whether the next step is spoken-English practice, grammar support, broader public-speaking/communication work, or a confidence-building programme.</li>",
    'assessment routing',
)

text = replace_once(
    text,
    "                <p className=\"mt-2 text-3xl font-bold text-slate-900\">₹400</p>",
    "                <p className=\"mt-2 text-3xl font-bold text-slate-900\">{formatINR(PER_CLASS_PRICE)}</p>",
    'price card',
)

text = replace_once(
    text,
    "                <p className=\"mt-2 text-3xl font-bold text-slate-900\">35 min</p>",
    "                <p className=\"mt-2 text-3xl font-bold text-slate-900\">{PUBLIC_SESSION_DURATION_LABEL}</p>",
    'duration card',
)

text = replace_once(
    text,
    "              <p>• One free 35-minute 1:1 assessment before parents decide</p>",
    "              <p>• One free {demoMinutes}-minute 1:1 assessment before parents decide</p>",
    'assessment bullet',
)

text = replace_once(
    text,
    "              If your child gives one-word answers, hesitates in conversation, or needs stronger English fluency, start with one free 35-minute 1:1 assessment.",
    "              If your child gives one-word answers, hesitates in everyday conversation, or needs stronger English fluency, start with one free {demoMinutes}-minute 1:1 assessment.",
    'final CTA',
)

page.write_text(text)

registry = Path('src/lib/routeSeoRegistry.js')
rtext = registry.read_text()
old = """  '/spoken-english-classes-for-kids-online': {
    title: 'Spoken English Classes for Kids Online | Tiny Steps Learning',
    description:
      'Live spoken English classes for kids online. Help children move past one-word answers, build sentence confidence, and speak clearly with grammar-linked support.',
    canonicalPath: '/spoken-english-classes-for-kids-online',
    ogType: 'website',
  },"""
new = """  '/spoken-english-classes-for-kids-online': {
    title: 'Spoken English Classes for Kids Online | Live 1:1 | Tiny Steps',
    description:
      'Live 1:1 spoken English classes for kids in India and worldwide. Build fuller sentences, conversational fluency, grammar in use and speaking confidence in 35-minute classes.',
    canonicalPath: '/spoken-english-classes-for-kids-online',
    ogType: 'website',
    keywords:
      'spoken English classes for kids online,English speaking classes for kids,online spoken English classes for kids,1 to 1 spoken English classes for kids,English fluency classes for kids,conversational English classes for kids,English conversation classes for kids online,online English speaking practice for kids,spoken English classes for NRI kids,online English speaking tutor for kids,online spoken English classes for kids worldwide',
  },"""
if old not in rtext:
    raise SystemExit('Missing expected spoken-English registry block')
registry.write_text(rtext.replace(old, new, 1))
