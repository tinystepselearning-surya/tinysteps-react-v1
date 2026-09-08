#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  PHONICS_EXPECTED_AUDIO_FILES,
  PHONICS_SOUND_CATEGORIES,
  PHONICS_SOUND_REGISTRY,
} from '../src/lib/phonicsSoundRegistry.js';
import {
  PHONICS_WORD_UTILITY_RECORDS,
  getPhonicsWordSoundCategories,
  getPhonicsWordUtility,
} from '../src/lib/phonicsWordUtilityRegistry.js';
import { PHONICS_PUBLISHED_RESOURCE_PAGES } from '../src/lib/phonicsPublicationRegistry.js';
import { PHONICS_PUBLISHED_EDITORIAL_REVIEW_RECORDS } from '../src/lib/phonicsEditorialReviewRegistry.js';

const root = process.cwd();
const distMode = process.argv.includes('--dist');
const requireAudio = process.argv.includes('--require-audio');
const errors = [];
const warnings = [];
const checks = [];
const fail = (id, detail) => { errors.push({ id, detail }); checks.push({ id, status: 'fail', detail }); };
const pass = (id, detail) => checks.push({ id, status: 'pass', detail });
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

if (PHONICS_SOUND_CATEGORIES.length !== 8) fail('sound-categories', `Expected 8 supplied categories, found ${PHONICS_SOUND_CATEGORIES.length}.`);
else pass('sound-categories', 'All eight supplied sound families are represented explicitly.');

if (PHONICS_SOUND_REGISTRY.length !== 56 || new Set(PHONICS_SOUND_REGISTRY.map((sound) => sound.id)).size !== 56) {
  fail('sound-registry', `Expected 56 unique semantic sound records, found ${PHONICS_SOUND_REGISTRY.length}.`);
} else pass('sound-registry', '56 semantic sound records map to the supplied recording filenames.');

if (new Set(PHONICS_EXPECTED_AUDIO_FILES).size !== PHONICS_EXPECTED_AUDIO_FILES.length) fail('audio-files', 'Primary audio manifest contains duplicate filenames.');
const audioDirectory = path.join(root, 'public/games/phonics/sounds');
const presentAudio = PHONICS_EXPECTED_AUDIO_FILES.filter((file) => fs.existsSync(path.join(audioDirectory, file)));
const missingAudio = PHONICS_EXPECTED_AUDIO_FILES.filter((file) => !fs.existsSync(path.join(audioDirectory, file)));
if (missingAudio.length) {
  const detail = `${missingAudio.length}/${PHONICS_EXPECTED_AUDIO_FILES.length} supplied recordings are not committed under public/games/phonics/sounds yet.`;
  if (requireAudio) fail('audio-upload', detail);
  else warnings.push(detail);
} else pass('audio-upload', `All ${PHONICS_EXPECTED_AUDIO_FILES.length} supplied recordings are present at their canonical paths.`);

if (PHONICS_WORD_UTILITY_RECORDS.length < 70) fail('starter-bank', `Expected at least 70 explicit word maps, found ${PHONICS_WORD_UTILITY_RECORDS.length}.`);
else pass('starter-bank', `${PHONICS_WORD_UTILITY_RECORDS.length} explicit starter word maps are available without automatic segmentation.`);

const usedCategories = new Set(PHONICS_WORD_UTILITY_RECORDS.flatMap((record) => getPhonicsWordSoundCategories(record)));
for (const category of PHONICS_SOUND_CATEGORIES) if (!usedCategories.has(category)) fail('category-coverage', `Starter word bank does not exercise ${category}.`);
if (!errors.some((error) => error.id === 'category-coverage')) pass('category-coverage', 'Starter words exercise all eight sound families.');

for (const record of PHONICS_WORD_UTILITY_RECORDS) {
  if (record.humanReviewState !== 'pending') fail('word-review', `${record.word} must remain pending until a real human review occurs.`);
  if (record.segments.map((segment) => segment.grapheme).join('') !== record.word) fail('segmentation', `${record.word} does not reconstruct from its explicit grapheme chunks.`);
}
if (!errors.some((error) => ['word-review', 'segmentation'].includes(error.id))) pass('word-governance', 'Every starter word is explicit and remains pending human review.');

const cowOw = getPhonicsWordUtility('cow')?.segments.find((segment) => segment.grapheme === 'ow')?.soundId;
const snowOw = getPhonicsWordUtility('snow')?.segments.find((segment) => segment.grapheme === 'ow')?.soundId;
if (cowOw !== 'ou-ow' || snowOw !== 'long-o') fail('ambiguous-spelling', `Expected explicit OW readings cow=ou-ow and snow=long-o, found ${cowOw}/${snowOw}.`);
else pass('ambiguous-spelling', 'Ambiguous OW readings are selected word-by-word instead of guessed from spelling.');

