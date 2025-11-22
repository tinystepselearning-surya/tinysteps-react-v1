// SpellBee word data removed. Provide minimal safe helpers for any remaining imports.

export function getFallbackWords() {
  // Return an empty list so any callers receive a harmless value.
  return [];
}

export function getAdaptiveSettings() {
  return { difficulty: 'easy', hintDetail: 'none', retries: 0, scaffolding: {}, trend: 'stable' };
}
