import { HttpsError } from 'firebase-functions/v2/https';

export function exactAvsId(value: unknown, name: string): string {
  const id = typeof value === 'string' ? value.trim() : '';
  if (
    !id ||
    id.length > 240 ||
    id.includes('/') ||
    [...id].some((char) => char.charCodeAt(0) < 32)
  ) {
    throw new HttpsError('invalid-argument', `${name} is invalid.`);
  }
  return id;
}
