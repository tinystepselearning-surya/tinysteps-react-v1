type CanonicalIdentity = {
  gameId: string;
  progressDocId: string;
  gameIdAliases: string[];
  progressDocIdAliases: string[];
};

const CANONICAL_IDENTITIES: CanonicalIdentity[] = [
  {
    gameId: "letter-sound-match",
    progressDocId: "phonics_letter_sound",
    gameIdAliases: ["phonics_letter_sound"],
    progressDocIdAliases: ["phonics_letter_sound_match"],
  },
  {
    gameId: "my-first-words",
    progressDocId: "phonics_my_first_words",
    gameIdAliases: ["my_first_words_v1", "my_first_words"],
    progressDocIdAliases: [],
  },
  {
    gameId: "cvc-word-builder",
    progressDocId: "phonics_cvc_word_builder",
    gameIdAliases: [
      "cvc_word_reader_v1",
      "cvc_word_reader",
      "cvc-word-reader",
      "spelling-practice",
      "make-a-word-rime",
    ],
    progressDocIdAliases: ["phonics_cvc_word_reader", "phonics_spelling_practice"],
  },
];

const IDENTITY_MATCHES = CANONICAL_IDENTITIES.map((entry) => ({
  gameId: entry.gameId,
  progressDocId: entry.progressDocId,
  gameIds: new Set([entry.gameId, ...entry.gameIdAliases]),
  progressDocIds: new Set([entry.progressDocId, ...entry.progressDocIdAliases]),
}));

export type NormalizedGameIdentity = {
  gameId: string;
  progressDocId: string;
};

export function normalizeGameIdentity(
  gameIdRaw: string,
  progressDocIdRaw: string
): NormalizedGameIdentity {
  const gameId = String(gameIdRaw || "").trim();
  const rawProgressDocId = String(progressDocIdRaw || "").trim();
  const progressDocId = rawProgressDocId || gameId;

  for (const identity of IDENTITY_MATCHES) {
    if (identity.gameIds.has(gameId) || identity.progressDocIds.has(progressDocId)) {
      return {
        gameId: identity.gameId,
        progressDocId: identity.progressDocId,
      };
    }
  }

  return { gameId, progressDocId };
}
