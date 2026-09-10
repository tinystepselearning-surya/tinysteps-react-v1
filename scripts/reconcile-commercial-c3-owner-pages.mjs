#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const write = (p, s) => fs.writeFileSync(path.join(root, p), s);

function replaceRequired(text, from, to, label) {
  const next = typeof from === 'string' ? text.replace(from, to) : text.replace(from, to);
  if (next === text) throw new Error(`Missing expected source for ${label}`);
  return next;
}

function replaceOptional(text, from, to) {
  return text.replace(from, to);
}

function edit(file, fn) {
  const before = read(file);
  const after = fn(before);
  if (after === before) throw new Error(`No changes produced for ${file}`);
  write(file, after);
  console.log(`updated ${file}`);
}

function routeBlock(route, title, description, extra = '') {
  return `  '${route}': {\n    title: '${title}',\n    description:\n      '${description}',\n    canonicalPath: '${route}',\n    ogType: 'website',${extra ? `\n${extra}` : ''}\n  },`;
}

function replaceRoute(text, route, block) {
  const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return replaceRequired(text, new RegExp(`  '${escaped}': \\{[\\s\\S]*?\\n  \\},`), block, `route SEO ${route}`);
}

// 1) Generic phonics owner: remove comparison-query ownership and clean source facts.
edit('src/pages/phonics.tsx', (s) => {
  s = replaceRequired(s, '"Online Phonics Classes for Kids in India | Tiny Steps"', '"Online Phonics Classes for Kids | Live 1:1 | Tiny Steps"', 'phonics fallback title');
  s = replaceRequired(s, 'const heroTitle = heroTitleOverride ?? "Online Phonics Classes for Kids in India";', 'const heroTitle = heroTitleOverride ?? "Online Phonics Classes for Kids";', 'phonics H1');
  s = replaceRequired(s,
    '"Premium phonics for kids in India through live 1:1 online phonics classes. We guide children from letter sounds to blending and reading, with structured spelling support and parent-visible progress. Start with a free phonics assessment to choose the right level.";',
    '"Premium live 1:1 phonics for kids in India and worldwide. We guide children from letter sounds to blending and reading, with structured spelling support and parent-visible progress. Start with a free phonics assessment to choose the right level.";',
    'phonics international hero');
  for (const term of [
    "  'best online phonics classes',\n",
    "  'best online phonics classes in India',\n",
    "  'best phonics classes for kids',\n",
    "  'best phonics classes in India',\n",
    "  'best phonics course for kids',\n",
    "  'best online phonics course for kids',\n",
    "  'best phonics program for kids',\n",
  ]) s = replaceRequired(s, term, '', `remove phonics comparison keyword ${term.trim()}`);
  s = replaceRequired(s, 'What should parents look for in the best online phonics classes?', 'What should parents look for when choosing online phonics classes?', 'phonics comparison FAQ boundary');
  s = replaceOptional(s,
    'Many children show early blending progress in about 4–6 guided lessons. Timelines vary by starting level, attendance consistency, and home reinforcement. Progress is usually step-by-step rather than instant.',
    'Progress in blending depends on the child’s starting point and should be judged by increasing accuracy, less prompting, retention, and successful blending of fresh appropriately matched words rather than a fixed number of lessons.');
  s = replaceOptional(s,
    'Many children show early blending progress in 4–6 guided lessons, though timing depends on starting level, lesson consistency, and home reinforcement.',
    'Progress in blending depends on the child’s starting point and should be judged by increasing accuracy, less prompting, retention, and successful blending of fresh appropriately matched words rather than a fixed number of lessons.');
  s = replaceOptional(s, "{ value: '4–6', label: 'Lessons to begin first blending, depending on readiness' },", "{ value: 'Fresh-word transfer', label: 'Blending checked on unfamiliar words at the child’s current stage' },");
  s = replaceOptional(s, "{ value: '30–40', label: 'Lessons to cover core phonics foundations' },", "{ value: 'Individual pace', label: 'Foundation coverage depends on starting level, retention, and transfer' },");
  s = replaceOptional(s, 'duration="35–40 minutes, 2–3x per week"', 'duration="35 minutes per 1:1 class"');
  s = replaceOptional(s, 'structure="3 levels, 36+ lessons with stage-based progression"', 'structure="3 levels with stage-based progression"');
  return s;
});

