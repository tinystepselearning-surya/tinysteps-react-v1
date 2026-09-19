import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const speakingPath = path.join(repoRoot, 'src/pages/speaking.tsx');
const c4Path = path.join(repoRoot, 'src/lib/commercialC4CtrOptimization.ts');

const speaking = fs.readFileSync(speakingPath, 'utf8');
const c4 = fs.readFileSync(c4Path, 'utf8');

describe('Speaking growth Brick 4 flagship page', () => {
  it('preserves the frozen /speaking SEO control while rebuilding the body journey', () => {
    expect(speaking).toContain(
      "const seoTitle = 'Public Speaking & Communication Classes for Kids | Tiny Steps';",
    );
    expect(speaking).toContain(
      'Live 1:1 public speaking and communication classes for kids in India and worldwide. Build structured answers, storytelling, presentations and communication confidence in 35-minute classes.',
    );
    expect(speaking).toContain("const canonicalPath = '/speaking';");

    expect(c4).toContain("title: 'Public Speaking & Communication Classes for Kids | Tiny Steps'");
    expect(c4).toContain(
      'Live 1:1 public speaking and communication classes for kids in India and worldwide. Build structured answers, storytelling, presentations and communication confidence in 35-minute classes.',
    );
  });

  it('keeps exactly one H1 and does not resurrect the retired legacy landing', () => {
    expect((speaking.match(/<h1\b/g) ?? [])).toHaveLength(1);
    expect(speaking).not.toContain('/public-speaking-communication-kids');
  });

  it('implements the parent diagnostic with canonical programme handoffs', () => {
    expect(speaking).toContain('What is your child struggling with?');
    expect(speaking).toContain('to="/spoken-english-classes-for-kids-online"');
    expect(speaking).toContain('to="/grammar"');
    expect(speaking).toContain('to="/confidence-building-program-kids"');
    expect(speaking).toContain('to="/courses/public-speaking-excellence"');
    expect(speaking).toContain('Best fit: this Speaking programme');
    expect(speaking).toContain('children who can already communicate at a basic level');
    expect(speaking).toContain('one-word everyday answers or sentence formation itself');
    expect(speaking).not.toContain('move from short answers and hesitation to complete sentences');
  });

  it('separates optional language foundations from the speaking progression', () => {
    expect(speaking).toContain('Supporting foundations — only when the assessment shows they are needed');
    expect(speaking).toContain('Grammar & sentence formation');
    expect(speaking).toContain('Everyday conversation & fluency');
    expect(speaking).toContain('1 Complete responses');
    expect(speaking).toContain('6 Advanced public speaking');
  });

  it('adds class-sample, teacher-system, progress and parent-evidence proof surfaces', () => {
    expect(speaking).toContain('What a Tiny Steps speaking class looks like');
    expect(speaking).toContain('to="/class-samples"');
    expect(speaking).toContain('Teachers work inside a structured academic system');
    expect(speaking).toContain('to="/team"');
    expect(speaking).toContain('How parents see speaking progress');
    expect(speaking).toContain('Parent evidence');
    expect(speaking).toContain('Parent feedback from speaking families');
    expect(speaking).not.toContain('Approved parent feedback from speaking families');
    expect((speaking.match(/<TestimonialSnippets/g) ?? [])).toHaveLength(1);
    expect((speaking.match(/<ResponsiveTeachingSection/g) ?? [])).toHaveLength(1);
  });

  it('keeps the assessment as the decision mechanism instead of promising automatic placement', () => {
    expect(speaking).toContain('let the free 1:1 assessment confirm the best pathway');
    expect(speaking).toContain('Tiny Steps uses assessment-first placement');
    expect(speaking).toContain('What happens in the free speaking assessment?');
    expect(speaking).toContain('Not sure why your child hesitates while speaking?');
  });
});
