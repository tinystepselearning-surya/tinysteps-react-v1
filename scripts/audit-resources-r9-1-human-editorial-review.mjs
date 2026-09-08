#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  PHONICS_EDITORIAL_REVIEW_RECORDS,
  PHONICS_EDITORIAL_REVIEW_STATUSES,
  PHONICS_EDITORIAL_REVIEWER_KEYS,
} from '../src/lib/phonicsEditorialReviewRegistry.js';
import {
  PHONICS_PROGRAMMATIC_PILOT_PAGES,
} from '../src/lib/phonicsProgrammaticPilot.js';

const root = process.cwd();
const distMode = process.argv.includes('--dist');
const errors = [];
const warnings = [];
const fail = (code, id, detail) => errors.push({ code, id, detail });
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const pagesByConcept = new Map(PHONICS_PROGRAMMATIC_PILOT_PAGES.map((page) => [page.conceptId, page]));
const pagesByPath = new Map(PHONICS_PROGRAMMATIC_PILOT_PAGES.map((page) => [page.path, page]));
const allowedStatuses = new Set(PHONICS_EDITORIAL_REVIEW_STATUSES);
const allowedReviewers = new Set(PHONICS_EDITORIAL_REVIEWER_KEYS);

if (PHONICS_EDITORIAL_REVIEW_RECORDS.length !== PHONICS_PROGRAMMATIC_PILOT_PAGES.length) {
  fail('record-count', 'ledger', `Expected ${PHONICS_PROGRAMMATIC_PILOT_PAGES.length} review records, found ${PHONICS_EDITORIAL_REVIEW_RECORDS.length}.`);
}
for (const key of ['conceptId', 'path']) {
  const values = PHONICS_EDITORIAL_REVIEW_RECORDS.map((record) => record[key]);
  if (new Set(values).size !== values.length) fail('duplicate-review-record', key, 'Review ledger keys must be unique.');
}

for (const record of PHONICS_EDITORIAL_REVIEW_RECORDS) {
  const page = pagesByConcept.get(record.conceptId);
  if (!page) {
    fail('unknown-concept', record.conceptId, 'Review record does not map to an approved Brick 9 page.');
    continue;
  }
  if (page.path !== record.path || pagesByPath.get(record.path)?.conceptId !== record.conceptId) {
    fail('page-mismatch', record.conceptId, `${record.path} does not match the Brick 9 publication ledger.`);
  }
  if (!allowedStatuses.has(record.editorialReviewStatus)) fail('invalid-status', record.conceptId, record.editorialReviewStatus);
  if (!allowedReviewers.has(record.reviewerKey)) fail('invalid-reviewer', record.conceptId, record.reviewerKey);

  if (record.editorialReviewStatus === 'approved') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(record.reviewedAt || '')) fail('approved-missing-date', record.conceptId, String(record.reviewedAt));
    if (record.reviewedRevision !== page.reviewedRevision) fail('approved-revision-drift', record.conceptId, `${record.reviewedRevision} !== ${page.reviewedRevision}`);
    if (!String(record.reviewNotes || '').trim()) warnings.push({ code: 'approved-without-notes', id: record.conceptId, detail: 'A concise review note is recommended for auditability.' });
  } else {
    if (record.reviewedAt !== null) fail('false-review-date', record.conceptId, 'Non-approved record cannot have reviewedAt.');
    if (record.reviewedRevision !== null) fail('false-review-revision', record.conceptId, 'Non-approved record cannot have reviewedRevision.');
  }
  if (record.editorialReviewStatus === 'changes-requested' && !String(record.reviewNotes || '').trim()) {
    fail('changes-without-notes', record.conceptId, 'Changes-requested must explain what needs correction.');
  }
}

for (const page of PHONICS_PROGRAMMATIC_PILOT_PAGES) {
  if (!PHONICS_EDITORIAL_REVIEW_RECORDS.some((record) => record.conceptId === page.conceptId && record.path === page.path)) {
    fail('missing-review-record', page.conceptId, page.path);
  }
}