// 2) Phonics fee owner: make canonical facts clean in source, not build transforms.
edit('src/pages/public/PhonicsFeesIndiaPage.tsx', (s) => {
  s = replaceRequired(s,
    'Tiny Steps charges ₹400 per live 1:1 class, or ₹4,800 for 12 classes. Classes are typically 35–40 minutes and placement begins with an assessment-first approach.',
    'Tiny Steps charges ₹400 per live 1:1 class, or ₹4,800 for 12 classes. Standard 1:1 classes are 35 minutes, and placement begins with an assessment-first approach.',
    'phonics fee FAQ duration');
  s = replaceRequired(s, '<div>35–40 min</div>', '<div>35 min</div>', 'phonics fee card duration');
  s = replaceRequired(s, '₹4,800 for 12 classes · 35–40 min · 1 child : 1 teacher', '₹4,800 for 12 classes · 35 min · 1 child : 1 teacher', 'phonics fee summary duration');
  return s;
});

// 3) Broad reading owner: globalize responsibly, add Course schema, and stop claiming fluency-class ownership.
edit('src/pages/public/ReadingClassesForKidsPage.tsx', (s) => {
  s = replaceRequired(s, 'createFAQPageSchema, createWebPageSchema, PUBLIC_FACTS', 'createCourseSchema, createFAQPageSchema, createWebPageSchema, PUBLIC_FACTS', 'reading Course schema import');
  s = replaceRequired(s, "  'reading fluency classes',\n", '', 'reading fluency commercial keyword boundary');
  s = replaceRequired(s, "const seoTitle = 'Reading Classes for Kids in India | Tiny Steps';", "const seoTitle = 'Online Reading Classes for Kids | Live 1:1 | Tiny Steps';", 'reading title');
  s = replaceRequired(s,
    "'Live online reading classes for kids in India. Build word reading, reading fluency, story comprehension, vocabulary and reading aloud confidence. Book one free 35-minute 1:1 demo assessment class.';",
    "'Live 1:1 online reading classes for kids in India and worldwide. Build accurate word reading, fluency, comprehension, vocabulary and reading confidence. Start with one free 35-minute assessment.';",
    'reading description');
  s = replaceRequired(s, 'Online Reading Classes for Kids in India', 'Online Reading Classes for Kids', 'reading H1');
  s = replaceRequired(s,
    'Tiny Steps provides live 1:1 reading support for children who need help with decoding, sentence reading, fluency, comprehension, vocabulary, or reading confidence.',
    'Tiny Steps provides live 1:1 online reading support for families in India and worldwide whose children need help with decoding, sentence reading, fluency, comprehension, vocabulary, or reading confidence.',
    'reading worldwide copy');
  s = replaceOptional(s, 'Live classes are typically ${PUBLIC_SESSION_DURATION_LABEL}.', 'Standard 1:1 live classes are ${PUBLIC_SESSION_DURATION_LABEL}.');
  s = replaceOptional(s, 'Tiny Steps live classes are typically {PUBLIC_SESSION_DURATION_LABEL}. Current standard 1:1 pricing is', 'Tiny Steps standard 1:1 live classes are {PUBLIC_SESSION_DURATION_LABEL}. Current standard 1:1 pricing is');
  s = replaceRequired(s,
    "  {\n    question: 'How long is each Tiny Steps reading class?',\n    answer: `Standard 1:1 live classes are ${PUBLIC_SESSION_DURATION_LABEL}.`,\n  },\n];",
    "  {\n    question: 'How long is each Tiny Steps reading class?',\n    answer: `Standard 1:1 live classes are ${PUBLIC_SESSION_DURATION_LABEL}.`,\n  },\n  {\n    question: 'Can families outside India join Tiny Steps reading classes?',\n    answer:\n      'Yes. Tiny Steps provides live online reading support to families in India and worldwide, subject to compatible teacher and class timings.',\n  },\n];",
    'reading international FAQ');
  s = replaceRequired(s,
    '    const faqSchema = {',
    "    const courseSchema = createCourseSchema({\n      name: 'Online Reading Classes for Kids',\n      description:\n        'Live 1:1 online reading classes for kids focused on accurate word reading, decoding support, fluency, vocabulary, comprehension, and reading confidence.',\n      url: canonicalUrl,\n      educationalLevel: 'School-age reading support',\n      teaches: ['word reading', 'decoding support', 'reading fluency', 'vocabulary', 'reading comprehension', 'reading confidence'],\n      areaServed: ['India', 'Worldwide'],\n    });\n\n    const faqSchema = {",
    'reading Course schema');
  s = replaceRequired(s, 'jsonLd: [breadcrumbSchema, webpageSchema, pathwaySchema, qualityCriteriaSchema, faqSchema],', 'jsonLd: [breadcrumbSchema, webpageSchema, courseSchema, pathwaySchema, qualityCriteriaSchema, faqSchema],', 'reading schema graph');
  return s;
});

