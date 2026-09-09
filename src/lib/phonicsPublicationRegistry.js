import {
  PHONICS_PROGRAMMATIC_PILOT_PAGES,
  PHONICS_PROGRAMMATIC_PILOT_PREFIX,
} from './phonicsProgrammaticPilot.js';
import {
  PHONICS_WAVE_2_PAGE_COUNT,
  PHONICS_WAVE_2_PAGES,
  PHONICS_WAVE_2_REVISION,
} from './phonicsWave2Publication.js';

const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);

export const PHONICS_PUBLICATION_REVISION = PHONICS_WAVE_2_REVISION;
export const PHONICS_PUBLICATION_PREFIX = PHONICS_PROGRAMMATIC_PILOT_PREFIX;
export { PHONICS_WAVE_2_PAGE_COUNT, PHONICS_WAVE_2_PAGES };

const pilotPagesWithWave = PHONICS_PROGRAMMATIC_PILOT_PAGES.map((page) => freeze({
  ...page,
  publicationWave: 'pilot-wave-1',
}));

export const PHONICS_PUBLISHED_RESOURCE_PAGES = freezeList(
  [...pilotPagesWithWave, ...PHONICS_WAVE_2_PAGES]
    .sort((a, b) => a.concept.progressionRank - b.concept.progressionRank || a.cardTitle.localeCompare(b.cardTitle)),
);
export const PHONICS_PUBLISHED_RESOURCE_PATHS = freezeList(PHONICS_PUBLISHED_RESOURCE_PAGES.map((page) => page.path));
export const PHONICS_PUBLISHED_RESOURCE_TOPIC_IDS = freezeList(PHONICS_PUBLISHED_RESOURCE_PAGES.map((page) => page.topicId));
export const PHONICS_PUBLICATION_GROUPS = freezeList(['Spelling rules', 'Consonant patterns', 'Vowel patterns', 'Word structure']);

if (PHONICS_PUBLISHED_RESOURCE_PAGES.length !== PHONICS_PROGRAMMATIC_PILOT_PAGES.length + PHONICS_WAVE_2_PAGE_COUNT) {
  throw new Error('R12 publication registry count drifted from the frozen pilot plus explicit Wave 2 approvals.');
}
for (const [label, values] of [
  ['path', PHONICS_PUBLISHED_RESOURCE_PATHS],
  ['topicId', PHONICS_PUBLISHED_RESOURCE_TOPIC_IDS],
  ['conceptId', PHONICS_PUBLISHED_RESOURCE_PAGES.map((page) => page.conceptId)],
  ['slug', PHONICS_PUBLISHED_RESOURCE_PAGES.map((page) => page.slug)],
]) {
  if (new Set(values).size !== values.length) throw new Error(`R12 publication registry contains duplicate ${label} values.`);
}

export const PHONICS_PUBLISHED_RESOURCE_SEO = freeze(Object.fromEntries(
  PHONICS_PUBLISHED_RESOURCE_PAGES.map((page) => [page.path, freeze({
    title: page.seoTitle,
    description: page.seoDescription,
    canonicalPath: page.path,
    robots: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
    ogType: 'website',
  })]),
));

const bySlug = new Map(PHONICS_PUBLISHED_RESOURCE_PAGES.map((page) => [page.slug, page]));
const byPath = new Map(PHONICS_PUBLISHED_RESOURCE_PAGES.map((page) => [page.path, page]));
const byConceptId = new Map(PHONICS_PUBLISHED_RESOURCE_PAGES.map((page) => [page.conceptId, page]));
const byTopicId = new Map(PHONICS_PUBLISHED_RESOURCE_PAGES.map((page) => [page.topicId, page]));

export const getPublishedPhonicsResourcePageBySlug = (slug) => bySlug.get(String(slug || '')) ?? null;
export const getPublishedPhonicsResourcePageByPath = (pathname) => {
  const normalized = String(pathname || '').split(/[?#]/, 1)[0].replace(/\/+$/, '');
  return byPath.get(normalized) ?? null;
};
export const getPublishedPhonicsResourcePageByConceptId = (conceptId) => byConceptId.get(String(conceptId || '')) ?? null;
export const getPublishedPhonicsResourcePageByTopicId = (topicId) => byTopicId.get(String(topicId || '')) ?? null;
export const getPublishedPhonicsResourcePagesByGroup = (group) => freezeList(PHONICS_PUBLISHED_RESOURCE_PAGES.filter((page) => page.group === group));
