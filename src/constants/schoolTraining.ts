export const SCHOOL_PHONICS_TRAINING_TRACK = {
  id: 'tiny-steps-school-phonics-v1',
  label: 'Tiny Steps School Phonics Training',
  modules: [
    { order: 1, label: 'Foundations & Science of Reading' },
    { order: 2, label: 'Sound Knowledge & Articulation' },
    { order: 3, label: 'Blending for Word Reading' },
    { order: 4, label: 'Segmenting, Encoding & Spelling' },
    { order: 5, label: 'Advanced Phonics Patterns' },
    { order: 6, label: 'Assessment, Intervention & Classroom Implementation' },
  ],
} as const;

export const SCHOOL_PHONICS_TRAINING_TOTAL =
  SCHOOL_PHONICS_TRAINING_TRACK.modules.length;

export function trainingStageLabel(stage: number): string {
  if (stage <= 0) return 'Not started';
  return (
    SCHOOL_PHONICS_TRAINING_TRACK.modules.find((item) => item.order === stage)?.label ||
    `Stage ${stage}`
  );
}