// 4) Grammar owner: make source itself worldwide-ready while preserving programme focus.
edit('src/pages/grammar.tsx', (s) => {
  s = s.replaceAll("areaServed: 'India'", "areaServed: ['India', 'Worldwide']");
  s = replaceRequired(s,
    "'Live online grammar classes for kids in India focused on sentence formation, tenses, punctuation, writing clarity, and confident school answers.'",
    "'Live online grammar classes for kids in India and worldwide focused on sentence formation, tenses, punctuation, writing clarity, and confident school answers.'",
    'grammar Course description');
  s = replaceRequired(s, "title: 'Grammar Classes for Kids in India | Tiny Steps',", "title: 'Online Grammar Classes for Kids | Live 1:1 | Tiny Steps',", 'grammar meta title');
  s = replaceRequired(s,
    "'Live online grammar classes for kids in India. Build sentence formation, tenses, punctuation, writing clarity and school-answer confidence. Book one free 35-minute 1:1 online demo assessment class.'",
    "'Live 1:1 online grammar classes for kids in India and worldwide. Build sentence formation, tenses, punctuation, writing clarity and confident school answers. Start with a free 35-minute assessment.'",
    'grammar meta description');
  s = replaceRequired(s, 'Grammar Classes for Kids in India', 'Online Grammar Classes for Kids', 'grammar H1');
  s = replaceRequired(s,
    'Help your child build grammar clarity, sentence formation, writing clarity, and stronger school answers through structured live online grammar classes for kids in India.',
    'Help your child build grammar clarity, sentence formation, writing clarity, and stronger school answers through structured live online grammar classes for families in India and worldwide.',
    'grammar worldwide copy');
  s = replaceRequired(s,
    "  {\n    question: 'How does Tiny Steps show grammar progress to parents?',\n    answer:\n      'Parents receive practical progress visibility: what was practised, common errors, improvement points, and next-step goals across grammar clarity, sentence formation, writing clarity, and school-answer confidence.',\n  },\n];",
    "  {\n    question: 'How does Tiny Steps show grammar progress to parents?',\n    answer:\n      'Parents receive practical progress visibility: what was practised, common errors, improvement points, and next-step goals across grammar clarity, sentence formation, writing clarity, and school-answer confidence.',\n  },\n  {\n    question: 'Can families outside India join Tiny Steps grammar classes?',\n    answer:\n      'Yes. Tiny Steps supports children in India and worldwide through live online grammar classes, subject to compatible class timings.',\n  },\n];",
    'grammar international FAQ');
  s = replaceRequired(s, "['Grammar clarity', 'Sentence formation', 'Parent progress visibility']", "['Grammar clarity', 'Sentence formation', 'Parent progress visibility', 'India and worldwide']", 'grammar trust chips');
  return s;
});

// 5) Speaking owner: explicitly serve both public-speaking and communication intent worldwide.
edit('src/pages/speaking.tsx', (s) => {
  s = s.replaceAll("areaServed: 'India'", "areaServed: ['India', 'Worldwide']");
  s = replaceRequired(s,
    "'Live online public speaking classes for kids in India focused on sentence formation, storytelling, expression, and classroom speaking confidence.'",
    "'Live online public speaking and communication classes for kids in India and worldwide focused on sentence formation, storytelling, expression, and classroom speaking confidence.'",
    'speaking Course description');
  s = replaceRequired(s, "title: 'Public Speaking Classes for Kids in India | Tiny Steps',", "title: 'Public Speaking & Communication Classes for Kids | Tiny Steps',", 'speaking meta title');
  s = replaceRequired(s,
    "'Live online public speaking classes for kids in India. Build sentence formation, storytelling, show-and-tell, clear expression and confidence. Book one free 35-minute 1:1 online demo assessment class.'",
    "'Live 1:1 public speaking and communication classes for kids in India and worldwide. Build storytelling, structured answers, clear expression and presentation confidence. Start with a free assessment.'",
    'speaking meta description');
  s = replaceRequired(s,
    'Tiny Steps offers online public speaking and communication classes for kids who give short answers, hesitate to speak, struggle to explain ideas, or need confidence for school presentations.',
    'Tiny Steps offers live online public speaking and communication classes for kids in India and worldwide who give short answers, hesitate to speak, struggle to explain ideas, or need confidence for school presentations.',
    'speaking worldwide copy');
  s = replaceRequired(s,
    "  {\n    question: 'How does Tiny Steps show speaking progress to parents?',\n    answer:\n      'Parents receive clear progress visibility: what was practised, response quality, confidence growth, improvement areas, and next-step goals in sentence formation, storytelling, clear expression, and presentation confidence.',\n  },\n];",
    "  {\n    question: 'How does Tiny Steps show speaking progress to parents?',\n    answer:\n      'Parents receive clear progress visibility: what was practised, response quality, confidence growth, improvement areas, and next-step goals in sentence formation, storytelling, clear expression, and presentation confidence.',\n  },\n  {\n    question: 'Can families outside India join Tiny Steps public speaking and communication classes?',\n    answer:\n      'Yes. Tiny Steps supports families in India and worldwide through live online classes, subject to compatible teacher and class timings.',\n  },\n  {\n    question: 'How are public speaking and communication classes different from spoken English?',\n    answer:\n      'Spoken English mainly builds everyday sentence fluency and conversational response. The Tiny Steps Speaking programme owns broader communication goals such as structured answers, storytelling, show-and-tell, audience awareness, and presentation confidence.',\n  },\n];",
    'speaking boundary FAQs');
  s = replaceRequired(s, "'Parent progress visibility',\n                    className", "'Parent progress visibility',\n                    className", 'speaking trust chip anchor');
  return s;
});

