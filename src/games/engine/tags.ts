/**
 * Tiny Steps Games Engine - Skill Tag Helpers
 * 
 * Pure functions for creating and managing skill tags.
 * Tags track specific learning objectives (letters, sounds, rules).
 * 
 * Standard tag formats:
 * - letter:<a-z>
 * - sound:<phoneme>
 * - subtopic:<topicId>
 * - confusion:<x-y>
 * - rule:<ruleId>
 */

import type { SkillTag, TagDelta } from './types';

// ========== Tag Creators ==========

/**
 * Create a letter tag for a single letter.
 * @param letter - Single letter (a-z, case-insensitive)
 * @returns "letter:x" or null if invalid
 */
export function letterTag(letter: string): SkillTag | null {
  const normalized = letter.toLowerCase().trim();
  if (normalized.length !== 1 || !/^[a-z]$/.test(normalized)) {
    return null;
  }
  return `letter:${normalized}`;
}

/**
 * Create a sound tag for a phoneme.
 * @param sound - Phoneme string (e.g., "sh", "a_short", "ee")
 * @returns "sound:<phoneme>"
 */
export function soundTag(sound: string): SkillTag {
  const normalized = sound.toLowerCase().trim();
  if (!normalized) {
    throw new Error('Sound tag cannot be empty');
  }
  return `sound:${normalized}`;
}

/**
 * Create a subtopic tag.
 * @param topicId - Topic identifier
 * @returns "subtopic:<topicId>"
 */
export function subtopicTag(topicId: string): SkillTag {
  const normalized = topicId.trim();
  if (!normalized) {
    throw new Error('Subtopic tag cannot be empty');
  }
  return `subtopic:${normalized}`;
}

/**
 * Create a rule tag.
 * @param ruleId - Rule identifier
 * @returns "rule:<ruleId>"
 */
export function ruleTag(ruleId: string): SkillTag {
  const normalized = ruleId.trim();
  if (!normalized) {
    throw new Error('Rule tag cannot be empty');
  }
  return `rule:${normalized}`;
}

/**
 * Create a confusion tag for two commonly confused items.
 * Items are sorted alphabetically for consistency.
 * @param a - First item
 * @param b - Second item
 * @returns "confusion:a-b" (sorted)
 */
export function confusionTag(a: string, b: string): SkillTag {
  const normA = a.toLowerCase().trim();
  const normB = b.toLowerCase().trim();
  
  if (!normA || !normB) {
    throw new Error('Confusion tag items cannot be empty');
  }
  
  const [first, second] = normA < normB ? [normA, normB] : [normB, normA];
  return `confusion:${first}-${second}`;
}

/**
 * Create a confusion tag preserving the order: target → clicked.
 * Use this when you want to track "user saw X but clicked Y" directionally.
 * Spaces are removed from both inputs.
 * 
 * @param target - The correct answer (what should have been clicked)
 * @param clicked - What the user actually clicked
 * @returns "confusion:target-clicked" (preserves order)
 * 
 * @example
 * tagConfusion('A', 'S') // => "confusion:a-s"
 * tagConfusion('sh', 'ch') // => "confusion:sh-ch"
 * tagConfusion('B ', ' D') // => "confusion:b-d"
 */
export function tagConfusion(target: string, clicked: string): SkillTag {
  const normTarget = target.toLowerCase().trim().replace(/\s+/g, '');
  const normClicked = clicked.toLowerCase().trim().replace(/\s+/g, '');
  
  if (!normTarget || !normClicked) {
    throw new Error('Confusion tag items cannot be empty');
  }
  
  return `confusion:${normTarget}-${normClicked}`;
}

// ========== Tag Delta Helpers ==========

/**
 * Add a tag delta to a map, incrementing existing values.
 * Mutates the map in place for performance.
 * 
 * @param map - Existing tag deltas map
 * @param tag - Skill tag to update
 * @param delta - Delta to add
 */
export function addTagDelta(
  map: Record<SkillTag, TagDelta>,
  tag: SkillTag,
  delta: { attempts: number; correct: number; wrong: number }
): void {
  if (!map[tag]) {
    map[tag] = { attempts: 0, correct: 0, wrong: 0 };
  }
  
  map[tag].attempts += delta.attempts;
  map[tag].correct += delta.correct;
  map[tag].wrong += delta.wrong;
}

// ========== Accuracy Helpers ==========

/**
 * Compute accuracy percentage from correct/total attempts.
 * Returns 0 if attempts is 0 (avoids division by zero).
 * 
 * @param correct - Number of correct attempts
 * @param attempts - Total attempts
 * @returns Accuracy as a percentage (0-100)
 */
export function computeAccuracy(correct: number, attempts: number): number {
  if (attempts <= 0) return 0;
  return Math.round((correct / attempts) * 100);
}
