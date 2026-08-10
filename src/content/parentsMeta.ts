// src/content/parentsMeta.ts
export type ParentMeta = {
  title: string;
  description: string;
  canonicalPath: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  jsonLd?: object | object[];
};

export const parentsMeta: Record<string, ParentMeta> = {
  '/parents': {
    title: 'Parents Hub: Course Choice, Reading Support and Progress Guides | Tiny Steps',
    description:
      'Practical parent guides for choosing the right English learning path, supporting reading at home, building speaking confidence, and tracking real progress.',
    canonicalPath: '/parents',
    ogTitle: 'Parents Help Hub — Tiny Steps',
    ogDescription: 'Practical guides for course choice, home routines, speaking confidence, and visible learning progress.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Parents Help Hub — Tiny Steps',
      description: 'Practical guides for parents choosing and supporting phonics, reading, grammar, writing, and speaking pathways.',
      inLanguage: 'en-IN',
      hasPart: [
        { '@type': 'WebPage', name: 'Getting started with Tiny Steps', url: 'https://tinystepslearning.com/parents/getting-started' },
        { '@type': 'WebPage', name: 'How to choose the right course', url: 'https://tinystepslearning.com/parents/choosing-course' },
        { '@type': 'WebPage', name: 'Scheduling and attendance', url: 'https://tinystepslearning.com/parents/scheduling' },
        { '@type': 'WebPage', name: 'Payments and invoices', url: 'https://tinystepslearning.com/parents/payments' },
        { '@type': 'WebPage', name: 'Track your child’s progress', url: 'https://tinystepslearning.com/parents/tracking-progress' },
        { '@type': 'WebPage', name: 'Helping with homework', url: 'https://tinystepslearning.com/parents/helping-with-homework' },
        { '@type': 'WebPage', name: 'Phonics mission — daily practice plan', url: 'https://tinystepslearning.com/parents/phonics-mission' },
        { '@type': 'WebPage', name: 'Reading at home — daily routine', url: 'https://tinystepslearning.com/parents/reading-at-home' },
        { '@type': 'WebPage', name: 'Phonics for Parents — deep guide', url: 'https://tinystepslearning.com/blog/phonics-for-parents-guide' },
        { '@type': 'WebPage', name: 'Building speaking confidence', url: 'https://tinystepslearning.com/parents/speech-confidence' },
        { '@type': 'WebPage', name: 'Common learning mistakes parents make', url: 'https://tinystepslearning.com/parents/common-mistakes' },
      ],
    },
  },
  '/parents/getting-started': {
    title: 'Getting Started with Tiny Steps: Free Assessment and First Steps | Parents',
    description:
      'See exactly how Tiny Steps starts: a free 35-minute 1:1 assessment, level recommendation, course match, preparation checklist, and first-week parent plan.',
    canonicalPath: '/parents/getting-started',
    ogTitle: 'Getting Started with Tiny Steps Learning',
    ogDescription: 'A parent guide to the free assessment, placement recommendation, preparation checklist, and first week.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'How to get started with Tiny Steps Learning',
      description: 'Start with one free 35-minute 1:1 online demo assessment class, review the recommended level, and begin with one clear learning priority.',
      inLanguage: 'en-IN',
      step: [
        { '@type': 'HowToStep', text: 'Book one free 35-minute 1:1 online demo assessment class.' },
        { '@type': 'HowToStep', text: 'Attend the live assessment so the teacher can check the skills relevant to your child’s age and current level.' },
        { '@type': 'HowToStep', text: 'Review the recommended course, current learning priority, and home-practice guidance.' },
        { '@type': 'HowToStep', text: 'Begin the selected pathway and keep the first home target simple and consistent.' },
      ],
    },
  },
  '/parents/choosing-course': {
    title: 'How to Choose the Right English Course for Your Child | Tiny Steps',
    description:
      'Parent decision guide to choose phonics, reading, grammar, writing, or speaking support based on your child’s real learning gap rather than age alone.',
    canonicalPath: '/parents/choosing-course',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'How to choose the right English learning path for your child',
      description: 'Identify the strongest current learning gap, compare the matching pathway, and use an assessment when placement is unclear.',
      inLanguage: 'en-IN',
      step: [
        { '@type': 'HowToStep', text: 'Identify whether the main gap is decoding, reading fluency, grammar and writing, or speaking confidence.' },
        { '@type': 'HowToStep', text: 'Compare the pathway that directly targets that first gap.' },
        { '@type': 'HowToStep', text: 'Use a live assessment before enrolling when the starting level is uncertain.' },
      ],
    },
  },
  '/parents/scheduling': {
    title: 'Scheduling Online Classes for Kids: Parent Planning Guide | Tiny Steps',
    description: 'Simple parent guidance for choosing class timings, keeping attendance steady, and building routines that protect progress between lessons.',
    canonicalPath: '/parents/scheduling',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'How to schedule online English classes consistently',
      description: 'Choose a realistic recurring class slot, prepare before the lesson, and communicate early when a schedule change is needed.',
      inLanguage: 'en-IN',
      step: [
        { '@type': 'HowToStep', text: 'Choose a recurring class slot that fits the child’s normal energy and family routine.' },
        { '@type': 'HowToStep', text: 'Use a short pre-class routine and keep the device ready before class begins.' },
        { '@type': 'HowToStep', text: 'Inform support early when rescheduling is needed so learning continuity can be protected.' },
      ],
    },
  },
  '/parents/payments': {
    title: 'Payments and Invoices | Tiny Steps Parents',
    description: 'Parent guide to Tiny Steps payment plans, invoices, receipts, pauses, and billing support.',
    canonicalPath: '/parents/payments',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Tiny Steps payments and invoices guide',
      description: 'Parent information about payments, receipts, billing support, and plan administration.',
      inLanguage: 'en-IN',
    },
  },
  '/parents/tracking-progress': {
    title: 'How to Track Your Child’s English Learning Progress | Tiny Steps',
    description:
      'Track phonics, reading, grammar, writing, and speaking progress with baselines, independent evidence, transfer checks, and useful questions for teachers.',
    canonicalPath: '/parents/tracking-progress',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'How to track your child’s English learning progress',
      description: 'Use a baseline, one clear target, observable evidence, transfer checks, and a next-step review instead of relying only on attendance or marks.',
      inLanguage: 'en-IN',
      step: [
        { '@type': 'HowToStep', text: 'Record what the child can do independently at the starting point.' },
        { '@type': 'HowToStep', text: 'Track one or two current learning targets rather than a broad goal such as improve English.' },
        { '@type': 'HowToStep', text: 'Collect comparable reading, writing, speaking, or teacher-feedback evidence.' },
        { '@type': 'HowToStep', text: 'Review what is secure, where prompting is still needed, and what should be taught next.' },
      ],
    },
  },
  '/parents/helping-with-homework': {
    title: 'Helping with English Homework: Practical Parent Tips | Tiny Steps',
    description: 'Short, practical ways parents can support English homework and practice without giving the answers or turning learning into conflict.',
    canonicalPath: '/parents/helping-with-homework',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'How to help with English homework without taking over',
      description: 'Use the teacher’s target, keep practice short, prompt instead of answering, and close with one clear next step.',
      inLanguage: 'en-IN',
      step: [
        { '@type': 'HowToStep', text: 'Review the teacher’s current learning target.' },
        { '@type': 'HowToStep', text: 'Use a short practice task and prompt the child to attempt it independently.' },
        { '@type': 'HowToStep', text: 'Praise the strategy used and note one target for the next practice.' },
      ],
    },
  },
  '/parents/phonics-mission': {
    title: 'Phonics Mission for Parents: 7-Day Daily Practice Plan | Tiny Steps',
    description: 'A practical 7-day phonics starter plan with short daily sound-letter, blending, decoding, and reading activities for children learning at home.',
    canonicalPath: '/parents/phonics-mission',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'Phonics mission for parents',
      description: 'A 7-day phonics starter plan with short daily practice for sound-letter links, blending, and early reading.',
      inLanguage: 'en-IN',
      step: [
        { '@type': 'HowToStep', text: 'Choose one taught sound or short word pattern and review it briefly.' },
        { '@type': 'HowToStep', text: 'Match the sound to the written letter and practise blending.' },
        { '@type': 'HowToStep', text: 'Read one short decodable word or sentence and finish with specific praise.' },
      ],
    },
  },
  '/parents/reading-at-home': {
    title: 'Reading at Home: 10-Minute Daily Routine for Kids | Tiny Steps Parents',
    description: 'A practical 10-minute home reading routine with decodable text, repeated reading, comprehension questions, troubleshooting, and parent scripts.',
    canonicalPath: '/parents/reading-at-home',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'How to build a 10-minute reading routine at home',
      description: 'Use a short warm-up, guided reading, a quick meaning check, and one fluency re-read at a level your child can handle.',
      inLanguage: 'en-IN',
      step: [
        { '@type': 'HowToStep', text: 'Warm up with a few familiar words or sound patterns.' },
        { '@type': 'HowToStep', text: 'Read a short level-appropriate or decodable passage with limited prompting.' },
        { '@type': 'HowToStep', text: 'Ask one or two quick questions to check meaning.' },
        { '@type': 'HowToStep', text: 'Re-read a short section for smoother, more confident reading.' },
      ],
    },
  },
  '/parents/speech-confidence': {
    title: 'How to Build Speaking Confidence in Children Without Pressure | Tiny Steps',
    description: 'Practical parent routines, sentence starters, confidence markers, troubleshooting, and low-pressure speaking practice for shy or hesitant children.',
    canonicalPath: '/parents/speech-confidence',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'How to build speaking confidence at home',
      description: 'Use familiar prompts, thinking time, light modelling, one follow-up question, and specific praise to build independent speaking gradually.',
      inLanguage: 'en-IN',
      step: [
        { '@type': 'HowToStep', text: 'Choose one familiar, low-pressure speaking prompt.' },
        { '@type': 'HowToStep', text: 'Give the child thinking time before supplying words.' },
        { '@type': 'HowToStep', text: 'Model only the sentence starter or first idea when help is needed.' },
        { '@type': 'HowToStep', text: 'Ask one follow-up question to extend the response.' },
        { '@type': 'HowToStep', text: 'Close with specific praise for the speaking behaviour you want repeated.' },
      ],
    },
  },
  '/parents/common-mistakes': {
    title: 'Common Parent Mistakes That Slow English Learning Progress | Tiny Steps',
    description: 'Avoid common mistakes that can slow phonics, reading, grammar, writing, and speaking progress, with practical replacements for calmer home support.',
    canonicalPath: '/parents/common-mistakes',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'How to replace common learning mistakes with useful parent support',
      description: 'Focus on one target, use short consistent practice, avoid comparison, and review the same child’s progress over time.',
      inLanguage: 'en-IN',
      step: [
        { '@type': 'HowToStep', text: 'Set one small current learning target with the teacher.' },
        { '@type': 'HowToStep', text: 'Use a short daily routine that supports that target without adding random new content.' },
        { '@type': 'HowToStep', text: 'Review the child’s own evidence over time and adjust the target when it becomes secure.' },
      ],
    },
  },
};

export default parentsMeta;
