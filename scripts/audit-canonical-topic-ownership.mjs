#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  CANONICAL_TOPIC_OWNER_ROLES,
  CANONICAL_TOPIC_OWNERSHIP,
  CANONICAL_TOPIC_SUBJECTS,
} from '../src/lib/canonicalTopicOwnershipRegistry.js';
import { RESOURCE_SEARCH_INTENTS } from '../src/lib/resourcesArchitectureRegistry.js';
import { PUBLIC_REDIRECT_MANIFEST, PUBLIC_ROUTE_MANIFEST } from '../src/lib/publicRouteManifest.js';

const ROOT = process.cwd();
const BLOG_POSTS_DIR = path.join(ROOT, 'src', 'content', 'blog', 'posts');
const SUBJECT_HUBS = new Set(['/resources/phonics', '/resources/grammar', '/resources/speaking']);
const routePaths = new Set(PUBLIC_ROUTE_MANIFEST.map((entry) => entry.path));
const redirectSources = new Set(PUBLIC_REDIRECT_MANIFEST.map((entry) => entry.source));
const subjects = new Set(CANONICAL_TOPIC_SUBJECTS);
const roles = new Set(CANONICAL_TOPIC_OWNER_ROLES);
const intents = new Set(RESOURCE_SEARCH_INTENTS);
let failures = 0;