const pageSource = read('src/pages/PhonicsKnowledgePage.tsx');
const reviewerSource = read('src/lib/editorialReviewerRegistry.ts');
const knowledgeDeclaration = read('src/content/phonicsKnowledge/index.d.ts');
if (!pageSource.includes('getApprovedPhonicsEditorialReview(page.path)')) fail('conditional-review-lookup', 'PhonicsKnowledgePage.tsx', 'Page must use the approved-only review resolver.');
if (!pageSource.includes('Reviewed for phonics accuracy by')) fail('visible-attribution', 'PhonicsKnowledgePage.tsx', 'Approved reviews need visible attribution.');
if (!pageSource.includes("reviewedBy: { '@id': reviewer.personId }")) fail('schema-attribution', 'PhonicsKnowledgePage.tsx', 'Approved reviews need matching reviewedBy entity reference.');
if (!reviewerSource.includes('PUBLIC_FACTS.founder.fullName') || !reviewerSource.includes('FOUNDER_PROFILE_PATH') || !reviewerSource.includes('FOUNDER_ID')) fail('canonical-reviewer-entity', 'editorialReviewerRegistry.ts', 'Reviewer identity must resolve from the existing canonical founder contract.');
for (const token of ['reviewedBy', 'reviewedAt', 'editorialReviewStatus']) if (knowledgeDeclaration.includes(token)) fail('brick8-governance-leak', token, 'Human review metadata belongs in R9.1, not Brick 8.');

if (distMode) {
  for (const record of PHONICS_EDITORIAL_REVIEW_RECORDS) {
    const page = pagesByConcept.get(record.conceptId);
    if (!page) continue;
    const htmlPath = path.join(root, 'dist', ...page.path.slice(1).split('/'), 'index.html');
    if (!fs.existsSync(htmlPath)) {
      fail('missing-prerender', page.path, htmlPath);
      continue;
    }
    const html = fs.readFileSync(htmlPath, 'utf8');
    const visibleClaim = html.includes('Reviewed for phonics accuracy by');
    const schemaClaim = html.includes('"reviewedBy"');
    if (record.editorialReviewStatus === 'approved') {
      if (!visibleClaim) fail('approved-visible-claim-missing', record.conceptId, page.path);
      if (!schemaClaim) fail('approved-schema-claim-missing', record.conceptId, page.path);
      if (!record.reviewedAt || !html.includes(record.reviewedAt.slice(0, 4))) fail('approved-date-missing', record.conceptId, page.path);
    } else {
      if (visibleClaim) fail('unapproved-visible-claim', record.conceptId, page.path);
      if (schemaClaim) fail('unapproved-schema-claim', record.conceptId, page.path);
    }
  }
}

const approved = PHONICS_EDITORIAL_REVIEW_RECORDS.filter((record) => record.editorialReviewStatus === 'approved');
const pending = PHONICS_EDITORIAL_REVIEW_RECORDS.filter((record) => record.editorialReviewStatus === 'pending');
const changesRequested = PHONICS_EDITORIAL_REVIEW_RECORDS.filter((record) => record.editorialReviewStatus === 'changes-requested');
const summary = {
  pilotPages: PHONICS_PROGRAMMATIC_PILOT_PAGES.length,
  reviewRecords: PHONICS_EDITORIAL_REVIEW_RECORDS.length,
  approved: approved.length,
  pending: pending.length,
  changesRequested: changesRequested.length,
  errors: errors.length,
  warnings: warnings.length,
};

console.log(JSON.stringify({ summary, errors, warnings }, null, 2));
if (process.argv.includes('--report')) {
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'artifacts/resources-r9-1-human-editorial-review.json'), JSON.stringify({ summary, errors, warnings }, null, 2) + '\n');
}
if (errors.length) process.exitCode = 1;
else console.log(`PASS: R9.1 review governance covers ${summary.reviewRecords} pilot pages with ${summary.approved} approved, ${summary.pending} pending and ${summary.changesRequested} changes-requested records.`);
