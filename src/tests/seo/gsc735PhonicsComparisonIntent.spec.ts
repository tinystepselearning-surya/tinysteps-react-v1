import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const articlePath = path.join(root, 'src/content/blog/posts/phonics/online-phonics-classes-vs-school.ts');
const text = fs.readFileSync(articlePath, 'utf8');

describe('GSC #735: protect the school vs online phonics parent decision article', () => {
  it('keeps the existing owner and source metadata stable', () => {
    expect(text).toContain("slug: 'online-phonics-classes-vs-school'");
    expect(text).toContain("title: 'Online Phonics Classes vs School: What Works for Which Child'");
    expect(text).toContain("category: 'Phonics'");
    expect(text).toContain("modifiedDate: '2026-08-30'");
    expect(text).toContain('Quick answer: online phonics is not automatically better than school phonics');
  });

  it('connects a precise decoding problem to its established guide and Phonics course', () => {
    expect(text).toContain('/blog/why-child-knows-letter-sounds-but-cannot-read-words');
    expect(text).toContain('/blog/how-kids-learn-blending');
    expect(text).toContain('/blog/how-to-improve-reading-fluency-in-children');
    expect(text).toContain('[/phonics](/phonics)');
    expect(text).toContain('[/curriculum](/curriculum)');
  });

  it('does not expose internal numbered editorial labels to parents', () => {
    expect(text).not.toMatch(/Blog\\s*#\\d+/);
    expect(text).toContain('/blog/how-phonics-classes-help-kids-read');
    expect(text).toContain('/blog/how-to-choose-phonics-classes');
  });
});