if (PHONICS_PUBLISHED_RESOURCE_PAGES.length !== 31) fail('r12-regression', `R13 must preserve the governed 31-page R12 publication set; found ${PHONICS_PUBLISHED_RESOURCE_PAGES.length}.`);
const reviewCounts = PHONICS_PUBLISHED_EDITORIAL_REVIEW_RECORDS.reduce((acc, record) => {
  acc[record.editorialReviewStatus] = (acc[record.editorialReviewStatus] || 0) + 1;
  return acc;
}, {});
if (PHONICS_PUBLISHED_EDITORIAL_REVIEW_RECORDS.length !== 31 || reviewCounts.pending !== 31 || reviewCounts.approved || reviewCounts['changes-requested']) {
  fail('r12-reviews', `R13 must not alter R12 review truth: ${JSON.stringify(reviewCounts)}.`);
} else pass('r12-regression', 'R12 remains 31 published resources with 31 pending review records.');

const gridSource = read('src/components/resources/PhonicsPilotGuideGrid.tsx');
const utilitySource = read('src/components/resources/PhonicsWordSoundUtility.tsx');
const soundBoxSource = read('src/components/resources/PhonicsSoundBox.tsx');
for (const token of ['PhonicsWordSoundUtility', '<PhonicsWordSoundUtility />']) if (!gridSource.includes(token)) fail('hub-integration', `Hub integration missing ${token}.`);
for (const token of ['The tool never guesses an unknown word from spelling.', 'no automatic word-page publishing', 'natural whole-word blending']) if (!utilitySource.includes(token)) fail('utility-guardrail', `Utility source missing ${token}.`);
if (!soundBoxSource.includes('getPhonicsSoundAudioCandidates') || !soundBoxSource.includes('Audio coming soon')) fail('audio-fallback', 'Reusable sound box must use canonical audio candidates and a graceful missing-audio state.');
if (!errors.some((error) => ['hub-integration', 'utility-guardrail', 'audio-fallback'].includes(error.id))) pass('runtime-integration', 'Phonics hub embeds the reusable word/sound utility with explicit no-guess/no-fake-blending guardrails.');

const manifestSource = read('src/lib/publicRouteManifest.js');
if (/\/resources\/phonics\/(?:word|words)\//.test(manifestSource)) fail('word-url-publication', 'R13 must not publish mass individual word URLs.');
else pass('word-url-publication', 'R13 adds utility value inside the existing hub without publishing individual word URLs.');

if (distMode) {
  const hubFile = path.join(root, 'dist/resources/phonics/index.html');
  if (!fs.existsSync(hubFile)) fail('rendered-hub', 'dist/resources/phonics/index.html is missing.');
  else {
    const html = fs.readFileSync(hubFile, 'utf8');
    for (const token of ['data-resource-word-utility="r13"', 'Break a word into stored sound chunks', 'Selected word', '>ship<']) {
      if (!html.includes(token)) fail('rendered-utility', `Prerendered phonics hub is missing ${token}.`);
    }
  }
  const sitemapPath = path.join(root, 'dist/sitemap-static.xml');
  if (fs.existsSync(sitemapPath)) {
    const sitemap = fs.readFileSync(sitemapPath, 'utf8');
    if (/https:\/\/tinystepslearning\.com\/resources\/phonics\/(?:word|words)\//.test(sitemap)) fail('rendered-word-url', 'Sitemap unexpectedly contains an individual R13 word URL.');
  }
  if (!errors.some((error) => error.id.startsWith('rendered-'))) pass('rendered-utility', 'Prerendered hub contains the utility while keeping individual word URLs unpublished.');
}

const report = {
  brick: 'R13',
  revision: '2026-09-09-r13',
  sounds: PHONICS_SOUND_REGISTRY.length,
  soundCategories: PHONICS_SOUND_CATEGORIES.length,
  starterWords: PHONICS_WORD_UTILITY_RECORDS.length,
  audioExpected: PHONICS_EXPECTED_AUDIO_FILES.length,
  audioPresent: presentAudio.length,
  audioMissing: missingAudio,
  requireAudio,
  distMode,
  r12PublishedPages: PHONICS_PUBLISHED_RESOURCE_PAGES.length,
  reviewCounts,
  checks,
  warnings,
  errors,
};
console.log(JSON.stringify(report, null, 2));
if (process.argv.includes('--report')) {
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'artifacts/resources-r13-word-sound-utility.json'), `${JSON.stringify(report, null, 2)}\n`);
}
if (errors.length) process.exitCode = 1;
else console.log(`PASS: Brick 13 provides ${PHONICS_SOUND_REGISTRY.length} governed sound identities and ${PHONICS_WORD_UTILITY_RECORDS.length} explicit starter word maps without automatic word-page publication.`);