// 6) Broad English owner: link every distinct C2 programme owner separately and avoid unsupported frequency claims.
edit('src/pages/public/OnlineEnglishClassesForKidsPage.tsx', (s) => {
  s = replaceRequired(s, "{ label: 'Weekly parent updates', tone: 'mint' as const },", "{ label: 'Parent progress visibility', tone: 'mint' as const },", 'broad English progress claim');
  s = replaceRequired(s,
    /const programmeTracks = \[[\s\S]*?\n\];\n\nconst outcomeStages/,
    `const programmeTracks = [\n  { title: 'Phonics', description: 'For children who need blending, decoding, spelling, and structured early-reading support.', href: '/phonics', accent: 'from-[#fff6e9] to-[#ffffff]' },\n  { title: 'Reading', description: 'For children who need broader word reading, fluency, comprehension, vocabulary, or reading-confidence support.', href: '/reading-classes-for-kids', accent: 'from-[#eef8ff] to-[#ffffff]' },\n  { title: 'Grammar', description: 'For sentence structure, tense clarity, punctuation, grammar accuracy, and stronger school answers.', href: '/grammar', accent: 'from-[#f6f4ff] to-[#ffffff]' },\n  { title: 'Writing & creative writing', description: 'For sentence writing, paragraphs, creative expression, school answers, organisation, and editing.', href: '/writing-classes-for-kids', accent: 'from-[#ecfdf5] to-[#ffffff]' },\n  { title: 'Spoken English', description: 'For fuller everyday answers, English fluency, sentence expansion, and comfortable conversation.', href: '/spoken-english-classes-for-kids-online', accent: 'from-[#fff0f3] to-[#ffffff]' },\n  { title: 'Public speaking & communication', description: 'For storytelling, structured answers, show-and-tell, audience-facing confidence, and presentations.', href: '/speaking', accent: 'from-[#eef2ff] to-[#ffffff]' },\n];\n\nconst outcomeStages`,
    'broad English programme chooser');
  s = replaceRequired(s, "title: 'Online English Classes for Kids in India and Worldwide | Tiny Steps',", "title: 'Online English Classes for Kids | India & Worldwide | Tiny Steps',", 'broad English title');
  s = replaceRequired(s,
    "'Live online English classes and 1:1 English tutoring for kids ages 3–12. Phonics, reading, grammar, writing and speaking support for India, NRI and worldwide families.'",
    "'Live 1:1 online English classes and tutoring for kids ages 3–12 across phonics, reading, grammar, writing, spoken English and public speaking. India, NRI and worldwide families.'",
    'broad English description');
  return s;
});

// 7) Hyderabad owner: keep local intent but route every subject need to the correct owner.
edit('src/pages/public/OnlineEnglishClassesHyderabadPage.tsx', (s) => {
  s = replaceRequired(s,
    /const programCards = \[[\s\S]*?\n\];\n\nexport default function/,
    `const programCards = [\n  { title: 'Phonics classes', body: 'For blending, decoding, spelling, and early reading difficulties.', href: '/phonics' },\n  { title: 'Reading classes', body: 'For broader reading accuracy, fluency, comprehension, vocabulary, and reading confidence.', href: '/reading-classes-for-kids' },\n  { title: 'Grammar classes', body: 'For sentence structure, tenses, punctuation, grammar accuracy, and school-answer clarity.', href: '/grammar' },\n  { title: 'Writing classes', body: 'For sentence writing, paragraphs, creative writing, school responses, organisation, and editing.', href: '/writing-classes-for-kids' },\n  { title: 'Spoken English classes', body: 'For fuller everyday answers, sentence expansion, English fluency, and comfortable conversation.', href: '/spoken-english-classes-for-kids-online' },\n  { title: 'Public speaking & communication', body: 'For storytelling, structured answers, show-and-tell, clear expression, and presentation confidence.', href: '/speaking' },\n];\n\nexport default function`,
    'Hyderabad programme chooser');
  s = replaceRequired(s,
    'The right course depends on the child’s current level. Children with reading difficulty may need phonics or reading support, while children with sentence mistakes may need grammar. Children who are shy or give short answers may benefit from public speaking practice.',
    'The right course depends on the child’s current level. Tiny Steps routes children to the relevant phonics, reading, grammar, writing, spoken English, or public speaking and communication pathway after assessment.',
    'Hyderabad FAQ programme routing');
  return s;
});

