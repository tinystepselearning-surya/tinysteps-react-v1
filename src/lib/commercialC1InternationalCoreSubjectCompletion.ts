import {
  COMMERCIAL_C1_INTERNATIONAL_MARKETS,
  COMMERCIAL_C1_INTERNATIONAL_QUERIES,
  type InternationalMarketId,
  type InternationalEvidenceStrength,
} from './commercialC1InternationalAiResearch';
import type { CommercialSubject } from './commercialC1SearchUniverse';

const freeze = <T extends object>(value: T): Readonly<T> => Object.freeze(value);
const freezeList = <T>(values: readonly T[]): readonly T[] => Object.freeze([...values]);

export const COMMERCIAL_C1_INTERNATIONAL_CORE_COMPLETION_REVISION = '2026-09-10-c1-r3';

export type InternationalCoreSubjectQuery = {
  id: string;
  market: InternationalMarketId;
  query: string;
  subject: Extract<CommercialSubject, 'writing' | 'spoken_english'>;
  intent: 'provider-research';
  parentStage: 'provider_research';
  commercialStrength: 'high' | 'very_high';
  evidenceStrength: InternationalEvidenceStrength;
  status: 'RESEARCHED';
  ownershipDeferredTo: 'C2';
};

export const COMMERCIAL_C1_INTERNATIONAL_CORE_SUBJECT_QUERIES = freezeList<InternationalCoreSubjectQuery>(
  COMMERCIAL_C1_INTERNATIONAL_MARKETS.flatMap((market) => [
    freeze({
      id: `intl-${market.id}-writing`,
      market: market.id,
      query: `online creative writing classes for ${market.audiencePhrase}`,
      subject: 'writing' as const,
      intent: 'provider-research' as const,
      parentStage: 'provider_research' as const,
      commercialStrength: 'high' as const,
      evidenceStrength: market.evidenceStrength,
      status: 'RESEARCHED' as const,
      ownershipDeferredTo: 'C2' as const,
    }),
    freeze({
      id: `intl-${market.id}-spoken-english`,
      market: market.id,
      query: `online spoken english classes for ${market.audiencePhrase}`,
      subject: 'spoken_english' as const,
      intent: 'provider-research' as const,
      parentStage: 'provider_research' as const,
      commercialStrength: 'very_high' as const,
      evidenceStrength: market.evidenceStrength,
      status: 'RESEARCHED' as const,
      ownershipDeferredTo: 'C2' as const,
    }),
  ]),
);

export const COMMERCIAL_C1_INTERNATIONAL_ALL_QUERIES = freezeList([
  ...COMMERCIAL_C1_INTERNATIONAL_QUERIES,
  ...COMMERCIAL_C1_INTERNATIONAL_CORE_SUBJECT_QUERIES,
]);

export const COMMERCIAL_C1_INTERNATIONAL_COMPLETE_QUERY_COUNT = 66;

if (COMMERCIAL_C1_INTERNATIONAL_CORE_SUBJECT_QUERIES.length !== 12) {
  throw new Error('C1 international core-subject completion must add writing and spoken English for all six markets.');
}
if (COMMERCIAL_C1_INTERNATIONAL_ALL_QUERIES.length !== COMMERCIAL_C1_INTERNATIONAL_COMPLETE_QUERY_COUNT) {
  throw new Error('C1 complete international matrix must contain 66 researched queries.');
}
