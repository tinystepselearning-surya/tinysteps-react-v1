// Demo session callables remain in the proven legacy module while the earnings trigger
// is upgraded independently. Keeping the public exports stable lets the frontend and
// deployed callable names remain unchanged during the lead-funnel architecture rollout.
export {
  adminCheckDemoPhoneConflicts,
  adminCreateDemoSession,
  adminUpdateDemoSessionDetails,
  adminUpdateDemoConversion,
  claimDemoSession,
  updateDemoSessionSchedule,
  completeDemoSession,
  reassignDemoSession,
  cancelDemoSession,
  releaseDemoSession,
  deleteDemoSession,
  reopenDemoSession,
} from './demoSessionsLegacy';

export { onDemoSessionEarningsWrite } from './demoEarningsV2';
