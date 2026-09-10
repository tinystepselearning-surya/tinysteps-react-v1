from pathlib import Path
import re


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise SystemExit(f'Missing expected pattern: {label}')
    return text.replace(old, new, 1)


def sub_once(text: str, pattern: str, replacement: str, label: str) -> str:
    updated, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
    if count != 1:
        raise SystemExit(f'Missing or ambiguous pattern: {label} ({count})')
    return updated

page = Path('src/pages/speaking.tsx')
text = page.read_text()

text = replace_once(
    text,
    "import ClusterSeoNav from '../components/programs/ClusterSeoNav';\nimport TestimonialSnippets from '../components/common/TestimonialSnippets';\nimport { applySeo } from '../lib/seo';\nimport { createCourseSchema, createFAQPageSchema, PUBLIC_FACTS } from '../lib/schemas';",
    "import ClusterSeoNav from '../components/programs/ClusterSeoNav';\nimport TestimonialSnippets from '../components/common/TestimonialSnippets';\nimport { PUBLIC_SESSION_DURATION_LABEL, PUBLIC_SITE_FACTS } from '../config/publicFacts';\nimport { SEMANTIC_FACTS } from '../config/semanticFacts';\nimport { applySeo } from '../lib/seo';\nimport { createCourseSchema, createFAQPageSchema, createWebPageSchema, PUBLIC_FACTS } from '../lib/schemas';",
    'imports',
)

constants = """const speakingFacts = SEMANTIC_FACTS.programmes.speaking;
const demoMinutes = PUBLIC_SITE_FACTS.standardOffer.demoDurationMinutes;
const seoTitle = 'Public Speaking & Communication Classes for Kids | Tiny Steps';
const seoDescription =
  'Live 1:1 public speaking and communication classes for kids in India and worldwide. Build structured answers, storytelling, presentations and communication confidence in 35-minute classes.';

const SPEAKING_SEO_KEYWORDS = [
  'public speaking classes for kids online',
  'public speaking classes for kids',
  'communication skills classes for kids online',
  'communication classes for kids',
  '1 to 1 public speaking classes for kids',
  'online public speaking classes for kids India',
  'public speaking classes for kids in India',
  'online communication classes for kids',
  'storytelling classes for kids online',
  'presentation skills classes for kids',
  'show and tell practice for kids',
  'public speaking classes for kids worldwide',
];

"""
text = text.replace("const faqItems = [", constants + "const faqItems = [", 1)

new_faq = """const faqItems = [
  {
    question: 'What do public speaking and communication classes for kids teach?',
    answer:
      'Tiny Steps focuses on structured answers, storytelling, show-and-tell, presentation skills, audience awareness, clear expression, listening, idea organisation, and communication confidence through guided live speaking practice.',
  },
  {
    question: 'What is the difference between spoken English and public speaking classes?',
    answer:
      'Spoken English focuses mainly on everyday conversation, fuller sentences, response fluency, and comfortable English speaking. Public speaking and communication classes add structured answers, storytelling, presentations, show-and-tell, audience awareness, and school communication. Children whose main need is conversational fluency should use the dedicated Spoken English programme.',
  },
  {
    question: 'Are communication-skills classes included in the Tiny Steps Speaking programme?',
    answer:
      'Yes. General communication-skills work such as organising ideas, answering clearly, listening and responding, storytelling, classroom participation, and presentation confidence is part of the Tiny Steps Speaking & Communication pathway.',
  },
  {
    question: 'When is the confidence-building programme a better fit?',
    answer:
      'If the primary difficulty is hesitation, participation confidence, or speaking comfort across situations rather than public-speaking structure or communication skills, the dedicated Confidence Building programme may be the better starting point. The free assessment helps separate these needs.',
  },
  {
    question: 'What ages are the Tiny Steps Public Speaking levels for?',
    answer:
      `Basic Public Speaking is designed for ${speakingFacts.levels.beginner.ageRange.label} and has ${speakingFacts.levels.beginner.lessonCount} lessons. Advanced Public Speaking is designed for ${speakingFacts.levels.advanced.ageRange.label} and has ${speakingFacts.levels.advanced.lessonCount} lessons. The ranges overlap at age 7, so placement also considers speaking readiness and current skill level.`,
  },
  {
    question: 'Are Tiny Steps public speaking classes live and 1:1?',
    answer:
      `Yes. Standard Tiny Steps 1:1 classes are live online and run for ${PUBLIC_SESSION_DURATION_LABEL}. Small-group options may also be available for selected schedules or programme fits.`,
  },
  {
    question: 'Can families outside India join public speaking classes?',
    answer:
      'Yes. Tiny Steps supports families in India and worldwide, including NRI families and families in the UAE, United States, United Kingdom, Australia, Singapore, and other locations, subject to compatible teacher timings and learning fit.',
  },
  {
    question: 'How can parents see speaking progress?',
    answer:
      'Compare fresh speaking tasks over time. Look for longer and clearer responses, better idea organisation, stronger storytelling or presentation structure, less prompting, more confident delivery, and the ability to transfer the same skill to a new speaking task.',
  },
];"""
text = sub_once(text, r"const faqItems = \[.*?\n\];\n\nconst speakingPathwayCards =", new_faq + "\n\nconst speakingPathwayCards =", 'FAQ array')

