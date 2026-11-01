import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const VALID_PORTRAIT = /^[\p{L}\p{N}][\p{L}\p{N} ._'’-]*\.webp$/iu;
const FALLBACK_FOUNDER_IMAGE = '/priya-founder-tiny-steps-learning.webp';

export function displayNameFromPhoto(filename) {
  const stem = filename.replace(/\.webp$/i, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return stem
    .split(' ')
    .map((word) => word === word.toLocaleLowerCase() ? word.charAt(0).toLocaleUpperCase() + word.slice(1) : word)
    .join(' ');
}

export function getTeamPhotoManifest(directory) {
  const files = existsSync(directory)
    ? readdirSync(directory, { withFileTypes: true })
        .filter((entry) => entry.isFile() && VALID_PORTRAIT.test(entry.name))
        .map((entry) => entry.name)
    : [];

  const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
  files.sort(collator.compare);

  const founder = files.find((filename) => filename === 'Founder.webp');
  const teachers = files
    .filter((filename) => filename.toLocaleLowerCase() !== 'founder.webp')
    .map((fileName) => ({
      name: displayNameFromPhoto(fileName),
      src: '/team/' + encodeURIComponent(fileName),
    }));

  const duplicateNames = new Set();
  for (const teacher of teachers) {
    const key = teacher.name.toLocaleLowerCase();
    if (duplicateNames.has(key)) throw new Error('Duplicate public teacher name: ' + teacher.name);
    duplicateNames.add(key);
  }

  return {
    founderPhotoSrc: founder ? '/team/Founder.webp' : FALLBACK_FOUNDER_IMAGE,
    teachers,
  };
}

const PUBLIC_ID = 'virtual:tiny-steps-team-photos';
const INTERNAL_ID = '\0' + PUBLIC_ID;

// Vite loads the public/team directory at development-server start or production build.
// Only public, deliberately uploaded .webp portraits are included. Never read Firestore or HR records.
export function teamPhotoManifestPlugin() {
  return {
    name: 'tiny-steps-public-team-photo-manifest',
    resolveId(id) {
      return id === PUBLIC_ID ? INTERNAL_ID : null;
    },
    load(id) {
      if (id !== INTERNAL_ID) return null;
      const manifest = getTeamPhotoManifest(resolve(process.cwd(), 'public/team'));
      return 'export const founderPhotoSrc = ' + JSON.stringify(manifest.founderPhotoSrc) + ';\n'
        + 'export const publicTeacherPhotos = ' + JSON.stringify(manifest.teachers) + ';\n';
    },
  };
}
