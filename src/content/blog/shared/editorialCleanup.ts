import type { BlogBlock, BlogPost } from '../types';

const WEEK_TITLE_PREFIX = /^\s*Week\s+\d+\s*:\s*/i;
const RAW_ROUTE_ONLY = /^\s*(Explore|Read|Visit)\s+(.+?):\s*\/(grammar|phonics|speaking|parents|courses)\s*$/i;

export function cleanBlogTitle(title: string): string {
  return String(title || '').replace(WEEK_TITLE_PREFIX, '').trim();
}

export function cleanBlogBlock(block: BlogBlock): BlogBlock {
  const original = String(block.content || '').trim();

  if (/^FAQ section with \d+ parent questions\.?$/i.test(original)) {
    return { ...block, content: 'Frequently Asked Questions' };
  }

  if (original === '/?book=1' || /^(Book|Start).+\/?\?book=1$/i.test(original)) {
    return { ...block, content: 'Book a free Tiny Steps assessment to choose the right next step.' };
  }

  const rawRoute = original.match(RAW_ROUTE_ONLY);
  if (rawRoute) {
    const [, verb, label] = rawRoute;
    return { ...block, content: `${verb} ${label}.` };
  }

  return block;
}

export function applyBlogEditorialCleanup(post: BlogPost): BlogPost {
  return {
    ...post,
    title: cleanBlogTitle(post.title),
    body: post.body.map(cleanBlogBlock),
  };
}
