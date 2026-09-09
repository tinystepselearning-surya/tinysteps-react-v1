import {
  PHONICS_PROGRAMMATIC_PILOT_GROUPS,
  PHONICS_PROGRAMMATIC_PILOT_PAGES,
  getPhonicsProgrammaticPilotPageByPath,
} from './phonicsProgrammaticPilot.js';

const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);

export const PHONICS_RESOURCE_DISCOVERY_REVISION = '2026-09-09-r10';
export const PHONICS_RESOURCE_HUB_PATH = '/resources/phonics';

const CLUSTER_CONFIG = freeze({
  'Spelling rules': freeze({
    id: 'spelling-rules',
    anchorId: 'phonics-spelling-rules',
    label: 'Spelling rules',
    description: 'Use explicit spelling generalisations with clear boundaries, contrasts and exceptions.',
  }),
  'Consonant patterns': freeze({
    id: 'consonant-patterns',
    anchorId: 'phonics-consonant-patterns',
    label: 'Consonant patterns',
    description: 'Explore consonant digraphs and context-sensitive consonant spellings as connected sound-pattern families.',
  }),
  'Vowel patterns': freeze({
    id: 'vowel-patterns',
    anchorId: 'phonics-vowel-patterns',
    label: 'Vowel patterns',
    description: 'Compare vowel teams and silent-e patterns without assuming one spelling always maps to one sound.',
  }),
  'Word structure': freeze({
    id: 'word-structure',
    anchorId: 'phonics-word-structure',
    label: 'Word structure',
    description: 'Move beyond single-syllable decoding with syllable and word-structure patterns.',
  }),
});

function buildCluster(group) {
  const config = CLUSTER_CONFIG[group];
  if (!config) throw new Error(`Missing Brick 10 discovery cluster config for ${group}`);
  const pages = PHONICS_PROGRAMMATIC_PILOT_PAGES.filter((page) => page.group === group);
  return freeze({
    ...config,
    group,
    href: `${PHONICS_RESOURCE_HUB_PATH}#${config.anchorId}`,
    pages: freezeList(pages),
  });
}

export const PHONICS_RESOURCE_DISCOVERY_CLUSTERS = freezeList(
  PHONICS_PROGRAMMATIC_PILOT_GROUPS.map(buildCluster),
);

const clusterByGroup = new Map(PHONICS_RESOURCE_DISCOVERY_CLUSTERS.map((cluster) => [cluster.group, cluster]));
const clusterById = new Map(PHONICS_RESOURCE_DISCOVERY_CLUSTERS.map((cluster) => [cluster.id, cluster]));

export function getPhonicsResourceDiscoveryClusterById(id) {
  return clusterById.get(String(id || '')) ?? null;
}

export function getPhonicsResourceDiscoveryClusterForPath(path) {
  const page = getPhonicsProgrammaticPilotPageByPath(path);
  return page ? (clusterByGroup.get(page.group) ?? null) : null;
}

function progressionDistance(a, b) {
  return Math.abs((a.concept?.progressionRank ?? 0) - (b.concept?.progressionRank ?? 0));
}

export function getRelatedPhonicsResourcePages(path, limit = 4) {
  const page = getPhonicsProgrammaticPilotPageByPath(path);
  if (!page) return freezeList([]);

  const sameCluster = PHONICS_PROGRAMMATIC_PILOT_PAGES
    .filter((candidate) => candidate.path !== page.path && candidate.group === page.group)
    .sort((a, b) => progressionDistance(page, a) - progressionDistance(page, b) || a.cardTitle.localeCompare(b.cardTitle));

  const adjacent = PHONICS_PROGRAMMATIC_PILOT_PAGES
    .filter((candidate) => candidate.path !== page.path && candidate.group !== page.group)
    .sort((a, b) => progressionDistance(page, a) - progressionDistance(page, b) || a.cardTitle.localeCompare(b.cardTitle));

  return freezeList([...sameCluster, ...adjacent].slice(0, Math.max(0, Number(limit) || 0)));
}

export const PHONICS_RESOURCE_DISCOVERY_EDGES = freezeList([
  ...PHONICS_PROGRAMMATIC_PILOT_PAGES.map((page) => freeze({
    from: PHONICS_RESOURCE_HUB_PATH,
    to: page.path,
    relation: 'hub-child',
  })),
  ...PHONICS_PROGRAMMATIC_PILOT_PAGES.map((page) => freeze({
    from: page.path,
    to: PHONICS_RESOURCE_HUB_PATH,
    relation: 'parent-hub',
  })),
  ...PHONICS_PROGRAMMATIC_PILOT_PAGES.flatMap((page) =>
    getRelatedPhonicsResourcePages(page.path, 4).map((related) => freeze({
      from: page.path,
      to: related.path,
      relation: related.group === page.group ? 'cluster-sibling' : 'adjacent-pattern',
    })),
  ),
]);

export function getPhonicsResourceDiscoveryTargets(from) {
  return freezeList(PHONICS_RESOURCE_DISCOVERY_EDGES.filter((edge) => edge.from === from).map((edge) => edge.to));
}

export function getPhonicsResourceReachablePaths(start = PHONICS_RESOURCE_HUB_PATH) {
  const seen = new Set([start]);
  const queue = [start];
  while (queue.length) {
    const current = queue.shift();
    for (const target of getPhonicsResourceDiscoveryTargets(current)) {
      if (seen.has(target)) continue;
      seen.add(target);
      queue.push(target);
    }
  }
  return freezeList([...seen]);
}
