import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');

const article = read('src/content/blog/posts/public-speaking/why-public-speaking-is-important-for-kids.ts');
const speaking = read('src/pages/speaking.tsx');
const resources = read('src/pages/SubjectResourcesPage.tsx');
const technicalAuthority = read('src/content/blog/shared/technicalAuthority.ts');
const authorityLinking = read('src/content/blog/shared/authorityLinking.ts');
const canonical = read('src/lib/canonicalTopicOwnershipRegistry.js');
const aiAnswers = read('src/lib/aiAnswerLayerRegistry.js');
const knowledgeCluster = read('src/lib/speakingKnowledgeCluster.ts');
const llms = read('public/llms.txt');
const llmsFull = read('public/llms-full.txt');
const sitemap = read('public/sitemap-blog.xml');
const rss = read('public/rss.xml');

describe('Speaking Commercial Authority v2 — Brick 6 authority article and reconciliation', () => {
  it('publishes one broad informational authority article for why public speaking matters', () => {
    expect(article).toContain("slug: 'why-public-speaking-is-important-for-kids'");
    expect(article).toContain("title: 'Why Public Speaking Is Important for Kids'");
    expect(article).toContain("category: 'Public Speaking'");
    expect(article).toContain("discoveryCategory: 'Speaking & Communication'");
    expect(article).toContain("date: '2026-10-03'");
    expect(article).toContain('Quick answer: public speaking for children is really organised communication');
  });

  it('covers the parent questions without collapsing distinct programme intents', () => {
    expect(article).toContain('Why does public speaking matter for children?');
    expect(article).toContain('What is the right age to start public speaking?');
    expect(article).toContain('Ages 4–5: communication foundations');
    expect(article).toContain('Ages 6–8: structured speaking foundations');
    expect(article).toContain('Ages 9–12: more advanced communication and public speaking');
    expect(article).toContain('Public speaking, communication skills and Spoken English are not the same thing');
    expect(article).toContain('[Spoken English](/spoken-english-classes-for-kids-online)');
    expect(article).toContain('[Grammar](/grammar)');
    expect(article).toContain('[Confidence Building](/confidence-building-program-kids)');
  });

  it('keeps age-four guidance developmentally bounded and non-diagnostic', () => {
    expect(article).toContain('There is **no universal international rule**');
    expect(article).toContain('at age four, public speaking begins with communication—not podium speeches');
    expect(article).toContain('https://www.asha.org/public/developmental-milestones/communication-milestones-4-to-5-years/');
    expect(article).toContain('milestone information is not a diagnostic test');
  });

  it('uses authoritative education and AI-era references with source-specific limits', () => {
    for (const url of [
      'https://www.gov.uk/government/publications/national-curriculum-in-england-english-programmes-of-study/national-curriculum-in-england-english-programmes-of-study',
      'https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/oral-language-interventions/',
      'https://literacytrust.org.uk/research-services/research-reports/children-and-young-peoples-speaking-and-listening-in-2025/',
      'https://www.unesco.org/en/articles/ai-competency-framework-students',
      'https://www.oecd.org/en/data/tools/oecd-learning-compass-2030.html',
      'https://www.unicef.org/innocenti/reports/skills-ai-world',
      'https://www.weforum.org/publications/the-future-of-jobs-report-2025/in-full/3-skills-outlook/',
    ]) {
      expect(article).toContain(url);
    }
    expect(article).toContain('not public speaking');
    expect(article).toContain('not an endorsement of any speaking programme');
    expect(article).toContain('labour-market evidence about employers');
  });

  it('keeps the AI-era message human-centred and does not make young children use AI', () => {
    expect(article).toContain('ASK → THINK → ORGANISE → EXPLAIN → LISTEN → RESPOND');
    expect(article).toContain('our teaching scaffold');
    expect(article).toContain('Young children do **not** need to use AI tools');
    expect(article).toContain('Should young children learn prompt engineering?');
  });

  it('assigns the informational owner without stealing the /speaking commercial query', () => {
    expect(canonical).toContain("topic('why-public-speaking-matters-for-kids'");
    expect(canonical).toContain("ownerPath: '/blog/why-public-speaking-is-important-for-kids'");
    expect(canonical).toContain("queryIntent: 'why public speaking is important for kids'");
    expect(canonical).toContain("forbiddenCompetingOwners: ['/speaking']");
    expect(canonical).toContain("topic('live-public-speaking-classes'");
    expect(canonical).toContain("ownerPath: '/speaking'");
    expect(technicalAuthority).toContain("'why-public-speaking-is-important-for-kids': {");
    expect(technicalAuthority).toContain("role: 'pillar'");
  });

  it('connects the authority article without expanding frozen B7 or AI baselines', () => {
    expect(speaking).toContain('to="/blog/why-public-speaking-is-important-for-kids"');
    expect(resources).toContain("to: '/blog/why-public-speaking-is-important-for-kids'");
    expect(aiAnswers).toContain("export const AI_ANSWER_LAYER_REVISION = '2026-09-27-gv6'");
    expect(aiAnswers).not.toContain("id: 'concept-public-speaking-importance'");
    expect(canonical).toContain("'what age should children start public speaking'");
    expect(authorityLinking).not.toContain("slug: 'why-public-speaking-is-important-for-kids'");
  });

  it('preserves the frozen specialist speaking knowledge cluster instead of forcing the new pillar into it', () => {
    expect(knowledgeCluster).toContain('if (SPEAKING_KNOWLEDGE_CLUSTER_PATHS.length !== 14)');
    expect(llms).toContain('#### Speaking Broad Authority Guide');
    expect(llms).toContain('#### Speaking Knowledge Cluster — 14 Established URLs');
    expect(llmsFull).toContain('### Speaking Broad Authority Guide');
    expect(llmsFull).toContain('### Frozen Speaking Knowledge Owners');
  });

  it('publishes the article to sitemap, RSS and retrieval surfaces', () => {
    const url = 'https://tinystepslearning.com/blog/why-public-speaking-is-important-for-kids';
    expect(sitemap).toContain(url);
    expect(sitemap).toContain('<lastmod>2026-10-03</lastmod>');
    expect(rss).toContain(url);
    expect(llms).toContain(url);
    expect(llmsFull).toContain(url);
  });

  it('keeps the article evidence-led rather than competitor-copy-led', () => {
    expect(article).not.toContain('PlanetSpark');
    expect(article).not.toContain('Speaking Fever');
    expect(article).not.toContain('VoxStar');
    expect(article).not.toContain('best public speaking classes');
    expect(article).not.toContain('India’s #1');
  });
});
