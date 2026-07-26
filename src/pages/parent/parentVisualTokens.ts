export const parentVisualTokens = {
  page: "ts-parent-page",
  card: "ts-parent-card",
  section: "ts-parent-section",
  iconTile: "ts-parent-icon-tile",
  supportingText: "ts-parent-supporting-text",
} as const;

/**
 * Removes only a duplicated presentation prefix. Stored curriculum labels and
 * stage identity remain untouched.
 */
export const stripParentStagePrefix = (
  label: string,
  order: number,
): string => {
  const normalized = String(label || "").trim();
  if (!normalized) return order > 0 ? `Stage ${order}` : "Stage";

  const cleaned = normalized
    .replace(/^stage\s*\d+\s*(?::|[—–-]|·)\s*/i, "")
    .trim();

  if (cleaned) return cleaned;
  if (/^stage\s*\d+\s*(?::|[—–-]|·)?\s*$/i.test(normalized)) {
    return order > 0 ? `Stage ${order}` : "Stage";
  }
  return normalized;
};

export const formatParentStageLabel = (
  label: string,
  order: number,
): string => {
  const cleaned = stripParentStagePrefix(label, order);
  if (order <= 0) return cleaned;
  if (cleaned.toLowerCase() === `stage ${order}`.toLowerCase()) return cleaned;
  return `Stage ${order} — ${cleaned}`;
};
