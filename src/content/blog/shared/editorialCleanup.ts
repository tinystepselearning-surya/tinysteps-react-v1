import type { BlogBlock, BlogPost } from '../types';

const WEEK_TITLE_PREFIX = /^\s*Week\s+\d+\s*(?::|[-–—])\s*/i;
const FAQ_TEMPLATE_HEADING = /^\s*(?:\d+\.\s*)?FAQ section with \d+ parent questions\.?\s*$/i;
const RAW_ACTION_ROUTE = /\b(Explore|Read|Visit|Build|Compare|Try|Play|Book|Start|See|View|Open)\s+([^.:!?]{1,120}?):\s*(\/[a-z0-9][a-z0-9\-_/?.=&%#]*)/gi;
const BOOK_QUERY_ONLY = /^\s*\/?\?book=1\s*$/i;

export function cleanBlogTitle(title: string): string {
  return String(title || '').replace(WEEK_TITLE_PREFIX, '').trim();
}

export function getWeekSeriesLabel(slug: string): string {
  const match = String(slug || '').trim().match(/^week-(\d+)(?:-|$)/i);
  return match ? `Week ${match[1]} Roadmap` : '';
}

export function cleanBlogText(content: string): string {
  const original = String(content || '').trim();

  if (BOOK_QUERY_ONLY.test(original)) {
    return '[Book a free Tiny Steps assessment](/book-demo)';
  }

  return original.replace(
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
  return {
    ...post,
    title: cleanBlogTitle(post.title),
    body: post.body.map(cleanBlogBlock),
  };
}
