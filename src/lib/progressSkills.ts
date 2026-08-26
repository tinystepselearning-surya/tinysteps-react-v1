export type ProgressSkillArea = 'phonics' | 'grammar' | 'speaking' | 'general';

export type ProgressSkillDefinition = {
  key: string;
  label: string;
  shortLabel?: string;
  description?: string;
  area?: ProgressSkillArea;
};

type ProgressSkillContext = {
  courseId?: string | null;
  topicId?: string | null;
  lessonId?: string | null;
  rubricType?: string | null;
  stageLabel?: string | null;
  lessonTitle?: string | null;
  topicLabel?: string | null;
  area?: string | null;
  subskillChips?: string[] | null;
  progressSkillsMeta?: unknown;
};

const RUBRIC_PROGRESS_SKILLS: Record<string, string[]> = {
  single_sound: ['Letter recognition', 'Sound pronunciation', 'Initial sound spotting', 'Letter formation'],
  short_vowels: ['Short vowel recognition', 'Sound discrimination', 'CVC blending', 'CVC word reading', 'CVC spelling'],
  sound_set: ['Sound recall', 'Blending', 'Segmenting', 'CVC word reading', 'Simple dictation'],
  digraph: ['Digraph recognition', 'Sound pronunciation', 'Word reading', 'Spelling (digraph)', 'Read sentence'],
  silent_letter: ['Spot silent letters', 'Pronounce correctly', 'Word reading', 'Spelling pattern', 'Read sentence'],
  vowel_team: ['Vowel team recognition', 'Sound pronunciation', 'Read long-vowel words', 'Spelling (vowel team)', 'Read sentence'],
  magic_e: ['Magic E rule', 'Short vs long', 'Word reading', 'Spelling (magic e)', 'Read sentence'],
  diphthong: ['Diphthong recognition', 'Sound glide practice', 'Word reading', 'Spelling choice', 'Read sentence'],
  r_controlled: ['Bossy r recognition', 'Sound pronunciation', 'Word reading', 'Spelling (r-controlled)', 'Read sentence'],
  alternate_vowel: ['Alternate vowel recognition', 'Sound choice', 'Word reading', 'Spelling', 'Read sentence'],
  suffix_ending: ['Ending pattern recognition', 'Word building', 'Word reading', 'Spelling', 'Dictation'],
  concept: ['Identify concept', 'Definition recall', 'Spot examples', 'Use in sentence', 'Write own example'],
  sentence_building: ['Make a sentence', 'Expand sentence', 'Word order', 'Join sentences', 'Use punctuation'],
  usage_practice: ['Choose correct form', 'Apply rule in sentence', 'Explain choice', 'Spot the error', 'Write own example'],
  writing_editing: ['Fix punctuation', 'Correct grammar mistake', 'Rewrite better sentence', 'Improve clarity', 'Write own example'],
  confidence: ['Eye contact', 'Posture', 'Volume', 'Speak in full sentences', 'Confidence'],
  clarity: ['Speak clearly', 'Slow pace', 'Say full words', 'Articulation', 'Fluency'],
  structure: ['Topic sentence', 'Sequence words', 'Supporting details', 'Stay on topic', 'Conclusion'],
  expression: ['Voice variety', 'Gestures', 'Facial expression', 'Emphasis', 'Pause for effect'],
  rule: ['Rule spotting', 'Apply in reading', 'Apply in spelling', 'Word sorting', 'Explain rule'],
  revision: ['Independent use', 'Speed + accuracy', 'Confidence', 'Apply in reading', 'Apply in spelling'],
};

const AREA_FALLBACK_SKILLS: Record<ProgressSkillArea, string[]> = {
  phonics: ['Sound recall', 'Blending', 'Read words', 'Spell words', 'Apply rule'],
  grammar: ['Identify concept', 'Apply in sentence', 'Choose correct form', 'Write own example', 'Fix mistakes'],
  speaking: ['Confidence', 'Pronunciation', 'Fluency', 'Idea expression', 'Audience engagement'],
  general: ['Understanding', 'Application', 'Accuracy', 'Independence'],
};

const CANONICAL_PHONICS_COURSE_IDS = new Set([
  'phonics-foundations',
  'early-phonics',
  'advanced-phonics',
]);

