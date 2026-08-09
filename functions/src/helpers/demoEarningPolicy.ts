export const PAYABLE_DEMO_COMPLETION_OUTCOMES = new Set([
  'completed',
  'not_interested',
  'follow_up_needed',
]);

export const isPayableDemoCompletionOutcome = (outcome: string): boolean =>
  PAYABLE_DEMO_COMPLETION_OUTCOMES.has(outcome.trim().toLowerCase());

export const shouldCreditDemoEnrollmentBonus = (input: {
  beforeStatus: string;
  afterStatus: string;
  beforeConversion: string;
  afterConversion: string;
  outcome: string;
}): boolean => {
  const completionTransition = input.beforeStatus !== 'completed' && input.afterStatus === 'completed';
  return (
    input.afterStatus === 'completed' &&
    isPayableDemoCompletionOutcome(input.outcome) &&
    input.afterConversion === 'enrolled' &&
    (input.beforeConversion !== 'enrolled' || completionTransition)
  );
};
