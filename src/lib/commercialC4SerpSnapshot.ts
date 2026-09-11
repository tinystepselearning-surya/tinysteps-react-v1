const freeze = <T extends object>(value: T): Readonly<T> => Object.freeze(value);
const freezeList = <T>(values: readonly T[]): readonly T[] => Object.freeze([...values]);

export const COMMERCIAL_C4_SERP_SNAPSHOT_REVISION = '2026-09-11-c4-serp-r1';
export const COMMERCIAL_C4_SERP_SNAPSHOT_STATUS = 'directional-snapshot-complete';

export type CommercialC4SerpObservation = {
  ownerPath: string;
  query: string;
  intendedTitle: string;
  observedTitle: string;
  titleRewriteObserved: boolean;
  capturedOn: string;
  source: 'external-search-retrieval';
  directionalOnly: true;
  descriptionCaptured: false;
  note: string;
};

const observation = (
  value: Omit<CommercialC4SerpObservation, 'titleRewriteObserved' | 'capturedOn' | 'source' | 'directionalOnly' | 'descriptionCaptured' | 'note'>,
) => freeze<CommercialC4SerpObservation>({
  ...value,
  titleRewriteObserved: value.intendedTitle !== value.observedTitle,
  capturedOn: '2026-09-11',
  source: 'external-search-retrieval',
  directionalOnly: true,
  descriptionCaptured: false,
  note: 'Directional search-result retrieval only. Search engines can rewrite titles by query, device, location and time. This snapshot must not by itself trigger a metadata change; confirm with fresh post-C3 GSC evidence and a fresh search check.',
});

export const COMMERCIAL_C4_SERP_OBSERVATIONS = freezeList<CommercialC4SerpObservation>([
  observation({
    ownerPath: '/phonics',
    query: 'phonics classes',
    intendedTitle: 'Online Phonics Classes for Kids | Live 1:1 | Tiny Steps',
    observedTitle: 'Online Phonics Classes for Kids in India | Live 1:1 | Tiny Steps',
  }),
  observation({
    ownerPath: '/best-online-phonics-classes-for-kids-in-india',
    query: 'best online phonics classes for kids in india',
    intendedTitle: 'Best Online Phonics Classes for Kids in India | Tiny Steps Learning',
    observedTitle: 'Best Online Phonics Classes for Kids in India | Tiny Steps Learning',
  }),
  observation({
    ownerPath: '/online-english-classes-hyderabad',
    query: 'online english classes hyderabad',
    intendedTitle: 'Online English Classes for Kids in Hyderabad | Tiny Steps',
    observedTitle: 'Online English Classes for Kids in Hyderabad | Tiny Steps Learning',
  }),
  observation({
    ownerPath: '/speaking',
    query: 'public speaking classes for kids',
    intendedTitle: 'Public Speaking & Communication Classes for Kids | Tiny Steps',
    observedTitle: 'Public Speaking Classes for Kids in India | Tiny Steps',
  }),
  observation({
    ownerPath: '/pricing',
    query: 'online english classes fees kids',
    intendedTitle: 'Online English Classes for Kids Fees & Pricing | Tiny Steps',
    observedTitle: 'Premium 1:1 Online English Class Pricing | Tiny Steps Learning',
  }),
  observation({
    ownerPath: '/grammar',
    query: 'online grammar classes for kids',
    intendedTitle: 'Online Grammar Classes for Kids | Live 1:1 | Tiny Steps',
    observedTitle: 'Grammar Classes for Kids in India | Tiny Steps',
  }),
]);

export const COMMERCIAL_C4_SERP_REWRITE_PATHS = freezeList(
  COMMERCIAL_C4_SERP_OBSERVATIONS
    .filter((entry) => entry.titleRewriteObserved)
    .map((entry) => entry.ownerPath),
);
