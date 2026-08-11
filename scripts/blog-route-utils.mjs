import fs from 'fs';
import path from 'path';
import { isRedirectedBlogSlug } from '../src/lib/blogIndexingPolicy.js';

export function listFilesRecursive(dir, ext = '.ts') {
  try {
    const out = [];
    const stack = [dir];

    while (stack.length > 0) {
      const current = stack.pop();
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const fullPath = path.join(current, entry.name);
        if (entry.isDirectory()) {
          stack.push(fullPath);
        } else if (entry.isFile() && entry.name.endsWith(ext)) {
          out.push(fullPath);
        }
      }
    }

    return out.sort();
  } catch {
    return [];
  }
}

export function extractBlogEntriesFromPostFiles(postsDir) {
  const entries = [];

  for (const filePath of listFilesRecursive(postsDir, '.ts')) {
    try {
      const src = fs.readFileSync(filePath, 'utf-8');
      const slugMatch = src.match(/slug\s*:\s*['"`]([^'"`]+)['"`]/);
      if (!slugMatch) continue;

      const slug = slugMatch[1];
      // A redirect source must not be emitted as a prerendered static article.
      // Leaving a physical dist/blog/<slug>/index.html would shadow the Hosting
      // catch-all that returns the permanent canonical redirect.
      if (isRedirectedBlogSlug(slug)) continue;

      const dateMatch = src.match(/date\s*:\s*['"`]([0-9]{4}-[0-9]{2}-[0-9]{2})['"`]/);
      entries.push({
        slug,
        date: dateMatch ? dateMatch[1] : null,
        sourcePath: filePath,
      });
    } catch {
      // Ignore malformed files and keep scanning the tree.
    }
  }

  return entries;
}

export function listMdxEntries(dir) {
  try {
    return fs
      .readdirSync(dir)
      .filter((file) => file.endsWith('.mdx'))
      .map((file) => ({
        slug: file.replace(/\.mdx$/, ''),
        sourcePath: path.join(dir, file),
      }))
      .filter((entry) => !isRedirectedBlogSlug(entry.slug));
  } catch {
    return [];
  }
}
