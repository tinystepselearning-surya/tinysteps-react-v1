import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { BLOG_TITLE_OPTIMIZATIONS } from '../../lib/blogTitleOptimization.js';
import { LEGACY_WEEK_BLOG_RENAMES } from '../../lib/blogWeekRenames.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));
const repoRoot = process.cwd();

const LOCKED_WEEK_TITLES_BY_PUBLIC_SLUG: Readonly<Record<string, string>> = Object.freeze({
  'phonics-satpin-launch': 'SATPIN at Home: A Parent Launch Plan for Early Blending and Reading',
  'phonics-blending-club': 'Blending Practice for Kids at Home: A Simple Daily Routine',
  'phonics-tricky-words': 'How to Teach Tricky Words to Kids Without Encouraging Guessing',
  'phonics-long-vowels': 'Long Vowel Practice for Kids: Simple Activities for Common Patterns',
  'phonics-r-controlled': 'R-Controlled Vowel Practice for Kids: ar, er, ir, or and ur',
  'phonics-comprehension': 'From Decoding to Comprehension: How to Help Kids Understand What They Read',
  'phonics-summer-plan': 'Summer Phonics Practice for Kids: A 10-Minute Daily Routine',
  'phonics-multisyllabic': 'How to Help Kids Read Multisyllabic Words: Simple Chunking Practice',
  'phonics-diagnostics': 'Phonics Assessment Checklist for Parents Before a New School Term',
  'grammar-nouns-to-paragraphs': 'Grammar Basics for Kids: From Nouns to Paragraphs — A Parent Roadmap',
  'grammar-tenses': 'English Tenses for Kids: Simple Present, Past and Future Explained',
  'grammar-conjunctions': 'Conjunctions for Kids: How to Use and, but, because and so',
  'grammar-subject-verb': 'Subject-Verb Agreement for Kids: Common Mistakes and Easy Fixes',
  'grammar-assessment': 'Grammar Assessment for Kids: A Simple Parent Checklist',
  'grammar-editing-camp': 'Grammar Editing Practice for Kids: Find and Fix Common Mistakes',
  'grammar-speaking-bridge': 'Story Cards for Kids: Build Grammar and Speaking Skills Together',
  'speaking-confidence-seeds': 'How to Build Speaking Confidence in Kids: A 7-Day Calm Practice Plan',
  'speaking-structure': 'How to Structure a Speech for Kids: Hook, Body and Conclusion',
  'speaking-visual-aids': 'How Kids Can Use Visual Aids in Public Speaking',
  'speaking-debate-starters': 'Debate Topics and Starters for Kids and Tweens to Build Speaking Confidence',
  'speaking-video-feedback': 'How Video Feedback Helps Kids Improve Public Speaking',
  'speaking-competition-prep': 'Public Speaking Competition Checklist for Kids: How to Prepare Step by Step',
  'speaking-family-showcase': 'Public Speaking Activities for Kids at Home: Host a Family Showcase',
  'back-to-school-english-confidence-plan': 'Back-to-School English Confidence Plan for Kids: Speaking, Participation and Classroom Routines',
  'screen-smart-summer-routine-for-kids': 'Screen-Smart Summer Learning Routine for Kids: Balance English Practice and Screen Time',
});

describe('optimized public blog titles', () => {
  it('locks the 35 approved title changes across the public registry', () => {
    expect(Object.keys(BLOG_TITLE_OPTIMIZATIONS)).toHaveLength(10);
    expect(Object.keys(LOCKED_WEEK_TITLES_BY_PUBLIC_SLUG)).toHaveLength(25);
    expect(blogPosts).toHaveLength(76);

    const lockedTitles = {
      ...LOCKED_WEEK_TITLES_BY_PUBLIC_SLUG,
      ...BLOG_TITLE_OPTIMIZATIONS,
    };

    expect(Object.keys(lockedTitles)).toHaveLength(35);

    for (const [slug, expectedTitle] of Object.entries(lockedTitles)) {
      expect(bySlug.has(slug), `${slug} must exist in the public blog registry`).toBe(true);
      expect(bySlug.get(slug)?.title).toBe(expectedTitle);
      expect(expectedTitle.trim()).toBe(expectedTitle);
      expect(expectedTitle).not.toMatch(/\bWeek\s+\d+\b/i);
    }
  });

  it('keeps the migrated weekly title contract aligned with the public registry', () => {
    for (const rename of Object.values(LEGACY_WEEK_BLOG_RENAMES)) {
      expect(bySlug.get(rename.slug)?.title).toBe(rename.title);
    }
  });

  it('preserves the existing parent/research intent owner for phonics vs sight words', () => {
    expect(bySlug.get('science-of-phonics-learning')?.title).toBe(
      'Phonics vs Sight Words: What Helps Children Read Better',
    );
  });

  it('keeps the English Communication owner unchanged', () => {
    expect(bySlug.get('how-phonics-grammar-and-communication-work-together')?.title).toBe(
      'How Phonics, Grammar and Communication Work Together in a Child’s English Learning',
    );
  });

  it('uses the same optimized-title source for generated RSS feeds', () => {
    const rssGenerator = fs.readFileSync(path.join(repoRoot, 'scripts/generate-rss.mjs'), 'utf8');
    expect(rssGenerator).toContain("import { getOptimizedBlogTitle } from '../src/lib/blogTitleOptimization.js';");
    expect(rssGenerator).toContain('const title = getOptimizedBlogTitle(slug, publicTitle);');
  });
});
