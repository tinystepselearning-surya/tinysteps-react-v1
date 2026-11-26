import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

// Node 22 supports synchronous require of ESM without top-level await.
// Resolve from lib/scheduled at runtime; shared source is included in the Functions package.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { captureDailyBusinessTrends, publishDailyBusinessTrends } = require("../../src/businessAnalytics/scheduled-refresh.mjs");

if (!admin.apps.length) admin.initializeApp();
const REGION = "asia-south1";
const PROJECT = "tinysteps-react-v1";

function productionDb() {
  const project = admin.app().options.projectId || process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
  if (project !== PROJECT || process.env.FIRESTORE_EMULATOR_HOST) {
    throw new Error("Monthly trends schedule requires production project");
  }
  return admin.firestore();
}

// PITR disabled: freeze yesterday before the ordinary one-hour retention expires.
export const captureMonthlyBusinessTrendsDaily = onSchedule({
  schedule: "15 0 * * *",
  timeZone: "Asia/Kolkata",
  region: REGION,
  memory: "512MiB",
  timeoutSeconds: 540,
  maxInstances: 1,
  concurrency: 1,
  retryCount: 0,
}, async (event) => {
  try {
    logger.info("Monthly trends capture", await captureDailyBusinessTrends({
      db: productionDb(), scheduleTime: event.scheduleTime,
    }));
  } catch {
    logger.error("Monthly trends capture failed; previous dashboard retained");
    throw new Error("Monthly trends capture failed");
  }
});

// Publish the verified aggregate only; never re-read source records at 01:00.
export const refreshMonthlyBusinessTrendsDaily = onSchedule({
  schedule: "0 1 * * *",
  timeZone: "Asia/Kolkata",
  region: REGION,
  memory: "256MiB",
  timeoutSeconds: 120,
  maxInstances: 1,
  concurrency: 1,
  retryCount: 0,
}, async (event) => {
  try {
    logger.info("Monthly trends publication", await publishDailyBusinessTrends({
      db: productionDb(), scheduleTime: event.scheduleTime,
    }));
  } catch {
    logger.error("Monthly trends publication failed; previous dashboard retained");
    throw new Error("Monthly trends publication failed");
  }
});
