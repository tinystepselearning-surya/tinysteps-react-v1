import type { BlogPost } from '../types';
import { FOUNDER_ID, ORGANIZATION_ID, PUBLIC_FACTS, SITE_ORIGIN } from '../../../lib/schemas';

export type BlogAuthorKey = 'founder' | 'academic-team' | 'research-desk';

export type BlogAuthorProfile = {
  key: BlogAuthorKey;
  schemaType: 'Person' | 'Organization';
  name: string;
  role: string;
  profilePath: string;
  profileUrl: string;
  bio: string;
  imageUrl?: string;
};

export type BlogEvidenceSummary = {
  externalSourceCount: number;
  hasSourceSection: boolean;
  label: string;
};

const TEAM_PROFILE_PATH = '/team';
const TEAM_PROFILE_URL = `${SITE_ORIGIN}${TEAM_PROFILE_PATH}`;

export const FOUNDER_BLOG_AUTHOR: BlogAuthorProfile = {
  key: 'founder',
  schemaType: 'Person',
  name: PUBLIC_FACTS.founder.displayName,
  role: `Founder & Academic Lead, ${PUBLIC_FACTS.brandName}`,
  profilePath: TEAM_PROFILE_PATH,
  profileUrl: TEAM_PROFILE_URL,
  imageUrl: '/priya-founder-tiny-steps-learning.webp',
  bio: `Priya leads ${PUBLIC_FACTS.brandName}'s academic direction across phonics, reading, grammar, writing, and communication, including curriculum design, teacher guidance, and teaching quality.`,
};

export const ACADEMIC_TEAM_BLOG_AUTHOR: BlogAuthorProfile = {
  key: 'academic-team',
  schemaType: 'Organization',
  name: PUBLIC_FACTS.brandName,
  role: 'Academic Team',
  profilePath: TEAM_PROFILE_PATH,
  profileUrl: TEAM_PROFILE_URL,
  bio: `${PUBLIC_FACTS.brandName} publishes parent-facing guidance under its academic editorial responsibility across phonics, reading, grammar, writing, and speaking.`,
};

export const RESEARCH_DESK_BLOG_AUTHOR: BlogAuthorProfile = {
  key: 'research-desk',
  schemaType: 'Organization',
  name: PUBLIC_FACTS.brandName,
  role: 'Research Desk',
  profilePath: TEAM_PROFILE_PATH,
  profileUrl: TEAM_PROFILE_URL,
  bio: `${PUBLIC_FACTS.brandName} Research Desk prepares evidence-led explainers and distinguishes cited external evidence from Tiny Steps editorial guidance.`,
};

function normalizeAuthor(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

export function resolveBlogAuthor(author: unknown, category?: unknown): BlogAuthorProfile {
  const normalized = normalizeAuthor(author);
  const founderNames = new Set([
    normalizeAuthor(PUBLIC_FACTS.founder.displayName),
    normalizeAuthor(PUBLIC_FACTS.founder.fullName),
    ...PUBLIC_FACTS.founder.alternateNames.map((name) => normalizeAuthor(name)),
  ]);

  if (founderNames.has(normalized)) return FOUNDER_BLOG_AUTHOR;

  if (normalized.includes('research') || normalizeAuthor(category) === 'research') {
    return RESEARCH_DESK_BLOG_AUTHOR;
  }

  return ACADEMIC_TEAM_BLOG_AUTHOR;
}

export function buildBlogAuthorSchema(profile: BlogAuthorProfile) {
  if (profile.schemaType === 'Person') {
    return {
      '@type': 'Person',
      '@id': FOUNDER_ID,
      name: profile.name,
      url: profile.profileUrl,
      jobTitle: 'Founder',
      worksFor: { '@id': ORGANIZATION_ID, name: PUBLIC_FACTS.organizationName },
    };
  }

  return {
    '@type': 'Organization',
    name: profile.name,
    url: profile.profileUrl,
  };
}

function collectExternalUrls(post: Pick<BlogPost, 'body' | 'faq'>) {
  const urls = new Set<string>();
  const text = [
    ...post.body.map((block) => block.content),
    ...(post.faq || []).flatMap((item) => [item.question, item.answer]),
  ].join('\n');

  for (const match of text.matchAll(/https?:\/\/[^\s)\]]+/g)) {
    const url = match[0].replace(/[.,;:!?]+$/, '');
    if (!url.startsWith(SITE_ORIGIN)) urls.add(url);
  }

  return urls;
}

export function getBlogEvidenceSummary(post: Pick<BlogPost, 'body' | 'faq'>): BlogEvidenceSummary {
  const externalSourceCount = collectExternalUrls(post).size;
  const hasSourceSection = post.body.some(
    (block) =>
      (block.type === 'h2' || block.type === 'h3')
      && /\b(source|sources|reference|references|evidence)\b/i.test(block.content),
  );

  return {
    externalSourceCount,
    hasSourceSection,
    label:
      externalSourceCount > 0
        ? `${externalSourceCount} external source link${externalSourceCount === 1 ? '' : 's'} cited in this article`
        : 'Tiny Steps editorial guidance; no external source list is claimed on this page',
  };
}

export const BLOG_EDITORIAL_STANDARDS = {
  authorProfilePath: TEAM_PROFILE_PATH,
  correctionsPath: '/contact',
  datesPolicy:
    'Published dates are retained. An updated date should be shown only when a meaningful editorial revision is explicitly recorded.',
  evidencePolicy:
    'External evidence is identified with source links where used. Pages without cited sources are presented as Tiny Steps editorial guidance rather than labelled as research-backed.',
} as const;