// 8) Pricing owner: remove unverified package-benefit claims and link every commercial programme owner.
edit('src/pages/PricingPage.tsx', (s) => {
  s = replaceRequired(s,
    "      'Stage-based insight recap',\n      'WhatsApp nudges for practice',",
    "      'Structured curriculum path',\n      'Parent progress visibility',",
    'starter verified benefits');
  s = replaceRequired(s,
    "      'Everything in Starter',\n      'Monthly mastery review with mentor',\n      'Recorded class access + worksheets',\n      'Parent Q&A call every month',",
    "      'Everything in Starter',\n      '16 live classes per month',\n      'Structured curriculum path',\n      'Parent progress visibility',",
    'growth verified benefits');
  s = replaceRequired(s,
    "      'Daily AI reading/speaking coach prompts',\n      'Capstone showcase video production',\n      'Priority scheduling & reschedules',\n      'Optional Saturday masterclass',",
    "      '24 live classes per month',\n      'Higher-frequency teacher-led practice',\n      'Structured curriculum path',\n      'Parent progress visibility',",
    'intensive verified benefits');
  s = replaceRequired(s, 'Transparent Pricing for Premium 1:1 English Classes', 'Online English Class Fees & Pricing', 'pricing H1');
  s = replaceRequired(s,
    'Compare learning pathways before choosing a plan: <Link to="/courses" className="font-semibold underline">all courses</Link>, <Link to="/phonics" className="font-semibold underline">phonics</Link>, <Link to="/grammar" className="font-semibold underline">grammar</Link>, and <Link to="/speaking" className="font-semibold underline">public speaking</Link>.',
    'Compare the exact learning pathway before choosing a plan: <Link to="/phonics" className="font-semibold underline">phonics</Link>, <Link to="/reading-classes-for-kids" className="font-semibold underline">reading</Link>, <Link to="/grammar" className="font-semibold underline">grammar</Link>, <Link to="/writing-classes-for-kids" className="font-semibold underline">writing</Link>, <Link to="/spoken-english-classes-for-kids-online" className="font-semibold underline">spoken English</Link>, or <Link to="/speaking" className="font-semibold underline">public speaking & communication</Link>.',
    'pricing programme links');
  s = replaceRequired(s,
    '<li>Choose the course path: Phonics, Grammar, Reading, or Public Speaking.</li>',
    '<li>Choose the correct path: Phonics, Reading, Grammar, Writing, Spoken English, or Public Speaking & Communication.</li>',
    'pricing decision list');
  return s;
});

// 9) Demo owner: cover writing explicitly and describe global service/audience in schema.
edit('src/pages/public/BookDemoPage.tsx', (s) => {
  s = s.replaceAll('phonics, reading, grammar or speaking-confidence', 'phonics, reading, grammar, writing or speaking-confidence');
  s = s.replaceAll('phonics, reading, grammar or speaking confidence', 'phonics, reading, grammar, writing or speaking confidence');
  s = s.replaceAll('phonics, reading, grammar, sentence formation, pronunciation or speaking skills', 'phonics, reading, grammar, writing, sentence formation, pronunciation or speaking skills');
  s = replaceRequired(s,
    "  duration: `PT${FREE_DEMO_DURATION_MINUTES}M`,\n  offers: {",
    "  duration: `PT${FREE_DEMO_DURATION_MINUTES}M`,\n  areaServed: ['India', 'Worldwide'],\n  audience: { '@type': 'Audience', audienceType: 'Children ages 3–12' },\n  offers: {",
    'demo Service area/audience');
  return s;
});

