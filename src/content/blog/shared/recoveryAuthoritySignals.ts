import type { BlogPost } from '../types';
import { getBlogAuthorityPlan } from './authorityLinking';
import {
  getSeoRecoveryBrick12BlogRule,
  type SeoRecoveryBrick12AuthoritySignal,
} from '../../../config/seoRecoveryBrick12AuthoritySignals';

function alreadyLinksTo(bodyText: string, destination: string) {
  return bodyText.includes(`](${destination})`) || bodyText.includes(`(${destination})`);
}

function uniqueSignals(signals: readonly SeoRecoveryBrick12AuthoritySignal[]) {
  return signals.filter(
    (signal, index) => signals.findIndex((candidate) => candidate.to === signal.to) === index,
  );
}

/**
 * Brick 12 adds only missing upward authority edges after the existing blog
 * handoff system has run. This keeps the existing commercial next-step logic
 * intact while reinforcing specialist hubs such as SATPIN and the decoding
 * diagnostic page.
 */
export function applySeoRecoveryBrick12AuthoritySignals(post: BlogPost): BlogPost {
  const rule = getSeoRecoveryBrick12BlogRule(post.slug);
  if (!rule) return post;

  const currentPath = `/blog/${post.slug}`;
  const bodyText = post.body.map((block) => block.content).join('\n');
  const missingSignals = uniqueSignals(rule.signals)
    .filter((signal) => signal.to !== currentPath)
    .filter((signal) => !alreadyLinksTo(bodyText, signal.to));

  if (!missingSignals.length) return post;

  const linkedSignals = missingSignals
    .map((signal) => `[${signal.label}](${signal.to}).`)
    .join(' ');
  const hasExistingAuthorityPlan = Boolean(getBlogAuthorityPlan(post.slug));

  return {
    ...post,
    body: [
      ...post.body,
      ...(hasExistingAuthorityPlan
        ? []
        : [{ type: 'h2' as const, content: rule.heading }]),
      {
        type: 'p' as const,
        content: `${rule.intro} ${linkedSignals}`,
      },
    ],
  };
}
