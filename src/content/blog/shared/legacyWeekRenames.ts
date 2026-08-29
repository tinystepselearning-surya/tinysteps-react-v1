import type { BlogPost } from '../types';
import {
  LEGACY_WEEK_BLOG_RENAMES,
  LEGACY_WEEK_PUBLIC_SLUGS,
  rewriteLegacyWeekBlogPaths,
} from '../../../lib/blogWeekRenames.js';

export { LEGACY_WEEK_BLOG_RENAMES, LEGACY_WEEK_PUBLIC_SLUGS, rewriteLegacyWeekBlogPaths };

/**
 * Apply the evergreen public identity after source-level editorial enrichment.
 * Source filenames/slugs remain internal historical metadata; website routes,
 * cards, schema and internal blog links use the cleaned public identity.
 */
export function applyLegacyWeekBlogRename(post: BlogPost): BlogPost {
  const rename = LEGACY_WEEK_BLOG_RENAMES[post.slug];
  const renamedPost = rename ? { ...post, slug: rename.slug, title: rename.title } : post;

  return {
    ...renamedPost,
    metaDescription: renamedPost.metaDescription
      ? rewriteLegacyWeekBlogPaths(renamedPost.metaDescription)
      : renamedPost.metaDescription,
    excerpt: rewriteLegacyWeekBlogPaths(renamedPost.excerpt),
    body: renamedPost.body.map((block) => ({
      ...block,
      content: rewriteLegacyWeekBlogPaths(block.content),
    })),
    faq: renamedPost.faq?.map((item) => ({
      question: rewriteLegacyWeekBlogPaths(item.question),
      answer: rewriteLegacyWeekBlogPaths(item.answer),
    })),
  };
}
