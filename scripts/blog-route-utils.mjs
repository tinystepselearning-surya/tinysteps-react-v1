import fs from 'fs';
import path from 'path';
import { getPublicBlogSlug } from '../src/lib/blogWeekRenames.js';

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

      const sourceSlug = slugMatch[1];
      const dateMatch = src.match(/date\s*:\s*['"`]([0-9]{4}-[0-9]{2}-[0-9]{2})['"`]/);
      entries.push({
        slug: getPublicBlogSlug(sourceSlug),
        sourceSlug,
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
      }));
  } catch {
    return [];
  }
}
