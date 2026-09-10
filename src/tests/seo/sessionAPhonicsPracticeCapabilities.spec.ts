import { describe, expect, it } from 'vitest';
import { PUBLIC_TILE_ROUTES } from '../../lib/publicEnglishGames';
import {
  PHONICS_PRACTICE_CAPABILITIES,
  getPhonicsPracticeCapabilitiesForSkill,
} from '../../lib/phonicsPracticeCapabilityRegistry';

describe('Session A PH5 practice capability registry', () => {
  it('maps only real enabled public games for interactive/tracing capabilities', () => {
    for (const entry of PHONICS_PRACTICE_CAPABILITIES) {
      expect(entry.path.startsWith('/')).toBe(true);
      for (const gameId of entry.sourceGameIds) {
        expect(PUBLIC_TILE_ROUTES[gameId]?.enabled).toBe(true);
        expect(PUBLIC_TILE_ROUTES[gameId]?.route).toBe(entry.path);
      }
    }
  });

  it('connects every PH1 skill to at least one existing practice capability', () => {
    const requiredSkills = [
      'phonemic-awareness', 'letter-sounds', 'blending', 'segmenting', 'cvc', 'digraphs',
      'spelling-rules', 'multisyllabic-decoding', 'fluency', 'comprehension-transition',
    ];
    for (const skillId of requiredSkills) expect(getPhonicsPracticeCapabilitiesForSkill(skillId).length, skillId).toBeGreaterThan(0);
  });

  it('keeps tracing as an existing capability rather than a replacement engine', () => {
    const tracing = PHONICS_PRACTICE_CAPABILITIES.filter((entry) => entry.kind === 'tracing');
    expect(tracing.map((entry) => entry.path)).toEqual(['/free-letter-tracing-game-for-kids', '/letter-tracing-with-sounds-game']);
  });
});