// 10) Align build-time/prerender SEO with runtime SEO for all 14 unique owners.
edit('src/lib/routeSeoRegistry.js', (s) => {
  const blocks = [
    ['/phonics', 'Online Phonics Classes for Kids | Live 1:1 | Tiny Steps', 'Live 1:1 online phonics classes for kids in India and worldwide. Build blending, decoding, spelling and reading fluency through structured assessment-first phonics teaching.', "    keywords:\n      'online phonics classes,online phonics classes for kids,online phonics classes for kids in India,phonics classes for kids,phonics classes in India,live 1:1 phonics classes,1 to 1 phonics classes online,personalised phonics classes for kids,structured phonics classes for kids,synthetic phonics classes,phonics classes for struggling readers,phonics tutor online for kids,online reading and phonics classes',"],
    ['/best-online-phonics-classes-for-kids-in-india', 'Best Online Phonics Classes for Kids in India | Tiny Steps Learning', 'Compare the best online phonics classes for kids in India by child fit, 1:1 vs group format, curriculum, teacher correction, transfer evidence, phonics class cost, fees, and progress visibility.'],
    ['/phonics-fees-india', 'Phonics Class Fees in India 2026 | 1:1 & Group Price Guide', 'Compare 2026 phonics class fees in India for live 1:1 and group classes, package costs, quality checks, assessment questions and parent red flags.'],
    ['/reading-classes-for-kids', 'Online Reading Classes for Kids | Live 1:1 | Tiny Steps', 'Live 1:1 online reading classes for kids in India and worldwide. Build accurate word reading, fluency, comprehension, vocabulary and reading confidence. Start with one free 35-minute assessment.'],
    ['/reading-fluency-program', 'Reading Fluency Classes for Kids Online | Tiny Steps Learning', 'Live 1:1 reading fluency classes for kids online. Build smoother connected reading, phrasing, accuracy, expression and comprehension after decoding is stable.'],
    ['/grammar', 'Online Grammar Classes for Kids | Live 1:1 | Tiny Steps', 'Live 1:1 online grammar classes for kids in India and worldwide. Build sentence formation, tenses, punctuation, writing clarity and confident school answers. Start with a free 35-minute assessment.'],
    ['/writing-classes-for-kids', 'Creative Writing Classes for Kids Online | Tiny Steps Learning', 'Live online writing classes for kids covering creative writing, sentence formation, paragraph writing, school answers and editing with personalised 1:1 feedback.'],
    ['/spoken-english-classes-for-kids-online', 'Spoken English Classes for Kids Online | Tiny Steps Learning', 'Live 1:1 spoken English classes for kids online. Build fuller sentences, English fluency and speaking confidence with 35-minute teacher-led classes and a free assessment.'],
    ['/speaking', 'Public Speaking & Communication Classes for Kids | Tiny Steps', 'Live 1:1 public speaking and communication classes for kids in India and worldwide. Build storytelling, structured answers, clear expression and presentation confidence. Start with a free assessment.'],
    ['/confidence-building-program-kids', 'Confidence Building Classes for Kids Online | Tiny Steps', 'Live confidence-building classes for kids who hesitate, give short answers or need clearer expression. 1:1 online support, 35-minute classes and a free assessment.'],
    ['/online-english-classes-for-kids', 'Online English Classes for Kids | India & Worldwide | Tiny Steps', 'Live 1:1 online English classes and tutoring for kids ages 3–12 across phonics, reading, grammar, writing, spoken English and public speaking. India, NRI and worldwide families.'],
    ['/online-english-classes-hyderabad', 'Online English Classes for Kids in Hyderabad | Tiny Steps Learning', 'Live online English classes for kids in Hyderabad covering phonics, reading, grammar, sentence formation, and communication confidence. Book one free 35-minute 1:1 online demo assessment class.'],
    ['/pricing', 'Online English Class Fees & Pricing | Tiny Steps Learning', 'Standard 1:1 classes cost ₹400 per 35-minute class and small groups cost ₹180–₹300 per child per class. Compare packages and start with one free 35-minute 1:1 demo assessment.'],
    ['/book-demo', 'Book a Free 35-Minute Demo Assessment Class | Tiny Steps Learning', 'Book a free 1:1 online English assessment for your child. Understand their level in phonics, reading, grammar, writing, sentence formation, and speaking confidence.'],
  ];
  for (const [route, title, description, extra = ''] of blocks) s = replaceRoute(s, route, routeBlock(route, title, description, extra));
  return s;
});