new_pathway = """const speakingPathwayCards = [
  {
    name: 'Ideas and listening',
    description: 'Build attention, idea recall, listening, and guided response readiness before speaking.',
  },
  {
    name: 'Complete spoken responses',
    description: 'Help children expand short answers into complete, relevant responses for the task.',
  },
  {
    name: 'Structured answers',
    description: 'Organise ideas clearly so answers have a beginning, useful detail, and a clear ending.',
  },
  {
    name: 'Storytelling',
    description: 'Develop sequencing, relevant detail, expressive delivery, and a natural story flow.',
  },
  {
    name: 'Clear communication',
    description: 'Improve vocabulary choice, explanation clarity, listening-and-response skills, and purposeful delivery.',
  },
  {
    name: 'Presentation confidence',
    description: 'Build readiness for show-and-tell, classroom discussions, presentations, and audience-facing speaking.',
  },
];"""
text = sub_once(text, r"const speakingPathwayCards = \[.*?\n\];\n\nconst speakingPyramidLevels =", new_pathway + "\n\nconst speakingPyramidLevels =", 'pathway cards')

text = replace_once(
    text,
    "    const pathwayItemListSchema = {\n      '@context': 'https://schema.org',\n      '@type': 'ItemList',\n      name: 'Tiny Steps speaking pathway',\n      url: canonicalUrl,\n      numberOfItems: speakingPathwayCards.length,\n      itemListOrder: 'https://schema.org/ItemListOrderAscending',\n      itemListElement: speakingPathwayCards.map((card, index) => ({\n        '@type': 'ListItem',\n        position: index + 1,\n        url: card.url,\n        item: {\n          '@type': 'Course',\n          name: card.name,\n          description: card.description,\n          areaServed: 'India',\n        },\n      })),\n    };",
    "    const webpageSchema = {\n      ...createWebPageSchema({\n        name: 'Public Speaking & Communication Classes for Kids',\n        description: seoDescription,\n        url: canonicalUrl,\n      }),\n      '@id': `${canonicalUrl}#webpage`,\n    };\n\n    const pathwayItemListSchema = {\n      '@context': 'https://schema.org',\n      '@type': 'ItemList',\n      name: 'Tiny Steps speaking and communication pathway',\n      url: canonicalUrl,\n      numberOfItems: speakingPathwayCards.length,\n      itemListOrder: 'https://schema.org/ItemListOrderAscending',\n      itemListElement: speakingPathwayCards.map((card, index) => ({\n        '@type': 'ListItem',\n        position: index + 1,\n        item: {\n          '@type': 'Thing',\n          name: card.name,\n          description: card.description,\n        },\n      })),\n    };",
    'pathway schema',
)

