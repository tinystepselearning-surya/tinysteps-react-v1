export function normalizeTextForPhoneDetection(text: string): string {
  return String(text || '').trim();
}

export function containsPhoneNumber(text: string): boolean {
  const normalized = normalizeTextForPhoneDetection(text);
  if (!normalized) return false;

  // Block any '+' followed by optional spaces and then a digit.
  if (/\+\s*\d/.test(normalized)) return true;

  // Block continuous digit runs of length 5 or more.
  if (/\d{5,}/.test(normalized)) return true;

  return false;
}
