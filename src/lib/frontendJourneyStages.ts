export type FrontendJourneyStage = {
  id: number;
  kidsStageId: string;
  label: string;
  shortLabel: string;
};

// Frontend source of truth for the 7-stage journey shown in Kids + Parent UI.
export const FRONTEND_JOURNEY_STAGES: FrontendJourneyStage[] = [
  {
    id: 1,
    kidsStageId: "eem-stage-1-letters-sounds",
    label: "Letters & Sounds",
    shortLabel: "Sounds",
  },
  {
    id: 2,
    kidsStageId: "eem-stage-2-build-words",
    label: "Build Words",
    shortLabel: "Words",
  },
  {
    id: 3,
    kidsStageId: "eem-stage-3-make-sentences",
    label: "Make Sentences",
    shortLabel: "Sentences",
  },
  {
    id: 4,
    kidsStageId: "eem-stage-4-read-understand",
    label: "Fluent Reading",
    shortLabel: "Reading",
  },
  {
    id: 5,
    kidsStageId: "eem-stage-5-grammar-practice",
    label: "Grammar Practice",
    shortLabel: "Grammar",
  },
  {
    id: 6,
    kidsStageId: "eem-stage-6-speak-confidence",
    label: "Speak with Confidence",
    shortLabel: "Speaking",
  },
  {
    id: 7,
    kidsStageId: "eem-stage-7-review-championship",
    label: "Review & Championship",
    shortLabel: "Championship",
  },
];

export const FRONTEND_JOURNEY_STAGE_COUNT = FRONTEND_JOURNEY_STAGES.length;

const STAGE_BY_KIDS_STAGE_ID = new Map(
  FRONTEND_JOURNEY_STAGES.map((stage) => [stage.kidsStageId, stage]),
);

export function frontendJourneyStageLabelForKidsStageId(
  kidsStageId: string,
  fallbackLabel: string,
): string {
  return STAGE_BY_KIDS_STAGE_ID.get(kidsStageId)?.label || fallbackLabel;
}
