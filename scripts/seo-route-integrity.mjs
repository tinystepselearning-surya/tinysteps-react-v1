#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  INDEXABLE_PUBLIC_ROUTES,
  PUBLIC_ROUTE_MANIFEST,
  REDIRECT_ROUTE_MANIFEST,
} from '../src/lib/publicRouteManifest.js';
import { ROUTE_SEO_REGISTRY } from '../src/lib/routeSeoRegistry.js';

const ROOT = process.cwd();
const failures = [];
const ok = (message) => console.log(`✓ ${message}`);
const fail = (message) => failures.push(message);

const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
const exists = (relativePath) => fs.existsSync(path.join(ROOT, relativePath));
const routeToHtml = (routePath) => routePath === '/'
  ? 'dist/index.html'
  : `dist${routePath}/index.html`;

function collectSitemapLocations() {
  const files = fs.readdirSync(path.join(ROOT, 'public'))
    .filter((name) => /^sitemap(?:-[a-z]+)?\.xml$/i.test(name));
  const locations = new Set();
  for (const file of files) {
    const xml = read(`public/${file}`);
    for (const match of xml.matchAll(/<loc>(https:\/\/tinystepslearning\.com[^<]+)<\/loc>/g)) {
      locations.add(match[1]);
    }
  }
  return locations;
}

function validateManifest() {
  const paths = PUBLIC_ROUTE_MANIFEST.map((route) => route.path);
  const duplicates = paths.filter((value, index) => paths.indexOf(value) !== index);
  if (duplicates.length) fail(`Duplicate manifest paths: ${[...new Set(duplicates)].join(', ')}`);
  else ok('Public route manifest has no duplicate paths');

  for (const route of PUBLIC_ROUTE_MANIFEST) {
    if (!route.path.startsWith('/')) fail(`Manifest path must start with /: ${route.path}`);
    if (!['static', 'parents'].includes(route.group)) fail(`Unsupported sitemap group for ${route.path}: ${route.group}`);
  }
}

function validateRegistry() {
  for (const route of PUBLIC_ROUTE_MANIFEST) {
    const config = ROUTE_SEO_REGISTRY[route.path];
    if (!config) {
      fail(`SEO registry missing manifest route: ${route.path}`);
      continue;
    }
    const robots = String(config.robots || 'index, follow').toLowerCase();
    if (route.indexable && robots.includes('noindex')) {
      fail(`Indexable manifest route is noindex in registry: ${route.path}`);
    }
    if (!route.indexable && !robots.includes('noindex')) {
      fail(`Non-indexable manifest route must be noindex in registry: ${route.path}`);
    }
  }
  ok('SEO registry comparison completed');
}

function validateSitemaps() {
  const locations = collectSitemapLocations();
  for (const routePath of INDEXABLE_PUBLIC_ROUTES) {
    const url = `https://tinystepslearning.com${routePath === '/' ? '/' : routePath}`;
    if (!locations.has(url)) fail(`Indexable route missing from sitemap XML: ${routePath}`);
  }
  for (const route of PUBLIC_ROUTE_MANIFEST.filter((entry) => !entry.indexable)) {
    const url = `https://tinystepslearning.com${route.path}`;
    if (locations.has(url)) fail(`Noindex route must not appear in sitemap XML: ${route.path}`);
  }
  ok('Sitemap coverage comparison completed');
}

function validatePrerenderOutput() {
  if (!exists('dist/index.html')) {
    fail('dist/ is missing; run npm run build before the full integrity check');
    return;
  }
  for (const route of PUBLIC_ROUTE_MANIFEST.filter((entry) => entry.prerender)) {
    const output = routeToHtml(route.path);
    if (!exists(output)) fail(`Prerender output missing: ${output}`);
  }
  ok('Prerender output comparison completed');
}

function validateHosting() {
  const firebase = JSON.parse(read('firebase.json'));
  const redirects = firebase.hosting?.redirects || [];
  const rewrites = firebase.hosting?.rewrites || [];

  for (const expected of REDIRECT_ROUTE_MANIFEST) {
    const actual = redirects.find((redirect) => redirect.source === expected.source);
    if (!actual) fail(`Firebase redirect missing: ${expected.source}`);
    else if (actual.destination !== expected.destination || actual.type !== expected.status) {
      fail(`Firebase redirect mismatch: ${expected.source} -> ${expected.destination} (${expected.status})`);
    }
  }

  const catchAll = rewrites.find((rewrite) => rewrite.source === '**');
  if (!catchAll?.function || catchAll.function.functionId !== 'notFoundRoute') {
    fail('Final Firebase ** rewrite must call notFoundRoute to return a genuine HTTP 404');
  }

  const requiredSpaRewrites = [
    '/login', '/surya/**', '/teacher/**', '/parent/**', '/kids/**', '/messages/**',
    '/learning-partner/**', '/learningpartner/**', '/dev/**', '/unauthorized',
  ];
  for (const source of requiredSpaRewrites) {
    const rewrite = rewrites.find((entry) => entry.source === source && entry.destination === '/index.html');
    if (!rewrite) fail(`SPA rewrite missing before 404 catch-all: ${source}`);
  }
  ok('Firebase hosting redirect and 404 comparison completed');
}

validateManifest();
validateRegistry();
validateSitemaps();
validatePrerenderOutput();
validateHosting();

if (failures.length) {
  console.error(`\nSEO route integrity failed with ${failures.length} issue(s):`);
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}

console.log('\nSEO route integrity passed.');
