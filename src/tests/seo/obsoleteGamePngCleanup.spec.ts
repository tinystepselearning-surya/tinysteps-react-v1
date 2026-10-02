import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const sharedDir = path.join(root, 'public/games/phonics/shared/images');

describe('obsolete phonics game PNG cleanup', () => {
  it('keeps the 37 canonical WebP assets and removes both obsolete PNG copies', () => {
    const webps = fs
      .readdirSync(sharedDir)
      .filter((name) => name.endsWith('.webp'))
      .sort();

    expect(webps).toHaveLength(37);

    for (const file of webps) {
      const stem = file.replace(/\.webp$/, '');
      expect(fs.existsSync(path.join(root, `public/games/maw/${stem}.png`))).toBe(false);
      expect(fs.existsSync(path.join(root, `public/games/phonics/sound-detective/${stem}.png`))).toBe(false);
      expect(fs.statSync(path.join(sharedDir, file)).size).toBeGreaterThan(0);
    }
  });

  it('keeps the active games pointed at shared WebP assets', () => {
    const soundDetective = fs.readFileSync(
      path.join(root, 'src/pages/kids/games/phonics/SoundDetectiveGame.tsx'),
      'utf8',
    );
    const tracing = fs.readFileSync(
      path.join(root, 'src/pages/kids/games/phonics/LetterTracingGame.tsx'),
      'utf8',
    );
    const tracingWithSounds = fs.readFileSync(
      path.join(root, 'src/pages/kids/games/phonics/LetterTracingWithSounds.tsx'),
      'utf8',
    );

    expect(soundDetective).toContain('const IMAGE_BASE = "/games/phonics/shared/images";');
    expect(soundDetective).not.toMatch(/sound-detective\/[^"'\`]+\.png/);
    expect(tracing).toContain('/games/phonics/shared/images/nextarrow.webp');
    expect(tracingWithSounds).toContain('/games/phonics/shared/images');
    expect(tracingWithSounds).toContain('const exts = ["webp", "png", "jpg"];');
  });

  it('does not redirect Make-A-Word nested asset references to deleted top-level PNGs', () => {
    const makeAWordSources = [
      'src/pages/kids/games/phonics/MakeAWordAtGame.tsx',
      'src/pages/kids/games/phonics/CvcWordReader/CvcWordReaderGame.tsx',
      'src/pages/kids/games/phonics/CvcWordReader/MakeAWordRimeGame.tsx',
    ]
      .map((file) => fs.readFileSync(path.join(root, file), 'utf8'))
      .join('\n');

    expect(makeAWordSources).toContain('/games/maw/at/');
    expect(makeAWordSources).toContain('/games/maw/in/');
    expect(makeAWordSources).not.toMatch(/\/games\/maw\/[^/]+\.png/);
  });
});