text = replace_once(
    text,
    "    const courseSchema = createCourseSchema({\n      name: 'Public Speaking Classes for Kids',\n      description:\n        'Live online public speaking classes for kids in India focused on sentence formation, storytelling, expression, and classroom speaking confidence.',\n      url: canonicalUrl,\n      educationalLevel: 'Primary and middle-school speaking support',\n      teaches: ['spoken English confidence', 'sentence expansion', 'storytelling', 'show and tell', 'presentation confidence'],\n      areaServed: 'India',\n    });",
    "    const courseSchema = createCourseSchema({\n      name: 'Public Speaking & Communication Classes for Kids',\n      description:\n        'Live 1:1 online public speaking and communication classes for kids focused on structured answers, storytelling, show-and-tell, presentations, clear expression, and communication confidence.',\n      url: canonicalUrl,\n      educationalLevel: `${speakingFacts.levels.beginner.label}: ${speakingFacts.levels.beginner.ageRange.label}; ${speakingFacts.levels.advanced.label}: ${speakingFacts.levels.advanced.ageRange.label}; assessment-first placement`,\n      teaches: ['public speaking', 'communication skills', 'structured answers', 'storytelling', 'show and tell', 'presentation skills', 'audience awareness', 'clear expression'],\n      areaServed: ['India', 'Worldwide'],\n    });",
    'course schema',
)

text = replace_once(
    text,
    "    applySeo({\n      title: 'Public Speaking Classes for Kids in India | Tiny Steps',\n      description:\n        'Live online public speaking classes for kids in India. Build sentence formation, storytelling, show-and-tell, clear expression and confidence. Book one free 35-minute 1:1 online demo assessment class.',\n      canonicalPath,\n      robots: 'index,follow',\n      ogType: 'website',\n      jsonLd: [breadcrumbSchema, courseSchema, pathwayItemListSchema, faqSchema],\n    });",
    "    applySeo({\n      title: seoTitle,\n      description: seoDescription,\n      canonicalPath,\n      robots: 'index,follow',\n      ogType: 'website',\n      keywords: SPEAKING_SEO_KEYWORDS,\n      jsonLd: [breadcrumbSchema, webpageSchema, courseSchema, pathwayItemListSchema, faqSchema],\n    });",
    'runtime SEO',
)

text = replace_once(
    text,
    "                Tiny Steps offers online public speaking and communication classes for kids who give short answers, hesitate to speak, struggle to explain ideas, or need confidence for school presentations. Children start with a free speaking assessment, then move into Basic or Advanced Public Speaking based on age and confidence level.",
    "                Tiny Steps offers live online public speaking and communication classes for kids who need stronger structured answers, storytelling, show-and-tell, presentations, classroom participation, or clearer communication. Children start with a free speaking assessment, then move into Basic or Advanced Public Speaking based on age, speaking readiness, and current skill level.",
    'hero primary paragraph',
)

text = replace_once(
    text,
    "                Tiny Steps follows an assessment-first speaking path to understand whether your child needs sentence expansion, speaking comfort, storytelling support, reading aloud confidence, or clear expression coaching. Ready to move forward? <Link to=\"/book-demo\" className=\"font-semibold text-slate-900 underline underline-offset-2 hover:text-sky-700\">book one free 35-minute 1:1 online demo assessment class</Link>.",
    "                Standard live 1:1 classes are {PUBLIC_SESSION_DURATION_LABEL}. The assessment checks response structure, storytelling, presentation readiness, communication clarity, and speaking confidence before a learning path is recommended. Ready to move forward? <Link to=\"/book-demo\" className=\"font-semibold text-slate-900 underline underline-offset-2 hover:text-sky-700\">book one free {demoMinutes}-minute 1:1 online demo assessment class</Link>.",
    'hero assessment paragraph',
)

text = replace_once(
    text,
    "                  Book Free 35-Minute Demo",
    "                  Book Free {demoMinutes}-Minute Demo",
    'hero CTA label',
)

text = replace_once(
    text,
    "                <p className=\"mt-3 text-sm text-slate-600 md:text-[15px]\">Takes 20-30 seconds • No commitment</p>",
    "                <p className=\"mt-3 text-sm text-slate-600 md:text-[15px]\">Free {demoMinutes}-minute 1:1 online assessment before enrolment</p>",
    'unsupported microclaim',
)

