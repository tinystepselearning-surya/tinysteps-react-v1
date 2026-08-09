import type {
  AssessmentCheckpoint,
  ReadingDomainScores,
  ReadingLevelKey,
} from '../types/SchoolProgramme';

export interface ReadingLevelDefinition {
  key: ReadingLevelKey;
  level: number;
  shortLabel: string;
  description: string;
}

/**
 * Internal Tiny Steps instructional scale used to communicate programme growth.
 * These are programme descriptors, not population norms or standardized cut scores.
 */
export const READING_LEVEL_DEFINITIONS: ReadingLevelDefinition[] = [
  { key: 'TS0', level: 0, shortLabel: 'Pre-reading', description: 'Builds listening, rhyme, oral blending and phonological awareness; independent decoding is not yet expected.' },
  { key: 'TS1', level: 1, shortLabel: 'Sound awareness', description: 'Recognises a growing set of explicitly taught letter–sound correspondences.' },
  { key: 'TS2', level: 2, shortLabel: 'Supported blending', description: 'Blends simple VC/CVC words with modelling, prompts or physical blending support.' },
  { key: 'TS3', level: 3, shortLabel: 'Independent CVC', description: 'Independently decodes unfamiliar regular CVC words using taught sounds.' },
  { key: 'TS4', level: 4, shortLabel: 'Digraph decoding', description: 'Decodes words containing taught common digraphs and consolidates simple sentence reading.' },
  { key: 'TS5', level: 5, shortLabel: 'Long vowels & patterns', description: 'Applies taught long-vowel and common vowel-pattern knowledge to unfamiliar words.' },
  { key: 'TS6', level: 6, shortLabel: 'Complex decoding', description: 'Decodes longer words, blends and increasingly complex taught phonics patterns.' },
  { key: 'TS7', level: 7, shortLabel: 'Sentence reader', description: 'Reads controlled sentences with improving accuracy, phrasing and automaticity.' },
  { key: 'TS8', level: 8, shortLabel: 'Passage reader', description: 'Reads age-appropriate decodable passages with developing fluency and literal comprehension.' },
  { key: 'TS9', level: 9, shortLabel: 'Confident early reader', description: 'Applies phonics independently across connected text with fluent early reading and comprehension.' },
];

export const ASSESSMENT_CHECKPOINT_LABELS: Record<AssessmentCheckpoint, string> = {
  baseline: 'Baseline',
  checkpoint_1: 'Checkpoint 1',
  mid: 'Mid-programme',
  final: 'Final',
  custom: 'Custom checkpoint',
};

export const READING_DOMAIN_DEFINITIONS: Array<{
  key: keyof ReadingDomainScores;
  label: string;
  description: string;
}> = [
  { key: 'phonologicalAwareness', label: 'Phonological awareness', description: 'Listening for, identifying and manipulating sounds in spoken words.' },
  { key: 'soundKnowledge', label: 'Sound knowledge', description: 'Accurate recall of the grapheme–phoneme correspondences already taught.' },
  { key: 'blendingDecoding', label: 'Blending & decoding', description: 'Using taught sound knowledge to read unfamiliar controlled words.' },
  { key: 'segmentingEncoding', label: 'Segmenting & spelling', description: 'Breaking spoken words into sounds and representing those sounds in spelling.' },
  { key: 'connectedText', label: 'Connected-text reading', description: 'Accuracy and developing fluency when reading controlled sentences or passages.' },
  { key: 'comprehension', label: 'Comprehension', description: 'Understanding text that the child can read at the assessed level.' },
];

export function averageReadingLevelFromDistribution(
  distribution: Record<ReadingLevelKey, number>,
): { studentsAssessed: number; averageReadingLevel: number } {
  let studentsAssessed = 0;
  let weighted = 0;
  for (const definition of READING_LEVEL_DEFINITIONS) {
    const count = Math.max(0, Number(distribution[definition.key] || 0));
    studentsAssessed += count;
    weighted += count * definition.level;
  }
  return {
    studentsAssessed,
    averageReadingLevel:
      studentsAssessed > 0
        ? Math.round((weighted / studentsAssessed) * 100) / 100
        : 0,
  };
}