function fail(message) {
  failures += 1;
  console.error(`FAIL: ${message}`);
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

function pathnameOnly(value) {
  return String(value || '').split(/[?#]/, 1)[0];
}

function isNormalizedPath(value) {
  const pathname = pathnameOnly(value);
  return pathname === '/' || (/^\/[a-z0-9][a-z0-9/_-]*$/.test(pathname) && !pathname.endsWith('/'));
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (/\.(ts|tsx|mdx)$/.test(entry.name)) files.push(absolute);
  }
  return files;
}

const blogFiles = await walk(BLOG_POSTS_DIR);
const blogSource = (await Promise.all(blogFiles.map((file) => fs.readFile(file, 'utf8')))).join('\n');

function blogSlugExists(slug) {
  const escaped = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`slug\\s*:\\s*['\"]${escaped}['\"]`).test(blogSource);
}

const ids = new Set();
const normalizedQueries = new Set();
const ownerPaths = new Set();

for (const entry of CANONICAL_TOPIC_OWNERSHIP) {
  if (ids.has(entry.id)) fail(`Duplicate topic id: ${entry.id}`);
  ids.add(entry.id);

  if (!subjects.has(entry.subject)) fail(`Unsupported subject for ${entry.id}: ${entry.subject}`);
  if (!roles.has(entry.ownerRole)) fail(`Unsupported owner role for ${entry.id}: ${entry.ownerRole}`);
  if (!intents.has(entry.intent)) fail(`Unsupported search intent for ${entry.id}: ${entry.intent}`);
  if (!String(entry.queryIntent || '').trim()) fail(`Missing query intent for ${entry.id}`);
  if (!isNormalizedPath(entry.ownerPath)) fail(`Owner path is not normalized for ${entry.id}: ${entry.ownerPath}`);
  if (redirectSources.has(entry.ownerPath)) fail(`Owner path is a redirect source for ${entry.id}: ${entry.ownerPath}`);

  const queryKey = String(entry.queryIntent || '').trim().toLowerCase();
  if (normalizedQueries.has(queryKey)) fail(`Duplicate query-intent ownership: ${entry.queryIntent}`);
  normalizedQueries.add(queryKey);
  ownerPaths.add(entry.ownerPath);

  if (entry.ownerPath.startsWith('/blog/')) {
    const slug = entry.ownerPath.slice('/blog/'.length);
    if (!blogSlugExists(slug)) fail(`Blog owner does not exist in source for ${entry.id}: ${entry.ownerPath}`);
  } else if (!routePaths.has(entry.ownerPath)) {
    fail(`Static owner is missing from public route manifest for ${entry.id}: ${entry.ownerPath}`);
  }

  if (entry.hubPath && !routePaths.has(entry.hubPath)) {
    fail(`Hub path is missing from public route manifest for ${entry.id}: ${entry.hubPath}`);
  }

  const isR9PhonicsSkillGuide = /^r9-phonics-/.test(entry.id)
    && entry.ownerPath.startsWith('/resources/phonics/')
    && entry.ownerRole === 'skill-guide'
    && entry.intent === 'informational'
    && entry.hubPath === '/resources/phonics';
  if (entry.ownerPath.startsWith('/resources/') && entry.ownerRole !== 'subject-hub' && !isR9PhonicsSkillGuide) {
    fail(`Resources child route cannot own non-discovery intent for ${entry.id}: ${entry.ownerPath}`);
  }
  if (entry.ownerRole === 'subject-hub' && !SUBJECT_HUBS.has(entry.ownerPath)) {
    fail(`Subject-hub owner is not one of the approved subject hubs for ${entry.id}: ${entry.ownerPath}`);
  }
  if (SUBJECT_HUBS.has(entry.ownerPath) && entry.ownerRole !== 'subject-hub') {
    fail(`Subject hub is competing for a non-discovery topic for ${entry.id}: ${entry.ownerPath}`);
  }
  if (['commercial', 'high-commercial', 'solution-aware'].includes(entry.intent) && SUBJECT_HUBS.has(entry.ownerPath)) {
    fail(`Commercial/solution intent cannot be owned by a Resources subject hub for ${entry.id}`);
  }

  const supportSeen = new Set();
  for (const supportPath of entry.supportingPaths || []) {
    if (!isNormalizedPath(supportPath)) fail(`Supporting path is not normalized for ${entry.id}: ${supportPath}`);
    const support = pathnameOnly(supportPath);
    if (support === entry.ownerPath) fail(`Owner is repeated as supporting path for ${entry.id}: ${support}`);
    if (supportSeen.has(supportPath)) fail(`Duplicate supporting path for ${entry.id}: ${supportPath}`);
    supportSeen.add(supportPath);
    if (redirectSources.has(support)) fail(`Supporting path is a redirect source for ${entry.id}: ${support}`);
    if (support.startsWith('/blog/')) {
      const slug = support.slice('/blog/'.length);
      if (!blogSlugExists(slug)) fail(`Supporting blog path does not exist for ${entry.id}: ${support}`);
    } else if (support !== '/blog' && !routePaths.has(support)) {
      fail(`Supporting static path is missing from manifest for ${entry.id}: ${support}`);
    }
  }

  for (const forbidden of entry.forbiddenCompetingOwners || []) {
    if (forbidden === entry.ownerPath) fail(`Owner cannot forbid itself for ${entry.id}`);
    if (!SUBJECT_HUBS.has(forbidden)) fail(`Only subject hubs may be declared forbidden competing owners in R5: ${entry.id} -> ${forbidden}`);
  }
}

const requiredOwnerPaths = [
  '/resources', '/blog', '/parents', '/free-english-games-for-kids', '/for-schools', '/book-demo',
  '/resources/phonics', '/phonics', '/phonics-fees-india', '/best-online-phonics-classes-for-kids-in-india',
  '/resources/grammar', '/grammar', '/writing-classes-for-kids',
  '/resources/speaking', '/speaking', '/spoken-english-classes-for-kids-online',
];
for (const required of requiredOwnerPaths) {
  if (!ownerPaths.has(required)) fail(`Required canonical owner is missing from R5 registry: ${required}`);
}

if (failures > 0) {
  console.error(`\nCanonical topic ownership audit failed with ${failures} error(s).`);
  process.exit(1);
}

pass(`${CANONICAL_TOPIC_OWNERSHIP.length} topic intents have explicit single-owner policy`);
pass('Resources subject hubs own discovery only; commercial, diagnostic, editorial, and practice ownership remains separate');
pass('All canonical owners and supporting paths resolve to current public routes or existing blog source');
console.log('\nCanonical topic ownership audit passed.');