text = replace_once(
    text,
    "              <p className=\"mt-4 max-w-[660px] text-sm leading-7 text-slate-700\">\n                Parents looking specifically for hesitant speakers can also review <Link to=\"/spoken-english-classes-for-kids-online\" className=\"font-semibold text-slate-900 underline underline-offset-4 hover:text-sky-700\">spoken English classes for kids online</Link> and connect it with <Link to=\"/grammar\" className=\"font-semibold text-slate-900 underline underline-offset-4 hover:text-sky-700\">grammar</Link> for fuller sentence answers.\n              </p>",
    "              <p className=\"mt-4 max-w-[660px] text-sm leading-7 text-slate-700\">\n                If the main goal is everyday conversational fluency rather than presentations or communication structure, use <Link to=\"/spoken-english-classes-for-kids-online\" className=\"font-semibold text-slate-900 underline underline-offset-4 hover:text-sky-700\">Spoken English Classes for Kids</Link>. If confidence itself is the primary difficulty across situations, review the <Link to=\"/confidence-building-program-kids\" className=\"font-semibold text-slate-900 underline underline-offset-4 hover:text-sky-700\">Confidence Building Programme</Link>.\n              </p>",
    'hero owner handoff',
)

# Replace the old misrouted "Find your child's speaking gap" section with an owner-choice section.
text = sub_once(
    text,
    r"      <section className=\"px-4 pb-8 pt-8 sm:px-5 md:pb-12 md:pt-12 lg:px-6 lg:pb-14 lg:pt-14\">\n        <div className=\"mx-auto max-w-6xl\">\n          <h2 className=\"mb-6 text-2xl font-bold text-slate-900 sm:text-3xl\">Find your child&apos;s speaking gap</h2>.*?      </section>\n\n      <section className=\"px-4 pb-8 sm:px-5 md:pb-12 lg:px-6\">",
    """      <section className=\"px-4 pb-8 pt-8 sm:px-5 md:pb-12 md:pt-12 lg:px-6 lg:pb-14 lg:pt-14\">\n        <div className=\"mx-auto max-w-6xl\">\n          <h2 className=\"mb-3 text-2xl font-bold text-slate-900 sm:text-3xl\">Which speaking programme does your child need?</h2>\n          <p className=\"max-w-4xl text-base leading-7 text-slate-700\">The right page depends on the child&apos;s main goal. These programme boundaries keep public speaking, everyday English fluency, grammar accuracy, and specialist confidence support clear.</p>\n          <div className=\"mt-6 grid gap-5 md:grid-cols-2\">\n            <article className=\"rounded-2xl border border-sky-200 bg-sky-50/70 p-5 shadow-sm\">\n              <h3 className=\"text-lg font-bold text-slate-950\">Public speaking & general communication</h3>\n              <p className=\"mt-2 text-sm leading-6 text-slate-700\">Choose this page for structured answers, storytelling, show-and-tell, classroom participation, presentations, audience awareness, and general communication skills.</p>\n            </article>\n            <article className=\"rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm\">\n              <h3 className=\"text-lg font-bold text-slate-950\">Everyday spoken English & conversational fluency</h3>\n              <p className=\"mt-2 text-sm leading-6 text-slate-700\">Choose Spoken English when the main goal is fuller everyday answers, sentence expansion, comfortable conversation, and English fluency.</p>\n              <Link to=\"/spoken-english-classes-for-kids-online\" className=\"mt-3 inline-block text-sm font-semibold underline underline-offset-2\">Explore Spoken English Classes</Link>\n            </article>\n            <article className=\"rounded-2xl border border-violet-200 bg-violet-50/70 p-5 shadow-sm\">\n              <h3 className=\"text-lg font-bold text-slate-950\">Grammar accuracy</h3>\n              <p className=\"mt-2 text-sm leading-6 text-slate-700\">Choose Grammar when tense control, sentence structure, punctuation, articles, prepositions, or correction accuracy is the primary difficulty.</p>\n              <Link to=\"/grammar\" className=\"mt-3 inline-block text-sm font-semibold underline underline-offset-2\">Explore Grammar Classes</Link>\n            </article>\n            <article className=\"rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm\">\n              <h3 className=\"text-lg font-bold text-slate-950\">Specialist confidence-building support</h3>\n              <p className=\"mt-2 text-sm leading-6 text-slate-700\">Choose the specialist programme when hesitation, participation confidence, or speaking comfort across situations is the main need rather than communication structure alone.</p>\n              <Link to=\"/confidence-building-program-kids\" className=\"mt-3 inline-block text-sm font-semibold underline underline-offset-2\">Explore Confidence Building</Link>\n            </article>\n          </div>\n        </div>\n      </section>\n\n      <section className=\"px-4 pb-8 sm:px-5 md:pb-12 lg:px-6\">""",
    'programme decision section',
)

