import { COMMERCIAL_C2_OWNERSHIP_CLUSTERS } from '../../../lib/commercialC2KeywordOwnership';
import { getCommercialC7R2NextStepRule } from '../../../lib/commercialC7IntentNextStepRules';
import { getCommercialC7R3Handoff } from '../../../lib/commercialC7ContextualHandoffImplementation';
import type { BlogPost } from '../types';
import {
  applyBlogAuthorityLinking,
  getBlogAuthorityPlan,
  type BlogAuthorityPlan,
} from './authorityLinking';

type LinkCandidate = { label: string; to: string };

const commercialOwnerSet = new Set(COMMERCIAL_C2_OWNERSHIP_CLUSTERS.map((entry) => entry.canonicalOwnerPath));
commercialOwnerSet.add('/book-demo');

function alreadyLinksTo(bodyText: string, destination: string) {
  return bodyText.includes(`](${destination})`) || bodyText.includes(`(${destination})`);
}

function uniqueLinks(links: readonly LinkCandidate[]) {
  return links.filter((link, index) => links.findIndex((candidate) => candidate.to === link.to) === index);
}

function supportingLegacyLinks(plan: BlogAuthorityPlan | null, excluded: ReadonlySet<string>) {
  if (!plan) return [];
  return uniqueLinks([plan.primary, ...(plan.secondary ? [plan.secondary] : [])])
    .filter((link) => !commercialOwnerSet.has(link.to))
    .filter((link) => !excluded.has(link.to))
    .slice(0, 1);
}

export function applyCommercialC7ContextualHandoffs(post: BlogPost): BlogPost {
  const path = `/blog/${post.slug}`;
  const rule = getCommercialC7R2NextStepRule(path);
  if (!rule) return applyBlogAuthorityLinking(post);

  const legacyPlan = getBlogAuthorityPlan(post.slug);
  const handoff = getCommercialC7R3Handoff(path);
  const bodyText = post.body.map((block) => block.content).join('\n');

  if (!handoff) {
    const softLinks = supportingLegacyLinks(legacyPlan, new Set())
      .filter((link) => !alreadyLinksTo(bodyText, link.to));
    if (!softLinks.length) return post;
    return {
      ...post,
      body: [
        ...post.body,
        { type: 'h2', content: 'Keep the next step practical' },
        {
          type: 'p',
          content: `This page is for practice and parent support, so no programme or assessment step is required. [${softLinks[0].label}](${softLinks[0].to}).`,
        },
      ],
    };
  }

  const commercialLinks: LinkCandidate[] = [handoff.primary, ...(handoff.secondary ? [handoff.secondary] : [])];
  const excluded = new Set(commercialLinks.map((link) => link.to));
  const supportingLinks = supportingLegacyLinks(legacyPlan, excluded);
  const candidates = uniqueLinks([...commercialLinks, ...supportingLinks])
    .filter((link) => !alreadyLinksTo(bodyText, link.to));

  if (!candidates.length) return post;

  const commercialCandidates = candidates.filter((link) => commercialOwnerSet.has(link.to));
  const supportCandidates = candidates.filter((link) => !commercialOwnerSet.has(link.to));
  const sentences = [
    ...commercialCandidates.map((link) => `[${link.label}](${link.to}).`),
    ...supportCandidates.map((link) => `For supporting context, [${link.label}](${link.to}).`),
  ];

  return {
    ...post,
    body: [
      ...post.body,
      { type: 'h2', content: handoff.heading },
      { type: 'p', content: `${handoff.intro} ${sentences.join(' ')}` },
    ],
  };
}
