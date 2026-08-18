export type PresentFinanceReplayPlan = {
  shouldWriteCharge: boolean;
  shouldWriteEarning: boolean;
  conflict: 'charge_void' | 'earning_void' | null;
};

export function resolvePresentFinanceReplayPlan(input: {
  wasBillable: boolean;
  chargeExists: boolean;
  chargeStatus: string;
  earningExists: boolean;
  earningStatus: string;
}): PresentFinanceReplayPlan {
  if (!input.wasBillable) {
    return { shouldWriteCharge: true, shouldWriteEarning: true, conflict: null };
  }
  if (input.chargeExists && input.chargeStatus === 'void') {
    return { shouldWriteCharge: false, shouldWriteEarning: false, conflict: 'charge_void' };
  }
  if (input.earningExists && input.earningStatus === 'void') {
    return { shouldWriteCharge: false, shouldWriteEarning: false, conflict: 'earning_void' };
  }
  return {
    shouldWriteCharge: !input.chargeExists,
    shouldWriteEarning: !input.earningExists,
    conflict: null,
  };
}
