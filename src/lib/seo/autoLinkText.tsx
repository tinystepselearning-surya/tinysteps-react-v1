import React from 'react';
import { Link } from 'react-router-dom';
import { internalLinkMap, type InternalLinkRule } from './internalLinkMap';

const DEBUG_AUTOLINK = import.meta.env.DEV;

type AutoLinkTextOptions = {
  pathname: string;
  maxLinks?: number;
  cluster?: string;
  allowRuleIds?: string[];
  excludeRuleIds?: string[];
  /** A Set of hrefs that have already been used in the current context, to prevent duplicates. */
  usedHrefs?: Set<string>;
};

const normalizePath = (value: string): string => {
  const raw = String(value || '').trim();
  if (!raw) return '/';

  const withoutOrigin = raw.replace(/^https?:\/\/[^/]+/i, '');
  const pathOnly = withoutOrigin.split(/[?#]/)[0] || '/';
  if (pathOnly === '/') return '/';
  return pathOnly.replace(/\/+$/, '') || '/';
};

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Memoize the sorted rules to avoid re-sorting on every call
const sortedRules = internalLinkMap
  .flatMap(rule => rule.phrases.map(phrase => ({ ...rule, phrase })))
  .sort((a, b) => b.phrase.length - a.phrase.length || b.priority - a.priority);

export function autoLinkText(text: string, options: AutoLinkTextOptions): React.ReactNode {
  // New guardrail: if the text is too short, don't add links.
  if (text.split(' ').length < 15) {
    if (DEBUG_AUTOLINK) console.log('[AutoLink] Skipped: Text too short (< 15 words).', { text });
    return text;
  }

  const { pathname, maxLinks = 2 } = options;
  const result: React.ReactNode[] = [];
  let remainingText = text;
  let linksFound = 0;
  const normalizedPathname = normalizePath(pathname);
  // Use the passed-in Set or create a new one for this block.
  const usedHrefs = options.usedHrefs ?? new Set<string>();

  // Never link to the current page. Normalize existing values for slash/query/hash consistency.
  for (const href of Array.from(usedHrefs)) {
    usedHrefs.add(normalizePath(href));
  }
  usedHrefs.add(normalizedPathname);

  while (remainingText && linksFound < maxLinks) {
    let bestMatch: { rule: InternalLinkRule; phrase: string; index: number; normalizedHref: string } | null = null;

    for (const rule of sortedRules) {
      const normalizedRuleHref = normalizePath(rule.href);
      // Basic filtering
      if (usedHrefs.has(rule.href) || usedHrefs.has(normalizedRuleHref)) {
        if (DEBUG_AUTOLINK) console.log(`[AutoLink] Skipped: href already used ('${rule.href}' for phrase '${rule.phrase}').`);
        continue;
      }
      if (options.cluster && rule.cluster !== options.cluster) {
        if (DEBUG_AUTOLINK) console.log(`[AutoLink] Skipped: Rule '${rule.id}' cluster '${rule.cluster}' does not match '${options.cluster}'.`);
        continue;
      }
      if (options.excludeRuleIds?.includes(rule.id)) {
        if (DEBUG_AUTOLINK) console.log(`[AutoLink] Skipped: Rule ID '${rule.id}' is excluded.`);
        continue;
      }
      if (options.allowRuleIds && !options.allowRuleIds.includes(rule.id)) {
        if (DEBUG_AUTOLINK) console.log(`[AutoLink] Skipped: Rule ID '${rule.id}' not in allowlist.`);
        continue;
      }
      if (rule.pageDenylist?.map(normalizePath).includes(normalizedPathname)) {
        if (DEBUG_AUTOLINK) console.log(`[AutoLink] Skipped: Pathname '${pathname}' is in denylist for rule '${rule.id}'.`);
        continue;
      }
      if (rule.pageAllowlist && !rule.pageAllowlist.map(normalizePath).includes(normalizedPathname)) {
        if (DEBUG_AUTOLINK) console.log(`[AutoLink] Skipped: Pathname '${pathname}' not in allowlist for rule '${rule.id}'.`);
        continue;
      }

      const regex = new RegExp(`\\b${escapeRegex(rule.phrase)}\\b`, 'i');
      const match = remainingText.match(regex);

      if (match && typeof match.index !== 'undefined') {
        // New guardrail: don't link in the first few words
        if (remainingText.substring(0, match.index).split(' ').length < 6) {
          if (DEBUG_AUTOLINK) console.log(`[AutoLink] Skipped: Match '${match[0]}' found in first 6 words.`);
          continue;
        }
        // This is the first potential match for this iteration
        bestMatch = { rule, phrase: match[0], index: match.index, normalizedHref: normalizedRuleHref };
        break; // Since rules are pre-sorted, the first match is the best one
      }
    }

    if (bestMatch) {
      const { rule, phrase, index, normalizedHref } = bestMatch;
      if (DEBUG_AUTOLINK) console.log(`[AutoLink] Matched: Phrase '${phrase}' -> '${rule.href}' (Rule ID: ${rule.id})`);
      const beforeText = remainingText.substring(0, index);
      if (beforeText) {
        result.push(beforeText);
      }
      
      result.push(
        <Link key={`${rule.id}-${linksFound}`} to={rule.href} className="text-slate-900 underline hover:text-sky-700">
          {phrase}
        </Link>
      );
      
      remainingText = remainingText.substring(index + phrase.length);
      linksFound++;
      usedHrefs.add(normalizedHref);
    } else {
      // No more matches found
      break;
    }
  }

  if (remainingText) {
    result.push(remainingText);
  }

  return <>{result}</>;
}
