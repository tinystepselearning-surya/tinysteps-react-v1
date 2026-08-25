import callFunction from '../lib/callFunctions';

export interface DemoCompletionCorrectionResult {
  ok: boolean;
  demoId: string;
  status: 'open';
  reversedEarningsCount: number;
  paidAdjustmentCount: number;
  paidAdjustmentAmount: number;
}

export async function adminCorrectDemoCompletion(input: {
  demoId: string;
  reason: string;
}): Promise<DemoCompletionCorrectionResult> {
  const demoId = input.demoId.trim();
  const reason = input.reason.trim();
  if (!demoId) throw new Error('Demo ID is required.');
  if (!reason) throw new Error('Correction reason is required.');
  return callFunction<DemoCompletionCorrectionResult, { demoId: string; reason: string }>(
    'adminCorrectDemoCompletion',
    { demoId, reason },
  );
}