text = replace_once(
    text,
    "          <h2 className=\"text-2xl font-bold text-slate-900 sm:text-3xl\">Online public speaking classes for kids across India</h2>\n          <p className=\"mt-3 text-base leading-7 text-slate-700\">\n            Tiny Steps supports children across India through live online public speaking and communication confidence classes. Parents from Hyderabad, Bangalore, Chennai, Mumbai, Delhi, Pune, Kolkata, and other locations can <Link to=\"/book-demo\" className=\"font-semibold text-slate-900 underline underline-offset-2\">book one free 35-minute 1:1 online demo assessment class</Link> and receive a level-based speaking confidence path.\n          </p>\n          <p className=\"mt-3 text-sm leading-6 text-slate-700\">\n            For younger learners building early reading base, you can also review <Link to=\"/phonics\" className=\"font-semibold text-slate-900 underline underline-offset-2\">online phonics classes for kids</Link>.\n          </p>",
    "          <h2 className=\"text-2xl font-bold text-slate-900 sm:text-3xl\">Online public speaking and communication classes in India and worldwide</h2>\n          <p className=\"mt-3 text-base leading-7 text-slate-700\">\n            Tiny Steps uses one canonical live online Speaking & Communication programme for families in India and internationally. NRI families and families in the UAE, United States, United Kingdom, Australia, Singapore, and other locations can <Link to=\"/book-demo\" className=\"font-semibold text-slate-900 underline underline-offset-2\">book one free {demoMinutes}-minute 1:1 online demo assessment class</Link>; compatible teacher timings and learning fit are confirmed before enrolment.\n          </p>\n          <p className=\"mt-3 text-sm leading-6 text-slate-700\">\n            We do not create separate country-specific speaking programmes. International public-speaking and communication searches resolve to this same curriculum and assessment path.\n          </p>",
    'international section',
)

text = replace_once(
    text,
    "                <Link to={card.href} className=\"mt-4 inline-block text-sm font-semibold text-slate-900 underline underline-offset-2\">\n                  {card.anchor}\n                </Link>",
    "                <p className=\"mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-sky-700\">Part of the Tiny Steps Speaking & Communication pathway</p>",
    'pathway card links',
)

