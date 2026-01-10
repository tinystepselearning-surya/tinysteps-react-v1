// src/content/parentsMeta.ts
export type ParentMeta = {
  title: string;
  description: string;
  canonicalPath: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
};

export const parentsMeta: Record<string, ParentMeta> = {
  '/parents': {
    title: 'Parents Help Hub — Tiny Steps',
    description: 'Practical guides for parents: choosing courses, scheduling, payments, and helping kids learn to read.',
    canonicalPath: '/parents',
    ogTitle: 'Parents Help Hub — Tiny Steps',
    ogDescription: 'Practical guides for parents on courses, scheduling and reading at home.',
  },
  '/parents/getting-started': {
    title: 'Getting Started with Phonics at Home | Tiny Steps Parents',
    description:
      "Start phonics the right way: letter sounds, blending, daily routines, and what to avoid—built for busy parents of ages 3–7.",
    canonicalPath: '/parents/getting-started',
    ogTitle: 'Getting Started with Phonics at Home',
    ogDescription: 'Start phonics the right way: letter sounds, blending and simple daily routines for ages 3–7.',
  },
  '/parents/choosing-course': {
    title: 'Choosing the Right Course for Your Child | Tiny Steps Parents',
    description: 'How to pick the right Tiny Steps course based on age, reading level and learning goals.',
    canonicalPath: '/parents/choosing-course',
  },
  '/parents/scheduling': {
    title: 'Scheduling & Attendance Tips for Busy Families | Tiny Steps Parents',
    description: 'Simple scheduling tips to keep progress steady: short routines, consistent days, and make-up options.',
    canonicalPath: '/parents/scheduling',
  },
  '/parents/payments': {
    title: 'Payments & Plans — Tiny Steps Parents',
    description: 'Overview of payment plans, trials, refunds and FAQs about Tiny Steps billing.',
    canonicalPath: '/parents/payments',
  },
  '/parents/tracking-progress': {
    title: 'Tracking Your Child’s Progress | Tiny Steps Parents',
    description: 'How we measure progress, what to expect and simple ways parents can track improvement at home.',
    canonicalPath: '/parents/tracking-progress',
  },
  '/parents/helping-with-homework': {
    title: 'Helping with Homework: 10 Practical Tips | Tiny Steps Parents',
    description: 'Short, effective ways parents can support phonics practice and reading at home.',
    canonicalPath: '/parents/helping-with-homework',
  },
  '/parents/phonics-mission': {
    title: 'Phonics Mission: Building Letter-Sound Confidence | Tiny Steps Parents',
    description: 'Activities and games to build letter-sound knowledge and blending confidence at home.',
    canonicalPath: '/parents/phonics-mission',
  },
  '/parents/reading-at-home': {
    title: 'Reading At Home: Daily Routines | Tiny Steps Parents',
    description: 'Quick, daily reading routines and book-selection tips to build a reading habit with your child.',
    canonicalPath: '/parents/reading-at-home',
  },
  '/parents/speech-confidence': {
    title: 'Building Speech Confidence in Young Readers | Tiny Steps Parents',
    description: 'Ways to encourage clear speaking, listening activities and small practice exercises.',
    canonicalPath: '/parents/speech-confidence',
  },
  '/parents/common-mistakes': {
    title: 'Common Reading Mistakes & How to Avoid Them | Tiny Steps Parents',
    description: 'What to watch for, common pitfalls, and how parents can keep progress on track.',
    canonicalPath: '/parents/common-mistakes',
  },
};

export default parentsMeta;
