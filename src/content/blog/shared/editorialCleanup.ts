import { normalizeSeoRecoveryInternalHref } from '../../../config/seoRecoveryBrick8InternalLinks';
import type { BlogBlock, BlogPost } from '../types';

const WEEK_TITLE_PREFIX = /^\s*Week\s+\d+\s*(?::|[-–—])\s*/i;
const FAQ_TEMPLATE_HEADING = /^\s*(?:\d+\.\s*)?FAQ section with \d+ parent questions\.?\s*$/i;
const RAW_ACTION_ROUTE = /\b(Explore|Read|Visit|Build|Compare|Try|Play|Book|Start|See|View|Open)\s+([^.:!?]{1,120}?):\s*(\/[a-z0-9](?:[a-z0-9\-_/?.=&%#]*[a-z0-9\-_/#=&%])?)/gi;
const BOOK_QUERY_ONLY = /^\s*\/?\?book=1\s*$/i;
const INTERNAL_BLOG_REFERENCE_WITH_PUNCTUATION = /\bBlog\s+#?\d+\s*[:,]\s*/gi;
const INTERNAL_BLOG_REFERENCE = /\bBlog\s+#?\d+\b/gi;

export function cleanBlogTitle(title: string): string {
  return String(title || '').replace(WEEK_TITLE_PREFIX, '').trim();
}

export function getWeekSeriesLabel(slug: string): string {
  const match = String(slug || '').trim().match(/^week-(\d+)(?:-|$)/i);
  return match ? `Week ${match[1]} Roadmap` : '';
}

function removeInternalBlogNumbering(content: string): string {
  return content
    .replace(/\bThis\s+Blog\s+#?\d+\s+owns\b/gi, 'This guide covers')
    .replace(/\bThis\s+Blog\s+#?\d+\b/gi, 'This guide')
    .replace(/\bHow\s+Blog\s+#?\d+\s+differs\b/gi, 'How this guide differs')
    .replace(/\bUse\s+Blog\s+#?\d+\s*,\s*/gi, 'Use ')
    .replace(INTERNAL_BLOG_REFERENCE_WITH_PUNCTUATION, '')
    .replace(/\bBlog\s+#?\d+\s+owns\b/gi, 'This guide covers')
    .replace(/\bBlog\s+#?\d+\s+asks\b/gi, 'This guide asks')
    .replace(/^\s*Blog\s+#?\d+\b/i, 'This guide')
    .replace(INTERNAL_BLOG_REFERENCE, 'this guide');
}

function removeInternalSeoOwnershipLanguage(content: string): string {
  return content
    .replace(
      /\bThis\s+article\s+is\s+the\s+\*\*([^*]+?)\s+owner\*\*\s*:/gi,
      'This guide focuses on **$1**:',
    )
    .replace(
      /\bThis\s+guide\s+owns\s+(?:the\s+)?\*\*([^*]+?)\*\*(?:\s+intent)?/gi,
      'This guide focuses on **$1**',
    )
    .replace(
      /\bThis\s+page\s+owns\s+(?:the\s+)?\*\*([^*]+?)\*\*(?:\s+intent)?/gi,
      'This page focuses on **$1**',
    )
    .replace(
      /\bThat\s+page\s+owns\s+the\s+([^.!?]+?)\s+so\s+this\s+guide\s+does\s+not\s+duplicate\s+it\./gi,
      'That page focuses on the $1, while this guide stays focused on its main topic.',
    )
    .replace(/\bchoose\s+the\s+right\s+owner\b/gi, 'choose the right guide');
}

export function cleanBlogText(content: string): string {
  const original = String(content || '').trim();

  if (BOOK_QUERY_ONLY.test(original)) {
    return '[Book a free Tiny Steps assessment](/book-demo)';
  }

  const readerFacing = removeInternalSeoOwnershipLanguage(removeInternalBlogNumbering(original));
  const markdownReady = readerFacing.replace(
    RAW_ACTION_ROUTE,
    (_match, verb: string, label: string, route: string) => `[${verb} ${label.trim()}](${route})`,
  );

  return normalizeSeoRecoveryInternalHref(markdownReady);
}

export function cleanBlogBlock(block: BlogBlock): BlogBlock {
  const original = String(block.content || '').trim();

  if (FAQ_TEMPLATE_HEADING.test(original)) {
    return { ...block, content: 'Frequently Asked Questions' };
  }

  return { ...block, content: cleanBlogText(original) };
}

export function applyBlogEditorialCleanup(post: BlogPost): BlogPost {
  const seriesLabel = post.seriesLabel || getWeekSeriesLabel(post.slug) || undefined;

  return {
    ...post,
    title: cleanBlogTitle(post.title),
    seriesLabel,
    body: post.body.map(cleanBlogBlock),
  };
}