// 11) Remove C3 owner-page corrections from Vite now that source is canonical.
edit('vite.config.js', (s) => {
  const patterns = [
    /\n      if \(id\.includes\('\/src\/pages\/public\/OnlineEnglishClassesForKidsPage\.tsx'\)\) \{[\s\S]*?\n      \}/,
    /\n      \/\/ C3: grammar and speaking already serve international families;[\s\S]*?\n      \}/,
    /\n      if \(id\.includes\('\/src\/pages\/public\/PhonicsFeesIndiaPage\.tsx'\)\) \{[\s\S]*?\n      \}/,
    /\n      if \(id\.includes\('\/src\/pages\/public\/ReadingClassesForKidsPage\.tsx'\)\) \{[\s\S]*?\n      \}/,
    /\n      if \(id\.includes\('\/src\/pages\/phonics\.tsx'\)\) \{[\s\S]*?\n      \}/,
  ];
  for (const pattern of patterns) s = replaceRequired(s, pattern, '', `remove owner-page Vite transform ${pattern}`);
  return s;
});

// 12) Evolve the C3 registry to the reconciled r4 state.
edit('src/lib/commercialC3OwnerPageAudit.ts', (s) => {
  s = replaceRequired(s, "COMMERCIAL_C3_REVISION = '2026-09-10-c3-r3'", "COMMERCIAL_C3_REVISION = '2026-09-11-c3-r4'", 'C3 revision');
  for (const [cluster, action] of [
    ['phonics-provider','REPAIR'], ['reading-provider','STRENGTHEN'], ['grammar-provider','STRENGTHEN'],
    ['public-speaking-provider','STRENGTHEN'], ['communication-provider','STRENGTHEN'],
    ['broad-english-hyderabad','STRENGTHEN'], ['general-pricing','REPAIR'], ['free-demo-booking','STRENGTHEN'],
  ]) {
    const re = new RegExp(`(clusterId:'${cluster}'[^\\n]*?action:)'(?:PROTECT|STRENGTHEN|REPAIR)'`);
    s = replaceRequired(s, re, `$1'${action}'`, `C3 action ${cluster}`);
  }
  return s;
});

// 13) Replace Vite-specific tests with source-of-truth reconciliation assertions.
edit('src/tests/seo/commercialC3OwnerPageAudit.spec.ts', (s) => {
  s = replaceRequired(s,
    /  it\('normalizes Tiny Steps phonics-fee duration[\s\S]*?\n  \}\);/,
    `  it('stores canonical owner facts directly in source instead of relying on Vite transforms', () => {\n    const fees = read('src/pages/public/PhonicsFeesIndiaPage.tsx');\n    const vite = read('vite.config.js');\n    expect(fees).toContain('Standard 1:1 classes are 35 minutes');\n    expect(fees).toContain('<div>35 min</div>');\n    expect(fees).not.toContain('35–40 min');\n    expect(vite).not.toContain("id.includes('/src/pages/public/PhonicsFeesIndiaPage.tsx')");\n    expect(vite).not.toContain("id.includes('/src/pages/grammar.tsx') || id.includes('/src/pages/speaking.tsx')");\n    expect(vite).not.toContain("id.includes('/src/pages/phonics.tsx')");\n  });`,
    'C3 source-of-truth test');
  s = replaceRequired(s,
    /  it\('protects high-performing owner canonicals instead of creating alternates'[\s\S]*?\n  \}\);/,
    `  it('preserves every canonical owner while allowing evidence-led strengthening', () => {\n    const expected = ['/phonics','/best-online-phonics-classes-for-kids-in-india','/phonics-fees-india','/reading-classes-for-kids','/reading-fluency-program','/grammar','/writing-classes-for-kids','/spoken-english-classes-for-kids-online','/speaking','/confidence-building-program-kids','/online-english-classes-for-kids','/online-english-classes-hyderabad','/pricing','/book-demo'];\n    expect(new Set(COMMERCIAL_C3_OWNER_PAGE_AUDITS.map((entry) => entry.ownerPath))).toEqual(new Set(expected));\n  });`,
    'C3 canonical preservation test');
  s = replaceRequired(s,
    "    expect(source).not.toContain('Ages 9 to 13');",
    "    expect(source).not.toContain('Ages 9 to 13');\n    expect(source).toContain(\"href: '/writing-classes-for-kids'\");\n    expect(source).toContain(\"href: '/spoken-english-classes-for-kids-online'\");",
    'broad English owner-link tests');
  return s;
});

