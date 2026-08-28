import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import type { BlogPost } from '../../content/blog/types';
import {
  ACADEMIC_TEAM_BLOG_AUTHOR,
  BLOG_EDITORIAL_STANDARDS,
  FOUNDER_BLOG_AUTHOR,
  RESEARCH_DESK_BLOG_AUTHOR,
  buildBlogAuthorSchema,
  getBlogEvidenceSummary,
  resolveBlogAuthor,
} from '../../content/blog/shared/editorialTrust';
import { PUBLIC_FACTS, SITE_ORIGIN } from '../../lib/schemas';

const repoRoot = process.cwd();
const readRepoFile = (relativePath: string) =>
  fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

function samplePost(body: BlogPost['body']): BlogPost {
  return {
    slug: 'editorial-trust-test',
    title: 'Editorial trust test',
    category: 'Parent Tips',
    author: 'Tiny Steps Learning',
    date: '2026-01-01',
    readTime: '5 min read',
    excerpt: 'Test article',
    body,
  };
}

describe('B7 blog editorial trust and authorship', () => {
  it('keeps all 77 registry posts mapped to one explicit author responsibility profile', () => {
    expect(blogPosts).toHaveLength(77);

    for (const post of blogPosts) {
      const author = resolveBlogAuthor(post.author, post.category);
      expect(['founder', 'academic-team', 'research-desk']).toContain(author.key);
      expect(author.profilePath).toBe('/team');
      expect(author.profileUrl).toBe(`${SITE_ORIGIN}/team`);
      expect(author.name.trim().length).toBeGreaterThan(0);
      expect(author.role.trim().length).toBeGreaterThan(0);
    }
  });

  it('represents Priya as a Person and team/research ownership as the Tiny Steps organization', () => {
    const founderPost = blogPosts.find(
      (post) => post.author.trim().toLowerCase() === PUBLIC_FACTS.founder.displayName.toLowerCase(),
    );
    expect(founderPost, 'expected at least one Priya-authored registry post').toBeTruthy();

    const founder = resolveBlogAuthor(founderPost!.author, founderPost!.category);
    expect(founder).toEqual(FOUNDER_BLOG_AUTHOR);
    expect(buildBlogAuthorSchema(founder)).toMatchObject({
      '@type': 'Person',
      name: PUBLIC_FACTS.founder.displayName,
      url: `${SITE_ORIGIN}/team`,
      jobTitle: 'Founder',
    });

    const academicTeam = resolveBlogAuthor('Tiny Steps Learning', 'Phonics');
    expect(academicTeam).toEqual(ACADEMIC_TEAM_BLOG_AUTHOR);
    expect(buildBlogAuthorSchema(academicTeam)).toEqual({
      '@type': 'Organization',
      name: PUBLIC_FACTS.brandName,
      url: `${SITE_ORIGIN}/team`,
    });

    const researchDesk = resolveBlogAuthor('Tiny Steps Research Desk', 'Research');
    expect(researchDesk).toEqual(RESEARCH_DESK_BLOG_AUTHOR);
    expect(buildBlogAuthorSchema(researchDesk)).toEqual({
      '@type': 'Organization',
      name: PUBLIC_FACTS.brandName,
      url: `${SITE_ORIGIN}/team`,
    });
  });

  it('labels evidence from what is actually cited instead of inventing a research badge', () => {
    const noSources = getBlogEvidenceSummary(
      samplePost([
        { type: 'h2', content: 'Home routine' },
        { type: 'p', content: 'A practical Tiny Steps editorial suggestion for parents.' },
      ]),
    );
    expect(noSources.externalSourceCount).toBe(0);
    expect(noSources.label).toContain('no external source list is claimed');

    const sourced = getBlogEvidenceSummary(
      samplePost([
        { type: 'h2', content: 'Research Sources' },
        {
          type: 'li',
          content: '[EEF phonics](https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/phonics)',
        },
        {
          type: 'li',
          content: '[Reading Rockets](https://www.readingrockets.org/reading-101/reading-and-writing-basics/phonics-and-decoding)',
        },
      ]),
    );
    expect(sourced.externalSourceCount).toBe(2);
    expect(sourced.hasSourceSection).toBe(true);
    expect(sourced.label).toBe('2 external source links cited in this article');
  });

  it('keeps visible bylines, BlogPosting authors and author profile URLs on one contract', () => {
    const page = readRepoFile('src/pages/BlogPostPage.tsx');
    const hero = readRepoFile('src/components/blog/ResearchArticleHero.tsx');

    expect(page).toContain('author: buildBlogAuthorSchema(articleAuthor)');
    expect(page).toContain('authorLabel={articleAuthorLabel}');
    expect(page).toContain('authorRole={articleAuthor.role}');
    expect(page).toContain('authorTo={articleAuthor.profilePath}');
    expect(page).toContain('author={articleAuthor}');
    expect(page).toContain('metaAuthor.setAttribute(\'content\', articleAuthor.name)');

    expect(hero).toContain("authorLabel = 'Tiny Steps Learning'");
    expect(hero).toContain("authorTo = '/team'");
    expect(hero).toContain('aria-label={`About ${authorLabel}`}');
  });

  it('does not fabricate freshness when no explicit modified date exists', () => {
    const page = readRepoFile('src/pages/BlogPostPage.tsx');
    const types = readRepoFile('src/content/blog/types.ts');
    const jolly = readRepoFile('src/pages/blog/WhatIsJollyPhonicsBestWayPage.tsx');

    expect(types).toContain('modifiedDate?: string');
    expect(page).toContain('if (metaSource.modifiedDate) obj.dateModified = isoDateFromYMD(metaSource.modifiedDate)');
    expect(page).not.toContain('else obj.dateModified = isoDateFromYMD(metaSource.date)');
    expect(jolly).not.toContain("dateModified: '2026-04-05'");
    expect(BLOG_EDITORIAL_STANDARDS.datesPolicy).toContain('meaningful editorial revision');
  });

  it('removes unsupported global trust claims and provides correction transparency', () => {
    const authorPanel = readRepoFile('src/components/AboutAuthor.tsx');
    const jolly = readRepoFile('src/pages/blog/WhatIsJollyPhonicsBestWayPage.tsx');

    expect(authorPanel).not.toContain('10+ years');
    expect(authorPanel).not.toContain('Reviewed for classroom use');
    expect(authorPanel).toContain("{ label: 'Report a correction', to: '/contact'");
    expect(authorPanel).toContain("profilePath: '/team'");

    expect(jolly).toContain(`${PUBLIC_FACTS.brandName} · Academic Team`);
    expect(jolly).toContain('url: TEAM_URL');
    expect(jolly).toContain('Education Endowment Foundation phonics summary');
    expect(jolly).toContain('National Reading Panel findings');
  });
});
