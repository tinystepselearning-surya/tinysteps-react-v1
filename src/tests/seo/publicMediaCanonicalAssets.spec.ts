import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
const exists = (p: string) => fs.existsSync(path.join(root, p));
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');

const removedConfetti = [
  'public/games/maw/confetti.mp3',
  'public/games/phonics/balloon-pop/confetti.mp3',
  'public/games/phonics/letter-sound-match/confetti.mp3',
  'public/games/phonics/sound-detective/confetti.mp3',
];

const removedMawTopLevelPng = [
  "apple",
  "ball",
  "box",
  "cat",
  "dog",
  "elephant",
  "fish",
  "girl",
  "grape",
  "hat",
  "headphones",
  "igloo",
  "jug",
  "juice",
  "kangaroo",
  "kite",
  "lion",
  "monkey",
  "nest",
  "nextarrow",
  "nose",
  "octopus",
  "orange",
  "pig",
  "queen",
  "ring",
  "sun",
  "tiger",
  "train",
  "umbrella",
  "van",
  "watch",
  "whale",
  "xray",
  "yoyo",
  "zeebra",
  "zoo"
];
const removedChristmasIds = [5, 11, 12, 13, 14, 15, 16];

describe('public media canonicalization phase 2 cleanup', () => {
  it('keeps exactly one canonical A-Z set and removes both legacy game copies', () => {
    for (const letter of letters) {
      const canonical = `public/games/phonics/shared/letter-sounds/${letter}.mp3`;
      expect(exists(canonical)).toBe(true);
      expect(fs.statSync(path.join(root, canonical)).size).toBeGreaterThan(0);
      expect(exists(`public/games/phonics/balloon-pop/${letter}.mp3`)).toBe(false);
      expect(exists(`public/games/phonics/letter-sound-match/${letter}.mp3`)).toBe(false);
    }

    const balloon = read('src/pages/KidsBalloonPop.tsx');
    const mission = read('src/pages/KidsPhonicsMission.tsx');
    expect(balloon).toContain('const LETTER_BASE = "/games/phonics/shared/letter-sounds";');
    expect(mission).toContain('const LETTER_SOUND_DIR = "/games/phonics/shared/letter-sounds";');
  });

  it('keeps one shared confetti sound and removes four redundant local copies', () => {
    expect(exists('public/confetti.mp3')).toBe(true);
    for (const removed of removedConfetti) expect(exists(removed)).toBe(false);
    expect(read('src/pages/KidsBalloonPop.tsx')).toContain('confetti: "/confetti.mp3"');
  });

  it('removes only dead top-level Make-A-Word PNG duplicates and retains Sound Detective canonicals', () => {
    expect(removedMawTopLevelPng).toHaveLength(37);
    for (const name of removedMawTopLevelPng) {
      expect(exists(`public/games/maw/${name}.png`)).toBe(false);
      expect(exists(`public/games/phonics/sound-detective/${name}.png`)).toBe(true);
    }

    const sourceRoot = path.join(root, 'src');
    const stack = [sourceRoot];
    const offenders: string[] = [];
    while (stack.length) {
      const dir = stack.pop()!;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) stack.push(full);
        else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          const source = fs.readFileSync(full, 'utf8');
          for (const name of removedMawTopLevelPng) {
            if (source.includes(`/games/maw/${name}.png`)) {
              offenders.push(path.relative(root, full) + ':' + name);
            }
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('removes redundant Christmas bytes while preserving the remapped logical decorations', () => {
    const source = read('src/pages/public/seasonal/ChristmasTreeDecoratePublic.tsx');
    const mapping: Record<number, number> = { 5: 4, 11: 9, 12: 1, 13: 3, 14: 10, 15: 8, 16: 7 };

    for (const id of removedChristmasIds) {
      expect(exists(`public/seasonal/christmas/${id}.PNG`)).toBe(false);
      expect(exists(`public/seasonal/christmas/${mapping[id]}.PNG`)).toBe(true);
      expect(source).toContain(`${id}: ${mapping[id]}`);
    }
    expect(source).toContain('const assetNumber = DECORATION_ASSET_NUMBER[n] ?? n;');
  });
});