// 14) Strengthen the audit so it catches the exact reconciliation problems from pass two.
edit('scripts/audit-commercial-c3-owner-pages.mjs', (s) => {
  s = replaceRequired(s,
    /if \(exists\('vite\.config\.js'\)\) \{[\s\S]*?\n\}/,
    `if (exists('vite.config.js')) {\n  const vite = read('vite.config.js');\n  for (const ownerTransform of [\n    "/src/pages/phonics.tsx",\n    "/src/pages/grammar.tsx",\n    "/src/pages/speaking.tsx",\n    "/src/pages/public/PhonicsFeesIndiaPage.tsx",\n    "/src/pages/public/ReadingClassesForKidsPage.tsx",\n  ]) {\n    if (vite.includes(\`id.includes('\\${ownerTransform}')\`)) failures.push(\`C3 owner still depends on Vite transform: \\${ownerTransform}\`);\n  }\n}\n\nif (exists('src/pages/public/PhonicsFeesIndiaPage.tsx')) {\n  const fees = read('src/pages/public/PhonicsFeesIndiaPage.tsx');\n  if (fees.includes('35–40 min') || fees.includes('typically 35–40 minutes')) failures.push('phonics fee owner still contains stale standard 1:1 duration');\n  if (!fees.includes('Standard 1:1 classes are 35 minutes')) failures.push('phonics fee owner missing canonical 35-minute source fact');\n}\n\nif (exists('src/pages/phonics.tsx')) {\n  const phonics = read('src/pages/phonics.tsx');\n  const keywordBlock = phonics.match(/const PHONICS_SEO_KEYWORDS = \\[([\\s\\S]*?)\\n\\];/)?.[1] || '';\n  if (/best online phonics classes|best phonics classes|best phonics course|best phonics program/i.test(keywordBlock)) failures.push('/phonics still claims comparison keywords owned by the dedicated comparison page');\n}\n\nif (exists('src/pages/public/ReadingClassesForKidsPage.tsx')) {\n  const reading = read('src/pages/public/ReadingClassesForKidsPage.tsx');\n  if (!reading.includes('createCourseSchema')) failures.push('reading owner missing Course schema');\n  if (!reading.includes("areaServed: ['India', 'Worldwide']")) failures.push('reading owner missing worldwide Course coverage');\n  const keywordBlock = reading.match(/const READING_SEO_KEYWORDS = \\[([\\s\\S]*?)\\n\\];/)?.[1] || '';\n  if (keywordBlock.includes("'reading fluency classes'")) failures.push('reading owner still claims specialist fluency-class keyword');\n}\n\nfor (const file of ['src/pages/grammar.tsx','src/pages/speaking.tsx']) {\n  if (!exists(file)) continue;\n  const content = read(file);\n  if (content.includes("areaServed: 'India'")) failures.push(\`\\${file} still contains India-only structured-data areaServed\`);\n  if (!content.includes("areaServed: ['India', 'Worldwide']")) failures.push(\`\\${file} missing direct worldwide structured-data coverage\`);\n}\n\nif (exists('src/pages/public/OnlineEnglishClassesForKidsPage.tsx')) {\n  const broad = read('src/pages/public/OnlineEnglishClassesForKidsPage.tsx');\n  for (const ownerLink of ['/phonics','/reading-classes-for-kids','/grammar','/writing-classes-for-kids','/spoken-english-classes-for-kids-online','/speaking']) {\n    if (!broad.includes(\`href: '\\${ownerLink}'\`)) failures.push(\`broad English programme chooser missing \\${ownerLink}\`);\n  }\n  if (broad.includes('Weekly parent updates')) failures.push('broad English owner contains unsupported weekly-update frequency claim');\n}\n\nif (exists('src/pages/PricingPage.tsx')) {\n  const pricing = read('src/pages/PricingPage.tsx');\n  for (const unsupported of ['Recorded class access + worksheets','Parent Q&A call every month','Daily AI reading/speaking coach prompts','Capstone showcase video production','Optional Saturday masterclass']) {\n    if (pricing.includes(unsupported)) failures.push(\`pricing owner still contains unverified benefit claim: \\${unsupported}\`);\n  }\n  for (const ownerLink of ['/phonics','/reading-classes-for-kids','/grammar','/writing-classes-for-kids','/spoken-english-classes-for-kids-online','/speaking']) {\n    if (!pricing.includes(ownerLink)) failures.push(\`pricing owner missing programme link \\${ownerLink}\`);\n  }\n}\n\nif (exists('src/pages/public/BookDemoPage.tsx')) {\n  const demo = read('src/pages/public/BookDemoPage.tsx');\n  if (!demo.includes('grammar, writing')) failures.push('book-demo owner does not explicitly assess/route writing');\n  if (!demo.includes("areaServed: ['India', 'Worldwide']")) failures.push('book-demo Service schema missing worldwide coverage');\n  if (!demo.includes("audienceType: 'Children ages 3–12'")) failures.push('book-demo Service schema missing canonical audience');\n}`,
    'C3 reconciliation audit block');
  return s;
});

console.log('C3 owner-page reconciliation prepared successfully.');
