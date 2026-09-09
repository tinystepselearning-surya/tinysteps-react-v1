import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  PHONICS_GRAPHEME_SOUND_OPTIONS,
  PHONICS_PATTERN_AUDIO_ROOT,
  PHONICS_SOUND_REGISTRY,
  PHONICS_SOUND_UPLOAD_MANIFEST,
  getPhonicsSoundDefinition,
} from '../../lib/phonicsAudioFoundation';
import { PHONICS_WORD_SOUND_FRAMEWORK_EXAMPLES } from '../../content/phonicsWordSounds';

const root = process.cwd();

describe('Resources R10.1 phonics audio foundation', () => {
  it('reuses all 26 existing Tiny Steps letter recordings', () => {
    const existing = PHONICS_SOUND_REGISTRY.filter((sound) => sound.assetOrigin === 'existing-letter');
    expect(existing).toHaveLength(26);

    for (const sound of existing) {
      expect(sound.assetPath).toBe(`/games/phonics/${sound.id}.mp3`);
      expect(fs.existsSync(path.join(root, 'public', sound.assetPath))).toBe(true);
    }
  });

  it('maps every teacher sound ID to an explicit supplied recording filename', () => {
    expect(PHONICS_SOUND_UPLOAD_MANIFEST.length).toBeGreaterThanOrEqual(20);
    expect(new Set(PHONICS_SOUND_UPLOAD_MANIFEST.map((entry) => entry.id)).size)
      .toBe(PHONICS_SOUND_UPLOAD_MANIFEST.length);

    for (const entry of PHONICS_SOUND_UPLOAD_MANIFEST) {
      expect(entry.filename.endsWith('.mp3')).toBe(true);
      expect(entry.uploadPath).toBe(`public${PHONICS_PATTERN_AUDIO_ROOT}/${entry.filename}`);
      expect(entry.recordingCue.length).toBeGreaterThan(12);
      expect(entry.exampleWords.length).toBeGreaterThanOrEqual(2);
    }

    const byId = new Map(PHONICS_SOUND_UPLOAD_MANIFEST.map((entry) => [entry.id, entry] as const));
    expect(byId.get('sh')?.filename).toBe('sh-ship.mp3');
    expect(byId.get('th-voiceless')?.filename).toBe('th-thin.mp3');
    expect(byId.get('th-voiced')?.filename).toBe('th-the.mp3');
    expect(byId.get('wh')?.filename).toBe('wh-whip.mp3');
    expect(byId.get('long-a')?.filename).toBe('a-cake.mp3');
    expect(byId.get('long-u')?.filename).toBe('u-use-cue.mp3');
    expect(byId.get('oo-long')?.filename).toBe('oo-boot-new.mp3');
    expect(byId.get('oo-short')?.filename).toBe('oo-book-bush.mp3');
    expect(byId.get('schwa')?.filename).toBe('Schwa-What.mp3');
    expect(byId.get('er')?.filename).toBe('er-herd-bird-turn.mp3');
    expect(byId.get('ir')?.filename).toBe('er-herd-bird-turn.mp3');
    expect(byId.get('ur')?.filename).toBe('er-herd-bird-turn.mp3');
  });

  it('does not require duplicate recordings for graphemes that reuse a canonical sound', () => {
    expect(PHONICS_GRAPHEME_SOUND_OPTIONS.ph).toEqual(['f']);
    expect(PHONICS_GRAPHEME_SOUND_OPTIONS.ck).toEqual(['k']);
    expect(PHONICS_GRAPHEME_SOUND_OPTIONS.tch).toEqual(['ch']);
    expect(PHONICS_GRAPHEME_SOUND_OPTIONS.ai).toEqual(['long-a']);
    expect(PHONICS_GRAPHEME_SOUND_OPTIONS.ay).toEqual(['long-a']);
    expect(PHONICS_GRAPHEME_SOUND_OPTIONS.ee).toEqual(['long-e']);
    expect(PHONICS_GRAPHEME_SOUND_OPTIONS.igh).toEqual(['long-i']);
    expect(PHONICS_GRAPHEME_SOUND_OPTIONS.oa).toEqual(['long-o']);
    expect(PHONICS_GRAPHEME_SOUND_OPTIONS.oy).toEqual(['oi']);
  });

  it('keeps ambiguous graphemes explicitly multi-reading instead of guessing', () => {
    expect(PHONICS_GRAPHEME_SOUND_OPTIONS.th).toEqual(['th-voiceless', 'th-voiced']);
    expect(PHONICS_GRAPHEME_SOUND_OPTIONS.oo).toEqual(['oo-long', 'oo-short']);
    expect(PHONICS_GRAPHEME_SOUND_OPTIONS.ow).toEqual(['long-o', 'ou']);
    expect(PHONICS_GRAPHEME_SOUND_OPTIONS.ea.length).toBeGreaterThan(1);
    expect(PHONICS_GRAPHEME_SOUND_OPTIONS.ou.length).toBeGreaterThan(1);
  });

  it('requires every framework word segment to point to a registered sound', () => {
    expect(PHONICS_WORD_SOUND_FRAMEWORK_EXAMPLES.length).toBeGreaterThanOrEqual(12);
    for (const word of PHONICS_WORD_SOUND_FRAMEWORK_EXAMPLES) {
      expect(word.editorialState).toBe('framework-example');
      expect(word.segments.length).toBeGreaterThanOrEqual(2);
      for (const segment of word.segments) {
        expect(getPhonicsSoundDefinition(segment.soundId)).toBeTruthy();
      }
    }
  });

  it('does not publish framework example words as public SEO routes', () => {
    const manifestSource = fs.readFileSync(path.join(root, 'src/lib/publicRouteManifest.js'), 'utf8');
    for (const word of PHONICS_WORD_SOUND_FRAMEWORK_EXAMPLES) {
      expect(manifestSource).not.toContain(`/resources/phonics/words/${word.slug}`);
      expect(manifestSource).not.toContain(`/phonics/${word.slug}`);
    }
  });

  it('ships a reusable sound-box component with graceful missing-audio handling', () => {
    const component = fs.readFileSync(path.join(root, 'src/components/resources/PhonicsSoundBoxes.tsx'), 'utf8');
    expect(component).toContain('new Audio(sound.assetPath)');
    expect(component).toContain('Audio coming soon');
    expect(component).toContain('data-phonics-sound-id');
    expect(component).toContain('Tiny Steps does not guess pronunciation from spelling');
    expect(component).not.toMatch(/speechSynthesis|SpeechSynthesis|webkitSpeech/i);
  });
});