age_section = """      <section className=\"bg-[#fff6ec] px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14\">
        <div className=\"mx-auto max-w-6xl\">
          <h2 className=\"mb-3 text-2xl font-bold text-slate-900 sm:text-3xl\">Tiny Steps Public Speaking levels</h2>
          <p className=\"max-w-4xl text-base leading-7 text-slate-700\">Tiny Steps has two speaking levels. Their age ranges overlap deliberately, so age is a guide and assessment helps decide the better starting point.</p>
          <div className=\"mt-6 grid gap-4 md:gap-5 md:grid-cols-3\">
            <article className=\"flex h-full flex-col rounded-2xl border border-amber-100 bg-gradient-to-br from-white to-amber-50/70 p-5 shadow-sm md:rounded-3xl md:p-6\">
              <span className=\"inline-flex w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-800\">{speakingFacts.levels.beginner.ageRange.label}</span>
              <h3 className=\"mt-3 text-lg font-bold text-slate-950\">{speakingFacts.levels.beginner.label}</h3>
              <p className=\"mt-2 text-sm text-slate-700\">{speakingFacts.levels.beginner.lessonCount} lessons covering early structured responses, picture talk, show-and-tell, storytelling foundations, clear expression, and speaking comfort.</p>
            </article>

            <article className=\"flex h-full flex-col rounded-2xl border border-sky-100 bg-gradient-to-br from-white to-sky-50/70 p-5 shadow-sm md:rounded-3xl md:p-6\">
              <span className=\"inline-flex w-fit rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-800\">{speakingFacts.levels.advanced.ageRange.label}</span>
              <h3 className=\"mt-3 text-lg font-bold text-slate-950\">{speakingFacts.levels.advanced.label}</h3>
              <p className=\"mt-2 text-sm text-slate-700\">{speakingFacts.levels.advanced.lessonCount} lessons building more organised answers, storytelling, opinion sharing, presentations, audience awareness, discussion confidence, and clearer communication.</p>
            </article>

            <article className=\"flex h-full flex-col rounded-2xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/70 p-5 shadow-sm md:rounded-3xl md:p-6\">
              <span className=\"inline-flex w-fit rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-800\">Assessment-led placement</span>
              <h3 className=\"mt-3 text-lg font-bold text-slate-950\">Age 7 sits in both ranges</h3>
              <p className=\"mt-2 text-sm text-slate-700\">Placement considers current response length, organisation, storytelling, presentation readiness, confidence, and how much prompting the child needs—not age alone.</p>
              <Link to=\"/book-demo\" className=\"mt-4 inline-block text-sm font-semibold underline underline-offset-2\">Book the free speaking assessment</Link>
            </article>
          </div>
        </div>
      </section>"""
text = sub_once(
    text,
    r"      <section className=\"bg\[#fff6ec\] px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14\">.*?      </section>\n\n      <section className=\"px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14\">\n        <div className=\"mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:rounded-\[30px\] md:p-8\">\n          <h2 className=\"mb-4 text-2xl font-bold text-slate-900 sm:text-3xl\">What happens in the free speaking assessment\?</h2>",
    age_section + "\n\n      <section className=\"px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14\">\n        <div className=\"mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:rounded-[30px] md:p-8\">\n          <h2 className=\"mb-4 text-2xl font-bold text-slate-900 sm:text-3xl\">What happens in the free speaking assessment?</h2>",
    'age outcomes section',
)

text = replace_once(
    text,
    "                During the assessment, we may check how your child answers questions, forms sentences, explains ideas, tells a short story, reads aloud, responds to prompts, and speaks with confidence. Based on this, Tiny Steps recommends the right confidence-building path.",
    "                During the assessment, we may check how your child answers questions, organises ideas, tells a short story, responds to prompts, handles show-and-tell or presentation-style tasks, and speaks with confidence. Based on this, Tiny Steps recommends the right speaking, communication, spoken-English, grammar, or specialist confidence path.",
    'assessment description',
)

# Remove the earlier duplicate FAQ block; keep the id="faq" section later.
text = sub_once(
    text,
    r"      <section className=\"bg\[#fffaf3\] px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14\">\n        <div className=\"mx-auto max-w-6xl rounded-2xl border border-\[#F1D8A8\] bg-white/95 p-5 shadow-sm md:rounded-3xl md:p-7\">\n          <h2 className=\"text-2xl font-bold text-slate-900 sm:text-3xl\">Speaking questions parents ask</h2>.*?      </section>\n\n",
    '',
    'duplicate FAQ section',
)

text = replace_once(
    text,
    "            Book one free 35-minute 1:1 online demo assessment class and let Tiny Steps identify whether your child needs sentence expansion, structured answers, storytelling, reading aloud confidence, presentation skills, or communication confidence support first.",
    "            Book one free {demoMinutes}-minute 1:1 online demo assessment class and let Tiny Steps identify whether the best next step is public speaking and communication, everyday spoken English, grammar support, or specialist confidence-building support.",
    'final CTA description',
)

text = replace_once(
    text,
    "              Book Free 35-Minute Demo",
    "              Book Free {demoMinutes}-Minute Demo",
    'final CTA label',
)

