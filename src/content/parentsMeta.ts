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
    title: 'Parents Hub: Course Choice, Reading Support, and Progress Guides | Tiny Steps',
    description: 'Practical parent guides for choosing the right Tiny Steps course, scheduling classes, tracking progress, and helping children read with more confidence.',
    canonicalPath: '/parents',
    ogTitle: 'Parents Help Hub — Tiny Steps',
    ogDescription: 'Practical guides for parents on courses, scheduling and reading at home.',
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Parents Help Hub — Tiny Steps",
      "description": "Practical guides for parents: choosing courses, scheduling, payments, and helping kids learn to read.",
      "inLanguage": "en-IN",
      "hasPart": [
        { "@type": "WebPage", "name": "Getting started with Phonics at Home", "url": "https://tinystepslearning.com/parents/getting-started" },
        { "@type": "WebPage", "name": "How to choose a course", "url": "https://tinystepslearning.com/parents/choosing-course" },
        { "@type": "WebPage", "name": "Scheduling & Attendance", "url": "https://tinystepslearning.com/parents/scheduling" },
        { "@type": "WebPage", "name": "Payments & invoices", "url": "https://tinystepslearning.com/parents/payments" },
        { "@type": "WebPage", "name": "Track your child's progress", "url": "https://tinystepslearning.com/parents/tracking-progress" },
        { "@type": "WebPage", "name": "Helping with homework", "url": "https://tinystepslearning.com/parents/helping-with-homework" },
        { "@type": "WebPage", "name": "Phonics mission — quick daily practice", "url": "https://tinystepslearning.com/parents/phonics-mission" },
        { "@type": "WebPage", "name": "Reading at home — simple routines", "url": "https://tinystepslearning.com/parents/reading-at-home" },
        { "@type": "WebPage", "name": "Phonics for Parents — deep research guide", "url": "https://tinystepslearning.com/blog/phonics-for-parents-guide" },
        { "@type": "WebPage", "name": "Building speaking confidence", "url": "https://tinystepslearning.com/parents/speech-confidence" },
        { "@type": "WebPage", "name": "Common mistakes parents make", "url": "https://tinystepslearning.com/parents/common-mistakes" }
      ]
    }
  },
  '/parents/getting-started': {
    title: 'Getting Started with Phonics at Home | Tiny Steps Parents',
    description:
      "Start phonics the right way: letter sounds, blending, daily routines, and what to avoid—built for busy parents of ages 3–7.",
    canonicalPath: '/parents/getting-started',
    ogTitle: 'Getting Started with Phonics at Home',
    ogDescription: 'Start phonics the right way: letter sounds, blending and simple daily routines for ages 3–7.',
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": "Getting started with Tiny Steps",
      "description": "Start with one free assessment class. Book a 35‑minute trial so we can recommend the right level.",
      "inLanguage": "en-IN",
      "step": [
        { "@type": "HowToStep", "text": "Book a free assessment via the Courses page." },
        { "@type": "HowToStep", "text": "Attend the 35‑minute assessment with your child." },
        { "@type": "HowToStep", "text": "Receive a recommended course and curriculum link." }
      ]
    }
  },
  '/parents/choosing-course': {
    title: 'How to Choose the Right Tiny Steps Course for Your Child',
    description: 'Parent decision guide to choose phonics, grammar, reading, or speaking support based on your child’s real learning gap, not guesswork.',
    canonicalPath: '/parents/choosing-course',
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": "How to choose a course",
      "description": "Pick the course that matches your child's current need: phonics, grammar or speaking.",
      "inLanguage": "en-IN",
      "step": [
        { "@type": "HowToStep", "text": "Complete a free assessment." },
        { "@type": "HowToStep", "text": "Choose phonics for foundational reading; grammar for writing; speaking for confidence." },
        { "@type": "HowToStep", "text": "Discuss schedule and teacher preferences." }
      ]
    }
  },
  '/parents/scheduling': {
    title: 'Scheduling Online Classes for Kids: Parent Planning Guide | Tiny Steps',
    description: 'Simple parent guidance for choosing class timings, keeping attendance steady, and building routines that protect progress between lessons.',
    canonicalPath: '/parents/scheduling',
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": "Scheduling & attendance",
      "description": "Consistent attendance matters—aim for at least one class per week and short daily practice.",
      "inLanguage": "en-IN",
      "step": [
        { "@type": "HowToStep", "text": "Choose a consistent class slot during booking." },
        { "@type": "HowToStep", "text": "Set a short pre-class routine: 2–3 minutes to warm up." },
        { "@type": "HowToStep", "text": "Inform support early for rescheduling." }
      ]
    }
  },
  '/parents/payments': {
    title: 'Payments & Plans — Tiny Steps Parents',
    description: 'Overview of payment plans, trials, refunds and FAQs about Tiny Steps billing.',
    canonicalPath: '/parents/payments',
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": "Payments & invoices",
      "description": "Secure payments and clear invoices—check your parent dashboard for receipts.",
      "inLanguage": "en-IN",
      "step": [
        { "@type": "HowToStep", "text": "Go to your Parent payments dashboard." },
        { "@type": "HowToStep", "text": "Download invoices or set up scheduled payments." },
        { "@type": "HowToStep", "text": "Contact support for payment plans." }
      ]
    }
  },
  '/parents/tracking-progress': {
    title: 'How Parents Can Track English Learning Progress | Tiny Steps',
    description: 'Learn what progress in phonics, grammar, reading, and speaking should look like, and how parents can track improvement without pressure.',
    canonicalPath: '/parents/tracking-progress',
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": "Track your child's progress",
      "description": "We send stage-based updates and milestone reports. Use the parent dashboard for details.",
      "inLanguage": "en-IN",
      "step": [
        { "@type": "HowToStep", "text": "Open the parent dashboard to view session notes and goals." },
        { "@type": "HowToStep", "text": "Ask for a short milestone summary after 8–12 lessons." },
        { "@type": "HowToStep", "text": "Use small lesson targets at home to reinforce learning." }
      ]
    }
  },
  '/parents/helping-with-homework': {
    title: 'Helping with Homework: 10 Practical Tips | Tiny Steps Parents',
    description: 'Short, effective ways parents can support phonics practice and reading at home.',
    canonicalPath: '/parents/helping-with-homework',
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": "Helping with homework",
      "description": "Keep practice short and playful: 5–10 minutes of focused work after class is most effective.",
      "inLanguage": "en-IN",
      "step": [
        { "@type": "HowToStep", "text": "Review the teacher's short goal for the lesson." },
        { "@type": "HowToStep", "text": "Do a 5‑minute practice together using prompts from the lesson." },
        { "@type": "HowToStep", "text": "Praise effort and note one target for next time." }
      ]
    }
  },
  '/parents/phonics-mission': {
    title: 'Phonics Mission for Parents: 7-Day Daily Practice Plan | Tiny Steps',
    description: 'Research-backed phonics routine for ages 3-10: a 7-day starter plan, 10-minute daily decoding practice, blending examples, and parent scripts for multilingual homes.',
    canonicalPath: '/parents/phonics-mission',
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": "Phonics mission for parents",
      "description": "A research-backed 7-day phonics starter plan with a 5-10 minute daily routine for sound-letter links, blending, and short reading.",
      "inLanguage": "en-IN",
      "step": [
        { "@type": "HowToStep", "text": "Choose one target sound or short word pattern and review it briefly." },
        { "@type": "HowToStep", "text": "Match the sound to the written letter and practise blending." },
        { "@type": "HowToStep", "text": "Read one short decodable word or sentence and close with praise." }
      ]
    }
  },
  '/parents/reading-at-home': {
    title: 'Reading at Home: Science-Backed Daily Routines | Tiny Steps Parents',
    description: 'Science-backed 10-minute reading routines, stage-based text selection, and parent scripts to improve decoding, fluency, and comprehension.',
    canonicalPath: '/parents/reading-at-home',
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": "Reading at home — simple routines",
      "description": "Use a 10-minute routine with decodable text, repeated reading, and quick comprehension checks.",
      "inLanguage": "en-IN",
      "step": [
        { "@type": "HowToStep", "text": "Choose a short decodable book or paragraph." },
        { "@type": "HowToStep", "text": "Read aloud together; pause to discuss two quick questions." },
        { "@type": "HowToStep", "text": "Celebrate one thing they did well." }
      ]
    }
  },
  '/parents/speech-confidence': {
    title: 'Building Speech Confidence in Young Readers | Tiny Steps Parents',
    description: 'Ways to encourage clear speaking, listening activities and small practice exercises.',
    canonicalPath: '/parents/speech-confidence',
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": "Building speaking confidence",
      "description": "Short, regular speaking tasks build confidence: 1–2 minute daily prompts work best.",
      "inLanguage": "en-IN",
      "step": [
        { "@type": "HowToStep", "text": "Give a 60‑second prompt (favourite animal, weekend plan)." },
        { "@type": "HowToStep", "text": "Model a short answer, then have your child repeat." },
        { "@type": "HowToStep", "text": "Offer gentle praise and one tip for next time." }
      ]
    }
  },
  '/parents/common-mistakes': {
    title: 'Common Parent Mistakes That Slow Reading Progress | Tiny Steps',
    description: 'Learn the common parent mistakes that slow phonics, reading, grammar, and speaking progress, plus practical replacements that keep learning calm and steady.',
    canonicalPath: '/parents/common-mistakes',
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": "Common mistakes parents make",
      "description": "Parents often push too fast or compare progress—focus on steady, small wins.",
      "inLanguage": "en-IN",
      "step": [
        { "@type": "HowToStep", "text": "Set one small lesson target with the teacher." },
        { "@type": "HowToStep", "text": "Create a 5‑minute daily routine to support that target." },
        { "@type": "HowToStep", "text": "Review progress every two weeks and adjust goals." }
      ]
    }
  },
};

export default parentsMeta;