export const LEGACY_PROGRESS_SKILLS: ProgressSkillDefinition[] = [
  { key: 'recogniseSounds', label: 'Recognise Sounds', area: 'phonics' },
  { key: 'saySoundsClearly', label: 'Say Sounds Clearly', area: 'phonics' },
  { key: 'blendSounds', label: 'Blend Sounds', area: 'phonics' },
  { key: 'readWords', label: 'Read Words', area: 'phonics' },
  { key: 'writeLetters', label: 'Write Letters', area: 'phonics' },
  { key: 'understandPhonicsRule', label: 'Understand Phonics Rule', area: 'phonics' },
];

function labelCase(value: string): string {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function labelFromKey(key: string): string {
  return labelCase(
    key
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase()),
  );
}

export function buildProgressSkillKey(label: string): string {
  return String(label || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function toSkillDefinition(label: string, area: ProgressSkillArea): ProgressSkillDefinition {
  return {
    key: buildProgressSkillKey(label),
    label: labelCase(label),
    area,
  };
}

export function normalizeProgressSkillDefinitions(value: unknown[]): ProgressSkillDefinition[] {
  const results: ProgressSkillDefinition[] = [];
  const seen = new Set<string>();

  value.forEach((item) => {
    if (!item || typeof item !== 'object') return;
    const raw = item as Record<string, unknown>;
    const label = typeof raw.label === 'string' ? labelCase(raw.label) : '';
    const key = typeof raw.key === 'string' && raw.key.trim() ? raw.key.trim() : buildProgressSkillKey(label);
    if (!key || !label || seen.has(key)) return;
    seen.add(key);
    results.push({
      key,
      label,
      shortLabel: typeof raw.shortLabel === 'string' ? raw.shortLabel : undefined,
      description: typeof raw.description === 'string' ? raw.description : undefined,
      area: raw.area === 'phonics' || raw.area === 'grammar' || raw.area === 'speaking' || raw.area === 'general'
        ? raw.area
        : undefined,
    });
  });

  return results;
}

export function progressSkillsFromRatingKeys(
  keys: string[],
  area: ProgressSkillArea = 'general',
): ProgressSkillDefinition[] {
  const seen = new Set<string>();
  return keys
    .filter((key) => typeof key === 'string' && key.trim().length > 0)
    .map((key) => key.trim())
    .filter((key) => {
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((key) => ({
      key,
      label: labelFromKey(key),
      area,
    }));
}

function canonicalPhonicsRubricLabels(context: ProgressSkillContext): string[] | null {
  const courseId = String(context.courseId || '').trim().toLowerCase();
  const rubricType = String(context.rubricType || '').trim().toLowerCase();
  if (!CANONICAL_PHONICS_COURSE_IDS.has(courseId) || !rubricType) return null;
  return RUBRIC_PROGRESS_SKILLS[rubricType] ?? null;
}

export function getProgressSkillsForLesson(context: ProgressSkillContext): ProgressSkillDefinition[] {
  // Phonics lesson identity/rubric comes from the canonical 31/40/30 lesson curriculum. Historical
  // progress rows may carry progressRatingsMeta or subskillChips produced by an older stage/rubric
  // map. When a canonical phonics rubric is available, never let that stale stored presentation
  // metadata override the current lesson's rubric (for example Diphthong OO showing Magic-E skills).
  const canonicalPhonicsLabels = canonicalPhonicsRubricLabels(context);

  const explicitMeta = canonicalPhonicsLabels
    ? []
    : normalizeProgressSkillDefinitions(
        Array.isArray(context.progressSkillsMeta) ? context.progressSkillsMeta : [],
      );
  if (explicitMeta.length > 0) return explicitMeta;

  const area: ProgressSkillArea =
    context.area === 'phonics' || context.area === 'grammar' || context.area === 'speaking'
      ? context.area
      : 'general';

  const labels = canonicalPhonicsLabels
    ?? (Array.isArray(context.subskillChips) && context.subskillChips.length > 0
      ? context.subskillChips
      : RUBRIC_PROGRESS_SKILLS[String(context.rubricType || '').trim().toLowerCase()]
        ?? AREA_FALLBACK_SKILLS[area]);

  const results: ProgressSkillDefinition[] = [];
  const seen = new Set<string>();
  labels.slice(0, 6).forEach((label) => {
    const def = toSkillDefinition(label, area);
    if (!def.key || seen.has(def.key)) return;
    seen.add(def.key);
    results.push(def);
  });

  return results.length > 0 ? results : AREA_FALLBACK_SKILLS.general.map((label) => toSkillDefinition(label, 'general'));
}
