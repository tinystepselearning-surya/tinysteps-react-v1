import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const pagePath = path.join(repoRoot, 'src/pages/public/SpokenEnglishClassesForKidsPage.tsx');
const routeSeoPath = path.join(repoRoot, 'src/lib/routeSeoRegistry.js');
const c6Path = path.join(repoRoot, 'src/lib/commercialC6InternalCommercialPaths.ts');
const hyderabadPath = path.join(repoRoot, 'src/pages/public/OnlineEnglishClassesHyderabadPage.tsx');
const firebasePath = path.join(repoRoot, 'firebase.json');
const manifestPath = path.join(repoRoot, 'src/lib/publicRouteManifest.js');
const routesPath = path.join(repoRoot, 'src/app/routes.tsx');

const page = fs.readFileSync(pagePath, 'utf8');
const routeSeo = fs.readFileSync(routeSeoPath, 'utf8');
const c6 = fs.readFileSync(c6Path, 'utf8');
const hyderabad = fs.readFileSync(hyderabadPath, 'utf8');
const firebase = fs.readFileSync(firebasePath, 'utf8');
const manifest = fs.readFileSync(manifestPath, 'utf8');
const routes = fs.readFileSync(routesPath, 'utf8');

describe('Speaking growth Brick 5 Spoken English territory', () => {
  it('preserves the canonical Spoken English SEO control', () => {
    expect(page).toContain("const canonicalPath = '/spoken-english-classes-for-kids-online';");
    expect(page).toContain("const seoTitle = 'Spoken English Classes for Kids Online | Live 1:1 | Tiny Steps';");
    expect(page).toContain(
      'Live 1:1 spoken English classes for kids in India and worldwide. Build fuller sentences, conversational fluency, grammar in use and speaking confidence in 35-minute classes.',
    );

    expect(routeSeo).toContain("'/spoken-english-classes-for-kids-online': {");
    expect(routeSeo).toContain("canonicalPath: '/spoken-english-classes-for-kids-online'");
  });

  it('keeps everyday conversation and fuller spoken responses as the owner territory', () => {
    expect(page).toContain('What children practise in Spoken English');
    expect(page).toContain('Give a fuller response');
    expect(page).toContain('Build a useful sentence');
    expect(page).toContain('Continue the exchange');
    expect(page).toContain('Use it in a fresh situation');
    expect(page).toContain('everyday conversation');
    expect(page).toContain('conversational fluency');
  });

  it('keeps adjacent programme boundaries explicit', () => {
    expect(page).toContain('Choose public speaking & communication');
    expect(page).toContain('to="/speaking"');
    expect(page).toContain('Choose grammar support');
    expect(page).toContain('to="/grammar"');
    expect(page).toContain('Choose confidence-building support');
    expect(page).toContain('to="/confidence-building-program-kids"');
    expect(page).toContain('low-pressure response practice');
    expect(page).not.toContain('confidence practice, not just more listening exposure');
    expect(page).toContain('to="/blog/child-understands-english-but-does-not-speak"');
    expect(page).toContain('to="/blog/child-gives-one-word-answers"');
    expect(page).not.toContain("question: 'What if my child understands English but does not speak much?'");
    expect(page).not.toContain("question: 'Why do some children give only one-word answers?'");
    expect(page).not.toContain('to="/spoken-english-classes-for-kids"');
  });

  it('documents responsive live correction without promising correction of every error', () => {
    expect(page).toContain('Correction should help the child keep speaking');
    expect(page).toContain('One useful cue or model');
    expect(page).toContain('instead of interrupting every possible mistake');
    expect(page).toContain('Fresh use:');
    expect(page).toContain('to="/class-samples"');
  });

  it('keeps Hyderabad as a broad chooser while subject-qualified Spoken English stays on this owner', () => {
    expect(page).toContain('Spoken English for Hyderabad, India, and families worldwide');
    expect(page).toContain('this is the subject programme to use');
    expect(page).toContain('to="/online-english-classes-hyderabad"');

    expect(hyderabad).toContain("href: '/spoken-english-classes-for-kids-online'");
    expect(c6).toContain(
      "edge('/online-english-classes-hyderabad', '/spoken-english-classes-for-kids-online', 'programme-fit-handoff')",
    );
  });

  it('uses central learner-reach facts and exposes observable progress', () => {
    expect(page).toContain('PUBLIC_SITE_FACTS.learnerReach.learnersLabel');
    expect(page).toContain('PUBLIC_SITE_FACTS.learnerReach.countriesLabel');
    expect(page).toContain('PUBLIC_LEARNER_REACH_LABEL');
    expect(page).toContain('What parents can look for over time');
    expect(page).toContain('Longer, relevant everyday responses');
    expect(page).toContain('Ability to answer a follow-up question');
    expect(page).toContain('Use of the same skill in a fresh conversation');
  });

  it('keeps the assessment as the decision mechanism', () => {
    expect(page).toContain('How the spoken English assessment works');
    expect(page).toContain('Parents receive a practical recommendation before enrolment');
    expect(page).toContain('Book a Free English Assessment');
    expect(page).toContain("{ label: 'Free English assessment', tone: 'mint' as const }");
    expect(page).not.toContain('Book a Free Speaking Assessment');
    expect(page).not.toContain("{ label: 'Free speaking assessment', tone: 'mint' as const }");
  });

  it('hardens both legacy Spoken English redirect variants to the canonical owner', () => {
    expect(firebase).toContain(
      '{ "source": "/spoken-english-classes-for-kids", "destination": "/spoken-english-classes-for-kids-online", "type": 301 }',
    );
    expect(firebase).toContain(
      '{ "source": "/spoken-english-classes-for-kids/", "destination": "/spoken-english-classes-for-kids-online", "type": 301 }',
    );
    expect(manifest).toContain(
      "{ source: '/spoken-english-classes-for-kids', destination: '/spoken-english-classes-for-kids-online', status: 301 }",
    );
    expect(manifest).toContain(
      "{ source: '/spoken-english-classes-for-kids/', destination: '/spoken-english-classes-for-kids-online', status: 301 }",
    );
    expect(routes).toContain(
      'path: \'spoken-english-classes-for-kids\', element: <Navigate to="/spoken-english-classes-for-kids-online" replace />',
    );
    expect(routes).toContain(
      'path: \'spoken-english-classes-for-kids/\', element: <Navigate to="/spoken-english-classes-for-kids-online" replace />',
    );
  });
});
