#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { PHONICS_KNOWLEDGE_DATASET } from '../src/content/phonicsKnowledge/index.js';
import { extractBlogEntriesFromPostFiles, listMdxEntries } from './blog-route-utils.mjs';
import { validatePhonicsKnowledge } from './phonics-knowledge-validation.mjs';
import { auditKnowledgePublicSurfaces, getR8ChangedPaths, validateR8ChangedPaths } from './phonics-knowledge-route-safety.mjs';

const root = process.cwd();
const posts = extractBlogEntriesFromPostFiles(path.join(root, 'src/content/blog/posts'));
const mdx = listMdxEntries(path.join(root, 'src/content/blog'));
const blogPaths = [...posts.flatMap((p) => [`/blog/${p.slug}`, `/blog/${p.sourceSlug}`]), ...mdx.map((p) => `/blog/${p.slug}`)];
const result = validatePhonicsKnowledge({ blogPaths });
if (!posts.length) result.errors.push({ code: 'missing-blog-source', id: 'blog', detail: 'Cannot certify ownership without the editorial library.' });
result.errors.push(...auditKnowledgePublicSurfaces(root, PHONICS_KNOWLEDGE_DATASET, { dist: process.argv.includes('--dist') }));
const baseIndex = process.argv.indexOf('--base');
const base = baseIndex >= 0 ? process.argv[baseIndex + 1] : process.env.R8_BASE_SHA;
if (base) {
  try { result.errors.push(...validateR8ChangedPaths(getR8ChangedPaths(root, base))); }
  catch (error) { result.errors.push({ code: 'git-delta-unavailable', id: base, detail: error.message }); }
} else result.warnings.push('Git delta check not requested; run with --base <PR base SHA> to certify zero changes to public publishing surfaces.');
console.log(JSON.stringify(result, null, 2));
if (process.argv.includes('--report')) {
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'artifacts/resources-r8-phonics-knowledge.json'), JSON.stringify(result, null, 2) + '\n');
}
if (result.errors.length) process.exitCode = 1;
else console.log(`PASS: ${result.summary.totalConcepts} concepts; ${result.summary.curriculumReferences} curriculum references; zero ownership/slug collisions and zero candidate public URLs.`);