old_links = """          <div className=\"mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-slate-200\">
            <Link to=\"/reading-classes-for-kids\" className=\"font-semibold underline underline-offset-2 hover:text-white\">reading classes for kids</Link>
            <span className=\"hidden sm:inline text-slate-400\">•</span>
            <Link to=\"/grammar\" className=\"font-semibold underline underline-offset-2 hover:text-white\">grammar and sentence formation support</Link>
            <span className=\"hidden sm:inline text-slate-400\">•</span>
            <Link to=\"/pricing\" className=\"font-semibold underline underline-offset-2 hover:text-white\">class pricing</Link>
          </div>
          <div className=\"mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-slate-300\">
            <Link to=\"/online-english-classes-for-kids\" className=\"underline underline-offset-2 hover:text-white\">online English classes for kids</Link>
            <span className=\"hidden sm:inline text-slate-500\">•</span>
            <Link to=\"/phonics\" className=\"underline underline-offset-2 hover:text-white\">online phonics classes for kids</Link>
            <span className=\"hidden sm:inline text-slate-500\">•</span>
            <Link to=\"/class-samples\" className=\"underline underline-offset-2 hover:text-white\">real class samples</Link>
          </div>"""
new_links = """          <div className=\"mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-slate-200\">
            <Link to=\"/spoken-english-classes-for-kids-online\" className=\"font-semibold underline underline-offset-2 hover:text-white\">spoken English classes</Link>
            <span className=\"hidden sm:inline text-slate-400\">•</span>
            <Link to=\"/confidence-building-program-kids\" className=\"font-semibold underline underline-offset-2 hover:text-white\">confidence-building programme</Link>
            <span className=\"hidden sm:inline text-slate-400\">•</span>
            <Link to=\"/pricing\" className=\"font-semibold underline underline-offset-2 hover:text-white\">class pricing</Link>
            <span className=\"hidden sm:inline text-slate-400\">•</span>
            <Link to=\"/resources/speaking\" className=\"font-semibold underline underline-offset-2 hover:text-white\">speaking & communication resources</Link>
          </div>"""
text = replace_once(text, old_links, new_links, 'final owner links')

page.write_text(text)

registry = Path('src/lib/routeSeoRegistry.js')
rtext = registry.read_text()
old_registry = """  '/speaking': {
    title: 'Public Speaking Classes for Kids in India | Tiny Steps',
    description:
      'Live online public speaking classes for kids in India. Build sentence formation, storytelling, show-and-tell, clear expression and confidence. Book one free 35-minute 1:1 demo assessment class.',
    canonicalPath: '/speaking',
    ogType: 'website',
  },"""
new_registry = """  '/speaking': {
    title: 'Public Speaking & Communication Classes for Kids | Tiny Steps',
    description:
      'Live 1:1 public speaking and communication classes for kids in India and worldwide. Build structured answers, storytelling, presentations and communication confidence in 35-minute classes.',
    canonicalPath: '/speaking',
    ogType: 'website',
    keywords:
      'public speaking classes for kids online,public speaking classes for kids,communication skills classes for kids online,communication classes for kids,1 to 1 public speaking classes for kids,online public speaking classes for kids India,public speaking classes for kids in India,online communication classes for kids,storytelling classes for kids online,presentation skills classes for kids,show and tell practice for kids,public speaking classes for kids worldwide',
  },"""
if old_registry not in rtext:
    raise SystemExit('Missing expected /speaking registry block')
registry.write_text(rtext.replace(old_registry, new_registry, 1))

vite = Path('vite.config.js')
vtext = vite.read_text()
old_vite = """      // C3: speaking still has a source-level geography migration pending its
      // dedicated owner-page pass. Grammar now carries canonical geography directly.
      if (id.includes('/src/pages/speaking.tsx')) {
        transformed = transformed.replace(\"areaServed: 'India'\", \"areaServed: ['India', 'Worldwide']\");
      }

"""
if old_vite not in vtext:
    raise SystemExit('Missing expected speaking Vite migration')
vite.write_text(vtext.replace(old_vite, '', 1))
