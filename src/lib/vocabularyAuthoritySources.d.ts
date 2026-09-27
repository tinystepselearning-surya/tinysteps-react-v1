export type VocabularyAuthoritySource = Readonly<{
  id: string;
  publisher: string;
  title: string;
  url: string;
  note: string;
}>;

export const VOCABULARY_AUTHORITY_SOURCES: Readonly<Record<string, VocabularyAuthoritySource>>;
export function getVocabularyAuthoritySources(ids?: readonly string[]): VocabularyAuthoritySource[];
