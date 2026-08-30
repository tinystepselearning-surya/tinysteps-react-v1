import type { BlogBlock, BlogPost } from '../types';

const WEEK_TITLE_PREFIX = /^\s*Week\s+\d+\s*(?::|[-–—])\s*/i;
const FAQ_TEMPLATE_HEADING = /^\s*(?:\d+\.\s*)?FAQ section with \d+ parent questions\.?\s*$/i;
const RAW_ACTION_ROUTE = /\b(Explore|Read|Visit|Build|Compare|Try|Play|Book|Start|See|View|Open)\s+([^.:!?]{1,120}?):\s*(\/[a-z0-9](?:[a-z0-9\-_/?.=&%#]*[a-z0-9\-_/#=&%])?)/gi;
const BOOK_QUERY_ONLY = /^\s*\/?\?book=1\s*$/i;
const INTERNAL_BLOG_REFERENCE_WITH_PUNCTUATION = /\bBlog\s+#\d+\s*[:,]\s*/gi;
const INTERNAL_BLOG_REFERENCE = /\bBlog\s+#\d+\b/gi;

export function cleanBlogTitle(title: string): string {
  return String(title || '').replace(WEEK_TITLE_PREFIX, '').trim();
}

export function getWeekSeriesLabel(slug: string): string {
  const match = String(slug || '').trim().match(/^week-(\d+)(?:-|$)/i);
  return match ? `Week ${match[1]} Roadmap` : '';
}

function removeInternalBlogNumbering(content: string): string {
  return content
    .replace(/\bHow\s+Blog\s+#\d+\s+differs\b/gi, 'How this guide differs')
    .replace(/\bUse\s+Blog\s+#\d+\s*,\s*/gi, 'Use ')
    .replace(INTERNAL_BLOG_REFERENCE_WITH_PUNCTUATION, '')
    .replace(/\bBlog\s+#\d+\s+owns\b/gi, 'This guide covers')
    .replace(/\bBlog\s+#\d+\s+asks\b/gi, 'This guide asks')
    .replace(INTERNAL_BLOG_REFERENCE, 'this guide');
}

export function cleanBlogText(content: string): string {
  const original = String(content || '').trim();

  if (BOOK_QUERY_ONLY.test(original)) {
    return '[Book a free Tiny Steps assessment](/book-demo)';
  }

  const readerFacing = removeInternalBlogNumbering(original);

  return readerFacing.replace(
    RAW_ACTION_ROUTE,
    (_match, verb: string, label: string, route: string) => `[${verb} ${label.trim()}](${route})`,
  );
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
