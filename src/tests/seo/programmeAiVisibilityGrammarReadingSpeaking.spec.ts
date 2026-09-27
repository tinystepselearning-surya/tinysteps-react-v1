import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ASK_TINY_STEPS_KNOWLEDGE_SOURCES } from '../../config/askTinyStepsKnowledgeSources';
import { COMMERCIAL_C2_OWNERSHIP_CLUSTERS } from '../../lib/commercialC2KeywordOwnership';
import {
  PROGRAMME_AI_ENGINE_POLICY,
  PROGRAMME_AI_VISIBILITY,
} from '../../lib/programmeAiVisibility';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('Grammar, Reading and Speaking AI visibility hardening', () => {
  const grammarSource = read('src/pages/grammar.tsx');
  const readingSource = read('src/pages/public/ReadingClassesForKidsPage.tsx');
  const speakingSource = read('src/pages/speaking.tsx');
  const phonicsSource = read('src/pages/phonics.tsx');
  const llmsSource = read('public/llms.txt');
  const llmsFullSource = read('public/llms-full.txt');

  it('keeps phonics protected while giving the three growth owners explicit boundaries', () => {
    expect(PROGRAMME_AI_ENGINE_POLICY.phonicsProtectedFromReadingExpansion).toBe(true);
    expect(PROGRAMME_AI_VISIBILITY.map((item) => item.path)).toEqual([
      '/reading-classes-for-kids',
      '/grammar',
      '/speaking',
    ]);
    expect(PROGRAMME_AI_VISIBILITY.map((item) => String(item.path))).not.toContain('/phonics');

    const phonicsOwner = COMMERCIAL_C2_OWNERSHIP_CLUSTERS.find((item) => item.id === 'phonics-provider');
    expect(phonicsOwner?.canonicalOwnerPath).toBe('/phonics');
    expect(phonicsOwner?.priority).toBe('P1');

    expect(phonicsSource).not.toContain('ProgrammeIntentBoundary');
    expect(phonicsSource).not.toContain('getProgrammeAiVisibility');
  });

  it('makes Reading a post-phonics connected-reading owner rather than a decoding claimant', () => {
    const reading = PROGRAMME_AI_VISIBILITY.find((item) => item.path === '/reading-classes-for-kids');
    expect(reading?.ownerIntent).toContain('connected-text reading');
    expect(reading?.doNotOwn.join(' ')).toContain('phonics');
    expect(reading?.handoffs.some((item) => item.path === '/phonics')).toBe(true);

    expect(readingSource).toContain('They should not take over phonics ownership');
    expect(readingSource).toContain('the correct first route is the Phonics programme');
    expect(readingSource).toContain('From accurate connected reading to comprehension and confidence');
    expect(readingSource).not.toContain("title: '1. Decode unfamiliar words'");
    expect(readingSource).not.toContain("'Decoding accuracy'");
    expect(readingSource).toContain("teaches: ['connected reading', 'reading fluency', 'phrasing', 'vocabulary', 'reading comprehension', 'retelling', 'reading confidence']");
  });

  it('keeps Grammar sentence-level and hands composition to Writing', () => {
    const grammar = PROGRAMME_AI_VISIBILITY.find((item) => item.path === '/grammar');
    expect(grammar?.ownerIntent).toContain('sentence control');
    expect(grammar?.handoffs.some((item) => item.path === '/writing-classes-for-kids')).toBe(true);

    expect(grammarSource).toContain('Grammar supports writing, but it is not the writing programme');
    expect(grammarSource).toContain('Written sentence accuracy');
    expect(grammarSource).toContain('Paragraph development, creative writing, editing, and longer composition belong to the dedicated Writing programme');
    expect(grammarSource).not.toContain('Parents often combine this page with');
    expect(grammarSource).not.toContain('Communication confidence support');
  });

  it('keeps Public Speaking distinct from Spoken English, confidence-only and Grammar needs', () => {
    const speaking = PROGRAMME_AI_VISIBILITY.find((item) => item.path === '/speaking');
    expect(speaking?.handoffs.map((item) => item.path)).toEqual([
      '/spoken-english-classes-for-kids-online',
      '/confidence-building-program-kids',
      '/grammar',
    ]);

    expect(speakingSource).toContain('Everyday conversational fluency belongs to Spoken English');
    expect(speakingSource).toContain('confidence-only barriers belong to Confidence Building');
    expect(speakingSource).toContain("teaches: ['public speaking', 'structured answers', 'storytelling', 'show-and-tell', 'presentations', 'audience awareness', 'communication skills']");
  });

  it('uses answer-engine extraction and shared intent-boundary UI on all three pages', () => {
    expect(grammarSource).toContain("buildSpeakableSpecification");
    expect(grammarSource).toContain("'.ts-grammar-answer-title'");
    expect(grammarSource).toContain("'.ts-grammar-answer-summary'");
    expect(readingSource).toContain("buildSpeakableSpecification");
    expect(readingSource).toContain("'.ts-reading-answer-title'");
    expect(readingSource).toContain("'.ts-reading-answer-summary'");
    expect(speakingSource).toContain("'.ts-speaking-answer-title'");
    expect(speakingSource).toContain("'.ts-speaking-answer-summary'");

    for (const source of [grammarSource, readingSource, speakingSource]) {
      expect(source).toContain('ProgrammeIntentBoundary');
      expect(source).toContain('getProgrammeAiVisibility');
    }
  });

  it('keeps Ask Tiny Steps retrieval specific to the canonical programme owners', () => {
    const byPath = new Map(ASK_TINY_STEPS_KNOWLEDGE_SOURCES.map((item) => [item.path, item]));

    expect(byPath.get('/reading-classes-for-kids')?.tags).not.toContain('decoding');
    expect(byPath.get('/reading-classes-for-kids')?.note).toContain('use /phonics');
    expect(byPath.get('/grammar')?.canonicalFor).not.toContain('writing');
    expect(byPath.get('/grammar')?.note).toContain('/writing-classes-for-kids');
    expect(byPath.get('/speaking')?.canonicalFor).not.toContain('speaking confidence');
    expect(byPath.get('/speaking')?.note).toContain('Spoken English');
  });

  it('publishes the same owner boundaries in LLM discovery files without creating AI-only pages', () => {
    expect(llmsSource).toContain('Keep commercial Reading separate from Phonics');
    expect(llmsSource).toContain('Keep Grammar separate from Writing');
    expect(llmsSource).toContain('Keep Public Speaking separate from Spoken English');
    expect(llmsFullSource).toContain('## Core Programme Answer Boundaries');
    expect(llmsFullSource).toContain('Do not create separate ChatGPT, Gemini, Perplexity or other engine-specific programme pages');
    expect(PROGRAMME_AI_ENGINE_POLICY.newAiPromptPagesAllowed).toBe(false);
    expect(PROGRAMME_AI_ENGINE_POLICY.newEngineSpecificPagesAllowed).toBe(false);
  });
});
