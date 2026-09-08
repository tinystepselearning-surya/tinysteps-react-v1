#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { PHONICS_KNOWLEDGE_DATASET } from '../src/content/phonicsKnowledge/index.js';
import { PHONICS_PROGRAMMATIC_PILOT_PAGES, PHONICS_PROGRAMMATIC_PILOT_PATHS } from '../src/lib/phonicsProgrammaticPilot.js';
import { PHONICS_PUBLISHED_RESOURCE_PAGES, PHONICS_PUBLISHED_RESOURCE_PATHS } from '../src/lib/phonicsPublicationRegistry.js';
import { extractBlogEntriesFromPostFiles, listMdxEntries } from './blog-route-utils.mjs';
import { validatePhonicsKnowledge } from './phonics-knowledge-validation.mjs';
import { auditKnowledgePublicSurfaces, getR8ChangedPaths, validateR8ChangedPaths } from './phonics-knowledge-route-safety.mjs';

const root = process.cwd();
const posts = extractBlogEntriesFromPostFiles(path.join(root, 'src/content/blog/posts'));
const mdx = listMdxEntries(path.join(root, 'src/content/blog'));
const blogPaths = [...posts.flatMap((p) => [`/blog/${p.slug}`, `/blog/${p.sourceSlug}`]), ...mdx.map((p) => `/blog/${p.slug}`)];
const r9Approved = process.argv.includes('--r9-approved');
const r12Approved = process.argv.includes('--r12-approved');
const additiveR12Publication = PHONICS_PUBLISHED_RESOURCE_PAGES.length > PHONICS_PROGRAMMATIC_PILOT_PAGES.length;
const approvedPublicationPages = r12Approved || (r9Approved && additiveR12Publication) ? PHONICS_PUBLISHED_RESOURCE_PAGES : r9Approved ? PHONICS_PROGRAMMATIC_PILOT_PAGES : [];
const approvedPaths = r12Approved || (r9Approved && additiveR12Publication) ? PHONICS_PUBLISHED_RESOURCE_PATHS : r9Approved ? PHONICS_PROGRAMMATIC_PILOT_PATHS : [];
const result = validatePhonicsKnowledge({ blogPaths, approvedPublicationPages });
if (r9Approved && PHONICS_PROGRAMMATIC_PILOT_PAGES.length !== 16) result.errors.push({ code: 'r9-pilot-drift', id: 'R9', detail: `Expected the historical 16-page pilot, found ${PHONICS_PROGRAMMATIC_PILOT_PAGES.length}.` });
if (r12Approved && PHONICS_PUBLISHED_RESOURCE_PAGES.length !== 31) result.errors.push({ code: 'r12-publication-drift', id: 'R12', detail: `Expected the governed 31-page registry, found ${PHONICS_PUBLISHED_RESOURCE_PAGES.length}.` });
if (!posts.length) result.errors.push({ code: 'missing-blog-source', id: 'blog', detail: 'Cannot certify ownership without the editorial library.' });
result.errors.push(...auditKnowledgePublicSurfaces(root, PHONICS_KNOWLEDGE_DATASET, { dist: process.argv.includes('--dist'), approvedPaths }));
const baseIndex = process.argv.indexOf('--base');
const base = baseIndex >= 0 ? process.argv[baseIndex + 1] : process.env.R8_BASE_SHA;
if (base) {
  try { result.errors.push(...validateR8ChangedPaths(getR8ChangedPaths(root, base), { allowApprovedR9: r9Approved || r12Approved, allowApprovedR12: r12Approved || (r9Approved && additiveR12Publication) })); }
  catch (error) { result.errors.push({ code: 'git-delta-unavailable', id: base, detail: error.message }); }
} else result.warnings.push('Git delta check not requested; run with --base <PR base SHA> to certify zero changes to public publishing surfaces.');
console.log(JSON.stringify(result, null, 2));
if (process.argv.includes('--report')) {
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'artifacts/resources-r8-phonics-knowledge.json'), JSON.stringify(result, null, 2) + '\n');
}
if (result.errors.length) process.exitCode = 1;
else console.log(r12Approved
  ? `PASS: ${result.summary.totalConcepts} concepts; ${result.summary.curriculumReferences} curriculum references; only the explicit ${approvedPaths.length}-page R12 publication registry is public.`
  : r9Approved && additiveR12Publication
  ? `PASS: ${result.summary.totalConcepts} concepts; ${result.summary.curriculumReferences} curriculum references; the frozen 16-page R9 pilot remains intact within the explicit ${approvedPaths.length}-page downstream publication registry.`
  : r9Approved
  ? `PASS: ${result.summary.totalConcepts} concepts; ${result.summary.curriculumReferences} curriculum references; only the explicit ${approvedPaths.length}-page R9 approval set is public.`
  : `PASS: ${result.summary.totalConcepts} concepts; ${result.summary.curriculumReferences} curriculum references; zero ownership/slug collisions and zero candidate public URLs.`);
